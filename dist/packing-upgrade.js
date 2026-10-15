(function upgradePacking(){
'use strict';
const baseTrip=()=>state.trips[0]?.id,trip=()=>state.trips.find(t=>t.id===selectedTrip)||state.trips[0];
const items=()=>state.packing.filter(p=>(p.tripId||baseTrip())===trip()?.id);
const num=(v,d=0)=>v!==''&&v!=null&&Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):d;
function counts(p){
 const qty=Math.max(1,num(p.qty,1));
 const owned=Math.min(qty,num(p.ownedQty,['purchased','packed'].includes(p.status)?qty:0));
 const packed=Math.min(owned,num(p.packedQty,p.status==='packed'?qty:0));
 return {qty,owned,packed,shopping:qty-owned};
}
function sync(p){
 const c=counts(p);
 Object.assign(p,{qty:c.qty,ownedQty:c.owned,packedQty:c.packed,status:c.packed===c.qty?'packed':c.owned===c.qty?'purchased':'needed'});
 return p;
}
function totals(rows){
 return rows.reduce((a,p)=>{let c=counts(p);a.items++;a.units+=c.qty;a.owned+=c.owned;a.packed+=c.packed;a.shopping+=c.shopping;if(c.packed&&(p.weight===''||p.weight==null))a.weightMissing+=c.packed;a.weight+=c.packed*(Number(p.weight)||0);return a;},{items:0,units:0,owned:0,packed:0,shopping:0,weight:0,weightMissing:0});
}
const icons=['jacket','sweater','thermals','pants','boots','gloves','goggles','helmet','toiletries','electronics','bottle','adapter','passport','suitcase','socks','scarf','hat','umbrella','sunscreen','medicines','headphones','daypack','laundry','camera','flower','ski-jacket','ski-pants','ski-socks','wallet','raincoat','toothbrush','neck-pillow','charging-cable'];
function itemIcon(p){
 if(icons.includes(p.icon))return p.icon;
 const n=String(p.name||'').toLowerCase();
 for(const [r,i] of [[/ski.?jacket|ski.?coat/,'ski-jacket'],[/ski.?pants|ski.?trousers/,'ski-pants'],[/ski.?socks/,'ski-socks'],[/neck.?pillow|travel pillow/,'neck-pillow'],[/toothbrush/,'toothbrush'],[/wallet|card holder/,'wallet'],[/charging cable|usb.?c cable/,'charging-cable'],[/raincoat|rain jacket/,'raincoat'],[/passport|visa/,'passport'],[/sock/,'socks'],[/scarf/,'scarf'],[/hat|beanie|cap/,'hat'],[/umbrella/,'umbrella'],[/sun.?screen|spf/,'sunscreen'],[/medicine|medication|first aid/,'medicines'],[/headphone|earbud/,'headphones'],[/day.?pack|backpack/,'daypack'],[/laundry|detergent/,'laundry'],[/goggle/,'goggles'],[/helmet/,'helmet'],[/glove|mitten/,'gloves'],[/thermal|base layer/,'thermals'],[/sweater|jumper|hoodie/,'sweater'],[/coat|jacket|fleece|parka/,'jacket'],[/pant|trouser|jean|legging/,'pants'],[/shoe|boot|sneaker/,'boots'],[/tooth|skin|soap|shampoo|toiletr/,'toiletries'],[/camera/,'camera'],[/phone|laptop|tablet/,'electronics'],[/charger|adapter|plug|cable/,'adapter'],[/bottle|water/,'bottle']])if(r.test(n))return i;
 return 'suitcase';
}
const art=(i)=>'<img class="pack-art" alt="" aria-hidden="true" src="/assets/icons/'+itemIcon({name:i,icon:i})+'.svg">';
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
 const outfit=state.profile.selectedOutfitId;
 if(outfit==='rain')add('Raincoat','Optional: matches your Rainy Day wardrobe','cabin luggage',1,.4);
 if(outfit==='hiking')add('Hiking boots','Optional: matches your Hiking wardrobe','checked luggage',1,1.1);
 if(outfit==='city')add('Travel wallet','Optional: convenient for city exploring','personal bag',1,.1);
 return out;
}
packingSuggestions=suggestions;
const bags=[['checked luggage','Checked suitcase','suitcase'],['cabin luggage','Cabin luggage','daypack'],['personal bag','Personal bag','daypack'],['optional','Optional / rental','helmet']];
const limitsFor=()=>state.profile.packingLimits?.[trip()?.id]||{};
const limitFor=bag=>{const value=Number(limitsFor()[bag]);return Number.isFinite(value)&&value>0?value:null};
function card(p){
 const c=counts(p),done=c.packed===c.qty;
 return '<article class="pack-card '+(done?'ready':'')+'" data-search-name="'+E(p.name.toLowerCase())+'">'+
 '<div class="pack-card-art">'+art(itemIcon(p))+'<span class="pack-seal">'+(done?'✓':c.shopping?'!':'·')+'</span></div>'+
 '<h3>'+E(p.name)+'</h3><p>'+E(p.bag||'Unassigned')+'</p>'+
 '<div class="pack-chip-row"><span>'+c.packed+'/'+c.qty+' packed</span><span>'+c.owned+'/'+c.qty+' owned</span></div>'+
 '<div class="pack-quantity"><span>Pack</span><div><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="packed" data-delta="-1" aria-label="Pack one fewer '+E(p.name)+'" '+(c.packed===0?'disabled':'')+'>−</button><output>'+c.packed+'</output><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="packed" data-delta="1" aria-label="Pack one more '+E(p.name)+'" '+(done?'disabled':'')+'>+</button></div></div>'+
 '<div class="pack-quantity"><span>Own</span><div><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="owned" data-delta="-1" aria-label="Own one fewer '+E(p.name)+'" '+(c.owned<=c.packed?'disabled':'')+'>−</button><output>'+c.owned+'</output><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="owned" data-delta="1" aria-label="Own one more '+E(p.name)+'" '+(c.owned===c.qty?'disabled':'')+'>+</button></div></div>'+
 '<div class="pack-card-actions"><button data-action="packingAll" data-id="'+E(p.id)+'">'+(done?'Unpack all':'Pack all')+'</button><button data-action="editPacking" data-id="'+E(p.id)+'">Edit</button><button data-action="deletePacking" data-id="'+E(p.id)+'">Delete</button></div></article>';
}
packingPage=function(){
 const t=trip(),list=items(),sum=totals(list),percent=sum.units?Math.round(sum.packed/sum.units*100):0;
 const show=list.filter(p=>(!filters.packBag||p.bag===filters.packBag)&&(!filters.packStatus||filters.packStatus==='packed'&&counts(p).packed===counts(p).qty||filters.packStatus==='unpacked'&&counts(p).packed<counts(p).qty||filters.packStatus==='shopping'&&counts(p).shopping>0)&&(!filters.packSearch||p.name.toLowerCase().includes(filters.packSearch.toLowerCase())));
 const suggested=suggestions(),shopping=list.filter(p=>counts(p).shopping>0);
 return '<div class="packing-v2">'+
 '<section class="packing-v2-hero"><div class="packing-hero-copy"><div class="pack-kicker">CHAPTER THREE · THE SUITCASE</div><h2>Pack a little<br><i>adventure.</i></h2><p>Every cozy layer, passport and little essential—ready for your next journey.</p><div class="pack-hero-actions"><button class="btn primary" data-action="newPacking">+ Add inventory item</button><button class="btn ghost" data-action="openWardrobe">Change outfit</button></div></div><div class="packing-v2-landscape" aria-hidden="true"></div><div id="packing-v2-avatar" class="packing-v2-avatar"></div></section>'+
 '<div class="pack-trip"><div><small>PACKING FOR</small><strong>'+E(t?.name||'Your adventure')+'</strong></div><label>Choose trip <select id="trip-select" class="field">'+state.trips.map(x=>'<option value="'+E(x.id)+'" '+(x.id===selectedTrip?'selected':'')+'>'+E(x.name)+'</option>').join('')+'</select></label><button class="btn small ghost" data-action="packExport">Export CSV</button></div>'+
 '<div class="pack-stats"><div><small>IN THE SUITCASE</small><strong>'+sum.packed+' <em>/ '+sum.units+' units</em></strong><div class="pack-meter" role="progressbar" aria-valuenow="'+percent+'" aria-valuemin="0" aria-valuemax="100" aria-label="Units packed"><span style="width:'+percent+'%"></span></div><p>'+percent+'% packed · '+sum.items+' types of items</p></div><div><small>STILL TO BUY</small><strong>'+sum.shopping+' <em>units</em></strong><p>Owned is different from packed</p></div><div><small>ESTIMATED PACKED WEIGHT</small><strong>'+sum.weight.toFixed(1)+' <em>kg</em></strong><p>'+(sum.weightMissing?sum.weightMissing+' packed units lack weights · ':'')+'Personal target: '+E(state.profile.weightTarget||'not set')+' kg</p></div></div>'+
 '<div class="pack-section-head pack-bag-heading"><span>01 / YOUR BAGS</span><small>Tap a bag to filter its contents</small><button class="btn small ghost" data-action="packLimits">Set bag limits</button></div><div class="pack-bags">'+bags.map(([key,name,icon])=>{const s=totals(list.filter(p=>p.bag===key)),p=s.units?Math.round(s.packed/s.units*100):0,limit=limitFor(key),over=limit!==null&&s.weight>limit;return '<button data-action="packBagTab" data-value="'+key+'" aria-pressed="'+(filters.packBag===key)+'" class="'+(filters.packBag===key?'selected':'')+(over?' pack-overweight':'')+'">'+art(icon)+'<span><b>'+name+'</b><small>'+s.packed+' / '+s.units+' packed</small><small class="pack-bag-weight">'+s.weight.toFixed(1)+' kg'+(limit?' / '+limit+' kg limit':' · no limit set')+(s.weightMissing?' · '+s.weightMissing+' without weight':'')+'</small>'+(over?'<strong class="pack-warning">Over your saved limit</strong>':'')+'</span><i><span style="width:'+p+'%"></span></i></button>'}).join('')+'</div>'+
 '<div class="pack-section-head"><span>02 / YOUR INVENTORY</span><small>Little things, neatly organized</small></div><div class="pack-filters"><input id="pack-search" type="search" placeholder="Find an item…" aria-label="Search your packing list" value="'+E(filters.packSearch||'')+'"><select id="pack-status" class="field" aria-label="Filter status"><option value="">All statuses</option><option value="unpacked" '+(filters.packStatus==='unpacked'?'selected':'')+'>Still to pack</option><option value="packed" '+(filters.packStatus==='packed'?'selected':'')+'>Fully packed</option><option value="shopping" '+(filters.packStatus==='shopping'?'selected':'')+'>Need to buy</option></select><button class="btn small ghost" data-action="packClear">Clear filters</button></div>'+
 '<div class="packing-v2-grid">'+(show.map(card).join('')||'<div class="pack-none"><img src="/assets/icons/suitcase.svg" alt=""><h3>Room for adventures</h3><p>'+(list.length?'No items match the selected filters.':'Add your first item or try a suggestion below.')+'</p><button class="btn small primary" data-action="newPacking">Add item</button></div>')+'</div>'+
 '<div class="pack-section-head"><span>03 / SHOPPING NOTES</span><small>What you still need to buy</small></div>'+(shopping.length?'<div class="pack-shopping">'+shopping.map(p=>'<div>'+art(itemIcon(p))+'<span>'+E(p.name)+'</span><strong>'+counts(p).shopping+' needed</strong><button data-action="packingAdjust" data-id="'+E(p.id)+'" data-field="owned" data-delta="1">Bought one</button></div>').join('')+'</div>':'<div class="pack-quiet">✦ Nothing on your shopping list right now.</div>')+
 '<div class="pack-section-head"><span>04 / SUGGESTED FOR THIS TRIP</span><small>Optional · accept only what you need</small></div>'+(suggested.length?'<div class="pack-suggestions">'+suggested.map((s,i)=>'<article>'+art(itemIcon(s))+'<div><h3>'+E(s.name)+'</h3><p>'+E(s.reason)+' · quantity '+s.qty+'</p><button class="btn small primary" data-action="acceptPacking" data-index="'+i+'">+ Add</button><button class="btn small ghost" data-action="dismissPacking" data-index="'+i+'">Dismiss</button></div></article>').join('')+'</div>':'<div class="pack-quiet">✦ No new suggestions for this trip.</div>')+
 '</div>';
};
packingForm=function(record){
 const p=record||{},c=counts(p),i=itemIcon(p);
 modal(record?'Edit inventory item':'New packing item',
 field('name','Item name',p.name||'','text','required maxlength="100"')+
 selectField('icon','Illustration',[{id:'',name:'Choose automatically'},...icons.map(k=>({id:k,name:k}))],p.icon&&icons.includes(p.icon)?p.icon:'')+
 field('qty','Quantity needed',c.qty,'number','min="1" max="999" step="1" required')+
 field('ownedQty','Quantity owned',c.owned,'number','min="0" max="999" step="1" required')+
 field('packedQty','Quantity packed',c.packed,'number','min="0" max="999" step="1" required')+
 field('weight','Weight per unit (kg)',p.weight||'','number','min="0" max="99" step="0.01"')+
 selectField('bag','Bag',bags.map(x=>x[0]),p.bag||'checked luggage')+
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
 if(field==='packed'){p.packedQty=Math.max(0,Math.min(c.qty,c.packed+change));p.ownedQty=Math.max(c.owned,p.packedQty)}
 else if(field==='owned'){p.ownedQty=Math.max(c.packed,Math.min(c.qty,c.owned+change));p.packedQty=c.packed}
 sync(p);save();
};
actions.packingAll=({id})=>{const p=state.packing.find(p=>p.id===id);if(!p)return;const c=counts(p);p.packedQty=c.packed===c.qty?0:c.qty;p.ownedQty=Math.max(c.owned,p.packedQty);sync(p);save();if(p.status==='packed')toast('Everything packed! ✦')};
actions.packClear=()=>{filters.packBag='';filters.packStatus='';filters.packSearch='';render()};
actions.packBagTab=({value})=>{filters.packBag=filters.packBag===value?'':value;render()};
actions.acceptPacking=({index})=>{const s=suggestions()[Number(index)];if(!s)return;state.packing.push(sync({id:id(),name:s.name,icon:itemIcon(s),qty:s.qty,ownedQty:0,packedQty:0,weight:s.weight,bag:s.bag,tripId:trip().id,notes:'Suggested: '+s.reason}));save();toast('Added to your inventory')};
actions.dismissPacking=({index})=>{const s=suggestions()[Number(index)];if(!s)return;state.dismissed.push('pack:'+trip().id+':'+s.key);save()};
document.addEventListener('change',e=>{if(e.target?.matches?.('[data-pack-check]')){e.stopImmediatePropagation();actions.packingAll({id:e.target.dataset.packCheck})}},true);
document.addEventListener('input',e=>{if(e.target.id!=='pack-search')return;const q=e.target.value.trim().toLowerCase();filters.packSearch=q;let shown=0;document.querySelectorAll('.pack-card').forEach(c=>{c.hidden=!c.dataset.searchName.includes(q);if(!c.hidden)shown++});document.querySelector('.packing-v2-grid')?.setAttribute('data-empty-search',String(!shown))});
const oldEnhance=window.pixelPassportEnhance;
window.pixelPassportEnhance=function(){if(typeof oldEnhance==='function')oldEnhance();if(page==='packing'&&window.PPReact?.renderWidget){const node=document.querySelector('#packing-v2-avatar');if(node)window.PPReact.renderWidget(node,'TravelerAvatar',{mode:'luggage',motion:state.profile.ambientMotion!=='off'})}};
window.PPPackingModel={counts,totals,suggestions,items,limitsFor,itemIcon};
if(page==='packing')render();
})();
