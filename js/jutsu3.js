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
// KING ANDRI — petir dari pukulan & tendangan (melesat setengah layar,
// mendorong lawan jauh ke belakang)
// ---------------------------------------------------------------------
class LightningBolt extends Actor {
  constructor(f, m) {
    super(f.scene, f);
    const sc = this.scene, pr = m.proj;
    const p = f.at(pr.x || 120, pr.h);
    this.x = this.x0 = p.x;
    this.y = p.y;
    this.vx = f.facing * (pr.speed || 20);
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
    this.glow = sc.add.image(0, 0, 'fx_glow').setTint(0x3fa8ff).setBlendMode(ADD()).setScale(1.4 * s, 0.8 * s).setAlpha(0.7);
    this.bolt = sc.add.image(0, 0, 'fx_bolt0').setTint(0xbff4ff).setBlendMode(ADD()).setScale(s).setFlipX(flip);
    this.bolt2 = sc.add.image(0, 0, 'fx_bolt1').setTint(0x5fe0ff).setBlendMode(ADD()).setScale(s * 0.9, s * 1.3).setFlipX(flip);
    this.vis.add([this.glow, this.bolt2, this.bolt]);
    if (this.vy) this.vis.setAngle(Phaser.Math.RadToDeg(Math.atan2(this.vy, Math.abs(this.vx))) * f.facing);
    Sound.play('shuriken');
  }
  rect() { return { x: this.x - 50 * this.s, y: this.y - 32 * this.s, w: 100 * this.s, h: 64 * this.s }; }
  explode() {
    if (this.dead) return;
    zapAt(this.scene, this.x, this.y, 0xbff4ff);
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp, m = this.m;
    this.x += this.vx;
    this.y += this.vy;
    this.vis.setPosition(this.x, this.y);
    // petir berkedip: ganti bentuk tiap langkah
    this.bolt.setTexture('fx_bolt' + (this.t % 3));
    this.bolt2.setTexture('fx_bolt' + ((this.t + 1) % 3));
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
      if (this.y > f.ground - 10) zapAt(sc, this.x, f.ground - 10, 0xbff4ff);
      this.vis.destroy();
      return false;
    }
    return true;
  }
}

