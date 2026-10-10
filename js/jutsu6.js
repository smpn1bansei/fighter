// =====================================================================
// JURUS KARAKTER GELOMBANG 6: Almusbar + api pukulan Mbak Nita
// (memakai Actor, ADD, rnd, circleRect, fadeOut dari jutsu.js dan zapAt dari jutsu3.js)
// =====================================================================

// ---------------------------------------------------------------------
// Semburan api dari pukulan (Mbak Nita) — menjangkau 25% lebar arena
// ---------------------------------------------------------------------
class FlameShot extends Actor {
  constructor(f, m) {
    super(f.scene, f);
    const sc = this.scene, pr = m.proj;
    const p = f.at(pr.x || 110, pr.h);
    this.x = this.x0 = p.x;
    this.y = p.y;
    this.vx = f.facing * (pr.speed || 16);
    // reach: jangkauan ujung api dari tubuh (pecahan arena, default 25%); wind: versi angin putih
    this.range = CFG.W * (pr.reach || 0.25) - (pr.x || 110) - (pr.reach ? 100 : 40);
    this.wind = !!pr.wind;
    this.m = m;
    this.kind = 'mid';
    this.projectile = true;
    this.power = 1;
    const flip = f.facing < 0;
    this.vis = sc.add.container(p.x, p.y).setDepth(32);
    const w = this.wind;
    this.glow = sc.add.image(0, 0, 'fx_glow').setTint(w ? 0x9fe8ff : 0xff6a1a).setBlendMode(ADD()).setScale(1.3, 0.8).setAlpha(0.8);
    this.flame = w
      ? sc.add.image(0, 0, 'fx_slash').setTint(0xffffff).setBlendMode(ADD()).setScale(0.7, 0.8).setFlipX(flip)
      : sc.add.image(0, 0, 'fx_flame').setTint(0xffa040).setBlendMode(ADD()).setScale(1.1, 1.3).setAngle(flip ? -90 : 90);
    this.core = sc.add.image(0, 0, 'fx_glow').setTint(w ? 0xffffff : 0xfff0b0).setBlendMode(ADD()).setScale(0.55);
    this.vis.add([this.glow, this.flame, this.core]);
    Sound.play(w ? 'whoosh' : 'fire');
  }
  rect() { return { x: this.x - 40, y: this.y - 34, w: 80, h: 68 }; }
  explode() {
    if (this.dead) return;
    const sc = this.scene;
    sc.fx.image('fx_glow', this.x, this.y, { tint: this.wind ? 0x9fe8ff : 0xff7a1a, from: 0.6, to: 2.2, ms: 220 });
    if (!this.wind) for (let i = 0; i < 4; i++) sc.fx.flameAt(this.x + rnd(-20, 20), this.y + rnd(-15, 15), i % 2 ? 0xff5a1a : 0xffc04a);
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp, m = this.m;
    this.x += this.vx;
    this.vis.setPosition(this.x, this.y);
    this.flame.scaleX = 1.1 + Math.sin(this.t * 1.4) * 0.15;
    if (this.wind) sc.fx.auraAt(this.x - Math.sign(this.vx) * 20, this.y + rnd(-12, 12), 0xdff6ff);
    else sc.fx.flameAt(this.x - Math.sign(this.vx) * 20 + rnd(-6, 6), this.y + rnd(-12, 12), this.t % 2 ? 0xff5a1a : 0xffb030);
    const gone = Math.abs(this.x - this.x0) / this.range;
    this.vis.setAlpha(gone > 0.7 ? Math.max(0, (1 - gone) * 3.3) : 1);
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

// ---------------------------------------------------------------------
// ALMUSBAR — ULTIMATE: Tendangan Bola Petir
// Bola sepak berlapis petir menyeret lawan sampai tepi arena paling belakang.
// ---------------------------------------------------------------------
// opts.breakGuard: walau ditangkis, lawan tetap terdorong sampai ujung arena
// opts.shatter   : perisai lawan hancur, serangan tetap kena penuh
class ThunderBall extends Actor {
  constructor(f, x, y, opts) {
    super(f.scene, f);
    const sc = this.scene;
    this.opts = opts || {};
    this.x = x;
    this.y = y;
    this.vx = f.facing * 19;
    this.kind = 'big';
    this.projectile = true;
    this.power = 3;
    this.phase = 'fly';
    this.vis = sc.add.container(x, y).setDepth(33);
    this.glow = sc.add.image(0, 0, 'fx_glow').setTint(0x7fd8ff).setBlendMode(ADD()).setScale(2.2).setAlpha(0.8);
    this.bolt = sc.add.image(0, 0, 'fx_bolt0').setTint(0xbff4ff).setBlendMode(ADD()).setScale(0.9, 1.4);
    this.bolt2 = sc.add.image(0, 0, 'fx_bolt1').setTint(0x5fe0ff).setBlendMode(ADD()).setScale(0.9, 1.4).setAngle(90);
    this.ball = sc.add.image(0, 0, 'fx_soccer').setScale(1.1);
    this.vis.add([this.glow, this.bolt, this.bolt2, this.ball]);
  }
  rect() { return circleRect(this.x, this.y, 46); }
  explode() {
    if (this.dead) return;
    const sc = this.scene;
    zapAt(sc, this.x, this.y, 0xbff4ff);
    sc.fx.image('fx_glow', this.x, this.y, { tint: 0x7fd8ff, from: 1, to: 5, ms: 400 });
    sc.fx.shock(this.x, this.owner.ground, 0x7fd8ff, 4);
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp;
    this.x += this.vx;
    this.vis.setPosition(this.x, this.y);
    this.ball.angle += this.vx * 2;
    this.bolt.setTexture('fx_bolt' + (this.t % 3)).setAngle(rnd(0, 180));
    this.bolt2.setTexture('fx_bolt' + ((this.t + 1) % 3)).setAngle(rnd(0, 180));
    if (this.t % 2 === 0) sc.fx.burst(sc.fx.sparks, this.x - Math.sign(this.vx) * 30, this.y + rnd(-20, 20), 2, 0xbff4ff);

    if (this.phase === 'carry' && this.guarded) {
      // lawan menangkis: tetap terdorong mundur dalam posisi bertahan
      this.pt++;
      vic.x = this.x + Math.sign(this.vx) * 70;
      vic.vx = 0;
      vic.hitstun = vic.t + 12;
      if (this.pt % 4 === 0) sc.fx.block(vic.x - Math.sign(this.vx) * 50, vic.y - 160, vic.def.color2);
      if (this.pt % 3 === 0) sc.fx.dust(vic.x, vic.ground, 2);
      const atWall = vic.x <= CFG.WALL + 2 || vic.x >= CFG.W - CFG.WALL - 2;
      if (atWall || this.pt > 80) {
        sc.applyHit(f, vic, { dmg: 120, chip: 0.5, blockstun: 24, push: 4, heavy: true, hitstop: 12, srcX: this.x - Math.sign(this.vx) * 60, x: vic.x, y: this.y, noGain: true });
        Sound.play('explosion');
        sc.shake(400, 0.018);
        this.explode();
        return false;
      }
      return true;
    }

    if (this.phase === 'carry') {
      this.pt++;
      vic.x = this.x + Math.sign(this.vx) * 40;
      vic.vx = 0;
      if (this.pt % 3 === 0) zapAt(sc, vic.x + rnd(-30, 30), vic.y - rnd(80, 240), 0xbff4ff);
      const atWall = vic.x <= CFG.WALL + 2 || vic.x >= CFG.W - CFG.WALL - 2;
      if (this.pt % 6 === 0 && !atWall) {
        sc.applyHit(f, vic, { dmg: 20, hitstun: 30, push: 0, hitstop: 1, force: true, srcX: this.x - Math.sign(this.vx) * 60, x: vic.x, y: this.y, noGain: true });
      }
      if (atWall || this.pt > 80 || vic.ko) {
        sc.applyHit(f, vic, { dmg: 160, kd: true, launch: [12, -16], heavy: true, hitstop: 18, force: true, srcX: this.x - Math.sign(this.vx) * 60, x: vic.x, y: this.y, noGain: true });
        Sound.play('explosion');
        sc.shake(550, 0.024);
        sc.flash(220, 200, 240, 255);
        this.explode();
        return false;
      }
      return true;
    }

    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      const guarding = vic.state === 'guard' || vic.state === 'blockstun';
      if (this.opts.shatter && guarding) shatterShield(sc, vic, this.x);
      const res = sc.applyHit(f, vic, { dmg: 30, hitstun: 40, blockstun: 22, push: 4, chip: 0.35, heavy: true, unblockable: !!this.opts.shatter, srcX: this.x, x: this.x, y: this.y, hitstop: 8, noGain: true });
      if (res === 'hit') {
        this.phase = 'carry';
        this.pt = 0;
        this.vx = Math.sign(this.vx) * 16;
        Sound.play('explosion');
        return true;
      }
      if (res === 'block' && this.opts.breakGuard) {
        this.phase = 'carry';
        this.guarded = true;
        this.pt = 0;
        this.vx = Math.sign(this.vx) * 15;
        Sound.play('explosion');
        return true;
      }
      this.explode();
      return false;
    }
    if (this.x < -100 || this.x > CFG.W + 100) { this.vis.destroy(); return false; }
    return true;
  }
}

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
      sc.applyHit(f, vic, { dmg: 115, kd: true, launch: [9, -10], heavy: true, hitstop: 9, chip: 0.25, blockstun: 18, push: 12, srcX: this.x, x: this.x, y: this.y, noGain: true });
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


// Perisai lawan pecah berkeping-keping
function shatterShield(sc, vic, srcX) {
  const dir = Math.sign(vic.x - srcX) || 1;
  const p = vic.at(62, 150);
  for (let i = 0; i < 14; i++) {
    const shard = sc.add.image(p.x + rnd(-20, 20), p.y + rnd(-120, 120), 'fx_diamond')
      .setTint(vic.def.color2).setBlendMode(ADD()).setDepth(34).setScale(rnd(4, 9) / 10).setAngle(rnd(0, 360));
    sc.tweens.add({
      targets: shard, x: shard.x + dir * rnd(60, 220), y: shard.y + rnd(-80, 140), angle: shard.angle + rnd(-360, 360),
      alpha: 0, duration: rnd(380, 650), ease: 'Cubic.easeOut', onComplete: () => shard.destroy(),
    });
  }
  sc.fx.image('fx_ring', p.x, p.y, { tint: 0xffffff, from: 0.5, to: 2.2, ms: 260, scaleY: 1.4 });
  sc.fx.popup(vic.x, vic.y - 330, 'PERISAI HANCUR!', '#bff4ff', 30);
  Sound.play('block');
  Sound.play('explosion');
  sc.flash(120, 220, 245, 255);
}
