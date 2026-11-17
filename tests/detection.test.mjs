import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../api/detect.mjs';
import {validateDetection,detectionSchema} from '../shared/detection.js';
const env={GEMINI_API_KEY:'fake-gemini-key',BURACO_ACCESS_CODE:'test-table-code-123'};
const image='data:image/jpeg;base64,/9j/AA==';
const detected={groups:[{kind:'sequence',cards:[{rank:'?',suit:'?',wild:false,confidence:'low'}]}],warnings:['Confira a carta parcialmente coberta.']};
const success=(result=detected)=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(result)}]}}]})});
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
test('Exige chave Gemini e código da mesa; nunca usa a antiga chave OpenAI',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;throw new Error('Não deveria chegar aqui');};
 assert.equal((await call(createHandler({env:{},fetchImpl}))).statusCode,503);
 const legacy=await call(createHandler({env:{OPENAI_API_KEY:'legacy',BURACO_ACCESS_CODE:env.BURACO_ACCESS_CODE},fetchImpl}));
 assert.equal(legacy.body.code,'GEMINI_NOT_CONFIGURED');
 assert.equal((await call(createHandler({env:{...env,BURACO_ACCESS_CODE:'short'},fetchImpl}))).statusCode,503);
 const handler=createHandler({env,fetchImpl});
 assert.equal((await call(handler,{method:'GET'})).statusCode,405);
 assert.equal((await call(handler,{headers:{'x-mesa-code':'wrong'}})).statusCode,401);
 assert.equal((await call(handler,{headers:{'content-type':'text/plain'}})).statusCode,415);
 assert.equal((await call(handler,{body:{image:'https://external.example/image'}})).statusCode,400);
 assert.equal((await call(handler,{body:{image:'data:image/jpeg;base64,AAAA'}})).statusCode,400);
 assert.equal((await call(handler,{body:{image:'A'.repeat(3_600_000)}})).statusCode,413);
 assert.equal(calls,0);
});
test('Envia imagem inline e JSON Schema ao Gemini, com chave só no cabeçalho',async()=>{
 const handler=createHandler({env,fetchImpl:async(url,options)=>{
  assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
  assert.equal(options.headers['x-goog-api-key'],env.GEMINI_API_KEY);
  assert.doesNotMatch(url,/fake-gemini-key/);
  const request=JSON.parse(options.body);
  assert.deepEqual(request.contents[0].parts[1].inlineData,{mimeType:'image/jpeg',data:'/9j/AA=='});
  assert.match(request.contents[0].parts[0].text,/agrupamento físico/);
  assert.equal(request.generationConfig.responseMimeType,'application/json');
  assert.deepEqual(request.generationConfig.responseJsonSchema,detectionSchema);
  assert.equal(request.generationConfig.maxOutputTokens,10000);
  assert.doesNotMatch(options.body,/fake-gemini-key/);
  return success();
 }});
 const result=await call(handler);assert.equal(result.statusCode,200);assert.deepEqual(result.body,detected);assert.equal(result.headers['Cache-Control'],'no-store');
});
test('Foto da mão usa instruções próprias e preserva cartas sem montar jogos',async()=>{
 let calls=0;
 const handler=createHandler({env,fetchImpl:async(url,options)=>{
  calls++;const prompt=JSON.parse(options.body).contents[0].parts[0].text;
  assert.match(prompt,/restantes na mão/);assert.match(prompt,/Não tente formar sequências ou canastras/);
  return success({groups:[{kind:'sequence',cards:[{rank:'K',suit:'♠',wild:false,confidence:'high'}]}],warnings:[]});
 }});
 const result=await call(handler,{body:{image,purpose:'hand'}});assert.equal(result.statusCode,200);assert.equal(result.body.groups[0].cards[0].rank,'K');
 assert.equal((await call(handler,{body:{image,purpose:'other'}})).statusCode,400);assert.equal(calls,1);
});
test('Modelo pode ser configurado no servidor, sem URLs arbitrárias ou fallback pago',async()=>{
 let calls=0;
 const fetchImpl=async(url)=>{calls++;assert.match(url,/models\/gemini-3.1-flash-lite:generateContent$/);return success();};
 assert.equal((await call(createHandler({env:{...env,GEMINI_MODEL:'gemini-3.1-flash-lite'},fetchImpl}))).statusCode,200);
 assert.equal((await call(createHandler({env:{...env,GEMINI_MODEL:'../../bad?key=abc'},fetchImpl}))).statusCode,503);
 assert.equal(calls,1);
});
test('Bloqueios, truncamento e JSON inválido não viram pontos',async()=>{
 for(const [data,status] of [
  [{promptFeedback:{blockReason:'SAFETY'}},422],
  [{candidates:[{finishReason:'SAFETY'}]},422],
  [{candidates:[{finishReason:'MAX_TOKENS'}]},502],
  [{candidates:[]},502],
  [{candidates:[{finishReason:'STOP',content:{parts:[{text:'not JSON'}]}}]},502],
  [{candidates:[{finishReason:'STOP',content:{parts:[{text:'{"groups":null}'}]}}]},502]
 ])assert.equal((await call(createHandler({env,fetchImpl:async()=>({ok:true,json:async()=>data})}))).statusCode,status);
 const timed=await call(createHandler({env,fetchImpl:async()=>{const e=new Error();e.name='TimeoutError';throw e;}}));assert.match(timed.body.error,/demorou/);
});
test('Ignora partes de raciocínio e aceita a resposta final',async()=>{
 const handler=createHandler({env,fetchImpl:async()=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'ignore this'},{text:JSON.stringify(detected)}]}}]})})});
 assert.deepEqual((await call(handler)).body,detected);
});
test('Distingue cota diária, cota zero, chave inválida e indisponibilidade sem vazar mensagem',async()=>{
 const cases=[
  [429,{},'GEMINI_RATE_LIMIT'],
  [429,{details:[{violations:[{quotaId:'GenerateRequestsPerDayPerProjectPerModel-FreeTier'}]}]},'GEMINI_DAILY_LIMIT'],
  [429,{details:[{violations:[{quotaValue:'0'}]}]},'GEMINI_QUOTA_UNAVAILABLE'],
  [400,{details:[{reason:'API_KEY_INVALID'}]},'GEMINI_KEY'],
  [401,{},'GEMINI_KEY'],[403,{},'GEMINI_ACCESS'],[404,{},'GEMINI_MODEL'],
  [400,{status:'FAILED_PRECONDITION'},'GEMINI_ACCOUNT'],[400,{},'GEMINI_REQUEST'],[500,{},'GEMINI_UNAVAILABLE']
 ];
 for(const [status,detail,code] of cases){
  let calls=0;const response=await call(createHandler({env,fetchImpl:async()=>{calls++;return {ok:false,status,json:async()=>({error:{...detail,message:'SECRET-DO-NOT-EXPOSE'}})};}}));
  assert.equal(response.body.code,code);assert.equal(response.statusCode,status===429?429:502);assert.doesNotMatch(JSON.stringify(response.body),/SECRET|OpenAI/);assert.equal(calls,1);
 }
 const response=await call(createHandler({env,fetchImpl:async()=>({ok:false,status:429,json:async()=>{throw new Error('bad JSON');}})}));assert.equal(response.body.code,'GEMINI_RATE_LIMIT');
});
