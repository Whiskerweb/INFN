// Journal des échanges : Vercel Blob privé (production) ou fichier local data/events.jsonl (développement).
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import { fileURLToPath } from "node:url";
const LOCAL=path.join(path.dirname(fileURLToPath(import.meta.url)),"..","data","events.jsonl");
const useBlob=()=>!!process.env.BLOB_READ_WRITE_TOKEN && !process.env.LOCAL_STORE;
export const newId=()=>crypto.randomBytes(8).toString("hex");

export async function saveEvent(ev){
  ev={v:1,id:newId(),ts:new Date().toISOString(),...ev};
  if(useBlob()){
    const { put }=await import("@vercel/blob");
    await put(`events/${ev.ts.slice(0,10)}/${ev.ts.replace(/[:.]/g,"-")}-${ev.id}.json`,JSON.stringify(ev),
      {access:"private",contentType:"application/json",addRandomSuffix:false,allowOverwrite:false});
  } else {
    fs.mkdirSync(path.dirname(LOCAL),{recursive:true}); fs.appendFileSync(LOCAL,JSON.stringify(ev)+"\n");
  }
  return ev;
}

// Lecture : chaque événement est un petit fichier JSON ; on garde en mémoire ceux déjà lus.
const cache=new Map();
export async function listEvents({limit=5000}={}){
  if(!useBlob()){
    if(!fs.existsSync(LOCAL)) return [];
    return fs.readFileSync(LOCAL,"utf8").split("\n").filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean).slice(-limit);
  }
  const { list, get }=await import("@vercel/blob");
  const blobs=[]; let cursor;
  do{ const r=await list({prefix:"events/",cursor,limit:1000}); blobs.push(...r.blobs); cursor=r.hasMore?r.cursor:undefined; }while(cursor&&blobs.length<limit);
  blobs.sort((a,b)=>a.pathname<b.pathname?1:-1);
  const todo=blobs.slice(0,limit).filter(b=>!cache.has(b.pathname));
  let i=0; const worker=async()=>{ while(i<todo.length){ const b=todo[i++];
    try{ const g=await get(b.pathname,{access:"private"}); const txt=await new Response(g.stream).text(); cache.set(b.pathname,JSON.parse(txt)); }catch(e){ console.error("blob get",b.pathname,e.message); } } };
  await Promise.all(Array.from({length:Math.min(16,todo.length)},worker));
  return blobs.slice(0,limit).map(b=>cache.get(b.pathname)).filter(Boolean).reverse();
}
