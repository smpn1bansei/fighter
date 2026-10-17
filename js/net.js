// =====================================================================
// MAIN ONLINE (2 HP): sambungan langsung antar-HP lewat WebRTC (PeerJS).
// Server PeerJS gratis hanya dipakai untuk "berkenalan" lewat kode room;
// setelah tersambung, data dikirim langsung antar-HP (di satu Wi-Fi: lewat jaringan lokal).
// =====================================================================
window.Net = {
  LIB: 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
  PREFIX: 'seikijang-fighter-v1-',
  peer: null,
  conn: null,
  isHost: false,
  code: '',
  handlers: {},
  pending: [],   // pesan yang tiba sebelum layar tujuannya siap
  onClose: null,
  mid: 0,        // nomor pertandingan (pesan dari pertandingan lama diabaikan)

  // Muat pustaka PeerJS saat pertama kali dibutuhkan (mode lain tidak butuh internet).
  load() {
    if (window.Peer) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = this.LIB;
      s.onload = () => ok();
      s.onerror = () => { this.loading = null; fail(new Error('Gagal memuat. Periksa koneksi internet.')); };
      document.head.appendChild(s);
    });
    return this.loading;
  },

  connected() { return !!(this.conn && this.conn.open); },

  // Buat room: kode 4 angka. cb.onCode(kode), cb.onJoin(), cb.onError(pesan)
  host(cb) {
    this.close();
    this.isHost = true;
    const tryCode = (left) => {
      const code = String(Phaser.Math.Between(1000, 9999));
      const peer = new Peer(this.PREFIX + code);
      this.peer = peer;
      peer.on('open', () => { this.code = code; cb.onCode(code); });
      peer.on('connection', (c) => {
        if (this.conn) { c.on('open', () => c.close()); return; } // room sudah penuh
        this.bind(c, cb.onJoin);
      });
      peer.on('error', (e) => {
        if (e.type === 'unavailable-id' && left > 0) { peer.destroy(); tryCode(left - 1); return; }
        if (this.peer === peer) cb.onError(this.errText(e));
      });
    };
    tryCode(5);
  },

  // Gabung room dengan kode. cb.onJoin(), cb.onError(pesan)
  join(code, cb) {
    this.close();
    this.isHost = false;
    this.code = code;
    const peer = new Peer();
    this.peer = peer;
    let done = false;
    const fail = (msg) => { if (!done && this.peer === peer) { done = true; cb.onError(msg); } };
    peer.on('open', () => {
      const c = peer.connect(this.PREFIX + code, { reliable: true, serialization: 'json' }); // json: angka desimal terkirim persis
      this.bind(c, () => { done = true; cb.onJoin(); });
      setTimeout(() => { if (!this.connected()) fail('Tidak tersambung. Periksa kode & pastikan satu jaringan.'); }, 12000);
    });
    peer.on('error', (e) => fail(e.type === 'peer-unavailable' ? 'Room ' + code + ' tidak ditemukan.' : this.errText(e)));
  },

  bind(c, onOpen) {
    this.conn = c;
    c.on('open', () => onOpen && onOpen());
    c.on('data', (d) => {
      if (!d || !d.t) return;
      const h = this.handlers[d.t];
      if (h) h(d);
      else if (this.pending.length < 2000) this.pending.push(d);
    });
    const lost = () => {
      if (this.conn !== c) return;
      this.conn = null;
      if (this.onClose) this.onClose();
    };
    c.on('close', lost);
    c.on('error', lost);
  },

  errText(e) {
    if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') return 'Tidak bisa terhubung ke server. Periksa internet.';
    if (e.type === 'browser-incompatible') return 'Browser ini tidak mendukung main online.';
    return 'Gangguan sambungan (' + e.type + ').';
  },

  send(obj) { if (this.connected()) this.conn.send(obj); },
  on(type, fn) {
    this.handlers[type] = fn;
    const keep = [];
    const now = this.pending.filter((d) => (d.t === type ? true : (keep.push(d), false)));
    this.pending = keep;
    now.forEach(fn);
  },
  off(type) { delete this.handlers[type]; },

  // Pasang penanganan "teman terputus" untuk layar ini.
  watch(scene) {
    scene.netLost = false;
    this.onClose = () => this.lost(scene);
  },
  lost(scene) {
    if (scene.netLost) return;
    scene.netLost = true;
    UI.toast(scene, 'SAMBUNGAN DENGAN TEMAN TERPUTUS', '#ff6a6a');
    scene.time.delayedCall(1800, () => { this.close(); scene.scene.start('Title'); });
  },

  // Lebar layar logika. Saat online kedua HP memakai lebar arena yang sama
  // (dinding arena di posisi yang sama), HP yang layarnya lebih lebar mendapat sedikit tepi hitam.
  setWidth(w) {
    if (CFG.W === w || !window.game) return;
    CFG.W = w;
    game.scale.setGameSize(w, CFG.H);
  },

  close() {
    this.handlers = {};
    this.pending = [];
    this.onClose = null;
    const c = this.conn, p = this.peer;
    this.conn = null;
    this.peer = null;
    if (c) try { c.close(); } catch (e) { /* abaikan */ }
    if (p) try { p.destroy(); } catch (e) { /* abaikan */ }
  },
};

// Pengendali petarung yang digerakkan dari data tombol per langkah (lokal maupun dari HP teman).
// Satu angka berisi 9 bit "ditahan" + 9 bit "baru ditekan".
// Tekanan dikumpulkan tiap langkah (feed) lalu dipakai saat petarung membaca tombol (poll),
// sehingga tekanan saat hitstop / layar jurus pamungkas tidak hilang.
class NetController extends Controller {
  constructor() {
    super();
    this.nh = 0;
    this.np = 0;
  }
  feed(m) {
    this.nh = m & 511;
    this.np |= m >> 9;
  }
  poll() {
    this.tick();
    ACTIONS.forEach((a, i) => {
      this.h[a] = !!(this.nh & (1 << i));
      if (this.np & (1 << i)) this.press(a);
    });
    this.np = 0;
  }
  clear() {
    super.clear();
    this.nh = 0;
    this.np = 0;
  }
}

// Ubah keadaan PlayerController (setelah poll) menjadi satu angka.
function encodeInput(pc) {
  let m = 0;
  ACTIONS.forEach((a, i) => {
    if (pc.h[a]) m |= 1 << i;
    if (pc.buf[a] === CFG.BUFFER) m |= 1 << (i + 9);
  });
  return m;
}
