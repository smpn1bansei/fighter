// =====================================================================
// JURUS KARAKTER GELOMBANG 8: Mrs. Dina (ASN, elemen angin + petir)
// (memakai Actor, ADD, rnd, rectsOverlap, fadeOut dari jutsu.js dan zapAt dari jutsu3.js)
// =====================================================================

// ---------------------------------------------------------------------
// Dorongan sampai ujung arena (tendangan Mrs. Dina).
// blocked = lawan menangkis: tetap terdorong, tetapi TIDAK terkena damage.
// ---------------------------------------------------------------------
class WallShove extends Actor {
  constructor(att, vic, blocked, frac) {
    super(att.scene, att);
    this.vic = vic;
    this.blocked = blocked;
    // frac: dorong sejauh pecahan lebar arena (0 = sampai ujung arena)
    this.left = frac ? CFG.W * frac : Infinity;
    this.dir = Math.sign(vic.x - att.x) || att.facing;
    this.x = vic.x;
    this.y = vic.y;
  }
  step() {
    const sc = this.scene, f = this.owner, vic = this.vic;
    if (vic.ko) return false;
    const d = Math.min(26, this.left);
    this.left -= d;
    vic.x = Phaser.Math.Clamp(vic.x + this.dir * d, CFG.WALL, CFG.W - CFG.WALL);
    vic.vx = 0;
    vic.hitstun = vic.t + 10;
    this.x = vic.x;
    if (this.t % 2 === 0) sc.fx.dust(vic.x, vic.ground, 2);
    if (this.t % 3 === 0) sc.fx.auraAt(vic.x - this.dir * 60, vic.y - rnd(60, 240), 0xdff6ff);
    const wall = vic.x <= CFG.WALL || vic.x >= CFG.W - CFG.WALL;
    if (this.left !== Infinity && (this.left <= 0 || wall)) return false; // dorongan angin biasa
    if (wall || this.t > 60) {
      if (!this.blocked) {
        sc.applyHit(f, vic, { dmg: 10, kd: true, launch: [3, -9], heavy: true, force: true, hitstop: 8, srcX: vic.x - this.dir * 60, x: vic.x, y: vic.y - 150, noGain: true });
      }
      sc.shake(220, 0.012);
      sc.fx.shock(vic.x, vic.ground, 0x9fe8ff, 2.4);
      return false;
    }
    return true;
  }
}

// ---------------------------------------------------------------------
// MRS. DINA — Tinju Kilat Angin: melesat secepat kilat lalu meninju
// dari bawah hingga lawan terlempar ke atas.
// ---------------------------------------------------------------------
JUTSU.flashupper = function (f) {
  const sc = f.scene, fx = f.fx;
  let phase = 'ready', pt = 0;
  f.setPose('walk4');
  return {
    step() {
      pt++;
      const vic = f.opp;
      if (phase === 'ready') {
        if (pt % 2 === 0) zapAt(sc, f.x + rnd(-40, 40), f.y - rnd(40, 240), 0xffe066);
        if (pt >= 6) { phase = 'dash'; pt = 0; f.setPose('dash'); Sound.play('dash'); }
        return true;
      }
      if (phase === 'dash') {
        f.vx = 0;
        f.x = Phaser.Math.Clamp(f.x + f.facing * 38, CFG.WALL, CFG.W - CFG.WALL);
        f.afterimage(0xffe066, 0.5, 200);
        if (pt % 2 === 0) fx.auraAt(f.x - f.facing * 60, f.y - rnd(40, 220), 0xdff6ff);
        if (rectsOverlap(f.boxRect([90, 160, 150, 260]), vic.hurtbox())) {
          f.setPose('uppercut');
          const p = f.at(90, 230);
          sc.applyHit(f, vic, { dmg: 130, kd: true, launch: [3, -25], heavy: true, hitstop: 12, chip: 0.2, blockstun: 18, push: 10, srcX: f.x, x: p.x, y: p.y, noGain: true });
          zapAt(sc, p.x, p.y, 0xffe066);
          fx.image('fx_slash', p.x, p.y - 40, { tint: 0xdff6ff, from: 1, to: 2.2, ms: 280, angle: -70 });
          sc.shake(280, 0.014);
          Sound.play('heavy');
          Sound.play('wind');
          phase = 'end';
          pt = 0;
          return true;
        }
        if (pt >= 30) { phase = 'end'; pt = 0; f.setPose('palm'); }
        return true;
      }
      f.vx *= 0.7;
      return pt < 22;
    },
  };
};

