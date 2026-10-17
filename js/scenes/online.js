// Layar VS ONLINE: buat room (dapat kode 4 angka) atau gabung room dengan kode teman.
class OnlineScene extends Phaser.Scene {
  constructor() { super('Online'); }

  init() {
    this.leaving = false;
    this.view = null;
    this.menu = null;
    this.code = '';
    this.joining = false;
    this.busy = false;
  }

  create() {
    const W = CFG.W;
    Net.close();
    UI.menuBackground(this, 0x6a7290);
    Sound.music('menu');
    this.cameras.main.fadeIn(250, 0, 0, 0);
    UI.title(this, W / 2, 62, 'VS ONLINE', 64, '#ffd75a');
    UI.text(this, W / 2, 114, 'Bertarung melawan temanmu dari HP masing-masing', 12, '#cfd5ea');
    UI.button(this, 104, 46, 170, 50, '◀ KEMBALI', () => this.back(), { size: 12, color: 0x8a8fa8, sound: 'back' });
    UI.soundToggle(this, W - 90, 46);
    UI.fullscreenToggle(this, W - 246, 46);

    this.input.keyboard.on('keydown', (e) => {
      if (e.code === 'Escape') { this.back(); return; }
      if (!this.joining) return;
      if (/^Digit[0-9]$/.test(e.code) || /^Numpad[0-9]$/.test(e.code)) this.typeDigit(e.code.slice(-1));
      else if (e.code === 'Backspace') this.typeDigit('del');
      else if (e.code === 'Enter' || e.code === 'NumpadEnter') this.doJoin();
    });
    this.showMenu();
  }

  clearView() {
    if (this.menu) this.menu.destroy();
    if (this.view) this.view.destroy();
    this.menu = null;
    this.joining = false;
    this.view = this.add.container(0, 0);
    return this.view;
  }

  // Layar awal: pilih buat atau gabung
  showMenu() {
    const W = CFG.W, v = this.clearView();
    Net.close();
    const a = UI.button(this, W / 2, 222, 380, 72, 'BUAT ROOM', () => this.createRoom(), { size: 22, color: 0xff6a2a });
    const b = UI.button(this, W / 2, 316, 380, 72, 'GABUNG ROOM', () => this.showJoin(), { size: 22, color: 0x4aa8ff });
    v.add([a, b]);
    this.menu = UI.menu(this, [a, b]);
    const g = this.add.graphics();
    const bw = Math.min(W - 80, 900);
    g.fillStyle(0x0d0c1c, 0.85).fillRoundedRect(W / 2 - bw / 2, 390, bw, 250, 14);
    g.lineStyle(2, 0x3a3760, 1).strokeRoundedRect(W / 2 - bw / 2, 390, bw, 250, 14);
    v.add(g);
    v.add(UI.text(this, W / 2, 418, 'CARA MAIN ONLINE', 14, '#ffc83d'));
    v.add(UI.text(this, W / 2, 512,
      '1. Pemain pertama menekan BUAT ROOM, lalu memberi tahu KODE ROOM ke temannya.\n' +
      '2. Pemain kedua menekan GABUNG ROOM dan memasukkan kode itu.\n' +
      '3. Masing-masing memilih karakter, lalu bertarung!\n\n' +
      'Kedua HP butuh internet saat menyambung. Paling lancar bila kedua HP\n' +
      'memakai Wi-Fi yang sama, atau HP kedua memakai hotspot HP pertama.',
      11, '#e8e8f0', { lineSpacing: 10 }));
  }

