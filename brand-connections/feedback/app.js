import {CATEGORIES,upcomingSites,toggleChoice,validateSubmission} from './model.js';
import {createFeedbackMap} from './map.js';
import {preparePhoto,submitFeedback} from './api.js';
import {loadConnection} from '../ushahidi.js';
import {loadReviewedPoints} from '../community.js';

const element=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
export async function mountFeedback(container,options={}){
 options={...options,...await loadConnection(options)};
 const abort=new AbortController();
 const load=async url=>{const r=await fetch(url,{signal:abort.signal});if(!r.ok)throw new Error('The local display context is missing.');return r.json();};
 const [runtime,context]=await Promise.all([options.runtime||load(new URL('../data/runtime.json',import.meta.url)),options.context||load(new URL('../data/feedback-context.json',import.meta.url))]);
 runtime.points=await loadReviewedPoints(options,runtime.points);
 const brands=[...new Map(runtime.points.map(p=>[p.vendor_id,{id:p.vendor_id,name:p.brand_name}])).values()].sort((a,b)=>a.name.localeCompare(b.name));
 const upcoming=upcomingSites(context),located=context.sites.filter(s=>Number.isFinite(s.longitude)&&Number.isFinite(s.latitude));
 const state={page:'report',kind:'brand',location:null,marketIds:[],areas:[],photo:null,preview:null,busy:false};
 container.className='fb-root';container.innerHTML=`
 <header class="fb-header"><a class="fb-back" href="../">↖ Back to the brand map</a><span class="fb-chapter">A MAP MADE TOGETHER</span></header>
 <div class="fb-layout"><section class="fb-sheet" aria-label="Community feedback">
  <div class="fb-intro"><span class="fb-kicker">YOUR NEXT MARKET STORY</span><h1>Put it<br>on the map<span>.</span></h1><p>Know a stall we missed, or a place you would love to trade? Tell us in a minute.</p></div>
  <div class="fb-entry-tabs" role="group" aria-label="Choose a feedback form"><button type="button" data-page="report" aria-pressed="true"><strong>＋ Share a discovery</strong><small>For customers & vendors</small></button><button type="button" data-page="preference" aria-pressed="false"><strong>↗ Pick your next stop</strong><small>For vendors</small></button></div>
  <p class="fb-preview" hidden>Preview · submissions are not open yet. You can explore and fill in the form; nothing is sent or saved.</p>
  <form class="fb-form">
   <section class="fb-report">
    <fieldset><legend>I am a…</legend><div class="fb-radio-row"><label><input type="radio" name="role" value="customer" checked> Customer</label><label><input type="radio" name="role" value="vendor"> Vendor</label></div></fieldset>
    <fieldset><legend>What is missing?</legend><div class="fb-radio-row"><label><input type="radio" name="kind" value="brand" checked> A new brand</label><label><input type="radio" name="kind" value="location"> A brand's location</label></div></fieldset>
    <label class="fb-field fb-new-name">Brand name <input name="brand_name" maxlength="100" placeholder="What is the stall called?" required autocomplete="organization"></label>
    <label class="fb-field fb-existing-name" hidden>Choose the brand <select name="vendor_id" disabled><option value="">Select a brand</option></select></label>
    <label class="fb-field fb-category">Shop category <select name="category" required><option value="">Choose one</option></select></label>
    <label class="fb-field fb-products">What do they sell? <span>Optional</span><input name="products" maxlength="200" placeholder="e.g. matcha drinks, handmade jewellery"></label>
    <fieldset class="fb-type" hidden><legend>This location is a…</legend><div class="fb-radio-row"><label><input type="radio" name="point_type" value="temporary" checked> Temporary stall</label><label><input type="radio" name="point_type" value="permanent"> Permanent store</label></div></fieldset>
    <div class="fb-location"><h2>Where did you find it?</h2><p>Tap a green market dot, or tap the map to place a new pin.</p><label class="fb-field">Or choose a recorded market <select name="market_picker"><option value="">Choose a market</option></select></label><div class="fb-picked"><span class="fb-picked-label">No location chosen yet</span><button type="button" class="fb-clear" hidden aria-label="Clear chosen location">×</button></div></div>
    <label class="fb-photo-label">Add a shop photo <span>Optional</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG or WebP · up to 8 MB</small></label>
    <div class="fb-photo-preview" hidden><img alt="Your selected shop photo"><button type="button" class="fb-remove-photo">Remove photo</button><label><input name="photo_permission" type="checkbox"> I took this photo or have permission to share it for this map.</label></div>
   </section>
   <section class="fb-preference" hidden>
    <h2>Where would you like to trade?</h2><p class="fb-help">Choose up to <strong>3 upcoming market locations</strong> and up to <strong>3 planning areas</strong>. One choice is enough.</p>
    <div class="fb-choice-heading"><h3>Upcoming market locations</h3><span class="fb-market-counter">0 / 3</span></div><p class="fb-context-note"></p><div class="fb-upcoming"></div>
    <div class="fb-choice-heading"><h3>Preferred planning areas</h3><span class="fb-area-counter">0 / 3</span></div><div class="fb-area-picker"><label class="fb-field">Choose an area<select name="area_picker"><option value="">Select a planning area</option></select></label><button type="button" class="fb-add-area">Add</button></div><p class="fb-help">Or tap a planning area on the map.</p><div class="fb-area-chips" aria-live="polite"></div>
    <p class="fb-intention-note">This is an expression of interest, not a booking or approval to trade.</p>
   </section>
   <div class="fb-honeypot" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
   <p class="fb-form-status" role="alert"></p><p class="fb-review-note">A map editor reviews each contribution. Approved brands and locations can appear on the atlas. Your name and email are not required.</p>
   <button type="submit" class="fb-submit">Submit for review <span>↗</span></button>
  </form>
  <section class="fb-success" hidden aria-live="polite"><span class="fb-success-mark">✓</span><h2>Thank you for<br>adding your story.</h2><p>Your contribution is awaiting review. It has not been added to the public map yet.</p><p class="fb-reference"></p><a href="../">Back to the brand map ↗</a></section>
 </section>
 <section class="fb-map-panel" aria-label="Choose locations on the map"><div class="fb-map"></div><div class="fb-map-top"><span class="fb-map-instruction">Tap a market or drop a pin</span><button type="button" class="fb-map-fit">↗ View all</button></div><div class="fb-map-note" role="status"></div><div class="fb-map-key"><span><i class="fb-dot"></i> Recorded market</span><span><i class="fb-dot fb-selected-dot"></i> Your selection</span><small class="fb-map-count"></small></div></section></div>`;
 const q=s=>container.querySelector(s);
 for(const brand of brands){const option=element('option',brand.name);option.value=brand.id;q('[name=vendor_id]').append(option);}
 for(const category of CATEGORIES){const option=element('option',category);option.value=category;q('[name=category]').append(option);}
 for(const site of [...located].sort((a,b)=>a.name.localeCompare(b.name))){const option=element('option',site.name);option.value=site.site_id;q('[name=market_picker]').append(option);}
 const areaNames=context.areas.features.map(f=>f.properties.name).sort();
 for(const name of areaNames){const option=element('option',name);option.value=name;q('[name=area_picker]').append(option);}
 const preferred=new URLSearchParams(location.search).get('brand');if(brands.some(b=>b.id===preferred))q('[name=vendor_id]').value=preferred;
 const connected=Boolean(options.apiBase);q('.fb-preview').hidden=connected;q('.fb-submit').disabled=!connected;
 q('.fb-context-note').textContent='Announced dates from the '+context.as_of+' research snapshot; plans may change.';
 q('.fb-map-count').textContent=located.length+' located market sites'+(located.length<context.sites.length?' · '+(context.sites.length-located.length)+' without coordinates':'');
 const notice=message=>{q('.fb-map-note').textContent=message;};
 let map;
 const highlight=()=>map.setSelection({siteIds:state.page==='report'?(state.location?.site_id?[state.location.site_id]:[]):state.marketIds,areas:state.page==='preference'?state.areas:[],pin:state.page==='report'&&state.location?.kind==='pin'?state.location.coordinates:null});
 function chooseMarket(site){
  if(state.page==='preference'){
   if(!upcoming.some(s=>s.site_id===site.site_id)){notice('That site has no future start date in this snapshot. Choose one of the upcoming markets.');return;}
   const change=toggleChoice(state.marketIds,site.site_id);if(change.limited){notice('You can choose up to 3 upcoming locations. Remove one to change your choice.');return;}state.marketIds=change.values;renderChoices();return;
  }
  state.location={kind:'market',site_id:site.site_id,label:site.name,coordinates:[site.longitude,site.latitude]};q('[name=market_picker]').value=site.site_id;renderLocation();map.focus(state.location.coordinates);
 }
 function renderLocation(){
  q('.fb-picked-label').textContent=state.location?state.location.label+' · '+state.location.coordinates.map(n=>n.toFixed(5)).join(', '):'No location chosen yet';
  q('.fb-clear').hidden=!state.location;highlight();notice(state.location?'Your chosen location is highlighted in coral.':'Tap a market or place a new pin.');
 }
 function chooseArea(name){const change=toggleChoice(state.areas,name);if(change.limited){notice('You can choose up to 3 planning areas. Remove one to change your choice.');return;}state.areas=change.values;renderChoices();}
 function renderChoices(){
  q('.fb-market-counter').textContent=state.marketIds.length+' / 3';q('.fb-area-counter').textContent=state.areas.length+' / 3';
  for(const button of q('.fb-upcoming').querySelectorAll('button'))button.setAttribute('aria-pressed',String(state.marketIds.includes(button.dataset.id)));
  q('.fb-area-chips').replaceChildren(...state.areas.map(name=>{const button=element('button',name+' ×','fb-chip');button.type='button';button.setAttribute('aria-label','Remove '+name);button.onclick=()=>chooseArea(name);return button;}));highlight();notice('Your selected markets and planning areas are highlighted.');
 }
 map=createFeedbackMap(q('.fb-map'),{context,mapboxToken:options.mapboxToken,onMarket:chooseMarket,onPin(coordinates,area){state.location={kind:'pin',coordinates,label:'New pin in '+area};q('[name=market_picker]').value='';renderLocation();},onArea:chooseArea,onNotice:notice});
 if(!upcoming.length)q('.fb-upcoming').append(element('p','There are no future start dates left in this snapshot. You can still choose planning areas.','fb-help'));
 for(const site of upcoming){const button=element('button',undefined,'fb-upcoming-card');button.type='button';button.dataset.id=site.site_id;button.setAttribute('aria-pressed','false');button.append(element('strong',site.name),element('small',site.start_date+' → '+(site.end_date||'end date unconfirmed')));button.onclick=()=>chooseMarket(site);q('.fb-upcoming').append(button);}
 function updateKind(){
  state.kind=q('[name=kind]:checked').value;const existing=state.kind==='location';
  q('.fb-new-name').hidden=existing;q('[name=brand_name]').disabled=existing;q('[name=brand_name]').required=!existing;
  q('.fb-existing-name').hidden=!existing;q('[name=vendor_id]').disabled=!existing;q('[name=vendor_id]').required=existing;
  q('.fb-category').hidden=existing;q('[name=category]').disabled=existing;q('[name=category]').required=!existing;
  q('.fb-products').hidden=existing;q('.fb-type').hidden=!existing;
 }
 function setPage(page){
  state.page=page;const report=page==='report';q('.fb-report').hidden=!report;q('.fb-preference').hidden=report;
  for(const field of q('.fb-report').querySelectorAll('input,select'))field.disabled=!report;
  if(report)updateKind();
  q('[name=photo_permission]').required=report&&Boolean(state.photo);
  for(const button of container.querySelectorAll('[data-page]'))button.setAttribute('aria-pressed',String(button.dataset.page===page));
  q('.fb-map-instruction').textContent=report?'Tap a market or drop a pin':'Choose markets or tap planning areas';
  map.setMode(report?'report':'areas');if(!report)map.fit();highlight();notice(report?'Tap any green market dot, or choose a new location.':'Tap planning areas, or choose upcoming markets from the list.');q('.fb-form-status').textContent='';
 }
 for(const button of container.querySelectorAll('[data-page]'))button.addEventListener('click',()=>setPage(button.dataset.page),{signal:abort.signal});
 for(const radio of container.querySelectorAll('[name=kind]'))radio.addEventListener('change',updateKind,{signal:abort.signal});
 q('[name=market_picker]').addEventListener('change',event=>{const site=located.find(s=>s.site_id===event.target.value);if(site)chooseMarket(site);},{signal:abort.signal});
 q('.fb-clear').onclick=()=>{state.location=null;q('[name=market_picker]').value='';renderLocation();};
 q('.fb-add-area').onclick=()=>{const name=q('[name=area_picker]').value;if(name){if(state.areas.includes(name)){notice('That area is already selected.');return;}chooseArea(name);map.setMode('areas');}};
 q('[name=area_picker]').onfocus=()=>{if(state.page==='preference')map.setMode('areas');};
 q('.fb-map-fit').onclick=()=>map.fit();
 function clearPhoto(){if(state.preview)URL.revokeObjectURL(state.preview);state.photo=null;state.preview=null;q('.fb-photo-preview').hidden=true;q('[name=photo]').value='';q('[name=photo_permission]').required=false;q('[name=photo_permission]').checked=false;}
 q('.fb-remove-photo').onclick=clearPhoto;
 q('[name=photo]').addEventListener('change',async event=>{
  const file=event.target.files[0];clearPhoto();if(!file)return;
  try{state.photo=await preparePhoto(file);state.preview=URL.createObjectURL(state.photo);q('.fb-photo-preview img').src=state.preview;q('.fb-photo-preview').hidden=false;q('[name=photo_permission]').required=true;q('.fb-form-status').textContent='';}catch(error){q('.fb-form-status').textContent=error.message;}
 },{signal:abort.signal});
 q('form').addEventListener('submit',async event=>{
  event.preventDefault();if(state.busy)return;
  if(!connected){q('.fb-form-status').textContent='Submissions are not open yet. Nothing has been sent or saved.';return;}
  if(!q('form').reportValidity())return;
  const data=new FormData(q('form')),brand=brands.find(b=>b.id===data.get('vendor_id'));
  const payload=state.page==='preference'?{kind:'preference',role:'vendor',market_site_ids:state.marketIds,planning_areas:state.areas}:{kind:state.kind,role:data.get('role'),brand_name:state.kind==='location'?brand?.name:String(data.get('brand_name')||'').trim(),vendor_id:state.kind==='location'?brand?.id:null,category:state.kind==='brand'?data.get('category'):null,products:state.kind==='brand'?String(data.get('products')||'').trim():'',point_type:state.kind==='brand'?'temporary':data.get('point_type'),location:state.location,photo_permission:Boolean(data.get('photo_permission'))};
  payload.website=String(data.get('website')||'');payload.client_id=crypto.randomUUID();
  const errors=validateSubmission(payload,context,runtime.points);if(errors.length){q('.fb-form-status').textContent=errors[0];return;}
  state.busy=true;q('.fb-submit').disabled=true;q('.fb-submit').textContent='Sending…';q('.fb-form-status').textContent='';
  try{const result=await submitFeedback(options,payload,state.page==='report'?state.photo:null,{signal:abort.signal});q('form').hidden=true;q('.fb-success').hidden=false;q('.fb-entry-tabs').hidden=true;q('.fb-reference').textContent='Reference: '+result.reference;}
  catch(error){if(error.name!=='AbortError')q('.fb-form-status').textContent=error.message;}
  finally{state.busy=false;q('.fb-submit').disabled=!connected;q('.fb-submit').textContent='Submit for review ↗';}
 },{signal:abort.signal});
 setPage('report');
 return {destroy(){abort.abort();if(state.preview)URL.revokeObjectURL(state.preview);map.destroy();container.replaceChildren();},getState(){return {page:state.page,kind:state.kind,location:state.location,marketIds:[...state.marketIds],areas:[...state.areas],connected};}};
}
