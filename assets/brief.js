(function () {
  "use strict";

  const app = document.getElementById("brief-app");
  if (!app) return;

  const CONFIG = Object.assign(
    { contactEmail: "", storageKey: "brief-creatif-v1", endpoint: "", token: "", logo: "", brandName: "", brandColor: "" },
    window.BRIEF_CREATIF_CONFIG || {}
  );
  // Mode agence : ajouter ?mode=pro à l'adresse pour voir les points de vigilance.
  if (/^#[0-9a-f]{6}$/i.test(CONFIG.brandColor)) app.style.setProperty("--bc-brand", CONFIG.brandColor);
  const PRO = new URLSearchParams(window.location.search).get("mode") === "pro";

  const WORDS = window.BRIEF_WORDS || [];
  const TPLS = window.BRIEF_TEMPLATES || {};
  let STEPS = [];

  const FIELDS = {};
  Object.keys(TPLS).forEach(k => TPLS[k].steps.forEach(x => x.f.forEach(f => { FIELDS[f.k] = f; })));
  const el = id => document.getElementById("bc-" + id);
  let st = {}, cur = 0, briefText = "", lastVig = [], ready = false, fromBrief = false;

  function fresh() {
    const s = {};
    Object.keys(FIELDS).forEach(key => { const f = FIELDS[key];
      if (f.type === "range") s[f.k] = f.v;
      else if (f.type === "scales") s[f.k] = f.o.map(() => 50);
      else if (["multi","words","rank"].includes(f.type)) s[f.k] = [];
      else s[f.k] = "";
    });
    s._id = uid(); s._t = ""; s._logo = "";
    return s;
  }
  const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  function save() {
    updateLive();
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
  function setT(k) { if (TPLS[k]) { st._t = k; STEPS = TPLS[k].steps; } else { st._t = ""; STEPS = []; } }
  function load() {
    st = fresh(); cur = 0;
    try {
      const d = JSON.parse(localStorage.getItem(CONFIG.storageKey));
      if (d && d.st) { merge(st, d.st); cur = d.cur || 0; }
    } catch (e) {}
    const m = /^#b=([\w-]+)$/.exec(window.location.hash);
    if (m) {
      try { st = merge(fresh(), dec(m[1])); cur = 99; history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) {}
    }
    setT(st._t);
    const q = new URLSearchParams(window.location.search).get("t");
    if (!st._t && TPLS[q]) setT(q);
    cur = Math.min(cur, STEPS.length);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }
  function setErr(k, t) { const e = el("err-" + k); if (e) e.textContent = t || ""; }
  function focusHeading() { const h = el("step").querySelector("h3"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
  function toTop() { app.scrollIntoView({ behavior: "smooth", block: "start" }); }

  // ---- Contrôles v1.3 : bascules, contrôle segmenté, sélecteur en arc ----
  function toggles(f) {
    const v = st[f.k];
    return '<div class="bc-toggles" role="group" aria-labelledby="bc-lbl-' + f.k + '">' + f.o.map(o => {
      const on = v.includes(o);
      return '<div class="bc-trow"><span>' + esc(o) + '</span><button type="button" class="bc-sw' + (on ? " bc-on" : "") + '" role="switch" aria-checked="' + on + '" aria-label="' + esc(o) + '" data-c="' + f.k + '" data-v="' + esc(o) + '"></button></div>';
    }).join("") + '</div>';
  }
  function segmented(f) {
    const v = st[f.k];
    return '<div class="bc-seg" role="radiogroup" aria-labelledby="bc-lbl-' + f.k + '">' + f.o.map(o =>
      '<button type="button" role="radio" aria-checked="' + (v === o) + '" class="bc-segb' + (v === o ? " bc-on" : "") + '" data-c="' + f.k + '" data-v="' + esc(o) + '">' + esc(o) + '</button>').join("") + '</div>';
  }
  function arc(f) {
    const v = st[f.k], n = f.o.length, H = 68, W = 64, sel = f.o.indexOf(v);
    const pos = i => { const u = 2 * ((i + 0.5) / n - 0.5); return { u: u, off: Math.round(Math.sqrt(1 - u * u) * W) }; };
    let h = '<div class="bc-arc" role="radiogroup" aria-labelledby="bc-lbl-' + f.k + '" style="height:' + n * H + 'px"><span class="bc-arcl" aria-hidden="true"></span>';
    if (sel >= 0) h += '<span class="bc-arch" aria-hidden="true" style="top:' + (sel * H + H / 2 - 12) + 'px;right:' + (pos(sel).off - 27) + 'px"></span>';
    f.o.forEach((o, i) => {
      const p = pos(i), on = i === sel;
      h += '<button type="button" role="radio" aria-checked="' + on + '" class="bc-arcb' + (on ? " bc-on" : "") + '" style="top:' + i * H + 'px;height:' + H + 'px;right:' + (p.off + 41) + 'px" data-c="' + f.k + '" data-v="' + esc(o) + '"><span class="bc-arcl2" style="transform:rotate(' + Math.round(p.u * 6) + 'deg)">' + esc(o) + '</span><span class="bc-arcp">' + (on ? "✓" : i + 1) + '</span></button>';
    });
    return h + '</div>';
  }
  function liveHtml() {
    const rows = [];
    STEPS.forEach(x => x.f.forEach(f => {
      if (f.type === "scales" || (f.type === "range" && st[f.k] === f.v)) return;
      fmt(f).forEach(r => { if (r[1] && r[1] !== "–") rows.push(r); });
    }));
    return '<span class="bc-live-t">Votre brief en construction</span>' + (rows.length
      ? rows.slice(0, 8).map(r => '<div class="bc-lr"><span class="bc-k">' + esc(r[0]) + '</span><span>' + esc(String(r[1]).slice(0, 90)) + '</span></div>').join("")
      : '<p class="bc-hint">Vos réponses apparaîtront ici au fil de l’eau.</p>');
  }
  function updateLive() { const a = app.querySelector(".bc-live"); if (a && st._t) a.innerHTML = liveHtml(); }
  function sentBanner() {
    msg("");
    const c = app.querySelector(".bc-card"); if (!c) return;
    const o = app.querySelector(".bc-sent"); if (o) o.remove();
    c.insertAdjacentHTML("beforebegin", '<div class="bc-sent" role="status" tabindex="-1"><span class="bc-ok" aria-hidden="true">✓</span><span><b>Brief envoyé à l\'équipe.</b> Vous pouvez encore le modifier et le renvoyer.</span></div>');
    app.querySelector(".bc-sent").focus({ preventScroll: true }); toTop();
  }

  function chips(f) {
    const v = st[f.k];
    if (f.type === "multi" && !f.max) return toggles(f);
    if (f.type === "one") {
      const L = Math.max.apply(null, f.o.map(o => o.length));
      if (f.o.length <= 3 && L <= 14) return segmented(f);
      if (f.o.length >= 4 && f.o.length <= 6 && L <= 24) return arc(f);
    }
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
    if (!st._t) { renderChooser(); return; }
    el("prog").innerHTML = STEPS.map((s, i) => '<span class="' + (i <= cur ? "bc-on" : "") + '"></span>').join("");
    if (cur >= STEPS.length) { renderBrief(); return; }
    const s = STEPS[cur];
const mins = Math.max(1, Math.round((STEPS.length - cur) * (TPL().min || 10) / STEPS.length));
    el("step").innerHTML = '<div class="bc-split"><div class="bc-main"><p class="bc-stepno">Étape ' + (cur + 1) + ' sur ' + STEPS.length + ' · ' + esc(s.t) + ' · environ ' + mins + ' min'
      + (cur === 0 ? '<button type="button" class="bc-link" id="bc-chg">Changer de modèle</button>' : "") + '</p><h3 class="bc-h">' + esc(s.t) + '</h3>'
      + s.f.map(field).join("") + (cur === 0 ? logoField() : "")
      + '</div><aside class="bc-live" aria-live="off" aria-label="Votre brief en construction">' + liveHtml() + '</aside></div>';
    el("nav").innerHTML = '<div class="bc-navrow">'
      + (cur > 0 ? '<button type="button" class="bc-btn" id="bc-prev">← Retour</button>' : '<span><button type="button" class="bc-btn" id="bc-impb">Importer un brief</button><input type="file" id="bc-imp" accept=".json,application/json" hidden></span>')
      + '<button type="button" class="bc-btn bc-btn-primary" id="bc-next">' + (fromBrief ? "Retour au brief" : cur === STEPS.length - 1 ? "Générer le brief" : "Suivant →") + '</button></div>';
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
    root.querySelectorAll(".bc-trow").forEach(r => r.addEventListener("click", e => { if (!e.target.closest("button")) r.querySelector("button").click(); }));
    bindImport(); bindLogo();
    const chg = document.getElementById("bc-chg");
    if (chg) chg.addEventListener("click", () => { setT(""); render(); toTop(); });
    const p = document.getElementById("bc-prev");
    if (p) p.addEventListener("click", () => { cur--; render(); toTop(); });
    document.getElementById("bc-next").addEventListener("click", () => {
      if (validate()) { cur = fromBrief ? STEPS.length : cur + 1; fromBrief = false; render(); toTop(); }
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

  const TPL = () => TPLS[st._t];
  const vigilance = () => (TPL() && TPL().vig ? TPL().vig(st) : []);
  const fieldsOf = () => { const o = {}; STEPS.forEach(x => x.f.forEach(f => { o[f.k] = f; })); return o; };

  function fmt(f) {
    const v = st[f.k], lab = f.s || f.l, d = x => (x && String(x).trim()) || "–";
    if (f.type === "range") return [[lab, v + "/" + f.max + (f.k === "curseur" ? " (" + level(v) + ")" : "")]];
    if (f.type === "scales") return f.o.map((p, i) => [p[0] + " / " + p[1], v[i] + "/100"]);
    if (f.type === "rank") return [[lab, v.length ? v.map((p, i) => (i + 1) + ". " + p).join("  ") : "–"]];
    if (Array.isArray(v)) return [[lab, v.length ? v.join(", ") : "–"]];
    return [[lab, d(v)]];
  }
  function sections() {
    return STEPS.map((x, i) => ({ h: (i + 1) + ". " + x.t, i: i, r: [].concat.apply([], x.f.map(fmt)) }));
  }

  function renderChooser() {
    el("prog").innerHTML = "";
    el("step").innerHTML = '<h3 class="bc-h bc-hero">De quel brief avez-vous besoin ?</h3><div class="bc-tpls">'
      + Object.keys(TPLS).map((k, i) => '<button type="button" class="bc-tpl bc-p' + (i % 4) + '" data-t="' + esc(k) + '"><span class="bc-tpl-n">0' + (i + 1) + '</span><span class="bc-tpl-t">' + esc(TPLS[k].t)
        + '</span><span class="bc-tpl-d">' + esc(TPLS[k].d) + '</span><span class="bc-tpl-m">' + TPLS[k].steps.length + ' étapes · ' + esc(TPLS[k].min) + ' min</span><span class="bc-tpl-go">Commencer →</span></button>').join("") + '</div>';
    el("nav").innerHTML = '<div class="bc-navrow"><span><button type="button" class="bc-btn" id="bc-impb">Importer un brief</button><input type="file" id="bc-imp" accept=".json,application/json" hidden></span></div>';
    el("step").querySelectorAll("[data-t]").forEach(b => b.addEventListener("click", () => { setT(b.dataset.t); cur = 0; render(); toTop(); }));
    bindImport();
    if (ready) focusHeading();
  }

  function bindImport() {
    const ib = document.getElementById("bc-impb"), inp = document.getElementById("bc-imp");
    if (!ib || !inp) return;
    ib.addEventListener("click", () => inp.click());
    inp.addEventListener("change", () => {
      const f = inp.files[0]; if (!f) return;
      f.text().then(t => { const d = JSON.parse(t); st = merge(fresh(), d.data || d); setT(st._t); cur = 0; render(); toTop(); })
        .catch(() => window.alert("Fichier illisible : choisissez un brief exporté en .json."));
    });
  }

  function logoField() {
    const l = st._logo;
    return '<div class="bc-field"><span class="bc-lbl">Logo de la structure <span class="bc-opt">(facultatif)</span></span>'
      + (l ? '<img class="bc-clogo" src="' + esc(l) + '" alt="Logo importé"><div class="bc-actions" style="margin-top:8px"><button type="button" class="bc-btn" id="bc-logoc">Changer</button><button type="button" class="bc-btn" id="bc-logox">Retirer</button></div>'
        : '<button type="button" class="bc-btn" id="bc-logoc">Importer un logo</button>')
      + '<input type="file" id="bc-logof" accept="image/png,image/jpeg,image/webp" hidden>'
      + '<p class="bc-hint">PNG, JPG ou WebP, réduit automatiquement. Il figure dans le PDF et la sauvegarde .json, pas dans le lien de partage ni dans la feuille.</p><p class="bc-err" id="bc-err-logo"></p></div>';
  }
  function resizeLogo(file, cb) {
    const r = new FileReader();
    r.onerror = () => cb(null);
    r.onload = () => {
      const im = new Image();
      im.onerror = () => cb(null);
      im.onload = () => {
        const k = Math.min(1, 400 / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL("image/png"));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  }
  function bindLogo() {
    const c = document.getElementById("bc-logoc"), f = document.getElementById("bc-logof"), x = document.getElementById("bc-logox");
    if (!c || !f) return;
    c.addEventListener("click", () => f.click());
    f.addEventListener("change", () => {
      const file = f.files[0]; if (!file) return;
      if (file.size > 5e6) { setErr("logo", "Fichier trop lourd (5 Mo maximum)."); return; }
      resizeLogo(file, d => { if (d) { st._logo = d; render(); } else setErr("logo", "Image illisible. Essayez un PNG ou un JPG."); });
    });
    if (x) x.addEventListener("click", () => { st._logo = ""; render(); });
  }

  function renderBrief() {
    const s = st, T = TPL(), F = fieldsOf(), all = vigilance(), v = PRO ? all : [], secs = sections();
    lastVig = all;
    const date = new Date().toLocaleDateString("fr-FR");
    briefText = "BRIEF " + T.t.toUpperCase() + " – " + s.nom + " (" + date + ")\n"
      + secs.map(x => "\n" + x.h + "\n" + x.r.map(r => r[0] + " : " + r[1]).join("\n")).join("\n")
      + (v.length ? "\n\nPoints de vigilance\n" + v.map(x => "- " + x).join("\n") : "");
    const pub = [].concat(s[T.p] || [])[0] || "–", need = [].concat(s[T.n] || []).join(", ") || "–";
    const kp = (k, val, sub) => '<div class="bc-kpi"><p class="bc-k">' + esc(k) + '</p><p class="bc-v">' + esc(val) + '</p>' + (sub ? '<p class="bc-k">' + esc(sub) + '</p>' : "") + '</div>';
    const bars = Object.keys(F).filter(k => F[k].type === "scales").map(k => '<p class="bc-h3">' + esc(F[k].s || F[k].l) + '</p>'
      + F[k].o.map((p, i) => '<div class="bc-scale"><span class="bc-l">' + esc(p[0]) + '</span><div class="bc-bar"><span style="left:calc(' + (+s[k][i] || 0) + '% - 8px)"></span></div><span>' + esc(p[1]) + '</span></div>').join("")).join("");
    const tags = F.auj && F.dem ? '<p class="bc-h3">De… à…</p><div>'
      + (s.auj.length ? s.auj : ["non renseigné"]).map(w => '<span class="bc-tag">' + esc(w) + '</span>').join("")
      + '<span aria-hidden="true" style="margin:0 8px 0 2px">→</span>'
      + s.dem.map(w => '<span class="bc-tag bc-to">' + esc(w) + '</span>').join("") + '</div>' : "";
    el("step").innerHTML = '<div class="bc-card"><div class="bc-brandrow">' + logoHtml()
      + (s._logo ? '<img class="bc-clogo" src="' + esc(s._logo) + '" alt="Logo de ' + esc(s.nom) + '">' : "") + '</div>'
      + '<p class="bc-stepno">' + esc(T.t) + ' · ' + date + '</p><h3 class="bc-h" style="margin-bottom:4px">' + esc(s.nom) + '</h3><p class="bc-intro" style="margin-bottom:8px">' + esc(s[T.lead]) + '</p>'
      + '<div class="bc-kpis">' + kp("Besoin", need) + (F.curseur ? kp("Ampleur", s.curseur + "/10", level(s.curseur)) : "") + kp("Public n°1", pub)
      + (F.budget ? kp("Budget et délai", s.budget || "À définir", s.delai || "–") : kp("Délai", s.delai || "–")) + '</div>'
      + bars + tags
      + (v.length ? '<p class="bc-h3">Points de vigilance</p>' + v.map(x => '<p class="bc-vig"><span aria-hidden="true" style="color:var(--bc-warning)">⚠</span><span>' + esc(x) + '</span></p>').join("") : "")
      + secs.map(x => '<p class="bc-h3 bc-sh"><span>' + esc(x.h) + '</span><button type="button" class="bc-edit bc-no-print" data-go="' + x.i + '">Modifier</button></p>'
        + x.r.map(r => '<div class="bc-row"><span class="bc-k">' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></div>').join("")).join("")
      + '</div>';
    const b = (id, t, p) => '<button type="button" class="bc-btn' + (p ? " bc-btn-primary" : "") + '" id="bc-' + id + '">' + t + '</button>';
    el("nav").innerHTML = '<div class="bc-actions">'
      + (CONFIG.endpoint ? b("send", "Envoyer à l'équipe", 1) : "") + b("pdf", "Télécharger en PDF", !CONFIG.endpoint)
      + b("docx", "Word (.docx)") + b("md", "Markdown (.md)") + b("json", "Sauvegarder (.json)") + b("cp", "Copier le texte")
      + b("link", "Copier un lien de partage") + b("ed", "Tout modifier") + b("rs", "Recommencer")
      + '</div><p class="bc-msg" id="bc-msg" role="status"></p>';
    el("step").querySelectorAll("[data-go]").forEach(x => x.addEventListener("click", () => { cur = +x.dataset.go; fromBrief = true; render(); toTop(); }));
    el("pdf").addEventListener("click", () => window.print());
    el("cp").addEventListener("click", () => copyText(briefText, "Texte copié"));
    const sl = String(s.nom).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brief";
    if (el("send")) el("send").addEventListener("click", send);
    el("md").addEventListener("click", () => dl("brief-" + sl + ".md", mdText(secs), "text/markdown"));
    el("docx").addEventListener("click", () => dl("brief-" + sl + ".docx", docxBlob(secs), ""));
    el("json").addEventListener("click", () => dl("brief-" + sl + ".json", JSON.stringify(payload(true), null, 2), "application/json"));
    el("link").addEventListener("click", () => copyText(window.location.href.split(/[?#]/)[0] + "#b=" + enc(Object.assign({}, st, { _logo: "" })), "Lien copié"));
    el("ed").addEventListener("click", () => { fromBrief = false; cur = 0; render(); toTop(); });
    el("rs").addEventListener("click", () => {
      if (!window.confirm("Effacer toutes les réponses et recommencer ?")) return;
      try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
      st = fresh(); setT(""); cur = 0; fromBrief = false; render(); toTop();
    });
    if (ready) focusHeading();
    save();
  }

  // ---- Export Word : .docx minimal, sans dépendance (archive ZIP « stockée ») ----
  const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files, mime) {
    const te = new TextEncoder(), parts = [], cen = []; let off = 0;
    files.forEach(f => {
      const n = te.encode(f.n), d = te.encode(f.d), c = crc32(d);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(12, 0x21, true);
      lh.setUint32(14, c, true); lh.setUint32(18, d.length, true); lh.setUint32(22, d.length, true); lh.setUint16(26, n.length, true);
      parts.push(new Uint8Array(lh.buffer), n, d);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(14, 0x21, true);
      ch.setUint32(16, c, true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true); ch.setUint16(28, n.length, true); ch.setUint32(42, off, true);
      cen.push(new Uint8Array(ch.buffer), n);
      off += 30 + n.length + d.length;
    });
    const cl = cen.reduce((a, x) => a + x.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cl, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(cen, [new Uint8Array(e.buffer)]), { type: mime });
  }
  function docxBlob(secs) {
    const BR = (/^#[0-9a-f]{6}$/i.test(CONFIG.brandColor) ? CONFIG.brandColor : "#3E5A7F").slice(1);
    const x = t => String(t == null ? "" : t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const run = (t, o) => '<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>' + (o.b ? "<w:b/>" : "") + (o.c ? '<w:color w:val="' + o.c + '"/>' : "") + '<w:sz w:val="' + (o.z || 22) + '"/></w:rPr>'
      + x(t).split(/\r?\n/).map(l => '<w:t xml:space="preserve">' + l + "</w:t>").join("<w:br/>") + "</w:r>";
    const para = (r, before) => '<w:p><w:pPr><w:spacing w:before="' + (before || 0) + '" w:after="80"/></w:pPr>' + r + "</w:p>";
    let body = para(run(TPL().t + " – " + st.nom, { b: 1, z: 40, c: BR })) + para(run(new Date().toLocaleDateString("fr-FR"), { c: "6B7280" }), 0);
    secs.forEach(sc => {
      body += para(run(sc.h, { b: 1, z: 28, c: BR }), 280);
      sc.r.forEach(r => { body += para(run(r[0] + " : ", { b: 1 }) + run(r[1], {})); });
    });
    if (PRO && lastVig.length) { body += para(run("Points de vigilance", { b: 1, z: 28, c: BR }), 280); lastVig.forEach(m => { body += para(run("• " + m, {})); }); }
    const H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    return zip([
      { n: "[Content_Types].xml", d: H + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
      { n: "_rels/.rels", d: H + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { n: "word/document.xml", d: H + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>' }
    ], "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }

  const msg = t => { const m = el("msg"); if (m) m.textContent = t; };
  function logoHtml() {
    return CONFIG.logo ? '<img class="bc-logo" src="' + esc(CONFIG.logo) + '" alt="' + esc(CONFIG.brandName) + '">' : "";
  }
  function payload(withLogo) {
    const d = Object.assign({}, st); if (!withLogo) delete d._logo;
    const T = TPLS[st._t] || {}, pick = x => [].concat(x || []).join(", ");
    return { version: 2, id: st._id, template: st._t, date: new Date().toISOString(),
      summary: { structure: st.nom, secteur: st.secteur || "", besoin: pick(st[T.n]), ampleur: T.id === "identite" ? st.curseur : "",
        public_1: [].concat(st[T.p] || [])[0] || "", budget: st.budget || "", delai: st.delai || "", validation: st.valid || "" },
      data: d, vigilances: lastVig, text: briefText };
  }
  function mdText(secs) {
    return "# " + TPLS[st._t].t + " – " + st.nom + "\n_" + new Date().toLocaleDateString("fr-FR") + "_\n\n"
      + secs.map(x => "## " + x.h + "\n" + x.r.map(r => "- **" + r[0] + "** : " + String(r[1]).replace(/\s*\n+\s*/g, " ")).join("\n")).join("\n\n")
      + (PRO && lastVig.length ? "\n\n## Points de vigilance\n" + lastVig.map(x => "- " + x).join("\n") : "") + "\n";
  }
  function dl(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(text instanceof Blob ? text : new Blob([text], { type: type + ";charset=utf-8" }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function send() {
    msg("Envoi en cours…");
    fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ token: CONFIG.token }, payload())) })
      .then(r => r.json())
      .then(j => j.ok ? sentBanner() : msg("Envoi refusé (" + (j.error || "erreur") + "). Sauvegardez le .json et transmettez-le."))
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