  // Buat room & tunggu teman
  createRoom() {
    const W = CFG.W, v = this.clearView();
    const status = UI.text(this, W / 2, 230, 'Menyiapkan room...', 16, '#ffffff');
    const codeT = UI.title(this, W / 2, 340, '', 140, '#ffd75a');
    const hint = UI.text(this, W / 2, 440, '', 12, '#cfd5ea');
    const cancel = UI.button(this, W / 2, 560, 260, 60, 'BATAL', () => this.showMenu(), { size: 16, color: 0x8a8fa8, sound: 'back' });
    v.add([status, codeT, hint, cancel]);
    this.menu = UI.menu(this, [cancel]);
    Net.load().then(() => {
      if (this.view !== v) return;
      Net.host({
        onCode: (code) => {
          if (this.view !== v) return;
          Sound.play('confirm');
          status.setText('KODE ROOM');
          codeT.setText(code.split('').join(' '));
          hint.setText('Berikan kode ini ke temanmu, lalu tunggu dia bergabung...');
          this.tweens.add({ targets: hint, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
        },
        onJoin: () => this.connected(),
        onError: (msg) => this.fail(msg),
      });
    }).catch((e) => this.fail(e.message));
  }

  // Masukkan kode room teman
  showJoin() {
    const W = CFG.W, v = this.clearView();
    this.joining = true;
    this.code = '';
    v.add(UI.text(this, W / 2, 160, 'MASUKKAN KODE ROOM TEMANMU', 14, '#ffc83d'));
    const box = this.add.graphics();
    box.fillStyle(0x0d0c1c, 0.9).fillRoundedRect(W / 2 - 190, 186, 380, 100, 14);
    box.lineStyle(3, 0x4aa8ff, 1).strokeRoundedRect(W / 2 - 190, 186, 380, 100, 14);
    this.codeT = UI.title(this, W / 2, 238, '', 84, '#ffffff');
    this.joinStatus = UI.text(this, W / 2, 308, '', 12, '#cfd5ea');
    v.add([box, this.codeT, this.joinStatus]);
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
    keys.forEach((k, i) => {
      const x = W / 2 + ((i % 3) - 1) * 150, y = 376 + Math.floor(i / 3) * 80;
      const label = k === 'del' ? 'HAPUS' : k === 'ok' ? 'GABUNG' : k;
      const color = k === 'ok' ? 0x4cd964 : k === 'del' ? 0x8a8fa8 : 0x4aa8ff;
      const b = UI.button(this, x, y, 136, 66, label, () => (k === 'ok' ? this.doJoin() : this.typeDigit(k)),
        { size: k.length > 1 ? 14 : 28, color, sound: 'select', noHover: true });
      v.add(b);
    });
    this.refreshCode();
  }

  typeDigit(k) {
    if (!this.joining || this.busy) return;
    if (k === 'del') this.code = this.code.slice(0, -1);
    else if (this.code.length < 4) this.code += k;
    Sound.play('select');
    this.refreshCode();
  }

  refreshCode() {
    const s = this.code.padEnd(4, '_');
    this.codeT.setText(s.split('').join(' '));
  }

  doJoin() {
    if (!this.joining || this.busy) return;
    if (this.code.length < 4) {
      Sound.play('locked');
      this.joinStatus.setText('Kode room terdiri dari 4 angka').setColor('#ff8a5a');
      return;
    }
    const v = this.view;
    this.busy = true;
    this.joinStatus.setText('Menyambung ke room ' + this.code + '...').setColor('#ffffff');
    Net.load().then(() => {
      if (this.view !== v) return;
      Net.join(this.code, {
        onJoin: () => this.connected(),
        onError: (msg) => { this.busy = false; if (this.view === v) this.joinStatus.setText(msg).setColor('#ff6a6a'); Sound.play('locked'); },
      });
    }).catch((e) => { this.busy = false; this.joinStatus.setText(e.message).setColor('#ff6a6a'); });
  }

  connected() {
    if (this.leaving) return;
    this.leaving = true;
    this.busy = false;
    Net.watch(this);
    const W = CFG.W, v = this.clearView();
    Sound.play('confirm');
    v.add(UI.title(this, W / 2, 330, 'TERSAMBUNG!', 96, '#4cd964'));
    v.add(UI.text(this, W / 2, 410, Net.isHost ? 'Temanmu sudah bergabung' : 'Berhasil masuk ke room ' + Net.code, 14, '#ffffff'));
    this.time.delayedCall(900, () => {
      if (this.netLost) return;
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Select', { mode: 'online' }));
    });
  }

  fail(msg) {
    const W = CFG.W, v = this.clearView();
    Net.close();
    Sound.play('locked');
    v.add(UI.text(this, W / 2, 280, msg, 16, '#ff6a6a', { wordWrap: { width: W * 0.7 } }));
    const b = UI.button(this, W / 2, 400, 300, 64, 'COBA LAGI', () => this.showMenu(), { size: 18, color: 0xff6a2a });
    v.add(b);
    this.menu = UI.menu(this, [b]);
  }

  back() {
    if (this.leaving) return;
    Net.close();
    this.scene.start('Title');
  }
}
