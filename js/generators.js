// Random question generators. Each returns a fresh question with worked steps,
// so learners can drill a topic without ever running out of questions.
import { rand, pick, sup, fmt, rm, frac, shuffle } from "./util.js";

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15]];

function rightTriangleSVG(labels) {
  // Right angle at Q (bottom-left). P top, R bottom-right.
  const { P = "P", Q = "Q", R = "R", pq = "", qr = "", pr = "", angle = "" } = labels;
  return `<svg viewBox="0 0 240 170" role="img" aria-label="Segi tiga bersudut tegak">
  <polygon points="40,20 40,140 210,140" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <polyline points="40,124 56,124 56,140" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="28" y="18" font-size="15" font-weight="700" fill="currentColor">${P}</text>
  <text x="24" y="156" font-size="15" font-weight="700" fill="currentColor">${Q}</text>
  <text x="212" y="156" font-size="15" font-weight="700" fill="currentColor">${R}</text>
  <text x="6" y="84" font-size="13" fill="currentColor">${pq}</text>
  <text x="112" y="162" font-size="13" fill="currentColor">${qr}</text>
  <text x="132" y="72" font-size="13" fill="currentColor">${pr}</text>
  ${angle === "R" ? '<path d="M186,140 A24,24 0 0,1 190,128" fill="none" stroke="#e5484d" stroke-width="2"/><text x="166" y="134" font-size="13" fill="#e5484d">θ</text>' : ""}
  ${angle === "P" ? '<path d="M40,44 A24,24 0 0,0 52,40" fill="none" stroke="#e5484d" stroke-width="2"/><text x="46" y="58" font-size="13" fill="#e5484d">θ</text>' : ""}
</svg>`;
}

