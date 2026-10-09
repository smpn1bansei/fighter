// =====================================================================
// EFEK VISUAL: tekstur efek dibuat dengan kode + sistem partikel.
// =====================================================================
window.FX = {
  makeTextures(scene) {
    const T = scene.textures;
    const make = (key, w, h, draw) => {
      if (T.exists(key)) return;
      const c = T.createCanvas(key, w, h);
      const g = c.getContext();
      draw(g, w, h);
      c.refresh();
    };
    const radial = (g, x, y, r, stops) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      stops.forEach(([p, c]) => gr.addColorStop(p, c));
      return gr;
    };

    make('fx_glow', 128, 128, (g) => {
      g.fillStyle = radial(g, 64, 64, 64, [[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,0.8)'],
        [0.55, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]);
      g.fillRect(0, 0, 128, 128);
    });
    make('fx_dot', 24, 24, (g) => {
      g.fillStyle = radial(g, 12, 12, 12, [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]);
      g.fillRect(0, 0, 24, 24);
    });
    make('fx_px', 8, 8, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 8, 8); });
    make('fx_spark', 96, 96, (g) => {
      g.translate(48, 48);
      g.shadowColor = '#fff';
      g.shadowBlur = 8;
      g.fillStyle = '#fff';
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 - Math.PI / 2;
        const r = i % 2 === 0 ? 44 : 7;
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
    });
    make('fx_ring', 160, 160, (g) => {
      g.shadowColor = '#fff';
      g.shadowBlur = 12;
      g.strokeStyle = '#fff';
      g.lineWidth = 9;
      g.beginPath();
      g.arc(80, 80, 64, 0, Math.PI * 2);
      g.stroke();
    });
    make('fx_flame', 64, 96, (g) => {
      g.fillStyle = radial(g, 32, 64, 34, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.65)'], [1, 'rgba(255,255,255,0)']]);
      g.beginPath();
      g.moveTo(32, 2);
      g.bezierCurveTo(46, 30, 62, 50, 58, 70);
      g.bezierCurveTo(54, 92, 10, 92, 6, 70);
      g.bezierCurveTo(2, 50, 18, 30, 32, 2);
      g.fill();
    });
    make('fx_smoke', 64, 64, (g) => {
      g.fillStyle = radial(g, 32, 32, 32, [[0, 'rgba(235,225,210,0.75)'], [0.6, 'rgba(210,200,185,0.35)'], [1, 'rgba(200,190,175,0)']]);
      g.fillRect(0, 0, 64, 64);
    });
    make('fx_rock', 26, 24, (g) => {
      g.fillStyle = '#6b4a2b';
      g.strokeStyle = '#2e1d0e';
      g.lineWidth = 2;
      g.beginPath();
      [[4, 8], [11, 2], [21, 5], [24, 14], [17, 22], [6, 20], [2, 14]].forEach(([x, y]) => g.lineTo(x, y));
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#9a7650';
      g.fillRect(9, 6, 7, 4);
    });
    make('fx_slash', 140, 132, (g) => {
      g.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        g.strokeStyle = `rgba(255,255,255,${((1 - i / 14) * 0.95).toFixed(3)})`;
        g.lineWidth = 15 - i;
        g.beginPath();
        g.arc(36, 66, 76 - i * 2, -1.05, 1.05);
        g.stroke();
      }
    });
    make('fx_swirl', 128, 128, (g) => {
      g.translate(64, 64);
      g.strokeStyle = '#fff';
      g.lineCap = 'round';
      g.lineWidth = 7;
      for (let k = 0; k < 3; k++) {
        g.rotate((Math.PI * 2) / 3);
        g.beginPath();
        for (let t = 0; t <= 1.001; t += 0.05) {
          const a = t * Math.PI * 1.3, r = 8 + t * 52;
          g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        g.stroke();
      }
    });
    make('fx_blade', 256, 256, (g) => {
      g.translate(128, 128);
      for (let k = 0; k < 4; k++) {
        g.rotate(Math.PI / 2);
        const gr = g.createLinearGradient(0, 0, 124, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0.95)');
        gr.addColorStop(1, 'rgba(255,255,255,0.1)');
        g.fillStyle = gr;
        g.beginPath();
        g.moveTo(10, -26);
        g.quadraticCurveTo(70, -46, 126, -6);
        g.quadraticCurveTo(70, -8, 24, 24);
        g.closePath();
        g.fill();
      }
    });
    make('fx_seal', 256, 256, (g) => {
      g.translate(128, 128);
      g.strokeStyle = '#fff';
      g.fillStyle = '#fff';
      g.shadowColor = '#fff';
      g.shadowBlur = 6;
      const circle = (r, w) => { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); };
      circle(120, 6);
      circle(102, 3);
      circle(58, 4);
      for (let i = 0; i < 12; i++) {
        g.save();
        g.rotate((i * Math.PI) / 6);
        g.fillRect(-5, -116, 10, 10);
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(-8, -96); g.lineTo(0, -64); g.lineTo(8, -96);
        g.stroke();
        g.restore();
      }
      g.lineWidth = 5;
      g.beginPath();
      for (let t = 0; t <= 1.001; t += 0.02) {
        const a = t * Math.PI * 4, r = 4 + t * 42;
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.stroke();
    });
    make('fx_crack', 240, 48, (g) => {
      g.strokeStyle = 'rgba(45,28,12,0.95)';
      g.lineCap = 'round';
      const line = (x0, y0, len, dir, w) => {
        g.lineWidth = w;
        g.beginPath();
        g.moveTo(x0, y0);
        let x = x0, y = y0;
        for (let i = 0; i < 8; i++) {
          x += (len / 8) * dir;
          y += (Math.random() - 0.5) * 10;
          g.lineTo(x, y);
        }
        g.stroke();
      };
      line(120, 24, 115, 1, 5);
      line(120, 24, 115, -1, 5);
      line(150, 26, 50, 1, 2.5);
      line(80, 22, 50, -1, 2.5);
    });
    make('fx_shadow', 160, 40, (g) => {
      g.scale(1, 0.25);
      g.fillStyle = radial(g, 80, 80, 80, [[0, 'rgba(0,0,0,0.55)'], [0.7, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0)']]);
      g.fillRect(0, 0, 160, 160);
    });
    make('fx_diamond', 40, 40, (g) => {
      g.fillStyle = '#fff';
      g.shadowColor = '#fff';
      g.shadowBlur = 8;
      g.beginPath();
      g.moveTo(20, 4); g.lineTo(32, 20); g.lineTo(20, 36); g.lineTo(8, 20);
      g.closePath();
      g.fill();
    });
    make('fx_line', 256, 8, (g) => {
      const gr = g.createLinearGradient(0, 0, 256, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5, 'rgba(255,255,255,1)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 2, 256, 4);
    });
    make('fx_beam', 96, 256, (g) => {
      const gr = g.createLinearGradient(0, 0, 96, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.3, 'rgba(255,255,255,0.7)');
      gr.addColorStop(0.5, 'rgba(255,255,255,1)');
      gr.addColorStop(0.7, 'rgba(255,255,255,0.7)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 96, 256);
      g.globalCompositeOperation = 'destination-in';
      const fade = g.createLinearGradient(0, 0, 0, 256);
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(0.25, 'rgba(0,0,0,1)');
      fade.addColorStop(1, 'rgba(0,0,0,1)');
      g.fillStyle = fade;
      g.fillRect(0, 0, 96, 256);
    });
    // Sinar horizontal (Kamehameha, laser)
    make('fx_hbeam', 256, 64, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 64);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.3, 'rgba(255,255,255,0.75)');
      gr.addColorStop(0.5, 'rgba(255,255,255,1)');
      gr.addColorStop(0.7, 'rgba(255,255,255,0.75)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 256, 64);
    });
    // Batu bulat (dilempar Pak Jef)
    make('fx_boulder', 96, 96, (g) => {
      g.beginPath();
      const pts = 14;
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const r = 40 + Math.sin(i * 2.7) * 4 + Math.cos(i * 1.3) * 3;
        g.lineTo(48 + Math.cos(a) * r, 48 + Math.sin(a) * r);
      }
      g.closePath();
      const gr = g.createRadialGradient(36, 34, 4, 48, 48, 46);
      gr.addColorStop(0, '#a99a86');
      gr.addColorStop(0.55, '#7a6650');
      gr.addColorStop(1, '#3e3226');
      g.fillStyle = gr;
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = '#211a12';
      g.stroke();
      g.strokeStyle = 'rgba(33,26,18,0.7)';
      g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(30, 52); g.lineTo(44, 60); g.lineTo(50, 74); g.stroke();
      g.beginPath(); g.moveTo(58, 28); g.lineTo(66, 40); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.beginPath(); g.ellipse(36, 32, 12, 7, -0.5, 0, Math.PI * 2); g.fill();
    });
    // Petir horizontal (3 bentuk berbeda agar bisa berkedip)
    for (let v = 0; v < 3; v++) {
      make('fx_bolt' + v, 200, 64, (g) => {
        let seed = 7 + v * 31;
        const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
        const pts = [];
        for (let i = 0; i <= 12; i++) pts.push([6 + i * 15.6, 32 + (i === 0 || i === 12 ? 0 : (r() - 0.5) * 40)]);
        const path = () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); };
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.shadowColor = '#fff';
        g.shadowBlur = 10;
        g.strokeStyle = 'rgba(255,255,255,0.45)';
        g.lineWidth = 10;
        path(); g.stroke();
        g.strokeStyle = '#fff';
        g.lineWidth = 4;
        path(); g.stroke();
        // cabang kecil
        g.lineWidth = 2;
        for (let k = 2; k < 11; k += 3) {
          const [x, y] = pts[k];
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x + 10 + r() * 10, y + (r() - 0.5) * 36);
          g.stroke();
        }
      });
    }
    // Mawar merah bertangkai
    make('fx_rose', 64, 64, (g) => {
      g.strokeStyle = '#2f8a3a';
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(14, 56); g.lineTo(34, 30); g.stroke();
      g.fillStyle = '#3fae4a';
      g.beginPath(); g.ellipse(20, 46, 8, 4, -0.8, 0, Math.PI * 2); g.fill();
      const petals = [['#8a0f2a', 15], ['#c4183c', 11], ['#e83a5c', 7], ['#ff7a96', 3]];
      for (const [c, r] of petals) {
        g.fillStyle = c;
        g.beginPath(); g.arc(40, 22, r, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = '#5a0718';
      g.lineWidth = 1.5;
      g.beginPath(); g.arc(40, 22, 9, 0.5, 4.2); g.stroke();
    });
    // Anak panah bercahaya
    make('fx_arrow', 140, 28, (g) => {
      g.shadowColor = '#fff';
      g.shadowBlur = 8;
      g.fillStyle = '#fff';
      g.fillRect(14, 12, 104, 4);
      g.beginPath();
      g.moveTo(138, 14); g.lineTo(112, 3); g.lineTo(118, 14); g.lineTo(112, 25);
      g.closePath();
      g.fill();
      g.beginPath();
      g.moveTo(26, 14); g.lineTo(6, 2); g.lineTo(14, 14); g.lineTo(6, 26);
      g.closePath();
      g.fill();
    });
    // Shuriken baja (tidak diwarnai ulang)
    make('fx_shuriken', 48, 48, (g) => {
      g.translate(24, 24);
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? 22 : 7;
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
      const gr = g.createLinearGradient(-20, -20, 20, 20);
      gr.addColorStop(0, '#e8eef7');
      gr.addColorStop(0.5, '#8a93a8');
      gr.addColorStop(1, '#3a4152');
      g.fillStyle = gr;
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = '#1a1d26';
      g.stroke();
      g.fillStyle = '#1a1d26';
      g.beginPath();
      g.arc(0, 0, 4, 0, Math.PI * 2);
      g.fill();
    });
    // Pita angin melingkar (dipakai bertumpuk untuk tornado)
    make('fx_wind', 256, 72, (g) => {
      g.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        g.strokeStyle = `rgba(255,255,255,${(0.9 - i * 0.14).toFixed(2)})`;
        g.lineWidth = 9 - i * 1.3;
        g.beginPath();
        g.ellipse(128, 36, 118 - i * 3, 26 - i, 0, 0.15 + i * 0.05, Math.PI - 0.15);
        g.stroke();
      }
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(128, 36, 118, 26, 0, Math.PI + 0.3, Math.PI * 2 - 0.3);
      g.stroke();
    });
    make('fx_lock', 64, 64, (g) => {
      g.strokeStyle = '#8a8fa8';
      g.lineWidth = 7;
      g.beginPath();
      g.arc(32, 26, 13, Math.PI, 0);
      g.lineTo(45, 32);
      g.moveTo(19, 26);
      g.lineTo(19, 32);
      g.stroke();
      g.fillStyle = '#8a8fa8';
      g.fillRect(12, 30, 40, 28);
      g.fillStyle = '#2a2d3e';
      g.fillRect(29, 38, 6, 12);
    });
  },
};

