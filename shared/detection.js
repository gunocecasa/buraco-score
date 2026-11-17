export const validRanks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K','Joker','?'];
export const validSuits = ['♠','♥','♣','♦','?',''];
export const detectionSchema = {
 type:'object', additionalProperties:false, required:['groups','warnings'], properties:{
  groups:{type:'array',maxItems:40,items:{type:'object',additionalProperties:false,required:['kind','cards'],properties:{
   kind:{type:'string',enum:['sequence','lavadeira']},
   cards:{type:'array',maxItems:104,items:{type:'object',additionalProperties:false,required:['rank','suit','wild','confidence'],properties:{
    rank:{type:'string',enum:validRanks},suit:{type:'string',enum:validSuits},wild:{type:'boolean'},confidence:{type:'string',enum:['high','low']}
   }}}
  }}},warnings:{type:'array',maxItems:20,items:{type:'string',maxLength:500}}
 }
};
// A segunda validação protege o editor mesmo se o provedor devolver dados incompletos.
export function validateDetection(value) {
 if(!value||!Array.isArray(value.groups)||value.groups.length>40||!Array.isArray(value.warnings)||value.warnings.length>20)throw new Error('Resposta de reconhecimento inválida. Tente outra foto.');
 let count=0;
 const groups=value.groups.map(group=>{
  if(!group||!['sequence','lavadeira'].includes(group.kind)||!Array.isArray(group.cards)||group.cards.length>104)throw new Error('Grupo detectado inválido.');
  const cards=group.cards.map(card=>{
   if(!card||!validRanks.includes(card.rank)||!validSuits.includes(card.suit)||typeof card.wild!=='boolean'||!['high','low'].includes(card.confidence))throw new Error('Carta detectada inválida.');
   if(card.wild&&!['2','Joker','?'].includes(card.rank))throw new Error('Coringa detectado inválido.');
   count++;
   return {rank:card.rank,suit:card.rank==='Joker'?'':card.suit,wild:card.rank==='Joker'||card.wild,confidence:card.confidence};
  });
  return {kind:group.kind,cards};
 });
 if(count>208)throw new Error('Cartas demais para uma foto. Fotografe uma área menor.');
 if(value.warnings.some(w=>typeof w!=='string'||w.length>500))throw new Error('Aviso de reconhecimento inválido.');
 return {groups,warnings:[...value.warnings]};
}
