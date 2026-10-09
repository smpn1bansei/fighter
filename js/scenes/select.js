// Layar pilih karakter: 1) pilih karaktermu  2) pilih lawan (CPU)  3) pilih tingkat kesulitan.
class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }

  init(data) {
    this.leaving = false;
    this.step = 1;
    this.p1 = null;
    this.cpu = null;
    this.cursor = 0;
    this.diff = Store.get('difficulty', 1);
    if (data && data.p1) {
      this.p1 = data.p1;
      this.cursor = ROSTER.findIndex((c) => c.id === data.p1);
    }
  }

  create() {
    const W = CFG.W, H = CFG.H;
    UI.menuBackground(this, 0x6a7290);
    Sound.music('menu');
    this.cameras.main.fadeIn(250, 0, 0, 0);

    this.header = UI.title(this, W / 2, 52, '', 54, '#ffd75a');
    this.subheader = UI.text(this, W / 2, 98, '', 12, '#cfd5ea');

    // Panel kiri (pemain) & kanan (CPU)
    this.panels = [this.makePanel(0), this.makePanel(1)];

    // Kisi 12 slot
    const cols = 6, size = 92, gap = 12;
    const gw = cols * size + (cols - 1) * gap;
    this.slots = ROSTER.map((c, i) => {
      const x = W / 2 - gw / 2 + size / 2 + (i % cols) * (size + gap);
      const y = 190 + Math.floor(i / cols) * (size + gap);
      return this.makeSlot(c, i, x, y, size);
    });

    // Kotak info karakter
    this.info = this.add.container(W / 2, 0);
    const ig = this.add.graphics();
    ig.fillStyle(0x0d0c1c, 0.85).fillRoundedRect(-gw / 2, 354, gw, 212, 14);
    ig.lineStyle(2, 0x3a3760, 1).strokeRoundedRect(-gw / 2, 354, gw, 212, 14);
    this.infoName = UI.title(this, 0, 386, '', 40, '#ffffff');
    this.infoElem = UI.text(this, 0, 420, '', 11, '#7fd8ff');
    this.infoDesc = UI.text(this, 0, 460, '', 11, '#e8e8f0', { wordWrap: { width: gw - 50 }, lineSpacing: 8 });
    this.infoJ = UI.text(this, 0, 510, '', 11, '#ffc83d');
    this.infoU = UI.text(this, 0, 538, '', 11, '#ff8a5a');
    this.info.add([ig, this.infoName, this.infoElem, this.infoDesc, this.infoJ, this.infoU]);

    // Pilihan tingkat kesulitan (langkah 3)
    this.diffBox = this.add.container(W / 2, 0).setVisible(false);
    const dg = this.add.graphics();
    dg.fillStyle(0x0d0c1c, 0.92).fillRoundedRect(-gw / 2, 354, gw, 212, 14);
    dg.lineStyle(2, 0xffc83d, 1).strokeRoundedRect(-gw / 2, 354, gw, 212, 14);
    this.diffBox.add([dg, UI.title(this, 0, 392, 'TINGKAT KESULITAN', 36, '#ffd75a')]);
    this.diffBtns = CFG.DIFFICULTY.map((d, i) => {
      const b = UI.button(this, (i - 1) * 196, 464, 180, 62, d.name, () => this.pickDiff(i), { size: 16, color: d.color, sound: 'select', noHover: true });
      this.diffBox.add(b);
      return b;
    });
    this.diffDesc = UI.text(this, 0, 530, '', 12, '#e8e8f0');
    this.diffBox.add(this.diffDesc);

    // Tombol di bawah panel masing-masing (jauh dari tengah bawah layar, tempat
    // munculnya pesan "layar penuh" di HP).
    this.pickBtn = UI.button(this, 168, H - 56, 280, 64, 'PILIH', () => this.confirm(), { size: 22, color: 0xff6a2a, noHover: true });
    this.startBtn = UI.button(this, W - 168, H - 56, 280, 64, 'MULAI TANDING!', () => this.confirm(), { size: 17, color: 0x4cd964, noHover: true });
    [this.pickBtn, this.startBtn].forEach((b) => {
      b.setFocus(true);
      this.tweens.add({ targets: b, scale: 1.05, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    this.backBtn = UI.button(this, 104, 46, 170, 50, '◀ KEMBALI', () => this.back(), { size: 12, color: 0x8a8fa8, sound: 'back' });

    // Keyboard
    const kb = this.input.keyboard;
    kb.on('keydown', (e) => {
      const k = e.code;
      if (k === 'ArrowLeft' || k === 'KeyA') this.moveCursor(-1, 0);
      else if (k === 'ArrowRight' || k === 'KeyD') this.moveCursor(1, 0);
      else if (k === 'ArrowUp' || k === 'KeyW') this.moveCursor(0, -1);
      else if (k === 'ArrowDown' || k === 'KeyS') this.moveCursor(0, 1);
      else if (k === 'Enter' || k === 'Space' || k === 'KeyJ' || k === 'KeyZ') this.confirm();
      else if (k === 'Escape' || k === 'Backspace' || k === 'KeyK' || k === 'KeyX') this.back();
    });

    UI.soundToggle(this, W - 90, 46);
    UI.fullscreenToggle(this, W - 246, 46);
    if (this.p1) this.step = 2;
    this.refresh();
  }

  makePanel(side) {
    const W = CFG.W;
    const x = side === 0 ? 168 : W - 168;
    const c = this.add.container(x, 0);
    const g = this.add.graphics();
    const color = side === 0 ? 0x4aa8ff : 0xff4d4d;
    g.fillStyle(color, 0.12).fillRoundedRect(-148, 120, 296, 496, 16);
    g.lineStyle(3, color, 0.7).strokeRoundedRect(-148, 120, 296, 496, 16);
    const label = UI.text(this, 0, 142, side === 0 ? 'KAMU' : 'KOMPUTER', 14, UI.hex(color));
    const img = this.add.image(0, 548, 'bg').setOrigin(0.5, 1).setVisible(false);
    const q = UI.title(this, 0, 360, '?', 120, '#3a3760');
    const name = UI.title(this, 0, 572, '', 34, '#ffffff');
    const title = UI.text(this, 0, 600, '', 10, '#cfd5ea');
    const stamp = UI.title(this, 0, 300, 'SIAP!', 64, '#ffd75a').setAngle(-12).setVisible(false);
    c.add([g, q, img, label, name, title, stamp]);
    return { c, img, q, name, title, stamp, id: null, side };
  }

  setPanel(p, char, locked) {
    if (!char || char.locked) {
      p.img.setVisible(false);
      p.q.setVisible(true);
      p.name.setText(char ? '???' : '');
      p.title.setText(char ? 'SEGERA HADIR' : '');
      p.id = null;
    } else {
      if (p.id !== char.id) {
        p.img.setTexture(char.id + '_portrait').setVisible(true).setFlipX(p.side === 1);
        // pose yang lebar diperkecil agar muat di panel
        p.img.setScale(Math.min(0.74, 330 / p.img.width));
        p.img.x = p.side === 0 ? -30 : 30;
        this.tweens.add({ targets: p.img, x: 0, duration: 160, ease: 'Cubic.easeOut' });
        p.id = char.id;
      }
      p.q.setVisible(false);
      p.name.setText(char.name);
      p.title.setText(char.title.toUpperCase());
    }
    p.stamp.setVisible(!!locked);
    if (locked) {
      p.stamp.setScale(2).setAlpha(0);
      this.tweens.add({ targets: p.stamp, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    }
  }

  makeSlot(c, i, x, y, size) {
    const cont = this.add.container(x, y);
    const g = this.add.graphics();
    cont.add(g);
    if (c.locked) {
      cont.add(this.add.image(0, -4, 'fx_lock').setScale(0.75));
      cont.add(UI.text(this, 0, 30, '???', 10, '#6a6f88'));
    } else {
      const face = this.add.image(0, 0, c.id + '_face');
      face.setScale((size - 10) / Math.max(face.width, face.height));
      cont.add(face);
    }
    const badge = UI.text(this, 0, -size / 2 - 2, '', 10, '#ffffff').setOrigin(0.5, 1);
    cont.add(badge);
    cont.setSize(size, size).setInteractive({ useHandCursor: true });
    cont.on('pointerup', () => {
      if (this.step === 3) return;
      if (this.cursor === i) this.confirm();
      else {
        this.cursor = i;
        Sound.play('select');
        this.refresh();
      }
    });
    return { c: cont, g, badge, size, char: c };
  }

  moveCursor(dx, dy) {
    if (this.step === 3) {
      if (dx) this.pickDiff((this.diff + dx + 3) % 3);
      return;
    }
    const cols = 6, n = ROSTER.length;
    let i = this.cursor;
    if (dx) i = (Math.floor(i / cols) * cols) + ((i % cols) + dx + cols) % cols;
    if (dy) i = (i + dy * cols + n) % n;
    this.cursor = i;
    Sound.play('select');
    this.refresh();
  }

  confirm() {
    if (this.step === 3) {
      this.startMatch();
      return;
    }
    const c = ROSTER[this.cursor];
    if (c.locked) {
      Sound.play('locked');
      UI.toast(this, 'Karakter ini segera hadir!', '#ffc83d');
      this.tweens.add({ targets: this.slots[this.cursor].c, x: '+=6', duration: 40, yoyo: true, repeat: 3 });
      return;
    }
    Sound.play('confirm');
    if (this.step === 1) {
      this.p1 = c.id;
      this.step = 2;
      // pindahkan kursor ke karakter lain sebagai usulan lawan
      const others = ROSTER.filter((r) => !r.locked && r.id !== c.id);
      if (others.length) this.cursor = ROSTER.indexOf(Phaser.Utils.Array.GetRandom(others));
    } else if (this.step === 2) {
      this.cpu = c.id;
      this.step = 3;
    }
    this.refresh();
  }

  back() {
    if (this.step === 1) {
      this.scene.start('Title');
      return;
    }
    Sound.play('back');
    if (this.step === 3) {
      this.cpu = null;
      this.step = 2;
    } else if (this.step === 2) {
      this.cursor = ROSTER.findIndex((c) => c.id === this.p1);
      this.p1 = null;
      this.step = 1;
    }
    this.refresh();
  }

  pickDiff(i) {
    this.diff = i;
    Store.set('difficulty', i);
    this.refresh();
  }

  startMatch() {
    if (this.leaving) return;
    this.leaving = true;
    Sound.play('confirm');
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Versus', { p1: this.p1, cpu: this.cpu, diff: this.diff });
    });
  }

  refresh() {
    const cur = ROSTER[this.cursor];
    const headers = ['', 'PILIH KARAKTERMU', 'PILIH LAWANMU', 'SIAP BERTARUNG?'];
    const subs = ['', 'Sentuh kotak karakter, lalu tekan PILIH', 'Lawanmu akan dikendalikan komputer', 'Pilih tingkat kesulitan lalu MULAI'];
    this.header.setText(headers[this.step]);
    this.subheader.setText(subs[this.step]);

    // Panel
    if (this.step === 1) {
      this.setPanel(this.panels[0], cur, false);
      this.setPanel(this.panels[1], null, false);
    } else if (this.step === 2) {
      this.setPanel(this.panels[0], getChar(this.p1), true);
      this.setPanel(this.panels[1], cur, false);
    } else {
      this.setPanel(this.panels[0], getChar(this.p1), true);
      this.setPanel(this.panels[1], getChar(this.cpu), true);
    }
    this.panels[0].stamp.setVisible(this.step >= 2);
    this.panels[1].stamp.setVisible(this.step >= 3);

    // Slot
    this.slots.forEach((s, i) => {
      const g = s.g, half = s.size / 2;
      const isCur = i === this.cursor && this.step < 3;
      const isP1 = s.char.id === this.p1, isCpu = s.char.id === this.cpu;
      g.clear();
      g.fillStyle(s.char.locked ? 0x16152a : 0x24223f, 1).fillRoundedRect(-half, -half, s.size, s.size, 10);
      let col = 0x3a3760, w = 2;
      if (isP1) { col = 0x4aa8ff; w = 4; }
      if (isCpu) { col = 0xff4d4d; w = 4; }
      if (isCur) { col = this.step === 1 ? 0x4aa8ff : 0xff4d4d; w = 5; }
      g.lineStyle(w, col, 1).strokeRoundedRect(-half, -half, s.size, s.size, 10);
      s.badge.setText(isP1 && isCpu ? 'KAMU/CPU' : isP1 ? 'KAMU' : isCpu ? 'CPU' : '');
      s.badge.setColor(isP1 ? '#4aa8ff' : '#ff4d4d');
      s.c.setScale(isCur ? 1.08 : 1);
    });

    // Info / kesulitan
    const showDiff = this.step === 3;
    this.info.setVisible(!showDiff);
    this.diffBox.setVisible(showDiff);
    if (!showDiff) {
      if (cur.locked) {
        this.infoName.setText('???');
        this.infoElem.setText('');
        this.infoDesc.setText('Karakter rahasia ini sedang disiapkan.\nNantikan kehadirannya!');
        this.infoJ.setText('');
        this.infoU.setText('');
      } else {
        this.infoName.setText(cur.name).setColor(UI.hex(cur.color));
        this.infoElem.setText('ELEMEN: ' + cur.element);
        this.infoDesc.setText(cur.desc);
        this.infoJ.setText('JURUS: ' + cur.jurus.name);
        this.infoU.setText('PAMUNGKAS: ' + cur.ulti.name);
      }
    } else {
      this.diffBtns.forEach((b, i) => b.setFocus(i === this.diff));
      this.diffDesc.setText(CFG.DIFFICULTY[this.diff].desc);
    }
    // tombol PILIH berada di bawah panel pemain yang sedang dipilih
    this.pickBtn.setVisible(this.step < 3);
    this.pickBtn.x = this.step === 1 ? 168 : CFG.W - 168;
    this.startBtn.setVisible(this.step === 3);
  }
}
