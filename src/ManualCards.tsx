import {useEffect,useRef,useState,type PointerEvent} from 'react';
import type {Card} from './rules';

export default function ManualCards({cards,effectiveCards,onChange}:{cards:Card[];effectiveCards?:Card[];onChange:(cards:Card[])=>void}){
 const tray=useRef<HTMLDivElement>(null),current=useRef(cards);
 current.current=cards;
 const ids=useRef(new WeakMap<Card,number>()),nextId=useRef(0);
 const drag=useRef<{card:Card;pointer:number;x:number;y:number;active:boolean;timer:ReturnType<typeof setTimeout>}|null>(null);
 const [moving,setMoving]=useState<Card|null>(null),[announcement,setAnnouncement]=useState('');
 useEffect(()=>()=>{if(drag.current)clearTimeout(drag.current.timer);},[]);
 function move(card:Card,to:number){
  const list=current.current,from=list.indexOf(card);
  if(from<0||from===to||to<0||to>=list.length)return;
  const next=[...list];next.splice(from,1);next.splice(to,0,card);current.current=next;onChange(next);
  setAnnouncement(`${card.rank}${card.suit} na posição ${to+1} de ${next.length}.`);
 }
 function start(e:PointerEvent<HTMLButtonElement>,card:Card){
  if(e.button!==0||drag.current)return;
  e.currentTarget.setPointerCapture(e.pointerId);
  const timer=setTimeout(()=>{if(drag.current){drag.current.active=true;setMoving(card);}},200);
  drag.current={card,pointer:e.pointerId,x:e.clientX,y:e.clientY,active:false,timer};
 }
 function point(e:PointerEvent<HTMLButtonElement>){
  const held=drag.current;if(!held||held.pointer!==e.pointerId)return;
  if(!held.active&&Math.hypot(e.clientX-held.x,e.clientY-held.y)>7){held.active=true;clearTimeout(held.timer);setMoving(held.card);}
  if(!held.active)return;
  const positions=Array.from(tray.current?.querySelectorAll<HTMLElement>('[data-tray-index]')||[]);
  let best=-1,distance=Infinity;
  positions.forEach(element=>{
   const r=element.getBoundingClientRect(),dx=Math.max(r.left-e.clientX,0,e.clientX-r.right),dy=Math.max(r.top-e.clientY,0,e.clientY-r.bottom);
   const d=dx*dx+dy*dy;if(d<distance){distance=d;best=Number(element.dataset.trayIndex);}
  });
  if(best>=0)move(held.card,best);
 }
 function end(e:PointerEvent<HTMLButtonElement>){
  if(!drag.current||drag.current.pointer!==e.pointerId)return;
  clearTimeout(drag.current.timer);drag.current=null;setMoving(null);
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 }
 return <><div className="tray manual-tray" ref={tray} aria-label="Cartas do jogo em edição">
  {!cards.length?<p>Toque nas cartas acima para começar.</p>:cards.map((card,i)=>{
   const shown=effectiveCards?.[i]||card;
   if(!ids.current.has(card))ids.current.set(card,++nextId.current);
   return <div key={ids.current.get(card)} data-tray-index={i} className={'tray-card'+(moving===card?' dragging':'')}>
    <button type="button" className="drag-card" aria-label={`Mover ${card.rank} ${card.suit}${shown.wild?' coringa':''}, posição ${i+1}`} aria-describedby="manual-drag-help" onPointerDown={e=>start(e,card)} onPointerMove={point} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={()=>{if(drag.current){clearTimeout(drag.current.timer);drag.current=null;setMoving(null);}}} onKeyDown={e=>{
     const to=e.key==='ArrowLeft'?i-1:e.key==='ArrowRight'?i+1:e.key==='Home'?0:e.key==='End'?cards.length-1:null;
     if(to!==null){e.preventDefault();move(card,to);}
    }}>{card.rank}{card.suit}{shown.wild?'*':''}<span aria-hidden="true">⠿</span></button>
    <button type="button" className="remove-tray-card" disabled={moving!==null} aria-label={`Remover ${card.rank} ${card.suit}${shown.wild?' coringa':''}, posição ${i+1}`} onClick={()=>onChange(cards.filter((_,j)=>j!==i))}>×</button>
   </div>;
  })}
 </div><small id="manual-drag-help">Segure e arraste uma carta para mudar sua posição. Use × para remover. No teclado, use as setas ← e →. * indica coringa.</small><span className="sr-only" role="status">{announcement}</span></>;
}
