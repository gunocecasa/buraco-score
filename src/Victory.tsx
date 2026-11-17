import {useEffect,useRef,type CSSProperties} from 'react';

export default function Victory({name,points,target,round,onClose}:{name:string;points:number;target:number;round:number;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 return <dialog ref={dialog} className="victory-dialog" aria-labelledby="victory-title" aria-describedby="victory-description" onCancel={e=>{e.preventDefault();onClose();}}>
  <div className="victory-confetti" aria-hidden="true">{Array.from({length:64},(_,i)=><i key={i} style={{'--x':`${(i*47)%100}%`,'--delay':`${(i%13)*.11}s`,'--duration':`${3+(i%5)*.4}s`,'--spin':`${180+(i%7)*90}deg`,'--color':['#e8c779','#f8f0d9','#66cda0','#e78672','#87bff5'][i%5]} as CSSProperties}/>)}</div>
  <div className="victory-glow" aria-hidden="true"/>
  <button className="victory-close" onClick={onClose} aria-label="Fechar comemoração">×</button>
  <div className="victory-content"><div className="eyebrow">A MESA TEM UM CAMPEÃO</div>
   <div className="victory-trophy" aria-hidden="true"><svg viewBox="0 0 160 170" fill="none"><defs><linearGradient id="trophy-gold" x1="35" y1="20" x2="125" y2="140" gradientUnits="userSpaceOnUse"><stop stopColor="#fff6cc"/><stop offset=".45" stopColor="#e5b55b"/><stop offset="1" stopColor="#9b682b"/></linearGradient></defs><path d="M45 29H18V55c0 26 20 40 43 42M115 29h27V55c0 26-20 40-43 42" stroke="#e8bd68" strokeWidth="9"/><path d="M40 15h80v39c0 32-17 54-40 54S40 86 40 54V15Z" fill="url(#trophy-gold)"/><path d="M80 104v30m-25 14h50m-61 11h72" stroke="url(#trophy-gold)" strokeWidth="13" strokeLinecap="round"/><path d="m80 34 6 12 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2 6-12Z" fill="#fff8db"/></svg><span>✦</span></div>
   <p className="victory-kicker">Vitória!</p><h2 id="victory-title">{name}</h2>
   <p id="victory-description">Conquistou a partida com <strong>{points.toLocaleString('pt-BR')} pontos</strong>.</p>
   <div className="victory-stats"><span>Meta <b>{target.toLocaleString('pt-BR')}</b></span><span>Rodadas <b>{round}</b></span></div>
   <p className="victory-tagline">Boas cartas. Grandes jogadas.</p>
   <button autoFocus className="primary victory-view" onClick={onClose}>Ver placar da vitória</button>
  </div>
 </dialog>;
}
