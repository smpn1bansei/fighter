# Seikijang Fighter

Game pertarungan ninja 2D klasik melawan komputer, bertempat di halaman sekolah.
Bisa dimainkan di **HP** (tombol layar sentuh) maupun **komputer** (keyboard), langsung dari browser.

## Karakter

| Karakter | Jurus (butuh cakra) | Jurus Pamungkas (cakra penuh) |
|---|---|---|
| **Nur Hokage**: Hokage Cahaya Emas | Rasengan Cahaya: melesat maju membawa bola cakra berputar | Rasen-Shuriken Hokage: shuriken angin raksasa yang mengurung lawan |
| **Siti Hokage**: Pemimpin Tekad Api | Laser Angin Berputar: dua tangan, lawan terhempas ke ujung arena | Bola Tekad Api: bola energi dari dada, menghapus serangan lawan |
| **Ranti**: Pengurus Administrasi Ninja | Hentakan Bumi: tanah retak sejauh 55% arena, tak bisa ditangkis | Bola Pusaran Angin: sejauh 50% arena |
| **Mrs. Dina**: ASN Angin Petir | Tinju Kilat Angin: melesat kilat lalu meninju dari bawah, lawan terlempar ke atas | Badai Turbo: angin turbo berpetir menghempaskan lawan ke ujung arena |
| **Fatim**: Ninja Senjata Kilat | Tabrakan Petir: melesat menabrak lawan lalu menyetrum | Bola Petir: bola petir sejauh 70% arena masuk ke tubuh lawan |
| **Mas Tio**: Operator Kilat | Flash Punch: lari kilat lalu meninju | Hantaman Langit: muncul di atas kepala lawan & menghantam ke bawah, tanah retak |
| **Pak Jef**: Otot Baja Sekolah | Bola Basket Api: lawan yang terkena langsung jatuh | Tendangan Bola Petir Super: lawan terdorong ke ujung arena walau menangkis |
| **King Andri**: Raja Petir *(over power)* | Kamehameha: gelombang energi sampai tepi layar | Laser Merah Langit: menghilang, muncul di atas & menembakkan laser mata, lalu muncul di depan lawan yang terjatuh |
| **Mbak Nita**: Pemanah Petir | Panah Cahaya: mengeluarkan busur lalu menembakkan panah | Panah Petir: panah berpetir yang menyeret lawan jauh ke belakang |
| **Suci Flower**: Mawar Berduri | Angin Pisau Mawar: kibasan mawar melepas angin pisau merah yang mementalkan lawan | Mawar Beracun: mawar dilempar, meledak menjadi racun, lawan roboh |
| **Septi**: Penari Kipas Angin | Kibasan Kipas: satu kipas melepas angin yang menjatuhkan lawan | Badai Dua Kipas: badai angin yang melempar lawan sampai tepi arena |
| **Almusbar**: Pelatih Bola Petir | Lemparan Bola: bola dari tangan yang menjatuhkan lawan | Tendangan Bola Petir: melempar lawan ke ujung arena |

**Perisai (tahan):** pukulan & tendangan yang ditangkis tidak memberi damage.
Jurus yang ditangkis tetap memberi 20% damage (kecuali Hentakan Bumi Ranti yang tak bisa ditangkis).
Ulti yang ditangkis tetap memberi 50% damage (Nur Hokage, Siti Hokage, King Andri, Almusbar) atau 20% (karakter lain).

Nur Hokage & Siti Hokage: tekan arah ATAS untuk menghilang & muncul di belakang lawan (memakai cakra seperti jurus).
Lawan baru sadar dan berbalik badan sekitar 2,5 detik kemudian (atau saat terkena serangan).
Ciri khas tambahan: pukulan Mrs. Dina berupa petir kuning sejauh 30% arena dan tendangannya mendorong lawan ke ujung arena (ditangkis: tanpa damage),
Fatim melempar shuriken sejauh 45% arena dan bisa meluncur kilat seperti Mas Tio, Mas Tio bisa meluncur kilat: tekan arah depan sekali untuk melesat ke depan lawan, arah belakang untuk mundur ke ujung arena.
Almusbar punya kombo 5 pukulan kiri-kanan (tekan PUKUL berulang) dan tendangan yang mementalkan lawan jauh.
Pukulan Mbak Nita menyemburkan api sejauh 25% arena.
Tendangan Pak Jef menembakkan bola sejauh 40% arena; pukulannya 35% lebih kuat dan mendorong lawan lebih jauh, tapi ia bergerak lebih lambat.
King Andri, Suci Flower, Septi, dan Almusbar berjalan dengan langkah kaki bergantian.
Pukulan & tendangan King Andri melepaskan petir sejauh setengah layar yang mendorong lawan, dan cakranya penuh dalam 2 detik.

