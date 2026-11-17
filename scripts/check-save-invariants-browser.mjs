import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base='http://127.0.0.1:4173/';
mkdirSync('artifacts',{recursive:true});const results=[];
function fixture(){return {version:1,profile:{name:'Release tester',baseCurrency:'SGD',selectedTripId:'t1',onboardingCompleted:true,ambientMotion:'off'},
 trips:[{id:'t1',name:'Original journey',status:'planned'},{id:'t2',name:'Second journey',status:'draft'}],
 destinations:[{id:'d1',name:'Chur',country:'Switzerland',tripId:'t1',order:0,lat:46.85,lng:9.53,status:'planned',arrival:'',departure:''},{id:'d2',name:'Davos',country:'Switzerland',tripId:'t1',order:1,lat:46.80,lng:9.83,status:'planned',arrival:'',departure:''},{id:'d3',name:'Zurich',country:'Switzerland',tripId:'t2',order:0,lat:47.37,lng:8.54,status:'planned',arrival:'',departure:''}],
 expenses:[{id:'e1',title:'Hotel deposit',tripId:'t1',destinationId:'d1',amount:'200',currency:'SGD',kind:'actual',category:'accommodation',date:'2027-03-05'},{id:'e2',title:'General fare',tripId:'t1',destinationId:'',amount:'50',currency:'SGD',kind:'actual',category:'trains',date:'2027-03-05'}],
 bookings:[{id:'b1',provider:'Hotel',type:'hotel',status:'confirmed',tripId:'t1',destinationId:'d1',expenseId:'e1'},{id:'b2',provider:'Transfer',type:'train',status:'reserved',tripId:'t1',destinationId:'d1',expenseId:'e2'},{id:'b3',provider:'Other stay',type:'hotel',status:'idea',tripId:'t1',destinationId:'d2',expenseId:'e1'}],
 journal:[{id:'j1',title:'Memory',tripId:'t1',destinationId:'d1',date:'2027-03-05',body:'Keep this note'}],activities:[],tasks:[],packing:[],skiTrips:[],transfers:[],dismissed:[],rates:null};}
