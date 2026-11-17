import type {CardBox} from './localVisionCore';
export async function recognizeLocally(image:string,signal:AbortSignal,onProgress:(message:string)=>void):Promise<CardBox[]>{
 if(!globalThis.Worker||!globalThis.createImageBitmap)throw new Error('Atualize seu navegador para usar a leitura local. O preenchimento manual continua disponível.');
 const bitmap=await createImageBitmap(await(await fetch(image)).blob());
 if(signal.aborted){bitmap.close();throw new DOMException('Cancelado','AbortError');}
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./localVision.worker.ts',import.meta.url),{type:'module'});
  const stop=()=>{clearTimeout(timeout);signal.removeEventListener('abort',abort);worker.terminate();};
  const abort=()=>{stop();reject(new DOMException('Cancelado','AbortError'));};
  const timeout=setTimeout(()=>{stop();reject(new Error('O aparelho demorou demais. Tente fotografar menos cartas ou preencha manualmente.'));},180_000);
  signal.addEventListener('abort',abort,{once:true});
  worker.onmessage=event=>{
   if(event.data.type==='progress')onProgress(event.data.message);
   if(event.data.type==='result'){stop();resolve(event.data.boxes);}
   if(event.data.type==='error'){stop();reject(new Error(event.data.message));}
  };
  worker.onerror=()=>{stop();reject(new Error('Não foi possível iniciar o leitor no aparelho. Confira a conexão, atualize o navegador ou use o preenchimento manual.'));};
  worker.postMessage({image:bitmap},[bitmap]);
 });
}
