(function () {
  "use strict";

  const app = document.getElementById("brief-app");
  if (!app) return;

  const CONFIG = Object.assign(
    { contactEmail: "", storageKey: "brief-creatif-v1", endpoint: "", token: "", logo: "", brandName: "" },
    window.BRIEF_CREATIF_CONFIG || {}
  );
  // Mode agence : ajouter ?mode=pro à l'adresse pour voir les points de vigilance.
  const PRO = new URLSearchParams(window.location.search).get("mode") === "pro";

  const WORDS = ["Proche","Fiable","Moderne","Chaleureuse","Experte","Engagée","Dynamique","Rassurante","Innovante","Accessible","Solide","Créative","Discrète","Ambitieuse","Militante","Ludique"];

  const STEPS = [
    {t:"La structure", f:[
      {k:"nom", type:"text", l:"Nom de la structure", ph:"Association Les Tilleuls", req:true},
      {k:"secteur", type:"text", l:"Secteur d'activité", ph:"Aide à domicile, culture, sport…"},
      {k:"diff", type:"area", l:"En une phrase : que faites-vous mieux ou autrement que les autres ?", ph:"Nous construisons avec chaque famille un accompagnement qui évolue.", req:true}
    ]},
    {t:"Le projet", f:[
      {k:"type", type:"one", l:"De quoi avez-vous besoin ?", o:["Créer une identité","Faire évoluer l'existante","Refondre complètement","Décliner sur de nouveaux supports"], req:true},
      {k:"curseur", type:"range", l:"Ampleur du changement souhaité", min:1, max:10, v:5, a:"Personne ne doit le remarquer", b:"On doit sentir un vrai renouveau"},
      {k:"pourquoi", type:"area", l:"Pourquoi maintenant ?", ph:"Fusion, nouveau service, identité vieillissante…"}
    ]},
    {t:"Les publics", f:[
      {k:"publics", type:"rank", l:"Choisissez vos 3 publics prioritaires, dans l'ordre", o:["Clients ou usagers","Familles et proches","Prescripteurs et partenaires","Financeurs et institutions","Candidats et salariés","Bénévoles","Grand public","Presse"], max:3, req:true},
      {k:"question", type:"area", l:"Quelle est la vraie question de votre public n°1 ?", ph:"Puis-je vous faire confiance avec mon proche ?"}
    ]},
    {t:"La personnalité", f:[
      {k:"axes", type:"scales", l:"Placez chaque curseur là où votre marque doit être demain", o:[["Classique","Audacieuse"],["Sobre","Expressive"],["Institutionnelle","Proche"],["Sérieuse","Ludique"],["Locale","Nationale"]]},
      {k:"auj", type:"words", l:"3 mots qui vous décrivent aujourd'hui", max:3},
      {k:"dem", type:"words", l:"3 mots qu'on doit associer à vous demain", max:3, req:true}
    ]},
    {t:"L'héritage", f:[
      {k:"garder", type:"multi", l:"Ce qui est intouchable", o:["Le nom","Le logo","Les couleurs","La typographie","Le slogan","Rien, tout est ouvert"]},
      {k:"attache", type:"one", l:"Vos équipes sont-elles attachées à l'identité actuelle ?", o:["Très attachées","Un peu","Pas du tout","Je ne sais pas"]},
      {k:"droits", type:"one", l:"Êtes-vous propriétaire des droits sur votre logo actuel ?", o:["Oui, cession écrite","Non","Je ne sais pas","Pas de logo actuel"]}
    ]},
    {t:"Les usages", f:[
      {k:"supports", type:"multi", l:"Où la marque doit-elle vivre ?", o:["Réseaux sociaux","Site internet","Signalétique","Véhicules","Imprimés","Documents internes","Application ou favicon","Tenues","Goodies","Événements"], req:true},
      {k:"tech", type:"multi", l:"Contraintes particulières", o:["Impression noir et blanc","Très petites tailles","Public âgé ou malvoyant","Broderie ou gravure","Plusieurs services à distinguer","Co-marquage avec un partenaire"]},
      {k:"gal", type:"area", l:"Où votre identité actuelle vous pose-t-elle problème ?", ph:"Le logo est trop large pour les bannières…"}
    ]},
    {t:"Les inspirations", f:[
      {k:"aime", type:"area", l:"Des marques que vous admirez, tous secteurs confondus, et pourquoi", ph:"Decathlon : tout est cohérent, du magasin à l'appli."},
      {k:"conc", type:"area", l:"Vos concurrents ou voisins visuels", ph:"Les autres associations du territoire…"},
      {k:"eviter", type:"area", l:"Ce que vous ne voulez surtout pas", ph:"Une maison avec un cœur, du clipart…"}
    ]},
    {t:"Les moyens", f:[
      {k:"budget", type:"one", l:"Budget envisagé", o:["Moins de 2 000 €","2 000 à 5 000 €","5 000 à 15 000 €","Plus de 15 000 €","À définir"]},
      {k:"delai", type:"one", l:"Délai souhaité", o:["Moins d'un mois","1 à 3 mois","3 à 6 mois","Pas d'urgence"]},
      {k:"valid", type:"text", l:"Qui valide au final ?", ph:"Bureau, conseil d'administration…", req:true}
    ]}
  ];

  const FIELDS = {};
  STEPS.forEach(s => s.f.forEach(f => { FIELDS[f.k] = f; }));
  const el = id => document.getElementById("bc-" + id);
  let st = {}, cur = 0, briefText = "", lastVig = [], ready = false;

  function fresh() {
    const s = {};
    STEPS.forEach(step => step.f.forEach(f => {
      if (f.type === "range") s[f.k] = f.v;
      else if (f.type === "scales") s[f.k] = f.o.map(() => 50);
      else if (["multi","words","rank"].includes(f.type)) s[f.k] = [];
      else s[f.k] = "";
    }));
    s._id = uid();
    return s;
  }
  const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  function save() {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify({ st: st, cur: cur })); } catch (e) {}
  }
  // Ne reprend d'une source externe que les clés connues et de même type.
  function merge(base, src) {
    if (!src || typeof src !== "object") return base;
    Object.keys(base).forEach(k => {
      if (Array.isArray(base[k])) { if (Array.isArray(src[k])) base[k] = src[k].slice(0, 30); }
      else if (typeof base[k] === typeof src[k]) base[k] = src[k];
    });
    return base;
  }
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function dec(x) { return JSON.parse(decodeURIComponent(escape(atob(x.replace(/-/g, "+").replace(/_/g, "/"))))); }
  function load() {
    st = fresh(); cur = 0;
    try {
      const d = JSON.parse(localStorage.getItem(CONFIG.storageKey));
      if (d && d.st) { merge(st, d.st); cur = Math.min(d.cur || 0, STEPS.length); }
    } catch (e) {}
    const m = /^#b=([\w-]+)$/.exec(window.location.hash);
    if (m) {
      try { st = merge(fresh(), dec(m[1])); cur = STEPS.length; history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) {}
    }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }
  function setErr(k, t) { const e = el("err-" + k); if (e) e.textContent = t || ""; }
  function focusHeading() { const h = el("step").querySelector("h3"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
  function toTop() { app.scrollIntoView({ behavior: "smooth", block: "start" }); }

  function chips(f) {
    const v = st[f.k];
    const opts = f.type === "words" ? WORDS.concat(v.filter(x => !WORDS.includes(x))) : f.o;
    return '<div class="bc-chips" role="group" aria-labelledby="bc-lbl-' + f.k + '">' + opts.map(o => {
      const sel = f.type === "one" ? v === o : v.includes(o);
      const badge = f.type === "rank" && sel ? '<span class="bc-rk">' + (v.indexOf(o) + 1) + '</span>' : "";
      const cls = "bc-chip" + (f.type === "rank" ? " bc-rank" : "");
      return '<button type="button" class="' + cls + '" aria-pressed="' + sel + '" data-c="' + f.k + '" data-v="' + esc(o) + '">' + badge + esc(o) + '</button>';
    }).join("") + '</div>';
  }

  function field(f) {
    const v = st[f.k];
    let h = '<div class="bc-field"><span class="bc-lbl" id="bc-lbl-' + f.k + '">' + esc(f.l)
      + (f.req ? '<span class="bc-req" aria-hidden="true">*</span>' : "") + '</span>';
    if (f.type === "text") {
      h += '<input type="text" id="bc-in-' + f.k + '" data-k="' + f.k + '" aria-labelledby="bc-lbl-' + f.k + '" placeholder="' + esc(f.ph) + '" value="' + esc(v) + '">';
    } else if (f.type === "area") {
      h += '<textarea id="bc-in-' + f.k + '" data-k="' + f.k + '" aria-labelledby="bc-lbl-' + f.k + '" rows="3" placeholder="' + esc(f.ph) + '">' + esc(v) + '</textarea>';
    } else if (f.type === "range") {
      h += '<div class="bc-range-row"><input type="range" min="' + f.min + '" max="' + f.max + '" step="1" value="' + v + '" data-r="' + f.k + '" aria-labelledby="bc-lbl-' + f.k + '"><span class="bc-range-val" id="bc-o-' + f.k + '">' + v + '/10</span></div>'
        + '<div class="bc-range-ends"><span>' + esc(f.a) + '</span><span>' + esc(f.b) + '</span></div>';
    } else if (f.type === "scales") {
      h += f.o.map((p, i) => '<div class="bc-scale"><span class="bc-l">' + esc(p[0]) + '</span><input type="range" min="0" max="100" step="1" value="' + v[i] + '" data-s="' + f.k + '" data-i="' + i + '" aria-label="' + esc(p[0] + " ou " + p[1]) + '"><span>' + esc(p[1]) + '</span></div>').join("");
    } else {
      h += chips(f);
      if (f.type === "words") {
        h += '<div class="bc-addrow"><input type="text" id="bc-cw-' + f.k + '" placeholder="Un autre mot" aria-label="Ajouter un mot"><button type="button" class="bc-btn" data-add="' + f.k + '">Ajouter</button></div>'
          + '<p class="bc-hint">' + v.length + '/' + f.max + ' mots choisis</p>';
      }
      if (f.type === "rank") h += '<p class="bc-hint">Cliquez dans l\'ordre de priorité. Cliquez à nouveau pour retirer.</p>';
    }
    if (f.k === "droits" && (v === "Non" || v === "Je ne sais pas")) {
      h += '<p class="bc-warn">À vérifier avant tout : modifier un logo sans cession de droits peut poser problème.</p>';
    }
    return h + '<p class="bc-err" id="bc-err-' + f.k + '"></p></div>';
  }

  function render(focusSel) {
    el("prog").innerHTML = STEPS.map((s, i) => '<span class="' + (i <= cur ? "bc-on" : "") + '"></span>').join("");
    if (cur >= STEPS.length) { renderBrief(); return; }
    const s = STEPS[cur];
    el("step").innerHTML = '<p class="bc-stepno">Étape ' + (cur + 1) + ' sur ' + STEPS.length + '</p><h3 class="bc-h">' + esc(s.t) + '</h3>' + s.f.map(field).join("");
    el("nav").innerHTML = '<div class="bc-navrow">'
      + (cur > 0 ? '<button type="button" class="bc-btn" id="bc-prev">← Retour</button>' : '<span><button type="button" class="bc-btn" id="bc-impb">Importer un brief</button><input type="file" id="bc-imp" accept=".json,application/json" hidden></span>')
      + '<button type="button" class="bc-btn bc-btn-primary" id="bc-next">' + (cur === STEPS.length - 1 ? "Générer le brief" : "Suivant →") + '</button></div>';
    bind();
    if (focusSel) { const f = app.querySelector(focusSel); if (f) f.focus(); }
    else if (ready) focusHeading();
    save();
  }

  function bind() {
    const root = el("step");
    root.querySelectorAll("[data-k]").forEach(x => x.addEventListener("input", () => {
      st[x.dataset.k] = x.value; setErr(x.dataset.k); save();
    }));
    root.querySelectorAll("[data-r]").forEach(x => x.addEventListener("input", () => {
      st[x.dataset.r] = +x.value; el("o-" + x.dataset.r).textContent = x.value + "/10"; save();
    }));
    root.querySelectorAll("[data-s]").forEach(x => x.addEventListener("input", () => {
      st[x.dataset.s][+x.dataset.i] = +x.value; save();
    }));
    root.querySelectorAll("[data-c]").forEach(x => x.addEventListener("click", () => {
      const k = x.dataset.c, v = x.dataset.v, f = FIELDS[k];
      if (f.type === "one") st[k] = v;
      else {
        const a = st[k], i = a.indexOf(v);
        if (i >= 0) a.splice(i, 1);
        else {
          if (f.max && a.length >= f.max) { setErr(k, f.max + " choix maximum. Retirez-en un d'abord."); return; }
          a.push(v);
        }
      }
      render('[data-c="' + k + '"][data-v="' + CSS.escape(v) + '"]');
    }));
    root.querySelectorAll("[data-add]").forEach(x => {
      const k = x.dataset.add, inp = el("cw-" + k);
      const add = () => {
        const v = inp.value.trim();
        if (!v) { setErr(k, "Écrivez un mot d'abord."); return; }
        if (st[k].length >= FIELDS[k].max) { setErr(k, FIELDS[k].max + " mots maximum. Retirez-en un d'abord."); return; }
        if (!st[k].includes(v)) st[k].push(v);
        render("#bc-cw-" + k);
      };
      x.addEventListener("click", add);
      inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); add(); } });
      inp.addEventListener("input", () => setErr(k));
    });
    const ib = document.getElementById("bc-impb"), inp = document.getElementById("bc-imp");
    if (ib && inp) {
      ib.addEventListener("click", () => inp.click());
      inp.addEventListener("change", () => {
        const f = inp.files[0]; if (!f) return;
        f.text().then(t => { const d = JSON.parse(t); st = merge(fresh(), d.data || d); cur = 0; render(); toTop(); })
          .catch(() => window.alert("Fichier illisible : choisissez un brief exporté en .json."));
      });
    }
    const p = document.getElementById("bc-prev");
    if (p) p.addEventListener("click", () => { cur--; render(); toTop(); });
    document.getElementById("bc-next").addEventListener("click", () => {
      if (validate()) { cur++; render(); toTop(); }
    });
  }

  function validate() {
    let first = null;
    STEPS[cur].f.forEach(f => {
      if (!f.req) return;
      const v = st[f.k];
      const ok = Array.isArray(v) ? v.length > 0 : String(v || "").trim() !== "";
      if (!ok) { setErr(f.k, "Répondez à cette question pour continuer."); if (!first) first = f.k; }
    });
    if (first) {
      const f = el("in-" + first) || app.querySelector('[data-c="' + first + '"]');
      if (f) f.focus();
      return false;
    }
    return true;
  }

  function level(c) { return c <= 3 ? "évolution légère" : c <= 7 ? "rafraîchissement" : "refonte en profondeur"; }

  function vigilance() {
    const v = [], t = st.tech, c = st.curseur;
    if (st.droits === "Non" || st.droits === "Je ne sais pas") v.push("Vérifier la propriété des droits sur le logo avant tout travail.");
    if (c >= 8 && st.attache === "Très attachées") v.push("Ambition forte mais équipes attachées : prévoir une vraie pédagogie du changement.");
    if (c >= 8 && st.budget === "Moins de 2 000 €") v.push("Ambition élevée pour le budget : prioriser les supports et phaser le déploiement.");
    if (t.includes("Public âgé ou malvoyant")) v.push("Accessibilité : contrastes d'au moins 4,5, typographie très lisible, tailles généreuses.");
    if (t.includes("Co-marquage avec un partenaire")) v.push("Prévoir une version endossée du logo et des règles de co-marquage.");
    if (t.includes("Plusieurs services à distinguer")) v.push("Construire un système de déclinaison des services sans morceler la marque.");
    if (t.includes("Impression noir et blanc") || t.includes("Broderie ou gravure")) v.push("Le logo doit fonctionner en une seule couleur dès la première esquisse.");
    if (st.garder.includes("Le logo") && c >= 7) v.push("Le logo est déclaré intouchable mais l'ambition est forte : clarifier ce point en premier.");
    if (st.garder.includes("Rien, tout est ouvert") && st.garder.length > 1) v.push("Réponses contradictoires sur ce qui est intouchable : à clarifier.");
    if (st.delai === "Moins d'un mois" && c >= 7) v.push("Délai très court pour une refonte : envisager un déploiement en deux temps.");
    return v;
  }

  function sections() {
    const s = st, ax = FIELDS.axes.o;
    const d = x => (x && String(x).trim()) || "–";
    const j = a => a.length ? a.join(", ") : "–";
    return [
      {h:"1. La structure", r:[["Secteur", d(s.secteur)], ["Ce qui nous distingue", d(s.diff)]]},
      {h:"2. Le projet", r:[["Besoin", d(s.type)], ["Ampleur", s.curseur + "/10 (" + level(s.curseur) + ")"], ["Pourquoi maintenant", d(s.pourquoi)]]},
      {h:"3. Les publics", r:[["Publics prioritaires", s.publics.map((p, i) => (i + 1) + ". " + p).join("  ")], ["Question clé du public n°1", d(s.question)]]},
      {h:"4. La personnalité", r: ax.map((p, i) => [p[0] + " / " + p[1], s.axes[i] + "/100"]).concat([["Aujourd'hui", j(s.auj)], ["Demain", j(s.dem)]])},
      {h:"5. L'héritage", r:[["Intouchable", j(s.garder)], ["Attachement des équipes", d(s.attache)], ["Droits sur le logo", d(s.droits)]]},
      {h:"6. Les usages", r:[["Supports", j(s.supports)], ["Contraintes", j(s.tech)], ["Problèmes actuels", d(s.gal)]]},
      {h:"7. Les inspirations", r:[["Marques admirées", d(s.aime)], ["Concurrents", d(s.conc)], ["À éviter", d(s.eviter)]]},
      {h:"8. Les moyens", r:[["Budget", d(s.budget)], ["Délai", d(s.delai)], ["Validation", d(s.valid)]]}
    ];
  }

  function renderBrief() {
    const s = st, ax = FIELDS.axes.o, all = vigilance(), v = PRO ? all : [], secs = sections();
    lastVig = all;
    const date = new Date().toLocaleDateString("fr-FR");
    briefText = "BRIEF CRÉATIF – " + s.nom + " (" + date + ")\n"
      + secs.map(x => "\n" + x.h + "\n" + x.r.map(r => r[0] + " : " + r[1]).join("\n")).join("\n")
      + (v.length ? "\n\nPoints de vigilance\n" + v.map(x => "- " + x).join("\n") : "");
    const bars = ax.map((p, i) => '<div class="bc-scale"><span class="bc-l">' + esc(p[0]) + '</span><div class="bc-bar"><span style="left:calc(' + s.axes[i] + '% - 8px)"></span></div><span>' + esc(p[1]) + '</span></div>').join("");
    el("step").innerHTML = '<div class="bc-card">' + logoHtml()
      + '<p class="bc-stepno">Brief créatif · ' + date + '</p><h3 class="bc-h" style="margin-bottom:4px">' + esc(s.nom) + '</h3><p class="bc-intro" style="margin-bottom:8px">' + esc(s.diff) + '</p>'
      + '<div class="bc-kpis">'
      + '<div class="bc-kpi"><p class="bc-k">Ampleur</p><p class="bc-v">' + s.curseur + '/10</p><p class="bc-k">' + level(s.curseur) + '</p></div>'
      + '<div class="bc-kpi"><p class="bc-k">Public n°1</p><p class="bc-v">' + esc(s.publics[0]) + '</p></div>'
      + '<div class="bc-kpi"><p class="bc-k">Budget et délai</p><p class="bc-v">' + esc(s.budget || "À définir") + '</p><p class="bc-k">' + esc(s.delai || "–") + '</p></div>'
      + '</div>'
      + '<p class="bc-h3">Personnalité visée</p>' + bars
      + '<p class="bc-h3">De… à…</p><div>'
      + (s.auj.length ? s.auj : ["non renseigné"]).map(w => '<span class="bc-tag">' + esc(w) + '</span>').join("")
      + '<span aria-hidden="true" style="margin:0 8px 0 2px">→</span>'
      + s.dem.map(w => '<span class="bc-tag bc-to">' + esc(w) + '</span>').join("") + '</div>'
      + (v.length ? '<p class="bc-h3">Points de vigilance</p>' + v.map(x => '<p class="bc-vig"><span aria-hidden="true" style="color:var(--bc-warning)">⚠</span><span>' + esc(x) + '</span></p>').join("") : "")
      + secs.map(x => '<p class="bc-h3">' + esc(x.h) + '</p>' + x.r.map(r => '<div class="bc-row"><span class="bc-k">' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></div>').join("")).join("")
      + '</div>';
    el("nav").innerHTML = '<div class="bc-actions">'
      + (CONFIG.endpoint ? `<button type="button" class="bc-btn bc-btn-primary" id="bc-send">Envoyer à l'équipe</button>` : "")
      + '<button type="button" class="bc-btn bc-btn-primary" id="bc-pdf">Télécharger en PDF</button>'
      + '<button type="button" class="bc-btn" id="bc-cp">Copier le brief</button>'
      + '<button type="button" class="bc-btn" id="bc-md">Télécharger (.md)</button>'
      + '<button type="button" class="bc-btn" id="bc-json">Sauvegarder (.json)</button>'
      + '<button type="button" class="bc-btn" id="bc-link">Copier un lien de partage</button>'
      + '<button type="button" class="bc-btn" id="bc-ed">Modifier</button>'
      + '<button type="button" class="bc-btn" id="bc-rs">Recommencer</button>'
      + '</div><p class="bc-msg" id="bc-msg" role="status"></p>';
    el("pdf").addEventListener("click", () => window.print());
    el("cp").addEventListener("click", () => copyText(briefText, "Brief copié"));
    const sl = String(s.nom).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brief";
    if (el("send")) el("send").addEventListener("click", send);
    el("md").addEventListener("click", () => dl("brief-" + sl + ".md", mdText(secs), "text/markdown"));
    el("json").addEventListener("click", () => dl("brief-" + sl + ".json", JSON.stringify(payload(), null, 2), "application/json"));
    el("link").addEventListener("click", () => copyText(window.location.href.split(/[?#]/)[0] + "#b=" + enc(st), "Lien copié"));
    el("ed").addEventListener("click", () => { cur = STEPS.length - 1; render(); toTop(); });
    el("rs").addEventListener("click", () => {
      if (!window.confirm("Effacer toutes les réponses et recommencer ?")) return;
      try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
      st = fresh(); cur = 0; render(); toTop();
    });
    if (ready) focusHeading();
    save();
  }

  const msg = t => { const m = el("msg"); if (m) m.textContent = t; };
  function logoHtml() {
    return CONFIG.logo ? '<img class="bc-logo" src="' + esc(CONFIG.logo) + '" alt="' + esc(CONFIG.brandName) + '">' : "";
  }
  function payload() {
    return { version: 1, id: st._id, date: new Date().toISOString(), data: st, vigilances: lastVig, text: briefText };
  }
  function mdText(secs) {
    return "# Brief créatif – " + st.nom + "\n_" + new Date().toLocaleDateString("fr-FR") + "_\n\n"
      + secs.map(x => "## " + x.h + "\n" + x.r.map(r => "- **" + r[0] + "** : " + String(r[1]).replace(/\s*\n+\s*/g, " ")).join("\n")).join("\n\n")
      + (PRO && lastVig.length ? "\n\n## Points de vigilance\n" + lastVig.map(x => "- " + x).join("\n") : "") + "\n";
  }
  function dl(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function send() {
    msg("Envoi en cours…");
    fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ token: CONFIG.token }, payload())) })
      .then(r => r.json())
      .then(j => msg(j.ok ? "Brief envoyé à l'équipe." : "Envoi refusé (" + (j.error || "erreur") + "). Sauvegardez le .json et transmettez-le."))
      .catch(() => msg("Envoi impossible. Sauvegardez le .json et transmettez-le."));
  }
  function copyText(t, ok) {
    const done = () => msg(ok);
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = t; ta.style.position = "absolute"; ta.style.left = "-9999px";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); }
      catch (e) { msg("Copie impossible, sélectionnez le texte manuellement."); }
      ta.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fallback);
    else fallback();
  }

  const head = app.querySelector("header");
  if (head) head.insertAdjacentHTML("afterbegin", logoHtml());
  load();
  render();
  ready = true;
})();