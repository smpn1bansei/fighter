// =====================================================================
// JURUS KARAKTER GELOMBANG 3: Pak Jef, King Andri
// (memakai Actor, ADD, rnd, circleRect, fadeOut dari jutsu.js)
// =====================================================================

// Kecepatan awal agar benda melengkung (gravitasi g) tiba di (x1, y1) dalam T langkah.
function aimArc(x0, y0, x1, y1, T, g) {
  return { vx: (x1 - x0) / T, vy: (y1 - y0 - 0.5 * g * T * T) / T };
}

// ---------------------------------------------------------------------
// Batu yang dilempar (dipakai jurus & ultimate Pak Jef)
// ---------------------------------------------------------------------
class Boulder extends Actor {
  constructor(f, x, y, opts) {
    super(f.scene, f);
    this.x = x;
    this.y = y;
    this.vx = opts.vx;
    this.vy = opts.vy;
    this.g = opts.g;
    this.opts = opts;
    this.r = 40 * opts.scale;
    this.kind = opts.kind || 'mid';
    this.projectile = true;
    this.power = opts.power || 2;
    this.vis = this.scene.add.image(x, y, 'fx_boulder').setDepth(32).setScale(opts.scale);
  }
  rect() { return circleRect(this.x, this.y, this.r * 0.85); }
  explode(silent) {
    if (this.dead) return;
    const sc = this.scene, big = this.opts.big;
    if (!silent) Sound.play(big ? 'explosion' : 'rock');
    sc.fx.rockBurst(this.x, Math.min(this.y, this.owner.ground), big ? 30 : 12);
    sc.fx.image('fx_glow', this.x, this.y, { tint: 0xffd9a0, from: 0.5, to: big ? 5 : 2.2, ms: big ? 420 : 260 });
    if (big) {
      sc.fx.shock(this.x, this.owner.ground, 0xffd27a, 4.6);
      sc.fx.crack(this.x, this.owner.ground + 6, 1.8);
      sc.shake(650, 0.026);
      sc.flash(180, 255, 230, 190);
    } else {
      sc.shake(180, 0.01);
    }
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp, o = this.opts;
    this.vy += this.g;
    this.x += this.vx;
    this.y += this.vy;
    this.vis.setPosition(this.x, this.y);
    this.vis.angle += this.vx * 1.4;
    if (this.t % 3 === 0) sc.fx.dust(this.x - Math.sign(this.vx) * this.r * 0.6, this.y, 1);
    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      sc.applyHit(f, vic, Object.assign({ srcX: this.x - Math.sign(this.vx) * 40, x: this.x, y: this.y, noGain: true }, o.hit));
      this.explode();
      return false;
    }
    // menghantam tanah: gelombang kejut melukai lawan di dekatnya
    if (this.y + this.r * 0.6 >= f.ground) {
      this.y = f.ground - this.r * 0.6;
      if (o.splash && vic.onGround && Math.abs(vic.x - this.x) < o.splash.r && vic.hurtbox()) {
        sc.applyHit(f, vic, Object.assign({ srcX: this.x, x: vic.x, y: f.ground - 80, noGain: true }, o.splash.hit));
      }
      this.explode();
      return false;
    }
    if (this.x < -200 || this.x > CFG.W + 200) { this.vis.destroy(); return false; }
    return true;
  }
}

// ---------------------------------------------------------------------
// PAK JEF — Lemparan Batu Meriam
// ---------------------------------------------------------------------
JUTSU.cannonrock = function (f) {
  const sc = f.scene, fx = f.fx;
  let rock = null;
  f.setPose('smash');
  return {
    step(t) {
      if (t === 2) {
        const p = f.at(110, 0);
        fx.crack(p.x, f.ground + 6, 0.8);
        fx.rockBurst(p.x, f.ground, 8);
        Sound.play('rock');
        sc.shake(150, 0.008);
        rock = sc.add.image(p.x, f.ground + 20, 'fx_boulder').setDepth(32).setScale(0.6);
      }
      if (rock && t <= 10) {
        const p = f.at(110, 20 + t * 8);
        rock.setPosition(p.x, p.y);
      }
      if (t === 11) f.setPose('flex'); // mengangkat batu ke atas kepala
      if (rock && t > 10 && t < 18) {
        const p = f.at(10, 360);
        rock.x = Phaser.Math.Linear(rock.x, p.x, 0.4);
        rock.y = Phaser.Math.Linear(rock.y, p.y, 0.4);
        rock.angle -= 3;
      }
      if (t === 18) f.setPose('throw');
      if (rock && t === 18) {
        const vic = f.opp, x0 = rock.x, y0 = rock.y, g = 0.6;
        const T = Phaser.Math.Clamp(Math.abs(vic.x - x0) / 16, 12, 38);
        const v = aimArc(x0, y0, vic.x, vic.y - 140, T, g);
        rock.destroy();
        rock = null;
        new Boulder(f, x0, y0, {
          scale: 0.6, vx: v.vx, vy: v.vy, g, power: 2,
          hit: { dmg: 120, kd: true, launch: [10, -11], heavy: true, hitstop: 9, chip: 0.2, blockstun: 18, push: 12 },
          splash: { r: 90, hit: { dmg: 70, kd: true, launch: [6, -9], heavy: true, hitstop: 6, chip: 0.2, blockstun: 12, push: 8 } },
        });
        Sound.play('whoosh');
      }
      return t < 36;
    },
    cancel() { if (rock) { rock.destroy(); rock = null; } },
  };
};

