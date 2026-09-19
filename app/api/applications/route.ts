import { env } from 'cloudflare:workers';
import { MAX_PHOTO_BYTES, validateDetails } from '@/lib/loan';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Please submit from the Ohio website.'},403);
 if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))return json({error:'Invalid application format.'},400);
 // Bound the request body, including chunked requests, before parsing uploads.
 const reader=request.body?.getReader();if(!reader)return json({error:'Application is empty.'},400);
 const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_PHOTO_BYTES*2+65536){await reader.cancel();return json({error:'Each photo must be 2 MB or smaller.'},413);}chunks.push(value);}
 try{
 const form=await new Response(new Blob(chunks as BlobPart[]),{headers:{'Content-Type':request.headers.get('content-type')!}}).formData();
 const str=(key:string)=>String(form.get(key)||'').trim();const details={kind:str('kind'),name:str('name'),phone:str('phone'),amount:str('amount'),business:str('business')};const error=validateDetails(details);if(error)return json({error},400);
 if(str('consent')!=='yes')return json({error:'Please confirm permission to review your request.'},400);
 const id=str('requestId');if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id))return json({error:'Invalid request. Please review your application again.'},400);
 const photos:Record<string,{type:string;data:string}>={};
 for(const field of ['photo','collateral']){const file=form.get(field);if(!(file instanceof File)||!file.size||file.size>MAX_PHOTO_BYTES||!['image/jpeg','image/png','image/webp'].includes(file.type))return json({error:'Add both photos as JPG, PNG or WebP files up to 2 MB each.'},400);const bytes=new Uint8Array(await file.arrayBuffer());const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';if(!(file.type==='image/png'&&png||file.type==='image/jpeg'&&jpg||file.type==='image/webp'&&webp))return json({error:'A photo is not a valid image. Please choose another.'},400);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));photos[field]={type:file.type,data:btoa(binary)};}
 const bucket=(env as unknown as {BUCKET:R2Bucket}).BUCKET;if(!bucket)return json({error:'Applications are temporarily unavailable. Please try again later.'},503);
 const reference='OHIO-'+id.toUpperCase();const key='applications/'+id+'.json';
 // One conditional object write stores the whole application atomically. Retry uses the same ID.
 await bucket.put(key,JSON.stringify({...details,business:details.kind==='business'?details.business:undefined,currency:'MWK',reference,createdAt:new Date().toISOString(),consent:true,status:'received',photos}),{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});
 return json({reference},201);
 }catch{console.error('Application storage failed');return json({error:'We could not save your application. Your details are still here; please try again.'},503);}
}
