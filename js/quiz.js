// Practice (instant feedback) and exam (feedback at the end) sessions.
import { $, $$, esc, md, toast } from "./util.js";
import { isCorrect, answerText, responseText, SUBJECT, CHAPTER } from "./engine.js";
import { record, state, save } from "./store.js";
import { explain, hasKey } from "./ai.js";

const KEYS = "ABCD";

function questionBody(q) {
  const ch = CHAPTER[q.cid];
  const head = `<div class="q-head">
    <span>${SUBJECT[q.sid].emoji} ${esc(ch.title)}</span>
    ${q.hot ? '<span class="badge hot">🔥 Berpeluang tinggi</span>' : ""}
  </div>`;
  const svg = q.svg ? `<div class="q-svg">${q.svg}</div>` : "";
  let input;
  if (q.t === "mcq") {
    input = `<div class="options">${q.o.map((o, i) => `<button class="opt" data-i="${i}"><span class="key">${KEYS[i]}</span><span>${md(o)}</span></button>`).join("")}</div>`;
  } else if (q.t === "tf") {
    input = `<div class="tf"><button class="opt" data-tf="1">✔️ Betul</button><button class="opt" data-tf="0">✖️ Salah</button></div>`;
  } else {
    input = `<form class="num-form row">
      <input class="input" name="ans" inputmode="decimal" autocomplete="off" placeholder="Taip jawapan${q.u ? " (" + esc(q.u) + ")" : ""}" aria-label="Jawapan">
      <button class="btn primary" type="submit">Semak</button>
    </form>
    <p class="small muted">Boleh taip pecahan (3/4), perpuluhan (0.75) atau bentuk piawai (3.2x10^5).</p>`;
  }
  return `${head}<div class="q-text">${md(q.q)}</div>${svg}${input}`;
}

export function feedbackHTML(q, resp, ok) {
  const steps = q.s.length ? `<ol class="steps">${q.s.map((s) => `<li>${md(s)}</li>`).join("")}</ol>` : "";
  const note = q.n ? `<div class="note-box">📌 <b>Nota ringkas:</b> ${md(q.n)}</div>` : "";
  return `<div class="feedback ${ok ? "good" : "bad"}">
    <h3>${ok ? "✅ Betul! Bagus!" : "❌ Kurang tepat"}</h3>
    ${ok ? "" : `<div class="small">Jawapan anda: ${esc(responseText(q, resp))}</div>`}
    <div>Jawapan betul: <span class="answer">${md(answerText(q))}</span></div>
    ${steps ? `<div class="small" style="margin-top:8px;font-weight:700">${ok ? "Cara kira / penerangan:" : "🧠 Cara kira / penerangan yang betul:"}</div>${steps}` : ""}
    ${note}
    <div class="row wrap" style="margin-top:10px">
      <button class="btn sm ai-btn" type="button">🤖 ${hasKey() ? "Tanya Cikgu AI" : "Cikgu AI (tetapkan kunci)"}</button>
    </div>
    <div class="ai-out"></div>
  </div>`;
}

export function wireAI(root, q, resp) {
  const btn = $(".ai-btn", root);
  if (!btn) return;
  btn.onclick = async () => {
    if (!hasKey()) { location.hash = "#/tetapan"; return; }
    const out = $(".ai-out", root);
    out.innerHTML = '<div class="ai-box">Cikgu AI sedang berfikir…</div>';
    const box = $(".ai-box", out);
    btn.disabled = true;
    let first = true;
    try {
      await explain(q, resp, (t) => {
        if (first) { box.textContent = ""; first = false; }
        box.textContent += t;
      });
    } catch (e) {
      box.textContent = "⚠️ " + (e.message || "Cikgu AI tidak dapat dihubungi.");
      btn.disabled = false;
    }
  };
}

function bindInput(card, q, onPick) {
  if (q.t === "mcq") $$(".opt", card).forEach((b) => (b.onclick = () => onPick(+b.dataset.i)));
  else if (q.t === "tf") $$(".opt", card).forEach((b) => (b.onclick = () => onPick(b.dataset.tf === "1")));
  else {
    const f = $(".num-form", card);
    f.onsubmit = (e) => {
      e.preventDefault();
      const v = f.ans.value.trim();
      if (!v) { f.ans.focus(); return; }
      onPick(v);
    };
    setTimeout(() => f.ans.focus({ preventScroll: true }), 50);
  }
}

