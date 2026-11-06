// Serveur local de la maquette INFN : sert le dossier, et relaie /wp-content et /wp-includes depuis infn.fr
// (même origine => polices d'icônes chargées), avec copie sur disque dans cache/ pour marcher hors ligne.
import http from "node:http"; import { chat } from "./lib/chat-core.mjs"; import fs from "node:fs"; import path from "node:path";
const ROOT="/Users/lucasroncey/Documents/ChatGPT/youtube video/clients/infn-dmn-demo";
const T={".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".woff":"font/woff",".woff2":"font/woff2",".ttf":"font/ttf",".eot":"application/vnd.ms-fontobject",".gif":"image/gif"};
const send=(r,code,type,d)=>{r.writeHead(code,{"Content-Type":type,"Cache-Control":"no-store"});r.end(d);};
http.createServer(async(q,r)=>{
  const u=new URL(q.url,"http://x"); let p=decodeURIComponent(u.pathname);
  if(p==="/api/chat"&&q.method==="POST") return (async()=>{ let raw=""; for await(const c of q) raw+=c; await chat(raw,r,fs.readFileSync(path.join(ROOT,"openrouter.key"),"utf8").trim()); })().catch(e=>{console.error(e); try{send(r,500,"text/plain","erreur");}catch{}});
  if(/(openrouter\.key|\.env|serve\.mjs|\.py)$/.test(p)) return send(r,404,"text/plain","404");
  if(/^\/wp-(content|includes)\//.test(p)){
    const f=path.join(ROOT,"cache",path.normalize(p)); const type=T[path.extname(p).toLowerCase()]||"application/octet-stream";
    if(fs.existsSync(f)) return send(r,200,type,fs.readFileSync(f));
    try{ const res=await fetch("https://www.infn.fr"+u.pathname+u.search,{headers:{"User-Agent":"Mozilla/5.0"}});
      const d=Buffer.from(await res.arrayBuffer()); if(res.ok){fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,d);}
      return send(r,res.status,res.headers.get("content-type")||type,d);
    }catch(e){ return send(r,502,"text/plain","proxy error"); }
  }
  if(p.endsWith("/")) p+="index.html";
  const f=path.join(ROOT,path.normalize(p)); if(!f.startsWith(ROOT)) return send(r,403,"text/plain","");
  fs.readFile(f,(e,d)=> e?send(r,404,"text/plain","404"):send(r,200,T[path.extname(f)]||"application/octet-stream",d));
}).listen(Number(process.env.PORT||4410),"127.0.0.1",()=>console.log("ok"));
