import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cardCodes,decodeCards} from '../src/localVisionCore.ts';

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
