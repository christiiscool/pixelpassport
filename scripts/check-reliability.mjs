import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const sandbox={URL,structuredClone};
vm.runInNewContext(readFileSync(new URL('../dist/data-safety.js',import.meta.url),'utf8'),sandbox);
const model=sandbox.PPData;
const make=()=>({version:1,profile:{name:'Test traveler',baseCurrency:'SGD',selectedTripId:'t2'},
 trips:[{id:'t1',name:'First',start:'2028-02-29',end:'2028-03-01'},{id:'t2',name:'Second'}],
 destinations:[{id:'d1',name:'First stop',country:'Switzerland',tripId:'t1',lat:0,lng:0},{id:'d2',name:'Second stop',country:'Italy',tripId:'t2'}],
 activities:[{id:'a1',destinationId:'d1',title:'Lunch',date:'2028-02-29',time:'12:30'}],
 tasks:[],packing:[{id:'p1',name:'Socks',tripId:'t1',qty:'3',ownedQty:2,packedQty:1}],
 expenses:[{id:'e1',title:'Lunch',tripId:'t1',destinationId:'d1',amount:'20',currency:'SGD'}],
 bookings:[{id:'b1',tripId:'t1',destinationId:'d1',expenseId:'e1',cost:'20'}],
 skiTrips:[],journal:[],transfers:[{id:'f1',tripId:'t1',origin:'A',destination:'B',date:'2028-02-29'}],rates:null,dismissed:[]});
test('valid backup and unknown extension fields round-trip without mutation',()=>{
 const data=make();data.extra={format:'future-extension'};const before=JSON.stringify(data);
 assert.equal(model.validateBackup(data).extra.format,'future-extension');assert.equal(JSON.stringify(data),before);
});
test('legacy backups can omit transfers and optional dates/coordinates',()=>{
 const data=make();delete data.transfers;delete data.packing[0].packedQty;delete data.packing[0].ownedQty;
 assert.equal(model.validateBackup(data).transfers.length,0);
});
const invalid=[
 ['unsafe record ID',s=>s.trips[0].id='bad" onmouseover="alert(1)',/record ID/],
 ['duplicate ID',s=>s.trips.push({...s.trips[0]}),/duplicate/],
 ['non-array trips',s=>s.trips={},/collection: trips/],
 ['impossible calendar date',s=>s.activities[0].date='2027-02-31',/Invalid date/],
 ['non-leap year',s=>s.activities[0].date='2027-02-29',/Invalid date/],
 ['transfer date rollover',s=>s.transfers[0].date='2027-04-31',/Invalid transfer date/],
 ['reversed journey dates',s=>s.trips[0].end='2028-02-28',/End date precedes/],
 ['invalid time',s=>s.activities[0].time='24:05',/Invalid time/],
 ['negative amount',s=>s.expenses[0].amount=-20,/Invalid amount/],
 ['boolean amount',s=>s.expenses[0].amount=false,/Invalid amount/],
 ['fractional packing units',s=>s.packing[0].qty=3.5,/Invalid qty/],
 ['overpacked units',s=>s.packing[0].packedQty=3,/exceeds owned/],
 ['missing linked trip',s=>s.expenses[0].tripId='missing',/unknown trip/],
 ['missing linked destination',s=>s.activities[0].destinationId='missing',/unknown destination/],
 ['missing linked expense',s=>s.bookings[0].expenseId='missing',/unknown expense/],
 ['cross-trip destination',s=>s.bookings[0].destinationId='d2',/different trip/],
 ['cross-trip linked expense',s=>{s.expenses[0].tripId='t2';s.expenses[0].destinationId='d2';},/different trip/],
 ['bad conversion history shape',s=>s.expenses[0].conversionHistory={},/conversion history/],
 ['invalid coordinates',s=>s.destinations[0].lat=91,/coordinates/],
 ['unsupported currency',s=>s.expenses[0].currency='XYZ',/currency/],
 ['dangerous nested keys',s=>s.extra=JSON.parse('{"__proto__":{"polluted":true}}'),/Invalid backup key/],
 ['circular data',s=>s.extra=s,/circular/],
 ['excessive nesting',s=>{let p=s;for(let i=0;i<40;i++){p.extra={};p=p.extra;}},/nesting/]
];
for(const [name,mutate,pattern] of invalid)test('reject '+name,()=>{const data=make();mutate(data);assert.throws(()=>model.validateBackup(data),pattern);});
test('date checks accept leap days but not rollover or partial dates',()=>{
 for(const date of ['2028-02-29','2027-12-31','2000-02-29'])assert.equal(model.validDate(date),true);
 for(const date of ['2027-02-29','1900-02-29','2027-13-01','2027-1-01','',null])assert.equal(model.validDate(date),false);
});
test('recurrences never repair an invalid source date silently',()=>{
 assert.equal(model.successor({id:'x',done:true,due:'2027-02-31',recurrence:'weekly'},[],'y'),null);
 assert.equal(model.successor({id:'x',done:true,due:'2028-01-31',recurrence:'monthly'},[],'y').due,'2028-02-29');
});
test('rates preserve a valid base and reject invalid service payloads',()=>{
 assert.equal(model.validateRates({result:'success',base_code:'SGD',rates:{SGD:1,EUR:.6,USD:.75}},'SGD').USD,.75);
 for(const payload of [{result:'error'}, {result:'success',rates:{SGD:2}}, {result:'success',rates:{SGD:1,EUR:0}}, {result:'success',rates:{SGD:1,EUR:false}}, {result:'success',base_code:'USD',rates:{SGD:1}}, {result:'success',rates:{SGD:1,EUR:[]}}])assert.throws(()=>model.validateRates(payload,'SGD'));
});
test('invalid rates are never used in direct expense conversions',()=>{
 const values={amount:'10',currency:'USD'},profile={baseCurrency:'SGD'};
 assert.equal(model.conversion(null,values,profile,{USD:-2},null).baseAmount,null);
 assert.equal(model.conversion(null,values,profile,{USD:0},null).baseAmount,null);
 assert.equal(model.conversion(null,values,profile,{USD:.5},null).baseAmount,20);
});
test('coordinate checks do not mistake whitespace or booleans for zero',()=>{
 assert.equal(model.hasCoordinates({lat:0,lng:0}),true);
 assert.equal(model.hasCoordinates({lat:' ',lng:10}),false);
 assert.equal(model.hasCoordinates({lat:false,lng:10}),false);
});
console.log('Recovery model checks include 23 rejected-backup cases and rate/date/coordinate guards.');