function markOptions(card, q, resp) {
  if (q.t === "mcq") {
    $$(".opt", card).forEach((b) => {
      const i = +b.dataset.i;
      b.disabled = true;
      if (i === q.a) b.classList.add("correct");
      else if (i === resp) b.classList.add("wrong");
    });
  } else if (q.t === "tf") {
    $$(".opt", card).forEach((b) => {
      const v = b.dataset.tf === "1";
      b.disabled = true;
      if (v === q.a) b.classList.add("correct");
      else if (v === resp) b.classList.add("wrong");
    });
  } else {
    const f = $(".num-form", card);
    f.ans.disabled = true;
    $("button", f).disabled = true;
  }
}

// ---------------- Practice ----------------
export function practiceSession(root, questions, { title = "Latih Tubi", onDone } = {}) {
  let i = 0, score = 0, xp = 0;
  const wrong = [];

  function show() {
    if (i >= questions.length) return finish();
    const q = questions[i];
    root.innerHTML = `
      <div class="row" style="margin-bottom:8px"><b>${esc(title)}</b><span class="spacer"></span><span class="badge">Soalan ${i + 1}/${questions.length}</span><span class="badge tp">✅ ${score}</span></div>
      <div class="progress" style="margin-bottom:12px"><i style="width:${(i / questions.length) * 100}%"></i></div>
      <div class="card q-card">${questionBody(q)}<div class="fb"></div></div>`;
    const card = $(".q-card", root);
    bindInput(card, q, (resp) => {
      const ok = isCorrect(q, resp);
      if (ok) score++; else wrong.push(q);
      xp += record(q, ok);
      markOptions(card, q, resp);
      if (!ok) card.classList.add("shake");
      const fb = $(".fb", card);
      fb.innerHTML = feedbackHTML(q, resp, ok) + `<button class="btn primary block next" style="margin-top:12px">${i + 1 < questions.length ? "Soalan seterusnya →" : "Lihat keputusan"}</button>`;
      wireAI(fb, q, resp);
      $(".next", fb).onclick = () => { i++; show(); window.scrollTo({ top: 0, behavior: "smooth" }); };
      if (!ok) fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function finish() {
    const pct = Math.round((score / questions.length) * 100);
    root.innerHTML = `<div class="card result-big">
      <div style="font-size:3rem">${pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"}</div>
      <div class="score">${score}/${questions.length}</div>
      <p><b>${pct}%</b> · +${xp} XP</p>
      <p class="muted">${pct >= 80 ? "Cemerlang! Teruskan momentum." : pct >= 50 ? "Bagus! Ulang kaji soalan yang salah untuk naik tahap." : "Jangan putus asa — baca nota ringkas & cuba lagi."}</p>
    </div>
    ${wrong.length ? `<button class="btn primary block retry">🔁 Ulang ${wrong.length} soalan yang salah</button>` : ""}
    <button class="btn block again" style="margin-top:8px">Set baharu</button>`;
    $(".retry", root)?.addEventListener("click", () => practiceSession(root, wrong, { title: "Ulang Kaji Salah", onDone }));
    $(".again", root).onclick = () => onDone?.("again");
  }

  show();
}

// ---------------- Exam ----------------
export function tpFor(pct) {
  if (pct >= 90) return ["TP6", "Sangat Cemerlang"];
  if (pct >= 75) return ["TP5", "Cemerlang"];
  if (pct >= 60) return ["TP4", "Baik"];
  if (pct >= 40) return ["TP3", "Memuaskan"];
  if (pct >= 20) return ["TP2", "Asas"];
  return ["TP1", "Perlu bimbingan"];
}

export function examSession(root, questions, { minutes = 30, sid, onExit } = {}) {
  const answers = new Array(questions.length).fill(null);
  let i = 0;
  const end = Date.now() + minutes * 60e3;
  let timer;

  function tick() {
    const left = Math.max(0, end - Date.now());
    const el = $(".exam-timer", root);
    if (el) el.textContent = `⏱ ${Math.floor(left / 60e3)}:${String(Math.floor((left % 60e3) / 1e3)).padStart(2, "0")}`;
    if (left <= 0) { clearInterval(timer); toast("Masa tamat!"); submit(); }
  }

  function show() {
    const q = questions[i];
    root.innerHTML = `
      <div class="row" style="margin-bottom:8px"><b>📝 Mod Peperiksaan</b><span class="spacer"></span><span class="badge tp exam-timer">⏱</span></div>
      <div class="pill-row" style="margin-bottom:8px">${questions.map((_, k) => `<button class="pill ${k === i ? "active" : ""}" data-k="${k}" style="${answers[k] != null && k !== i ? "border-color:var(--good)" : ""}">${k + 1}${answers[k] != null ? "✓" : ""}</button>`).join("")}</div>
      <div class="card q-card">${questionBody(q)}</div>
      <div class="row">
        <button class="btn prev" ${i === 0 ? "disabled" : ""}>← Sebelum</button>
        <span class="spacer"></span>
        ${i + 1 < questions.length ? '<button class="btn primary nxt">Seterusnya →</button>' : '<button class="btn good sub">Hantar kertas</button>'}
      </div>
      <button class="btn ghost block sub2 small" style="margin-top:10px">Hantar sekarang (${answers.filter((a) => a != null).length}/${questions.length} dijawab)</button>`;
    tick();
    const card = $(".q-card", root);
    const resp = answers[i];
    if (resp != null) {
      if (q.t === "mcq") $(`.opt[data-i="${resp}"]`, card)?.classList.add("selected");
      else if (q.t === "tf") $(`.opt[data-tf="${resp ? 1 : 0}"]`, card)?.classList.add("selected");
      else $(".num-form", card).ans.value = resp;
    }
    if (q.t === "num") {
      const f = $(".num-form", card);
      $("button", f).textContent = "Simpan";
      f.ans.oninput = () => { answers[i] = f.ans.value.trim() || null; };
    }
    bindInput(card, q, (r) => {
      answers[i] = r;
      if (q.t === "num") { toast("Jawapan disimpan"); if (i + 1 < questions.length) { i++; show(); } return; }
      show();
    });
    $$(".pill", root).forEach((p) => (p.onclick = () => { i = +p.dataset.k; show(); }));
    $(".prev", root).onclick = () => { i--; show(); };
    $(".nxt", root)?.addEventListener("click", () => { i++; show(); });
    const confirmSubmit = () => {
      const blank = answers.filter((a) => a == null).length;
      if (blank && !confirm(`${blank} soalan belum dijawab. Hantar juga?`)) return;
      submit();
    };
    $(".sub", root)?.addEventListener("click", confirmSubmit);
    $(".sub2", root).onclick = confirmSubmit;
  }

  function submit() {
    clearInterval(timer);
    let score = 0;
    const results = questions.map((q, k) => {
      const ok = isCorrect(q, answers[k]);
      if (ok) score++;
      if (answers[k] != null) record(q, ok, { xp: 15 }); // blanks don't earn XP

      return { q, resp: answers[k], ok };
    });
    const pct = Math.round((score / questions.length) * 100);
    const [tp, label] = tpFor(pct);
    state.exams.unshift({ date: new Date().toISOString(), sid: sid ?? "mix", pct, tp });
    state.exams = state.exams.slice(0, 30);
    save();
    root.innerHTML = `<div class="card result-big">
        <div class="muted small">Keputusan Mod Peperiksaan</div>
        <div class="score">${pct}%</div>
        <p><span class="badge tp" style="font-size:1rem">${tp}</span> <b>${label}</b></p>
        <p class="muted">${score} betul daripada ${questions.length}. Semak pembetulan di bawah — fokus pada yang salah.</p>
      </div>
      <div class="section-title"><h2>Pembetulan</h2></div>
      <div class="review"></div>
      <button class="btn primary block done">Selesai</button>`;
    const rev = $(".review", root);
    results.forEach(({ q, resp, ok }, k) => {
      const d = document.createElement("details");
      d.className = "card";
      if (!ok) d.open = true;
      d.innerHTML = `<summary>${ok ? "✅" : "❌"} Soalan ${k + 1}</summary><div class="q-text" style="margin-top:8px">${md(q.q)}</div>${q.svg ? `<div class="q-svg">${q.svg}</div>` : ""}${feedbackHTML(q, resp, ok)}`;
      rev.appendChild(d);
      wireAI(d, q, resp);
    });
    $(".done", root).onclick = () => onExit?.();
  }

  timer = setInterval(tick, 1000);
  show();
  return () => clearInterval(timer);
}
