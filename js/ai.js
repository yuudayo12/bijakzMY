// Optional "Cikgu AI": deeper explanations from Claude using the learner's own API key.
// Built-in worked solutions always work offline; this is an extra layer on top.
import { state } from "./store.js";
import { SUBJECT, CHAPTER } from "./data/index.js";
import { answerText, responseText } from "./engine.js";

const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.134.0/+esm";
const MODEL = "claude-opus-5-5";

const SYSTEM = `Anda ialah "Cikgu AI" dalam app ulang kaji BijakzMY untuk murid Tingkatan 3 KSSM di Malaysia (UASA).
Terangkan dalam Bahasa Melayu yang mudah, mesra dan ringkas (kecuali subjek English: terangkan dalam Bahasa Melayu tetapi kekalkan contoh dalam English).
Format jawapan:
1. Kenapa jawapan murid salah (jika berkaitan) — 1-2 ayat.
2. Cara kira / cara fikir langkah demi langkah (bernombor).
3. "Nota ringkas" — 2-3 poin penting untuk diingat.
4. Satu soalan latihan serupa (tanpa jawapan) untuk murid cuba sendiri.
Jangan guna LaTeX. Guna simbol biasa (×, ÷, ², √). Pastikan fakta tepat mengikut silibus KSSM.`;

let sdkPromise;
const loadSDK = () => (sdkPromise ??= import(SDK_URL).then((m) => m.default));

export const hasKey = () => !!state.settings.apiKey;

export async function explain(q, resp, onText) {
  const Anthropic = await loadSDK();
  const client = new Anthropic({ apiKey: state.settings.apiKey, dangerouslyAllowBrowser: true });
  const ch = CHAPTER[q.cid];
  const opts = q.t === "mcq" ? `\nPilihan: ${q.o.map((o, i) => `${"ABCD"[i]}. ${o}`).join(" | ")}` : "";
  const prompt = `Subjek: ${SUBJECT[q.sid].name} — Bab: ${ch.title}
Soalan: ${q.q}${opts}
Jawapan murid: ${responseText(q, resp)}
Jawapan betul: ${answerText(q)}
Langkah dalam app: ${q.s.join(" → ")}

Terangkan supaya murid benar-benar faham.`;

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    stream.on("text", (t) => onText(t));
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") onText("\n\n(Cikgu AI tidak dapat menjawab soalan ini. Sila rujuk langkah di atas.)");
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error("Kunci API tidak sah. Semak di Progres → Tetapan.");
    if (err instanceof Anthropic.RateLimitError) throw new Error("Terlalu banyak permintaan. Cuba lagi sebentar.");
    if (err instanceof Anthropic.APIConnectionError) throw new Error("Tiada sambungan internet ke Cikgu AI.");
    if (err instanceof Anthropic.APIError) throw new Error(`Ralat Cikgu AI (${err.status ?? "?"}).`);
    throw err;
  }
}
