// Memuat semua gambar lalu menyiapkan potongan pose tiap karakter.
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const W = CFG.W, H = CFG.H;
    const title = UI.text(this, W / 2, H / 2 - 60, 'MEMUAT...', 20, '#ffc83d');
    const bar = this.add.graphics();
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

    this.load.image('bg', 'assets/bg/sekolah.webp');
    for (const c of ROSTER) {
      if (c.locked) continue;
      this.load.image(c.id, `assets/sprites/${c.id}.webp`);
      this.load.json(c.id + '_data', `assets/sprites/${c.id}.json`);
      this.load.image(c.id + '_portrait', `assets/sprites/${c.id}-portrait.webp`);
      this.load.image(c.id + '_face', `assets/sprites/${c.id}-face.webp`);
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
    this.scene.start('Title');
  }
}
