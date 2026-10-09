// Layar judul + panduan cara bermain.
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const W = CFG.W, H = CFG.H;
    this.leaving = false;
    this.help = null;
    UI.menuBackground(this, 0x9aa3c0);
    Sound.music('menu');

    // Simbol pusaran besar di belakang judul
    const swirl = this.add.image(W / 2, 190, 'fx_swirl').setTint(0xff7a1a).setAlpha(0.18).setScale(4.2);
    this.tweens.add({ targets: swirl, angle: 360, duration: 24000, repeat: -1 });

    // Karakter bergiliran tampil (3 sekaligus) + siluet "karakter berikutnya"
    const chars = ROSTER.filter((c) => !c.locked);
    const spots = [
      { x: W * 0.13, s: 0.88, d: 2 },
      { x: W * 0.29, s: 0.74, tint: 0xb8b8c8, d: 1 },
      { x: W * 0.87, s: 0.88, d: 2, flip: true },
    ];
    const heroes = spots.map((sp) => {
      const img = this.add.image(sp.x, H + 400, chars[0].id + '_portrait').setOrigin(0.5, 1).setDepth(sp.d).setFlipX(!!sp.flip);
      if (sp.tint) img.setTint(sp.tint);
      img.spot = sp;
      return img;
    });
    let group = 0;
    const groups = Math.ceil(chars.length / 3);
    const show = (first) => {
      heroes.forEach((img, i) => {
        const c = chars[(group * 3 + i) % chars.length];
        const enter = () => {
          img.setTexture(c.id + '_portrait').setScale(img.spot.s);
          img.y = H + 400;
          this.tweens.add({ targets: img, y: H + 8, duration: 650, delay: (first ? 150 : 0) + i * 120, ease: 'Back.easeOut' });
        };
        if (first) enter();
        else this.tweens.add({ targets: img, y: H + 420, duration: 280, delay: i * 80, ease: 'Cubic.easeIn', onComplete: enter });
      });
      group = (group + 1) % groups;
    };
    show(true);
    if (groups > 1) this.time.addEvent({ delay: 4500, loop: true, callback: () => show(false) });
    const ghost = this.add.image(W * 0.71, H + 400, chars[0].id + '_portrait').setOrigin(0.5, 1)
      .setScale(0.74).setTintFill(0x10101c).setAlpha(0.85).setFlipX(true).setDepth(1);
    this.tweens.add({ targets: ghost, y: H + 8, duration: 700, delay: 500, ease: 'Back.easeOut' });
    const q = UI.title(this, W * 0.71, H - 250, '?', 110, '#ffc83d').setAlpha(0).setDepth(1);
    this.tweens.add({ targets: q, alpha: 0.9, delay: 1100, duration: 400 });

    // Judul
    const t1 = UI.title(this, W / 2, 128, 'SEIKIJANG', 132, '#ffd75a').setDepth(5);
    const t2 = UI.title(this, W / 2, 238, 'FIGHTER', 104, '#ff6a2a').setDepth(5);
    this.gradient(t1, ['#fff3b0', '#ffc83d', '#ff8a1a']);
    this.gradient(t2, ['#ffb070', '#ff5a2a', '#c4200e']);
    [t1, t2].forEach((t, i) => {
      t.setScale(0.2).setAlpha(0);
      this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 500, delay: i * 150, ease: 'Back.easeOut' });
    });
    UI.text(this, W / 2, 312, CFG.SUBTITLE, 16, '#ffffff').setDepth(5);

    const start = UI.button(this, W / 2, 420, 320, 76, 'MULAI', () => this.go(), { size: 26, color: 0xff6a2a });
    const help = UI.button(this, W / 2, 516, 320, 60, 'CARA MAIN', () => this.showHelp(), { size: 18, color: 0x4aa8ff });
    [start, help].forEach((b) => b.setDepth(6));
    this.menu = UI.menu(this, [start, help]);
    this.tweens.add({ targets: start, scale: 1.05, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    UI.soundToggle(this, W - 90, 40);
    UI.text(this, W - 16, H - 16, 'v' + CFG.VERSION, 10, '#9aa3c0').setOrigin(1, 1).setDepth(6);
    const hint = this.sys.game.device.input.touch ? 'Tekan MULAI untuk bermain layar penuh' : 'Gunakan panah & Enter untuk memilih';
    UI.text(this, W / 2, H - 26, hint, 11, '#cfd5ea').setDepth(6);

    this.input.keyboard.on('keydown-ESC', () => this.hideHelp());
  }

  gradient(t, colors) {
    const g = t.context.createLinearGradient(0, 0, 0, t.height);
    colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
    t.setFill(g);
  }

  go() {
    if (this.leaving) return;
    this.leaving = true;
    Sound.init();
    // Di HP: masuk layar penuh & kunci posisi mendatar bila didukung browser
    if (this.sys.game.device.input.touch && !this.scale.isFullscreen) {
      try {
        this.scale.startFullscreen();
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
      } catch (e) { /* tidak didukung */ }
    }
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Select'));
  }

  showHelp() {
    if (this.help) return;
    const W = CFG.W, H = CFG.H;
    this.menu.active = false;
    const c = this.add.container(0, 0).setDepth(50);
    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0).setInteractive();
    const pw = Math.min(W - 60, 1040), ph = 640;
    const g = this.add.graphics();
    g.fillStyle(0x15132a, 0.97).fillRoundedRect(W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 18);
    g.lineStyle(4, 0xffc83d, 1).strokeRoundedRect(W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 18);
    c.add([dim, g]);
    c.add(UI.title(this, W / 2, H / 2 - ph / 2 + 44, 'CARA MAIN', 52, '#ffc83d'));
    const rows = [
      ['GERAK', '◀ ▶', '← → / A D'],
      ['LOMPAT', '▲', '↑ / W / SPASI'],
      ['TAHAN (BLOK)', '▼', '↓ / S'],
      ['PUKUL', 'PUKUL', 'J / Z'],
      ['TENDANG', 'TENDANG', 'K / X'],
      ['JURUS NINJA', 'JURUS', 'L / C'],
      ['ISI CAKRA (tahan)', 'CAKRA', 'U / V'],
      ['JURUS PAMUNGKAS', 'ULTI', 'I / B'],
      ['JEDA', '❚❚', 'ESC / P'],
    ];
    const x0 = W / 2 - pw / 2 + 50, x1 = W / 2 + 10, x2 = W / 2 + pw / 2 - 50;
    const top = H / 2 - ph / 2 + 104;
    const head = (x, s, o) => c.add(UI.text(this, x, top, s, 12, '#7fd8ff').setOrigin(o, 0.5));
    head(x0, 'AKSI', 0);
    head(x1, 'LAYAR SENTUH', 0.5);
    head(x2, 'KEYBOARD', 1);
    rows.forEach((r, i) => {
      const y = top + 36 + i * 36;
      c.add(UI.text(this, x0, y, r[0], 13, '#ffffff').setOrigin(0, 0.5));
      c.add(UI.text(this, x1, y, r[1], 13, '#ffc83d').setOrigin(0.5, 0.5));
      c.add(UI.text(this, x2, y, r[2], 13, '#ffffff').setOrigin(1, 0.5));
    });
    const tips = 'TIPS: Tekan PUKUL 3x untuk kombo. Isi cakra saat lawan jauh.\nJurus butuh cakra. Saat cakra penuh, tombol ULTI menyala!';
    c.add(UI.text(this, W / 2, top + 36 + rows.length * 36 + 30, tips, 11, '#b8f0d0'));
    const ok = UI.button(this, W / 2, H / 2 + ph / 2 - 44, 200, 54, 'OKE', () => this.hideHelp(), { size: 18 });
    ok.setFocus(true);
    c.add(ok);
    this.help = c;
    // ditunda agar tombol Enter yang membuka panel ini tidak langsung menutupnya
    this.time.delayedCall(150, () => this.input.keyboard.once('keydown-ENTER', () => this.hideHelp()));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 150 });
  }

  hideHelp() {
    if (!this.help) return;
    const c = this.help;
    this.help = null;
    this.tweens.add({ targets: c, alpha: 0, duration: 120, onComplete: () => c.destroy() });
    this.time.delayedCall(150, () => { this.menu.active = true; });
  }
}
