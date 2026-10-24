'use strict';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = value => value == null ? '—' : new Intl.NumberFormat('en-SG',{maximumFractionDigits:0}).format(value);
const distance = value => value == null ? 'Unknown' : value >= 1000 ? `${(value/1000).toFixed(2)} km` : `${num(value)} m`;
const statusNames = {past_announced:'Past announced window',within_announced_window:'Within announced window',future_announced:'Future announcement',conflicting_dates:'Conflicting dates',partial_or_invalid_dates:'Incomplete dates'};
const state = {tab:'distribution',month:'all',area:'all',status:'all',selected:null,brand:null,multiOnly:true,paused:false};
let data,map,commercialData,pointOnlyData;
let marketMarkers=[],brandMarkers=[],brandConnections=[],brandSvg=null;
const zoneCache = new Map();
let zoneRequest = 0, toastTimer, mapReady = false;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const COLORS={green:'#37634f',orange:'#c77343',purple:'#796195',muted:'#a5afa3'};
const siteById = new Map(), eventById = new Map();
const safeUrl = url => {try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?esc(u.href):null;}catch{return null;}};
const sourceLinks = urls => [...new Set(String(urls||'').split(';').filter(Boolean))].map((url,i)=>{const href=safeUrl(url);return href?`<a href="${href}" target="_blank" rel="noopener">Source ${i+1} ↗</a>`:'';}).join('');
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
async function json(path){
  // Static Pages cannot set Content-Encoding for precompressed assets. Decode
  // explicitly, with original GeoJSON retained as an older-browser runtime fallback.
  if(path.endsWith('.geojson')&&typeof DecompressionStream!=='undefined'){
    const packed=await fetch(path+'.gz');
    if(packed.ok)return new Response(packed.body.pipeThrough(new DecompressionStream('gzip'))).json();
  }
  const r=await fetch(path);if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);return r.json();
}
function isUncertain(e){return e.date_conflict||['conflicting_dates','partial_or_invalid_dates'].includes(e.calendar_status);}
function monthState(e){
  if(state.month==='all')return 'match';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(e.start_date)||!/^\d{4}-\d{2}-\d{2}$/.test(e.end_date)||e.end_date<e.start_date)return 'unknown';
  const month=String(state.month).padStart(2,'0'),start=`2026-${month}-01`;
  const end=new Date(Date.UTC(2026,Number(state.month),0)).toISOString().slice(0,10);
  return e.start_date<=end&&e.end_date>=start?'match':'outside';
}
function nonMonthMatch(e){return (state.area==='all'||e.planning_area_by_proxy===state.area)&&(state.status==='all'||(state.status==='uncertain'?isUncertain(e):e.calendar_status===state.status));}
function filteredEvents(){return data.events.filter(e=>nonMonthMatch(e)&&monthState(e)==='match');}
function currentSites(){const ids=new Set(filteredEvents().map(e=>e.site_id));return data.sites.filter(s=>ids.has(s.site_id));}
function eventsFor(s){return filteredEvents().filter(e=>e.site_id===s.site_id);}
function dateText(e){return e.start_date&&e.end_date?`${e.start_date} — ${e.end_date}`:e.raw_date_text||'Date not established';}
function statusText(e){return isUncertain(e)?(e.date_conflict?'Conflicting dates':statusNames[e.calendar_status]||'Date uncertain'):statusNames[e.calendar_status]||e.calendar_status;}
function eventCards(events){return events.map(e=>`<article class="event-card"><span class="event-status ${isUncertain(e)?'uncertain':''}">${esc(statusText(e))}</span><h3>${esc(e.event_name)}</h3><p class="event-date">${esc(dateText(e))}</p><div class="source-links">${sourceLinks(e.source_urls)}</div></article>`).join('');}
function stats(items){return `<div class="stats">${items.map(([value,label])=>`<div class="stat"><strong>${num(value)}</strong><span>${label}</span></div>`).join('')}</div>`;}
function unknownMonthNote(){const count=state.month==='all'?0:data.events.filter(e=>nonMonthMatch(e)&&monthState(e)==='unknown').length;return count?`<p class="note">${count} record(s) cannot be assigned to a month and are excluded from this month filter.</p>`:'';}
function highlightedBuildingIds(sites){
  const selected=state.tab==='oda'&&sites.find(s=>s.site_id===state.selected);
  const relevant=selected?[selected]:sites;
  return new Set(relevant.flatMap(s=>s.metrics?.nearby_50m_building_ids||[]));
}
function syncMonth(){
  const all=state.month==='all';
  $('allYear').setAttribute('aria-pressed',String(all));
  $('monthLabel').textContent=all?'All of 2026':new Date(2026,Number(state.month)-1).toLocaleString('en',{month:'long'})+' 2026';
  $('month').setAttribute('aria-valuetext',all?'All of 2026; drag to choose a month':$('monthLabel').textContent);
}

