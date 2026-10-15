import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/#packing',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(500);
 await page.evaluate(()=>{
  const key='pixel-passport-v1';
  const data=JSON.parse(localStorage.getItem(key));
  if(!data)throw Error('Failed to initialize Pixel Passport demo data');
  data.profile.onboardingCompleted=true;
  data.profile.ambientMotion='off';
  localStorage.setItem(key,JSON.stringify(data));
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.packing-v2').waitFor({timeout:20000});
 await page.waitForTimeout(550);
 assert.equal(await page.locator('.main').evaluate(el=>getComputedStyle(el).opacity),'1','content must finish its entrance animation');
 assert.ok(await page.locator('.packing-v2-hero').evaluate(el=>el.getBoundingClientRect().top<190),'Packing hero should be above the fold without duplicate chapter banner');
 
 const metrics=await page.evaluate(()=>{
  const selectors=['.app','.sidebar','.main','.topbar','.packing-v2','.packing-v2-hero','.pack-stats','.pack-bags','.pack-section-head','.packing-v2-grid'];
  return Object.fromEntries(selectors.map(selector=>{
   const el=document.querySelector(selector);if(!el)return [selector,null];
   const r=el.getBoundingClientRect(),s=getComputedStyle(el);
   return [selector,{rect:{x:r.x,y:r.y,width:r.width,height:r.height},style:{display:s.display,visibility:s.visibility,opacity:s.opacity,transform:s.transform,animation:s.animationName,zIndex:s.zIndex,position:s.position},text:el.innerText?.slice(0,90)}];
  }));
 });
 console.log('PACKING_VISUAL_METRICS='+JSON.stringify(metrics));
 await page.screenshot({path:'artifacts/packing-viewport.png',animations:'disabled'});

 await page.screenshot({path:'artifacts/packing-desktop-before.png',fullPage:true,animations:'disabled'});
 assert.equal(await page.locator('.pack-stats').count(),1);
 assert.equal(await page.locator('.pack-bags>button').count(),4);
 assert.equal(await page.locator('.pack-hero-actions [data-action="openWardrobe"]').count(),1,'wardrobe shortcut must exist');
 await page.locator('[data-action="packLimits"]').click();
 await page.locator('input[name="limitChecked"]').fill('0.2');
 await page.locator('input[name="limitCabin"]').fill('8');
 await page.locator('#dialog-form button[type=submit]').click();
 assert.equal(await page.evaluate(()=>window.PPPackingModel.limitsFor()['checked luggage']),0.2);

 await page.locator('button[data-action="newPacking"]').first().click();
 await page.locator('input[name="name"]').fill('Thermal socks');
 await page.locator('input[name="qty"]').fill('5');
 await page.locator('input[name="ownedQty"]').fill('3');
 await page.locator('input[name="packedQty"]').fill('2');
 await page.locator('select[name="tripId"]').selectOption({index:0});
 await page.locator('#dialog-form button[type=submit]').click();
 const saved=page.locator('.pack-card').filter({hasText:'Thermal socks'});
 await saved.waitFor({timeout:5000});
 assert.match(await saved.innerText(),/2\/5 packed/);
 assert.match(await saved.innerText(),/3\/5 owned/);
 await saved.locator('button[data-action="packingAdjust"][data-field="packed"][data-delta="1"]').click();
 assert.match(await page.locator('.pack-card').filter({hasText:'Thermal socks'}).innerText(),/3\/5 packed/);
 assert.match(await page.locator('.pack-bags .pack-overweight').innerText(),/Over your saved limit/,'packed weight must warn about user-entered limit');
 const downloadEvent=page.waitForEvent('download');
 await page.locator('[data-action="packExport"]').click();
 const checklist=await downloadEvent;
 assert.match(checklist.suggestedFilename(),/europe-exchange-2027-packing.csv/);
 const exported=(await import('node:fs')).readFileSync(await checklist.path(),'utf8');
 assert.match(exported,/Thermal socks/);
 assert.match(exported,/"3"/);

 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.pack-card').filter({hasText:'Thermal socks'}).waitFor({timeout:10000});
 assert.match(await page.locator('.pack-card').filter({hasText:'Thermal socks'}).innerText(),/3\/5 packed/,'persists after reload');
 const bought=page.locator('.pack-shopping>div').filter({hasText:'Thermal socks'});
 assert.match(await bought.innerText(),/2 needed/);
 assert.equal(await page.evaluate(()=>window.PPPackingModel.limitsFor()['checked luggage']),0.2,'baggage limits persist after reload');
 await page.waitForTimeout(350);
 await page.screenshot({path:'artifacts/packing-desktop-filled.png',fullPage:true,animations:'disabled'});
 await page.setViewportSize({width:390,height:844});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.packing-v2').waitFor();
 await page.waitForTimeout(350);
 await page.screenshot({path:'artifacts/packing-mobile.png',fullPage:true,animations:'disabled'});
 const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,window:innerWidth}));
 assert.ok(dimensions.scroll<=dimensions.window+5,'mobile layout must not overflow: '+JSON.stringify(dimensions));
 if(errors.length)throw Error('Browser exceptions: '+errors.join('\n'));
 console.log('Packing browser test passed: page render, add/edit quantity, persistent partial packing, shopping, 390px responsive layout, no page exceptions');
} finally {await browser.close()}
