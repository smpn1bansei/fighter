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

/**
 * Siapkan sheet berformat GRID (latar putih polos, garis kotak hitam, label nomor
 * di pojok kiri atas tiap kotak). Latar diganti warna penanda magenta agar bisa
 * diproses removeChecker seperti sheet lain.
 * g = { cols: [tepi x], rows: [tepi y], inset, label: [lebar, tinggi], erase: [[x0,y0,x1,y1], ...] }
 */
function prepGrid(img, g) {
  const { data, w, h } = img;
  const BG = 1, inset = g.inset || 6, [lw, lh] = g.label || [0, 0];
  const mask = new Uint8Array(w * h).fill(BG); // mulai: semuanya latar
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  const whiteish = (i) => {
    const [r, gg, b] = px(i);
    return Math.min(r, gg, b) > 215 && Math.max(r, gg, b) - Math.min(r, gg, b) < 30;
  };
  for (let cy = 0; cy < g.rows.length - 1; cy++) {
    // rowCols: baris tertentu boleh punya pembagian kolom sendiri (kotak gabungan)
    const cols = (g.rowCols && g.rowCols[cy]) || g.cols;
    for (let cx = 0; cx < cols.length - 1; cx++) {
      const X0 = cols[cx], Y0 = g.rows[cy];
      const x0 = X0 + inset, x1 = cols[cx + 1] - inset, y0 = Y0 + inset, y1 = g.rows[cy + 1] - inset;
      const cw = x1 - x0, ch = y1 - y0;
      // area kotak: anggap isi (0) dulu
      const cell = new Uint8Array(cw * ch);
      const at = (x, y) => (y0 + y) * w + (x0 + x);
      // label nomor: piksel hitam/putih/abu di area label dianggap latar
      const isLabel = (x, y) => {
        if (x0 + x >= X0 + lw || y0 + y >= Y0 + lh) return false;
        const [r, gg, b] = px(at(x, y));
        return Math.max(r, gg, b) - Math.min(r, gg, b) < 40;
      };
      // isi banjir dari tepi kotak melalui piksel putih
      const st = [];
      const pass = (x, y) => whiteish(at(x, y)) || isLabel(x, y);
      for (let x = 0; x < cw; x++) { st.push(x, 0, x, ch - 1); }
      for (let y = 0; y < ch; y++) { st.push(0, y, cw - 1, y); }
      while (st.length) {
        const y = st.pop(), x = st.pop();
        if (x < 0 || y < 0 || x >= cw || y >= ch) continue;
        const k = y * cw + x;
        if (cell[k] || !pass(x, y)) continue;
        cell[k] = 2; // latar
        st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
      }
      // lubang putih bersih yang tertutup (celah lengan-badan) juga latar,
      // kecuali di bagian bawah kotak (sepatu putih; atur lewat holeBottom)
      const hole = new Uint8Array(cw * ch);
      for (let k = 0; k < cw * ch; k++) {
        const [r, gg, b] = px(at(k % cw, (k / cw) | 0));
        if (!cell[k] && r > 246 && gg > 246 && b > 246) hole[k] = 1;
      }
      const { labels, comps } = labelComponents(hole, cw, ch, 1);
      for (let k = 0; k < cw * ch; k++) {
        if (!hole[k]) continue;
        const c = comps[labels[k]];
        const cyc = (c.minY + c.maxY) / 2;
        if (c.area > 250 && cyc < ch * (g.holeBottom || 0.8)) cell[k] = 2;
      }
      // tepi abu-abu halus di sekitar latar ikut dibuang (2 lapis)
      for (let it = 0; it < 2; it++) {
        const grow = [];
        for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) {
          const k = y * cw + x;
          if (cell[k]) continue;
          if (!(cell[k - 1] === 2 || cell[k + 1] === 2 || cell[k - cw] === 2 || cell[k + cw] === 2)) continue;
          const [r, gg, b] = px(at(x, y));
          if (Math.min(r, gg, b) > 170 && Math.max(r, gg, b) - Math.min(r, gg, b) < 30) grow.push(k);
        }
        grow.forEach((k) => { cell[k] = 2; });
      }
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        if (cell[y * cw + x] !== 2) mask[at(x, y)] = 0;
      }
    }
  }
  // area yang sengaja dihapus (tulisan keterangan, bola yang tergambar, dll.)
  for (const [ex0, ey0, ex1, ey1] of g.erase || []) {
    for (let y = Math.max(0, ey0); y < Math.min(h, ey1); y++) {
      for (let x = Math.max(0, ex0); x < Math.min(w, ex1); x++) mask[y * w + x] = BG;
    }
  }
  const out = Buffer.from(data);
  for (let i = 0; i < w * h; i++) {
    if (mask[i]) { out[i * 3] = 255; out[i * 3 + 1] = 0; out[i * 3 + 2] = 255; }
  }
  return { data: out, w, h };
}

module.exports = { sharp, loadRGB, labelComponents, dilate, removeChecker, prepGrid };
