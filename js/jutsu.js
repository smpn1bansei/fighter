// =====================================================================
// JURUS (NINJUTSU)
// Tiap jurus adalah "naskah" yang dijalankan langkah demi langkah.
// step(t) mengembalikan false bila jurus selesai.
// =====================================================================
const ADD = () => Phaser.BlendModes.ADD;

window.rectsOverlap = function (a, b) {
  return !!a && !!b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
};
const circleRect = (x, y, r) => ({ x: x - r, y: y - r, w: r * 2, h: r * 2 });
const rnd = Phaser.Math.Between;

// Objek dinamis di arena (proyektil, pilar api, gelombang batu).
class Actor {
  constructor(scene, owner) {
    this.scene = scene;
    this.owner = owner;
    this.t = 0;
    this.dead = false;
    scene.actors.push(this);
  }
  step() { return true; }
  destroy() { this.dead = true; }
  // Hapus semua gambar milik objek ini (dipanggil saat ronde direset).
  dispose() {
    this.dead = true;
    [].concat(this.vis || [], this.beams || [], this.seal || [], this.sealBase || [], this.sealGlow || []).forEach((o) => o.destroy());
  }
  // Tabrakan dengan proyektil lawan: yang lebih kuat menang.
  clash() {
    if (!this.projectile) return false;
    const r = this.rect();
    for (const o of this.scene.actors) {
      if (o === this || o.dead || !o.projectile || o.owner === this.owner) continue;
      if (!rectsOverlap(r, o.rect())) continue;
      this.scene.fx.hit((this.x + o.x) / 2, (this.y + o.y) / 2, true, 0xffffff);
      Sound.play('explosion');
      if (o.power <= this.power) o.explode(true);
      if (this.power <= o.power) { this.explode(true); return true; }
    }
    return false;
  }
}

// Bola cakra berputar (Rasengan)
function makeOrb(scene, color, accent) {
  const c = scene.add.container(0, 0).setDepth(32);
  const glow = scene.add.image(0, 0, 'fx_glow').setTint(color).setBlendMode(ADD()).setScale(1.7);
  const s1 = scene.add.image(0, 0, 'fx_swirl').setTint(accent).setBlendMode(ADD()).setScale(0.75);
  const s2 = scene.add.image(0, 0, 'fx_swirl').setTint(0xffffff).setBlendMode(ADD()).setScale(0.55).setAngle(60);
  const core = scene.add.image(0, 0, 'fx_glow').setTint(0xffffff).setBlendMode(ADD()).setScale(0.75);
  c.add([glow, s1, s2, core]);
  c.spin = (t) => {
    s1.angle += 23;
    s2.angle -= 31;
    glow.setScale(1.6 + Math.sin(t * 0.7) * 0.18);
  };
  return c;
}

function fadeOut(scene, obj, ms, extra) {
  if (!obj) return;
  const list = [].concat(obj).filter(Boolean);
  scene.tweens.add(Object.assign({ targets: list, alpha: 0, duration: ms || 200, onComplete: () => list.forEach((o) => o.destroy()) }, extra || {}));
}

window.JUTSU = {};

