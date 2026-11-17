export const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'] as const;
export type Card = {rank: string; suit: string; wild: boolean};
export type Rules = {ace:number; two:number; low:number; high:number; joker:number; clean:number; dirty:number; real:number; out:number; dead:number};
export const defaults: Rules = {ace:15,two:10,low:5,high:10,joker:20,clean:200,dirty:100,real:500,out:100,dead:100};
export function cardValue(card:Card,r:Rules):number {return card.rank==='Joker'?r.joker:card.rank==='A'?r.ace:card.rank==='2'?r.two:['3','4','5','6','7'].includes(card.rank)?r.low:r.high;}
export function handPoints(cards:Card[],r:Rules=defaults):number {
 if(cards.some(c=>c.rank!=='Joker'&&!ranks.includes(c.rank as typeof ranks[number])))throw new Error('Corrija as cartas com valor desconhecido antes de confirmar o desconto.');
 return cards.reduce((total,card)=>total+cardValue(card,r),0);
}
export function score(cards:Card[],kind:'sequence'|'lavadeira',r:Rules=defaults) {
 if(cards.length<3) throw new Error('Adicione pelo menos 3 cartas.');
 const naturals=cards.filter(c=>!c.wild);
 const wilds=cards.length-naturals.length;
 if(naturals.length===0) throw new Error('Inclua cartas naturais.');
 if(cards.some(c=>c.rank==='Joker'&&!c.wild)) throw new Error('Joker deve ser usado como coringa.');
 if(kind==='lavadeira' && naturals.some(c=>c.rank!=='A')) throw new Error('Nesta versão, lavadeira é um jogo de ases.');
 if(kind==='sequence') {
  if(naturals.some(c=>c.suit!==naturals[0].suit)) throw new Error('A sequência precisa ter o mesmo naipe.');
  const indexes=naturals.map(c=>ranks.indexOf(c.rank as typeof ranks[number])).sort((a,b)=>a-b);
  if(new Set(indexes).size!==indexes.length) throw new Error('A sequência não aceita cartas naturais repetidas.');
  const fits=(values:number[])=> {const sorted=[...values].sort((a,b)=>a-b);return sorted[sorted.length-1]-sorted[0]+1<=cards.length;};
  if(cards.length>13 || (!fits(indexes)&&!fits(indexes.map(i=>i===0?13:i)))) throw new Error('As cartas e os coringas não formam uma sequência de até 13 cartas.');
 }
 const real=kind==='sequence'&&cards.length===13&&wilds===0&&new Set(naturals.map(c=>c.rank)).size===13;
 const label=real?'Canastra real':cards.length>=7?(wilds?'Canastra suja':'Canastra limpa'):kind==='lavadeira'?'Lavadeira':'Sequência';
 const bonus=real?r.real:cards.length>=7?(wilds?r.dirty:r.clean):0;
 const points=cards.reduce((sum,c)=>sum+cardValue(c,r),0);
 return {label,points,bonus,total:points+bonus};
}
