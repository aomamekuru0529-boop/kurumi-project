import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const root=resolve(project,'dist'),preview=process.argv.includes('--preview');
const run=promisify(execFile),clients=new Set();
async function build(){await run(process.execPath,[resolve(project,'scripts/build.mjs')],{cwd:project});}
if(!preview)await build();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.json':'application/json','.zip':'application/zip'};
const server=createServer(async(req,res)=>{
  try{
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(name==='/__changes'&&!preview){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(': connected\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;}
    const file=resolve(root,'.'+(name==='/'?'/index.html':name));
    if(!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}
    let body=await readFile(file);
    if(extname(file)==='.html'&&!preview)body=Buffer.from(body.toString().replace('</body>',`<script>new EventSource('/__changes').onmessage=()=>location.reload();</script></body>`));
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
  }catch{res.writeHead(404);res.end('File not found');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'8000番が使用中です。前の起動ウィンドウでControl+Cを押して終了してください。':e.message);process.exit(1);});
server.listen(8000,'127.0.0.1',()=>console.log(`\nhttp://localhost:8000 をブラウザで開いてください。\n${preview?'完成版の確認モードです。':'編集モード：保存すると再ビルドし、画面を自動更新します。'}\n終了：Control+C\n`));
async function snapshot(){
  const entries=[];
  async function collect(dir){for(const name of await readdir(dir)){const path=resolve(dir,name),info=await stat(path);if(info.isDirectory())await collect(path);else entries.push(`${path}:${info.mtimeMs}:${info.size}`);}}
  for(const name of await readdir(project)){if(/\.(js|css|html)$/.test(name)){const info=await stat(resolve(project,name));entries.push(`${name}:${info.mtimeMs}:${info.size}`);}}
  try{await collect(resolve(project,'assets'));}catch(e){if(e.code!=='ENOENT')throw e;}
  return entries.sort().join('\n');
}
if(!preview){
  let previous=await snapshot(),busy=false;
  setInterval(async()=>{
    if(busy)return;busy=true;
    try{const next=await snapshot();if(next!==previous){previous=next;console.log('変更を反映しています…');try{await build();for(const client of clients)client.write('data: reload\n\n');console.log('更新しました。');}catch(e){console.error('ビルドに失敗しました。コードを修正して保存してください。\n'+(e.stderr||e.message));}}}catch(e){console.error(e.message);}finally{busy=false;}
  },500);
}
