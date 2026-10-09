// Layar "VS" sebelum pertarungan.
class VersusScene extends Phaser.Scene {
  constructor() { super('Versus'); }

  init(data) {
    this.match = data;
    this.leaving = false;
  }

  create() {
    const W = CFG.W, H = CFG.H;
    const a = getChar(this.match.p1), b = getChar(this.match.cpu);
    const diff = CFG.DIFFICULTY[this.match.diff];
    Sound.music(null);
    Sound.play('cutin');

    this.add.rectangle(0, 0, W, H, 0x0b0b14).setOrigin(0);
    const g = this.add.graphics();
    g.fillStyle(a.color, 0.35).fillPoints([{ x: 0, y: 0 }, { x: W / 2 + 90, y: 0 }, { x: W / 2 - 90, y: H }, { x: 0, y: H }], true);
    g.fillStyle(b.color, 0.35).fillPoints([{ x: W / 2 + 90, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: W / 2 - 90, y: H }], true);
    g.lineStyle(10, 0xffffff, 0.9).lineBetween(W / 2 + 90, 0, W / 2 - 90, H);

    // garis kecepatan
    for (let i = 0; i < 26; i++) {
      const left = i % 2 === 0;
      const line = this.add.image(left ? -200 : W + 200, Phaser.Math.Between(0, H), 'fx_line')
        .setTint(left ? a.color : b.color).setAlpha(0.5).setScale(Phaser.Math.FloatBetween(1, 3), 1);
      this.tweens.add({
        targets: line, x: left ? W * 0.6 : W * 0.4, duration: Phaser.Math.Between(400, 900),
        delay: Phaser.Math.Between(0, 1600), repeat: -1,
      });
    }

    const pa = this.add.image(-300, H + 30, a.id + '_portrait').setOrigin(0.5, 1).setScale(1.12);
    const pb = this.add.image(W + 300, H + 30, b.id + '_portrait').setOrigin(0.5, 1).setScale(1.12).setFlipX(true);
    if (a.id === b.id) pb.setTint(0xc9b6ff);
    this.tweens.add({ targets: pa, x: W * 0.24, duration: 450, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: pb, x: W * 0.76, duration: 450, ease: 'Cubic.easeOut' });

    const na = UI.title(this, W * 0.24, H - 92, a.name, 64, UI.hex(a.color)).setAlpha(0);
    const nb = UI.title(this, W * 0.76, H - 92, b.name, 64, UI.hex(b.color)).setAlpha(0);
    const la = UI.text(this, W * 0.24, H - 40, 'KAMU', 14, '#ffffff').setAlpha(0);
    const lb = UI.text(this, W * 0.76, H - 40, 'CPU - ' + diff.name, 14, '#ffffff').setAlpha(0);
    const qa = UI.text(this, W * 0.24, 70, '"' + a.quotes.intro + '"', 12, '#ffffff', { wordWrap: { width: W * 0.4 } }).setAlpha(0);
    const qb = UI.text(this, W * 0.76, 70, '"' + b.quotes.intro + '"', 12, '#ffffff', { wordWrap: { width: W * 0.4 } }).setAlpha(0);
    this.tweens.add({ targets: [na, nb, la, lb], alpha: 1, delay: 350, duration: 250 });
    this.tweens.add({ targets: qa, alpha: 1, delay: 700, duration: 300 });
    this.tweens.add({ targets: qb, alpha: 1, delay: 1100, duration: 300 });

    const vs = UI.title(this, W / 2, H / 2 - 20, 'VS', 200, '#ffd75a').setScale(4).setAlpha(0);
    const grad = vs.context.createLinearGradient(0, 0, 0, vs.height);
    grad.addColorStop(0, '#fff3b0');
    grad.addColorStop(0.5, '#ffc83d');
    grad.addColorStop(1, '#ff5a2a');
    vs.setFill(grad);
    this.tweens.add({
      targets: vs, scale: 1, alpha: 1, delay: 450, duration: 260, ease: 'Back.easeOut',
      onStart: () => this.time.delayedCall(200, () => {
        Sound.play('heavy');
        this.cameras.main.shake(250, 0.015);
        this.cameras.main.flash(150, 255, 255, 255);
      }),
    });

    const go = () => {
      if (this.leaving) return;
      this.leaving = true;
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Fight', this.match));
    };
    this.time.delayedCall(3000, go);
    this.time.delayedCall(800, () => {
      this.input.once('pointerup', go);
      this.input.keyboard.once('keydown', go);
    });
  }
}
