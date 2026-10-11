// =====================================================================
// JURUS RANTI
// =====================================================================

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
