// =====================================================================
// JURUS KARAKTER GELOMBANG 2: Marthadin, Fatim, Tio
// (memakai Actor, ADD, rnd, circleRect, fadeOut dari jutsu.js)
// =====================================================================

// ---------------------------------------------------------------------
// MARTHADIN — Tendangan Putar Udara: melompat memutar & melepas bilah angin
// ---------------------------------------------------------------------
class WindBlade extends Actor {
  constructor(f, x, y) {
    super(f.scene, f);
    const sc = this.scene;
    this.x = x;
    this.y = y;
    this.vx = f.facing * 13;
    this.kind = 'low';
    this.projectile = true;
    this.power = 1;
    this.vis = sc.add.container(x, y).setDepth(32);
    const glow = sc.add.image(0, 0, 'fx_glow').setTint(0x7fd8ff).setBlendMode(ADD()).setScale(1.3, 0.9).setAlpha(0.7);
    const back = sc.add.image(-f.facing * 18, 0, 'fx_slash').setTint(0x7fd8ff).setBlendMode(ADD())
      .setScale(0.7, 0.9).setFlipX(f.facing < 0).setAlpha(0.8);
    const blade = sc.add.image(0, 0, 'fx_slash').setTint(0xdff6ff).setBlendMode(ADD()).setScale(0.9, 1.1).setFlipX(f.facing < 0);
    this.vis.add([glow, back, blade]);
  }
  rect() { return { x: this.x - 36, y: this.y - 55, w: 72, h: 110 }; }
  explode(silent) {
    if (this.dead) return;
    const sc = this.scene;
    if (!silent) Sound.play('wind');
    sc.fx.image('fx_ring', this.x, this.y, { tint: 0x9fe8ff, from: 0.3, to: 1.6, ms: 260 });
    sc.fx.burst(sc.fx.sparks, this.x, this.y, 12, 0xdff6ff);
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp;
    this.x += this.vx;
    this.y = Phaser.Math.Linear(this.y, f.ground - 120, 0.15);
    this.vis.setPosition(this.x, this.y);
    this.vis.scaleY = 1 + Math.sin(this.t * 0.8) * 0.08;
    if (this.t % 2 === 0) sc.fx.auraAt(this.x - Math.sign(this.vx) * 30, this.y + rnd(-30, 30), 0xdff6ff);
    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      sc.applyHit(f, vic, { dmg: 100, hitstun: 26, blockstun: 16, push: 12, chip: 0.2, heavy: true, srcX: this.x, x: this.x, y: this.y, hitstop: 7, noGain: true });
      this.explode();
      return false;
    }
    if (this.x < -100 || this.x > CFG.W + 100) { this.vis.destroy(); return false; }
    return true;
  }
}

JUTSU.tornadokick = function (f) {
  const sc = f.scene, fx = f.fx;
  let ring = null, hitDone = false;
  f.setPose('ballet');
  Sound.play('wind');
  return {
    step(t) {
      if (t <= 6) {
        fx.auraAt(f.x + rnd(-40, 40), f.y - rnd(0, 250), 0xdff6ff);
        return true;
      }
      if (t === 7) {
        f.setPose('tornado');
        f.vy = -12;
        f.onGround = false;
        f.vx = f.facing * 5;
        ring = sc.add.image(f.x, f.y - 100, 'fx_wind').setDepth(23).setTint(0x9fe8ff).setBlendMode(ADD()).setScale(1.1, 1.3);
        Sound.play('whoosh');
      }
      if (ring) {
        ring.setPosition(f.x, f.y - 100).setAngle(Math.sin(t * 0.9) * 12 * f.facing);
        ring.scaleX = 1.1 + Math.sin(t * 1.4) * 0.1;
      }
      // tendangan memutar mengenai lawan yang dekat
      if (!hitDone && t > 7 && t < 22) {
        if (rectsOverlap(f.boxRect([60, 120, 190, 170]), f.opp.hurtbox())) {
          hitDone = true;
          const p = f.at(110, 120);
          sc.applyHit(f, f.opp, { dmg: 40, hitstun: 24, blockstun: 12, push: 6, chip: 0.2, x: p.x, y: p.y, hitstop: 5, noGain: true });
        }
      }
      // tendangan jarak jauh: bilah angin
      if (t === 15) {
        const p = f.at(120, 110);
        new WindBlade(f, p.x, p.y);
        fx.slash(p.x, p.y, f.facing, 0xdff6ff);
        Sound.play('wind');
      }
      if (f.onGround && t > 9) {
        if (ring) { fadeOut(sc, ring, 150); ring = null; }
        f.vx *= 0.7;
      }
      return t < 40;
    },
    cancel() { if (ring) { ring.destroy(); ring = null; } },
  };
};