// Efek per adegan (dibuat ulang tiap adegan karena objek Phaser milik adegan).
class FxSystem {
  constructor(scene) {
    this.scene = scene;
    const P = (key, cfg, depth) => scene.add.particles(0, 0, key, Object.assign({ emitting: false }, cfg)).setDepth(depth || 35);
    this.sparks = P('fx_dot', {
      lifespan: { min: 180, max: 420 }, speed: { min: 220, max: 680 }, angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', gravityY: 700,
    });
    this.pixels = P('fx_px', {
      lifespan: { min: 250, max: 600 }, speed: { min: 120, max: 420 }, angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0.2 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', gravityY: 300, rotate: { min: 0, max: 360 },
    });
    this.smoke = P('fx_smoke', {
      lifespan: { min: 400, max: 750 }, speed: { min: 30, max: 140 }, angle: { min: 180, max: 360 },
      scale: { start: 0.5, end: 1.6 }, alpha: { start: 0.7, end: 0 }, gravityY: -40,
    }, 33);
    this.rocks = P('fx_rock', {
      lifespan: { min: 500, max: 900 }, speed: { min: 200, max: 520 }, angle: { min: 215, max: 325 },
      scale: { min: 0.6, max: 1.5 }, rotate: { start: 0, end: 540 }, gravityY: 1400, alpha: { start: 1, end: 0.6 },
    }, 34);
    this.flames = P('fx_flame', {
      lifespan: { min: 300, max: 600 }, speedY: { min: -260, max: -120 }, speedX: { min: -40, max: 40 },
      scale: { start: 0.9, end: 0.1 }, alpha: { start: 0.95, end: 0 }, blendMode: 'ADD',
    }, 34);
    this.aura = P('fx_flame', {
      lifespan: { min: 350, max: 600 }, speedY: { min: -240, max: -110 }, speedX: { min: -25, max: 25 },
      scale: { start: 0.7, end: 0.05 }, alpha: { start: 0.75, end: 0 }, blendMode: 'ADD',
    }, 19);
  }

