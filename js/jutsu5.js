// =====================================================================
// JURUS KARAKTER GELOMBANG 5: Suci Flower, Septi
// (memakai Actor, ADD, rnd, circleRect, fadeOut dari jutsu.js)
// =====================================================================

// ---------------------------------------------------------------------
// Bilah angin berwarna. opts:
//   tint, tint2 : warna inti & pinggir      s : ukuran      speed
//   hit         : data serangan saat kena
//   carry       : lawan terseret sampai tepi arena lalu terpental
//   petals      : taburan kelopak mawar di jejaknya
// ---------------------------------------------------------------------
class ColorBlade extends Actor {
  constructor(f, x, y, o) {
    super(f.scene, f);
    const sc = this.scene, s = (this.s = o.s || 1), flip = f.facing < 0;
    this.o = o;
    this.x = x;
    this.y = y;
    this.vx = f.facing * (o.speed || 13);
    this.kind = s > 1.8 ? 'big' : 'low';
    this.projectile = true;
    this.power = o.power || 1;
    this.phase = 'fly';
    this.vis = sc.add.container(x, y).setDepth(32);
    this.vis.add([
      sc.add.image(0, 0, 'fx_glow').setTint(o.tint2).setBlendMode(ADD()).setScale(1.4 * s, 1.0 * s).setAlpha(0.65),
      sc.add.image(-f.facing * 22 * s, 0, 'fx_slash').setTint(o.tint2).setBlendMode(ADD()).setScale(0.75 * s, 1.0 * s).setFlipX(flip).setAlpha(0.8),
      sc.add.image(0, 0, 'fx_slash').setTint(o.tint).setBlendMode(ADD()).setScale(0.95 * s, 1.15 * s).setFlipX(flip),
    ]);
    if (s > 1.8) {
      this.ring = sc.add.image(0, 0, 'fx_wind').setTint(o.tint).setBlendMode(ADD()).setScale(0.6 * s, 1.5 * s).setAngle(90);
      this.vis.add(this.ring);
    }
  }
  rect() { return { x: this.x - 38 * this.s, y: this.y - 58 * this.s, w: 76 * this.s, h: 116 * this.s }; }
  explode(silent) {
    if (this.dead) return;
    const sc = this.scene;
    if (!silent) Sound.play('wind');
    sc.fx.image('fx_ring', this.x, this.y, { tint: this.o.tint2, from: 0.3, to: 1.6 * this.s, ms: 280 });
    sc.fx.burst(sc.fx.sparks, this.x, this.y, 12, this.o.tint);
    this.vis.destroy();
    this.destroy();
  }
  trail() {
    const sc = this.scene;
    if (this.t % 2 === 0) sc.fx.auraAt(this.x - Math.sign(this.vx) * 30 * this.s, this.y + rnd(-30, 30) * this.s, this.o.tint2);
    if (this.o.petals && this.t % 3 === 0) sc.fx.burst(sc.fx.pixels, this.x - Math.sign(this.vx) * 20, this.y + rnd(-25, 25), 2, 0xff3d6a);
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp, o = this.o;
    this.x += this.vx;
    this.vis.setPosition(this.x, this.y);
    this.vis.scaleY = 1 + Math.sin(this.t * 0.8) * 0.08;
    if (this.ring) this.ring.scaleY = 1.5 * this.s * (1 + Math.sin(this.t * 1.3) * 0.12);
    this.trail();

    if (this.phase === 'carry') {
      // lawan terseret angin sampai tepi arena
      this.pt++;
      vic.x = this.x + Math.sign(this.vx) * 40;
      vic.vx = 0;
      const atWall = vic.x <= CFG.WALL + 2 || vic.x >= CFG.W - CFG.WALL - 2;
      if (this.pt % 7 === 0 && !atWall) {
        sc.applyHit(f, vic, { dmg: 16, hitstun: 30, push: 0, hitstop: 1, force: true, srcX: this.x - Math.sign(this.vx) * 60, x: vic.x, y: this.y, noGain: true });
      }
      if (atWall || this.pt > 80 || vic.ko) {
        sc.applyHit(f, vic, Object.assign({ force: true, srcX: this.x - Math.sign(this.vx) * 60, x: vic.x, y: this.y, noGain: true }, o.hit));
        sc.shake(500, 0.022);
        sc.flash(180, 230, 245, 255);
        this.explode();
        return false;
      }
      return true;
    }

    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      if (o.carry) {
        const res = sc.applyHit(f, vic, { dmg: 30, hitstun: 40, blockstun: 22, push: 4, chip: 0.35, heavy: true, srcX: this.x, x: this.x, y: this.y, hitstop: 8, noGain: true });
        if (res === 'hit') {
          this.phase = 'carry';
          this.pt = 0;
          this.vx = Math.sign(this.vx) * 15;
          return true;
        }
      } else {
        sc.applyHit(f, vic, Object.assign({ srcX: this.x, x: this.x, y: this.y, noGain: true }, o.hit));
      }
      this.explode();
      return false;
    }
    if (this.x < -150 || this.x > CFG.W + 150) { this.vis.destroy(); return false; }
    return true;
  }
}

