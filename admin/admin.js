/* Tableau de bord — Assistant IA INFN (DMN). Toutes les statistiques sont calculées ici à partir du journal des échanges. */
(() => {
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nf = new Intl.NumberFormat("fr-FR");
const pf = v => nf.format(Math.round(v)) + " %";
const TZ = "Europe/Paris";
const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const C_OK = "#1E4FD8", C_KO = "#F29A1F";
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
const usd = v => v == null ? "—" : (v < 0.01 ? v.toLocaleString("fr-FR", { maximumFractionDigits: 4 }) : v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })) + " $";

/* ---------- État ---------- */
const S = { events: [], now: Date.now(), period: 7, view: "overview", f: { q: "", theme: "", status: "", fb: "" }, page: 0, loadedAt: null };
try { const s = JSON.parse(localStorage.getItem("infn-admin-ui") || "{}"); if (s.period != null) S.period = s.period; } catch {}
const saveUI = () => { try { localStorage.setItem("infn-admin-ui", JSON.stringify({ period: S.period })); } catch {} };

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

  return {
    R, all, cur, prev, weekly, buckets,
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
    cost: cur.reduce((s, q) => s + (q.cost || 0), 0), unanswered: cur.filter(q => !q.answered),
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
  const B = st.buckets, W = 760, H = 250, padL = 34, padB = 26, padT = 10, iw = W - padL - 6, ih = H - padB - padT;
  const max = Math.max(4, ...B.map(b => b.ok + b.ko)), step = niceStep(max), top = Math.ceil(max / step) * step;
  const y = v => padT + ih - (v / top) * ih, bw = iw / B.length, w = Math.max(3, Math.min(30, bw * 0.62));
  let g = "";
  for (let v = 0; v <= top; v += step) g += `<line class="gridline" x1="${padL}" x2="${W - 6}" y1="${y(v)}" y2="${y(v)}"/><text x="${padL - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const every = Math.ceil(B.length / 10);
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

function overview(st) {
  const sparkQ = st.buckets.map(b => b.ok + b.ko), sparkR = st.buckets.map(b => b.ok + b.ko ? 100 * b.ok / (b.ok + b.ko) : 0);
  const qpc = st.conv ? (st.q / st.conv).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "—";
  const k = (icon, lbl, val, foot, sp = "") => `<div class="card kpi">${sp}<div class="lbl"><em>${icon}</em>${lbl}</div><div class="val num">${val}</div><div class="foot">${foot}</div></div>`;
  const totalDev = st.devices.reduce((s, d) => s + d[1], 0) || 1, mob = (st.devices.find(d => d[0] === "mobile") || [0, 0])[1];
  const satPct = st.fbN ? 100 * st.up / st.fbN : null, C = 2 * Math.PI * 34;
  const recent = st.cur.slice(0, 6);
  return `
  <div class="grid kpis">
    ${k(I.q, "Questions posées", nf.format(st.q), delta(st.q, st.qPrev) + "<span>vs période précédente</span>", spark(sparkQ))}
    ${k(I.users, "Conversations", nf.format(st.conv), `${delta(st.conv, st.convPrev)}<span>${qpc} question(s) / conv.</span>`)}
    ${k(I.check, "Taux de réponse", st.rate == null ? "—" : nf.format(Math.round(st.rate)) + "<small>%</small>", `${delta(st.rate, st.ratePrev, { pts: true })}<span class="meter"><i style="width:${st.rate || 0}%"></i></span>`, spark(sparkR, "#0E9F6E"))}
    ${k(I.moon, "Hors heures ouvrées", st.off == null ? "—" : nf.format(Math.round(st.off)) + "<small>%</small>", "<span>soirs (18 h – 9 h) et week-ends</span>")}
    ${k(I.send, "Demandes transmises", nf.format(st.transmitted ?? 0), `${delta(st.transmitted, st.transmittedPrev)}<span>dont ${st.leads} avec coordonnées</span>`)}
  </div>

  <div class="grid g-2-1">
    <div class="card">
      <div class="card-h"><div><h3>Questions ${st.weekly ? "par semaine" : "par jour"}</h3><p>Répondues par l'assistant ou restées sans réponse</p></div>
        <div class="legend"><span><i style="background:${C_OK}"></i>Répondues</span><span><i style="background:${C_KO}"></i>Sans réponse</span></div></div>
      ${st.q ? dailyChart(st) : emptyMini()}
    </div>
    <div class="card">
      <div class="card-h"><div><h3>Qualité et performance</h3><p>Avis des visiteurs et rapidité des réponses</p></div></div>
      <div class="sat">
        <svg class="ring" viewBox="0 0 84 84" role="img" aria-label="Satisfaction"><circle cx="42" cy="42" r="34" fill="none" stroke="#F0F2F7" stroke-width="9"/>
          ${satPct != null ? `<circle cx="42" cy="42" r="34" fill="none" stroke="#0E9F6E" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(C * satPct / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 42 42)"/>` : ""}
          <text x="42" y="47" text-anchor="middle" font-size="16" font-weight="700" fill="#0E1631">${satPct == null ? "—" : Math.round(satPct) + "%"}</text></svg>
        <div class="t"><b>${satPct == null ? "Pas encore d'avis" : "Réponses jugées utiles"}</b><p>${st.fbN ? `${st.up} 👍 · ${st.down} 👎 sur ${st.fbN} avis` : "Les visiteurs peuvent noter chaque réponse."}</p></div>
      </div>
      <div class="stats">
        <div class="stat"><small>Temps de réponse médian</small><b class="num">${sec(st.ms)}</b></div>
        <div class="stat"><small>Premier mot affiché</small><b class="num">${sec(st.ttft)}</b></div>
        <div class="stat"><small>Coût IA de la période</small><b class="num">${usd(st.cost)}</b></div>
        <div class="stat"><small>Coût moyen / question</small><b class="num">${st.q ? usd(st.cost / st.q) : "—"}</b></div>
      </div>
    </div>
  </div>

  <div class="grid g-1-1">
    <div class="card"><div class="card-h"><div><h3>Thèmes des questions</h3><p>Cliquez sur un thème pour voir les questions</p></div></div>${rankList(st.themes, st.q, { click: "theme" })}</div>
    <div class="card"><div class="card-h"><div><h3>Quand les questions arrivent</h3><p>Jour et heure (heure de Paris)</p></div></div>${heatmap(st)}</div>
  </div>

  <div class="grid g-3">
    <div class="card"><div class="card-h"><div><h3>Sites d'enseignement demandés</h3><p>Conversations orientées vers un site</p></div></div>${rankList(st.sites.slice(0, 8), 0)}</div>
    <div class="card"><div class="card-h"><div><h3>Sections de la page utilisées</h3><p>Sources citées dans les réponses</p></div></div>${rankList(st.sections.slice(0, 8), 0)}</div>
    <div class="card"><div class="card-h"><div><h3>Appareils</h3><p>D'où les questions sont posées</p></div></div>
      ${st.q ? `<div class="split"><i style="width:${100 * mob / totalDev}%;background:${C_OK}"></i><i style="width:${100 - 100 * mob / totalDev}%;background:#A9C1FB"></i></div>
      <div class="split-l"><span><b>${pf(100 * mob / totalDev)}</b> mobile</span><span><b>${pf(100 - 100 * mob / totalDev)}</b> ordinateur</span></div>
      <div class="stats" style="margin-top:16px"><div class="stat"><small>Ouvertures de l'assistant</small><b class="num">${nf.format(st.opens)}</b></div><div class="stat"><small>Questions sans réponse</small><b class="num">${nf.format(st.unanswered.length)}</b></div></div>` : emptyMini()}
    </div>
  </div>

  <div class="card">
    <div class="card-h"><div><h3>Dernières questions</h3><p>Les 6 plus récentes de la période</p></div><button class="act" data-go="questions">Voir toutes les questions →</button></div>
    ${recent.length ? table(recent, { compact: true }) : emptyMini()}
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
    else if (e.type === "lead") thread += `<div class="ev">✉︎ Demande de contact transmise à <b>INFN ${esc(e.site)}</b></div>`;
  }
  const qq = model().find(x => x.id === id) || q;
  dr.innerHTML = `<div class="dr-h"><div><h3>Détail de la conversation</h3><p>${fullDate(q.ts)}</p></div><button id="drClose" aria-label="Fermer">${I.close}</button></div>
  <div class="dr-b">
    <div class="meta">
      <div><small>Statut</small><b>${statusBadge(q)}</b></div><div><small>Thème</small><b>${esc(q.theme || "Autre")}</b></div>
      <div><small>Avis</small><b>${qq._fb === "up" ? "👍 Utile" : qq._fb === "down" ? "👎 Pas utile" : "—"}</b></div><div><small>Site / contact</small><b>${qq._site ? "INFN " + esc(qq._site) + (qq._lead ? " · coordonnées laissées" : "") : "—"}</b></div>
      <div><small>Temps de réponse</small><b class="num">${sec(q.ms)} <span style="color:var(--mute);font-weight:500">(1er mot ${sec(q.ttft)})</span></b></div><div><small>Appareil</small><b>${q.device === "mobile" ? "Mobile" : "Ordinateur"}</b></div>
      <div><small>Jetons (entrée / sortie)</small><b class="num">${q.tokensIn != null ? nf.format(q.tokensIn) + " / " + nf.format(q.tokensOut) : "—"}</b></div><div><small>Coût IA</small><b class="num">${usd(q.cost)}</b></div>
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
const TITLES = { overview: "Vue d'ensemble", questions: "Questions", gaps: "À enrichir" };
function render() {
  const st = stats();
  $("#title").textContent = TITLES[S.view];
  $("#range").textContent = rangeText(st.R);
  $("#navAll").textContent = nf.format(st.q);
  $("#navGaps").textContent = nf.format(st.unanswered.length);
  $("#navGaps").hidden = !st.unanswered.length;
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.view === S.view));
  document.querySelectorAll("#period button").forEach(b => b.classList.toggle("on", +b.dataset.p === S.period));
  const v = $("#view");
  if (!st.all.length) { v.innerHTML = emptyState(); return; }
  v.innerHTML = S.view === "overview" ? overview(st) : S.view === "questions" ? questionsView(st) : gapsView(st);
  bindDaily(st); bindHeat(); bindView();
}
function bindView() {
  const v = $("#view");
  v.querySelectorAll("tbody tr").forEach(tr => tr.onclick = () => openDrawer(tr.dataset.id));
  v.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { S.view = b.dataset.go; render(); scrollTo(0, 0); });
  v.querySelectorAll("[data-theme]").forEach(b => b.onclick = () => { S.view = "questions"; S.f = { q: "", theme: b.dataset.theme, status: "", fb: "" }; S.page = 0; render(); scrollTo(0, 0); });
  v.querySelectorAll("[data-open]").forEach(b => b.onclick = () => openDrawer(b.dataset.open));
  v.querySelectorAll("[data-copy]").forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast("Question copiée"); } catch { toast("Copie impossible"); } });
  const fq = $("#fq"); if (fq) { fq.oninput = () => { S.f.q = fq.value; S.page = 0; clearTimeout(fq._t); fq._t = setTimeout(() => { render(); const n = $("#fq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 180); }; }
  [["#ftheme", "theme"], ["#fstatus", "status"], ["#ffb", "fb"]].forEach(([s, k]) => { const el = $(s); if (el) el.onchange = () => { S.f[k] = el.value; S.page = 0; render(); }; });
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
    const d = await r.json(); S.events = d.events || []; S.now = Date.parse(d.now) || Date.now(); S.loadedAt = Date.now();
    showApp(); render(); stamp(); if (manual) toast("Données à jour");
  } catch (e) { toast("Impossible de charger les données"); console.error(e); }
  finally { btn.classList.remove("spin"); }
}
function stamp() { if (!S.loadedAt) return; const m = Math.round((Date.now() - S.loadedAt) / 60000); $("#updated").textContent = m < 1 ? "Mis à jour à l'instant" : `Mis à jour il y a ${m} min`; }
setInterval(stamp, 30000);
setInterval(() => { if (!$("#app").hidden && document.visibilityState === "visible") load(); }, 120000);

function csv() {
  const st = stats(), rows = S.view === "questions" && S._rows ? S._rows : st.cur;
  const head = ["Date", "Question", "Réponse", "Thème", "Statut", "Avis", "Site", "Coordonnées laissées", "Sources", "Temps de réponse (s)", "Appareil", "Coût ($)"];
  const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [head.map(cell).join(";")].concat(rows.map(q => [fullDate(q.ts), q.q, q.a, q.theme, q.answered ? "Répondue" : "Sans réponse", q._fb === "up" ? "Utile" : q._fb === "down" ? "Pas utile" : "", q._site || "", q._lead ? "oui" : "", (q.sources || []).join(" | "), q.ms != null ? (q.ms / 1000).toFixed(1).replace(".", ",") : "", q.device, q.cost != null ? String(q.cost).replace(".", ",") : ""].map(cell).join(";")));
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
document.querySelectorAll("#nav button").forEach(b => b.onclick = () => { S.view = b.dataset.view; S.page = 0; render(); scrollTo(0, 0); });
document.querySelectorAll("#period button").forEach(b => b.onclick = () => { S.period = +b.dataset.p; S.page = 0; saveUI(); render(); });
$("#refresh").onclick = () => load(true);
$("#export").onclick = csv;

skeleton(); load();
})();