  burst(emitter, x, y, n, tint) {
    if (tint !== undefined) emitter.particleTint = tint;
    emitter.explode(n, x, y);
  }

  image(key, x, y, opts) {
    const s = this.scene;
    const img = s.add.image(x, y, key).setDepth(opts.depth || 36);
    if (opts.add !== false) img.setBlendMode(Phaser.BlendModes.ADD);
    if (opts.tint !== undefined) img.setTint(opts.tint);
    if (opts.angle !== undefined) img.setAngle(opts.angle);
    if (opts.flipX) img.setFlipX(true);
    img.setScale(opts.from !== undefined ? opts.from : 0.2);
    if (opts.scaleY) img.scaleY *= opts.scaleY;
    img.setAlpha(opts.alpha !== undefined ? opts.alpha : 1);
    const to = { scaleX: opts.to || 1, scaleY: (opts.to || 1) * (opts.scaleY || 1), alpha: 0 };
    if (opts.spin) to.angle = (opts.angle || 0) + opts.spin;
    if (opts.dy) to.y = y + opts.dy;
    s.tweens.add(Object.assign({ targets: img, duration: opts.ms || 200, ease: 'Cubic.easeOut', onComplete: () => img.destroy() }, to));
    return img;
  }

  // Percikan saat pukulan kena.
  hit(x, y, heavy, color) {
    color = color || 0xffffff;
    this.image('fx_glow', x, y, { tint: color, from: 0.4, to: heavy ? 2.6 : 1.5, ms: heavy ? 220 : 150 });
    this.image('fx_spark', x, y, { from: 0.3, to: heavy ? 1.9 : 1.1, angle: Math.random() * 90, spin: 40, ms: heavy ? 200 : 130 });
    if (heavy) {
      this.image('fx_ring', x, y, { tint: color, from: 0.2, to: 1.8, ms: 280 });
      this.burst(this.pixels, x, y, 10, color);
    }
    this.burst(this.sparks, x, y, heavy ? 16 : 8, color);
  }

