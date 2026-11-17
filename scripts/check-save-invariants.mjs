import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const sandbox={URL,structuredClone};
vm.runInNewContext(readFileSync(new URL('../dist/data-safety.js',import.meta.url),'utf8'),sandbox);
const model=sandbox.PPData;
const fixture=()=>({version:1,profile:{name:'Test traveler',baseCurrency:'SGD',selectedTripId:'t1'},
 trips:[{id:'t1',name:'First trip'},{id:'t2',name:'Second trip'}],
 destinations:[{id:'d1',name:'Chur',country:'Switzerland',tripId:'t1',order:0,lat:46.85,lng:9.53},{id:'d2',name:'Davos',country:'Switzerland',tripId:'t1',order:1},{id:'d3',name:'Zurich',country:'Switzerland',tripId:'t2',order:0}],
 expenses:[{id:'e1',title:'Stay',tripId:'t1',destinationId:'d1',amount:'200',currency:'SGD'},{id:'e2',title:'General fare',tripId:'t1',destinationId:'',amount:'50',currency:'SGD'}],
 bookings:[{id:'b1',provider:'Stay',tripId:'t1',destinationId:'d1',expenseId:'e1'},{id:'b2',provider:'Fare',tripId:'t1',destinationId:'d1',expenseId:'e2'},{id:'b3',provider:'Shared cost',tripId:'t1',destinationId:'d2',expenseId:'e1'}],
 activities:[{id:'a1',title:'Explore',tripId:'t1',destinationId:'d1'},{id:'a2',title:'Flexible',destinationId:'d1'}],
 journal:[{id:'j1',title:'Memory',tripId:'t1',destinationId:'d1'}],tasks:[],packing:[],skiTrips:[],transfers:[],dismissed:[],rates:null});
