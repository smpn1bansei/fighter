// Ekstrak pose karakter dari sprite sheet (JPG dengan latar papan catur palsu)
// menjadi atlas PNG transparan + data JSON yang dipakai game.
//
// Pemakaian:   cd tools && npm install && node extract-sprites.js [id-karakter]
// Hasil:       ../assets/sprites/<id>.webp, <id>.json, <id>-portrait.webp, <id>-face.webp
//
// Untuk menambah karakter baru: tambahkan entri di SHEETS di bawah, isi `colors`
// (warna gelap & terang kotak-kotak latar), dan beri nama tiap pose sesuai urutan
// baca (kiri->kanan, atas->bawah).
const fs = require('fs');
const path = require('path');
const { sharp, loadRGB, labelComponents, dilate, removeChecker } = require('./lib');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'sprites');
const DEBUG_DIR = process.env.DEBUG_DIR || null;
const STAND_HEIGHT = 340;     // tinggi pose berdiri di atlas (px)
const PORTRAIT_HEIGHT = 560;  // tinggi gambar potret untuk layar pilih karakter
const WEBP = { quality: 90, alphaQuality: 100, effort: 6 };

const SHEETS = {
  nur: {
    file: 'nur-hokage.jpg',
    colors: [[119, 119, 119], [172, 172, 172]],
    tol: 12,
    frames: ['intro', 'idle', 'palm', 'hurt', 'punch', 'palm2', 'knee', 'kick', 'charge', 'jump', 'smash', 'win'],
    stand: 'intro',
    portrait: 'intro',
    matte: { charge: 40, palm: 30, palm2: 30, kick: 30, smash: 20 },
    anchorFix: {},
  },
  sit: {
    file: 'sit hokage.jpg',
    colors: [[106, 106, 106], [155, 155, 155]],
    tol: 12,
    frames: ['sign', 'firestance', 'fireball', 'firepalm', 'stand', 'kneel', 'jumpup', 'flykick', 'crouch', 'seal',
      'fists', 'boom', 'firering', 'summon', 'scroll', 'fist'],
    stand: 'stand',
    portrait: 'scroll',
    matte: { seal: 70, jumpup: 40, firestance: 40, fireball: 30, firepalm: 30, boom: 30, firering: 40, summon: 30, scroll: 30, sign: 20, flykick: 30 },
    anchorFix: { kneel: 55, crouch: 50 },
  },
  ranti: {
    file: 'ranti.jpg',
    colors: [[125, 133, 144], [158, 167, 177]],
    tol: 12,
    removeLines: true,
    frames: ['sign', 'bluefist', 'bigpunch', 'punch', 'sign2', 'stance', 'kick', 'groundpunch', 'guard', 'back',
      'byakugo', 'heal', 'jump', 'jump2', 'kneel', 'stand'],
    stand: 'stand',
    portrait: 'sign',
    matte: { heal: 70, guard: 45, bluefist: 45, byakugo: 30, bigpunch: 30, kick: 30 },
    anchorFix: {},
  },
  marthadin: {
    file: 'marthadin.jpg',
    colors: [[103, 103, 103], [149, 149, 149]],
    // sheet ini punya garis grid abu-abu terang (~188) di antara sel
    segColors: [[103, 103, 103], [190, 190, 190]],
    tol: 12,
    frames: ['ballet', 'stance', 'palm', 'spin', 'highkick', 'tornado', 'guard', 'hurt', 'jete', 'dive', 'cyclone', 'bow'],
    stand: 'bow',
    portrait: 'ballet',
    matte: { palm: 30, spin: 40, tornado: 50, guard: 50, dive: 30, cyclone: 60 },
    anchorFix: {},
  },
  fatim: {
    file: 'fatim.jpg',
    colors: [[132, 132, 132], [193, 193, 193]],
    tol: 12,
    frames: ['ready', 'dash', 'claw', 'stab', 'stance', 'kick', 'guard', 'recoil', 'jump', 'divekick', 'groundstrike', 'calm'],
    stand: 'calm',
    portrait: 'ready',
    matte: { dash: 20, claw: 40, stab: 30, kick: 40, guard: 30, divekick: 30, groundstrike: 30 },
    anchorFix: {},
  },
  tio: {
    file: 'tio.jpg',
    colors: [[141, 141, 141], [193, 193, 193]],
    tol: 12,
    frames: ['stance', 'dash', 'punch', 'guard', 'jump', 'salto', 'fall', 'crouch', 'flykick', 'sweep', 'stomp', 'salute'],
    stand: 'salute',
    portrait: 'stance',
    matte: { dash: 20, punch: 30, guard: 30, salto: 40, flykick: 30, sweep: 40, stomp: 30 },
    anchorFix: {},
  },
};

