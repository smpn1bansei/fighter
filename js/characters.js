// =====================================================================
// DAFTAR KARAKTER
// ---------------------------------------------------------------------
// Ada 12 slot. Karakter dengan `locked: true` belum bisa dimainkan.
// Untuk menambah karakter baru:
//   1. Siapkan sprite sheet di asset-custom/ lalu jalankan tools/extract-sprites.js
//   2. Salin salah satu data karakter di bawah lalu sesuaikan nama pose (frames),
//      jangkauan serangan (box) dan jurusnya.
//
// Satuan:  waktu = langkah (60 langkah = 1 detik),  jarak = piksel layar.
// box: [maju, tinggi, lebar, tinggi-kotak]  -> pusat kotak serangan diukur
//      dari kaki karakter: "maju" ke arah lawan, "tinggi" ke atas.
// =====================================================================
window.ROSTER = [
  {
    id: 'nur',
    name: 'NUR HOKAGE',
    title: 'Hokage Cahaya Emas',
    element: 'CAKRA CAHAYA',
    desc: 'Guru bijak berjubah Hokage. Cakra emasnya membentuk Rasengan yang berputar dahsyat.',
    color: 0xffc83d,
    color2: 0x7fd8ff,
    walk: 4.0, backWalk: 3.3, jumpV: 18.5, jumpX: 5,
    hurtbox: { w: 116, h: 270 },
    frames: {
      idle: 'idle', walk: 'idle', jump: 'jump', fall: 'knee', hurt: 'hurt', fly: 'hurt', lie: 'hurt', getup: 'idle',
      guard: 'palm', charge: 'charge', intro: 'intro', win: 'win', seal: 'charge',
    },
    moves: {
      p1: { frame: 'punch', startup: 4, active: 3, recovery: 9, dmg: 40, hitstun: 18, blockstun: 11, push: 5, box: [125, 186, 84, 64], lunge: 2, next: 'p2' },
      p2: { frame: 'palm2', startup: 5, active: 4, recovery: 11, dmg: 45, hitstun: 20, blockstun: 12, push: 6, box: [150, 185, 104, 100], lunge: 2, next: 'p3', slash: 0xffd75a },
      p3: { frame: 'knee', pre: 'idle', startup: 7, active: 4, recovery: 18, dmg: 70, blockstun: 15, push: 8, box: [88, 125, 90, 100], lunge: 4, kd: true, launch: [8, -11], heavy: true },
      kick: { frame: 'kick', pre: 'knee', startup: 8, active: 4, recovery: 16, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [132, 180, 116, 110], lunge: 2, heavy: true, slash: 0xffd75a },
      air: { frame: 'smash', startup: 4, active: 40, recovery: 8, dmg: 80, hitstun: 22, blockstun: 12, push: 6, box: [30, 45, 190, 120], dive: [4, 14], heavy: true },
    },
    // range = jarak terjauh jurus efektif (dipakai AI), close = cocok dipakai dari dekat
    jurus: { type: 'rasengan', name: 'RASENGAN CAHAYA', cost: 30, range: 420, close: true, desc: 'Melesat maju membawa bola cakra berputar' },
    ulti: { type: 'rasenshuriken', name: 'RASEN-SHURIKEN HOKAGE', cost: 100, range: 1500, desc: 'Melempar shuriken angin raksasa' },
    quotes: {
      intro: 'Siap belajar? Eh... siap bertarung!',
      win: 'Jangan lupa kerjakan PR-nya, ya!',
    },
  },
  {
    id: 'sit',
    name: 'SIT HOKAGE',
    title: 'Hokage Api Konoha',
    element: 'KATON (API)',
    desc: 'Pewaris tekad api. Menyemburkan bola api dan memanggil pilar api dari segel tanah.',
    color: 0xff5a2a,
    color2: 0xffd27a,
    walk: 4.3, backWalk: 3.5, jumpV: 18.5, jumpX: 5.4,
    hurtbox: { w: 106, h: 275 },
    frames: {
      idle: 'fist', walk: 'fist', jump: 'jumpup', fall: 'jumpup', hurt: 'crouch', fly: 'stand', lie: 'stand', getup: 'kneel',
      guard: 'seal', charge: 'firestance', intro: 'scroll', win: 'fists', seal: 'sign',
    },
    moves: {
      p1: { frame: 'firepalm', startup: 4, active: 3, recovery: 9, dmg: 40, hitstun: 18, blockstun: 11, push: 5, box: [150, 205, 120, 70], lunge: 2, next: 'p2', slash: 0xff9a3c },
      p2: { frame: 'firestance', startup: 5, active: 5, recovery: 11, dmg: 45, hitstun: 20, blockstun: 12, push: 6, box: [85, 70, 160, 120], lunge: 3, next: 'p3' },
      p3: { frame: 'jumpup', pre: 'crouch', startup: 7, active: 6, recovery: 16, dmg: 70, blockstun: 15, push: 6, box: [75, 255, 120, 180], lunge: 3, hop: -9, kd: true, launch: [5, -15], heavy: true },
      kick: { frame: 'flykick', pre: 'crouch', startup: 8, active: 5, recovery: 15, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [135, 165, 120, 100], lunge: 5, hop: -6, heavy: true },
      air: { frame: 'flykick', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [135, 165, 130, 110] },
    },
    jurus: { type: 'fireball', name: 'KATON: BOLA API', cost: 25, range: 1500, desc: 'Menembakkan bola api besar' },
    ulti: { type: 'firepillar', name: 'KUCHIYOSE: PILAR API', cost: 100, range: 1500, desc: 'Segel pemanggil memunculkan pilar api di bawah lawan' },
    quotes: {
      intro: 'Tekad api Konoha menyala di dadaku!',
      win: 'Api semangatku tak akan padam!',
    },
  },
  {
    id: 'ranti',
    name: 'RANTI',
    title: 'Sannin Tinju Seratus',
    element: 'KEKUATAN SUPER',
    desc: 'Ninja medis bertenaga raksasa. Pukulannya meretakkan tanah, segel Byakugo memulihkan tenaga.',
    color: 0x3fe0a0,
    color2: 0x5fb6ff,
    walk: 3.9, backWalk: 3.2, jumpV: 18.5, jumpX: 4.8,
    hurtbox: { w: 108, h: 275 },
    frames: {
      idle: 'stance', walk: 'stance', jump: 'jump', fall: 'jump2', hurt: 'jump2', fly: 'jump2', lie: 'stand', getup: 'kneel',
      guard: 'guard', charge: 'heal', intro: 'sign', win: 'back', seal: 'sign2',
    },
    moves: {
      p1: { frame: 'punch', startup: 4, active: 3, recovery: 9, dmg: 40, hitstun: 18, blockstun: 11, push: 5, box: [130, 205, 84, 64], lunge: 2, next: 'p2' },
      p2: { frame: 'bluefist', startup: 5, active: 4, recovery: 11, dmg: 45, hitstun: 20, blockstun: 12, push: 6, box: [112, 180, 96, 84], lunge: 3, next: 'p3', slash: 0x7fd8ff },
      p3: { frame: 'bigpunch', pre: 'bluefist', startup: 8, active: 4, recovery: 18, dmg: 75, blockstun: 16, push: 9, box: [165, 215, 124, 104], lunge: 4, kd: true, launch: [10, -10], heavy: true },
      kick: { frame: 'kick', pre: 'stance', startup: 8, active: 4, recovery: 16, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [125, 230, 116, 150], lunge: 2, heavy: true, slash: 0xdff4ff },
      air: { frame: 'kick', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [125, 200, 124, 140] },
    },
    jurus: { type: 'groundwave', name: 'RETAKAN BUMI', cost: 25, range: 1500, desc: 'Meninju tanah hingga retakannya menjalar ke lawan' },
    ulti: { type: 'byakugo', name: 'BYAKUGO: TINJU SERATUS', cost: 100, range: 560, desc: 'Memulihkan tenaga lalu menghantam dengan tinju raksasa' },
    quotes: {
      intro: 'Satu pukulan saja sudah cukup.',
      win: 'Taruhan? Aku selalu menang!',
    },
  },
  {
    id: 'marthadin',
    name: 'MARTHADIN',
    title: 'Balerina Angin Puyuh',
    element: 'FUTON (ANGIN)',
    desc: 'Lincah dan anggun bak balerina. Gerakan memutarnya melepaskan tendangan angin jarak jauh.',
    color: 0x7fd8ff,
    color2: 0xdff6ff,
    walk: 4.4, backWalk: 3.6, jumpV: 19.2, jumpX: 5.8,
    hurtbox: { w: 100, h: 275 },
    frames: {
      idle: 'stance', walk: 'stance', jump: 'jete', fall: 'jete', hurt: 'hurt', fly: 'hurt', lie: 'bow', getup: 'hurt',
      guard: 'guard', charge: 'cyclone', intro: 'ballet', win: 'bow', seal: 'ballet',
    },
    moves: {
      p1: { frame: 'palm', startup: 4, active: 3, recovery: 9, dmg: 40, hitstun: 18, blockstun: 11, push: 5, box: [128, 195, 100, 70], lunge: 2, next: 'p2' },
      p2: { frame: 'spin', startup: 5, active: 5, recovery: 11, dmg: 45, hitstun: 20, blockstun: 12, push: 6, box: [95, 175, 140, 140], lunge: 3, next: 'p3', slash: 0xbfe9ff },
      p3: { frame: 'highkick', pre: 'stance', startup: 7, active: 5, recovery: 17, dmg: 70, blockstun: 15, push: 7, box: [85, 240, 104, 190], lunge: 3, kd: true, launch: [5, -15], heavy: true },
      // Grand Jete: lompatan split ke depan yang menyerang dari jauh
      kick: { frame: 'jete', pre: 'stance', startup: 8, active: 8, recovery: 14, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [120, 95, 160, 100], lunge: 7, hop: -8, heavy: true, slash: 0xdff6ff },
      // Serangan Menukik: menukik dan menghantam tanah
      air: { frame: 'dive', startup: 4, active: 40, recovery: 8, dmg: 80, hitstun: 22, blockstun: 12, push: 6, box: [40, 45, 160, 120], dive: [3, 15], heavy: true },
    },
    jurus: { type: 'tornadokick', name: 'TENDANGAN PUTAR UDARA', cost: 30, range: 1500, desc: 'Tendangan memutar di udara yang melepaskan bilah angin' },
    ulti: { type: 'cyclone', name: 'PUTARAN TORNADO', cost: 100, range: 480, desc: 'Berputar menjadi angin puyuh yang menghisap lawan' },
    quotes: {
      intro: 'Mari menari... di atas kekalahanmu!',
      win: 'Terima kasih atas tariannya.',
    },
  },
  {
    id: 'fatim',
    name: 'FATIM',
    title: 'Ninja Bayangan Bercadar',
    element: 'KUNGFU BAYANGAN',
    desc: 'Ninja bercadar ahli kungfu. Bergerak merunduk secepat bayangan dan menyembunyikan shuriken di balik jubahnya.',
    color: 0x9d8cff,
    color2: 0xc9c0ff,
    walk: 5.6, backWalk: 3.6, jumpV: 18.5, jumpX: 5.8,
    hurtbox: { w: 110, h: 268 },
    frames: {
      idle: 'stance', walk: 'stance', walkF: 'dash', jump: 'jump', fall: 'jump', hurt: 'recoil', fly: 'recoil', lie: 'calm',
      getup: 'stance', guard: 'guard', charge: 'ready', intro: 'ready', win: 'calm', seal: 'ready',
    },
    moves: {
      // Tusukan Tangan Ganda
      p1: { frame: 'stab', startup: 3, active: 4, recovery: 9, dmg: 40, hitstun: 18, blockstun: 11, push: 5, box: [125, 200, 96, 74], lunge: 3, next: 'p2' },
      // Pukulan Cakar
      p2: { frame: 'claw', startup: 5, active: 4, recovery: 11, dmg: 45, hitstun: 20, blockstun: 12, push: 6, box: [135, 195, 124, 114], lunge: 3, next: 'p3', slash: 0xc9c0ff },
      p3: { frame: 'groundstrike', pre: 'dash', startup: 7, active: 4, recovery: 17, dmg: 70, blockstun: 15, push: 8, box: [95, 50, 130, 110], lunge: 5, kd: true, launch: [6, -12], heavy: true },
      kick: { frame: 'kick', pre: 'stance', startup: 8, active: 4, recovery: 16, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [130, 220, 124, 136], lunge: 2, heavy: true, slash: 0xdff4ff },
      air: { frame: 'divekick', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [60, 45, 150, 120], dive: [6, 14] },
    },
    jurus: { type: 'shuriken', name: 'SHURIKEN RAHASIA', cost: 30, range: 1500, desc: 'Melempar tiga shuriken dari balik jubah' },
    ulti: { type: 'shadowstrike', name: 'TUSUKAN SERIBU BAYANGAN', cost: 100, range: 600, desc: 'Menerjang lalu menusuk bertubi-tubi bersama bayangannya' },
    quotes: {
      intro: 'Bayanganku lebih cepat dari matamu.',
      win: 'Kau bahkan tak melihat shuriken itu datang.',
    },
  },
  {
    id: 'tio',
    name: 'TIO',
    title: 'Pendekar Salto Kilat',
    element: 'KECEPATAN KILAT',
    desc: 'Pesilat lincah dengan tendangan salto. Mampu menerjang lawan secepat kilat hingga terjatuh.',
    color: 0xffa53d,
    color2: 0xffd27a,
    walk: 4.6, backWalk: 3.8, jumpV: 18.8, jumpX: 6,
    hurtbox: { w: 112, h: 275 },
    frames: {
      idle: 'stance', walk: 'stance', jump: 'jump', fall: 'jump', hurt: 'fall', fly: 'fall', lie: 'salute', getup: 'crouch',
      guard: 'guard', charge: 'salute', intro: 'salute', win: 'jump', seal: 'salute',
    },
    moves: {
      p1: { frame: 'punch', startup: 4, active: 3, recovery: 9, dmg: 40, hitstun: 18, blockstun: 11, push: 5, box: [122, 195, 94, 66], lunge: 3, next: 'p2' },
      p2: { frame: 'sweep', pre: 'crouch', startup: 5, active: 5, recovery: 11, dmg: 45, hitstun: 20, blockstun: 12, push: 6, box: [120, 45, 170, 95], lunge: 3, next: 'p3' },
      // Tendangan salto
      p3: { frame: 'salto', pre: 'crouch', startup: 6, active: 7, recovery: 15, dmg: 70, blockstun: 15, push: 6, box: [70, 190, 150, 210], lunge: 3, hop: -10, kd: true, launch: [4, -16], heavy: true, slash: 0xffd27a },
      kick: { frame: 'flykick', pre: 'crouch', startup: 8, active: 6, recovery: 14, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [128, 130, 124, 104], lunge: 7, hop: -6, heavy: true },
      air: { frame: 'stomp', startup: 4, active: 40, recovery: 8, dmg: 80, hitstun: 22, blockstun: 12, push: 6, box: [30, 45, 150, 120], dive: [2, 17], heavy: true },
    },
    jurus: { type: 'rush', name: 'TERJANGAN KILAT', cost: 25, range: 540, close: true, desc: 'Menerjang lawan dengan kecepatan tinggi hingga terjatuh' },
    ulti: { type: 'stormsalto', name: 'SALTO BADAI', cost: 100, range: 620, desc: 'Terjangan, tendangan salto ke udara, lalu hantaman ke tanah' },
    quotes: {
      intro: 'Siap? Jangan sampai berkedip!',
      win: 'Kecepatan adalah kekuatan!',
    },
  },
  {
    id: 'pakjef',
    name: 'PAK JEF',
    title: 'Otot Baja Sekolah',
    element: 'KEKUATAN FISIK',
    desc: 'Guru bertenaga raksasa. Pukulan & tendangannya jauh lebih keras dari petarung lain, tapi geraknya lebih lambat.',
    color: 0x4cd964,
    color2: 0xffd75a,
    walk: 3.5, backWalk: 3.0, jumpV: 17.5, jumpX: 4.6,
    power: 1.35, // pukulan & tendangan 35% lebih kuat, dorongan lebih jauh
    walkFx: 'dust',
    hurtbox: { w: 124, h: 280 },
    frames: {
      idle: 'stance', walk: 'stance', walkF: 'run', jump: 'jump', fall: 'jump', hurt: 'crouch', fly: 'jump', lie: 'stance',
      getup: 'crouch', guard: 'guard', charge: 'flex', intro: 'flex', win: 'flex', seal: 'crouch',
    },
    moves: {
      p1: { frame: 'jab', startup: 5, active: 3, recovery: 10, dmg: 45, hitstun: 18, blockstun: 11, push: 6, box: [130, 205, 104, 74], lunge: 2, next: 'p2' },
      p2: { frame: 'bigpunch', startup: 6, active: 4, recovery: 12, dmg: 50, hitstun: 20, blockstun: 12, push: 7, box: [135, 200, 124, 104], lunge: 2, next: 'p3', slash: 0xffffff },
      // terjangan bahu
      p3: { frame: 'shoulder', pre: 'crouch', startup: 8, active: 6, recovery: 18, dmg: 70, blockstun: 15, push: 9, box: [95, 170, 140, 200], lunge: 7, kd: true, launch: [10, -9], heavy: true },
      kick: { frame: 'kick', pre: 'stance', startup: 9, active: 4, recovery: 17, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [120, 200, 124, 134], lunge: 2, heavy: true, slash: 0xdff4ff },
      air: { frame: 'smash', startup: 4, active: 40, recovery: 9, dmg: 80, hitstun: 22, blockstun: 12, push: 7, box: [40, 45, 160, 120], dive: [2, 16], heavy: true },
    },
    jurus: { type: 'cannonrock', name: 'LEMPARAN BATU MERIAM', cost: 30, range: 1500, desc: 'Mencabut batu dari tanah lalu melemparnya ke lawan' },
    ulti: { type: 'megaboulder', name: 'BATU RAKSASA', cost: 100, range: 1500, desc: 'Mengangkat batu raksasa dari tanah lalu melemparkannya' },
    quotes: {
      intro: 'Otot ini bukan pajangan!',
      win: 'Olahraga itu penting, anak-anak!',
    },
  },
  {
    id: 'kingandri',
    name: 'KING ANDRI',
    title: 'Raja Telekinesis',
    element: 'TELEKINESIS (OVER POWER)',
    desc: 'Karakter terkuat! Pukulan & tendangannya berupa angin sabit yang melesat setengah layar. Cakra penuh hanya 2 detik.',
    color: 0x5fe0ff,
    color2: 0xbff4ff,
    walk: 4.6, backWalk: 4.0, jumpV: 19, jumpX: 5.6,
    chargeRate: 0.84, // cakra penuh dalam 2 detik
    ranged: true,      // pukulan & tendangan menyerang dari jauh (dipakai AI)
    hurtbox: { w: 106, h: 272 },
    frames: {
      idle: 'stance', walk: 'stance', walkF: 'fly', jump: 'float', fall: 'float', hurt: 'charge', fly: 'float', lie: 'book',
      getup: 'charge', guard: 'shield', charge: 'aura', intro: 'float', win: 'book', seal: 'charge',
    },
    // proj: angin sabit ("pisang angin") yang terbang setengah layar
    moves: {
      p1: { frame: 'punch', startup: 4, active: 3, recovery: 10, dmg: 40, hitstun: 18, blockstun: 11, push: 6, box: [130, 205, 90, 70], next: 'p2', proj: { h: 205, speed: 18 } },
      p2: { frame: 'telekinesis', startup: 5, active: 3, recovery: 12, dmg: 45, hitstun: 20, blockstun: 12, push: 7, box: [130, 200, 90, 70], next: 'p3', proj: { h: 195, speed: 18 } },
      p3: { frame: 'rocks', startup: 7, active: 3, recovery: 18, dmg: 70, blockstun: 15, push: 9, box: [130, 190, 120, 120], kd: true, launch: [9, -12], heavy: true, proj: { h: 185, speed: 17, scale: 1.4 } },
      kick: { frame: 'kick', pre: 'stance', startup: 8, active: 3, recovery: 16, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [130, 175, 120, 120], heavy: true, proj: { h: 175, speed: 17, scale: 1.3 } },
      air: { frame: 'rain', startup: 4, active: 3, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [100, 120, 90, 90], air: true, proj: { h: 140, speed: 15, vy: 6 } },
    },
    jurus: { type: 'kamehameha', name: 'KAMEHAMEHA', cost: 30, range: 1500, desc: 'Gelombang energi yang menjangkau tepi layar' },
    ulti: { type: 'redlaser', name: 'SINAR LASER MERAH', cost: 100, range: 1500, desc: 'Tubuh bercahaya lalu menembakkan laser merah sampai tepi layar' },
    quotes: {
      intro: 'Raja tidak perlu mendekat.',
      win: 'Itulah kekuatan seorang raja!',
    },
  },
];

// Slot karakter yang akan dikembangkan nanti.
for (let i = 1; i <= 4; i++) {
  window.ROSTER.push({ id: 'locked' + i, name: '???', locked: true });
}

window.getChar = function (id) {
  return window.ROSTER.find((c) => c.id === id);
};

// Serangan udara (tombol serang saat melompat) selalu ditandai sebagai serangan udara.
for (const c of window.ROSTER) {
  if (c.moves && c.moves.air) c.moves.air.air = true;
}
