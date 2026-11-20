import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
mkdirSync('artifacts',{recursive:true});
const base='http://127.0.0.1:4173/',results=[];
for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox']}:{} )});
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,reducedMotion:'reduce'});
 // Deterministic outage test: optional CDN/fonts/tiles must not block core planning.
 await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const ready=async()=>{await page.waitForFunction(()=>window.PPBoot?.ready||window.PPBoot?.failed);assert.equal(await page.evaluate(()=>window.PPBoot.ready),true,await page.locator('body').innerText());};
 const go=async name=>{
  if(page.viewportSize().width<=800){
   const direct=page.locator('[data-phone-nav="'+name+'"]');
   if(await direct.count())await direct.click();else{await page.locator('[data-phone-nav="more"]').click();await page.locator('.sidebar.open [data-nav="'+name+'"]').click();}
  }else await page.locator('.sidebar [data-nav="'+name+'"]').click();
  await page.waitForFunction(n=>document.body.dataset.page===n,name);
 };
 const audit=async(selector,label)=>{
  const result=await new AxeBuilder({page}).include(selector).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  writeFileSync('artifacts/release-'+name+'-axe-'+label+'.json',JSON.stringify(result,null,2));
  const blockers=result.violations.filter(v=>['serious','critical'].includes(v.impact));
  assert.deepEqual(blockers.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],name+' accessibility '+label);
 };
 try{
  const response=await page.goto(base+'#trips',{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
  assert.match(response.headers()['content-security-policy'],/script-src-attr 'none'/);
  await ready();if(await page.locator('.setup-skip').count())await page.locator('.setup-skip').click();
  await page.locator('.trips-workspace').waitFor();
  assert.equal(await page.locator('.nav [data-nav="style-guide"]').isVisible(),false,'development guide not in public navigation');
  await audit('.phone-nav','navigation');
  await page.locator('[data-action="newTrip"]').first().click();await page.locator('#dialog-form').waitFor();
  await page.waitForFunction(()=>document.getElementById('app').inert);
  const first=page.locator('.modal [data-close].close'),last=page.locator('#dialog-form [type="submit"]');
  await first.focus();await page.keyboard.press('Shift+Tab');assert.equal(await last.evaluate(el=>el===document.activeElement),true,'reverse focus wraps');
  await last.focus();await page.keyboard.press('Tab');assert.equal(await first.evaluate(el=>el===document.activeElement),true,'forward focus wraps');
  await audit('#modal-root','trip-form');
  await page.locator('[name="name"]').fill('Release journey '+name);
  await page.locator('[name="start"]').fill('2027-04-02');await page.locator('[name="end"]').fill('2027-04-05');
  await last.click();await page.locator('#dialog-form').waitFor({state:'detached'});
  assert.match(await page.locator('.route-summary h2').innerText(),new RegExp('Release journey '+name));
  await page.waitForFunction(()=>!document.getElementById('app').inert);
  await page.reload({waitUntil:'domcontentloaded'});await ready();assert.match(await page.locator('.route-summary h2').innerText(),/Release journey/);
  for(const tab of ['packing','bookings','budget','tasks','journal','settings','map']){
   await go(tab);
   const bounds=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,limit:innerWidth}));
   assert.ok(bounds.actual<=bounds.limit+5,name+' '+tab+' horizontal overflow '+JSON.stringify(bounds));
   assert.match(await page.title(),/Pixel Passport/);
  }
  await page.locator('.map-fallback').waitFor();
  assert.ok((await page.locator('.atlas-place-row').count())>0,'saved places remain usable during CDN outage');
  await page.screenshot({path:'artifacts/release-'+name+'-mobile-map-fallback.png',fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:1440,height:900});await go('settings');
  await audit('.sidebar .nav','desktop-navigation');
  await page.locator('.skip-to-content').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('.main').evaluate(el=>el===document.activeElement),true,'skip link focuses main');
  assert.equal(await page.evaluate(()=>location.hash),'#settings','skip link must not route to home');
  const original=await page.evaluate(()=>localStorage.getItem('pixel-passport-v1'));
  await page.evaluate(()=>localStorage.setItem('pixel-passport-v1','{not-json'));
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('.boot-recovery').waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('pixel-passport-v1')),'{not-json','startup must never overwrite unreadable records');
  const download=page.waitForEvent('download');await page.locator('[data-boot-action="export"]').click();
  assert.equal(readFileSync(await (await download).path(),'utf8'),'{not-json','original raw bytes are recoverable');
  await page.screenshot({path:'artifacts/release-'+name+'-startup-recovery.png',fullPage:true,animations:'disabled'});
  await page.locator('[data-boot-action="import"]').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(original)});
  await page.waitForFunction(()=>window.PPBoot?.ready);assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem('pixel-passport-v1'))).trips.length,JSON.parse(original).trips.length);
  // Check that a CSP-restricted inline handler does not execute.
  assert.equal(await page.evaluate(()=>{const b=document.createElement('button');b.setAttribute('onclick','window.__inlineRan=true');document.body.append(b);b.click();b.remove();return Boolean(window.__inlineRan);}),false);
  const blocked=await context.newPage();
  await blocked.addInitScript(()=>{Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError')};});
  await blocked.goto(base,{waitUntil:'domcontentloaded'});await blocked.locator('.boot-recovery').waitFor();
  assert.match(await blocked.locator('.boot-recovery').innerText(),/not been reset/);await blocked.close();
  assert.deepEqual(errors,[],name+' uncaught page errors');
  results.push({engine:name,status:'passed',viewports:[390,1440],tests:['CDN outage startup','onboarding','trip persistence','all main sections','focus trap','skip link','navigation and trip-form axe checks','corrupt storage preservation/export/restore','blocked storage recovery','CSP inline-handler block']});
  console.log('Release checks passed: '+name);
 }catch(error){
  results.push({engine:name,status:'failed',error:String(error)});
  await page.screenshot({path:'artifacts/release-'+name+'-failure.png',fullPage:true,animations:'disabled'}).catch(()=>{});
  writeFileSync('artifacts/release-'+name+'-failure.txt',String(error)+'\n'+errors.join('\n'));
  throw error;
 }finally{writeFileSync('artifacts/release-browser-results.json',JSON.stringify(results,null,2));await browser.close();}
}
