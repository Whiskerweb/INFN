// Fabrique le jeu de démonstration du tableau de bord (admin/demo-data.json).
// Les questions et réponses viennent de demo/answers.json (vraies réponses du chatbot) ;
// seuls les horaires, avis, sites et appareils sont simulés. Tout est marqué demo:true.
import fs from "node:fs";
const A = JSON.parse(fs.readFileSync(new URL("./answers.json", import.meta.url), "utf8"));
let seed = 20261108; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = (arr, w) => { const t = w.reduce((s, x) => s + x, 0); let r = rnd() * t; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };
const id = () => Math.floor(rnd() * 2 ** 48).toString(16).padStart(12, "0") + Math.floor(rnd() * 65536).toString(16).padStart(4, "0");
const THEME_W = { "Tarifs et frais": 14, "Admission et candidature": 16, "Financement et rémunération": 12, "Stage et alternance": 9, "Programme et rythme": 9, "Sites et contact": 10, "Examen et validation": 5, "Chiffres clés": 4, "Débouchés et métiers": 5, "Reconnaissance du diplôme": 3, "VAE et expérience": 3, "Autre": 1 };
const qW = A.map(a => (THEME_W[a.theme] || 2) / A.filter(b => b.theme === a.theme).length * (a.answered ? 1 : 0.4));
const SITES = ["Paris", "Lyon", "Bordeaux", "Lille", "Nantes", "Toulouse", "Rennes", "Montpellier", "Aix-en-Provence", "Strasbourg", "Rouen", "Dijon", "Poitiers", "Clermont-Ferrand", "Nîmes", "Territoires ultramarins"];
const SITE_W = [24, 12, 9, 8, 8, 8, 6, 6, 6, 5, 4, 3, 3, 3, 2, 2];
const HOUR_W = [1,0,0,0,0,0,1,3,6,8,8,7,9,8,6,6,6,7,9,12,14,13,9,4];
const END = new Date("2026-11-08T12:00:00Z"), DAYS = 100, events = [];
for (let d = DAYS - 1; d >= 0; d--) {
  const day = new Date(END); day.setUTCDate(day.getUTCDate() - d);
  const dow = (day.getUTCDay() + 6) % 7, growth = 0.7 + 0.45 * (DAYS - d) / DAYS + (day.getUTCMonth() === 8 ? 0.25 : 0);
  const convs = Math.round((dow >= 5 ? 3.2 : dow === 0 || dow === 1 ? 5.2 : 4.4) * growth + rnd() * 2.5);
  for (let c = 0; c < convs; c++) {
    const hour = pick([...Array(24).keys()], HOUR_W), min = Math.floor(rnd() * 60);
    const off = day < new Date("2026-10-25T01:00:00Z") ? 2 : 1;
    let t = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour - off, min, Math.floor(rnd() * 60));
    if (t > Date.UTC(2026, 10, 8, 10, 0)) continue; // rien dans le futur du jeu
    const sid = "demo" + id(), device = rnd() < 0.66 ? "mobile" : "desktop";
    events.push({ v: 1, demo: true, id: id(), ts: new Date(t).toISOString(), type: "open", sid, turn: 0 });
    const n = pick([1, 2, 3, 4], [52, 30, 13, 5]); let first = pick(A, qW), wantSite = false, used = new Set();
    for (let k = 1; k <= n; k++) {
      let a = k === 1 ? first : (rnd() < 0.55 ? pick(A.filter(x => x.theme === first.theme && !used.has(x.q)).concat([first]), null || A.filter(x => x.theme === first.theme && !used.has(x.q)).concat([first]).map(() => 1)) : pick(A, qW));
      if (used.has(a.q)) a = pick(A, qW); used.add(a.q);
      t += (k === 1 ? 4 : 25 + rnd() * 70) * 1000;
      const ms = Math.round(a.ms * (0.8 + rnd() * 0.45)), ttft = Math.round((a.ttft || 700) * (0.8 + rnd() * 0.5));
      events.push({ v: 1, demo: true, id: id(), ts: new Date(t).toISOString(), type: "question", sid, turn: k, q: a.q, a: a.a, sources: a.sources, answered: a.answered, sites: a.sites, theme: a.theme, ms, ttft, device });
      t += ms + 4000;
      if (rnd() < 0.32) events.push({ v: 1, demo: true, id: id(), ts: new Date(t + 3000).toISOString(), type: "feedback", sid, turn: k, value: rnd() < (a.answered ? 0.9 : 0.35) ? "up" : "down" });
      if (a.sites) wantSite = true;
    }
    if (wantSite && rnd() < 0.55) {
      const site = pick(SITES, SITE_W); t += 8000;
      events.push({ v: 1, demo: true, id: id(), ts: new Date(t).toISOString(), type: "site", sid, turn: n, site });
      if (rnd() < 0.5) events.push({ v: 1, demo: true, id: id(), ts: new Date(t + 40000).toISOString(), type: "lead", sid, turn: n, site });
    }
  }
  const extra = Math.round(rnd() * 3); // ouvertures sans question
  for (let e = 0; e < extra; e++) { const h = pick([...Array(24).keys()], HOUR_W); const t = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h - 1, Math.floor(rnd() * 60));
    if (t < Date.UTC(2026, 10, 8, 10, 0)) events.push({ v: 1, demo: true, id: id(), ts: new Date(t).toISOString(), type: "open", sid: "demo" + id(), turn: 0 }); }
}
events.sort((a, b) => a.ts < b.ts ? -1 : 1);
fs.writeFileSync(new URL("../admin/demo-data.json", import.meta.url), JSON.stringify({ generatedAt: "2026-11-08T10:00:00Z", note: "Données de démonstration : questions/réponses réelles du chatbot, trafic simulé.", events }));
const q = events.filter(e => e.type === "question");
console.log(events.length, "événements,", q.length, "questions,", new Set(q.map(e => e.sid)).size, "conversations,", q.filter(e => !e.answered).length, "sans réponse");
