export const characters=[{id:'brunette',name:'The Curious Explorer',shortName:'Pip',description:'Adventurous, curious, and thoughtful. A map in her bag and a little wonder in every step.'},{id:'blonde',name:'The Blonde Traveler',shortName:'Flora',description:'Cheerful, friendly, and adventurous. Golden curls, little flowers, and a world to discover.'}];
export const companions=[{id:'cat',name:'Mochi · Grey Cat',shortName:'Mochi',description:'A fluffy grey explorer with pink ears and a teal cat collar.'},{id:'puppy',name:'Biscuit · White Puppy',shortName:'Biscuit',description:'A loyal cream-white puppy with a pink bandana.'}];
export const outfits=[{id:'casual',name:'Casual',description:'Your traveler’s own signature look.'},{id:'ski',name:'Skiing',description:'Warm layers, goggles and snow boots.'},{id:'summer',name:'Summer Explorer',description:'Light layers for bright little adventures.'},{id:'city',name:'City Explorer',description:'A thoughtful outfit for streets and cafés.'},{id:'rain',name:'Rainy Day',description:'Waterproof layers for changing skies.'},{id:'hiking',name:'Hiking',description:'Sturdy boots and a backpack for the trail.'},{id:'winter',name:'Winter',description:'A wool coat, scarf and cozy boots for winter sightseeing.'}];
export function migrateAvatarProfile(profile,returning=false){
  const valid=(items,value,fallback)=>items.some(item=>item.id===value)?value:fallback;
  return {...profile,selectedCharacterId:valid(characters,profile.selectedCharacterId,'brunette'),selectedCompanionId:valid(companions,profile.selectedCompanionId,'cat'),selectedOutfitId:valid(outfits,profile.selectedOutfitId,valid(outfits,profile.avatarOutfit==='explorer'?'casual':profile.avatarOutfit,'casual')),onboardingCompleted:profile.onboardingCompleted===undefined?returning:Boolean(profile.onboardingCompleted),mapAvatarVisible:Boolean(profile.mapAvatarVisible)};
}
export function appearanceSelection(values){
  for(const [key,items] of [['selectedCharacterId',characters],['selectedCompanionId',companions],['selectedOutfitId',outfits]])if(!items.some(item=>item.id===values[key]))throw Error('Choose a supported traveler, companion and outfit.');
  return {selectedCharacterId:values.selectedCharacterId,selectedCompanionId:values.selectedCompanionId,selectedOutfitId:values.selectedOutfitId};
}
export function destinationFacts(state,destination,convert){
  const activities=state.activities.filter(a=>a.destinationId===destination.id),expenses=state.expenses.filter(e=>e.destinationId===destination.id&&e.kind==='estimated');
  const byCurrency=activities.reduce((out,a)=>{if(Number(a.cost)>0)out[a.currency||'SGD']=(out[a.currency||'SGD']||0)+Number(a.cost);return out},{});
  return {activities,estimatedExpenses:expenses.reduce((sum,e)=>sum+(convert(e)||0),0),unconverted:expenses.filter(e=>convert(e)==null).length,activityEstimates:byCurrency};
}