// ---------------------------------------------------------------------
// MARTHADIN — ULTIMATE: Putaran Tornado (menghisap lawan ke pusaran)
// ---------------------------------------------------------------------
JUTSU.cyclone = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('cyclone');
  let tornado = sc.add.container(f.x, f.ground).setDepth(31);
  tornado.add(sc.add.image(0, 10, 'fx_beam').setOrigin(0.5, 1).setTint(0x9fe8ff).setBlendMode(ADD()).setScale(2.4, 1.9).setAlpha(0.35));
  const rings = [];
  for (let i = 0; i < 7; i++) {
    const r = sc.add.image(0, -i * 62 - 20, 'fx_wind').setTint(i % 2 ? 0xdff6ff : 0x7fd8ff).setBlendMode(ADD());
    r.baseScale = 0.55 + i * 0.16;
    r.setScale(r.baseScale, 0.9 + i * 0.08);
    rings.push(r);
    tornado.add(r);
  }
  tornado.setScale(0.1, 1).setAlpha(0);
  sc.tweens.add({ targets: tornado, scaleX: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
  Sound.play('wind');
  let captured = false, hits = 0, cd = 0, phase = 'spin', pt = 0;
  return {
    step(t) {
      pt++;
      const vic = f.opp;
      if (tornado) {
        tornado.setPosition(f.x, f.ground);
        rings.forEach((r, i) => {
          r.x = Math.sin(t * 0.45 + i * 0.8) * (10 + i * 3);
          r.scaleX = r.baseScale * (1 + Math.sin(t * 0.9 + i) * 0.06);
          r.setAlpha(0.65 + Math.sin(t * 1.3 + i * 2) * 0.3);
        });
        if (t % 2 === 0) fx.dust(f.x + rnd(-90, 90), f.ground, 1);
        else fx.auraAt(f.x + rnd(-120, 120), f.ground - rnd(0, 420), 0xdff6ff);
        if (t % 20 === 0) Sound.play('wind');
      }
      if (phase === 'spin') {
        f.vx = f.facing * (captured ? 1.5 : 4.5);
        if (cd > 0) cd--;
        if (captured) {
          if (vic.ko) { phase = 'end'; pt = 0; return true; }
          vic.x = Phaser.Math.Linear(vic.x, f.x + f.facing * 40, 0.25);
          vic.vx = 0;
          if (pt % 6 === 0) {
            hits++;
            const last = hits >= 9;
            sc.applyHit(f, vic, last
              ? { dmg: 110, kd: true, launch: [7, -21], heavy: true, hitstop: 14, force: true, srcX: f.x - f.facing * 40, x: vic.x, y: f.ground - 200, noGain: true }
              : { dmg: 20, hitstun: 30, push: 0, hitstop: 2, force: true, srcX: f.x, x: vic.x + rnd(-40, 40), y: f.ground - rnd(80, 300), noGain: true });
            if (!last) Sound.play('light');
            else {
              Sound.play('explosion');
              sc.shake(450, 0.018);
              fx.shock(f.x, f.ground, 0x9fe8ff, 4);
              phase = 'end';
              pt = 0;
            }
          }
          if (phase === 'spin' && pt > 70) { phase = 'end'; pt = 0; }
        } else if (cd === 0 && rectsOverlap({ x: f.x - 115, y: f.ground - 470, w: 230, h: 470 }, vic.hurtbox())) {
          const res = sc.applyHit(f, vic, { dmg: 20, hitstun: 30, blockstun: 16, push: 0, chip: 0.35, hitstop: 4, srcX: f.x, x: vic.x, y: f.ground - 180, noGain: true });
          if (res === 'hit') { captured = true; hits = 1; pt = 0; f.grabbing = true; }
          else if (res === 'block') { cd = 12; vic.vx = f.facing * 10; }
        }
        if (!captured && t >= 80) { phase = 'end'; pt = 0; }
      } else {
        f.vx *= 0.8;
        f.grabbing = false;
        if (pt === 1 && tornado) { fadeOut(sc, tornado, 300, { scaleX: 1.6 }); tornado = null; }
        return pt < 22;
      }
      return true;
    },
    cancel() { if (tornado) { tornado.destroy(); tornado = null; } },
  };
};

// ---------------------------------------------------------------------
// FATIM — Shuriken Rahasia: tiga shuriken dari balik jubah
// ---------------------------------------------------------------------
class Shuriken extends Actor {
  constructor(f, x, y) {
    super(f.scene, f);
    this.x = x;
    this.y = y;
    this.vx = f.facing * 14;
    this.kind = 'mid';
    this.projectile = true;
    this.power = 1;
    this.vis = this.scene.add.image(x, y, 'fx_shuriken').setDepth(32).setScale(1.1);
  }
  rect() { return circleRect(this.x, this.y, 22); }
  explode() {
    if (this.dead) return;
    this.scene.fx.burst(this.scene.fx.sparks, this.x, this.y, 8, 0xdfe6ff);
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp;
    this.x += this.vx;
    this.vis.setPosition(this.x, this.y);
    this.vis.angle += 35 * Math.sign(this.vx);
    if (this.t % 2 === 0) sc.fx.burst(sc.fx.pixels, this.x - Math.sign(this.vx) * 14, this.y, 1, 0xc9c0ff);
    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      sc.applyHit(f, vic, { dmg: 35, hitstun: 18, blockstun: 10, push: 4, chip: 0.2, srcX: this.x, x: this.x, y: this.y, hitstop: 4, noGain: true });
      this.explode();
      return false;
    }
    if (this.x < -60 || this.x > CFG.W + 60) { this.vis.destroy(); return false; }
    return true;
  }
}

