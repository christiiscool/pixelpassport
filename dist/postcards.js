/* One artwork lookup for destination cards, details, maps, and the dashboard. */
(function(root){
const route={
 singapore:['preexchange',0,0],munich:['preexchange',1,0],strasbourg:['preexchange',2,0],colmar:['preexchange',0,1],florence:['preexchange',1,1],milan:['preexchange',2,1],
 london:['exchange',0,0],rovaniemi:['exchange',1,0],lisbon:['exchange',2,0],seville:['exchange',0,1],barcelona:['exchange',1,1],amsterdam:['exchange',2,1],
 prague:['family',0,0],budapest:['family',1,0],ljubljana:['family',2,0],'vintgar gorge':['family',0,1],'lake bled':['family',1,1],salzburg:['family',2,1],
 santorini:['alpine',0,0],hallstatt:['alpine',1,0],switzerland:['alpine',2,0],austria:['alpine',0,1],slovenia:['alpine',1,1],chamonix:['alpine',2,1]
};
function forName(name){
 const place=String(name||'').trim();
 const scene=route[place.toLowerCase()];
 if(scene)return scene;
 return /paris|france/i.test(place)?'paris':/st\.?\s*gallen/i.test(place)?'st-gallen':/rome|italy/i.test(place)?'rome':/vienna/i.test(place)?'atlas-austria':/finland|helsinki/i.test(place)?'finland':/athens|greece/i.test(place)?'atlas-greece':/venice/i.test(place)?'atlas-venice':null;
}
root.PPPostcards={forName};
})(typeof window==='undefined'?globalThis:window);
