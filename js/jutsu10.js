// =====================================================================
// JURUS KARAKTER GELOMBANG 10: Fatim (sprite baru, ninja super cepat)
// (memakai Actor, ADD, rnd, circleRect, rectsOverlap dari jutsu.js, zapAt dari jutsu3.js,
//  ChestOrb dari jutsu9.js)
// =====================================================================

// ---------------------------------------------------------------------
// Shuriken dari pukulan Fatim — jangkauan dibatasi (pecahan lebar arena)
// ---------------------------------------------------------------------
class ThrowStar extends Actor {
  constructor(f, m) {
    super(f.scene, f);
    const pr = m.proj, p = f.at(pr.x || 120, pr.h);
    this.x = this.x0 = p.x;
    this.y = p.y;
    this.vx = f.facing * (pr.speed || 20);
    this.range = CFG.W * (pr.reach || 0.45) - (pr.x || 120) - 70;
    this.m = m;
    this.kind = 'mid';
    this.projectile = true;
    this.power = 1;
    this.vis = this.scene.add.image(p.x, p.y, 'fx_shuriken').setDepth(32).setScale(1.1);
    Sound.play('shuriken');
  }
  rect() { return circleRect(this.x, this.y, 24); }
  explode() {
    if (this.dead) return;
    this.scene.fx.burst(this.scene.fx.sparks, this.x, this.y, 8, 0xdfe6ff);
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp, m = this.m;
    this.x += this.vx;
    this.vis.setPosition(this.x, this.y);
    this.vis.angle += 35 * Math.sign(this.vx);
    if (this.t % 2 === 0) sc.fx.burst(sc.fx.pixels, this.x - Math.sign(this.vx) * 14, this.y, 1, 0xc9c0ff);
    const gone = Math.abs(this.x - this.x0) / this.range;
    this.vis.setAlpha(gone > 0.8 ? Math.max(0, (1 - gone) * 5) : 1);
    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      sc.applyHit(f, vic, {
        dmg: m.dmg, hitstun: m.hitstun, blockstun: m.blockstun, push: m.push, kd: m.kd, launch: m.launch,
        heavy: m.heavy, srcX: this.x - Math.sign(this.vx) * 30, x: this.x, y: this.y,
      });
      this.explode();
      return false;
    }
    if (gone >= 1) { this.vis.destroy(); return false; }
    return true;
  }
}

// ---------------------------------------------------------------------
// FATIM — Tabrakan Petir: melesat (jangkauan 50% arena) menabrak lawan lalu
// menyetrum dengan listrik kuning-biru. Menangkis = setengah damage.
// ---------------------------------------------------------------------
JUTSU.thunderdash = function (f) {
  const sc = f.scene, fx = f.fx;
  let phase = 'ready', pt = 0, travelled = 0, vic = null;
  f.setPose('aura');
  return {
    step() {
      pt++;
      if (phase === 'ready') {
        if (pt % 2 === 0) zapAt(sc, f.x + rnd(-40, 40), f.y - rnd(40, 240), pt % 4 ? 0xffe066 : 0x7fd8ff);
        if (pt >= 6) { phase = 'dash'; pt = 0; f.setPose('dash'); Sound.play('dash'); }
        return true;
      }
      if (phase === 'dash') {
        const step = 40;
        f.vx = 0;
        f.x = Phaser.Math.Clamp(f.x + f.facing * step, CFG.WALL, CFG.W - CFG.WALL);
        travelled += step;
        f.afterimage(pt % 2 ? 0xffe066 : 0x7fd8ff, 0.5, 200);
        if (rectsOverlap(f.boxRect([90, 150, 150, 260]), f.opp.hurtbox())) {
          vic = f.opp;
          f.setPose('zap');
          sc.applyHit(f, vic, { dmg: 40, hitstun: 50, heavy: true, guard: 'half', hitstop: 8, push: 0, srcX: f.x, x: vic.x, y: vic.y - 160, noGain: true });
          this.half = sc.lastGuarded ? 0.5 : 0;
          Sound.play('explosion');
          phase = 'shock';
          pt = 0;
          return true;
        }
        // jangkauan total (lesatan + tubrukan) = 50% arena
        if (travelled >= CFG.W * 0.5 - 170) { phase = 'end'; pt = 0; f.setPose('punch'); }
        return true;
      }
      if (phase === 'shock') {
        // listrik kuning & biru menjalar di tubuh lawan
        if (pt % 2 === 0) zapAt(sc, vic.x + rnd(-40, 40), vic.y - rnd(40, 260), pt % 4 ? 0xffe066 : 0x7fd8ff);
        vic.tintOverride = pt % 4 < 2 ? 0xfff3a0 : 0xbff4ff;
        vic.vx = 0;
        if (pt % 6 === 0) Sound.play('shuriken');
        if (pt >= 30 || vic.ko) {
          vic.tintOverride = null;
          sc.applyHit(f, vic, { dmg: 100, kd: true, launch: [6, -10], heavy: true, force: true, half: this.half, hitstop: 12, srcX: f.x, x: vic.x, y: vic.y - 150, noGain: true });
          sc.shake(320, 0.016);
          phase = 'end';
          pt = 0;
        }
        return true;
      }
      return pt < 20;
    },
    cancel() { if (vic) vic.tintOverride = null; },
  };
};

// ---------------------------------------------------------------------
// FATIM — ULTIMATE: Bola Petir Pelindung (didorong sampai 70% arena,
// masuk ke tubuh lawan & menyetrum). Menangkis = setengah damage.
// ---------------------------------------------------------------------
JUTSU.thunderorb = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('meditate');
  return {
    step(t) {
      if (t <= 34) {
        if (t === 14) f.setPose('orb');
        if (t % 3 === 0) zapAt(sc, f.x + rnd(-90, 90), f.y - rnd(30, 300), t % 2 ? 0xffe066 : 0x7fd8ff);
        fx.auraAt(f.x + rnd(-90, 90), f.y - rnd(0, 300), 0x7fd8ff);
        if (t % 12 === 0) Sound.play('charge');
        return true;
      }
      if (t === 35) {
        f.setPose('palm');
        const p = f.at(110, 160);
        new ChestOrb(f, p.x, p.y, {
          color: 0x7fd8ff, speed: 14, reach: 0.7, zap: true,
          hit: { dmg: 250, kd: true, launch: [8, -12], heavy: true, guard: 'half', hitstop: 16 },
        });
        Sound.play('explosion');
        Sound.play('shuriken');
      }
      return t < 56;
    },
  };
};
