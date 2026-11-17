import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cardCodes,decodeCards,groupCardBoxes,groupsFromBoxes,scanWindows,aceWindow,mergePasses,type CardBox} from '../src/localVisionCore.ts';

test('matches pinned model class order and maps all ranks/suits',()=>{
 assert.equal(cardCodes.length,52);assert.equal(cardCodes[0],'10C');assert.equal(cardCodes[51],'QS');
 for(let c=0;c<52;c++){
  const data=new Float32Array(56);data[0]=320;data[1]=320;data[2]=40;data[3]=60;data[4+c]=.9;
  const boxes=decodeCards(data,[1,56,1],640,640);
  assert.equal(boxes[0].code,cardCodes[c]);assert.equal(boxes[0].card.confidence,'low');
  assert.equal(boxes[0].card.wild,boxes[0].card.rank==='2');
 }
});
test('letterbox scaling and suppression preserve two same-value cards at different positions',()=>{
 const n=4,data=new Float32Array(56*n);
 for(let i=0;i<n;i++){data[i]=i===2?400:100;data[n+i]=200;data[2*n+i]=30;data[3*n+i]=40;data[(4+(i===1?1:0))*n+i]=i===3?.2:.9-i*.01;}
 const boxes=decodeCards(data,[1,56,n],1280,640);
 assert.equal(boxes.length,2);assert.equal(boxes[0].x,170);assert.equal(boxes[0].y,40);assert.equal(boxes[0].width,60);
 assert.equal(boxes[1].code,'10C');
});
test('rejects unknown layouts and never fabricates detections on an empty output',()=>{
 assert.throws(()=>decodeCards(new Float32Array(56),[1,1,56],640,640));
 assert.deepEqual(decodeCards(new Float32Array(56),[1,56,1],640,640),[]);
});

function box(rank:string,suit:string,x:number,y:number):CardBox{return {x,y,width:12,height:20,probability:.9,code:rank+suit,card:{rank,suit,wild:rank==='2'||rank==='Joker',confidence:'low'}};}
const row=(x:number,y:number,suit='♣')=>['3','4','5','6','7','8'].map((r,i)=>box(r,suit,x+i*17,y+i*.6));
test('18 cards in three spatial games are preserved as three groups of six',()=>{
 const boxes=[...row(0,0),...row(230,0),...row(0,150)];
 const grouped=groupCardBoxes(boxes);
 assert.deepEqual(grouped.map(g=>g.length),[6,6,6]);
 assert.equal(new Set(grouped.flat()).size,18);
 assert.deepEqual(new Set(grouped.flat()),new Set(boxes));
 assert.deepEqual(groupsFromBoxes(boxes,'table').map(g=>g.kind),['sequence','sequence','sequence']);
});
test('suits separate adjacent games and a wild two does not bridge both',()=>{
 const boxes=[box('3','♣',0,0),box('4','♣',17,0),box('5','♣',34,0),box('2','♠',51,0),box('6','♥',68,0),box('7','♥',85,0),box('8','♥',102,0)];
 const groups=groupsFromBoxes(boxes,'table');
 assert.equal(groups.length,2);assert.equal(groups.flatMap(g=>g.cards).length,7);
 assert.ok(groups.every(g=>new Set(g.cards.filter(c=>!c.wild).map(c=>c.suit)).size===1));
});
test('vertical lavadeira can have mixed suits and more than thirteen cards',()=>{
 const boxes=Array.from({length:15},(_,i)=>box('A',['♠','♥','♣','♦'][i%4],200,i*22));
 const groups=groupsFromBoxes(boxes,'table');
 assert.equal(groups.length,1);assert.equal(groups[0].kind,'lavadeira');assert.equal(groups[0].cards.length,15);
});
test('hand photo stays a single hand regardless of spacing or suits',()=>{
 const boxes=[...row(0,0),...row(300,250,'♥'),box('A','♠',800,800)];
 const groups=groupsFromBoxes(boxes,'hand');
 assert.equal(groups.length,1);assert.equal(groups[0].kind,'sequence');assert.equal(groups[0].cards.length,13);
 assert.deepEqual(groupsFromBoxes([],'table'),[]);
});
test('keeps duplicate natural cards and leaves invalid fragments for review',()=>{
 const boxes=[box('3','♣',0,0),box('3','♣',18,0),box('K','♥',400,300)];
 const groups=groupsFromBoxes(boxes,'table');
 assert.equal(groups.length,3);assert.equal(groups.flatMap(g=>g.cards).length,3);
});
test('offset stacked aces with a missing middle corner stay together without inventing the missing card',()=>{
 const aces=[box('A','♦',100,10),box('A','♣',130,90)];
 assert.equal(groupsFromBoxes(aces,'table').length,1);
 assert.equal(groupsFromBoxes(aces,'table')[0].cards.length,2);
 const distant=box('A','♥',400,90);
 assert.equal(groupsFromBoxes([...aces,distant],'table').length,2);
});
test('detailed windows cover the image and ace focus stays inside its bounds',()=>{
 const windows=scanWindows(1200,800,true);
 assert.equal(windows.length,5);assert.equal(scanWindows(1200,800,false).length,1);
 assert.ok(windows.every(w=>w.x>=0&&w.y>=0&&w.x+w.width<=1200&&w.y+w.height<=800));
 const focus=aceWindow([box('A','♦',5,5)],1200,800)!;
 assert.equal(focus.x,0);assert.equal(focus.y,0);assert.ok(focus.width>12);
 assert.equal(aceWindow([box('K','♣',10,10)],1200,800),null);
});
test('multiple crops of the same pip count once, but nearby repeated aces remain distinct',()=>{
 const a=box('A','♣',10,10),b=box('A','♣',29,10);
 const repeated=mergePasses([[a,b],[{...a,x:11},{...b,x:30}]]);
 assert.equal(repeated.length,2);
});
test('single weak new crop is rejected; repeated moderate readings can recover a missing card',()=>{
 const weak={...box('A','♣',10,10),probability:.5};
 assert.deepEqual(mergePasses([[],[weak]]),[]);
 assert.equal(mergePasses([[],[weak],[{...weak,x:11}]]).length,1);
 assert.equal(mergePasses([[],[{...weak,probability:.8}]]).length,1);
});
test('one conflicting crop cannot override the full photo; two agreeing crops can',()=>{
 const base=box('3','♣',10,10),other=box('A','♣',10,10);
 assert.equal(mergePasses([[base],[{...other,probability:.99}]])[0].card.rank,'3');
 assert.equal(mergePasses([[base],[other],[{...other,x:11}]])[0].card.rank,'A');
});
