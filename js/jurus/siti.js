// =====================================================================
// JURUS SITI HOKAGE
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