JUTSU.shuriken = function (f) {
  const fx = f.fx;
  f.setPose('recoil'); // tangan masuk ke balik jubah
  return {
    step(t) {
      if (t < 8) {
        if (t % 2 === 0) fx.auraAt(f.x + rnd(-30, 30), f.y - rnd(100, 220), 0x9d8cff);
        return true;
      }
      if (t === 8 || t === 13 || t === 18) {
        f.setPose(t === 13 ? 'claw' : 'stab');
        const p = f.at(130, 215 - ((t - 8) / 5) * 35);
        new Shuriken(f, p.x, p.y);
        Sound.play('shuriken');
      }
      return t < 34;
    },
  };
};

// ---------------------------------------------------------------------
// FATIM — ULTIMATE: Tusukan Seribu Bayangan
// ---------------------------------------------------------------------
JUTSU.shadowstrike = function (f) {
  const sc = f.scene, fx = f.fx;
  let phase = 'rush', pt = 0, hits = 0;
  f.setPose('dash');
  Sound.play('dash');
  return {
    step() {
      pt++;
      const vic = f.opp;
      if (phase === 'rush') {
        f.vx = f.facing * 18;
        if (pt % 2 === 0) f.afterimage(0x6a5cff, 0.55, 220);
        if (pt % 3 === 0) fx.dust(f.x - f.facing * 40, f.ground, 1);
        if (rectsOverlap(f.boxRect([90, 150, 140, 260]), vic.hurtbox())) {
          const p = f.at(120, 190);
          const res = sc.applyHit(f, vic, { dmg: 20, hitstun: 40, blockstun: 22, push: 2, chip: 0.35, hitstop: 6, srcX: f.x, x: p.x, y: p.y, noGain: true });
          f.vx = 0;
          if (res === 'hit') { phase = 'flurry'; pt = 0; hits = 1; }
          else if (res === 'block') { f.vx = -f.facing * 6; phase = 'end'; pt = 0; }
        }
        if (phase === 'rush' && pt >= 34) { f.setPose('groundstrike'); phase = 'end'; pt = 0; }
      } else if (phase === 'flurry') {
        f.vx = 0;
        if (vic.ko) { phase = 'end'; pt = 0; return true; }
        vic.x = Phaser.Math.Linear(vic.x, f.x + f.facing * 130, 0.3);
        vic.vx = 0;
        // bayangan tangan yang bergerak sangat cepat
        if (pt % 4 === 0) {
          f.setPose(pt % 8 === 0 ? 'stab' : 'claw');
          f.afterimage(0x6a5cff, 0.6, 200, rnd(-30, 30));
          f.afterimage(0xc9c0ff, 0.35, 160, -f.facing * rnd(20, 50));
          const p = f.at(rnd(110, 160), rnd(150, 240));
          fx.slash(p.x, p.y, f.facing, 0xc9c0ff);
        }
        if (pt % 6 === 0) {
          hits++;
          const p = f.at(140, 200);
          if (hits < 10) {
            sc.applyHit(f, vic, { dmg: 18, hitstun: 40, push: 0, hitstop: 2, force: true, srcX: f.x, x: p.x + rnd(-20, 20), y: p.y + rnd(-50, 50), noGain: true });
            Sound.play('light');
          } else {
            f.setPose('kick');
            fx.image('fx_slash', p.x, p.y - 20, { tint: 0xc9c0ff, from: 1, to: 2.6, ms: 300, flipX: f.facing < 0 });
            sc.applyHit(f, vic, { dmg: 110, kd: true, launch: [11, -17], heavy: true, hitstop: 14, force: true, srcX: f.x, x: p.x, y: p.y, noGain: true });
            sc.shake(380, 0.016);
            phase = 'end';
            pt = 0;
          }
        }
      } else {
        f.vx *= 0.8;
        return pt < 24;
      }
      return true;
    },
  };
};

