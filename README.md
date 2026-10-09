# Seikijang Fighter

Game pertarungan ninja 2D klasik melawan komputer, bertempat di halaman sekolah.
Bisa dimainkan di **HP** (tombol layar sentuh) maupun **komputer** (keyboard), langsung dari browser.

## Karakter

| Karakter | Jurus (butuh cakra) | Jurus Pamungkas (cakra penuh) |
|---|---|---|
| **Nur Hokage**: Hokage Cahaya Emas | Rasengan Cahaya: melesat maju membawa bola cakra berputar | Rasen-Shuriken Hokage: shuriken angin raksasa yang mengurung lawan |
| **Siti Hokage**: Hokage Api Konoha | Katon: Bola Api, segel tangan lalu menyemburkan bola api | Kuchiyose: Pilar Api, segel pemanggil memunculkan pilar api di bawah lawan |
| **Ranti**: Sannin Tinju Seratus | Retakan Bumi: tinju ke tanah, batu menjalar ke lawan | Byakugo: Tinju Seratus, memulihkan darah lalu menghantam dengan tinju raksasa |
| **Mrs. Dina**: Balerina Kilat | Tendangan Putar Udara: tendangan memutar di udara yang melepas bilah angin jarak jauh | Tendangan Badai: tendangan jarak jauh berupa badai angin yang melempar lawan |
| **Fatim**: Ninja Bayangan Bercadar | Shuriken Rahasia: tiga shuriken dari balik jubah | Tusukan Seribu Bayangan: menerjang lalu menusuk bertubi-tubi bersama bayangannya |
| **Mas Tio**: Pendekar Salto Kilat | Terjangan Kilat: menabrak lawan dengan kecepatan tinggi hingga terjatuh | Salto Badai: terjangan, tendangan salto ke udara, lalu hantaman ke tanah |
| **Pak Jef**: Otot Baja Sekolah | Lemparan Batu Meriam: mencabut batu dari tanah lalu melemparnya | Batu Raksasa: mengangkat batu sangat besar dari tanah lalu melemparkannya |
| **King Andri**: Raja Petir *(over power)* | Kamehameha: gelombang energi sampai tepi layar | Laser Merah Langit: melompat tinggi lalu menembakkan laser merah ke bawah, lawan terlempar |
| **Mbak Nita**: Pemanah Petir | Panah Cahaya: mengeluarkan busur lalu menembakkan panah | Panah Petir: panah berpetir yang menyeret lawan jauh ke belakang |

Ciri khas tambahan: TENDANG Mrs. Dina adalah terjangan secepat kilat yang melempar lawan,
Fatim bergerak maju dengan lari merunduk yang cepat, Mas Tio punya tendangan salto (PUKUL 3x).
Pukulan & tendangan Pak Jef 35% lebih kuat dan mendorong lawan lebih jauh, tapi ia bergerak lebih lambat.
Pukulan & tendangan King Andri melepaskan petir sejauh setengah layar yang mendorong lawan, dan cakranya penuh dalam 2 detik.

3 slot karakter lain sudah disiapkan (terkunci, "segera hadir").

## Mode permainan

- **VS BATTLE**: pilih karaktermu dan satu lawan (komputer).
- **ARCADE**: pilih satu karakter, lalu kalahkan semua karakter lain satu per satu (urutan acak, King Andri selalu jadi bos terakhir).
  Kalah di tengah jalan? Pilih **COBA LAGI** untuk mengulang lawan yang sama.

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

Saat dibuka, game menampilkan layar "SENTUH LAYAR UNTUK MULAI". Sentuhan itu langsung membuat game layar penuh dan mendatar
(browser HP hanya mengizinkan layar penuh setelah layar disentuh). Tombol **LAYAR PENUH** juga ada di layar judul, pilih karakter, dan menu jeda.

Tips untuk HP: buka alamat game di Chrome, lalu pilih menu **⋮ → Tambahkan ke layar utama**.
Game akan terbuka layar penuh dan mendatar seperti aplikasi.

## Memperbarui game yang sudah online

Setelah mengunggah versi baru, naikkan angka `?v=` di `index.html` (misalnya `?v=1.4` → `?v=1.5`) dan `VERSION` di `js/config.js`
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

   Sheet boleh JPG atau PNG dengan latar kotak-kotak gelap maupun terang (lihat contoh `kingandri` & `nita`).
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
js/jutsu2.js          jurus Mrs. Dina, Fatim, Mas Tio
js/jutsu3.js          jurus Pak Jef, King Andri
js/jutsu4.js          jurus Mbak Nita
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
