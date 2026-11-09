// Fabrique le jeu de démonstration du tableau de bord (admin/demo-data.json).
// Les questions et réponses viennent de demo/answers.json (vraies réponses du chatbot) ;
// seuls les horaires, avis, sites, redirections et appareils sont simulés. Tout est marqué demo:true.
// Format compact : les réponses sont stockées une fois (answers) et les événements « question » y renvoient par leur index (ai).
import fs from "node:fs";
const A = JSON.parse(fs.readFileSync(new URL("./answers.json", import.meta.url), "utf8"));
let seed = 20261108; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = (arr, w) => { const t = w.reduce((s, x) => s + x, 0); let r = rnd() * t; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };
const id = () => Math.floor(rnd() * 2 ** 48).toString(16).padStart(12, "0") + Math.floor(rnd() * 65536).toString(16).padStart(4, "0");
const THEME_W = { "Tarifs et frais": 14, "Admission et candidature": 16, "Financement et rémunération": 12, "Stage et alternance": 9, "Programme et rythme": 9, "Sites et contact": 10, "Examen et validation": 5, "Chiffres clés": 4, "Débouchés et métiers": 5, "Reconnaissance du diplôme": 3, "VAE et expérience": 3, "Autre": 1 };
// Saison (mois 0 = janvier) : candidatures au printemps, rentrée et alternance en fin d'été.
const SEASON = { "Admission et candidature": [1, 1.2, 1.6, 1.7, 1.5, 1.1, .8, .7, .8, .9, 1, 1], "Tarifs et frais": [1, 1.1, 1.3, 1.3, 1.2, 1, .9, .9, 1, 1, 1, 1],
  "Programme et rythme": [.8, .8, .9, .9, 1, 1.2, 1.4, 1.6, 1.7, 1.1, .9, .8], "Stage et alternance": [.9, .9, 1, 1, 1.1, 1.4, 1.5, 1.5, 1.3, 1, .9, .9],
  "Financement et rémunération": [.9, 1, 1.1, 1.1, 1.2, 1.4, 1.4, 1.3, 1.2, 1, 1, .9], "Examen et validation": [1, 1, 1, 1.1, 1.4, 1.5, 1, .8, .8, .9, 1, 1] };
const MONTH_VOL = [.85, 1, 1.2, 1.3, 1.25, 1.1, .75, .55, 1.15, 1, .95, .7];
const weights = m => A.map(a => (THEME_W[a.theme] || 2) * ((SEASON[a.theme] || [])[m] || 1) / A.filter(b => b.theme === a.theme).length * (a.answered ? 1 : 0.4));
const QW = Array.from({ length: 12 }, (_, m) => weights(m));
const SITES = ["Paris", "Lyon", "Bordeaux", "Lille", "Nantes", "Toulouse", "Rennes", "Montpellier", "Aix-en-Provence", "Strasbourg", "Rouen", "Dijon", "Poitiers", "Clermont-Ferrand", "Nîmes", "Territoires ultramarins"];
const SITE_W = [24, 12, 9, 8, 8, 8, 6, 6, 6, 5, 4, 3, 3, 3, 2, 2];
const HOUR_W = [1,0,0,0,0,0,1,3,6,8,8,7,9,8,6,6,6,7,9,12,14,13,9,4];
const FOOT = [["Formulaire de demande d'information", 5], ["Page des sites d'enseignement", 3], ["Guide de formation DMN (PDF)", 4]];
const SITE_SLUG = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, "-");
const linkLabel = href => { const p = new URL(href).pathname.toLowerCase();
  if (p.startsWith("/demande-informations")) return "Formulaire de demande d'information";
  if (p.startsWith("/sites-enseignement")) { const slug = p.split("/").filter(Boolean)[1]; const s = slug && SITES.find(x => slug.replace(/^infn-/, "") === SITE_SLUG(x)); return s ? "Page INFN " + s : "Page des sites d'enseignement"; }
  return "Autre page infn.fr"; };
const links = A.map(a => [...a.a.matchAll(/\]\((https?:[^)\s]+)\)/g)].map(x => linkLabel(x[1])));
// heure d'été à Paris : du dernier dimanche de mars au dernier dimanche d'octobre
const lastSun = (y, m) => { const d = new Date(Date.UTC(y, m + 1, 0)); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d; };
const offset = day => { const y = day.getUTCFullYear(); return day >= lastSun(y, 2) && day < lastSun(y, 9) ? 2 : 1; };

