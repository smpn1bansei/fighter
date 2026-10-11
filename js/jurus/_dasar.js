// =====================================================================
// DASAR JURUS: alat bantu, kelas Actor, efek bersama, dorongan ke ujung arena
// =====================================================================

// =====================================================================
// JURUS (NINJUTSU)
// Tiap jurus adalah "naskah" yang dijalankan langkah demi langkah.
// step(t) mengembalikan false bila jurus selesai.
// =====================================================================
const ADD = () => Phaser.BlendModes.ADD;

window.rectsOverlap = function (a, b) {
  return !!a && !!b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
};

const circleRect = (x, y, r) => ({ x: x - r, y: y - r, w: r * 2, h: r * 2 });

const rnd = Phaser.Math.Between;

// Objek dinamis di arena (proyektil, pilar api, gelombang batu).
class Actor {
  constructor(scene, owner) {
    this.scene = scene;
    this.owner = owner;
    this.t = 0;
    this.dead = false;
    scene.actors.push(this);
  }
  step() { return true; }
  destroy() { this.dead = true; }
  // Hapus semua gambar milik objek ini (dipanggil saat ronde direset).
  dispose() {
    this.dead = true;
    [].concat(this.vis || [], this.beams || [], this.seal || [], this.sealBase || [], this.sealGlow || []).forEach((o) => o.destroy());
  }
  // Tabrakan dengan proyektil lawan: yang lebih kuat menang.
  clash() {
    if (!this.projectile) return false;
    const r = this.rect();
    for (const o of this.scene.actors) {
      if (o === this || o.dead || !o.projectile || o.owner === this.owner) continue;
      if (!rectsOverlap(r, o.rect())) continue;
      this.scene.fx.hit((this.x + o.x) / 2, (this.y + o.y) / 2, true, 0xffffff);
      Sound.play('explosion');
      if (o.power <= this.power) o.explode(true);
      if (this.power <= o.power) { this.explode(true); return true; }
    }
    return false;
  }
}

function fadeOut(scene, obj, ms, extra) {
  if (!obj) return;
  const list = [].concat(obj).filter(Boolean);
  scene.tweens.add(Object.assign({ targets: list, alpha: 0, duration: ms || 200, onComplete: () => list.forEach((o) => o.destroy()) }, extra || {}));
}

window.JUTSU = {};

// Percikan listrik kecil
function zapAt(sc, x, y, color) {
  sc.fx.image('fx_bolt' + rnd(0, 2), x, y, { tint: color, from: 0.4, to: 0.9, angle: rnd(0, 180), ms: 160 });
  sc.fx.image('fx_bolt' + rnd(0, 2), x, y, { tint: 0xffffff, from: 0.3, to: 0.7, angle: rnd(0, 180), ms: 120 });
  sc.fx.burst(sc.fx.sparks, x, y, 8, color);
}

// Sinar panjang sampai tepi layar (Kamehameha & laser)
function makeBeam(sc, outerColor, midColor) {
  const c = sc.add.container(0, 0).setDepth(33);
  const outer = sc.add.image(0, 0, 'fx_hbeam').setOrigin(0, 0.5).setTint(outerColor).setBlendMode(ADD());
  const mid = sc.add.image(0, 0, 'fx_hbeam').setOrigin(0, 0.5).setTint(midColor).setBlendMode(ADD());
  const core = sc.add.image(0, 0, 'fx_hbeam').setOrigin(0, 0.5).setTint(0xffffff).setBlendMode(ADD());
  const head = sc.add.image(0, 0, 'fx_glow').setTint(midColor).setBlendMode(ADD());
  const tip = sc.add.image(0, 0, 'fx_glow').setTint(midColor).setBlendMode(ADD());
  c.add([outer, mid, core, head, tip]);
  c.set = (len, th, facing) => {
    const sx = Math.max(0.01, len / 256);
    outer.setScale(sx, th / 64);
    mid.setScale(sx, (th * 0.6) / 64);
    core.setScale(sx, (th * 0.3) / 64);
    head.setScale((th / 64) * 1.6);
    tip.setScale((th / 64) * 1.2).setPosition(len, 0);
    c.scaleX = facing;
    return c;
  };
  return c;
}

// Kotak serangan sinar dari tangan sampai tepi layar
function beamRect(f, hand, len, th) {
  return { x: f.facing > 0 ? hand.x : hand.x - len, y: hand.y - th / 2, w: len, h: th };
}

// Perisai lawan pecah berkeping-keping
function shatterShield(sc, vic, srcX) {
  const dir = Math.sign(vic.x - srcX) || 1;
  const p = vic.at(62, 150);
  for (let i = 0; i < 14; i++) {
    const shard = sc.add.image(p.x + rnd(-20, 20), p.y + rnd(-120, 120), 'fx_diamond')
      .setTint(vic.def.color2).setBlendMode(ADD()).setDepth(34).setScale(rnd(4, 9) / 10).setAngle(rnd(0, 360));
    sc.tweens.add({
      targets: shard, x: shard.x + dir * rnd(60, 220), y: shard.y + rnd(-80, 140), angle: shard.angle + rnd(-360, 360),
      alpha: 0, duration: rnd(380, 650), ease: 'Cubic.easeOut', onComplete: () => shard.destroy(),
    });
  }
  sc.fx.image('fx_ring', p.x, p.y, { tint: 0xffffff, from: 0.5, to: 2.2, ms: 260, scaleY: 1.4 });
  sc.fx.popup(vic.x, vic.y - 330, 'PERISAI HANCUR!', '#bff4ff', 30);
  Sound.play('block');
  Sound.play('explosion');
  sc.flash(120, 220, 245, 255);
}

// ---------------------------------------------------------------------
// Dorongan sampai ujung arena (tendangan Mrs. Dina).
// blocked = lawan menangkis: tetap terdorong, tetapi TIDAK terkena damage.
// ---------------------------------------------------------------------
class WallShove extends Actor {
  constructor(att, vic, blocked, frac) {
    super(att.scene, att);
    this.vic = vic;
    this.blocked = blocked;
    // frac: dorong sejauh pecahan lebar arena (0 = sampai ujung arena)
    this.left = frac ? CFG.W * frac : Infinity;
    this.dir = Math.sign(vic.x - att.x) || att.facing;
    this.x = vic.x;
    this.y = vic.y;
  }
  step() {
    const sc = this.scene, f = this.owner, vic = this.vic;
    if (vic.ko) return false;
    const d = Math.min(26, this.left);
    this.left -= d;
    vic.x = Phaser.Math.Clamp(vic.x + this.dir * d, CFG.WALL, CFG.W - CFG.WALL);
    vic.vx = 0;
    vic.hitstun = vic.t + 10;
    this.x = vic.x;
    if (this.t % 2 === 0) sc.fx.dust(vic.x, vic.ground, 2);
    if (this.t % 3 === 0) sc.fx.auraAt(vic.x - this.dir * 60, vic.y - rnd(60, 240), 0xdff6ff);
    const wall = vic.x <= CFG.WALL || vic.x >= CFG.W - CFG.WALL;
    if (this.left !== Infinity && (this.left <= 0 || wall)) return false; // dorongan angin biasa
    if (wall || this.t > 60) {
      if (!this.blocked) {
        sc.applyHit(f, vic, { dmg: 10, kd: true, launch: [3, -9], heavy: true, force: true, hitstop: 8, srcX: vic.x - this.dir * 60, x: vic.x, y: vic.y - 150, noGain: true });
      }
      sc.shake(220, 0.012);
      sc.fx.shock(vic.x, vic.ground, 0x9fe8ff, 2.4);
      return false;
    }
    return true;
  }
}
