// =====================================================================
// UI: gaya teks, tombol menu, dan navigasi menu dengan keyboard.
// =====================================================================
window.UI = {
  font: 'PressStart, monospace',
  titleFont: 'Bangers, Impact, sans-serif',

  text(scene, x, y, str, size, color, extra) {
    return scene.add.text(x, y, str, Object.assign({
      fontFamily: UI.font,
      fontSize: size + 'px',
      color: color || '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: Math.max(3, Math.round(size / 4)),
      lineSpacing: Math.round(size * 0.6),
    }, extra || {})).setOrigin(0.5);
  },

  title(scene, x, y, str, size, color, extra) {
    const t = scene.add.text(x, y, str, Object.assign({
      fontFamily: UI.titleFont,
      fontSize: size + 'px',
      color: color || '#ffffff',
      align: 'center',
      stroke: '#1a0b00',
      strokeThickness: Math.max(4, Math.round(size / 9)),
    }, extra || {})).setOrigin(0.5);
    t.setShadow(0, Math.round(size / 14), '#000000', 0, true, true);
    t.setPadding(10, 4, 10, 4);
    return t;
  },

  hex(c) {
    return '#' + c.toString(16).padStart(6, '0');
  },

  // Tombol persegi dengan sudut tumpul. Mengembalikan container dengan
  // properti tambahan: setFocus(bool), activate(), setLabel(str).
  button(scene, x, y, w, h, label, onClick, opts) {
    opts = opts || {};
    const color = opts.color || 0xffc83d;
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    const t = UI.text(scene, 0, 1, label, opts.size || 16, '#ffffff');
    c.add([g, t]);
    c.setSize(w, h);
    c.focused = false;
    c.disabled = false;
    const draw = () => {
      g.clear();
      const f = c.focused;
      g.fillStyle(0x000000, 0.55).fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, 12);
      g.fillStyle(f ? color : 0x1d1b2e, c.disabled ? 0.5 : 0.95).fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      g.lineStyle(3, f ? 0xffffff : color, c.disabled ? 0.4 : 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      t.setColor(f ? '#1a0b00' : '#ffffff');
      t.setStroke(f ? '#ffffff' : '#000000', f ? 0 : 4);
      t.setAlpha(c.disabled ? 0.5 : 1);
    };
    c.setFocus = (b) => { c.focused = b; draw(); return c; };
    c.setLabel = (s) => { t.setText(s); return c; };
    c.activate = () => {
      if (c.disabled) return;
      Sound.play(opts.sound || 'confirm');
      scene.tweens.add({ targets: c, scale: 0.92, duration: 60, yoyo: true });
      if (onClick) onClick();
    };
    c.setInteractive({ useHandCursor: true });
    if (!opts.noHover) {
      c.on('pointerover', () => { if (c.menu) c.menu.focus(c); else c.setFocus(true); });
      c.on('pointerout', () => { if (!c.menu) c.setFocus(false); });
    }
    c.on('pointerup', () => c.activate());
    draw();
    return c;
  },

  // Navigasi beberapa tombol dengan panah + Enter.
  menu(scene, buttons, opts) {
    opts = opts || {};
    const m = { buttons, index: 0, active: true };
    m.focus = (btn) => {
      const i = buttons.indexOf(btn);
      if (i < 0) return;
      if (i !== m.index) Sound.play('select');
      m.index = i;
      buttons.forEach((b, k) => b.setFocus(k === i));
    };
    m.move = (d) => {
      let i = m.index;
      for (let n = 0; n < buttons.length; n++) {
        i = (i + d + buttons.length) % buttons.length;
        if (!buttons[i].disabled && buttons[i].visible) break;
      }
      m.focus(buttons[i]);
    };
    buttons.forEach((b) => { b.menu = m; });
    m.focus(buttons[opts.start || 0]);
    const kb = scene.input.keyboard;
    const horiz = !!opts.horizontal;
    const onKey = (e) => {
      if (!m.active) return;
      const k = e.code;
      if ((!horiz && (k === 'ArrowUp' || k === 'KeyW')) || (horiz && (k === 'ArrowLeft' || k === 'KeyA'))) m.move(-1);
      else if ((!horiz && (k === 'ArrowDown' || k === 'KeyS')) || (horiz && (k === 'ArrowRight' || k === 'KeyD'))) m.move(1);
      else if (k === 'Enter' || k === 'Space' || k === 'KeyJ' || k === 'KeyZ') buttons[m.index].activate();
    };
    kb.on('keydown', onKey);
    m.destroy = () => kb.off('keydown', onKey);
    scene.events.once('shutdown', m.destroy);
    return m;
  },

  toast(scene, msg, color) {
    const t = UI.text(scene, CFG.W / 2, CFG.H - 60, msg, 16, color || '#ffffff').setDepth(200).setAlpha(0);
    scene.tweens.add({ targets: t, alpha: 1, y: CFG.H - 80, duration: 200 });
    scene.tweens.add({ targets: t, alpha: 0, delay: 1600, duration: 300, onComplete: () => t.destroy() });
    return t;
  },

  // Latar gelap bergaris untuk layar menu.
  menuBackground(scene, tint) {
    const W = CFG.W, H = CFG.H;
    const bg = scene.add.image(W / 2, H, 'bg').setOrigin(0.5, 1);
    bg.setScale(Math.max(W / bg.width, H / bg.height));
    bg.setTint(tint || 0x55607a);
    const g = scene.add.graphics();
    g.fillStyle(0x0b0b14, 0.55).fillRect(0, 0, W, H);
    g.fillStyle(0x000000, 0.18);
    for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
    return bg;
  },

  // Tombol suara kecil di pojok kanan atas.
  soundToggle(scene, x, y) {
    const c = scene.add.container(x, y).setDepth(150);
    const g = scene.add.graphics();
    const t = UI.text(scene, 0, 0, '', 12, '#ffffff');
    c.add([g, t]);
    const draw = () => {
      const m = Sound.isMuted();
      g.clear();
      g.fillStyle(0x000000, 0.5).fillRoundedRect(-62, -20, 124, 40, 10);
      g.lineStyle(2, m ? 0x888888 : 0xffc83d, 1).strokeRoundedRect(-62, -20, 124, 40, 10);
      t.setText(m ? 'SUARA:OFF' : 'SUARA:ON');
      t.setColor(m ? '#999999' : '#ffc83d');
    };
    c.setSize(124, 40).setInteractive({ useHandCursor: true });
    c.on('pointerup', () => {
      Sound.init();
      Sound.setMuted(!Sound.isMuted());
      if (!Sound.isMuted()) Sound.play('select');
      draw();
    });
    draw();
    return c;
  },
};
