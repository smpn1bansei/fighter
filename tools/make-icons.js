// Buat ikon aplikasi (untuk "Tambahkan ke layar utama" di HP).
// Pemakaian: cd tools && node make-icons.js
const path = require('path');
const { sharp } = require('./lib');

const OUT = path.join(__dirname, '..', 'assets', 'ui');
const FACE = path.join(__dirname, '..', 'assets', 'sprites', 'nur-face.webp');

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  for (const size of [192, 512]) {
    const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs><radialGradient id="g" cx="50%" cy="45%" r="60%">
        <stop offset="0" stop-color="#ff8a1a"/><stop offset="0.55" stop-color="#b8300e"/><stop offset="1" stop-color="#1a0b14"/>
      </radialGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.4}" fill="none" stroke="#ffd75a" stroke-width="${size * 0.035}"/>
    </svg>`);
    const face = await sharp(FACE).resize(Math.round(size * 0.66)).toBuffer();
    await sharp(bg).composite([{ input: face, gravity: 'center' }]).png().toFile(path.join(OUT, `icon-${size}.png`));
  }
  console.log('Ikon dibuat di', OUT);
})();
