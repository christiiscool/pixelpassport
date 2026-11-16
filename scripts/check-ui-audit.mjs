import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const context={window:{},URL,Date,Set,Number,Object,Math};
vm.runInNewContext(readFileSync(new URL('../dist/data-safety.js',import.meta.url),'utf8'),context);
const data=context.window.PPData;
const makeState=()=>({
  version:1, profile:{baseCurrency:'SGD',selectedTripId:'old'},
  trips:[{id:'new',name:'New trip'}],
  destinations:[{id:'paris',tripId:'old',order:0}],
  activities:[{id:'walk',destinationId:'paris'}],
  tasks:[{id:'task',tripId:'old',destinationId:'paris'}],
  expenses:[{id:'cost',tripId:'old',destinationId:'paris',amount:'111',currency:'USD',baseAmount:150,baseCurrency:'SGD',conversionRate:150/111}],
  bookings:[{id:'booking',tripId:'old',destinationId:'paris',expenseId:'cost'}],
  skiTrips:[{id:'ski',tripId:'old',destinationId:'paris'}],
  packing:[{id:'pack',tripId:'old'}],
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
console.log('UI/data audit checks passed');