// ---------------------------------------------------------------------
// SUCI FLOWER — Angin Pisau Mawar: kibasan mawar melepas angin pisau merah
// ---------------------------------------------------------------------
JUTSU.roseblade = function (f) {
  const fx = f.fx;
  f.setPose('walk4');
  return {
    step(t) {
      if (t < 8) {
        if (t % 2 === 0) fx.burst(fx.pixels, f.x + f.facing * rnd(20, 80), f.y - rnd(120, 260), 2, 0xff3d6a);
        return true;
      }
      if (t === 8) {
        f.setPose('roseup'); // mawar dikibaskan dari bawah ke atas
        const p = f.at(150, 170);
        fx.slash(p.x, p.y - 40, f.facing, 0xff3d6a);
        new ColorBlade(f, p.x, p.y, {
          tint: 0xff2a4a, tint2: 0xffa8cc, s: 1.25, speed: 14, petals: true,
          hit: { dmg: 105, kd: true, launch: [15, -11], heavy: true, hitstop: 8, chip: 0.2, blockstun: 16, push: 12 },
        });
        Sound.play('whoosh');
        Sound.play('wind');
      }
      return t < 32;
    },
  };
};

// ---------------------------------------------------------------------
// SUCI FLOWER — ULTIMATE: Mawar Beracun
// Mawar dilempar ke lawan, meledak menjadi awan racun, lawan roboh.
// ---------------------------------------------------------------------
class PoisonRose extends Actor {
  constructor(f, x, y) {
    super(f.scene, f);
    this.x = x;
    this.y = y;
    const vic = f.opp, T = Phaser.Math.Clamp(Math.abs(vic.x - x) / 16, 14, 40), g = 0.5;
    this.vx = (vic.x - x) / T;
    this.vy = (vic.y - 150 - y - 0.5 * g * T * T) / T;
    this.g = g;
    this.kind = 'mid';
    this.projectile = true;
    this.power = 3;
    this.phase = 'fly';
    this.vis = this.scene.add.image(x, y, 'fx_rose').setDepth(33).setScale(1.3).setFlipX(f.facing < 0);
    this.glow = this.scene.add.image(x, y, 'fx_glow').setTint(0xff3d8a).setBlendMode(ADD()).setDepth(32).setScale(1.2).setAlpha(0.6);
  }
  rect() { return circleRect(this.x, this.y, 30); }
  dispose() {
    super.dispose();
    if (this.glow) this.glow.destroy();
    if (this.owner.opp.tintOverride === 0x9cff7a) this.owner.opp.tintOverride = null;
  }
  explode() {
    if (this.dead) return;
    this.cloud(16);
    this.vis.destroy();
    this.glow.destroy();
    this.destroy();
  }
  cloud(n) {
    const sc = this.scene;
    sc.fx.smoke.particleTint = 0x9cff5a;
    sc.fx.smoke.explode(n, this.x, this.y);
    sc.fx.smoke.particleTint = 0xb06cff;
    sc.fx.smoke.explode(Math.ceil(n / 2), this.x, this.y);
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp;
    if (this.phase === 'fly') {
      this.vy += this.g;
      this.x += this.vx;
      this.y += this.vy;
      this.vis.setPosition(this.x, this.y).setAngle(this.vis.angle + this.vx * 2);
      this.glow.setPosition(this.x, this.y);
      if (this.t % 3 === 0) sc.fx.burst(sc.fx.pixels, this.x, this.y, 1, 0xff3d6a);
      if (this.clash()) return false;
      const hb = vic.hurtbox();
      const landed = this.y >= f.ground - 20;
      if (rectsOverlap(this.rect(), hb) || (landed && Math.abs(vic.x - this.x) < 120 && hb)) {
        const res = sc.applyHit(f, vic, { dmg: 30, hitstun: 50, blockstun: 24, push: 2, chip: 0.4, hitstop: 8, srcX: this.x, x: this.x, y: this.y, noGain: true });
        Sound.play('explosion');
        if (res !== 'hit') { this.explode(); return false; }
        // racun menyebar
        this.phase = 'poison';
        this.pt = 0;
        this.vis.setVisible(false);
        this.glow.setTint(0x9cff5a).setScale(3.5).setAlpha(0.45);
        this.cloud(22);
        return true;
      }
      if (landed || this.x < -80 || this.x > CFG.W + 80) { this.explode(); return false; }
      return true;
    }
    // racun bekerja: lawan lemas, kehijauan, lalu roboh
    this.pt++;
    this.x = vic.x;
    this.y = vic.y - 140;
    this.glow.setPosition(this.x, this.y).setAlpha(0.35 + Math.sin(this.pt * 0.3) * 0.15);
    vic.tintOverride = 0x9cff7a;
    vic.vx = 0;
    if (this.pt % 4 === 0) this.cloud(3);
    if (this.pt % 10 === 0 && this.pt < 80) {
      sc.applyHit(f, vic, { dmg: 22, hitstun: 30, push: 0, hitstop: 1, force: true, srcX: f.x, x: vic.x + rnd(-30, 30), y: vic.y - rnd(80, 240), noGain: true });
    }
    if (this.pt >= 80 || vic.ko) {
      vic.tintOverride = null;
      sc.applyHit(f, vic, { dmg: 90, kd: true, launch: [3, -7], heavy: true, hitstop: 14, force: true, srcX: f.x, x: vic.x, y: vic.y - 120, noGain: true });
      this.cloud(20);
      fadeOut(sc, this.glow, 400);
      this.vis.destroy();
      return false;
    }
    return true;
  }
}

