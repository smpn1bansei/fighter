// =====================================================================
// KONTROL: keyboard (komputer) + tombol layar sentuh (HP), multi-jari.
// =====================================================================
window.ACTIONS = ['left', 'right', 'up', 'guard', 'punch', 'kick', 'jurus', 'charge', 'ulti'];

// Pengendali dasar: dipakai pemain maupun komputer (AI).
class Controller {
  constructor() {
    this.h = {};   // tombol yang sedang ditahan
    this.buf = {}; // tombol yang baru ditekan (diingat beberapa langkah)
  }
  held(k) { return !!this.h[k]; }
  pressed(k) { return (this.buf[k] || 0) > 0; }
  consume(k) { this.buf[k] = 0; }
  press(k) { this.buf[k] = CFG.BUFFER; }
  clear() { this.h = {}; this.buf = {}; }
  tick() {
    for (const k in this.buf) if (this.buf[k] > 0) this.buf[k]--;
  }
  poll() { this.tick(); }
}

class PlayerController extends Controller {
  constructor(scene, pad) {
    super();
    this.pad = pad;
    this.prev = {};
    this.latch = {};
    this.keys = {};
    const kb = scene.input.keyboard;
    const byCode = {};
    for (const a of ACTIONS) {
      this.keys[a] = CFG.KEYS[a].map((n) => {
        byCode[Phaser.Input.Keyboard.KeyCodes[n]] = a;
        return kb.addKey(Phaser.Input.Keyboard.KeyCodes[n], true, false);
      });
    }
    // Tekanan singkat dicatat lewat event agar tidak terlewat di antara langkah logika.
    // (event milik adegan ini otomatis dilepas saat adegan berakhir)
    kb.on('keydown', (e) => {
      const a = byCode[e.keyCode];
      if (!a || e.repeat) return;
      this.latch[a] = true;
      if (this.pad) this.pad.onKeyboard();
    });
  }
  poll() {
    this.tick();
    const touch = this.pad ? this.pad.read() : {};
    const tl = this.pad ? this.pad.latch : {};
    for (const a of ACTIONS) {
      const now = this.keys[a].some((k) => k.isDown) || !!touch[a];
      if ((now && !this.prev[a]) || this.latch[a] || tl[a]) this.press(a);
      this.h[a] = now;
      this.prev[a] = now;
    }
    this.latch = {};
    if (this.pad) this.pad.latch = {};
  }
}

