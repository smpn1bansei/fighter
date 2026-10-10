// =====================================================================
// PETARUNG: status, gerak, serangan, menerima pukulan, dan tampilan.
// Semua logika berjalan per "langkah" (60 langkah per detik).
// =====================================================================
window.FRAMES = {}; // data titik tumpu tiap pose, diisi di BootScene

const NEUTRAL = { idle: 1, walk: 1, guard: 1, charge: 1 };

class Fighter {
  constructor(scene, def, side, x, ctrl, opts) {
    opts = opts || {};
    this.scene = scene;
    this.def = def;
    this.side = side;
    this.ctrl = ctrl;
    this.isCPU = !!opts.cpu;
    this.dmgMult = opts.dmgMult || 1;
    this.frames = FRAMES[def.id];
    this.S = CFG.CHAR_SCALE;
    this.ground = scene.groundY;

    this.shadow = scene.add.image(x, this.ground + 2, 'fx_shadow').setDepth(5);
    this.shield = scene.add.image(x, this.ground - 150, 'fx_ring').setDepth(22)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(def.color2).setVisible(false);
    this.sprite = scene.add.sprite(x, this.ground, def.id).setDepth(20);
    this.baseTint = opts.tint || null;
    this.reset(x);
  }

  reset(x) {
    this.x = x;
    this.y = this.ground;
    this.vx = 0;
    this.vy = 0;
    this.extraVx = 0;
    this.facing = this.side === 0 ? 1 : -1;
    this.onGround = true;
    this.hp = CFG.MAX_HP;
    if (this.chakra === undefined) this.chakra = CFG.CHAKRA_START;
    this.state = 'idle';
    this.t = 0;
    this.move = null;
    this.queued = null;
    this.hasHit = false;
    this.hitstun = 0;
    this.invuln = 0;
    this.airUsed = false;
    this.comboTaken = 0;
    this.grabbing = false; // sedang "memegang" lawan dalam jurus (dorongan antar-petarung dimatikan)
    this.flashCD = 0;
    this.tintOverride = null;
    this.ko = false;
    this.flashAt = -1e9;
    this.walkPhase = 0;
    this.landWait = 0;
    this.cancelJutsu();
    this.pose = null;
    this.setPose(this.def.frames.idle);
    this.sprite.setRotation(0);
  }

  get opp() { return this.side === 0 ? this.scene.p2 : this.scene.p1; }
  get fx() { return this.scene.fx; }

  setPose(name) {
    if (this.pose === name) return;
    const f = this.frames[name];
    if (!f) {
      console.warn('Pose tidak ditemukan:', this.def.id, name);
      return;
    }
    this.pose = name;
    this.sprite.setFrame(name);
    this.sprite.setOrigin(f.ax, f.ay);
  }

  setState(s) {
    this.state = s;
    this.t = 0;
    const F = this.def.frames;
    switch (s) {
      case 'idle': case 'walk': this.setPose(F.idle); break;
      case 'guard': case 'blockstun': this.setPose(F.guard); break;
      case 'charge': this.setPose(F.charge); break;
      case 'prejump': case 'landing': this.setPose(F.idle); break;
      case 'jump': this.setPose(F.jump); break;
      case 'hurt': this.setPose(F.hurt); break;
      case 'launched': this.setPose(F.fly); break;
      case 'down': this.setPose(F.lie); break;
      case 'getup': this.setPose(F.getup); break;
      case 'intro': this.setPose(F.intro); break;
      case 'win': this.setPose(F.win); break;
    }
  }

  // Titik di tubuh relatif kaki: maju (ke arah hadap) dan naik.
  at(fx, fy) {
    return { x: this.x + this.facing * fx, y: this.y - fy };
  }

  boxRect(box) {
    const [fx, fy, w, h] = box;
    const c = this.at(fx, fy);
    return { x: c.x - w / 2, y: c.y - h / 2, w, h };
  }

  hurtbox() {
    if (this.invuln > 0 || this.ko) return null;
    if (this.state === 'down' || this.state === 'getup' || this.state === 'launched') return null;
    const hb = this.def.hurtbox;
    return { x: this.x - hb.w / 2, y: this.y - hb.h, w: hb.w, h: hb.h };
  }