// ---------------------------------------------------------------------
// NUR HOKAGE — Rasengan Cahaya: melesat maju dengan bola cakra
// ---------------------------------------------------------------------
JUTSU.rasengan = function (f) {
  const sc = f.scene, fx = f.fx;
  let orb = makeOrb(sc, 0xffc83d, 0x9fe8ff).setScale(0.2);
  let phase = 'charge', pt = 0, hits = 0;
  Sound.play('rasengan');
  f.setPose('palm');
  const hand = () => f.at(122, 196);
  const end = (burst) => {
    phase = 'end';
    pt = 0;
    if (orb) {
      const o = orb;
      orb = null;
      if (burst) fx.hit(o.x, o.y, true, 0xffd75a);
      fadeOut(sc, o, 180, { scale: burst ? 2 : 0.1 });
    }
  };
  return {
    step(t) {
      pt++;
      const h = hand();
      if (orb) {
        orb.setPosition(h.x, h.y);
        orb.spin(t);
      }
      if (phase === 'charge') {
        orb.setScale(Math.min(1, 0.2 + pt * 0.06));
        fx.auraAt(h.x + rnd(-40, 40), h.y + rnd(-20, 40), 0xffd75a);
        if (pt >= 14) { phase = 'dash'; pt = 0; Sound.play('whoosh'); }
      } else if (phase === 'dash') {
        f.vx = f.facing * 12.5;
        if (pt % 3 === 0) fx.dust(f.x - f.facing * 40, f.ground, 1);
        const vic = f.opp;
        if (rectsOverlap(circleRect(h.x, h.y, 50), vic.hurtbox())) {
          const res = sc.applyHit(f, vic, { dmg: 24, hitstun: 30, blockstun: 18, push: 1, chip: 0.2, srcX: f.x, x: h.x, y: h.y, hitstop: 5, noGain: true });
          if (res === 'block') { f.vx = -f.facing * 7; end(true); }
          else if (res === 'hit') { phase = 'grind'; pt = 0; hits = 1; f.vx = 0; }
        }
        if (phase === 'dash' && pt >= 30) { f.vx = 0; end(false); }
      } else if (phase === 'grind') {
        f.vx = 0;
        const vic = f.opp;
        if (vic.ko) { end(true); return true; }
        vic.x = Phaser.Math.Linear(vic.x, f.x + f.facing * 150, 0.3);
        fx.burst(fx.sparks, h.x, h.y, 2, pt % 2 ? 0xffd75a : 0x9fe8ff);
        if (orb) orb.setScale(1 + Math.sin(pt) * 0.1);
        if (pt % 7 === 0) {
          hits++;
          const last = hits >= 5;
          sc.applyHit(f, vic, last
            ? { dmg: 70, kd: true, launch: [13, -13], heavy: true, hitstop: 12, srcX: f.x, x: h.x, y: h.y, noGain: true }
            : { dmg: 22, hitstun: 30, push: 0, hitstop: 3, srcX: f.x, x: h.x, y: h.y, noGain: true });
          if (last) {
            Sound.play('explosion');
            sc.shake(250, 0.012);
            fx.shock(h.x, f.ground, 0xffd75a, 3);
            end(true);
          }
        }
        if (phase === 'grind' && pt > 60) end(true);
      } else {
        f.vx *= 0.8;
        if (pt >= 18) return false;
      }
      return true;
    },
    cancel() { if (orb) { orb.destroy(); orb = null; } },
  };
};

// ---------------------------------------------------------------------
// NUR HOKAGE — ULTIMATE: Rasen-Shuriken Hokage
// ---------------------------------------------------------------------
function makeShuriken(sc) {
  const c = sc.add.container(0, 0).setDepth(33);
  const halo = sc.add.image(0, 0, 'fx_glow').setTint(0x5fb6ff).setBlendMode(ADD()).setScale(2.2).setAlpha(0.45);
  const blades = sc.add.image(0, 0, 'fx_blade').setTint(0x9fdcff).setScale(0.1).setAlpha(0.85);
  const blades2 = sc.add.image(0, 0, 'fx_blade').setTint(0xffd75a).setBlendMode(ADD()).setScale(0.1).setAlpha(0.7);
  const orb = makeOrb(sc, 0xffc83d, 0x9fe8ff);
  c.add([halo, blades, blades2, orb]);
  c.size = 0;
  c.spin = (t) => {
    blades.angle += 34;
    blades2.angle += 27;
    orb.spin(t);
    halo.setScale(2.2 * c.size + Math.sin(t * 0.5) * 0.15);
  };
  c.grow = (s) => {
    c.size = s;
    blades.setScale(1.05 * s);
    blades2.setScale(0.85 * s);
    orb.setScale(0.9 + 0.5 * s);
  };
  return c;
}

