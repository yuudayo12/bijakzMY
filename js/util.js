// Small shared helpers (DOM, random, number formatting).

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Mini markup: **bold**, `mono`. Everything else is escaped.
export function md(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/`(.+?)`/g, '<span class="mono">$1</span>');
}

export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "/": "ᐟ" };
export const sup = (n) => String(n).split("").map((c) => SUP[c] ?? c).join("");

// Round to `dp` decimals and drop trailing zeros.
export function fmt(n, dp = 2) {
  if (!Number.isFinite(n)) return String(n);
  const r = Math.round(n * 10 ** dp) / 10 ** dp;
  return String(Object.is(r, -0) ? 0 : r);
}

// Money: always 2 decimals.
export const rm = (n) => "RM" + (Math.round(n * 100) / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function frac(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  n /= g; d /= g;
  return d === 1 ? String(n) : `${n}/${d}`;
}

// Parse a learner's numeric answer: "1,5", "3/4", "-2", "3.2x10^5", "3.2e5", "RM 120.50", "45°".
export function parseNum(input) {
  if (input == null) return NaN;
  const raw = String(input).trim().toLowerCase();
  // "1,102.50" → thousands separator; "1,5" → decimal comma.
  let s = raw
    .replace(/rm|cm²|cm2|cm|m²|m2|kwh|km|kg|°|%|\s/g, "")
    .replace(/,/g, raw.includes(".") ? "" : ".")
    .replace(/[×x*]10\^?\(?(-?\d+)\)?/, "e$1")
    .replace(/[−–]/g, "-")
    .replace(/[a-z²³]+$/, "");
  const m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/.test(s)) return NaN;
  return Number(s);
}

export function toast(msg, ms = 1800) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), ms);
}

export const today = () => new Date().toLocaleDateString("en-CA");
