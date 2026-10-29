# BijakzMY — Ulang Kaji Tingkatan 3 KSSM

Web app untuk latih tubi dan ulang kaji **Tingkatan 3 KSSM (UASA)**. Ia mesra telefon, boleh dipasang sebagai app (PWA) dan berfungsi tanpa internet.

> Research silibus, format UASA dan topik berpeluang tinggi: lihat **[RESEARCH.md](RESEARCH.md)**.

## Ciri utama

| Ciri | Keterangan |
|---|---|
| 📚 **Nota ringkas** | Nota berpoin bagi setiap bab: 7 subjek, 55 bab |
| 📐 **Bank Formula** | Semua formula Matematik, Sains, Geografi dan Pendidikan Islam (tajwid, zakat), dengan carian |
| 🃏 **Kad imbas** | Kad istilah ↔ maksud untuk hafalan pantas |
| ✍️ **Latih Tubi** | Setiap soalan ada **jawapan betul, cara kira langkah demi langkah dan nota ringkas**. Semuanya **terus dipaparkan bila jawapan salah**. |
| ♾️ **Penjana soalan rawak** | Ada 34 penjana untuk Matematik, Sains, Geografi dan Pendidikan Islam (zakat). Nombor berubah setiap kali, jadi soalan tidak pernah habis dan langkah kiraan dijana automatik. |
| 🔥 **Topik berpeluang tinggi** | Soalan dan bab yang kerap keluar ditanda 🔥, dan ada mod latihan khas untuknya |
| 🔁 **Ulang Kaji Salah** | Soalan yang dijawab salah disimpan untuk diulang |
| 📝 **Mod Peperiksaan** | Simulasi UASA bermasa (10/20/40 soalan). Keputusan dalam % dan Tahap Penguasaan TP1–TP6, beserta pembetulan penuh. |
| 🎮 **Games** | ⚡ Kuiz Kilat (60 saat + combo), 🧩 Padan Pantas, ❤️ Betul atau Salah (3 nyawa) |
| 📊 **Progres** | XP, tahap, streak harian, matlamat harian, ketepatan ikut bab, dan topik lemah dicadangkan |
| 🤖 **Cikgu AI** (pilihan) | Penerangan lebih mendalam daripada Claude, menggunakan kunci API pengguna sendiri |

Subjek: **Matematik, Sains, Sejarah, Geografi, Bahasa Melayu, English, Pendidikan Islam**.

## Jalankan secara lokal

App ini statik (HTML/CSS/JS, tiada build step). Ia perlu dibuka melalui pelayan HTTP kerana menggunakan ES modules:

```bash
python3 -m http.server 8000
```

Kemudian buka http://localhost:8000.

## Deploy (GitHub Pages)

Settings → Pages → *Deploy from a branch* → pilih branch dan folder `/ (root)`. Selepas itu app boleh dibuka di telefon dan dipasang melalui "Tambah ke skrin utama".

Bila fail diubah, naikkan `VERSION` dalam `sw.js` supaya pengguna menerima versi baharu.

## Struktur

```
index.html            Kerangka app + navigasi bawah
css/style.css         Gaya mobile-first (mod gelap disokong)
js/app.js             Router dan semua paparan
js/engine.js          Bina set soalan, semak jawapan, tukar soalan isian → aneka pilihan
js/generators.js      Penjana soalan rawak + langkah kiraan
js/quiz.js            Sesi latih tubi & mod peperiksaan
js/games.js           3 games
js/ai.js              Cikgu AI (Claude, pilihan)
js/store.js           Progres (localStorage)
js/data/*.js          Kandungan subjek: nota, formula, kad, soalan
sw.js, manifest.webmanifest   PWA / offline
```

### Tambah soalan

Dalam `js/data/<subjek>.js`, tambah objek ke `qs` bab berkenaan:

```js
{ q: "Soalan…", o: ["A", "B", "C", "D"], a: 0,          // aneka pilihan (a = indeks jawapan)
  s: ["Langkah 1", "Langkah 2"], n: "Nota ringkas", hot: true }
{ q: "Kenyataan…", a: true, s: [...] }                  // betul/salah
{ q: "Hitung…", a: 42, u: "cm", tol: 0.01, s: [...] }   // jawapan isian berangka
```

## Cikgu AI

Penerangan langkah demi langkah sudah terbina dalam app dan berfungsi tanpa internet. Untuk penerangan tambahan, pengguna boleh masukkan kunci API Claude di **Progres → Tetapan**. Kunci itu disimpan dalam pelayar peranti pengguna sahaja dan dihantar terus ke Anthropic.

Untuk deploy kepada ramai pelajar, gunakan pelayan proksi supaya pelajar tidak perlu memasukkan kunci sendiri.
