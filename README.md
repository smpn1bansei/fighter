# Seikijang Fighter

Game pertarungan ninja 2D klasik melawan komputer, bertempat di halaman sekolah.
Bisa dimainkan di **HP** (tombol layar sentuh) maupun **komputer** (keyboard), langsung dari browser.

## Karakter

| Karakter | Jurus (butuh cakra) | Jurus Pamungkas (cakra penuh) |
|---|---|---|
| **Nur Hokage**: Hokage Cahaya Emas | Rasengan Cahaya: melesat membawa bola cakra berputar | Rasen-Shuriken Hokage: shuriken angin raksasa yang mengurung lawan |
| **Sit Hokage**: Hokage Api Konoha | Katon: Bola Api, segel tangan lalu menyemburkan bola api | Kuchiyose: Pilar Api, segel pemanggil memunculkan pilar api di bawah lawan |
| **Ranti**: Sannin Tinju Seratus | Retakan Bumi: tinju ke tanah, batu menjalar ke lawan | Byakugo: Tinju Seratus, memulihkan darah lalu menghantam dengan tinju raksasa |
| **Marthadin**: Balerina Angin Puyuh | Tendangan Putar Udara: tendangan memutar di udara yang melepas bilah angin jarak jauh | Putaran Tornado: berputar menjadi angin puyuh yang menghisap lawan |
| **Fatim**: Ninja Bayangan Bercadar | Shuriken Rahasia: tiga shuriken dari balik jubah | Tusukan Seribu Bayangan: menerjang lalu menusuk bertubi-tubi bersama bayangannya |
| **Tio**: Pendekar Salto Kilat | Terjangan Kilat: menabrak lawan dengan kecepatan tinggi hingga terjatuh | Salto Badai: terjangan, tendangan salto ke udara, lalu hantaman ke tanah |

Ciri khas tambahan: Marthadin menyerang dengan lompatan split *Grand Jeté* (TENDANG) dan menukik dari udara,
Fatim bergerak maju dengan lari merunduk yang cepat, Tio punya tendangan salto (PUKUL 3x).

6 slot karakter lain sudah disiapkan (terkunci, "segera hadir").

## Cara main

| Aksi | Layar sentuh | Keyboard |
|---|---|---|
| Jalan | ◀ ▶ | ← → / A D |
| Lompat | ▲ | ↑ / W / Spasi |
| Tahan (blok) | ▼ (atau tahan arah mundur) | ↓ / S |
| Pukul (tekan 3x = kombo) | PUKUL | J / Z |
| Tendang | TENDANG | K / X |
| Jurus ninja | JURUS | L / C |
| Isi cakra (tahan) | CAKRA | U / V |
| Jurus pamungkas | ULTI | I / B |
| Jeda | ❚❚ | Esc / P |

- Menang 2 ronde = menang pertandingan. Satu ronde 99 detik.
- Cakra bertambah saat memukul, terkena pukulan, atau saat menahan tombol CAKRA.
- Tingkat kesulitan komputer: **Mudah**, **Sedang**, **Sulit**.

## Mencoba di komputer sendiri

Game harus dibuka lewat server (tidak bisa dengan klik dua kali `index.html`). Jika Node.js sudah terpasang:

```bash
node tools/serve.js
```

Lalu buka <http://localhost:8080> di browser. Cara lain: ekstensi **Live Server** di VS Code.

## Memasang di GitHub Pages

1. Buat repository baru di GitHub (misalnya `seikijang-fighter`).
2. Unggah isi folder ini **kecuali** `tools/node_modules` (folder itu hanya untuk alat bantu dan sangat besar).
   File yang wajib ada: `index.html`, `manifest.webmanifest`, `.nojekyll`, folder `css`, `js`, `lib`, `assets`.
3. Di repository: **Settings → Pages → Source: Deploy from a branch**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
4. Setelah 1–2 menit game bisa dibuka di `https://<nama-akun>.github.io/seikijang-fighter/`.

Tips untuk HP: buka alamat game di Chrome, lalu pilih menu **⋮ → Tambahkan ke layar utama**.
Game akan terbuka layar penuh dan mendatar seperti aplikasi.

## Memperbarui game yang sudah online

Setelah mengunggah versi baru, naikkan angka `?v=` di `index.html` (misalnya `?v=1.1` → `?v=1.2`)
agar HP pemain langsung memuat versi terbaru, bukan versi lama yang tersimpan di browser.
GitHub Pages butuh sekitar 1–10 menit untuk menampilkan perubahan.

## Mengubah teks

Di `js/config.js`:

- `BANNER_TEXT` adalah tulisan pada spanduk di arena (misalnya nama sekolah).
- `TITLE`, `SUBTITLE`, `ROUND_TIME`, `ROUNDS_TO_WIN`, dan tingkat kesulitan (`DIFFICULTY`).

Nama, deskripsi, kutipan, dan kekuatan karakter ada di `js/characters.js`.

## Menambah karakter baru

1. Simpan sprite sheet karakter di `asset-custom/` (format seperti sheet yang sudah ada: pose-pose di atas latar kotak-kotak).
2. Tambahkan entri karakter di `SHEETS` dalam `tools/extract-sprites.js`: nama file, warna kotak-kotak latar, dan nama tiap pose sesuai urutan baca (kiri→kanan, atas→bawah).
3. Jalankan:

   ```bash
   cd tools
   npm install
   node extract-sprites.js <id-karakter>
   ```

   Hasilnya `assets/sprites/<id>.webp`, `<id>.json`, `<id>-portrait.webp`, `<id>-face.webp`.
4. Di `js/characters.js`, ganti salah satu slot `locked` dengan data karakter baru (salin data karakter yang ada lalu sesuaikan pose, jangkauan serangan, dan jurusnya). Jurus baru ditulis di `js/jutsu.js`.

## Struktur folder

```
index.html            halaman utama
css/style.css         tampilan halaman & layar "putar HP"
lib/phaser.min.js     mesin game Phaser 3.80.1
js/config.js          pengaturan umum
js/characters.js      data 12 slot karakter
js/fighter.js         gerak, serangan, & status petarung
js/jutsu.js           jurus-jurus ninja (Nur, Sit, Ranti) + dasar proyektil
js/jutsu2.js          jurus Marthadin, Fatim, Tio
js/ai.js              kecerdasan komputer
js/input.js           keyboard & tombol layar sentuh
js/fx.js              efek visual
js/sound.js           efek suara & musik (dibuat dengan kode)
js/ui.js              tombol & teks menu
js/scenes/            layar: memuat, judul, pilih karakter, VS, arena
assets/               gambar karakter, latar, font, ikon
asset-custom/         gambar asli (sumber)
tools/                alat bantu pemroses gambar (tidak dimuat oleh game)
```

## Lisensi pihak ketiga

- [Phaser](https://phaser.io): lisensi MIT
- Font *Press Start 2P* dan *Bangers*: SIL Open Font License (lihat `assets/fonts/`)
