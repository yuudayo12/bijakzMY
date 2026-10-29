import { $, $$, esc, md, toast } from "./util.js";
import { SUBJECTS, SUBJECT, CHAPTER, buildSet, fromKeys, countQuestions } from "./engine.js";
import { state, save, chapterAcc, level, levelProgress, reset } from "./store.js";
import { practiceSession, examSession } from "./quiz.js";
import { GAMES, startGame } from "./games.js";

const app = $("#app");
let cleanup = null;
const setCleanup = (fn) => { cleanup = fn; };

// ---------- helpers ----------
const pct = (x) => (x == null ? "—" : Math.round(x * 100) + "%");
const bar = (x) => `<div class="progress"><i style="width:${Math.round((x ?? 0) * 100)}%"></i></div>`;

function subjectAcc(sid) {
  let a = 0, c = 0;
  for (const ch of SUBJECT[sid].chapters) { const s = state.stats[ch.id]; if (s) { a += s.a; c += s.c; } }
  return a ? c / a : null;
}

function weakChapters(limit = 5) {
  return Object.values(CHAPTER)
    .map((ch) => ({ ch, acc: chapterAcc(ch.id), n: state.stats[ch.id]?.a ?? 0 }))
    .filter((x) => x.n >= 3 && x.acc < 0.6)
    .sort((x, y) => x.acc - y.acc)
    .slice(0, limit);
}

function notesHTML(lines) {
  let html = "", list = [];
  const flush = () => { if (list.length) { html += `<ul>${list.map((l) => `<li>${md(l)}</li>`).join("")}</ul>`; list = []; } };
  for (const l of lines) {
    if (l.startsWith("### ")) { flush(); html += `<h3>${md(l.slice(4))}</h3>`; }
    else list.push(l);
  }
  flush();
  return `<div class="notes">${html}</div>`;
}

function formulaHTML(f) {
  return `<div class="formula"><div class="small muted">${esc(f.n)}</div><div class="f">${esc(f.f)}</div>${f.ex ? `<div class="ex">Contoh: ${esc(f.ex)}</div>` : ""}</div>`;
}

function updateChips() {
  $("#streakChip").textContent = `🔥 ${state.streak}`;
  $("#xpChip").textContent = `⭐ ${state.xp}`;
}
document.addEventListener("store:change", updateChips);