class ShurikenShot extends Actor {
  constructor(f, vis, x, y) {
    super(f.scene, f);
    this.vis = vis;
    this.x = x;
    this.y = y;
    this.vx = f.facing * 11;
    this.kind = 'big';
    this.projectile = true;
    this.power = 3;
    this.phase = 'fly';
    this.hits = 0;
  }
  rect() { return circleRect(this.x, this.y, 70); }
  explode(silent) {
    if (this.dead) return;
    const sc = this.scene;
    if (!silent) Sound.play('explosion');
    sc.fx.hit(this.x, this.y, true, 0x9fe8ff);
    sc.fx.image('fx_glow', this.x, this.y, { tint: 0xffffff, from: 1, to: 6, ms: 450 });
    sc.fx.image('fx_ring', this.x, this.y, { tint: 0x9fe8ff, from: 0.5, to: 4, ms: 500 });
    fadeOut(sc, this.vis, 250, { scale: 2 });
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp;
    this.vis.spin(this.t);
    if (this.phase === 'fly') {
      // turun perlahan dari atas kepala ke depan dada
      this.y = Phaser.Math.Linear(this.y, f.ground - 200, 0.12);
      this.x += this.vx;
      this.vis.setPosition(this.x, this.y);
      if (this.t % 2 === 0) sc.fx.auraAt(this.x - Math.sign(this.vx) * 60, this.y + rnd(-40, 40), 0xdff6ff);
      if (this.t % 18 === 0) Sound.play('wind');
      if (this.clash()) return false;
      if (rectsOverlap(this.rect(), vic.hurtbox())) {
        const res = sc.applyHit(f, vic, { dmg: 20, hitstun: 40, blockstun: 26, push: 2, chip: 0.35, srcX: this.x, x: this.x, y: this.y, hitstop: 6, noGain: true });
        if (res === 'block') { this.explode(); return false; }
        if (res === 'hit') { this.phase = 'trap'; this.pt = 0; this.hits = 1; }
      }
      if (this.x < -150 || this.x > CFG.W + 150) { this.vis.destroy(); return false; }
    } else {
      this.pt++;
      if (vic.ko) { this.explode(); return false; }
      this.x = Phaser.Math.Linear(this.x, vic.x, 0.2);
      this.y = Phaser.Math.Linear(this.y, vic.y - 150, 0.2);
      this.vis.setPosition(this.x, this.y);
      this.vis.grow(Math.min(1.9, this.vis.size + 0.05));
      vic.x = Phaser.Math.Linear(vic.x, this.x, 0.2);
      sc.fx.burst(sc.fx.sparks, this.x + rnd(-80, 80), this.y + rnd(-80, 80), 2, 0xdff6ff);
      if (this.pt % 6 === 0) {
        this.hits++;
        const last = this.hits >= 9;
        sc.applyHit(f, vic, last
          ? { dmg: 120, kd: true, launch: [12, -17], heavy: true, hitstop: 16, srcX: this.x - Math.sign(this.vx) * 50, x: this.x, y: this.y, noGain: true }
          : { dmg: 20, hitstun: 40, push: 0, hitstop: 2, srcX: this.x, x: this.x + rnd(-50, 50), y: this.y + rnd(-50, 50), noGain: true });
        if (!last) Sound.play('light');
        if (last) {
          sc.shake(500, 0.02);
          sc.flash(250, 220, 245, 255);
          this.explode();
          return false;
        }
      }
      if (this.pt > 80) { this.explode(); return false; }
    }
    return true;
  }
}