// ---------------------------------------------------------------------
// TIO — Terjangan Kilat: menabrak lawan dengan kecepatan tinggi
// ---------------------------------------------------------------------
JUTSU.rush = function (f) {
  const sc = f.scene, fx = f.fx;
  let phase = 'ready', pt = 0;
  f.setPose('crouch');
  return {
    step() {
      pt++;
      if (phase === 'ready') {
        if (pt % 2 === 0) fx.auraAt(f.x + rnd(-40, 40), f.y - rnd(0, 120), 0xffa53d);
        if (pt >= 8) { phase = 'dash'; pt = 0; f.setPose('dash'); Sound.play('dash'); }
      } else if (phase === 'dash') {
        f.vx = f.facing * 17;
        if (pt % 2 === 0) f.afterimage(0xffa53d, 0.5, 200);
        if (pt % 3 === 0) fx.dust(f.x - f.facing * 50, f.ground, 1);
        const vic = f.opp;
        if (rectsOverlap(f.boxRect([80, 140, 130, 240]), vic.hurtbox())) {
          const p = f.at(100, 160);
          const res = sc.applyHit(f, vic, { dmg: 120, kd: true, launch: [14, -10], heavy: true, hitstop: 10, chip: 0.2, blockstun: 18, push: 14, srcX: f.x, x: p.x, y: p.y, noGain: true });
          if (res !== 'miss') {
            f.vx = -f.facing * (res === 'hit' ? 4 : 7);
            f.setPose('punch');
            if (res === 'hit') {
              sc.shake(260, 0.014);
              fx.shock(p.x, f.ground, 0xffa53d, 2.6);
            }
            phase = 'end';
            pt = 0;
          }
        }
        if (phase === 'dash' && pt >= 32) { phase = 'end'; pt = 0; f.setPose('crouch'); }
      } else {
        f.vx *= 0.8;
        return pt < 18;
      }
      return true;
    },
  };
};

