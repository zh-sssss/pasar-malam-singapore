import {mountPreferences} from '../../../nationwide_website/community-ui.js';
export async function mountFeedback(container,options={}){
 const abort=new AbortController();
 const context=options.context||await fetch(new URL('../data/feedback-context.json',import.meta.url),{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('The local map context is missing. Run the preview setup script.');return r.json();});
 const shared=Boolean(options.sharedMap);
 container.classList.add('community-feedback');
 container.innerHTML='<button type="button" class="back-link feedback-back">← Back to brands</button><div class="preference-content"></div>';
 const map=options.sharedMap||new mapboxgl.Map({container:document.querySelector('#feedback-map'),accessToken:options.mapboxToken,style:'mapbox://styles/mapbox/light-v11',center:[103.82,1.35],zoom:10.5,pitch:0,bearing:0,minZoom:7});
 if(!shared){map.addControl(new mapboxgl.NavigationControl(),'bottom-left');await new Promise(resolve=>{try{map.getStyle();resolve();}catch{map.once('style.load',resolve);}});}
 if(!shared){
  for(const layer of map.getStyle().layers){
   if(layer.type==='background')map.setPaintProperty(layer.id,'background-color','#f2e8cc');
   if(layer.type==='fill'&&/^water($|-)/.test(layer.id))map.setPaintProperty(layer.id,'fill-color','#b7cfe0');
   if(layer.type==='fill'&&/landuse|landcover|national-park/.test(layer.id))map.setPaintProperty(layer.id,'fill-color','#ceddcc');
   if(layer.type==='symbol'&&layer.layout?.['text-field'])map.setLayoutProperty(layer.id,'visibility','none');
  }
  map.fitBounds([[103.59,1.19],[104.09,1.49]],{pitch:0,bearing:0,padding:{top:35,bottom:35,left:20,right:container.getBoundingClientRect().width+(innerWidth<=600?48:70)+20},duration:0,maxZoom:10.5});
 }
 const handle=mountPreferences(container.querySelector('.preference-content'),{context,map});
 container.querySelector('.feedback-back').onclick=()=>{if(options.onClose)options.onClose();else location.href='../';};
 return {setActive(value){handle.setActive(value);},destroy(){handle.destroy();abort.abort();if(!shared)map.remove();}};
}
