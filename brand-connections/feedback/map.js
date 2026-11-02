import {areaAt,marketTiming} from './model.js';

export function createFeedbackMap(container,{context,mapboxToken,onMarket,onPin,onArea,onNotice}){
 const map=new mapboxgl.Map({container,accessToken:mapboxToken,style:'mapbox://styles/mapbox/light-v11',center:[103.82,1.35],zoom:10.5,pitch:28,bearing:-12,antialias:true,minZoom:9,maxZoom:17,attributionControl:true});
 map.addControl(new mapboxgl.NavigationControl(),'bottom-right');
 let mode='report',selection={siteIds:[],areas:[],pin:null},ready=false;
 const timing=marketTiming(context);
 const sites=context.sites.filter(s=>Number.isFinite(s.longitude)&&Number.isFinite(s.latitude));
 const collection={type:'FeatureCollection',features:sites.map(s=>({type:'Feature',properties:{site_id:s.site_id,name:s.name,...timing.get(s.site_id)},geometry:{type:'Point',coordinates:[s.longitude,s.latitude]}}))};
 const popup=new mapboxgl.Popup({closeButton:false,closeOnClick:false,offset:12});
 function paint(){if(!ready)return;
  const selected=['in',['get','site_id'],['literal',selection.siteIds]];
  const preference=mode!=='report';
  map.setFilter('recorded-markets',preference?null:['==',['get','pastOrOngoing'],true]);
  map.setPaintProperty('recorded-markets','circle-color',['case',selected,'#be6747',preference?['case',['==',['get','future'],true],'#6c9b8a','#c4c6c2']:'#6c9b8a']);
  map.setPaintProperty('recorded-markets','circle-radius',['case',selected,9,5]);
  map.setPaintProperty('recorded-markets','circle-stroke-width',['case',selected,4,1.5]);
  map.setLayoutProperty('recorded-markets','circle-sort-key',['case',selected,2,['==',['get','future'],true],1,0]);
  map.setFilter('selected-areas',['in',['get','name'],['literal',selection.areas]]);
  map.getSource('selected-pin').setData({type:'FeatureCollection',features:selection.pin?[{type:'Feature',properties:{},geometry:{type:'Point',coordinates:selection.pin}}]:[]});
  map.setLayoutProperty('area-outlines','visibility',mode==='areas'?'visible':'none');
 }
 map.on('load',()=>{
  for(const layer of map.getStyle().layers){
   if(layer.type==='background')map.setPaintProperty(layer.id,'background-color','#f2e8cc');
   if(layer.type==='fill'&&/^water($|-)/.test(layer.id))map.setPaintProperty(layer.id,'fill-color','#b7cfe0');
   if(layer.type==='fill'&&/landuse|landcover|national-park/.test(layer.id))map.setPaintProperty(layer.id,'fill-color','#ceddcc');
   if(layer.type==='symbol'&&layer.layout?.['text-field'])map.setLayoutProperty(layer.id,'visibility','none');
  }
  map.addSource('countries',{type:'vector',url:'mapbox://mapbox.country-boundaries-v1'});
  map.addLayer({id:'plain-neighbours',type:'fill',source:'countries','source-layer':'country_boundaries',filter:['all',['!=',['get','iso_3166_1'],'SG'],['==',['get','disputed'],'false'],['any',['==',['get','worldview'],'all'],['in','US',['get','worldview']]]],paint:{'fill-color':'#f2e8cc'}});
  map.addSource('planning-areas',{type:'geojson',data:context.areas});
  map.addLayer({id:'area-hit',type:'fill',source:'planning-areas',paint:{'fill-opacity':0}});
  map.addLayer({id:'selected-areas',type:'fill',source:'planning-areas',filter:['in',['get','name'],['literal',[]]],paint:{'fill-color':'#d68865','fill-opacity':.4}});
  map.addLayer({id:'area-outlines',type:'line',source:'planning-areas',layout:{visibility:'none'},paint:{'line-color':'#8f8b6e','line-width':1,'line-opacity':.7}});
  map.addSource('recorded-markets',{type:'geojson',data:collection});
  map.addLayer({id:'recorded-markets',type:'circle',source:'recorded-markets',paint:{'circle-color':'#6c9b8a','circle-radius':5,'circle-stroke-color':'#fff8e8','circle-stroke-width':1.5}});
  map.addSource('selected-pin',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
  map.addLayer({id:'selected-pin-halo',type:'circle',source:'selected-pin',paint:{'circle-radius':16,'circle-color':'#c66d48','circle-opacity':.2}});
  map.addLayer({id:'selected-pin',type:'circle',source:'selected-pin',paint:{'circle-radius':8,'circle-color':'#ba5f3d','circle-stroke-width':3,'circle-stroke-color':'#fff9ed'}});
  ready=true;paint();
 });
 map.on('click',event=>{
  if(!ready)return;
  if(mode==='areas'){
   const market=map.queryRenderedFeatures(event.point,{layers:['recorded-markets']})[0];
   if(market){onMarket(sites.find(s=>s.site_id===market.properties.site_id));return;}
   const name=areaAt([event.lngLat.lng,event.lngLat.lat],context.areas);if(name)onArea(name);else onNotice('Choose a planning area in Singapore.');return;
  }
  const hit=map.queryRenderedFeatures(event.point,{layers:['recorded-markets']})[0];
  if(hit){onMarket(sites.find(s=>s.site_id===hit.properties.site_id));return;}
  if(mode==='upcoming'){onNotice('Choose an upcoming market from the list or a highlighted market pin.');return;}
  const point=[Number(event.lngLat.lng.toFixed(6)),Number(event.lngLat.lat.toFixed(6))],area=areaAt(point,context.areas);
  if(area)onPin(point,area);else onNotice('Place the pin on land within Singapore.');
 });
 map.on('mousemove',event=>{
  if(!ready)return;
  const feature=map.queryRenderedFeatures(event.point,{layers:['recorded-markets']})[0];
  container.style.cursor=feature||mode==='areas'?'pointer':'crosshair';
  if(feature)popup.setLngLat(feature.geometry.coordinates).setText(feature.properties.name).addTo(map);else popup.remove();
 });
 map.on('error',()=>onNotice('Some map detail is unavailable. You can still choose recorded markets from the list.'));
 const observer=new ResizeObserver(()=>map.resize());observer.observe(container);
 return {map,setMode(value){mode=value;paint();},setSelection(value){selection=value;paint();},focus(coordinates){map.flyTo({center:coordinates,zoom:13,pitch:28,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:750});},fit(){map.flyTo({center:[103.82,1.35],zoom:10.5,pitch:28,bearing:-12,duration:700});},destroy(){observer.disconnect();popup.remove();map.remove();}};
}
