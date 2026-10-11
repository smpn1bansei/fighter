// =====================================================================
// PROYEKTIL BERSAMA (dipakai lebih dari satu karakter)
// =====================================================================

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
    // reach: jangkauan ujung petir dari tubuh (pecahan lebar arena), default setengah layar
    this.range = CFG.W * (pr.reach || 0.5) - (pr.x || 120) - (pr.reach ? 50 : 40);
    this.m = m;
    this.s = pr.scale || 1;
    this.kind = 'mid';
    this.projectile = true;
    this.power = 1;
    const s = this.s, flip = f.facing < 0;
    this.vis = sc.add.container(p.x, p.y).setDepth(32);
    const yellow = pr.color === 'yellow';
    this.zap = yellow ? 0xfff3a0 : 0xbff4ff;
    this.glow = sc.add.image(0, 0, 'fx_glow').setTint(yellow ? 0xffc400 : 0x3fa8ff).setBlendMode(ADD()).setScale(1.4 * s, 0.8 * s).setAlpha(0.7);
    this.bolt = sc.add.image(0, 0, 'fx_bolt0').setTint(this.zap).setBlendMode(ADD()).setScale(s).setFlipX(flip);
    this.bolt2 = sc.add.image(0, 0, 'fx_bolt1').setTint(yellow ? 0xffe066 : 0x5fe0ff).setBlendMode(ADD()).setScale(s * 0.9, s * 1.3).setFlipX(flip);
    this.vis.add([this.glow, this.bolt2, this.bolt]);
    if (this.vy) this.vis.setAngle(Phaser.Math.RadToDeg(Math.atan2(this.vy, Math.abs(this.vx))) * f.facing);
    Sound.play('shuriken');
  }
  rect() { return { x: this.x - 50 * this.s, y: this.y - 32 * this.s, w: 100 * this.s, h: 64 * this.s }; }
  explode() {
    if (this.dead) return;
    zapAt(this.scene, this.x, this.y, this.zap);
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
// Bilah angin berwarna. opts:
//   tint, tint2 : warna inti & pinggir      s : ukuran      speed
//   hit         : data serangan saat kena
//   carry       : lawan terseret sampai tepi arena lalu terpental
//   petals      : taburan kelopak mawar di jejaknya
// ---------------------------------------------------------------------
class ColorBlade extends Actor {
  constructor(f, x, y, o) {
    super(f.scene, f);
    const sc = this.scene, s = (this.s = o.s || 1), flip = f.facing < 0;
    this.o = o;
    this.x = x;
    this.y = y;
    this.vx = f.facing * (o.speed || 13);
    this.kind = s > 1.8 ? 'big' : 'low';
    this.projectile = true;
    this.power = o.power || 1;
    this.phase = 'fly';
    this.vis = sc.add.container(x, y).setDepth(32);
    this.vis.add([
      sc.add.image(0, 0, 'fx_glow').setTint(o.tint2).setBlendMode(ADD()).setScale(1.4 * s, 1.0 * s).setAlpha(0.65),
      sc.add.image(-f.facing * 22 * s, 0, 'fx_slash').setTint(o.tint2).setBlendMode(ADD()).setScale(0.75 * s, 1.0 * s).setFlipX(flip).setAlpha(0.8),
      sc.add.image(0, 0, 'fx_slash').setTint(o.tint).setBlendMode(ADD()).setScale(0.95 * s, 1.15 * s).setFlipX(flip),
    ]);
    if (s > 1.8) {
      this.ring = sc.add.image(0, 0, 'fx_wind').setTint(o.tint).setBlendMode(ADD()).setScale(0.6 * s, 1.5 * s).setAngle(90);
      this.vis.add(this.ring);
    }
  }
  rect() { return { x: this.x - 38 * this.s, y: this.y - 58 * this.s, w: 76 * this.s, h: 116 * this.s }; }
  explode(silent) {
    if (this.dead) return;
    const sc = this.scene;
    if (!silent) Sound.play('wind');
    sc.fx.image('fx_ring', this.x, this.y, { tint: this.o.tint2, from: 0.3, to: 1.6 * this.s, ms: 280 });
    sc.fx.burst(sc.fx.sparks, this.x, this.y, 12, this.o.tint);
    this.vis.destroy();
    this.destroy();
  }
  trail() {
    const sc = this.scene;
    if (this.t % 2 === 0) sc.fx.auraAt(this.x - Math.sign(this.vx) * 30 * this.s, this.y + rnd(-30, 30) * this.s, this.o.tint2);
    if (this.o.petals && this.t % 3 === 0) sc.fx.burst(sc.fx.pixels, this.x - Math.sign(this.vx) * 20, this.y + rnd(-25, 25), 2, 0xff3d6a);
  }
  step() {
    const sc = this.scene, f = this.owner, vic = f.opp, o = this.o;
    this.x += this.vx;
    this.vis.setPosition(this.x, this.y);
    this.vis.scaleY = 1 + Math.sin(this.t * 0.8) * 0.08;
    if (this.ring) this.ring.scaleY = 1.5 * this.s * (1 + Math.sin(this.t * 1.3) * 0.12);
    this.trail();

    if (this.phase === 'carry') {
      // lawan terseret angin sampai tepi arena
      this.pt++;
      vic.x = this.x + Math.sign(this.vx) * 40;
      vic.vx = 0;
      const atWall = vic.x <= CFG.WALL + 2 || vic.x >= CFG.W - CFG.WALL - 2;
      if (this.pt % 7 === 0 && !atWall) {
        sc.applyHit(f, vic, { dmg: 16, hitstun: 30, push: 0, hitstop: 1, force: true, half: this.half, srcX: this.x - Math.sign(this.vx) * 60, x: vic.x, y: this.y, noGain: true });
      }
      if (atWall || this.pt > 80 || vic.ko) {
        sc.applyHit(f, vic, Object.assign({ force: true, half: this.half, srcX: this.x - Math.sign(this.vx) * 60, x: vic.x, y: this.y, noGain: true }, o.hit));
        sc.shake(500, 0.022);
        sc.flash(180, 230, 245, 255);
        this.explode();
        return false;
      }
      return true;
    }

    if (this.clash()) return false;
    if (rectsOverlap(this.rect(), vic.hurtbox())) {
      if (o.carry) {
        const res = sc.applyHit(f, vic, { dmg: 30, hitstun: 40, blockstun: 22, push: 4, chip: 0.35, heavy: true, guard: 'half', srcX: this.x, x: this.x, y: this.y, hitstop: 8, noGain: true });
        this.half = sc.lastGuarded ? 0.5 : 0;
        if (res === 'hit') {
          this.phase = 'carry';
          this.pt = 0;
          this.vx = Math.sign(this.vx) * 15;
          return true;
        }
      } else {
        sc.applyHit(f, vic, Object.assign({ srcX: this.x, x: this.x, y: this.y, noGain: true }, o.hit));
      }
      this.explode();
      return false;
    }
    if (this.x < -150 || this.x > CFG.W + 150) { this.vis.destroy(); return false; }
    return true;
  }
}

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