function render(){
  const events=filteredEvents(),sites=currentSites();
  if(state.selected&&!sites.some(s=>s.site_id===state.selected))state.selected=null;
  document.body.dataset.chapter=state.tab;
  syncMonth();
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===state.tab)));
  if(state.tab==='distribution')renderDistribution(events,sites);
  else if(state.tab==='oda')renderOda(events,sites);
  else renderBrands(events);
  $('mapStatus').textContent=`${events.length} matching episodes · ${sites.filter(s=>s.longitude!==null).length} mapped sites · ${data.counts.commercial_points.toLocaleString()} commercial addresses`;
  updateMap();
}
function renderDistribution(events,sites){
  const missing=events.filter(e=>e.longitude===null).length;
  $('content').innerHTML=stats([[events.length,'market episodes'],[sites.length,'distinct sites'],[data.counts.commercial_points,'commercial addresses']])+`<p class="note">Click a market representative point on the map to rotate and zoom into a 3D view with its name, activity dates and sources.</p><p class="note">Light buildings show the island-wide HDB commercial context. Dark buildings are within 50 m of the filtered market points.</p>${unknownMonthNote()}${missing?`<div class="callout">${missing} matching episode has no mapped location. It remains in the total.</div>`:''}${!sites.length?'<p class="empty">No markets match these filters.</p>':''}`;
}
function renderOda(events,sites){
  const s=sites.find(s=>s.site_id===state.selected);
  let html='<span class="eyebrow">02 / POTENTIAL ODA</span>';
  if(!s){
    html+=`<h2 class="site-title">Explore a market.</h2><p class="note">Click a market representative point to rotate and zoom into a 3D view and view its information.</p><p class="note">Light buildings show all HDB commercial buildings. Dark buildings are within 50 m of the filtered market points. The orange edges show the fixed 2 m modelled ODA candidate bands.</p>${unknownMonthNote()}${!sites.length?'<p class="empty">No markets match these filters.</p>':''}`;
  }else{
    html+=`<div class="section-line"><button class="back-link" id="clearSite">← Island overview</button><span>${esc(s.area||'Area unassigned')}</span></div><h2 class="site-title">${esc(s.name)}</h2><div class="section-line"><h3 style="margin:0;font-size:12px">Activity dates</h3><span>${eventsFor(s).length} episode(s)</span></div>${eventCards(eventsFor(s))}`;
  }
  $('content').innerHTML=html;
  $('clearSite')?.addEventListener('click',()=>{state.selected=null;render();overview();});
}

