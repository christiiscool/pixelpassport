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
  if(!data.trips.length)throw Error('A backup needs at least one trip');
  if(data.dismissed!=null&&(!Array.isArray(data.dismissed)||data.dismissed.some(x=>typeof x!=='string')))throw Error('Invalid dismissed suggestions');
  if(data.rates!=null&&(!object(data.rates)||Object.values(data.rates).some(x=>!Number.isFinite(Number(x))||Number(x)<=0)))throw Error('Invalid exchange rates');
  return {...data,dismissed:data.dismissed||[],rates:data.rates||null};
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
root.PPData={restore,validateBackup,successor,conversion,safeURL};
})(typeof window==='undefined'?globalThis:window);

