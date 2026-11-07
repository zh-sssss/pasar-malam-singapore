import test from 'node:test';
import assert from 'node:assert/strict';
import {postBody,reviewedPoint,valuesFor,submitToUshahidi} from '../ushahidi.js';
const connection={brandFormId:2,deploymentUrl:'https://example.ushahidi.io',fields:{payload:'payload',point:'point',brand_name:'brand',vendor_id:'vendor',point_type:'type'}};
const payload={kind:'brand',brand_name:'Sample',point_type:'temporary',location:{label:'A market',coordinates:[103.82,1.35]}};
test('v5 fields preserve scalar and media formats and request automatic publication',()=>{
 const schema={form:{id:2},stages:[{id:9}],attributes:[{key:'title',type:'title',form_stage_id:9},{key:'payload',type:'text',form_stage_id:9},{key:'photo',type:'media',form_stage_id:9}]};
 const body=postBody(schema,{...payload,status:'published'},{payload:[JSON.stringify(payload)],photo:[17]},'A title','A description');
 assert.equal(body.status,'published');assert.deepEqual(body.published_to,[]);
 assert.equal(body.post_content[0].fields[1].value.value,JSON.stringify(payload));
 assert.deepEqual(body.post_content[0].fields[2].value.value,[17]);
});

test('Street Walk and resident preference submissions preserve new content and are confirmed publicly',async()=>{
 const originalFetch=globalThis.fetch,writes=[];
 const c={...connection,apiBase:'https://api.example.org',preferenceFormId:3,fields:{...connection.fields,preference_payload:'pref'}};
 globalThis.fetch=async(input,options={})=>{
  const url=String(input);let result;
  if(url.endsWith('ushahidi-client.json'))result={client_id:'public-guest',client_secret:'public-guest'};
  else if(url.endsWith('/oauth/token'))result={access_token:'test-session',expires_in:300};
  else if(url.endsWith('/api/v5/posts')){writes.push(JSON.parse(options.body));result={result:{id:99,status:'published'}};}
  else if(url.endsWith('/api/v5/posts/99'))result={result:{id:99,status:'published'}};
  else if(url.endsWith('/attributes'))result={results:[{key:'title',type:'title',form_stage_id:9},{key:'description',type:'description',form_stage_id:9},{key:'payload',type:'text',form_stage_id:9},{key:'pref',type:'text',form_stage_id:9},{key:'point',type:'point',form_stage_id:9}]};
  else if(url.endsWith('/stages'))result={results:[{id:9}]};
  else result={id:url.endsWith('/3')?3:2,require_approval:false,hide_author:true};
  return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
 };
 try{
  const walk={kind:'streetwalk',version:2,site_id:'s1',location:{label:'Market entrance',coordinates:[103.8,1.3]},caption:'Food lane',video_url:'https://youtu.be/abc'};
  const result=await submitToUshahidi(c,walk,null);assert.equal(result.reference,'U-99');
  assert.equal(writes[0].title,'Street Walk — Market entrance');assert.equal(writes[0].status,'published');
  assert.equal(JSON.parse(writes[0].post_content[0].fields.find(f=>f.key==='payload').value.value).site_id,'s1');
  const preference={kind:'preference',role:'customer',market_site_ids:[],planning_areas:['BEDOK'],goods:['Street food'],activities:['Live music'],other:'More seats'};
  await submitToUshahidi(c,preference,null);assert.equal(writes[1].form_id,3);assert.equal(writes[1].status,'published');
  assert.deepEqual(JSON.parse(writes[1].post_content[0].fields.find(f=>f.key==='pref').value.value),preference);
  assert.match(writes[1].content,/Live music/);
 }finally{globalThis.fetch=originalFetch;}
});
test('only reviewed real location contributions become points, with editorial corrections taking precedence',()=>{
 const post={id:8,form_id:2,status:'draft',post_content:[{fields:[{key:'payload',value:{value:JSON.stringify(payload)}},{key:'point',value:{value:{lon:103.9,lat:1.4}}},{key:'brand',value:{value:'Corrected name'}}]}]};
 assert.equal(reviewedPoint(post,connection),null);
 post.status='published';
 assert.equal(reviewedPoint(post,connection).brand_name,'Corrected name');
 assert.equal(reviewedPoint(post,connection).longitude,103.9);
 assert.equal(reviewedPoint(post,connection).source_url,'https://example.ushahidi.io/feed/8/view?mode=ID');
 assert.equal(reviewedPoint({...post,form_id:3},connection),null);
 post.post_content[0].fields[0].value.value=JSON.stringify({...payload,testing:true});
 assert.equal(reviewedPoint(post,connection),null);
 assert.deepEqual(valuesFor({values:{a:['retained']}}),{a:['retained']});
});
