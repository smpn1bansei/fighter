// =====================================================================
// KECERDASAN BUATAN (CPU)
// AI "menekan tombol" lewat Controller yang sama dengan pemain, sehingga
// tunduk pada aturan yang sama. Tingkat kesulitan mengatur reaksi & taktik.
// =====================================================================
class AIController extends Controller {
  constructor(scene, level) {
    super();
    this.scene = scene;
    this.lv = CFG.DIFFICULTY[level] || CFG.DIFFICULTY[1];
    this.plan = null;      // rencana gerak: { hold: {...}, frames }
    this.think = 30;       // jeda sebelum keputusan berikutnya
    this.seenAttack = null;
    this.seenShots = new WeakSet();
    this.guardFor = 0;
  }

  bind(me) { this.me = me; }

  poll() {
    this.tick();
    this.h = {};
    const me = this.me, op = me.opp, sc = this.scene, lv = this.lv;
    if (!me || sc.inputLocked || me.ko) return;

    const dx = op.x - me.x;
    const dist = Math.abs(dx);
    const toward = dx > 0 ? 'right' : 'left';
    const away = dx > 0 ? 'left' : 'right';

    // Lanjutkan kombo bila sedang menyerang
    if (me.state === 'attack' && me.move && me.move.next && me.t >= me.move.startup && !me.queued) {
      if (me.hasHit ? Math.random() < lv.combo : Math.random() < 0.08) this.press('punch');
      if (me.hasHit && me.chakra >= me.def.jurus.cost && Math.random() < lv.jutsu * 0.05) this.press('jurus');
    }

    // Bertahan sementara
    if (this.guardFor > 0) {
      this.guardFor--;
      this.h.guard = true;
      return;
    }

    // Reaksi terhadap serangan lawan (sekali per serangan)
    // Serangan di udara saat melompat ke arah lawan
    if (me.state === 'jump' && !me.airUsed && dist < 190 && me.vy > -6 && Math.random() < lv.aggression * 0.25) {
      this.press(Math.random() < 0.5 ? 'kick' : 'punch');
    }

    if (op.state === 'attack' && op.move && this.seenAttack !== op.actionId) {
      this.seenAttack = op.actionId;
      const reach = op.move.box[0] + op.move.box[2] / 2 + 70;
      if (dist < reach + 40 && me.isNeutral() && Math.random() < lv.block) {
        this.guardFor = op.move.startup + op.move.active + 6;
        this.h.guard = true;
        return;
      }
    }
    if (op.state === 'jutsu' && this.seenAttack !== op.actionId && me.isNeutral()) {
      this.seenAttack = op.actionId;
      if (Math.random() < lv.block * 0.8 && dist < 420) {
        this.guardFor = 30;
        this.h.guard = true;
        return;
      }
    }

    // Hindari proyektil
    for (const a of sc.actors) {
      if (a.dead || a.owner === me || this.seenShots.has(a)) continue;
      const adx = me.x - a.x;
      const coming = a.vx ? Math.sign(a.vx) === Math.sign(adx) : true;
      if (!coming || Math.abs(adx) > 330) continue;
      this.seenShots.add(a);
      if (Math.random() < lv.dodge && me.isNeutral()) {
        if (a.kind === 'low' && Math.random() < 0.6) {
          this.plan = { hold: { up: true, [away]: Math.random() < 0.3 }, frames: 6 };
        } else if (a.kind === 'pillar') {
          this.plan = { hold: { [away]: true }, frames: 34 };
        } else {
          this.guardFor = 40;
          this.h.guard = true;
          return;
        }
      }
    }

    // Jalankan rencana gerak yang sedang berlangsung
    if (this.plan) {
      Object.assign(this.h, this.plan.hold);
      if (--this.plan.frames <= 0) this.plan = null;
      return;
    }

    if (--this.think > 0) return;
    this.think = lv.reaction + Phaser.Math.Between(0, lv.reaction);
    if (!me.isNeutral()) return;

    const r = Math.random();
    const j = me.def.jurus, u = me.def.ulti;
    const canJ = me.chakra >= j.cost, canU = me.chakra >= u.cost;
    const opDown = op.state === 'down' || op.state === 'getup' || op.state === 'launched';

    // Jurus pamungkas
    if (canU && !opDown && Math.random() < lv.jutsu) {
      if (dist <= (u.range || 520)) { this.press('ulti'); return; }
    }

    if (opDown) {
      // lawan jatuh: isi cakra atau ambil posisi
      if (me.chakra < CFG.MAX_CHAKRA && r < 0.6) this.plan = { hold: { charge: true }, frames: 30 };
      else this.plan = { hold: { [toward]: dist > 200 }, frames: 15 };
      return;
    }

    // Karakter dengan serangan jarak jauh (angin sabit) menyerang dari jauh
    if (me.def.ranged && dist > 180 && dist < CFG.W * (me.def.rangedReach || 0.47) && r < lv.aggression * 0.75) {
      this.press(Math.random() < 0.6 ? 'punch' : 'kick');
      return;
    }

    // Mas Tio: meluncur kilat mendekati lawan
    if (me.def.flashMove && dist > 340 && r < 0.45) {
      this.press(toward);
      return;
    }

    if (dist > 380) {
      if (canJ && dist <= (j.range || 400) && r < lv.jutsu) this.press('jurus');
      else if (me.chakra < CFG.MAX_CHAKRA && r < 0.25) this.plan = { hold: { charge: true }, frames: 25 + Phaser.Math.Between(0, 25) };
      else this.plan = { hold: { [toward]: true }, frames: 18 + Phaser.Math.Between(0, 20) };
    } else if (dist > 200) {
      if (canJ && dist <= (j.range || 400) && r < lv.jutsu * 0.6) this.press('jurus');
      else if (r < 0.15 * lv.aggression + 0.05) this.plan = { hold: { up: true, [toward]: true }, frames: 6, air: true };
      else if (r < 0.8) this.plan = { hold: { [toward]: true }, frames: 10 + Phaser.Math.Between(0, 12) };
      else this.plan = { hold: { [away]: true }, frames: 12 };
    } else {
      if (r < lv.aggression) {
        if (canJ && j.close && Math.random() < lv.jutsu * 0.5) this.press('jurus');
        else if (Math.random() < 0.65) this.press('punch');
        else this.press('kick');
      } else if (r < lv.aggression + 0.15) {
        this.plan = { hold: { [away]: true }, frames: 14 };
      } else if (r < lv.aggression + 0.25) {
        this.plan = { hold: { guard: true }, frames: 20 };
      } else {
        this.plan = { hold: { [toward]: true }, frames: 8 };
      }
    }
  }
}
