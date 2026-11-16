import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
page.setDefaultTimeout(12000);
const errors=[];let approve=true;
page.on('pageerror',error=>errors.push(error.message));
page.on('dialog',dialog=>approve?dialog.accept():dialog.dismiss());
const stored=()=>page.evaluate(()=>localStorage.getItem('pixel-passport-v1'));
const go=async name=>{
 if(page.viewportSize().width<=800){
  if(await page.locator('[data-phone-nav="'+name+'"]').count())await page.locator('[data-phone-nav="'+name+'"]').click();
  else {await page.locator('[data-phone-nav="more"]').click();await page.locator('.sidebar.open [data-nav="'+name+'"]').click();}
 }else await page.locator('.sidebar [data-nav="'+name+'"]').click();
 await page.waitForFunction(value=>document.body.dataset.page===value,name);
};
const quota=async(on)=>page.evaluate(enabled=>{
 if(enabled){
  window.__nativeSetItem=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){if(key==='pixel-passport-v1')throw new DOMException('Quota exceeded','QuotaExceededError');return window.__nativeSetItem.call(this,key,value)};
 }else {Storage.prototype.setItem=window.__nativeSetItem;delete window.__nativeSetItem;}
},on);
const upload=async data=>page.locator('#import-file').setInputFiles({name:'recovery-test.json',mimeType:'application/json',buffer:Buffer.from(typeof data==='string'?data:JSON.stringify(data))});
try{
 await page.goto('http://127.0.0.1:4173/#settings',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="saveProfile"]').waitFor();
 await page.evaluate(()=>{const k='pixel-passport-v1',s=JSON.parse(localStorage.getItem(k));s.profile.onboardingCompleted=true;s.profile.ambientMotion='off';localStorage.setItem(k,JSON.stringify(s));});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-action="saveProfile"]').waitFor();
 const initial=JSON.parse(await stored());
 // Real form submissions must not corrupt saved state when browser storage fails.
 await go('trips');await page.locator('[data-action="newTrip"]').first().click();
 await page.locator('#dialog-form [name="name"]').fill('Recovery test journey');
 const before=await stored();await quota(true);
 await page.locator('#dialog-form [type="submit"]').click();
 await page.locator('#data-recovery-notice').filter({hasText:'Changes were not saved'}).waitFor();
 assert.equal(await stored(),before,'failed submission keeps persistent data unchanged');
 assert.equal(await page.locator('#dialog-form [name="name"]').inputValue(),'Recovery test journey','draft remains editable');
 await page.waitForTimeout(3600);
 assert.match(await page.locator('#data-recovery-notice').innerText(),/Changes were not saved/);
 await page.setViewportSize({width:390,height:844});
 await page.locator('#data-recovery-notice').scrollIntoViewIfNeeded();
 await page.screenshot({path:'artifacts/recovery-form-storage-error-mobile.png',animations:'disabled'});
 const download=page.waitForEvent('download');
 await page.locator('[data-recovery-action="export"]').click();
 const backup=JSON.parse(readFileSync(await (await download).path(),'utf8'));
 assert.ok(!backup.trips.some(t=>t.name==='Recovery test journey'),'download contains durable data, not failed edits');
 await quota(false);
 await page.locator('#dialog-form [type="submit"]').click();
 await page.locator('#dialog-form').waitFor({state:'detached'});
 assert.equal(JSON.parse(await stored()).trips.filter(t=>t.name==='Recovery test journey').length,1,'retry saves once');
 assert.equal(await page.locator('#data-recovery-notice').count(),0,'successful retry clears storage warning');
 await go('settings');
 // Reject invalid and unsafe backups without executing their data or changing storage.
 const baseline=await stored();const invalid=JSON.parse(baseline);
 invalid.trips[0].start='2027-02-31';
 await upload(invalid);
 await page.locator('#data-recovery-notice').filter({hasText:'Backup was not imported'}).waitFor();
 assert.equal(await stored(),baseline);
 const unsafe=JSON.parse(baseline);unsafe.trips[0].id='x" autofocus onfocus="window.__injected=true';
 await upload(unsafe);
 await page.waitForFunction(()=>document.querySelector('#data-recovery-notice')?.textContent.includes('record ID'));
 assert.equal(await stored(),baseline);assert.equal(await page.evaluate(()=>window.__injected),undefined);
 await upload('{not valid JSON');
 await page.waitForFunction(()=>document.querySelector('#data-recovery-notice')?.textContent.includes('not valid JSON'));
 assert.equal(await stored(),baseline);
 await page.locator('#import-file').setInputFiles({name:'too-large.json',mimeType:'application/json',buffer:Buffer.alloc(20*1024*1024+1,'x')});
 await page.waitForFunction(()=>document.querySelector('#data-recovery-notice')?.textContent.includes('20 MB'));
 assert.equal(await stored(),baseline);
 // Cancelling a valid import must not overwrite anything.
 const imported=JSON.parse(baseline);imported.profile.name='Restored test traveler';imported.profile.selectedTripId=initial.trips[1].id;
 approve=false;await upload(imported);await page.waitForFunction(()=>!document.querySelector('#import-file').disabled);approve=true;
 assert.equal(await stored(),baseline);
 // A valid import can also hit quota. Roll back before offering a retry.
 await quota(true);await upload(imported);
 await page.waitForFunction(()=>document.querySelector('#data-recovery-notice')?.textContent.includes('Changes were not saved'));
 assert.equal(await stored(),baseline);
 await quota(false);await upload(imported);
 await page.waitForFunction(()=>document.querySelector('#data-recovery-notice')?.textContent.includes('Backup restored'));
 const restored=JSON.parse(await stored());
 assert.equal(restored.profile.name,'Restored test traveler');
 assert.equal(restored.profile.selectedTripId,initial.trips[1].id,'restores selected trip instead of selecting first');
 await go('trips');assert.match(await page.locator('.route-summary h2').innerText(),/Family Trip/);
 await go('settings');
 await page.screenshot({path:'artifacts/recovery-import-success-mobile.png',fullPage:true,animations:'disabled'});
 // The same invalid file can be selected again after rejection.
 await upload(invalid);await page.locator('#data-recovery-notice').filter({hasText:'Backup was not imported'}).waitFor();
 await page.locator('#data-recovery-notice button[aria-label="Dismiss data notice"]').click();
 await upload(invalid);await page.locator('#data-recovery-notice').filter({hasText:'Backup was not imported'}).waitFor();
 await page.screenshot({path:'artifacts/recovery-invalid-backup-mobile.png',fullPage:true,animations:'disabled'});
 await page.locator('#data-recovery-notice button[aria-label="Dismiss data notice"]').click();
 // A late SGD response must not replace EUR rates after a profile change.
 await page.setViewportSize({width:1440,height:900});
 let mode='delayed',release,requested;
 const requestedPromise=new Promise(resolve=>{requested=resolve;});
 const gate=new Promise(resolve=>{release=resolve;});
 await page.route('https://open.er-api.com/**',async route=>{
  const base=route.request().url().split('/').pop();
  if(mode==='delayed'){requested();await gate;}
  if(mode==='failure'){await route.fulfill({status:503,contentType:'application/json',body:'{}'});return;}
  const rates=base==='SGD'?{SGD:1,EUR:.6,USD:.75}:{EUR:1,SGD:1.6,USD:1.1};
  if(mode==='invalid')rates.USD=-1;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({result:'success',base_code:base,rates})});
 });
 await go('budget');await page.locator('[data-action="refreshRates"]').click();await requestedPromise;
 assert.equal(await page.locator('[data-action="refreshRates"]').isDisabled(),true);
 await go('settings');await page.locator('[name="baseCurrency"]').selectOption('EUR');await page.locator('[data-action="saveProfile"]').click();
 const settled=page.waitForResponse(response=>response.url().endsWith('/SGD'));release();await settled;
 await page.waitForTimeout(150);
 assert.equal(JSON.parse(await stored()).profile.baseCurrency,'EUR');assert.equal(JSON.parse(await stored()).rates,null,'stale SGD response discarded');
 mode='success';await go('budget');await page.locator('[data-action="refreshRates"]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pixel-passport-v1')).rates?.EUR===1);
 const goodRates=JSON.parse(await stored()).rates;
 mode='invalid';await page.locator('[data-action="refreshRates"]').click();
 await page.locator('#data-recovery-notice').filter({hasText:'Exchange rates were not updated'}).waitFor();
 assert.deepEqual(JSON.parse(await stored()).rates,goodRates);
 mode='failure';await page.locator('[data-action="refreshRates"]').click();
 await page.waitForFunction(()=>!document.querySelector('[data-action="refreshRates"]').disabled);
 assert.deepEqual(JSON.parse(await stored()).rates,goodRates);
 await page.screenshot({path:'artifacts/recovery-rates-error-desktop.png',fullPage:true,animations:'disabled'});
 mode='success';await page.locator('[data-action="refreshRates"]').click();
 await page.waitForFunction(()=>!document.querySelector('#data-recovery-notice'));
 await page.context().setOffline(true);
 await page.locator('#data-recovery-notice').filter({hasText:'You are offline'}).waitFor();
 const offlineBaseline=await stored();assert.equal(JSON.parse(offlineBaseline).trips.length,restored.trips.length);
 await page.context().setOffline(false);await page.waitForFunction(()=>!document.querySelector('#data-recovery-notice'));
 assert.equal(await stored(),offlineBaseline,'connectivity events never rewrite plans');
 if(errors.length)throw Error('Uncaught recovery browser errors:\n'+errors.join('\n'));
 writeFileSync('artifacts/recovery-results.json',JSON.stringify({status:'passed',engine:'Chromium',viewports:[390,1440],scenarios:['quota rollback','draft retry','durable backup download','malformed/oversized/unsafe import rejection','cancelled import','failed import rollback','selected-trip restoration','same-file retry','stale-rate cancellation','malformed/failed service response','offline notice']},null,2));
 console.log('Recovery browser checks passed: storage rollback/retry, backup imports, race-safe rates and offline UI.');
} catch(error){
 await page.screenshot({path:'artifacts/recovery-failure.png',fullPage:true,animations:'disabled'}).catch(()=>{});
 writeFileSync('artifacts/recovery-failure.txt',String(error)+'\n'+errors.join('\n'));throw error;
} finally {await browser.close();}