// ---------------------------------------------------------------------
// PAK JEF — ULTIMATE: Batu Raksasa (dicabut dari tanah lalu dilempar)
// ---------------------------------------------------------------------
JUTSU.megaboulder = function (f) {
  const sc = f.scene, fx = f.fx;
  let held = null;
  f.setPose('smash');
  return {
    step(t) {
      const spot = f.at(170, 0);
      if (t === 1) {
        fx.crack(spot.x, f.ground + 6, 2);
        Sound.play('rock');
        sc.shake(900, 0.012);
        held = sc.add.image(spot.x, f.ground + 150, 'fx_boulder').setDepth(21).setScale(2.0);
      }
      if (!held) return t < 80;
      if (t <= 30) {
        held.x = spot.x;
        held.y = Phaser.Math.Linear(held.y, f.ground - 120, 0.12);
        if (t % 4 === 0) fx.rockBurst(spot.x + rnd(-60, 60), f.ground, 4);
        if (t % 10 === 0) Sound.play('rock');
      }
      if (t === 31) {
        f.setPose('flex');
        Sound.play('heavy');
      }
      if (t > 31 && t <= 56) {
        const p = f.at(10, 370);
        held.x = Phaser.Math.Linear(held.x, p.x, 0.15);
        held.y = Phaser.Math.Linear(held.y, p.y, 0.15);
        held.angle += 0.6;
      }
      if (t === 57) {
        f.setPose('throw');
        const vic = f.opp, x0 = held.x, y0 = held.y, g = 0.55;
        const T = Phaser.Math.Clamp(Math.abs(vic.x - x0) / 12, 22, 50);
        const v = aimArc(x0, y0, vic.x, vic.y - 120, T, g);
        held.destroy();
        held = null;
        new Boulder(f, x0, y0, {
          scale: 2.0, vx: v.vx, vy: v.vy, g, power: 4, kind: 'big', big: true,
          hit: { dmg: 300, kd: true, launch: [14, -16], heavy: true, hitstop: 18, chip: 0.35, blockstun: 26, push: 18 },
          splash: { r: 170, hit: { dmg: 170, kd: true, launch: [9, -12], heavy: true, hitstop: 12, chip: 0.3, blockstun: 20, push: 12 } },
        });
        Sound.play('whoosh');
      }
      return t < 80;
    },
    cancel() { if (held) { held.destroy(); held = null; } },
  };
};

// ---------------------------------------------------------------------
// KING ANDRI — angin sabit ("pisang angin") dari pukulan & tendangan
// ---------------------------------------------------------------------
class WindCrescent extends Actor {
  constructor(f, m) {
    super(f.scene, f);
    const sc = this.scene, pr = m.proj;
    const p = f.at(pr.x || 120, pr.h);
    this.x = this.x0 = p.x;
    this.y = p.y;
    this.vx = f.facing * (pr.speed || 18);
    this.vy = pr.vy || 0;
    // jangkauan total dari tubuh ~ setengah layar
    this.range = CFG.W * 0.5 - (pr.x || 120) - 40;
    this.m = m;
    this.s = pr.scale || 1;
    this.kind = 'mid';
    this.projectile = true;
    this.power = 1;
    const s = this.s, flip = f.facing < 0;
    this.vis = sc.add.container(p.x, p.y).setDepth(32);
    this.vis.add([
      sc.add.image(0, 0, 'fx_glow').setTint(0x5fe0ff).setBlendMode(ADD()).setScale(1.2 * s, 0.9 * s).setAlpha(0.6),
      sc.add.image(-f.facing * 16 * s, 0, 'fx_slash').setTint(0x5fe0ff).setBlendMode(ADD()).setScale(0.75 * s, 0.95 * s).setFlipX(flip).setAlpha(0.7),
      sc.add.image(0, 0, 'fx_slash').setTint(0xdffaff).setBlendMode(ADD()).setScale(0.85 * s, 1.05 * s).setFlipX(flip),
    ]);
    if (this.vy) this.vis.setAngle(Phaser.Math.RadToDeg(Math.atan2(this.vy, Math.abs(this.vx))) * f.facing);
    Sound.play('whoosh');
  }
  rect() { return { x: this.x - 30 * this.s, y: this.y - 50 * this.s, w: 60 * this.s, h: 100 * this.s }; }
  explode() {
    if (this.dead) return;
    this.scene.fx.burst(this.scene.fx.sparks, this.x, this.y, 8, 0xbff4ff);
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp, m = this.m;
    this.x += this.vx;
    this.y += this.vy;
    this.vis.setPosition(this.x, this.y);
    const gone = Math.abs(this.x - this.x0) / this.range;
    this.vis.setAlpha(gone > 0.75 ? Math.max(0, (1 - gone) * 4) : 1);
    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      sc.applyHit(f, vic, {
        dmg: m.dmg, hitstun: m.hitstun, blockstun: m.blockstun, push: m.push, kd: m.kd, launch: m.launch,
        heavy: m.heavy, srcX: this.x - Math.sign(this.vx) * 30, x: this.x, y: this.y,
      });
      this.explode();
      return false;
    }
    if (gone >= 1 || this.y > f.ground - 10) {
      if (this.y > f.ground - 10) sc.fx.dust(this.x, f.ground, 3);
      this.vis.destroy();
      return false;
    }
    return true;
  }
}

