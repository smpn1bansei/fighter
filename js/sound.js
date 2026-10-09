// =====================================================================
// SUARA: semua efek suara & musik dibuat langsung (sintesis Web Audio),
// jadi tidak perlu file audio.
// =====================================================================
window.Sound = (function () {
  let ctx = null;
  let master, sfxBus, musicBus, noiseBuf;
  let muted = Store.get('muted', false);

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    comp.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.85;
    sfxBus.connect(comp);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.3;
    musicBus.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend();
      else ctx.resume();
    });
    if (pendingTrack) startTrack(pendingTrack);
  }

  // ---------- blok pembentuk suara ----------
  function tone(type, f0, f1, t, dur, vol, dest, attack) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const a = attack || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
    o.connect(g);
    g.connect(dest || sfxBus);
    o.start(t);
    o.stop(t + a + dur + 0.05);
    return o;
  }

  function noise(t, dur, vol, ftype, f0, f1, q, dest) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = ftype || 'lowpass';
    f.frequency.setValueAtTime(f0 || 1000, t);
    if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    f.Q.value = q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest || sfxBus);
    const off = Math.random() * 1.5;
    s.start(t, off, dur + 0.05);
  }

  // ---------- efek suara ----------
  const SFX = {
    light(t) {
      noise(t, 0.07, 0.5, 'bandpass', 1800, 900, 1.2);
      tone('sine', 190, 70, t, 0.08, 0.6);
    },
    heavy(t) {
      noise(t, 0.2, 0.7, 'lowpass', 1600, 250);
      tone('sine', 130, 42, t, 0.24, 0.95);
      tone('square', 900, 400, t, 0.02, 0.12);
    },
    block(t) {
      tone('square', 1250, 1100, t, 0.05, 0.18);
      tone('triangle', 2100, 1900, t, 0.1, 0.14);
      noise(t, 0.05, 0.25, 'highpass', 3000);
    },
    whoosh(t) { noise(t, 0.14, 0.22, 'bandpass', 500, 2600, 1.6); },
    jump(t) { tone('sine', 260, 520, t, 0.11, 0.16); },
    land(t) {
      tone('sine', 95, 50, t, 0.1, 0.35);
      noise(t, 0.08, 0.2, 'lowpass', 500);
    },
    fire(t) {
      noise(t, 0.55, 0.65, 'lowpass', 1400, 300, 0.8);
      tone('sawtooth', 95, 55, t, 0.45, 0.12);
    },
    explosion(t) {
      noise(t, 1.0, 1.0, 'lowpass', 2400, 90);
      tone('sine', 75, 28, t, 0.8, 0.9);
    },
    rasengan(t) {
      for (let i = 0; i < 6; i++) tone('square', 300 + i * 90, 340 + i * 90, t + i * 0.06, 0.06, 0.05);
      noise(t, 0.6, 0.3, 'bandpass', 900, 2200, 3);
    },
    wind(t) { noise(t, 0.9, 0.45, 'bandpass', 600, 2400, 2.5); },
    shuriken(t) {
      tone('triangle', 2600, 1700, t, 0.12, 0.12);
      noise(t, 0.1, 0.25, 'highpass', 5000);
    },
    dash(t) {
      noise(t, 0.3, 0.4, 'bandpass', 300, 3000, 1.2);
      tone('sawtooth', 120, 260, t, 0.25, 0.06);
    },
    rock(t) {
      for (let i = 0; i < 5; i++) noise(t + i * 0.035, 0.08, 0.45, 'lowpass', 900 - i * 80, 300);
      tone('sine', 80, 45, t, 0.18, 0.5);
    },
    charge(t) {
      tone('sawtooth', 110, 330, t, 0.45, 0.07, null, 0.08);
      noise(t, 0.45, 0.08, 'highpass', 4000);
    },
    seal(t) {
      tone('sine', 880, 880, t, 0.6, 0.18);
      tone('sine', 1320, 1320, t + 0.05, 0.5, 0.12);
    },
    heal(t) { [523, 659, 784, 1046].forEach((f, i) => tone('sine', f, f, t + i * 0.07, 0.3, 0.15)); },
    ko(t) {
      tone('sawtooth', 220, 55, t, 1.0, 0.25);
      SFX.explosion(t);
    },
    select(t) { tone('square', 660, 660, t, 0.05, 0.1); },
    confirm(t) {
      tone('square', 660, 660, t, 0.06, 0.12);
      tone('square', 990, 990, t + 0.07, 0.1, 0.12);
    },
    back(t) { tone('square', 440, 300, t, 0.09, 0.1); },
    locked(t) { tone('square', 180, 150, t, 0.12, 0.12); },
    round(t) {
      [196, 293, 392].forEach((f) => tone('sine', f, f * 0.98, t, 1.3, 0.25, null, 0.01));
      noise(t, 0.3, 0.3, 'lowpass', 900);
    },
    fight(t) {
      tone('sine', 140, 50, t, 0.25, 1);
      tone('sine', 140, 50, t + 0.16, 0.3, 1);
      noise(t + 0.16, 0.2, 0.5, 'lowpass', 600);
    },
    cutin(t) {
      noise(t, 0.35, 0.4, 'bandpass', 400, 4000, 2);
      tone('sine', 1046, 1046, t + 0.2, 0.7, 0.15);
      tone('sine', 1568, 1568, t + 0.26, 0.6, 0.1);
    },
  };

  function play(name) {
    if (!ctx || muted || !SFX[name]) return;
    try {
      SFX[name](ctx.currentTime + 0.005);
    } catch (e) { /* abaikan */ }
  }

  // ---------- musik ----------
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(tok) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(tok);
    if (!m) return null;
    return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const parse = (s) => s.trim().split(/\s+/).map((t) => (t === '.' ? null : midi(t)));

  const TRACKS = {
    menu: {
      bpm: 92,
      lead: parse(`
        D4 . A4 . D5 . D#5 . D5 . A4 . G4 . A4 .
        A#4 . A4 . G4 . D4 . G4 . A4 . A#4 . A4 .
        D5 . D#5 . G5 . D#5 . D5 . A4 . A#4 . A4 .
        G4 . . . D4 . . . D4 . . . . . . .`),
      bass: parse(`
        D2 . . . . . . . A1 . . . . . . .
        G1 . . . . . . . D2 . . . . . . .
        D2 . . . . . . . A#1 . . . . . . .
        G1 . . . A1 . . . D2 . . . . . . .`),
      kick: 'x.......x.......',
      snare: '................',
      hat: '....x.......x...',
      leadType: 'koto',
    },
    fight: {
      bpm: 148,
      lead: parse(`
        D5 . F5 . G5 . A5 . . . G5 . F5 . D5 .
        C5 . D5 . F5 . . . D5 . C5 . A4 . . .
        D5 . F5 . G5 . A5 . C6 . A5 . G5 . F5 .
        G5 . . . F5 . . . D5 . . . . . . .`),
      bass: parse(`
        D2 . D3 . D2 . D3 . D2 . D3 . D2 . D3 .
        A#1 . A#2 . A#1 . A#2 . A#1 . A#2 . A#1 . A#2 .
        C2 . C3 . C2 . C3 . C2 . C3 . C2 . C3 .
        A1 . A2 . A1 . A2 . A1 . A2 . C2 . C3 .`),
      kick: 'x...x..xx...x...',
      snare: '....x.......x..x',
      hat: 'x.x.x.x.x.x.x.x.',
      leadType: 'flute',
    },
  };

  let track = null;
  let pendingTrack = null;
  let timer = null;
  let nextTime = 0;
  let step = 0;

  function playStep(tr, i, t) {
    const sd = 60 / tr.bpm / 4;
    const n = tr.lead[i % tr.lead.length];
    if (n !== null) {
      if (tr.leadType === 'koto') {
        tone('triangle', hz(n), hz(n), t, 0.55, 0.22, musicBus, 0.003);
        tone('sine', hz(n) * 2, hz(n) * 2, t, 0.25, 0.06, musicBus, 0.003);
      } else {
        const o = tone('square', hz(n), hz(n), t, sd * 1.7, 0.07, musicBus, 0.01);
        o.detune.setValueAtTime(0, t);
        tone('sine', hz(n), hz(n), t, sd * 1.9, 0.12, musicBus, 0.02);
      }
    }
    const b = tr.bass[i % tr.bass.length];
    if (b !== null) tone('triangle', hz(b), hz(b), t, tr.leadType === 'koto' ? sd * 7 : sd * 1.6, 0.3, musicBus, 0.01);
    const p = i % 16;
    if (tr.kick[p] === 'x') {
      tone('sine', 150, 48, t, 0.28, 0.75, musicBus);
      noise(t, 0.06, 0.25, 'lowpass', 300, 200, 1, musicBus);
    }
    if (tr.snare[p] === 'x') noise(t, 0.13, 0.35, 'bandpass', 1900, 1500, 0.9, musicBus);
    if (tr.hat[p] === 'x') noise(t, 0.03, 0.12, 'highpass', 7000, 7000, 1, musicBus);
  }

  function scheduler() {
    if (!ctx || !track) return;
    const sd = 60 / track.bpm / 4;
    if (nextTime < ctx.currentTime - 0.2) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.15) {
      if (!muted) playStep(track, step, nextTime);
      nextTime += sd;
      step = (step + 1) % track.lead.length;
    }
  }

  function startTrack(name) {
    track = TRACKS[name];
    step = 0;
    nextTime = ctx.currentTime + 0.1;
    if (!timer) timer = setInterval(scheduler, 30);
  }

  function music(name) {
    if (name && TRACKS[name] === track) return;
    if (!name) {
      track = null;
      pendingTrack = null;
      return;
    }
    if (!ctx) {
      pendingTrack = name;
      return;
    }
    startTrack(name);
  }

  function setMuted(m) {
    muted = m;
    Store.set('muted', m);
    if (master) master.gain.value = m ? 0 : 0.9;
  }

  // Aktifkan audio pada sentuhan/tombol pertama (aturan browser HP).
  const unlock = () => init();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchend', unlock, { passive: true });

  return { init, play, music, setMuted, isMuted: () => muted };
})();
