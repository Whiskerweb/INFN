// Classe une question par thème (mots-clés de la question, puis sections citées) et lit les balises de la réponse.
const THEMES=[
  ["Chiffres clés",/taux|statisti|chiffre|r[ée]ussite|inscrits|abandon|satisfa|promotion/],
  ["Tarifs et frais",/tarif|co[uû]t|prix|frais|€|euro|payer|cher|gratuit/],
  ["Financement",/financ|opco|contrat de pro|professionnalisation|employeur|cpf|cfp|r[ée]mun[ée]r|salaire|alternance|cdd|cdi/],
  ["Admission et candidature",/admission|admis|candidat|inscri|dossier|pr[ée]requis|licence|master|dipl[oô]me requis|[ée]quivalence|acc[eè]s|condition|public concern/],
  ["Examen et validation",/examen|[ée]preuve|oral|[ée]crit|note|contr[oô]le continu|[ée]chec|rattrapage|redoubl|valid/],
  ["Programme et rythme",/distance|en ligne|pr[ée]sentiel|module|programme|cours|heure|dur[ée]e|emploi du temps|rythme|planning|mati[eè]re|enseign/],
  ["Débouchés et métiers",/d[ée]bouch|m[ée]tier|emploi|poste|carri[eè]re|insertion|poursuite|ecct|notaire|collaborateur|r[ée]dacteur/],
  ["Sites et contact",/site|ville|o[uù] |paris|lyon|bordeaux|lille|nantes|rennes|toulouse|strasbourg|montpellier|dijon|rouen|poitiers|n[iî]mes|aix|clermont|ultramarin|contact|t[ée]l[ée]phone|adresse|mail/],
];
const SRC_THEME=[[/frais/i,"Tarifs et frais"],[/contrat|embauche|r[ée]mun/i,"Financement"],[/public|condition|candidature|inscription/i,"Admission et candidature"],[/examen|validation|[ée]chec|contr[oô]le/i,"Examen et validation"],[/module|dur[ée]e|emploi du temps|pr[ée]sence/i,"Programme et rythme"],[/d[ée]bouch|m[ée]tier|poursuite/i,"Débouchés et métiers"],[/o[uù] pr[ée]parer|contacter|site/i,"Sites et contact"],[/statisti|chiffres|taux/i,"Chiffres clés"]];
const norm=s=>String(s||"").toLowerCase();
export function themeOf(q,sources=[]){
  const n=norm(q);
  for(const [name,re] of THEMES) if(re.test(n)) return name;
  for(const s of sources) for(const [re,name] of SRC_THEME) if(re.test(s)) return name;
  return "Autre";
}
export function parseAnswer(raw){
  const visible=String(raw||"").split("[[")[0].trim();
  const sm=raw.match(/\[\[\s*sources?\s*:([^\]]*)\]\]/i);
  const sources=sm?sm[1].split("|").map(s=>s.replace(/^#+/,"").trim()).filter(Boolean).slice(0,3):[];
  const noAnswer=/\[\[\s*sans-r[ée]ponse\s*\]\]/i.test(raw)||/je n'ai pas (cette|d')information/i.test(visible);
  return { visible, sources, answered:!noAnswer, sites:/\[\[\s*sites\s*\]\]/i.test(raw) };
}
