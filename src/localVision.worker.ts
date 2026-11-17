import {decodeCards} from './localVisionCore';

const MODEL='https://huggingface.co/sroot/lgd-cards-gen3/resolve/b2e9e89cc0138a70fc3ac5661922f99b4e3ae135/model.onnx';
const HASH='8b767cdfed2c8e954a9134013ac3d2f2c53be048768d559675be01277a8a8fd1';
const CDN='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
const progress=(message:string)=>self.postMessage({type:'progress',message});
async function download():Promise<ArrayBuffer>{
 let cache:Cache|undefined;
 try{cache=await caches.open('buraco-cartas-v1');const hit=await cache.match(MODEL);if(hit)return await hit.arrayBuffer();}catch{/* Private browsing can disable cache. */}
 progress('Baixando leitor de cartas (38 MB). A foto fica no aparelho.');
 const response=await fetch(MODEL,{credentials:'omit',referrerPolicy:'no-referrer'});
 if(!response.ok)throw new Error('Não foi possível baixar o leitor. Confira a conexão e tente novamente.');
 const data=await response.arrayBuffer();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==HASH)throw new Error('O leitor baixado não passou na verificação. Tente novamente.');
 try{await cache?.put(MODEL,new Response(data));}catch{/* Low storage does not prevent this analysis. */}
 return data;
}
self.onmessage=async(event:MessageEvent<{image:ImageBitmap}>)=>{
 const image=event.data.image;
 let session:any,input:any;
 try{
  if(typeof OffscreenCanvas==='undefined')throw new Error('Este navegador não oferece os recursos necessários. Atualize-o ou use o preenchimento manual.');
  progress('Preparando leitor no aparelho…');
  const url=CDN+'ort.wasm.min.mjs';
  const ort=await import(/* @vite-ignore */ url);
  ort.env.wasm.wasmPaths=CDN;ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;
  const model=await download();
  progress('Carregando leitor. Na primeira vez pode demorar…');
  session=await ort.InferenceSession.create(model,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
  const canvas=new OffscreenCanvas(640,640),ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Não foi possível preparar a imagem.');
  const width=image.width,height=image.height,scale=Math.min(640/width,640/height);
  ctx.fillStyle='rgb(114,114,114)';ctx.fillRect(0,0,640,640);
  ctx.drawImage(image,(640-width*scale)/2,(640-height*scale)/2,width*scale,height*scale);
  image.close();
  const pixels=ctx.getImageData(0,0,640,640).data,values=new Float32Array(3*640*640);
  for(let i=0;i<640*640;i++){values[i]=pixels[4*i]/255;values[640*640+i]=pixels[4*i+1]/255;values[2*640*640+i]=pixels[4*i+2]/255;}
  input=new ort.Tensor('float32',values,[1,3,640,640]);
  progress('Lendo valores e naipes no aparelho…');
  const output=await session.run({[session.inputNames[0]]:input});
  const tensor=output[session.outputNames[0]];
  const boxes=decodeCards(tensor.data,tensor.dims,width,height);
  for(const value of Object.values(output) as any[])value.dispose?.();
  self.postMessage({type:'result',boxes});
 }catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:'Falha na leitura local.'});}
 finally{image.close();input?.dispose?.();await session?.release?.();}
};
