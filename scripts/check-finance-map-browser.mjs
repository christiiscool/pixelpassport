import assert from 'node:assert/strict';
import {mkdirSync,readFileSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,acceptDownloads:true});
page.setDefaultTimeout(12000);
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',dialog=>dialog.accept());
const base='http://127.0.0.1:4173/';
const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pixel-passport-v1')));
const openPage=async(name)=>{
 if(await page.evaluate(()=>innerWidth<=800)){
  const direct=page.locator('[data-phone-nav="'+name+'"]');
  if(await direct.count())await direct.click();
  else{
   await page.locator('[data-phone-nav="more"]').click();
   await page.locator('.sidebar.open [data-nav="'+name+'"]').click();
  }
 }else await page.locator('.sidebar [data-nav="'+name+'"]').click();
 await page.waitForFunction(n=>document.body.dataset.page===n,name);
};
const submit=async()=>{await page.locator('#dialog-form [type="submit"]').click();await page.locator('#dialog-form').waitFor({state:'detached'})};
const set=async(fields)=>{
 for(const [name,value] of Object.entries(fields)){
  const item=page.locator('#dialog-form [name="'+name+'"]');
  if(!(await item.count()))throw Error('Missing input '+name);
  if(await item.evaluate(x=>x.tagName==='SELECT'))await item.selectOption(String(value));
  else await item.fill(String(value));
 }
};
const create=async(action,fields)=>{await page.locator('[data-action="'+action+'"]').first().click();await page.locator('#dialog-form').waitFor();await set(fields);await submit()};
const cleanShot=async path=>{await page.evaluate(()=>document.querySelector('#toast')?.replaceChildren());await page.screenshot({path,fullPage:true,animations:'disabled'})};
const overflow=async(label)=>{const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(size.scroll<=size.width+5,label+' overflow: '+JSON.stringify(size))};

