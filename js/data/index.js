import matematik from "./matematik.js";
import sains from "./sains.js";
import sejarah from "./sejarah.js";
import geografi from "./geografi.js";
import bm from "./bm.js";
import english from "./english.js";
import pi from "./pi.js";

export const SUBJECTS = [matematik, sains, sejarah, geografi, bm, english, pi];

export const SUBJECT = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
export const CHAPTER = {};
for (const s of SUBJECTS) for (const c of s.chapters) CHAPTER[c.id] = { ...c, sid: s.id };
