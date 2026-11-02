export const CATEGORIES=['Food','Drinks','Desserts & snacks','Clothing','Accessories','Household goods','Services','Other'];
export const singaporeToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function upcomingSites(context,today=singaporeToday()){
 const future=new Map();
 for(const event of context.events||[]){
  if(event.date_conflict||!/^\d{4}-\d{2}-\d{2}$/.test(event.start_date||'')||event.start_date<=today)continue;
  const site=context.sites.find(s=>s.site_id===event.site_id);
  if(!site||!Number.isFinite(site.longitude)||!Number.isFinite(site.latitude))continue;
  if(!future.has(site.site_id)||event.start_date<future.get(site.site_id).start_date)future.set(site.site_id,{...site,start_date:event.start_date,end_date:event.end_date,source_urls:event.source_urls});
 }
 return [...future.values()].sort((a,b)=>a.start_date.localeCompare(b.start_date));
}
function inRing(point,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
 const [x,y]=point,[xi,yi]=ring[i],[xj,yj]=ring[j];
 if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
 }return inside;}
export function inGeometry(point,geometry){
 const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];
 return polygons.some(rings=>inRing(point,rings[0])&&!rings.slice(1).some(r=>inRing(point,r)));
}
export function areaAt(coordinates,areas){return areas.features.find(f=>inGeometry(coordinates,f.geometry))?.properties.name||null;}
export function toggleChoice(values,value,max=3){
 if(values.includes(value))return {values:values.filter(x=>x!==value),limited:false};
 return values.length>=max?{values,limited:true}:{values:[...values,value],limited:false};
}
export function validateSubmission(payload,context,points,today=singaporeToday()){
 const errors=[];
 const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
 if(!['brand','location','preference'].includes(payload.kind))errors.push('Choose a contribution type.');
 if(!['customer','vendor'].includes(payload.role))errors.push('Choose customer or vendor.');
 if(payload.kind==='preference'){
  const sites=payload.market_site_ids,areas=payload.planning_areas;
  const validSites=new Set(upcomingSites(context,today).map(s=>s.site_id));
  const validAreas=new Set(context.areas.features.map(f=>f.properties.name));
  for(const [list,valid,label] of [[sites,validSites,'upcoming markets'],[areas,validAreas,'planning areas']]){
   if(!Array.isArray(list)||list.length>3||new Set(list).size!==list.length||list.some(x=>!valid.has(x)))errors.push('Choose up to 3 valid '+label+'.');
  }
  if(!sites?.length&&!areas?.length)errors.push('Choose at least one market or planning area.');
  if(payload.role!=='vendor')errors.push('Location preferences are for vendors.');
  return errors;
 }
 if(!text(payload.brand_name,100))errors.push('Enter the brand name (up to 100 characters).');
 if(payload.kind==='brand'&&!CATEGORIES.includes(payload.category))errors.push('Choose a shop category.');
 if(payload.kind==='location'&&!points.some(p=>p.vendor_id===payload.vendor_id))errors.push('Choose an existing brand.');
 if(payload.products&&(!text(payload.products,200)))errors.push('Keep the product description under 200 characters.');
 if(!['temporary','permanent'].includes(payload.point_type))errors.push('Choose permanent store or temporary stall.');
 const location=payload.location;
 if(!location||!Array.isArray(location.coordinates)||location.coordinates.length!==2||!location.coordinates.every(Number.isFinite))errors.push('Select a location on the map.');
 else if(location.kind==='market'){
  const site=context.sites.find(s=>s.site_id===location.site_id);
  if(!site||site.longitude!==location.coordinates[0]||site.latitude!==location.coordinates[1])errors.push('Select a recorded market site.');
 }else if(location.kind!=='pin'||!areaAt(location.coordinates,context.areas))errors.push('Place the pin within Singapore.');
 return errors;
}