// ---------------------------------------------------------------------
// TIO — ULTIMATE: Salto Badai (terjang, tendang salto ke udara, hantam ke tanah)
// ---------------------------------------------------------------------
JUTSU.stormsalto = function (f) {
  const sc = f.scene, fx = f.fx;
  let phase = 'rush', pt = 0, ring = null;
  f.setPose('dash');
  Sound.play('dash');
  return {
    step() {
      pt++;
      const vic = f.opp;
      if (phase === 'rush') {
        f.vx = f.facing * 19;
        if (pt % 2 === 0) f.afterimage(0xffa53d, 0.55, 220);
        if (pt % 3 === 0) fx.dust(f.x - f.facing * 50, f.ground, 1);
        if (rectsOverlap(f.boxRect([80, 140, 130, 240]), vic.hurtbox())) {
          f.setPose('salto');
          const p = f.at(90, 190);
          const res = sc.applyHit(f, vic, { dmg: 50, kd: true, launch: [1.2, -21], heavy: true, hitstop: 8, chip: 0.35, blockstun: 22, push: 14, srcX: f.x, x: p.x, y: p.y, noGain: true });
          if (res === 'hit') {
            phase = 'salto';
            pt = 0;
            f.vx = 0;
            f.vy = -21;
            f.onGround = false;
            f.grabbing = true;
            ring = sc.add.image(f.x, f.y - 140, 'fx_wind').setDepth(23).setTint(0xffd27a).setBlendMode(ADD()).setScale(0.9, 2.2);
            Sound.play('whoosh');
          } else if (res === 'block') {
            f.vx = -f.facing * 7;
            phase = 'end';
            pt = 0;
          }
        }
        if (phase === 'rush' && pt >= 34) { f.setPose('crouch'); phase = 'end'; pt = 0; }
      } else if (phase === 'salto') {
        f.x = Phaser.Math.Linear(f.x, vic.x - f.facing * 60, 0.15);
        if (ring) ring.setPosition(f.x, f.y - 130).setAngle(pt * 25);
        if (pt % 2 === 0) f.afterimage(0xffd27a, 0.45, 200);
        if (pt === 18) {
          if (ring) { fadeOut(sc, ring, 120); ring = null; }
          f.setPose('stomp');
          f.vy = 27;
          if (!vic.ko) { vic.vy = Math.max(vic.vy, 24); vic.vx = 0; }
          Sound.play('whoosh');
          phase = 'slam';
          pt = 0;
        }
      } else if (phase === 'slam') {
        if (pt % 2 === 0) f.afterimage(0xffa53d, 0.5, 180);
        if (f.onGround || pt > 50) {
          const x = vic.x;
          sc.applyHit(f, vic, { dmg: 170, kd: true, launch: [7, -9], heavy: true, hitstop: 16, force: true, srcX: f.x - f.facing * 30, x, y: f.ground - 60, noGain: true });
          Sound.play('explosion');
          Sound.play('rock');
          sc.shake(520, 0.024);
          sc.flash(200, 255, 230, 180);
          fx.rockBurst(x, f.ground, 16);
          fx.crack(x, f.ground + 6, 1.6);
          fx.shock(x, f.ground, 0xffa53d, 4.2);
          fx.image('fx_glow', x, f.ground - 40, { tint: 0xffa53d, from: 1, to: 5, ms: 400 });
          f.grabbing = false;
          phase = 'end';
          pt = 0;
        }
      } else {
        f.vx *= 0.8;
        return pt < 26;
      }
      return true;
    },
    cancel() { if (ring) { ring.destroy(); ring = null; } },
  };
};
