/* Validate before any legacy module can seed or overwrite device storage. */
(function(){
 'use strict';
 const KEY='pixel-passport-v1',MAX=20*1024*1024;
 const boot=window.PPBoot={ready:false,failed:false};
 let original=null;
 const files=['travel-template.js','travel-importer.js','postcards.js','app.js','dashboard-react.js','storybook.js','living-world.js','character-world.js','packing-model.js','packing-upgrade.js','reliability.js','concurrent-storage.js','release-runtime.js'];
 const downloadRaw=()=>{
  if(original===null)return;
  const url=URL.createObjectURL(new Blob([original],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='pixel-passport-original-device-data.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
 };
 function fail(message){
  boot.failed=true;boot.ready=false;
  const host=document.getElementById('app');host.replaceChildren();
  const panel=document.createElement('main');panel.className='boot-recovery';panel.setAttribute('aria-labelledby','boot-title');
  const title=document.createElement('h1');title.id='boot-title';title.textContent='Your saved plans need attention';
  const text=document.createElement('p');text.textContent=message;
  const note=document.createElement('p');note.textContent='Your saved plans have not been reset. Download your original device data before replacing it with a backup.';
  const actions=document.createElement('div');actions.className='boot-actions';
  const retry=document.createElement('button');retry.type='button';retry.textContent='Try loading again';retry.dataset.bootAction='retry';retry.onclick=()=>location.reload();actions.append(retry);
  if(original!==null){const exportButton=document.createElement('button');exportButton.type='button';exportButton.textContent='Download original data';exportButton.dataset.bootAction='export';exportButton.onclick=downloadRaw;actions.append(exportButton);}
  const label=document.createElement('label');label.textContent='Restore a valid backup';
  const input=document.createElement('input');input.type='file';input.accept='application/json';input.dataset.bootAction='import';
  input.addEventListener('change',async()=>{
   const file=input.files?.[0];if(!file)return;
   try{
    if(file.size>MAX)throw Error('This backup exceeds the 20 MB limit.');
    if(!window.PPData)throw Error('Validation module unavailable. Reload the application first.');
    const parsed=window.PPData.validateBackup(JSON.parse(await file.text()));
    if(!confirm('Replace the device data with this validated backup? Download the original data first to keep a copy.'))return;
    localStorage.setItem(KEY,JSON.stringify(parsed));location.reload();
   }catch(error){text.textContent='Backup was not restored: '+error.message;}finally{input.value='';}
  });
  label.append(input);panel.append(title,text,note,actions,label);host.append(panel);title.tabIndex=-1;title.focus();
 }
 function script(src,timeout=15000){return new Promise((resolve,reject)=>{
  const el=document.createElement('script');el.src=src;el.async=false;
  const timer=setTimeout(()=>{el.remove();reject(Error('A required application file did not finish loading.'))},timeout);
  el.onload=()=>{clearTimeout(timer);resolve();};el.onerror=()=>{clearTimeout(timer);reject(Error('Could not load '+src.split('/').pop()+'. Please reload.'));};document.head.append(el);
 });}
 function stylesheet(href){const el=document.createElement('link');el.rel='stylesheet';el.href=href;document.head.append(el);}
 async function start(){
  try{
   original=localStorage.getItem(KEY);
   if(!window.PPData)throw Error('The data validation module could not load.');
   if(original!==null){if(original.length>MAX)throw Error('Saved device data is too large to open safely.');window.PPData.validateBackup(JSON.parse(original));}
  }catch(error){fail('The saved data could not be opened safely. '+error.message);return;}
  try{
   for(const file of files)await script('/'+file);
   if(!document.querySelector('.main'))throw Error('The application did not finish starting.');
   boot.ready=true;
   window.dispatchEvent(new Event(navigator.onLine?'online':'offline'));
   stylesheet('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Fraunces:opsz,wght,SOFT,WONK@9..144,500,80,1;9..144,600,80,1;9..144,700,80,1&family=Press+Start+2P&display=swap');
   stylesheet('https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css');
   script('https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',10000).then(()=>{
    if(document.querySelector('.modal,[role="dialog"]'))return;
    if(typeof page!=='undefined'&&page==='map')render();
    else if(typeof page!=='undefined'&&page==='home'&&typeof initHomeMiniMap==='function')initHomeMiniMap();
   }).catch(()=>{});
  }catch(error){fail(error.message);}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
