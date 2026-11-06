// Fonction Vercel : POST /api/chat → réponse en streaming (clé dans la variable OPENROUTER_API_KEY).
import { chat } from "../lib/chat-core.mjs";
export const config = { maxDuration: 30 };
export default async function handler(req, res) {
  if (req.method !== "POST") { res.statusCode = 405; return res.end("Method not allowed"); }
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) { res.statusCode = 500; return res.end("OPENROUTER_API_KEY manquante"); }
  let raw = "";
  if (req.body !== undefined) raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  else for await (const c of req) raw += c;
  if (raw.length > 30000) { res.statusCode = 413; return res.end("Trop long"); }
  await chat(raw, res, key);
}