function findFrames(fg, w, h, count) {
  const grown = dilate(fg, w, h, 6);
  const { labels, comps } = labelComponents(grown, w, h, 1);
  let blobs = comps.filter(c => c.area > 1500).map(c => ({ ...c, ids: [c.id], cy: (c.minY + c.maxY) / 2 }));
  const big = blobs.filter(b => b.area >= 30000);
  const small = blobs.filter(b => b.area < 30000);
  // Gabungkan potongan kecil (mis. efek api yang terpisah) ke pose terdekat.
  for (const s of small) {
    let best = null, bestD = Infinity;
    for (const b of big) {
      const dx = Math.max(0, b.minX - s.maxX, s.minX - b.maxX);
      const dy = Math.max(0, b.minY - s.maxY, s.minY - b.maxY);
      // Bila sama-sama bersinggungan, pilih yang tumpang-tindihnya paling luas.
      const ox = Math.max(0, Math.min(b.maxX, s.maxX) - Math.max(b.minX, s.minX));
      const oy = Math.max(0, Math.min(b.maxY, s.maxY) - Math.max(b.minY, s.minY));
      const d = dx + dy - (ox * oy) / 1e6;
      if (d < bestD) { bestD = d; best = b; }
    }
    if (best && bestD < 60) {
      best.ids.push(s.id);
      best.minX = Math.min(best.minX, s.minX); best.maxX = Math.max(best.maxX, s.maxX);
      best.minY = Math.min(best.minY, s.minY); best.maxY = Math.max(best.maxY, s.maxY);
    } else {
      console.warn(`  (abaikan potongan kecil di ${s.minX},${s.minY} luas ${s.area})`);
    }
  }
  // Urutkan per baris lalu kiri->kanan.
  big.sort((a, b) => a.cy - b.cy);
  const rows = [];
  for (const b of big) {
    const row = rows.find(r => Math.abs(r.cy - b.cy) < 220);
    if (row) row.items.push(b); else rows.push({ cy: b.cy, items: [b] });
  }
  const ordered = [];
  for (const r of rows) ordered.push(...r.items.sort((a, b) => a.minX - b.minX));
  if (ordered.length !== count) {
    throw new Error(`Jumlah pose terdeteksi ${ordered.length}, padahal nama pose ada ${count}`);
  }
  return { labels, frames: ordered };
}