for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox']}:{} )});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 await context.addInitScript(data=>{if(localStorage.getItem('pixel-passport-v1')===null)localStorage.setItem('pixel-passport-v1',JSON.stringify(data));},fixture());
 const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[],confirmations=[];let approve=true;
 page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>{confirmations.push(dialog.message());return approve?dialog.accept():dialog.dismiss();});
 const ready=async()=>{await page.waitForFunction(()=>window.PPBoot?.ready||window.PPBoot?.failed);assert.equal(await page.evaluate(()=>window.PPBoot.ready),true,await page.locator('body').innerText());};
 const stored=()=>page.evaluate(()=>localStorage.getItem('pixel-passport-v1'));
 const assertValid=()=>page.evaluate(()=>{window.PPData.validateBackup(JSON.parse(localStorage.getItem('pixel-passport-v1')));return true;});
 const go=async section=>{await page.locator('.sidebar [data-nav="'+section+'"]').click();await page.waitForFunction(s=>document.body.dataset.page===s,section);};
 const submit=()=>page.locator('#dialog-form [type="submit"]').click();
 try{
  await page.goto(base+'#trips',{waitUntil:'domcontentloaded'});await ready();
  await page.locator('[data-action="editDestination"][data-id="d1"]').click();
  await page.locator('#dialog-form [name="tripId"]').selectOption('t2');
  const before=await stored();approve=false;await submit();approve=true;
  await page.locator('#data-recovery-notice').filter({hasText:'Changes need review'}).waitFor();
  assert.equal(await stored(),before,'cancelled move never reaches storage');
  assert.equal(await page.locator('#dialog-form [name="tripId"]').inputValue(),'t2','proposed form values retained');
  assert.ok(confirmations.at(-1).includes('unlink 2'),'both cross-trip expense connections disclosed');
  await page.setViewportSize({width:390,height:844});await page.locator('#data-recovery-notice').scrollIntoViewIfNeeded();
  await page.screenshot({path:'artifacts/release-'+name+'-save-review-mobile.png',animations:'disabled'});
  await submit();await page.locator('#dialog-form').waitFor({state:'detached'});await assertValid();
  let data=JSON.parse(await stored());assert.equal(data.bookings.length,3);assert.equal(data.expenses.length,2);
  assert.equal(data.bookings.find(b=>b.id==='b1').expenseId,'e1');
  assert.equal(data.bookings.find(b=>b.id==='b2').expenseId,'');assert.equal(data.bookings.find(b=>b.id==='b3').expenseId,'');
  assert.equal(data.expenses.find(e=>e.id==='e2').tripId,'t1');assert.equal(data.journal[0].tripId,'t2');
  await page.reload({waitUntil:'domcontentloaded'});await ready();await assertValid();
  await page.setViewportSize({width:1440,height:900});
  await go('budget');await page.locator('[data-action="editExpense"][data-id="e1"]').click();
  await page.locator('#dialog-form [name="tripId"]').selectOption('t1');await page.locator('#dialog-form [name="destinationId"]').selectOption('d2');
  await submit();await page.locator('#dialog-form').waitFor({state:'detached'});await assertValid();
  data=JSON.parse(await stored());assert.equal(data.bookings.find(b=>b.id==='b1').expenseId,'');assert.equal(data.expenses.find(e=>e.id==='e1').amount,'200');
  await page.reload({waitUntil:'domcontentloaded'});await ready();await assertValid();
  await go('trips');await page.locator('[data-action="newTrip"]').first().click();
  await page.locator('#dialog-form [name="name"]').fill('   ');const validBefore=await stored();await submit();
  await page.locator('#data-recovery-notice').filter({hasText:'Missing name'}).waitFor();assert.equal(await stored(),validBefore);
  assert.equal(await page.locator('#dialog-form [name="name"]').inputValue(),'   ');
  await page.locator('#dialog-form [name="name"]').fill('Corrected journey');await submit();await page.locator('#dialog-form').waitFor({state:'detached'});
  assert.equal(JSON.parse(await stored()).trips.filter(t=>t.name==='Corrected journey').length,1);await assertValid();
  await page.reload({waitUntil:'domcontentloaded'});await ready();
  await go('settings');const profileBefore=await stored();await page.locator('[name="weightTarget"]').fill('-5');
  await page.locator('[data-action="saveProfile"]').click();await page.locator('#data-recovery-notice').filter({hasText:'weightTarget'}).waitFor();
  assert.equal(await stored(),profileBefore);await page.locator('[name="weightTarget"]').fill('20');await page.locator('[data-action="saveProfile"]').click();await assertValid();
  let mode='delayed',release,requested;
  let gate=new Promise(resolve=>{release=resolve;}),requestedPromise=new Promise(resolve=>{requested=resolve;});
  await context.route('https://nominatim.openstreetmap.org/**',async route=>{
   if(mode==='delayed'){requested();await gate;}
   const payload=mode==='invalid'?[{lat:'999',lon:'9.53'}]:[{lat:'46.85',lon:'9.53'}];
   try{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});}catch(error){if(!route.request().failure())throw error;}
  });
  await go('trips');await page.locator('[data-action="newDestination"]').first().click();
  await page.locator('#dialog-form [name="name"]').fill('Old query');await page.locator('#dialog-form [name="country"]').fill('Switzerland');
  await page.locator('#lookup-place').click();await requestedPromise;await page.locator('.modal .close').click();release();await page.waitForTimeout(150);
  assert.equal(await page.locator('#dialog-form').count(),0);assert.deepEqual(errors,[],'closed lookup never writes to a missing form');
  gate=new Promise(resolve=>{release=resolve;});requestedPromise=new Promise(resolve=>{requested=resolve;});
  await page.locator('[data-action="newDestination"]').first().click();await page.locator('#dialog-form [name="name"]').fill('Before query');
  await page.locator('#dialog-form [name="country"]').fill('Switzerland');await page.locator('#lookup-place').click();await requestedPromise;
  await page.locator('#dialog-form [name="name"]').fill('After query');release();await page.waitForFunction(()=>!document.getElementById('lookup-place').disabled);
  assert.equal(await page.locator('#dialog-form [name="lat"]').inputValue(),'','stale query cannot populate changed form');
  mode='invalid';await page.locator('#lookup-place').click();await page.waitForFunction(()=>!document.getElementById('lookup-place').disabled);
  assert.equal(await page.locator('#dialog-form [name="lat"]').inputValue(),'','invalid coordinates not applied');
  mode='success';await page.locator('#lookup-place').click();await page.waitForFunction(()=>document.querySelector('#dialog-form [name="lat"]').value==='46.85');
  await page.screenshot({path:'artifacts/release-'+name+'-safe-lookup.png',fullPage:true,animations:'disabled'});
  await submit();await page.locator('#dialog-form').waitFor({state:'detached'});await assertValid();
  await page.reload({waitUntil:'domcontentloaded'});await ready();await assertValid();
  assert.deepEqual(errors,[]);results.push({engine:name,status:'passed',checks:['cross-trip stop move and journal links','cancelled/confirmed unlink consent','expense trip move','saved data survives reload','whitespace rejection and correction','negative settings rejected','closed coordinate request','stale query response','invalid/successful coordinate response']});
  console.log('Save invariants and lookup lifecycle passed: '+name);
 }catch(error){
  results.push({engine:name,status:'failed',error:String(error)});await page.screenshot({path:'artifacts/release-'+name+'-save-invariants-failure.png',fullPage:true,animations:'disabled'}).catch(()=>{});
  writeFileSync('artifacts/release-'+name+'-save-invariants-failure.txt',String(error)+'\n'+errors.join('\n'));throw error;
 }finally{writeFileSync('artifacts/release-save-invariants.json',JSON.stringify(results,null,2));await browser.close();}
}
