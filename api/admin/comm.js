// POST /api/admin/comm : idées de newsletter et de posts à partir des questions récentes (réservé à l'admin).
// Le tableau de bord envoie un résumé des questions ; l'IA n'utilise que les faits de la page DMN.
import fs from "node:fs";
import { isAdmin, json, readBody } from "../../lib/auth.mjs";
import { MODEL } from "../../lib/chat-core.mjs";
export const config = { maxDuration: 60 };
const CORPUS = () => fs.readFileSync(new URL("../../corpus-dmn.md", import.meta.url), "utf8");
const SCHEMA = `{
 "resume": "2 phrases : ce que les candidats cherchent en ce moment",
 "themes": [ { "theme": "...", "signal": "chiffres du résumé, ex. 42 questions, 38 % sans réponse", "constat": "ce qui est mal compris ou introuvable", "a_ajouter": "information précise à ajouter sur la page (FAQ)", "priorite": "haute|moyenne|basse" } ],
 "newsletter": [ { "titre": "idée de sujet", "angle": "pourquoi maintenant, pour qui", "objets": ["3 variantes d'objet d'e-mail"], "plan": ["3 à 5 points du contenu"], "cta": "appel à l'action" } ],
 "posts": [ { "reseau": "LinkedIn|Instagram|Facebook", "sujet": "...", "texte": "post prêt à publier", "visuel": "idée de visuel" } ],
 "faq": [ { "question": "question telle que posée par les candidats", "reponse": "réponse courte tirée de la page, ou [À compléter par l'équipe : …]" } ]
}`;
export default async function handler(req, res) {
  if (!isAdmin(req)) return json(res, 401, { error: "auth" });
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  let digest; try { digest = JSON.parse(await readBody(req)).digest; } catch { return json(res, 400, { error: "json" }); }
  const d = JSON.stringify(digest || {}).slice(0, 20000);
  const prompt = `Tu es responsable de la communication de l'INFN (Institut national des formations notariales). Une newsletter externe sort en janvier.
À partir du résumé des questions posées par les visiteurs à l'assistant de la page « Diplôme des métiers du notariat (DMN) », propose :
1) les 3 à 5 thèmes que les candidats comprennent mal ou ne trouvent pas (priorité aux questions sans réponse et aux avis négatifs) ;
2) 3 idées de newsletter, chacune avec 3 variantes d'objet ;
3) 6 posts réseaux sociaux (2 LinkedIn, 2 Instagram, 2 Facebook), ton institutionnel mais chaleureux, avec emojis sobres sur Instagram/Facebook ;
4) 5 à 8 questions pour une FAQ à ajouter sur la page.
RÈGLES ABSOLUES :
- Les faits (chiffres, dates, montants, conditions) viennent UNIQUEMENT de la page ci-dessous. N'invente rien.
- Si un contenu nécessite une information absente de la page, écris [À compléter par l'équipe : …] à la place.
- Ne cite jamais de nom de candidat, n'invente aucun témoignage.
- Français, vouvoiement. Réponds UNIQUEMENT avec un objet JSON valide qui suit ce schéma :
${SCHEMA}

=== RÉSUMÉ DES QUESTIONS (période : ${digest?.periode || "?"}) ===
${d}

=== CONTENU DE LA PAGE DMN ===
${CORPUS()}`;
  const str = { type: "string" }, arr = items => ({ type: "array", items });
  const obj = props => ({ type: "object", additionalProperties: false, required: Object.keys(props), properties: props });
  const schema = obj({
    resume: str,
    themes: arr(obj({ theme: str, signal: str, constat: str, a_ajouter: str, priorite: { type: "string", enum: ["haute", "moyenne", "basse"] } })),
    newsletter: arr(obj({ titre: str, angle: str, objets: arr(str), plan: arr(str), cta: str })),
    posts: arr(obj({ reseau: { type: "string", enum: ["LinkedIn", "Instagram", "Facebook"] }, sujet: str, texte: str, visuel: str })),
    faq: arr(obj({ question: str, reponse: str })),
  });
  const call = async () => {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST",
      headers: { "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json", "X-Title": "Snipia - demo INFN (com)" },
      body: JSON.stringify({ model: MODEL, temperature: 0.6, max_tokens: 6000, reasoning: { enabled: false },
        response_format: { type: "json_schema", json_schema: { name: "idees_com", strict: true, schema } },
        messages: [{ role: "user", content: prompt }] }) });
    if (!r.ok) throw new Error("ia " + r.status + " " + (await r.text()).slice(0, 200));
    const txt = (await r.json()).choices?.[0]?.message?.content || "";
    const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
    return JSON.parse(txt.slice(s, e + 1));
  };
  try {
    let out; try { out = await call(); } catch (e) { console.error("comm (1re tentative)", e.message); out = await call(); }
    json(res, 200, { ok: true, generatedAt: new Date().toISOString(), ...out });
  } catch (e) { console.error("comm", e.message); json(res, 500, { error: "format" }); }
}