JUTSU.rasenshuriken = function (f) {
  const sc = f.scene, fx = f.fx;
  let vis = makeShuriken(sc);
  f.setPose('jump');
  const api = {
    offsetY: 0,
    step(t) {
      if (t <= 46) {
        f.setPose('jump');
        api.offsetY = -Math.min(t, 20) * 2;
        const p = f.at(0, 335 - api.offsetY);
        vis.setPosition(p.x, p.y);
        vis.grow(Math.min(1, t / 34));
        vis.spin(t);
        const a = Math.random() * Math.PI * 2;
        fx.auraAt(p.x + Math.cos(a) * 160, p.y + Math.sin(a) * 120, t % 2 ? 0xdff6ff : 0xffd75a);
        if (t === 1) Sound.play('rasengan');
        if (t % 16 === 0) Sound.play('wind');
        if (t === 46) {
          api.offsetY = 0;
          f.setPose('palm2');
          new ShurikenShot(f, vis, p.x, p.y);
          vis = null;
          Sound.play('whoosh');
          fx.slash(f.at(150, 200).x, f.at(150, 200).y, f.facing, 0xdff6ff);
        }
        return true;
      }
      return t < 72;
    },
    cancel() { if (vis) { vis.destroy(); vis = null; } api.offsetY = 0; },
  };
  return api;
};

// ---------------------------------------------------------------------
// SIT HOKAGE — Katon: Bola Api
// ---------------------------------------------------------------------
class Fireball extends Actor {
  constructor(f, x, y) {
    super(f.scene, f);
    const sc = this.scene;
    this.x = x;
    this.y = y;
    this.vx = f.facing * 9.5;
    this.kind = 'low';
    this.projectile = true;
    this.power = 1;
    this.vis = sc.add.container(x, y).setDepth(32);
    this.glow = sc.add.image(0, 0, 'fx_glow').setTint(0xff5a1a).setBlendMode(ADD()).setScale(1.6);
    this.core = sc.add.image(0, 0, 'fx_glow').setTint(0xffe9a8).setBlendMode(ADD()).setScale(0.7);
    this.flame = sc.add.image(0, 0, 'fx_flame').setTint(0xffa040).setBlendMode(ADD()).setScale(1.3, 1.1)
      .setAngle(f.facing > 0 ? -90 : 90);
    this.vis.add([this.glow, this.flame, this.core]);
  }
  rect() { return circleRect(this.x, this.y, 34); }
  explode(silent) {
    if (this.dead) return;
    const sc = this.scene;
    if (!silent) Sound.play('fire');
    sc.fx.image('fx_glow', this.x, this.y, { tint: 0xff7a1a, from: 1, to: 3.5, ms: 350 });
    sc.fx.burst(sc.fx.sparks, this.x, this.y, 14, 0xffb14a);
    for (let i = 0; i < 6; i++) sc.fx.flameAt(this.x + rnd(-30, 30), this.y + rnd(-20, 20), i % 2 ? 0xff5a1a : 0xffc04a);
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp;
    this.x += this.vx;
    // turun mendekati tanah agar bisa dilompati
    if (this.t < 40) this.y += 2.3;
    this.vis.setPosition(this.x, this.y);
    this.glow.setScale(1.5 + Math.sin(this.t * 0.8) * 0.2);
    this.flame.setScale(1.3 + Math.sin(this.t * 1.3) * 0.15, 1.1);
    sc.fx.flameAt(this.x - Math.sign(this.vx) * 20 + rnd(-8, 8), this.y + rnd(-14, 14), this.t % 2 ? 0xff5a1a : 0xffb030);
    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      sc.applyHit(f, vic, { dmg: 110, hitstun: 26, blockstun: 16, push: 12, chip: 0.2, heavy: true, srcX: this.x, x: this.x, y: this.y, hitstop: 7, noGain: true });
      this.explode();
      return false;
    }
    if (this.x < -80 || this.x > CFG.W + 80) { this.vis.destroy(); return false; }
    return true;
  }
}

