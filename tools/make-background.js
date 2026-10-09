// Siapkan gambar latar arena dari asset-custom/latarbelakang.jpg:
//  - buang bagian atas yang berisi HUD contoh (bar darah "NAMA", "ROUND 1")
//  - hapus tulisan "SPANDUK SEKOLAH" (teks spanduk ditulis ulang oleh game, lihat js/config.js)
//  - perkecil & simpan sebagai WebP
// Pemakaian: cd tools && node make-background.js
const path = require('path');
const { sharp, loadRGB } = require('./lib');

const SRC = path.join(__dirname, '..', 'asset-custom', 'latarbelakang.jpg');
const OUT = path.join(__dirname, '..', 'assets', 'bg', 'sekolah.webp');
const CROP_TOP = 300;   // baris asli; di atas ini ada HUD contoh
const OUT_W = 1920;

// Area tulisan spanduk pada gambar asli (2400x1792).
const TEXT = { x0: 1044, x1: 1428, y0: 1606, y1: 1668 };

(async () => {
  const img = await loadRGB(SRC);
  const { data, w, h } = img;
  // Isi area tulisan dengan interpolasi vertikal warna kain spanduk di atas & bawahnya.
  for (let x = TEXT.x0; x <= TEXT.x1; x++) {
    const top = (TEXT.y0 * w + x) * 3, bot = (TEXT.y1 * w + x) * 3;
    for (let y = TEXT.y0 + 1; y < TEXT.y1; y++) {
      const t = (y - TEXT.y0) / (TEXT.y1 - TEXT.y0);
      const o = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) data[o + c] = Math.round(data[top + c] * (1 - t) + data[bot + c] * t);
    }
  }
  const scale = OUT_W / w;
  await sharp(data, { raw: { width: w, height: h, channels: 3 } })
    .extract({ left: 0, top: CROP_TOP, width: w, height: h - CROP_TOP })
    .resize(OUT_W, Math.round((h - CROP_TOP) * scale), { kernel: 'lanczos3' })
    .webp({ quality: 86, effort: 6 })
    .toFile(OUT);
  const bannerX = ((TEXT.x0 + TEXT.x1) / 2) * scale;
  const bannerY = ((TEXT.y0 + TEXT.y1) / 2 - CROP_TOP) * scale;
  console.log(`Selesai: ${OUT}`);
  console.log(`Ukuran ${OUT_W}x${Math.round((h - CROP_TOP) * scale)}, pusat teks spanduk (${bannerX.toFixed(0)}, ${bannerY.toFixed(0)}), lebar ${((TEXT.x1 - TEXT.x0) * scale).toFixed(0)}`);
  console.log(`Garis tanah (y asli 1455) -> ${((1455 - CROP_TOP) * scale).toFixed(0)}`);
})();