  isNeutral() { return this.onGround && !!NEUTRAL[this.state]; }

  gainChakra(n) {
    this.chakra = Math.max(0, Math.min(CFG.MAX_CHAKRA, this.chakra + n));
  }

  faceOpponent() {
    const dx = this.opp.x - this.x;
    if (Math.abs(dx) > 4) this.facing = dx > 0 ? 1 : -1;
  }

  // ------------------------------------------------------------------
  // Satu langkah logika
  // ------------------------------------------------------------------
  step() {
    const c = this.ctrl;
    const d = this.def;
    this.t++;
    if (this.invuln > 0) this.invuln--;
    if (this.flashCD > 0) this.flashCD--;

    switch (this.state) {
      case 'idle':
      case 'walk':
      case 'guard':
      case 'charge': {
        this.faceOpponent();
        if (this.scene.inputLocked) {
          this.vx = 0;
          if (this.state !== 'idle') this.setState('idle');
          break;
        }
        if (this.tryActions()) break;
        if (d.teleport && c.pressed('up') && this.chakra >= d.jurus.cost && this.flashCD <= 0) {
          c.consume('up');
          this.teleportBehind();
          break;
        }
        if (c.held('up')) {
          this.setState('prejump');
          this.vx = 0;
          break;
        }
        if (c.held('guard')) {
          if (this.state !== 'guard') this.setState('guard');
          this.vx = 0;
          break;
        }
        if (c.held('charge') && this.chakra < CFG.MAX_CHAKRA) {
          if (this.state !== 'charge') this.setState('charge');
          this.vx = 0;
          this.chargeChakra();
          break;
        }
        // gerak kilat (Mas Tio): menekan arah sekali langsung meluncur
        if (d.flashMove && this.flashCD <= 0) {
          const fp = c.pressed('right') ? 1 : c.pressed('left') ? -1 : 0;
          if (fp) {
            c.consume('right');
            c.consume('left');
            this.startFlash(fp);
            break;
          }
        }
        const dir = (c.held('right') ? 1 : 0) - (c.held('left') ? 1 : 0);
        if (dir !== 0) {
          const fwd = dir === this.facing;
          this.vx = dir * (fwd ? d.walk : d.backWalk);
          if (this.state !== 'walk') this.setState('walk');
          // pose khusus saat maju (mis. lari merunduk Fatim)
          this.walkPhase += 0.22;
          if (d.walkCycle) {
            // animasi langkah kaki kiri-kanan (mundur = urutan dibalik)
            const n = d.walkCycle.length;
            const k = Math.floor(this.walkPhase / 1.15) % n;
            this.setPose(d.walkCycle[fwd ? k : n - 1 - k]);
          } else {
            this.setPose(fwd && d.frames.walkF ? d.frames.walkF : d.frames.walk);
          }
          if (fwd && d.frames.walkF && this.t % 4 === 0) {
            if (d.walkFx === 'dust') this.fx.dust(this.x - this.facing * 30, this.ground, 1);
            else this.afterimage(d.color, 0.3, 160);
          }
        } else {
          this.vx = 0;
          if (this.state !== 'idle') this.setState('idle');
        }
        break;
      }
      case 'flash': {
        const dx = this.flashTarget - this.x, sp = 42;
        this.vx = 0;
        this.afterimage(d.color, 0.5, 200);
        if (this.t % 2 === 0) this.fx.dust(this.x - Math.sign(dx || 1) * 30, this.ground, 1);
        if (Math.abs(dx) <= sp || this.t > 30) {
          this.x = this.flashTarget;
          this.flashCD = 18;
          this.fx.dust(this.x, this.ground, 4);
          this.setState('idle');
        } else {
          this.x += Math.sign(dx) * sp;
        }
        break;
      }
      case 'prejump':
        if (this.t >= 3) {
          const dir = (c.held('right') ? 1 : 0) - (c.held('left') ? 1 : 0);
          this.vy = -d.jumpV;
          this.vx = dir * d.jumpX;
          this.onGround = false;
          this.airUsed = false;
          this.setState('jump');
          Sound.play('jump');
          this.fx.dust(this.x, this.ground, 3);
        }
        break;
      case 'jump':
        this.setPose(this.vy > 2 ? d.frames.fall : d.frames.jump);
        if (!this.airUsed && !this.scene.inputLocked && (c.pressed('punch') || c.pressed('kick'))) {
          c.consume('punch');
          c.consume('kick');
          this.airUsed = true;
          this.startMove('air');
        }
        break;
      case 'attack':
        this.stepAttack();
        break;
      case 'jutsu':
        if (!this.jutsu || !this.jutsu.step(this.t)) {
          this.jutsu = null;
          this.grabbing = false;
          this.setState(this.onGround ? 'idle' : 'jump');
          this.airUsed = true;
        }
        break;
      case 'landing':
        this.vx = 0;
        if (this.t >= this.landWait) this.setState('idle');
        break;
      case 'hurt':
        if (this.t >= this.hitstun) this.recover();
        break;
      case 'blockstun':
        if (this.t >= this.hitstun) this.setState(c.held('guard') ? 'guard' : 'idle');
        break;
      case 'down':
        if (!this.ko && this.t >= 42) this.setState('getup');
        break;
      case 'getup':
        if (this.t >= 16) {
          this.recover();
          this.invuln = 12;
        }
        break;
      default:
        break;
    }
    this.physics();
    this.effects();
  }