const portable=x=>JSON.parse(JSON.stringify(x));
test('destination move carries journal and imported activity trip links',()=>{
 const before=fixture(),next=structuredClone(before);model.moveDestinationTrip(next,next.destinations[0],'t2');
 assert.equal(next.journal[0].tripId,'t2');assert.equal(next.activities[0].tripId,'t2');
 assert.equal(Object.hasOwn(next.activities[1],'tripId'),false);assert.equal(before.destinations[0].tripId,'t1');
});
test('destination move identifies invalid expense links in both directions without moving unrelated records',()=>{
 const before=fixture(),next=structuredClone(before);model.validateBackup(before);model.moveDestinationTrip(next,next.destinations[0],'t2');
 assert.deepEqual(portable(model.detachMovedExpenseLinks(next,before)).map(x=>x.bookingId).sort(),['b2','b3']);
 assert.equal(next.bookings[0].expenseId,'e1');assert.equal(next.expenses[1].tripId,'t1');assert.deepEqual(next.expenses.map(e=>e.amount),['200','50']);
 assert.equal(next.bookings.length,before.bookings.length);assert.equal(next.expenses.length,before.expenses.length);
 model.validateBackup(JSON.parse(JSON.stringify(next)));assert.equal(model.detachMovedExpenseLinks(next,before).length,0);
});
test('trip deletion rehomes imported activity links without stranding records',()=>{
 const next=fixture();next.trips=next.trips.filter(t=>t.id!=='t1');model.rehomeTrip(next,'t1');
 assert.equal(next.activities[0].tripId,'t2');assert.equal(next.journal[0].tripId,'t2');assert.equal(next.bookings.length,3);assert.equal(next.expenses.length,2);model.validateBackup(next);
});
test('direct expense move only detaches affected booking references',()=>{
 const before=fixture(),next=structuredClone(before);next.expenses[0].tripId='t2';next.expenses[0].destinationId='d3';
 assert.deepEqual(portable(model.detachMovedExpenseLinks(next,before)).map(x=>x.bookingId),['b1','b3']);assert.equal(next.bookings[1].expenseId,'e2');model.validateBackup(next);
});
test('direct booking move leaves its former expense in place',()=>{
 const before=fixture(),next=structuredClone(before);Object.assign(next.bookings[0],{tripId:'t2',destinationId:'d3'});
 assert.equal(model.detachMovedExpenseLinks(next,before).length,1);assert.equal(next.expenses[0].tripId,'t1');assert.equal(next.bookings[0].expenseId,'');model.validateBackup(next);
});
test('unchanged relationships and missing IDs are not silently repaired',()=>{
 const before=fixture(),next=structuredClone(before);assert.equal(model.detachMovedExpenseLinks(next,before).length,0);assert.deepEqual(next,before);
 next.bookings[0].expenseId='missing';assert.equal(model.detachMovedExpenseLinks(next,before).length,0);assert.throws(()=>model.validateBackup(next),/unknown expense/);
});
test('new arbitrary cross-trip links are rejected rather than silently unlinked',()=>{
 const before=fixture(),next=structuredClone(before);next.bookings.push({id:'bad',tripId:'t2',destinationId:'d3',expenseId:'e1'});
 assert.equal(model.detachMovedExpenseLinks(next,before).length,0);assert.throws(()=>model.validateBackup(next),/different trip/);
});
function harness(approve=true){
 const h={URL,structuredClone,AbortController,setTimeout,clearTimeout,state:fixture(),selectedTrip:'t1',selectedDestination:'d1',actions:{},navigator:{onLine:true},window:{PPData:model,addEventListener(){}},document:{getElementById(){return null;},querySelector(){return null;},addEventListener(){}},closeModal(){},destinationForm(){},download(){},toast(){},confirm(){h.confirmations++;return approve;},confirmations:0,writes:0,persisted:null};
 h.durableState=structuredClone(h.state);h.save=function(){h.writes++;h.persisted=JSON.stringify(h.state);h.durableState=structuredClone(h.state);return true;};
 vm.runInNewContext(readFileSync(new URL('../dist/reliability.js',import.meta.url),'utf8'),h);return h;
}
test('real save boundary rejects whitespace-only titles and rolls back in place',()=>{
 const h=harness(),record=h.state.trips[0];record.name='   ';assert.throws(()=>h.save(),/Missing name/);assert.equal(h.writes,0);assert.equal(h.state.trips[0],record);assert.equal(record.name,'First trip');
 record.name='Corrected';assert.equal(h.save(),true);assert.equal(h.writes,1);model.validateBackup(JSON.parse(h.persisted));
});
test('real save boundary rejects negative settings before storage',()=>{
 const h=harness();h.state.profile.weightTarget=-5;assert.throws(()=>h.save(),/weightTarget/);assert.equal(h.writes,0);assert.equal(h.state.profile.weightTarget,undefined);
});
test('real save boundary refuses malformed relationships without affecting durable records',()=>{
 const h=harness();h.state.bookings[0].expenseId='not-found';assert.throws(()=>h.save(),/unknown expense/);assert.equal(h.writes,0);assert.equal(h.state.bookings[0].expenseId,'e1');
});
test('cancelled link reconciliation neither writes nor discards a record',()=>{
 const h=harness(false),before=structuredClone(h.state);model.moveDestinationTrip(h.state,h.state.destinations[0],'t2');
 assert.throws(()=>h.save(),/cancelled/);assert.equal(h.confirmations,1);assert.equal(h.writes,0);assert.deepEqual(h.state,before);model.validateBackup(h.state);
});
test('confirmed move saves reopenable state exactly once',()=>{
 const h=harness();model.moveDestinationTrip(h.state,h.state.destinations[0],'t2');assert.equal(h.save(),true);assert.equal(h.confirmations,1);assert.equal(h.writes,1);
 const saved=JSON.parse(h.persisted);model.validateBackup(saved);assert.equal(saved.bookings.length,3);assert.equal(saved.expenses.length,2);assert.equal(saved.journal[0].tripId,'t2');
});
test('ordinary valid edits do not request link confirmation',()=>{
 const h=harness();h.state.trips[0].name='New name';h.save();assert.equal(h.writes,1);assert.equal(h.confirmations,0);model.validateBackup(JSON.parse(h.persisted));
});
