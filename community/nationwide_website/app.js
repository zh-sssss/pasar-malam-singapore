import {mountWalk,mountInformation} from './community-ui.js';
'use strict';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = value => value == null ? '—' : new Intl.NumberFormat('en-SG',{maximumFractionDigits:0}).format(value);
const distance = value => value == null ? 'Unknown' : value >= 1000 ? `${(value/1000).toFixed(2)} km` : `${num(value)} m`;
const statusNames = {past_announced:'Past announced window',within_announced_window:'Within announced window',future_announced:'Future announcement',conflicting_dates:'Conflicting dates',partial_or_invalid_dates:'Incomplete dates'};
// Date window: from/to are inclusive ISO dates (YYYY-MM-DD); both null means all dates.
const state = {tab:document.body.dataset.startTab||'distribution',from:null,to:null,area:'all',selected:null};
let data,map,commercialData,pointOnlyData,openCommunity;
let marketMarkers=[],communityView=null,context,savedCamera=null,previousTab="distribution",savedDragRotate=true,savedTouchRotate=true,informationPoints=[];
const zoneCache = new Map();
let zoneRequest = 0, toastTimer, mapReady = false;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
// Warm palette shared with the brand chapter: green = permanent HDB shops, coral = temporary markets, yellow = the 2 m ODA band.
const COLORS={land:'#f2e9d0',water:'#b7cfe0',park:'#cfdcc6',shops:'#a9c3ad',shopsLine:'#7e9d86',near:'#2f6b4f',nearLine:'#1f4b37',market:'#d0603c',oda:'#f5c518',odaLine:'#c99a00',areas:'#a3927c'};
const siteById = new Map(), eventById = new Map();
const safeUrl = url => {try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?esc(u.href):null;}catch{return null;}};
const sourceLinks = urls => [...new Set(String(urls||'').split(';').filter(Boolean))].map((url,i)=>{const href=safeUrl(url);return href?`<a href="${href}" target="_blank" rel="noopener">Source ${i+1} ↗</a>`:'';}).join('');
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
async function json(path){
  path = new URL(path, window.WEBSITE_CONFIG.dataBaseUrl).href;
  // Static Pages cannot set Content-Encoding for precompressed assets. Decode
  // explicitly, with original GeoJSON retained as an older-browser runtime fallback.
  if(path.endsWith('.geojson')&&typeof DecompressionStream!=='undefined'){
    const packed=await fetch(path+'.gz');
    if(packed.ok)return new Response(packed.body.pipeThrough(new DecompressionStream('gzip'))).json();
  }
  const r=await fetch(path);if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);return r.json();
}
function isUncertain(e){return e.date_conflict||['conflicting_dates','partial_or_invalid_dates'].includes(e.calendar_status);}
const ISO=/^\d{4}-\d{2}-\d{2}$/;
function windowState(e){
  if(!state.from)return 'match';
  if(!ISO.test(e.start_date)||!ISO.test(e.end_date)||e.end_date<e.start_date)return 'unknown';
  return e.start_date<=state.to&&e.end_date>=state.from?'match':'outside';
}
function areaMatch(e){return state.area==='all'||e.planning_area_by_proxy===state.area;}
function filteredEvents(){return data.events.filter(e=>areaMatch(e)&&windowState(e)==='match');}
function currentSites(){const ids=new Set(filteredEvents().map(e=>e.site_id));return data.sites.filter(s=>ids.has(s.site_id));}
function eventsFor(s){return filteredEvents().filter(e=>e.site_id===s.site_id);}
function dateText(e){return e.start_date&&e.end_date?`${e.start_date} — ${e.end_date}`:e.raw_date_text||'Date not established';}
function statusText(e){return isUncertain(e)?(e.date_conflict?'Conflicting dates':statusNames[e.calendar_status]||'Date uncertain'):statusNames[e.calendar_status]||e.calendar_status;}
function eventCards(events){return events.map(e=>`<article class="event-card"><span class="event-status ${isUncertain(e)?'uncertain':''}">${esc(statusText(e))}</span><h3>${esc(e.event_name)}</h3><p class="event-date">${esc(dateText(e))}</p><div class="source-links">${sourceLinks(e.source_urls)}</div></article>`).join('');}
function stats(items){return `<div class="stats">${items.map(([value,label])=>`<div class="stat"><strong>${num(value)}</strong><span>${label}</span></div>`).join('')}</div>`;}
function unknownMonthNote(){const count=state.from?data.events.filter(e=>areaMatch(e)&&windowState(e)==='unknown').length:0;return count?`<p class="note">${count} record(s) have dates that cannot be placed on the calendar and are excluded from this date window.</p>`:'';}
function highlightedBuildingIds(sites){
  const selected=state.tab==='oda'&&sites.find(s=>s.site_id===state.selected);
  const relevant=selected?[selected]:sites;
  return new Set(relevant.flatMap(s=>s.metrics?.nearby_50m_building_ids||[]));
}
// ---- date-window calendar -------------------------------------------------------------
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const cal={y:2026,m:0,anchor:null,hover:null,min:[2026,0],max:[2026,11]};
const pad=n=>String(n).padStart(2,'0');
const isoOf=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
const daysIn=(y,m)=>new Date(Date.UTC(y,m+1,0)).getUTCDate();
const shortDate=iso=>{const [y,m,d]=iso.split('-').map(Number);return `${d} ${MONTHS[m-1].slice(0,3)}`;};
function windowText(){
  if(!state.from)return 'All dates';
  const [fy,fm]=state.from.split('-').map(Number),[ty,tm,td]=state.to.split('-').map(Number);
  if(state.from===state.to)return `${shortDate(state.from)} ${fy}`;
  if(fy===ty&&fm===tm&&state.from.endsWith('-01')&&td===daysIn(ty,tm-1))return `${MONTHS[fm-1]} ${fy}`;
  return fy===ty?`${shortDate(state.from)} – ${shortDate(state.to)} ${ty}`:`${shortDate(state.from)} ${fy} – ${shortDate(state.to)} ${ty}`;
}
function setWindow(from,to){if(from&&to&&to<from)[from,to]=[to,from];state.from=from;state.to=from?to:null;render();}
function activeDays(){
  // Number of announced markets running on each day in the current area (dates that can be placed only).
  const days=new Map();
  for(const e of data.events){
    if(!areaMatch(e)||!ISO.test(e.start_date)||!ISO.test(e.end_date)||e.end_date<e.start_date)continue;
    const t=new Date(e.start_date+'T00:00:00Z'),end=new Date(e.end_date+'T00:00:00Z');
    for(let n=0;t<=end&&n<400;n++,t.setUTCDate(t.getUTCDate()+1)){const k=t.toISOString().slice(0,10);days.set(k,(days.get(k)||0)+1);}
  }
  return days;
}
function calendarBounds(){
  const months=data.events.flatMap(e=>[e.start_date,e.end_date]).filter(d=>ISO.test(d||'')).map(d=>[Number(d.slice(0,4)),Number(d.slice(5,7))-1]);
  const key=([y,m])=>y*12+m,lo=[2026,0],hi=[2026,11];
  for(const ym of months){if(key(ym)<key(lo)&&ym[0]>=2025)lo.splice(0,2,...ym);if(key(ym)>key(hi)&&ym[0]<=2027)hi.splice(0,2,...ym);}
  cal.min=lo;cal.max=hi;
}
function drawCalendar(){
  const {y,m}=cal,first=(new Date(Date.UTC(y,m,1)).getUTCDay()+6)%7,n=daysIn(y,m),busy=activeDays();
  $('calTitle').textContent=`${MONTHS[m]} ${y}`;
  $('calPrev').disabled=y*12+m<=cal.min[0]*12+cal.min[1];$('calNext').disabled=y*12+m>=cal.max[0]*12+cal.max[1];
  // While choosing, preview the window from the first click to the hovered day.
  let from=state.from,to=state.to;
  if(cal.anchor){from=cal.anchor;to=cal.hover||cal.anchor;if(to<from)[from,to]=[to,from];}
  let html='';for(let i=0;i<first;i++)html+='<span></span>';
  for(let d=1;d<=n;d++){
    const iso=isoOf(y,m,d),inRange=from&&iso>=from&&iso<=to,cls=['cal-day'];
    if(inRange)cls.push('in');if(iso===from)cls.push('start');if(iso===to)cls.push('end');const count=busy.get(iso)||0;if(count)cls.push('busy','lv'+(count>10?3:count>5?2:1));
    html+=`<button type="button" class="${cls.join(' ')}" data-date="${iso}" aria-pressed="${inRange?'true':'false'}" aria-label="${d} ${MONTHS[m]} ${y}${count?`, ${count} market${count>1?'s':''} announced`:''}" title="${count?`${count} market${count>1?'s':''}`:'No announced markets'}">${d}</button>`;
  }
  $('calGrid').innerHTML=html;
  $('calStep').textContent=cal.anchor?`From ${shortDate(cal.anchor)}: now pick the end date.`:'Pick a start date, then an end date.';
}
function openCalendar(open){
  const pop=$('datePop');if(open===!pop.hidden)return;
  pop.hidden=!open;$('dateButton').setAttribute('aria-expanded',String(open));cal.anchor=null;cal.hover=null;
  if(open){const at=(state.from||'2026-01').split('-').map(Number);cal.y=at[0];cal.m=at[1]-1;drawCalendar();pop.querySelector('.cal-day.start,.cal-day')?.focus();}
}
function bindCalendar(){
  calendarBounds();
  $('dateButton').addEventListener('click',()=>openCalendar($('datePop').hidden));
  $('calPrev').addEventListener('click',()=>{if(--cal.m<0){cal.m=11;cal.y--;}drawCalendar();});
  $('calNext').addEventListener('click',()=>{if(++cal.m>11){cal.m=0;cal.y++;}drawCalendar();});
  $('calAll').addEventListener('click',()=>{setWindow(null,null);openCalendar(false);$('dateButton').focus();});
  $('calWholeMonth').addEventListener('click',()=>{setWindow(isoOf(cal.y,cal.m,1),isoOf(cal.y,cal.m,daysIn(cal.y,cal.m)));openCalendar(false);$('dateButton').focus();});
  $('calGrid').addEventListener('click',e=>{
    const day=e.target.closest('[data-date]')?.dataset.date;if(!day)return;
    if(!cal.anchor){cal.anchor=day;cal.hover=day;drawCalendar();$('calGrid').querySelector(`[data-date="${day}"]`)?.focus();return;}
    const start=cal.anchor;cal.anchor=null;setWindow(start,day);openCalendar(false);$('dateButton').focus();
  });
  $('calGrid').addEventListener('pointerover',e=>{const day=e.target.closest('[data-date]')?.dataset.date;if(cal.anchor&&day&&day!==cal.hover){cal.hover=day;drawCalendar();}});
  $('calGrid').addEventListener('focusin',e=>{const day=e.target.closest('[data-date]')?.dataset.date;if(cal.anchor&&day&&day!==cal.hover){cal.hover=day;drawCalendar();$('calGrid').querySelector(`[data-date="${day}"]`)?.focus();}});
  $('calGrid').addEventListener('keydown',e=>{
    const day=e.target.closest('[data-date]')?.dataset.date,step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];if(!day||!step)return;
    e.preventDefault();const t=new Date(day+'T00:00:00Z');t.setUTCDate(t.getUTCDate()+step);const next=t.toISOString().slice(0,10);
    const [ny,nm]=next.split('-').map(Number);if(ny*12+nm-1<cal.min[0]*12+cal.min[1]||ny*12+nm-1>cal.max[0]*12+cal.max[1])return;
    if(ny!==cal.y||nm-1!==cal.m){cal.y=ny;cal.m=nm-1;}if(cal.anchor)cal.hover=next;drawCalendar();$('calGrid').querySelector(`[data-date="${next}"]`)?.focus();
  });
  document.addEventListener('pointerdown',e=>{if(!$('datePop').hidden&&!e.target.closest('.date-filter'))openCalendar(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('datePop').hidden){openCalendar(false);$('dateButton').focus();}});
}
function syncMonth(){
  $('dateValue').textContent=windowText();
  $('dateButton').classList.toggle('set',!!state.from);
  $('dateButton').setAttribute('aria-label','Dates: '+windowText()+'. Choose a date window');
  if(!$('datePop').hidden)drawCalendar();
}
function render(){
  communityView?.destroy();communityView=null;
  const events=filteredEvents(),sites=currentSites();
  const communityOpen=state.tab==='community';
  $('filters').hidden=communityOpen;
  $('panel').inert=communityOpen;
  $('communityRail').inert=!communityOpen;
  $('communityRail').setAttribute('aria-hidden',String(!communityOpen));
  $('communityNext').hidden=!communityOpen;
  if(state.selected&&!sites.some(s=>s.site_id===state.selected))state.selected=null;
  document.body.dataset.chapter=state.tab;
  syncMonth();
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===state.tab)));
  if(state.tab==='distribution')renderDistribution(events,sites);
  else if(state.tab==='oda')renderOda(events,sites);
  else renderCommunity();
  $('mapStatus').textContent=state.tab==='community'?'Community information':`${events.length} matching episodes · ${sites.filter(s=>s.longitude!==null).length} mapped sites · ${data.counts.commercial_points.toLocaleString()} commercial addresses`;
  updateMap();
}
function renderDistribution(events,sites){
  const selected=sites.find(s=>s.site_id===state.selected);if(selected){renderStreetWalk(selected);return;}
  const missing=events.filter(e=>e.longitude===null).length;
  $('content').innerHTML=stats([[events.length,'market episodes'],[sites.length,'distinct sites'],[data.counts.commercial_points,'commercial addresses']])+`<p class="note">Select a market to open its Street Walk profile.</p>${unknownMonthNote()}${missing?`<div class="callout">${missing} matching episode has no mapped location. It remains in the total.</div>`:''}${!sites.length?'<p class="empty">No markets match these filters.</p>':''}`;
}
function renderOda(events,sites){
  const s=sites.find(s=>s.site_id===state.selected);
  let html='';
  if(!s){
    html+=`<h2 class="site-title">Explore a market.</h2><p class="note">Click a market representative point to rotate and zoom into a 3D view and view its information.</p><p class="note">Light buildings show all HDB commercial buildings. Dark buildings are within 50 m of the filtered market points. The yellow bands show the fixed 2 m modelled ODA candidate zones: the space a shop could use beyond its walls.</p>${unknownMonthNote()}${!sites.length?'<p class="empty">No markets match these filters.</p>':''}`;
  }else{
    html+=`<div class="section-line"><button class="back-link" id="clearSite">← Island overview</button><span>${esc(s.area||'Area unassigned')}</span></div><h2 class="site-title">${esc(s.name)}</h2><div class="section-line"><h3 style="margin:0;font-size:12px">Activity dates</h3><span>${eventsFor(s).length} episode(s)</span></div>${eventCards(eventsFor(s))}`;
  }
  $('content').innerHTML=html;
  $('clearSite')?.addEventListener('click',()=>{state.selected=null;render();overview();});
}

