/* Release accessibility behavior, independent from the illustration layers. */
(function(){
 'use strict';
 const labels={'expense-kind':'Expense stage','expense-category':'Expense category','task-status':'Quest completion status','task-category':'Quest category','task-urgency':'Quest due date','booking-type':'Booking type','booking-status':'Booking status'};
 const app=document.getElementById('app');
 function syncModal(){app.inert=Boolean(document.querySelector('#modal-root [role="dialog"],#avatar-root [role="dialog"]'));}
 function apply(){
  const main=document.querySelector('.main');if(main){main.id='main-content';main.tabIndex=-1;}
  const heading=document.querySelector('.topbar h1');if(heading)document.title=heading.textContent+' | Pixel Passport';
  for(const [id,label] of Object.entries(labels))document.getElementById(id)?.setAttribute('aria-label',label);
  document.querySelector('.modal [data-close].close')?.setAttribute('aria-label','Close dialog');
  document.querySelectorAll('.nav button[data-nav="style-guide"]').forEach(node=>node.hidden=true);
  syncModal();
 }
 const original=window.pixelPassportEnhance;
 window.pixelPassportEnhance=function(...args){const result=original?.apply(this,args);apply();return result;};
 const nativeClose=closeModal;
 closeModal=function(...args){app.inert=false;return nativeClose.apply(this,args);};
 // One capture-phase focus trap avoids competing legacy bubble-phase traps.
 document.addEventListener('keydown',event=>{
  const dialog=document.querySelector('#modal-root [role="dialog"],#avatar-root [role="dialog"]');
  if(!dialog||event.key!=='Tab')return;
  const items=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')].filter(node=>node.getClientRects().length&&!node.hidden);
  if(!items.length)return;
  event.stopImmediatePropagation();
  const first=items[0],last=items.at(-1),active=document.activeElement;
  if(!dialog.contains(active)||event.shiftKey&&active===first||!event.shiftKey&&active===last){event.preventDefault();(event.shiftKey?last:first).focus();}
 },true);
 for(const id of ['modal-root','avatar-root']){const root=document.getElementById(id);if(root)new MutationObserver(apply).observe(root,{childList:true,subtree:true});}
 if(!document.querySelector('.skip-to-content')){
  const skip=document.createElement('a');skip.href='#main-content';skip.className='skip-to-content';skip.textContent='Skip to main content';
  skip.onclick=event=>{event.preventDefault();document.getElementById('main-content')?.focus();};document.body.prepend(skip);
 }
 apply();
})();
