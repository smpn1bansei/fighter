// =====================================================================
// JURUS KARAKTER GELOMBANG 9: Siti Hokage & Ranti (sprite baru)
// (memakai Actor, ADD, rnd, circleRect, rectsOverlap, fadeOut dari jutsu.js,
//  makeBeam & zapAt dari jutsu3.js, WallShove dari jutsu8.js)
// =====================================================================

// ---------------------------------------------------------------------
// SITI HOKAGE — Laser Angin Berputar (dua tangan)
// Lawan terhempas ke ujung arena; menangkis = setengah damage.
// ---------------------------------------------------------------------
JUTSU.windlaser = function (f) {
  const sc = f.scene, fx = f.fx;
  let beam = null, rings = [], hit = false;
  f.setPose('palm');
  const clear = () => {
    if (beam) { beam.destroy(); beam = null; }
    rings.forEach((r) => r.destroy());
    rings = [];
  };
  return {
    step(t) {
      const hand = f.at(140, 205);
      if (t <= 12) {
        fx.auraAt(hand.x + rnd(-30, 30), hand.y + rnd(-30, 30), 0xdff6ff);
        if (t === 1) Sound.play('charge');
        return true;
      }
      const len = f.facing > 0 ? CFG.W + 60 - hand.x : hand.x + 60;
      if (t === 13) {
        f.setPose('beam');
        beam = makeBeam(sc, 0x7fd8ff, 0xdff6ff);
        for (let i = 0; i < 6; i++) {
          rings.push(sc.add.image(hand.x, hand.y, 'fx_wind').setTint(i % 2 ? 0xffffff : 0x9fe8ff).setBlendMode(ADD()).setDepth(34).setAngle(90));
        }
        Sound.play('wind');
        Sound.play('whoosh');
        sc.shake(200, 0.008);
      }
      if (beam) {
        const grow = Math.min(1, (t - 12) / 5);
        const th = t <= 46 ? 54 + Math.sin(t * 1.8) * 8 : Math.max(0, 54 * (1 - (t - 46) / 10));
        beam.setPosition(hand.x, hand.y).set(len * grow, th, f.facing);
        // cincin angin berputar menyusuri laser
        rings.forEach((r, i) => {
          const k = ((t * 0.06 + i / rings.length) % 1) * len * grow;
          r.setPosition(hand.x + f.facing * k, hand.y).setScale(0.3, 0.55 + Math.sin(t * 0.8 + i) * 0.1).setAlpha(th / 60);
        });
        if (!hit && t >= 16 && rectsOverlap({ x: f.facing > 0 ? hand.x : hand.x - len, y: hand.y - 40, w: len, h: 80 }, f.opp.hurtbox())) {
          hit = true;
          const vic = f.opp;
          const res = sc.applyHit(f, vic, { dmg: 130, hitstun: 50, heavy: true, guard: 'half', hitstop: 10, push: 0, srcX: hand.x, x: vic.x, y: hand.y, noGain: true });
          if (res !== 'miss' && !vic.ko) new WallShove(f, vic, sc.lastGuarded);
          sc.shake(300, 0.014);
          Sound.play('explosion');
        }
        if (t >= 58) clear();
      }
      return t < 62;
    },
    cancel: clear,
  };
};

// ---------------------------------------------------------------------
// Bola energi dari dada.
//  erase  : menghapus semua serangan/proyektil lawan yang dilewati
//  reach  : jangkauan dalam pecahan lebar arena (0 = sampai ujung)
//  hit    : data serangan
// ---------------------------------------------------------------------
class ChestOrb extends Actor {
  constructor(f, x, y, o) {
    super(f.scene, f);
    const sc = this.scene;
    this.o = o;
    this.x = this.x0 = x;
    this.y = y;
    this.vx = f.facing * (o.speed || 13);
    this.range = o.reach ? CFG.W * o.reach - 120 : Infinity;
    this.kind = 'big';
    this.projectile = true;
    this.power = o.erase ? 99 : 3;
    this.vis = sc.add.container(x, y).setDepth(33);
    this.glow = sc.add.image(0, 0, 'fx_glow').setTint(o.color).setBlendMode(ADD()).setScale(2.6).setAlpha(0.85);
    this.swirl = sc.add.image(0, 0, 'fx_swirl').setTint(0xffffff).setBlendMode(ADD()).setScale(1.1);
    this.swirl2 = sc.add.image(0, 0, 'fx_swirl').setTint(o.color).setBlendMode(ADD()).setScale(0.8).setAngle(60);
    this.core = sc.add.image(0, 0, 'fx_glow').setTint(0xffffff).setBlendMode(ADD()).setScale(1);
    this.vis.add([this.glow, this.swirl, this.swirl2, this.core]);
  }
  rect() { return circleRect(this.x, this.y, 70); }
  explode() {
    if (this.dead) return;
    const sc = this.scene;
    sc.fx.image('fx_glow', this.x, this.y, { tint: this.o.color, from: 1, to: 5, ms: 400 });
    sc.fx.image('fx_ring', this.x, this.y, { tint: 0xffffff, from: 0.5, to: 4, ms: 420 });
    this.vis.destroy();
    this.destroy();
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp;
    this.x += this.vx;
    this.vis.setPosition(this.x, this.y);
    this.swirl.angle += 22;
    this.swirl2.angle -= 30;
    this.glow.setScale(2.5 + Math.sin(this.t * 0.6) * 0.25);
    if (this.t % 2 === 0) sc.fx.auraAt(this.x - Math.sign(this.vx) * 50, this.y + rnd(-40, 40), this.o.color);
    if (this.t % 16 === 0) Sound.play('wind');
    // hapus semua serangan lawan yang tersentuh
    if (this.o.erase) {
      for (const a of sc.actors) {
        if (a === this || a.dead || a.owner === f || !a.rect) continue;
        if (!rectsOverlap(this.rect(), a.rect())) continue;
        sc.fx.image('fx_ring', a.x, a.y, { tint: 0xffffff, from: 0.3, to: 1.6, ms: 240 });
        if (a.explode) a.explode(true); else a.dispose();
      }
    } else if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      sc.applyHit(f, vic, Object.assign({ srcX: this.x, x: this.x, y: this.y, noGain: true }, this.o.hit));
      // zap: bola masuk ke tubuh lawan lalu menyetrum
      if (this.o.zap) for (let i = 0; i < 6; i++) zapAt(sc, vic.x + rnd(-50, 50), vic.y - rnd(40, 260), i % 2 ? 0xffe066 : 0x7fd8ff);
      Sound.play('explosion');
      sc.shake(450, 0.02);
      sc.flash(160, 220, 245, 255);
      this.explode();
      return false;
    }
    const gone = Math.abs(this.x - this.x0) / this.range;
    if (gone >= 1) { this.explode(); return false; }
    if (this.x < -150 || this.x > CFG.W + 150) { this.vis.destroy(); return false; }
    return true;
  }
}

