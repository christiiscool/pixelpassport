import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.on('pageerror',err=>errors.push(err.message));
const base='http://127.0.0.1:4173/';
const clickAndSave=async(action,fields={})=>{
 await page.locator('[data-action="'+action+'"]').first().click();
 await page.locator('#dialog-form').waitFor();
 for(const [name,value] of Object.entries(fields)){
  const el=page.locator('#dialog-form [name="'+name+'"]');
  if(await el.count()===0)throw Error('Missing form field '+name);
  if((await el.first().evaluate(node=>node.tagName))==='SELECT')await el.selectOption(String(value));
  else await el.fill(String(value));
 }
 await page.locator('#dialog-form [type="submit"]').click();
 await page.locator('#dialog-form').waitFor({state:'detached'});
};
try{
 await page.goto(base+'#trips',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{
  const key='pixel-passport-v1';
  const state=JSON.parse(localStorage.getItem(key));
  state.profile.onboardingCompleted=true;
  state.profile.ambientMotion='off';
  localStorage.setItem(key,JSON.stringify(state));
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.trips-workspace').waitFor({timeout:15000});
 assert.equal(await page.locator('.trip-card').count(),2,'seed has two selectable trips');
 assert.equal(await page.locator('.route-summary').count(),1,'route summary is visible');
 assert.ok(await page.locator('.route-stop').count()>0,'seed includes route stops');
 await page.screenshot({path:'artifacts/trips-desktop-overview.png',fullPage:true,animations:'disabled'});
 // New trip selection and editable stops, including out-of-sequence dates.
 await clickAndSave('newTrip',{name:'Alpine Weekend',start:'2027-03-05',end:'2027-03-08',status:'planned'});
 await page.locator('.route-summary h2').filter({hasText:'Alpine Weekend'}).waitFor();
 const newTripId=await page.evaluate(()=>JSON.parse(localStorage.getItem('pixel-passport-v1')).trips.find(t=>t.name==='Alpine Weekend').id);
 await clickAndSave('newDestination',{name:'Chur',country:'Switzerland',status:'planned',arrival:'2027-03-05',departure:'2027-03-06',lat:'46.8523',lng:'9.5319'});
 await page.locator('.route-stop h3').filter({hasText:'Chur'}).waitFor();
 await clickAndSave('newDestination',{name:'Davos',country:'Switzerland',status:'wishlist',arrival:'2027-03-07',departure:'2027-03-08',lat:'46.8027',lng:'9.8364'});
 let order=await page.locator('.route-stop h3').allTextContents();
 assert.deepEqual(order,['Chur','Davos']);
 const davos=page.locator('.route-stop').filter({has:page.getByRole('heading',{name:'Davos'})});
 await davos.locator('.route-more summary').click();
 await davos.locator('[data-action="moveDestination"][data-direction="-1"]').click();
 order=await page.locator('.route-stop h3').allTextContents();
 assert.deepEqual(order,['Davos','Chur'],'moving a destination changes route order');
 const chur=page.locator('.route-stop').filter({has:page.getByRole('heading',{name:'Chur'})});
 await chur.locator('.route-more summary').click();
 await chur.locator('[data-action="duplicateDestination"]').click();
 assert.deepEqual(await page.locator('.route-stop h3').allTextContents(),['Davos','Chur','Chur copy']);
 const allOrders=await page.evaluate(id=>JSON.parse(localStorage.getItem('pixel-passport-v1')).destinations.filter(d=>d.tripId===id).map(d=>d.order),newTripId);
 assert.deepEqual([...allOrders].sort((a,b)=>a-b),[0,1,2],'route positions remain unique after move and duplicate');
 const opened=page.locator('.route-stop').filter({has:page.getByRole('heading',{name:'Chur',exact:true})});
 await opened.locator('[data-action="openDestination"]').click();
 await page.locator('#destination-itinerary').waitFor();
 assert.match(await page.locator('#destination-itinerary .section-head h2').innerText(),/Chur/i);
 assert.equal(await page.locator('[data-action="closeDestination"]').count(),1);
 await page.screenshot({path:'artifacts/trips-desktop-itinerary-empty.png',fullPage:true,animations:'disabled'});
 // Build a two-activity itinerary and verify all three display modes.
 await clickAndSave('newActivity',{title:'Old Town Walk',type:'sightseeing',status:'planned',date:'2027-03-05',time:'09:30',notes:'Walk by the river'});
 await clickAndSave('newActivity',{title:'Lunch in Chur',type:'food',status:'booked',date:'2027-03-05',time:'12:30'});
 assert.equal(await page.locator('.itinerary-activity').count(),2);
 assert.equal(await page.locator('.itinerary-day').count(),1);
 assert.ok((await page.locator('.itinerary-activity-info strong').allTextContents())[0].includes('Old Town Walk'));
 assert.equal(await page.locator('.itinerary-activity[draggable]').count(),0,'activities should not advertise non-persistent drag-and-drop');
 await page.screenshot({path:'artifacts/trips-desktop-timeline.png',fullPage:true,animations:'disabled'});
 await page.locator('.itinerary-views [data-value="calendar"]').click();
 assert.equal(await page.locator('.itinerary-day-card').count(),1,'day cards group activities by date');
 assert.equal(await page.locator('.itinerary-day-card .itinerary-day-events button').count(),2);
 await page.locator('.itinerary-views [data-value="list"]').click();
 assert.equal(await page.locator('.itinerary-activity-list .itinerary-activity').count(),2);
 await page.locator('#activity-type-filter').selectOption('food');
 assert.equal(await page.locator('.itinerary-activity').count(),1);
 assert.match(await page.locator('.itinerary-activity').innerText(),/Lunch in Chur/);
 await page.locator('[data-action="clearActivityFilters"]').click();
 assert.equal(await page.locator('.itinerary-activity').count(),2);
 await page.locator('.itinerary-views [data-value="timeline"]').click();
 await page.locator('.itinerary-activity').filter({hasText:'Old Town Walk'}).locator('[data-action="editActivity"]').click();
 await page.locator('#dialog-form [name="date"]').fill('2027-03-06');
 await page.locator('#dialog-form [name="time"]').fill('10:00');
 await page.locator('#dialog-form [type="submit"]').click();
 await page.locator('#dialog-form').waitFor({state:'detached'});
 assert.equal(await page.locator('.itinerary-day').count(),2,'schedule change sorts the activity into a different day');
 await page.screenshot({path:'artifacts/trips-desktop-itinerary-filled.png',fullPage:true,animations:'disabled'});
 // Test the same itinerary at phone/tablet widths and capture previews.
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(200);
 await page.screenshot({path:'artifacts/trips-mobile-itinerary-390.png',fullPage:true,animations:'disabled'});
 let dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
 assert.ok(dims.scroll<=dims.width+5,'390px itinerary must not overflow '+JSON.stringify(dims));
 await page.locator('[data-action="closeDestination"]').click();
 await page.screenshot({path:'artifacts/trips-mobile-route-390.png',fullPage:true,animations:'disabled'});
 dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
 assert.ok(dims.scroll<=dims.width+5,'390px route must not overflow '+JSON.stringify(dims));
 await page.setViewportSize({width:430,height:932});
 await page.screenshot({path:'artifacts/trips-mobile-route-430.png',fullPage:true,animations:'disabled'});
 dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
 assert.ok(dims.scroll<=dims.width+5,'430px route must not overflow '+JSON.stringify(dims));
 await page.setViewportSize({width:768,height:1024});
 await page.screenshot({path:'artifacts/trips-tablet-route-768.png',fullPage:true,animations:'disabled'});
 dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
 assert.ok(dims.scroll<=dims.width+5,'768px route must not overflow '+JSON.stringify(dims));
 await page.setViewportSize({width:1440,height:900});
 // Switching trips updates visible route without deleting any itinerary.
 await page.locator('.trip-card').filter({hasText:'Europe Exchange 2027'}).locator('[data-action="selectTrip"]').click();
 assert.match(await page.locator('.route-summary h2').innerText(),/Europe Exchange 2027/);
 await page.locator('.trip-card').filter({hasText:'Alpine Weekend'}).locator('[data-action="selectTrip"]').click();
 assert.equal(await page.locator('.route-stop').count(),3);
 // Route selection and recorded itinerary survive reload.
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.trips-workspace').waitFor();
 assert.match(await page.locator('.route-summary h2').innerText(),/Alpine Weekend/);
 await page.locator('.route-stop').filter({has:page.getByRole('heading',{name:'Chur',exact:true})}).locator('[data-action="openDestination"]').click();
 assert.equal(await page.locator('.itinerary-activity').count(),2);
 // Exercise remaining navigation and map rebuild via repeated entry/exit.
 for(const tab of ['map','budget','bookings','tasks','ski','journal','settings','trips','map','trips']){
  await page.locator('.sidebar .nav [data-nav="'+tab+'"]').click();
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.main').count(),1,'page '+tab+' must render');
  assert.ok((await page.locator('body').getAttribute('data-page'))===tab,'active page reflects '+tab);
 }
 if(errors.length)throw Error('Browser JavaScript errors:\n'+errors.join('\n'));
 console.log('Trip/itinerary browser checks passed: dates, route ordering, duplication, 3 views, filters, persistence, desktop/mobile/tablet, all major pages.');
}finally{await browser.close()}
