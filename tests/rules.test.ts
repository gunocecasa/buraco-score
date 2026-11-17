import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ranks,defaults,score,resolveCardRoles,type Card} from '../src/rules.ts';
const ace=(wild=false):Card=>({rank:wild?'Joker':'A',suit:'♠',wild});
const aces=(n:number)=>Array.from({length:n},()=>ace());
test('Lavadeira de 3 ases = 45; 6 ases ainda não são canastra',()=>{
 assert.equal(score(aces(3),'lavadeira').total,45);
 assert.equal(score(aces(6),'lavadeira').bonus,0);
});
test('Lavadeira 7+ limpa e suja, nunca real mesmo com 13 cartas',()=>{
 assert.equal(score(aces(7),'lavadeira').total,305);
 assert.equal(score([...aces(6),ace(true)],'lavadeira').total,210);
 assert.equal(score(aces(13),'lavadeira').bonus,200);
 assert.equal(score([...aces(12),ace(true)],'lavadeira').bonus,100);
});
test('Real natural A–K vale 110 + 500 = 610',()=>{
 const cards:Card[]=ranks.map(rank=>({rank,suit:'♥',wild:false}));
 assert.deepEqual(score(cards,'sequence'),{label:'Canastra real',points:110,bonus:500,total:610});
 cards[1].wild=true;
 cards[1].twoMode='wild';
 assert.equal(score(cards,'sequence').bonus,100);
});
test('A–K with a default wildcard two is automatically real, without mutating the input',()=>{
 const cards:Card[]=ranks.map(rank=>({rank,suit:'♠',wild:rank==='2'}));
 assert.equal(score(cards,'sequence').label,'Canastra real');
 assert.equal(score(cards,'sequence').total,610);
 assert.equal(resolveCardRoles(cards,'sequence')[1].wild,false);
 assert.equal(cards[1].wild,true);
 assert.equal(score([...cards].reverse(),'sequence').total,610);
});
test('a same-suit two at its natural position makes a clean canasta',()=>{
 const cards:Card[]=['2','3','4','5','6','7','8'].map(rank=>({rank,suit:'♣',wild:rank==='2',twoMode:rank==='2'?'auto':undefined}));
 assert.equal(score(cards,'sequence').label,'Canastra limpa');
});
test('a missing middle card and an off-suit two remain dirty',()=>{
 const missing:Card[]=['3','4','5','2','7','8','9'].map(rank=>({rank,suit:'♠',wild:rank==='2'}));
 assert.equal(score(missing,'sequence').label,'Canastra suja');
 const offSuit:Card[]=ranks.map(rank=>({rank,suit:rank==='2'?'♥':'♠',wild:rank==='2'}));
 assert.equal(score(offSuit,'sequence').label,'Canastra suja');
});
test('only one of two automatic twos can be natural; Joker still keeps a canasta dirty',()=>{
 const cards:Card[]=['2','2','3','4','5','6','7'].map(rank=>({rank,suit:'♠',wild:rank==='2'}));
 assert.equal(resolveCardRoles(cards,'sequence').filter(c=>c.rank==='2'&&!c.wild).length,1);
 assert.equal(score(cards,'sequence').label,'Canastra suja');
 assert.equal(score([...cards.slice(1),{rank:'Joker',suit:'',wild:true}],'sequence').label,'Canastra suja');
});
test('lavadeira keeps twos as wildcards and never becomes real',()=>{
 const cards:Card[]=[...aces(12),{rank:'2',suit:'♠',wild:true}];
 assert.equal(score(cards,'lavadeira').label,'Canastra suja');
 assert.equal(resolveCardRoles(cards,'lavadeira')[12].wild,true);
});
test('explicit natural and wildcard overrides are respected',()=>{
 const cards:Card[]=ranks.map(rank=>({rank,suit:'♠',wild:rank==='2',twoMode:rank==='2'?'wild':undefined}));
 assert.equal(score(cards,'sequence').label,'Canastra suja');
 cards[1].twoMode='auto';assert.equal(score(cards,'sequence').label,'Canastra real');
 const invalid:Card[]=['2','5','6'].map(rank=>({rank,suit:'♠',wild:rank==='2',twoMode:rank==='2'?'natural':undefined}));
 assert.throws(()=>score(invalid,'sequence'));
});
test('Sequência limpa, suja e Ás alto',()=>{
 const cards=ranks.slice(2,9).map(rank=>({rank,suit:'♠',wild:false}));
 assert.equal(score(cards,'sequence').bonus,200);
 cards[3]={rank:'2' as typeof cards[number]['rank'],suit:'♠',wild:true};
 assert.equal(score(cards,'sequence').bonus,100);
 assert.equal(score(['J','Q','K','A'].map(rank=>({rank,suit:'♠',wild:false})),'sequence').bonus,0);
});
test('Rejeita jogos incompletos, naipes misturados, buracos e duplicatas',()=>{
 assert.throws(()=>score(aces(2),'lavadeira'));
 assert.throws(()=>score(aces(3),'sequence'));
 assert.throws(()=>score(['3','5','7'].map(rank=>({rank,suit:'♠',wild:false})),'sequence'));
 assert.throws(()=>score(ranks.slice(0,3).map((rank,i)=>({rank,suit:i?'♠':'♥',wild:false})),'sequence'));
 assert.throws(()=>score([{rank:'Joker',suit:'',wild:false},...aces(3)],'lavadeira'));
});
test('Valores ajustados aplicam-se ao bônus e às cartas',()=>{
 assert.equal(score(aces(7),'lavadeira',{...defaults,ace:20,clean:250}).total,390);
});
