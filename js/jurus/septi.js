// =====================================================================
// JURUS SEPTI
// =====================================================================

// ---------------------------------------------------------------------
// SEPTI — Kibasan Kipas: satu kipas melepas angin yang menjatuhkan lawan
// ---------------------------------------------------------------------
JUTSU.fangust = function (f) {
  const fx = f.fx;
  f.setPose('walk1');
  return {
    step(t) {
      if (t < 7) {
        fx.auraAt(f.x + f.facing * rnd(0, 60), f.y - rnd(100, 260), 0xdff4ff);
        return true;
      }
      if (t === 7) {
        f.setPose('fan1');
        const p = f.at(150, 170);
        new ColorBlade(f, p.x, p.y, {
          tint: 0xffffff, tint2: 0x9fe8ff, s: 1.35, speed: 13,
          hit: { dmg: 120, kd: true, launch: [9, -13], heavy: true, hitstop: 8, chip: 0.2, blockstun: 16, push: 12 },
        });
        Sound.play('wind');
        Sound.play('whoosh');
      }
      return t < 32;
    },
  };
};

// ---------------------------------------------------------------------
// SEPTI — ULTIMATE: Badai Dua Kipas (lawan terlempar sampai tepi layar)
// ---------------------------------------------------------------------
JUTSU.twinfan = function (f) {
  const sc = f.scene, fx = f.fx;
  f.setPose('meditate');
  Sound.play('wind');
  return {
    step(t) {
      if (t <= 36) {
        if (t === 14) f.setPose('aura');
        fx.auraAt(f.x + rnd(-110, 110), f.y - rnd(0, 300), t % 2 ? 0xdff4ff : 0xffd27a);
        if (t % 3 === 0) fx.dust(f.x + rnd(-120, 120), f.ground, 1);
        if (t % 12 === 0) Sound.play('wind');
        if (t === 34) sc.flash(100, 220, 245, 255);
        return true;
      }
      if (t === 37) {
        f.setPose('fan2');
        const p = f.at(160, 170);
        new ColorBlade(f, p.x, p.y, {
          tint: 0xffffff, tint2: 0x9fe8ff, s: 2.4, speed: 15, power: 3, carry: true,
          hit: { dmg: 170, kd: true, launch: [20, -15], heavy: true, hitstop: 16 },
        });
        fx.shock(f.x, f.ground, 0x9fe8ff, 3.6);
        Sound.play('explosion');
        Sound.play('wind');
        sc.shake(300, 0.012);
      }
      return t < 64;
    },
  };
};
