// Cœur du chatbot : prompt (texte de la page DMN uniquement) + appel OpenRouter en streaming.
import fs from "node:fs";
export const MODEL="anthropic/claude-haiku-5.5";
let _c=null; const CORPUS=()=>_c??=fs.readFileSync(new URL("../corpus-dmn.md",import.meta.url),"utf8");
const SYSTEM=()=>`Tu es l'assistant de l'INFN (Institut national des formations notariales) sur la page du Diplôme des métiers du notariat (DMN).
Tu réponds en français, au vouvoiement, de façon chaleureuse, claire et courte (2 à 6 phrases, ou une petite liste).
RÈGLE ABSOLUE : tu réponds UNIQUEMENT à partir du contenu de la page ci-dessous. Tu n'inventes rien : ni chiffre, ni date, ni contact, ni procédure.
Si l'information n'est pas sur la page, dis-le simplement (« Je n'ai pas cette information sur la page du DMN »), puis propose de transmettre la question au site d'enseignement concerné.
Pour les questions de candidature, d'inscription ou de scolarité, rappelle que cela se fait auprès du site d'enseignement choisi.
Mise en forme : Markdown léger seulement (**gras**, listes avec « - », liens [texte](url) uniquement avec les URL présentes dans la page).
À la toute fin de ta réponse, ajoute sur une ligne à part :
[[sources: titre de section 1 | titre de section 2]] avec 1 à 3 titres de sections (lignes « ## ») de la page qui t'ont servi.
Ajoute aussi la ligne [[sites]] si la personne devrait choisir ou contacter un site d'enseignement, ou si tu n'as pas la réponse.
Si l'information demandée n'est PAS sur la page (même partiellement absente pour l'essentiel de la question), ajoute aussi la ligne [[sans-reponse]].

=== CONTENU DE LA PAGE ===
${CORPUS()}`;
const send=(r,code,type,d)=>{r.writeHead(code,{"Content-Type":type,"Cache-Control":"no-store"});r.end(d);};
// Diffuse la réponse au navigateur et renvoie les métadonnées de l'échange (pour le tableau de bord).
export async function chat(raw,r,key){
  const t0=Date.now();
  let body; try{ body=JSON.parse(raw); }catch{ send(r,400,"text/plain","bad json"); return null; }
  const msgs=(Array.isArray(body.messages)?body.messages:[]).slice(-12).map(m=>({role:m.role==="assistant"?"assistant":"user",content:String(m.content).slice(0,2000)}));
  const up=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",
    headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json","X-Title":"Snipia - demo INFN"},
    body:JSON.stringify({model:MODEL,stream:true,temperature:0.2,max_tokens:1200,reasoning:{enabled:false},usage:{include:true},messages:[{role:"system",content:SYSTEM()},...msgs]})});
  if(!up.ok){ const e=await up.text(); console.error("openrouter",up.status,e.slice(0,300)); send(r,502,"text/plain","Le service est momentanément indisponible."); return null; }
  r.writeHead(200,{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store","X-Accel-Buffering":"no"});
  const dec=new TextDecoder(); let buf="", full="", usage=null, ttft=null;
  for await(const chunk of up.body){
    buf+=dec.decode(chunk,{stream:true}); let i;
    while((i=buf.indexOf("\n"))>=0){ const line=buf.slice(0,i).trim(); buf=buf.slice(i+1);
      if(!line.startsWith("data:")) continue; const d=line.slice(5).trim(); if(d==="[DONE]") continue;
      try{ const j=JSON.parse(d); const tx=j.choices?.[0]?.delta?.content; if(j.usage) usage=j.usage;
        if(tx){ if(ttft===null) ttft=Date.now()-t0; full+=tx; r.write(tx); } }catch{} }
  }
  const last=[...msgs].reverse().find(m=>m.role==="user");
  return { q:last?.content||"", raw:full, ms:Date.now()-t0, ttft, model:MODEL,
    tokensIn:usage?.prompt_tokens??null, tokensOut:usage?.completion_tokens??null, cost:usage?.cost??null,
    sid:typeof body.sid==="string"?body.sid.slice(0,40):null, turn:Number.isInteger(body.turn)?body.turn:null };
}
