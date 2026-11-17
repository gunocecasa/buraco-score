import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchOutcome,validTarget} from '../src/match.ts';
import {restoreSaved} from '../src/participants.ts';
import {defaults} from '../src/rules.ts';
const round=(...totals:number[])=>({id:'round',names:totals.map((_,i)=>'Dupla '+(i+1)),totals});
test('target defaults to 2000 and old saved points remain intact',()=>{
 const saved=restoreSaved({mode:'teams',names:['Dupla 1','Dupla 2'],rules:defaults,history:[round(100,200)]});
 assert.equal(saved.target,2000);assert.deepEqual(saved.history[0].totals,[100,200]);
 assert.equal(restoreSaved({...saved,target:3000}).target,3000);
 assert.equal(restoreSaved({...saved,target:-1}).target,2000);
});
test('target accepts only positive bounded integers',()=>{
 for(const value of [0,-1,NaN,Infinity,1.5,1_000_001,'2000',null])assert.equal(validTarget(value),false);
 for(const value of [1,2000,1_000_000])assert.equal(validTarget(value),true);
});
test('no victory until the final accumulated round totals reach the target',()=>{
 assert.equal(matchOutcome([],2000),null);
 assert.equal(matchOutcome([round(1900,1800),round(95,-100)],2000),null);
 const won=matchOutcome([round(1900,1800),round(100,50)],2000)!;
 assert.equal(won.winner,0);assert.equal(won.points,2000);assert.equal(won.round,2);
});
test('highest total wins when multiple participants cross together, including individual mode',()=>{
 const won=matchOutcome([round(2000,2150,2300,1800)],2000)!;
 assert.equal(won.winner,2);assert.equal(won.points,2300);
});
test('tie above the target continues until a later round breaks the tie',()=>{
 assert.equal(matchOutcome([round(2100,2100)],2000),null);
 assert.equal(matchOutcome([round(2100,2100),round(-200,-200)],2000),null);
 const won=matchOutcome([round(2100,2100),round(0,5)],2000)!;
 assert.equal(won.winner,1);assert.equal(won.round,2);
});
test('the first winning round ends a match; undoing that round reopens it',()=>{
 const rounds=[round(1950,1000),round(100,20),round(-2000,3000)];
 assert.equal(matchOutcome(rounds,2000)!.winner,0);
 assert.equal(matchOutcome(rounds.slice(0,1),2000),null);
});
