import {normalizePoints,brandIndex,connectionsFor,CLOSED,isOrigin,statusText,safeURL} from './model.js';
import {LOGOS} from './logos.js';
import {createScene} from './scene.js';
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function link(text,url){const a=el('a','',text);a.href=safeURL(url);a.target='_blank';a.rel='noopener noreferrer';return a;}
export async function mountBrandConnections(container,options={}){
 const abort=new AbortController();
 const runtime=options.points?options:await fetch(options.dataUrl||new URL('./data/runtime.json',import.meta.url),{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('The display data is missing. Run the local preparation command in README.md.');return r.json();});
 const points=normalizePoints(runtime.points),brands=brandIndex(points),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!brands.length)throw new Error('No brands with temporary market locations are available.');
 const logos={...LOGOS,...options.logos};
 container.classList.add('bc-root');container.innerHTML=`
 <aside class="bc-sidebar" aria-label="Choose a brand">
  <div class="bc-side-title"><h1>Follow<br>a brand<span>.</span></h1><p>Found a market stall you love? Find out where it calls home.</p></div>
  <div class="bc-list-heading"><span>EXPLORE THE BRANDS</span><span class="bc-brand-total"></span></div>
  <nav class="bc-brand-grid" aria-label="Brands"></nav>
  <div class="bc-side-foot"><span class="bc-small-dot"></span><span>RESEARCH SNAPSHOT<br><strong>28 OCTOBER 2026</strong></span></div>
 </aside>
 <section class="bc-stage" aria-label="Three-dimensional brand connections">
  <div class="bc-map" aria-label="Drag to pan. Right-drag to rotate the three-dimensional map."></div>
  <div class="bc-paper" aria-hidden="true"></div>
  <header class="bc-topbar"><button class="bc-about">About this atlas ↗</button></header>
  <section class="bc-brand-story" aria-live="polite"><div class="bc-brand-stats"></div><p class="bc-description bc-sr-only"></p></section>
  <div class="bc-map-hint">Drag to explore <span>·</span> Right-drag to orbit <span>·</span> Scroll to zoom</div>
  <div class="bc-bottom-bar"><div class="bc-legend"><span><i class="bc-store-symbol"></i> Permanent store</span><span><i class="bc-tent-symbol"></i> Temporary stall</span><span><i class="bc-closed-symbol"></i> Closed / paused</span></div><div class="bc-animation"><span class="bc-arc-count"></span><button class="bc-replay">↻ Replay connections</button><button class="bc-pause" hidden>Pause flow</button><button class="bc-orbit" aria-pressed="true">Ⅱ Pause rotation</button><button class="bc-fit" aria-label="Fit all points for this brand">↗ Fit brand</button></div></div>
  <section class="bc-detail" hidden aria-label="Location details"></section>
 <dialog class="bc-methods"><button class="bc-dialog-close" aria-label="Close information">×</button><span class="bc-eyebrow">A NOTE ON THE CONNECTIONS</span><h2>Places linked<br>by a shared brand.</h2><p>Each arc links a permanent store to a temporary presence of the same brand. These are brand associations, not observed trips, delivery routes or proof that a particular store supplied a stall. Arc height and model size are illustrative.</p><h3>Reading the atlas</h3><p>All non-closed permanent stores connect to every temporary point of the selected brand. Closed or paused stores remain in pale colours and have no connections. Operating status not shown is retained as unknown.</p><p>The snapshot contains 150 brand-location records across 68 existing brand-name IDs: 59 permanent and 91 temporary. It describes the research coverage, not a complete Singapore store census. Different spellings remain separate unless an identity link was confirmed.</p><h3>How points are classified</h3><p>Google Maps is the selected basis for fixed locations. Fourteen older locations without a matching brand-at-address profile are treated as temporary under this project's rule. Their classification is an inference. Their older evidence and precise limitations remain in the local research register.</p><p>Market points represent venues rather than individual stall entrances. Building proxies and the address-free deanqaisara profile pin show approximate positions. Event dates are reported windows, not independently verified trading dates.</p><h3>Design & sources</h3><p>Visual language follows the group's intro diorama: soft pastels, warm ink lines and miniature storefronts. Mapbox Light provides roads, green spaces and water features in Singapore, recoloured to the chapter's palette. Basemap text labels are hidden and neighbouring countries use a plain paper fill. Green flat-roof shops with circular bases denote permanent stores; coral tents with diamond bases denote temporary stalls. Solid basemap roads are geographic context; continuous arcs with travelling light show brand connections. Brand location and appearance sources can be opened from each point.</p><div class="bc-logo-sources"></div><p class="bc-method-foot">Location checks: 28 October 2026. Logo sources checked: 29 October 2026.</p></dialog>
 </section>`;
 const q=s=>container.querySelector(s),buttons=new Map();
 q('.bc-brand-total').textContent=brands.length;
 let previousGroup=null;
 for(const b of brands){
  const group=b.permanentCount>0?'Stores & stalls':'Temporary only';
  if(group!==previousGroup){
   const heading=el('div','bc-brand-group-heading');heading.setAttribute('role','heading');heading.setAttribute('aria-level','2');heading.append(el('span','',group),el('span','',brands.filter(x=>(x.permanentCount>0)===(b.permanentCount>0)).length));
   q('.bc-brand-grid').append(heading);previousGroup=group;
  }
  const button=el('button','bc-brand-button');button.type='button';button.setAttribute('aria-label','Show '+b.name);button.setAttribute('aria-pressed','false');button.title=b.name;
  const tile=el('span','bc-logo-tile'),logo=logos[b.name],word=el('span','bc-wordmark',b.name);
  word.style.setProperty('--wordmark-size',b.name.length>24?'12px':b.name.length>14?'14px':'16px');
  tile.append(word);
  if(logo){const img=el('img');img.src=logo.url;img.alt=b.name+' logo';img.loading='lazy';img.referrerPolicy='no-referrer';img.onload=()=>{tile.classList.add('bc-has-logo');if(logo.dark)tile.classList.add('bc-logo-dark');};img.onerror=()=>{img.remove();tile.classList.remove('bc-has-logo','bc-logo-dark');};tile.append(img);}
  button.append(tile,el('span','bc-brand-caption',b.name));q('.bc-brand-grid').append(button);buttons.set(b.id,button);
  button.addEventListener('click',()=>select(b.id),{signal:abort.signal});
 }
 const sources=q('.bc-logo-sources');sources.append(el('h3','', 'Logo sources'));
 for(const [name,logo] of Object.entries(logos)){const p=el('p');p.append(link(name,logo.source));sources.append(p);}
 let selected,scene;
 function showDetail(p){
  const detail=q('.bc-detail');detail.replaceChildren();detail.hidden=!p;if(!p)return;
  const close=el('button','bc-detail-close','×');close.setAttribute('aria-label','Close location details');close.onclick=()=>showDetail(null);detail.append(close);
  detail.append(el('span','bc-eyebrow',p.point_type==='permanent'?'PERMANENT STORE':'TEMPORARY PRESENCE'),el('h2','',p.location_name),el('p','bc-detail-address',p.address||'Street address not shown — approximate profile location'),el('p','bc-status',statusText(p)));
  if(p.event_start||p.event_end)detail.append(el('p','bc-date','Reported market window: '+[p.event_start,p.event_end].filter(Boolean).join(' — ')));
  if(p.coordinate_precision?.includes('approximate'))detail.append(el('p','bc-precision','Approximate location · '+p.coordinate_precision.replaceAll('_',' ')));
  if(p.source_group==='legacy_point_without_Maps_brand_match')detail.append(el('p','bc-precision','Temporary classification inferred under the project’s Maps no-match rule.'));
  const links=el('div','bc-detail-links');if(safeURL(p.source_url))links.append(link('View location source ↗',p.source_url));if(safeURL(p.coordinate_source_url)&&p.coordinate_source_url!==p.source_url)links.append(link('Location proxy ↗',p.coordinate_source_url));detail.append(links);
 }
 scene=createScene(q('.bc-map'),{land:runtime.land,mapboxToken:options.mapboxToken||runtime.mapboxToken,reducedMotion:reduced.matches,onPick:showDetail,onState:s=>{
  if(s.warning){q('.bc-map-hint').textContent=s.warning;return;}
  q('.bc-pause').hidden=!s.connections||reduced.matches;q('.bc-pause').textContent=s.paused?'Resume flow':'Pause flow';q('.bc-replay').disabled=!s.connections;
  if(s.rotating!==undefined){q('.bc-orbit').textContent=s.rotating?'Ⅱ Pause rotation':'↻ Rotate map';q('.bc-orbit').setAttribute('aria-pressed',String(s.rotating));}
  q('.bc-animation').classList.toggle('bc-drawing',!s.done&&!s.paused);
 }});
 function select(id){
  const b=brands.find(b=>b.id===id);if(!b)return;
  selected=b;showDetail(null);for(const [bid,button] of buttons)button.setAttribute('aria-pressed',String(bid===id));
  buttons.get(id)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:reduced.matches?'auto':'smooth'});
  q('.bc-brand-story').setAttribute('aria-label',b.name+' location counts');
  const permanent=b.points.filter(p=>p.point_type==='permanent'),temporary=b.points.filter(p=>p.point_type==='temporary'),closed=permanent.filter(p=>CLOSED.has(p.operating_status)),arcs=connectionsFor(b.points);
  q('.bc-brand-stats').replaceChildren(...[[permanent.length,'permanent'],[temporary.length,'temporary'],[closed.length,'closed / paused']].map(([n,label])=>{const e=el('span');e.append(el('strong','',n),el('small','',label));return e;}));
  q('.bc-description').textContent=arcs.length?'Every recorded temporary presence, connected to this brand’s non-closed stores.':permanent.length?'All recorded permanent stores are closed or paused. Temporary presences remain visible.':'Temporary presences are recorded. No permanent store is recorded for this brand.';
  q('.bc-arc-count').textContent=arcs.length+' CONNECTION'+(arcs.length===1?'':'S');
  scene.setPoints(b.points);options.onBrandChange?.({vendor_id:id,name:b.name});
  const url=new URL(location.href);url.hash='brand='+encodeURIComponent(id);if(options.updateURL!==false)history.replaceState(null,'',url);
 }
 q('.bc-replay').addEventListener('click',()=>scene.replay(),{signal:abort.signal});q('.bc-pause').addEventListener('click',()=>scene.togglePause(),{signal:abort.signal});q('.bc-fit').addEventListener('click',()=>scene.fit(),{signal:abort.signal});
 q('.bc-orbit').addEventListener('click',()=>scene.toggleRotation(),{signal:abort.signal});
 reduced.addEventListener('change',e=>scene.setReducedMotion(e.matches),{signal:abort.signal});
 q('.bc-about').addEventListener('click',()=>q('dialog').showModal(),{signal:abort.signal});q('.bc-dialog-close').addEventListener('click',()=>q('dialog').close(),{signal:abort.signal});
 q('dialog').addEventListener('click',e=>{if(e.target===q('dialog')){const r=q('dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)q('dialog').close();}},{signal:abort.signal});
 const requested=decodeURIComponent(location.hash.replace(/^#brand=/,''));select(brands.find(b=>b.id===options.initialBrand)?.id||brands.find(b=>b.id===requested)?.id||brands.find(b=>b.name==='The Original Vadai')?.id||brands[0].id);
 return {setBrand:select,resize:()=>scene.resize(),destroy(){abort.abort();scene.destroy();container.replaceChildren();container.classList.remove('bc-root');},getState:()=>({brand:selected.id,...scene.getState()}),map:scene.map};
}
