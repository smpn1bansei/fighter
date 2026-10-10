// =====================================================================
// JURUS KARAKTER GELOMBANG 4: Mbak Nita
// (memakai Actor, ADD, rnd, circleRect, fadeOut dari jutsu.js dan zapAt dari jutsu3.js)
// =====================================================================

// ---------------------------------------------------------------------
// Anak panah (biasa & berpetir)
// ---------------------------------------------------------------------
class ArrowShot extends Actor {
  constructor(f, x, y, thunder) {
    super(f.scene, f);
    const sc = this.scene;
    this.x = x;
    this.y = y;
    this.thunder = thunder;
    this.vx = f.facing * (thunder ? 20 : 24);
    this.kind = 'mid';
    this.projectile = true;
    this.power = thunder ? 3 : 1;
    this.phase = 'fly';
    const s = thunder ? 1.5 : 1, flip = f.facing < 0;
    this.vis = sc.add.container(x, y).setDepth(33);
    this.vis.add(sc.add.image(0, 0, 'fx_glow').setTint(thunder ? 0x7fd8ff : 0xff6fae).setBlendMode(ADD()).setScale(1.4 * s, 0.5 * s).setAlpha(0.8));
    if (thunder) {
      this.bolt = sc.add.image(-f.facing * 40, 0, 'fx_bolt0').setTint(0xbff4ff).setBlendMode(ADD()).setScale(1.3, 1.1).setFlipX(flip);
      this.vis.add(this.bolt);
    }
    this.vis.add(sc.add.image(0, 0, 'fx_arrow').setTint(thunder ? 0xe6fbff : 0xffd0e6).setBlendMode(ADD()).setScale(s).setFlipX(flip));
  }
  rect() { return { x: this.x - 40, y: this.y - 24, w: 80, h: 48 }; }
  explode(silent) {
    if (this.dead) return;
    const sc = this.scene;
    if (!silent) Sound.play(this.thunder ? 'explosion' : 'light');
    if (this.thunder) {
      zapAt(sc, this.x, this.y, 0xbff4ff);
      sc.fx.image('fx_glow', this.x, this.y, { tint: 0x7fd8ff, from: 1, to: 4.5, ms: 380 });
      sc.fx.shock(this.x, this.owner.ground, 0x7fd8ff, 3.2);
    } else {
      sc.fx.hit(this.x, this.y, false, 0xff6fae);
    }
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp;
    this.x += this.vx;
    this.vis.setPosition(this.x, this.y);
    if (this.bolt) this.bolt.setTexture('fx_bolt' + (this.t % 3));
    if (this.t % 2 === 0) sc.fx.burst(sc.fx.pixels, this.x - Math.sign(this.vx) * 40, this.y, 1, this.thunder ? 0xbff4ff : 0xff9fcc);

    if (this.phase === 'carry') {
      // lawan terseret mundur bersama panah petir sampai ke tepi arena
      this.pt++;
      vic.x = this.x + Math.sign(this.vx) * 30;
      vic.vx = 0;
      if (this.pt % 3 === 0) zapAt(sc, vic.x + rnd(-30, 30), vic.y - rnd(80, 240), 0xbff4ff);
      const atWall = vic.x <= CFG.WALL + 2 || vic.x >= CFG.W - CFG.WALL - 2;
      if (this.pt % 6 === 0 && !atWall) {
        sc.applyHit(f, vic, { dmg: 18, hitstun: 30, push: 0, hitstop: 1, force: true, half: this.half, srcX: this.x - Math.sign(this.vx) * 60, x: vic.x, y: this.y, noGain: true });
      }
      if (atWall || this.pt > 70 || vic.ko) {
        sc.applyHit(f, vic, { dmg: 130, kd: true, launch: [10, -15], heavy: true, hitstop: 16, force: true, half: this.half, srcX: this.x - Math.sign(this.vx) * 60, x: vic.x, y: this.y, noGain: true });
        sc.shake(500, 0.022);
        sc.flash(200, 200, 240, 255);
        this.explode();
        return false;
      }
      return true;
    }

    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      if (!this.thunder) {
        // lawan jatuh walau menangkis (setengah damage)
        sc.applyHit(f, vic, { dmg: 110, kd: true, launch: [9, -11], heavy: true, guard: 'half', srcX: this.x, x: this.x, y: this.y, hitstop: 7, noGain: true });
        this.explode();
        return false;
      }
      const res = sc.applyHit(f, vic, { dmg: 30, hitstun: 40, blockstun: 22, push: 4, chip: 0.35, heavy: true, guard: 'half', srcX: this.x, x: this.x, y: this.y, hitstop: 8, noGain: true });
      this.half = sc.lastGuarded ? 0.5 : 0;
      if (res === 'hit') {
        this.phase = 'carry';
        this.pt = 0;
        this.vx = Math.sign(this.vx) * 15;
        Sound.play('explosion');
      } else {
        this.explode();
        return false;
      }
    }
    if (this.x < -150 || this.x > CFG.W + 150) { this.vis.destroy(); return false; }
    return true;
  }
}

// ---------------------------------------------------------------------
// MBAK NITA — Panah Cahaya: mengeluarkan busur lalu menembakkan panah
// ---------------------------------------------------------------------
JUTSU.arrow = function (f) {
  const fx = f.fx;
  f.setPose('drawbow');
  Sound.play('seal');
  return {
    step(t) {
      if (t <= 10) {
        // busur cahaya muncul
        const p = f.at(130, 200);
        if (t % 2 === 0) fx.auraAt(p.x + rnd(-20, 20), p.y + rnd(-80, 80), 0xff9fcc);
        return true;
      }
      if (t === 11) f.setPose('aimbow');
      if (t === 20) {
        f.setPose('shoot');
        const p = f.at(170, 200);
        new ArrowShot(f, p.x, p.y, false);
        Sound.play('whoosh');
      }
      return t < 34;
    },
  };
};

// ---------------------------------------------------------------------
// MBAK NITA — ULTIMATE: Panah Petir (lawan terseret jauh ke belakang)
// ---------------------------------------------------------------------
JUTSU.thunderarrow = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('drawbow');
  return {
    step(t) {
      const p = f.at(150, 200);
      if (t <= 34) {
        if (t === 12) f.setPose('aimbow');
        // petir berkumpul di busur
        if (t % 3 === 0) zapAt(sc, p.x + rnd(-40, 40), p.y + rnd(-90, 90), 0xbff4ff);
        fx.auraAt(f.x + rnd(-60, 60), f.y - rnd(0, 260), 0x7fd8ff);
        if (t % 12 === 0) Sound.play('charge');
        if (t === 30) sc.flash(100, 200, 240, 255);
        return true;
      }
      if (t === 35) {
        f.setPose('shoot');
        new ArrowShot(f, p.x + f.facing * 20, p.y, true);
        Sound.play('explosion');
        Sound.play('shuriken');
        sc.shake(200, 0.01);
      }
      return t < 56;
    },
  };
};