  recover() {
    this.comboTaken = 0;
    this.setState('idle');
  }

  tryActions() {
    const c = this.ctrl, d = this.def;
    if (c.pressed('ulti')) {
      c.consume('ulti');
      if (this.chakra >= d.ulti.cost) { this.startJutsu('ulti'); return true; }
      this.scene.events.emit('nochakra', this);
    }
    if (c.pressed('jurus')) {
      c.consume('jurus');
      if (this.chakra >= d.jurus.cost) { this.startJutsu('jurus'); return true; }
      this.scene.events.emit('nochakra', this);
    }
    if (c.pressed('punch')) { c.consume('punch'); this.startMove('p1'); return true; }
    if (c.pressed('kick')) { c.consume('kick'); this.startMove('kick'); return true; }
    return false;
  }

  chargeChakra() {
    // chargeRate: kecepatan isi cakra per langkah (0.55 = penuh dalam ~3 detik)
    this.gainChakra(this.def.chargeRate || 0.55);
    if (this.t % 27 === 1) Sound.play('charge');
    if (this.t % 20 === 1) this.fx.shock(this.x, this.ground, this.def.color, 1.6);
  }

  // Nur Hokage: menghilang lalu muncul di belakang lawan (memakai cakra seperti jurus).
  teleportBehind() {
    const opp = this.opp, side = Math.sign(opp.x - this.x) || this.facing;
    this.chakra -= this.def.jurus.cost;
    this.afterimage(this.def.color, 0.7, 260);
    this.fx.image('fx_glow', this.x, this.y - 150, { tint: this.def.color, from: 1.5, to: 0.2, ms: 220 });
    let nx = opp.x + side * (CFG.PUSH_W + 20);
    if (nx < CFG.WALL || nx > CFG.W - CFG.WALL) nx = Phaser.Math.Clamp(nx, CFG.WALL, CFG.W - CFG.WALL);
    this.x = nx;
    this.vx = 0;
    this.faceOpponent();
    this.fx.image('fx_ring', this.x, this.y - 150, { tint: this.def.color, from: 0.2, to: 1.8, ms: 260, scaleY: 1.6 });
    this.fx.burst(this.fx.sparks, this.x, this.y - 150, 10, this.def.color);
    this.invuln = 8;
    this.flashCD = 20;
    this.setState('landing');
    this.landWait = 6;
    Sound.play('dash');
  }

  // Meluncur secepat kilat: ke depan lawan, atau mundur ke ujung arena sendiri.
  startFlash(dir) {
    const fwd = dir === this.facing;
    const lo = CFG.WALL, hi = CFG.W - CFG.WALL;
    if (fwd) {
      const front = this.opp.x - this.facing * (CFG.PUSH_W + 16);
      this.flashTarget = Phaser.Math.Clamp(front, lo, hi);
      // sudah di depan lawan: tidak perlu meluncur
      if ((this.flashTarget - this.x) * this.facing <= 8) return;
    } else {
      this.flashTarget = dir > 0 ? hi : lo;
    }
    this.setState('flash');
    const F = this.def.frames;
    this.setPose(fwd ? F.flashF || 'dash' : F.flashB || 'run');
    Sound.play('dash');
  }

