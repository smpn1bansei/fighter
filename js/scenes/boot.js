// Memuat semua gambar lalu menyiapkan potongan pose tiap karakter.
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const W = CFG.W, H = CFG.H;
    const title = UI.text(this, W / 2, H / 2 - 60, 'MEMUAT...', 20, '#ffc83d');
    const bar = this.add.graphics();
    this.loadingUI = [title, bar];
    const draw = (v) => {
      bar.clear();
      bar.lineStyle(3, 0xffffff, 0.8).strokeRoundedRect(W / 2 - 250, H / 2 - 16, 500, 32, 8);
      bar.fillStyle(0xffc83d, 1).fillRoundedRect(W / 2 - 244, H / 2 - 10, 488 * v, 20, 5);
    };
    draw(0);
    this.load.on('progress', draw);
    this.load.on('loaderror', (file) => {
      title.setText('GAGAL MEMUAT: ' + file.key).setColor('#ff6060');
    });

    const v = '?v=' + CFG.VERSION; // agar HP memuat gambar terbaru setelah game diperbarui
    this.load.image('bg', 'assets/bg/sekolah.webp' + v);
    for (const c of ROSTER) {
      if (c.locked) continue;
      this.load.image(c.id, `assets/sprites/${c.id}.webp${v}`);
      this.load.json(c.id + '_data', `assets/sprites/${c.id}.json${v}`);
      this.load.image(c.id + '_portrait', `assets/sprites/${c.id}-portrait.webp${v}`);
      this.load.image(c.id + '_face', `assets/sprites/${c.id}-face.webp${v}`);
    }
  }

  create() {
    FX.makeTextures(this);
    for (const c of ROSTER) {
      if (c.locked) continue;
      const tex = this.textures.get(c.id);
      const data = this.cache.json.get(c.id + '_data');
      FRAMES[c.id] = {};
      for (const [name, f] of Object.entries(data.frames)) {
        tex.add(name, 0, f.x, f.y, f.w, f.h);
        FRAMES[c.id][name] = f;
      }
    }
    this.startGate();
  }

  // Layar "sentuh untuk mulai": sentuhan pertama dipakai untuk masuk layar penuh
  // (browser HP hanya mengizinkan layar penuh setelah layar disentuh).
  startGate() {
    const W = CFG.W, H = CFG.H;
    this.loadingUI.forEach((o) => o.destroy());
    const touch = this.sys.game.device.input.touch;
    UI.menuBackground(this, 0x7a83a0);
    const t1 = UI.title(this, W / 2, H / 2 - 120, 'SEIKIJANG', 120, '#ffd75a');
    const t2 = UI.title(this, W / 2, H / 2 - 20, 'FIGHTER', 92, '#ff6a2a');
    [t1, t2].forEach((t) => {
      const g = t.context.createLinearGradient(0, 0, 0, t.height);
      g.addColorStop(0, '#fff3b0');
      g.addColorStop(1, t === t1 ? '#ff8a1a' : '#c4200e');
      t.setFill(g);
    });
    const msg = UI.text(this, W / 2, H / 2 + 110, touch ? 'SENTUH LAYAR UNTUK MULAI' : 'KLIK ATAU TEKAN TOMBOL APA SAJA', 22, '#ffffff');
    this.tweens.add({ targets: msg, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });
    if (touch) UI.text(this, W / 2, H / 2 + 160, 'Game akan tampil layar penuh & mendatar', 12, '#cfd5ea');
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      Sound.init();
      if (touch) UI.goFullscreen(this);
      Sound.play('confirm');
      this.scene.start('Title');
    };
    this.input.once('pointerup', go);
    this.input.keyboard.once('keydown', go);
  }
}
