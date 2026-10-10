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
      // tendangan melempar lawan ke ujung arena (ditangkis: terdorong tanpa damage)
      kick: { frame: 'kick', pre: 'knee', startup: 8, active: 4, recovery: 16, dmg: 85, hitstun: 40, blockstun: 30, push: 0, box: [132, 180, 116, 110], lunge: 2, heavy: true, wallBlast: true, slash: 0xffd75a },
      air: { frame: 'smash', startup: 4, active: 40, recovery: 8, dmg: 80, hitstun: 22, blockstun: 12, push: 6, box: [30, 45, 190, 120], dive: [4, 14], heavy: true },
    },
    // range = jarak terjauh jurus efektif (dipakai AI), close = cocok dipakai dari dekat
    // tombol atas: menghilang & muncul di belakang lawan (memakai cakra seperti jurus)
    teleport: true,
    jurus: { type: 'rasengan', name: 'RASENGAN CAHAYA', cost: 30, range: 420, close: true, desc: 'Bola cakra yang menembus perisai & melempar lawan ke ujung arena' },
    ulti: { type: 'rasenshuriken', name: 'RASEN-SHURIKEN HOKAGE', cost: 100, range: 1500, desc: 'Shuriken angin raksasa yang tidak bisa ditangkis' },
    quotes: {
      intro: 'Siap belajar? Eh... siap bertarung!',
      win: 'Jangan lupa kerjakan PR-nya, ya!',
    },
  },
  {
    id: 'sit',
    name: 'SITI HOKAGE',
    title: 'Pemimpin Tekad Api',
    element: 'BANYAK ELEMEN',
    desc: 'Pemimpin yang menguasai banyak elemen dan pewaris tekad api. Tekan ATAS untuk menghilang & muncul di belakang lawan.',
    color: 0xff5a2a,
    color2: 0x7fd8ff,
    walk: 4.3, backWalk: 3.6, jumpV: 19, jumpX: 5.4,
    flatPoses: true,
    teleport: true, // tombol atas: muncul di belakang lawan (memakai cakra seperti jurus)
    ranged: true,
    rangedReach: 0.48,
    hurtbox: { w: 106, h: 275 },
    walkCycle: ['walk1', 'walk2', 'walk3', 'walk4'],
    frames: {
      idle: 'walk4', walk: 'walk4', jump: 'jump', fall: 'jump', hurt: 'hurt', fly: 'hurt', lie: 'lie', getup: 'hurt',
      guard: 'shield', charge: 'aura', intro: 'aura', win: 'aura', seal: 'aura',
    },
    // pukulan bertubi-tubi berapi, jangkauan 50% arena; yang menangkis tetap terdorong tanpa damage
    moves: {
      p1: { frame: 'punch', startup: 3, active: 3, recovery: 7, dmg: 28, hitstun: 18, blockstun: 12, push: 14, box: [120, 205, 90, 70], next: 'p2', proj: { fire: true, h: 222, x: 120, speed: 22, reach: 0.5 } },
      p2: { frame: 'punch2', startup: 3, active: 3, recovery: 7, dmg: 28, hitstun: 18, blockstun: 12, push: 14, box: [120, 205, 90, 70], next: 'p3', proj: { fire: true, h: 222, x: 120, speed: 22, reach: 0.5 } },
      p3: { frame: 'punch', startup: 3, active: 3, recovery: 7, dmg: 28, hitstun: 18, blockstun: 12, push: 14, box: [120, 205, 90, 70], next: 'p4', proj: { fire: true, h: 222, x: 120, speed: 22, reach: 0.5 } },
      p4: { frame: 'punch2', startup: 3, active: 3, recovery: 14, dmg: 45, hitstun: 18, blockstun: 12, push: 14, box: [120, 205, 90, 70], kd: true, launch: [8, -10], heavy: true, proj: { fire: true, h: 222, x: 120, speed: 22, reach: 0.5 } },
      // tendangan angin: lawan terhempas ke ujung arena (ditangkis: tanpa damage)
      kick: { frame: 'kick', pre: 'walk4', startup: 7, active: 4, recovery: 16, dmg: 90, hitstun: 40, blockstun: 30, push: 0, box: [130, 225, 140, 160], lunge: 2, heavy: true, wallBlast: true },
      air: { frame: 'kick2', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [120, 150, 140, 130] },
    },
    jurus: { type: 'windlaser', name: 'LASER ANGIN BERPUTAR', cost: 30, range: 1500, desc: 'Laser angin dua tangan yang menghempaskan lawan ke ujung arena' },
    ulti: { type: 'chestorb', name: 'BOLA TEKAD API', cost: 100, range: 1500, desc: 'Bola energi dari dada yang menghapus serangan apa pun & tak bisa ditangkis' },
    quotes: {
      intro: 'Tekad api tak pernah padam.',
      win: 'Seorang pemimpin melindungi semuanya.',
    },
  },
  {
    id: 'ranti',
    name: 'RANTI',
    title: 'Pengurus Administrasi Ninja',
    element: 'TENAGA BESAR & ANGIN',
    desc: 'Pengurus administrasi ninja bertenaga besar dengan potensi masa depan. Hentakannya meretakkan seluruh arena.',
    color: 0x5fb6ff,
    color2: 0xdff6ff,
    walk: 4.1, backWalk: 3.4, jumpV: 18.8, jumpX: 5.2,
    flatPoses: true,
    ranged: true,
    rangedReach: 0.28,
    hurtbox: { w: 106, h: 272 },
    walkCycle: ['walk1', 'walk2', 'walk3', 'walk4'],
    frames: {
      idle: 'walk4', walk: 'walk4', jump: 'jump', fall: 'jump', hurt: 'hurt', fly: 'hurt', lie: 'lie', getup: 'hurt',
      guard: 'shield', charge: 'aura', intro: 'aura', win: 'aura', seal: 'aura',
    },
    // pukulan bertubi-tubi beraura angin, jangkauan 30% arena; yang menangkis tetap terdorong tanpa damage
    moves: {
      p1: { frame: 'punch', startup: 3, active: 3, recovery: 7, dmg: 28, hitstun: 18, blockstun: 12, push: 14, box: [120, 205, 90, 70], next: 'p2', proj: { fire: true, wind: true, h: 222, x: 120, speed: 22, reach: 0.3 } },
      p2: { frame: 'punch2', startup: 3, active: 3, recovery: 7, dmg: 28, hitstun: 18, blockstun: 12, push: 14, box: [120, 205, 90, 70], next: 'p3', proj: { fire: true, wind: true, h: 222, x: 120, speed: 22, reach: 0.3 } },
      p3: { frame: 'punch', startup: 3, active: 3, recovery: 7, dmg: 28, hitstun: 18, blockstun: 12, push: 14, box: [120, 205, 90, 70], next: 'p4', proj: { fire: true, wind: true, h: 222, x: 120, speed: 22, reach: 0.3 } },
      p4: { frame: 'punch2', startup: 3, active: 3, recovery: 14, dmg: 45, hitstun: 18, blockstun: 12, push: 14, box: [120, 205, 90, 70], kd: true, launch: [8, -10], heavy: true, proj: { fire: true, wind: true, h: 222, x: 120, speed: 22, reach: 0.3 } },
      // tendangan angin: lawan terhempas ke ujung arena (ditangkis: tanpa damage)
      kick: { frame: 'kick', pre: 'walk4', startup: 7, active: 4, recovery: 16, dmg: 90, hitstun: 40, blockstun: 30, push: 0, box: [130, 225, 140, 160], lunge: 2, heavy: true, wallBlast: true },
      air: { frame: 'kick2', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [120, 150, 140, 130] },
    },
    jurus: { type: 'earthquake', name: 'HENTAKAN BUMI', cost: 30, range: 1500, desc: 'Meninju tanah hingga retak sejauh 55% arena; lawan di tanah pasti jatuh' },
    ulti: { type: 'vortexball', name: 'BOLA PUSARAN ANGIN', cost: 100, range: 640, desc: 'Bola energi berpusaran angin sejauh 50% arena' },
    quotes: {
      intro: 'Berkasmu sudah saya proses. Sekarang giliranmu.',
      win: 'Arsip pertarungan: menang!',
    },
  },
  {
    id: 'marthadin',
    name: 'MRS. DINA',
    title: 'ASN Angin Petir',
    element: 'ANGIN + PETIR',
    desc: 'Pegawai ASN ahli bertarung dengan elemen angin dan petir. Tinjunya melepaskan petir kuning, tendangannya menghempaskan lawan.',
    color: 0xffe066,
    color2: 0xdff6ff,
    walk: 4.4, backWalk: 3.7, jumpV: 19, jumpX: 5.6,
    flatPoses: true,
    ranged: true,
    rangedReach: 0.28,
    hurtbox: { w: 104, h: 272 },
    walkCycle: ['walk1', 'walk2', 'walk3', 'walk4'],
    frames: {
      idle: 'walk4', walk: 'walk4', jump: 'jump', fall: 'jump', hurt: 'hurt', fly: 'hurt', lie: 'lie', getup: 'hurt',
      guard: 'guard', charge: 'aura', intro: 'aura', win: 'aura', seal: 'aura',
    },
    // pukulan kiri-kanan bertubi-tubi berpetir kuning, jangkauan 30% arena;
    // lawan yang menangkis tetap tergeser mundur
    moves: {
      p1: { frame: 'punch', startup: 3, active: 3, recovery: 8, dmg: 30, hitstun: 18, blockstun: 12, push: 15, box: [120, 215, 90, 70], next: 'p2', proj: { h: 215, speed: 24, reach: 0.3, color: 'yellow' } },
      p2: { frame: 'punch2', startup: 3, active: 3, recovery: 8, dmg: 30, hitstun: 18, blockstun: 12, push: 15, box: [120, 215, 90, 70], next: 'p3', proj: { h: 215, speed: 24, reach: 0.3, color: 'yellow' } },
      p3: { frame: 'punch', startup: 3, active: 3, recovery: 8, dmg: 30, hitstun: 18, blockstun: 12, push: 15, box: [120, 215, 90, 70], next: 'p4', proj: { h: 215, speed: 24, reach: 0.3, color: 'yellow' } },
      p4: { frame: 'double', startup: 5, active: 3, recovery: 15, dmg: 50, blockstun: 15, push: 18, box: [130, 215, 110, 90], kd: true, launch: [10, -11], heavy: true, proj: { h: 215, speed: 24, reach: 0.3, color: 'yellow', scale: 1.4 } },
      // tendangan menghempaskan lawan sampai ujung arena (ditangkis: tanpa damage)
      kick: { frame: 'kick2', pre: 'walk4', startup: 7, active: 4, recovery: 16, dmg: 90, hitstun: 40, blockstun: 30, push: 0, box: [130, 225, 130, 150], lunge: 3, heavy: true, wallBlast: true, slash: 0xdff6ff },
      air: { frame: 'flykick', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [120, 140, 140, 130] },
    },
    jurus: { type: 'flashupper', name: 'TINJU KILAT ANGIN', cost: 25, range: 1500, desc: 'Melesat secepat kilat lalu meninju dari bawah hingga lawan terlempar ke atas' },
    ulti: { type: 'turbotornado', name: 'BADAI TURBO', cost: 100, range: 1500, desc: 'Putaran angin turbo berpetir yang menghempaskan lawan ke ujung arena' },
    quotes: {
      intro: 'Surat tugas: mengalahkanmu.',
      win: 'Laporan selesai, tepat waktu!',
    },
  },
  {
    id: 'fatim',
    name: 'FATIM',
    title: 'Ninja Senjata Kilat',
    element: 'SENJATA & PETIR',
    desc: 'Ninja bercadar ahli senjata dengan gerakan super cepat. Tekan arah sekali untuk meluncur secepat kilat.',
    color: 0x9d8cff,
    color2: 0x7fd8ff,
    walk: 4.6, backWalk: 3.9, jumpV: 18.8, jumpX: 5.8,
    flatPoses: true,
    flashMove: true, // tekan arah depan/belakang = meluncur kilat (seperti Mas Tio)
    ranged: true,
    rangedReach: 0.43,
    hurtbox: { w: 104, h: 268 },
    walkCycle: ['walk1', 'walk2', 'walk3', 'walk4'],
    frames: {
      idle: 'walk4', walk: 'walk4', jump: 'jump', fall: 'jump', hurt: 'hurt', fly: 'hurt', lie: 'lie', getup: 'getup',
      guard: 'palm', charge: 'meditate', intro: 'aura', win: 'meditate', seal: 'meditate', flashF: 'dash', flashB: 'dash',
    },
    // pukulan = lemparan shuriken, jangkauan 45% arena
    moves: {
      p1: { frame: 'throw', startup: 4, active: 3, recovery: 9, dmg: 32, hitstun: 18, blockstun: 11, push: 6, box: [120, 240, 60, 60], next: 'p2', proj: { star: true, h: 245, x: 120, speed: 22, reach: 0.45 } },
      p2: { frame: 'punch2', startup: 4, active: 3, recovery: 14, dmg: 40, hitstun: 22, blockstun: 12, push: 8, box: [120, 215, 60, 60], proj: { star: true, h: 215, x: 120, speed: 22, reach: 0.45 } },
      // tendangan biasa
      kick: { frame: 'kick2', pre: 'walk4', startup: 8, active: 4, recovery: 16, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [125, 200, 130, 140], lunge: 2, heavy: true },
      air: { frame: 'kick3', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [110, 160, 140, 130] },
    },
    jurus: { type: 'thunderdash', name: 'TABRAKAN PETIR', cost: 30, range: 700, desc: 'Melesat menabrak lawan lalu menyetrum dengan listrik kuning-biru' },
    ulti: { type: 'thunderorb', name: 'BOLA PETIR', cost: 100, range: 1000, desc: 'Bola petir pelindung didorong ke lawan & menyetrum hingga jatuh' },
    quotes: {
      intro: 'Bayanganku lebih cepat dari matamu.',
      win: 'Kau bahkan tak melihat shuriken itu datang.',
    },
  },
  {
    id: 'tio',
    name: 'MAS TIO',
    title: 'Operator Kilat',
    element: 'KECEPATAN KILAT',
    desc: 'Operator sekolah penguasa ilmu bertarung super cepat. Tekan arah sekali untuk meluncur secepat kilat.',
    color: 0xffa53d,
    color2: 0xffd27a,
    walk: 4.8, backWalk: 4.0, jumpV: 18.8, jumpX: 6,
    flatPoses: true,
    // tekan arah depan = meluncur kilat ke depan lawan, arah belakang = mundur kilat ke ujung arena
    flashMove: true,
    hurtbox: { w: 106, h: 275 },
    walkCycle: ['walk1', 'walk2', 'walk3', 'walk4'],
    frames: {
      idle: 'walk3', walk: 'walk3', jump: 'jumpknee', fall: 'jumpknee', hurt: 'hurt', fly: 'hurt', lie: 'lie', getup: 'hurt',
      guard: 'guard', charge: 'aura', intro: 'aura', win: 'aura', seal: 'aura',
    },
    // pukulan super cepat beruntun
    moves: {
      p1: { frame: 'jab', startup: 3, active: 3, recovery: 7, dmg: 32, hitstun: 18, blockstun: 10, push: 4, box: [110, 210, 90, 70], lunge: 3, next: 'p2' },
      p2: { frame: 'jab2', startup: 3, active: 3, recovery: 7, dmg: 32, hitstun: 18, blockstun: 10, push: 4, box: [112, 210, 90, 70], lunge: 3, next: 'p3' },
      p3: { frame: 'backfist', startup: 4, active: 3, recovery: 8, dmg: 34, hitstun: 20, blockstun: 11, push: 5, box: [100, 225, 90, 80], lunge: 3, next: 'p4', slash: 0xffd27a },
      p4: { frame: 'double', startup: 5, active: 4, recovery: 15, dmg: 55, blockstun: 15, push: 9, box: [112, 210, 110, 90], lunge: 5, kd: true, launch: [10, -11], heavy: true },
      kick: { frame: 'kick2', pre: 'walk3', startup: 7, active: 4, recovery: 15, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [120, 230, 120, 140], lunge: 3, heavy: true, slash: 0xffd27a },
      air: { frame: 'jumpknee', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [70, 120, 120, 120] },
    },
    jurus: { type: 'flashpunch', name: 'FLASH PUNCH', cost: 25, range: 1500, desc: 'Berlari secepat kilat lalu meninju; ditangkis pun lawan terpental ke ujung arena' },
    ulti: { type: 'skyslam', name: 'HANTAMAN LANGIT', cost: 100, range: 1500, desc: 'Muncul di atas kepala lawan lalu menghantam ke bawah, tak bisa ditangkis' },
    quotes: {
      intro: 'Data sudah saya input. Giliran kamu kalah.',
      win: 'Server aman, lawan tumbang!',
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
    flatPoses: true, // pose K.O. sudah digambar terbaring
    hurtbox: { w: 124, h: 280 },
    frames: {
      idle: 'stance', walk: 'stance', walkF: 'run', jump: 'jump', fall: 'jump', hurt: 'hit', fly: 'hit', lie: 'ko',
      getup: 'crouch', guard: 'guard', charge: 'flex', intro: 'flex', win: 'flex', seal: 'crouch',
    },
    moves: {
      p1: { frame: 'jab', startup: 5, active: 3, recovery: 10, dmg: 45, hitstun: 18, blockstun: 11, push: 6, box: [130, 205, 104, 74], lunge: 2, next: 'p2' },
      p2: { frame: 'bigpunch', startup: 6, active: 4, recovery: 12, dmg: 50, hitstun: 20, blockstun: 12, push: 7, box: [135, 200, 124, 104], lunge: 2, next: 'p3', slash: 0xffffff },
      // terjangan bahu
      p3: { frame: 'shoulder', pre: 'crouch', startup: 8, active: 6, recovery: 18, dmg: 70, blockstun: 15, push: 9, box: [95, 170, 140, 200], lunge: 7, kd: true, launch: [10, -9], heavy: true },
      // tendangan menembakkan bola sepak sejauh 40% arena (kekuatan tendangan biasa)
      kick: { frame: 'kickball', pre: 'stance', startup: 9, active: 3, recovery: 17, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [120, 90, 124, 134], heavy: true, proj: { ball: true, x: 140, h: 70, speed: 18, reach: 0.4 } },
      air: { frame: 'smash', startup: 4, active: 40, recovery: 9, dmg: 80, hitstun: 22, blockstun: 12, push: 7, box: [40, 45, 160, 120], dive: [2, 16], heavy: true },
    },
    jurus: { type: 'firebasket', name: 'BOLA BASKET API', cost: 30, range: 1500, desc: 'Melempar bola basket api, lawan yang terkena langsung jatuh' },
    ulti: { type: 'superkick', name: 'TENDANGAN BOLA PETIR SUPER', cost: 100, range: 1500, desc: 'Tendangan bola berpetir yang mendorong lawan ke ujung arena walau ditangkis' },
    quotes: {
      intro: 'Otot ini bukan pajangan!',
      win: 'Olahraga itu penting, anak-anak!',
    },
  },
  {
    id: 'kingandri',
    name: 'KING ANDRI',
    title: 'Raja Petir',
    element: 'PETIR (OVER POWER)',
    desc: 'Karakter terkuat! Pukulan & tendangannya melepaskan petir setengah layar yang mendorong lawan. Cakra penuh hanya 2 detik.',
    color: 0x5fe0ff,
    color2: 0xbff4ff,
    walk: 4.6, backWalk: 4.0, jumpV: 19, jumpX: 5.6,
    chargeRate: 0.84, // cakra penuh dalam 2 detik
    ranged: true,      // pukulan & tendangan menyerang dari jauh (dipakai AI)
    flatPoses: true,   // pose terlempar/terbaring sudah digambar miring, jangan diputar lagi
    hurtbox: { w: 106, h: 272 },
    walkCycle: ['walk1', 'walk2', 'walk3', 'walk2'], // jalan dengan langkah kaki
    frames: {
      idle: 'stance', walk: 'stance', jump: 'dash', fall: 'dash', hurt: 'hurt', fly: 'hurt', lie: 'lie',
      getup: 'ready', guard: 'guard', charge: 'charge', intro: 'book', win: 'book', seal: 'charge',
    },
    // proj: petir yang melesat setengah layar & mendorong lawan jauh ke belakang
    moves: {
      p1: { frame: 'punch', startup: 4, active: 3, recovery: 10, dmg: 40, hitstun: 18, blockstun: 11, push: 17, box: [130, 205, 90, 70], next: 'p2', proj: { h: 205, speed: 22, bolt: true } },
      p2: { frame: 'punch2', startup: 5, active: 3, recovery: 12, dmg: 45, hitstun: 20, blockstun: 12, push: 19, box: [130, 200, 90, 70], next: 'p3', proj: { h: 200, speed: 22, bolt: true } },
      p3: { frame: 'kick2', pre: 'ready', startup: 7, active: 3, recovery: 18, dmg: 70, blockstun: 15, push: 16, box: [130, 190, 120, 120], kd: true, launch: [15, -10], heavy: true, proj: { h: 180, speed: 21, scale: 1.4, bolt: true } },
      kick: { frame: 'kick', pre: 'stance', startup: 8, active: 3, recovery: 16, dmg: 85, hitstun: 22, blockstun: 14, push: 24, box: [130, 175, 120, 120], heavy: true, proj: { h: 175, speed: 21, scale: 1.3, bolt: true } },
      air: { frame: 'kick', startup: 4, active: 3, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 12, box: [100, 120, 90, 90], air: true, proj: { h: 170, speed: 18, vy: 6, bolt: true } },
    },
    jurus: { type: 'kamehameha', name: 'KAMEHAMEHA', cost: 30, range: 1500, desc: 'Gelombang energi yang menjangkau tepi layar' },
    ulti: { type: 'skylaser', name: 'LASER MERAH LANGIT', cost: 100, range: 1500, desc: 'Melompat tinggi lalu menembakkan laser merah ke bawah hingga lawan terlempar' },
    quotes: {
      intro: 'Raja tidak perlu mendekat.',
      win: 'Itulah kekuatan seorang raja!',
    },
  },
  {
    id: 'nita',
    name: 'MBAK NITA',
    title: 'Pemanah Petir',
    element: 'PANAH CAHAYA',
    desc: 'Pesilat sekaligus pemanah jitu. Busur cahayanya melepas panah berpetir yang menyeret lawan jauh ke belakang.',
    color: 0xff6fae,
    color2: 0xffd75a,
    walk: 4.3, backWalk: 3.6, jumpV: 18.8, jumpX: 5.4,
    flatPoses: true,
    hurtbox: { w: 104, h: 272 },
    frames: {
      idle: 'stance', walk: 'stance', jump: 'stance', fall: 'stance', hurt: 'hurt', fly: 'fall', lie: 'lie', getup: 'hurt',
      guard: 'guard', charge: 'drawbow', intro: 'aimbow', win: 'drawbow', seal: 'drawbow',
    },
    moves: {
      // pukulan tangan menyemburkan api sejauh 25% arena
      p1: { frame: 'punch', startup: 4, active: 3, recovery: 10, dmg: 40, hitstun: 18, blockstun: 11, push: 6, box: [128, 205, 90, 70], lunge: 2, next: 'p2', proj: { fire: true, h: 222, x: 120, speed: 17 } },
      p2: { frame: 'punch2', startup: 5, active: 4, recovery: 12, dmg: 45, hitstun: 20, blockstun: 12, push: 7, box: [138, 205, 100, 80], lunge: 4, next: 'p3', proj: { fire: true, h: 222, x: 130, speed: 17 } },
      p3: { frame: 'highkick', pre: 'stance', startup: 7, active: 5, recovery: 17, dmg: 70, blockstun: 15, push: 8, box: [110, 225, 120, 170], lunge: 3, kd: true, launch: [7, -14], heavy: true, slash: 0xfff0c0 },
      kick: { frame: 'kick', pre: 'stance', startup: 8, active: 4, recovery: 16, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [125, 150, 130, 130], lunge: 2, heavy: true },
      air: { frame: 'kick', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [100, 120, 140, 130] },
    },
    jurus: { type: 'arrow', name: 'PANAH CAHAYA', cost: 25, range: 1500, desc: 'Mengeluarkan busur lalu menembakkan panah' },
    ulti: { type: 'thunderarrow', name: 'PANAH PETIR', cost: 100, range: 1500, desc: 'Panah berpetir yang menyeret lawan jauh ke belakang' },
    quotes: {
      intro: 'Satu anak panah, satu sasaran.',
      win: 'Tepat sasaran, seperti biasa!',
    },
  },  {
    id: 'suci',
    name: 'SUCI FLOWER',
    title: 'Mawar Berduri',
    element: 'MAWAR & RACUN',
    desc: 'Anggun membawa setangkai mawar. Kibasan mawarnya melepas angin pisau merah, lemparan mawarnya mengandung racun.',
    color: 0xff3d8a,
    color2: 0xffa8cc,
    walk: 4.2, backWalk: 3.5, jumpV: 18.5, jumpX: 5.2,
    flatPoses: true,
    hurtbox: { w: 100, h: 272 },
    walkCycle: ['walk1', 'walk2', 'walk3', 'walk4'],
    frames: {
      idle: 'walk4', walk: 'walk4', jump: 'roseup', fall: 'roseup', hurt: 'hurt', fly: 'hurt', lie: 'lie', getup: 'hurt',
      guard: 'walk4', charge: 'meditate', intro: 'aura', win: 'aura', seal: 'meditate',
    },
    moves: {
      // pukulan mawar dari bawah ke atas
      p1: { frame: 'roseup', pre: 'walk4', startup: 4, active: 4, recovery: 10, dmg: 40, hitstun: 18, blockstun: 11, push: 5, box: [105, 240, 110, 150], lunge: 2, next: 'p2', slash: 0xff3d8a },
      p2: { frame: 'kick', startup: 5, active: 4, recovery: 11, dmg: 45, hitstun: 20, blockstun: 12, push: 6, box: [120, 170, 120, 110], lunge: 3, next: 'p3' },
      p3: { frame: 'kick2', pre: 'walk4', startup: 7, active: 5, recovery: 17, dmg: 70, blockstun: 15, push: 8, box: [120, 225, 120, 150], lunge: 3, kd: true, launch: [8, -13], heavy: true, slash: 0xffa8cc },
      kick: { frame: 'kick', pre: 'walk4', startup: 8, active: 4, recovery: 16, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [125, 170, 130, 120], lunge: 2, heavy: true, slash: 0xffa8cc },
      air: { frame: 'kick2', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [110, 150, 140, 140] },
    },
    jurus: { type: 'roseblade', name: 'ANGIN PISAU MAWAR', cost: 25, range: 1500, desc: 'Kibasan mawar melepas angin pisau merah yang mementalkan lawan' },
    ulti: { type: 'poisonrose', name: 'MAWAR BERACUN', cost: 100, range: 1500, desc: 'Melempar mawar yang meledakkan racun hingga lawan roboh' },
    quotes: {
      intro: 'Indah, tapi berduri.',
      win: 'Setiap mawar punya durinya sendiri.',
    },
  },
  {
    id: 'septi',
    name: 'SEPTI',
    title: 'Penari Kipas Angin',
    element: 'FUTON (ANGIN KIPAS)',
    desc: 'Penari kipas yang tenang. Satu kibasan kipasnya menjatuhkan lawan, dua kipas sekaligus melempar lawan ke tepi arena.',
    color: 0xe8c38a,
    color2: 0xdff4ff,
    walk: 4.3, backWalk: 3.6, jumpV: 18.5, jumpX: 5.3,
    flatPoses: true,
    hurtbox: { w: 102, h: 272 },
    walkCycle: ['walk1', 'walk2', 'walk3', 'walk4'],
    frames: {
      idle: 'walk1', walk: 'walk1', jump: 'walk2', fall: 'walk2', hurt: 'hurt', fly: 'hurt', lie: 'lie', getup: 'hurt',
      guard: 'walk1', charge: 'meditate', intro: 'meditate', win: 'meditate', seal: 'meditate',
    },
    moves: {
      // pukulan dengan kipas
      // satu pukulan kipas ke depan; anginnya mendorong lawan 50% arena (ditangkis: tanpa damage)
      p1: { frame: 'fan1', startup: 4, active: 4, recovery: 14, dmg: 45, hitstun: 30, blockstun: 22, push: 0, box: [135, 190, 150, 150], lunge: 2, wallBlast: 0.5, slash: 0xdff4ff },
      p2: { frame: 'fan2', startup: 5, active: 4, recovery: 11, dmg: 45, hitstun: 20, blockstun: 12, push: 7, box: [125, 180, 140, 150], lunge: 2, next: 'p3' },
      p3: { frame: 'kick2', pre: 'walk1', startup: 7, active: 5, recovery: 17, dmg: 70, blockstun: 15, push: 8, box: [120, 230, 120, 150], lunge: 3, kd: true, launch: [8, -13], heavy: true },
      // tendangan dengan rok
      kick: { frame: 'skirtkick', pre: 'walk1', startup: 8, active: 5, recovery: 16, dmg: 85, hitstun: 22, blockstun: 14, push: 11, box: [120, 190, 140, 150], lunge: 2, heavy: true },
      air: { frame: 'skirtkick', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [110, 160, 140, 140] },
    },
    jurus: { type: 'fangust', name: 'KIBASAN KIPAS', cost: 25, range: 1500, desc: 'Satu kibasan kipas melepas angin yang menjatuhkan lawan' },
    ulti: { type: 'twinfan', name: 'BADAI DUA KIPAS', cost: 100, range: 1500, desc: 'Badai angin dua kipas yang melempar lawan sampai tepi arena' },
    quotes: {
      intro: 'Biarkan anginku menari.',
      win: 'Angin selalu menang dengan tenang.',
    },
  },
  {
    id: 'almusbar',
    name: 'ALMUSBAR',
    title: 'Pelatih Bola Petir',
    element: 'BOLA & PETIR',
    desc: 'Pelatih olahraga bertinju cepat. Pukulan kiri-kanannya beruntun, tendangannya mementalkan lawan jauh.',
    color: 0xff8a1a,
    color2: 0x7fd8ff,
    walk: 4.3, backWalk: 3.6, jumpV: 18.5, jumpX: 5.2,
    flatPoses: true,
    hurtbox: { w: 110, h: 275 },
    walkCycle: ['walk1', 'walk2', 'walk3', 'walk4'],
    frames: {
      idle: 'stance', walk: 'stance', jump: 'kick2', fall: 'kick2', hurt: 'hurt', fly: 'hurt', lie: 'lie', getup: 'hurt',
      guard: 'guard', charge: 'charge', intro: 'stance', win: 'charge', seal: 'charge',
    },
    // kombo pukulan kiri-kanan cepat & beruntun (tekan PUKUL berkali-kali)
    moves: {
      p1: { frame: 'jab', startup: 3, active: 3, recovery: 7, dmg: 26, hitstun: 18, blockstun: 10, push: 3, box: [130, 215, 90, 70], lunge: 2, next: 'p2' },
      p2: { frame: 'cross', startup: 3, active: 3, recovery: 7, dmg: 26, hitstun: 18, blockstun: 10, push: 3, box: [130, 215, 90, 70], lunge: 2, next: 'p3' },
      p3: { frame: 'jab2', startup: 3, active: 3, recovery: 7, dmg: 26, hitstun: 18, blockstun: 10, push: 3, box: [130, 215, 90, 70], lunge: 2, next: 'p4' },
      p4: { frame: 'cross', startup: 3, active: 3, recovery: 7, dmg: 26, hitstun: 18, blockstun: 10, push: 3, box: [130, 215, 90, 70], lunge: 2, next: 'p5' },
      p5: { frame: 'double', startup: 5, active: 4, recovery: 16, dmg: 55, blockstun: 15, push: 9, box: [140, 215, 110, 90], lunge: 4, kd: true, launch: [9, -11], heavy: true, slash: 0xffd27a },
      // tendangan yang mementalkan lawan jauh dalam sekali tendang
      kick: { frame: 'bigkick', pre: 'stance', startup: 8, active: 4, recovery: 18, dmg: 95, blockstun: 15, push: 14, box: [135, 160, 130, 130], lunge: 2, kd: true, launch: [24, -12], heavy: true, slash: 0xffd27a },
      air: { frame: 'kick', startup: 4, active: 40, recovery: 6, dmg: 75, hitstun: 22, blockstun: 12, push: 7, box: [115, 170, 140, 130] },
    },
    jurus: { type: 'ballthrow', name: 'LEMPARAN BOLA', cost: 25, range: 1500, desc: 'Lemparan bola keras yang menjatuhkan lawan; ditangkis pun lawan terdorong jauh' },
    ulti: { type: 'thunderkick', name: 'TENDANGAN BOLA PETIR', cost: 100, range: 1500, desc: 'Bola petir yang menghancurkan perisai dan melempar lawan ke ujung arena' },
    quotes: {
      intro: 'Pemanasan dulu? Tidak perlu!',
      win: 'Priiit! Pertandingan selesai!',
    },
  },
];

// Slot karakter yang akan dikembangkan nanti (saat ini semua 12 slot sudah terisi).
for (let i = 1; i <= 0; i++) {
  window.ROSTER.push({ id: 'locked' + i, name: '???', locked: true });
}

window.getChar = function (id) {
  return window.ROSTER.find((c) => c.id === id);
};

// Serangan udara (tombol serang saat melompat) selalu ditandai sebagai serangan udara.
for (const c of window.ROSTER) {
  if (c.moves && c.moves.air) c.moves.air.air = true;
}
