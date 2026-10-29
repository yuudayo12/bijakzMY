// Learner progress, kept in localStorage on this device only.
import { today } from "./util.js";

const KEY = "bijakzmy.v1";

const fresh = () => ({
  xp: 0,
  streak: 0,
  lastDay: null,
  daily: { date: today(), count: 0 },
  stats: {},      // chapterId -> { a: attempts, c: correct }
  wrong: [],      // question ids answered wrongly (most recent first)
  best: {},       // game id -> best score
  exams: [],      // { date, sid, pct, tp }
  settings: { dailyGoal: 20, apiKey: "" },
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const s = { ...fresh(), ...JSON.parse(raw) };
    s.settings = { ...fresh().settings, ...s.settings };
    return s;
  } catch {
    return fresh();
  }
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  document.dispatchEvent(new CustomEvent("store:change"));
}

function touchDay() {
  const t = today();
  if (state.daily.date !== t) state.daily = { date: t, count: 0 };
  if (state.lastDay === t) return;
  const y = new Date(Date.now() - 864e5).toLocaleDateString("en-CA");
  state.streak = state.lastDay === y ? state.streak + 1 : 1;
  state.lastDay = t;
}

// Record one answered question. Returns XP gained.
export function record(q, correct, { xp = 10 } = {}) {
  touchDay();
  const st = (state.stats[q.cid] ??= { a: 0, c: 0 });
  st.a++;
  if (correct) st.c++;
  state.daily.count++;
  const key = q.gen ? `gen:${q.gen}:${q.cid}` : q.id;
  state.wrong = state.wrong.filter((w) => w !== key);
  if (!correct) state.wrong.unshift(key);
  state.wrong = state.wrong.slice(0, 200);
  const gained = correct ? xp : 2; // a little XP for trying
  state.xp += gained;
  save();
  return gained;
}

export function addXP(n) {
  touchDay();
  state.xp += n;
  save();
}

export function setBest(game, score) {
  const prev = state.best[game] ?? 0;
  if (score > prev) { state.best[game] = score; save(); return true; }
  return false;
}

export function chapterAcc(cid) {
  const s = state.stats[cid];
  return s && s.a ? s.c / s.a : null;
}

export const level = () => Math.floor(Math.sqrt(state.xp / 50)) + 1;
export const levelProgress = () => {
  const l = level();
  const lo = 50 * (l - 1) ** 2, hi = 50 * l ** 2;
  return (state.xp - lo) / (hi - lo);
};

export function reset() {
  const keep = state.settings;
  Object.assign(state, fresh(), { settings: keep });
  save();
}
