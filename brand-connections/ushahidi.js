// The hosted platform's public guest client submits to surveys configured for automatic publication.
// No administrator password, session or token is used by this module.
let guest;
const clientUrl=new URL('./data/ushahidi-client.json',import.meta.url);
export async function loadConnection(options={}){
 if(options.apiBase)return options;
 try{return await read(await fetch(new URL('./data/feedback-service.json',import.meta.url),{signal:AbortSignal.timeout(3500)}));}
 catch{return options;}
}
async function read(response){
 const data=await response.json().catch(()=>null);
 if(!response.ok||!data)throw new Error('Ushahidi could not confirm this request. Please try again later.');
 return data;
}
export function valuesFor(post){
 if(post.values)return post.values;
 const values={};
 for(const stage of post.post_content||[])for(const field of stage.fields||[]){
  const value=field.value;
  values[field.key]=Array.isArray(value)?value.map(item=>item.value):[value?.value];
 }
 return values;
}
export function reviewedPoint(post,connection){
 if(post.status!=='published'||String(post.form_id??post.form?.id)!==String(connection.brandFormId))return null;
 const fields=connection.fields,values=valuesFor(post),first=key=>values[fields[key]]?.[0];
 try{
  const payload=JSON.parse(first('payload'));
  if(payload.testing||String(payload.brand_name||'').startsWith('[TEST]')||!['brand','location'].includes(payload.kind))return null;
  const point=first('point'),coordinates=point?[Number(point.lon),Number(point.lat)]:payload.location?.coordinates;
  if(!coordinates?.every(Number.isFinite))return null;
  const vendorId=first('vendor_id')||payload.vendor_id||(payload.kind==='brand'?'VEN-COMM-'+post.id:null);
  const type=first('point_type')||payload.point_type;
  if(!vendorId||!['permanent','temporary'].includes(type))return null;
  return {point_id:'COMM-'+post.id,vendor_id:String(vendorId),brand_name:String(first('brand_name')||payload.brand_name||'').slice(0,100),point_type:type,
   location_name:String(payload.location?.label||'Community map pin').slice(0,180),longitude:coordinates[0],latitude:coordinates[1],address:null,
   coordinate_precision:'community_selected_map_pin',operating_status:'status_not_shown',source_group:'community_submitted',review_status:'published',
   source_url:connection.deploymentUrl.replace(/\/$/,'')+'/feed/'+post.id+'/view?mode=ID',checked_on:String(post.updated||post.created||'').slice(0,10),category:first('category')||payload.category};
 }catch{return null;}
}
export function postBody(schema,payload,values,title,description){
 const post_content=schema.stages.map(stage=>({...stage,fields:schema.attributes.filter(f=>f.form_stage_id===stage.id).map(field=>{
  let value=values[field.key]?.[0]??(field.type==='media'?[]:null);
  if(field.type==='title')value=title;
  if(field.type==='description')value=description;
  if(field.type==='media')value=values[field.key]||[];
  return {...field,value:{value}};
 })}));
 return {form_id:Number(schema.form.id),type:'report',title,content:description,status:'published',published_to:[],post_content,base_language:'en',enabled_languages:{},completed_stages:[]};
}
async function tokenFor(connection,signal){
 if(guest?.origin===connection.apiBase&&guest.until>Date.now())return guest.token;
 const client=await read(await fetch(clientUrl,{signal}));
 const body=new URLSearchParams({grant_type:'client_credentials',client_id:client.client_id,client_secret:client.client_secret,scope:'posts media forms'});
 const auth=await read(await fetch(connection.apiBase+'/oauth/token',{method:'POST',body,signal}));
 if(!auth.access_token)throw new Error('Guest submission is temporarily unavailable.');
 guest={origin:connection.apiBase,token:auth.access_token,until:Date.now()+Math.min(Number(auth.expires_in)||300,300)*1000-10000};
 return guest.token;
}
export async function submitToUshahidi(connection,payload,photo,{signal}={}){
 if(String(payload.brand_name||'').startsWith('[TEST]'))payload={...payload,testing:true};
 if(payload.website)throw new Error('The submission could not be accepted.');
 const formId=payload.kind==='preference'?connection.preferenceFormId:connection.brandFormId;
 const get=async route=>read(await fetch(connection.apiBase+'/api/v3/'+route,{signal}));
 const [form,attributes,stages]=await Promise.all([get('forms/'+formId),get('forms/'+formId+'/attributes'),get('forms/'+formId+'/stages')]);
 if(form.require_approval||!form.hide_author)throw new Error('Automatic publication is not configured yet. Your information has not been sent.');
 const token=await tokenFor(connection,signal),headers={Authorization:'Bearer '+token};
 const fields=connection.fields,key=payload.kind==='preference'?fields.preference_payload:fields.payload;
 const values={[key]:[JSON.stringify(payload)]};
 if(payload.kind!=='preference'){
  for(const name of ['vendor_id','brand_name','point_type','category'])if(fields[name]&&payload[name])values[fields[name]]=[payload[name]];
  if(payload.location?.coordinates)values[fields.point]=[{lon:payload.location.coordinates[0],lat:payload.location.coordinates[1]}];
 }
 if(photo){
  if(!payload.photo_permission||payload.kind==='preference')throw new Error('Confirm permission to share the photo.');
  const body=new FormData();body.set('file',photo,'stall-photo.jpg');body.set('caption','Community contribution.');
  const upload=await read(await fetch(connection.apiBase+'/api/v5/media',{method:'POST',headers,body,signal}));
  const media=upload.result||upload;if(!media.id)throw new Error('The photo upload was not confirmed.');values[fields.photo]=[media.id];
 }
 const title=payload.kind==='preference'?'Future market preference':payload.kind==='area_information'?'Market information — '+payload.planning_area:payload.kind==='streetwalk'?'Street Walk — '+payload.location.label:String(payload.brand_name+' — '+payload.location.label).slice(0,180);
 const description=payload.kind==='preference'?['Areas: '+payload.planning_areas.join(', '),'Future sites: '+payload.market_site_ids.join(', '),'Goods: '+(payload.goods||[]).join(', '),'Activities: '+(payload.activities||[]).join(', '),payload.other].filter(Boolean).join('\n'):[payload.caption,payload.brand_name,payload.category,payload.products,payload.planning_area,payload.location?.label,payload.video_url].filter(Boolean).join('\n');
 const body=postBody({form,attributes:attributes.results,stages:stages.results},payload,values,payload.testing?'[TEST] '+title:title,description);
 const response=await read(await fetch(connection.apiBase+'/api/v5/posts',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body),signal}));
 const post=response.result||response;
 if(!post.id)throw new Error('The server did not confirm a saved record.');
 // Read-back confirmation prevents local-only success indicators and duplicate retries.
 let visible=false;
 for(let attempt=0;attempt<5;attempt++){
  try{const check=await read(await fetch(connection.apiBase+'/api/v5/posts/'+post.id,{signal}));const published=check.result||check;if(published.status==='published'){visible=true;break;}}catch{}
  if(attempt<4)await new Promise(resolve=>setTimeout(resolve,1000));
 }
 return {status:visible?'published':'syncing',reference:'U-'+post.id,id:String(post.id)};
}
export async function publishedFromUshahidi(connection){
 const points=[];
 for(let page=1;page<=50;page++){
  const query=new URLSearchParams({'status[]':'published','form[]':String(connection.brandFormId),page:String(page),limit:'100'});
  const data=await read(await fetch(connection.apiBase+'/api/v5/posts?'+query,{signal:AbortSignal.timeout(3500)}));
  for(const post of data.results||[]){const point=reviewedPoint(post,connection);if(point)points.push(point);}
  if(!data.links?.next)break;
 }
 return points;
}
