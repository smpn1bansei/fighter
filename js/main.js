// Titik awal game.
(function () {
  // Jaring pengaman: di Phaser, satu error saja bisa menghentikan seluruh putaran game
  // (layar membeku). Di sini error ditangkap agar game tetap berjalan, lalu dilaporkan.
  const step = Phaser.Game.prototype.step;
  let reported = false;
  Phaser.Game.prototype.step = function (time, delta) {
    try {
      step.call(this, time, delta);
    } catch (e) {
      console.error(e);
      if (!reported) {
        reported = true;
        showError(e);
      }
    }
  };

  function showError(e) {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:20;padding:8px 12px;' +
      'background:rgba(120,20,20,.92);color:#fff;font:12px monospace;border-radius:8px;pointer-events:none;';
    box.textContent = 'Terjadi kesalahan kecil (game tetap berjalan): ' + (e && e.message ? e.message : e);
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 9000);
  }

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    window.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: CFG.W,
      height: CFG.H,
      backgroundColor: '#000000',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: { activePointers: 5 },
      render: { antialias: true, powerPreference: 'high-performance' },
      disableContextMenu: true,
      banner: false,
      scene: [BootScene, TitleScene, SelectScene, VersusScene, FightScene],
    });
  };
  // Tunggu font pixel siap agar teks tidak tampil dengan font cadangan.
  const fonts = document.fonts
    ? Promise.all([document.fonts.load('16px PressStart'), document.fonts.load('16px Bangers')])
    : Promise.resolve();
  Promise.race([fonts, new Promise((r) => setTimeout(r, 2500))]).then(start, start);
})();
