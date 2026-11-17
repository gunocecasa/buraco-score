import type {DetectedCard} from '../shared/detection.js';

// Class order from the pinned model.classes.json, not the order of our editor.
export const cardCodes=['10','2','3','4','5','6','7','8','9','A','J','K','Q'].flatMap(rank=>['C','D','H','S'].map(suit=>rank+suit));
export type CardBox={x:number;y:number;width:number;height:number;probability:number;code:string;card:DetectedCard};
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
