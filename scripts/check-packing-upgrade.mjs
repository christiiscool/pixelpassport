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
let saveCount=0,onSave=null;
const listeners={};
const context={
  state,selectedTrip:tripA,page:'tasks',filters:{},actions:{},
  window:{PPReact:null,pixelPassportEnhance:null},
  document:{addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn)},
  packingPage(){},packingForm(){},packingSuggestions(){return []},
  save(){saveCount++},render(){},
  toast(){},esc:x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
  field:()=>'',selectField:()=>'',textField:()=>'',modal:(title,html,fn)=>{onSave=fn},
  id:()=>('test-'+Math.random().toString(36).slice(2))
};
vm.runInNewContext(readFileSync(new URL('../dist/packing-upgrade.js',import.meta.url),'utf8'),context,{filename:'packing-upgrade.js'});
const {counts,totals,suggestions,items}=context.window.PPPackingModel;
assert.equal(counts(state.packing[0]).packed,2,'migrate old fully packed item');
assert.equal(counts(state.packing[0]).owned,2,'old packed item is owned');
assert.equal(items().length,1,'do not include another trip in inventory');
assert.equal(totals(items()).weight,2.2);
assert.ok(suggestions().some(s=>s.name==='Thermal base layers'),'winter suggestion for winter trip');
assert.ok(!suggestions().some(s=>s.name==='Warm coat'),'avoid existing items');
assert.ok(!suggestions().some(s=>s.name==='Sunscreen SPF 50'),'do not leak a summer suggestion into winter');
assert.match(context.packingPage(),/CHAPTER THREE/);
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
assert.equal(sock.status,'needed');
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
assert.ok(suggestions().some(s=>s.name==='Sun hat'),'summer suggestion for May family trip');
assert.ok(!suggestions().some(s=>s.name==='Thermal base layers'),'no winter clothes suggested for May family trip');
assert.ok(saveCount>=4);
console.log('Packing model tests passed: migration, partial quantities, owned vs packed, trip isolation, suggestions, and item validation.');