  startMove(key) {
    const m = this.def.moves[key];
    this.move = m;
    this.moveKey = key;
    this.actionId = (this.actionId || 0) + 1;
    this.hasHit = false;
    this.queued = null;
    this.setState('attack');
    this.setPose(m.pre || m.frame);
    if (m.hop && this.onGround) {
      this.vy = m.hop;
      this.onGround = false;
    }
    Sound.play('whoosh');
  }

  stepAttack() {
    const m = this.move, c = this.ctrl, t = this.t;
    const a0 = m.startup, a1 = m.startup + m.active, total = a1 + m.recovery;
    if (t === a0) {
      this.setPose(m.frame);
      // serangan jarak jauh (mis. angin sabit King Andri)
      if (m.proj) {
        if (m.proj.star) new ThrowStar(this, m);
        else if (m.proj.fire) new FlameShot(this, m);
        else if (m.proj.ball) new KickBall(this, m);
        else new LightningBolt(this, m);
        this.hasHit = true;
      }
      if (m.slash) {
        const p = this.at(m.box[0] * 0.8, m.box[1]);
        this.fx.slash(p.x, p.y, this.facing, m.slash);
      }
      if (m.dive) {
        this.vx = this.facing * m.dive[0];
        this.vy = m.dive[1];
      }
    }
    if (this.onGround || m.hop) this.vx = t < a1 && m.lunge ? this.facing * m.lunge : this.vx * 0.7;
    // jejak bayangan & kilat saat menerjang cepat
    if (m.trail && t >= a0 - 2 && t < a1) {
      if (t % 2 === 0) this.afterimage(m.trail, 0.5, 200);
      if (t % 3 === 0) this.fx.burst(this.fx.sparks, this.x - this.facing * 40, this.y - Phaser.Math.Between(60, 220), 2, m.trail);
    }

    if (t >= a0 && t < a1 && !this.hasHit) this.scene.checkMoveHit(this, m);

    // Rangkaian kombo: tekan pukul lagi -> pukulan berikutnya
    if (!m.air && t >= 2) {
      if (m.next && c.pressed('punch')) { c.consume('punch'); this.queued = m.next; }
      else if ((this.moveKey === 'p1' || this.moveKey === 'p2') && c.pressed('kick')) { c.consume('kick'); this.queued = 'kick'; }
    }
    // Batalkan ke jurus setelah serangan kena/ditahan
    if (this.hasHit && !m.air && t >= a0 && c.pressed('jurus') && this.chakra >= this.def.jurus.cost) {
      c.consume('jurus');
      this.startJutsu('jurus');
      return;
    }
    if (this.queued && t >= a1 + 1 && this.onGround) {
      const q = this.queued;
      this.queued = null;
      this.startMove(q);
      return;
    }
    if (m.air) {
      if (t >= a1 && !this.onGround) {
        this.state = 'jump';
        this.airUsed = true;
      }
    } else if (t >= total && this.onGround) {
      this.setState('idle');
    }
  }

  startJutsu(which) {
    const j = this.def[which];
    this.chakra -= j.cost;
    this.actionId = (this.actionId || 0) + 1;
    this.move = null;
    this.queued = null;
    this.vx = 0;
    this.setState('jutsu');
    this.jutsu = JUTSU[j.type](this, j);
    if (which === 'ulti') {
      this.invuln = 40;
      this.scene.cutIn(this, j.name);
    } else {
      this.scene.jutsuCall(this, j.name);
    }
  }

  cancelJutsu() {
    if (this.jutsu && this.jutsu.cancel) this.jutsu.cancel();
    this.jutsu = null;
    this.grabbing = false;
  }

