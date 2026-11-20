import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
mkdirSync('artifacts',{recursive:true});const results=[];
for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox']}:{} )});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173/')?route.continue():route.abort());
 const a=await context.newPage(),b=await context.newPage();a.on('dialog',d=>d.accept());b.on('dialog',d=>d.accept());const errors=[];for(const p of [a,b]){p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));}
 const ready=async p=>{await p.waitForFunction(()=>window.PPBoot?.ready||window.PPBoot?.failed);assert.equal(await p.evaluate(()=>window.PPBoot.ready),true);};
 try{
  await a.goto('http://127.0.0.1:4173/#trips');await ready(a);if(await a.locator('.setup-skip').count())await a.locator('.setup-skip').click();
  await b.goto('http://127.0.0.1:4173/#trips');await ready(b);
  await a.locator('[data-action="newTrip"]').first().click();await a.locator('#dialog-form [name="name"]').fill('Unsaved older-tab draft');
  await b.locator('[data-action="newTrip"]').first().click();await b.locator('#dialog-form [name="name"]').fill('Newer tab journey');await b.locator('#dialog-form [type="submit"]').click();await b.locator('#dialog-form').waitFor({state:'detached'});
  await a.locator('#cross-tab-notice').waitFor();
  const latest=await b.evaluate(()=>localStorage.getItem('pixel-passport-v1'));
  await a.locator('#dialog-form [type="submit"]').click();
  assert.equal(await a.evaluate(()=>localStorage.getItem('pixel-passport-v1')),latest,'older tab must not overwrite newer saved records');
  assert.equal(await a.locator('#dialog-form [name="name"]').inputValue(),'Unsaved older-tab draft','open form draft stays editable');
  await a.screenshot({path:'artifacts/release-'+name+'-tab-conflict.png',fullPage:true,animations:'disabled'});
  await a.locator('[data-cross-tab-reload]').click();await ready(a);await a.locator('.route-summary h2').filter({hasText:'Newer tab journey'}).waitFor();
  assert.equal(await a.locator('#cross-tab-notice').count(),0);
  assert.deepEqual(errors,[]);results.push({engine:name,status:'passed',checks:['cross-tab notice','stale save rejection','newer record preservation','draft retained','explicit reload']});
  console.log('Concurrent-tab checks passed: '+name);
 }catch(error){results.push({engine:name,status:'failed',error:String(error)});await a.screenshot({path:'artifacts/release-'+name+'-tab-failure.png',fullPage:true}).catch(()=>{});throw error;}
 finally{writeFileSync('artifacts/release-multitab-results.json',JSON.stringify(results,null,2));await browser.close();}
}
