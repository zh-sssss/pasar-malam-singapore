import {upcomingSites, areaAt} from '../site/brand-connections/feedback/model.js';
import {valuesFor} from '../site/brand-connections/ushahidi.js';
export {upcomingSites, areaAt};
export const GOODS=['Street food','Drinks & desserts','Fresh produce','Clothing & accessories','Household goods','Handmade goods'];
export const ACTIVITIES=['Live music','Family games','Workshops','Cultural performances','Community dining','Children’s activities'];
export function validateVote(p,context){
 const errors=[],areas=new Set(context.areas.features.map(f=>f.properties.name));
 if(!Array.isArray(p.planning_areas)||p.planning_areas.length<1||p.planning_areas.length>3||new Set(p.planning_areas).size!==p.planning_areas.length||p.planning_areas.some(name=>!areas.has(name)))errors.push('Choose one to three planning areas.');
 if(p.market_site_ids?.length)errors.push('Choose planning areas, not individual markets.');
 if(!['customer','vendor'].includes(p.role))errors.push('Choose customer or vendor.');
 for(const [values,valid] of [[p.goods,GOODS],[p.activities,ACTIVITIES]])if(!Array.isArray(values)||values.some(x=>!valid.includes(x)))errors.push('Choose a listed preference.');
 if((p.other||'').length>240)errors.push('Keep other suggestions under 240 characters.');
 return errors;
}
export function validateWalk(p,context){
 const errors=[];
 if(!Array.isArray(p.location?.coordinates)||p.location.coordinates.length!==2||!p.location.coordinates.every(Number.isFinite)||!areaAt(p.location.coordinates,context.areas))errors.push('Pin a location within Singapore.');
 if(!context.sites.some(s=>s.site_id===p.site_id))errors.push('Choose a recorded market.');
 if(!p.caption?.trim()||p.caption.length>400)errors.push('Describe this spot in 1–400 characters.');
 if(!p.media_permission)errors.push('Confirm that you may share this contribution.');
 if(p.video_url&&!videoUrl(p.video_url))errors.push('Use a public YouTube or Vimeo video link.');
 if(p.observed_on&&(!/^\d{4}-\d{2}-\d{2}$/.test(p.observed_on)||p.observed_on>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore'}).format(new Date())))errors.push('Choose a valid observation date, no later than today.');
 return errors;
}
export function videoUrl(value){
 try{const u=new URL(value);return u.protocol==='https:'&&['youtube.com','www.youtube.com','m.youtube.com','youtu.be','vimeo.com','www.vimeo.com'].includes(u.hostname)?u.href:null;}catch{return null;}
}
export function reviewedRecords(posts,connection,{includeTesting=false}={}){
 const seen=new Set();return posts.flatMap(post=>{
  if(post.status!=='published')return [];
  if(seen.has(String(post.id)))return [];seen.add(String(post.id));
  const fid=String(post.form_id??post.form?.id),fields=connection.fields;
  const key=fid===String(connection.preferenceFormId)?fields.preference_payload:fid===String(connection.brandFormId)?fields.payload:null;
  if(!key)return [];
  const values=valuesFor(post),raw=values[key]?.[0];
  try{const p=JSON.parse(raw);if((!includeTesting&&(p.testing||String(p.brand_name||'').startsWith('[TEST]')))||!['preference','streetwalk','area_information','brand','location'].includes(p.kind))return [];
   if(p.kind==='preference'&&fid!==String(connection.preferenceFormId)||p.kind!=='preference'&&fid!==String(connection.brandFormId))return [];
   if(['brand','location'].includes(p.kind)&&!p.brand_name)return [];
   const point=values[fields.point]?.[0];
   if(p.kind!=='preference'&&point&&Number.isFinite(Number(point.lon))&&Number.isFinite(Number(point.lat)))p.location={...p.location,coordinates:[Number(point.lon),Number(point.lat)]};
   return [{...p,id:String(post.id),media:post.media||[],media_ids:(values[fields.photo]||[]).map(Number).filter(Number.isFinite),source_url:connection.deploymentUrl.replace(/\/$/,'')+'/feed/'+post.id+'/view?mode=ID'}];
  }catch{return [];}
 });
}
export function validateInformation(p,context,points=[]){
 const errors=[],areaNames=new Set(context.areas.features.map(f=>f.properties.name));
 if(!['area_information','brand','location'].includes(p.kind))errors.push('Choose an information type.');
 if(!areaNames.has(p.planning_area))errors.push('Choose a planning area.');
 if(typeof p.caption!=='string'||!p.caption.trim()||p.caption.length>400)errors.push('Enter a short description, up to 400 characters.');
 if(p.location){const c=p.location.coordinates;if(!Array.isArray(c)||c.length!==2||!c.every(Number.isFinite)||areaAt(c,context.areas)!==p.planning_area)errors.push('The map pin must be inside the selected planning area.');}
 if(p.kind!=='area_information'){
  if(!p.location)errors.push('Choose a market point or place a pin.');
  if(typeof p.brand_name!=='string'||!p.brand_name.trim()||p.brand_name.length>100)errors.push('Enter a brand name, up to 100 characters.');
  if(p.kind==='brand'&&!['Food','Drinks','Desserts & snacks','Clothing','Accessories','Household goods','Services','Other'].includes(p.category))errors.push('Choose a shop category.');
  if(p.kind==='location'&&!points.some(point=>point.vendor_id===p.vendor_id))errors.push('Choose an existing brand.');
  if(!['permanent','temporary'].includes(p.point_type))errors.push('Choose a location type.');
 }
 if(p.video_url&&!videoUrl(p.video_url))errors.push('Use a public YouTube or Vimeo link.');
 if(p.has_photo&&!p.photo_permission)errors.push('Confirm permission to share the photo.');
 return errors;
}
export function informationCounts(records,context){
 const counts=new Map(context.areas.features.map(f=>[f.properties.name,0])),baseline=new Map(counts),community=new Map(counts),seen=new Set();
 const sites=new Map((context.sites||[]).map(site=>[site.site_id,site]));let unassignedBaseline=0,communityTotal=0;
 for(const [i,event] of (context.events||[]).entries()){
  const id=event.event_id||'row-'+i;if(seen.has(id))continue;seen.add(id);
  const site=sites.get(event.site_id),coordinates=Number.isFinite(event.longitude)&&Number.isFinite(event.latitude)?[event.longitude,event.latitude]:site&&Number.isFinite(site.longitude)&&Number.isFinite(site.latitude)?[site.longitude,site.latitude]:null;
  const area=[event.planning_area_by_proxy,site?.area].find(name=>counts.has(name))||(coordinates&&areaAt(coordinates,context.areas));
  if(area){baseline.set(area,baseline.get(area)+1);counts.set(area,counts.get(area)+1);}else unassignedBaseline++;
 }
 for(const p of records){if(p.kind==='preference')continue;const name=p.planning_area||((p.location?.coordinates&&areaAt(p.location.coordinates,context.areas))||null);if(counts.has(name)){community.set(name,community.get(name)+1);counts.set(name,counts.get(name)+1);communityTotal++;}}
 const max=Math.max(0,...counts.values());return {counts,baseline,community,baselineTotal:seen.size,communityTotal,unassignedBaseline,max,leaders:max?[...counts].filter(([,n])=>n===max).map(([name])=>name):[]};
}
export function voteAreas(record,context){
 const valid=new Set(context.areas.features.map(f=>f.properties.name)),names=[...(Array.isArray(record.planning_areas)?record.planning_areas:[])];
 // Older market-specific ballots are retained as area choices, once per ballot.
 for(const id of record.market_site_ids||[]){const site=context.sites.find(s=>s.site_id===id);if(site){const name=valid.has(site.area)?site.area:Number.isFinite(site.longitude)&&Number.isFinite(site.latitude)?areaAt([site.longitude,site.latitude],context.areas):null;if(name)names.push(name);}}
 return [...new Set(names.filter(name=>valid.has(name)))];
}
export function sampleVotes(context,count=240,seed=20261107){
 let state=seed>>>0;const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
 const names=context.areas.features.map(f=>f.properties.name),weighted=names.flatMap(name=>Array(['BEDOK','TAMPINES','QUEENSTOWN','JURONG WEST','YISHUN'].includes(name)?7:1).fill(name));
 if(!weighted.length)return [];
 return Array.from({length:count},(_,i)=>{const areas=new Set();for(let tries=0,n=1+Math.floor(random()*3);areas.size<Math.min(n,names.length)&&tries<100;tries++)areas.add(weighted[Math.floor(random()*weighted.length)]);
 return {id:'DEMO-'+i,kind:'preference',testing:true,simulated:true,role:random()<.7?'customer':'vendor',market_site_ids:[],planning_areas:[...areas],goods:[GOODS[Math.floor(random()*GOODS.length)]],activities:[ACTIVITIES[Math.floor(random()*ACTIVITIES.length)]]};});
}
export function tally(records,context){
 const maps={markets:new Map(),areas:new Map(),goods:new Map(),activities:new Map()};
 const sites=new Set(context.sites.map(s=>s.site_id)),areas=new Set(context.areas.features.map(f=>f.properties.name));
 let count=0;
 for(const p of records){if(p.kind!=='preference')continue;const selected=voteAreas(p,context);if(!selected.length)continue;count++;
  for(const [key,values,valid] of [['markets',p.market_site_ids,sites],['areas',selected,areas],['goods',p.goods,new Set(GOODS)],['activities',p.activities,new Set(ACTIVITIES)]])
   for(const value of new Set(Array.isArray(values)?values:[]))if(valid.has(value))maps[key].set(value,(maps[key].get(value)||0)+1);
 }
 return {...maps,count};
}