const END = new Date("2026-11-08T12:00:00Z"), LIMIT = Date.UTC(2026, 10, 8, 10, 0), DAYS = 430, events = [];
const ev = o => events.push({ v: 1, demo: true, id: id(), ...o });
for (let d = DAYS - 1; d >= 0; d--) {
  const day = new Date(END); day.setUTCDate(day.getUTCDate() - d);
  const dow = (day.getUTCDay() + 6) % 7, m = day.getUTCMonth(), growth = (0.62 + 0.55 * (DAYS - d) / DAYS) * MONTH_VOL[m];
  const convs = Math.round((dow >= 5 ? 3.2 : dow === 0 || dow === 1 ? 5.2 : 4.4) * growth + rnd() * 2.5);
  const qW = QW[m];
  for (let c = 0; c < convs; c++) {
    const hour = pick([...Array(24).keys()], HOUR_W), min = Math.floor(rnd() * 60);
    let t = Date.UTC(day.getUTCFullYear(), m, day.getUTCDate(), hour - offset(day), min, Math.floor(rnd() * 60));
    if (t > LIMIT) continue; // rien dans le futur du jeu
    const sid = "demo" + id(), device = rnd() < 0.66 ? "mobile" : "desktop";
    ev({ ts: new Date(t).toISOString(), type: "open", sid, turn: 0 });
    const n = pick([1, 2, 3, 4], [52, 30, 13, 5]); const first = pick(A, qW); let wantSite = false; const used = new Set();
    for (let k = 1; k <= n; k++) {
      let a = first;
      if (k > 1) { const same = A.filter(x => x.theme === first.theme && !used.has(x.q)); a = rnd() < 0.55 && same.length ? same[Math.floor(rnd() * same.length)] : pick(A, qW); }
      if (used.has(a.q)) a = pick(A, qW); used.add(a.q);
      t += (k === 1 ? 4 : 25 + rnd() * 70) * 1000;
      const ms = Math.round(a.ms * (0.8 + rnd() * 0.45)), ttft = Math.round((a.ttft || 700) * (0.8 + rnd() * 0.5));
      ev({ ts: new Date(t).toISOString(), type: "question", sid, turn: k, ai: A.indexOf(a), ms, ttft, device });
      t += ms + 4000;
      if (rnd() < 0.32) ev({ ts: new Date(t + 3000).toISOString(), type: "feedback", sid, turn: k, value: rnd() < (a.answered ? 0.9 : 0.35) ? "up" : "down" });
      if (a.sources?.length && rnd() < 0.3) { t += 6000; ev({ ts: new Date(t).toISOString(), type: "redirect", sid, turn: k, kind: "section", target: a.sources[Math.floor(rnd() * a.sources.length)] }); }
      const L = links[A.indexOf(a)]; if (L.length && rnd() < 0.35) { t += 5000; ev({ ts: new Date(t).toISOString(), type: "redirect", sid, turn: k, kind: "lien", target: L[Math.floor(rnd() * L.length)] }); }
      if (a.sites) wantSite = true;
    }
    if (rnd() < 0.08) { t += 7000; ev({ ts: new Date(t).toISOString(), type: "redirect", sid, turn: n, kind: "lien", target: pick(FOOT.map(f => f[0]), FOOT.map(f => f[1])) }); }
    if (wantSite && rnd() < 0.55) {
      const site = pick(SITES, SITE_W); t += 8000;
      ev({ ts: new Date(t).toISOString(), type: "site", sid, turn: n, site });
      if (rnd() < 0.5) ev({ ts: new Date(t + 40000).toISOString(), type: "lead", sid, turn: n, site });
    }
  }
  const extra = Math.round(rnd() * 3); // ouvertures sans question
  for (let e = 0; e < extra; e++) { const h = pick([...Array(24).keys()], HOUR_W); const t = Date.UTC(day.getUTCFullYear(), m, day.getUTCDate(), h - 1, Math.floor(rnd() * 60));
    if (t < LIMIT) ev({ ts: new Date(t).toISOString(), type: "open", sid: "demo" + id(), turn: 0 }); }
}
events.sort((a, b) => a.ts < b.ts ? -1 : 1);
const answers = A.map(a => ({ q: a.q, a: a.a, sources: a.sources, answered: a.answered, sites: a.sites, theme: a.theme }));
fs.writeFileSync(new URL("../admin/demo-data.json", import.meta.url), JSON.stringify({ generatedAt: "2026-11-08T10:00:00Z", note: "Données de démonstration : questions/réponses réelles du chatbot, trafic simulé.", answers, events }));
const q = events.filter(e => e.type === "question"), cnt = t => events.filter(e => e.type === t).length;
console.log(events.length, "événements,", q.length, "questions,", new Set(q.map(e => e.sid)).size, "conversations,", q.filter(e => !A[e.ai].answered).length, "sans réponse,", cnt("redirect"), "redirections,", cnt("site"), "sites,", cnt("lead"), "contacts");
