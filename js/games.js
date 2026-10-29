// Mini games to keep revision fun. Every wrong move still teaches the right answer.
import { $, $$, esc, md, shuffle, pick, toast } from "./util.js";
import { buildSet, isCorrect, answerText, SUBJECTS, SUBJECT, CHAPTER } from "./engine.js";
import { record, setBest, addXP, state } from "./store.js";
import { feedbackHTML, wireAI } from "./quiz.js";

export const GAMES = [
  { id: "kilat", emoji: "⚡", name: "Kuiz Kilat", desc: "Jawab seberapa banyak dalam 60 saat. Combo = mata berganda!" },
  { id: "padan", emoji: "🧩", name: "Padan Pantas", desc: "Padankan istilah dengan maksud / formula secepat mungkin." },
  { id: "bs", emoji: "❤️", name: "Betul atau Salah", desc: "3 nyawa. Satu salah, satu nyawa hilang. Berapa jauh anda boleh pergi?" },
];

function subjectPicker(root, onPick, allowAll = true) {
  root.innerHTML = `<p class="muted">Pilih subjek:</p><div class="grid grid-2">
    ${allowAll ? '<button class="tile" data-s=""><span class="emoji">🎲</span><b>Semua subjek</b><small>Campur</small></button>' : ""}
    ${SUBJECTS.map((s) => `<button class="tile" data-s="${s.id}"><span class="emoji">${s.emoji}</span><b>${esc(s.name)}</b></button>`).join("")}
  </div>`;
  $$(".tile", root).forEach((t) => (t.onclick = () => onPick(t.dataset.s || undefined)));
}

function endScreen(root, { game, score, lines = "", missed = [], again }) {
  const isBest = setBest(game, score);
  root.innerHTML = `<div class="card result-big">
      <div style="font-size:3rem">${isBest ? "🏆" : "🎮"}</div>
      <div class="muted small">${isBest ? "REKOD BAHARU!" : "Rekod terbaik: " + (state.best[game] ?? 0)}</div>
      <div class="score">${score}</div>
      ${lines}
    </div>
    <button class="btn primary block again">Main lagi</button>
    <a class="btn block" style="margin-top:8px" href="#/games">Pilih game lain</a>
    ${missed.length ? `<div class="section-title"><h2>Belajar dari kesilapan (${missed.length})</h2></div><div class="missed"></div>` : ""}`;
  $(".again", root).onclick = again;
  const box = $(".missed", root);
  missed.forEach(({ q, resp }) => {
    const d = document.createElement("details");
    d.className = "card";
    d.innerHTML = `<summary>${md(q.q.length > 70 ? q.q.slice(0, 70) + "…" : q.q)}</summary><div class="q-text" style="margin-top:8px">${md(q.q)}</div>${feedbackHTML(q, resp, false)}`;
    box.appendChild(d);
    wireAI(d, q, resp);
  });
}

// ---------------- Kuiz Kilat ----------------
function kilat(root, sid) {
  const DURATION = 60;
  let qs = buildSet({ sid, n: 40, types: ["mcq", "tf"] });
  let i = 0, score = 0, combo = 0, correct = 0, locked = false;
  const missed = [];
  const end = Date.now() + DURATION * 1000;
  root.innerHTML = `<div class="game-hud">
      <div class="stat"><b class="sc">0</b><small>MATA</small></div>
      <div class="stat"><b class="cb">x1</b><small>COMBO</small></div>
      <div class="stat"><b class="tm">${DURATION}</b><small>SAAT</small></div>
    </div>
    <div class="timer-bar"><i style="width:100%"></i></div>
    <div class="combo"></div>
    <div class="card qbox"></div>`;
  const timer = setInterval(() => {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    $(".tm", root).textContent = left;
    $(".timer-bar i", root).style.width = (left / DURATION) * 100 + "%";
    if (left <= 0) finish();
  }, 250);

  let done = false;
  function next() {
    if (done) return;
    if (i >= qs.length) { qs = qs.concat(buildSet({ sid, n: 20, types: ["mcq", "tf"] })); }
    const q = qs[i];
    const box = $(".qbox", root);
    box.innerHTML = `<div class="q-head">${SUBJECT[q.sid].emoji} ${esc(CHAPTER[q.cid].title)}</div>
      <div class="q-text">${md(q.q)}</div>${q.svg ? `<div class="q-svg">${q.svg}</div>` : ""}
      ${q.t === "tf"
        ? '<div class="tf"><button class="opt" data-v="1">✔️ Betul</button><button class="opt" data-v="0">✖️ Salah</button></div>'
        : `<div class="options">${q.o.map((o, k) => `<button class="opt" data-v="${k}"><span class="key">${"ABCD"[k]}</span><span>${md(o)}</span></button>`).join("")}</div>`}`;
    locked = false;
    $$(".opt", box).forEach((b) => (b.onclick = () => {
      if (locked) return;
      locked = true;
      const resp = q.t === "tf" ? b.dataset.v === "1" : +b.dataset.v;
      const ok = isCorrect(q, resp);
      record(q, ok, { xp: 5 });
      $$(".opt", box).forEach((o) => {
        const v = q.t === "tf" ? o.dataset.v === "1" : +o.dataset.v;
        if (v === q.a) o.classList.add("correct");
        else if (o === b) o.classList.add("wrong");
      });
      if (ok) {
        combo++; correct++;
        const mult = Math.min(5, 1 + Math.floor(combo / 3));
        score += 10 * mult;
        $(".combo", root).textContent = combo >= 3 ? `🔥 ${combo} berturut-turut!` : "";
      } else {
        combo = 0;
        missed.push({ q, resp });
        $(".combo", root).textContent = `Jawapan: ${answerText(q)}`;
      }
      $(".sc", root).textContent = score;
      $(".cb", root).textContent = "x" + Math.min(5, 1 + Math.floor(combo / 3));
      setTimeout(() => { i++; next(); }, ok ? 350 : 1200);
    }));
  }

  function finish() {
    if (done) return;
    done = true;
    clearInterval(timer);
    addXP(Math.round(score / 10));
    endScreen(root, {
      game: "kilat", score, missed,
      lines: `<p>${correct} betul · ${missed.length} salah</p>`,
      again: () => kilat(root, sid),
    });
  }

  next();
  return own(() => clearInterval(timer));
}