function visibleBrands(events){const ids=new Set(events.map(e=>e.event_id));return data.brands.map(b=>({...b,matching:b.appearances.filter(a=>ids.has(a.event_id))})).map(b=>({...b,matchingSites:[...new Set(b.matching.map(a=>a.site_id))]})).filter(b=>b.matching.length&&(!state.multiOnly||b.matchingSites.length>1));}
function renderBrands(events){
  const brands=visibleBrands(events);if(!brands.some(b=>b.vendor_id===state.brand))state.brand=brands[0]?.vendor_id||null;
  const b=brands.find(b=>b.vendor_id===state.brand);
  let html=`<span class="eyebrow">03 / REPORTED CONNECTIONS</span><h2 class="site-title">Names across<br>the island.</h2><p class="note">Follow reported brand appearances across markets. Animated links express a shared name key, not travel or personal movement.</p><label class="check-label"><input id="multiOnly" type="checkbox" ${state.multiOnly?'checked':''}> Show multi-site brands only</label><label for="brandPicker">Choose a reported brand</label><select class="brand-picker" id="brandPicker">${brands.length?brands.map(x=>`<option value="${esc(x.vendor_id)}" ${x.vendor_id===state.brand?'selected':''}>${esc(x.name)} · ${x.matchingSites.length} site(s)</option>`).join(''):'<option>No matching brands</option>'}</select>${unknownMonthNote()}`;
  if(b){
    html+=`<div class="section-line"><h3 style="margin:0;font:23px Georgia">${esc(b.name)}</h3><button id="fitBrand" class="back-link">Fit sites ↗</button></div>${stats([[b.matchingSites.length,'matching sites'],[new Set(b.matching.map(a=>a.event_id)).size,'market episodes'],[b.matching.length,'source associations']])}<p class="note">Identity status: ${esc(b.identity_status.replaceAll('_',' '))}. Separate spellings remain separate.</p><button id="pause" class="animate-toggle">${state.paused?'Resume animation':'Pause animation'}</button>${reduced.matches?'<p class="note">Animation is off because your device requests reduced motion.</p>':''}${b.matchingSites.length<2?'<div class="callout">Only one site matches. No cross-site connection can be drawn.</div>':''}<div class="section-line"><h2>Reported appearances</h2></div>`;
    for(const sid of b.matchingSites){const s=siteById.get(sid);html+=`<div class="site-row"><span class="site-dot" style="background:var(--purple)"></span><span class="row-main"><strong>${esc(s?.name||sid)}</strong><small>${esc(s?.area||'Unknown location')}</small></span></div>`;
      for(const a of b.matching.filter(x=>x.site_id===sid)){const e=eventById.get(a.event_id);html+=`<article class="event-card"><h3>${esc(e?.event_name||a.event_id)}</h3><p class="event-date">${e?esc(dateText(e)):'Date unknown'}</p><span class="event-status ${e&&isUncertain(e)?'uncertain':''}">${e?esc(statusText(e)):''}</span><p class="note">${esc(a.presence_basis.replaceAll('_',' '))} · ${esc(a.time_precision.replaceAll('_',' '))}</p><div class="source-links">${sourceLinks(a.source_url)}</div></article>`;}
    }
  }else html+='<div class="empty">No brands match these filters. Try all months or turn off “multi-site brands only”.</div>';
  $('content').innerHTML=html;
  $('multiOnly').addEventListener('change',e=>{state.multiOnly=e.target.checked;render();});
  $('brandPicker').addEventListener('change',e=>{state.brand=e.target.value;render();fitBrand();});
  $('pause')?.addEventListener('click',()=>{state.paused=!state.paused;render();});
  $('fitBrand')?.addEventListener('click',fitBrand);
}