// Percikan listrik kecil
function zapAt(sc, x, y, color) {
  sc.fx.image('fx_bolt' + rnd(0, 2), x, y, { tint: color, from: 0.4, to: 0.9, angle: rnd(0, 180), ms: 160 });
  sc.fx.image('fx_bolt' + rnd(0, 2), x, y, { tint: 0xffffff, from: 0.3, to: 0.7, angle: rnd(0, 180), ms: 120 });
  sc.fx.burst(sc.fx.sparks, x, y, 8, color);
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
  f.setPose('charge'); // mengumpulkan bola energi di tangan
  Sound.play('charge');
  return {
    step(t) {
      if (t <= 24) {
        const p = f.at(22, 125);
        ball.setPosition(p.x, p.y).setScale(0.3 + t * 0.045 + Math.sin(t) * 0.05);
        const a = Math.random() * Math.PI * 2;
        fx.auraAt(p.x + Math.cos(a) * 90, p.y + Math.sin(a) * 70, 0x9fe8ff);
        if (t === 12) Sound.play('rasengan');
        return true;
      }
      const hand = f.at(150, 185);
      const len = f.facing > 0 ? CFG.W + 60 - hand.x : hand.x + 60;
      if (t === 25) {
        f.setPose('palm');
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
// KING ANDRI — ULTIMATE: Laser Merah Langit
// Melompat tinggi, melayang, lalu menembakkan laser merah dari mata ke arah
// lawan di bawah. Lawan yang terkena terlempar jauh ke belakang.
// ---------------------------------------------------------------------
JUTSU.skylaser = function (f) {
  const sc = f.scene, fx = f.fx;
  const HOVER = 180; // ketinggian melayang (dari tanah ke kaki)
  let glow = sc.add.image(f.x, f.y - 150, 'fx_glow').setTint(0xff2020).setBlendMode(ADD()).setDepth(19).setAlpha(0);
  let beam = null, spot = null;
  let phase = 'ready', pt = 0, tx = 0, ty = 0;
  f.setPose('aura');
  // sinar yang tercetak di pose 'eyebeam' sudah dihapus; laser hanya digambar oleh game
  const EYEBEAM_FOOT = 0;
  const eye = () => f.at(49, 182); // posisi mata menyala pada pose 'eyebeam'
  const api = { offsetY: 0 };
  const done = () => {
    api.offsetY = 0;
    f.tintOverride = null;
    if (glow) { fadeOut(sc, glow, 200); glow = null; }
    if (beam) { beam.destroy(); beam = null; }
    if (spot) { spot.destroy(); spot = null; }
  };
  return Object.assign(api, {
    step(t) {
      pt++;
      const vic = f.opp;
      if (phase === 'ready') {
        // ancang-ancang: tubuh berkilat merah
        f.tintOverride = t % 4 < 2 ? 0xff7a7a : 0xffc0c0;
        fx.auraAt(f.x + rnd(-60, 60), f.y - rnd(0, 250), 0xff4040);
        if (pt >= 8) {
          phase = 'rise';
          pt = 0;
          f.setPose('dash');
          f.onGround = false;
          f.vy = -26;
          Sound.play('jump');
          Sound.play('whoosh');
          fx.shock(f.x, f.ground, 0xff3030, 2.6);
          fx.dust(f.x, f.ground, 6);
        }
        return true;
      }
      if (phase === 'rise') {
        // meluncur ke posisi tembak: lawan berada di depan-bawah
        const want = Phaser.Math.Clamp(vic.x - f.facing * 300, CFG.WALL, CFG.W - CFG.WALL);
        f.x += (want - f.x) * 0.1;
        f.vx = 0;
        if (pt % 2 === 0) f.afterimage(0xff4040, 0.4, 180);
        if (f.y <= f.ground - HOVER || f.vy >= 0) {
          phase = 'aim';
          pt = 0;
          f.setPose('eyebeam');
          api.offsetY = EYEBEAM_FOOT;
          tx = vic.x;
          ty = vic.y - 110;
        }
        return true;
      }
      if (phase === 'aim' || phase === 'fire') {
        f.vy = -CFG.GRAVITY; // melayang di udara
        f.vx = 0;
        const e = eye();
        if (glow) glow.setPosition(e.x, e.y).setScale(1.2 + Math.sin(t) * 0.25).setAlpha(0.9);
      }
      if (phase === 'aim') {
        f.tintOverride = pt % 4 < 2 ? 0xff9090 : 0xffffff;
        if (pt === 1) Sound.play('charge');
        if (pt >= 10) {
          phase = 'fire';
          pt = 0;
          f.tintOverride = 0xffb0b0;
          beam = makeBeam(sc, 0xff1a1a, 0xff6060);
          spot = sc.add.image(tx, ty, 'fx_glow').setTint(0xff3030).setBlendMode(ADD()).setDepth(34);
          Sound.play('explosion');
          Sound.play('fire');
          sc.flash(120, 255, 60, 60);
        }
        return true;
      }
      if (phase === 'fire') {
        // laser mengikuti lawan
        tx = Phaser.Math.Linear(tx, vic.x, 0.15);
        ty = Phaser.Math.Linear(ty, vic.y - 110, 0.15);
        const e = eye();
        const len = Phaser.Math.Distance.Between(e.x, e.y, tx, ty) + 30;
        const th = pt <= 56 ? 46 + Math.sin(pt * 2.1) * 6 : Math.max(0, 46 * (1 - (pt - 56) / 10));
        beam.setPosition(e.x, e.y).set(len * Math.min(1, pt / 4), th, 1);
        beam.setRotation(Math.atan2(ty - e.y, tx - e.x));
        spot.setPosition(tx, ty).setScale(1.6 + Math.sin(pt) * 0.3);
        if (pt % 3 === 0) fx.burst(fx.sparks, tx, ty, 3, 0xff8080);
        if (pt % 4 === 0) sc.shake(70, 0.008);
        if (pt % 6 === 0) fx.flameAt(tx + rnd(-30, 30), f.ground, 0xff3030, 1);
        if (pt >= 5 && pt <= 55 && pt % 5 === 0 && rectsOverlap(circleRect(tx, ty, 80), vic.hurtbox())) {
          const last = pt === 55;
          sc.applyHit(f, vic, last
            ? { dmg: 140, kd: true, launch: [24, -15], heavy: true, hitstop: 16, chip: 0.5, blockstun: 24, push: 20, srcX: f.x, x: tx, y: ty, noGain: true }
            : { dmg: 22, hitstun: 26, blockstun: 14, push: 3, chip: 0.5, hitstop: 2, srcX: f.x, x: tx, y: ty, noGain: true });
          if (last) {
            sc.flash(220, 255, 80, 80);
            sc.shake(450, 0.02);
            fx.image('fx_glow', tx, ty, { tint: 0xff4040, from: 1, to: 5, ms: 420 });
            fx.shock(tx, f.ground, 0xff3030, 4);
          }
        }
        if (pt >= 66) {
          done();
          phase = 'fall';
          pt = 0;
          f.setPose('dash');
        }
        return true;
      }
      // turun kembali ke tanah lalu selesai
      f.vx = 0;
      return !f.onGround && pt < 90;
    },
    cancel: done,
  });
};
