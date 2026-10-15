import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const tripA='exchange',tripB='family';
const state={
  profile:{weightTarget:20,ambientMotion:'off'},
  trips:[{id:tripA,name:'Europe Exchange',start:'2027-01-13'},{id:tripB,name:'Family Trip',start:'2027-05-22'}],
  destinations:[{id:'swiss',tripId:tripA,country:'Switzerland',name:'St Gallen'}],
  activities:[],skiTrips:[],
  packing:[
    {id:'legacy',name:'Warm coat',tripId:tripA,qty:2,status:'packed',bag:'checked luggage',weight:1.1},
    {id:'family',name:'Sunscreen SPF 50',tripId:tripB,qty:1,status:'needed',bag:'personal bag'}
  ],
  dismissed:[]
};
let saveCount=0,onSave=null,lastDownload=null,lastSaveOptions=null;
const listeners={};
const context={structuredClone,
  state,selectedTrip:tripA,page:'tasks',filters:{},actions:{},
  window:{PPReact:null,pixelPassportEnhance:null,PPAvatarUI:{setup(){}}},
  document:{querySelector:()=>null,addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn)},
  packingPage(){},packingForm(record){return context.window.PPPackingForm(record)},packingSuggestions(){return []},
  save(options){saveCount++;lastSaveOptions=options},render(){},download:(name,content,type)=>{lastDownload={name,content,type}},
  toast(){},esc:x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
  field:()=>'',selectField:()=>'',textField:()=>'',modal:(title,html,fn)=>{onSave=fn},
  id:()=>('test-'+Math.random().toString(36).slice(2))
};
vm.runInNewContext(readFileSync(new URL('../dist/packing-model.js',import.meta.url),'utf8'),context);
vm.runInNewContext(readFileSync(new URL('../dist/packing-upgrade.js',import.meta.url),'utf8'),context,{filename:'packing-upgrade.js'});
const {counts,totals,suggestions,items,limitsFor,itemIcon}=context.window.PPPackingModel;
assert.equal(itemIcon({name:'Ski jacket'}),'ski-jacket');
assert.equal(itemIcon({name:'Ski socks'}),'ski-socks');
assert.equal(itemIcon({name:'Raincoat'}),'raincoat');
assert.equal(counts(state.packing[0]).packed,2,'migrate old fully packed item');
assert.equal(counts(state.packing[0]).owned,2,'old packed item is owned');
assert.equal(items().length,1,'do not include another trip in inventory');
assert.equal(totals(items()).weight,2.2);
assert.ok(suggestions().some(s=>s.name==='Thermal base layers'),'winter suggestion for winter trip');
assert.ok(!suggestions().some(s=>s.name==='Warm coat'),'avoid existing items');
assert.ok(!suggestions().some(s=>s.name==='Sunscreen SPF 50'),'do not leak a summer suggestion into winter');
assert.match(context.window.PPPackingPage(),/CHAPTER THREE/);
context.actions.packingAll({id:'legacy'});
assert.equal(counts(state.packing[0]).packed,0,'unpack all resets packed only');
assert.equal(counts(state.packing[0]).owned,2,'unpack all retains owned quantity');
context.actions.packingAdjust({id:'legacy',field:'packed',delta:1});
assert.equal(counts(state.packing[0]).packed,1);
context.actions.packingAdjust({id:'legacy',field:'owned',delta:-1});
assert.equal(counts(state.packing[0]).owned,1);
context.actions.packingAdjust({id:'legacy',field:'owned',delta:-1});
assert.equal(counts(state.packing[0]).owned,1,'cannot own less than packed');
context.actions.newPacking();
onSave({name:'Ski socks',qty:'5',ownedQty:'3',packedQty:'2',weight:'0.1',icon:'socks',tripId:tripA,bag:'checked luggage'});
const sock=state.packing.find(p=>p.name==='Ski socks');
assert.equal(counts(sock).packed,2);
assert.equal(counts(sock).shopping,2);
assert.equal(totals([sock]).weightMissing,0);
const missingWeight={name:'Unweighed',qty:3,ownedQty:2,packedQty:2,status:'purchased'};
assert.equal(totals([missingWeight]).weightMissing,2,'missing weight must be reported, not silently treated as measured');
context.actions.packLimits();
onSave({limitChecked:'0.2',limitCabin:'8',limitPersonal:''});
assert.equal(limitsFor()['checked luggage'],0.2,'selected trip limit persists in profile');
assert.equal(limitsFor()['personal bag'],undefined,'blank limits remain unknown');
context.actions.packExport();
assert.match(lastDownload.name,/pixel-passport-europe-exchange-packing.csv/);
assert.match(lastDownload.content,/Ski socks/);
assert.match(lastDownload.content,/"2"/);