export const GENERATORS = {
  // ---------------- MATEMATIK ----------------
  idxLaw() {
    const b = pick([2, 3, 5]);
    const m = rand(2, 6), n = rand(1, 5);
    const c = rand(1, m + n - 1);
    const p = m + n - c;
    return {
      q: `Hitung nilai ${b}${sup(m)} × ${b}${sup(n)} ÷ ${b}${sup(c)}.`,
      t: "num", a: b ** p,
      s: [
        `Hukum darab: tambah indeks → ${b}${sup(m)} × ${b}${sup(n)} = ${b}${sup(m + n)}`,
        `Hukum bahagi: tolak indeks → ${b}${sup(m + n)} ÷ ${b}${sup(c)} = ${b}${sup(p)}`,
        `${b}${sup(p)} = ${b ** p}`,
      ],
      n: "aᵐ × aⁿ = aᵐ⁺ⁿ dan aᵐ ÷ aⁿ = aᵐ⁻ⁿ. Asas mesti SAMA baru boleh guna hukum ini.",
    };
  },
  idxPower() {
    const b = pick(["a", "x", "m", "p"]);
    const m = rand(2, 5), n = rand(2, 4);
    const ans = m * n;
    return {
      q: `Diberi (${b}${sup(m)})${sup(n)} = ${b}${sup("k")}. Cari nilai k.`,
      t: "num", a: ans,
      s: [`Hukum kuasa: (aᵐ)ⁿ = aᵐˣⁿ`, `(${b}${sup(m)})${sup(n)} = ${b}${sup(m)}${"ˣ"}${sup(n)} = ${b}${sup(ans)}`, `Maka k = ${ans}`],
      n: "Kuasa kepada kuasa → DARAB indeks. Jangan keliru dengan hukum darab (tambah indeks).",
    };
  },
  idxNegZero() {
    const b = pick([2, 3, 4, 5, 10]);
    const n = rand(1, 3);
    const val = b ** n;
    return {
      q: `Nyatakan nilai ${b}${sup(-n)} sebagai pecahan.`,
      t: "num", a: 1 / val, shown: `1/${val}`,
      s: [`Indeks negatif: a⁻ⁿ = 1/aⁿ`, `${b}${sup(-n)} = 1/${b}${sup(n)}`, `= 1/${val}`],
      n: "a⁰ = 1 (a ≠ 0) dan a⁻ⁿ = 1/aⁿ. Indeks negatif TIDAK menjadikan nombor itu negatif.",
    };
  },
  idxFrac() {
    const opts = [[8, 3, 2], [27, 3, 2], [16, 4, 3], [64, 3, 2], [32, 5, 2], [81, 4, 3], [125, 3, 2], [16, 2, 3], [9, 2, 3], [25, 2, 3]];
    const [x, n, m] = pick(opts);
    const root = Math.round(x ** (1 / n));
    return {
      q: `Hitung nilai ${x}${sup(m + "/" + n)}  (iaitu ${x} kuasa ${m}/${n}).`,
      t: "num", a: root ** m,
      s: [`a^(m/n) = (ⁿ√a)ᵐ`, `${n === 2 ? "√" : n + "√"}${x} = ${root}`, `${root}${sup(m)} = ${root ** m}`],
      n: "Penyebut indeks pecahan = punca kuasa; pengangka = kuasa. Cari punca dahulu supaya nombor kecil.",
    };
  },
  idxSolve() {
    const b = pick([2, 3, 5]);
    const x = rand(1, 4), k = rand(0, 3);
    const rhs = b ** (x + k);
    return {
      q: `Selesaikan ${b}${sup("x")}${k ? " × " + b + sup(k) : ""} = ${rhs}. Cari x.`,
      t: "num", a: x,
      s: [
        `Tulis ${rhs} dalam asas ${b}: ${rhs} = ${b}${sup(x + k)}`,
        k ? `Sebelah kiri: ${b}${sup("x")} × ${b}${sup(k)} = ${b}${sup("x+" + k)}` : `Sebelah kiri: ${b}${sup("x")}`,
        k ? `Samakan indeks: x + ${k} = ${x + k} → x = ${x}` : `Samakan indeks: x = ${x}`,
      ],
      n: "Persamaan indeks: jadikan asas kedua-dua belah sama, kemudian samakan indeks.",
    };
  },
  spConvert() {
    const neg = Math.random() < 0.5;
    const A = (rand(101, 999) / 100);
    const n = neg ? -rand(2, 6) : rand(3, 8);
    const num = A * 10 ** n;
    const numStr = neg ? num.toFixed(-n + 2).replace(/0+$/, "") : String(Math.round(num));
    const correct = `${fmt(A)} × 10${sup(n)}`;
    const opts = shuffle([correct, `${fmt(A)} × 10${sup(n + 1)}`, `${fmt(A)} × 10${sup(n - 1)}`, `${fmt(A * 10)} × 10${sup(n - 1)}`]);
    return {
      q: `Tulis ${numStr} dalam bentuk piawai.`,
      o: opts, a: opts.indexOf(correct),
      s: [
        `Bentuk piawai: A × 10ⁿ, dengan 1 ≤ A < 10`,
        `Gerakkan titik perpuluhan sehingga A = ${fmt(A)}`,
        neg ? `Titik bergerak ${-n} tempat ke KANAN → n = ${n}` : `Titik bergerak ${n} tempat ke KIRI → n = ${n}`,
        `Jawapan: ${correct}`,
      ],
      n: "Nombor kecil (< 1) → indeks negatif. Nombor besar (≥ 10) → indeks positif. Pilihan dengan A ≥ 10 bukan bentuk piawai.",
    };
  },
  spMul() {
    const a = rand(2, 9), b = rand(2, 9), m = rand(-4, 5), n = rand(-4, 5);
    let A = a * b, e = m + n;
    const steps = [`Darab nombor: ${a} × ${b} = ${A}`, `Tambah indeks: 10${sup(m)} × 10${sup(n)} = 10${sup(e)}`];
    if (A >= 10) { steps.push(`${A} × 10${sup(e)} = ${fmt(A / 10)} × 10${sup(e + 1)} (pastikan 1 ≤ A < 10)`); A /= 10; e += 1; }
    const correct = `${fmt(A)} × 10${sup(e)}`;
    const opts = shuffle([correct, `${fmt(A)} × 10${sup(e - 1)}`, `${fmt(A * 10)} × 10${sup(e - 1)}`, `${fmt(A)} × 10${sup(m * n)}`].filter((v, i, s) => s.indexOf(v) === i));
    return {
      q: `Hitung (${a} × 10${sup(m)}) × (${b} × 10${sup(n)}). Beri jawapan dalam bentuk piawai.`,
      o: opts, a: opts.indexOf(correct), s: [...steps, `Jawapan: ${correct}`],
      n: "Darab: darab nombor A, TAMBAH indeks. Bahagi: bahagi nombor A, TOLAK indeks. Akhir sekali laraskan supaya 1 ≤ A < 10.",
    };
  },
  sigFig() {
    const cases = [
      () => { const v = rand(1000, 9999) / 1e6; return [v, 2]; },
      () => { const v = rand(10000, 99999); return [v, 3]; },
      () => { const v = rand(1000, 99999) / 100; return [v, 3]; },
    ];
    const [v, sf] = pick(cases)();
    const r = Number(v.toPrecision(sf));
    const show = (x) => (Math.abs(x) < 1 ? x.toPrecision(sf) : String(x));
    const correct = show(r);
    const alt = [Number(v.toPrecision(sf + 1)), Number(v.toPrecision(Math.max(1, sf - 1))), Number((r + 10 ** (Math.floor(Math.log10(Math.abs(r))) - sf + 1)).toPrecision(sf))].map(show);
    const opts = shuffle([correct, ...alt].filter((x, i, s) => s.indexOf(x) === i)).slice(0, 4);
    if (!opts.includes(correct)) opts[0] = correct;
    return {
      q: `Bundarkan ${v} betul kepada ${sf} angka bererti.`,
      o: opts, a: opts.indexOf(correct),
      s: [
        `Angka bererti bermula dari digit BUKAN sifar yang pertama.`,
        `Kira ${sf} digit, kemudian lihat digit seterusnya: ≥ 5 bundar naik, < 5 kekal.`,
        `Jawapan: ${correct}`,
      ],
      n: "Sifar di hadapan (0.00…) TIDAK bererti. Sifar di antara digit bukan sifar ADALAH bererti. Untuk nombor bulat, ganti digit yang dibuang dengan 0.",
    };
  },
  simpleInterest() {
    const P = pick([1000, 2000, 2500, 5000, 8000, 10000, 12000]);
    const r = pick([2, 2.5, 3, 3.5, 4, 5, 6]);
    const t = rand(2, 6);
    const I = P * r / 100 * t;
    return {
      q: `Encik Amir menyimpan ${rm(P)} dalam akaun simpanan tetap dengan kadar faedah mudah ${r}% setahun. Hitung faedah yang diperoleh selepas ${t} tahun.`,
      t: "num", a: I, u: "RM", tol: 0.01,
      s: [`Faedah mudah: I = Prt`, `I = ${P} × ${r}/100 × ${t}`, `I = ${rm(I)}`],
      n: "Dalam I = Prt, r mesti ditukar kepada perpuluhan (bahagi 100) dan t dalam TAHUN (bulan ÷ 12).",
    };
  },
  compound() {
    const P = pick([1000, 2000, 3000, 5000, 10000]);
    const r = pick([3, 4, 5, 6]);
    const n = pick([1, 2, 4, 12]);
    const t = rand(2, 4);
    const MV = P * (1 + r / 100 / n) ** (n * t);
    const nName = { 1: "setiap tahun", 2: "setiap setengah tahun", 4: "setiap suku tahun", 12: "setiap bulan" }[n];
    return {
      q: `Puan Siti melabur ${rm(P)} dengan kadar faedah ${r}% setahun dikompaun ${nName}. Hitung nilai matang selepas ${t} tahun. (Beri jawapan betul kepada 2 tempat perpuluhan)`,
      t: "num", a: Math.round(MV * 100) / 100, u: "RM", tol: 0.02,
      s: [
        `Formula: MV = P(1 + r/n)ⁿᵗ`,
        `P = ${P}, r = ${r / 100}, n = ${n}, t = ${t}`,
        `MV = ${P}(1 + ${r / 100}/${n})${sup(n * t)}`,
        `MV = ${P} × ${fmt((1 + r / 100 / n) ** (n * t), 6)}`,
        `MV = ${rm(MV)}`,
      ],
      n: "n = bilangan kali dikompaun SETAHUN (tahunan 1, setengah tahun 2, suku tahun 4, bulanan 12). Faedah kompaun = MV − P.",
    };
  },
  loanInstalment() {
    const P = pick([5000, 8000, 10000, 15000, 20000, 30000]);
    const r = pick([3, 3.5, 4, 5, 6]);
    const t = rand(2, 7);
    const A = P + P * r / 100 * t;
    const m = A / (12 * t);
    return {
      q: `Kak Lina membuat pinjaman peribadi ${rm(P)} dengan kadar faedah sama rata ${r}% setahun selama ${t} tahun. Hitung bayaran ansuran bulanan. (2 tempat perpuluhan)`,
      t: "num", a: Math.round(m * 100) / 100, u: "RM", tol: 0.02,
      s: [
        `Jumlah bayaran balik A = P + Prt`,
        `A = ${P} + ${P}(${r / 100})(${t}) = ${rm(A)}`,
        `Bilangan bulan = 12 × ${t} = ${12 * t}`,
        `Ansuran bulanan = ${fmt(A)} ÷ ${12 * t} = ${rm(m)}`,
      ],
      n: "Pinjaman kadar sama rata: faedah dikira atas pokok asal sepanjang tempoh — lebih mahal daripada kadar baki berkurangan.",
    };
  },
  roi() {
    const cost = pick([2000, 5000, 8000, 10000, 20000]);
    const ret = Math.round(cost * rand(3, 25) / 100);
    const pct = ret / cost * 100;
    return {
      q: `Ali membeli saham bernilai ${rm(cost)} dan menerima jumlah pulangan (dividen + keuntungan modal) sebanyak ${rm(ret)}. Hitung pulangan atas pelaburan (ROI) dalam %.`,
      t: "num", a: Math.round(pct * 100) / 100, u: "%", tol: 0.05,
      s: [`ROI = (Jumlah pulangan ÷ Kos pelaburan) × 100%`, `ROI = ${ret} ÷ ${cost} × 100%`, `ROI = ${fmt(pct)}%`],
      n: "ROI tinggi = pelaburan lebih menguntungkan. Pelaburan berisiko tinggi biasanya menjanjikan pulangan tinggi.",
    };
  },
  scaleReal() {
    const n = pick([100, 200, 250, 400, 500, 1000, 2000]);
    const d = rand(2, 15) + pick([0, 0.5]);
    const realCm = d * n;
    return {
      q: `Sebuah pelan dilukis dengan skala 1 : ${n}. Panjang sebuah bilik pada pelan ialah ${d} cm. Hitung panjang sebenar bilik itu dalam meter.`,
      t: "num", a: realCm / 100, u: "m", tol: 0.01,
      s: [`Skala 1 : ${n} → 1 cm pada lukisan = ${n} cm sebenar`, `Panjang sebenar = ${d} × ${n} = ${fmt(realCm)} cm`, `Tukar ke meter: ${fmt(realCm)} ÷ 100 = ${fmt(realCm / 100)} m`],
      n: "Ukuran sebenar = ukuran lukisan × n. Ukuran lukisan = ukuran sebenar ÷ n. Jangan lupa tukar unit (100 cm = 1 m).",
    };
  },
  scaleArea() {
    const n = pick([2, 3, 4, 5, 10]);
    const area = rand(3, 20);
    return {
      q: `Sebuah segi empat dilukis dengan skala 1 : ${n}. Luas pada lukisan ialah ${area} cm². Hitung luas sebenar (cm²).`,
      t: "num", a: area * n * n, u: "cm²",
      s: [`Bagi luas, faktor skala dikuasaduakan: luas sebenar = luas lukisan × n²`, `= ${area} × ${n}² = ${area} × ${n * n}`, `= ${area * n * n} cm²`],
      n: "Panjang → darab n. Luas → darab n². Ramai murid tersilap darab n sahaja untuk luas.",
    };
  },
  trigRatio() {
    const [a, b, c] = pick(TRIPLES);
    const fn = pick(["sin", "kos", "tan"]);
    // Right angle at Q. PQ = a (vertical), QR = b (horizontal), PR = c. θ at R.
    const ratio = { sin: [a, c, "sisi bertentangan", "hipotenus", "PQ", "PR"], kos: [b, c, "sisi bersebelahan", "hipotenus", "QR", "PR"], tan: [a, b, "sisi bertentangan", "sisi bersebelahan", "PQ", "QR"] }[fn];
    const ans = frac(ratio[0], ratio[1]);
    return {
      q: `Dalam rajah, PQR ialah segi tiga bersudut tegak di Q. PQ = ${a} cm, QR = ${b} cm dan PR = ${c} cm. Cari nilai ${fn} θ. (Jawapan dalam pecahan, contoh 3/5)`,
      svg: rightTriangleSVG({ pq: `${a} cm`, qr: `${b} cm`, pr: `${c} cm`, angle: "R" }),
      t: "num", a: ratio[0] / ratio[1], shown: ans, tol: 0.001,
      s: [
        `θ berada di R. Sisi bertentangan θ = PQ, sisi bersebelahan = QR, hipotenus = PR (sisi terpanjang).`,
        `${fn} θ = ${ratio[2]} / ${ratio[3]} = ${ratio[4]}/${ratio[5]}`,
        `= ${ratio[0]}/${ratio[1]} = ${ans}`,
      ],
      n: "Ingat SOH-KAH-TOA: Sin = Bertentangan/Hipotenus, Kos = Bersebelahan/Hipotenus, Tan = Bertentangan/Bersebelahan.",
    };
  },
  trigFindSide() {
    const ang = pick([30, 35, 40, 50, 55, 60]);
    const h = rand(8, 20);
    const fn = pick(["sin", "kos"]);
    const val = fn === "sin" ? Math.sin(ang * Math.PI / 180) : Math.cos(ang * Math.PI / 180);
    const side = h * val;
    return {
      q: `PQR bersudut tegak di Q. ∠PRQ = ${ang}° dan hipotenus PR = ${h} cm. Hitung panjang ${fn === "sin" ? "PQ" : "QR"} (betul kepada 2 tempat perpuluhan).`,
      svg: rightTriangleSVG({ pr: `${h} cm`, pq: fn === "sin" ? "?" : "", qr: fn === "kos" ? "?" : "", angle: "R" }),
      t: "num", a: Math.round(side * 100) / 100, u: "cm", tol: 0.02,
      s: [
        fn === "sin" ? `PQ bertentangan dengan ∠R → guna sin` : `QR bersebelahan dengan ∠R → guna kos`,
        `${fn} ${ang}° = ${fn === "sin" ? "PQ" : "QR"} / ${h}`,
        `${fn === "sin" ? "PQ" : "QR"} = ${h} × ${fn} ${ang}° = ${h} × ${fmt(val, 4)}`,
        `= ${fmt(side)} cm`,
      ],
      n: "Pastikan kalkulator dalam mod DEG (darjah). Pilih nisbah yang ada sisi diketahui + sisi dicari.",
    };
  },
  trigSpecial() {
    const items = [["sin 30°", 0.5, "1/2"], ["kos 60°", 0.5, "1/2"], ["tan 45°", 1, "1"], ["sin 90°", 1, "1"], ["kos 0°", 1, "1"], ["tan 60°", Math.sqrt(3), "√3"], ["sin 60°", Math.sqrt(3) / 2, "√3/2"], ["kos 30°", Math.sqrt(3) / 2, "√3/2"]];
    const [lbl, , shown] = pick(items);
    const all = ["1/2", "1", "√3", "√3/2", "1/√2", "0"];
    const opts = shuffle([shown, ...shuffle(all.filter((x) => x !== shown)).slice(0, 3)]);
    return {
      q: `Nyatakan nilai tepat bagi ${lbl}.`,
      o: opts, a: opts.indexOf(shown),
      s: [`Guna segi tiga khas: 30°-60°-90° (sisi 1 : √3 : 2) dan 45°-45°-90° (sisi 1 : 1 : √2).`, `${lbl} = ${shown}`],
      n: "Hafal jadual: sin 30° = kos 60° = 1/2, sin 60° = kos 30° = √3/2, tan 45° = 1, sin 45° = kos 45° = 1/√2.",
    };
  },
  circleCentre() {
    const x = rand(20, 80);
    const flip = Math.random() < 0.5;
    return flip ? {
      q: `Dalam sebuah bulatan berpusat O, sudut di lilitan yang dicangkum oleh lengkok AB ialah ${x}°. Hitung sudut AOB di pusat.`,
      t: "num", a: 2 * x, u: "°",
      s: [`Sudut di pusat = 2 × sudut di lilitan (dicangkum lengkok yang sama)`, `∠AOB = 2 × ${x}° = ${2 * x}°`],
      n: "Sudut di pusat SENTIASA dua kali sudut di lilitan yang dicangkum lengkok sama.",
    } : {
      q: `Sudut AOB di pusat bulatan ialah ${2 * x}°. Hitung sudut ACB di lilitan yang dicangkum oleh lengkok AB yang sama.`,
      t: "num", a: x, u: "°",
      s: [`Sudut di lilitan = ½ × sudut di pusat`, `∠ACB = ${2 * x}° ÷ 2 = ${x}°`],
      n: "Sudut-sudut di lilitan yang dicangkum lengkok yang sama adalah SAMA besar.",
    };
  },
  cyclicQuad() {
    const x = rand(55, 125);
    return {
      q: `ABCD ialah sisi empat kitaran. ∠ABC = ${x}°. Hitung ∠ADC.`,
      t: "num", a: 180 - x, u: "°",
      s: [`Sudut bertentangan dalam sisi empat kitaran bertambah 180°`, `∠ADC = 180° − ${x}° = ${180 - x}°`],
      n: "Sisi empat kitaran: sudut bertentangan = 180°; sudut peluaran = sudut pedalaman bertentangan.",
    };
  },
  tangentRadius() {
    const x = rand(25, 65);
    return {
      q: `PA ialah tangen kepada bulatan berpusat O di titik A. ∠AOP = ${x}°. Hitung ∠APO.`,
      t: "num", a: 90 - x, u: "°",
      s: [`Tangen berserenjang dengan jejari di titik sentuhan → ∠OAP = 90°`, `Hasil tambah sudut segi tiga = 180°`, `∠APO = 180° − 90° − ${x}° = ${90 - x}°`],
      n: "Tangen ⟂ jejari pada titik sentuhan. Dua tangen dari titik luar adalah sama panjang.",
    };
  },
  gradient() {
    let x1 = rand(-5, 5), y1 = rand(-5, 5), x2, y2;
    do { x2 = rand(-6, 6); } while (x2 === x1);
    y2 = rand(-6, 6);
    const m = (y2 - y1) / (x2 - x1);
    return {
      q: `Hitung kecerunan garis lurus yang melalui titik (${x1}, ${y1}) dan (${x2}, ${y2}). (Jawapan pecahan dibenarkan)`,
      t: "num", a: m, shown: frac(y2 - y1, x2 - x1), tol: 0.001,
      s: [`m = (y₂ − y₁) / (x₂ − x₁)`, `m = (${y2} − (${y1})) / (${x2} − (${x1}))`, `m = ${y2 - y1} / ${x2 - x1} = ${frac(y2 - y1, x2 - x1)}`],
      n: "Kecerunan positif → garis naik ke kanan; negatif → turun ke kanan; 0 → mengufuk; tidak tertakrif → mencancang.",
    };
  },
  intercepts() {
    const m = pick([-4, -3, -2, -1, 1, 2, 3, 4]);
    const k = rand(-5, 5) || 2;
    const c = -m * k; // ensures integer x-intercept k
    const askX = Math.random() < 0.6;
    const eq = `y = ${m === 1 ? "" : m === -1 ? "−" : m}x ${c >= 0 ? "+ " + c : "− " + -c}`;
    return askX ? {
      q: `Cari pintasan-x bagi garis lurus ${eq}.`,
      t: "num", a: k,
      s: [`Pintasan-x: titik garis memotong paksi-x, iaitu y = 0`, `0 = ${m}x + (${c})`, `${m}x = ${-c} → x = ${-c}/${m} = ${k}`],
      n: "Pintasan-x = −c/m. Pintasan-y = c (pemalar dalam y = mx + c).",
    } : {
      q: `Nyatakan pintasan-y bagi garis lurus ${eq}.`,
      t: "num", a: c,
      s: [`Dalam bentuk y = mx + c, pintasan-y = c`, `c = ${c}`],
      n: "Pintasan-y = c; kecerunan = m. Pastikan persamaan dalam bentuk y = mx + c dahulu (y bersendirian).",
    };
  },
  lineEquation() {
    const m = pick([-3, -2, -1, 1, 2, 3, 4]);
    const x = rand(-4, 4), y = rand(-6, 8);
    const c = y - m * x;
    return {
      q: `Sebuah garis lurus mempunyai kecerunan ${m} dan melalui titik (${x}, ${y}). Persamaannya ialah y = ${m}x + c. Cari nilai c.`,
      t: "num", a: c,
      s: [`Gantikan titik (${x}, ${y}) dan m = ${m} ke dalam y = mx + c`, `${y} = ${m}(${x}) + c`, `${y} = ${m * x} + c`, `c = ${y} − (${m * x}) = ${c}`, `Persamaan: y = ${m}x ${c >= 0 ? "+ " + c : "− " + -c}`],
      n: "Garis selari mempunyai kecerunan SAMA. Guna titik yang diberi untuk cari c.",
    };
  },

  // ---------------- SAINS ----------------
  elecCost() {
    const items = [["peti sejuk", 150], ["televisyen", 100], ["seterika", 1000], ["pendingin hawa", 1500], ["cerek elektrik", 2000], ["kipas", 60], ["mesin basuh", 500]];
    const [name, W] = pick(items);
    const h = rand(1, 10), d = 30;
    const rate = pick([0.218, 0.334, 0.25, 0.3]);
    const kWh = W / 1000 * h * d;
    const cost = kWh * rate;
    return {
      q: `Sebuah ${name} ${W} W digunakan ${h} jam sehari selama ${d} hari. Jika kadar elektrik ialah RM${rate} per kWh, hitung kos penggunaan elektrik. (2 tempat perpuluhan)`,
      t: "num", a: Math.round(cost * 100) / 100, u: "RM", tol: 0.02,
      s: [
        `Tukar kuasa kepada kW: ${W} W ÷ 1000 = ${W / 1000} kW`,
        `Masa = ${h} jam × ${d} hari = ${h * d} jam`,
        `Tenaga = P × t = ${W / 1000} × ${h * d} = ${fmt(kWh)} kWh`,
        `Kos = ${fmt(kWh)} × RM${rate} = ${rm(cost)}`,
      ],
      n: "Tenaga elektrik (kWh) = Kuasa (kW) × Masa (jam). 1 kWh = 1 unit elektrik. Kos = unit × kadar.",
    };
  },
  powerVI() {
    const V = pick([12, 24, 110, 240]);
    const I = pick([0.5, 1, 2, 2.5, 4, 5]);
    const flip = Math.random() < 0.5;
    return flip ? {
      q: `Sebuah alat elektrik disambung kepada bekalan ${V} V dan arus ${I} A mengalir. Hitung kuasa alat itu (W).`,
      t: "num", a: V * I, u: "W",
      s: [`P = VI`, `P = ${V} × ${I}`, `P = ${fmt(V * I)} W`],
      n: "Kuasa (W) = Voltan (V) × Arus (A). Kuasa juga = kadar tenaga digunakan.",
    } : {
      q: `Sebuah pemanas ${fmt(V * I)} W disambung kepada bekalan ${V} V. Hitung arus yang mengalir (A).`,
      t: "num", a: I, u: "A", tol: 0.01,
      s: [`P = VI → I = P/V`, `I = ${fmt(V * I)} ÷ ${V}`, `I = ${fmt(I)} A`],
      n: "Fius dipilih sedikit lebih tinggi daripada arus normal (cth: arus 2.5 A → fius 3 A).",
    };
  },
  transformer() {
    const Np = pick([100, 200, 400, 500, 1000, 1200]);
    const Vp = pick([240, 120, 12]);
    const ratio = pick([0.05, 0.1, 0.25, 0.5, 2, 4, 5, 10]);
    const Ns = Np * ratio, Vs = Vp * ratio;
    return {
      q: `Sebuah transformer mempunyai ${Np} lilitan pada gegelung primer dan ${Ns} lilitan pada gegelung sekunder. Voltan input ialah ${Vp} V. Hitung voltan output (V).`,
      t: "num", a: Vs, u: "V", tol: 0.01,
      s: [`Vp/Vs = Np/Ns`, `${Vp}/Vs = ${Np}/${Ns}`, `Vs = ${Vp} × ${Ns} ÷ ${Np} = ${fmt(Vs)} V`, ratio > 1 ? `Ns > Np → transformer INJAK NAIK` : `Ns < Np → transformer INJAK TURUN`],
      n: "Transformer hanya berfungsi dengan arus ULANG-ALIK. Injak naik: Ns > Np; injak turun: Ns < Np.",
    };
  },
  work() {
    const F = rand(5, 60) * 2, s = rand(2, 12);
    return {
      q: `Seorang murid menolak troli dengan daya ${F} N sejauh ${s} m. Hitung kerja yang dilakukan (J).`,
      t: "num", a: F * s, u: "J",
      s: [`W = F × s`, `W = ${F} × ${s}`, `W = ${F * s} J`],
      n: "Kerja hanya dilakukan jika objek BERGERAK pada arah daya. 1 J = 1 N m.",
    };
  },
  powerWt() {
    const W = rand(10, 90) * 20, t = pick([2, 4, 5, 8, 10, 20]);
    return {
      q: `Sebuah motor melakukan kerja ${W} J dalam masa ${t} s. Hitung kuasa motor itu (W).`,
      t: "num", a: W / t, u: "W", tol: 0.01,
      s: [`P = W / t`, `P = ${W} ÷ ${t}`, `P = ${fmt(W / t)} W`],
      n: "Kuasa = kadar melakukan kerja. 1 W = 1 J/s.",
    };
  },
  potentialE() {
    const m = rand(2, 60), h = rand(2, 20);
    return {
      q: `Sebuah beg berjisim ${m} kg diangkat ke rak setinggi ${h} m. Hitung tenaga keupayaan graviti beg itu. (g = 10 N/kg)`,
      t: "num", a: m * 10 * h, u: "J",
      s: [`Ep = mgh`, `Ep = ${m} × 10 × ${h}`, `Ep = ${m * 10 * h} J`],
      n: "Ep bergantung pada jisim dan ketinggian. Semakin tinggi, semakin besar Ep.",
    };
  },
  kineticE() {
    const m = rand(1, 80), v = rand(2, 20);
    const E = 0.5 * m * v * v;
    return {
      q: `Sebuah objek berjisim ${m} kg bergerak dengan halaju ${v} m/s. Hitung tenaga kinetiknya (J).`,
      t: "num", a: E, u: "J", tol: 0.01,
      s: [`Ek = ½mv²`, `Ek = ½ × ${m} × ${v}²`, `Ek = ½ × ${m} × ${v * v}`, `Ek = ${fmt(E)} J`],
      n: "Halaju dikuasaduakan — gandakan halaju, Ek jadi 4 kali ganda.",
    };
  },

  // ---------------- GEOGRAFI ----------------
  pieAngle() {
    const parts = [rand(2, 9) * 5, rand(2, 9) * 5, rand(2, 9) * 5];
    const total = parts[0] + parts[1] + parts[2];
    const labels = pick([["Getah", "Kelapa sawit", "Koko"], ["Kereta", "Motosikal", "Bas"], ["Pertanian", "Perkilangan", "Perkhidmatan"]]);
    const i = rand(0, 2);
    const ang = parts[i] / total * 360;
    return {
      q: `Jadual menunjukkan data: ${labels[0]} ${parts[0]}, ${labels[1]} ${parts[1]}, ${labels[2]} ${parts[2]} (jumlah ${total}). Hitung sudut sektor bagi "${labels[i]}" dalam carta pai. (betul kepada darjah terdekat)`,
      t: "num", a: Math.round(ang), u: "°", tol: 0.6,
      s: [`Sudut sektor = (nilai ÷ jumlah) × 360°`, `= (${parts[i]} ÷ ${total}) × 360°`, `= ${fmt(ang, 1)}° ≈ ${Math.round(ang)}°`],
      n: "Semak: jumlah semua sudut mesti 360°. Mula lukis dari arah jam 12 mengikut arah jam.",
    };
  },
  tempRange() {
    const max = rand(28, 34), min = rand(20, 26);
    return {
      q: `Suhu maksimum sebuah bandar ialah ${max}°C dan suhu minimum ialah ${min}°C. Hitung julat suhu.`,
      t: "num", a: max - min, u: "°C",
      s: [`Julat suhu = suhu maksimum − suhu minimum`, `= ${max} − ${min}`, `= ${max - min}°C`],
      n: "Julat suhu kecil (cth Malaysia) menunjukkan iklim khatulistiwa: panas sepanjang tahun.",
    };
  },
};
