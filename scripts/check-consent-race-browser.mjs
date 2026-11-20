import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
mkdirSync('artifacts',{recursive:true});const results=[],base='http://127.0.0.1:4173/';
for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox']}:{} )});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const data=JSON.parse(readFileSync(new URL('./fixtures/audit-journey.json',import.meta.url),'utf8'));
 const booking=data.bookings[0],destination=data.destinations.find(d=>d.id===booking.destinationId),expense=data.expenses.find(e=>e.id===booking.expenseId);
 expense.destinationId='';data.profile.selectedTripId=booking.tripId;data.profile.onboardingCompleted=true;data.profile.ambientMotion='off';
 const originalTrip=booking.tripId,target=data.trips.find(t=>t.id!==originalTrip).id;
 await context.addInitScript(initial=>{if(localStorage.getItem('pixel-passport-v1')===null)localStorage.setItem('pixel-passport-v1',JSON.stringify(initial));},data);
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('dialog',d=>d.accept());const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'#trips');await page.waitForFunction(()=>window.PPBoot?.ready);
  await page.locator('[data-action="editDestination"][data-id="'+destination.id+'"]').click();
  await page.locator('#dialog-form [name="tripId"]').selectOption(target);
  // Deterministically inject a storage write at the point a user approves the
  // move. Actual two-tab behavior is tested separately by check-multitab-browser.
  await page.evaluate(()=>{window.confirm=message=>{if(message.includes('booking-to-expense')){const newer=JSON.parse(localStorage.getItem('pixel-passport-v1'));newer.profile.name='Newer write during confirmation';window.__newerRaw=JSON.stringify(newer);localStorage.setItem('pixel-passport-v1',window.__newerRaw);window.__consentSeen=true;}return true;};});
  await page.locator('#dialog-form [type="submit"]').click();await page.locator('#cross-tab-notice').waitFor();
  assert.equal(await page.evaluate(()=>window.__consentSeen),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('pixel-passport-v1')===window.__newerRaw),true,'approval cannot overwrite a write made during confirmation');
  assert.equal(await page.locator('#dialog-form [name="tripId"]').inputValue(),target,'draft remains editable');
  await page.evaluate(()=>window.PPData.validateBackup(JSON.parse(localStorage.getItem('pixel-passport-v1'))));
  await page.screenshot({path:'artifacts/release-'+name+'-confirmation-conflict.png',fullPage:true,animations:'disabled'});
  await page.locator('[data-cross-tab-reload]').click();await page.waitForFunction(()=>window.PPBoot?.ready);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('pixel-passport-v1')));
  assert.equal(saved.profile.name,'Newer write during confirmation');assert.equal(saved.destinations.find(d=>d.id===destination.id).tripId,originalTrip);
  assert.equal(saved.bookings.find(b=>b.id===booking.id).expenseId,expense.id);assert.deepEqual(errors,[]);
  results.push({engine:name,status:'passed',scenario:'simulated storage write during move confirmation rejected; newer data and form preserved'});
  console.log('Confirmation-write guard passed: '+name);
 }catch(error){results.push({engine:name,status:'failed',error:String(error)});await page.screenshot({path:'artifacts/release-'+name+'-confirmation-failure.png',fullPage:true}).catch(()=>{});throw error;}
 finally{writeFileSync('artifacts/release-confirmation-results.json',JSON.stringify(results,null,2));await browser.close();}
}