assert.equal(sock.status,'needed');
context.actions.newPacking(); // Restore the inventory form after testing the separate luggage-limits modal.
assert.throws(()=>onSave({name:'Bad',qty:'5',ownedQty:'2',packedQty:'4',weight:'0',tripId:tripA}),/Packed quantity cannot exceed owned/);
context.actions.packingAdjust({id:sock.id,field:'owned',delta:1});
assert.equal(counts(sock).shopping,1);
context.actions.packingAdjust({id:sock.id,field:'packed',delta:1});
assert.equal(counts(sock).packed,3);
const proposed=suggestions().find(s=>s.name==='Thermal base layers');
assert.ok(proposed);
context.actions.acceptPacking({index:suggestions().findIndex(s=>s.name==='Thermal base layers')});
assert.ok(state.packing.find(p=>p.name==='Thermal base layers'&&p.tripId===tripA));
assert.equal(suggestions().filter(s=>s.name==='Thermal base layers').length,0);
context.selectedTrip=tripB;
assert.equal(items().length,1,'second trip list preserved');
assert.equal(limitsFor()['checked luggage'],undefined,'another trip cannot inherit baggage limits');
assert.ok(suggestions().some(s=>s.name==='Sun hat'),'summer suggestion for May family trip');
assert.ok(!suggestions().some(s=>s.name==='Thermal base layers'),'no winter clothes suggested for May family trip');
assert.ok(saveCount>=4);

const unowned={id:'unowned',name:'New gloves',tripId:tripA,qty:2,ownedQty:0,packedQty:0,status:'needed'};
state.packing.push(unowned);context.selectedTrip=tripA;
context.actions.packingAdjust({id:'unowned',field:'packed',delta:1});assert.equal(counts(unowned).packed,0);assert.equal(counts(unowned).owned,0);
context.actions.packingAll({id:'unowned'});assert.equal(counts(unowned).packed,0,'packing never invents ownership');
context.actions.packingAdjust({id:'unowned',field:'owned',delta:1});assert.equal(counts(unowned).packed,0,'purchasing does not pack');
context.actions.packingAdjust({id:'unowned',field:'packed',delta:1});assert.equal(counts(unowned).packed,1);context.actions.packingAll({id:'unowned'});assert.equal(counts(unowned).packed,0,'unpack all available units even when not all needed units are owned');assert.equal(counts(unowned).owned,1);
context.actions.packingAdjust({id:'unowned',field:'qty',delta:1});assert.equal(counts(unowned).qty,3);
context.actions.packDelete({id:'unowned'});assert.ok(!state.packing.some(p=>p.id==='unowned'));context.actions.packUndo();assert.equal(state.packing.filter(p=>p.id==='unowned').length,1);
const legacyRead={id:'untouched',qty:'3',status:'purchased'};const unchanged=JSON.stringify(legacyRead);assert.equal(counts(legacyRead).owned,3);assert.equal(JSON.stringify(legacyRead),unchanged,'migration reads do not rewrite user records');

// All seven outfit choices produce explicit suggestions on an otherwise empty trip.
context.selectedTrip=tripB;context.filters.packIncludeOutfit=true;
const previousPacking=state.packing;state.packing=[];
for(const [outfit,expected] of Object.entries({casual:'Walking shoes',winter:'Warm coat',ski:'Ski jacket',summer:'Sun hat',rain:'Raincoat',hiking:'Hiking boots',city:'Travel wallet'})){state.profile.selectedOutfitId=outfit;const proposed=suggestions();assert.ok(proposed.some(p=>p.name===expected),'specific clothing suggestion for '+outfit);assert.equal(new Set(proposed.map(p=>p.name)).size,proposed.length)}
state.packing=previousPacking;context.selectedTrip=tripA;
context.actions.packingAdjust({id:'unowned',field:'qty',delta:1});
assert.equal(lastSaveOptions.render,false,'inline quantities use a local update rather than a full app render');
assert.equal(context.window.PPPackingModel.activeBag([{id:'x',name:'Packed',qty:2,ownedQty:2,packedQty:2,bag:'cabin luggage'},{id:'y',name:'Not packed',qty:9,bag:'checked luggage'}]),'cabin luggage');
context.filters.packBag='personal bag';assert.equal(context.window.PPPackingModel.activeBag([]),'personal bag');
console.log('Packing model tests passed: migration, partial quantities, owned vs packed, trip isolation, suggestions, and item validation.');