JUTSU.fireball = function (f) {
  const fx = f.fx;
  f.setPose(f.def.frames.seal);
  Sound.play('seal');
  return {
    step(t) {
      if (t <= 10) {
        const p = f.at(10, 215);
        if (t % 2 === 0) fx.auraAt(p.x + rnd(-20, 20), p.y + rnd(-20, 20), 0xffb030);
      }
      if (t === 11) { f.setPose('fireball'); Sound.play('fire'); }
      if (t === 16) {
        const p = f.at(170, 205);
        new Fireball(f, p.x, p.y);
        f.setPose('firepalm');
      }
      return t < 34;
    },
  };
};

// ---------------------------------------------------------------------
// SIT HOKAGE — ULTIMATE: Kuchiyose, Pilar Api
// ---------------------------------------------------------------------
class FirePillar extends Actor {
  constructor(f) {
    super(f.scene, f);
    const sc = this.scene;
    this.x = f.opp.x;
    this.y = f.ground;
    this.kind = 'pillar';
    this.sealBase = sc.add.image(this.x, f.ground + 4, 'fx_seal').setDepth(7).setTint(0x7a0a00)
      .setAlpha(0.8).setScale(0.01, 0.003);
    this.seal = sc.add.image(this.x, f.ground + 4, 'fx_seal').setDepth(7).setTint(0xff5a2a)
      .setBlendMode(ADD()).setScale(0.01, 0.003);
    this.sealGlow = sc.add.image(this.x, f.ground + 4, 'fx_glow').setDepth(7).setTint(0xff3b1f)
      .setBlendMode(ADD()).setScale(3, 0.8).setAlpha(0);
    this.beams = [];
    this.hits = 0;
  }
  rect() { return { x: this.x - 80, y: this.y - 720, w: 160, h: 720 }; }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp, t = this.t;
    const ERUPT = 45;
    this.seal.angle += t < ERUPT ? 3 : 8;
    this.sealBase.angle = this.seal.angle;
    if (t < ERUPT) {
      if (t < 24) this.x = Phaser.Math.Linear(this.x, vic.x, 0.18);
      const s = Math.min(1.15, t / 12);
      this.seal.setPosition(this.x, f.ground + 4).setScale(s, s * 0.28);
      this.sealBase.setPosition(this.x, f.ground + 6).setScale(s * 1.02, s * 0.29).setAngle(this.seal.angle);
      this.sealGlow.setPosition(this.x, f.ground + 4).setAlpha(0.3 + Math.sin(t * 0.5) * 0.2);
      if (t % 3 === 0) sc.fx.flameAt(this.x + rnd(-130, 130), f.ground, 0xff5a1a);
      if (t === 24) Sound.play('seal');
    }
    if (t === ERUPT) {
      Sound.play('explosion');
      Sound.play('fire');
      sc.shake(700, 0.012);
      sc.flash(160, 255, 140, 60);
      const outer = sc.add.image(this.x, f.ground + 10, 'fx_beam').setOrigin(0.5, 1).setDepth(31)
        .setTint(0xff5a1a).setBlendMode(ADD()).setScale(2.2, 0.1);
      const inner = sc.add.image(this.x, f.ground + 10, 'fx_beam').setOrigin(0.5, 1).setDepth(31)
        .setTint(0xffe08a).setBlendMode(ADD()).setScale(1.0, 0.1);
      this.beams = [outer, inner];
      sc.tweens.add({ targets: this.beams, scaleY: 2.9, duration: 140, ease: 'Back.easeOut' });
      sc.fx.shock(this.x, f.ground, 0xff7a1a, 4);
    }
    if (t > ERUPT && t < ERUPT + 52) {
      for (const b of this.beams) b.scaleX *= 1 + Math.sin(t * 1.7) * 0.02;
      for (let i = 0; i < 3; i++) {
        sc.fx.flameAt(this.x + rnd(-70, 70), f.ground - rnd(0, 560), i % 2 ? 0xff5a1a : 0xffc04a);
      }
      if ((t - ERUPT) % 8 === 1) {
        this.hits++;
        const last = this.hits >= 7;
        const hb = vic.hurtbox();
        if (rectsOverlap(this.rect(), hb)) {
          const cy = hb.y + hb.h * 0.5;
          sc.applyHit(f, vic, last
            ? { dmg: 100, kd: true, launch: [5, -21], heavy: true, hitstop: 14, chip: 0.35, blockstun: 20, srcX: this.x - f.facing * 40, x: vic.x, y: cy, noGain: true }
            : { dmg: 26, hitstun: 26, blockstun: 16, push: 0, chip: 0.35, hitstop: 2, srcX: this.x - f.facing * 40, x: vic.x + rnd(-30, 30), y: cy + rnd(-60, 60), noGain: true });
          vic.x = Phaser.Math.Linear(vic.x, this.x, 0.25);
          if (last) sc.shake(400, 0.018);
        }
        if (!last) Sound.play('fire');
      }
    }
    if (t === ERUPT + 52) {
      fadeOut(sc, this.beams, 350, { scaleX: 0.2 });
      fadeOut(sc, [this.seal, this.sealBase, this.sealGlow], 450);
      for (let i = 0; i < 8; i++) sc.fx.dust(this.x + rnd(-60, 60), f.ground - rnd(0, 300), 1);
      return false;
    }
    return true;
  }
}

