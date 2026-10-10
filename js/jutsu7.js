// =====================================================================
// JURUS KARAKTER GELOMBANG 7: Mas Tio (operator sekolah, super cepat)
// (memakai ADD, rnd, rectsOverlap, fadeOut dari jutsu.js dan shatterShield dari jutsu6.js)
// =====================================================================

// ---------------------------------------------------------------------
// MAS TIO — Flash Punch: berlari secepat kilat lalu meninju.
// Ditangkis atau tidak, lawan terpental sampai ujung belakang arena.
// ---------------------------------------------------------------------
JUTSU.flashpunch = function (f) {
  const sc = f.scene, fx = f.fx;
  let phase = 'ready', pt = 0, dir = f.facing;
  f.setPose('aura');
  return {
    step() {
      pt++;
      const vic = f.opp;
      if (phase === 'ready') {
        fx.auraAt(f.x + rnd(-50, 50), f.y - rnd(0, 260), f.def.color);
        if (pt >= 6) { phase = 'dash'; pt = 0; f.setPose('dash'); Sound.play('dash'); }
        return true;
      }
      if (phase === 'dash') {
        f.vx = 0;
        f.x = Phaser.Math.Clamp(f.x + f.facing * 36, CFG.WALL, CFG.W - CFG.WALL);
        f.afterimage(f.def.color, 0.5, 200);
        if (pt % 2 === 0) fx.dust(f.x - f.facing * 40, f.ground, 1);
        if (rectsOverlap(f.boxRect([95, 160, 150, 260]), vic.hurtbox())) {
          f.setPose('double');
          dir = f.facing;
          const p = f.at(130, 205);
          if (vic.state === 'guard' || vic.state === 'blockstun') shatterShield(sc, vic, f.x);
          sc.applyHit(f, vic, { dmg: 90, hitstun: 60, heavy: true, unblockable: true, hitstop: 10, push: 0, srcX: f.x, x: p.x, y: p.y, noGain: true });
          fx.image('fx_ring', p.x, p.y, { tint: 0xffffff, from: 0.4, to: 2.4, ms: 300 });
          sc.shake(300, 0.016);
          Sound.play('explosion');
          phase = vic.ko ? 'end' : 'blast';
          pt = 0;
          return true;
        }
        if (pt >= 34) { phase = 'end'; pt = 0; f.setPose('palm'); }
        return true;
      }
      if (phase === 'blast') {
        // lawan terlempar meluncur sampai tepi arena
        vic.x = Phaser.Math.Clamp(vic.x + dir * 28, CFG.WALL, CFG.W - CFG.WALL);
        vic.vx = 0;
        if (vic.state === 'hurt') vic.hitstun = vic.t + 10;
        if (pt % 2 === 0) fx.dust(vic.x, vic.ground, 2);
        const wall = vic.x <= CFG.WALL || vic.x >= CFG.W - CFG.WALL;
        if (wall || pt > 50) {
          sc.applyHit(f, vic, { dmg: 60, kd: true, launch: [4, -12], heavy: true, force: true, hitstop: 12, srcX: vic.x - dir * 60, x: vic.x, y: vic.y - 150, noGain: true });
          sc.shake(350, 0.02);
          fx.shock(vic.x, f.ground, f.def.color, 3);
          phase = 'end';
          pt = 0;
        }
        return true;
      }
      return pt < 20;
    },
  };
};

// ---------------------------------------------------------------------
// MAS TIO — ULTIMATE: Hantaman Langit
// Menghilang, muncul di atas kepala lawan, lalu menghantam ke bawah.
// Tidak bisa ditangkis; tanah retak di titik hantaman.
// ---------------------------------------------------------------------
JUTSU.skyslam = function (f) {
  const sc = f.scene, fx = f.fx;
  let phase = 'charge', pt = 0, mark = null;
  f.setPose('aura');
  const clear = () => { if (mark) { mark.destroy(); mark = null; } };
  return {
    step() {
      pt++;
      const vic = f.opp;
      if (phase === 'charge') {
        fx.auraAt(f.x + rnd(-80, 80), f.y - rnd(0, 280), pt % 2 ? f.def.color : 0xffffff);
        if (pt % 12 === 0) Sound.play('charge');
        if (pt >= 24) {
          // menghilang secepat kilat
          for (let i = 0; i < 4; i++) f.afterimage(0xffffff, 0.6, 260, rnd(-40, 40));
          Sound.play('dash');
          phase = 'vanish';
          pt = 0;
          f.sprite.setVisible(false);
          mark = sc.add.image(vic.x, f.ground + 2, 'fx_ring').setTint(0xff4040).setBlendMode(ADD()).setDepth(6).setScale(0.9, 0.25);
        }
        return true;
      }
      if (phase === 'vanish') {
        if (mark) mark.setPosition(vic.x, f.ground + 2).setAlpha(0.5 + Math.sin(pt) * 0.4);
        if (pt >= 12) {
          // muncul tinggi di atas kepala lawan
          f.sprite.setVisible(true);
          f.x = vic.x;
          f.y = f.ground - 420;
          f.onGround = false;
          f.vx = 0;
          f.vy = 10;
          f.setPose('backfist');
          sc.flash(80, 255, 255, 255);
          Sound.play('whoosh');
          phase = 'drop';
          pt = 0;
        }
        return true;
      }
      if (phase === 'drop') {
        f.x = Phaser.Math.Linear(f.x, vic.x, 0.35); // mengunci kepala lawan
        f.vy = Math.max(f.vy, 30);
        f.afterimage(f.def.color, 0.45, 160);
        if (mark) mark.setPosition(vic.x, f.ground + 2);
        if (f.onGround || f.y >= f.ground) {
          f.y = f.ground;
          f.onGround = true;
          f.vy = 0;
          f.setPose('groundpunch');
          clear();
          const x = f.x + f.facing * 60;
          if (vic.state === 'guard' || vic.state === 'blockstun') shatterShield(sc, vic, f.x);
          if (Math.abs(vic.x - f.x) < 200) {
            sc.applyHit(f, vic, { dmg: 280, kd: true, launch: [6, -10], heavy: true, unblockable: true, force: true, hitstop: 18, srcX: f.x, x: vic.x, y: vic.y - 200, noGain: true });
          }
          Sound.play('explosion');
          Sound.play('rock');
          sc.shake(600, 0.026);
          sc.flash(200, 255, 230, 200);
          fx.crack(x, f.ground + 6, 2.2);
          fx.crack(x + rnd(-60, 60), f.ground + 8, 1.4);
          fx.rockBurst(x, f.ground, 22);
          fx.shock(x, f.ground, f.def.color, 4.4);
          fx.image('fx_glow', x, f.ground - 30, { tint: 0xffffff, from: 1, to: 5, ms: 380 });
          phase = 'end';
          pt = 0;
        }
        return true;
      }
      return pt < 30;
    },
    cancel() {
      clear();
      f.sprite.setVisible(true);
    },
  };
};
