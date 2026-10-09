// Fungsi bantu pemrosesan gambar sprite sheet (dipakai oleh extract-sprites.js).
const sharp = require('sharp');

async function loadRGB(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

// Jarak warna p ke ruas garis warna a..b (diperpanjang `ext` di kedua ujung).
function segDist(r, g, bl, a, b, ext) {
  const d0 = b[0] - a[0], d1 = b[1] - a[1], d2 = b[2] - a[2];
  const len2 = d0 * d0 + d1 * d1 + d2 * d2;
  let t = ((r - a[0]) * d0 + (g - a[1]) * d1 + (bl - a[2]) * d2) / len2;
  const e = ext / Math.sqrt(len2);
  t = Math.max(-e, Math.min(1 + e, t));
  return Math.hypot(r - (a[0] + t * d0), g - (a[1] + t * d1), bl - (a[2] + t * d2));
}

// Label komponen terhubung (4 arah) untuk piksel mask==value.
function labelComponents(mask, w, h, value = 1) {
  const labels = new Int32Array(w * h).fill(-1);
  const comps = [];
  const stack = new Int32Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (mask[start] !== value || labels[start] !== -1) continue;
    const id = comps.length;
    let sp = 0, area = 0, minX = w, minY = h, maxX = 0, maxY = 0, touchesBorder = false;
    stack[sp++] = start;
    labels[start] = id;
    while (sp > 0) {
      const i = stack[--sp];
      const x = i % w, y = (i / w) | 0;
      area++;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touchesBorder = true;
      if (x > 0) { const n = i - 1; if (mask[n] === value && labels[n] === -1) { labels[n] = id; stack[sp++] = n; } }
      if (x < w - 1) { const n = i + 1; if (mask[n] === value && labels[n] === -1) { labels[n] = id; stack[sp++] = n; } }
      if (y > 0) { const n = i - w; if (mask[n] === value && labels[n] === -1) { labels[n] = id; stack[sp++] = n; } }
      if (y < h - 1) { const n = i + w; if (mask[n] === value && labels[n] === -1) { labels[n] = id; stack[sp++] = n; } }
    }
    comps.push({ id, area, minX, minY, maxX, maxY, touchesBorder });
  }
  return { labels, comps };
}

function dilate(mask, w, h, r) {
  let cur = mask;
  for (let k = 0; k < r; k++) {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (cur[i] || (x > 0 && cur[i - 1]) || (x < w - 1 && cur[i + 1]) || (y > 0 && cur[i - w]) || (y < h - 1 && cur[i + w])) out[i] = 1;
      }
    }
    cur = out;
  }
  return cur;
}

/**
 * Pisahkan karakter dari latar papan catur palsu.
 * Mengembalikan mask foreground (1 = karakter).
 */
function removeChecker(img, opt) {
  const { data, w, h } = img;
  const [dark, light] = opt.colors;
  const [s0, s1] = opt.segColors || opt.colors; // rentang warna yang dianggap latar
  const cand = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < w * h; i++, p += 3) {
    if (segDist(data[p], data[p + 1], data[p + 2], s0, s1, 12) <= opt.tol) cand[i] = 1;
  }
  const { labels, comps } = labelComponents(cand, w, h, 1);
  const st = comps.map(() => ({ n: 0, nd: 0, nl: 0 }));
  for (let i = 0, p = 0; i < w * h; i++, p += 3) {
    const l = labels[i];
    if (l < 0) continue;
    const s = st[l];
    s.n++;
    const r = data[p], g = data[p + 1], b = data[p + 2];
    if (Math.abs(r - dark[0]) < 10 && Math.abs(g - dark[1]) < 10 && Math.abs(b - dark[2]) < 10) s.nd++;
    else if (Math.abs(r - light[0]) < 10 && Math.abs(g - light[1]) < 10 && Math.abs(b - light[2]) < 10) s.nl++;
  }
  const isBg = comps.map((c, k) => {
    if (c.touchesBorder || c.area > 15000) return true;
    const s = st[k];
    const fd = s.nd / s.n, fl = s.nl / s.n;
    // Dua warna bergantian = pasti papan catur.
    if (fd >= 0.15 && fl >= 0.15 && c.area >= 40) return true;
    // Satu warna: anggap latar hanya bila bentuknya "gumpal" (bukan garis tipis seperti sabuk).
    const bw = c.maxX - c.minX + 1, bh = c.maxY - c.minY + 1;
    if ((fd >= 0.6 || fl >= 0.6) && Math.min(bw, bh) >= 20 && c.area / (bw * bh) >= 0.3) return true;
    return false;
  });
  const fg = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) fg[i] = (cand[i] && isBg[labels[i]]) ? 0 : 1;

  if (opt.removeLines) removeThinLines(fg, w, h);
  return fg;
}

// Hapus garis bingkai lurus yang tipis (khusus sheet yang punya kotak pembatas).
function removeThinLines(fg, w, h) {
  const hRun = new Uint16Array(w * h), vRun = new Uint16Array(w * h);
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      if (!fg[y * w + x]) { x++; continue; }
      let e = x;
      while (e < w && fg[y * w + e]) e++;
      for (let k = x; k < e; k++) hRun[y * w + k] = Math.min(65535, e - x);
      x = e;
    }
  }
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h) {
      if (!fg[y * w + x]) { y++; continue; }
      let e = y;
      while (e < h && fg[e * w + x]) e++;
      for (let k = y; k < e; k++) vRun[k * w + x] = Math.min(65535, e - y);
      y = e;
    }
  }
  for (let i = 0; i < w * h; i++) {
    if (!fg[i]) continue;
    if ((vRun[i] <= 5 && hRun[i] >= 40) || (hRun[i] <= 5 && vRun[i] >= 40)) fg[i] = 0;
  }
  // Sisa titik-titik kecil yang terisolasi.
  const { labels, comps } = labelComponents(fg, w, h, 1);
  for (let i = 0; i < w * h; i++) if (fg[i] && comps[labels[i]].area < 30) fg[i] = 0;
}

module.exports = { sharp, loadRGB, labelComponents, dilate, removeChecker };
