// POST /api/chat → réponse en streaming, puis enregistrement de l'échange pour le tableau de bord.
import { chat } from "../lib/chat-core.mjs";
import { saveEvent } from "../lib/store.mjs";
import { themeOf, parseAnswer } from "../lib/classify.mjs";
import { readBody } from "../lib/auth.mjs";
export const config = { maxDuration: 30 };
export default async function handler(req, res) {
  if (req.method !== "POST") { res.statusCode = 405; return res.end("Method not allowed"); }
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) { res.statusCode = 500; return res.end("OPENROUTER_API_KEY manquante"); }
  const raw = await readBody(req);
  if (raw.length > 30000) { res.statusCode = 413; return res.end("Trop long"); }
  const meta = await chat(raw, res, key);
  if (meta) {
    const a = parseAnswer(meta.raw);
    const ua = String(req.headers["user-agent"] || "");
    try {
      await saveEvent({ type: "question", sid: meta.sid, turn: meta.turn, q: meta.q.slice(0, 1000), a: a.visible.slice(0, 4000),
        sources: a.sources, answered: a.answered, sites: a.sites, theme: themeOf(meta.q, a.sources),
        ms: meta.ms, ttft: meta.ttft, model: meta.model,
        device: /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop" });
    } catch (e) { console.error("saveEvent", e.message); }
  }
  res.end();
}
