import {useEffect,useRef,useState} from 'react';
import {ranks,handPoints,cardValue,type Card,type Rules} from './rules';
import PhotoReview from './PhotoReview';

export default function HandEntry({target,names,participantLabel,rules,initialMethod,current,onApply,onPending}:{target:number;names:string[];participantLabel:'Dupla'|'Jogador';rules:Rules;initialMethod:'manual'|'photo';current:number;onApply:(points:number)=>void;onPending:(pending:boolean)=>void}){
 const [method,setMethod]=useState(initialMethod),[cards,setCards]=useState<Card[]>([]),[photoPending,setPhotoPending]=useState(false),[error,setError]=useState('');
 const lastTap=useRef({rank:'',at:-Infinity});
 useEffect(()=>{onPending(photoPending||cards.length>0);},[photoPending,cards.length,onPending]);
 const total=handPoints(cards,rules);
 function add(rank:string){
  const now=performance.now();if(lastTap.current.rank===rank&&now-lastTap.current.at<350)return;
  lastTap.current={rank,at:now};
  if(cards.length>=208){setError('Limite de 208 cartas. Confira as cartas selecionadas.');return;}
  setCards(list=>[...list,{rank,suit:'',wild:rank==='Joker'}]);setError('');
 }
 return <div className="hand-entry"><h2>Cartas restantes na mão · {names[target]}</h2>
  <div className="entry-tabs" role="tablist" aria-label="Como calcular a mão">{(['manual','photo'] as const).map(value=><button key={value} id={'hand-tab-'+value} role="tab" aria-selected={method===value} aria-controls={'hand-entry-'+value} tabIndex={method===value?0:-1} onClick={()=>setMethod(value)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'manual':e.key==='End'?'photo':value==='manual'?'photo':'manual';setMethod(next);document.getElementById('hand-tab-'+next)?.focus();}}}>{value==='manual'?'Selecionar cartas':'Por foto'}</button>)}</div>
  <section className="panel hand-manual" id="hand-entry-manual" role="tabpanel" aria-labelledby="hand-tab-manual" hidden={method!=='manual'}>
   <p>Toque em cada carta que sobrou. Não é necessário escolher naipe ou formar jogos: o desconto é a soma dos valores das cartas.</p>
   <small>Desconto atual: {current} pontos. O total escolhido substituirá esse valor.</small>
   <div className="deck hand-deck">{[...ranks,'Joker'].map(rank=><button key={rank} className="card" aria-label={'Adicionar '+rank+' à mão'} onClick={()=>add(rank)}>{rank}<span>{cardValue({rank,suit:'',wild:rank==='Joker'},rules)} pts</span></button>)}</div>
   <p className="hand-count">{cards.length} cartas selecionadas</p>
   <div className="hand-picked" aria-label="Cartas selecionadas da mão">{cards.map((card,i)=><button key={i} aria-label={`Remover ${card.rank} da mão, carta ${i+1}`} onClick={()=>{setCards(list=>list.filter((_,j)=>j!==i));setError('');}}>{card.rank}<span aria-hidden="true"> ×</span></button>)}</div>
   <button className="text-button" disabled={!cards.length} onClick={()=>{setCards([]);setError('');}}>Limpar cartas da mão</button>
   {error&&<p role="alert" className="warning">{error}</p>}
   {total>100000&&<p role="alert" className="warning">O desconto máximo é 100.000 pontos. Confira as cartas.</p>}
   <div className="hand-apply"><strong>{total.toLocaleString('pt-BR')} pontos a descontar</strong><button className="primary" disabled={total>100000} onClick={()=>{if(photoPending&&!confirm('Aplicar o total manual e descartar a revisão da foto da mão?'))return;onApply(total);}}>Aplicar desconto de {total.toLocaleString('pt-BR')} pontos</button></div>
  </section>
  <div id="hand-entry-photo" role="tabpanel" aria-labelledby="hand-tab-photo" hidden={method!=='photo'}><PhotoReview purpose="hand" initialTarget={target} names={names} participantLabel={participantLabel} rules={rules} onPending={setPhotoPending} onConfirm={(_,groups)=>{if(cards.length&&!confirm('Aplicar a foto e descartar as cartas selecionadas manualmente para a mão?'))return false;onApply(handPoints(groups.flatMap(g=>g.cards),rules));return true;}}/></div>
 </div>;
}
