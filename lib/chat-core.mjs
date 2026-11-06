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

=== CONTENU DE LA PAGE ===
${CORPUS()}`;
const send=(r,code,type,d)=>{r.writeHead(code,{"Content-Type":type,"Cache-Control":"no-store"});r.end(d);};
export async function chat(raw,r,key){
  let msgs; try{ msgs=JSON.parse(raw).messages; }catch{ return send(r,400,"text/plain","bad json"); }
  msgs=(Array.isArray(msgs)?msgs:[]).slice(-12).map(m=>({role:m.role==="assistant"?"assistant":"user",content:String(m.content).slice(0,2000)}));
  const up=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",
    headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json","X-Title":"Snipia - demo INFN"},
    body:JSON.stringify({model:MODEL,stream:true,temperature:0.2,max_tokens:1200,reasoning:{enabled:false},messages:[{role:"system",content:SYSTEM()},...msgs]})});
  if(!up.ok){ const e=await up.text(); console.error("openrouter",up.status,e.slice(0,300)); return send(r,502,"text/plain","Le service est momentanément indisponible."); }
  r.writeHead(200,{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store","X-Accel-Buffering":"no"});
  const dec=new TextDecoder(); let buf="";
  for await(const chunk of up.body){
    buf+=dec.decode(chunk,{stream:true}); let i;
    while((i=buf.indexOf("\n"))>=0){ const line=buf.slice(0,i).trim(); buf=buf.slice(i+1);
      if(!line.startsWith("data:")) continue; const d=line.slice(5).trim(); if(d==="[DONE]") continue;
      try{ const tx=JSON.parse(d).choices?.[0]?.delta?.content; if(tx) r.write(tx); }catch{} }
  }
  r.end();
}
