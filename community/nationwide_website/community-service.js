import {loadConnection,submitToUshahidi} from '../site/brand-connections/ushahidi.js';
import {reviewedRecords} from './community-model.js';
let connection;
const mediaCache=new Map();
export const localQa=typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('qa')==='1';
export async function service(){
 connection=await loadConnection();
 if(connection?.transport!=='ushahidi-guest')throw new Error('Community submissions are temporarily unavailable. Please try again later.');
 return connection;
}
export async function send(payload,photo){return submitToUshahidi(connection||await service(),{...payload,...(localQa||String(payload.caption||'').startsWith('[TEST]')?{testing:true}:{})},photo);}
export async function records(){
 const c=connection||await service(),posts=[];
 for(const formId of [c.brandFormId,c.preferenceFormId]){
  let page=1;
  for(;page<=50;page++){
   const query=new URLSearchParams({'status[]':'published','form[]':String(formId),page:String(page),limit:'100'});
   const r=await fetch(c.apiBase+'/api/v5/posts?'+query,{signal:AbortSignal.timeout(10000)});
   if(!r.ok)throw new Error('Published community results could not load. Please retry.');
   const result=await r.json();posts.push(...result.results||[]);if(!result.links?.next)break;
  }
  if(page>50)throw new Error('The published feed is too large to load completely. Results are unavailable.');
 }
 const items=reviewedRecords(posts,c,{includeTesting:localQa});
 await Promise.all(items.map(async item=>{
  if(item.media?.length||!item.media_ids?.length)return;
  item.media=await Promise.all(item.media_ids.map(async id=>{
   try{if(!mediaCache.has(id))mediaCache.set(id,fetch(c.apiBase+'/api/v5/media/'+id,{signal:AbortSignal.timeout(7000)}).then(async r=>{if(!r.ok)throw new Error('Media unavailable');const result=await r.json();return result.result||result;}));return await mediaCache.get(id);}
   catch{mediaCache.delete(id);item.media_error=true;return null;}
  })).then(list=>list.filter(Boolean));
 }));
 return items;
}
