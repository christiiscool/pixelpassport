/* Quantity-aware packing model. Legacy records are interpreted additively. */
(function(root){
const num=(v,d=0)=>v!==''&&v!=null&&Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):d;
function counts(p){
 const qty=Math.max(1,num(p.qty,1));
 const owned=Math.min(qty,num(p.ownedQty,['purchased','packed'].includes(p.status)?qty:0));
 const packed=Math.min(owned,num(p.packedQty,p.status==='packed'?qty:0));
 return {qty,owned,packed,shopping:p.ownership==='unknown'?0:Math.max(0,qty-owned)};
}
function sync(p){
 const c=counts(p);
 Object.assign(p,{qty:c.qty,ownedQty:c.owned,packedQty:c.packed,status:c.packed===c.qty?'packed':c.owned===c.qty?'purchased':'needed'});
 return p;
}
function totals(rows){
 return rows.reduce((a,p)=>{let c=counts(p);a.items++;a.units+=c.qty;a.owned+=c.owned;a.packed+=c.packed;a.shopping+=c.shopping;if(c.packed&&(p.weight===''||p.weight==null))a.weightMissing+=c.packed;a.weight+=c.packed*(Number(p.weight)||0);return a;},{items:0,units:0,owned:0,packed:0,shopping:0,weight:0,weightMissing:0});
}

root.PPPackingData={counts,sync,totals};
})(typeof window==='undefined'?globalThis:window);
