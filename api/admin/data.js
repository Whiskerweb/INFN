// GET /api/admin/data : tous les événements (réservé à l'admin). Les statistiques sont calculées dans le tableau de bord.
import { isAdmin, json } from "../../lib/auth.mjs";
import { listEvents } from "../../lib/store.mjs";
export const config = { maxDuration: 30 };
export default async function handler(req, res) {
  if (!isAdmin(req)) return json(res, 401, { error: "auth" });
  const events = await listEvents({ limit: 5000 });
  json(res, 200, { now: new Date().toISOString(), events });
}