// ---------- views ----------
const views = {
  home() {
    const goal = state.settings.dailyGoal;
    const done = state.daily.date === new Date().toLocaleDateString("en-CA") ? state.daily.count : 0;
    const weak = weakChapters(3);
    const { statics, gens } = countQuestions();
    return `
      <section class="hero">
        <div class="small" style="opacity:.85">Tingkatan 3 · KSSM · UASA</div>
        <h1>Jom skor cemerlang! 🚀</h1>
        <div class="row" style="margin:8px 0 6px"><span>Matlamat hari ini: <b>${Math.min(done, goal)}/${goal}</b> soalan</span><span class="spacer"></span><span>Tahap ${level()}</span></div>
        ${bar(Math.min(1, done / goal))}
        <div class="row" style="margin-top:12px; gap:8px">
          <a class="btn" href="#/sesi?mode=rawak">⚡ Latih tubi rawak</a>
          <a class="btn" href="#/sesi?mode=hot">🔥 Topik panas</a>
        </div>
      </section>

      <div class="grid grid-2">
        <a class="tile" href="#/ulangkaji"><span class="emoji">🔁</span><b>Ulang Kaji Salah</b><small>${state.wrong.length} soalan menunggu</small></a>
        <a class="tile" href="#/exam"><span class="emoji">📝</span><b>Mod Peperiksaan</b><small>Simulasi UASA bermasa + TP</small></a>
        <a class="tile" href="#/formula"><span class="emoji">📐</span><b>Bank Formula</b><small>Semua formula di satu tempat</small></a>
        <a class="tile" href="#/games"><span class="emoji">🎮</span><b>Games Kuiz</b><small>Belajar sambil main</small></a>
      </div>

      ${weak.length ? `<div class="section-title"><h2>⚠️ Topik perlu dikuatkan</h2></div>
        ${weak.map(({ ch, acc }) => `<a class="list-item" href="#/sesi?mode=bab&cid=${ch.id}"><span class="num">${SUBJECT[ch.sid].emoji}</span><span class="grow"><b>${esc(ch.title)}</b><small class="muted">${SUBJECT[ch.sid].name} · ketepatan ${pct(acc)}</small></span><span>→</span></a>`).join("")}` : ""}

      <div class="section-title"><h2>Subjek</h2><a href="#/belajar" class="small">Lihat semua</a></div>
      <div class="grid grid-auto">
        ${SUBJECTS.map((s) => `<a class="tile" href="#/s/${s.id}"><span class="emoji">${s.emoji}</span><b>${esc(s.name)}</b><small>${s.chapters.length} bab · ${pct(subjectAcc(s.id))}</small>${bar(subjectAcc(s.id))}</a>`).join("")}
      </div>
      <p class="small muted" style="text-align:center;margin-top:16px">${statics} soalan + ${gens} penjana soalan rawak tanpa had · Ikut silibus KSSM Tingkatan 3</p>`;
  },

  belajar() {
    return `<h1>📚 Belajar</h1><p class="muted">Pilih subjek untuk baca nota ringkas, formula dan latih tubi mengikut bab.</p>
      ${SUBJECTS.map((s) => `<a class="list-item" href="#/s/${s.id}"><span class="num" style="background:${s.color}22;color:${s.color}">${s.emoji}</span><span class="grow"><b>${esc(s.name)}</b><small class="muted">${s.chapters.length} bab · ${s.chapters.filter((c) => c.hot).length} topik 🔥</small></span><span>→</span></a>`).join("")}
      <a class="list-item" href="#/formula"><span class="num">📐</span><span class="grow"><b>Bank Formula</b><small class="muted">Matematik, Sains & Geografi</small></span><span>→</span></a>`;
  },

  subject([sid]) {
    const s = SUBJECT[sid];
    if (!s) return notFound();
    return `<h1>${s.emoji} ${esc(s.name)}</h1>
      <div class="row wrap" style="margin-bottom:12px">
        <a class="btn primary sm" href="#/sesi?mode=subjek&sid=${sid}">✍️ Latih semua bab</a>
        <a class="btn sm" href="#/sesi?mode=hot&sid=${sid}">🔥 Topik panas sahaja</a>
        <a class="btn sm" href="#/exam?sid=${sid}">📝 Peperiksaan</a>
      </div>
      ${s.chapters.map((c, k) => {
        const acc = chapterAcc(c.id);
        return `<a class="list-item" href="#/c/${c.id}"><span class="num">${k + 1}</span><span class="grow"><b>${esc(c.title)} ${c.hot ? '<span class="badge hot">🔥</span>' : ""}</b><small class="muted">${c.qs.length + (c.gens?.length ? " + ∞" : "")} soalan · ketepatan ${pct(acc)}</small>${acc != null ? bar(acc) : ""}</span><span>→</span></a>`;
      }).join("")}`;
  },

  chapter([cid], qs) {
    const c = CHAPTER[cid];
    if (!c) return notFound();
    const tab = qs.get("tab") || "nota";
    const s = SUBJECT[c.sid];
    const body = tab === "formula"
      ? (c.formulas.length ? c.formulas.map(formulaHTML).join("") : '<div class="empty">Tiada formula khusus untuk bab ini — fokus pada fakta dalam Nota.</div>')
      : tab === "kad"
        ? `<p class="muted small">Kad imbas: tekan untuk lihat jawapan.</p><div class="grid grid-2">${c.pairs.map((p) => `<button class="match-card flip" data-a="${esc(p[1])}" data-b="${esc(p[0])}">${md(p[0])}</button>`).join("")}</div>`
        : notesHTML(c.notes);
    return `<div class="small muted">${s.emoji} ${esc(s.name)}</div>
      <h1>${esc(c.title)} ${c.hot ? '<span class="badge hot">🔥 Berpeluang tinggi</span>' : ""}</h1>
      <div class="tabs">
        ${[["nota", "📖 Nota"], ["formula", "📐 Formula"], ["kad", "🃏 Kad"]].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? "active" : ""}">${l}</button>`).join("")}
      </div>
      <div class="card">${body}</div>
      <a class="btn primary block" href="#/sesi?mode=bab&cid=${cid}">✍️ Latih tubi bab ini</a>`;
  },

  formula(_, qs) {
    const filter = qs.get("s") || "";
    const items = [];
    for (const s of SUBJECTS) for (const c of s.chapters) for (const f of c.formulas) items.push({ s, c, f });
    const subs = SUBJECTS.filter((s) => s.chapters.some((c) => c.formulas.length));
    return `<h1>📐 Bank Formula</h1>
      <div class="searchbar"><input class="input" id="fsearch" placeholder="Cari formula… (cth: faedah, kuasa, sudut)"></div>
      <div class="pill-row">${[["", "Semua"], ...subs.map((s) => [s.id, s.emoji + " " + s.name])].map(([id, l]) => `<a class="pill ${filter === id ? "active" : ""}" href="#/formula${id ? "?s=" + id : ""}">${esc(l)}</a>`).join("")}</div>
      <div id="flist">${items.filter((x) => !filter || x.s.id === filter).map(({ s, c, f }) => `<div data-q="${esc((f.n + " " + f.f + " " + c.title).toLowerCase())}"><div class="small muted" style="margin-top:6px">${s.emoji} ${esc(c.title)}</div>${formulaHTML(f)}</div>`).join("")}</div>`;
  },

  latihan() {
    return `<h1>✍️ Latihan</h1>
      <div class="card">
        <h2>Bina set latihan</h2>
        <label class="field">Subjek
          <select class="input" id="lsub"><option value="">Semua subjek</option>${SUBJECTS.map((s) => `<option value="${s.id}">${s.emoji} ${esc(s.name)}</option>`).join("")}</select>
        </label>
        <label class="field">Bab
          <select class="input" id="lch"><option value="">Semua bab</option></select>
        </label>
        <label class="field">Bilangan soalan
          <select class="input" id="ln"><option>5</option><option selected>10</option><option>20</option><option>30</option></select>
        </label>
        <label class="row small"><input type="checkbox" id="lhot"> Topik berpeluang tinggi 🔥 sahaja</label>
        <button class="btn primary block" id="lgo" style="margin-top:12px">Mula latihan</button>
      </div>
      <div class="grid grid-2">
        <a class="tile" href="#/ulangkaji"><span class="emoji">🔁</span><b>Ulang Kaji Salah</b><small>${state.wrong.length} soalan</small></a>
        <a class="tile" href="#/exam"><span class="emoji">📝</span><b>Mod Peperiksaan</b><small>Bermasa, ala UASA</small></a>
      </div>
      <div class="card small muted">💡 Bila jawapan salah, app akan terus tunjuk <b>jawapan betul</b>, <b>cara kira langkah demi langkah</b> dan <b>nota ringkas</b>. Tekan 🤖 Cikgu AI untuk penerangan lebih mendalam.</div>`;
  },

  exam(_, qs) {
    const sid = qs.get("sid") || "";
    return `<h1>📝 Mod Peperiksaan</h1>
      <p class="muted">Simulasi UASA: soalan campuran (aneka pilihan, betul/salah, jawapan isian) dengan masa. Jawapan & pembetulan hanya ditunjuk selepas hantar. Keputusan dalam % dan Tahap Penguasaan (TP).</p>
      <div class="card">
        <label class="field">Subjek
          <select class="input" id="esub"><option value="">Campuran semua subjek</option>${SUBJECTS.map((s) => `<option value="${s.id}" ${s.id === sid ? "selected" : ""}>${s.emoji} ${esc(s.name)}</option>`).join("")}</select>
        </label>
        <label class="field">Format
          <select class="input" id="efmt">
            <option value="20,30">Pendek — 20 soalan, 30 minit</option>
            <option value="40,60">Penuh — 40 soalan, 60 minit</option>
            <option value="10,12">Pantas — 10 soalan, 12 minit</option>
          </select>
        </label>
        <button class="btn primary block" id="ego">Mula peperiksaan</button>
      </div>
      ${state.exams.length ? `<div class="section-title"><h2>Sejarah keputusan</h2></div><div class="card">${state.exams.slice(0, 8).map((e) => `<div class="kv"><span>${new Date(e.date).toLocaleDateString("ms-MY")} · ${e.sid === "mix" ? "Campuran" : SUBJECT[e.sid]?.name ?? e.sid}</span><b>${e.pct}% <span class="badge tp">${e.tp}</span></b></div>`).join("")}</div>` : ""}
      <details class="card"><summary>Panduan Tahap Penguasaan (anggaran app)</summary>
        <table class="simple" style="margin-top:8px"><tr><th>%</th><th>TP</th></tr>
        ${[[90, "TP6 Sangat Cemerlang"], [75, "TP5 Cemerlang"], [60, "TP4 Baik"], [40, "TP3 Memuaskan"], [20, "TP2 Asas"], [0, "TP1 Perlu bimbingan"]].map(([p, t]) => `<tr><td>≥ ${p}</td><td>${t}</td></tr>`).join("")}</table>
      </details>`;
  },

  games() {
    return `<h1>🎮 Games Kuiz</h1><p class="muted">Ulang kaji tanpa rasa bosan. Kumpul XP dan pecahkan rekod sendiri!</p>
      ${GAMES.map((g) => `<a class="list-item" href="#/game/${g.id}"><span class="num" style="font-size:1.3rem">${g.emoji}</span><span class="grow"><b>${g.name}</b><small class="muted">${g.desc}</small></span><span class="badge">🏆 ${state.best[g.id] ?? 0}</span></a>`).join("")}`;
  },

  progres() {
    const totalA = Object.values(state.stats).reduce((t, s) => t + s.a, 0);
    const totalC = Object.values(state.stats).reduce((t, s) => t + s.c, 0);
    return `<h1>📊 Progres</h1>
      <div class="grid grid-3">
        <div class="card" style="text-align:center"><div style="font-size:1.5rem;font-weight:800">${level()}</div><small class="muted">Tahap</small></div>
        <div class="card" style="text-align:center"><div style="font-size:1.5rem;font-weight:800">${state.streak}🔥</div><small class="muted">Streak hari</small></div>
        <div class="card" style="text-align:center"><div style="font-size:1.5rem;font-weight:800">${pct(totalA ? totalC / totalA : null)}</div><small class="muted">Ketepatan</small></div>
      </div>
      <div class="card"><div class="row"><b>⭐ ${state.xp} XP</b><span class="spacer"></span><small class="muted">ke Tahap ${level() + 1}</small></div>${bar(levelProgress())}<p class="small muted">${totalA} soalan dijawab · ${totalC} betul</p></div>
      <div class="section-title"><h2>Mengikut subjek</h2></div>
      ${SUBJECTS.map((s) => `<details class="card"><summary>${s.emoji} ${esc(s.name)} — ${pct(subjectAcc(s.id))}</summary>
        ${s.chapters.map((c) => { const st = state.stats[c.id]; return `<div class="kv"><a href="#/c/${c.id}">${esc(c.title)}</a><span class="small">${st ? `${st.c}/${st.a} · ${pct(st.c / st.a)}` : "belum"}</span></div>`; }).join("")}
      </details>`).join("")}
      <a class="btn block" href="#/tetapan" style="margin-top:8px">⚙️ Tetapan & Cikgu AI</a>`;
  },

  tetapan() {
    return `<h1>⚙️ Tetapan</h1>
      <div class="card">
        <h2>🤖 Cikgu AI (pilihan)</h2>
        <p class="small muted">Penerangan langkah demi langkah sudah tersedia tanpa internet. Untuk penerangan tambahan yang lebih mendalam, masukkan kunci API Claude anda sendiri (console.anthropic.com). Kunci disimpan <b>hanya dalam pelayar peranti ini</b> dan dihantar terus ke Anthropic. Jangan guna pada komputer awam.</p>
        <label class="field">Kunci API Claude<input class="input" id="akey" type="password" autocomplete="off" placeholder="sk-ant-…" value="${esc(state.settings.apiKey)}"></label>
        <div class="row"><button class="btn primary" id="asave">Simpan</button><button class="btn" id="aclear">Padam kunci</button></div>
      </div>
      <div class="card">
        <h2>🎯 Matlamat harian</h2>
        <label class="field">Bilangan soalan sehari
          <select class="input" id="goal">${[10, 20, 30, 50].map((n) => `<option ${n === state.settings.dailyGoal ? "selected" : ""}>${n}</option>`).join("")}</select>
        </label>
      </div>
      <div class="card">
        <h2>📲 Pasang app</h2>
        <p class="small muted">Android (Chrome): menu ⋮ → <b>Tambah ke skrin utama</b>. iPhone (Safari): butang Kongsi → <b>Add to Home Screen</b>. Selepas dipasang, nota & latihan boleh digunakan tanpa internet.</p>
      </div>
      <div class="card">
        <h2>🗑️ Data</h2>
        <p class="small muted">Progres disimpan dalam peranti ini sahaja.</p>
        <button class="btn" id="reset">Set semula progres</button>
      </div>`;
  },
};

function notFound() {
  return '<div class="empty"><div style="font-size:3rem">🤔</div>Halaman tidak dijumpai.<br><a href="#/">Kembali ke Utama</a></div>';
}

// ---------- interactive routes ----------
function runPractice(qs) {
  const mode = qs.get("mode");
  const sid = qs.get("sid") || undefined;
  const cid = qs.get("cid") || undefined;
  const n = +(qs.get("n") || 10);
  const hot = mode === "hot" || qs.get("hot") === "1";
  const title = cid ? CHAPTER[cid]?.title : hot ? "🔥 Topik Berpeluang Tinggi" : sid ? SUBJECT[sid]?.name : "Latih Tubi Rawak";
  const set = buildSet({ sid, cid, hot, n });
  if (!set.length) { app.innerHTML = '<div class="empty">Tiada soalan untuk pilihan ini.</div>'; return; }
  practiceSession(app, set, { title, onDone: () => runPractice(qs) });
}

function runReview() {
  const set = fromKeys(state.wrong.slice(0, 15));
  if (!set.length) {
    app.innerHTML = `<div class="empty"><div style="font-size:3rem">🎉</div><b>Tiada soalan salah untuk diulang!</b><p>Jawab lebih banyak soalan — yang salah akan muncul di sini untuk diulang kaji.</p><a class="btn primary" href="#/sesi?mode=rawak">Mula latih tubi</a></div>`;
    return;
  }
  practiceSession(app, set, { title: "🔁 Ulang Kaji Salah", onDone: runReview });
}

function bindView(name, qs) {
  if (name === "chapter") {
    $$(".tabs button").forEach((b) => (b.onclick = () => {
      const p = location.hash.split("?")[0];
      location.replace(`${p}?tab=${b.dataset.tab}`);
    }));
    $$(".flip").forEach((c) => (c.onclick = () => {
      const showing = c.dataset.state === "1";
      c.innerHTML = md(showing ? c.dataset.b : c.dataset.a);
      c.dataset.state = showing ? "0" : "1";
      c.classList.toggle("sel", !showing);
    }));
  }
  if (name === "formula") {
    const inp = $("#fsearch");
    inp.oninput = () => {
      const v = inp.value.trim().toLowerCase();
      $$("#flist > div").forEach((d) => (d.hidden = v && !d.dataset.q.includes(v)));
    };
  }
  if (name === "latihan") {
    const sub = $("#lsub"), ch = $("#lch");
    sub.onchange = () => {
      const s = SUBJECT[sub.value];
      ch.innerHTML = '<option value="">Semua bab</option>' + (s ? s.chapters.map((c, k) => `<option value="${c.id}">${k + 1}. ${esc(c.title)}</option>`).join("") : "");
    };
    $("#lgo").onclick = () => {
      const p = new URLSearchParams({ mode: "custom", n: $("#ln").value });
      if (sub.value) p.set("sid", sub.value);
      if (ch.value) p.set("cid", ch.value);
      if ($("#lhot").checked) p.set("hot", "1");
      location.hash = "#/sesi?" + p;
    };
  }
  if (name === "exam") {
    $("#ego").onclick = () => {
      const sid = $("#esub").value || undefined;
      const [n, mins] = $("#efmt").value.split(",").map(Number);
      const set = buildSet({ sid, n });
      document.title = "Peperiksaan · BijakzMY";
      cleanup = examSession(app, set, { minutes: mins, sid, onExit: () => (location.hash = "#/progres") });
    };
  }
  if (name === "tetapan") {
    $("#asave").onclick = () => { state.settings.apiKey = $("#akey").value.trim(); save(); toast("Kunci disimpan ✔"); };
    $("#aclear").onclick = () => { state.settings.apiKey = ""; $("#akey").value = ""; save(); toast("Kunci dipadam"); };
    $("#goal").onchange = (e) => { state.settings.dailyGoal = +e.target.value; save(); toast("Matlamat dikemas kini"); };
    $("#reset").onclick = () => { if (confirm("Padam semua progres, XP dan rekod?")) { reset(); toast("Progres diset semula"); route(); } };
  }
}

// ---------- router ----------
const NAV = { "": "home", belajar: "belajar", s: "belajar", c: "belajar", formula: "belajar", latihan: "latihan", sesi: "latihan", ulangkaji: "latihan", exam: "latihan", games: "games", game: "games", progres: "progres", tetapan: "progres" };
const ROUTES = { "": "home", belajar: "belajar", s: "subject", c: "chapter", formula: "formula", latihan: "latihan", exam: "exam", games: "games", progres: "progres", tetapan: "tetapan" };

function route() {
  cleanup?.();
  cleanup = null;
  const [path, query = ""] = location.hash.replace(/^#\/?/, "").split("?");
  const [head = "", ...rest] = path.split("/");
  const qs = new URLSearchParams(query);
  $$(".bottomnav a").forEach((a) => a.classList.toggle("active", a.dataset.nav === (NAV[head] ?? "home")));
  $("#backBtn").hidden = head === "";
  document.title = "BijakzMY · Tingkatan 3";

  if (head === "sesi") runPractice(qs);
  else if (head === "ulangkaji") runReview();
  else if (head === "game") startGame(app, rest[0], setCleanup);
  else {
    const name = ROUTES[head];
    app.innerHTML = name ? views[name](rest, qs) : notFound();
    if (name) bindView(name, qs);
  }
  if (!qs.has("tab")) window.scrollTo(0, 0);
  updateChips();
}

$("#backBtn").onclick = () => (history.length > 1 ? history.back() : (location.hash = "#/"));
window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
