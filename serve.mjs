// Serveur local de la démo INFN (équivalent de Vercel) :
// - /api/* → mêmes fonctions que sur Vercel (dossier api/)
// - /wp-content, /wp-includes → relais vers infn.fr, gardé en copie dans cache/
// Lancer : node --env-file=.env.local serve.mjs   (variables récupérées par « vercel env pull »)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { pathToFileURL, fileURLToPath } from "node:url";
const ROOT=path.dirname(fileURLToPath(import.meta.url));
if(!process.env.OPENROUTER_API_KEY && fs.existsSync(path.join(ROOT,"openrouter.key"))) process.env.OPENROUTER_API_KEY=fs.readFileSync(path.join(ROOT,"openrouter.key"),"utf8").trim();
if(!process.env.USE_BLOB) process.env.LOCAL_STORE="1"; // en local : data/events.jsonl, sauf USE_BLOB=1
const T={".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".mjs":"text/javascript",".json":"application/json",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".woff":"font/woff",".woff2":"font/woff2",".ttf":"font/ttf",".eot":"application/vnd.ms-fontobject",".gif":"image/gif",".ico":"image/x-icon"};
const send=(r,code,type,d)=>{r.writeHead(code,{"Content-Type":type,"Cache-Control":"no-store"});r.end(d);};
const PRIVATE=/^\/(openrouter\.key|\.env.*|serve\.mjs|.*\.py|lib\/|api\/|data\/|cache\/|node_modules\/|\.vercel\/|\.git\/|package.*\.json|original\.html)/;
http.createServer(async(q,r)=>{
  const u=new URL(q.url,"http://x"); let p=decodeURIComponent(u.pathname);
  if(p.startsWith("/api/")){
    const f=path.join(ROOT,path.normalize(p)+".js");
    if(!f.startsWith(path.join(ROOT,"api"))||!fs.existsSync(f)) return send(r,404,"text/plain","404");
    try{ const mod=await import(pathToFileURL(f).href); return await mod.default(q,r); }catch(e){ console.error(e); try{send(r,500,"text/plain","erreur")}catch{} return; }
  }
  if(/^\/wp-(content|includes)\//.test(p)){
    const f=path.join(ROOT,"cache",path.normalize(p)); const type=T[path.extname(p).toLowerCase()]||"application/octet-stream";
    if(fs.existsSync(f)) return send(r,200,type,fs.readFileSync(f));
    try{ const res=await fetch("https://www.infn.fr"+u.pathname+u.search,{headers:{"User-Agent":"Mozilla/5.0"}});
      const d=Buffer.from(await res.arrayBuffer()); if(res.ok){fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,d);}
      return send(r,res.status,res.headers.get("content-type")||type,d);
    }catch(e){ return send(r,502,"text/plain","proxy error"); }
  }
  if(PRIVATE.test(p)) return send(r,404,"text/plain","404");
  if(p==="/admin") p="/admin/index.html";
  if(p.endsWith("/")) p+="index.html";
  const f=path.join(ROOT,path.normalize(p)); if(!f.startsWith(ROOT)) return send(r,403,"text/plain","");
  fs.readFile(f,(e,d)=> e?send(r,404,"text/plain","404"):send(r,200,T[path.extname(f)]||"application/octet-stream",d));
}).listen(Number(process.env.PORT||4410),"127.0.0.1",()=>console.log("ok"));
