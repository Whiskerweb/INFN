// Fait répondre le vrai chatbot (texte de la page uniquement) à chaque question de démo.
import fs from "node:fs";
import { chat } from "../lib/chat-core.mjs";
import { themeOf, parseAnswer } from "../lib/classify.mjs";
const qs = fs.readFileSync(new URL("./questions.txt", import.meta.url), "utf8").split("\n").map(s => s.trim()).filter(Boolean);
const out = []; let i = 0;
const fakeRes = () => { let s = ""; return { writeHead() {}, write(t) { s += t; }, end(t) { if (t) s += t; }, get text() { return s; } }; };
async function worker() {
  while (i < qs.length) { const q = qs[i++]; const r = fakeRes();
    const meta = await chat(JSON.stringify({ messages: [{ role: "user", content: q }] }), r, process.env.OPENROUTER_API_KEY);
    if (!meta) { console.error("échec", q); continue; }
    const a = parseAnswer(meta.raw);
    out.push({ q, a: a.visible, sources: a.sources, answered: a.answered, sites: a.sites, theme: themeOf(q, a.sources), ms: meta.ms, ttft: meta.ttft });
    process.stdout.write("."); }
}
await Promise.all(Array.from({ length: 6 }, worker));
fs.writeFileSync(new URL("./answers.json", import.meta.url), JSON.stringify(out, null, 1));
console.log("\n", out.length, "réponses,", out.filter(x => !x.answered).length, "sans réponse");
