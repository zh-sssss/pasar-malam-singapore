import {submitToUshahidi} from '../ushahidi.js';
export async function submitFeedback(connection,payload,photo,{signal}={}){
 if(connection?.transport==='ushahidi-guest')return submitToUshahidi(connection,payload,photo,{signal});
 const apiBase=typeof connection==='string'?connection:connection?.apiBase;
 if(!apiBase)throw new Error('Submissions are not open yet. No information has been sent.');
 const form=new FormData();form.set('submission',JSON.stringify(payload));if(photo)form.set('photo',photo,'stall-photo.jpg');
 const response=await fetch(apiBase.replace(/\/$/,'')+'/submissions',{method:'POST',body:form,signal});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||result.status!=='pending'||!result.reference)throw new Error(result.error||'Your submission could not be confirmed. Please try again.');
 return result;
}
export async function preparePhoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG or WebP photo.');
 if(file.size>8*1024*1024)throw new Error('Please choose a photo smaller than 8 MB.');
 const bitmap=await createImageBitmap(file),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
 try{
  const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  // Re-encoding strips EXIF location/device metadata before any upload.
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));
  if(!blob||blob.size>2*1024*1024)throw new Error('This photo is too large after resizing. Please choose another.');
  return new File([blob],'stall-photo.jpg',{type:'image/jpeg'});
 }finally{bitmap.close();}
}