// ---------------------------------------------------------------------
// Tombol layar sentuh
// ---------------------------------------------------------------------
class TouchPad {
  constructor(scene, fighterColor) {
    this.scene = scene;
    this.latch = {};
    this.buttons = [];
    this.enabled = true;
    const W = CFG.W, H = CFG.H;
    this.layer = scene.add.container(0, 0).setDepth(90).setScrollFactor(0);

    // D-pad (kiri bawah): kiri/kanan = jalan, atas = lompat, bawah = tahan (blok)
    this.dpad = { x: 175, y: H - 165, r: 118 };
    this.dpadG = scene.add.graphics();
    this.layer.add(this.dpadG);
    this.dpadState = {};
    const lbl = (x, y, s, size) => {
      const t = scene.add.text(x, y, s, { fontFamily: UI.font, fontSize: size + 'px', color: '#ffffff' }).setOrigin(0.5).setAlpha(0.85);
      this.layer.add(t);
      return t;
    };
    const d = this.dpad;
    lbl(d.x - 78, d.y, '◀', 26);
    lbl(d.x + 78, d.y, '▶', 26);
    lbl(d.x, d.y - 78, '▲', 26);
    lbl(d.x, d.y + 78, '▼', 26);
    lbl(d.x + 128, d.y - 92, 'LOMPAT', 10).setAlpha(0.7);
    lbl(d.x + 124, d.y + 96, 'TAHAN', 10).setAlpha(0.7);

    // Tombol aksi (kanan bawah)
    const defs = [
      { action: 'punch', label: 'PUKUL', x: W - 228, y: H - 108, r: 64, color: 0xff5a4a },
      { action: 'kick', label: 'TENDANG', x: W - 88, y: H - 180, r: 56, color: 0x4aa8ff },
      { action: 'jurus', label: 'JURUS', x: W - 250, y: H - 262, r: 54, color: fighterColor || 0xb06cff },
      { action: 'charge', label: 'CAKRA', x: W - 380, y: H - 82, r: 44, color: 0x3fd0ff },
      { action: 'ulti', label: 'ULTI', x: W - 392, y: H - 214, r: 50, color: 0xffc83d },
    ];
    for (const b of defs) {
      b.g = scene.add.graphics();
      b.t = scene.add.text(b.x, b.y, b.label, {
        fontFamily: UI.font, fontSize: (b.label.length > 5 ? 11 : 13) + 'px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5);
      b.down = false;
      b.disabled = false;
      b.ready = false;
      this.layer.add([b.g, b.t]);
      this.buttons.push(b);
    }

    // Tombol jeda
    this.pauseBtn = { x: W / 2, y: 128, r: 30 };
    this.pauseG = scene.add.graphics();
    this.layer.add(this.pauseG);
    this.drawPause();

    scene.input.on('pointerdown', (p) => {
      this.show();
      if (!this.enabled) return;
      for (const b of this.buttons) if (this.hitBtn(b, p.x, p.y)) this.latch[b.action] = true;
      const dir = this.dpadDir(p.x, p.y);
      for (const k in dir) this.latch[k] = true;
    });

    this.visible = scene.sys.game.device.input.touch || navigator.maxTouchPoints > 0;
    this.layer.setVisible(this.visible);
    this.redraw();
  }

  hitBtn(b, x, y) {
    return Phaser.Math.Distance.Between(x, y, b.x, b.y) <= b.r * 1.18;
  }

  hitPause(x, y) {
    return this.visible && Phaser.Math.Distance.Between(x, y, this.pauseBtn.x, this.pauseBtn.y) <= this.pauseBtn.r * 1.4;
  }

  // Arah D-pad dari posisi jari (8 arah, area sentuh dibuat lebar).
  dpadDir(x, y) {
    const d = this.dpad;
    const dx = x - d.x, dy = y - d.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 22 || dist > d.r * 1.65 || x > CFG.W * 0.42) return {};
    const a = Math.atan2(-dy, dx); // 0 = kanan, +90 = atas
    const deg = (a * 180) / Math.PI;
    const out = {};
    if (deg > -60 && deg < 60) out.right = true;
    if (deg > 120 || deg < -120) out.left = true;
    if (deg > 30 && deg < 150) out.up = true;
    if (deg < -45 && deg > -135) out.guard = true;
    return out;
  }

  read() {
    const out = {};
    if (!this.enabled || !this.visible) return out;
    for (const p of this.scene.input.manager.pointers) {
      if (!p.isDown) continue;
      for (const b of this.buttons) if (this.hitBtn(b, p.x, p.y)) out[b.action] = true;
      Object.assign(out, this.dpadDir(p.x, p.y));
    }
    let changed = false;
    for (const b of this.buttons) {
      const dn = !!out[b.action];
      if (dn !== b.down) { b.down = dn; changed = true; }
    }
    for (const k of ['left', 'right', 'up', 'guard']) {
      if (!!out[k] !== !!this.dpadState[k]) { this.dpadState[k] = !!out[k]; changed = true; }
    }
    if (changed) this.redraw();
    return out;
  }

  // Tampilkan tombol JURUS/ULTI redup atau menyala sesuai cakra.
  setAvailability(chakra, jurusCost, ultiCost) {
    const j = this.buttons.find((b) => b.action === 'jurus');
    const u = this.buttons.find((b) => b.action === 'ulti');
    const jd = chakra < jurusCost, ur = chakra >= ultiCost;
    if (j.disabled !== jd || u.ready !== ur || u.disabled !== !ur) {
      j.disabled = jd;
      u.ready = ur;
      u.disabled = !ur;
      this.redraw();
    }
  }

  pulse(time) {
    const u = this.buttons.find((b) => b.action === 'ulti');
    if (u.ready && this.visible) u.g.setAlpha(0.75 + Math.sin(time / 120) * 0.25);
    else u.g.setAlpha(1);
  }

  redraw() {
    const g = this.dpadG, d = this.dpad;
    g.clear();
    g.fillStyle(0x000000, 0.28).fillCircle(d.x, d.y, d.r);
    g.lineStyle(3, 0xffffff, 0.35).strokeCircle(d.x, d.y, d.r);
    const arms = [['left', -78, 0], ['right', 78, 0], ['up', 0, -78], ['guard', 0, 78]];
    for (const [k, ox, oy] of arms) {
      const on = this.dpadState[k];
      g.fillStyle(on ? 0xffc83d : 0xffffff, on ? 0.7 : 0.14).fillCircle(d.x + ox, d.y + oy, 36);
    }
    g.fillStyle(0xffffff, 0.12).fillCircle(d.x, d.y, 22);

    for (const b of this.buttons) {
      const bg = b.g;
      bg.clear();
      const a = b.disabled ? 0.35 : 1;
      bg.fillStyle(b.down ? b.color : 0x000000, (b.down ? 0.75 : 0.35) * a).fillCircle(b.x, b.y, b.r);
      bg.lineStyle(4, b.color, 0.9 * a).strokeCircle(b.x, b.y, b.r);
      if (b.ready) bg.lineStyle(3, 0xffffff, 0.9).strokeCircle(b.x, b.y, b.r + 7);
      b.t.setAlpha(b.disabled ? 0.45 : 1);
      b.t.setScale(b.down ? 0.92 : 1);
    }
  }

  drawPause() {
    const g = this.pauseG, p = this.pauseBtn;
    g.clear();
    g.fillStyle(0x000000, 0.4).fillCircle(p.x, p.y, p.r);
    g.lineStyle(3, 0xffffff, 0.6).strokeCircle(p.x, p.y, p.r);
    g.fillStyle(0xffffff, 0.9).fillRect(p.x - 10, p.y - 11, 7, 22).fillRect(p.x + 3, p.y - 11, 7, 22);
  }

  show() {
    if (this.visible) return;
    this.visible = true;
    this.layer.setVisible(true);
  }

  // Tombol layar disembunyikan saat pemain memakai keyboard.
  onKeyboard() {
    if (!this.visible) return;
    this.visible = false;
    this.layer.setVisible(false);
  }

  setEnabled(on) {
    this.enabled = on;
    this.layer.setAlpha(on ? 1 : 0);
    if (!on) {
      this.latch = {};
      for (const b of this.buttons) b.down = false;
      this.dpadState = {};
      this.redraw();
    }
  }
}