// ---------------- Padan Pantas ----------------
function padan(root, sid) {
  const chs = Object.values(CHAPTER).filter((c) => (!sid || c.sid === sid) && c.pairs?.length);
  let pool = [];
  for (const c of shuffle(chs).slice(0, 3)) pool.push(...c.pairs.map((p) => [...p, c.id]));
  const pairs = shuffle(pool).slice(0, 6);
  const left = shuffle(pairs.map((p, k) => ({ k, text: p[0] })));
  const right = shuffle(pairs.map((p, k) => ({ k, text: p[1] })));
  const start = Date.now();
  let mistakes = 0, matched = 0, selL = null, selR = null;
  const missed = [];

  root.innerHTML = `<div class="game-hud">
      <div class="stat"><b class="mt">0/${pairs.length}</b><small>PADAN</small></div>
      <div class="stat"><b class="ms">0</b><small>SILAP</small></div>
      <div class="stat"><b class="tm">0</b><small>SAAT</small></div>
    </div>
    <p class="small muted">Tekan satu kad di kiri, kemudian padanannya di kanan.</p>
    <div class="match-grid">
      <div class="grid">${left.map((c) => `<button class="match-card" data-side="L" data-k="${c.k}">${md(c.text)}</button>`).join("")}</div>
      <div class="grid">${right.map((c) => `<button class="match-card" data-side="R" data-k="${c.k}">${md(c.text)}</button>`).join("")}</div>
    </div>`;
  const timer = setInterval(() => ($(".tm", root).textContent = Math.floor((Date.now() - start) / 1000)), 500);

  function check() {
    if (!selL || !selR) return;
    const a = selL, b = selR;
    selL = selR = null;
    if (a.dataset.k === b.dataset.k) {
      a.classList.remove("sel"); b.classList.remove("sel");
      a.classList.add("done"); b.classList.add("done");
      matched++;
      $(".mt", root).textContent = `${matched}/${pairs.length}`;
      if (matched === pairs.length) setTimeout(finish, 400);
    } else {
      mistakes++;
      $(".ms", root).textContent = mistakes;
      const p = pairs[+a.dataset.k];
      if (!missed.some((m) => m.k === a.dataset.k)) missed.push({ k: a.dataset.k, p });
      a.classList.add("err"); b.classList.add("err");
      toast(`${p[0]} → ${p[1]}`);
      setTimeout(() => { a.classList.remove("err", "sel"); b.classList.remove("err", "sel"); }, 600);
    }
  }

  $$(".match-card", root).forEach((c) => (c.onclick = () => {
    if (c.dataset.side === "L") { selL?.classList.remove("sel"); selL = c; }
    else { selR?.classList.remove("sel"); selR = c; }
    c.classList.add("sel");
    check();
  }));

  function finish() {
    clearInterval(timer);
    const secs = Math.max(1, Math.round((Date.now() - start) / 1000));
    const score = Math.max(10, 600 - secs * 5 - mistakes * 40);
    addXP(Math.round(score / 20));
    endScreen(root, {
      game: "padan", score,
      lines: `<p>${secs} saat · ${mistakes} silap</p>${missed.length ? `<div class="card" style="text-align:left"><b>Ingat semula:</b>${missed.map(({ p }) => `<div class="kv"><span>${md(p[0])}</span><b>${md(p[1])}</b></div>`).join("")}</div>` : ""}`,
      again: () => padan(root, sid),
    });
  }

  return own(() => clearInterval(timer));
}