function focus3D(s){
  if(s?.longitude==null)return;
  const offset=innerWidth>760?[190,0]:[0,-innerHeight*.24];
  map.flyTo({center:[s.longitude,s.latitude],zoom:17.2,pitch:60,bearing:(map.getBearing()+40)%360,
    offset,padding:{top:0,bottom:0,left:0,right:0},duration:reduced.matches?0:2200,essential:false});
}
function selectSite(id){
  state.selected=id;state.tab='oda';map.closePopup?.();render();$('panelScroll').scrollTop=0;
  const s=siteById.get(id);
  if(s?.longitude!=null)focus3D(s);else toast('Location not established. The record remains in the research dataset.');
}
function cameraPadding(){return innerWidth>760?{top:80,bottom:75,left:435,right:100}:{top:85,bottom:Math.round(innerHeight*.54),left:20,right:20};}
function overview(){map.fitBounds([[103.61,1.22],[104.035,1.475]],{padding:cameraPadding(),retainPadding:false,pitch:0,bearing:0,duration:reduced.matches?0:1300});}
function fitBrand(){
  const b=visibleBrands(filteredEvents()).find(b=>b.vendor_id===state.brand);
  const sites=(b?.matchingSites||[]).map(id=>siteById.get(id)).filter(s=>s?.longitude!=null);
  if(!sites.length)return;
  const bounds=new mapboxgl.LngLatBounds();sites.forEach(s=>bounds.extend([s.longitude,s.latitude]));
  map.fitBounds(bounds,{maxZoom:15,padding:cameraPadding(),retainPadding:false,pitch:0,bearing:0,duration:reduced.matches?0:1000});
}
function updateLegend(){let lines='<div><i class="key-market"></i>Market representative point</div><div><i class="key-building"></i>All HDB commercial buildings</div><div><i class="key-nearby"></i>Commercial buildings within 50 m</div>';
  if(state.tab==='distribution')lines+='<div><i class="key-future"></i>Future / uncertain announcement</div>';
  if(state.tab==='oda')lines+='<div><i class="key-zone"></i>Modelled ODA Candidate Zones · 2 m</div>';
  if(state.tab==='brands')lines+='<div><i class="key-brand"></i>Reported brand association</div>';
  $('legend').innerHTML='<strong>MAP KEY</strong>'+lines;
}
function markerGroups(sites){
  const groups=new Map();for(const s of sites){if(s.longitude==null)continue;const key=s.longitude+','+s.latitude;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s);}
  return [...groups.values()];
}
function updateMap(){
  if(!mapReady)return;updateLegend();marketMarkers.forEach(m=>m.remove());brandMarkers.forEach(m=>m.remove());marketMarkers=[];brandMarkers=[];brandConnections=[];
  const sites=currentSites();
  for(const group of markerGroups(sites)){
    const s=group[0],events=group.flatMap(eventsFor),special=events.every(e=>e.calendar_status==='future_announced'||isUncertain(e));
    const el=document.createElement('button');el.type='button';el.className='market-marker'+(special?' uncertain':'');
    const label=group.length===1?'View market: '+s.name:'View '+group.length+' markets at this point';
    el.setAttribute('aria-label',label);el.title=group.map(x=>x.name).join('\n');el.style.setProperty('--marker-size',Math.min(22,9+Math.sqrt(events.length)*2)+'px');
    el.addEventListener('click',()=>{
      if(group.length===1){selectSite(s.site_id);return;}
      focus3D(s);
      const box=document.createElement('div');const heading=document.createElement('p');heading.textContent='Multiple market records share this representative point. Select a market:';box.appendChild(heading);
      const popup=new mapboxgl.Popup({maxWidth:'290px'}).setLngLat([s.longitude,s.latitude]).setDOMContent(box).addTo(map);
      group.forEach(site=>{const button=document.createElement('button');button.className='popup-market';button.textContent=site.name;button.onclick=()=>{popup.remove();selectSite(site.site_id);};box.appendChild(button);});
    });
    marketMarkers.push(new mapboxgl.Marker({element:el,anchor:'center',pitchAlignment:'viewport'}).setLngLat([s.longitude,s.latitude]).addTo(map));
    el.setAttribute('role','button');el.tabIndex=0;
  }
  if(map.getLayer('commercial-nearby')){
    const near=[...highlightedBuildingIds(sites)];
    map.setFilter('commercial-nearby',['in',['get','building_id'],['literal',near]]);
    map.setFilter('commercial-nearby-outline',['in',['get','building_id'],['literal',near]]);
    map.setFilter('commercial-nearby-point',['in',['get','building_id'],['literal',near]]);
  }
  if(state.tab==='oda')loadZones();else{zoneRequest++;if(map.getLayer('oda-fill')){map.setLayoutProperty('oda-fill','visibility','none');map.setLayoutProperty('oda-outline','visibility','none');}}
  if(state.tab==='brands'){
    const b=visibleBrands(filteredEvents()).find(b=>b.vendor_id===state.brand),points=(b?.matchingSites||[]).map(id=>siteById.get(id)).filter(s=>s?.longitude!=null);
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)brandConnections.push({a:points[i],b:points[j]});
    for(const s of points){const el=document.createElement('button');el.type='button';el.className='brand-marker';el.setAttribute('aria-label','View brand market: '+s.name);el.title=s.name;el.onclick=()=>selectSite(s.site_id);brandMarkers.push(new mapboxgl.Marker({element:el}).setLngLat([s.longitude,s.latitude]).addTo(map));el.setAttribute('role','button');el.tabIndex=0;}
  }
  updateBrandSvg();
}
function updateBrandSvg(){
  if(!brandSvg)return;
  const width=map.getContainer().clientWidth,height=map.getContainer().clientHeight;
  brandSvg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  brandSvg.innerHTML=brandConnections.map(c=>{const a=map.project([c.a.longitude,c.a.latitude]),b=map.project([c.b.longitude,c.b.latitude]);return `<path class="brand-line ${state.paused?'paused':''} ${reduced.matches?'reduced':''}" d="M${a.x},${a.y}L${b.x},${b.y}" fill="none" stroke="#796195" stroke-width="2.5" opacity=".8"/>`;}).join('');
}
async function loadZones(){
  const request=++zoneRequest;
  try{
    if(!zoneCache.has(2))zoneCache.set(2,json('data/oda_2m.geojson').catch(e=>{zoneCache.delete(2);throw e;}));
    const zones=await zoneCache.get(2);if(request!==zoneRequest||state.tab!=='oda')return;
    if(!map.getSource('oda')){
      map.addSource('oda',{type:'geojson',data:zones});
      map.addLayer({id:'oda-fill',type:'fill',source:'oda',slot:'top',paint:{'fill-color':'#db985b','fill-opacity':.32}});
      map.addLayer({id:'oda-outline',type:'line',source:'oda',slot:'top',paint:{'line-color':'#b56833','line-width':1.2,'line-dasharray':[3,2]}});
    }else{map.setLayoutProperty('oda-fill','visibility','visible');map.setLayoutProperty('oda-outline','visibility','visible');}
  }catch(e){console.error(e);toast('Candidate-zone data could not load. Check your connection and reopen this chapter.');}
}
function addResearchLayers(areas){
  map.addSource('commercial',{type:'geojson',data:commercialData});map.addSource('commercial-point',{type:'geojson',data:pointOnlyData});map.addSource('areas',{type:'geojson',data:areas});
  map.addLayer({id:'commercial-background',type:'fill',source:'commercial',slot:'top',paint:{'fill-color':'#c2cdc0','fill-opacity':.45}});
  map.addLayer({id:'commercial-outline',type:'line',source:'commercial',slot:'top',paint:{'line-color':'#a8b9a7','line-width':.6}});
  map.addLayer({id:'commercial-nearby',type:'fill',source:'commercial',slot:'top',filter:['in',['get','building_id'],['literal',[]]],paint:{'fill-color':'#557c59','fill-opacity':.85}});
  map.addLayer({id:'commercial-nearby-outline',type:'line',source:'commercial',slot:'top',filter:['in',['get','building_id'],['literal',[]]],paint:{'line-color':'#365e47','line-width':1.5}});
  map.addLayer({id:'commercial-point',type:'circle',source:'commercial-point',slot:'top',paint:{'circle-radius':4,'circle-color':'#c2cdc0','circle-stroke-color':'#a8b9a7','circle-stroke-width':1}});
  map.addLayer({id:'commercial-nearby-point',type:'circle',source:'commercial-point',slot:'top',filter:['in',['get','building_id'],['literal',[]]],paint:{'circle-radius':5,'circle-color':'#557c59'}});
  map.addLayer({id:'planning-areas',type:'line',source:'areas',slot:'top',layout:{visibility:$('areasToggle').checked?'visible':'none'},paint:{'line-color':'#889b88','line-width':1,'line-dasharray':[3,4]}});
}
async function init(){
  try{
    if(typeof mapboxgl==='undefined')throw new Error('Mapbox GL JS could not load');
    const cfg=window.MAPBOX_CONFIG;if(!cfg?.accessToken?.startsWith('pk.'))throw new Error('Mapbox public token is missing');
    data=await json('data/app.json');data.sites.forEach(s=>siteById.set(s.site_id,s));data.events.forEach(e=>eventById.set(e.event_id,e));
    map=new mapboxgl.Map({container:'map',accessToken:cfg.accessToken,style:cfg.style,center:[103.82,1.35],zoom:10,pitch:0,bearing:0,minZoom:8.5,maxZoom:20,antialias:true,
      config:{basemap:{theme:'monochrome',lightPreset:'day',show3dObjects:true,showPointOfInterestLabels:false,showTransitLabels:false}}});
    map.addControl(new mapboxgl.NavigationControl({visualizePitch:true}),'bottom-right');map.addControl(new mapboxgl.ScaleControl({unit:'metric'}),'bottom-right');
    map.on('error',e=>{const message=JSON.stringify(e.error,Object.getOwnPropertyNames(e.error||{})).replace(/pk\.[A-Za-z0-9_.-]+/g,'[public token]');console.error('Mapbox:',message);if(/401|403|token|unauthorized/i.test(message))toast('Mapbox access was refused. Check the public token and allowed website URLs.');});
    brandSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');brandSvg.classList.add('brand-overlay');brandSvg.setAttribute('aria-hidden','true');map.getCanvasContainer().appendChild(brandSvg);
    map.on('move',updateBrandSvg);map.on('resize',updateBrandSvg);
    map.on('moveend',()=>{const el=$('map');el.dataset.zoom=map.getZoom().toFixed(2);el.dataset.pitch=map.getPitch().toFixed(1);el.dataset.bearing=map.getBearing().toFixed(1);});
    data.areas.forEach(a=>$('area').add(new Option(a.planning_area,a.planning_area)));
    ['area','status'].forEach(id=>$(id).addEventListener('change',e=>{state[id]=e.target.value;render();}));
    $('month').addEventListener('input',e=>{state.month=e.target.value;render();});
    $('month').addEventListener('pointerdown',e=>{if(state.month==='all'){state.month=e.target.value;render();}});
    $('month').addEventListener('keydown',e=>{if(state.month==='all'&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){state.month=e.target.value;render();}});
    $('allYear').addEventListener('click',()=>{state.month='all';render();});
    document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;render();$('panelScroll').scrollTop=0;if(state.tab==='brands'&&mapReady)fitBrand();}));
    $('overview').addEventListener('click',()=>{if(mapReady)overview();});$('methodsOpen').addEventListener('click',()=>$('methods').showModal());$('methodsClose').addEventListener('click',()=>$('methods').close());
    $('methods').addEventListener('click',e=>{if(e.target===$('methods')){const r=$('methods').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('methods').close();}});
    $('areasToggle').addEventListener('change',e=>{if(map.getLayer('planning-areas'))map.setLayoutProperty('planning-areas','visibility',e.target.checked?'visible':'none');});
    reduced.addEventListener('change',()=>render());render();
    const load=new Promise(resolve=>map.isStyleLoaded()?resolve():map.once('style.load',resolve));
    const [buildings,pointOnly,areas,rules]=await Promise.all(['buildings.geojson','point_only.geojson','planning_areas.geojson','rules.json'].map(f=>json('data/'+f)));
    commercialData=buildings;pointOnlyData=pointOnly;
    $('rulesTable').innerHTML=rules.map(r=>`<div class="rule-card"><strong>${esc(r.authority)} · ${esc(r.status)}</strong><p>${esc(r.rule)}</p><p>Needs: ${esc(r.required_data)}</p><p>${esc(r.scope)}</p>${r.url?sourceLinks(r.url):''}</div>`).join('');
    await load;addResearchLayers(areas);mapReady=true;overview();render();
    window.addEventListener('resize',()=>map.resize());
  }catch(e){console.error(e);$('content').innerHTML=`<div class="callout">The research map could not load. ${esc(e.message)}. Please reload this page.</div>`;$('mapStatus').textContent='Data load incomplete';}
}
init();
