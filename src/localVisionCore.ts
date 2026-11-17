import type {DetectedCard,DetectedGroup} from '../shared/detection.js';

// Class order from the pinned model.classes.json, not the order of our editor.
export const cardCodes=['10','2','3','4','5','6','7','8','9','A','J','K','Q'].flatMap(rank=>['C','D','H','S'].map(suit=>rank+suit));
export type CardBox={game?:number;x:number;y:number;width:number;height:number;probability:number;code:string;card:DetectedCard};

// Suggest spatial groups without losing cards or treating a whole table as one canasta.
// Different suits and repeated natural ranks are boundaries, not recognition errors to hide.
export function groupCardBoxes(boxes:CardBox[]):CardBox[][]{
 const clusters=boxes.map(box=>[box]);
 const edges:{a:number;b:number;distance:number}[]=[];
 for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){
  const p=boxes[a],q=boxes[b],dx=Math.abs(p.x+p.width/2-q.x-q.width/2),dy=Math.abs(p.y+p.height/2-q.y-q.height/2);
  const w=Math.max(p.width,q.width),h=Math.max(p.height,q.height);
  const alongRow=dy<=h*.85+dx*.18&&dx<=Math.max(w*4,h*2.8);
  const alongColumn=dx<=w*.85+dy*.18&&dy<=h*2.8;
  if(alongRow||alongColumn)edges.push({a,b,distance:Math.hypot(dx/Math.max(w,1),dy/Math.max(h,1))});
 }
 const owner=boxes.map((_,i)=>i);
 function root(i:number):number{while(owner[i]!==i)i=owner[i];return i;}
 function compatible(list:CardBox[]){
  const naturals=list.filter(b=>!b.card.wild),allAces=naturals.length>0&&naturals.every(b=>b.card.rank==='A');
  if(allAces)return true;
  if(list.length>13)return false;
  if(new Set(naturals.map(b=>b.card.suit)).size>1)return false;
  return new Set(naturals.map(b=>b.card.rank)).size===naturals.length;
 }
 for(const edge of edges.sort((a,b)=>a.distance-b.distance)){
  const a=root(edge.a),b=root(edge.b);if(a===b)continue;
  const merged=[...clusters[a],...clusters[b]];
  if(!compatible(merged))continue;
  owner[b]=a;clusters[a]=merged;clusters[b]=[];
 }
 const result=clusters.filter(c=>c.length);
 for(const cluster of result){
  const xs=cluster.map(b=>b.x),ys=cluster.map(b=>b.y);
  const vertical=Math.max(...ys)-Math.min(...ys)>Math.max(...xs)-Math.min(...xs);
  cluster.sort((a,b)=>vertical?a.y-b.y:a.x-b.x);
 }
 return result.sort((a,b)=>Math.min(...a.map(c=>c.y))-Math.min(...b.map(c=>c.y))||Math.min(...a.map(c=>c.x))-Math.min(...b.map(c=>c.x)));
}
export function groupsFromBoxes(boxes:CardBox[],purpose:'table'|'hand'):DetectedGroup[]{
 const clusters=purpose==='hand'?(boxes.length?[boxes]:[]):groupCardBoxes(boxes);
 return clusters.map(cluster=>({kind:purpose==='table'&&cluster.some(b=>!b.card.wild)&&cluster.filter(b=>!b.card.wild).every(b=>b.card.rank==='A')?'lavadeira':'sequence',cards:cluster.map(b=>({...b.card}))}));
}
export function overlap(a:CardBox,b:CardBox){
 const intersection=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 return intersection/(a.width*a.height+b.width*b.height-intersection||1);
}
export function decodeCards(data:ArrayLike<number>,dims:readonly number[],width:number,height:number):CardBox[]{
 if(dims.length!==3||dims[0]!==1||dims[1]!==56||data.length!==56*dims[2])throw new Error('Formato do modelo local incompatível.');
 const n=dims[2],scale=Math.min(640/width,640/height),padX=(640-width*scale)/2,padY=(640-height*scale)/2;
 const candidates:CardBox[]=[];
 for(let i=0;i<n;i++){
  let probability=0,label=-1;
  for(let c=0;c<52;c++){const p=data[(4+c)*n+i];if(p>probability){probability=p;label=c;}}
  if(probability<.40||label<0)continue;
  const w=data[2*n+i]/scale,h=data[3*n+i]/scale;
  const x=(data[i]-padX)/scale-w/2,y=(data[n+i]-padY)/scale-h/2;
  if(![x,y,w,h,probability].every(Number.isFinite)||w<=0||h<=0||x+w<=0||y+h<=0||x>=width||y>=height)continue;
  const code=cardCodes[label],rank=code.slice(0,-1),suit=({C:'♣',D:'♦',H:'♥',S:'♠'} as Record<string,string>)[code.slice(-1)];
  const left=Math.max(0,x),top=Math.max(0,y);
  candidates.push({x:left,y:top,width:Math.min(width,x+w)-left,height:Math.min(height,y+h)-top,probability,code,card:{rank,suit,wild:rank==='2',confidence:'low'}});
 }
 const kept:CardBox[]=[];
 // Suppress competing labels on the same corner, but retain repeated cards at distinct locations.
 for(const box of candidates.sort((a,b)=>b.probability-a.probability))if(!kept.some(k=>overlap(k,box)>.35))kept.push(box);
 if(kept.length>104)throw new Error('Há muitos símbolos na foto. Fotografe um jogo de cada vez.');
 return kept.sort((a,b)=>Math.abs(a.y-b.y)>Math.max(a.height,b.height)?a.y-b.y:a.x-b.x);
}
