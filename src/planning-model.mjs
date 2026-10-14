export const seasons=['winter','spring','summer','autumn'];
const coordinate=(value,limit)=>value!=null&&value!==''&&Number.isFinite(Number(value))&&Math.abs(Number(value))<=limit;
export function resolveSeason(profile,trip,destination){
  if(seasons.includes(profile.visualTheme))return profile.visualTheme;
  const date=destination?.arrival||trip?.start;
  const month=Number(date?.slice(5,7));
  return !month||month===12||month<=2?'winter':month<=5?'spring':month<=8?'summer':'autumn';
}
export function savedRoute(destinations,tripId){
  return destinations.filter(d=>d.tripId===tripId&&d.status!=='wishlist'&&coordinate(d.lat,90)&&coordinate(d.lng,180)).sort((a,b)=>a.order-b.order);
}
const signature=e=>JSON.stringify([e.title,Number(e.amount),e.currency,e.date,e.tripId,e.destinationId,e.kind,e.category,e.payment,e.notes]);
export function linkSkiPlan(state,plan,{createDestination=false,location=null,estimates=false},makeId){
  let destination=state.destinations.find(d=>d.id===plan.destinationId);
  if(destination&&destination.tripId!==plan.tripId)throw Error('Choose a destination from the selected trip.');
  if(!destination&&createDestination){
    if(!location||!coordinate(location.lat,90)||!coordinate(location.lng,180))throw Error('Look up or enter valid coordinates for the new stop.');
    destination=state.destinations.find(d=>d.tripId===plan.tripId&&d.name.trim().toLowerCase()===plan.resort.trim().toLowerCase()&&d.country.trim().toLowerCase()===plan.country.trim().toLowerCase());
    if(!destination){destination={id:makeId(),tripId:plan.tripId,name:plan.resort,country:plan.country,lat:Number(location.lat),lng:Number(location.lng),status:'planned',arrival:plan.start,departure:plan.end,notes:'Linked ski destination',order:state.destinations.filter(d=>d.tripId===plan.tripId).length,sourceSkiId:plan.id};state.destinations.push(destination);}
    plan.destinationId=destination.id;
  }
  const preserved=[];
  plan.linkedExpenseIds={...(plan.linkedExpenseIds||{})};
  if(estimates)for(const [part,key,label] of [['pass','passCost','Lift pass'],['rental','rentalCost','Equipment rental']]){
    const existing=state.expenses.find(e=>e.sourceSkiId===plan.id&&e.skiCostPart===part);
    const amount=Number(plan[key]);
    if(!Number.isFinite(amount)||amount<=0)continue;
    if(!existing&&plan.linkedExpenseIds[part]){preserved.push(`${label} (previously removed)`);continue;}
    if(existing&&(existing.kind!=='estimated'||existing.sourceSignature!==signature(existing))){preserved.push(label);continue;}
    const currency=plan.currency,rate=currency===state.profile.baseCurrency?1:state.rates?.[currency]?1/state.rates[currency]:null;
    const values={title:`${label} · ${plan.resort}`,category:'skiing',kind:'estimated',amount,currency,date:plan.start||'',tripId:plan.tripId,destinationId:plan.destinationId||'',payment:'unpaid',notes:'Linked ski estimate. Editing this ledger entry preserves your version on future ski saves.',baseAmount:rate===null?null:Math.round(amount*rate*100)/100,baseCurrency:state.profile.baseCurrency,conversionRate:rate,rateTimestamp:rate===null?null:state.ratesUpdated};
    const expense=existing||{id:makeId(),sourceSkiId:plan.id,skiCostPart:part};Object.assign(expense,values);expense.sourceSignature=signature(expense);plan.linkedExpenseIds[part]=expense.id;if(!existing)state.expenses.push(expense);
  }
  plan.linkEstimates=estimates;
  return {destination,preserved};
}
export function milestone(before,after){
  const done=after.tasks.find(t=>t.done&&!before.tasks.find(old=>old.id===t.id)?.done);
  if(done)return {mode:'celebrating',title:'Quest complete · +25 XP',message:done.title,kind:'quest',recordId:done.id};
  const oldCountries=new Set(before.destinations.filter(d=>d.status==='visited').map(d=>d.country));
  const visited=after.destinations.find(d=>d.status==='visited'&&before.destinations.find(old=>old.id===d.id)?.status!=='visited');
  if(visited)return {mode:'celebrating',title:oldCountries.has(visited.country)?'Another footprint · +50 XP':'Passport stamp unlocked · +50 XP',message:visited.country,kind:oldCountries.has(visited.country)?'visited':'stamp'};
  const item=after.packing.find(p=>p.status==='packed'&&before.packing.find(old=>old.id===p.id)?.status!=='packed');
  if(item){const complete=after.packing.length>0&&after.packing.every(p=>p.status==='packed');return {mode:complete?'celebrating':'happy',title:complete?'Your suitcase is ready!':'Tucked into your suitcase',message:complete?'Every saved item is packed.':item.name,kind:complete?'packing-complete':'packing',recordId:item.id};}
  const ski=after.skiTrips.find(s=>!before.skiTrips.some(old=>old.id===s.id));
  if(ski)return {mode:'happy',title:'A mountain adventure awaits',message:`${ski.resort} is saved. Review your packing and quest suggestions.`,kind:'ski'};
  const activity=after.activities.find(a=>a.status==='completed'&&before.activities.find(old=>old.id===a.id)?.status!=='completed');
  if(activity)return {mode:'happy',title:'A little adventure completed',message:activity.title,kind:'activity',recordId:activity.id};
  return null;
}
