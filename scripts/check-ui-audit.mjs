import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const context={window:{},URL,Date,Set,Number,Object,Math};
vm.runInNewContext(readFileSync(new URL('../dist/data-safety.js',import.meta.url),'utf8'),context);
const data=context.window.PPData;
const makeState=()=>({
  version:1, profile:{baseCurrency:'SGD',selectedTripId:'old'},
  trips:[{id:'new',name:'New trip'}],
  destinations:[{id:'paris',tripId:'old',order:0,name:'Paris',country:'France'}],
  activities:[{id:'walk',destinationId:'paris',title:'Walk'}],
  tasks:[{id:'task',tripId:'old',destinationId:'paris',title:'Book tour'}],
  expenses:[{id:'cost',title:'Train',tripId:'old',destinationId:'paris',amount:'111',currency:'USD',baseAmount:150,baseCurrency:'SGD',conversionRate:150/111}],
  bookings:[{id:'booking',tripId:'old',destinationId:'paris',expenseId:'cost'}],
  skiTrips:[{id:'ski',tripId:'old',destinationId:'paris',resort:'Alps'}],
  packing:[{id:'pack',tripId:'old',name:'Jacket'}],
  transfers:[{id:'train',tripId:'old',origin:'Paris',destination:'Rome',date:'2027-02-20'}],
  journal:[], dismissed:[]
});
const state=makeState();
assert.equal(data.rehomeTrip(state,'old'),'new');
for(const key of ['destinations','tasks','expenses','bookings','skiTrips','packing','transfers'])assert.equal(state[key][0].tripId,'new',key);
assert.equal(state.profile.selectedTripId,'new');
state.trips.push({id:'third',name:'Third'});
assert.equal(data.moveDestinationTrip(state,state.destinations[0],'third'),true);
for(const key of ['tasks','expenses','bookings','skiTrips'])assert.equal(state[key][0].tripId,'third',key);
assert.equal(state.packing[0].tripId,'new','unrelated packing is not moved');
state.profile.baseCurrency='EUR';
state.rates={USD:1.11};
state.ratesUpdated='2026-11-16T00:00:00Z';
const result=data.reconcileCurrencies(state);
assert.equal(result.converted,1);
assert.equal(state.expenses[0].baseAmount,100);
assert.equal(state.expenses[0].currency,'USD');
assert.equal(state.expenses[0].conversionHistory[0].baseCurrency,'SGD');
assert.equal(data.reconcileCurrencies(state).converted,0,'no duplicate revaluation');
let backup=makeState();backup.trips.unshift({id:'old',name:'Old trip'});
assert.equal(data.validateBackup(backup).transfers.length,1);
delete backup.transfers;assert.equal(data.validateBackup(backup).transfers.length,0,'v1 backups still import');
backup=makeState();backup.trips.unshift({id:'old',name:'Old trip'});backup.transfers[0].date='bad';
assert.throws(()=>data.validateBackup(backup),/Invalid transfer date/);
backup=makeState();backup.trips.unshift({id:'old',name:'Old trip'});backup.transfers[0].tripId='missing';
assert.throws(()=>data.validateBackup(backup),/unknown trip/);
// Route movement is deterministic and never collides with stop IDs from other trips.
let route={
 trips:[{id:'a',name:'A'},{id:'b',name:'B'}],
 profile:{selectedTripId:'a'},
 destinations:[
  {id:'a1',tripId:'a',order:0},
  {id:'a2',tripId:'a',order:0},
  {id:'a3',tripId:'a',order:20},
  {id:'b1',tripId:'b',order:0},
  {id:'b2',tripId:'b',order:1}
 ],
 bookings:[],expenses:[],tasks:[],skiTrips:[],packing:[],transfers:[],journal:[]
};
const unique=(trip)=>{const orders=route.destinations.filter(d=>d.tripId===trip).map(d=>d.order);assert.equal(new Set(orders).size,orders.length);};
assert.equal(data.normalizeRoute(route,'a').length,3,'normalize all stops');
unique('a');
assert.equal(data.reorderDestination(route,'a3',-1),true);
assert.deepEqual(data.normalizeRoute(route,'a').map(d=>d.id),['a1','a3','a2']);
assert.equal(data.reorderDestination(route,'a1',-1),false,'cannot move outside bounds');
assert.equal(data.reorderDestination(route,'a1',100),false,'cannot move beyond route');
assert.equal(data.moveDestinationTrip(route,route.destinations.find(d=>d.id==='a1'),'b'),true);
assert.deepEqual(data.normalizeRoute(route,'b').map(d=>d.id),['b1','b2','a1']);
unique('a');unique('b');
route.trips.splice(0,1);assert.equal(data.rehomeTrip(route,'a'),'b');
assert.deepEqual(data.normalizeRoute(route,'b').map(d=>d.id),['b1','b2','a1','a3','a2']);
unique('b');
assert.equal(route.profile.selectedTripId,'b');
console.log('Route order normalization, reordering, and migration passed');
// Imported/legacy locations may lack coordinates: never render them as valid map pins.
assert.equal(data.hasCoordinates({lat:46.85,lng:9.53}),true);
assert.equal(data.hasCoordinates({lat:0,lng:0}),true,'zero coordinates are valid');
assert.equal(data.hasCoordinates({lat:'',lng:9.53}),false);
assert.equal(data.hasCoordinates({lat:46.85,lng:null}),false);
assert.equal(data.hasCoordinates({lat:91,lng:10}),false);
assert.equal(data.hasCoordinates({lat:46,lng:'not a number'}),false);
const invalidBudget=makeState();
invalidBudget.trips.unshift({id:'old',name:'Old trip',budgetCurrency:'XYZ'});
assert.throws(()=>data.validateBackup(invalidBudget),/Invalid trip budget currency/);
invalidBudget.trips[0].budgetCurrency='SGD';
invalidBudget.profile.exchangeBudgetCurrency='EUR';
assert.equal(data.validateBackup(invalidBudget).profile.exchangeBudgetCurrency,'EUR');
invalidBudget.profile.exchangeBudgetCurrency='XYZ';
assert.throws(()=>data.validateBackup(invalidBudget),/Invalid exchange budget currency/);
console.log('Map location validation and budget currency protections passed');
console.log('UI/data audit checks passed');
