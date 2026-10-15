(function upgradePacking(){
'use strict';
const categories=['Clothing','Ski gear','Essentials','Toiletries','Electronics','Accessories'];
function category(p){if(categories.includes(p.category))return p.category;const icon=itemIcon(p);return /ski|goggle|helmet/.test(icon)?'Ski gear':/jacket|pant|thermal|sweater|boot|sock|scarf|hat|raincoat/.test(icon)?'Clothing':/toiletr|sunscreen|toothbrush|medicine/.test(icon)?'Toiletries':/electronic|adapter|cable|camera|headphone/.test(icon)?'Electronics':/passport|wallet|bottle/.test(icon)?'Essentials':'Accessories'}
const priorityRank=p=>({high:0,normal:1,low:2}[p.priority||'normal']);
let deletedItem=null;
function refreshPacking(){if(page!=='packing'||!document.querySelector('.packing-v2'))return;const old=document.querySelector('.packing-v2'),hero=old.querySelector('.packing-v2-hero'),focus=document.activeElement?.dataset,caseOpen=old.querySelector('.pack-case')?.open,suggestionsOpen=old.querySelector('.pack-suggestion-disclosure')?.open,template=document.createElement('template');template.innerHTML=window.PPPackingPage();const next=template.content.firstElementChild;hero.querySelector('.packing-hero-copy p').innerHTML=next.querySelector('.packing-hero-copy p').innerHTML;next.querySelector('.packing-v2-hero').replaceWith(hero);if(next.querySelector('.pack-case'))next.querySelector('.pack-case').open=caseOpen;if(next.querySelector('.pack-suggestion-disclosure'))next.querySelector('.pack-suggestion-disclosure').open=suggestionsOpen;old.replaceWith(next);bindActions(next);if(focus?.action||focus?.packMove){[...next.querySelectorAll('[data-action],[data-pack-move]')].find(n=>n.dataset.action===focus.action&&n.dataset.id===focus.id&&n.dataset.field===focus.field&&n.dataset.delta===focus.delta&&n.dataset.packMove===focus.packMove)?.focus()}}
function commitPacking(){save({render:false});refreshPacking()}
function animatePacked(p){if(state.profile.ambientMotion==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const card=[...document.querySelectorAll('.pack-card')].find(c=>c.dataset.itemId===p.id),bag=[...document.querySelectorAll('.pack-bags>button')].find(b=>b.dataset.value===p.bag);if(!card||!bag)return;card.classList.add('just-packed');const image=card.querySelector('.pack-art').cloneNode(),from=card.getBoundingClientRect(),to=bag.getBoundingClientRect();image.className='pack-flying-item';Object.assign(image.style,{left:from.left+'px',top:from.top+'px'});document.body.append(image);const animation=image.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+(to.left-from.left)+'px,'+(to.top-from.top)+'px) scale(.25)',opacity:0}],{duration:480,easing:'ease-in'});animation.onfinish=()=>image.remove();}
function suitcase(list){const selected=filters.packBag||'checked luggage',contents=list.filter(p=>p.bag===selected&&counts(p).packed>0),sum=totals(list.filter(p=>p.bag===selected));return '<details class="pack-case" open><summary><span>'+art('suitcase')+'</span><strong>'+E(bags.find(b=>b[0]===selected)?.[1])+' <small>'+sum.packed+' units tucked away · '+sum.weight.toFixed(2)+' kg estimated</small></strong><span class="pack-case-toggle">Open / close</span></summary><div class="pack-case-interior">'+(contents.length?contents.map(p=>'<button data-action="editPacking" data-id="'+E(p.id)+'" title="'+E(p.name)+'">'+art(itemIcon(p))+'<small>'+E(p.name)+' ×'+counts(p).packed+'</small></button>').join(''):'<p>A little space for everything you need. Pack an owned item to tuck it inside.</p>')+'</div></details>'}
const baseTrip=()=>state.trips[0]?.id,trip=()=>state.trips.find(t=>t.id===selectedTrip)||state.trips[0];
const items=()=>state.packing.filter(p=>(p.tripId||baseTrip())===trip()?.id);
const {counts,sync,totals}=window.PPPackingData;
const icons=['jacket','sweater','thermals','pants','boots','gloves','goggles','helmet','toiletries','electronics','bottle','adapter','passport','suitcase','socks','scarf','hat','umbrella','sunscreen','medicines','headphones','daypack','laundry','camera','flower','ski-jacket','ski-pants','ski-socks','wallet','raincoat','toothbrush','neck-pillow','charging-cable'];
function itemIcon(p){
 if(icons.includes(p.icon))return p.icon;
 const n=String(p.name||'').toLowerCase();
 for(const [r,i] of [[/ski.?jacket|ski.?coat/,'ski-jacket'],[/ski.?pants|ski.?trousers/,'ski-pants'],[/ski.?socks/,'ski-socks'],[/neck.?pillow|travel pillow/,'neck-pillow'],[/toothbrush/,'toothbrush'],[/wallet|card holder/,'wallet'],[/charging cable|usb.?c cable/,'charging-cable'],[/raincoat|rain jacket/,'raincoat'],[/passport|visa/,'passport'],[/sock/,'socks'],[/scarf/,'scarf'],[/hat|beanie|cap/,'hat'],[/umbrella/,'umbrella'],[/sun.?screen|spf/,'sunscreen'],[/medicine|medication|first aid/,'medicines'],[/headphone|earbud/,'headphones'],[/day.?pack|backpack/,'daypack'],[/laundry|detergent/,'laundry'],[/goggle/,'goggles'],[/helmet/,'helmet'],[/glove|mitten/,'gloves'],[/thermal|base layer/,'thermals'],[/sweater|jumper|hoodie/,'sweater'],[/coat|jacket|fleece|parka/,'jacket'],[/pant|trouser|jean|legging/,'pants'],[/shoe|boot|sneaker/,'boots'],[/tooth|skin|soap|shampoo|toiletr/,'toiletries'],[/camera/,'camera'],[/phone|laptop|tablet/,'electronics'],[/charger|adapter|plug|cable/,'adapter'],[/bottle|water/,'bottle']])if(r.test(n))return i;
 return 'suitcase';
}
const artBounds={daypack:[287,54,211,235],jacket:[13,530,235,226],'ski-jacket':[13,530,235,226],pants:[273,532,204,230],'ski-pants':[273,532,204,230],thermals:[504,534,231,219],sweater:[504,534,231,219],boots:[750,540,253,213],gloves:[1004,544,245,210],goggles:[1259,573,265,168],helmet:[21,765,219,222],toiletries:[266,783,231,195],electronics:[510,751,325,236],passport:[835,766,190,218],bottle:[1094,749,128,240],adapter:[1310,778,190,200],camera:[1270,333,259,184]};
let artId=0;
const art=i=>{const icon=itemIcon({name:i,icon:i}),bounds=artBounds[icon];if(!bounds)return '<img class="pack-art" alt="" aria-hidden="true" src="'+(icon==='suitcase'?'/assets/packing/suitcase.svg':'/assets/icons/'+icon+'.svg')+'">';const [x,y,w,h]=bounds,clip='packing-art-'+(++artId);return '<svg class="pack-art illustrated-pack-art" viewBox="'+bounds.join(' ')+'" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="'+clip+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/></clipPath></defs><image href="/assets/packing/inventory-clean.png" width="1536" height="1024" clip-path="url(#'+clip+')"/></svg>'};
const E=v=>esc(String(v??''));
function suggestions(){
 const t=trip();if(!t)return [];
 const ds=state.destinations.filter(d=>d.tripId===t.id);
 const skiing=state.skiTrips.some(s=>s.tripId===t.id)||state.activities.some(a=>a.type==='skiing'&&ds.some(d=>d.id===a.destinationId));
 const winter=ds.some(d=>/Switzerland|Austria|Finland|Slovenia|France|Italy|Norway|Sweden/i.test(d.country)&&(()=>{const m=Number((d.arrival||t.start||'').slice(5,7));return m>0&&(m<=2||m>=11)})());
 const existing=new Set(items().map(p=>p.name.trim().toLowerCase())),seen=new Set(),out=[];
 function add(name,reason,bag='checked luggage',qty=1,weight=0.2){
  const key=name.toLowerCase();
  if(existing.has(key)||seen.has(key)||state.dismissed.includes(key)||state.dismissed.includes('pack:'+t.id+':'+key))return;
  seen.add(key);out.push({name,reason,bag,qty,weight,key});
 }
 if(ds.length){add('Passport','International travel','personal bag',1,.05);add('Travel adapter','Charging essentials','cabin luggage',1,.1);add('Reusable water bottle','Train rides and day trips','personal bag',1,.3);add('Walking shoes','Exploring cities','checked luggage',1,.7)}
 if(winter){add('Warm coat','Winter destination',undefined,1,1.2);add('Thermal base layers','Cold-weather layering',undefined,3,.2);add('Waterproof boots','Snowy or wet streets',undefined,1,1);add('Warm socks','Cold-weather essentials',undefined,4,.08);add('Scarf','Winter layering',undefined,1,.2)}
 if(skiing){add('Ski jacket','Ski trip',undefined,1,.9);add('Ski pants','Ski trip',undefined,1,.65);add('Waterproof gloves','Ski trip',undefined,1,.2);add('Ski goggles','Ski trip',undefined,1,.2);add('Ski socks','Ski trip',undefined,2,.12);add('Helmet or rental','Decide whether to rent locally','optional',1,.7);add('Sunscreen SPF 50','Mountain sun','personal bag',1,.1)}
 const m=Number((t.start||'').slice(5,7));if(m>=5&&m<=9){add('Sun hat','Summer days','cabin luggage',1,.1);add('Sunscreen SPF 50','Summer sun','personal bag',1,.1)}
 const outfit=filters.packIncludeOutfit?state.profile.selectedOutfitId:null;
 if(outfit==='rain')add('Raincoat','Optional: matches your Rainy Day wardrobe','cabin luggage',1,.4);
 if(outfit==='hiking')add('Hiking boots','Optional: matches your Hiking wardrobe','checked luggage',1,1.1);
 if(outfit==='city')add('Travel wallet','Optional: convenient for city exploring','personal bag',1,.1);
 return out;
}

const bags=[['checked luggage','Checked suitcase','suitcase'],['cabin luggage','Cabin luggage','daypack'],['personal bag','Personal bag','daypack'],['optional','Optional / rental','helmet']];
const limitsFor=()=>state.profile.packingLimits?.[trip()?.id]||{};
const limitFor=bag=>{const value=Number(limitsFor()[bag]);return Number.isFinite(value)&&value>0?value:null};
function card(p){
 const c=counts(p),done=c.packed===c.qty;const cat=category(p);
 return '<article class="pack-card '+(done?'ready':'')+'" data-item-id="'+E(p.id)+'" data-search-name="'+E(p.name.toLowerCase())+'">'+
 '<div class="pack-card-art">'+art(itemIcon(p))+'<span class="pack-seal">'+(done?'✓':c.shopping?'!':'·')+'</span></div>'+
 '<h3>'+E(p.name)+'</h3><p>'+E(cat)+' · '+(done?'Ready':c.packed?'Partly packed':c.shopping?'Shopping':'Owned')+'</p>'+
 '<label class="pack-card-bag">Bag<select data-pack-move="'+E(p.id)+'" aria-label="Bag for '+E(p.name)+'">'+bags.map(([key,label])=>'<option value="'+key+'" '+(key===p.bag?'selected':'')+'>'+label+'</option>').join('')+'</select></label>'+
 '<div class="pack-quantity"><span>Need</span><div><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="qty" data-delta="-1" aria-label="Need one fewer '+E(p.name)+'" '+(c.qty<=Math.max(1,c.owned)?'disabled':'')+'>−</button><output>'+c.qty+'</output><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="qty" data-delta="1" aria-label="Need one more '+E(p.name)+'">+</button></div></div>'+
 '<div class="pack-chip-row"><span>'+c.packed+'/'+c.qty+' packed</span><span>'+c.owned+'/'+c.qty+' owned</span></div>'+
 '<div class="pack-quantity"><span>Pack</span><div><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="packed" data-delta="-1" aria-label="Pack one fewer '+E(p.name)+'" '+(c.packed===0?'disabled':'')+'>−</button><output>'+c.packed+'</output><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="packed" data-delta="1" aria-label="Pack one more '+E(p.name)+'" '+(c.packed>=c.owned?'disabled':'')+'>+</button></div></div>'+
 '<div class="pack-quantity"><span>Own</span><div><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="owned" data-delta="-1" aria-label="Own one fewer '+E(p.name)+'" '+(c.owned<=c.packed?'disabled':'')+'>−</button><output>'+c.owned+'</output><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="owned" data-delta="1" aria-label="Own one more '+E(p.name)+'" '+(c.owned===c.qty?'disabled':'')+'>+</button></div></div>'+
 '<div class="pack-card-actions"><button data-action="packingAll" data-id="'+E(p.id)+'">'+(done?'Unpack all':c.owned<c.qty?'Pack owned':'Pack all')+'</button><button data-action="editPacking" data-id="'+E(p.id)+'" aria-label="Edit '+E(p.name)+'">Edit</button><button data-action="packDelete" data-id="'+E(p.id)+'" aria-label="Delete '+E(p.name)+'">Delete</button></div></article>';
}
window.PPPackingPage=function(){
 const t=trip(),list=items(),sum=totals(list),percent=sum.units?Math.round(sum.packed/sum.units*100):0;
 const show=list.filter(p=>(!filters.packBag||p.bag===filters.packBag)&&(!filters.packStatus||filters.packStatus==='packed'&&counts(p).packed===counts(p).qty||filters.packStatus==='unpacked'&&counts(p).packed<counts(p).qty||filters.packStatus==='shopping'&&counts(p).shopping>0)&&(!filters.packSearch||p.name.toLowerCase().includes(filters.packSearch.toLowerCase()))&&(!filters.packCategory||category(p)===filters.packCategory)).sort((a,b)=>filters.packSort==='priority'?priorityRank(a)-priorityRank(b)||a.name.localeCompare(b.name):a.name.localeCompare(b.name));
 const suggested=suggestions(),shopping=list.filter(p=>counts(p).shopping>0);
 return '<div class="packing-v2">'+
 '<section class="packing-v2-hero"><div class="packing-hero-copy"><div class="pack-kicker">CHAPTER THREE · THE SUITCASE</div><h2>Pack a little<br><i>adventure.</i></h2><p>'+E(t?.name||'Your next journey')+' · '+percent+'% ready<br>Gather the little things. Go somewhere wonderful.</p><div class="pack-hero-actions"><button class="btn primary" data-action="newPacking">+ Add inventory item</button><button class="btn ghost" data-action="openWardrobe">Change outfit</button></div></div><div class="packing-v2-landscape" aria-hidden="true"></div><span class="packing-cloud" aria-hidden="true"></span><div id="packing-v2-avatar" class="packing-v2-avatar"></div></section>'+
 '<div class="pack-trip"><div><small>PACKING FOR</small><strong>'+E(t?.name||'Your adventure')+'</strong></div><label>Choose trip <select id="trip-select" class="field">'+state.trips.map(x=>'<option value="'+E(x.id)+'" '+(x.id===selectedTrip?'selected':'')+'>'+E(x.name)+'</option>').join('')+'</select></label><button class="btn small ghost" data-action="packExport">Export CSV</button></div>'+
 '<div class="pack-stats"><div><small>IN THE SUITCASE</small><strong>'+sum.packed+' <em>/ '+sum.units+' units</em></strong><div class="pack-meter" role="progressbar" aria-valuenow="'+percent+'" aria-valuemin="0" aria-valuemax="100" aria-label="Units packed"><span style="width:'+percent+'%"></span></div><p>'+percent+'% packed · '+sum.items+' types of items</p></div><div><small>STILL TO BUY</small><strong>'+sum.shopping+' <em>units</em></strong><p>Owned is different from packed</p></div><div><small>ESTIMATED PACKED WEIGHT</small><strong>'+sum.weight.toFixed(1)+' <em>kg</em></strong><p>'+(sum.weightMissing?sum.weightMissing+' packed units lack weights · ':'')+''+bags.filter(([key])=>list.some(p=>p.bag===key)).length+' bags in use · limits from your ticket</p></div></div>'+
 '<div class="pack-section-head pack-bag-heading"><span>01 / YOUR BAGS</span><small>Tap a bag to filter its contents</small><button class="btn small ghost" data-action="packLimits">Set bag limits</button></div><div class="pack-bags">'+bags.map(([key,name,icon])=>{const s=totals(list.filter(p=>p.bag===key)),p=s.units?Math.round(s.packed/s.units*100):0,limit=limitFor(key),over=limit!==null&&s.weight>limit;return '<button data-action="packBagTab" data-value="'+key+'" aria-pressed="'+(filters.packBag===key)+'" class="'+(filters.packBag===key?'selected':'')+(over?' pack-overweight':'')+'">'+art(icon)+'<span><b>'+name+'</b><small>'+s.packed+' / '+s.units+' packed</small><small class="pack-bag-weight">'+s.weight.toFixed(1)+' kg'+(limit?' / '+limit+' kg limit':' · no limit set')+(s.weightMissing?' · '+s.weightMissing+' without weight':'')+'</small>'+(over?'<strong class="pack-warning">Over your saved limit</strong>':'')+'</span><i><span style="width:'+p+'%"></span></i></button>'}).join('')+'</div>'+
 suitcase(list)+
 (deletedItem?'<div class="pack-undo" role="status">'+E(deletedItem.item.name)+' removed <button class="btn small" data-action="packUndo">Undo deletion</button></div>':'')+
 '<div class="pack-section-head"><span>02 / YOUR INVENTORY</span><small>Little things, neatly organized</small></div><div class="pack-filters"><input id="pack-search" type="search" placeholder="Find an item…" aria-label="Search your packing list" value="'+E(filters.packSearch||'')+'"><select id="pack-status" class="field" aria-label="Filter status"><option value="">All statuses</option><option value="unpacked" '+(filters.packStatus==='unpacked'?'selected':'')+'>Still to pack</option><option value="packed" '+(filters.packStatus==='packed'?'selected':'')+'>Fully packed</option><option value="shopping" '+(filters.packStatus==='shopping'?'selected':'')+'>Need to buy</option></select><select id="pack-category" class="field" aria-label="Filter category"><option value="">All categories</option>'+categories.map(c=>'<option '+(filters.packCategory===c?'selected':'')+'>'+c+'</option>').join('')+'</select><select id="pack-sort" class="field" aria-label="Sort inventory"><option value="name">Name</option><option value="priority" '+(filters.packSort==='priority'?'selected':'')+'>Priority</option></select><button class="btn small ghost" data-action="packClear">Clear filters</button></div>'+
 '<div class="packing-v2-grid">'+(show.map(card).join('')||'<div class="pack-none"><img src="/assets/icons/suitcase.svg" alt=""><h3>Room for adventures</h3><p>'+(list.length?'No items match the selected filters.':'Add your first item or try a suggestion below.')+'</p><button class="btn small primary" data-action="newPacking">Add item</button></div>')+'</div>'+
 '<div class="pack-section-head"><span>03 / SHOPPING NOTES</span><small>What you still need to buy</small></div>'+(shopping.length?'<div class="pack-shopping">'+shopping.map(p=>'<div>'+art(itemIcon(p))+'<span>'+E(p.name)+'</span><strong>'+counts(p).shopping+' needed</strong><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="owned" data-delta="1">Bought one</button></div>').join('')+'</div>':'<div class="pack-quiet">✦ Nothing on your shopping list right now.</div>')+
 '<div class="pack-section-head"><span>04 / SUGGESTED FOR THIS TRIP</span><small>Based on this trip · accept only what you need</small><button class="btn small ghost" data-action="packOutfitSuggestions">Suggest clothes for my outfit</button></div>'+(suggested.length?'<details class="pack-suggestion-disclosure"><summary>Review '+suggested.length+' tailored suggestions <span>＋</span></summary><div class="pack-suggestions">'+suggested.map((s,i)=>'<article>'+art(itemIcon(s))+'<div><h3>'+E(s.name)+'</h3><p>'+E(s.reason)+' · quantity '+s.qty+'</p><button class="btn small primary" data-action="acceptPacking" data-index="'+i+'">+ Add</button><button class="btn small ghost" data-action="dismissPacking" data-index="'+i+'">Dismiss</button></div></article>').join('')+'</div></details>':'<div class="pack-quiet">✦ No new suggestions for this trip.</div>')+
 '</div>';
};
window.PPPackingForm=function(record){
 const p=record||{},c=counts(p),i=itemIcon(p);
 modal(record?'Edit inventory item':'New packing item',
 field('name','Item name',p.name||'','text','required maxlength="100"')+
 selectField('icon','Illustration',[{id:'',name:'Choose automatically'},...icons.map(k=>({id:k,name:k}))],p.icon&&icons.includes(p.icon)?p.icon:'')+
 field('qty','Quantity needed',c.qty,'number','min="1" max="999" step="1" required')+
 field('ownedQty','Quantity owned',c.owned,'number','min="0" max="999" step="1" required')+
 field('packedQty','Quantity packed',c.packed,'number','min="0" max="999" step="1" required')+
 field('weight','Weight per unit (kg)',p.weight??'','number','min="0" max="99" step="0.01"')+
 selectField('category','Category',categories,p.category||category(p))+selectField('priority','Priority',['high','normal','low'],p.priority||'normal')+selectField('bag','Bag',bags.map(x=>x[0]),p.bag||'checked luggage')+
 selectField('tripId','Trip',state.trips,p.tripId||selectedTrip)+textField('notes','Notes',p.notes||''),
 v=>{
  const q=Number(v.qty),o=Number(v.ownedQty),pk=Number(v.packedQty);
  if(!Number.isInteger(q)||q<1||q>999)throw Error('Quantity must be between 1 and 999.');
  if(!Number.isInteger(o)||o<0||o>q)throw Error('Owned quantity must be between 0 and total quantity.');
  if(!Number.isInteger(pk)||pk<0||pk>o)throw Error('Packed quantity cannot exceed owned quantity.');
  if(v.weight!==''&&(!Number.isFinite(Number(v.weight))||Number(v.weight)<0))throw Error('Enter a valid nonnegative weight.');
  const val={...v,qty:q,ownedQty:o,packedQty:pk};
  if(record)sync(Object.assign(record,val));else state.packing.push(sync({id:id(),...val}));
 });
};
actions.packLimits=()=>{
 const current=limitsFor();
 modal('Luggage weight limits','<div class="full pack-modal-note">Optional limits for this trip. Enter the allowance from your own ticket or airline. Leave a bag blank if unknown; these are not airline-verified values.</div>'+
 field('limitChecked','Checked suitcase limit (kg)',current['checked luggage']??'','number','min="0.1" max="999" step="0.1"')+
 field('limitCabin','Cabin luggage limit (kg)',current['cabin luggage']??'','number','min="0.1" max="999" step="0.1"')+
 field('limitPersonal','Personal bag limit (kg)',current['personal bag']??'','number','min="0.1" max="999" step="0.1"'),
 v=>{
  const next={};
  for(const [fieldName,key] of [['limitChecked','checked luggage'],['limitCabin','cabin luggage'],['limitPersonal','personal bag']]){
   if(v[fieldName]==='')continue;
   const val=Number(v[fieldName]);
   if(!Number.isFinite(val)||val<=0||val>999)throw Error('Limits must be positive numbers in kilograms.');
   next[key]=val;
  }
  state.profile.packingLimits={...(state.profile.packingLimits||{}),[trip().id]:next};
 });
};
actions.packExport=()=>{
 const t=trip();if(!t)return;
 const clean=v=>{let value=String(v??'');if(/^[=+@\-\t\r]/.test(value))value="'"+value;return '"'+value.replace(/"/g,'""')+'"';};
 const headings=['Item','Quantity needed','Quantity owned','Quantity packed','Quantity to buy','Bag','Unit weight (kg)','Notes'];
 const rows=items().map(p=>{const c=counts(p);return [p.name,c.qty,c.owned,c.packed,c.shopping,p.bag||'',p.weight??'',p.notes||''].map(clean).join(',');});
 const csv='\uFEFF'+[headings.map(clean).join(','),...rows].join('\r\n');
 const slug=t.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,60)||'trip';
 download('pixel-passport-'+slug+'-packing.csv',csv,'text/csv;charset=utf-8');
};
actions.newPacking=()=>packingForm();
actions.editPacking=({id})=>{const p=state.packing.find(p=>p.id===id);if(p)packingForm(p)};
actions.packingAdjust=({id,field,delta})=>{
 const p=state.packing.find(p=>p.id===id);if(!p)return;
 const c=counts(p),change=Number(delta);
 if(field==='packed'){p.packedQty=Math.max(0,Math.min(c.owned,c.packed+change));p.ownedQty=c.owned}
 else if(field==='qty'){p.qty=Math.min(999,Math.max(1,c.owned,c.qty+change));p.ownedQty=c.owned;p.packedQty=c.packed}
 else if(field==='owned'){p.ownedQty=Math.max(c.packed,Math.min(c.qty,c.owned+change));p.packedQty=c.packed}
 sync(p);save();
};
actions.packingAll=({id})=>{const p=state.packing.find(p=>p.id===id);if(!p)return;const c=counts(p);p.packedQty=c.packed===c.qty?0:c.owned;p.ownedQty=c.owned;sync(p);commitPacking();if(p.packedQty>c.packed)animatePacked(p);if(p.status==='packed')toast('Everything packed! ✦')};
actions.packClear=()=>{filters.packBag='';filters.packStatus='';filters.packSearch='';filters.packCategory='';refreshPacking()};
actions.packBagTab=({value})=>{filters.packBag=filters.packBag===value?'':value;refreshPacking()};
actions.acceptPacking=({index})=>{const s=suggestions()[Number(index)];if(!s)return;state.packing.push(sync({id:id(),name:s.name,icon:itemIcon(s),qty:s.qty,ownedQty:0,packedQty:0,weight:s.weight,bag:s.bag,tripId:trip().id,notes:'Suggested: '+s.reason}));commitPacking();toast('Added to your inventory')};
actions.dismissPacking=({index})=>{const s=suggestions()[Number(index)];if(!s)return;state.dismissed.push('pack:'+trip().id+':'+s.key);commitPacking()};
actions.packDelete=({id:did})=>{const index=state.packing.findIndex(p=>p.id===did);if(index<0)return;deletedItem={item:structuredClone(state.packing[index]),index};state.packing.splice(index,1);try{commitPacking()}catch(error){deletedItem=null;throw error}toast('Item removed. Use Undo deletion to restore it.')};
actions.packUndo=()=>{if(!deletedItem)return;if(!state.packing.some(p=>p.id===deletedItem.item.id))state.packing.splice(deletedItem.index,0,deletedItem.item);commitPacking();deletedItem=null;refreshPacking()};
actions.deletePacking=actions.packDelete;
actions.packOutfitSuggestions=()=>{filters.packIncludeOutfit=true;refreshPacking();toast('Outfit suggestions are ready to review. Inventory is unchanged.')};
document.addEventListener('change',e=>{if(page!=='packing')return;const el=e.target;if(el.dataset.packMove){const p=state.packing.find(p=>p.id===el.dataset.packMove);if(p){p.bag=el.value;try{commitPacking()}catch(error){if(!error.storageFailure)toast(error.message)}}}else if(['pack-status','pack-category','pack-sort'].includes(el.id)){e.stopImmediatePropagation();filters[{'pack-status':'packStatus','pack-category':'packCategory','pack-sort':'packSort'}[el.id]]=el.value;refreshPacking()}},true);
document.addEventListener('input',e=>{if(e.target.id!=='pack-search')return;filters.packSearch=e.target.value;const position=e.target.selectionStart;refreshPacking();const input=document.querySelector('#pack-search');input?.focus();input?.setSelectionRange(position,position)});
const oldEnhance=window.pixelPassportEnhance;
window.pixelPassportEnhance=function(){if(typeof oldEnhance==='function')oldEnhance();if(page==='packing'&&window.PPReact?.renderWidget){const node=document.querySelector('#packing-v2-avatar');if(node)window.PPReact.renderWidget(node,'TravelerAvatar',{mode:'luggage',motion:state.profile.ambientMotion!=='off'})}};
window.PPPackingModel={counts,totals,suggestions,items,limitsFor,itemIcon};
render();if(!state.profile.onboardingCompleted)window.PPAvatarUI.setup(false);
})();
