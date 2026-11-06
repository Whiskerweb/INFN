import { checkPassword, sessionCookie, readBody, json, isSecure } from "../../lib/auth.mjs";
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  let p = ""; try { p = JSON.parse(await readBody(req)).password || ""; } catch {}
  if (!checkPassword(p)) { await new Promise(r => setTimeout(r, 600)); return json(res, 401, { error: "Mot de passe incorrect" }); }
  json(res, 200, { ok: true }, { "Set-Cookie": sessionCookie(isSecure(req)) });
}
