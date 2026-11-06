/* Assistant INFN — démonstration (Snipia). Réponses générées par l'IA via le serveur local (/api/chat), uniquement à partir du texte de la page DMN. */
(function(){
  const PAGE="https://www.infn.fr/?formation=diplome-metiers-notariat";
  const SRC={
    page:{t:"Diplôme des métiers du notariat",u:PAGE,k:"web"},
    frais:{t:"DMN · Frais de formation 2026/2027",u:PAGE,k:"web"},
    notice:{t:"Notice de candidature 2026",u:"https://www.infn.fr/download/preparation-au-dmn-notice-de-candidature-2026/",k:"pdf"},
    fin:{t:"Fiche financement employeur 2026",u:"https://www.infn.fr/download/dmn-fiche-financement-employeur-2026/",k:"pdf"},
    guide:{t:"Guide de formation DMN 2026",u:"https://www.infn.fr/download/guide-de-formation-du-diplome-des-metiers-du-notariat-dmn-2026/",k:"pdf"},
    sites:{t:"Sites d'enseignement",u:"https://www.infn.fr/sites-enseignement/",k:"web"},
    test:{t:"Test d'autopositionnement DMN",u:"https://www.infn.fr/download/test-dautopositionnement-en-vue-de-lentree-en-dmn/",k:"pdf"}
  };
  const SITES=["Aix-en-Provence","Bordeaux","Clermont-Ferrand","Dijon","Lille","Lyon","Montpellier","Nantes","Nîmes","Paris","Poitiers","Rennes","Rouen","Strasbourg","Toulouse","Territoires ultramarins"];
  const START=["Combien coûte le DMN ?","Quelles conditions d'admission ?","Où préparer le DMN ?","Comment financer ma formation ?"];

  const I={
    chat:'<svg class="snx-ico-chat" viewBox="0 0 24 24" fill="none"><path d="M12 3c5 0 9 3.4 9 7.6 0 4.2-4 7.6-9 7.6-1 0-2-.1-2.9-.4L5 19.5l1-3.5C4.2 14.6 3 12.7 3 10.6 3 6.4 7 3 12 3Z" fill="#fff"/><circle cx="8.3" cy="10.7" r="1.2" fill="#03256C"/><circle cx="12" cy="10.7" r="1.2" fill="#03256C"/><circle cx="15.7" cy="10.7" r="1.2" fill="#14CCFF"/></svg>',
    close:'<svg class="snx-ico-close" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    min:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
    reset:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    expand:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    mic:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    euro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6.5A7 7 0 1 0 18 17.5M4 10h9M4 14h9"/></svg>',
    cap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M2 9l10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/></svg>',
    mail:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    doc:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/></svg>',
    send:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12 20 4l-6 16-2.5-6.5L4 12Z" fill="#fff"/></svg>'
  };
  const MARK='<span>IN<i>FN</i></span>';

  const root=document.createElement("div"); root.id="snx-root";
  root.innerHTML=`
  <div class="snx-teaser" role="status"><button class="snx-x" aria-label="Fermer">×</button><b>Une question sur le DMN ? 👋</b>Coût, admission, financement, sites… je vous réponds tout de suite.</div>
  <section class="snx-panel" role="dialog" aria-label="Assistant INFN">
    <header class="snx-head">
      <div class="snx-top">
        <div class="snx-av">${MARK}</div>
        <div class="snx-title"><b>Assistant INFN</b><small>En ligne · répond 24 h/24</small></div>
        <button class="snx-hbtn" data-expand aria-label="Agrandir">${I.expand}</button>
        <button class="snx-hbtn" data-close aria-label="Réduire">${I.min}</button>
      </div>
      <div class="snx-scope">Diplôme des métiers du notariat · 16 sites</div>
    </header>
    <div class="snx-body"></div>
    <footer class="snx-foot">
      <div class="snx-acts"><a href="https://www.infn.fr/demande-informations/" target="_blank" rel="noopener">${I.mail}Demande d'info</a><a href="https://www.infn.fr/sites-enseignement/" target="_blank" rel="noopener">${I.pin}Trouver mon site</a><a href="${SRC.guide.u}" target="_blank" rel="noopener">${I.doc}Guide DMN</a></div>
      <form class="snx-input"><textarea rows="1" placeholder="Écrivez ou dictez votre question…" aria-label="Votre question"></textarea><button type="button" class="snx-mic" aria-label="Dicter">${I.mic}</button><button class="snx-send" aria-label="Envoyer">${I.send}</button></form>
      <div class="snx-brand">Assistant automatique · <button data-reset>Nouvelle conversation</button> · <a href="https://www.infn.fr/politique-confidentialite/" target="_blank" rel="noopener">Confidentialité</a></div>
    </footer>
  </section>
  <button class="snx-launch" aria-label="Ouvrir l'assistant">${I.chat}${I.close}<span class="snx-badge">1</span></button>`;
  document.body.appendChild(root);

  const body=root.querySelector(".snx-body"), ta=root.querySelector("textarea"), teaser=root.querySelector(".snx-teaser");
  let busy=false, started=false;
  const scroll=()=>{ body.scrollTop=body.scrollHeight; };
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  function bubble(html,me){
    const m=document.createElement("div"); m.className="snx-msg"+(me?" me":"");
    m.innerHTML=(me?"":`<div class="snx-mav">${MARK}</div>`)+`<div class="snx-bub">${html}</div>`;
    body.appendChild(m); scroll(); return m.querySelector(".snx-bub");
  }
  function chips(list){
    const c=document.createElement("div"); c.className="snx-chips";
    list.forEach(q=>{const b=document.createElement("button"); b.className="snx-chip"; b.textContent=q; b.onclick=()=>ask(q); c.appendChild(b);});
    body.appendChild(c); scroll();
  }
  function sources(keys){
    const d=document.createElement("div"); d.className="snx-src";
    d.innerHTML=keys.map(k=>{const s=SRC[k];return `<a class="${s.k}" href="${s.u}" target="_blank" rel="noopener"><em>${s.k==="pdf"?"PDF":"WEB"}</em>${s.t}</a>`;}).join("")+"<small>Sources consultées</small>";
    body.appendChild(d); scroll();
  }
  async function typeIn(el,html){
    // effet de rédaction progressive, mot par mot, en gardant les balises
    const parts=html.split(/(<[^>]+>|\s+)/).filter(Boolean); let out="";
    for(const p of parts){ out+=p; if(!p.startsWith("<")&&p.trim()){ el.innerHTML=out; scroll(); await wait(18+Math.random()*22);} }
    el.innerHTML=html; scroll();
  }
  async function botSay(html){
    const t=document.createElement("div"); t.className="snx-msg"; t.innerHTML=`<div class="snx-mav">${MARK}</div><div class="snx-bub snx-typing"><i></i><i></i><i></i></div>`;
    body.appendChild(t); scroll(); await wait(700+Math.random()*500); t.remove();
    await typeIn(bubble(""),html);
  }
  function siteCard(){
    const c=document.createElement("div"); c.className="snx-chips";
    SITES.forEach(s=>{const b=document.createElement("button"); b.className="snx-chip"; b.textContent=s; b.onclick=()=>pickSite(s); c.appendChild(b);});
    body.appendChild(c); scroll();
  }
  async function pickSite(s){
    if(busy) return; busy=true; bubble(s,true);
    await botSay(`Parfait, je note <b>INFN ${s}</b>. Laissez vos coordonnées : votre demande arrivera <b>directement à l'équipe de ce site</b>, déjà qualifiée.`);
    const c=document.createElement("form"); c.className="snx-card";
    c.innerHTML=`<label>Prénom et nom</label><input placeholder="Camille Martin"><label>E-mail</label><input type="email" placeholder="camille@exemple.fr"><button class="snx-cta" type="submit">Être recontacté par INFN ${s}</button><p class="snx-legal">Vos données sont transmises uniquement au site INFN choisi, avec votre accord. Vous pouvez demander leur suppression à tout moment.</p>`;
    c.onsubmit=async e=>{e.preventDefault(); c.querySelector(".snx-cta").textContent="✓ Demande transmise"; c.querySelector(".snx-cta").style.background="#00B2BB";
      await botSay(`C'est noté ! L'équipe de <b>INFN ${s}</b> reçoit votre demande avec le résumé de notre échange. Autre chose ?`); chips(["Combien coûte le DMN ?","Comment financer ma formation ?"]);};
    body.appendChild(c); scroll(); busy=false;
  }
  // --- Réponses générées par l'IA (serveur local /api/chat), à partir du texte de la page uniquement ---
  let history=[];
  const escH=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  function md(src){
    const lines=escH(src).split("\n"); let out="",list=false;
    const inl=s=>s.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
    for(const l of lines){
      const m=l.match(/^\s*[-•*]\s+(.*)/);
      if(m){ if(!list){out+="<ul>";list=true;} out+="<li>"+inl(m[1])+"</li>"; continue; }
      if(list){out+="</ul>";list=false;}
      out+= l.trim()? inl(l)+"<br>" : "<br>";
    }
    if(list) out+="</ul>";
    return out.replace(/(<br>)+$/,"").replace(/(<br>){3,}/g,"<br><br>").replace(/<br>(<ul>)/g,"$1").replace(/(<\/ul>)<br>/g,"$1");
  }
  const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
  function findHeading(title){
    const n=norm(title); if(!n) return null;
    return [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].find(h=>!h.closest("#snx-root")&&norm(h.textContent)===n)
      || [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].find(h=>!h.closest("#snx-root")&&norm(h.textContent).includes(n));
  }
  function pageSources(titles){
    if(!titles.length) return;
    const d=document.createElement("div"); d.className="snx-src";
    titles.forEach(ti=>{
      const a=document.createElement("a"); a.className="web"; a.href=PAGE+"#:~:text="+encodeURIComponent(ti); a.target="_blank"; a.rel="noopener";
      a.innerHTML="<em>WEB</em>"+escH(ti);
      a.onclick=ev=>{ const h=findHeading(ti); if(!h) return; ev.preventDefault();
        if(innerWidth<=520) open(false);
        h.scrollIntoView({behavior:"smooth",block:"center"}); h.classList.add("snx-hl"); setTimeout(()=>h.classList.remove("snx-hl"),2600); };
      d.appendChild(a);
    });
    d.insertAdjacentHTML("beforeend","<small>Section(s) de la page consultée(s)</small>");
    body.appendChild(d); scroll();
  }
  async function ask(q){
    if(busy||!q.trim()) return; busy=true;
    body.querySelectorAll(".snx-chips,.snx-topics,.snx-lead").forEach(c=>c.remove());
    bubble(escH(q),true);
    history.push({role:"user",content:q});
    const t=document.createElement("div"); t.className="snx-msg"; t.innerHTML=`<div class="snx-mav">${MARK}</div><div class="snx-bub snx-typing"><i></i><i></i><i></i></div>`;
    body.appendChild(t); scroll();
    let full="", el=null;
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:history})});
      if(!res.ok||!res.body) throw new Error(await res.text());
      const rd=res.body.getReader(), dec=new TextDecoder();
      for(;;){ const {done,value}=await rd.read(); if(done) break;
        full+=dec.decode(value,{stream:true});
        const visible=full.split("[[")[0];
        if(visible.trim()){ if(!el){ t.remove(); el=bubble(""); } el.innerHTML=md(visible); scroll(); }
      }
    }catch(err){
      full="Désolé, je n'arrive pas à répondre pour le moment. Vous pouvez utiliser le [formulaire de contact](https://www.infn.fr/demande-informations/).";
    }
    if(!el){ t.remove(); el=bubble(""); }
    const visible=full.split("[[")[0].trim();
    el.innerHTML=md(visible);
    history.push({role:"assistant",content:visible});
    const sm=full.match(/\[\[\s*sources?\s*:([^\]]*)\]\]/i);
    pageSources(sm? sm[1].split("|").map(s=>s.replace(/^#+/,"").trim()).filter(Boolean).slice(0,3):[]);
    if(/\[\[\s*sites\s*\]\]/i.test(full)) siteCard();
    busy=false;
  }
  async function welcome(){
    busy=true; body.innerHTML='<p class="snx-day">Aujourd\'hui</p>';
    await botSay("Bonjour 👋 Je suis l'assistant de l'INFN.<br>Je réponds à vos questions sur le <b>Diplôme des métiers du notariat</b> à partir des informations de cette page.");
    busy=false; topics();
  }
  function topics(){
    const T=[["euro","Tarifs","Candidature, formation, examen","Combien coûte le DMN ?"],["cap","Admission","Diplômes requis, alternance","Quelles conditions d'admission ?"],["pin","Sites","16 villes en France","Où préparer le DMN ?"],["wallet","Financement","Contrat pro, OPCO EP","Comment financer ma formation ?"]];
    const l=document.createElement("p"); l.className="snx-lead"; l.textContent="Choisissez un sujet ou écrivez votre question :"; body.appendChild(l);
    const g=document.createElement("div"); g.className="snx-topics";
    T.forEach(([ic,t,s,q])=>{const b=document.createElement("button"); b.className="snx-topic"; b.innerHTML=`<em>${I[ic]}</em><b>${t}</b><small>${s}</small>`; b.onclick=()=>ask(q); g.appendChild(b);});
    body.appendChild(g); scroll();
  }
  function open(v){
    root.classList.toggle("open",v); root.classList.add("seen"); teaser.classList.remove("show");
    if(v&&!started){started=true; welcome();}
    if(v) setTimeout(()=>ta.focus({preventScroll:true}),350);
  }
  root.querySelector(".snx-launch").onclick=()=>open(!root.classList.contains("open"));
  root.querySelector("[data-close]").onclick=()=>open(false);
  root.querySelectorAll("[data-reset]").forEach(b=>b.onclick=()=>{ if(!busy){ history=[]; welcome(); } });
  root.querySelector("[data-expand]").onclick=()=>root.classList.toggle("big");
  teaser.onclick=e=>{ if(e.target.closest(".snx-x")){teaser.classList.remove("show"); root.classList.add("seen"); return;} open(true); };
  root.querySelector("form.snx-input").onsubmit=e=>{e.preventDefault(); const v=ta.value; ta.value=""; ta.style.height=""; ask(v);};
  ta.addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); root.querySelector("form.snx-input").requestSubmit(); }});
  ta.addEventListener("input",()=>{ ta.style.height="auto"; ta.style.height=Math.min(ta.scrollHeight,96)+"px"; });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&root.classList.contains("open")) open(false); });
  setTimeout(()=>{ if(!root.classList.contains("open")) teaser.classList.add("show"); },2200);
})();
