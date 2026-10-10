// Pengaturan umum game. Nilai-nilai di sini aman diubah untuk menyesuaikan game.
window.CFG = (function () {
  // Tinggi layar logika tetap 720, lebarnya menyesuaikan rasio layar (16:10 s.d. 19.5:9)
  // supaya di HP layar penuh tanpa garis hitam yang lebar.
  const H = 720;
  const long = Math.max(window.innerWidth, window.innerHeight);
  const short = Math.min(window.innerWidth, window.innerHeight) || 1;
  const ratio = Math.max(1.6, Math.min(2.17, long / short || 16 / 9));
  const W = Math.round((H * ratio) / 2) * 2;

  return {
    W,
    H,
    TITLE: 'SEIKIJANG FIGHTER',
    SUBTITLE: 'PERTARUNGAN NINJA SEKOLAH',
    BANNER_TEXT: 'SEIKIJANG FIGHTER', // tulisan pada spanduk di arena
    VERSION: '1.6',

    ROUND_TIME: 99,       // detik per ronde
    ROUNDS_TO_WIN: 2,     // menang 2 ronde = menang pertandingan
    MAX_HP: 1000,
    MAX_CHAKRA: 100,
    CHAKRA_START: 20,

    CHAR_SCALE: 0.85,     // ukuran karakter di arena
    GRAVITY: 0.95,
    STEP_MS: 1000 / 60,   // logika game berjalan 60 langkah per detik
    BUFFER: 8,            // tombol yang ditekan "diingat" selama 8 langkah
    PUSH_W: 112,          // jarak minimum antar petarung
    WALL: 70,             // batas kiri/kanan arena

    // Data gambar latar (lihat tools/make-background.js)
    BG: { key: 'bg', w: 1920, h: 1194, ground: 918, banner: { x: 989, y: 1070, w: 300 } },

    // Tingkat kesulitan komputer
    DIFFICULTY: [
      { id: 'easy', name: 'MUDAH', desc: 'Lawan santai, cocok untuk belajar', color: 0x4cd964,
        reaction: 26, block: 0.12, aggression: 0.35, combo: 0.3, jutsu: 0.25, dodge: 0.15, dmg: 0.7 },
      { id: 'normal', name: 'SEDANG', desc: 'Lawan seimbang', color: 0xffc83d,
        reaction: 14, block: 0.38, aggression: 0.55, combo: 0.65, jutsu: 0.45, dodge: 0.45, dmg: 0.95 },
      { id: 'hard', name: 'SULIT', desc: 'Lawan cepat dan licik!', color: 0xff4d4d,
        reaction: 6, block: 0.68, aggression: 0.75, combo: 0.95, jutsu: 0.65, dodge: 0.8, dmg: 1.15 },
    ],

    // Kontrol keyboard (komputer)
    KEYS: {
      left: ['LEFT', 'A'],
      right: ['RIGHT', 'D'],
      up: ['UP', 'W', 'SPACE'],
      guard: ['DOWN', 'S'],
      punch: ['J', 'Z'],
      kick: ['K', 'X'],
      jurus: ['L', 'C'],
      charge: ['U', 'V'],
      ulti: ['I', 'B'],
    },
  };
})();

// Simpan/ambil pengaturan pemain (aman bila penyimpanan browser diblokir).
window.Store = {
  get(key, def) {
    try {
      const v = localStorage.getItem('skf_' + key);
      return v === null ? def : JSON.parse(v);
    } catch (e) {
      return def;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('skf_' + key, JSON.stringify(value));
    } catch (e) { /* abaikan */ }
  },
};