JUTSU.poisonrose = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('meditate');
  Sound.play('heal');
  return {
    step(t) {
      if (t <= 26) {
        if (t === 12) f.setPose('aura');
        fx.auraAt(f.x + rnd(-90, 90), f.y - rnd(0, 260), t % 2 ? 0xff3d8a : 0xffa8cc);
        if (t % 3 === 0) fx.burst(fx.pixels, f.x + rnd(-100, 100), f.y - rnd(40, 300), 2, 0xff3d6a);
        return true;
      }
      if (t === 27) {
        f.setPose('throw');
        const p = f.at(150, 210);
        new PoisonRose(f, p.x, p.y);
        Sound.play('whoosh');
        sc.shake(120, 0.006);
      }
      return t < 50;
    },
  };
};

// ---------------------------------------------------------------------
// SEPTI — Kibasan Kipas: satu kipas melepas angin yang menjatuhkan lawan
// ---------------------------------------------------------------------
JUTSU.fangust = function (f) {
  const fx = f.fx;
  f.setPose('walk1');
  return {
    step(t) {
      if (t < 7) {
        fx.auraAt(f.x + f.facing * rnd(0, 60), f.y - rnd(100, 260), 0xdff4ff);
        return true;
      }
      if (t === 7) {
        f.setPose('fan1');
        const p = f.at(150, 170);
        new ColorBlade(f, p.x, p.y, {
          tint: 0xffffff, tint2: 0x9fe8ff, s: 1.35, speed: 13,
          hit: { dmg: 100, kd: true, launch: [9, -13], heavy: true, hitstop: 8, chip: 0.2, blockstun: 16, push: 12 },
        });
        Sound.play('wind');
        Sound.play('whoosh');
      }
      return t < 32;
    },
  };
};

// ---------------------------------------------------------------------
// SEPTI — ULTIMATE: Badai Dua Kipas (lawan terlempar sampai tepi layar)
// ---------------------------------------------------------------------
JUTSU.twinfan = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('meditate');
  Sound.play('wind');
  return {
    step(t) {
      if (t <= 36) {
        if (t === 14) f.setPose('aura');
        fx.auraAt(f.x + rnd(-110, 110), f.y - rnd(0, 300), t % 2 ? 0xdff4ff : 0xffd27a);
        if (t % 3 === 0) fx.dust(f.x + rnd(-120, 120), f.ground, 1);
        if (t % 12 === 0) Sound.play('wind');
        if (t === 34) sc.flash(100, 220, 245, 255);
        return true;
      }
      if (t === 37) {
        f.setPose('fan2');
        const p = f.at(160, 170);
        new ColorBlade(f, p.x, p.y, {
          tint: 0xffffff, tint2: 0x9fe8ff, s: 2.4, speed: 15, power: 3, carry: true,
          hit: { dmg: 170, kd: true, launch: [20, -15], heavy: true, hitstop: 16 },
        });
        fx.shock(f.x, f.ground, 0x9fe8ff, 3.6);
        Sound.play('explosion');
        Sound.play('wind');
        sc.shake(300, 0.012);
      }
      return t < 64;
    },
  };
};
