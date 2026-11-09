/* Tableau de bord — Assistant IA INFN (DMN). Toutes les statistiques sont calculées ici à partir du journal des échanges. */
(() => {
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nf = new Intl.NumberFormat("fr-FR");
const pf = v => nf.format(Math.round(v)) + " %";
const TZ = "Europe/Paris";
const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const C_OK = "#1E4FD8", C_KO = "#F29A1F";
// Redirections : 3 catégories (palette validée ; libellés toujours visibles)
const RCAT = { section: { l: "Sections de la page", c: "#1E4FD8" }, lien: { l: "Pages et documents INFN", c: "#1BAF7A" }, site: { l: "Sites d'enseignement", c: "#E87BA4" } };
const HEAT = ["#F1F4FA", "#D6E2FF", "#A9C1FB", "#6F95F2", "#3A64DB", "#03256C"];

const I = {
  q: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z"/></svg>',
  spark2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
};

/* ---------- Dates (heure de Paris) ---------- */
const fmtParts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short" });
const WD = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
function parts(ts) {
  const o = {}; for (const p of fmtParts.formatToParts(new Date(ts))) o[p.type] = p.value;
  return { key: `${o.year}-${o.month}-${o.day}`, dow: WD[o.weekday], hour: +o.hour % 24 };
}
const keyToDate = k => new Date(k + "T12:00:00Z");
const addDays = (k, n) => { const d = keyToDate(k); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dayLabel = (k, opt = { day: "numeric", month: "short" }) => keyToDate(k).toLocaleDateString("fr-FR", { ...opt, timeZone: "UTC" });
const fullDate = ts => new Date(ts).toLocaleString("fr-FR", { timeZone: TZ, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const shortDate = ts => { const p = parts(ts), today = parts(Date.now()).key;
  const t = new Date(ts).toLocaleTimeString("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  if (p.key === today) return "Aujourd'hui, " + t; if (p.key === addDays(today, -1)) return "Hier, " + t;
  return dayLabel(p.key) + ", " + t; };
const offHours = p => p.dow >= 5 || p.hour < 9 || p.hour >= 18;
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const sec = ms => ms == null ? "—" : (ms / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + " s";

/* ---------- État ---------- */
const S = { events: [], real: [], demo: null, mode: "real", cp: "m1", now: Date.now(), period: 7, view: "overview", f: { q: "", theme: "", status: "", fb: "" }, page: 0, loadedAt: null };
try { const s = JSON.parse(localStorage.getItem("infn-admin-ui") || "{}"); if (s.period != null) S.period = s.period; if (s.mode) { S.mode = s.mode; S.modeChosen = true; } } catch {}
try { const c = JSON.parse(localStorage.getItem("infn-admin-ui") || "{}").cp; if (c && ["d7", "m1", "q"].includes(c)) S.cp = c; } catch {}
const saveUI = () => { try { localStorage.setItem("infn-admin-ui", JSON.stringify({ period: S.period, mode: S.mode, cp: S.cp })); } catch {} };

function model() {
  const qs = [], fb = new Map(), sitesBySid = new Map(), leadsBySid = new Map();
  for (const e of S.events) {
    if (e.type === "question") qs.push(e);
    else if (e.type === "feedback") fb.set(e.sid + "|" + e.turn, e.value);
    else if (e.type === "site") sitesBySid.set(e.sid, e.site);
    else if (e.type === "lead") leadsBySid.set(e.sid, e.site);
  }
  for (const q of qs) { q._p = parts(q.ts); q._fb = fb.get(q.sid + "|" + q.turn) || null; q._site = leadsBySid.get(q.sid) || sitesBySid.get(q.sid) || null; q._lead = leadsBySid.has(q.sid); }
  qs.sort((a, b) => a.ts < b.ts ? 1 : -1);
  return qs;
}
function range() {
  const today = parts(S.now).key;
  if (S.period > 0) return { start: addDays(today, -(S.period - 1)), end: today, prevStart: addDays(today, -(2 * S.period - 1)), prevEnd: addDays(today, -S.period), days: S.period };
  const all = S.events.map(e => parts(e.ts).key).sort(); const start = all[0] || today;
  const days = Math.round((keyToDate(today) - keyToDate(start)) / 864e5) + 1;
  return { start, end: today, prevStart: null, prevEnd: null, days };
}
const inR = (k, a, b) => a && k >= a && k <= b;

/* ---------- Calculs ---------- */
function stats() {
  const all = model(), R = range();
  const cur = all.filter(q => inR(q._p.key, R.start, R.end));
  const prev = R.prevStart ? all.filter(q => inR(q._p.key, R.prevStart, R.prevEnd)) : null;
  const evIn = t => S.events.filter(e => e.type === t && inR(parts(e.ts).key, R.start, R.end));
  const evPrev = t => R.prevStart ? S.events.filter(e => e.type === t && inR(parts(e.ts).key, R.prevStart, R.prevEnd)) : null;
  const convs = l => new Set(l.map(q => q.sid || q.id)).size;
  const rate = l => l.length ? 100 * l.filter(q => q.answered).length / l.length : null;
  const off = l => l.length ? 100 * l.filter(q => offHours(q._p)).length / l.length : null;
  const tr = l => l ? new Set(l.map(e => e.sid)).size : null;
  const sitesCur = [...evIn("site"), ...evIn("lead")], sitesPrev = R.prevStart ? [...evPrev("site"), ...evPrev("lead")] : null;

  // série journalière (ou hebdomadaire au-delà de 60 jours)
  const weekly = R.days > 60, buckets = [];
  if (!weekly) for (let i = 0; i < R.days; i++) { const k = addDays(R.start, i); buckets.push({ k, from: k, to: k, ok: 0, ko: 0 }); }
  else { let k = R.start; while (k <= R.end) { const to = addDays(k, 6) > R.end ? R.end : addDays(k, 6); buckets.push({ k, from: k, to, ok: 0, ko: 0 }); k = addDays(k, 7); } }
  for (const q of cur) { const b = buckets.find(b => q._p.key >= b.from && q._p.key <= b.to); if (b) q.answered ? b.ok++ : b.ko++; }

  const count = (l, f) => { const m = new Map(); for (const x of l) { const v = f(x); if (v == null) continue; for (const y of [].concat(v)) m.set(y, (m.get(y) || 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]); };
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0)); for (const q of cur) heat[q._p.dow][q._p.hour]++;
  const fbs = cur.filter(q => q._fb), up = fbs.filter(q => q._fb === "up").length;
  const siteConv = new Map(); for (const e of sitesCur) { const s = siteConv.get(e.site) || new Set(); s.add(e.sid); siteConv.set(e.site, s); }

  const redir = (a, b) => { const l = S.events.filter(e => (e.type === "redirect" || e.type === "site") && inR(parts(e.ts).key, a, b)), by = { section: 0, lien: 0, site: 0 }, m = new Map();
    for (const e of l) { const k = e.type === "site" ? "site" : e.kind === "section" ? "section" : "lien", t = e.type === "site" ? "INFN " + e.site : e.target; by[k]++; const o = m.get(k + "|" + t) || { t, k, n: 0 }; o.n++; m.set(k + "|" + t, o); }
    return { n: l.length, by, top: [...m.values()].sort((x, y) => y.n - x.n), convs: new Set(l.map(e => e.sid)).size }; };
  const rd = redir(R.start, R.end), rdPrev = R.prevStart ? redir(R.prevStart, R.prevEnd) : null;

  return {
    R, all, cur, prev, weekly, buckets, rd, rdPrev,
    q: cur.length, qPrev: prev?.length ?? null,
    conv: convs(cur), convPrev: prev ? convs(prev) : null,
    rate: rate(cur), ratePrev: prev ? rate(prev) : null,
    off: off(cur), offPrev: prev ? off(prev) : null,
    transmitted: tr(sitesCur), transmittedPrev: tr(sitesPrev), leads: new Set(evIn("lead").map(e => e.sid)).size,
    opens: new Set(evIn("open").map(e => e.sid)).size,
    themes: count(cur, q => q.theme || "Autre"),
    sections: count(cur, q => q.sources?.length ? q.sources : null),
    sites: [...siteConv.entries()].map(([k, v]) => [k, v.size]).sort((a, b) => b[1] - a[1]),
    devices: count(cur, q => q.device || "desktop"),
    heat, up, down: fbs.length - up, fbN: fbs.length,
    ms: median(cur.map(q => q.ms).filter(Number.isFinite)), ttft: median(cur.map(q => q.ttft).filter(Number.isFinite)),
    themeRows: (() => { const m = new Map(); for (const q of cur) { const k = q.theme || "Autre"; const r = m.get(k) || { theme: k, n: 0, ok: 0, fb: 0, up: 0 }; r.n++; if (q.answered) r.ok++; if (q._fb) { r.fb++; if (q._fb === "up") r.up++; } m.set(k, r); }
      return [...m.values()].map(r => ({ ...r, rate: 100 * r.ok / r.n })).sort((a, b) => b.n - a.n); })(),
    srcAvg: cur.length ? cur.reduce((s, q) => s + (q.sources?.length || 0), 0) / cur.length : null, unanswered: cur.filter(q => !q.answered),
  };
}

/* ---------- Petits composants ---------- */
function delta(cur, prev, { pts = false, invert = false } = {}) {
  if (prev == null || cur == null) return '<span class="delta flat">—</span>';
  let d, txt;
  if (pts) { d = cur - prev; txt = (d > 0 ? "+" : "") + nf.format(Math.round(d)) + " pt"; }
  else { if (!prev) return cur ? '<span class="delta up">nouveau</span>' : '<span class="delta flat">0 %</span>'; d = 100 * (cur - prev) / prev; txt = (d > 0 ? "+" : "") + nf.format(Math.round(d)) + " %"; }
  const cls = Math.abs(d) < 0.5 ? "flat" : ((d > 0) !== invert ? "up" : "down");
  const arrow = cls === "flat" ? "" : (d > 0 ? "↑ " : "↓ ");
  return `<span class="delta ${cls}">${arrow}${txt}</span>`;
}
function spark(vals, color = "#1E4FD8") {
  if (!vals.length) return "";
  const w = 74, h = 26, max = Math.max(1, ...vals), n = vals.length;
  const pts = vals.map((v, i) => [n === 1 ? w : (i * w) / (n - 1), h - 2 - (v / max) * (h - 4)]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d} L${w} ${h} L0 ${h}Z" fill="${color}" opacity=".08"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const tip = $("#tip");
function showTip(html, ev) {
  tip.innerHTML = html; tip.classList.add("show");
  const r = tip.getBoundingClientRect(); let x = ev.clientX + 14, y = ev.clientY - r.height - 12;
  if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14; if (y < 8) y = ev.clientY + 16;
  tip.style.left = x + "px"; tip.style.top = y + "px";
}
const hideTip = () => tip.classList.remove("show");
const toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2200); };
const statusBadge = q => q.answered ? `<span class="badge ok">${I.check}Répondue</span>` : `<span class="badge ko">${I.alert}Sans réponse</span>`;
const fbIcon = v => v === "up" ? '<span class="fb" title="Utile">👍</span>' : v === "down" ? '<span class="fb" title="Pas utile">👎</span>' : '<span style="color:var(--faint)">—</span>';
function md(src) {
  const lines = esc(src).split("\n"); let out = "", list = false;
  const inl = s => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  for (const l of lines) { const m = l.match(/^\s*[-•*]\s+(.*)/); if (m) { if (!list) { out += "<ul>"; list = true; } out += "<li>" + inl(m[1]) + "</li>"; continue; } if (list) { out += "</ul>"; list = false; } out += l.trim() ? inl(l) + "<br>" : "<br>"; }
  if (list) out += "</ul>"; return out.replace(/(<br>)+$/, "");
}
function rankList(items, total, { click } = {}) {
  if (!items.length) return emptyMini();
  const max = items[0][1];
  return `<div class="rank">${items.map(([n, v]) => `<div class="it${click ? " click" : ""}" ${click ? `data-${click}="${esc(n)}"` : ""}>
    <span class="n" title="${esc(n)}">${esc(n)}</span><span class="v"><b>${nf.format(v)}</b>${total ? pf(100 * v / total) : ""}</span>
    <span class="bar"><i style="width:${(100 * v / max).toFixed(1)}%"></i></span></div>`).join("")}</div>`;
}
const emptyMini = () => `<div class="empty" style="padding:24px 10px"><small>Pas encore de données sur la période.</small></div>`;

/* ---------- Graphique : questions par jour (barres empilées) ---------- */
function dailyChart(st) {
  const B = st.buckets, W = 600, H = 300, padL = 34, padB = 26, padT = 10, iw = W - padL - 6, ih = H - padB - padT;
  const max = Math.max(4, ...B.map(b => b.ok + b.ko)), step = niceStep(max), top = Math.ceil(max / step) * step;
  const y = v => padT + ih - (v / top) * ih, bw = iw / B.length, w = Math.max(3, Math.min(30, bw * 0.62));
  let g = "";
  for (let v = 0; v <= top; v += step) g += `<line class="gridline" x1="${padL}" x2="${W - 6}" y1="${y(v)}" y2="${y(v)}"/><text x="${padL - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const every = Math.ceil(B.length / 7);
  let bars = "", labels = "", hits = "";
  B.forEach((b, i) => {
    const cx = padL + bw * i + bw / 2, x = cx - w / 2, tot = b.ok + b.ko;
    if (b.ok) { const yt = y(b.ok), hh = y(0) - yt; bars += `<path d="${roundTop(x, yt, w, hh, b.ko ? 0 : 4)}" fill="${C_OK}"/>`; }
    if (b.ko) { const y0 = y(b.ok) - (b.ok ? 2 : 0), yt = y(tot), hh = Math.max(1, y0 - yt); bars += `<path d="${roundTop(x, yt, w, hh, 4)}" fill="${C_KO}"/>`; }
    if (i % every === 0 || i === B.length - 1 && B.length < 12) labels += `<text x="${cx}" y="${H - 6}" text-anchor="middle">${st.weekly ? "sem. " + dayLabel(b.from) : dayLabel(b.k, B.length > 14 ? { day: "numeric", month: "short" } : { weekday: "short", day: "numeric" })}</text>`;
    hits += `<rect class="hit" data-i="${i}" x="${padL + bw * i}" y="${padT}" width="${bw}" height="${ih}"/>`;
  });
  return `<div class="chart" id="daily"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Questions par jour, répondues et sans réponse">
    <g class="axis">${g}${labels}</g><rect id="dailyHl" class="col-hl" x="0" y="${padT}" width="0" height="${ih}"/>${bars}<line class="baseline" x1="${padL}" x2="${W - 6}" y1="${y(0)}" y2="${y(0)}"/>${hits}</svg></div>`;
}
const niceStep = m => { const raw = m / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p; return Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p); };
const roundTop = (x, y, w, h, r) => { r = Math.min(r, w / 2, h); return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`; };
function bindDaily(st) {
  const el = $("#daily"); if (!el) return; const hl = el.querySelector("#dailyHl");
  el.querySelectorAll(".hit").forEach(h => {
    h.addEventListener("mousemove", ev => { const b = st.buckets[+h.dataset.i]; hl.setAttribute("x", h.getAttribute("x")); hl.setAttribute("width", h.getAttribute("width"));
      const tot = b.ok + b.ko, title = st.weekly ? `Semaine du ${dayLabel(b.from)}` : dayLabel(b.k, { weekday: "long", day: "numeric", month: "long" });
      showTip(`<b>${title}</b><div class="row"><i style="background:${C_OK}"></i>Répondues<span>${b.ok}</span></div><div class="row"><i style="background:${C_KO}"></i>Sans réponse<span>${b.ko}</span></div><div class="row" style="opacity:.7">Total<span>${tot}</span></div>`, ev); });
    h.addEventListener("mouseleave", () => { hideTip(); hl.setAttribute("width", 0); });
  });
}

/* ---------- Graphique : redirections (anneau par catégorie + destinations) ---------- */
function redirChart(st) {
  const R = st.rd; if (!R.n) return `<div class="empty" style="padding:30px 10px"><small>Aucune redirection sur la période.</small></div>`;
  const r = 52, C = 2 * Math.PI * r, gap = 3; let off = 0, segs = "";
  for (const [k, v] of Object.entries(RCAT)) { const n = R.by[k]; if (!n) continue; const len = Math.max(0, C * n / R.n - gap);
    segs += `<circle class="seg-arc" data-k="${k}" cx="70" cy="70" r="${r}" fill="none" stroke="${v.c}" stroke-width="18" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 70 70)"/>`; off += C * n / R.n; }
  const top = R.top.slice(0, 5), max = top[0]?.n || 1, conv = st.conv ? Math.round(100 * R.convs / st.conv) : null;
  return `<div class="redir">
    <svg class="donut" viewBox="0 0 140 140" role="img" aria-label="Répartition des redirections">${segs}
      <text x="70" y="68" text-anchor="middle" class="d-v">${nf.format(R.n)}</text><text x="70" y="86" text-anchor="middle" class="d-l">redirections</text></svg>
    <div class="redir-leg">${Object.entries(RCAT).map(([k, v]) => `<div class="rl" data-k="${k}"><i style="background:${v.c}"></i><span>${v.l}</span><b class="num">${nf.format(R.by[k])}</b><small class="num">${pf(100 * R.by[k] / R.n)}</small></div>`).join("")}
      ${conv != null ? `<p class="redir-note"><b>${conv} %</b> des conversations mènent à au moins une redirection${st.leads ? ` · <b>${st.leads}</b> contact(s) transmis` : ""}</p>` : ""}</div>
  </div>
  <div class="redir-top"><small class="lbl2">Destinations les plus fréquentes</small>
    ${top.map(o => `<div class="rt"><i style="background:${RCAT[o.k].c}"></i><span class="n" title="${esc(o.t)}">${esc(o.t)}</span><span class="b"><em style="width:${(100 * o.n / max).toFixed(1)}%;background:${RCAT[o.k].c}"></em></span><b class="num">${nf.format(o.n)}</b></div>`).join("")}
  </div>`;
}
function bindRedir(st) {
  document.querySelectorAll(".donut .seg-arc, .redir-leg .rl").forEach(el => {
    el.addEventListener("mousemove", ev => { const k = el.dataset.k, n = st.rd.by[k];
      showTip(`<b>${RCAT[k].l}</b><div class="row"><i style="background:${RCAT[k].c}"></i>Redirections<span>${nf.format(n)}</span></div><div class="row" style="opacity:.7">Part<span>${pf(100 * n / st.rd.n)}</span></div>`, ev);
      document.querySelectorAll(".donut .seg-arc").forEach(a => a.style.opacity = a.dataset.k === k ? 1 : .35); });
    el.addEventListener("mouseleave", () => { hideTip(); document.querySelectorAll(".donut .seg-arc").forEach(a => a.style.opacity = 1); });
  });
}

/* ---------- Carte thermique jour × heure ---------- */
function heatmap(st) {
  const max = Math.max(1, ...st.heat.flat());
  const lvl = v => v === 0 ? 0 : Math.max(1, Math.ceil(5 * v / max));
  let h = '<div class="heat"><span></span>';
  for (let x = 0; x < 24; x++) h += `<span class="h">${x % 3 === 0 ? x + "h" : ""}</span>`;
  st.heat.forEach((row, d) => { h += `<span class="d">${DOW[d]}</span>`; row.forEach((v, x) => { h += `<span class="c" data-d="${d}" data-h="${x}" data-v="${v}" style="background:${HEAT[lvl(v)]}"></span>`; }); });
  h += "</div>";
  h += `<div class="heat-scale">Moins${HEAT.map(c => `<i style="background:${c}"></i>`).join("")}Plus</div>`;
  if (st.q) {
    let best = [0, 0, -1]; st.heat.forEach((r, d) => r.forEach((v, x) => { if (v > best[2]) best = [d, x, v]; }));
    const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
    h += `<div class="insight">${I.bulb}<span><b>${pf(st.off)}</b> des questions arrivent le soir ou le week-end, quand les équipes ne peuvent pas répondre. Créneau le plus actif : <b>${days[best[0]]}, ${best[1]} h – ${best[1] + 1} h</b>.</span></div>`;
  }
  return h;
}
function bindHeat() {
  document.querySelectorAll(".heat .c").forEach(c => {
    c.addEventListener("mousemove", ev => { const d = +c.dataset.d, h = +c.dataset.h, v = +c.dataset.v;
      showTip(`<b>${["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"][d]}, ${h} h – ${h + 1} h</b><div class="row">Questions<span>${v}</span></div>`, ev); });
    c.addEventListener("mouseleave", hideTip);
  });
}

/* ---------- Vues ---------- */
function rangeText(R) {
  const f = k => keyToDate(k).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return R.start === R.end ? f(R.start) : `Du ${f(R.start)} au ${f(R.end)}` + (S.period ? " · comparé aux " + S.period + " jours précédents" : "");
}
function emptyState(msg) {
  return `<div class="card"><div class="empty">${I.inbox}<b>Aucune question pour l'instant</b>${msg || "Les questions posées à l'assistant sur la page du DMN apparaîtront ici en temps réel."}</div></div>`;
}

const kpi = (icon, lbl, val, foot, sp = "") => `<div class="card kpi">${sp}<div class="lbl"><em>${icon}</em>${lbl}</div><div class="val num">${val}</div><div class="foot">${foot}</div></div>`;
const pctVal = v => v == null ? "—" : nf.format(Math.round(v)) + "<small>%</small>";

/* Vue d'ensemble : l'essentiel, sans surcharge */
function overview(st) {
  const sparkQ = st.buckets.map(b => b.ok + b.ko), sparkR = st.buckets.map(b => b.ok + b.ko ? 100 * b.ok / (b.ok + b.ko) : 0);
  const gaps = topQuestions(st.unanswered).slice(0, 5), recent = st.cur.slice(0, 6);
  return `
  <div class="grid kpis k4">
    ${kpi(I.q, "Questions posées", nf.format(st.q), delta(st.q, st.qPrev) + "<span>vs période précédente</span>", spark(sparkQ))}
    ${kpi(I.check, "Taux de réponse", pctVal(st.rate), `${delta(st.rate, st.ratePrev, { pts: true })}<span class="meter"><i style="width:${st.rate || 0}%"></i></span>`, spark(sparkR, "#0E9F6E"))}
    ${kpi(I.moon, "Hors heures ouvrées", pctVal(st.off), "<span>soirs (18 h – 9 h) et week-ends</span>")}
    ${kpi(I.send, "Demandes transmises", nf.format(st.transmitted ?? 0), `${delta(st.transmitted, st.transmittedPrev)}<span>dont ${st.leads} avec coordonnées</span>`)}
  </div>
  <div class="grid g-1-1">
    <div class="card">
      <div class="card-h"><div><h3>Questions ${st.weekly ? "par semaine" : "par jour"}</h3><p>Répondues ou restées sans réponse</p></div>
        <div class="legend"><span><i style="background:${C_OK}"></i>Répondues</span><span><i style="background:${C_KO}"></i>Sans réponse</span></div></div>
      ${st.q ? dailyChart(st) : emptyMini()}
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Redirections</h3><p>Où l'assistant envoie les visiteurs</p></div>${delta(st.rd.n, st.rdPrev?.n)}</div>
      ${redirChart(st)}
    </div>
  </div>
  <div class="grid g-1-1">
    <div class="card"><div class="card-h"><div><h3>À enrichir en priorité</h3><p>Questions les plus posées restées sans réponse</p></div><button class="act" data-go="gaps">Tout voir →</button></div>
      ${gaps.length ? `<div class="rank">${gaps.map(([q, n]) => `<div class="it"><span class="n" title="${esc(q)}">${esc(q)}</span><span class="v"><b>${n}</b>fois</span></div>`).join("")}</div>` : emptyMini()}
    </div>
    <div class="card"><div class="card-h"><div><h3>Dernières questions</h3><p>En temps réel</p></div><button class="act" data-go="questions">Tout voir →</button></div>
      ${recent.length ? `<div class="mini-list">${recent.map(q => `<button class="mini" data-open="${q.id}"><span class="d">${shortDate(q.ts)}</span><span class="t">${esc(q.q)}</span>${q.answered ? `<span class="dot ok" title="Répondue"></span>` : `<span class="dot ko" title="Sans réponse"></span>`}</button>`).join("")}</div>` : emptyMini()}
    </div>
  </div>`;
}

/* Analytics : le détail pour comprendre */
function analytics(st) {
  const totalDev = st.devices.reduce((s, d) => s + d[1], 0) || 1, mob = (st.devices.find(d => d[0] === "mobile") || [0, 0])[1];
  const satPct = st.fbN ? 100 * st.up / st.fbN : null, C = 2 * Math.PI * 34, qpc = st.conv ? (st.q / st.conv).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "—";
  const top = topQuestions(st.cur).slice(0, 8);
  return `
  <div class="grid kpis k4">
    ${kpi(I.users, "Conversations", nf.format(st.conv), `${delta(st.conv, st.convPrev)}<span>${qpc} question(s) / conv.</span>`)}
    ${kpi(I.q, "Ouvertures de l'assistant", nf.format(st.opens), `<span>${st.opens ? pf(100 * st.conv / st.opens) : "—"} débouchent sur une question</span>`)}
    ${kpi(I.check, "Réponses jugées utiles", satPct == null ? "—" : pctVal(satPct), `<span>${st.fbN} avis · ${st.down} 👎</span>`)}
    ${kpi(I.moon, "Temps de réponse médian", sec(st.ms).replace(" s", "<small> s</small>"), `<span>premier mot en ${sec(st.ttft)}</span>`)}
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><div><h3>Performance par thème</h3><p>Volume, taux de réponse et satisfaction — cliquez pour voir les questions</p></div></div>
    <div class="tbl-wrap"><table class="theme-tbl"><thead><tr><th>Thème</th><th style="width:34%">Volume</th><th style="text-align:right">Questions</th><th style="text-align:right">Répondues</th><th style="text-align:right">Utiles</th></tr></thead><tbody>
    ${st.themeRows.map(r => `<tr data-theme="${esc(r.theme)}"><td><span class="chip"><i></i>${esc(r.theme)}</span></td><td><span class="bar-in"><i style="width:${(100 * r.n / st.themeRows[0].n).toFixed(1)}%"></i></span></td><td class="r"><b style="color:var(--ink)">${r.n}</b> · ${pf(100 * r.n / st.q)}</td><td class="r">${rateCell(r.rate)}</td><td class="r">${r.fb ? pf(100 * r.up / r.fb) : "—"}</td></tr>`).join("")}
    </tbody></table></div>
  </div>
  <div class="grid g-1-1">
    <div class="card"><div class="card-h"><div><h3>Questions les plus posées</h3><p>Formulations identiques regroupées</p></div></div>
      ${top.length ? `<div class="rank">${top.map(([q, n, ok]) => `<div class="it"><span class="n" title="${esc(q)}">${ok ? "" : `<span class="dot ko" title="Sans réponse"></span>`}${esc(q)}</span><span class="v"><b>${n}</b>fois</span><span class="bar"><i style="width:${(100 * n / top[0][1]).toFixed(1)}%;${ok ? "" : "background:" + C_KO}"></i></span></div>`).join("")}</div>` : emptyMini()}</div>
    <div class="card"><div class="card-h"><div><h3>Quand les questions arrivent</h3><p>Jour et heure (heure de Paris)</p></div></div>${heatmap(st)}</div>
  </div>
  <div class="grid g-3">
    <div class="card"><div class="card-h"><div><h3>Sites d'enseignement demandés</h3><p>Conversations orientées vers un site</p></div></div>${rankList(st.sites.slice(0, 8), 0)}</div>
    <div class="card"><div class="card-h"><div><h3>Sections de la page utilisées</h3><p>Sources citées dans les réponses</p></div></div>${rankList(st.sections.slice(0, 8), 0)}</div>
    <div class="card"><div class="card-h"><div><h3>Appareils</h3><p>D'où les questions sont posées</p></div></div>
      ${st.q ? `<div class="split"><i style="width:${100 * mob / totalDev}%;background:${C_OK}"></i><i style="width:${100 - 100 * mob / totalDev}%;background:#A9C1FB"></i></div>
      <div class="split-l"><span><b>${pf(100 * mob / totalDev)}</b> mobile</span><span><b>${pf(100 - 100 * mob / totalDev)}</b> ordinateur</span></div>
      <div class="sat" style="margin:18px 0 0"><svg class="ring" viewBox="0 0 84 84" role="img" aria-label="Satisfaction"><circle cx="42" cy="42" r="34" fill="none" stroke="#F0F2F7" stroke-width="9"/>
          ${satPct != null ? `<circle cx="42" cy="42" r="34" fill="none" stroke="#0E9F6E" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(C * satPct / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 42 42)"/>` : ""}
          <text x="42" y="47" text-anchor="middle" font-size="16" font-weight="700" fill="#0E1631">${satPct == null ? "—" : Math.round(satPct) + "%"}</text></svg>
        <div class="t"><b style="font-size:15px">Satisfaction</b><p>${st.up} 👍 · ${st.down} 👎</p></div></div>` : emptyMini()}
    </div>
  </div>`;
}
const rateCell = v => v == null ? "—" : `<span class="badge ${v >= 70 ? "ok" : "ko"}">${pf(v)}</span>`;
function topQuestions(list) {
  const m = new Map(); for (const q of list) { const k = q.q.trim().replace(/\s+/g, " "); const o = m.get(k) || [k, 0, q.answered]; o[1]++; m.set(k, o); }
  return [...m.values()].sort((a, b) => b[1] - a[1]);
}

/* Récap com' : uniquement des chiffres exacts tirés des conversations (aucune génération IA).
   Fenêtres : 7 jours (par jour), 1 mois = 4 semaines (par semaine), 1 trimestre = 13 semaines (par semaine), chacune comparée à la fenêtre précédente de même durée. */
const CP = { d7: "7 jours", m1: "1 mois", q: "1 trimestre" };
function commRange(kind) {
  const t = parts(S.now).key, B = [];
  if (kind === "d7") { for (let i = 6; i >= 0; i--) { const k = addDays(t, -i); B.push({ from: k, to: k, l: dayLabel(k, { weekday: "short", day: "numeric" }) }); }
    return { kind, B, start: B[0].from, end: t, prevStart: addDays(t, -13), prevEnd: addDays(t, -7), name: "7 derniers jours", unit: "jour" }; }
  const n = kind === "q" ? 13 : 4;
  for (let i = n - 1; i >= 0; i--) { const from = addDays(t, -7 * i - 6); B.push({ from, to: addDays(t, -7 * i), l: dayLabel(from) }); }
  return { kind, B, start: B[0].from, end: t, prevStart: addDays(B[0].from, -7 * n), prevEnd: addDays(B[0].from, -1), name: kind === "q" ? "Dernier trimestre (13 semaines)" : "Dernier mois (4 semaines)", unit: "semaine" };
}
function commRangeText(R) {
  const f = k => keyToDate(k).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return `Du ${f(R.start)} au ${f(R.end)} · comparé à la période précédente de même durée`;
}
const qKey = q => q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9€]+/g, " ").trim();
function commData(R) {
  const nb = R.B.length, bi = k => R.B.findIndex(b => k >= b.from && k <= b.to), zero = () => Array(nb).fill(0);
  const inCur = k => k >= R.start && k <= R.end, inPrev = k => k >= R.prevStart && k <= R.prevEnd;
  const all = model(), cur = all.filter(q => inCur(q._p.key)), prev = all.filter(q => inPrev(q._p.key));
  const grp = (list, keyf, init) => { const m = new Map(); for (const x of list) { const k = keyf(x); if (k == null) continue; if (!m.has(k)) m.set(k, init(x)); m.get(k)._l.push(x); } return m; };
  // questions identiques (casse, accents et ponctuation ignorés)
  const Q = grp(cur, q => qKey(q.q), q => ({ q: q.q, id: q.id, a: q.a, theme: q.theme || "Autre", answered: q.answered, sources: q.sources || [], series: zero(), prev: 0, _l: [] }));
  for (const o of Q.values()) { o.n = o._l.length; for (const q of o._l) o.series[bi(q._p.key)]++; }
  for (const q of prev) { const o = Q.get(qKey(q.q)); if (o) o.prev++; }
  const questions = [...Q.values()].sort((a, b) => b.n - a.n);
  // thèmes
  const T = grp(cur, q => q.theme || "Autre", q => ({ theme: q.theme || "Autre", series: zero(), prev: 0, ko: 0, _l: [] }));
  for (const o of T.values()) { o.n = o._l.length; o.ko = o._l.filter(q => !q.answered).length; for (const q of o._l) o.series[bi(q._p.key)]++; }
  for (const q of prev) { const o = T.get(q.theme || "Autre"); if (o) o.prev++; }
  const themes = [...T.values()].sort((a, b) => b.n - a.n);
  // établissements : conversations orientées vers un site, demandes de contact transmises
  const evs = t => S.events.filter(e => e.type === t);
  const siteEv = evs("site").map(e => ({ ...e, k: parts(e.ts).key })), leadEv = evs("lead").map(e => ({ ...e, k: parts(e.ts).key }));
  const SI = new Map(); const so = s => { if (!SI.has(s)) SI.set(s, { site: s, conv: new Set(), leads: new Set(), prevConv: new Set(), series: zero() }); return SI.get(s); };
  for (const e of siteEv) { if (inCur(e.k)) { const o = so(e.site); if (!o.conv.has(e.sid)) o.series[bi(e.k)]++; o.conv.add(e.sid); } else if (inPrev(e.k)) so(e.site).prevConv.add(e.sid); }
  for (const e of leadEv) if (inCur(e.k)) so(e.site).leads.add(e.sid);
  const sites = [...SI.values()].map(o => ({ ...o, n: o.conv.size, l: o.leads.size, prev: o.prevConv.size })).filter(o => o.n || o.l).sort((a, b) => b.n - a.n || b.l - a.l);
  // pages ouvertes depuis l'assistant (sections de la page et liens INFN)
  const RD = new Map();
  for (const e of evs("redirect")) { const k = parts(e.ts).key, id = e.kind + "|" + e.target; if (!RD.has(id)) RD.set(id, { t: e.target, k: e.kind, n: 0, prev: 0 }); if (inCur(k)) RD.get(id).n++; else if (inPrev(k)) RD.get(id).prev++; }
  const pages = [...RD.values()].filter(o => o.n).sort((a, b) => b.n - a.n);
  // moments
  const dow = Array(7).fill(0), hour = Array(24).fill(0); for (const q of cur) { dow[q._p.dow]++; hour[q._p.hour]++; }
  let slot = [0, -1]; for (let h = 0; h < 24; h++) { const v = hour[h] + hour[(h + 1) % 24] + hour[(h + 2) % 24]; if (v > slot[1]) slot = [h, v]; }
  const conv = l => new Set(l.map(q => q.sid || q.id)).size;
  return { R, cur, prev, questions, themes, sites, pages, dow, hour, slot,
    q: cur.length, qPrev: prev.length, conv: conv(cur), convPrev: conv(prev), ko: cur.filter(q => !q.answered).length, koPrev: prev.filter(q => !q.answered).length,
    leads: sites.reduce((s, o) => s + o.l, 0), leadsPrev: new Set(leadEv.filter(e => inPrev(e.k)).map(e => e.sid)).size, siteConv: sites.reduce((s, o) => s + o.n, 0),
    unanswered: questions.filter(o => !o.answered) };
}
function bars(series, color = "#1E4FD8") {
  const n = series.length, bw = n > 8 ? 6 : 9, g = n > 8 ? 2 : 3, W = n * (bw + g) - g, H = 26, max = Math.max(1, ...series);
  return `<svg class="mbars" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${series.map((v, i) => { const h = v ? Math.max(2, (H - 1) * v / max) : 1;
    return `<rect x="${i * (bw + g)}" y="${H - h}" width="${bw}" height="${h}" rx="1.5" fill="${v ? color : "#E6E9F2"}" opacity="${i === n - 1 && v ? 1 : .78}"/>`; }).join("")}</svg>`;
}
const DAYS_L = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
function pistes(D) {
  const out = [], share = n => pf(100 * n / (D.q || 1));
  const topOk = D.questions.find(o => o.answered);
  if (topOk) out.push({ k: "Question n° 1", c: C_OK, h: `« ${esc(topOk.q)} » : <b>${topOk.n} fois</b>, ${share(topOk.n)} des questions ${delta(topOk.n, topOk.prev)}`,
    u: `La réponse est déjà sur la page${topOk.sources[0] ? ` (section « ${esc(topOk.sources[0])} »)` : ""} : sujet direct pour un post ou la FAQ.`, copy: topOk.a, cl: "Copier la réponse" });
  const rising = D.themes.filter(t => t.prev >= 5 && t.n >= 8 && t.theme !== "Autre").map(t => ({ ...t, d: (t.n - t.prev) / t.prev })).sort((a, b) => b.d - a.d)[0];
  if (rising && rising.d > 0.1) out.push({ k: "Thème en hausse", c: "#0E9F6E", h: `<b>${esc(rising.theme)}</b> : ${rising.n} questions contre ${rising.prev} sur la période précédente ${delta(rising.n, rising.prev)}`,
    u: "La demande progresse sur ce sujet : à placer en tête de la prochaine communication." });
  const gap = D.unanswered[0];
  if (gap) out.push({ k: "Information absente", c: C_KO, h: `« ${esc(gap.q)} » : <b>${gap.n} fois sans réponse</b>`, u: "La page ne donne pas cette information : la publier répond à une demande mesurée.", copy: gap.q, cl: "Copier la question" });
  const s = D.sites[0];
  if (s) out.push({ k: "Établissement le plus demandé", c: "#E87BA4", h: `<b>INFN ${esc(s.site)}</b> : ${s.n} conversation(s) orientée(s), ${pf(100 * s.n / (D.siteConv || 1))} du total, ${s.l} contact(s) transmis`,
    u: "Site qui concentre le plus de demandes via l'assistant : à mettre en avant dans les contenus locaux." });
  if (D.q >= 10) { const bd = D.dow.indexOf(Math.max(...D.dow)), h = D.slot[0];
    out.push({ k: "Moment d'activité", c: "#03256C", h: `<b>${share(D.slot[1])}</b> des questions arrivent entre <b>${h} h et ${(h + 3) % 24} h</b> · jour le plus actif : <b>${DAYS_L[bd]}</b> (${share(D.dow[bd])})`,
      u: "Créneau où les candidats sont en ligne : à privilégier pour publier." }); }
  return out;
}
function recapText(D) {
  const L = [], R = D.R, pc = n => Math.round(100 * n / (D.q || 1)) + " %";
  const dv = (a, b) => b ? ` (${a - b >= 0 ? "+" : ""}${Math.round(100 * (a - b) / b)} % vs période précédente)` : "";
  L.push(`Assistant IA DMN · récap ${R.name.toLowerCase()} (${commRangeText(R).split(" · ")[0].toLowerCase()})`, "");
  L.push(`Questions : ${D.q}${dv(D.q, D.qPrev)} · conversations : ${D.conv} · sans réponse : ${D.ko} (${pc(D.ko)}) · contacts transmis : ${D.leads}`, "");
  L.push("Questions les plus posées :"); D.questions.slice(0, 10).forEach((o, i) => L.push(`${i + 1}. ${o.q} — ${o.n} fois${o.answered ? "" : " (sans réponse)"}`)); L.push("");
  L.push("Thèmes :"); D.themes.forEach(t => L.push(`- ${t.theme} : ${t.n}${t.prev ? ` (préc. ${t.prev})` : ""}`)); L.push("");
  if (D.sites.length) { L.push("Établissements les plus demandés :"); D.sites.slice(0, 6).forEach(o => L.push(`- INFN ${o.site} : ${o.n} conversation(s), ${o.l} contact(s)`)); L.push(""); }
  if (D.unanswered.length) { L.push("Informations demandées absentes de la page :"); D.unanswered.slice(0, 8).forEach(o => L.push(`- ${o.q} — ${o.n} fois`)); }
  return L.join("\n");
}
function commView() {
  const R = commRange(S.cp), D = commData(R); S._recap = recapText(D);
  const head = `<div class="card cbar">
    <div class="seg cseg">${Object.entries(CP).map(([k, l]) => `<button data-cp="${k}" class="${S.cp === k ? "on" : ""}">${l}</button>`).join("")}</div>
    <span class="cnote">${I.check}Chiffres exacts issus des conversations · aucune donnée générée</span>
    <button class="btn" id="copyRecap">${I.copy}Copier le récap</button></div>`;
  if (!D.q) return head + emptyState("Aucune question sur cette période.");
  const nTop = R.B.length > 8 ? 12 : 10, top = D.questions.slice(0, nTop), maxT = D.themes[0]?.n || 1;
  const heatC = (v, m) => { const l = v ? Math.max(1, Math.ceil(5 * v / m)) : 0; return `background:${HEAT[l]};color:${l >= 4 ? "#fff" : "var(--ink)"}`; };
  const maxCell = Math.max(1, ...D.themes.flatMap(t => t.series));
  const P = pistes(D);
  return head + `
  <div class="grid kpis k4">
    ${kpi(I.q, "Questions posées", nf.format(D.q), delta(D.q, D.qPrev) + `<span>${D.qPrev} la période précédente</span>`)}
    ${kpi(I.users, "Conversations", nf.format(D.conv), delta(D.conv, D.convPrev) + `<span>${D.convPrev} la période précédente</span>`)}
    ${kpi(I.alert, "Questions sans réponse", nf.format(D.ko), `<span>${pf(100 * D.ko / D.q)} des questions · ${D.unanswered.length} formulation(s)</span>`)}
    ${kpi(I.send, "Contacts transmis aux sites", nf.format(D.leads), delta(D.leads, D.leadsPrev) + `<span>${D.siteConv} conversation(s) orientée(s)</span>`)}
  </div>
  <h2 class="sec-t">Ce que disent les chiffres</h2>
  <div class="pistes">${P.map(p => `<div class="card piste" style="--pc:${p.c}"><small class="pk">${p.k}</small><p class="ph">${p.h}</p><p class="pu">${p.u}</p>${p.copy ? `<button class="btn sm" data-copy="${esc(p.copy)}">${I.copy}${p.cl}</button>` : ""}</div>`).join("")}</div>
  <div class="card" style="margin:16px 0">
    <div class="card-h"><div><h3>Questions les plus posées</h3><p>Formulations identiques regroupées · évolution par ${R.unit} · cliquez pour lire la réponse</p></div></div>
    <div class="tbl-wrap"><table class="ctbl"><thead><tr><th style="width:28px">#</th><th>Question</th><th>Évolution</th><th class="r">Fois</th><th class="r">Part</th><th class="r">vs préc.</th><th>Statut</th></tr></thead><tbody>
    ${top.map((o, i) => `<tr data-id="${o.id}"><td class="rk num">${i + 1}</td><td class="q"><div>${esc(o.q)}</div><small>${esc(o.theme)}</small></td><td>${bars(o.series, o.answered ? C_OK : C_KO)}</td><td class="r num"><b>${o.n}</b></td><td class="r num">${pf(100 * o.n / D.q)}</td><td class="r">${delta(o.n, o.prev)}</td><td>${o.answered ? `<span class="badge ok">${I.check}Répondue</span>` : `<span class="badge ko">${I.alert}Sans réponse</span>`}</td></tr>`).join("")}
    </tbody></table></div>
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><div><h3>Thèmes, ${R.unit} par ${R.unit}</h3><p>Nombre exact de questions · plus la case est foncée, plus le thème est demandé</p></div></div>
    <div class="tbl-wrap"><table class="ttbl"><thead><tr><th>Thème</th>${R.B.map(b => `<th class="c">${esc(b.l)}</th>`).join("")}<th class="r">Total</th><th class="r">vs préc.</th><th class="r">Sans rép.</th></tr></thead><tbody>
    ${D.themes.map(t => `<tr data-theme="${esc(t.theme)}"><td><span class="chip"><i></i>${esc(t.theme)}</span></td>${t.series.map(v => `<td class="c"><span class="hc num" style="${heatC(v, maxCell)}">${v || "·"}</span></td>`).join("")}<td class="r num"><b>${t.n}</b></td><td class="r">${delta(t.n, t.prev)}</td><td class="r num">${t.ko ? `<span style="color:var(--warn);font-weight:600">${t.ko}</span>` : "0"}</td></tr>`).join("")}
    </tbody></table></div>
  </div>
  <div class="grid g-1-1">
    <div class="card"><div class="card-h"><div><h3>Établissements les plus demandés</h3><p>Site choisi dans l'assistant · contacts = coordonnées laissées</p></div></div>
      ${D.sites.length ? `<div class="tbl-wrap"><table class="ctbl"><thead><tr><th>Site</th><th>Évolution</th><th class="r">Conv.</th><th class="r">Contacts</th><th class="r">vs préc.</th></tr></thead><tbody>
      ${D.sites.slice(0, 10).map(o => `<tr class="nohov"><td><b style="font-weight:600">INFN ${esc(o.site)}</b></td><td>${bars(o.series, "#E87BA4")}</td><td class="r num"><b>${o.n}</b></td><td class="r num">${o.l}</td><td class="r">${delta(o.n, o.prev)}</td></tr>`).join("")}</tbody></table></div>` : emptyMini()}
    </div>
    <div class="card"><div class="card-h"><div><h3>Informations demandées absentes de la page</h3><p>Questions restées sans réponse, par fréquence</p></div></div>
      ${D.unanswered.length ? `<div class="rank">${D.unanswered.slice(0, 8).map(o => `<div class="it click" data-open="${o.id}"><span class="n" title="${esc(o.q)}">${esc(o.q)}</span><span class="v"><b>${o.n}</b>fois</span><span class="bar"><i style="width:${(100 * o.n / D.unanswered[0].n).toFixed(1)}%;background:${C_KO}"></i></span></div>`).join("")}</div>` : `<div class="empty">${I.check}<b>Tout est couvert</b>Aucune question sans réponse sur la période.</div>`}
    </div>
  </div>
  <div class="grid g-1-1">
    <div class="card"><div class="card-h"><div><h3>Pages ouvertes depuis l'assistant</h3><p>Sections de la page et liens INFN cliqués</p></div></div>
      ${D.pages.length ? `<div class="redir-top" style="border:0;padding:0;margin:0">${D.pages.slice(0, 8).map(o => `<div class="rt"><i style="background:${RCAT[o.k === "section" ? "section" : "lien"].c}"></i><span class="n" title="${esc(o.t)}">${esc(o.t)}</span><span class="b"><em style="width:${(100 * o.n / D.pages[0].n).toFixed(1)}%;background:${RCAT[o.k === "section" ? "section" : "lien"].c}"></em></span><b class="num">${o.n}</b></div>`).join("")}
        <div class="legend" style="margin-top:12px"><span><i style="background:${RCAT.section.c}"></i>Section de la page</span><span><i style="background:${RCAT.lien.c}"></i>Page ou document INFN</span></div></div>` : emptyMini()}
    </div>
    <div class="card"><div class="card-h"><div><h3>Jours où les questions arrivent</h3><p>Part des questions de la période, heure de Paris</p></div></div>
      <div class="dows">${D.dow.map((v, i) => `<div class="dw"><span class="dl">${DOW[i]}</span><span class="db"><em style="width:${(100 * v / Math.max(1, ...D.dow)).toFixed(1)}%"></em></span><b class="num">${v}</b><small class="num">${pf(100 * v / D.q)}</small></div>`).join("")}</div>
      <div class="insight">${I.bulb}<span>Créneau de 3 h le plus actif : <b>${D.slot[0]} h – ${(D.slot[0] + 3) % 24} h</b>, ${pf(100 * D.slot[1] / D.q)} des questions.</span></div>
    </div>
  </div>`;
}

function table(rows, { compact } = {}) {
  return `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Question</th><th>Thème</th><th>Statut</th>${compact ? "" : "<th>Avis</th><th>Site</th>"}<th style="text-align:right">Réponse en</th></tr></thead><tbody>
  ${rows.map(q => `<tr data-id="${q.id}"><td class="d">${shortDate(q.ts)}</td><td class="q"><div>${esc(q.q)}</div></td><td><span class="chip"><i></i>${esc(q.theme || "Autre")}</span></td><td>${statusBadge(q)}</td>${compact ? "" : `<td>${fbIcon(q._fb)}</td><td>${q._site ? esc(q._site) + (q._lead ? " ✉︎" : "") : '<span style="color:var(--faint)">—</span>'}</td>`}<td class="r">${sec(q.ms)}</td></tr>`).join("")}
  </tbody></table></div>`;
}

function questionsView(st) {
  const f = S.f, themes = [...new Set(st.all.map(q => q.theme || "Autre"))].sort();
  let rows = st.cur;
  if (f.q) { const n = f.q.toLowerCase(); rows = rows.filter(q => (q.q + " " + q.a).toLowerCase().includes(n)); }
  if (f.theme) rows = rows.filter(q => (q.theme || "Autre") === f.theme);
  if (f.status) rows = rows.filter(q => f.status === "ok" ? q.answered : !q.answered);
  if (f.fb) rows = rows.filter(q => f.fb === "none" ? !q._fb : q._fb === f.fb);
  const per = 25, pages = Math.max(1, Math.ceil(rows.length / per)); S.page = Math.min(S.page, pages - 1);
  const slice = rows.slice(S.page * per, S.page * per + per);
  S._rows = rows;
  return `<div class="card">
    <div class="toolbar">
      <div class="search">${I.search}<input id="fq" placeholder="Rechercher dans les questions et réponses…" value="${esc(f.q)}"></div>
      <select class="sel" id="ftheme"><option value="">Tous les thèmes</option>${themes.map(t => `<option ${t === f.theme ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
      <select class="sel" id="fstatus"><option value="">Tous les statuts</option><option value="ok" ${f.status === "ok" ? "selected" : ""}>Répondues</option><option value="ko" ${f.status === "ko" ? "selected" : ""}>Sans réponse</option></select>
      <select class="sel" id="ffb"><option value="">Tous les avis</option><option value="up" ${f.fb === "up" ? "selected" : ""}>👍 Utile</option><option value="down" ${f.fb === "down" ? "selected" : ""}>👎 Pas utile</option><option value="none" ${f.fb === "none" ? "selected" : ""}>Sans avis</option></select>
    </div>
    ${slice.length ? table(slice) : `<div class="empty">${I.search}<b>Aucun résultat</b>Modifiez la recherche ou les filtres.</div>`}
    <div class="pager"><span class="num">${rows.length ? `${S.page * per + 1}–${Math.min(rows.length, S.page * per + per)} sur ${nf.format(rows.length)} question(s)` : ""}</span>
      <div><button class="btn" id="prev" ${S.page ? "" : "disabled"}>← Précédent</button><button class="btn" id="next" ${S.page < pages - 1 ? "" : "disabled"}>Suivant →</button></div></div>
  </div>`;
}

function gapsView(st) {
  const groups = new Map(); for (const q of st.unanswered) { const k = q.theme || "Autre"; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(q); }
  const down = st.cur.filter(q => q._fb === "down");
  const item = (q, why) => `<div class="gap-item"><span class="ico">${why === "down" ? "👎" : I.alert}</span><div class="tx"><b>${esc(q.q)}</b><small>${shortDate(q.ts)} · ${esc(q.theme || "Autre")}${q._site ? " · " + esc(q._site) : ""}</small></div>
    <button class="btn" data-copy="${esc(q.q)}">${I.copy}Copier</button><button class="btn" data-open="${q.id}">Voir</button></div>`;
  return `
  <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,#03256C,#0B3A9E);color:#fff;border:0">
    <div style="display:flex;gap:14px;align-items:flex-start">${I.bulb.replace("<svg", '<svg style="width:22px;height:22px;flex:none;color:#14CCFF"')}
      <div><h3 style="font-size:15px;margin-bottom:4px">Ce que les candidats cherchent et ne trouvent pas</h3>
      <p style="opacity:.85;font-size:13px;max-width:760px">L'assistant ne répond qu'à partir des informations publiées sur la page du DMN. Chaque question ci-dessous est une information à ajouter sur la page ou dans la base de l'assistant : la prochaine fois, il saura répondre.</p></div></div>
  </div>
  <div class="grid g-1-1">
    <div class="card"><div class="card-h"><div><h3>Questions sans réponse</h3><p>${st.unanswered.length} sur la période, regroupées par thème</p></div></div>
      ${st.unanswered.length ? [...groups.entries()].sort((a, b) => b[1].length - a[1].length).map(([t, l]) => `<div style="margin-bottom:6px"><div style="display:flex;align-items:center;gap:8px;margin:10px 0 2px"><span class="chip"><i style="background:${C_KO}"></i>${esc(t)}</span><small style="color:var(--mute)">${l.length} question(s)</small></div>${l.map(q => item(q)).join("")}</div>`).join("") : `<div class="empty">${I.check}<b>Tout est couvert</b>Aucune question sans réponse sur la période.</div>`}
    </div>
    <div class="card"><div class="card-h"><div><h3>Réponses jugées pas utiles</h3><p>À relire pour améliorer l'assistant</p></div></div>
      ${down.length ? down.map(q => item(q, "down")).join("") : `<div class="empty">👍<b>Aucun avis négatif</b>Aucune réponse n'a été jugée inutile sur la période.</div>`}
    </div>
  </div>`;
}

/* ---------- Détail d'une question ---------- */
function openDrawer(id) {
  const q = S.events.find(e => e.id === id); if (!q) return;
  const conv = q.sid ? S.events.filter(e => e.sid === q.sid).sort((a, b) => a.ts < b.ts ? -1 : 1) : [q];
  const dr = $("#drawer");
  let thread = "";
  for (const e of conv) {
    if (e.type === "question") {
      thread += `<div class="u ${e.id === id ? "cur" : ""}">${esc(e.q)}</div><div class="a">${md(e.a)}</div>`;
      if (e.sources?.length) thread += `<div class="srcs">${e.sources.map(s => `<span>${esc(s)}</span>`).join("")}</div>`;
    } else if (e.type === "feedback") thread += `<div class="ev">Avis du visiteur : ${e.value === "up" ? "👍 utile" : "👎 pas utile"}</div>`;
    else if (e.type === "site") thread += `<div class="ev">Site choisi : <b>INFN ${esc(e.site)}</b></div>`;
    else if (e.type === "redirect") thread += `<div class="ev">↗ Redirigé vers ${e.kind === "section" ? "la section" : ""} <b>${esc(e.target)}</b></div>`;
    else if (e.type === "lead") thread += `<div class="ev">✉︎ Demande de contact transmise à <b>INFN ${esc(e.site)}</b></div>`;
  }
  const qq = model().find(x => x.id === id) || q;
  dr.innerHTML = `<div class="dr-h"><div><h3>Détail de la conversation</h3><p>${fullDate(q.ts)}</p></div><button id="drClose" aria-label="Fermer">${I.close}</button></div>
  <div class="dr-b">
    <div class="meta">
      <div><small>Statut</small><b>${statusBadge(q)}</b></div><div><small>Thème</small><b>${esc(q.theme || "Autre")}</b></div>
      <div><small>Avis</small><b>${qq._fb === "up" ? "👍 Utile" : qq._fb === "down" ? "👎 Pas utile" : "—"}</b></div><div><small>Site / contact</small><b>${qq._site ? "INFN " + esc(qq._site) + (qq._lead ? " · coordonnées laissées" : "") : "—"}</b></div>
      <div><small>Temps de réponse</small><b class="num">${sec(q.ms)} <span style="color:var(--mute);font-weight:500">(1er mot ${sec(q.ttft)})</span></b></div><div><small>Appareil</small><b>${q.device === "mobile" ? "Mobile" : "Ordinateur"}</b></div>
    </div>
    <h4 style="font-size:13px;color:var(--mute);font-weight:600;margin-bottom:10px">Conversation (${conv.filter(e => e.type === "question").length} question(s))</h4>
    <div class="thread">${thread}</div>
  </div>`;
  dr.classList.add("show"); $("#scrim").classList.add("show"); dr.setAttribute("aria-hidden", "false");
  $("#drClose").onclick = closeDrawer;
}
const closeDrawer = () => { $("#drawer").classList.remove("show"); $("#scrim").classList.remove("show"); $("#drawer").setAttribute("aria-hidden", "true"); };
$("#scrim").onclick = closeDrawer;
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

/* ---------- Rendu ---------- */
const TITLES = { overview: "Vue d'ensemble", analytics: "Analytics", questions: "Questions", gaps: "À enrichir", comm: "Récap com' · ce que demandent les candidats" };
function render() {
  const st = stats();
  $("#title").textContent = TITLES[S.view];
  $("#range").textContent = S.view === "comm" ? commRangeText(commRange(S.cp)) : rangeText(st.R);
  $("#navAll").textContent = nf.format(st.q);
  $("#navGaps").textContent = nf.format(st.unanswered.length);
  $("#navGaps").hidden = !st.unanswered.length;
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.view === S.view));
  document.querySelectorAll("#period button").forEach(b => b.classList.toggle("on", +b.dataset.p === S.period));
  $("#period").hidden = S.view === "comm";
  const v = $("#view");
  document.querySelectorAll("#mode button").forEach(b => b.classList.toggle("on", b.dataset.mode === S.mode));
  if (!st.all.length) { v.innerHTML = emptyState(S.mode === "real" ? `Les questions posées à l'assistant sur la page du DMN apparaîtront ici en temps réel.<br><br><button class="btn" data-mode="demo" style="margin:auto">Voir le tableau de bord avec des données de démonstration</button>` : ""); bindView(); return; }
  const V = { overview, analytics, questions: questionsView, gaps: gapsView, comm: commView };
  v.innerHTML = (S.mode === "demo" ? `<div class="demo-banner">${I.alert}<span><b>Mode démonstration</b> · trafic simulé à partir de vraies réponses de l'assistant. Les chiffres ne reflètent pas une utilisation réelle.</span><button data-mode="real">Voir les données réelles</button></div>` : "") + V[S.view](st);
  bindDaily(st); bindRedir(st); bindHeat(); bindView();
}
function bindView() {
  const v = $("#view");
  v.querySelectorAll("tbody tr").forEach(tr => tr.onclick = () => openDrawer(tr.dataset.id));
  v.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { S.view = b.dataset.go; render(); scrollTo(0, 0); });
  v.querySelectorAll("[data-theme]").forEach(b => b.onclick = () => { S.view = "questions"; S.f = { q: "", theme: b.dataset.theme, status: "", fb: "" }; S.page = 0; render(); scrollTo(0, 0); });
  v.querySelectorAll("[data-open]").forEach(b => b.onclick = () => openDrawer(b.dataset.open));
  v.querySelectorAll("[data-copy]").forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast("Copié dans le presse-papiers"); } catch { toast("Copie impossible"); } });
  const fq = $("#fq"); if (fq) { fq.oninput = () => { S.f.q = fq.value; S.page = 0; clearTimeout(fq._t); fq._t = setTimeout(() => { render(); const n = $("#fq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 180); }; }
  [["#ftheme", "theme"], ["#fstatus", "status"], ["#ffb", "fb"]].forEach(([s, k]) => { const el = $(s); if (el) el.onchange = () => { S.f[k] = el.value; S.page = 0; render(); }; });
  v.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => setMode(b.dataset.mode));
  v.querySelectorAll("[data-cp]").forEach(b => b.onclick = () => { S.cp = b.dataset.cp; saveUI(); render(); });
  const cr = $("#copyRecap"); if (cr) cr.onclick = async () => { try { await navigator.clipboard.writeText(S._recap || ""); toast("Récap copié"); } catch { toast("Copie impossible"); } };
  const p = $("#prev"), n = $("#next"); if (p) p.onclick = () => { S.page--; render(); }; if (n) n.onclick = () => { S.page++; render(); };
}
function skeleton() {
  $("#view").innerHTML = `<div class="grid kpis">${'<div class="card kpi"><div class="skel" style="height:14px;width:60%"></div><div class="skel" style="height:28px;width:40%;margin:12px 0 8px"></div><div class="skel" style="height:12px;width:70%"></div></div>'.repeat(5)}</div><div class="grid g-2-1"><div class="card"><div class="skel" style="height:260px"></div></div><div class="card"><div class="skel" style="height:260px"></div></div></div>`;
}

/* ---------- Données ---------- */
async function load(manual) {
  const btn = $("#refresh"); btn.classList.add("spin");
  try {
    const r = await fetch("/api/admin/data", { cache: "no-store", credentials: "same-origin" });
    if (r.status === 401) { showLogin(); return; }
    if (!r.ok) throw new Error(r.status);
    const d = await r.json(); S.real = d.events || []; S.now = Date.parse(d.now) || Date.now(); S.loadedAt = Date.now();
    // tant qu'il y a peu de vraies questions, on ouvre sur la démo (sauf choix explicite)
    if (!S.modeChosen) S.mode = S.real.filter(e => e.type === "question").length < 20 ? "demo" : "real";
    if (S.mode === "demo") await loadDemo(); S.events = S.mode === "demo" ? S.demo : S.real;
    showApp(); render(); stamp(); if (manual) toast("Données à jour");
  } catch (e) { toast("Impossible de charger les données"); console.error(e); }
  finally { btn.classList.remove("spin"); }
}
// Données de démonstration : décalées pour que la dernière journée du jeu tombe aujourd'hui (jours et heures conservés).
async function loadDemo() {
  if (S.demo) return;
  const d = await (await fetch("/admin/demo-data.json", { cache: "no-store" })).json();
  const shift = Math.max(0, Math.floor((S.now - Date.parse(d.generatedAt)) / 864e5)) * 864e5;
  S.demo = d.events.map(e => ({ ...e, ...(e.ai != null ? d.answers[e.ai] : {}), ts: new Date(Date.parse(e.ts) + shift).toISOString() }));
}
async function setMode(m) {
  S.mode = m; S.modeChosen = true; saveUI(); S.page = 0; closeDrawer();
  if (m === "demo") { try { await loadDemo(); } catch { toast("Données de démonstration indisponibles"); S.mode = "real"; } }
  S.events = S.mode === "demo" ? S.demo : S.real; render(); toast(S.mode === "demo" ? "Mode démonstration" : "Données réelles");
}
function stamp() { if (!S.loadedAt) return; const m = Math.round((Date.now() - S.loadedAt) / 60000); $("#updated").textContent = m < 1 ? "Mis à jour à l'instant" : `Mis à jour il y a ${m} min`; }
setInterval(stamp, 30000);
setInterval(() => { if (!$("#app").hidden && document.visibilityState === "visible") load(); }, 120000);

function csv() {
  const st = stats(), rows = S.view === "questions" && S._rows ? S._rows : st.cur;
  const head = ["Date", "Question", "Réponse", "Thème", "Statut", "Avis", "Site", "Coordonnées laissées", "Sources", "Temps de réponse (s)", "Appareil"];
  const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [head.map(cell).join(";")].concat(rows.map(q => [fullDate(q.ts), q.q, q.a, q.theme, q.answered ? "Répondue" : "Sans réponse", q._fb === "up" ? "Utile" : q._fb === "down" ? "Pas utile" : "", q._site || "", q._lead ? "oui" : "", (q.sources || []).join(" | "), q.ms != null ? (q.ms / 1000).toFixed(1).replace(".", ",") : "", q.device].map(cell).join(";")));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `assistant-dmn-questions-${parts(Date.now()).key}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`${rows.length} question(s) exportée(s)`);
}

/* ---------- Connexion ---------- */
function showLogin() { $("#app").hidden = true; $("#login").hidden = false; setTimeout(() => $("#pw").focus(), 50); }
function showApp() { $("#login").hidden = true; $("#app").hidden = false; }
$("#eye").onclick = () => { const p = $("#pw"); p.type = p.type === "password" ? "text" : "password"; p.focus(); };
$("#loginForm").onsubmit = async e => {
  e.preventDefault(); const btn = $("#loginBtn"), err = $("#loginErr"); btn.disabled = true; err.textContent = "";
  try {
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: $("#pw").value }), credentials: "same-origin" });
    if (r.ok) { $("#pw").value = ""; skeleton(); showApp(); await load(); }
    else { err.textContent = "Mot de passe incorrect."; const c = $(".login-card"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); $("#pw").select(); }
  } catch { err.textContent = "Connexion impossible, réessayez."; }
  btn.disabled = false;
};
$("#logout").onclick = async () => { await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" }).catch(() => {}); S.events = []; showLogin(); };
document.querySelectorAll("#mode button").forEach(b => b.onclick = () => setMode(b.dataset.mode));
document.querySelectorAll("#nav button").forEach(b => b.onclick = () => { S.view = b.dataset.view; S.page = 0; render(); scrollTo(0, 0); });
document.querySelectorAll("#period button").forEach(b => b.onclick = () => { S.period = +b.dataset.p; S.page = 0; saveUI(); render(); });
$("#refresh").onclick = () => load(true);
$("#export").onclick = csv;

skeleton(); load();
})();
