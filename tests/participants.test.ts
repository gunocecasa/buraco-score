import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults} from '../src/rules.ts';
import {restoreSaved,defaultNames,addParticipant,removeParticipant} from '../src/participants.ts';

test('Padrões numerados para duplas e jogadores',()=>{
 assert.deepEqual(defaultNames('teams',3),['Dupla 1','Dupla 2','Dupla 3']);
 assert.deepEqual(defaultNames('individual',4),['Jogador 1','Jogador 2','Jogador 3','Jogador 4']);
 assert.equal(restoreSaved(null).names[0],'Dupla 1');
});
test('Migra Nós/Eles sem perder pontos antigos e preserva nomes personalizados',()=>{
 const saved={names:['Nós','Eles'],rules:defaults,history:[{id:'one',names:['Nós','Eles'],totals:[305,610]}]};
 const migrated=restoreSaved(saved);
 assert.deepEqual(migrated.names,['Dupla 1','Dupla 2']);
 assert.deepEqual(migrated.history[0].totals,[305,610]);
 assert.deepEqual(restoreSaved({...saved,names:['Ana','Bia']}).names,['Ana','Bia']);
});
test('Inclui participantes após rodadas salvas sem deslocar os pontos',()=>{
 const history=[{id:'one',names:defaultNames('individual'),totals:[305,610]}];
 const next=addParticipant(defaultNames('individual'),history,'individual');
 assert.deepEqual(next.names,['Jogador 1','Jogador 2','Jogador 3']);
 assert.deepEqual(next.history[0].totals,[305,610,0]);
 assert.deepEqual(history[0].totals,[305,610]);
 assert.deepEqual(restoreSaved({...next,mode:'individual',rules:defaults}).names,next.names);
});
test('Remove e renumera, preservando associação de pontos e nomes personalizados',()=>{
 const names=['Dupla 1','Dupla 2','Amigos','Dupla 4'];
 const history=[{id:'one',names,totals:[10,20,30,40]}];
 const next=removeParticipant(names,history,'teams',1);
 assert.deepEqual(next.names,['Dupla 1','Amigos','Dupla 3']);
 assert.deepEqual(next.history[0].totals,[10,30,40]);
 assert.throws(()=>removeParticipant(defaultNames('teams'),[],'teams',0));
});
test('Recupera partida individual com mais de duas colunas e rejeita placar corrompido',()=>{
 const saved={mode:'individual',names:defaultNames('individual',6),rules:defaults,history:[{id:'one',names:defaultNames('individual',6),totals:[0,10,20,30,40,50]}]};
 assert.equal(restoreSaved(saved).names.length,6);
 assert.equal(restoreSaved(saved).history[0].totals[5],50);
 assert.equal(restoreSaved({...saved,history:[{...saved.history[0],totals:[10,20]}]}).history.length,0);
});
