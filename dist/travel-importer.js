/* Non-destructive, explicit import. All planning records remain in pixel-passport-v1. */
(function(root){
const T=root.PPTravelTemplate;
const norm=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
const clone=x=>structuredClone(x);
const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
function analyze(original,choice={itinerary:true,packing:true,conflicts:'keep'}){
 const state=clone(original),stats={trips:0,destinations:0,activities:0,transfers:0,tasks:0,packing:0,matched:0,skipped:0},conflicts=[];
 for(const key of ['trips','destinations','activities','tasks','packing','transfers'])state[key]??=[];
 state.imports??=[];
 const tripIds={};
 const matchTrip=t=>state.trips.find(x=>x.importKey===`trip:${t.key}`||[t.name,...t.aliases].some(n=>norm(x.name)===norm(n)));
 for(const t of T.trips){let record=matchTrip(t);if(!record&&(choice.itinerary||choice.packing&&t.key==='exchange')){record={id:uid(),name:t.name,status:t.status,start:t.start,end:t.end,notes:t.notes,focus:t.focus,budget:'',importKey:`trip:${t.key}`,importVersion:T.version};state.trips.push(record);stats.trips++}else if(record){stats.matched++;if(choice.itinerary){if(t.key==='family'&&norm(record.name)==='end of exchange family trip')record.name=t.name;for(const field of ['start','end','notes','focus']){if(!record[field])record[field]=t[field];else if((field==='start'||field==='end')&&record[field]!==t[field]){conflicts.push({kind:'trip',name:record.name,field,current:record[field],incoming:t[field]});if(choice.conflicts==='template')record[field]=t[field]}}record.importKey??=`trip:${t.key}`;record.importVersion??=T.version}}
  tripIds[t.key]=record?.id;
 }
 if(choice.itinerary){
  const destIds={};
  for(const d of T.destinations){let record=state.destinations.find(x=>x.importKey===`destination:${d.trip}:${d.key}`||x.tripId===tripIds[d.trip]&&norm(x.name)===norm(d.name)&&norm(x.country)===norm(d.country));if(!record){record={id:uid(),tripId:tripIds[d.trip],name:d.name,country:d.country,lat:d.lat,lng:d.lng,icon:'📍',status:d.status,arrival:d.arrival,departure:d.departure,notes:d.notes,order:state.destinations.filter(x=>x.tripId===tripIds[d.trip]).length,importKey:`destination:${d.trip}:${d.key}`,importVersion:T.version};state.destinations.push(record);stats.destinations++}else{stats.matched++;for(const field of ['arrival','departure']){if(!record[field])record[field]=d[field];else if(record[field]!==d[field]){conflicts.push({kind:'destination',name:record.name,field,current:record[field],incoming:d[field]});if(choice.conflicts==='template')record[field]=d[field]}}if(!record.notes)record.notes=d.notes;if(record.status==='wishlist')record.status='planned';if(!Number.isFinite(Number(record.lat))||!Number.isFinite(Number(record.lng))){record.lat=d.lat;record.lng=d.lng}record.importKey??=`destination:${d.trip}:${d.key}`;record.importVersion??=T.version}destIds[`${d.trip}:${d.key}`]=record.id}
  const byName=(trip,name)=>{const d=T.destinations.find(x=>x.trip===trip&&x.name===name);return d?destIds[`${trip}:${d.key}`]:''};
  for(const a of T.activities){const td=T.destinations.find(x=>x.key===a.dest),destinationId=destIds[`${td.trip}:${a.dest}`],key=`activity:${td.trip}:${a.dest}:${a.date}:${a.title}`;if(state.activities.some(x=>x.importKey===key||x.destinationId===destinationId&&x.date===a.date&&norm(x.title)===norm(a.title))){stats.skipped++;continue}state.activities.push({id:uid(),destinationId,title:a.title,type:a.type,status:a.status,date:a.date,time:a.time,address:'',cost:'',currency:'SGD',bookingLink:'',notes:a.notes,order:a.order,importKey:key,importVersion:T.version});stats.activities++}
  for(const t of T.transfers){const key=`transfer:${t.trip}:${t.date}:${t.origin}:${t.destination}`,destinationId=byName(t.trip,t.destination);if(state.transfers.some(x=>x.importKey===key||x.tripId===tripIds[t.trip]&&x.date===t.date&&norm(x.origin)===norm(t.origin)&&norm(x.destination)===norm(t.destination))){stats.skipped++;continue}state.transfers.push({id:uid(),tripId:tripIds[t.trip],destinationId,origin:t.origin,destination:t.destination,date:t.date,mode:t.mode,status:'planned',departureTime:'',arrivalTime:'',reference:'',provider:'',estimatedCost:'',notes:t.notes,importKey:key,importVersion:T.version});stats.transfers++}
  for(const t of T.tasks){const key=`task:${t.trip}:${t.title}`;if(state.tasks.some(x=>x.importKey===key||x.tripId===tripIds[t.trip]&&norm(x.title)===norm(t.title))){stats.skipped++;continue}state.tasks.push({id:uid(),tripId:tripIds[t.trip],destinationId:'',title:t.title,category:t.category,priority:t.priority,due:t.due,done:false,recurrence:'none',notes:t.notes,importKey:key,importVersion:T.version});stats.tasks++}
 }
 if(choice.packing){const tripId=tripIds.exchange;for(const p of T.packing){const key=`packing:${p.name}`;if(state.packing.some(x=>x.importKey===key||x.tripId===tripId&&norm(x.name)===norm(p.name))){stats.skipped++;continue}state.packing.push({id:uid(),tripId,name:p.name,category:p.category,icon:p.icon,qty:p.qty,suggestedQty:p.suggestedQty,neededQty:p.neededQty,ownership:'unknown',ownedQty:0,packedQty:0,purchaseNeededQty:null,decision:p.decision,bag:p.bag,weight:p.weight,notes:p.notes,status:'needed',importKey:key,importVersion:T.version});stats.packing++}}
 state.imports.push({version:T.version,at:new Date().toISOString(),sections:{itinerary:!!choice.itinerary,packing:!!choice.packing},stats});
 return {state,stats,conflicts};
}
root.PPTravelImporter={version:T.version,analyze};
})(typeof window==='undefined'?globalThis:window);