// Sinar panjang sampai tepi layar (Kamehameha & laser)
function makeBeam(sc, outerColor, midColor) {
  const c = sc.add.container(0, 0).setDepth(33);
  const outer = sc.add.image(0, 0, 'fx_hbeam').setOrigin(0, 0.5).setTint(outerColor).setBlendMode(ADD());
  const mid = sc.add.image(0, 0, 'fx_hbeam').setOrigin(0, 0.5).setTint(midColor).setBlendMode(ADD());
  const core = sc.add.image(0, 0, 'fx_hbeam').setOrigin(0, 0.5).setTint(0xffffff).setBlendMode(ADD());
  const head = sc.add.image(0, 0, 'fx_glow').setTint(midColor).setBlendMode(ADD());
  const tip = sc.add.image(0, 0, 'fx_glow').setTint(midColor).setBlendMode(ADD());
  c.add([outer, mid, core, head, tip]);
  c.set = (len, th, facing) => {
    const sx = Math.max(0.01, len / 256);
    outer.setScale(sx, th / 64);
    mid.setScale(sx, (th * 0.6) / 64);
    core.setScale(sx, (th * 0.3) / 64);
    head.setScale((th / 64) * 1.6);
    tip.setScale((th / 64) * 1.2).setPosition(len, 0);
    c.scaleX = facing;
    return c;
  };
  return c;
}

// Kotak serangan sinar dari tangan sampai tepi layar
function beamRect(f, hand, len, th) {
  return { x: f.facing > 0 ? hand.x : hand.x - len, y: hand.y - th / 2, w: len, h: th };
}

// ---------------------------------------------------------------------
// KING ANDRI — Kamehameha (sampai tepi layar)
// ---------------------------------------------------------------------
JUTSU.kamehameha = function (f) {
  const sc = f.scene, fx = f.fx;
  let ball = sc.add.image(0, 0, 'fx_glow').setTint(0x7fd8ff).setBlendMode(ADD()).setDepth(33).setScale(0.2);
  let beam = null;
  f.setPose('charge');
  Sound.play('charge');
  return {
    step(t) {
      if (t <= 24) {
        const p = f.at(30, 140);
        ball.setPosition(p.x, p.y).setScale(0.3 + t * 0.045 + Math.sin(t) * 0.05);
        const a = Math.random() * Math.PI * 2;
        fx.auraAt(p.x + Math.cos(a) * 90, p.y + Math.sin(a) * 70, 0x9fe8ff);
        if (t === 12) Sound.play('rasengan');
        return true;
      }
      const hand = f.at(150, 205);
      const len = f.facing > 0 ? CFG.W + 60 - hand.x : hand.x + 60;
      if (t === 25) {
        f.setPose('punch');
        ball.destroy();
        ball = null;
        beam = makeBeam(sc, 0x2a7fff, 0x7fd8ff);
        Sound.play('fire');
        Sound.play('wind');
        sc.shake(300, 0.006);
      }
      if (beam) {
        const grow = Math.min(1, (t - 24) / 6);
        const th = t <= 66 ? 70 + Math.sin(t * 1.7) * 6 : Math.max(0, 70 * (1 - (t - 66) / 12));
        beam.setPosition(hand.x, hand.y).set(len * grow, th, f.facing);
        if (t % 3 === 0) fx.burst(fx.sparks, hand.x, hand.y, 2, 0xbff4ff);
        if (t >= 31 && t <= 61 && (t - 31) % 5 === 0 && rectsOverlap(beamRect(f, hand, len * grow, 72), f.opp.hurtbox())) {
          const last = t === 61;
          sc.applyHit(f, f.opp, last
            ? { dmg: 60, kd: true, launch: [10, -9], heavy: true, hitstop: 10, chip: 0.2, blockstun: 16, push: 10, srcX: hand.x, x: f.opp.x, y: hand.y, noGain: true }
            : { dmg: 16, hitstun: 22, blockstun: 12, push: 3, chip: 0.2, hitstop: 2, srcX: hand.x, x: f.opp.x - f.facing * 20, y: hand.y, noGain: true });
        }
        if (t >= 78) { beam.destroy(); beam = null; }
      }
      return t < 84;
    },
    cancel() {
      if (ball) ball.destroy();
      if (beam) beam.destroy();
      ball = beam = null;
    },
  };
};

