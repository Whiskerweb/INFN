// Classe une question par thème (mots-clés de la question, puis sections citées) et lit les balises de la réponse.
const THEMES=[
  ["Chiffres clés",/taux|statisti|chiffre|r[ée]ussite|inscrits|abandon|satisfait|satisfaction|promotion|[ée]tudiants par classe/],
  ["Tarifs et frais",/tarif|co[uû]t|prix|frais|€|euro|payer|cher|gratuit|bourse|plusieurs fois/],
  ["Financement et rémunération",/financ|opco|contrat de pro|professionnalisation|employeur|cpf|cfp|r[ée]mun[ée]r|salaire|pay[ée]|cdd|cdi/],
  ["Stage et alternance",/stage|alternance|office|[ée]tude notariale|cabinet|temps partiel|trouver (un|une|mon|ma) (employeur|[ée]tude)/],
  ["VAE et expérience",/\bvae\b|validation des acquis|exp[ée]rience|sans la formation/],
  ["Examen et validation",/examen|[ée]preuve|oral|[ée]crit|note|contr[oô]le continu|\brate\b|[ée]chec|rattrapage|redoubl/],
  ["Admission et candidature",/admission|admis|candidat|postuler|inscri|dossier|pr[ée]requis|licence|master|bts|bac|[ée]quivalence|entretien|test d.entr|conditions?|handicap|visiter|portes ouvertes/],
  ["Reconnaissance du diplôme",/niveau|rncp|reconnu|dipl[oô]me d.[ée]tat|desn|diff[ée]rence/],
  ["Programme et rythme",/distance|en ligne|pr[ée]sentiel|module|programme|cours|heure|dur[ée]e|dure |commence|rentr[ée]e|emploi du temps|rythme|planning|mati[eè]re|urbanisme|droit de la famille|[ée]tranger/],
  ["Débouchés et métiers",/d[ée]bouch|m[ée]tier|emploi apr|poste|carri[eè]re|insertion|poursuite|ecct|devenir notaire|apr[eè]s le dmn/],
  ["Sites et contact",/\bo[uù] (peut|pr[ée]parer|[ée]tudier|se trouve)|\binfn (de |d')?[a-z]|nancy|marseille|guadeloupe|martinique|r[ée]union|paris|lyon|bordeaux|lille|nantes|rennes|toulouse|strasbourg|montpellier|dijon|rouen|poitiers|n[iî]mes|aix|clermont|ultramarin|contact|t[ée]l[ée]phone|adresse|mail|logement|cantine|parking|guide/],
];
const SRC_THEME=[[/frais/i,"Tarifs et frais"],[/contrat|embauche|r[ée]mun/i,"Financement et rémunération"],[/stage/i,"Stage et alternance"],[/public|condition|candidature|inscription/i,"Admission et candidature"],[/examen|validation|[ée]chec|contr[oô]le/i,"Examen et validation"],[/module|dur[ée]e|emploi du temps|pr[ée]sence/i,"Programme et rythme"],[/objectif/i,"Reconnaissance du diplôme"],[/d[ée]bouch|m[ée]tier|poursuite/i,"Débouchés et métiers"],[/o[uù] pr[ée]parer|contacter|site/i,"Sites et contact"],[/statisti|chiffres|taux/i,"Chiffres clés"]];
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
