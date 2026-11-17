import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ranks,defaults,score,type Card} from '../src/rules.ts';
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
 const cards=ranks.map(rank=>({rank,suit:'♥',wild:false}));
 assert.deepEqual(score(cards,'sequence'),{label:'Canastra real',points:110,bonus:500,total:610});
 cards[1].wild=true;
 assert.equal(score(cards,'sequence').bonus,100);
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
