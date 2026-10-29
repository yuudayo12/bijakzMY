// Question engine: normalises raw data, builds practice sets, checks answers.
import { SUBJECTS, SUBJECT, CHAPTER } from "./data/index.js";
import { GENERATORS } from "./generators.js";
import { shuffle, pick, parseNum, fmt } from "./util.js";

function normalize(raw, ch, extra = {}) {
  const q = { ...raw, cid: ch.id, sid: ch.sid, ...extra };
  q.t = raw.t ?? (raw.o ? "mcq" : typeof raw.a === "boolean" ? "tf" : "num");
  q.s ??= [];
  q.n ??= "";
  q.hot ??= !!ch.hot && !!raw.hot;
  return q;
}

export function staticQuestion(ch, i) {
  return normalize(ch.qs[i], ch, { id: `${ch.id}-${i}` });
}

export function genQuestion(genId, ch) {
  const raw = GENERATORS[genId]();
  return normalize(raw, ch, { id: `gen:${genId}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, gen: genId, hot: !!ch.hot });
}

function chaptersFor({ sid, cid, hot }) {
  let chs = cid ? [CHAPTER[cid]] : Object.values(CHAPTER).filter((c) => !sid || c.sid === sid);
  if (hot) chs = chs.filter((c) => c.hot);
  return chs;
}

// Build a practice set of `n` questions. Generator topics get ~40% of slots.
export function buildSet({ sid, cid, hot = false, n = 10, types } = {}) {
  const chs = chaptersFor({ sid, cid, hot });
  let statics = [];
  const gens = [];
  for (const ch of chs) {
    ch.qs.forEach((raw, i) => {
      if (hot && !raw.hot && !cid) return;
      statics.push([ch, i]);
    });
    for (const g of ch.gens ?? []) gens.push([g, ch]);
  }
  statics = shuffle(statics);
  const out = [];
  const genSlots = gens.length ? Math.max(1, Math.round(n * (statics.length ? 0.4 : 1))) : 0;
  for (let i = 0; i < genSlots; i++) {
    const [g, ch] = pick(gens);
    out.push(genQuestion(g, ch));
  }
  for (const [ch, i] of statics) {
    if (out.length >= n) break;
    out.push(staticQuestion(ch, i));
  }
  // Not enough statics? top up with more generated ones.
  while (out.length < n && gens.length) {
    const [g, ch] = pick(gens);
    out.push(genQuestion(g, ch));
  }
  let set = shuffle(out).slice(0, n);
  if (types) set = set.map((q) => (types.includes(q.t) ? q : toChoice(q))).filter((q) => types.includes(q.t));
  return set;
}

// Rebuild questions from saved "wrong answer" keys.
export function fromKeys(keys) {
  const out = [];
  for (const k of keys) {
    if (k.startsWith("gen:")) {
      const [, g, cid] = k.split(":");
      if (GENERATORS[g] && CHAPTER[cid]) out.push(genQuestion(g, CHAPTER[cid]));
      continue;
    }
    const m = k.match(/^(.+)-(\d+)$/);
    const ch = m && CHAPTER[m[1]];
    if (ch && ch.qs[+m[2]]) out.push(staticQuestion(ch, +m[2]));
  }
  return out;
}

export function isCorrect(q, resp) {
  if (resp == null || resp === "") return false;
  if (q.t === "mcq") return resp === q.a;
  if (q.t === "tf") return resp === q.a;
  const x = parseNum(resp);
  if (Number.isNaN(x)) return false;
  const tol = q.tol ?? (Number.isInteger(q.a) ? 1e-9 : 0.0051);
  return Math.abs(x - q.a) <= tol + Math.abs(q.a) * 1e-9;
}

const unitText = (u) => (!u ? "" : u === "RM" ? "" : u === "°" || u === "%" ? u : " " + u);

export function answerText(q) {
  if (q.t === "mcq") return q.o[q.a];
  if (q.t === "tf") return q.a ? "Betul" : "Salah";
  const v = q.shown ?? fmt(q.a);
  return q.u === "RM" ? `RM${Number(q.a).toFixed(2)}` : v + unitText(q.u);
}

export function responseText(q, resp) {
  if (resp == null || resp === "") return "(tiada jawapan)";
  if (q.t === "mcq") return q.o[resp];
  if (q.t === "tf") return resp ? "Betul" : "Salah";
  return String(resp);
}

// Turn a numeric question into multiple choice (used by games).
export function toChoice(q) {
  if (q.t !== "num") return q;
  const a = q.a;
  const isInt = Number.isInteger(a);
  const cand = new Set();
  const variants = isInt
    ? [a + 1, a - 1, a * 2, a + 10, a - 10, Math.round(a / 2), a + 2, -a]
    : [a * 2, a / 2, a + 1, a - 1, a * 10, a / 10, a + 0.5];
  for (const v of shuffle(variants)) {
    if (cand.size >= 3) break;
    if (v !== a && Number.isFinite(v)) cand.add(fmt(v, 2));
  }
  const right = q.shown ?? fmt(a, 2);
  const fr = String(right).match(/^(-?\d+)\/(\d+)$/);
  if (fr) {
    // Keep distractors in fraction form so the format doesn't give the answer away.
    const [n, d] = [+fr[1], +fr[2]];
    cand.clear();
    for (const v of shuffle([`${d}/${n}`, `${n + 1}/${d}`, `${n}/${d + 1}`, `${n}/${d * 2}`, `${-n}/${d}`])) {
      if (cand.size < 3 && v !== right) cand.add(v);
    }
  }
  const opts = shuffle([right, ...[...cand].filter((c) => c !== right).slice(0, 3)]);
  const label = (s) => (q.u === "RM" ? "RM" + s : s + unitText(q.u));
  return { ...q, t: "mcq", o: opts.map(label), a: opts.indexOf(right) };
}

export function countQuestions() {
  let statics = 0, gens = 0;
  for (const s of SUBJECTS) for (const c of s.chapters) { statics += c.qs.length; gens += (c.gens ?? []).length; }
  return { statics, gens };
}

export { SUBJECTS, SUBJECT, CHAPTER };
