import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../api/detect.mjs';
import {validateDetection} from '../shared/detection.js';
const env={OPENAI_API_KEY:'fake-test-key',BURACO_ACCESS_CODE:'test-table-code-123'};
const image='data:image/jpeg;base64,/9j/AA==';
const detected={groups:[{kind:'sequence',cards:[{rank:'?',suit:'?',wild:false,confidence:'low'}]}],warnings:['Confira a carta parcialmente coberta.']};
async function call(handler,{method='POST',body={image},headers={}}={}){
 const req={method,body,headers:{'content-type':'application/json','x-mesa-code':env.BURACO_ACCESS_CODE,...headers}};
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(text){this.body=JSON.parse(text);}};
 await handler(req,res);return res;
}
test('Dados incertos preservados; Joker normalizado; inválidos rejeitados',()=>{
 assert.deepEqual(validateDetection(detected),detected);
 assert.equal(validateDetection({groups:[{kind:'lavadeira',cards:[{rank:'Joker',suit:'?',wild:false,confidence:'high'}]}],warnings:[]}).groups[0].cards[0].wild,true);
 for(const value of [null,{}, {groups:[{kind:'other',cards:[]}],warnings:[]},{groups:[{kind:'sequence',cards:[{rank:'B',suit:'♠',wild:false,confidence:'high'}]}],warnings:[]}])assert.throws(()=>validateDetection(value));
});
test('API só chama IA com configuração, código e imagem válidos',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;throw new Error('Não deveria chegar aqui');};
 assert.equal((await call(createHandler({env:{},fetchImpl}))).statusCode,503);
 const handler=createHandler({env,fetchImpl});
 assert.equal((await call(handler,{method:'GET'})).statusCode,405);
 assert.equal((await call(handler,{headers:{'x-mesa-code':'wrong'}})).statusCode,401);
 assert.equal((await call(handler,{headers:{'content-type':'text/plain'}})).statusCode,415);
 assert.equal((await call(handler,{body:{image:'https://external.example/image'}})).statusCode,400);
 assert.equal((await call(handler,{body:{image:'data:image/jpeg;base64,AAAA'}})).statusCode,400);
 assert.equal((await call(handler,{body:{image:'A'.repeat(3_600_000)}})).statusCode,413);
 assert.equal(calls,0);
});
test('API envia imagem estruturada, não armazena resposta e devolve cartas para revisão',async()=>{
 const handler=createHandler({env,fetchImpl:async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');
  const request=JSON.parse(options.body);assert.equal(request.store,false);assert.equal(request.input[0].content[1].image_url,image);assert.equal(request.text.format.strict,true);
  return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(detected)}]}]})};
 }});
 const result=await call(handler);assert.equal(result.statusCode,200);assert.deepEqual(result.body,detected);assert.equal(result.headers['Cache-Control'],'no-store');
});
test('Recusa, limite, resposta incompleta e dados inválidos geram erros recuperáveis',async()=>{
 for(const [response,status] of [
  [{ok:false,status:429},429],
  [{ok:false,status:401},502],
  [{ok:true,json:async()=>({status:'incomplete'})},502],
  [{ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'refusal'}]}]})},422],
  [{ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{"groups":null}'}]}]})},502]
 ])assert.equal((await call(createHandler({env,fetchImpl:async()=>response}))).statusCode,status);
 const timed=await call(createHandler({env,fetchImpl:async()=>{const e=new Error();e.name='TimeoutError';throw e;}}));assert.match(timed.body.error,/demorou/);
});
test('Foto da mão usa instruções próprias e preserva cartas sem montar jogos',async()=>{
 let calls=0;
 const handler=createHandler({env,fetchImpl:async(url,options)=>{
  calls++;const request=JSON.parse(options.body);const prompt=request.input[0].content[0].text;
  assert.match(prompt,/restantes na mão/);assert.match(prompt,/Não tente formar sequências ou canastras/);
  return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({groups:[{kind:'sequence',cards:[{rank:'K',suit:'♠',wild:false,confidence:'high'}]}],warnings:[]})}]}]})};
 }});
 const result=await call(handler,{body:{image,purpose:'hand'}});assert.equal(result.statusCode,200);assert.equal(result.body.groups[0].cards[0].rank,'K');
 assert.equal((await call(handler,{body:{image,purpose:'other'}})).statusCode,400);assert.equal(calls,1);
});
