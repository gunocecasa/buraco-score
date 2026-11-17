import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handPoints,defaults,type Card} from '../src/rules.ts';
const cards=(ranks:string[]):Card[]=>ranks.map(rank=>({rank,suit:'♠',wild:rank==='Joker'}));
test('Mão desconta somente cartas, sem bônus nem exigência de sequência',()=>{
 assert.equal(handPoints(cards(['A','2','3','Joker'])),50);
 assert.equal(handPoints(cards(Array(7).fill('A'))),105);
 assert.equal(handPoints(cards(['8','8','K'])),30);
});
test('Uma carta ou mão vazia são válidas, mas valor desconhecido bloqueia o desconto',()=>{
 assert.equal(handPoints(cards(['Joker'])),20);
 assert.equal(handPoints([]),0);
 assert.throws(()=>handPoints(cards(['?'])));
 assert.throws(()=>handPoints(cards(['B'])));
});
test('Naipe e função de coringa não mudam desconto; valores personalizados são respeitados',()=>{
 assert.equal(handPoints([{rank:'2',suit:'?',wild:true},{rank:'A',suit:'♥',wild:false}]),25);
 assert.equal(handPoints(cards(['A','2','Joker']),{...defaults,ace:20,two:15,joker:30}),65);
});
