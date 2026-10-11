// =====================================================================
// JURUS ALMUSBAR
// =====================================================================

// ---------------------------------------------------------------------
// ALMUSBAR — Lemparan Bola: bola dilempar dari tangan, lawan terjatuh
// ---------------------------------------------------------------------
class BallShot extends Actor {
  constructor(f, x, y) {
    super(f.scene, f);
    this.x = x;
    this.y = y;
    this.vx = f.facing * 17;
    this.vy = -2;
    this.kind = 'mid';
    this.projectile = true;
    this.power = 1;
    this.vis = this.scene.add.image(x, y, 'fx_ball').setDepth(33).setScale(0.9);
  }
  rect() { return circleRect(this.x, this.y, 24); }
  explode() {
    if (this.dead) return;
    const sc = this.scene;
    sc.fx.image('fx_ring', this.x, this.y, { tint: 0xffffff, from: 0.2, to: 1.1, ms: 200 });
    sc.fx.burst(sc.fx.sparks, this.x, this.y, 10, 0xffffff);
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp;
    if (this.phase === 'shove') {
      const d = Math.min(16, this.left);
      vic.x = Phaser.Math.Clamp(vic.x + this.dir * d, CFG.WALL, CFG.W - CFG.WALL);
      this.left -= d;
      vic.vx = 0;
      vic.hitstun = vic.t + 10;
      if (this.t % 3 === 0) sc.fx.dust(vic.x, vic.ground, 2);
      const wall = vic.x <= CFG.WALL || vic.x >= CFG.W - CFG.WALL;
      if (this.left <= 0 || wall) { this.vis.destroy(); return false; }
      return true;
    }
    this.vy += 0.12;
    this.x += this.vx;
    this.y += this.vy;
    this.vis.setPosition(this.x, this.y).setAngle(this.vis.angle + this.vx * 2.5);
    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      const res = sc.applyHit(f, vic, { dmg: 140, kd: true, launch: [10, -12], heavy: true, hitstop: 9, chip: 0.25, blockstun: 20, push: 4, srcX: this.x, x: this.x, y: this.y, noGain: true });
      Sound.play('heavy');
      if (res === 'block') {
        // ditangkis: lawan tetap terdorong sejauh 30% arena
        this.vis.setVisible(false);
        this.projectile = false;
        this.phase = 'shove';
        this.dir = Math.sign(this.vx);
        this.left = CFG.W * 0.3;
        sc.fx.hit(this.x, this.y, true, 0xffffff);
        return true;
      }
      this.explode();
      return false;
    }
    if (this.y > f.ground - 10) {
      this.y = f.ground - 10;
      this.vy = -Math.abs(this.vy) * 0.6; // memantul di tanah
      sc.fx.dust(this.x, f.ground, 2);
    }
    if (this.x < -60 || this.x > CFG.W + 60) { this.vis.destroy(); return false; }
    return true;
  }
}

JUTSU.ballthrow = function (f) {
  f.setPose('ballready');
  Sound.play('whoosh');
  return {
    step(t) {
      if (t === 12) {
        f.setPose('throw');
        const p = f.at(130, 205);
        new BallShot(f, p.x, p.y);
        Sound.play('whoosh');
      }
      return t < 32;
    },
  };
};

JUTSU.thunderkick = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('charge');
  return {
    step(t) {
      if (t <= 34) {
        // tubuh dialiri petir
        if (t % 3 === 0) zapAt(sc, f.x + rnd(-70, 70), f.y - rnd(30, 280), 0xbff4ff);
        fx.auraAt(f.x + rnd(-80, 80), f.y - rnd(0, 280), 0x7fd8ff);
        if (t % 12 === 0) Sound.play('charge');
        if (t === 30) sc.flash(100, 200, 240, 255);
        return true;
      }
      if (t === 35) {
        f.setPose('soccer');
        const p = f.at(150, 70);
        new ThunderBall(f, p.x, p.y, { shatter: true });
        fx.shock(p.x, f.ground, 0x7fd8ff, 2.4);
        Sound.play('heavy');
        Sound.play('shuriken');
        sc.shake(250, 0.012);
      }
      return t < 60;
    },
  };
};
