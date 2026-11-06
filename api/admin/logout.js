import { clearCookie, json } from "../../lib/auth.mjs";
export default async function handler(req, res) { json(res, 200, { ok: true }, { "Set-Cookie": clearCookie }); }
