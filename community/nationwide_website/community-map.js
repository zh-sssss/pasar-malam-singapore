import {areaAt,upcomingSites} from './community-model.js';
import {inGeometry} from '../site/brand-connections/feedback/model.js';
const fc=features=>({type:'FeatureCollection',features});
const point=(coordinates,properties)=>({type:'Feature',properties,geometry:{type:'Point',coordinates}});
export function labelPoint(geometry){
 const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
 let best=null,width=-1;
 for(const rings of polygons){const ring=rings[0],ys=ring.map(p=>p[1]),lo=Math.min(...ys),hi=Math.max(...ys);
  for(let step=1;step<20;step++){const y=lo+(hi-lo)*step/20,xs=[];
   for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
   xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2){const p=[(xs[i]+xs[i+1])/2,y],w=xs[i+1]-xs[i];if(w>width&&inGeometry(p,geometry)){best=p;width=w;}}
  }
 }return best;
}
export function participationMap(map,{context,mode,onArea,onMarket,onPin,onRecord,onNotice}){
 const prefix='participation-',sources=['areas','markets','pins','selection'],layers=['fill','outlines','selection-area','markets','pins','selection-pin'];
 let active=true,ready=false,pinning=false,selection={areas:[],sites:[],pin:null},crowns=[],pointBadges=[],pulseTimer;
 const future=new Set(upcomingSites(context).map(s=>s.site_id));
 const sites=context.sites.filter(s=>Number.isFinite(s.longitude)&&Number.isFinite(s.latitude));
 let areaValues=new Map(),siteValues=new Map(),pendingData=null,updateData;
 const id=s=>prefix+s;
 function areasData(){return fc(context.areas.features.map(f=>({...f,properties:{...f.properties,count:areaValues.get(f.properties.name)||0}})));}
 function marketData(){return fc(sites.map(s=>point([s.longitude,s.latitude],{site_id:s.site_id,name:s.name,future:future.has(s.site_id),count:siteValues.get(s.site_id)||0})));}
 function paint(){if(!ready)return;
  for(const layer of layers)map.setLayoutProperty(id(layer),'visibility',active?'visible':'none');
  if(mode==='vote')map.setLayoutProperty(id('markets'),'visibility','none');
  map.setFilter(id('selection-area'),['in',['get','name'],['literal',selection.areas]]);
  map.setPaintProperty(id('markets'),'circle-color',['case',['in',['get','site_id'],['literal',selection.sites]],'#d0603c',mode==='vote'?['case',['get','future'],'#527e60','#c4c6c2']:'#527e60']);
  map.setPaintProperty(id('markets'),'circle-radius',mode==='vote'?['+',5,['min',10,['sqrt',['get','count']]]]:5);
  map.getSource(id('selection')).setData(fc(selection.pin?[point(selection.pin,{})]:[]));
  crowns.forEach(m=>{m.getElement().hidden=!active;});pointBadges.forEach(m=>{m.getElement().hidden=!active;});
 }
 function install(){
  try{
  map.addSource(id('areas'),{type:'geojson',data:areasData()});map.addSource(id('markets'),{type:'geojson',data:marketData()});
  map.addSource(id('pins'),{type:'geojson',data:fc([])});map.addSource(id('selection'),{type:'geojson',data:fc([])});
  map.addLayer({id:id('fill'),type:'fill',source:id('areas'),paint:{'fill-color':'#ede4d1','fill-opacity':.5}});
  map.addLayer({id:id('outlines'),type:'line',source:id('areas'),paint:{'line-color':'#a39379','line-width':.8}});
  map.addLayer({id:id('selection-area'),type:'line',source:id('areas'),paint:{'line-color':'#d0603c','line-width':3}});
  map.addLayer({id:id('markets'),type:'circle',source:id('markets'),paint:{'circle-radius':5,'circle-color':'#527e60','circle-stroke-color':'#fff8e8','circle-stroke-width':1.5}});
  map.addLayer({id:id('pins'),type:'circle',source:id('pins'),paint:{'circle-radius':7,'circle-color':'#8a4a6b','circle-stroke-color':'#fff8e8','circle-stroke-width':2}});
  map.addLayer({id:id('selection-pin'),type:'circle',source:id('selection'),paint:{'circle-radius':10,'circle-color':'#d0603c','circle-stroke-color':'#fff8e8','circle-stroke-width':3}});
  ready=true;paint();if(pendingData)updateData(pendingData);
  }catch(error){if(/Style is not done loading/i.test(error.message)){map.once('style.load',install);return;}throw error;}
 }
 install();
 const click=e=>{if(!active||!ready)return;const coordinates=[+e.lngLat.lng.toFixed(6),+e.lngLat.lat.toFixed(6)],area=areaAt(coordinates,context.areas);
  if(pinning){if(!area){onNotice('Choose a point within Singapore.');return;}pinning=false;map.getCanvas().style.cursor='';onPin(coordinates,area);return;}
  const pin=map.queryRenderedFeatures(e.point,{layers:[id('pins')]})[0];if(pin){onRecord?.(String(pin.properties.id));return;}
  const market=map.queryRenderedFeatures(e.point,{layers:[id('markets')]})[0];if(market){onMarket(sites.find(s=>s.site_id===market.properties.site_id));return;}
  if(area)onArea(area);
 };
 map.on('click',click);
 return {setSelection(value){selection={...selection,...value};paint();},setPinning(value){pinning=value;map.getCanvas().style.cursor=value?'crosshair':'';},setActive(value){active=value;paint();},
  setData:updateData=function(data){
   pendingData=data;if(!ready)return;const {counts=new Map(),votes=new Map(),records=[],leaders=[]}=data;areaValues=counts;siteValues=votes;
   map.getSource(id('areas')).setData(areasData());map.getSource(id('markets')).setData(marketData());
   const max=Math.max(1,...counts.values());map.setPaintProperty(id('fill'),'fill-color',['interpolate',['linear'],['get','count'],0,'#ede4d1',max/2,'#b1c9ac',max,'#396b4e']);
   map.getSource(id('pins')).setData(fc(records.filter(p=>p.location?.coordinates?.length===2).map(p=>point(p.location.coordinates,{id:p.id}))));
   crowns.forEach(m=>m.remove());crowns=[];pointBadges.forEach(m=>m.remove());pointBadges=[];
   for(const name of leaders){const feature=context.areas.features.find(f=>f.properties.name===name),coordinates=feature&&labelPoint(feature.geometry);if(!coordinates)continue;
    const element=document.createElement('button');element.className='area-crown';element.type='button';const crown=document.createElementNS('http://www.w3.org/2000/svg','svg');crown.setAttribute('viewBox','0 0 24 20');crown.innerHTML='<path d="M2 5l5 4 5-7 5 7 5-4-3 13H5z" fill="#d9ab38" stroke="#795c21" stroke-width="1.5"/>';element.append(crown,document.createTextNode(name+' · '+counts.get(name)));element.onclick=e=>{e.stopPropagation();onArea(name);};crowns.push(new mapboxgl.Marker({element,anchor:'bottom'}).setLngLat(coordinates).addTo(map));element.setAttribute('role','button');element.setAttribute('aria-label',name+' · '+counts.get(name));crown.setAttribute('aria-hidden','true');
   }
   for(const [siteId,count] of votes){if(!count)continue;const s=sites.find(s=>s.site_id===siteId);if(!s)continue;const element=document.createElement('button');element.className='market-vote-count';element.textContent=count;element.setAttribute('aria-label',s.name+': '+count+' votes');element.onclick=e=>{e.stopPropagation();onMarket(s);};pointBadges.push(new mapboxgl.Marker({element,offset:[11,-11]}).setLngLat([s.longitude,s.latitude]).addTo(map));element.setAttribute('role','button');}
   paint();
  },focusArea(name){const feature=context.areas.features.find(f=>f.properties.name===name);if(!feature)return;const points=feature.geometry.type==='Polygon'?feature.geometry.coordinates.flat():feature.geometry.coordinates.flat(2),bounds=new mapboxgl.LngLatBounds();points.forEach(p=>bounds.extend(p));map.fitBounds(bounds,{padding:map.getPadding(),pitch:0,bearing:0,maxZoom:13,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:650});},
  flash(){if(!ready)return;clearTimeout(pulseTimer);map.setPaintProperty(id('selection-area'),'line-width',6);pulseTimer=setTimeout(()=>{if(map.getLayer(id('selection-area')))map.setPaintProperty(id('selection-area'),'line-width',3);},1200);},
  destroy(){clearTimeout(pulseTimer);map.off('style.load',install);map.off('click',click);map.getCanvas().style.cursor='';crowns.forEach(m=>m.remove());pointBadges.forEach(m=>m.remove());for(const layer of [...layers].reverse())if(map.getLayer(id(layer)))map.removeLayer(id(layer));for(const source of sources)if(map.getSource(id(source)))map.removeSource(id(source));}
 };
}