try{
 await page.route('https://open.er-api.com/**',async route=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({result:'success',rates:{SGD:1,EUR:.6,USD:.7,CHF:.65,GBP:.5}})}));
 await page.goto(base+'#budget',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{const key='pixel-passport-v1',s=JSON.parse(localStorage.getItem(key));s.profile.onboardingCompleted=true;s.profile.ambientMotion='off';localStorage.setItem(key,JSON.stringify(s))});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('[data-action="newExpense"]').waitFor();
 let s=await state();
 const main=s.trips[0].id,family=s.trips[1].id,mainPlace=s.destinations.find(d=>d.tripId===main),familyPlace=s.destinations.find(d=>d.tripId===family);
 assert.ok(mainPlace&&familyPlace);
 assert.equal((await page.locator('.finance-filter-toolbar #expense-trip').count()),1);
 // Save exchange budget, then record two expenses belonging to different trips.
 await create('setBudget',{exchangeBudget:'5000'});
 await create('newExpense',{title:'Hotel deposit',amount:'200',currency:'SGD',kind:'actual',tripId:main,destinationId:mainPlace.id});
 const hotelExpense=(await state()).expenses.find(e=>e.title==='Hotel deposit');
 assert.ok(hotelExpense);
 await page.locator('[data-action="newExpense"]').first().click();
 await page.locator('#dialog-form').waitFor();
 const form=page.locator('#dialog-form');
 await form.locator('[name="tripId"]').selectOption(family);
 const allowedDest=await form.locator('[name="destinationId"] option').evaluateAll(a=>a.map(x=>x.value));
 assert.ok(allowedDest.includes(familyPlace.id)&&!allowedDest.includes(mainPlace.id),'Expense destination choices follow selected trip');
 await set({title:'Mountain pass',amount:'70',currency:'USD',kind:'actual',destinationId:familyPlace.id});
 await submit();
 assert.equal((await state()).expenses.length,2);
 assert.match(await page.locator('.main').innerText(),/conversion/i,'Missing conversions must be disclosed');
 await page.locator('#expense-trip').selectOption(family);
 assert.equal(await page.locator('.main .list-row').filter({hasText:'Mountain pass'}).count(),1);
 assert.equal(await page.locator('.main .list-row').filter({hasText:'Hotel deposit'}).count(),0);
 await page.locator('#expense-trip').selectOption('');
 await cleanShot('artifacts/finance-budget-desktop.png');
 // Test rate retrieval and consent-driven conversion without changing foreign originals.
 await page.locator('[data-action="refreshRates"]').click();
 await page.waitForFunction(()=>Boolean(JSON.parse(localStorage.getItem('pixel-passport-v1')).ratesUpdated));
 await page.locator('[data-action="reconcileCurrencies"]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pixel-passport-v1')).expenses.some(e=>e.title==='Mountain pass'&&e.baseCurrency==='SGD'&&e.baseAmount!=null));
 const mountain=(await state()).expenses.find(e=>e.title==='Mountain pass');
 assert.equal(Number(mountain.amount),70);
 assert.equal(Number(mountain.baseAmount),100);
 assert.equal(mountain.currency,'USD');
 // Booking forms only expose relevant expenses/destinations.
 await openPage('bookings');
 await page.locator('.booking-summary').waitFor();
 await page.locator('[data-action="newBooking"]').first().click();
 await form.waitFor();
 const expenseOptions=await form.locator('[name="expenseId"] option').evaluateAll(a=>a.map(x=>x.value));
 assert.ok(expenseOptions.includes(hotelExpense.id),'Current-trip expense is linkable');
 assert.ok(!expenseOptions.includes(mountain.id),'Other-trip expense is not offered');
 await form.locator('[name="tripId"]').selectOption(family);
 const movedExpenseOptions=await form.locator('[name="expenseId"] option').evaluateAll(a=>a.map(x=>x.value));
 const movedDestOptions=await form.locator('[name="destinationId"] option').evaluateAll(a=>a.map(x=>x.value));
 assert.ok(movedExpenseOptions.includes(mountain.id)&&!movedExpenseOptions.includes(hotelExpense.id),'Linked expense options track trip change');
 assert.ok(movedDestOptions.includes(familyPlace.id)&&!movedDestOptions.includes(mainPlace.id),'Booking destination options track trip change');
 await form.locator('[name="tripId"]').selectOption(main);
 await set({provider:'Hotel Lake View',type:'hotel',status:'confirmed',reference:'PP-TEST-123',date:'2027-02-20',cost:'200',currency:'SGD',destinationId:mainPlace.id,expenseId:hotelExpense.id});
 await submit();
 assert.match(await page.locator('.booking-card').first().innerText(),/Linked to expense ledger/i);
 await create('newBooking',{provider:'Swiss Railway',type:'train',status:'reserved',date:'2027-03-11',tripId:family,destinationId:familyPlace.id});
 assert.equal(await page.locator('.booking-card').count(),2);
 await page.locator('#booking-trip').selectOption(family);
 assert.equal(await page.locator('.booking-card').count(),1,'Booking list trip filter');
 assert.match(await page.locator('.booking-card').innerText(),/Swiss Railway/);
 await page.locator('#booking-trip').selectOption('');
 await cleanShot('artifacts/finance-bookings-desktop.png');
 // Rebase profile currency without silently rewriting budgets.
 await openPage('settings');
 await page.locator('[name="baseCurrency"]').selectOption('EUR');
 await page.locator('[data-action="saveProfile"]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pixel-passport-v1')).profile.baseCurrency==='EUR');
 s=await state();
 assert.equal(s.profile.exchangeBudgetCurrency,'SGD');
 assert.equal(s.profile.exchangeBudget,'5000');
 assert.equal(s.expenses.find(e=>e.title==='Mountain pass').amount,'70');
 await openPage('budget');
 assert.match(await page.locator('.main').innerText(),/denominated in SGD/);
 assert.match(await page.locator('.main .stat').first().innerText(),/SGD/);
 await create('setBudget',{exchangeBudget:'3000'});
 assert.equal((await state()).profile.exchangeBudgetCurrency,'EUR');
 assert.equal((await state()).profile.exchangeBudget,'3000');
 await cleanShot('artifacts/finance-budget-after-currency.png');
 // Preserve user-created locations while recovering incomplete coordinates.
 await page.evaluate(mainId=>{
  const key='pixel-passport-v1',s=JSON.parse(localStorage.getItem(key));
  s.destinations.push({id:'missing-coordinate-test',name:'Unmapped Stop',country:'Switzerland',tripId:mainId,status:'wishlist',lat:'',lng:'',arrival:'',departure:'',order:55});
  localStorage.setItem(key,JSON.stringify(s));
 },main);
 await page.reload({waitUntil:'domcontentloaded'});
 await openPage('map');
 await page.locator('.atlas-overview').waitFor();
 assert.match(await page.locator('.atlas-warning').innerText(),/missing usable coordinates/i);
 const invalid=page.locator('.atlas-place-row').filter({hasText:'Unmapped Stop'});
 assert.equal(await invalid.locator('[data-action="focusMap"]').count(),0,'Invalid coordinates cannot be mapped');
 assert.equal(await invalid.locator('[data-action="editDestination"]').count(),1,'Invalid location is directly editable');
 await cleanShot('artifacts/finance-map-unmapped-desktop.png');
 await invalid.locator('[data-action="editDestination"]').click();
 await form.waitFor();
 await set({lat:'46.8523',lng:'9.5319'});
 await submit();
 assert.equal((await state()).destinations.find(d=>d.id==='missing-coordinate-test').lat,46.8523);
 assert.equal(await page.locator('.atlas-warning').count(),0,'Coordinate warning clears after edit');
 assert.equal(await page.locator('.atlas-place-row').filter({hasText:'Unmapped Stop'}).locator('[data-action="focusMap"]').count(),1);
 // Map popups must not create executable inline event-handler attributes.
 assert.equal(await page.locator('#map-canvas [onclick]').count(),0);
 await cleanShot('artifacts/finance-map-desktop.png');
 // Responsive smoke across 390/430/768 in each upgraded workflow.
 for(const [width,height] of [[390,844],[430,932],[768,1024]]){
  await page.setViewportSize({width,height});
  await cleanShot('artifacts/finance-map-'+width+'.png');
  await overflow(width+'px map');
  await openPage('bookings');await overflow(width+'px bookings');
  await page.locator('.living-page-header').waitFor();
  const bookingsHero=await page.locator('.living-page-header').evaluate(el=>({height:el.getBoundingClientRect().height,caption:el.querySelector('.page-heading p')?getComputedStyle(el.querySelector('.page-heading p')).display:null}));
  assert.ok(bookingsHero.height<=130,'Mobile booking header should be compact: '+JSON.stringify(bookingsHero));
  assert.equal(bookingsHero.caption,'none','Mobile booking header hides repeated introduction text');
  if(width===390)await cleanShot('artifacts/finance-bookings-mobile.png');
  await openPage('budget');await overflow(width+'px budget');
  await page.locator('.living-page-header').waitFor();
  const budgetHeroHeight=await page.locator('.living-page-header').evaluate(el=>el.getBoundingClientRect().height);
  assert.ok(budgetHeroHeight<=130,'Mobile budget header should be compact: '+budgetHeroHeight);
  if(width===390)await cleanShot('artifacts/finance-budget-mobile.png');
  await openPage('map');
 }
 // Show all data is intact on reload: no accidental conversion of booking cost into expenses.
 s=await state();
 assert.equal(s.expenses.length,2,'Booking costs are separate from actual expense entries');
 assert.equal(s.bookings.length,2,'Bookings persist across profile and UI changes');
 if(errors.length)throw Error('Browser page errors:\n'+errors.join('\n'));
 console.log('Map/Bookings/Budget browser checks passed: cross-trip links, currency preservation, FX, filters, map validation and 390/430/768/1440 responsive layout.');
}finally{await browser.close()}
