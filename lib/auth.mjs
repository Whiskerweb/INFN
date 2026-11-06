// Accès /admin : mot de passe (ADMIN_PASSWORD, « INFN » par défaut) puis cookie signé HttpOnly valable 12 h.
import crypto from "node:crypto";
const PASS=()=>process.env.ADMIN_PASSWORD||"INFN";
const SECRET=()=>process.env.ADMIN_SECRET||crypto.createHash("sha256").update("infn-admin|"+(process.env.BLOB_READ_WRITE_TOKEN||process.env.OPENROUTER_API_KEY||"local")).digest("hex");
const sign=v=>crypto.createHmac("sha256",SECRET()).update(v).digest("base64url");
const eq=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b)); return x.length===y.length&&crypto.timingSafeEqual(x,y);};
export const checkPassword=p=>eq(p,PASS());
export function sessionCookie(secure){
  const exp=Date.now()+12*3600e3, v=`admin.${exp}`;
  return `infn_admin=${v}.${sign(v)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${12*3600}${secure?"; Secure":""}`;
}
export const clearCookie="infn_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0";
export function isAdmin(req){
  const m=(req.headers.cookie||"").match(/(?:^|;\s*)infn_admin=([^;]+)/); if(!m) return false;
  const parts=m[1].split("."); if(parts.length!==3) return false;
  const v=parts[0]+"."+parts[1]; return eq(parts[2],sign(v)) && Number(parts[1])>Date.now();
}
export async function readBody(req){
  if(req.body!==undefined) return typeof req.body==="string"?req.body:JSON.stringify(req.body);
  let raw=""; for await(const c of req){ raw+=c; if(raw.length>40000) break; } return raw;
}
export const json=(res,code,obj,headers={})=>{ res.writeHead(code,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers}); res.end(JSON.stringify(obj)); };
export const isSecure=req=>(req.headers["x-forwarded-proto"]||"").includes("https");