// ---------------------------------------------------------------------
// MRS. DINA — ULTIMATE: Badai Turbo
// Berputar melepaskan angin turbo berpetir yang bergerak ke lawan dan
// menghempaskannya ke ujung arena. Ditangkis: damage hanya setengah.
// ---------------------------------------------------------------------
class TurboTornado extends Actor {
  constructor(f) {
    super(f.scene, f);
    const sc = this.scene;
    this.x = f.x + f.facing * 80;
    this.y = f.ground;
    this.vx = f.facing * 12;
    this.kind = 'big';
    this.projectile = true;
    this.power = 4;
    this.phase = 'fly';
    this.vis = sc.add.container(this.x, this.y).setDepth(31);
    this.vis.add(sc.add.image(0, 10, 'fx_beam').setOrigin(0.5, 1).setTint(0x9fe8ff).setBlendMode(ADD()).setScale(2, 1.7).setAlpha(0.35));
    this.rings = [];
    for (let i = 0; i < 6; i++) {
      const r = sc.add.image(0, -i * 64 - 24, 'fx_wind').setTint(i % 2 ? 0xdff6ff : 0xfff0a0).setBlendMode(ADD());
      r.base = 0.5 + i * 0.15;
      r.setScale(r.base, 0.9 + i * 0.08);
      this.rings.push(r);
      this.vis.add(r);
    }
    this.bolt = sc.add.image(0, -200, 'fx_bolt0').setTint(0xffe066).setBlendMode(ADD()).setScale(1.2, 2).setAngle(90);
    this.vis.add(this.bolt);
    this.vis.setScale(0.2, 1);
    sc.tweens.add({ targets: this.vis, scaleX: 1, duration: 220, ease: 'Back.easeOut' });
  }
  rect() { return { x: this.x - 100, y: this.y - 420, w: 200, h: 420 }; }
  dispose() {
    super.dispose();
  }
  finish() {
    fadeOut(this.scene, this.vis, 300, { scaleX: 1.6 });
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp;
    this.x += this.vx;
    this.vis.setPosition(this.x, this.y);
    this.rings.forEach((r, i) => {
      r.x = Math.sin(this.t * 0.5 + i * 0.8) * (8 + i * 3);
      r.scaleX = r.base * (1 + Math.sin(this.t * 0.9 + i) * 0.07);
      r.setAlpha(0.65 + Math.sin(this.t * 1.3 + i * 2) * 0.3);
    });
    this.bolt.setTexture('fx_bolt' + (this.t % 3)).setY(-rnd(60, 360));
    if (this.t % 2 === 0) sc.fx.dust(this.x + rnd(-80, 80), f.ground, 1);
    if (this.t % 4 === 0) zapAt(sc, this.x + rnd(-70, 70), f.ground - rnd(60, 360), 0xffe066);
    if (this.t % 16 === 0) Sound.play('wind');

    if (this.phase === 'carry') {
      this.pt++;
      vic.x = this.x + Math.sign(this.vx) * 30;
      vic.vx = 0;
      vic.hitstun = vic.t + 10;
      const half = this.guarded ? 0.5 : 1;
      const wall = vic.x <= CFG.WALL + 2 || vic.x >= CFG.W - CFG.WALL - 2;
      if (this.pt % 6 === 0 && !wall) {
        sc.applyHit(f, vic, { dmg: Math.round(20 * half), hitstun: 30, push: 0, hitstop: 1, force: true, srcX: this.x - Math.sign(this.vx) * 60, x: vic.x + rnd(-30, 30), y: vic.y - rnd(80, 260), noGain: true });
        Sound.play('light');
      }
      if (wall || this.pt > 80 || vic.ko) {
        sc.applyHit(f, vic, { dmg: Math.round(130 * half), kd: true, launch: [8, -18], heavy: true, force: true, hitstop: 16, srcX: this.x - Math.sign(this.vx) * 60, x: vic.x, y: vic.y - 180, noGain: true });
        Sound.play('explosion');
        sc.shake(500, 0.022);
        sc.flash(180, 255, 245, 200);
        this.finish();
        this.dead = true;
        return false;
      }
      return true;
    }

    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      // tidak bisa ditahan perisai; yang menangkis hanya menerima setengah damage
      this.guarded = vic.state === 'guard' || vic.state === 'blockstun';
      if (this.guarded) sc.fx.popup(vic.x, vic.y - 330, 'SETENGAH DAMAGE', '#bff4ff', 26);
      sc.applyHit(f, vic, { dmg: this.guarded ? 15 : 30, hitstun: 40, heavy: true, unblockable: true, hitstop: 8, push: 0, srcX: this.x, x: vic.x, y: vic.y - 160, noGain: true });
      this.phase = 'carry';
      this.pt = 0;
      this.vx = Math.sign(this.vx) * 15;
      Sound.play('explosion');
      return true;
    }
    if (this.x < -150 || this.x > CFG.W + 150) { this.vis.destroy(); return false; }
    return true;
  }
  explode() {
    if (this.dead) return;
    this.finish();
    this.destroy();
  }
}

JUTSU.turbotornado = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('aura');
  return {
    step(t) {
      if (t <= 26) {
        if (t % 3 === 0) zapAt(sc, f.x + rnd(-80, 80), f.y - rnd(30, 300), 0xffe066);
        fx.auraAt(f.x + rnd(-90, 90), f.y - rnd(0, 300), t % 2 ? 0xdff6ff : 0xffe066);
        if (t % 12 === 0) Sound.play('charge');
        return true;
      }
      if (t === 27) {
        f.setPose('spin');
        new TurboTornado(f);
        Sound.play('wind');
        Sound.play('explosion');
        sc.shake(250, 0.01);
      }
      // berputar: sprite membalik arah bergantian
      if (t > 27 && t < 60 && t % 4 === 0) f.spinFlip = !f.spinFlip;
      if (t >= 60) f.spinFlip = false;
      return t < 64;
    },
    cancel() { f.spinFlip = false; },
  };
};