  block(x, y, color) {
    this.image('fx_ring', x, y, { tint: color || 0x7fd8ff, from: 0.3, to: 1.0, ms: 200, scaleY: 1.3 });
    this.image('fx_glow', x, y, { tint: 0xffffff, from: 0.3, to: 0.9, ms: 120 });
    this.burst(this.sparks, x, y, 6, 0xdff4ff);
  }

  slash(x, y, facing, color) {
    this.image('fx_slash', x, y, { tint: color, from: 0.6, to: 1.1, ms: 170, flipX: facing < 0, alpha: 0.9 });
  }

  dust(x, y, n) {
    this.smoke.particleTint = 0xffffff;
    this.smoke.explode(n || 6, x, y);
  }

  shock(x, y, color, size) {
    this.image('fx_ring', x, y, { tint: color, from: 0.2, to: size || 2.5, ms: 350, scaleY: 0.35 });
  }

  rockBurst(x, y, n) {
    this.rocks.explode(n || 8, x, y);
    this.dust(x, y, 4);
  }

  crack(x, y, scale) {
    const img = this.scene.add.image(x, y, 'fx_crack').setDepth(6).setScale(scale || 1, (scale || 1) * 0.7).setAlpha(0.95);
    this.scene.tweens.add({ targets: img, alpha: 0, delay: 1200, duration: 600, onComplete: () => img.destroy() });
  }

  // Teks melayang (mis. "+120" saat memulihkan tenaga).
  popup(x, y, str, color, size) {
    const t = UI.title(this.scene, x, y, str, size || 40, color || '#ffffff').setDepth(96);
    // jaga agar teks tidak terpotong di tepi layar
    t.x = Phaser.Math.Clamp(x, t.width / 2 + 8, CFG.W - t.width / 2 - 8);
    this.scene.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  auraAt(x, y, color) {
    this.aura.particleTint = color;
    this.aura.emitParticleAt(x, y, 1);
  }

  flameAt(x, y, color, n) {
    this.flames.particleTint = color;
    this.flames.emitParticleAt(x, y, n || 1);
  }
}
