import {normalizePoints,safeURL} from './model.js';

export function mergeReviewedPoints(baseline,additions){
 const ids=new Set(baseline.map(p=>p.point_id)),names=new Map(baseline.map(p=>[p.vendor_id,p.brand_name])),result=[...baseline];
 for(const raw of additions||[]){
  if(raw?.review_status!=='published'||raw.source_group!=='community_reviewed'||!String(raw.point_id).startsWith('COMM-')||!safeURL(raw.source_url)||ids.has(raw.point_id))continue;
  if(!names.has(raw.vendor_id)&&!String(raw.vendor_id).startsWith('VEN-COMM-'))continue;
  try{
   const [point]=normalizePoints([{...raw,brand_name:names.get(raw.vendor_id)||String(raw.brand_name).slice(0,100)}]);
   if(!point.brand_name||point.longitude<103.55||point.longitude>104.15||point.latitude<1.15||point.latitude>1.5)continue;
   result.push(point);ids.add(point.point_id);names.set(point.vendor_id,point.brand_name);
  }catch{/* An invalid community record must never prevent the research map loading. */}
 }
 return result;
}
export async function loadReviewedPoints(apiBase,baseline){
 if(!apiBase)return baseline;
 try{
  const response=await fetch(apiBase.replace(/\/$/,'')+'/published-locations',{signal:AbortSignal.timeout(3500)});
  if(!response.ok)return baseline;
  const payload=await response.json();return mergeReviewedPoints(baseline,payload.points);
 }catch{return baseline;}
}
