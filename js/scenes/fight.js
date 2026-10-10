// =====================================================================
// ARENA PERTARUNGAN
// =====================================================================
class FightScene extends Phaser.Scene {
  constructor() { super('Fight'); }

  init(data) {
    this.match = data;
    // Phaser memakai ulang objek adegan saat dimulai lagi: semua status lama harus direset
    this.leaving = false;
    this.paused = false;
    this.comboText = null;
    this.announceText = null;
    this.pausePanel = null;
    this.pauseMenu = null;
    this.resultMenu = null;
  }

  create() {
    const W = CFG.W, H = CFG.H;
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Latar sekolah: rata bawah, menutupi seluruh layar
    // (sedikit diperbesar & diturunkan agar tepi hitam tidak terlihat saat layar bergetar)
    const bottom = H + 14;
    const bg = this.add.image(W / 2, bottom, 'bg').setOrigin(0.5, 1).setDepth(0);
    const s = Math.max(W / CFG.BG.w, H / CFG.BG.h) * 1.04;
    bg.setScale(s);
    const top = bottom - CFG.BG.h * s, left = W / 2 - (CFG.BG.w * s) / 2;
    this.groundY = Math.round(top + CFG.BG.ground * s);
    const bn = CFG.BG.banner;
    const banner = this.add.text(left + bn.x * s, top + bn.y * s, CFG.BANNER_TEXT, {
      fontFamily: UI.font, fontSize: '14px', color: '#ffd75a', stroke: '#14205a', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1);
    if (banner.width > bn.w * s * 0.92) banner.setScale((bn.w * s * 0.92) / banner.width);

    this.dim = this.add.rectangle(0, 0, W, H, 0x05030f).setOrigin(0).setDepth(15).setAlpha(0);

    this.fx = new FxSystem(this);
    this.actors = [];

    const d1 = getChar(this.match.p1), d2 = getChar(this.match.cpu);
    const diff = CFG.DIFFICULTY[this.match.diff];
    this.touch = new TouchPad(this, d1.color);
    const pc = new PlayerController(this, this.touch);
    const ai = new AIController(this, this.match.diff);
    this.p1 = new Fighter(this, d1, 0, W * 0.3, pc, {});
    this.p2 = new Fighter(this, d2, 1, W * 0.7, ai, { cpu: true, dmgMult: diff.dmg, tint: d1.id === d2.id ? 0xc9b6ff : null });
    ai.bind(this.p2);

    this.wins = [0, 0];
    this.round = 1;
    this.maxCombo = 0;
    this.acc = 0;
    this.timeScale = 1;
    this.hitstop = 0;
    this.freeze = false;
    this.paused = false;
    this.buildHud();

    this.events.on('nochakra', (f) => {
      if (f !== this.p1 || this.noChakraCD > 0) return;
      this.noChakraCD = 40;
      Sound.play('locked');
      this.fx.popup(f.x, f.y - 320, 'CAKRA KURANG!', '#9fb2d8', 26);
      this.chakraWarn = 30;
    });
    this.noChakraCD = 0;
    this.chakraWarn = 0;

    // Jeda: tombol ❚❚, Esc atau P. Juga otomatis saat aplikasi ditinggalkan.
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.on('pointerdown', (p) => {
      if (!this.paused && this.touch.hitPause(p.x, p.y)) this.togglePause();
    });
    const autoPause = () => { if (!this.paused && this.phase !== 'over') this.togglePause(); };
    this.game.events.on('hidden', autoPause);
    this.events.once('shutdown', () => this.game.events.off('hidden', autoPause));

    Sound.music('fight');
    this.startRound(true);
  }

  // ------------------------------------------------------------------
  // Alur ronde
  // ------------------------------------------------------------------
  startRound(first) {
    const W = CFG.W;
    this.actors.forEach((a) => a.dispose());
    this.actors = [];
    this.p1.reset(W * 0.3);
    this.p2.reset(W * 0.7);
    this.p1.ctrl.clear();
    this.p2.ctrl.clear();
    this.timer = CFG.ROUND_TIME;
    this.timerFrames = 0;
    this.hitstop = 0;
    this.timeScale = 1;
    this.phase = 'intro';
    this.inputLocked = true;
    this.dim.setAlpha(0);
    this.hpTrail = [CFG.MAX_HP, CFG.MAX_HP];

    if (first) {
      this.p1.setState('intro');
      this.p2.setState('intro');
      [this.p1, this.p2].forEach((f, i) => {
        const t = UI.text(this, f.x, f.y - 330, f.def.quotes.intro, 11, '#ffffff', { wordWrap: { width: 300 } })
          .setDepth(70).setAlpha(0);
        this.tweens.add({ targets: t, alpha: 1, delay: 200 + i * 500, duration: 200, hold: 900, yoyo: true, onComplete: () => t.destroy() });
      });
    }
    const final = this.wins[0] === CFG.ROUNDS_TO_WIN - 1 && this.wins[1] === CFG.ROUNDS_TO_WIN - 1;
    const delay = first ? 1700 : 500;
    this.time.delayedCall(delay, () => {
      Sound.play('round');
      this.announce(final ? 'RONDE FINAL' : 'RONDE ' + this.round, '#ffffff', 96, 1000);
    });
    this.time.delayedCall(delay + 1300, () => {
      Sound.play('fight');
      this.announce('MULAI!', '#ffc83d', 130, 600);
      this.p1.setState('idle');
      this.p2.setState('idle');
      this.phase = 'fight';
      this.inputLocked = false;
    });
  }

  onKO(vic, att) {
    if (this.phase !== 'fight') return;
    this.phase = 'ko';
    this.inputLocked = true;
    Sound.play('ko');
    this.flash(300, 255, 255, 255);
    this.timeScale = 0.3;
    this.time.delayedCall(900, () => { this.timeScale = 1; });
    this.announce('K.O.!', '#ff4d4d', 170, 1400);
    this.time.delayedCall(2600, () => this.endRound(att.side));
  }

  timeUp() {
    this.phase = 'timeup';
    this.inputLocked = true;
    Sound.play('round');
    this.announce('WAKTU HABIS!', '#ffc83d', 90, 1300);
    const w = this.p1.hp > this.p2.hp ? 0 : this.p2.hp > this.p1.hp ? 1 : -1;
    this.time.delayedCall(1900, () => this.endRound(w));
  }

  endRound(w) {
    this.phase = 'roundEnd';
    this.timeScale = 1;
    this.dim.setAlpha(0);
    if (w >= 0) this.wins[w]++;
    const winner = w === 0 ? this.p1 : w === 1 ? this.p2 : null;
    if (winner) {
      winner.cancelJutsu();
      winner.vx = 0;
      if (!winner.onGround) { winner.y = winner.ground; winner.onGround = true; }
      winner.setState('win');
      this.announce(winner.def.name + '\nMENANG!', UI.hex(winner.def.color), 72, 1600);
    } else {
      this.announce('SERI!', '#ffffff', 110, 1400);
    }
    this.time.delayedCall(2300, () => {
      if (w >= 0 && this.wins[w] >= CFG.ROUNDS_TO_WIN) this.matchEnd(w);
      else {
        if (w >= 0) this.round++;
        this.startRound(false);
      }
    });
  }

  // ------------------------------------------------------------------
  // Loop utama: logika tetap 60 langkah/detik apa pun kecepatan layar HP
  // ------------------------------------------------------------------
  update(time, delta) {
    if (!this.paused) {
      this.acc += Math.min(delta, 100) * this.timeScale;
      let n = 0;
      while (this.acc >= CFG.STEP_MS && n < 6) {
        this.acc -= CFG.STEP_MS;
        this.logic();
        n++;
      }
    }
    this.p1.render(time);
    this.p2.render(time);
    this.updateHud(time);
    this.touch.pulse(time);
  }

  logic() {
    if (this.noChakraCD > 0) this.noChakraCD--;
    if (this.chakraWarn > 0) this.chakraWarn--;
    if (this.freeze) return;
    if (this.hitstop > 0) { this.hitstop--; return; }
    this.p1.ctrl.poll();
    this.p2.ctrl.poll();
    this.p1.step();
    this.p2.step();
    this.separate();
    this.actors = this.actors.filter((a) => {
      if (a.dead) return false;
      a.t++;
      if (!a.step()) { a.dead = true; return false; }
      return true;
    });
    if (this.phase === 'fight') {
      if (++this.timerFrames >= 60) {
        this.timerFrames = 0;
        this.timer--;
        if (this.timer <= 0) this.timeUp();
      }
    }
    this.touch.setAvailability(this.p1.chakra, this.p1.def.jurus.cost, this.p1.def.ulti.cost);
  }

  // Petarung tidak boleh saling tembus saat berdiri berdekatan.
  separate() {
    const a = this.p1, b = this.p2;
    const skip = { down: 1, launched: 1, getup: 1 };
    if (skip[a.state] || skip[b.state] || a.grabbing || b.grabbing) return;
    if (Math.abs(a.y - b.y) > 160) return;
    const dx = b.x - a.x;
    if (Math.abs(dx) >= CFG.PUSH_W) return;
    const dir = dx === 0 ? (a.x < CFG.W / 2 ? 1 : -1) : Math.sign(dx);
    const o = (CFG.PUSH_W - Math.abs(dx)) / 2;
    a.x -= dir * o;
    b.x += dir * o;
    const lo = CFG.WALL, hi = CFG.W - CFG.WALL;
    if (a.x < lo || a.x > hi) { a.x = Phaser.Math.Clamp(a.x, lo, hi); b.x = a.x + dir * CFG.PUSH_W; }
    if (b.x < lo || b.x > hi) { b.x = Phaser.Math.Clamp(b.x, lo, hi); a.x = b.x - dir * CFG.PUSH_W; }
  }

  // ------------------------------------------------------------------
  // Serangan
  // ------------------------------------------------------------------
  checkMoveHit(att, m) {
    const hb = att.opp.hurtbox();
    if (!hb) return;
    const ab = att.boxRect(m.box);
    if (!rectsOverlap(ab, hb)) return;
    att.hasHit = true;
    const ix = (Math.max(ab.x, hb.x) + Math.min(ab.x + ab.w, hb.x + hb.w)) / 2;
    const iy = (Math.max(ab.y, hb.y) + Math.min(ab.y + ab.h, hb.y + hb.h)) / 2;
    // power: karakter bertenaga besar (mis. Pak Jef) memukul lebih keras & lebih jauh
    const pw = att.def.power || 1;
    const res = this.applyHit(att, att.opp, {
      dmg: Math.round(m.dmg * pw),
      hitstun: (m.hitstun || 18) + (pw > 1 ? 5 : 0),
      blockstun: (m.blockstun || 12) + (pw > 1 ? 3 : 0),
      push: (m.push || 5) * pw,
      kd: m.kd, launch: m.launch && [m.launch[0] * pw, m.launch[1]],
      heavy: m.heavy || pw > 1.2, x: ix, y: iy,
    });
    // wallBlast: lawan terdorong sampai ujung arena (ditangkis = tanpa damage)
    // wallBlast: true = dorong sampai ujung arena; angka = dorong sejauh pecahan arena itu
    if (m.wallBlast && res !== 'miss') new WallShove(att, att.opp, res === 'block', m.wallBlast === true ? 0 : m.wallBlast);
  }

  applyHit(att, vic, hit) {
    if (this.phase !== 'fight') return 'miss';
    // hit.guard: 'full' = tembus tangkisan (damage penuh), 'half' = tembus tangkisan (setengah damage)
    // hit.half : pengali damage tambahan (serangan lanjutan dari jurus yang tadinya ditangkis)
    this.lastGuarded = false;
    const guarding = vic.onGround && (vic.state === 'guard' || vic.state === 'blockstun');
    if (hit.guard && guarding && vic.hurtbox()) {
      hit = Object.assign({}, hit, { unblockable: true });
      if (hit.guard === 'half') {
        hit.dmg = Math.round(hit.dmg * 0.5);
        this.fx.popup(vic.x, vic.y - 380, 'SETENGAH DAMAGE', '#bff4ff', 26);
      }
      this.lastGuarded = true;
    }
    if (hit.half) hit = Object.assign({}, hit, { dmg: Math.round(hit.dmg * hit.half) });
    const res = vic.receive(att, hit);
    if (res === 'miss') return res;
    const cx = hit.x !== undefined ? hit.x : vic.x;
    const cy = hit.y !== undefined ? hit.y : vic.y - 180;
    const big = !!(hit.heavy || hit.kd);
    if (res === 'hit') {
      this.fx.hit(cx, cy, big, att.def.color);
      Sound.play(big ? 'heavy' : 'light');
      this.hitstop = Math.max(this.hitstop, hit.hitstop !== undefined ? hit.hitstop : big ? 8 : 5);
      if (big) this.shake(140, 0.01);
      if (!hit.noGain) att.gainChakra(5);
      if (vic.comboTaken >= 2) this.showCombo(att, vic.comboTaken);
      if (vic.ko) this.onKO(vic, att);
    } else {
      this.fx.block(cx, cy, vic.def.color2);
      Sound.play('block');
      this.hitstop = Math.max(this.hitstop, 3);
      if (!hit.noGain) att.gainChakra(1);
    }
    // Lawan terpojok di dinding: penyerang yang terdorong mundur
    if (hit.srcX === undefined && vic.onGround && (vic.x <= CFG.WALL + 4 || vic.x >= CFG.W - CFG.WALL - 4)) {
      const dir = Math.sign(vic.x - att.x) || att.facing;
      att.extraVx = -dir * (hit.push || 5) * 0.9;
    }
    return res;
  }

  // ------------------------------------------------------------------
  // Efek layar
  // ------------------------------------------------------------------
  shake(ms, intensity) { this.cameras.main.shake(ms, intensity); }
  flash(ms, r, g, b) { this.cameras.main.flash(ms, r, g, b); }

  announce(text, color, size, hold) {
    const W = CFG.W, H = CFG.H;
    if (this.announceText) this.announceText.destroy();
    const t = UI.title(this, W / 2, H * 0.36, text, size, color).setDepth(95).setScale(2.4).setAlpha(0);
    t.setLineSpacing(-10);
    this.announceText = t;
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: t, alpha: 0, scale: 1.3, delay: 220 + (hold || 900), duration: 250,
      onComplete: () => { t.destroy(); if (this.announceText === t) this.announceText = null; },
    });
  }

  jutsuCall(f, name) {
    this.fx.popup(f.x, f.y - 330, name + '!', UI.hex(f.def.color), 34);
  }

  // Potongan adegan dramatis saat jurus pamungkas
  cutIn(f, name) {
    const W = CFG.W, H = CFG.H;
    this.freeze = true;
    Sound.play('cutin');
    const fromLeft = f.side === 0;
    const c = this.add.container(0, 0).setDepth(60);
    const dark = this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0).setAlpha(0);
    const cy = H * 0.5, bh = 230;
    const band = this.add.graphics();
    band.fillStyle(f.def.color, 0.92).fillPoints([{ x: -60, y: cy - bh / 2 + 30 }, { x: W + 60, y: cy - bh / 2 - 30 }, { x: W + 60, y: cy + bh / 2 - 30 }, { x: -60, y: cy + bh / 2 + 30 }], true);
    band.fillStyle(0x000000, 0.35).fillPoints([{ x: -60, y: cy - bh / 2 + 52 }, { x: W + 60, y: cy - bh / 2 - 8 }, { x: W + 60, y: cy + bh / 2 - 52 }, { x: -60, y: cy + bh / 2 + 8 }], true);
    band.lineStyle(6, 0xffffff, 1);
    band.lineBetween(-60, cy - bh / 2 + 30, W + 60, cy - bh / 2 - 30);
    band.lineBetween(-60, cy + bh / 2 + 30, W + 60, cy + bh / 2 - 30);
    band.x = fromLeft ? -W : W;
    const lines = [];
    for (let i = 0; i < 16; i++) {
      const l = this.add.image(Phaser.Math.Between(0, W), cy + Phaser.Math.Between(-90, 90), 'fx_line')
        .setScale(Phaser.Math.FloatBetween(1.5, 4), 1).setAlpha(0.7);
      lines.push(l);
    }
    const por = this.add.image(fromLeft ? W * 0.22 : W * 0.78, cy + bh / 2 + 70, f.def.id + '_portrait')
      .setOrigin(0.5, 1).setScale(0.95).setFlipX(!fromLeft).setAlpha(0);
    if (f.baseTint) por.setTint(f.baseTint);
    por.x += fromLeft ? -200 : 200;
    const sub = UI.text(this, fromLeft ? W * 0.62 : W * 0.38, cy - 52, 'JURUS PAMUNGKAS', 16, '#ffffff').setAlpha(0);
    const txt = UI.title(this, fromLeft ? W * 0.62 : W * 0.38, cy + 14, name, Math.min(80, Math.floor((W * 0.6) / name.length * 1.7)), '#ffffff').setAlpha(0);
    txt.setStroke(UI.hex(0x1a0b00), 10);
    c.add([dark, band, ...lines, por, sub, txt]);

    this.tweens.add({ targets: dark, alpha: 0.6, duration: 150 });
    this.tweens.add({ targets: band, x: 0, duration: 220, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: por, alpha: 1, x: fromLeft ? W * 0.22 : W * 0.78, duration: 300, delay: 120, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: [sub, txt], alpha: 1, duration: 200, delay: 260 });
    txt.x += fromLeft ? 120 : -120;
    this.tweens.add({ targets: txt, x: fromLeft ? W * 0.62 : W * 0.38, duration: 380, delay: 260, ease: 'Cubic.easeOut' });
    lines.forEach((l) => this.tweens.add({ targets: l, x: fromLeft ? l.x + 900 : l.x - 900, duration: 1300, ease: 'Linear' }));
    this.time.delayedCall(1250, () => {
      this.tweens.add({
        targets: c, alpha: 0, duration: 200,
        onComplete: () => {
          c.destroy();
          this.freeze = false;
        },
      });
      this.tweens.add({ targets: this.dim, alpha: 0.45, duration: 200 });
      this.time.delayedCall(2300, () => this.tweens.add({ targets: this.dim, alpha: 0, duration: 400 }));
    });
  }

  showCombo(att, n) {
    if (att === this.p1) this.maxCombo = Math.max(this.maxCombo, n);
    const W = CFG.W;
    const x = att.side === 0 ? 210 : W - 210;
    if (!this.comboText) this.comboText = [null, null];
    let t = this.comboText[att.side];
    if (!t) {
      t = UI.title(this, x, 190, '', 60, '#ffd75a').setDepth(85);
      this.comboText[att.side] = t;
    }
    t.setText(n + ' HIT\nKOMBO!').setAlpha(1).setScale(1.35);
    t.setLineSpacing(-14);
    this.tweens.killTweensOf(t);
    this.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, delay: 1100, duration: 300 });
  }

  // ------------------------------------------------------------------
  // HUD: bar darah, cakra, waktu, ronde
  // ------------------------------------------------------------------
  buildHud() {
    const W = CFG.W;
    this.hudG = this.add.graphics().setDepth(80);
    this.hudFaces = [this.p1, this.p2].map((f, i) => {
      const img = this.add.image(i === 0 ? 62 : W - 62, 60, f.def.id + '_face').setDepth(82);
      img.setScale(84 / Math.max(img.width, img.height)).setFlipX(i === 1);
      if (f.baseTint) img.setTint(f.baseTint);
      return img;
    });
    this.hudNames = [this.p1, this.p2].map((f, i) => UI.text(this, i === 0 ? 124 : W - 124, 96, f.def.name, 13, '#ffffff')
      .setOrigin(i === 0 ? 0 : 1, 0.5).setDepth(82));
    this.hudTimer = UI.text(this, W / 2, 50, '99', 34, '#ffffff').setDepth(82);
    this.hudRound = UI.text(this, W / 2, 90, '', 9, '#ffc83d').setDepth(82);
    this.hudUlti = [0, 1].map((i) => UI.text(this, 0, 66, 'ULTI SIAP!', 9, '#ffd75a').setDepth(82).setVisible(false));
    this.hpTrail = [CFG.MAX_HP, CFG.MAX_HP];
  }

  updateHud(time) {
    const W = CFG.W, g = this.hudG;
    g.clear();
    const outer = 120, inner = W / 2 - 74;
    const barW = inner - outer;
    const para = (x, y, w, h, sk, color, alpha) => {
      g.fillStyle(color, alpha === undefined ? 1 : alpha);
      g.fillPoints([{ x: x + sk, y }, { x: x + w + sk, y }, { x: x + w, y: y + h }, { x, y: y + h }], true);
    };
    // Kotak waktu
    g.fillStyle(0x000000, 0.65).fillRoundedRect(W / 2 - 52, 16, 104, 84, 12);
    g.lineStyle(3, 0xffc83d, 1).strokeRoundedRect(W / 2 - 52, 16, 104, 84, 12);

    [this.p1, this.p2].forEach((f, i) => {
      const hp = Math.max(0, f.hp) / CFG.MAX_HP;
      this.hpTrail[i] = Math.max(f.hp, this.hpTrail[i] - (f.state === 'hurt' || f.state === 'launched' ? 0 : 6));
      if (this.hpTrail[i] < f.hp) this.hpTrail[i] = f.hp;
      const tr = this.hpTrail[i] / CFG.MAX_HP;
      const y = 26, h = 26;
      const x0 = i === 0 ? outer : W - outer - barW;
      const sk = i === 0 ? 10 : -10;
      // bingkai
      para(x0 - 4, y - 4, barW + 8, h + 8, sk, 0x000000, 0.7);
      para(x0, y, barW, h, sk, 0x3a1020, 1);
      // jejak kerusakan
      const tw = barW * tr, hw = barW * hp;
      if (i === 0) para(x0, y, tw, h, sk, 0xffffff, 0.85);
      else para(x0 + barW - tw, y, tw, h, sk, 0xffffff, 0.85);
      // darah tersisa
      const col = hp > 0.5 ? 0x4cd964 : hp > 0.25 ? 0xffc83d : 0xff4d4d;
      if (i === 0) para(x0, y, hw, h, sk, col, 1);
      else para(x0 + barW - hw, y, hw, h, sk, col, 1);
      if (i === 0) para(x0, y, hw, 6, sk * 0.2, 0xffffff, 0.3);
      else para(x0 + barW - hw, y, hw, 6, sk * 0.2, 0xffffff, 0.3);

      // cakra
      const cy = 60, ch = 14, cw = barW * 0.72;
      const cx0 = i === 0 ? outer : W - outer - cw;
      const ck = f.chakra / CFG.MAX_CHAKRA;
      const full = f.chakra >= CFG.MAX_CHAKRA;
      para(cx0 - 3, cy - 3, cw + 6, ch + 6, sk * 0.6, 0x000000, 0.7);
      para(cx0, cy, cw, ch, sk * 0.6, 0x0c2238, 1);
      const warn = i === 0 && this.chakraWarn > 0 && Math.floor(this.chakraWarn / 4) % 2 === 0;
      const ccol = warn ? 0xff4d4d : full ? (Math.sin(time / 90) > 0 ? 0xffd75a : 0xfff3b0) : 0x3fd0ff;
      const cww = cw * ck;
      if (i === 0) para(cx0, cy, cww, ch, sk * 0.6, ccol, 1);
      else para(cx0 + cw - cww, cy, cww, ch, sk * 0.6, ccol, 1);
      // penanda biaya jurus
      const jc = f.def.jurus.cost / CFG.MAX_CHAKRA;
      const mx = i === 0 ? cx0 + cw * jc : cx0 + cw - cw * jc;
      g.fillStyle(0xffffff, 0.8).fillRect(mx - 1, cy - 2, 3, ch + 4);
      const ul = this.hudUlti[i];
      ul.setVisible(full);
      ul.setPosition(i === 0 ? cx0 + cw + 58 : cx0 - 58, cy + 7);

      // bingkai wajah
      const fx = i === 0 ? 62 : W - 62;
      g.lineStyle(4, f.def.color, 1).strokeCircle(fx, 60, 46);

      // tanda ronde menang
      for (let k = 0; k < CFG.ROUNDS_TO_WIN; k++) {
        const rx = i === 0 ? inner - 14 - k * 26 : W - inner + 14 + k * 26;
        g.fillStyle(0x000000, 0.7).fillCircle(rx, 92, 10);
        g.fillStyle(k < this.wins[i] ? 0xffc83d : 0x333344, 1).fillCircle(rx, 92, 7);
      }
    });
    this.hudTimer.setText(String(Math.max(0, this.timer)).padStart(2, '0'));
    this.hudTimer.setColor(this.timer <= 10 && this.phase === 'fight' ? '#ff4d4d' : '#ffffff');
    this.hudRound.setText('RONDE ' + this.round);
  }

  // ------------------------------------------------------------------
  // Jeda & hasil
  // ------------------------------------------------------------------
  panel(title, color) {
    const W = CFG.W, H = CFG.H;
    const c = this.add.container(0, 0).setDepth(100);
    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setInteractive();
    c.add(dim);
    c.titleText = UI.title(this, W / 2, 150, title, 96, color);
    c.add(c.titleText);
    return c;
  }

  togglePause() {
    if (this.phase === 'over' || this.leaving) return;
    if (this.paused) {
      this.paused = false;
      this.time.paused = false;
      this.tweens.resumeAll();
      this.touch.setEnabled(true);
      if (this.pauseMenu) this.pauseMenu.destroy();
      if (this.pausePanel) this.pausePanel.destroy();
      this.pausePanel = null;
      return;
    }
    this.paused = true;
    this.time.paused = true;
    this.tweens.pauseAll();
    this.touch.setEnabled(false);
    Sound.play('select');
    const W = CFG.W;
    const c = this.panel('JEDA', '#ffffff');
    const btns = [
      UI.button(this, W / 2, 290, 340, 64, 'LANJUTKAN', () => this.togglePause(), { size: 18 }),
      UI.button(this, W / 2, 370, 340, 64, 'ULANGI TANDING', () => this.leave('Fight', this.match), { size: 16 }),
      UI.button(this, W / 2, 450, 340, 64, 'GANTI KARAKTER', () => this.leave('Select', {}), { size: 16 }),
      UI.button(this, W / 2, 530, 340, 64, 'MENU UTAMA', () => this.leave('Title'), { size: 16 }),
    ];
    btns.forEach((b) => c.add(b));
    const snd = UI.soundToggle(this, W / 2 - 80, 615);
    c.add(snd);
    const fs = UI.fullscreenToggle(this, W / 2 + 80, 615);
    if (fs) c.add(fs);
    this.pausePanel = c;
    this.pauseMenu = UI.menu(this, btns);
  }

  matchEnd(w) {
    this.phase = 'over';
    this.inputLocked = true;
    this.touch.setEnabled(false);
    const W = CFG.W, H = CFG.H;
    const won = w === 0;
    const winner = won ? this.p1 : this.p2;
    Sound.music(null);
    Sound.play(won ? 'heal' : 'back');
    const c = this.panel(won ? 'KAMU MENANG!' : 'KAMU KALAH...', won ? '#ffd75a' : '#ff6a6a');
    const por = this.add.image(W * 0.2, H + 20, winner.def.id + '_portrait').setOrigin(0.5, 1).setScale(0.9);
    if (winner.baseTint) por.setTint(winner.baseTint);
    const quote = UI.text(this, W / 2, 240, '"' + winner.def.quotes.win + '"', 14, '#ffffff', { wordWrap: { width: W * 0.5 } });
    const stats = UI.text(this, W / 2, 292, 'KOMBO TERBANYAK: ' + this.maxCombo + ' HIT', 12, '#7fd8ff');
    c.add([por, quote, stats]);
    const title = c.titleText;
    const arc = this.match.arcade;
    let btns;
    if (arc) {
      const done = arc.index + 1;
      const total = arc.order.length;
      if (won && done >= total) {
        // semua lawan dikalahkan
        title.setText('JUARA ARCADE!');
        stats.setText('Semua ' + total + ' lawan dikalahkan dengan ' + winner.def.name + '!');
        Sound.play('confirm');
        this.celebrate();
        btns = [
          UI.button(this, W / 2, 400, 360, 66, 'MAIN ARCADE LAGI', () => this.leave('Select', { mode: 'arcade' }), { size: 16, color: 0xb06cff }),
          UI.button(this, W / 2, 482, 360, 62, 'MENU UTAMA', () => this.leave('Title'), { size: 16 }),
        ];
      } else if (won) {
        stats.setText('ARCADE: ' + done + ' / ' + total + ' LAWAN DIKALAHKAN');
        const next = Object.assign({}, this.match, { cpu: arc.order[done], arcade: { order: arc.order, index: done } });
        btns = [
          UI.button(this, W / 2, 400, 360, 66, 'LAWAN BERIKUTNYA', () => this.leave('Versus', next), { size: 17, color: 0xb06cff }),
          UI.button(this, W / 2, 482, 360, 62, 'MENU UTAMA', () => this.leave('Title'), { size: 16 }),
        ];
      } else {
        stats.setText('ARCADE: berhenti di lawan ' + done + ' / ' + total);
        btns = [
          UI.button(this, W / 2, 400, 360, 66, 'COBA LAGI', () => this.leave('Fight', this.match), { size: 18, color: 0xff6a2a }),
          UI.button(this, W / 2, 482, 360, 62, 'ULANG DARI AWAL', () => this.leave('Select', { mode: 'arcade' }), { size: 16 }),
          UI.button(this, W / 2, 560, 360, 62, 'MENU UTAMA', () => this.leave('Title'), { size: 16 }),
        ];
      }
    } else {
      btns = [
        UI.button(this, W / 2, 380, 360, 66, 'TANDING ULANG', () => this.leave('Fight', this.match), { size: 18, color: 0xff6a2a }),
        UI.button(this, W / 2, 462, 360, 62, 'GANTI LAWAN', () => this.leave('Select', { p1: this.match.p1 }), { size: 16 }),
        UI.button(this, W / 2, 540, 360, 62, 'GANTI KARAKTER', () => this.leave('Select', {}), { size: 16 }),
        UI.button(this, W / 2, 618, 360, 62, 'MENU UTAMA', () => this.leave('Title'), { size: 16 }),
      ];
    }
    btns.forEach((b) => c.add(b));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 300 });
    this.time.delayedCall(300, () => { this.resultMenu = UI.menu(this, btns); });
  }

  // Hujan kertas warna-warni saat juara arcade
  celebrate() {
    const colors = [0xffd75a, 0xff6a2a, 0x4cd964, 0x4aa8ff, 0xb06cff, 0xff6fae];
    const em = this.add.particles(0, -20, 'fx_px', {
      x: { min: 0, max: CFG.W }, lifespan: 4000, speedY: { min: 120, max: 260 }, speedX: { min: -60, max: 60 },
      scale: { min: 1, max: 2.2 }, rotate: { start: 0, end: 720 }, frequency: 30, tint: colors,
    }).setDepth(150);
    this.time.delayedCall(6000, () => em.stop());
  }

  leave(scene, data) {
    if (this.leaving) return;
    this.leaving = true;
    this.paused = false;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, data));
  }
}
