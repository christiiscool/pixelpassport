/* Data operations shared by native forms and regression checks. No record reseeding. */
(function(root){
const collections=['trips','destinations','activities','tasks','packing','expenses','bookings','skiTrips','journal'];
function restore(target,snapshot){
  for(const key of Object.keys(target))if(!(key in snapshot))delete target[key];
  for(const [key,value] of Object.entries(snapshot)){
    if(Array.isArray(value)){
      const current=Array.isArray(target[key])?target[key]:[];
      const restored=value.map(old=>{if(!old||typeof old!=='object')return old;const item=current.find(x=>x&&x.id&&x.id===old.id)||{};restore(item,old);return item});
      current.splice(0,current.length,...restored);target[key]=current;
    }else if(value&&typeof value==='object'){target[key]=target[key]&&typeof target[key]==='object'?target[key]:{};restore(target[key],value)}
    else target[key]=value;
  }
  return target;
}
function validateBackup(data){
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  if(!object(data)||!object(data.profile)||!['SGD','EUR','CHF','GBP','USD'].includes(data.profile.baseCurrency))throw Error('Invalid backup: traveler profile or base currency');
  const validCurrency=new Set(['SGD','EUR','CHF','GBP','USD']);
  if(data.profile.exchangeBudgetCurrency!=null&&!validCurrency.has(data.profile.exchangeBudgetCurrency))throw Error('Invalid exchange budget currency');
  for(const trip of data.trips||[])if(trip.budgetCurrency!=null&&!validCurrency.has(trip.budgetCurrency))throw Error('Invalid trip budget currency');

  const visit=value=>{if(!value||typeof value!=='object')return;for(const [key,item] of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))throw Error('Invalid backup key');visit(item)}};visit(data);
  for(const key of collections){
    if(!Array.isArray(data[key]))throw Error('Invalid backup collection: '+key);
    const ids=new Set();const required={trips:['name'],destinations:['name','country'],activities:['title'],tasks:['title'],packing:['name'],expenses:['title','currency'],skiTrips:['resort'],journal:['title']}[key]||[];
    for(const record of data[key]){
      if(!object(record)||typeof record.id!=='string'||!record.id||ids.has(record.id))throw Error('Invalid or duplicate record in '+key);ids.add(record.id);for(const field of required)if(typeof record[field]!=='string'||!record[field].trim())throw Error('Missing '+field+' in '+key);if(record.currency&&!['SGD','EUR','CHF','GBP','USD'].includes(record.currency))throw Error('Unsupported currency in '+key);
      for(const field of ['name','title','country','tripId','destinationId','expenseId','date','due','arrival','departure','start','end','notes','status','currency','category','type','bag','subtasks'])if(record[field]!=null&&typeof record[field]!=='string')throw Error('Invalid '+field+' in '+key);
      for(const field of ['amount','cost','weight','qty','passCost','rentalCost','baseAmount','conversionRate','order'])if(record[field]!=null&&record[field]!==''&&!Number.isFinite(Number(record[field])))throw Error('Invalid '+field+' in '+key);
      for(const [field,limit] of [['lat',90],['lng',180]])if(record[field]!=null&&record[field]!==''&&(!Number.isFinite(Number(record[field]))||Math.abs(Number(record[field]))>limit))throw Error('Invalid coordinates in '+key);
    }
  }
  // Transfers were introduced after the v1 backups; accept missing arrays but validate any supplied records.
  if(data.transfers!=null){
    if(!Array.isArray(data.transfers))throw Error('Invalid backup collection: transfers');
    const ids=new Set();
    for(const record of data.transfers){
      if(!object(record)||typeof record.id!=='string'||!record.id||ids.has(record.id))throw Error('Invalid or duplicate transfer');
      ids.add(record.id);
      if(typeof record.origin!=='string'||!record.origin.trim()||typeof record.destination!=='string'||!record.destination.trim())throw Error('Invalid transfer endpoints');
      if(typeof record.date!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(record.date)||Number.isNaN(Date.parse(record.date+'T12:00:00Z')))throw Error('Invalid transfer date');
      if(record.tripId!=null&&(!data.trips.some(t=>t.id===record.tripId)))throw Error('Transfer references an unknown trip');
      for(const field of ['tripId','mode','status','departureTime','arrivalTime','provider','reference','notes'])if(record[field]!=null&&typeof record[field]!=='string')throw Error('Invalid '+field+' in transfers');
      if(record.estimatedCost!=null&&record.estimatedCost!==''&&(!Number.isFinite(Number(record.estimatedCost))||Number(record.estimatedCost)<0))throw Error('Invalid transfer cost');
    }
  }
  if(!data.trips.length)throw Error('A backup needs at least one trip');
  if(data.dismissed!=null&&(!Array.isArray(data.dismissed)||data.dismissed.some(x=>typeof x!=='string')))throw Error('Invalid dismissed suggestions');
  if(data.rates!=null&&(!object(data.rates)||Object.values(data.rates).some(x=>!Number.isFinite(Number(x))||Number(x)<=0)))throw Error('Invalid exchange rates');
  return {...data,transfers:data.transfers||[],dismissed:data.dismissed||[],rates:data.rates||null};
}
function successor(task,tasks,newId){
  if(!task.done||!['weekly','monthly'].includes(task.recurrence)||!task.due)return null;
  const next=new Date(task.due+'T12:00:00Z');if(!Number.isFinite(next.getTime()))return null;
  if(task.recurrence==='weekly')next.setUTCDate(next.getUTCDate()+7);
  else {const day=next.getUTCDate();next.setUTCDate(1);next.setUTCMonth(next.getUTCMonth()+1);const last=new Date(Date.UTC(next.getUTCFullYear(),next.getUTCMonth()+1,0)).getUTCDate();next.setUTCDate(Math.min(day,last))}
  const due=next.toISOString().slice(0,10),recurrenceParentId=task.id;
  if(tasks.some(x=>x.due===due&&(x.recurrenceParentId===task.id||(!x.recurrenceParentId&&x.title===task.title&&x.tripId===task.tripId&&x.destinationId===task.destinationId&&x.recurrence===task.recurrence))))return null;
  return {...task,id:newId,done:false,due,recurrenceParentId,suggestionKey:''};
}
function conversion(record,values,profile,rates,timestamp){
  if(record&&Number(record.amount)===Number(values.amount)&&record.currency===values.currency&&record.baseCurrency===profile.baseCurrency&&record.baseAmount!=null)return {};
  const n=Number(values.amount),rate=values.currency===profile.baseCurrency?1:rates?.[values.currency]?1/rates[values.currency]:null;
  return {baseAmount:rate==null?null:Math.round(n*rate*100)/100,conversionRate:rate,baseCurrency:profile.baseCurrency,rateTimestamp:rate==null?null:timestamp};
}
function safeURL(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:''}catch{return ''}}
function hasCoordinates(place){
 if(place==null||place.lat===null||place.lng===null||place.lat===undefined||place.lng===undefined||place.lat===''||place.lng==='')return false;
 const lat=Number(place.lat),lng=Number(place.lng);
 return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180;
}