// Efek cahaya semi-transparan yang "tercetak" di atas kotak-kotak: buang komponen abu-abunya
// (color-to-alpha) untuk piksel terang yang tersambung ke latar tanpa melewati garis tepi gelap.
function matteGlow(rgba, bw, bh, colors, maxDist) {
  const [dk, lt] = colors;
  const dist = new Int32Array(bw * bh).fill(-1);
  const queue = new Int32Array(bw * bh);
  let qh = 0, qt = 0;
  for (let i = 0; i < bw * bh; i++) if (!rgba[i * 4 + 3]) { dist[i] = 0; queue[qt++] = i; }
  const lum = (o) => 0.3 * rgba[o] + 0.59 * rgba[o + 1] + 0.11 * rgba[o + 2];
  while (qh < qt) {
    const i = queue[qh++];
    const x = i % bw, y = (i / bw) | 0;
    if (dist[i] >= maxDist) continue;
    for (const n of [x > 0 ? i - 1 : -1, x < bw - 1 ? i + 1 : -1, y > 0 ? i - bw : -1, y < bh - 1 ? i + bw : -1]) {
      if (n < 0 || dist[n] !== -1) continue;
      if (lum(n * 4) < 75) continue; // garis tepi karakter menahan penyebaran
      dist[n] = dist[i] + 1;
      queue[qt++] = n;
    }
  }
  const d0 = lt[0] - dk[0], d1 = lt[1] - dk[1], d2 = lt[2] - dk[2];
  const len2 = d0 * d0 + d1 * d1 + d2 * d2, ext = 12 / Math.sqrt(len2);
  for (let i = 0; i < bw * bh; i++) {
    if (dist[i] <= 0) continue;
    const o = i * 4, r = rgba[o], g = rgba[o + 1], b = rgba[o + 2];
    let t = ((r - dk[0]) * d0 + (g - dk[1]) * d1 + (b - dk[2]) * d2) / len2;
    t = Math.max(-ext, Math.min(1 + ext, t));
    const B = [dk[0] + t * d0, dk[1] + t * d1, dk[2] + t * d2];
    const sd = Math.hypot(r - B[0], g - B[1], b - B[2]);
    let a = Math.max(0, Math.min(1, (sd - 6) / 34));
    a = a * a * (3 - 2 * a);
    if (a >= 0.999) continue;
    if (a < 0.05) { rgba[o + 3] = 0; continue; }
    rgba[o] = Math.max(0, Math.min(255, Math.round(B[0] + (r - B[0]) / a)));
    rgba[o + 1] = Math.max(0, Math.min(255, Math.round(B[1] + (g - B[1]) / a)));
    rgba[o + 2] = Math.max(0, Math.min(255, Math.round(B[2] + (b - B[2]) / a)));
    rgba[o + 3] = Math.round(a * 255);
  }
}

function cropFrame(img, fg, labels, blob, colors, matte) {
  const { w, data } = img;
  const ids = new Set(blob.ids);
  const bw = blob.maxX - blob.minX + 1, bh = blob.maxY - blob.minY + 1;
  const rgba = Buffer.alloc(bw * bh * 4);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const i = (blob.minY + y) * w + (blob.minX + x);
      if (!fg[i] || !ids.has(labels[i])) continue;
      const o = (y * bw + x) * 4;
      rgba[o] = data[i * 3]; rgba[o + 1] = data[i * 3 + 1]; rgba[o + 2] = data[i * 3 + 2]; rgba[o + 3] = 255;
    }
  }
  if (matte) matteGlow(rgba, bw, bh, colors, matte);
  // Bersihkan "halo" di tepi: piksel tepi yang warnanya masih mirip latar.
  const [dk, lt] = colors;
  for (let pass = 0; pass < 2; pass++) {
    const kill = [];
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const o = (y * bw + x) * 4;
        if (rgba[o + 3] !== 255) continue;
        const edge = x === 0 || y === 0 || x === bw - 1 || y === bh - 1 ||
          !rgba[o - 1] || !rgba[o + 7] || !rgba[o - bw * 4 + 3] || !rgba[o + bw * 4 + 3];
        if (!edge) continue;
        const r = rgba[o], g = rgba[o + 1], b = rgba[o + 2];
        const near = (c) => Math.abs(r - c[0]) + Math.abs(g - c[1]) + Math.abs(b - c[2]);
        const mid = [(dk[0] + lt[0]) / 2, (dk[1] + lt[1]) / 2, (dk[2] + lt[2]) / 2];
        if (Math.min(near(dk), near(lt), near(mid)) < 45) kill.push(o);
      }
    }
    for (const o of kill) rgba[o + 3] = 0;
  }
  // Haluskan tepi: piksel tepi dibuat semi-transparan.
  const alpha = Buffer.alloc(bw * bh);
  for (let i = 0; i < bw * bh; i++) alpha[i] = rgba[i * 4 + 3];
  for (let y = 1; y < bh - 1; y++) {
    for (let x = 1; x < bw - 1; x++) {
      const i = y * bw + x;
      if (!alpha[i]) continue;
      const n = (alpha[i - 1] ? 1 : 0) + (alpha[i + 1] ? 1 : 0) + (alpha[i - bw] ? 1 : 0) + (alpha[i + bw] ? 1 : 0);
      if (n <= 2) rgba[i * 4 + 3] = 170;
    }
  }
  return { rgba, w: bw, h: bh };
}

