import React, {useState,useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {ranks,defaults,score,handPoints,type Card,type Rules} from './rules';
import './style.css';
import './participants.css';
import './hand-photo.css';
import PhotoReview from './PhotoReview';
import ManualCards from './ManualCards';
import Victory from './Victory';
import {matchOutcome,validTarget} from './match';
import './victory.css';
import {restoreSaved,defaultNames,defaultName,participantLabel,addParticipant,removeParticipant,type Mode,type Saved} from './participants';
type Game={cards:Card[];kind:'sequence'|'lavadeira'};
function load():Saved {try{return restoreSaved(JSON.parse(localStorage.getItem('buraco-score-v1')||'null'));}catch{return restoreSaved(null);}}
const initial=load();
const blank=()=>({games:[] as Game[],hand:0,dead:false,out:false});
function App(){
 const [mode,setMode]=useState<Mode>(initial.mode);
 const [entryMode,setEntryMode]=useState<'photo'|'manual'>('photo');
 const [target,setTarget]=useState(initial.target),[targetDraft,setTargetDraft]=useState(String(initial.target)),[celebrate,setCelebrate]=useState(false);
 const [names,setNames]=useState(initial.names),[rules,setRules]=useState(initial.rules),[history,setHistory]=useState(initial.history);
 const [teams,setTeams]=useState(initial.names.map(()=>blank())),[team,setTeam]=useState(0),[cards,setCards]=useState<Card[]>([]),[kind,setKind]=useState<Game['kind']>('sequence');
 const [suit,setSuit]=useState('♠'),[wild,setWild]=useState(true),[message,setMessage]=useState(''),[settings,setSettings]=useState(false),[storageError,setStorageError]=useState(false);
 const [tablePending,setTablePending]=useState(false),[handTarget,setHandTarget]=useState<number|null>(null),[handReviewPending,setHandReviewPending]=useState(false);
 const handDialog=useRef<HTMLDialogElement>(null);
 const lastCardTap=useRef({key:'',at:-Infinity});
 const photoPending=tablePending||handTarget!==null;
 useEffect(()=>{if(handTarget!==null)handDialog.current?.showModal();else handDialog.current?.close();},[handTarget]);
 function closeHand(){if(handReviewPending&&!confirm('Descartar a revisão da mão sem aplicar o desconto?'))return;setHandTarget(null);setHandReviewPending(false);}

 useEffect(()=>{try{localStorage.setItem('buraco-score-v1',JSON.stringify({mode,names,rules,history,target}));setStorageError(false);}catch{setStorageError(true);}},[mode,names,rules,history,target]);
 const calculate=(i:number)=>teams[i].games.reduce((s,g)=>s+score(g.cards,g.kind,rules).total,0)+(teams[i].out?rules.out:0)-(teams[i].dead?rules.dead:0)-teams[i].hand;
 const update=(i:number,patch:Partial<ReturnType<typeof blank>>)=>setTeams(ts=>ts.map((t,j)=>j===i?{...t,...patch}:t));
 let preview:ReturnType<typeof score>|undefined;let error='';if(cards.length){try{preview=score(cards,kind,rules);}catch(e){error=(e as Error).message;}}
 const saveGame=()=>{if(!preview||finished)return;update(team,{games:[...teams[team].games,{cards:[...cards],kind}]});setCards([]);setMessage('Jogo adicionado.');};
 function addManualCard(rank:string,cardSuit=suit){if(finished)return;const card={rank,suit:rank==='Joker'?'':cardSuit,wild:rank==='Joker'||(rank==='2'&&(kind==='lavadeira'||wild))};const key=[card.rank,card.suit,card.wild].join(':');const now=performance.now();if(lastCardTap.current.key===key&&now-lastCardTap.current.at<350)return;lastCardTap.current={key,at:now};setCards(current=>[...current,card]);setMessage('');}
 function closeRound(){if(finished)return;if(photoPending){setMessage('Confirme ou cancele a revisão da foto antes de fechar a rodada.');return;}if(cards.length){setMessage('Adicione o jogo em edição ou limpe as cartas antes de fechar.');return;}if(!teams.some(t=>t.games.length||t.hand||t.dead||t.out)){setMessage('Lance os pontos da rodada primeiro.');return;}const next=[...history,{id:crypto.randomUUID(),names:[...names],totals:teams.map((_,i)=>calculate(i))}];setHistory(next);setTeams(names.map(()=>blank()));const result=matchOutcome(next,target);setCelebrate(Boolean(result));setMessage(result?'Partida concluída. Vitória de '+displayNames[result.winner]+'!':'Rodada salva no histórico.');}

 const label=participantLabel(mode);
 const displayNames=names.map((n,i)=>n.trim()||defaultName(mode,i));
 const outcome=matchOutcome(history,target),finished=Boolean(outcome);
 const palette=kind==='lavadeira'?[...['A','2'].flatMap(rank=>['♠','♥','♣','♦'].map(cardSuit=>({rank,suit:cardSuit}))),{rank:'Joker',suit:''}]:[...ranks,'Joker'].map(rank=>({rank,suit:rank==='Joker'?'':suit}));
 function selectParticipant(index:number){if(finished)return false;if(index===team)return true;if(photoPending){setMessage('Confirme ou cancele a foto antes de trocar de participante.');return false;}if(cards.length){setMessage('Adicione o jogo em edição ou limpe as cartas antes de trocar de participante.');return false;}setTeam(index);setMessage(displayNames[index]+' selecionado para lançamento.');return true;}
 const totals=names.map((_,i)=>history.reduce((sum,h)=>sum+(h.totals[i]??0),0));
 function saveTarget(){if(history.length)return;const next=Number(targetDraft);if(!validTarget(next)){setMessage('Informe uma meta inteira entre 1 e 1.000.000 de pontos.');return;}setTarget(next);setTargetDraft(String(next));setMessage('Meta definida: '+next.toLocaleString('pt-BR')+' pontos.');}
 function newMatch(){if(photoPending){setMessage('Cancele ou confirme a foto antes de iniciar outra partida.');return;}if(confirm('Iniciar nova partida e apagar o placar e os lançamentos atuais?')){setCelebrate(false);setHistory([]);setTeams(names.map(()=>blank()));setCards([]);setTargetDraft(String(target));setMessage('Nova partida iniciada.');}}

 function changeMode(next:Mode){
  if(next===mode||finished)return;
  if(photoPending){setMessage('Confirme ou cancele a foto antes de mudar o modo.');return;}
  const hasProgress=history.length||cards.length||teams.some(t=>t.games.length||t.hand||t.dead||t.out);
  if(hasProgress&&!confirm('Mudar o modo inicia uma nova partida e apaga os pontos atuais. Continuar?'))return;
  setMode(next);setNames(defaultNames(next,names.length));setTeams(names.map(()=>blank()));setTeam(0);setCards([]);setHistory([]);setMessage('Modo de jogo atualizado.');
 }
 function add(){
  if(photoPending||finished)return;
  const next=addParticipant(names,history,mode);setNames(next.names);setHistory(next.history);setTeams(ts=>[...ts,blank()]);setMessage(defaultName(mode,names.length)+' adicionado.');
 }
 function remove(index:number){
  if(photoPending||finished||names.length<=2)return;
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
 <section className="panel participants" aria-label="Participantes da partida"><div><div className="eyebrow">SUA MESA, SEU JEITO</div><h2>Participantes da partida</h2></div><div className="participant-controls"><label>Modo de jogo<select aria-label="Modo de jogo" value={mode} disabled={photoPending||finished} onChange={e=>changeMode(e.target.value as Mode)}><option value="teams">Duplas</option><option value="individual">Cada um por si (contra todos)</option></select></label><button className="primary" disabled={photoPending||finished} onClick={add}>+ Adicionar {label.toLowerCase()}</button></div><p>{names.length} {mode==='teams'?'duplas':'jogadores'} · Você pode editar os nomes no placar.</p>{photoPending&&<small>Confirme ou cancele a foto para alterar os participantes.</small>}</section>
 <section className="match-target" aria-label="Meta da partida"><div><div className="eyebrow">VALE O TROFÉU</div><h2>Meta: {target.toLocaleString('pt-BR')} pontos</h2><small>Ao fechar a rodada, vence quem atingir a meta com o maior total. Empate na liderança: a partida continua.</small></div><div className="target-controls"><label>Meta para vencer<input aria-label="Meta para vencer" type="number" min="1" max="1000000" step="1" inputMode="numeric" disabled={history.length>0} value={targetDraft} onChange={e=>setTargetDraft(e.target.value)}/></label><button disabled={history.length>0} onClick={saveTarget}>Definir meta</button></div>{history.length>0&&<small>Meta fixada nesta partida. Inicie outra partida para alterá-la.</small>}</section>
 {outcome&&<section className="match-finished" aria-label="Resultado da partida"><div><span aria-hidden="true">🏆</span><div><div className="eyebrow">PARTIDA CONCLUÍDA</div><h2>{displayNames[outcome.winner]} venceu!</h2><p>{outcome.points.toLocaleString('pt-BR')} pontos · meta de {target.toLocaleString('pt-BR')}</p></div></div><div className="actions"><button className="primary" onClick={()=>setCelebrate(true)}>Rever comemoração</button><button onClick={newMatch}>Nova partida</button></div></section>}
 {celebrate&&outcome&&<Victory name={displayNames[outcome.winner]} points={outcome.points} target={target} round={outcome.round} onClose={()=>setCelebrate(false)}/>}
 <p className="participant-status" role="status">{message}</p>
 <div className="scoreboard">{names.map((name,i)=><section className={'score '+(team===i?'active':'')} key={i}><button className="score-select" aria-label={'Selecionar '+displayNames[i]+' para lançamento'} aria-pressed={team===i} disabled={finished||photoPending} onClick={()=>selectParticipant(i)}><span className="sr-only">Selecionar {displayNames[i]}</span></button><div className="eyebrow">{label.toUpperCase()} {i+1}</div><input aria-label={'Nome do participante '+(i+1)} value={name} placeholder={defaultName(mode,i)} maxLength={30} onChange={e=>setNames(names.map((n,j)=>i===j?e.target.value:n))}/><strong>{totals[i].toLocaleString('pt-BR')}</strong><small>pontos na partida</small><progress className="goal-progress" value={Math.max(0,Math.min(target,totals[i]))} max={target} aria-label={'Progresso de '+displayNames[i]+' até '+target+' pontos'}/><small className="goal-remaining">{totals[i]>=target?'Meta alcançada':Math.max(0,target-totals[i]).toLocaleString('pt-BR')+' para a meta'}</small><small className="score-selection">{team===i?'✓ Selecionado':'Toque para selecionar'}</small><button className="remove-participant" aria-label={'Remover '+displayNames[i]} disabled={names.length<=2||photoPending||finished} onClick={()=>remove(i)}>Remover</button></section>)}</div>
 <fieldset disabled={finished} className="match-editors"><div className="entry-tabs" role="tablist" aria-label="Forma de lançamento">{(['photo','manual'] as const).map(value=><button key={value} id={'entry-tab-'+value} role="tab" aria-selected={entryMode===value} aria-controls={'entry-'+value} tabIndex={entryMode===value?0:-1} onClick={()=>setEntryMode(value)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'photo':e.key==='End'?'manual':value==='photo'?'manual':'photo';setEntryMode(next);document.getElementById('entry-tab-'+next)?.focus();}}}>{value==='photo'?'📷 Por foto':'✋ Manual'}{value==='photo'&&tablePending?' · revisão pendente':value==='manual'&&cards.length?' · '+cards.length+' cartas':''}</button>)}</div>
 <div id="entry-photo" role="tabpanel" aria-labelledby="entry-tab-photo" hidden={entryMode!=='photo'}>
 <PhotoReview key={mode+names.length} initialTarget={team} onTargetChange={selectParticipant} names={displayNames} participantLabel={label} rules={rules} onPending={setTablePending} onConfirm={(target,detected,replace)=>{
  if(replace&&teams[target].games.length&&!confirm(`Substituir os ${teams[target].games.length} jogos de ${names[target]} nesta rodada pelos jogos revisados da foto?`))return false;
  const games=detected.map(g=>({kind:g.kind,cards:g.cards.map(({rank,suit,wild})=>({rank,suit,wild}))}));
  update(target,{games:replace?games:[...teams[target].games,...games]});setMessage(`Jogos revisados lançados para ${names[target]}.`);return true;
 }}/></div>
 <dialog ref={handDialog} className="hand-photo-dialog" aria-label="Foto das cartas restantes na mão" onCancel={e=>{e.preventDefault();closeHand();}}><button className="close-hand" onClick={closeHand}>Fechar revisão da mão</button>{handTarget!==null&&<PhotoReview key={'hand-'+handTarget} purpose="hand" initialTarget={handTarget} names={displayNames} participantLabel={label} rules={rules} onPending={setHandReviewPending} onConfirm={(target,detected)=>{
  const points=handPoints(detected.flatMap(g=>g.cards),rules);update(target,{hand:points});setMessage('Desconto de '+points+' pontos aplicado a '+displayNames[target]+'.');setHandTarget(null);setHandReviewPending(false);return true;
 }}/>}</dialog>
 <div className={'layout '+(entryMode==='photo'?'photo-layout':'')}><section id="entry-manual" role="tabpanel" aria-labelledby="entry-tab-manual" hidden={entryMode!=='manual'} className="panel builder"><div className="eyebrow">RODADA {history.length+1} · {names[team]}</div><h2>Lançamento manual</h2><div className="tabs"><button className={kind==='sequence'?'selected':''} onClick={()=>setKind('sequence')}>Sequência</button><button className={kind==='lavadeira'?'selected':''} onClick={()=>setKind('lavadeira')}>Lavadeira de ases</button></div>{kind==='sequence'&&<div className="options"><label className="suit-picker">Naipe <select aria-label="Naipe das cartas" value={suit} onChange={e=>setSuit(e.target.value)}>{['♠','♥','♣','♦'].map(s=><option key={s}>{s}</option>)}</select></label><label><input type="checkbox" checked={wild} onChange={e=>setWild(e.target.checked)}/> Usar 2 como coringa (Joker sempre é coringa)</label></div>}{kind==='lavadeira'&&<p className="lavadeira-help">Escolha os ases de qualquer naipe. Os 2 e o Joker entram como coringas.</p>}<div className="deck">{palette.map(({rank,suit:cardSuit})=><button key={rank+cardSuit} className={'card '+(['♥','♦'].includes(cardSuit)?'red':'')} onClick={()=>addManualCard(rank,cardSuit)}>{rank}<span>{rank==='Joker'?'★':cardSuit}</span></button>)}</div><small className="tap-help">Toques duplos muito rápidos na mesma carta contam uma vez.</small><ManualCards cards={cards} onChange={setCards}/>
 {preview&&<div className="result"><div><b>{preview.label}</b><small>{preview.points} em cartas + {preview.bonus} de bônus</small></div><strong>{preview.total}</strong></div>}{error&&<p role="alert" className="warning">{error}</p>}
 <div className="actions"><button className="primary" disabled={!preview} onClick={saveGame}>Adicionar jogo</button><button onClick={()=>setCards([])}>Limpar cartas</button></div><p role="status">{message}</p></section>
 <section className="panel"><div className="eyebrow">CONFERÊNCIA DA MESA</div><h2>Rodada em andamento</h2>{teams.map((t,i)=><div className="round-team" key={i}><h3>{displayNames[i]} <span>{calculate(i)} pts</span></h3>{!t.games.length&&<p>Nenhum jogo lançado.</p>}{t.games.map((g,j)=>{const result=score(g.cards,g.kind,rules);return <div className="game" key={j}><div><b>{result.label} · {result.total}</b><small>{g.cards.map(c=>`${c.rank}${c.suit}${c.wild?'*':''}`).join(' ')}</small></div><button aria-label={`Excluir jogo ${j+1} de ${names[i]}`} onClick={()=>update(i,{games:t.games.filter((_,n)=>n!==j)})}>×</button></div>;})}<label className="hand">Pontos restantes na mão <input type="number" min="0" max="100000" step="5" value={t.hand} onChange={e=>update(i,{hand:Math.min(100000,Math.max(0,Number(e.target.value)||0))})}/></label><button className="hand-camera" disabled={photoPending||finished} onClick={()=>{setHandReviewPending(false);setHandTarget(i);}}>📷 Fotografar mão de {displayNames[i]}</button><label className="check"><input type="checkbox" checked={t.dead} onChange={e=>update(i,{dead:e.target.checked})}/> Não pegou o morto (−{rules.dead})</label><label className="check"><input type="checkbox" checked={t.out} onChange={e=>{setTeams(ts=>ts.map((item,j)=>({...item,out:j===i?e.target.checked:false})));}}/> Bateu (+{rules.out})</label></div>)}<button className="primary wide" onClick={closeRound}>Fechar e salvar rodada</button></section></div>
 </fieldset><section className="panel history"><div className="eyebrow">PLACAR DA PARTIDA</div><h2>Histórico de rodadas</h2>{history.length?<><div className="history-scroll"><table><thead><tr><th>Rodada</th>{displayNames.map((n,i)=><th key={i}>{n}</th>)}</tr></thead><tbody>{history.map((h,i)=><tr key={h.id}><td>{i+1}</td>{names.map((_,j)=><td key={j}>{h.totals[j]??0}</td>)}</tr>)}</tbody></table></div><button onClick={()=>{if(confirm('Reabrir a última rodada? Os lançamentos originais não serão recuperados; anote os totais antes de confirmar.'))setHistory(history.slice(0,-1));}}>Remover última rodada</button></>:<p>As rodadas concluídas aparecerão aqui.</p>}<button className="danger" onClick={newMatch}>Nova partida</button></section>
 <footer>Buraco Score · Foto com revisão + lançamento manual.<br/>Leitura no aparelho disponível em modo experimental. Gemini opcional depende de configuração no servidor. Placar e regras salvos neste navegador; fotos, revisão e jogos da rodada aberta não são salvos ao recarregar.</footer></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
