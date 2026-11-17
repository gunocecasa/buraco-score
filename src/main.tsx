import React, {useState,useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {ranks,defaults,score,handPoints,type Card,type Rules} from './rules';
import './style.css';
import './participants.css';
import './hand-photo.css';
import PhotoReview from './PhotoReview';
import ManualCards from './ManualCards';
import {restoreSaved,defaultNames,defaultName,participantLabel,addParticipant,removeParticipant,type Mode,type Saved} from './participants';
type Game={cards:Card[];kind:'sequence'|'lavadeira'};
function load():Saved {try{return restoreSaved(JSON.parse(localStorage.getItem('buraco-score-v1')||'null'));}catch{return restoreSaved(null);}}
const initial=load();
const blank=()=>({games:[] as Game[],hand:0,dead:false,out:false});
function App(){
 const [mode,setMode]=useState<Mode>(initial.mode);
 const [names,setNames]=useState(initial.names),[rules,setRules]=useState(initial.rules),[history,setHistory]=useState(initial.history);
 const [teams,setTeams]=useState(initial.names.map(()=>blank())),[team,setTeam]=useState(0),[cards,setCards]=useState<Card[]>([]),[kind,setKind]=useState<Game['kind']>('sequence');
 const [suit,setSuit]=useState('♠'),[wild,setWild]=useState(true),[message,setMessage]=useState(''),[settings,setSettings]=useState(false),[storageError,setStorageError]=useState(false);
 const [tablePending,setTablePending]=useState(false),[handTarget,setHandTarget]=useState<number|null>(null),[handReviewPending,setHandReviewPending]=useState(false);
 const handDialog=useRef<HTMLDialogElement>(null);
 const photoPending=tablePending||handTarget!==null;
 useEffect(()=>{if(handTarget!==null)handDialog.current?.showModal();else handDialog.current?.close();},[handTarget]);
 function closeHand(){if(handReviewPending&&!confirm('Descartar a revisão da mão sem aplicar o desconto?'))return;setHandTarget(null);setHandReviewPending(false);}

 useEffect(()=>{try{localStorage.setItem('buraco-score-v1',JSON.stringify({mode,names,rules,history}));setStorageError(false);}catch{setStorageError(true);}},[mode,names,rules,history]);
 const calculate=(i:number)=>teams[i].games.reduce((s,g)=>s+score(g.cards,g.kind,rules).total,0)+(teams[i].out?rules.out:0)-(teams[i].dead?rules.dead:0)-teams[i].hand;
 const update=(i:number,patch:Partial<ReturnType<typeof blank>>)=>setTeams(ts=>ts.map((t,j)=>j===i?{...t,...patch}:t));
 let preview:ReturnType<typeof score>|undefined;let error='';if(cards.length){try{preview=score(cards,kind,rules);}catch(e){error=(e as Error).message;}}
 const saveGame=()=>{if(!preview)return;update(team,{games:[...teams[team].games,{cards:[...cards],kind}]});setCards([]);setMessage('Jogo adicionado.');};
 function closeRound(){if(photoPending){setMessage('Confirme ou cancele a revisão da foto antes de fechar a rodada.');return;}if(cards.length){setMessage('Adicione o jogo em edição ou limpe as cartas antes de fechar.');return;}if(!teams.some(t=>t.games.length||t.hand||t.dead||t.out)){setMessage('Lance os pontos da rodada primeiro.');return;}setHistory(h=>[...h,{id:crypto.randomUUID(),names:[...names],totals:teams.map((_,i)=>calculate(i))}]);setTeams(names.map(()=>blank()));setMessage('Rodada salva no histórico.');}

 const label=participantLabel(mode);
 const displayNames=names.map((n,i)=>n.trim()||defaultName(mode,i));
 function changeMode(next:Mode){
  if(next===mode)return;
  if(photoPending){setMessage('Confirme ou cancele a foto antes de mudar o modo.');return;}
  const hasProgress=history.length||cards.length||teams.some(t=>t.games.length||t.hand||t.dead||t.out);
  if(hasProgress&&!confirm('Mudar o modo inicia uma nova partida e apaga os pontos atuais. Continuar?'))return;
  setMode(next);setNames(defaultNames(next,names.length));setTeams(names.map(()=>blank()));setTeam(0);setCards([]);setHistory([]);setMessage('Modo de jogo atualizado.');
 }
 function add(){
  if(photoPending)return;
  const next=addParticipant(names,history,mode);setNames(next.names);setHistory(next.history);setTeams(ts=>[...ts,blank()]);setMessage(defaultName(mode,names.length)+' adicionado.');
 }
 function remove(index:number){
  if(photoPending||names.length<=2)return;
  const t=teams[index];const hasPoints=history.length||t.games.length||t.hand||t.dead||t.out;
  if(hasPoints&&!confirm('Remover '+displayNames[index]+' e seus pontos desta partida? Os demais participantes mantêm seus pontos.'))return;
  if(team===index&&cards.length&&!confirm('Descartar o jogo manual em edição deste participante?'))return;
  const next=removeParticipant(names,history,mode,index);setNames(next.names);setHistory(next.history);setTeams(ts=>ts.filter((_,i)=>i!==index));
  if(team===index){setCards([]);setTeam(0);}else if(team>index)setTeam(team-1);
  setMessage('Participante removido.');
 }
 const labels:Record<keyof Rules,string>={ace:'Ás',two:'2 natural ou coringa',low:'3 a 7',high:'8 a K',joker:'Joker',clean:'Canastra limpa',dirty:'Canastra suja',real:'Canastra real',out:'Batida',dead:'Morto não pego (desconto)'};
 return <main><header><a className="brand" href="#"><span>♠</span> BURACO <b>SCORE</b></a><button onClick={()=>setSettings(!settings)}>⚙ Regras e valores</button></header>
 <section className="intro"><div className="eyebrow">MENOS CONTAS, MAIS JOGO</div><h1>Cada carta conta.</h1><p>Monte os jogos, confira os pontos e acompanhe a partida.</p></section>
 {storageError&&<p role="alert">Não foi possível salvar neste navegador. Mantenha esta página aberta e anote o placar antes de sair.</p>}
 {settings&&<section className="panel"><h2>Regras da mesa</h2><p>Confirmado no histórico: limpa 200, suja 100, real 500; A = 15 e Joker = 20. Os demais valores são padrões ajustáveis. Alterações valem para a rodada aberta; rodadas salvas mantêm seu total.</p><div className="settings">{(Object.keys(rules) as (keyof Rules)[]).map(k=><label key={k}>{labels[k]}<input type="number" min="0" max="10000" value={rules[k]} onChange={e=>setRules({...rules,[k]:Math.min(10000,Math.max(0,Number(e.target.value)||0))})}/></label>)}</div><p>Lavadeira: ases, mínimo 3 cartas; com 7+ recebe limpa ou suja, nunca real. Real: A–K, 13 cartas naturais do mesmo naipe. 2 e Joker entram como coringas por padrão. Para usar o 2 natural, desmarque a opção antes de adicioná-lo. Sem restrição automática de quantidade de baralhos ou de coringas por jogo: combine essas regras com a mesa.</p></section>}
 <section className="panel participants" aria-label="Participantes da partida"><div><div className="eyebrow">SUA MESA, SEU JEITO</div><h2>Participantes da partida</h2></div><div className="participant-controls"><label>Modo de jogo<select aria-label="Modo de jogo" value={mode} disabled={photoPending} onChange={e=>changeMode(e.target.value as Mode)}><option value="teams">Duplas</option><option value="individual">Cada um por si (contra todos)</option></select></label><button className="primary" disabled={photoPending} onClick={add}>+ Adicionar {label.toLowerCase()}</button></div><p>{names.length} {mode==='teams'?'duplas':'jogadores'} · Você pode editar os nomes no placar.</p>{photoPending&&<small>Confirme ou cancele a foto para alterar os participantes.</small>}</section>
 <p className="participant-status" role="status">{message}</p>
 <div className="scoreboard">{names.map((name,i)=><section className={'score '+(team===i?'active':'')} key={i}><div className="eyebrow">{label.toUpperCase()} {i+1}</div><input aria-label={'Nome do participante '+(i+1)} value={name} placeholder={defaultName(mode,i)} maxLength={30} onChange={e=>setNames(names.map((n,j)=>i===j?e.target.value:n))}/><strong>{history.reduce((s,h)=>s+(h.totals[i]??0),0).toLocaleString('pt-BR')}</strong><small>pontos na partida</small><button onClick={()=>{setTeam(i);setMessage('');}}>Lançar para {displayNames[i]}</button><button className="remove-participant" aria-label={'Remover '+displayNames[i]} disabled={names.length<=2||photoPending} onClick={()=>remove(i)}>Remover</button></section>)}</div>
 <PhotoReview key={mode+names.length} names={displayNames} participantLabel={label} rules={rules} onPending={setTablePending} onConfirm={(target,detected,replace)=>{
  if(replace&&teams[target].games.length&&!confirm(`Substituir os ${teams[target].games.length} jogos de ${names[target]} nesta rodada pelos jogos revisados da foto?`))return false;
  const games=detected.map(g=>({kind:g.kind,cards:g.cards.map(({rank,suit,wild})=>({rank,suit,wild}))}));
  update(target,{games:replace?games:[...teams[target].games,...games]});setMessage(`Jogos revisados lançados para ${names[target]}.`);return true;
 }}/>
 <dialog ref={handDialog} className="hand-photo-dialog" aria-label="Foto das cartas restantes na mão" onCancel={e=>{e.preventDefault();closeHand();}}><button className="close-hand" onClick={closeHand}>Fechar revisão da mão</button>{handTarget!==null&&<PhotoReview key={'hand-'+handTarget} purpose="hand" initialTarget={handTarget} names={displayNames} participantLabel={label} rules={rules} onPending={setHandReviewPending} onConfirm={(target,detected)=>{
  const points=handPoints(detected.flatMap(g=>g.cards),rules);update(target,{hand:points});setMessage('Desconto de '+points+' pontos aplicado a '+displayNames[target]+'.');setHandTarget(null);setHandReviewPending(false);return true;
 }}/>}</dialog>
 <div className="layout"><section className="panel builder"><div className="eyebrow">RODADA {history.length+1} · {names[team]}</div><h2>Lançamento manual</h2><div className="tabs"><button className={kind==='sequence'?'selected':''} onClick={()=>setKind('sequence')}>Sequência</button><button className={kind==='lavadeira'?'selected':''} onClick={()=>setKind('lavadeira')}>Lavadeira de ases</button></div><div className="options"><label className="suit-picker">Naipe <select aria-label="Naipe das cartas" value={suit} onChange={e=>setSuit(e.target.value)}>{['♠','♥','♣','♦'].map(s=><option key={s}>{s}</option>)}</select></label><label><input type="checkbox" checked={wild} onChange={e=>setWild(e.target.checked)}/> Usar 2 como coringa (Joker sempre é coringa)</label></div><div className="deck">{[...ranks,'Joker'].map(rank=><button key={rank} className={'card '+(['♥','♦'].includes(suit)?'red':'')} onClick={()=>{setCards([...cards,{rank,suit:rank==='Joker'?'':suit,wild:rank==='Joker'||(rank==='2'&&wild)}]);setMessage('');}}>{rank}<span>{rank==='Joker'?'★':suit}</span></button>)}</div><ManualCards cards={cards} onChange={setCards}/>
 {preview&&<div className="result"><div><b>{preview.label}</b><small>{preview.points} em cartas + {preview.bonus} de bônus</small></div><strong>{preview.total}</strong></div>}{error&&<p role="alert" className="warning">{error}</p>}
 <div className="actions"><button className="primary" disabled={!preview} onClick={saveGame}>Adicionar jogo</button><button onClick={()=>setCards([])}>Limpar cartas</button></div><p role="status">{message}</p></section>
 <section className="panel"><div className="eyebrow">CONFERÊNCIA DA MESA</div><h2>Rodada em andamento</h2>{teams.map((t,i)=><div className="round-team" key={i}><h3>{displayNames[i]} <span>{calculate(i)} pts</span></h3>{!t.games.length&&<p>Nenhum jogo lançado.</p>}{t.games.map((g,j)=>{const result=score(g.cards,g.kind,rules);return <div className="game" key={j}><div><b>{result.label} · {result.total}</b><small>{g.cards.map(c=>`${c.rank}${c.suit}${c.wild?'*':''}`).join(' ')}</small></div><button aria-label={`Excluir jogo ${j+1} de ${names[i]}`} onClick={()=>update(i,{games:t.games.filter((_,n)=>n!==j)})}>×</button></div>;})}<label className="hand">Pontos restantes na mão <input type="number" min="0" max="100000" step="5" value={t.hand} onChange={e=>update(i,{hand:Math.min(100000,Math.max(0,Number(e.target.value)||0))})}/></label><button className="hand-camera" disabled={photoPending} onClick={()=>{setHandReviewPending(false);setHandTarget(i);}}>📷 Fotografar mão de {displayNames[i]}</button><label className="check"><input type="checkbox" checked={t.dead} onChange={e=>update(i,{dead:e.target.checked})}/> Não pegou o morto (−{rules.dead})</label><label className="check"><input type="checkbox" checked={t.out} onChange={e=>{setTeams(ts=>ts.map((item,j)=>({...item,out:j===i?e.target.checked:false})));}}/> Bateu (+{rules.out})</label></div>)}<button className="primary wide" onClick={closeRound}>Fechar e salvar rodada</button></section></div>
 <section className="panel history"><div className="eyebrow">PLACAR DA PARTIDA</div><h2>Histórico de rodadas</h2>{history.length?<><div className="history-scroll"><table><thead><tr><th>Rodada</th>{displayNames.map((n,i)=><th key={i}>{n}</th>)}</tr></thead><tbody>{history.map((h,i)=><tr key={h.id}><td>{i+1}</td>{names.map((_,j)=><td key={j}>{h.totals[j]??0}</td>)}</tr>)}</tbody></table></div><button onClick={()=>{if(confirm('Reabrir a última rodada? Os lançamentos originais não serão recuperados; anote os totais antes de confirmar.'))setHistory(history.slice(0,-1));}}>Remover última rodada</button></>:<p>As rodadas concluídas aparecerão aqui.</p>}<button className="danger" onClick={()=>{if(photoPending){setMessage('Cancele ou confirme a foto antes de iniciar outra partida.');return;}if(confirm('Apagar o placar e todos os lançamentos da partida?')){setHistory([]);setTeams(names.map(()=>blank()));setCards([]);setMessage('Nova partida iniciada.');}}}>Nova partida</button></section>
 <footer>Buraco Score · Foto com revisão + lançamento manual.<br/>Leitura no aparelho disponível em modo experimental. Gemini opcional depende de configuração no servidor. Placar e regras salvos neste navegador; fotos, revisão e jogos da rodada aberta não são salvos ao recarregar.</footer></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
