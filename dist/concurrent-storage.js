/* Optimistic stale-writer protection for the device-local dataset; not collaboration. */
(function(){
 'use strict';
 let expected=localStorage.getItem(KEY),conflicted=false;
 // Appearance migration may have persisted before the original save snapshot existed.
 if(expected!==null)durableState=JSON.parse(expected);
 const previousSave=save,previousEnhance=window.pixelPassportEnhance;
 function paint(){
  document.getElementById('cross-tab-notice')?.remove();if(!conflicted)return;
  const host=document.querySelector('.modal .form-actions')||document.querySelector('.topbar');if(!host)return;
  const panel=document.createElement('section');panel.id='cross-tab-notice';panel.className='data-recovery data-recovery-warning';panel.setAttribute('role','alert');
  const copy=document.createElement('div'),title=document.createElement('strong'),body=document.createElement('p');
  title.textContent='Plans changed in another tab';body.textContent='Saving from this older tab is paused to protect newer changes. Download this tab\'s last saved copy if needed, then reload the latest plans. Open-form edits are not included in that copy.';copy.append(title,body);panel.append(copy);
  const controls=document.createElement('div');controls.className='data-recovery-actions';
  const backup=document.createElement('button');backup.type='button';backup.textContent='Download this tab\'s saved copy';backup.onclick=()=>download('pixel-passport-older-tab-backup.json',JSON.stringify(durableState,null,2),'application/json');
  const reload=document.createElement('button');reload.type='button';reload.textContent='Reload latest plans';reload.dataset.crossTabReload='true';reload.onclick=()=>{if(document.querySelector('#dialog-form')&&!confirm('Reload newer plans? Unsaved edits in this form will be lost.'))return;location.reload();};
  controls.append(backup,reload);panel.append(controls);if(host.classList.contains('form-actions'))host.before(panel);else host.after(panel);
 }
 function assertCurrent(){
  let actual;try{actual=localStorage.getItem(KEY);}catch{return;}
  if(actual!==expected){conflicted=true;window.PPData.restore(state,durableState);paint();const error=Error('Another tab saved newer plans. Reload before saving from this tab.');error.storageFailure=true;error.crossTabConflict=true;throw error;}
 }
 // The reliability layer rechecks immediately after any confirmation dialogue.
 // This remains optimistic stale-writer protection, not atomic cross-tab locking.
 window.PPAssertStorageCurrent=assertCurrent;
 save=function(options={}){
  assertCurrent();
  const result=previousSave(options);expected=JSON.stringify(durableState);return result;
 };
 writeMapPreferences=function(){try{save({render:false});}catch(error){if(!error.storageFailure)toast(error.message);}};
 window.pixelPassportEnhance=function(...args){const result=previousEnhance?.apply(this,args);paint();return result;};
 window.addEventListener('storage',event=>{if(event.storageArea===localStorage&&(event.key===KEY||event.key===null)&&localStorage.getItem(KEY)!==expected){conflicted=true;paint();}});
})();
