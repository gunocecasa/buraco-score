import {useEffect,useRef,useState} from 'react';

export default function HandPointsInput({value,onChange,name}:{value:number;onChange:(value:number)=>void;name:string}){
 const [draft,setDraft]=useState(String(value));
 const editing=useRef(false);
 useEffect(()=>{if(!editing.current)setDraft(String(value));},[value]);
 return <input type="text" inputMode="numeric" pattern="[0-9]*" aria-label={'Pontos restantes na mão de '+name} value={draft}
  onFocus={e=>{editing.current=true;if(draft==='0')e.currentTarget.select();}}
  onChange={e=>{const text=e.target.value;if(!/^\d*$/.test(text))return;const next=text===''?0:Math.min(100000,Number(text));setDraft(text===''?'':String(next));onChange(next);}}
  onBlur={()=>{editing.current=false;setDraft(String(value));}}/>;
}
