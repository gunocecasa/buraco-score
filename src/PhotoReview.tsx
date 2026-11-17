import {useEffect,useRef,useState} from 'react';
import {score,handPoints,type Rules} from './rules';
import {validateDetection,validRanks,type DetectedCard,type DetectedGroup} from '../shared/detection.js';
type Props={purpose?:'table'|'hand';initialTarget?:number;names:string[];participantLabel:'Dupla'|'Jogador';rules:Rules;onConfirm:(team:number,groups:DetectedGroup[],replace:boolean)=>boolean;onPending:(pending:boolean)=>void};
const suits=['♠','♥','♣','♦','?'];
async function preparePhoto(file:File):Promise<string>{
 if(!file.type.startsWith('image/'))throw new Error('Escolha um arquivo de imagem.');
 if(file.size>20_000_000)throw new Error('A foto é muito grande. Escolha uma imagem de até 20 MB.');
 const url=URL.createObjectURL(file);
 try{
  const img=new Image();img.src=url;
  try{await img.decode();}catch{throw new Error('Este formato não abriu no navegador. Use uma foto JPEG, PNG ou WebP.');}
  const ratio=Math.min(1,2400/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Não foi possível preparar a foto neste navegador.');
  ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  for(const quality of [.88,.7,.55]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<3_000_000)return data;}
  throw new Error('A foto ainda está grande demais. Fotografe uma área menor.');
 }finally{URL.revokeObjectURL(url);}
}
export default function PhotoReview({purpose='table',initialTarget=0,names,participantLabel,rules,onConfirm,onPending}:Props){
 const [target,setTarget]=useState(initialTarget),[image,setImage]=useState(''),[groups,setGroups]=useState<DetectedGroup[]|null>(null),[warnings,setWarnings]=useState<string[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[code,setCode]=useState(''),[reviewed,setReviewed]=useState(false),[replace,setReplace]=useState(true);
 const camera=useRef<HTMLInputElement>(null),gallery=useRef<HTMLInputElement>(null),controller=useRef<AbortController|null>(null),generation=useRef(0);
 const pending=Boolean(image||groups!==null||busy);
 useEffect(()=>{onPending(pending);},[pending,onPending]);
 useEffect(()=>()=>{generation.current++;controller.current?.abort();},[]);
 function discard(){generation.current++;controller.current?.abort();setImage('');setGroups(null);setWarnings([]);setReviewed(false);setError('');setBusy(false);}
 async function choose(file?:File){
  if(!file)return;
  const run=++generation.current;setBusy(true);setError('');setGroups(null);setWarnings([]);setImage('');setReviewed(false);
  try{const data=await preparePhoto(file);if(run===generation.current)setImage(data);}catch(e){if(run===generation.current)setError((e as Error).message);}finally{if(run===generation.current)setBusy(false);}
 }
 async function recognize(){
  if(!image||busy)return;
  if(groups!==null&&!confirm('Analisar novamente e substituir as correções desta revisão?'))return;
  if(location.protocol==='file:'){setError('A leitura por IA precisa do site publicado ou do servidor local. Aqui você pode continuar com o lançamento manual.');return;}
  if(code.length<12){setError('Informe o código da mesa fornecido por quem publicou o site.');return;}
  const run=++generation.current;controller.current=new AbortController();const active=controller.current;setBusy(true);setError('');setReviewed(false);
  const timeout=setTimeout(()=>active.abort(),65_000);
  try{
   const response=await fetch('/api/detect',{method:'POST',headers:{'Content-Type':'application/json','X-Mesa-Code':code},body:JSON.stringify({image,purpose}),signal:active.signal});
   let result;try{result=await response.json();}catch{throw new Error('O reconhecimento não está disponível neste endereço. Use o site publicado com a função de foto configurada.');}
   if(!response.ok)throw new Error(typeof result.error==='string'?result.error:'Não foi possível reconhecer a imagem.');
   const detection=validateDetection(result);
   if(run===generation.current){setGroups(purpose==='hand'?[{kind:'sequence',cards:detection.groups.flatMap(g=>g.cards)}]:detection.groups);setWarnings(detection.warnings);}
  }catch(e){if(run===generation.current)setError((e as Error).name==='AbortError'?'Análise interrompida ou tempo esgotado. Tente novamente.':(e as Error).message);}
  finally{clearTimeout(timeout);if(run===generation.current)setBusy(false);}
 }
 function edit(next:DetectedGroup[]){setGroups(next);setReviewed(false);}
 function updateCard(groupIndex:number,cardIndex:number,patch:Partial<DetectedCard>){
  if(!groups)return;
  edit(groups.map((g,i)=>i!==groupIndex?g:{...g,cards:g.cards.map((c,j)=>{
   if(j!==cardIndex)return c;const next={...c,...patch,confidence:'high' as const};
   if(next.rank==='Joker'){next.wild=true;next.suit='';}else{if(next.suit==='')next.suit='?';if(next.rank!=='2')next.wild=false;}
   return next;
  })}));
 }
 function moveCard(from:number,index:number,to:number){if(!groups||from===to)return;const card=groups[from].cards[index];edit(groups.map((g,i)=>({...g,cards:i===from?g.cards.filter((_,j)=>j!==index):i===to?[...g.cards,card]:g.cards})));}
 const results=groups?.map(g=>{
  if(g.cards.some(c=>c.rank==='?'||(purpose==='table'&&c.rank!=='Joker'&&!suits.slice(0,4).includes(c.suit))))return {error:purpose==='hand'?'Corrija as cartas com valor desconhecido.':'Corrija as cartas com valor ou naipe desconhecido.',total:0,label:''};
  try{return purpose==='hand'?{total:handPoints(g.cards,rules),label:'Desconto da mão',error:''}:{...score(g.cards,g.kind,rules),error:''};}catch(e){return {error:(e as Error).message,total:0,label:''};}
 })||[];
 const valid=Boolean(groups?.length)&&results.every(r=>!r.error);
 const count=groups?.reduce((n,g)=>n+g.cards.length,0)||0;
 return <section className="panel photo-panel" aria-label={purpose==='hand'?'Desconto por foto':'Lançamento por foto'}><div className="eyebrow">CÂMERA + CONFERÊNCIA MANUAL</div><h2>{purpose==='hand'?'Cartas restantes na mão':`Fotografe os jogos ${participantLabel==='Dupla'?'da dupla':'do jogador'}`}</h2><p>{purpose==='hand'?'Fotografe as cartas que sobraram após a batida. Confira a leitura antes de aplicar o desconto.':'Use a foto para preencher os jogos e corrija o que for necessário. O lançamento manual continua disponível abaixo.'}</p>
 <div className="photo-start"><label>{participantLabel} da foto <select aria-label={participantLabel+' da foto'} disabled={pending||purpose==='hand'} value={target} onChange={e=>setTarget(Number(e.target.value))}>{names.map((n,i)=><option key={i} value={i}>{n||`${participantLabel} ${i+1}`}</option>)}</select></label><button disabled={busy} onClick={()=>{if(groups!==null&&!confirm('Trocar a foto e descartar esta revisão?'))return;camera.current?.click();}}>📷 Tirar foto</button><button disabled={busy} onClick={()=>{if(groups!==null&&!confirm('Trocar a foto e descartar esta revisão?'))return;gallery.current?.click();}}>Escolher da galeria</button></div>
 <input ref={camera} className="file-input" type="file" accept="image/*" capture="environment" aria-label={purpose==='hand'?'Tirar foto das cartas restantes':'Tirar foto da mesa'} onChange={e=>{void choose(e.target.files?.[0]);e.target.value='';}}/>
 <input ref={gallery} className="file-input" type="file" accept="image/*" aria-label="Escolher foto da galeria" onChange={e=>{void choose(e.target.files?.[0]);e.target.value='';}}/>
 <small>{purpose==='hand'?'Abra em leque todas as cartas restantes deste participante, deixando os valores visíveis. Não inclua os jogos baixados na mesa.':'Fotografe apenas os jogos do participante selecionado, de cima, com boa luz e valores e naipes visíveis. No computador, escolha uma imagem. Cartas cobertas podem não ser identificadas.'}</small>
 {image&&<div className="photo-workspace"><img className="table-photo" src={image} alt={`${purpose==='hand'?'Foto da mão':'Foto da mesa'} de ${names[target]||`${participantLabel} ${target+1}`}`}/><div><h3>{names[target]||`${participantLabel} ${target+1}`}</h3><p>A imagem será enviada ao Gemini (Google) quando você tocar em reconhecer. Na faixa gratuita, o Google pode usar o conteúdo para melhorar seus produtos. A foto não entra no histórico da partida.</p><label className="access-label">Código da mesa <input type="password" autoComplete="off" value={code} onChange={e=>setCode(e.target.value)} placeholder="Fornecido por quem publicou" maxLength={256}/></label><div className="actions"><button className="primary" disabled={busy} onClick={()=>void recognize()}>{busy?'Analisando…':groups===null?'Reconhecer foto':'Analisar novamente'}</button></div>{groups===null&&<button className="text-button" disabled={busy} onClick={()=>{edit([{kind:'sequence',cards:[]}]);setWarnings(['Modo de revisão manual: nenhuma carta foi reconhecida automaticamente.']);}}>Preencher manualmente usando a foto</button>}</div></div>}
 {busy&&<p role="status">Preparando ou analisando a foto. Você poderá conferir tudo antes de lançar.</p>}
 {error&&<p role="alert" className="warning">{error}</p>}
 {groups!==null&&<div className="photo-review"><h3>{purpose==='hand'?'Confira a mão':'Confira os jogos'} · {count} cartas</h3><p>{purpose==='hand'?'Corrija os valores, remova cartas extras e acrescente as que faltaram. O desconto é a soma das cartas, sem bônus de canastra.':'Você pode mudar valores, naipes, coringas e agrupamento. Remova cartas a mais e acrescente as que faltaram.'}</p>{warnings.length>0&&<ul className="warning">{warnings.map((w,i)=><li key={i}>{w}</li>)}</ul>}{!groups.length&&<p>Nenhum jogo detectado. Tente outra foto ou adicione um jogo e preencha as cartas.</p>}
 {groups.map((g,i)=><section className="detected-game" key={i}><div className="review-game-header"><h3>{purpose==='hand'?'Cartas da mão':`Jogo ${i+1}`}</h3>{purpose==='table'&&<><label>Tipo <select aria-label={`Tipo do jogo ${i+1}`} value={g.kind} onChange={e=>edit(groups.map((item,j)=>j===i?{...item,kind:e.target.value as DetectedGroup['kind']}:item))}><option value="sequence">Sequência</option><option value="lavadeira">Lavadeira de ases</option></select></label><button onClick={()=>edit(groups.filter((_,j)=>j!==i))}>Remover jogo</button></>}</div>
 <div className="detected-cards">{g.cards.map((c,j)=><div className={'edit-card '+(c.confidence==='low'||c.rank==='?'||c.suit==='?'?'uncertain':'')} key={j}><span className="card-index">Carta {j+1}{c.confidence==='low'?' · conferir':''}</span><div className="card-fields"><label>Valor<select aria-label={`Valor da carta ${j+1} do jogo ${i+1}`} value={c.rank} onChange={e=>updateCard(i,j,{rank:e.target.value})}>{validRanks.map(r=><option key={r} value={r}>{r==='?'?'Não identificado':r}</option>)}</select></label><label>Naipe<select aria-label={`Naipe da carta ${j+1} do jogo ${i+1}`} disabled={c.rank==='Joker'} value={c.rank==='Joker'?'':c.suit} onChange={e=>updateCard(i,j,{suit:e.target.value})}>{c.rank==='Joker'?<option value="">★</option>:suits.map(s=><option key={s} value={s}>{s==='?'?'?':s}</option>)}</select></label></div>{purpose==='table'&&<><label className="check"><input type="checkbox" disabled={!['2','Joker'].includes(c.rank)||c.rank==='Joker'} checked={c.wild} onChange={e=>updateCard(i,j,{wild:e.target.checked})}/> Coringa substituto</label><label>Mover para<select aria-label={`Mover carta ${j+1} do jogo ${i+1}`} value={i} onChange={e=>moveCard(i,j,Number(e.target.value))}>{groups.map((_,k)=><option key={k} value={k}>Jogo {k+1}</option>)}</select></label></>}<button onClick={()=>edit(groups.map((item,k)=>k===i?{...item,cards:item.cards.filter((_,n)=>n!==j)}:item))}>Remover carta</button></div>)}</div>
 <div className="actions"><button onClick={()=>edit(groups.map((item,j)=>i===j?{...item,cards:[...item.cards,{rank:'?',suit:'?',wild:false,confidence:'low'}]}:item))}>+ Carta que faltou</button></div>{results[i]?.error?<p role="alert" className="warning">{results[i].error}</p>:<p className="review-score">{results[i]?.label} · <b>{results[i]?.total} pontos</b></p>}</section>)}
 {purpose==='table'&&<button onClick={()=>edit([...groups,{kind:'sequence',cards:[]}])}>+ Adicionar jogo</button>}<div className="photo-confirm"><p><b>{valid?`${results.reduce((n,r)=>n+r.total,0)} pontos ${purpose==='hand'?'a descontar':'em jogos'}`:purpose==='hand'?'Corrija as cartas antes de confirmar':'Corrija os jogos antes de confirmar'}</b></p>{purpose==='table'&&<><label>Como lançar esta foto?<select value={replace?'replace':'append'} onChange={e=>{setReplace(e.target.value==='replace');setReviewed(false);}}><option value="replace">Substituir os jogos de {names[target]} na rodada</option><option value="append">Adicionar aos jogos já lançados (foto de outra área)</option></select></label><small>Uma nova foto da mesma mesa deve substituir os jogos para não contar cartas duas vezes. Mão, morto e batida não são alterados.</small></>}{purpose==='hand'&&<small>O valor revisado substitui o desconto da mão deste participante. Fotografar novamente não acumula o desconto. Jogos da mesa, morto e batida não são alterados.</small>}<label className="check"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/> Conferi {purpose==='hand'?'as cartas restantes':'as cartas e os jogos'} de {names[target]||`${participantLabel} ${target+1}`}.</label><button className="primary" disabled={!valid||!reviewed||busy} onClick={()=>{if(groups&&onConfirm(target,groups,replace))discard();}}>{purpose==='hand'?'Aplicar desconto para ':'Confirmar jogos para '}{names[target]||`${participantLabel} ${target+1}`}</button></div></div>}
 {pending&&<button className="text-button" onClick={()=>{if(groups?.length&&!confirm('Descartar esta revisão da foto? Os jogos ainda não confirmados serão perdidos.'))return;discard();}}>Cancelar foto e revisão</button>}
 </section>;
}
