import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {realpath,stat} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {securityHeaders} from './security-headers.mjs';

const defaultRoot=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff'};

export function createAppServer({root=defaultRoot,https=false}={}){
 const rootPromise=realpath(root);
 const server=createServer({maxHeaderSize:16384,requestTimeout:30000,headersTimeout:15000},async(req,res)=>{
  const headers={...securityHeaders({https}),'Cache-Control':'no-store'};
  const text=(code,message,extra={})=>{
   const body=Buffer.from(message);
   res.writeHead(code,{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Length':body.length,...extra});
   res.end(req.method==='HEAD'?undefined:body);
  };
  if(!['GET','HEAD'].includes(req.method)){text(405,'Method not allowed',{'Allow':'GET, HEAD'});return;}
  try{
   // Inspect before URL normalization so encoded traversal is not silently repaired.
   const raw=(req.url||'/').split('?')[0];
   const decoded=decodeURIComponent(raw);
   if(!decoded.startsWith('/')||decoded.includes('\\')||decoded.includes('\0')||decoded.includes(':')||decoded.includes('//')||decoded.split('/').some(part=>part.startsWith('.'))){text(400,'Invalid path');return;}
   if(decoded==='/healthz'){
    const body=Buffer.from(JSON.stringify({status:'ok',application:'pixel-passport'}));
    res.writeHead(200,{...headers,'Content-Type':'application/json; charset=utf-8','Content-Length':body.length});res.end(req.method==='HEAD'?undefined:body);return;
   }
   const directory=await rootPromise;
   const candidate=resolve(directory,decoded==='/'?'index.html':decoded.slice(1));
   if(!candidate.startsWith(directory+sep)){text(403,'Forbidden');return;}
   const file=await realpath(candidate);
   if(!file.startsWith(directory+sep)){text(403,'Forbidden');return;}
   const info=await stat(file),type=types[extname(file).toLowerCase()];
   if(!info.isFile()||!type){text(404,'Not found');return;}
   const etag='W/"'+info.size.toString(16)+'-'+Math.trunc(info.mtimeMs).toString(16)+'"';
   const cache=decoded.startsWith('/assets/')?'public, max-age=3600, must-revalidate':'no-cache, must-revalidate';
   const fileHeaders={...headers,'Content-Type':type,'Content-Length':info.size,'ETag':etag,'Last-Modified':info.mtime.toUTCString(),'Cache-Control':cache};
   if(req.headers['if-none-match']?.split(',').map(x=>x.trim()).some(x=>x===etag||x==='*')){
    delete fileHeaders['Content-Length'];res.writeHead(304,fileHeaders);res.end();return;
   }
   if(req.method==='HEAD'){res.writeHead(200,fileHeaders);res.end();return;}
   const stream=createReadStream(file);
   stream.once('error',()=>{if(res.headersSent)res.destroy();else text(500,'Unable to read asset');});
   stream.once('open',()=>{res.writeHead(200,fileHeaders);stream.pipe(res);});
   res.once('close',()=>stream.destroy());
  }catch(error){text(error instanceof URIError?400:error.code==='ENOENT'||error.code==='ENOTDIR'?404:500,error instanceof URIError?'Invalid path':error.code==='ENOENT'||error.code==='ENOTDIR'?'Not found':'Server error');}
 });
 server.keepAliveTimeout=5000;
 return server;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||4173),host=process.env.HOST||'0.0.0.0';
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT must be an integer from 1 to 65535');
 await realpath(defaultRoot);
 const server=createAppServer({https:process.env.ENABLE_HSTS==='1'});
 server.on('error',error=>{console.error('HTTP server failed:',error.code||error.message);process.exitCode=1;});
 server.listen(port,host,()=>console.log('Pixel Passport listening on '+host+':'+port));
 let stopping=false;
 const stop=()=>{if(stopping)return;stopping=true;server.close(()=>process.exit(0));server.closeIdleConnections();setTimeout(()=>{server.closeAllConnections();process.exit(1);},10000).unref();};
 process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