// ---------------- Betul atau Salah ----------------
function bsStatements(sid) {
  const out = [];
  const chs = Object.values(CHAPTER).filter((c) => !sid || c.sid === sid);
  for (const c of chs) {
    c.qs.forEach((q, i) => { if (typeof q.a === "boolean") out.push({ cid: c.id, sid: c.sid, q: q.q, a: q.a, s: q.s ?? [], n: q.n ?? "", t: "tf", id: `${c.id}-${i}` }); });
    const ps = c.pairs ?? [];
    ps.forEach((p, k) => {
      const truth = Math.random() < 0.5 || ps.length < 2;
      const other = truth ? p : pick(ps.filter((_, j) => j !== k));
      out.push({
        cid: c.id, sid: c.sid, t: "tf", id: `pair:${c.id}:${k}`,
        q: `${p[0]} — ${other[1]}`, a: truth,
        s: truth ? [`${p[0]} memang berkaitan dengan ${p[1]}.`] : [`Padanan sebenar: ${p[0]} — ${p[1]}`, `${other[1]} sebenarnya berkaitan dengan ${other[0]}.`],
        n: "",
      });
    });
  }
  return shuffle(out);
}

function bs(root, sid) {
  let list = bsStatements(sid);
  let i = 0, lives = 3, score = 0, streak = 0;
  const missed = [];
  root.innerHTML = `<div class="game-hud">
      <div class="stat"><b class="lv">❤️❤️❤️</b><small>NYAWA</small></div>
      <div class="stat"><b class="sc">0</b><small>MATA</small></div>
      <div class="stat"><b class="tm">8</b><small>SAAT</small></div>
    </div>
    <div class="timer-bar"><i style="width:100%"></i></div>
    <div class="card"><div class="q-head qh"></div><div class="big-statement st"></div>
      <div class="tf"><button class="opt" data-v="1">✔️ Betul</button><button class="opt" data-v="0">✖️ Salah</button></div>
      <div class="combo" style="margin-top:10px"></div>
    </div>`;
  const PER = 8;
  let deadline = 0, locked = false;
  const timer = setInterval(() => {
    const left = Math.max(0, (deadline - Date.now()) / 1000);
    $(".tm", root).textContent = Math.ceil(left);
    $(".timer-bar i", root).style.width = (left / PER) * 100 + "%";
    if (left <= 0 && !locked) answer(null);
  }, 200);

  function show() {
    if (i >= list.length) { list = list.concat(bsStatements(sid)); }
    const s = list[i];
    $(".qh", root).textContent = `${SUBJECT[s.sid].emoji} ${CHAPTER[s.cid].title}`;
    $(".st", root).innerHTML = md(s.q);
    $$(".opt", root).forEach((o) => { o.classList.remove("correct", "wrong"); o.disabled = false; });
    deadline = Date.now() + PER * 1000;
    locked = false;
  }

  function answer(v) {
    locked = true;
    const s = list[i];
    const ok = v === s.a;
    if (s.id.startsWith("pair:")) { if (!ok) missed.push({ q: s, resp: v }); }
    else { record(s, ok, { xp: 5 }); if (!ok) missed.push({ q: s, resp: v }); }
    $$(".opt", root).forEach((o) => {
      o.disabled = true;
      const ov = o.dataset.v === "1";
      if (ov === s.a) o.classList.add("correct");
      else if (ov === v) o.classList.add("wrong");
    });
    if (ok) { streak++; score += 10 + Math.min(20, streak * 2); $(".combo", root).textContent = streak >= 3 ? `🔥 ${streak} berturut-turut!` : ""; }
    else {
      lives--; streak = 0;
      $(".combo", root).textContent = v === null ? "⏰ Masa tamat! " + (s.s[0] ?? "") : s.s[0] ?? "";
    }
    $(".sc", root).textContent = score;
    $(".lv", root).textContent = "❤️".repeat(lives) + "🤍".repeat(3 - lives);
    if (lives <= 0) return setTimeout(finish, 900);
    setTimeout(() => { i++; show(); }, ok ? 400 : 1500);
  }

  $$(".opt", root).forEach((o) => (o.onclick = () => !locked && answer(o.dataset.v === "1")));

  function finish() {
    clearInterval(timer);
    addXP(Math.round(score / 10));
    endScreen(root, { game: "bs", score, missed, lines: `<p>${i} kenyataan dijawab</p>`, again: () => bs(root, sid) });
  }

  show();
  return own(() => clearInterval(timer));
}

const RUNNERS = { kilat, padan, bs };

// Only one game timer may run at a time; starting a new round stops the old one.
let active = null;
function own(stop) {
  active?.();
  active = stop;
  return stop;
}

export function startGame(root, id, setCleanup) {
  const g = GAMES.find((x) => x.id === id);
  if (!g) { root.innerHTML = '<div class="empty">Game tidak dijumpai.</div>'; return; }
  const wrap = document.createElement("div");
  root.innerHTML = `<h1>${g.emoji} ${g.name}</h1><p class="muted">${g.desc}</p>`;
  root.appendChild(wrap);
  setCleanup(() => active?.());
  subjectPicker(wrap, (sid) => RUNNERS[id](wrap, sid));
}
