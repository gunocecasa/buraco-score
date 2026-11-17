import http from 'node:http';
import {createServer} from 'vite';
import detect from '../api/detect.mjs';
const vite=await createServer({server:{middlewareMode:true},appType:'spa'});
const server=http.createServer((req,res)=>{
 if(req.url?.split('?')[0]==='/api/detect'){detect(req,res).catch(()=>{res.statusCode=500;res.end('{"error":"Erro interno. Tente novamente."}');});return;}
 vite.middlewares(req,res);
});
server.listen(5173,'0.0.0.0',()=>console.log('Buraco Score: http://localhost:5173 (manual + API de foto)'));