JUTSU.firepillar = function (f) {
  const fx = f.fx;
  f.setPose(f.def.frames.seal);
  return {
    step(t) {
      if (t <= 14) {
        const p = f.at(10, 215);
        fx.auraAt(p.x + rnd(-30, 30), p.y + rnd(-30, 30), 0xffb030);
      }
      if (t === 15) {
        f.setPose('summon');
        new FirePillar(f);
        const p = f.at(40, 0);
        fx.shock(p.x, f.ground, 0xff3b1f, 1.6);
      }
      if (t === 60) f.setPose('boom');
      if (t > 15 && t < 60 && t % 4 === 0) fx.flameAt(f.at(40, 5).x + rnd(-30, 30), f.ground, 0xff5a1a);
      return t < 92;
    },
  };
};

// ---------------------------------------------------------------------
// RANTI — Retakan Bumi: gelombang batu menjalar di tanah
// ---------------------------------------------------------------------
class GroundWave extends Actor {
  constructor(f, x) {
    super(f.scene, f);
    this.x = x;
    this.y = f.ground - 50;
    this.dir = f.facing;
    this.vx = this.dir * 9;
    this.kind = 'low';
  }
  rect() { return { x: this.x - 45, y: this.owner.ground - 120, w: 90, h: 120 }; }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp, g = f.ground;
    this.x += this.dir * 9;
    if (this.t % 4 === 0) {
      sc.fx.rockBurst(this.x, g, 4);
      sc.fx.crack(this.x, g + 6, 0.55);
    }
    if (this.t % 6 === 0) {
      for (let i = 0; i < 3; i++) {
        const r = sc.add.image(this.x + rnd(-25, 25), g + 10, 'fx_rock').setDepth(23)
          .setScale(rnd(20, 34) / 10).setAngle(rnd(0, 360));
        sc.tweens.add({ targets: r, y: g - rnd(30, 70), duration: 110, yoyo: true, hold: 90, onComplete: () => r.destroy() });
      }
      if (this.t % 12 === 0) Sound.play('rock');
    }
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      sc.applyHit(f, vic, { dmg: 120, kd: true, launch: [6, -13], heavy: true, chip: 0.2, blockstun: 16, push: 10, hitstop: 8, srcX: this.x - this.dir * 30, x: vic.x, y: g - 60, noGain: true });
      sc.fx.rockBurst(vic.x, g, 14);
      sc.shake(200, 0.01);
      return false;
    }
    return this.t < 75 && this.x > 0 && this.x < CFG.W;
  }
}

