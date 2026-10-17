// =====================================================================
// JURUS PAK JEF
// =====================================================================

// ---------------------------------------------------------------------
// PAK JEF — tendangan biasa menembakkan bola sepak sampai ujung arena
// ---------------------------------------------------------------------
class KickBall extends Actor {
  constructor(f, m) {
    super(f.scene, f);
    const pr = m.proj, p = f.at(pr.x || 140, pr.h);
    this.x = p.x;
    this.y = p.y;
    this.vx = f.facing * (pr.speed || 19);
    this.x0 = p.x;
    // reach: jangkauan ujung bola dari tubuh, dalam pecahan lebar arena
    this.range = pr.reach ? CFG.W * pr.reach - (pr.x || 140) - 26 : Infinity;
    this.m = m;
    this.kind = 'mid';
    this.projectile = true;
    this.power = 1;
    this.vis = this.scene.add.image(p.x, p.y, 'fx_soccer').setDepth(33).setScale(0.8);
    Sound.play('heavy');
  }
  rect() { return circleRect(this.x, this.y, 26); }
  explode() {
    if (this.dead) return;
    this.scene.fx.hit(this.x, this.y, true, 0xffffff);
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp, m = this.m;
    this.x += this.vx;
    this.vis.setPosition(this.x, this.y).setAngle(this.vis.angle + this.vx * 2.2);
    if (this.t % 2 === 0) sc.fx.image('fx_line', this.x - Math.sign(this.vx) * 50, this.y + rnd(-14, 14), { from: 0.25, to: 0.35, alpha: 0.6, ms: 120, add: false });
    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      sc.applyHit(f, vic, {
        dmg: m.dmg, hitstun: m.hitstun, blockstun: m.blockstun, push: m.push, kd: m.kd, launch: m.launch,
        heavy: true, srcX: this.x - Math.sign(this.vx) * 30, x: this.x, y: this.y,
      });
      this.explode();
      return false;
    }
    const gone = Math.abs(this.x - this.x0) / this.range;
    this.vis.setAlpha(gone > 0.8 ? Math.max(0, (1 - gone) * 5) : 1);
    if (gone >= 1 || this.x < -60 || this.x > CFG.W + 60) { this.vis.destroy(); return false; }
    return true;
  }
}

// ---------------------------------------------------------------------
// PAK JEF — Lemparan Bola Basket Api (lawan yang terkena langsung jatuh)
// ---------------------------------------------------------------------
class FireBasket extends Actor {
  constructor(f, x, y) {
    super(f.scene, f);
    const sc = this.scene;
    this.x = x;
    this.y = y;
    this.vx = f.facing * 16;
    this.kind = 'mid';
    this.projectile = true;
    this.power = 2;
    this.vis = sc.add.container(x, y).setDepth(33);
    this.glow = sc.add.image(0, 0, 'fx_glow').setTint(0xff5a1a).setBlendMode(ADD()).setScale(1.8).setAlpha(0.85);
    this.ball = sc.add.image(0, 0, 'fx_basket').setScale(1.05);
    this.vis.add([this.glow, this.ball]);
  }
  rect() { return circleRect(this.x, this.y, 34); }
  explode() {
    if (this.dead) return;
    const sc = this.scene;
    Sound.play('fire');
    sc.fx.image('fx_glow', this.x, this.y, { tint: 0xff7a1a, from: 1, to: 3.4, ms: 340 });
    sc.fx.burst(sc.fx.sparks, this.x, this.y, 14, 0xffb14a);
    for (let i = 0; i < 6; i++) sc.fx.flameAt(this.x + rnd(-30, 30), this.y + rnd(-20, 20), i % 2 ? 0xff5a1a : 0xffc04a);
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp;
    this.x += this.vx;
    this.vis.setPosition(this.x, this.y);
    this.ball.angle += this.vx * 1.6;
    this.glow.setScale(1.7 + Math.sin(this.t * 0.8) * 0.2);
    sc.fx.flameAt(this.x - Math.sign(this.vx) * 24 + rnd(-8, 8), this.y + rnd(-16, 16), this.t % 2 ? 0xff5a1a : 0xffb030);
    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      sc.applyHit(f, vic, { dmg: 140, kd: true, launch: [9, -10], heavy: true, hitstop: 9, chip: 0.25, blockstun: 18, push: 12, srcX: this.x, x: this.x, y: this.y, noGain: true });
      sc.shake(200, 0.01);
      this.explode();
      return false;
    }
    if (this.x < -80 || this.x > CFG.W + 80) { this.vis.destroy(); return false; }
    return true;
  }
}

JUTSU.firebasket = function (f) {
  const fx = f.fx;
  f.setPose('flex');
  return {
    step(t) {
      if (t < 12) {
        // bola basket menyala di tangan
        const p = f.at(60, 300);
        fx.flameAt(p.x + rnd(-25, 25), p.y + rnd(-15, 15), t % 2 ? 0xff5a1a : 0xffc04a);
        return true;
      }
      if (t === 12) {
        f.setPose('throwball');
        const p = f.at(150, 210);
        new FireBasket(f, p.x, p.y);
        Sound.play('whoosh');
        Sound.play('fire');
      }
      return t < 34;
    },
  };
};

// ---------------------------------------------------------------------
// PAK JEF — ULTIMATE: Tendangan Bola Petir Super (tembus tangkisan)
// ---------------------------------------------------------------------
JUTSU.superkick = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('flex');
  return {
    step(t) {
      if (t <= 36) {
        if (t % 3 === 0) zapAt(sc, f.x + rnd(-80, 80), f.y - rnd(30, 300), 0xbff4ff);
        fx.auraAt(f.x + rnd(-90, 90), f.y - rnd(0, 300), t % 2 ? 0x7fd8ff : 0x4cd964);
        if (t % 12 === 0) Sound.play('charge');
        if (t === 32) sc.flash(100, 200, 240, 255);
        return true;
      }
      if (t === 37) {
        f.setPose('kickball');
        const p = f.at(150, 80);
        new ThunderBall(f, p.x, p.y, { breakGuard: true });
        fx.shock(p.x, f.ground, 0x7fd8ff, 2.8);
        Sound.play('heavy');
        Sound.play('explosion');
        sc.shake(300, 0.016);
      }
      return t < 62;
    },
  };
};
