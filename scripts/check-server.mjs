import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {request} from 'node:http';
import {once} from 'node:events';
import {createAppServer} from '../server.mjs';
import {securityHeaders} from '../security-headers.mjs';
const temp=await mkdtemp(join(tmpdir(),'pixelpassport-server-'));
const root=join(temp,'public');await mkdir(root);await mkdir(join(root,'assets'));
await writeFile(join(root,'index.html'),'<!doctype html><title>Test</title>');
await writeFile(join(root,'app.js'),'console.log("ok");');
await writeFile(join(root,'assets','test.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');
await writeFile(join(temp,'secret.txt'),'must never be public');
await symlink(join(temp,'secret.txt'),join(root,'escape.txt'));
const server=createAppServer({root});server.listen(0,'127.0.0.1');await once(server,'listening');
const port=server.address().port;
const send=(path,method='GET',headers={})=>new Promise((resolve,reject)=>{
 const req=request({hostname:'127.0.0.1',port,path,method,headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString()}));});req.on('error',reject);req.end();
});
let assertions=0;
const check=(condition,message)=>{assert.ok(condition,message);assertions++;};
try{
 const home=await send('/');check(home.status===200,'root served');check(home.headers['content-type'].includes('text/html'),'HTML MIME');
 check(home.headers['x-content-type-options']==='nosniff','nosniff');check(home.headers['x-frame-options']==='DENY','frame protection');
 check(home.headers['content-security-policy'].includes("script-src-attr 'none'"),'inline script handlers blocked');
 check(!home.headers['content-security-policy'].includes("script-src 'self' 'unsafe-inline'"),'no inline script permission');
 check(!home.headers['strict-transport-security'],'no HSTS in HTTP development');check(securityHeaders({https:true})['Strict-Transport-Security']==='max-age=31536000','HSTS explicitly enabled');
 check(home.headers['cache-control']==='no-cache, must-revalidate','HTML revalidated');
 const head=await send('/','HEAD');check(head.status===200&&head.body==='','HEAD no body');check(head.headers['content-length']===home.headers['content-length'],'HEAD content length');
 const cached=await send('/','GET',{'If-None-Match':home.headers.etag});check(cached.status===304&&cached.body==='','conditional request');
 const js=await send('/app.js?v=2');check(js.status===200&&js.headers['content-type'].includes('javascript'),'query and JS MIME');
 const art=await send('/assets/test.svg');check(art.status===200&&art.headers['cache-control'].includes('max-age=3600'),'bounded asset caching');
 for(const path of ['/missing.js','/assets','/README.md']){const r=await send(path);check(r.status===404&&!r.body.includes('Error:'),'proper 404 '+path);}
 for(const path of ['/%2e%2e/secret.txt','/assets/%2e%2e/%2e%2e/secret.txt','/..%5csecret.txt','/.env','/.git/config','/file:///etc/passwd','/%00','/%ZZ']){
  const r=await send(path);check(r.status===400&&!r.body.includes('must never'),'reject '+path);
 }
 const escaped=await send('/escape.txt');check(escaped.status===403&&!escaped.body.includes('must never'),'symlink confinement');
 const post=await send('/','POST');check(post.status===405&&post.headers.allow==='GET, HEAD','write methods rejected');
 const health=await send('/healthz');check(health.status===200&&JSON.parse(health.body).status==='ok','health endpoint');check(health.headers['cache-control']==='no-store','health not cached');
 console.log('Production server: '+assertions+' assertions passed (paths, MIME, methods, headers, caching, health).');
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
