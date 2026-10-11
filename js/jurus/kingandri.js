// =====================================================================
// JURUS KING ANDRI
// =====================================================================

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
  // efek menghilang / muncul (kilatan merah + bayangan)
  const blink = (x, y) => {
    fx.image('fx_glow', x, y - 150, { tint: 0xff3030, from: 1.6, to: 0.2, ms: 260 });
    fx.image('fx_ring', x, y - 150, { tint: 0xff6060, from: 0.3, to: 2, ms: 280, scaleY: 1.8 });
    fx.burst(fx.sparks, x, y - 150, 12, 0xff8080);
  };
  const done = () => {
    api.offsetY = 0;
    f.tintOverride = null;
    f.sprite.setVisible(true);
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
          // menghilang
          phase = 'vanish';
          pt = 0;
          f.afterimage(0xff4040, 0.7, 300);
          blink(f.x, f.y);
          f.sprite.setVisible(false);
          f.tintOverride = null;
          Sound.play('dash');
        }
        return true;
      }
      if (phase === 'vanish') {
        f.vx = 0;
        f.vy = -CFG.GRAVITY;
        if (pt >= 10) {
          // muncul tinggi di udara, lawan di depan-bawah
          f.x = Phaser.Math.Clamp(vic.x - f.facing * 300, CFG.WALL, CFG.W - CFG.WALL);
          f.y = f.ground - HOVER;
          f.onGround = false;
          f.sprite.setVisible(true);
          blink(f.x, f.y);
          Sound.play('whoosh');
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
          // menghilang lagi...
          blink(f.x, f.y);
          f.afterimage(0xff4040, 0.6, 260);
          f.sprite.setVisible(false);
          Sound.play('dash');
          phase = 'vanish2';
          pt = 0;
        }
        return true;
      }
      if (phase === 'vanish2') {
        f.vx = 0;
        f.vy = -CFG.GRAVITY;
        if (pt >= 14) {
          // ...lalu muncul di tanah tepat di depan lawan yang terjatuh
          const side = Math.sign(f.x - vic.x) || -1;
          f.x = Phaser.Math.Clamp(vic.x + side * (CFG.PUSH_W + 50), CFG.WALL, CFG.W - CFG.WALL);
          f.y = f.ground;
          f.vy = 0;
          f.onGround = true;
          f.faceOpponent();
          f.setPose('book');
          f.sprite.setVisible(true);
          blink(f.x, f.y);
          fx.dust(f.x, f.ground, 4);
          phase = 'pose';
          pt = 0;
        }
        return true;
      }
      // berdiri angkuh sejenak di depan lawan
      f.vx = 0;
      return pt < 30;
    },
    cancel: done,
  });
};