function renderCommunity(){
  if(!mapReady)$('community-panel').textContent='Loading information…';
  if(mapReady)communityView=mountInformation($('community-panel'),{context,map,points:informationPoints,initialSite:siteById.get(state.selected)});
}
function renderStreetWalk(s){
  $('content').innerHTML=`<button class="back-link" id="clearSite">← All markets</button><h2 class="site-title">${esc(s.name)}</h2><details><summary>Location details</summary><p>${esc(s.area||'Area unassigned')} · ${esc(s.precision_note||'Representative point; actual market boundaries and walk routes are not available.')}</p></details>${eventCards(eventsFor(s))}<div id="walk-contributions"></div>`;
  $('clearSite').onclick=()=>{state.selected=null;history.replaceState(null,'',location.pathname);render();overview();};
  if(mapReady)communityView=mountWalk($('walk-contributions'),{site:s,onContribute:()=>openCommunity()});
}
function focus3D(s){
  if(s?.longitude==null)return;
  const offset=innerWidth>760?[190,0]:[0,-innerHeight*.24];
  map.flyTo({center:[s.longitude,s.latitude],zoom:17.2,pitch:60,bearing:(map.getBearing()+40)%360,
    offset,padding:{top:0,bottom:0,left:0,right:0},duration:reduced.matches?0:2200,essential:false});
}
function selectSite(id){
  state.selected=id;state.tab='distribution';history.replaceState(null,'','#site='+encodeURIComponent(id));map.closePopup?.();render();$('panelScroll').scrollTop=0;
  const s=siteById.get(id);
  if(s?.longitude!=null)focus3D(s);else toast('Location not established. The record remains in the research dataset.');
}
function fitCommunity(){
  map.setMinZoom(7);
  map.dragRotate.disable();map.touchZoomRotate.disableRotation();map.touchPitch?.disable();
  const width=$('communityRail').getBoundingClientRect().width;
  map.fitBounds([[103.59,1.19],[104.09,1.49]],{pitch:0,bearing:0,padding:{top:65,bottom:65,left:20,right:width+(innerWidth<=600?48:70)+20},maxZoom:10.5,duration:reduced.matches?0:750});
}
function cameraPadding(){return innerWidth>760?{top:80,bottom:75,left:435,right:100}:{top:85,bottom:Math.round(innerHeight*.54),left:20,right:20};}
function overview(){map.fitBounds([[103.61,1.22],[104.035,1.475]],{padding:cameraPadding(),retainPadding:false,pitch:0,bearing:0,duration:reduced.matches?0:1300});}
function updateLegend(){let lines='<div><i class="key-market"></i>Market representative point</div><div><i class="key-building"></i>All HDB commercial buildings</div><div><i class="key-nearby"></i>Commercial buildings within 50&nbsp;m</div>';
  if(state.tab==='distribution')lines+='<div><i class="key-future"></i>Future / uncertain announcement</div>';
  if(state.tab==='oda')lines+='<div><i class="key-zone"></i>Modelled ODA zone · 2 m band</div>';
  if(state.tab==='community')lines='<div class="legend-gradient"></div><div>Darker areas = more records</div><div>♛ Most records</div><div>Dots = locations</div><div>Orange = your selection</div>';
  $('legend').innerHTML='<strong>MAP KEY</strong>'+lines;
}
function markerGroups(sites){
  const groups=new Map();for(const s of sites){if(s.longitude==null)continue;const key=s.longitude+','+s.latitude;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s);}
  return [...groups.values()];
}
function updateMap(){
  if(!mapReady)return;updateLegend();marketMarkers.forEach(m=>m.remove());marketMarkers=[];
  const sites=currentSites();
  for(const layer of map.getStyle().layers||[])if(layer.id.startsWith('commercial-'))map.setLayoutProperty(layer.id,'visibility',state.tab==='community'?'none':'visible');
  if(map.getLayer('planning-areas'))map.setLayoutProperty('planning-areas','visibility',state.tab!=='community'&&$('areasToggle').checked?'visible':'none');
  for(const group of markerGroups(state.tab==='community'?[]:sites)){
    const s=group[0],events=group.flatMap(eventsFor),special=events.every(e=>e.calendar_status==='future_announced'||isUncertain(e));
    const el=document.createElement('button');el.type='button';el.className='market-marker'+(special?' uncertain':'')+(group.some(x=>x.site_id===state.selected)?' selected':'');
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
}
async function loadZones(){
  const request=++zoneRequest;
  try{
    if(!zoneCache.has(2))zoneCache.set(2,json('data/oda_2m.geojson').catch(e=>{zoneCache.delete(2);throw e;}));
    const zones=await zoneCache.get(2);if(request!==zoneRequest||state.tab!=='oda')return;
    if(!map.getSource('oda')){
      map.addSource('oda',{type:'geojson',data:zones});
      map.addLayer({id:'oda-fill',type:'fill',source:'oda',slot:'top',paint:{'fill-color':COLORS.oda,'fill-opacity':.78}});
      map.addLayer({id:'oda-outline',type:'line',source:'oda',slot:'top',paint:{'line-color':COLORS.odaLine,'line-width':1.3}});
    }else{map.setLayoutProperty('oda-fill','visibility','visible');map.setLayoutProperty('oda-outline','visibility','visible');}
  }catch(e){console.error(e);toast('Candidate-zone data could not load. Check your connection and reopen this chapter.');}
}
function addContextMask(){
  // As in the brand chapter: neighbouring countries become plain paper so Singapore reads clearly.
  try{
    map.addSource('context-countries',{type:'vector',url:'mapbox://mapbox.country-boundaries-v1'});
    map.addLayer({id:'plain-neighbouring-countries',type:'fill',source:'context-countries','source-layer':'country_boundaries',slot:'middle',
      filter:['all',['!=',['get','iso_3166_1'],'SG'],['==',['get','disputed'],'false'],['any',['==',['get','worldview'],'all'],['in','US',['get','worldview']]]],
      paint:{'fill-color':COLORS.land,'fill-opacity':1}});
  }catch(e){console.warn('Context mask skipped',e);}
}
function addResearchLayers(areas){
  addContextMask();
  map.addSource('commercial',{type:'geojson',data:commercialData});map.addSource('commercial-point',{type:'geojson',data:pointOnlyData});map.addSource('areas',{type:'geojson',data:areas});
  map.addLayer({id:'commercial-background',type:'fill',source:'commercial',slot:'top',paint:{'fill-color':COLORS.shops,'fill-opacity':.75}});
  map.addLayer({id:'commercial-outline',type:'line',source:'commercial',slot:'top',paint:{'line-color':COLORS.shopsLine,'line-width':.7}});
  map.addLayer({id:'commercial-nearby',type:'fill',source:'commercial',slot:'top',filter:['in',['get','building_id'],['literal',[]]],paint:{'fill-color':COLORS.near,'fill-opacity':.92}});
  map.addLayer({id:'commercial-nearby-outline',type:'line',source:'commercial',slot:'top',filter:['in',['get','building_id'],['literal',[]]],paint:{'line-color':COLORS.nearLine,'line-width':1.5}});
  map.addLayer({id:'commercial-point',type:'circle',source:'commercial-point',slot:'top',paint:{'circle-radius':4,'circle-color':COLORS.shops,'circle-stroke-color':COLORS.shopsLine,'circle-stroke-width':1}});
  map.addLayer({id:'commercial-nearby-point',type:'circle',source:'commercial-point',slot:'top',filter:['in',['get','building_id'],['literal',[]]],paint:{'circle-radius':5,'circle-color':COLORS.near}});
  map.addLayer({id:'planning-areas',type:'line',source:'areas',slot:'top',layout:{visibility:$('areasToggle').checked?'visible':'none'},paint:{'line-color':COLORS.areas,'line-width':1.1,'line-dasharray':[3,4]}});
}
async function init(){
  try{
    if(typeof mapboxgl==='undefined')throw new Error('Mapbox GL JS could not load');
    const cfg=window.MAPBOX_CONFIG;if(!cfg?.accessToken?.startsWith('pk.'))throw new Error('Mapbox public token is missing');
    data=await json('data/app.json');
    try{const r=await fetch('../site/brand-connections/data/runtime.json');if(r.ok)informationPoints=(await r.json()).points||[];}catch{}data.sites.forEach(s=>siteById.set(s.site_id,s));data.events.forEach(e=>eventById.set(e.event_id,e));
    map=new mapboxgl.Map({language:'en',container:'map',accessToken:cfg.accessToken,style:cfg.style,center:[103.82,1.35],zoom:10,pitch:0,bearing:0,minZoom:8.5,maxZoom:20,antialias:true,
      ...(cfg.style?.includes('/standard')?{config:{basemap:{theme:'default',lightPreset:'day',show3dObjects:true,showPointOfInterestLabels:false,showTransitLabels:false,
        // Warm paper basemap matching the brand chapter (Mapbox Standard colour settings).
        colorLand:COLORS.land,colorWater:COLORS.water,colorGreenspace:COLORS.park,colorCommercial:'#ecdfc2',colorEducation:'#ebe1c9',colorMedical:'#ebe1c9',colorIndustrial:'#e6dcc3',
        colorRoads:'#fffaf0',colorTrunks:'#fbf1dc',colorMotorways:'#f7e7c6',colorBuildings:'#e4d8c0',colorPlaceLabels:'#7a6d5f',colorRoadLabels:'#8f8273',colorAdminBoundaries:'#bfae95'}}}:{})});

    map.addControl(new mapboxgl.NavigationControl({visualizePitch:true}),'bottom-right');map.addControl(new mapboxgl.ScaleControl({unit:'metric'}),'bottom-right');
    map.on('error',e=>{const message=JSON.stringify(e.error,Object.getOwnPropertyNames(e.error||{})).replace(/pk\.[A-Za-z0-9_.-]+/g,'[public token]');console.error('Mapbox:',message);if(/401|403|token|unauthorized/i.test(message))toast('Mapbox access was refused. Check the public token and allowed website URLs.');});
    map.on('moveend',()=>{const el=$('map');el.dataset.zoom=map.getZoom().toFixed(2);el.dataset.pitch=map.getPitch().toFixed(1);el.dataset.bearing=map.getBearing().toFixed(1);});
    data.areas.forEach(a=>$('area').add(new Option(a.planning_area,a.planning_area)));
    $('area').addEventListener('change',e=>{state.area=e.target.value;render();});
    bindCalendar();
    document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;render();$('panelScroll').scrollTop=0;if(state.tab==='community'&&mapReady)overview();}));
    openCommunity=function(push=true){if(!mapReady||state.tab==='community')return;
      previousTab=state.tab;savedDragRotate=map.dragRotate.isEnabled();savedTouchRotate=map.touchZoomRotate.isEnabled();savedCamera={center:map.getCenter(),zoom:map.getZoom(),pitch:map.getPitch(),bearing:map.getBearing(),padding:map.getPadding()};
      state.tab='community';if(push)history.pushState({participation:true},'',location.pathname+location.search+'#contribute');render();fitCommunity();$('communityClose').focus();
    }
    $('communityOpen').onclick=e=>{e.preventDefault();openCommunity();};
    const closeCommunity=()=>{if(state.tab!=='community')return;state.tab=previousTab;render();
      map.setMinZoom(8.5);if(savedDragRotate)map.dragRotate.enable();if(savedTouchRotate)map.touchZoomRotate.enableRotation();map.touchPitch?.enable();
      if(savedCamera)map.easeTo({...savedCamera,duration:reduced.matches?0:750});else{map.setPadding({top:0,bottom:0,left:0,right:0});overview();}$('communityOpen').focus();};
    $('communityClose').onclick=()=>{if(history.state?.participation)history.back();else{history.replaceState(null,'',location.pathname);closeCommunity();}};
    window.addEventListener('popstate',()=>{if(location.hash==='#contribute')openCommunity(false);else closeCommunity();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('methods').open)$('communityClose').click();});
    $('overview').addEventListener('click',()=>{if(mapReady){if(state.tab==='community')fitCommunity();else overview();}});$('methodsOpen').addEventListener('click',()=>$('methods').showModal());$('methodsClose').addEventListener('click',()=>$('methods').close());
    $('methods').addEventListener('click',e=>{if(e.target===$('methods')){const r=$('methods').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('methods').close();}});
    $('areasToggle').addEventListener('change',e=>{if(map.getLayer('planning-areas'))map.setLayoutProperty('planning-areas','visibility',e.target.checked?'visible':'none');});
    reduced.addEventListener('change',()=>render());render();
    const load=new Promise(resolve=>map.isStyleLoaded()?resolve():map.once('style.load',resolve));
    const [buildings,pointOnly,areas,rules]=await Promise.all(['buildings.geojson','point_only.geojson','planning_areas.geojson','rules.json'].map(f=>json('data/'+f)));
    commercialData=buildings;pointOnlyData=pointOnly;
    $('rulesTable').innerHTML=rules.map(r=>`<div class="rule-card"><strong>${esc(r.authority)} · ${esc(r.status)}</strong><p>${esc(r.rule)}</p><p>Needs: ${esc(r.required_data)}</p><p>${esc(r.scope)}</p>${r.url?sourceLinks(r.url):''}</div>`).join('');
    context={version:2,sites:data.sites,events:data.events,areas,as_of:data.as_of};
    await load;addResearchLayers(areas);mapReady=true;overview();
    const initialId=new URLSearchParams(location.hash.slice(1)).get('site');
    if(state.tab!=='community'&&siteById.has(initialId)){state.selected=initialId;state.tab='distribution';}
    render();if(state.selected)focus3D(siteById.get(state.selected));
    if(location.hash==='#contribute'&&state.tab!=='community')openCommunity(false);
    if(state.tab==='community')fitCommunity();
    window.addEventListener('resize',()=>{map.resize();if(state.tab==='community')fitCommunity();});
  }catch(e){console.error(e);$('content').innerHTML=`<div class="callout">The research map could not load. ${esc(e.message)}. Please reload this page.</div>`;$('mapStatus').textContent='Data load incomplete';}
}
init();