function tightBox(rgba, w, h) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (rgba[(y * w + x) * 4 + 3] > 40) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// Perkiraan titik tumpu horizontal: rata-rata x piksel di area pinggang/pinggul.
function autoAnchorX(rgba, w, h) {
  let sx = 0, n = 0;
  for (let y = Math.floor(h * 0.42); y < Math.floor(h * 0.68); y++) {
    for (let x = 0; x < w; x++) if (rgba[(y * w + x) * 4 + 3] > 128) { sx += x; n++; }
  }
  return n ? sx / n : w / 2;
}

async function scaled(crop, scale) {
  const t = tightBox(crop.rgba, crop.w, crop.h);
  const tw = Math.max(1, Math.round(t.w * scale)), th = Math.max(1, Math.round(t.h * scale));
  const { data, info } = await sharp(crop.rgba, { raw: { width: crop.w, height: crop.h, channels: 4 } })
    .extract({ left: t.minX, top: t.minY, width: t.w, height: t.h })
    .resize(tw, th, { kernel: 'lanczos3' })
    .raw().toBuffer({ resolveWithObject: true });
  return { rgba: data, w: info.width, h: info.height };
}

function pack(frames) {
  const PAD = 2;
  const sorted = [...frames].sort((a, b) => b.h - a.h);
  const maxW = 2048;
  let x = PAD, y = PAD, rowH = 0, width = 0;
  for (const f of sorted) {
    if (x + f.w + PAD > maxW) { x = PAD; y += rowH + PAD; rowH = 0; }
    f.x = x; f.y = y;
    x += f.w + PAD; rowH = Math.max(rowH, f.h);
    width = Math.max(width, x);
  }
  return { w: width, h: y + rowH + PAD };
}

