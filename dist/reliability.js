/* Recovery UI and transactional imports. Loaded after the existing feature bridges. */
(function(){
'use strict';
const MAX_BACKUP_BYTES=20*1024*1024;
let notice=null,importBusy=false,rateRequest=0,activeRateController=null;
const originalSave=save,originalEnhance=window.pixelPassportEnhance;
function announce(title,message,kind='error'){
  notice={title,message,kind};paint();
}
function exportLastSaved(){
  download('pixel-passport-last-saved-backup.json',JSON.stringify(durableState,null,2),'application/json');
}
function paint(){
  const old=document.getElementById('data-recovery-notice');
  const current=notice||(!navigator.onLine?{kind:'offline',title:'You are offline',message:'Your open plans are still available. Map tiles, weather and exchange-rate requests need a connection.'}:null);
  if(!current){old?.remove();return;}
  const host=document.querySelector('.modal .form-actions')||document.querySelector('.topbar');
  if(!host)return;
  const panel=document.createElement('section');panel.id='data-recovery-notice';panel.className='data-recovery data-recovery-'+current.kind;
  panel.setAttribute('role',current.kind==='error'?'alert':'status');
  panel.setAttribute('aria-live',current.kind==='error'?'assertive':'polite');
  const copy=document.createElement('div');copy.className='data-recovery-copy';
  const title=document.createElement('strong');title.textContent=current.title;
  const message=document.createElement('p');message.textContent=current.message;
  copy.append(title,message);panel.append(copy);
  const controls=document.createElement('div');controls.className='data-recovery-actions';
  if(current.kind==='error'){
    const backup=document.createElement('button');backup.type='button';backup.textContent='Download saved backup';backup.dataset.recoveryAction='export';backup.onclick=exportLastSaved;controls.append(backup);
  }
  if(notice){const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Dismiss';dismiss.setAttribute('aria-label','Dismiss data notice');dismiss.onclick=()=>{notice=null;paint()};controls.append(dismiss);}
  panel.append(controls);old?.remove();
  if(host.classList.contains('form-actions'))host.before(panel);else host.after(panel);
}
save=function(options={}){
  try{
    const result=originalSave(options);
    if(notice?.kind==='error'&&notice.title==='Changes were not saved')notice=null;
    paint();return result;
  }catch(error){
    if(error.storageFailure){
      if(!state.trips.some(t=>t.id===selectedTrip))selectedTrip=state.trips.some(t=>t.id===durableState.profile.selectedTripId)?durableState.profile.selectedTripId:state.trips[0]?.id;
      if(!state.destinations.some(d=>d.id===selectedDestination))selectedDestination=null;
      announce('Changes were not saved','Your last saved plans are unchanged. Free browser storage, then save again. Keep an open form open to preserve its draft.');
    }
    throw error;
  }
};
window.pixelPassportEnhance=function(...args){const result=originalEnhance?.apply(this,args);paint();return result;};
const previousClose=closeModal;
closeModal=function(...args){const result=previousClose.apply(this,args);paint();return result;};
window.addEventListener('offline',paint);window.addEventListener('online',paint);
document.addEventListener('DOMContentLoaded',paint);
// Capture only this input so the older import handler never also replaces state.
document.addEventListener('change',async event=>{
  const input=event.target;
  if(input.id!=='import-file')return;
  event.stopImmediatePropagation();
  const file=input.files?.[0];if(!file)return;
  if(importBusy){input.value='';return;}
  importBusy=true;input.disabled=true;
  const oldTrip=selectedTrip,oldDestination=selectedDestination;
  try{
    if(file.size>MAX_BACKUP_BYTES)throw Error('This backup exceeds the 20 MB import limit. Import a smaller backup.');
    let parsed;
    try{parsed=JSON.parse(await file.text())}catch{throw Error('This file is not valid JSON. Choose a Pixel Passport backup.');}
    parsed=window.PPData.validateBackup(parsed);
    if(!confirm('Replace this device\'s current plans with the validated backup? Download a backup first to keep both versions.'))return;
    const visualKeys=['selectedCharacterId','selectedCompanionId','selectedOutfitId','onboardingCompleted','mapAvatarVisible','mapPreferences'];
    const defaults=Object.fromEntries(visualKeys.filter(key=>state.profile[key]!==undefined).map(key=>[key,state.profile[key]]));
    parsed.profile={...defaults,...parsed.profile};
    state=parsed;
    selectedTrip=state.trips.some(t=>t.id===state.profile.selectedTripId)?state.profile.selectedTripId:state.trips[0].id;
    state.profile.selectedTripId=selectedTrip;selectedDestination=null;
    save({render:false});notice=null;render();
    announce('Backup restored','The imported plans are saved on this device. Your selected trip has been restored.','success');
    toast('Backup imported');
  }catch(error){
    selectedTrip=state.trips.some(t=>t.id===oldTrip)?oldTrip:state.trips[0]?.id;
    selectedDestination=state.destinations.some(d=>d.id===oldDestination)?oldDestination:null;
    if(!error.storageFailure)announce('Backup was not imported',error.message+' Your existing saved plans were not replaced.');
  }finally{
    input.value='';if(input.isConnected)input.disabled=false;importBusy=false;
  }
},true);
// Requests are bounded and tied to both a data object and a base currency.
// Changing either while a response is in flight makes that response obsolete.
actions.refreshRates=async()=>{
  const request=++rateRequest,base=state.profile.baseCurrency,owner=state;
  activeRateController?.abort();
  const controller=new AbortController();activeRateController=controller;
  const button=document.querySelector('[data-action="refreshRates"]'),label=button?.textContent;
  if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='Refreshing rates...';}
  const timer=setTimeout(()=>controller.abort(),10000);
  const isCurrent=()=>request===rateRequest&&owner===state&&base===state.profile.baseCurrency;
  try{
    const response=await fetch('https://open.er-api.com/v6/latest/'+encodeURIComponent(base),{signal:controller.signal});
    if(!response.ok)throw Error('Exchange-rate service is unavailable');
    const rates=window.PPData.validateRates(await response.json(),base);
    if(!isCurrent())return;
    state.rates=rates;state.ratesUpdated=new Date().toISOString();
    save();if(notice?.title==='Exchange rates were not updated'){notice=null;paint();}toast('Exchange rates updated. Existing recorded conversions were not changed.');
  }catch(error){
    if(!isCurrent())return;
    if(error.storageFailure)throw error;
    announce('Exchange rates were not updated','The request failed or the response was invalid. Previously saved rates and recorded expenses have been kept.','warning');
  }finally{
    clearTimeout(timer);
    if(request===rateRequest){
      activeRateController=null;
      if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.textContent=label;}
    }
  }
};
})();