// ---------------------------------------------------------------------
// KING ANDRI — ULTIMATE: Sinar Laser Merah (tubuh bercahaya, laser ke tepi layar)
// ---------------------------------------------------------------------
JUTSU.redlaser = function (f) {
  const sc = f.scene, fx = f.fx;
  let glow = sc.add.image(f.x, f.y - 150, 'fx_glow').setTint(0xff2020).setBlendMode(ADD()).setDepth(19);
  let halo = sc.add.image(f.x, f.y - 150, 'fx_glow').setTint(0xff6060).setBlendMode(ADD()).setDepth(23).setAlpha(0);
  let beam = null;
  f.setPose('aura');
  const done = () => {
    f.tintOverride = null;
    if (halo) { halo.destroy(); halo = null; }
    if (glow) { fadeOut(sc, glow, 200); glow = null; }
    if (beam) { beam.destroy(); beam = null; }
  };
  return {
    step(t) {
      if (t <= 45) {
        glow.setPosition(f.x, f.y - 150).setScale(3 + t * 0.04 + Math.sin(t * 0.6) * 0.3).setAlpha(0.9);
        // tubuh berdenyut bercahaya merah
        halo.setPosition(f.x, f.y - 140).setScale(1.6, 3.2).setAlpha(0.25 + Math.sin(t * 0.5) * 0.15);
        f.tintOverride = t % 8 < 4 ? 0xff7a7a : 0xffc0c0;
        if (t % 10 === 0) fx.shock(f.x, f.ground, 0xff3030, 2.2);
        fx.auraAt(f.x + rnd(-90, 90), f.y - rnd(0, 280), t % 2 ? 0xff4040 : 0xffffff);
        if (t % 15 === 1) Sound.play('charge');
        if (t === 40) sc.flash(150, 255, 60, 60);
        return true;
      }
      const hand = f.at(150, 205);
      const len = f.facing > 0 ? CFG.W + 60 - hand.x : hand.x + 60;
      if (t === 46) {
        f.setPose('punch');
        f.tintOverride = 0xffb0b0;
        if (halo) { halo.destroy(); halo = null; }
        beam = makeBeam(sc, 0xff1a1a, 0xff7070);
        Sound.play('explosion');
        Sound.play('fire');
      }
      if (beam) {
        const grow = Math.min(1, (t - 45) / 5);
        const th = t <= 106 ? 120 + Math.sin(t * 2.1) * 12 : Math.max(0, 120 * (1 - (t - 106) / 14));
        beam.setPosition(hand.x, hand.y).set(len * grow, th, f.facing);
        if (glow) glow.setPosition(hand.x, hand.y).setScale(2 + Math.sin(t) * 0.3);
        if (t % 4 === 0) sc.shake(70, 0.007);
        if (t % 2 === 0) fx.burst(fx.sparks, hand.x, hand.y, 2, 0xff8080);
        if (t >= 51 && t <= 106 && (t - 51) % 5 === 0 && rectsOverlap(beamRect(f, hand, len * grow, 110), f.opp.hurtbox())) {
          const last = t === 106;
          sc.applyHit(f, f.opp, last
            ? { dmg: 120, kd: true, launch: [16, -14], heavy: true, hitstop: 16, chip: 0.5, blockstun: 24, push: 16, srcX: hand.x, x: f.opp.x, y: hand.y, noGain: true }
            : { dmg: 22, hitstun: 24, blockstun: 14, push: 2, chip: 0.5, hitstop: 2, srcX: hand.x, x: f.opp.x - f.facing * 20, y: hand.y, noGain: true });
          if (last) sc.flash(200, 255, 80, 80);
        }
        if (t >= 120) done();
      }
      return t < 124;
    },
    cancel: done,
  };
};