// SITI HOKAGE — ULTIMATE: Bola Tekad Api (dari dada, menghapus serangan apa pun)
JUTSU.chestorb = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('aura');
  return {
    step(t) {
      if (t <= 34) {
        if (t === 14) f.setPose('orb');
        fx.auraAt(f.x + rnd(-90, 90), f.y - rnd(0, 300), t % 2 ? 0x7fd8ff : 0xff7a3a);
        if (t % 12 === 0) Sound.play('charge');
        if (t === 32) sc.flash(100, 220, 245, 255);
        return true;
      }
      if (t === 35) {
        f.setPose('palm');
        const p = f.at(110, 190);
        new ChestOrb(f, p.x, p.y, {
          color: 0x7fd8ff, speed: 13, erase: true,
          hit: { dmg: 270, kd: true, launch: [15, -14], heavy: true, guard: 'full', hitstop: 16 },
        });
        Sound.play('explosion');
        Sound.play('rasengan');
      }
      return t < 58;
    },
  };
};

// ---------------------------------------------------------------------
// RANTI — Hentakan Bumi: seluruh tanah arena retak, lawan di tanah pasti jatuh.
// ---------------------------------------------------------------------
JUTSU.earthquake = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('aura');
  return {
    step(t) {
      if (t <= 12) {
        fx.auraAt(f.x + rnd(-60, 60), f.y - rnd(0, 260), 0x7fd8ff);
        return true;
      }
      if (t === 13) {
        f.setPose('groundpunch');
        Sound.play('explosion');
        Sound.play('rock');
        sc.shake(700, 0.026);
        sc.flash(120, 255, 240, 220);
        fx.shock(f.x, f.ground, 0x7fd8ff, 4);
      }
      // retakan menjalar sejauh 55% arena
      if (t >= 13 && t <= 33 && t % 2 === 1) {
        const k = (t - 13) / 20;
        for (const side of [-1, 1]) {
          const x = f.x + side * k * CFG.W * 0.55;
          if (x < 0 || x > CFG.W) continue;
          fx.crack(x, f.ground + 6, 1.1);
          fx.rockBurst(x, f.ground, 4);
        }
        if (t % 6 === 1) Sound.play('rock');
      }
      if (t === 19) {
        const vic = f.opp;
        if (vic.onGround && Math.abs(vic.x - f.x) <= CFG.W * 0.55) {
          sc.applyHit(f, vic, { dmg: 75, kd: true, launch: [4, -14], heavy: true, guard: 'full', hitstop: 14, srcX: f.x, x: vic.x, y: f.ground - 60, noGain: true });
          fx.rockBurst(vic.x, f.ground, 14);
        }
      }
      return t < 42;
    },
  };
};

// RANTI — ULTIMATE: Bola Pusaran Angin (jangkauan 50% arena)
JUTSU.vortexball = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('aura');
  return {
    step(t) {
      if (t <= 30) {
        if (t === 12) f.setPose('orb');
        fx.auraAt(f.x + rnd(-80, 80), f.y - rnd(0, 280), 0x7fd8ff);
        if (t % 12 === 0) Sound.play('wind');
        return true;
      }
      if (t === 31) {
        f.setPose('beam');
        const p = f.at(130, 195);
        new ChestOrb(f, p.x, p.y, {
          color: 0x5fb6ff, speed: 14, reach: 0.5,
          hit: { dmg: 240, kd: true, launch: [14, -13], heavy: true, guard: 'half', hitstop: 14 },
        });
        Sound.play('explosion');
        Sound.play('wind');
      }
      return t < 54;
    },
  };
};