Semua 12 slot karakter sudah terisi.

## Layar judul

Tombol **KREDIT** (pojok kiri atas) menampilkan informasi pembuat game.
Di layar pilih karakter, tombol **DAFTAR JURUS** (atau tombol M) menampilkan semua jurus karakter.

## Mode permainan

- **VS BATTLE**: pilih karaktermu dan satu lawan (komputer).
- **ARCADE**: pilih satu karakter, lalu kalahkan semua karakter lain satu per satu (urutan acak, King Andri selalu jadi bos terakhir).
  Kalah di tengah jalan? Pilih **COBA LAGI** untuk mengulang lawan yang sama.
- **VS ONLINE**: dua pemain dari dua HP.
  1. Pemain pertama menekan **BUAT ROOM** dan mendapat **kode room** 4 angka.
  2. Pemain kedua menekan **GABUNG ROOM** lalu memasukkan kode itu.
  3. Masing-masing memilih karakter di HP sendiri, lalu bertarung. Pembuat room selalu di kiri.

  Kedua HP butuh internet saat menyambung (memakai server perkenalan gratis PeerJS).
  Setelah tersambung, data dikirim langsung antar-HP (WebRTC), jadi paling lancar bila kedua HP memakai
  **Wi-Fi yang sama**, atau HP kedua memakai **hotspot** HP pertama.
  Beberapa Wi-Fi sekolah/kantor memblokir sambungan antar-perangkat; bila gagal, pakai hotspot.
  Bila layar kedua HP berbeda rasio, arena disamakan dan HP yang layarnya lebih lebar mendapat sedikit tepi hitam.

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

Setelah mengunggah versi baru, naikkan angka `?v=` di `index.html` (misalnya `?v=2.5` → `?v=2.6`) dan `VERSION` di `js/config.js`
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

   Sheet boleh JPG atau PNG dengan latar kotak-kotak gelap maupun terang (lihat contoh `kingandri` & `nita`),
   atau sheet GRID berlatar putih dengan garis kotak & nomor (lihat contoh `almusbar`, opsi `grid`).
   Hasilnya `assets/sprites/<id>.webp`, `<id>.json`, `<id>-portrait.webp`, `<id>-face.webp`.
4. Di `js/characters.js`, ganti salah satu slot `locked` dengan data karakter baru (salin data karakter yang ada lalu sesuaikan pose, jangkauan serangan, dan jurusnya). Jurus baru ditulis di `js/jurus/_dasar.js     alat bantu jurus, kelas Actor, efek bersama
js/jurus/_proyektil.js proyektil yang dipakai beberapa karakter
js/jurus/<karakter>.js jurus tiap karakter (nur, siti, ranti, dina, fatim, tio, pakjef, kingandri, nita, suci, septi, almusbar)

## Struktur folder

```
index.html            halaman utama
css/style.css         tampilan halaman & layar "putar HP"
lib/phaser.min.js     mesin game Phaser 3.80.1
js/config.js          pengaturan umum
js/characters.js      data 12 slot karakter
js/fighter.js         gerak, serangan, & status petarung
js/jurus/_dasar.js     alat bantu jurus, kelas Actor, efek bersama
js/jurus/_proyektil.js proyektil yang dipakai beberapa karakter
js/jurus/<karakter>.js jurus tiap karakter (nur, siti, ranti, dina, fatim, tio, pakjef, kingandri, nita, suci, septi, almusbar)
js/ai.js              kecerdasan komputer
js/input.js           keyboard & tombol layar sentuh
js/net.js             main online 2 HP (PeerJS / WebRTC, lockstep)
js/fx.js              efek visual
js/sound.js           efek suara & musik (dibuat dengan kode)
js/ui.js              tombol & teks menu
js/scenes/            layar: memuat, judul, online, pilih karakter, VS, arena
assets/               gambar karakter, latar, font, ikon
asset-custom/         gambar asli (sumber)
tools/                alat bantu pemroses gambar (tidak dimuat oleh game)
```

## Lisensi pihak ketiga

- [Phaser](https://phaser.io): lisensi MIT
- Font *Press Start 2P* dan *Bangers*: SIL Open Font License (lihat `assets/fonts/`)
