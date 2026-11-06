// POST /api/event : site choisi, demande de contact (sans données personnelles), avis 👍/👎.
import { saveEvent } from "../lib/store.mjs";
import { readBody, json } from "../lib/auth.mjs";
const SITES = ["Aix-en-Provence","Bordeaux","Clermont-Ferrand","Dijon","Lille","Lyon","Montpellier","Nantes","Nîmes","Paris","Poitiers","Rennes","Rouen","Strasbourg","Toulouse","Territoires ultramarins"];
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  let b; try { b = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: "json" }); }
  const sid = typeof b.sid === "string" ? b.sid.slice(0, 40) : null;
  const ev = { sid, turn: Number.isInteger(b.turn) ? b.turn : null };
  if (b.type === "site" || b.type === "lead") { if (!SITES.includes(b.site)) return json(res, 400, { error: "site" }); Object.assign(ev, { type: b.type, site: b.site }); }
  else if (b.type === "feedback") { if (!["up","down"].includes(b.value)) return json(res, 400, { error: "value" }); Object.assign(ev, { type: "feedback", value: b.value }); }
  else if (b.type === "open") { ev.type = "open"; }
  else return json(res, 400, { error: "type" });
  try { await saveEvent(ev); } catch (e) { console.error(e.message); return json(res, 500, { error: "store" }); }
  json(res, 200, { ok: true });
}