// Keep all trip-bound records discoverable after a trip is deleted.
// Preserve a stable, unique stop order after deletions, reassignments, or duplicates.
function normalizeRoute(data,tripId){
 const rows=(data.destinations||[]).filter(d=>d.tripId===tripId).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
 rows.forEach((d,i)=>{d.order=i;});
 return rows;
}
function reorderDestination(data,destinationId,delta){
 const stop=data.destinations.find(d=>d.id===destinationId);
 if(!stop)return false;
 const ordered=normalizeRoute(data,stop.tripId),i=ordered.findIndex(d=>d.id===destinationId),next=i+Number(delta);
 if(next<0||next>=ordered.length||!Number.isInteger(Number(delta)))return false;
 const [moved]=ordered.splice(i,1);ordered.splice(next,0,moved);
 ordered.forEach((d,n)=>{d.order=n;});
 return true;
}
function rehomeTrip(data,deletedId){
 const replacement=data.trips?.[0]?.id;
 if(!replacement)throw Error('At least one trip is required');
 // Place rehomed stops after the existing route so unrelated stops do not jump.
 const existing=normalizeRoute(data,replacement),incoming=data.destinations.filter(d=>d.tripId===deletedId).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
 incoming.forEach((d,i)=>{d.tripId=replacement;d.order=existing.length+i;});
 for(const collection of ['bookings','expenses','tasks','skiTrips','packing','transfers','journal']){
  for(const item of data[collection]||[])if(item.tripId===deletedId)item.tripId=replacement;
 }
 if(data.profile?.selectedTripId===deletedId)data.profile.selectedTripId=replacement;
 return replacement;
}
function moveDestinationTrip(data,destination,newTripId){
 if(!data.trips.some(t=>t.id===newTripId))throw Error('Choose an existing trip');
 if(destination.tripId===newTripId)return false;
 const oldTripId=destination.tripId;
 const order=normalizeRoute(data,newTripId).length;
 for(const collection of ['bookings','expenses','tasks','skiTrips']){
  for(const item of data[collection]||[])if(item.destinationId===destination.id)item.tripId=newTripId;
 }
 destination.tripId=newTripId;
 destination.order=order;
 normalizeRoute(data,oldTripId);
 return true;
}
// Rebase only unconverted/stale entries after an explicit user decision.
// Preserve previous conversions for historical review, never alter original amounts.
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
    item.baseAmount=Math.round(amount/rate*100)/100;
    item.baseCurrency=base;
    item.conversionRate=1/rate;
    item.rateTimestamp=data.ratesUpdated||null;
    converted++;
  }
  return {converted,skipped};
}
root.PPData={restore,validateBackup,successor,conversion,safeURL,hasCoordinates,normalizeRoute,reorderDestination,rehomeTrip,moveDestinationTrip,reconcileCurrencies};
})(typeof window==='undefined'?globalThis:window);

