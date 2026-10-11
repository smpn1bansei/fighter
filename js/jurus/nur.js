// =====================================================================
// JURUS NUR HOKAGE
// =====================================================================

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
          const res = sc.applyHit(f, vic, { dmg: 24, hitstun: 30, blockstun: 18, push: 1, chip: 0.2, guard: 'full', srcX: f.x, x: h.x, y: h.y, hitstop: 5, noGain: true });
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
            if (!vic.ko) new WallShove(f, vic, false); // terlempar sampai ujung arena
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
        const res = sc.applyHit(f, vic, { dmg: 20, hitstun: 40, blockstun: 26, push: 2, chip: 0.35, guard: 'full', srcX: this.x, x: this.x, y: this.y, hitstop: 6, noGain: true });
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