  // ------------------------------------------------------------------
  // Menerima serangan. Mengembalikan 'hit', 'block', atau 'miss'.
  // ------------------------------------------------------------------
  receive(att, hit) {
    // hit.force: serangan lanjutan dalam jurus sinematik (tetap kena walau lawan sedang terlempar)
    if (this.ko || (!hit.force && !this.hurtbox())) return 'miss';
    const srcX = hit.srcX !== undefined ? hit.srcX : att.x;
    const dir = Math.sign(this.x - srcX) || -this.facing;
    const fromFront = dir !== this.facing || Math.abs(this.x - srcX) < 8;
    const backKey = this.facing === 1 ? 'left' : 'right';
    const blocking = !hit.force && this.onGround && fromFront && !hit.unblockable && (
      this.state === 'guard' || this.state === 'blockstun' ||
      ((this.state === 'idle' || this.state === 'walk') && this.ctrl.held(backKey) && !this.ctrl.held(backKey === 'left' ? 'right' : 'left'))
    );
    if (blocking) {
      const chip = Math.round(hit.dmg * (hit.chip || 0) * att.dmgMult);
      this.hp = Math.max(1, this.hp - chip);
      this.setState('blockstun');
      this.hitstun = hit.blockstun || 12;
      this.vx = dir * (hit.push || 6);
      this.gainChakra(2);
      return 'block';
    }
    this.comboTaken++;
    // Kombo panjang mengurangi damage pukulan biasa (jurus tidak dikurangi).
    const scale = hit.noGain ? 1 : Math.max(0.4, 1 - 0.1 * Math.max(0, this.comboTaken - 2));
    const dmg = Math.max(1, Math.round(hit.dmg * scale * att.dmgMult));
    this.hp = Math.max(0, this.hp - dmg);
    this.lastDamage = dmg;
    // kilat putih singkat (pukulan keras) lalu rona merah
    this.flashAt = this.scene.time.now;
    this.flashHard = !(hit.hitstop !== undefined && hit.hitstop <= 3);
    this.cancelJutsu();
    this.move = null;
    this.queued = null;
    this.gainChakra(3);
    if (this.hp <= 0) {
      this.ko = true;
      this.launch(dir, hit.launch ? [Math.max(hit.launch[0], 8), Math.min(hit.launch[1], -12)] : [8, -13]);
    } else if (hit.kd || !this.onGround) {
      this.launch(dir, hit.launch || [5, -9]);
    } else {
      this.setState('hurt');
      this.hitstun = hit.hitstun || 18;
      this.vx = dir * (hit.push || 5);
    }
    return 'hit';
  }

  launch(dir, l) {
    this.setState('launched');
    this.onGround = false;
    this.vx = dir * l[0];
    this.vy = l[1];
  }

  // ------------------------------------------------------------------
  physics() {
    if (!this.onGround) {
      this.vy += CFG.GRAVITY;
      this.y += this.vy;
      this.x += this.vx;
      if (this.y >= this.ground) {
        this.y = this.ground;
        this.land();
      }
    } else {
      this.x += this.vx;
      if (this.state === 'hurt' || this.state === 'blockstun' || this.state === 'down' || this.state === 'getup') this.vx *= 0.84;
    }
    if (Math.abs(this.extraVx) > 0.2) {
      this.x += this.extraVx;
      this.extraVx *= 0.8;
    } else this.extraVx = 0;
    this.x = Phaser.Math.Clamp(this.x, CFG.WALL, CFG.W - CFG.WALL);
  }

  land() {
    this.onGround = true;
    this.vy = 0;
    if (this.state === 'launched') {
      this.setState('down');
      this.vx *= 0.35;
      Sound.play('land');
      this.fx.dust(this.x, this.ground, 8);
      this.scene.shake(90, 0.006);
      return;
    }
    if (this.state === 'attack') {
      const m = this.move;
      if (m.air) {
        if (m.dive) {
          this.fx.shock(this.x, this.ground, this.def.color, 2.4);
          this.fx.burst(this.fx.sparks, this.x, this.ground - 10, 14, this.def.color);
          this.fx.dust(this.x, this.ground, 6);
          this.scene.shake(120, 0.008);
          Sound.play('heavy');
        }
        this.landWait = m.recovery;
        this.setState('landing');
        this.vx = 0;
      } else {
        this.vx = 0;
      }
      return;
    }
    if (this.state === 'jutsu' || this.state === 'hurt') return;
    this.landWait = 4;
    this.setState('landing');
    this.vx = 0;
    Sound.play('land');
    this.fx.dust(this.x, this.ground, 3);
  }

