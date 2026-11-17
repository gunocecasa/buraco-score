import type {Round} from './participants.ts';
export const defaultTarget=2000;
export const validTarget=(value:unknown):value is number=>typeof value==='number'&&Number.isInteger(value)&&value>=1&&value<=1_000_000;
export function matchOutcome(history:Round[],target:number){
 if(!validTarget(target))return null;
 const totals:number[]=[];
 for(let roundIndex=0;roundIndex<history.length;roundIndex++){
  history[roundIndex].totals.forEach((points,i)=>{totals[i]=(totals[i]||0)+points;});
  const highest=Math.max(...totals);
  const leaders=totals.flatMap((points,i)=>points===highest?[i]:[]);
  if(highest>=target&&leaders.length===1)return {winner:leaders[0],points:highest,round:roundIndex+1,totals:[...totals]};
 }
 return null;
}
