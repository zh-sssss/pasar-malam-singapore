export const CLOSED=new Set(['temporarily_closed','permanently_closed']);
export function isOrigin(p){return p.point_type==='permanent'&&!CLOSED.has(p.operating_status);}
export function normalizePoints(points){
 const ids=new Set();
 return points.map(p=>{
  if(!p.point_id||!p.vendor_id||ids.has(p.point_id))throw new Error('Invalid or duplicate point ID');
  if(!['permanent','temporary'].includes(p.point_type)||!Number.isFinite(p.longitude)||!Number.isFinite(p.latitude))throw new Error('Invalid point: '+p.point_id);
  ids.add(p.point_id);return {...p};
 });
}
export function brandIndex(points){
 const groups=new Map();
 for(const p of points){if(!groups.has(p.vendor_id))groups.set(p.vendor_id,{id:p.vendor_id,name:p.brand_name,points:[]});groups.get(p.vendor_id).points.push(p);}
 return [...groups.values()].map(b=>({...b,
  permanentCount:b.points.filter(p=>p.point_type==='permanent').length,
  temporaryCount:b.points.filter(p=>p.point_type==='temporary').length
 })).filter(b=>b.temporaryCount>0).sort((a,b)=>
  Number(b.permanentCount>0)-Number(a.permanentCount>0)||b.points.length-a.points.length||a.name.localeCompare(b.name));
}
export function connectionsFor(points){
 const origins=points.filter(isOrigin),destinations=points.filter(p=>p.point_type==='temporary');
 return origins.flatMap(source=>destinations.filter(target=>target.vendor_id===source.vendor_id).map(target=>({id:source.point_id+'__'+target.point_id,source,target})));
}
export function statusText(p){
 return ({listed_with_business_hours:'Business hours listed',status_not_shown:'Operating status not shown',temporarily_closed:'Temporarily closed',permanently_closed:'Permanently closed',event_specific_not_current_shop_hours:'Reported market appearance',not_confirmed_at_old_location:'No matching Maps listing at this location'})[p.operating_status]||'Operating status unknown';
}
export function safeURL(value){try{const u=new URL(value);return u.protocol==='https:'||u.protocol==='http:'?u.href:null;}catch{return null;}}

