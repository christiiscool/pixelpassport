import assert from 'node:assert/strict';
import {migrateAvatarProfile,appearanceSelection,destinationFacts} from '../src/avatar-model.mjs';
const legacy={name:'Legacy traveler',baseCurrency:'CHF',exchangeBudget:700,avatarOutfit:'rain',customField:'preserve'};
const before=JSON.stringify(legacy),profile=migrateAvatarProfile(legacy,true);
assert.equal(JSON.stringify(legacy),before);assert.equal(profile.onboardingCompleted,true);assert.equal(profile.selectedOutfitId,'rain');assert.equal(profile.name,'Legacy traveler');assert.equal(profile.exchangeBudget,700);assert.equal(profile.customField,'preserve');
assert.equal(migrateAvatarProfile({},false).onboardingCompleted,false);assert.equal(migrateAvatarProfile({onboardingCompleted:false},true).onboardingCompleted,false);
assert.equal(migrateAvatarProfile({selectedCharacterId:'unknown',selectedCompanionId:'unknown'},true).selectedCharacterId,'brunette');
for(const character of ['brunette','blonde'])for(const companion of ['cat','puppy'])for(const outfit of ['casual','ski','summer','city','rain','hiking']){const selection={selectedCharacterId:character,selectedCompanionId:companion,selectedOutfitId:outfit};assert.deepEqual(appearanceSelection(selection),selection);assert.deepEqual(migrateAvatarProfile(selection,true).selectedCompanionId,companion)}
assert.throws(()=>appearanceSelection({selectedCharacterId:'other',selectedCompanionId:'cat',selectedOutfitId:'casual'}));
const data={activities:[{id:'a',destinationId:'d',cost:20,currency:'EUR'},{id:'b',destinationId:'d',cost:10,currency:'CHF'},{id:'c',destinationId:'other',cost:999}],expenses:[{destinationId:'d',kind:'estimated',baseAmount:50},{destinationId:'d',kind:'actual',baseAmount:900},{destinationId:'d',kind:'estimated',baseAmount:null}]};
const facts=destinationFacts(data,{id:'d'},e=>e.baseAmount);assert.equal(facts.activities.length,2);assert.equal(facts.estimatedExpenses,50);assert.equal(facts.unconverted,1);assert.deepEqual(facts.activityEstimates,{EUR:20,CHF:10});
console.log('Avatar model: additive migration, returning/new users, all 24 independent appearance combinations and truthful map facts passed.');