async function processSheet(id) {
  const cfg = SHEETS[id];
  console.log(`== ${id} (${cfg.file})`);
  const img = await loadRGB(path.join(__dirname, '..', 'asset-custom', cfg.file));
  const fg = removeChecker(img, { colors: cfg.colors, segColors: cfg.segColors, tol: cfg.tol, removeLines: cfg.removeLines });
  const { labels, frames } = findFrames(fg, img.w, img.h, cfg.frames.length);

  const crops = {};
  frames.forEach((b, k) => {
    const name = cfg.frames[k];
    crops[name] = cropFrame(img, fg, labels, b, cfg.colors, (cfg.matte || {})[name]);
  });

  const standBox = tightBox(crops[cfg.stand].rgba, crops[cfg.stand].w, crops[cfg.stand].h);
  const scale = STAND_HEIGHT / standBox.h;
  console.log(`  skala ${scale.toFixed(3)} (tinggi berdiri asli ${standBox.h}px)`);

  const out = [];
  for (const name of cfg.frames) {
    const s = await scaled(crops[name], scale);
    const ax = autoAnchorX(s.rgba, s.w, s.h) + (cfg.anchorFix[name] || 0);
    out.push({ name, ...s, ax: Math.round(ax) });
  }
  const size = pack(out);
  const atlas = Buffer.alloc(size.w * size.h * 4);
  for (const f of out) {
    for (let y = 0; y < f.h; y++) {
      f.rgba.copy(atlas, ((f.y + y) * size.w + f.x) * 4, y * f.w * 4, (y + 1) * f.w * 4);
    }
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await sharp(atlas, { raw: { width: size.w, height: size.h, channels: 4 } })
    .webp(WEBP).toFile(path.join(OUT_DIR, `${id}.webp`));

  const json = { frames: {}, meta: { image: `${id}.webp`, size, standHeight: STAND_HEIGHT } };
  for (const f of out) {
    json.frames[f.name] = { x: f.x, y: f.y, w: f.w, h: f.h, ax: +(f.ax / f.w).toFixed(4), ay: 1 };
  }
  fs.writeFileSync(path.join(OUT_DIR, `${id}.json`), JSON.stringify(json, null, 1));

  // Potret besar + wajah untuk layar pilih karakter.
  const p = await scaled(crops[cfg.portrait], PORTRAIT_HEIGHT / standBox.h);
  await sharp(p.rgba, { raw: { width: p.w, height: p.h, channels: 4 } }).webp(WEBP)
    .toFile(path.join(OUT_DIR, `${id}-portrait.webp`));
  const headTop = tightBox(p.rgba, p.w, p.h).minY;
  let sx = 0, n = 0;
  for (let y = headTop; y < headTop + p.h * 0.1; y++) for (let x = 0; x < p.w; x++) {
    if (p.rgba[(y * p.w + x) * 4 + 3] > 128) { sx += x; n++; }
  }
  const cx = n ? sx / n : p.w / 2;
  const size2 = Math.round(p.h * 0.3);
  const left = Math.max(0, Math.min(p.w - size2, Math.round(cx - size2 / 2)));
  await sharp(p.rgba, { raw: { width: p.w, height: p.h, channels: 4 } })
    .extract({ left, top: Math.max(0, headTop - 6), width: Math.min(size2, p.w), height: size2 })
    .webp(WEBP).toFile(path.join(OUT_DIR, `${id}-face.webp`));

  if (DEBUG_DIR) await debugSheet(id, out);
  console.log(`  ${out.length} pose -> atlas ${size.w}x${size.h}`);
}

// Lembar kontrol: setiap pose di atas latar magenta + garis titik tumpu.
async function debugSheet(id, frames) {
  const cellW = 520, cellH = 420, cols = 4;
  const rows = Math.ceil(frames.length / cols);
  const W = cellW * cols, H = cellH * rows;
  const buf = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) { buf[i * 3] = 60; buf[i * 3 + 1] = 160; buf[i * 3 + 2] = 90; }
  frames.forEach((f, k) => {
    const ox = (k % cols) * cellW + cellW / 2 - f.ax, oy = Math.floor(k / cols) * cellH + 20 + (cellH - 40 - f.h);
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const X = Math.round(ox + x), Y = Math.round(oy + y);
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const a = f.rgba[(y * f.w + x) * 4 + 3] / 255, o = (Y * W + X) * 3;
      for (let c = 0; c < 3; c++) buf[o + c] = Math.round(buf[o + c] * (1 - a) + f.rgba[(y * f.w + x) * 4 + c] * a);
    }
    const cx = (k % cols) * cellW + cellW / 2;
    for (let y = Math.floor(k / cols) * cellH; y < Math.floor(k / cols + 1) * cellH; y += 2) {
      const o = (y * W + cx) * 3; buf[o] = 255; buf[o + 1] = 255; buf[o + 2] = 0;
    }
  });
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(DEBUG_DIR, `debug_${id}.png`));
}

(async () => {
  const only = process.argv[2];
  for (const id of Object.keys(SHEETS)) {
    if (only && only !== id) continue;
    await processSheet(id);
  }
})().catch(e => { console.error(e); process.exit(1); });
