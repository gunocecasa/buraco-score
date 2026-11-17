import {defaults,type Rules} from './rules.ts';
import {defaultTarget,validTarget} from './match.ts';

export type Mode='teams'|'individual';
export type Round={id:string;names:string[];totals:number[]};
export type Saved={mode:Mode;names:string[];rules:Rules;history:Round[];target:number};
export const participantLabel=(mode:Mode)=>mode==='teams'?'Dupla':'Jogador';
export const defaultName=(mode:Mode,index:number)=>`${participantLabel(mode)} ${index+1}`;
export const defaultNames=(mode:Mode,count=2)=>Array.from({length:count},(_,i)=>defaultName(mode,i));

export function restoreSaved(value:unknown):Saved {
 const fallback:Saved={mode:'teams',names:defaultNames('teams'),rules:{...defaults},history:[],target:defaultTarget};
 if(!value||typeof value!=='object')return fallback;
 const s=value as Partial<Saved>;
 if(!Array.isArray(s.names)||s.names.length<2||!s.names.every(n=>typeof n==='string')||
 !Array.isArray(s.history)||!s.history.every(h=>h&&typeof h.id==='string'&&Array.isArray(h.names)&&h.names.every(n=>typeof n==='string')&&Array.isArray(h.totals)&&h.totals.length===s.names!.length&&h.totals.every(Number.isFinite))||
 !s.rules||!Object.keys(defaults).every(k=>Number.isFinite(s.rules![k as keyof Rules])))return fallback;
 const mode:Mode=s.mode==='individual'?'individual':'teams';
 const names=!s.mode&&s.names.length===2&&s.names[0]==='Nós'&&s.names[1]==='Eles'?defaultNames(mode):[...s.names];
 return {mode,names,rules:{...s.rules},history:s.history.map(h=>({...h,names:[...h.names],totals:[...h.totals]})),target:validTarget(s.target)?s.target:defaultTarget};
}

export function addParticipant(names:string[],history:Round[],mode:Mode){
 const name=defaultName(mode,names.length);
 return {names:[...names,name],history:history.map(h=>({...h,names:[...h.names,name],totals:[...h.totals,0]}))};
}

export function removeParticipant(names:string[],history:Round[],mode:Mode,index:number){
 if(names.length<=2||index<0||index>=names.length)throw new Error('Mantenha pelo menos dois participantes.');
 const nextNames=names.filter((_,i)=>i!==index).map((n,i)=>/^(Dupla|Jogador) \d+$/.test(n)?defaultName(mode,i):n);
 return {names:nextNames,history:history.map(h=>({...h,names:h.names.filter((_,i)=>i!==index),totals:h.totals.filter((_,i)=>i!==index)}))};
}
