/* Pure data operations shared by forms, backup import and regression checks. */
(function(root){
'use strict';
const collections=['trips','destinations','activities','tasks','packing','expenses','bookings','skiTrips','journal'];
const currencies=new Set(['SGD','EUR','CHF','GBP','USD']);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const present=x=>x!==null&&x!==undefined&&x!=='';
const safeId=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}$/.test(x);
const numeric=x=>(typeof x==='number'||typeof x==='string'&&x.trim()!=='')&&Number.isFinite(Number(x));
function validDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value.startsWith('0000'))return false;
  const time=Date.parse(value+'T12:00:00Z');
  return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value;
}
function restore(target,snapshot){
  for(const key of Object.keys(target))if(!(key in snapshot))delete target[key];
  for(const [key,value] of Object.entries(snapshot)){
    if(Array.isArray(value)){
      const current=Array.isArray(target[key])?target[key]:[];
      const restored=value.map(old=>{if(!old||typeof old!=='object')return old;const item=current.find(x=>x&&x.id&&x.id===old.id)||{};restore(item,old);return item});
      current.splice(0,current.length,...restored);target[key]=current;
    }else if(value&&typeof value==='object'){
      target[key]=target[key]&&typeof target[key]==='object'?target[key]:{};restore(target[key],value);
    }else target[key]=value;
  }
  return target;
}
function validateBackup(data){
  if(!object(data)||!object(data.profile)||!currencies.has(data.profile.baseCurrency))throw Error('Invalid backup: traveler profile or base currency');
  // Iterative inspection rejects dangerous keys/cycles without recursive stack overflow.
  const pending=[[data,0]],seen=new Set();let examined=0;
  while(pending.length){
    const [value,depth]=pending.pop();
    if(!value||typeof value!=='object')continue;
    if(depth>32||seen.has(value))throw Error('Invalid backup: excessive nesting or circular data');
    seen.add(value);
    for(const [key,item] of Object.entries(value)){
      if(++examined>1000000)throw Error('Backup is too complex to import safely');
      if(['__proto__','constructor','prototype'].includes(key))throw Error('Invalid backup key');
      if(item&&typeof item==='object')pending.push([item,depth+1]);
    }
  }
  if(data.profile.name!=null&&typeof data.profile.name!=='string')throw Error('Invalid traveler name');
  if(data.profile.exchangeBudgetCurrency!=null&&!currencies.has(data.profile.exchangeBudgetCurrency))throw Error('Invalid exchange budget currency');
  for(const key of ['exchangeBudget','weightTarget'])if(present(data.profile[key])&&(!numeric(data.profile[key])||Number(data.profile[key])<0))throw Error('Invalid '+key+' in profile');
  const required={trips:['name'],destinations:['name','country'],activities:['title'],tasks:['title'],packing:['name'],expenses:['title','currency'],skiTrips:['resort'],journal:['title']};
  const stringFields=['name','title','country','tripId','destinationId','expenseId','date','due','arrival','departure','start','end','notes','status','currency','category','type','bag','subtasks','provider','reference','time','departureTime','arrivalTime'];
  const numberFields=['amount','cost','weight','qty','ownedQty','packedQty','passCost','rentalCost','baseAmount','conversionRate','order','budget','estimatedCost'];
  const dateFields=['date','due','arrival','departure','start','end'];
  const ids={};
  for(const key of [...collections,'transfers']){
    if(key==='transfers'&&data[key]==null){ids[key]=new Map();continue;}
    if(!Array.isArray(data[key]))throw Error('Invalid backup collection: '+key);
    if(data[key].length>20000)throw Error('Too many records in '+key);
    ids[key]=new Map();
    for(const record of data[key]){
      if(!object(record)||!safeId(record.id)||ids[key].has(record.id))throw Error('Invalid or duplicate record ID in '+key);
      ids[key].set(record.id,record);
      for(const field of required[key]||[])if(typeof record[field]!=='string'||!record[field].trim())throw Error('Missing '+field+' in '+key);
      for(const field of stringFields)if(record[field]!=null&&typeof record[field]!=='string')throw Error('Invalid '+field+' in '+key);
      for(const field of ['tripId','destinationId','expenseId'])if(present(record[field])&&!safeId(record[field]))throw Error('Invalid '+field+' in '+key);
      for(const field of ['currency','baseCurrency','budgetCurrency'])if(present(record[field])&&!currencies.has(record[field]))throw Error(field==='budgetCurrency'?'Invalid trip budget currency':'Unsupported '+field+' in '+key);
      for(const field of numberFields)if(present(record[field])&&(!numeric(record[field])||Number(record[field])<0))throw Error('Invalid '+field+' in '+key);
      for(const field of ['qty','ownedQty','packedQty'])if(present(record[field])&&!Number.isSafeInteger(Number(record[field])))throw Error('Invalid '+field+' in '+key);
      if(present(record.qty)&&Number(record.qty)<1)throw Error('Packing quantity must be at least one');
      if(present(record.ownedQty)&&present(record.qty)&&Number(record.ownedQty)>Number(record.qty))throw Error('Owned quantity exceeds needed quantity');
      if(present(record.packedQty)&&present(record.ownedQty)&&Number(record.packedQty)>Number(record.ownedQty))throw Error('Packed quantity exceeds owned quantity');
      for(const field of dateFields)if(present(record[field])&&!validDate(record[field]))throw Error(key==='transfers'?'Invalid transfer date':'Invalid '+field+' in '+key);
      for(const field of ['time','departureTime','arrivalTime'])if(present(record[field])&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(record[field]))throw Error('Invalid '+field+' in '+key);
      for(const [start,end] of [['start','end'],['arrival','departure']])if(record[start]&&record[end]&&record[end]<record[start])throw Error('End date precedes start date in '+key);
      for(const [field,limit] of [['lat',90],['lng',180]])if(present(record[field])&&(!numeric(record[field])||Math.abs(Number(record[field]))>limit))throw Error('Invalid coordinates in '+key);
      if(key==='transfers'){
        if(typeof record.origin!=='string'||!record.origin.trim()||typeof record.destination!=='string'||!record.destination.trim())throw Error('Invalid transfer endpoints');
        if(!validDate(record.date))throw Error('Invalid transfer date');
      }
      if(record.conversionHistory!=null&&(!Array.isArray(record.conversionHistory)||record.conversionHistory.some(x=>!object(x))))throw Error('Invalid conversion history');
    }
  }
  if(!data.trips.length)throw Error('A backup needs at least one trip');
  // Empty links in older files are allowed. Non-empty links must resolve consistently.
  for(const key of [...collections,'transfers'])for(const record of data[key]||[]){
    for(const [field,collection] of [['tripId','trips'],['destinationId','destinations'],['expenseId','expenses']]){
      if(present(record[field])&&!ids[collection].has(record[field]))throw Error((key==='transfers'?'Transfer':key+' record')+' references an unknown '+(field==='tripId'?'trip':field==='expenseId'?'expense':'destination'));
    }
    const destination=ids.destinations.get(record.destinationId),expense=ids.expenses.get(record.expenseId);
    if(record.tripId&&destination?.tripId&&record.tripId!==destination.tripId)throw Error('Destination belongs to a different trip in '+key);
    if(record.tripId&&expense?.tripId&&record.tripId!==expense.tripId)throw Error('Linked expense belongs to a different trip in '+key);
  }
  if(data.dismissed!=null&&(!Array.isArray(data.dismissed)||data.dismissed.some(x=>typeof x!=='string')))throw Error('Invalid dismissed suggestions');
  if(data.rates!=null&&(!object(data.rates)||Object.values(data.rates).some(x=>!numeric(x)||Number(x)<=0)))throw Error('Invalid exchange rates');
  return {...data,transfers:data.transfers||[],dismissed:data.dismissed||[],rates:data.rates||null};
}
function successor(task,tasks,newId){
  if(!task.done||!['weekly','monthly'].includes(task.recurrence)||!validDate(task.due))return null;
  const next=new Date(task.due+'T12:00:00Z');
  if(task.recurrence==='weekly')next.setUTCDate(next.getUTCDate()+7);
  else{const day=next.getUTCDate();next.setUTCDate(1);next.setUTCMonth(next.getUTCMonth()+1);const last=new Date(Date.UTC(next.getUTCFullYear(),next.getUTCMonth()+1,0)).getUTCDate();next.setUTCDate(Math.min(day,last))}
  const due=next.toISOString().slice(0,10),recurrenceParentId=task.id;
  if(tasks.some(x=>x.due===due&&(x.recurrenceParentId===task.id||(!x.recurrenceParentId&&x.title===task.title&&x.tripId===task.tripId&&x.destinationId===task.destinationId&&x.recurrence===task.recurrence))))return null;
  return {...task,id:newId,done:false,due,recurrenceParentId,suggestionKey:''};
}
function conversion(record,values,profile,rates,timestamp){
  if(record&&Number(record.amount)===Number(values.amount)&&record.currency===values.currency&&record.baseCurrency===profile.baseCurrency&&record.baseAmount!=null)return {};
  const n=Number(values.amount),raw=Number(rates?.[values.currency]);
  const rate=values.currency===profile.baseCurrency?1:Number.isFinite(raw)&&raw>0?1/raw:null;
  return {baseAmount:rate==null?null:Math.round(n*rate*100)/100,conversionRate:rate,baseCurrency:profile.baseCurrency,rateTimestamp:rate==null?null:timestamp};
}
function safeURL(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:''}catch{return ''}}
function hasCoordinates(place){
  return place!=null&&present(place.lat)&&present(place.lng)&&numeric(place.lat)&&numeric(place.lng)&&Math.abs(Number(place.lat))<=90&&Math.abs(Number(place.lng))<=180;
}
function validateRates(payload,base){
  if(!object(payload)||payload.result!=='success'||!object(payload.rates))throw Error('Exchange-rate service returned an invalid response');
  if(payload.base_code&&payload.base_code!==base)throw Error('Exchange-rate response uses a different base currency');
  if(!numeric(payload.rates[base])||Math.abs(Number(payload.rates[base])-1)>1e-8)throw Error('Exchange-rate response has an invalid base rate');
  const rates={};
  for(const [currency,value] of Object.entries(payload.rates)){
    if(!/^[A-Z]{3}$/.test(currency)||!numeric(value)||Number(value)<=0)throw Error('Exchange-rate response contains an invalid rate');
    rates[currency]=Number(value);
  }
  return rates;
}
function normalizeRoute(data,tripId){
  const rows=(data.destinations||[]).filter(d=>d.tripId===tripId).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  rows.forEach((d,i)=>{d.order=i;});return rows;
}
function reorderDestination(data,destinationId,delta){
  const stop=data.destinations.find(d=>d.id===destinationId);if(!stop)return false;
  const ordered=normalizeRoute(data,stop.tripId),i=ordered.findIndex(d=>d.id===destinationId),next=i+Number(delta);
  if(next<0||next>=ordered.length||!Number.isInteger(Number(delta)))return false;
  const [moved]=ordered.splice(i,1);ordered.splice(next,0,moved);ordered.forEach((d,n)=>{d.order=n;});return true;
}
function rehomeTrip(data,deletedId){
  const replacement=data.trips?.[0]?.id;if(!replacement)throw Error('At least one trip is required');
  const existing=normalizeRoute(data,replacement),incoming=data.destinations.filter(d=>d.tripId===deletedId).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  incoming.forEach((d,i)=>{d.tripId=replacement;d.order=existing.length+i;});
  for(const key of ['bookings','expenses','tasks','skiTrips','packing','transfers','journal'])for(const item of data[key]||[])if(item.tripId===deletedId)item.tripId=replacement;
  if(data.profile?.selectedTripId===deletedId)data.profile.selectedTripId=replacement;return replacement;
}
function moveDestinationTrip(data,destination,newTripId){
  if(!data.trips.some(t=>t.id===newTripId))throw Error('Choose an existing trip');
  if(destination.tripId===newTripId)return false;
  const oldTripId=destination.tripId,order=normalizeRoute(data,newTripId).length;
  for(const key of ['bookings','expenses','tasks','skiTrips'])for(const item of data[key]||[])if(item.destinationId===destination.id)item.tripId=newTripId;
  destination.tripId=newTripId;destination.order=order;normalizeRoute(data,oldTripId);return true;
}
function reconcileCurrencies(data){
  if(!data.rates||!data.profile?.baseCurrency)throw Error('Refresh live exchange rates first.');
  const base=data.profile.baseCurrency;let converted=0,skipped=0;
  for(const item of data.expenses||[]){
    if(item.currency===base||(item.baseAmount!=null&&item.baseCurrency===base))continue;
    const rate=Number(data.rates[item.currency]),amount=Number(item.amount);
    if(!Number.isFinite(rate)||rate<=0||!Number.isFinite(amount)||amount<0){skipped++;continue;}
    if(item.baseAmount!=null&&item.baseCurrency&&item.baseCurrency!==base){
      (item.conversionHistory??=[]).push({baseAmount:item.baseAmount,baseCurrency:item.baseCurrency,conversionRate:item.conversionRate,rateTimestamp:item.rateTimestamp});
    }
    item.baseAmount=Math.round(amount/rate*100)/100;item.baseCurrency=base;item.conversionRate=1/rate;item.rateTimestamp=data.ratesUpdated||null;converted++;
  }
  return {converted,skipped};
}
root.PPData={restore,validateBackup,validDate,successor,conversion,safeURL,hasCoordinates,validateRates,normalizeRoute,reorderDestination,rehomeTrip,moveDestinationTrip,reconcileCurrencies};
})(typeof window==='undefined'?globalThis:window);