JUTSU.groundwave = function (f) {
  const fx = f.fx;
  f.setPose('bluefist');
  Sound.play('charge');
  return {
    step(t) {
      if (t <= 12) {
        const p = f.at(110, 190);
        fx.auraAt(p.x + rnd(-15, 15), p.y + rnd(-15, 15), 0x5fb6ff);
      }
      if (t === 13) {
        f.setPose('groundpunch');
        const p = f.at(150, 0);
        fx.rockBurst(p.x, f.ground, 14);
        fx.crack(p.x, f.ground + 6, 1.2);
        fx.shock(p.x, f.ground, 0x5fb6ff, 2.4);
        f.scene.shake(220, 0.012);
        Sound.play('rock');
        Sound.play('heavy');
        new GroundWave(f, p.x);
      }
      return t < 36;
    },
  };
};

// ---------------------------------------------------------------------
// RANTI — ULTIMATE: Byakugo, Tinju Seratus Kekuatan
// ---------------------------------------------------------------------
JUTSU.byakugo = function (f) {
  const sc = f.scene, fx = f.fx;
  let seal = sc.add.image(0, 0, 'fx_diamond').setTint(0xc77dff).setBlendMode(ADD()).setDepth(30).setScale(0.3);
  let phase = 'seal', pt = 0, healed = 0;
  f.setPose('byakugo');
  Sound.play('seal');
  const api = {
    step(t) {
      pt++;
      if (phase === 'seal') {
        const p = f.at(2, 268);
        seal.setPosition(p.x, p.y).setScale(0.5 + Math.sin(t * 0.5) * 0.15);
        for (let i = 0; i < 2; i++) fx.auraAt(f.x + rnd(-80, 80), f.y - rnd(0, 260), i ? 0xc77dff : 0x3fe0a0);
        if (healed < 130) {
          const add = Math.min(3, 130 - healed, CFG.MAX_HP - f.hp);
          f.hp += add;
          healed += 3;
        }
        if (t === 10) Sound.play('heal');
        if (t === 30) fx.popup(f.x, f.y - 320, 'BYAKUGO!', '#e3b5ff', 34);
        if (pt >= 45) {
          phase = 'dash';
          pt = 0;
          f.setPose('bluefist');
          Sound.play('whoosh');
          fadeOut(sc, seal, 300);
          seal = null;
        }
      } else if (phase === 'dash') {
        f.vx = f.facing * 17;
        const p = f.at(110, 190);
        fx.auraAt(p.x + rnd(-20, 20), p.y + rnd(-20, 20), 0x5fb6ff);
        if (pt % 3 === 0) fx.dust(f.x - f.facing * 40, f.ground, 1);
        const vic = f.opp;
        if (rectsOverlap(f.boxRect([105, 180, 140, 230]), vic.hurtbox())) {
          f.setPose('bigpunch');
          f.vx = 0;
          const hp = f.at(170, 215);
          const res = sc.applyHit(f, vic, { dmg: 300, kd: true, launch: [19, -15], heavy: true, hitstop: 18, chip: 0.35, blockstun: 26, push: 18, srcX: f.x, x: hp.x, y: hp.y, noGain: true });
          if (res !== 'miss') {
            Sound.play('explosion');
            sc.shake(550, 0.025);
            sc.flash(220, 255, 255, 255);
            fx.image('fx_glow', hp.x, hp.y, { tint: 0x9fe8ff, from: 1, to: 6, ms: 420 });
            fx.image('fx_ring', hp.x, hp.y, { tint: 0xffffff, from: 0.5, to: 5, ms: 450 });
            fx.rockBurst(vic.x, f.ground, 18);
            fx.crack(vic.x, f.ground + 6, 1.6);
            phase = 'after';
            pt = 0;
          }
        }
        if (phase === 'dash' && pt >= 34) {
          f.setPose('bigpunch');
          fx.slash(f.at(140, 215).x, f.at(140, 215).y, f.facing, 0x9fe8ff);
          phase = 'after';
          pt = 0;
        }
      } else {
        f.vx *= 0.82;
        return pt < 30;
      }
      return true;
    },
    cancel() { if (seal) { seal.destroy(); seal = null; } },
  };
  return api;
};
