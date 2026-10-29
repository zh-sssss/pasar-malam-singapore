import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import {CLOSED,isOrigin,connectionsFor} from './model.js';
const INK=0x3a322d,CREAM=0xf2e8cc,MINT=0xcde3d6,CORAL=0xe6aa94;
const ORIGIN=[103.82,1.35];
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function material(color){return new THREE.MeshToonMaterial({color,gradientMap:gradient});}
const gradient=new THREE.DataTexture(new Uint8Array([155,218,250]),3,1,THREE.RedFormat);
gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;
function box(parent,color,w,h,d,x,y,z,edge=true){
 const geo=new THREE.BoxGeometry(w,h,d),m=new THREE.Mesh(geo,material(color));m.position.set(x,y,z);parent.add(m);
 if(edge){const lines=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:INK,transparent:true,opacity:.8}));m.add(lines);}
 return m;
}
function typeBase(group,color,sides){
 const base=new THREE.Mesh(new THREE.CircleGeometry(3.35,sides),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,side:THREE.DoubleSide}));
 base.rotation.x=-Math.PI/2;base.position.y=.015;group.add(base);
}
function shop(closed){
 const g=new THREE.Group();typeBase(g,closed?0xb7bfbc:0x4e8975,32);
 box(g,closed?0xbfc3c1:0xb7d3c2,3.5,2.8,2.6,0,1.4,0);
 const roof=box(g,closed?0xc1c6c4:0x4e8975,4.1,.55,3.2,0,2.95,0);roof.material.dispose();roof.material=new THREE.MeshBasicMaterial({color:closed?0xb9c1bd:0x4e8975});
 box(g,0x697c7b,2.65,1.65,.08,0,1.25,1.34);
 box(g,closed?0xc3c5c0:0xeac4b0,3.8,.22,1.15,0,2.28,1.65);
 for(let i=0;i<6;i++)box(g,i%2?0xf7f4ee:closed?0xb8bfbc:0x5f9a82,.6,.24,.85,(i-2.5)*.6,2.13,1.8,false);
 box(g,0xf7f4ee,2.65,.55,.12,0,2.6,1.53);
 box(g,closed?0xaab5ad:0x8dad89,.5,.5,.5,-2,.25,1.2);
 const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,0),material(closed?0xaab4a9:0x8db766));leaf.position.set(-2,.9,1.2);g.add(leaf);
 box(g,0xd4c9b4,4.3,.14,3.5,0,.04,.4);
 return g;
}
function tent(){
 const g=new THREE.Group(),geo=new THREE.ConeGeometry(2.85,1.65,4,1);typeBase(g,0xd27c58,4);
 geo.rotateY(Math.PI/4);const roof=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xd97750}));roof.position.y=2.65;g.add(roof);
 roof.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:INK})));
 for(const x of [-1.65,1.65])for(const z of [-1.65,1.65])box(g,0xf7f4ee,.09,2.4,.09,x,1.2,z);
 box(g,0xf2e8cc,3.45,1,1,0,.6,.7);box(g,0xefd0c3,3.6,.25,.12,0,2.17,1.7);
 box(g,0xd8cfbd,4,.12,3.8,0,.03,0);return g;
}
const vertex=`varying float vT; uniform float uSymbol; uniform float uRadius; void main(){vT=uv.x;vec3 p=position+normal*(uRadius-1.0);p.y+=uSymbol*mix(3.25,3.22,vT);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`;
// A continuous core plus soft travelling highlights, increasing vT from store to stall.
const fragment=`varying float vT;uniform float uReveal;uniform float uPulses;uniform float uPhase;uniform float uMotion;uniform float uHalo;uniform vec3 uColor;uniform vec3 uGlow;uniform float uOpacity;void main(){
 if(vT>uReveal)discard;
 float cycle=fract(vT*uPulses-uPhase);
 float pulse=pow(max(0.0,1.0-abs(cycle*2.0-1.0)),7.0)*uMotion;
 vec3 colour=mix(uColor,uGlow,pulse);
 float alpha=uOpacity*mix(.48+.52*pulse,.08+.7*pulse,uHalo);
 gl_FragColor=vec4(colour,alpha);
#include <colorspace_fragment>
}`;
export function createScene(container,{land,mapboxToken,onPick,onState,reducedMotion=false}){
 if(!globalThis.mapboxgl?.supported())throw new Error('This browser does not support the WebGL map. Try a recent Chrome, Edge or Safari browser.');
 const map=new mapboxgl.Map({container,accessToken:mapboxToken||undefined,style:'mapbox://styles/mapbox/light-v11',center:ORIGIN,zoom:10.3,pitch:55,bearing:-18,antialias:true,minZoom:9,maxZoom:17,maxPitch:72,attributionControl:false});
 map.addControl(new mapboxgl.AttributionControl({compact:true,customAttribution:'Illustrative brand symbols and connections'}),'bottom-right');
 // Keep Mapbox's roads, parks and waterways inside Singapore, with the
 // chapter's paper/mint palette. Basemap roads are solid; brand arcs carry flowing light.
 map.on('style.load',()=>{
  for(const base of map.getStyle().layers){
   if(base.type==='background')map.setPaintProperty(base.id,'background-color','#f2e8cc');
   if(base.type==='fill'&&/^water($|-)/.test(base.id))map.setPaintProperty(base.id,'fill-color','#b7cfe0');
   if(base.type==='fill'&&/landuse|landcover|national-park/.test(base.id)){
    map.setPaintProperty(base.id,'fill-color',['match',['get','class'],['park','wood','grass','scrub','national_park'],'#ceddcc',['hospital','school'],'#e7dfcc','#e8e2cd']);
   }
   if(base.type==='symbol'&&base.layout?.['text-field']){
    map.setLayoutProperty(base.id,'visibility','none');
   }
  }
  // Opaque country polygons cover contextual detail outside Singapore.
  map.addSource('context-countries',{type:'vector',url:'mapbox://mapbox.country-boundaries-v1'});
  map.addLayer({id:'plain-neighbouring-countries',type:'fill',source:'context-countries','source-layer':'country_boundaries',filter:['all',['!=',['get','iso_3166_1'],'SG'],['==',['get','disputed'],'false'],['any',['==',['get','worldview'],'all'],['in','US',['get','worldview']]]],paint:{'fill-color':'#f2e8cc','fill-opacity':1,'fill-antialias':true}});
 });
 map.addControl(new mapboxgl.NavigationControl({showCompass:true,visualizePitch:true}),'bottom-right');
 const merc=mapboxgl.MercatorCoordinate.fromLngLat(ORIGIN),unit=merc.meterInMercatorCoordinateUnits();
 const world=p=>{const c=mapboxgl.MercatorCoordinate.fromLngLat([p.longitude,p.latitude]);return V((c.x-merc.x)/unit,0,(c.y-merc.y)/unit);};
 function fitPoints(points,duration=reducedMotion?0:1100){
  if(!points?.length)return;
  const bounds=new mapboxgl.LngLatBounds();points.forEach(p=>bounds.extend([p.longitude,p.latitude]));
  const phone=container.clientWidth<600,sidebar=phone?0:container.closest('.bc-root').querySelector('.bc-sidebar').getBoundingClientRect().width;
  map.fitBounds(bounds,{padding:{top:phone?140:155,bottom:phone?145:100,left:sidebar+(phone?30:55),right:phone?30:55},maxZoom:13,pitch:55,bearing:-18,duration});
 }
 const transform=new THREE.Matrix4().makeTranslation(merc.x,merc.y,0).scale(V(unit,-unit,unit)).multiply(new THREE.Matrix4().makeRotationX(Math.PI/2));
 const scene=new THREE.Scene(),camera=new THREE.Camera();scene.add(new THREE.HemisphereLight(0xc4caf0,0xf1e5d5,2.8));const sun=new THREE.DirectionalLight(0xfff1df,2.5);sun.position.set(-1,4,2);scene.add(sun);
 let renderer,nodes=[],arcs=[],selection=[],progress=1,start=0,paused=false,done=true,disposed=false,layerReady=false,pending=null,lastHovered=null,resizeObserver;
 let rotating=!reducedMotion,rotationFrame,lastFrame=0,rotationAfter=0,flowPhase=0,flowLast=0;
 const rotationState=()=>onState?.({progress,paused,done,connections:arcs.length,rotating});
 function orbit(now){
  if(disposed)return;
  const dt=Math.min((now-(lastFrame||now))/1000,.05);lastFrame=now;
  if(rotating&&layerReady&&now>rotationAfter&&!document.hidden&&!map.isMoving())map.setBearing(map.getBearing()+dt*1.5);
  rotationFrame=requestAnimationFrame(orbit);
 }
 rotationFrame=requestAnimationFrame(orbit);
 for(const name of ['dragstart','zoomstart','rotatestart','pitchstart'])map.on(name,e=>{if(e.originalEvent)rotationAfter=performance.now()+8000;});
 container.addEventListener('pointerdown',()=>{rotationAfter=performance.now()+8000;});
 container.addEventListener('wheel',()=>{rotationAfter=performance.now()+8000;},{passive:true});
 const wake=()=>{if(!document.hidden){flowLast=performance.now();map.triggerRepaint();}};
 document.addEventListener('visibilitychange',wake);
 const meshes=new THREE.Group();scene.add(meshes);
 function free(){meshes.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});meshes.clear();nodes=[];arcs=[];}
 function draw(points){
  free();selection=points;progress=reducedMotion?1:0;paused=false;done=reducedMotion;start=performance.now();flowPhase=0;flowLast=start;
  rotationAfter=performance.now()+1900;
  nodes=points.map(p=>{const closed=CLOSED.has(p.operating_status),g=p.point_type==='permanent'?shop(closed):tent();g.position.copy(world(p));
   if(closed)g.traverse(o=>{if(o.material){o.material.transparent=true;o.material.opacity=.36;}});
   const pulseMaterials=[];if(p.point_type==='temporary')g.traverse(o=>{if(o.isMesh&&o.material?.color)pulseMaterials.push({material:o.material,base:o.material.color.clone()});});
   meshes.add(g);return {p,g,closed,pulseMaterials};});
  for(const link of connectionsFor(points)){
   const from=world(link.source),to=world(link.target),length=from.distanceTo(to),height=clamp(length*.20,180,2800);
   const curve=new THREE.CatmullRomCurve3(Array.from({length:49},(_,i)=>{const t=i/48;return from.clone().lerp(to,t).add(V(0,Math.sin(Math.PI*t)*height,0));}));
   const geo=new THREE.TubeGeometry(curve,72,1,8,false),pulses=clamp(length/18000,1,2);
   const uniforms={uSymbol:{value:1},uRadius:{value:1},uReveal:{value:progress},uPulses:{value:pulses},uMotion:{value:reducedMotion?0:1},uHalo:{value:1},uGlow:{value:new THREE.Color(0xffedb0)},uPhase:{value:0},uColor:{value:new THREE.Color(0xb57656)},uOpacity:{value:.6}};
   const outerMat=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms,transparent:true,side:THREE.BackSide,depthWrite:false});
   const baseOpacity=link.target.classification_inferred ? .72 : .9;
   const innerUniforms={...uniforms,uHalo:{value:0},uRadius:{value:.5},uColor:{value:new THREE.Color(0xb57656)},uOpacity:{value:baseOpacity}};
   const innerMat=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:innerUniforms,transparent:true,depthWrite:false});
   const outer=new THREE.Mesh(geo,outerMat),inner=new THREE.Mesh(geo,innerMat);meshes.add(outer,inner);
   const tip=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({color:0xf7f4ee}));meshes.add(tip);
   arcs.push({link,curve,outer,inner,tip,uniforms,innerUniforms,baseOpacity});
  }
  if(!arcs.length){progress=1;done=true;}
  rotationState();map.triggerRepaint();
 }
 const layer={id:'brand-network-3d',type:'custom',renderingMode:'3d',onAdd(m,gl){renderer=new THREE.WebGLRenderer({canvas:m.getCanvas(),context:gl,antialias:true});renderer.autoClear=false;renderer.outputColorSpace=THREE.SRGBColorSpace;layerReady=true;if(pending)draw(pending);},
  render(gl,matrix){
   if(disposed)return;
   const now=performance.now(),flowDt=clamp((now-flowLast)/1000,0,.05);flowLast=now;
   if(!paused&&!reducedMotion)flowPhase=(flowPhase+flowDt*.55)%1;
   if(!paused&&!done){progress=clamp((now-start)/1500,0,1);if(progress===1)done=true;onState?.({progress,paused,done,connections:arcs.length});}
   const mpp=40075016.686*Math.cos(map.getCenter().lat*Math.PI/180)/(512*2**map.getZoom()),symbol=mpp*5.2;
   for(const n of nodes){n.g.scale.setScalar(symbol*(n.closed ? .8 : 1));n.g.visible=n.p.point_type==='permanent'||progress>.72;
    const shade=reducedMotion ? 1 : .62+.38*(Math.sin(flowPhase*Math.PI*2)+1)/2;
    for(const {material,base} of n.pulseMaterials)material.color.copy(base).multiplyScalar(shade);
   }
   for(const a of arcs){a.uniforms.uSymbol.value=symbol;a.uniforms.uReveal.value=progress;a.uniforms.uPhase.value=flowPhase;a.uniforms.uRadius.value=mpp*1.8;
    a.innerUniforms.uRadius.value=mpp*.55;
    const t=progress;a.tip.position.copy(a.curve.getPointAt(t));a.tip.position.y+=symbol*3.24;a.tip.scale.setScalar(mpp*1.5);a.tip.visible=progress>0&&progress<1;
   }
   camera.projectionMatrix=new THREE.Matrix4().fromArray(matrix).multiply(transform);camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
   renderer.resetState();renderer.render(scene,camera);if(!paused&&(!done||(!reducedMotion&&nodes.some(n=>n.p.point_type==='temporary')))&&!document.hidden)map.triggerRepaint();
  },onRemove(){free();renderer?.dispose();}};
 map.on('load',()=>{map.addLayer(layer);});
 map.on('error',e=>{if(e.error?.message?.includes('token'))return;onState?.({warning:'Map resource unavailable. The brand network remains available.'});});
 function hit(point){
  const ndc=V(point.x/container.clientWidth*2-1,1-point.y/container.clientHeight*2,-1),near=ndc.clone().applyMatrix4(camera.projectionMatrixInverse),far=V(ndc.x,ndc.y,1).applyMatrix4(camera.projectionMatrixInverse);
  const ray=new THREE.Raycaster(near,far.sub(near).normalize());scene.updateMatrixWorld(true);
  const intersections=ray.intersectObjects(nodes.map(n=>n.g),true);
  if(intersections.length){let o=intersections[0].object;while(o.parent&&o.parent!==meshes)o=o.parent;return nodes.find(n=>n.g===o)?.p;}
  let best=null,d=24;for(const n of nodes){const q=map.project([n.p.longitude,n.p.latitude]),delta=Math.hypot(point.x-q.x,point.y-q.y);if(delta<d){best=n.p;d=delta;}}return best;
 }
 map.on('click',e=>{const p=hit(e.point);onPick?.(p||null);});
 map.on('mousemove',e=>{const p=hit(e.point);container.style.cursor=p?'pointer':'';if(p?.point_id===lastHovered)return;lastHovered=p?.point_id;
  for(const a of arcs){const relevant=!p||a.link.source.point_id===p.point_id||a.link.target.point_id===p.point_id;a.uniforms.uOpacity.value=relevant ? .6 : .08;a.innerUniforms.uOpacity.value=relevant ? a.baseOpacity : .12;}map.triggerRepaint();});
 let lastSize='';resizeObserver=new ResizeObserver(()=>{const size=container.clientWidth+'x'+container.clientHeight;if(size===lastSize)return;lastSize=size;map.resize();if(pending)fitPoints(pending,0);});resizeObserver.observe(container);
 return {
  setPoints(points){pending=points;if(layerReady)draw(points);fitPoints(points);},
  replay(){progress=reducedMotion?1:0;start=performance.now();flowPhase=0;flowLast=start;paused=false;done=reducedMotion||!arcs.length;onState?.({progress,paused,done,connections:arcs.length});map.triggerRepaint();},
  togglePause(){paused=!paused;if(!paused){if(!done)start=performance.now()-progress*1500;flowLast=performance.now();}onState?.({progress,paused,done,connections:arcs.length});map.triggerRepaint();},
  fit(){rotationAfter=performance.now()+1900;fitPoints(pending);},
  resize(){map.resize();},
  toggleRotation(){rotating=!rotating;rotationAfter=performance.now();rotationState();return rotating;},
  setReducedMotion(value){reducedMotion=value;for(const a of arcs)a.uniforms.uMotion.value=value?0:1;if(value){rotating=false;progress=1;done=true;paused=false;rotationState();map.triggerRepaint();}},
  destroy(){disposed=true;cancelAnimationFrame(rotationFrame);document.removeEventListener('visibilitychange',wake);resizeObserver.disconnect();map.remove();},
  getState(){return {progress,paused,done,connections:arcs.length,points:selection.length,pitch:map.getPitch(),bearing:map.getBearing(),rotating};},
  map
 };
}
