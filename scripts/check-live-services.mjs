// Informational, bounded checks of optional public providers. No user records are sent.
import {mkdirSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const scope={URL};vm.createContext(scope);vm.runInContext(readFileSync('dist/data-safety.js','utf8'),scope);
const checks=[
 {name:'MapLibre CDN',url:'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',method:'HEAD',check:async response=>{if(!/javascript/.test(response.headers.get('content-type')||''))throw Error('Unexpected script content type');}},
 {name:'OpenStreetMap tiles',url:'https://tile.openstreetmap.org/0/0/0.png',check:async response=>{if(!/image\//.test(response.headers.get('content-type')||''))throw Error('Unexpected tile content type');await response.arrayBuffer();}},
 {name:'Nominatim lookup',url:'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=St.%20Gallen%2C%20Switzerland',check:async response=>{const data=await response.json();if(!Array.isArray(data)||!data.length||!Number.isFinite(Number(data[0].lat)))throw Error('Unexpected lookup payload');}},
 {name:'Open-Meteo weather',url:'https://api.open-meteo.com/v1/forecast?latitude=47.4245&longitude=9.3767&current=temperature_2m',check:async response=>{const data=await response.json();if(typeof data.current?.temperature_2m!=='number')throw Error('Unexpected weather payload');}},
 {name:'Exchange-rate provider',url:'https://open.er-api.com/v6/latest/SGD',check:async response=>scope.PPData.validateRates(await response.json(),'SGD')}
];
const results=[];
for(const check of checks){
 const start=Date.now();let response;
 try{
  response=await fetch(check.url,{method:check.method||'GET',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'PixelPassport-Release-Check/1.0 (+https://github.com/christiiscool/pixelpassport)'}});
  if(!response.ok)throw Error('HTTP '+response.status);
  await check.check(response);results.push({provider:check.name,status:'reachable',httpStatus:response.status,durationMs:Date.now()-start});
 }catch(error){results.push({provider:check.name,status:'unavailable-or-invalid',httpStatus:response?.status||null,error:error.message,durationMs:Date.now()-start});}
}
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/release-live-services.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'One-time connectivity/schema check from a CI runner; not an SLA or a production-origin CORS/device test.',results},null,2));
console.log(JSON.stringify(results,null,2));
if(results.some(row=>row.status!=='reachable'))console.warn('Optional provider checks have warnings. Review the report before launch; core outage handling is tested separately.');