  effects() {
    if (this.state === 'charge') {
      for (let i = 0; i < 2; i++) {
        this.fx.auraAt(this.x + Phaser.Math.Between(-60, 60), this.y - Phaser.Math.Between(0, 240), this.def.color);
      }
    } else if (this.chakra >= CFG.MAX_CHAKRA && this.t % 5 === 0 && !this.ko) {
      this.fx.auraAt(this.x + Phaser.Math.Between(-50, 50), this.y - Phaser.Math.Between(0, 200), 0xffd75a);
    }
  }

  // ------------------------------------------------------------------
  // Tampilan (dipanggil tiap frame layar)
  // ------------------------------------------------------------------
  render(time) {
    const sp = this.sprite;
    const st = this.state;
    let sx = this.S, sy = this.S, ox = 0, oy = 0, rot = 0;
    if (st === 'idle' || st === 'guard' || st === 'charge' || st === 'intro' || st === 'win') {
      const b = Math.sin(time / 260 + this.side * 2) * 0.012;
      sy *= 1 + b;
      sx *= 1 - b * 0.5;
    }
    if (st === 'walk') {
      const run = this.def.frames.walkF && this.pose === this.def.frames.walkF;
      const steps = !!this.def.walkCycle; // langkah sudah digambar: cukup goyang kecil
      oy = -Math.abs(Math.sin(this.walkPhase)) * (steps ? 2 : run ? 3 : 7);
      rot = Math.sin(this.walkPhase) * (steps ? 0 : run ? 0.015 : 0.035);
    }
    if (st === 'prejump' || st === 'landing') {
      sy *= 0.9;
      sx *= 1.06;
    }
    if (st === 'hurt' && this.t < 10) ox = (Math.random() - 0.5) * 9;
    const flat = this.def.flatPoses; // pose terlempar/terbaring yang sudah digambar miring
    if (st === 'launched') rot = -this.facing * Math.min(this.t * 0.075, flat ? 0.35 : 1.35);
    if (st === 'down' && !flat) {
      rot = -this.facing * Math.PI / 2;
      const f = this.frames[this.pose];
      oy = -f.ax * f.w * this.S;
    }
    if (this.jutsu && this.jutsu.offsetY) oy += this.jutsu.offsetY;

    sp.setPosition(this.x + ox, this.y + oy);
    sp.setFlipX((this.facing < 0) !== !!this.spinFlip);
    sp.setScale(sx, sy);
    sp.setRotation(rot);
    sp.setDepth(st === 'attack' || st === 'jutsu' ? 22 : 20 + this.side * 0.5);
    const fl = time - this.flashAt;
    if (this.flashHard && fl < 60) sp.setTintFill(0xffffff);
    else if (fl < 170) sp.setTint(0xff8a8a);
    else if (this.tintOverride) sp.setTint(this.tintOverride);
    else if (this.baseTint) sp.setTint(this.baseTint);
    else sp.clearTint();

    const h = this.ground - this.y;
    const ss = Math.max(0.35, 1 - h / 420);
    this.shadow.setPosition(this.x, this.ground + 2).setScale(ss * 1.1, ss).setAlpha(ss);

    const guarding = st === 'guard' || st === 'blockstun';
    this.shield.setVisible(guarding);
    if (guarding) {
      const p = this.at(62, 150);
      const pulse = st === 'blockstun' ? 1.12 : 1 + Math.sin(time / 90) * 0.03;
      this.shield.setPosition(p.x, p.y).setScale(0.55 * pulse, 1.45 * pulse).setAlpha(st === 'blockstun' ? 0.95 : 0.55);
    }
  }

  // Bayangan sesaat dari pose sekarang (efek gerak cepat).
  afterimage(tint, alpha, ms, dx) {
    const sp = this.sprite;
    const g = this.scene.add.image(sp.x + (dx || 0), sp.y, sp.texture.key, sp.frame.name)
      .setOrigin(sp.originX, sp.originY).setFlipX(sp.flipX).setScale(sp.scaleX, sp.scaleY)
      .setRotation(sp.rotation).setDepth(sp.depth - 1).setTintFill(tint).setAlpha(alpha || 0.5);
    this.scene.tweens.add({ targets: g, alpha: 0, duration: ms || 220, onComplete: () => g.destroy() });
    return g;
  }

  destroy() {
    this.cancelJutsu();
    this.sprite.destroy();
    this.shadow.destroy();
    this.shield.destroy();
  }
}
