// =====================================================================
// JURUS SUCI FLOWER
// =====================================================================

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
        // racun menembus perisai (setengah damage bila menangkis)
        const res = sc.applyHit(f, vic, { dmg: 30, hitstun: 50, blockstun: 24, push: 2, chip: 0.4, guard: 'half', hitstop: 8, srcX: this.x, x: this.x, y: this.y, noGain: true });
        this.half = sc.lastGuarded ? 0.5 : 0;
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
      sc.applyHit(f, vic, { dmg: 22, hitstun: 30, push: 0, hitstop: 1, force: true, half: this.half, srcX: f.x, x: vic.x + rnd(-30, 30), y: vic.y - rnd(80, 240), noGain: true });
    }
    if (this.pt >= 80 || vic.ko) {
      vic.tintOverride = null;
      sc.applyHit(f, vic, { dmg: 90, kd: true, launch: [3, -7], heavy: true, hitstop: 14, force: true, half: this.half, srcX: f.x, x: vic.x, y: vic.y - 120, noGain: true });
      this.cloud(20);
      fadeOut(sc, this.glow, 400);
      this.vis.destroy();
      return false;
    }
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
