// =====================================================================
//  RENDERER — 2.5D (Front-3/4) графіка у стилі Clash Royale
//  - Об'ємні 2.5D квадратні вежі з фасадом, колонами, вікнами та дахом
//  - Персонажі у повний зріст під кутом ¾ (ноги, тулуб, обличчя, зброя)
//  - Нові моделі: Підпалювач, Вертоліт, Бульдозер, Круп'є, Дробовик, Лімузин
//  - Нові VFX: Сльозогінний газ, аура Вендети (+40%), вогнемет, карти-бумеранги
// =====================================================================
import { ARENA, CARD_MAP, TOWER_MAP, JUICE } from './data.js';
import { Audio } from './audio.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rnd = (a, b) => a + Math.random() * (b - a);

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tile = 24;
    this.ox = 0;
    this.oy = 0;
    this.dpr = 1;
    this.shake = { t: 0, maxT: 0.25, amp: 0 };
    this.particles = [];
    this.floatTexts = [];
    this.tracers = [];
    this.tracks = [];
    this.rings = [];
    this.cardsFly = [];
    this.banner = null;
    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement
      ? this.canvas.parentElement.getBoundingClientRect()
      : { width: 390, height: 700 };
    const w = Math.max(240, rect.width || 390);
    const h = Math.max(360, rect.height || 700);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.w = w;
    this.h = h;
    const padX = 2, padY = 2;
    this.tile = Math.min((w - padX * 2) / ARENA.W, (h - padY * 2) / ARENA.H);
    this.ox = (w - ARENA.W * this.tile) / 2;
    this.oy = (h - ARENA.H * this.tile) / 2;
  }

  toScreen(x, y) {
    return { x: this.ox + x * this.tile, y: this.oy + y * this.tile };
  }

  toTile(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return {
      x: (sx - this.ox) / this.tile,
      y: (sy - this.oy) / this.tile,
    };
  }

  reset() {
    this.particles = [];
    this.floatTexts = [];
    this.tracers = [];
    this.tracks = [];
    this.rings = [];
    this.cardsFly = [];
    this.shake = { t: 0, maxT: 0.25, amp: 0 };
    this.banner = null;
  }

  triggerShake(amp, time) {
    if (amp >= this.shake.amp || this.shake.t <= 0) {
      this.shake = { t: time, maxT: time, amp };
    }
  }

  addFloatText(x, y, text, color = '#ef4444', big = false) {
    this.floatTexts.push({
      x: x + rnd(-0.25, 0.25),
      y: y - 0.5,
      text, color, big, t: 0, dur: JUICE.floatTextTime,
    });
  }

  consumeEvents(game) {
    for (const ev of game.events) {
      switch (ev.type) {
        case 'play':
          if (ev.side === 'P') Audio.play('coin');
          break;
        case 'deploy':
          Audio.play('deploy');
          if (['unit_armored_van', 'unit_biker', 'unit_bulldozer', 'unit_limo'].includes(ev.cardId)) Audio.play('engine');
          this.rings.push({ x: ev.x, y: ev.y, r0: 0.2, r1: 1.4, t: 0, dur: 0.35, color: ev.side === 'P' ? '#00E5FF' : '#FF1744' });
          break;
        case 'shot': {
          const s = ev.shot || 'pistol';
          if (s === 'tommy') Audio.play('tommy');
          else if (s === 'sniper' || s === 'rifle') Audio.play('sniper');
          else if (s === 'mg') Audio.play('mg');
          else if (s === 'paper') Audio.play('paper');
          else Audio.play('pistol');
          if (!ev.noTracer) {
            this.tracers.push({
              x0: ev.x, y0: ev.y - (ev.flying ? 1.1 : 0.3), x1: ev.tx, y1: ev.ty - 0.2,
              t: 0, dur: s === 'sniper' ? 0.14 : 0.08,
              color: s === 'sniper' ? '#fef08a' : '#fde047',
              w: s === 'sniper' ? 2.6 : 1.7,
            });
          }
          const ang = Math.atan2(ev.ty - ev.y, ev.tx - ev.x);
          this.particles.push({
            kind: 'muzzle',
            x: ev.x + Math.cos(ang) * 0.45,
            y: ev.y + Math.sin(ang) * 0.45 - (ev.flying ? 1.1 : 0.35),
            ang, t: 0, dur: 0.07,
          });
          break;
        }
        case 'flame': {
          Audio.play('fire');
          const dx = ev.x1 - ev.x0, dy = ev.y1 - ev.y0;
          for (let i = 0; i < 12; i++) {
            const k = (i + 1) / 12;
            this.particles.push({
              kind: 'fire',
              x: ev.x0 + dx * k + rnd(-0.35, 0.35),
              y: ev.y0 + dy * k + rnd(-0.35, 0.35) - 0.25,
              vx: dx * 0.6 + rnd(-0.6, 0.6),
              vy: dy * 0.6 + rnd(-0.6, 0.6),
              r: rnd(0.22, 0.44), t: 0, dur: rnd(0.2, 0.38),
              color: i % 2 === 0 ? '#fde047' : '#f97316',
            });
          }
          break;
        }
        case 'cardThrow':
          Audio.play('paper');
          this.cardsFly.push({ x0: ev.x0, y0: ev.y0, x1: ev.x1, y1: ev.y1, t: 0, dur: 0.32 });
          break;
        case 'teargas':
          Audio.play('glass');
          this.rings.push({ x: ev.x, y: ev.y, r0: 0.2, r1: ev.r, t: 0, dur: 0.45, color: '#84cc16' });
          break;
        case 'vendetta':
          Audio.play('crown');
          this.rings.push({ x: ev.x, y: ev.y, r0: 0.2, r1: ev.r, t: 0, dur: 0.45, color: '#dc2626' });
          break;
        case 'melee': {
          Audio.play(ev.dog ? 'bite' : 'melee');
          const ang = Math.atan2(ev.ty - ev.y, ev.tx - ev.x);
          this.particles.push({
            kind: 'slash',
            x: ev.x + Math.cos(ang) * 0.45,
            y: ev.y + Math.sin(ang) * 0.45 - 0.25,
            ang, t: 0, dur: 0.15,
          });
          break;
        }
        case 'dmg':
          this.addFloatText(ev.x, ev.y, `-${ev.amount}`, ev.shield ? '#38BDF8' : '#ff4d4d', ev.amount >= 200);
          break;
        case 'heal':
          Audio.play('heal');
          this.addFloatText(ev.x, ev.y, `+${ev.amount}`, '#22c55e', false);
          for (let i = 0; i < 3; i++) {
            this.particles.push({
              kind: 'plus', x: ev.x + rnd(-0.3, 0.3), y: ev.y + rnd(-0.2, 0.2) - 0.3,
              vx: 0, vy: -1.1, t: 0, dur: 0.55, color: '#4ade80',
            });
          }
          break;
        case 'healPulse':
          this.rings.push({ x: ev.x, y: ev.y, r0: 0.3, r1: ev.r, t: 0, dur: 0.45, color: 'rgba(74,222,128,0.75)' });
          break;
        case 'shieldBreak':
          Audio.play('shield');
          this.addFloatText(ev.x, ev.y - 0.3, 'ЩИТ!', '#38BDF8', false);
          for (let i = 0; i < 8; i++) {
            const a = rnd(0, Math.PI * 2), sp = rnd(1.5, 3.5);
            this.particles.push({ kind: 'shard', x: ev.x, y: ev.y - 0.3, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dur: 0.35, color: '#38BDF8' });
          }
          break;
        case 'stun':
          this.rings.push({ x: ev.x, y: ev.y, r0: 0.1, r1: 0.9, t: 0, dur: 0.25, color: '#facc15' });
          break;
        case 'molotov':
          Audio.play('glass');
          Audio.play('explosion');
          Audio.play('fire');
          this.triggerShake(JUICE.shakeSmall.amp, JUICE.shakeSmall.time);
          this._spawnExplosionFX(ev.x, ev.y, ev.r, '#f97316');
          break;
        case 'bribe':
          Audio.play('coin');
          Audio.play('freeze');
          this.rings.push({ x: ev.x, y: ev.y, r0: 0.2, r1: ev.r, t: 0, dur: 0.45, color: '#22c55e' });
          for (let i = 0; i < 18; i++) {
            this.particles.push({
              kind: 'bill',
              x: ev.x + rnd(-ev.r * 0.85, ev.r * 0.85),
              y: ev.y + rnd(-ev.r * 0.85, ev.r * 0.85) - rnd(1.2, 2.6),
              vy: rnd(0.9, 1.7), vx: rnd(-0.4, 0.4),
              rot: rnd(0, Math.PI * 2), vrot: rnd(-4, 4),
              t: 0, dur: rnd(1.4, 2.4),
            });
          }
          break;
        case 'sniperShot':
          Audio.play('sniper');
          this.triggerShake(JUICE.shakeSmall.amp, 0.18);
          this.tracers.push({ x0: ev.x - 3, y0: ev.y - 9, x1: ev.x, y1: ev.y, t: 0, dur: 0.22, color: '#ef4444', w: 3.5 });
          this.rings.push({ x: ev.x, y: ev.y, r0: 0.1, r1: ev.r, t: 0, dur: 0.3, color: '#ef4444' });
          this._spawnExplosionFX(ev.x, ev.y, ev.r * 0.8, '#fde047', 10);
          break;
        case 'explosion':
        case 'vanCrash':
          Audio.play('explosion');
          this.triggerShake(JUICE.shakeSmall.amp, JUICE.shakeSmall.time);
          this._spawnExplosionFX(ev.x, ev.y, ev.r || 1.8, '#f97316');
          break;
        case 'towerDown':
          Audio.play('explosion', { big: true });
          Audio.play('crown');
          this.triggerShake(JUICE.shakeBig.amp, JUICE.shakeBig.time);
          this._spawnExplosionFX(ev.x, ev.y, (ev.r || 1.6) * 1.4, '#fb923c', 26);
          break;
        case 'bankBonus':
          Audio.play('coin');
          this.addFloatText(ev.x, ev.y - 0.8, `+${ev.amount}$`, '#facc15', true);
          break;
        case 'phase2':
          Audio.play('coin');
          this.banner = { text: 'ПРИСКОРЕННЯ ГОТІВКИ x1.35', sub: 'Друга хвилина — темп зростає!', t: 0, dur: 2.3, color: '#38bdf8' };
          break;
        case 'overtime':
          Audio.play('siren');
          Audio.setTempoMult(1.22);
          this.banner = { text: 'ОБЛАВА! x2 ГОТІВКА', sub: 'Третя хвилина — подвійний прибуток!', t: 0, dur: 3.0, color: '#f59e0b' };
          break;
        case 'extraTime':
          Audio.play('siren');
          Audio.setTempoMult(1.4);
          this.banner = { text: 'ДОДАТКОВИЙ ЧАС! x3 ГОТІВКА', sub: 'Раптова смерть — перша знесена вежа виграє!', t: 0, dur: 3.4, color: '#ef4444' };
          break;
        case 'spawnerPop':
          this.rings.push({ x: ev.x, y: ev.y, r0: 0.3, r1: 1.4, t: 0, dur: 0.35, color: '#f43f5e' });
          break;
        case 'death':
          for (let i = 0; i < 8; i++) {
            const a = rnd(0, Math.PI * 2), sp = rnd(0.8, 2.5);
            this.particles.push({
              kind: 'puff', x: ev.x, y: ev.y - 0.25,
              vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
              r: rnd(0.15, 0.32), t: 0, dur: 0.38,
              color: ev.side === 'P' ? '#38bdf8' : '#fb7185',
            });
          }
          break;
      }
    }
    game.events.length = 0;
  }

  _spawnExplosionFX(x, y, r, color = '#f97316', count = 16) {
    this.rings.push({ x, y, r0: 0.15, r1: r, t: 0, dur: 0.32, color });
    for (let i = 0; i < count; i++) {
      const a = rnd(0, Math.PI * 2), sp = rnd(1.0, r * 2.3);
      this.particles.push({
        kind: 'fire', x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: rnd(0.2, 0.45), t: 0, dur: rnd(0.25, 0.55),
        color: i % 2 === 0 ? '#fde047' : color,
      });
    }
  }

  updateFX(game, dt) {
    if (this.shake.t > 0) this.shake.t = Math.max(0, this.shake.t - dt);
    if (this.banner) {
      this.banner.t += dt;
      if (this.banner.t >= this.banner.dur) this.banner = null;
    }

    for (const e of game.entities) {
      if (e.alive && e.vehicle && e.moving && Math.random() < dt * 16) {
        this.tracks.push({ x: e.x, y: e.y, ang: e.angle, r: e.r * 0.65, t: 0, dur: 2.0 });
      }
      if (e.alive && !e.flying && e.moving && e.speed >= 2.0 && Math.random() < dt * 6) {
        this.particles.push({
          kind: 'dust',
          x: e.x + rnd(-0.2, 0.2), y: e.y + 0.15,
          vx: rnd(-0.2, 0.2), vy: rnd(-0.2, 0.2),
          r: rnd(0.1, 0.18), t: 0, dur: 0.32,
        });
      }
      if (e.alive && e.kind === 'tower' && e.hp < e.maxHp * 0.5 && Math.random() < dt * 7) {
        this.particles.push({
          kind: 'smoke',
          x: e.x + rnd(-e.r * 0.4, e.r * 0.4),
          y: e.y - 0.8 + rnd(-0.2, 0.2),
          vx: rnd(-0.3, 0.3), vy: rnd(-1.2, -0.6),
          r: rnd(0.22, 0.45), t: 0, dur: rnd(0.7, 1.3),
        });
      }
    }

    const stepList = list => {
      for (const it of list) {
        it.t += dt;
        if (it.vx) it.x += it.vx * dt;
        if (it.vy) it.y += it.vy * dt;
        if (it.vrot) it.rot += it.vrot * dt;
      }
      return list.filter(it => it.t < it.dur);
    };
    this.particles = stepList(this.particles);
    this.floatTexts = stepList(this.floatTexts);
    this.tracers = stepList(this.tracers);
    this.tracks = stepList(this.tracks);
    this.rings = stepList(this.rings);
    this.cardsFly = stepList(this.cardsFly);
  }

  // ------------------------------------------------------------------
  //  Головний кадр рендеру
  // ------------------------------------------------------------------
  render(game, aim = null, inspectedEntityId = null) {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    if (this.shake.t > 0) {
      const k = this.shake.t / this.shake.maxT;
      const a = this.shake.amp * k;
      ctx.translate(rnd(-a, a), rnd(-a, a));
    }

    this._drawArena(ctx, game);
    this._drawTracks(ctx);
    this._drawAreas(ctx, game);

    if (inspectedEntityId != null) {
      const ent = game.entities.find(e => e.id === inspectedEntityId && e.alive);
      if (ent && ent.range > 0) this._drawInspectedRange(ctx, ent);
    }

    if (aim && aim.cardId) this._drawAimZone(ctx, game, aim);

    const sorted = [...game.entities].sort((a, b) => {
      if (a.flying !== b.flying) return a.flying ? 1 : -1;
      return a.y - b.y;
    });

    for (const e of sorted) {
      if (!e.alive || e.deployT > 0) continue;
      if (e.special === 'BUFF_ATK_SPEED_20') {
        this._drawAuraCircle(ctx, e.x, e.y, CARD_MAP.unit_don.buffRadius, 'rgba(245, 158, 11, 0.16)', '#f59e0b');
      } else if (e.special === 'HEAL_AURA_65') {
        this._drawAuraCircle(ctx, e.x, e.y, CARD_MAP.unit_medic.healRadius, 'rgba(34, 197, 94, 0.13)', '#22c55e');
      }
    }

    for (const e of sorted) {
      if (e.kind === 'tower') this._drawTower25D(ctx, e, game);
      else if (e.kind === 'building') this._drawBuilding25D(ctx, e, game);
      else if (e.alive) this._drawUnit25D(ctx, e, game);
    }

    this._drawProjectiles(ctx, game);
    this._drawFlyingCards(ctx);
    this._drawPendingSpells(ctx, game);
    this._drawTracers(ctx);
    this._drawRings(ctx);
    this._drawParticles(ctx);

    if (aim && aim.cardId && aim.inArena) this._drawAimCursor(ctx, game, aim);

    this._drawFloatTexts(ctx);
    if (game.extraTime) this._drawExtraTimeVignette(ctx, game.time);
    if (this.banner) this._drawBanner(ctx);

    ctx.restore();
  }

  _drawInspectedRange(ctx, ent) {
    const p = this.toScreen(ent.x, ent.y);
    const r = (ent.range + ent.r) * this.tile;
    const isP = ent.side === 'P';
    ctx.save();
    ctx.fillStyle = isP ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 23, 68, 0.12)';
    ctx.strokeStyle = isP ? '#00E5FF' : '#FF1744';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawExtraTimeVignette(ctx, time) {
    const pulse = 0.22 + (Math.sin(time * 6) * 0.5 + 0.5) * 0.22;
    const g = ctx.createRadialGradient(
      this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.34,
      this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.68
    );
    g.addColorStop(0, 'rgba(220, 38, 38, 0)');
    g.addColorStop(1, `rgba(220, 38, 38, ${pulse.toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  // ------------------------------------------------------------------
  //  Арена 18x32 тайли + канал + 2 мости + підсвітка зони за Головною вежею
  // ------------------------------------------------------------------
  _drawArena(ctx, game) {
    const ar = game.arena;
    const T = this.tile;
    const W = ARENA.W * T, H = ARENA.H * T;

    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.save();
    ctx.translate(this.ox, this.oy);

    ctx.fillStyle = ar.bg || '#2C2E35';
    ctx.fillRect(0, 0, W, H);

    // М'який 2.5D градієнт освітлення зверху вниз
    const lg = ctx.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, 'rgba(0,0,0,0.22)');
    lg.addColorStop(0.5, 'rgba(255,255,255,0.03)');
    lg.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < ARENA.H; y++) {
      for (let x = 0; x < ARENA.W; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.028)';
          ctx.fillRect(x * T, y * T, T, T);
        }
      }
    }

    // Дороги від мостів до веж
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (const b of ARENA.bridges) {
      const bx = (b.cx - 1.15) * T, bw = 2.3 * T;
      ctx.fillRect(bx, 4.5 * T, bw, (ARENA.H - 9) * T);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.24)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([T * 0.45, T * 0.45]);
      ctx.beginPath();
      ctx.moveTo(b.cx * T, 5 * T);
      ctx.lineTo(b.cx * T, (ARENA.H - 5) * T);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(3.5 * T, 4.2 * T, 11 * T, 1.4 * T);
    ctx.fillRect(3.5 * T, (ARENA.H - 5.6) * T, 11 * T, 1.4 * T);

    // Канал посередині
    const ry = ARENA.riverY0 * T, rh = (ARENA.riverY1 - ARENA.riverY0) * T;
    const grad = ctx.createLinearGradient(0, ry, 0, ry + rh);
    grad.addColorStop(0, '#071019');
    grad.addColorStop(0.5, '#10293e');
    grad.addColorStop(1, '#071019');
    ctx.fillStyle = grad;
    ctx.fillRect(0, ry, W, rh);

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.18)';
    ctx.lineWidth = 1.2;
    const waveShift = (game.time * 18) % T;
    for (let i = 0; i < ARENA.W; i += 2) {
      const wx = i * T + waveShift * 0.4;
      ctx.beginPath();
      ctx.moveTo(wx, ry + rh * 0.35); ctx.lineTo(wx + T * 0.8, ry + rh * 0.35);
      ctx.moveTo(wx + T * 0.4, ry + rh * 0.7); ctx.lineTo(wx + T * 1.1, ry + rh * 0.7);
      ctx.stroke();
    }
    ctx.fillStyle = '#181a20';
    ctx.fillRect(0, ry - 2, W, 3);
    ctx.fillRect(0, ry + rh - 1, W, 3);

    // 2 Мости
    for (const b of ARENA.bridges) {
      const x0 = b.x0 * T, bw = (b.x1 - b.x0) * T;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x0 - 2, ry - 2, bw + 4, rh + 8);
      ctx.fillStyle = ar.bridge || '#4A4E58';
      ctx.fillRect(x0, ry - 3, bw, rh + 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.2;
      for (let py = ry; py <= ry + rh; py += T * 0.4) {
        ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x0 + bw, py); ctx.stroke();
      }
      ctx.fillStyle = '#1f242d';
      ctx.fillRect(x0 - 2, ry - 4, 4, rh + 8);
      ctx.fillRect(x0 + bw - 2, ry - 4, 4, rh + 8);
    }

    this._drawProps(ctx, T, game.time, ar);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, W, H);
    ctx.restore();
  }

  _drawProps(ctx, T, time, ar) {
    const lamps = [
      [1.2, 14.3], [5.8, 14.3], [12.2, 14.3], [16.8, 14.3],
      [1.2, 17.7], [5.8, 17.7], [12.2, 17.7], [16.8, 17.7],
    ];
    let glowColor = 'rgba(251,191,36,0.15)';
    if (ar.weather === 'neon_red' || ar.weather === 'velvet_red') glowColor = 'rgba(239,68,68,0.22)';
    else if (ar.weather === 'neon_blue' || ar.weather === 'wind_clouds') glowColor = 'rgba(56,189,248,0.22)';
    else if (ar.weather === 'green_glow') glowColor = 'rgba(34,197,94,0.22)';
    else if (ar.weather === 'casino_sparkle' || ar.weather === 'gold_dust' || ar.weather === 'gold_vault') glowColor = 'rgba(250,204,21,0.24)';
    else if (ar.weather === 'conclave_legendary') glowColor = 'rgba(168,85,247,0.25)';

    for (const [lx, ly] of lamps) {
      const x = lx * T, y = ly * T;
      const g = ctx.createRadialGradient(x, y, 1, x, y, T * 1.5);
      g.addColorStop(0, glowColor); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, T * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
    }

    // Поліцейські мигалки для арени 16 (SWAT)
    if (ar.weather === 'police_flashing') {
      const flashRed = Math.sin(time * 12) > 0;
      ctx.fillStyle = flashRed ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)';
      ctx.fillRect(0, 0, ARENA.W * T, ARENA.H * T);
    }

    // Дощ для арен Доків (арени 2, 12, 19)
    if (ar.weather === 'rain' || ar.weather === 'heavy_rain') {
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.28)';
      ctx.lineWidth = 1.2;
      const count = ar.weather === 'heavy_rain' ? 36 : 20;
      for (let i = 0; i < count; i++) {
        const rx = ((i * 37 + time * 180) % (ARENA.W * T));
        const ry = ((i * 59 + time * 380) % (ARENA.H * T));
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 3, ry + 10);
        ctx.stroke();
      }
    }

    // Золоті іскри для казино, банку та конклаву
    if (ar.weather === 'casino_sparkle' || ar.weather === 'gold_dust' || ar.weather === 'conclave_legendary') {
      const isConclave = ar.weather === 'conclave_legendary';
      for (let i = 0; i < 16; i++) {
        const sx = ((i * 53 + Math.sin(time + i) * 20) % (ARENA.W * T));
        const sy = (ARENA.H * T) - ((i * 71 + time * 40) % (ARENA.H * T));
        const sz = 1.2 + (i % 3) * 0.7;
        ctx.fillStyle = isConclave ? (i % 2 === 0 ? '#fde047' : '#c084fc') : '#fde047';
        ctx.beginPath();
        ctx.arc(sx, sy, sz, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const barrels = [[0.7, 9.5], [17.3, 9.5], [0.7, 22.5], [17.3, 22.5]];
    const flick = 0.85 + Math.sin(time * 11) * 0.15;
    for (const [bx, by] of barrels) {
      const x = bx * T, y = by * T;
      ctx.fillStyle = '#44403c';
      ctx.beginPath(); ctx.arc(x, y, T * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.arc(x, y - 2, T * 0.22 * flick, 0, Math.PI * 2); ctx.fill();
    }
  }

  _drawAuraCircle(ctx, tx, ty, radius, fill, stroke) {
    const p = this.toScreen(tx, ty);
    const r = radius * this.tile;
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r, r * 0.88, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawAimZone(ctx, game, aim) {
    const def = CARD_MAP[aim.cardId];
    if (!def) return;
    const T = this.tile;
    ctx.save();
    ctx.translate(this.ox, this.oy);

    if (def.kind !== 'spell') {
      ctx.fillStyle = JUICE.forbidden;
      const pocket = game.sides.P.pocket;
      const pDepth = ARENA.pocketDepth;

      if (def.kind === 'building') {
        ctx.fillRect(0, 0, ARENA.W * T, ARENA.riverY1 * T);
      } else {
        const topH = (ARENA.riverY0 - pDepth) * T;
        ctx.fillRect(0, 0, ARENA.W * T, topH);
        if (!pocket.L) ctx.fillRect(0, topH, (ARENA.W / 2) * T, pDepth * T);
        if (!pocket.R) ctx.fillRect((ARENA.W / 2) * T, topH, (ARENA.W / 2) * T, pDepth * T);
        ctx.fillRect(0, ARENA.riverY0 * T, ARENA.W * T, (ARENA.riverY1 - ARENA.riverY0) * T);
      }

      ctx.strokeStyle = 'rgba(34, 197, 94, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(2, ARENA.riverY1 * T + 2, ARENA.W * T - 4, (ARENA.H - ARENA.riverY1) * T - 4);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  _drawAimCursor(ctx, game, aim) {
    const def = CARD_MAP[aim.cardId];
    if (!def) return;
    const okZone = game.canDeployAt('P', aim.cardId, aim.x, aim.y);
    const hasCash = game.sides.P.cash >= def.cost;
    const ok = okZone && hasCash;
    const p = this.toScreen(aim.x, aim.y);
    const radiusTiles = def.kind === 'spell' ? (def.splash || 2)
      : def.range >= 2 ? def.range
      : (def.healRadius || def.buffRadius || 1.15);
    const r = radiusTiles * this.tile;

    ctx.save();
    ctx.fillStyle = ok ? 'rgba(0, 229, 255, 0.14)' : okZone ? 'rgba(245, 158, 11, 0.16)' : 'rgba(239, 68, 68, 0.22)';
    ctx.strokeStyle = ok ? '#00E5FF' : okZone ? '#f59e0b' : '#ef4444';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const bodyR = (def.size || 0.5) * this.tile;
    ctx.fillStyle = ok ? 'rgba(0, 229, 255, 0.45)' : okZone ? 'rgba(245, 158, 11, 0.45)' : 'rgba(239, 68, 68, 0.45)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(8, bodyR), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!hasCash) {
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';
      const msg = `Потрібно ${def.cost}$`;
      ctx.strokeText(msg, p.x, p.y - Math.max(18, bodyR + 10));
      ctx.fillStyle = '#fde047';
      ctx.fillText(msg, p.x, p.y - Math.max(18, bodyR + 10));
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------
  //  ОБ'ЄМНІ 2.5D КВАДРАТНІ ВЕЖІ (фасад + дах + тінь, як у Clash Royale)
  // ------------------------------------------------------------------
  _drawTower25D(ctx, e, game) {
    const p = this.toScreen(e.x, e.y);
    const r = e.r * this.tile;
    const tDef = TOWER_MAP[e.towerType] || TOWER_MAP.tower_mafia_mansion;
    const look = tDef.look;
    const teamCol = JUICE.teamColor[e.side];
    const sidePx = r * 1.72;
    const wallH = sidePx * 0.46; // 3D-висота передньої стіни будівлі!

    ctx.save();
    ctx.translate(p.x, p.y);

    if (!e.alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.48)';
      ctx.fillRect(-sidePx / 2 - 2, -sidePx / 2 + 4, sidePx + 6, sidePx + 4);
      ctx.fillStyle = '#1f2026';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.fillRect(-sidePx / 2, -sidePx / 2, sidePx, sidePx);
      ctx.strokeRect(-sidePx / 2, -sidePx / 2, sidePx, sidePx);
      ctx.fillStyle = '#3f3f46';
      for (const [dx, dy, sz] of [[-0.28, 0.2, 0.24], [0.22, 0.25, 0.22], [-0.05, -0.15, 0.28], [0.28, -0.2, 0.2]]) {
        ctx.fillRect(dx * sidePx - sz * sidePx / 2, dy * sidePx - sz * sidePx / 2, sz * sidePx, sz * sidePx);
        ctx.strokeRect(dx * sidePx - sz * sidePx / 2, dy * sidePx - sz * sidePx / 2, sz * sidePx, sz * sidePx);
      }
      ctx.restore();
      return;
    }

    // 1) Тінь вежі на землі
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(-sidePx / 2 + 5, -sidePx / 2 + 7, sidePx + 3, sidePx + 3);

    // 2) Квадратний постамент команди на землі
    ctx.fillStyle = '#14171f';
    ctx.strokeStyle = teamCol;
    ctx.lineWidth = 3;
    ctx.fillRect(-sidePx / 2 - 3, -sidePx / 2 - 3, sidePx + 6, sidePx + 6);
    ctx.strokeRect(-sidePx / 2 - 3, -sidePx / 2 - 3, sidePx + 6, sidePx + 6);

    const flash = e.flashT > 0;

    // 3) 3D-фасад (передня вертикальна стіна будівлі)
    ctx.fillStyle = flash ? '#ffffff' : look.wall;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.4;
    ctx.fillRect(-sidePx / 2, sidePx / 2 - wallH, sidePx, wallH);
    ctx.strokeRect(-sidePx / 2, sidePx / 2 - wallH, sidePx, wallH);

    // Вікна та двері на фасаді
    if (!flash) {
      ctx.fillStyle = look.style === 'police' ? '#bae6fd' : '#fde047';
      const wy = sidePx / 2 - wallH * 0.65;
      ctx.fillRect(-sidePx * 0.34, wy, sidePx * 0.16, wallH * 0.32);
      ctx.fillRect(sidePx * 0.18, wy, sidePx * 0.16, wallH * 0.32);
      ctx.fillStyle = '#111';
      ctx.fillRect(-sidePx * 0.1, sidePx / 2 - wallH * 0.55, sidePx * 0.2, wallH * 0.55);
    }

    // 4) Піднятий квадратний дах (зсунутий вгору на -wallH для 3D-об'єму!)
    const roofY = -sidePx / 2 - wallH * 0.62;
    ctx.fillStyle = flash ? '#ffffff' : look.roof;
    ctx.fillRect(-sidePx / 2, roofY, sidePx, sidePx * 0.92);
    ctx.strokeRect(-sidePx / 2, roofY, sidePx, sidePx * 0.92);

    // Внутрішня рамка даху
    ctx.strokeStyle = look.trim;
    ctx.lineWidth = 2;
    ctx.strokeRect(-sidePx * 0.38, roofY + sidePx * 0.1, sidePx * 0.76, sidePx * 0.72);

    const roofCenterY = roofY + sidePx * 0.46;

    if (look.style === 'police') {
      const blink = Math.sin(game.time * 12) > 0;
      ctx.fillStyle = blink ? '#ef4444' : '#3b82f6';
      ctx.fillRect(-7, roofY + 4, 7, 5);
      ctx.fillStyle = blink ? '#3b82f6' : '#ef4444';
      ctx.fillRect(0, roofY + 4, 7, 5);
    } else if (look.style === 'bank') {
      ctx.fillStyle = '#facc15';
      ctx.font = `900 ${Math.round(sidePx * 0.34)}px Impact, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, roofCenterY);
    } else if (look.style === 'casino') {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(0, roofCenterY - 8); ctx.lineTo(7, roofCenterY);
      ctx.lineTo(0, roofCenterY + 8); ctx.lineTo(-7, roofCenterY);
      ctx.closePath(); ctx.fill();
    }

    // 5) Турель або корона сплячого Короля на даху
    if (e.active) {
      ctx.save();
      ctx.translate(0, roofCenterY);
      ctx.rotate(e.angle);
      const recoil = e.attackAnim > 0 ? -3.5 : 0;
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.fillRect(recoil, -3.5, sidePx * 0.48, 7);
      ctx.strokeRect(recoil, -3.5, sidePx * 0.48, 7);
      ctx.restore();
    } else {
      ctx.fillStyle = look.trim;
      ctx.font = `bold ${Math.round(sidePx * 0.4)}px Impact, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('♛', 0, roofCenterY);
    }

    if (e.freeze > 0) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.34)';
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-sidePx / 2 - 3, roofY - 2, sidePx + 6, sidePx + wallH * 0.65);
      ctx.strokeRect(-sidePx / 2 - 3, roofY - 2, sidePx + 6, sidePx + wallH * 0.65);
    }

    this._drawTowerHp(ctx, e, sidePx / 2, roofY - 12);
    ctx.restore();
  }

  _drawTowerHp(ctx, e, halfSide, topY) {
    const bw = Math.max(46, halfSide * 1.75), bh = 8;
    const y = e.side === 'P' ? halfSide + 7 : topY;
    const pct = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    this._roundRect(ctx, -bw / 2 - 1, y - 1, bw + 2, bh + 2, 3);
    ctx.fill();
    ctx.fillStyle = e.side === 'P' ? '#22c55e' : '#ef4444';
    this._roundRect(ctx, -bw / 2, y, bw * pct, bh, 2);
    ctx.fill();

    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#000';
    const txt = `${Math.ceil(e.hp)}`;
    ctx.strokeText(txt, 0, y + bh / 2);
    ctx.fillStyle = '#fff';
    ctx.fillText(txt, 0, y + bh / 2);
  }

  _drawBuilding25D(ctx, e) {
    const p = this.toScreen(e.x, e.y);
    const r = e.r * this.tile;
    const flash = e.flashT > 0;
    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-r * 0.9 + 3, -r * 0.6 + 5, r * 1.8, r * 1.3);
    ctx.strokeStyle = JUICE.teamColor[e.side];
    ctx.lineWidth = 2.2;
    ctx.strokeRect(-r * 0.92, -r * 0.72, r * 1.84, r * 1.44);

    if (e.cardId === 'bldg_barricade') {
      ctx.fillStyle = flash ? '#fff' : '#a8a29e';
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      for (const [dx, dy] of [[-0.48, -0.1], [0, -0.22], [0.48, -0.1], [-0.34, 0.24], [0.34, 0.24]]) {
        ctx.beginPath(); ctx.ellipse(dx * r, dy * r, r * 0.36, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
      ctx.save();
      ctx.translate(0, -r * 0.28);
      ctx.rotate(e.angle);
      const rec = e.attackAnim > 0 ? -3 : 0;
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(rec, -3.5, r * 0.95, 7);
      ctx.strokeRect(rec, -3.5, r * 0.95, 7);
      ctx.restore();
    } else {
      const w = r * 1.56, h = r * 1.1, wallH = r * 0.55;
      ctx.fillStyle = flash ? '#fff' : '#2a080c';
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2.4;
      ctx.fillRect(-w / 2, h / 2 - wallH, w, wallH);
      ctx.strokeRect(-w / 2, h / 2 - wallH, w, wallH);
      ctx.fillStyle = flash ? '#fff' : '#4c0d14';
      ctx.fillRect(-w / 2, -h / 2 - wallH * 0.6, w, h);
      ctx.strokeRect(-w / 2, -h / 2 - wallH * 0.6, w, h);
      ctx.fillStyle = '#111';
      ctx.fillRect(-w * 0.42, -h * 0.22 - wallH * 0.6, w * 0.84, h * 0.45);
      ctx.fillStyle = '#f43f5e';
      ctx.font = `bold ${Math.max(9, Math.round(r * 0.45))}px Impact, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('CLUB', 0, -wallH * 0.6);
    }

    if (e.deployT > 0) this._drawDeployClock(ctx, e, r + 6);
    this._drawSmartHpBar(ctx, e, -r - 14);
    ctx.restore();
  }

  // ------------------------------------------------------------------
  //  2.5D ПЕРСОНАЖІ У ПОВНИЙ ЗРІСТ (Front-3/4 як у Clash Royale)
  // ------------------------------------------------------------------
  _drawUnit25D(ctx, e, game) {
    const p = this.toScreen(e.x, e.y);
    const T = this.tile;
    // Збільшені фігурки юнітів (+55% масштабу, щоб їх було чудово видно на карті)
    const r = Math.max(14, e.r * T * 1.55);
    const look = e.look || { type: 'human', body: '#4b5563', skin: '#e0b48f' };
    const flash = e.flashT > 0;

    ctx.save();
    ctx.translate(p.x, p.y);

    if (e.stealth) {
      ctx.globalAlpha = 0.38;
      ctx.save();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.ellipse(0, 0, r + 5, (r + 5) * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const flyH = e.flying ? ((look.type === 'heli' ? -34 : -26) + Math.sin(game.time * 4 + e.id) * 3) : 0;

    // 1) М'яка тінь на землі
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 2, r * 0.95, r * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2) Кільце команди на землі (перспективний овал)
    ctx.strokeStyle = JUICE.teamColor[e.side];
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 2, r * 0.9, r * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Аури бафів / дебафів
    if (e.vendetta) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 2, r + 4, (r + 4) * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.buffed) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 2, r + 3, (r + 3) * 0.52, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(0, flyH);

    // Анімація випаду в напрямку цілі
    const isMelee = e.range < 2 && !e.vehicle;
    const lunge = (e.attackAnim > 0 && isMelee) ? (e.attackAnim / 0.18) * 6 : 0;
    ctx.translate(Math.cos(e.angle) * lunge, Math.sin(e.angle) * lunge * 0.6);

    if (look.type === 'van') this._drawVan25D(ctx, r, look, flash, e, game.time);
    else if (look.type === 'limo') this._drawLimo25D(ctx, r, look, flash, e, game.time);
    else if (look.type === 'bulldozer') this._drawBulldozer25D(ctx, r, look, flash, e, game.time);
    else if (look.type === 'bike') this._drawBike25D(ctx, r, look, flash, e, game.time);
    else if (look.type === 'drone') this._drawDrone25D(ctx, r, look, flash, game.time);
    else if (look.type === 'heli') this._drawHeli25D(ctx, r, look, flash, game.time);
    else if (look.type === 'dog') this._drawDog25D(ctx, r, look, flash, e);
    else this._drawHuman25D(ctx, r, look, flash, e, game.time);

    ctx.restore();

    // Статуси (Сльозогінний газ, Заморозка, Стан)
    if (e.slowT > 0) {
      ctx.fillStyle = 'rgba(132, 204, 22, 0.3)';
      ctx.beginPath();
      ctx.arc(0, flyH - r * 0.7, r * 0.95, 0, Math.PI * 2);
      ctx.fill();
    }
    if (e.freeze > 0) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, flyH - r * 0.65, r * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (e.stun > 0) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      const a0 = game.time * 8;
      for (let i = 0; i < 3; i++) {
        const a = a0 + i * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * (r * 0.65), flyH - r * 1.9 + Math.sin(a) * 3, 2.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const headTopY = flyH - (e.vehicle ? r * 1.45 : e.flying ? r * 1.3 : r * 2.15);
    if (e.deployT > 0) this._drawDeployClock(ctx, e, Math.abs(headTopY) - 6);
    this._drawSmartHpBar(ctx, e, headTopY - 4);

    ctx.restore();
  }

  // ---- Повноростова 2.5D фігурка людини (під кутом ¾ як у Clash Royale) ----
  _drawHuman25D(ctx, r, look, flash, e, time) {
    const sc = look.scale || 1;
    const R = r * sc;
    const facingDown = Math.sin(e.angle) >= -0.15; // вороги зазвичай йдуть обличчям до нас
    const faceDirX = Math.cos(e.angle) >= 0 ? 1 : -1;

    // Кроки + легке підстрибування при ходьбі або дихання в спокої
    const ph = e.moving ? e.walkT * e.speed * 7.5 : 0;
    const hop = e.moving ? Math.abs(Math.sin(ph)) * 2.5 : Math.sin(time * 3.5 + e.id) * 0.8;
    const tilt = e.moving ? Math.sin(ph) * 0.08 : 0;
    const legL = e.moving ? Math.sin(ph) * 3.2 : 0;
    const legR = -legL;

    ctx.save();
    ctx.translate(0, -hop);
    ctx.rotate(tilt);

    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.8;

    // 1) Дві ноги + черевики
    ctx.fillStyle = '#18181b';
    this._roundRect(ctx, -R * 0.42, -R * 0.35 + legL, R * 0.34, R * 0.48, 2);
    ctx.fill(); ctx.stroke();
    this._roundRect(ctx, R * 0.08, -R * 0.35 + legR, R * 0.34, R * 0.48, 2);
    ctx.fill(); ctx.stroke();

    // 2) Балон за спиною Підпалювача
    if (look.tank) {
      ctx.fillStyle = look.tank;
      this._roundRect(ctx, -R * 0.56, -R * 1.15, R * 0.34, R * 0.65, 4);
      ctx.fill(); ctx.stroke();
    }

    // 3) Тулуб (костюм / плащ / халат)
    const bodyW = R * 1.16, bodyH = R * 0.92;
    ctx.fillStyle = flash ? '#ffffff' : (look.body || '#374151');
    this._roundRect(ctx, -bodyW / 2, -R * 1.18, bodyW, bodyH, 5);
    ctx.fill(); ctx.stroke();

    // Деталі на костюмі (краватка, хрест, троянда, смужки)
    if (!flash) {
      if (facingDown && look.tie) {
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.moveTo(-R * 0.22, -R * 1.15); ctx.lineTo(0, -R * 0.72); ctx.lineTo(R * 0.22, -R * 1.15); ctx.closePath(); ctx.fill();
        ctx.fillStyle = look.tie;
        ctx.fillRect(-1.8, -R * 1.08, 3.6, R * 0.52);
      }
      if (look.cross) {
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, -R * 0.96); ctx.lineTo(0, -R * 0.56);
        ctx.moveTo(-R * 0.2, -R * 0.76); ctx.lineTo(R * 0.2, -R * 0.76);
        ctx.stroke();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1.8;
      }
      if (look.rose) {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.arc(-R * 0.26, -R * 0.88, 2.8, 0, Math.PI * 2); ctx.fill();
      }
    }

    // 4) Голова + обличчя / окуляри / протигаз
    const headY = -R * 1.52;
    const headR = R * 0.48;
    ctx.fillStyle = flash ? '#ffffff' : (look.hat === 'mask' ? '#292524' : (look.skin || '#e0b48f'));
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    if (!flash && facingDown) {
      if (look.hat === 'mask') {
        // Окуляри протигаза Підпалювача
        ctx.fillStyle = '#fde047';
        ctx.beginPath(); ctx.arc(-headR * 0.38, headY - 1, 2.6, 0, Math.PI * 2); ctx.arc(headR * 0.38, headY - 1, 2.6, 0, Math.PI * 2); ctx.fill();
      } else if (look.shades) {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(-headR * 0.72, headY - 2.5, headR * 1.44, 4.5);
      } else {
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(-headR * 0.34, headY - 1, 1.5, 0, Math.PI * 2); ctx.arc(headR * 0.34, headY - 1, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // 5) Головні убори (федора, шолом SWAT, кепка, зелений козирок Круп'є)
    if (look.hat === 'fedora') {
      ctx.fillStyle = flash ? '#fff' : (look.hatColor || '#1c1c1c');
      ctx.beginPath(); ctx.ellipse(0, headY - headR * 0.42, headR * 1.38, headR * 0.36, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      this._roundRect(ctx, -headR * 0.85, headY - headR * 1.15, headR * 1.7, headR * 0.78, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = look.hatBand || '#7f1d1d';
      ctx.fillRect(-headR * 0.82, headY - headR * 0.56, headR * 1.64, 3);
    } else if (look.hat === 'helmet') {
      ctx.fillStyle = flash ? '#fff' : (look.hatColor || '#0f172a');
      ctx.beginPath(); ctx.arc(0, headY - 1, headR * 1.08, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-headR * 0.72, headY - 3, headR * 1.44, 4);
    } else if (look.hat === 'cap') {
      ctx.fillStyle = flash ? '#fff' : (look.hatColor || '#374151');
      ctx.beginPath(); ctx.arc(0, headY - 2, headR * 1.02, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillRect(-headR * 0.4, headY - 3.5, headR * 1.25 * faceDirX, 3);
    } else if (look.hat === 'visor') {
      ctx.fillStyle = look.hatColor || '#16a34a';
      ctx.beginPath(); ctx.ellipse(0, headY - headR * 0.45, headR * 1.15, headR * 0.32, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    // 6) Зброя в руках (обертається в напрямку прицілювання!)
    ctx.save();
    ctx.translate(faceDirX * R * 0.46, -R * 0.82);
    const recoil = (e.attackAnim > 0 && e.range >= 2) ? -3 : 0;
    const w = look.weapon;

    if (w === 'fists') {
      const punch = e.attackAnim > 0 ? 4 : 0;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.arc(punch * faceDirX, 0, R * 0.34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-faceDirX * R * 0.92, 0, R * 0.34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (w === 'shield') {
      ctx.fillStyle = e.shield > 0 ? '#0284c7' : '#334155';
      this._roundRect(ctx, -R * 0.28, -R * 0.52, R * 0.68, R * 1.05, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(-R * 0.16, -R * 0.34, R * 0.44, R * 0.22);
    } else if (w === 'cards') {
      ctx.fillStyle = '#f8fafc';
      ctx.rotate(e.attackAnim > 0 ? 0.5 : -0.2);
      ctx.fillRect(-2, -6, 7, 10); ctx.strokeRect(-2, -6, 7, 10);
    } else {
      ctx.rotate(e.angle);
      if (w === 'rifle') {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(-2 + recoil, -2.2, R * 1.55, 4.4); ctx.strokeRect(-2 + recoil, -2.2, R * 1.55, 4.4);
      } else if (w === 'tommy' || w === 'shotgun') {
        ctx.fillStyle = '#27272a';
        ctx.fillRect(-2 + recoil, -2.8, R * 1.25, 5.5); ctx.strokeRect(-2 + recoil, -2.8, R * 1.25, 5.5);
        if (w === 'tommy') { ctx.beginPath(); ctx.arc(R * 0.5 + recoil, 3, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      } else if (w === 'flamer') {
        ctx.fillStyle = '#44403c';
        ctx.fillRect(-2 + recoil, -3, R * 1.25, 6); ctx.strokeRect(-2 + recoil, -3, R * 1.25, 6);
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.arc(R * 1.28 + recoil, 0, 3.2, 0, Math.PI * 2); ctx.fill();
      } else if (w === 'pistol' || w === 'revolver') {
        ctx.fillStyle = w === 'revolver' ? '#eab308' : '#3f3f46';
        ctx.fillRect(0 + recoil, -2, R * 0.8, 4); ctx.strokeRect(0 + recoil, -2, R * 0.8, 4);
      } else if (w === 'bat' || w === 'baton') {
        ctx.fillStyle = w === 'bat' ? '#b45309' : '#111827';
        ctx.rotate(e.attackAnim > 0 ? -0.9 : 0.3);
        ctx.fillRect(0, -2.2, R * 0.95, 4.4); ctx.strokeRect(0, -2.2, R * 0.95, 4.4);
      } else if (w === 'knife') {
        ctx.fillStyle = '#e5e7eb';
        ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(R * 0.9, 0); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (w === 'briefcase' || w === 'bag') {
        ctx.fillStyle = w === 'bag' ? '#991b1b' : '#78350f';
        ctx.fillRect(-3, -4, R * 0.65, R * 0.5); ctx.strokeRect(-3, -4, R * 0.65, R * 0.5);
      }
    }
    ctx.restore();
    ctx.restore();
  }

  // ---- 2.5D Техніка та Авіація ----
  _drawVan25D(ctx, r, look, flash, e, time) {
    ctx.save();
    ctx.rotate(e.angle);
    const L = r * 2.1, W = r * 1.35;
    ctx.fillStyle = '#111';
    ctx.fillRect(-L * 0.38, -W * 0.56, L * 0.28, W * 1.12);
    ctx.fillRect(L * 0.14, -W * 0.56, L * 0.28, W * 1.12);
    ctx.fillStyle = flash ? '#fff' : look.body;
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2.4;
    this._roundRect(ctx, -L / 2, -W / 2, L, W, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = look.stripe || '#d4af37';
    ctx.fillRect(-L * 0.42, -W * 0.15, L * 0.56, W * 0.3);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(L * 0.18, -W * 0.38, L * 0.2, W * 0.76); ctx.strokeRect(L * 0.18, -W * 0.38, L * 0.2, W * 0.76);
    ctx.fillStyle = `rgba(254, 240, 138, ${0.22 + Math.sin(time * 20) * 0.04})`;
    ctx.beginPath(); ctx.moveTo(L * 0.5, -W * 0.3); ctx.lineTo(L * 1.1, -W * 0.6); ctx.lineTo(L * 1.1, W * 0.6); ctx.lineTo(L * 0.5, W * 0.3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  _drawLimo25D(ctx, r, look, flash, e, time) {
    ctx.save();
    ctx.rotate(e.angle);
    const L = r * 2.55, W = r * 1.25;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-L * 0.38, -W * 0.58, L * 0.24, W * 1.16);
    ctx.fillRect(L * 0.18, -W * 0.58, L * 0.24, W * 1.16);
    ctx.fillStyle = flash ? '#fff' : look.body;
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
    this._roundRect(ctx, -L / 2, -W / 2, L, W, 6); ctx.fill(); ctx.stroke();
    // Золотий молдинг і тонований дах
    ctx.fillStyle = '#1f2937';
    this._roundRect(ctx, -L * 0.32, -W * 0.38, L * 0.6, W * 0.76, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = look.trim || '#f59e0b';
    ctx.fillRect(-L * 0.45, -W * 0.08, L * 0.9, W * 0.16);
    ctx.fillStyle = `rgba(254, 240, 138, ${0.2 + Math.sin(time * 18) * 0.04})`;
    ctx.beginPath(); ctx.moveTo(L * 0.5, -W * 0.3); ctx.lineTo(L * 1.0, -W * 0.55); ctx.lineTo(L * 1.0, W * 0.55); ctx.lineTo(L * 0.5, W * 0.3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  _drawBulldozer25D(ctx, r, look, flash, e, time) {
    ctx.save();
    ctx.rotate(e.angle);
    const L = r * 1.85, W = r * 1.5;
    // Гусениці
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.fillRect(-L * 0.46, -W * 0.58, L * 0.85, W * 0.24);
    ctx.fillRect(-L * 0.46, W * 0.34, L * 0.85, W * 0.24);
    // Жовтий броньований корпус
    ctx.fillStyle = flash ? '#fff' : look.body;
    this._roundRect(ctx, -L * 0.48, -W * 0.4, L * 0.86, W * 0.8, 4); ctx.fill(); ctx.stroke();
    // Кабіна
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-L * 0.34, -W * 0.28, L * 0.42, W * 0.56); ctx.strokeRect(-L * 0.34, -W * 0.28, L * 0.42, W * 0.56);
    // Масивний сталевий відвал спереду
    const push = e.attackAnim > 0 ? 4 : 0;
    ctx.fillStyle = look.blade || '#94a3b8';
    this._roundRect(ctx, L * 0.42 + push, -W * 0.62, L * 0.24, W * 1.24, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
    void time;
  }

  _drawBike25D(ctx, r, look, flash, e, time) {
    ctx.save();
    ctx.rotate(e.angle);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2.2;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-r * 1.0, -3, r * 2.0, 6);
    ctx.fillRect(r * 0.42, -r * 0.58, 3.5, r * 1.16);
    ctx.fillStyle = flash ? '#fff' : (look.tank || '#dc2626');
    this._roundRect(ctx, -r * 0.52, -r * 0.4, r * 1.04, r * 0.8, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#27272a';
    ctx.beginPath(); ctx.arc(-r * 0.05, 0, r * 0.44, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = Math.sin(time * 28) > 0 ? '#fde047' : '#ef4444';
    ctx.beginPath(); ctx.arc(-r * 0.72, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  _drawDrone25D(ctx, r, look, flash, time) {
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, -r * 0.78); ctx.lineTo(r * 0.78, r * 0.78);
    ctx.moveTo(-r * 0.78, r * 0.78);  ctx.lineTo(r * 0.78, -r * 0.78);
    ctx.stroke();
    const rot = time * 26;
    for (const [dx, dy] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]]) {
      ctx.save(); ctx.translate(dx * r, dy * r); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.6)'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.48, r * 0.16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = flash ? '#fff' : look.body; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = Math.sin(time * 14) > 0 ? '#3b82f6' : '#ef4444';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2); ctx.fill();
  }

  _drawHeli25D(ctx, r, look, flash, time) {
    ctx.save();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2.4;
    // Лижі шасі
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, r * 0.55); ctx.lineTo(r * 0.7, r * 0.55);
    ctx.stroke();
    // Хвостова балка
    ctx.fillStyle = flash ? '#fff' : look.body;
    ctx.fillRect(-r * 1.35, -r * 0.14, r * 0.9, r * 0.28);
    ctx.strokeRect(-r * 1.35, -r * 0.14, r * 0.9, r * 0.28);
    // Основний фюзеляж
    ctx.beginPath();
    ctx.ellipse(r * 0.08, 0, r * 0.9, r * 0.52, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Скляна кабіна
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.ellipse(r * 0.42, -r * 0.06, r * 0.42, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Мигалка
    ctx.fillStyle = Math.sin(time * 16) > 0 ? '#ef4444' : '#3b82f6';
    ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.2, 3.5, 0, Math.PI * 2); ctx.fill();
    // Великий обертовий гвинт
    ctx.save();
    ctx.rotate(time * 22);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
    ctx.fillRect(-r * 1.45, -2.5, r * 2.9, 5);
    ctx.fillRect(-2.5, -r * 1.45, 5, r * 2.9);
    ctx.restore();
    ctx.restore();
  }

  _drawDog25D(ctx, r, look, flash, e) {
    ctx.save();
    ctx.rotate(e.angle);
    const stride = e.moving ? Math.sin(e.walkT * e.speed * 8) : 0;
    ctx.fillStyle = flash ? '#fff' : look.body;
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.85, 0); ctx.lineTo(-r * 1.25, stride * r * 0.35); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.12, 0, r * 0.88, r * 0.48, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 0.56, 0, r * 0.38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = look.dark || '#2a1a0e';
    ctx.beginPath(); ctx.arc(r * 0.88, 0, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  _drawDeployClock(ctx, e, topOffsetPx) {
    const pct = clamp(1 - e.deployT / (e.deployMax || 1), 0, 1);
    const y = -topOffsetPx - 12;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    ctx.beginPath(); ctx.arc(0, y, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, y, 6.8, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  _drawSmartHpBar(ctx, e, y) {
    if (!e.damaged && e.hp >= e.maxHp && e.shield >= (e.maxShield || 0)) return;
    const w = JUICE.hpBar.w, h = JUICE.hpBar.h;
    const pct = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(-w / 2 - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = e.side === 'P' ? '#22c55e' : '#ef4444';
    ctx.fillRect(-w / 2, y, w * pct, h);
    if (e.shield > 0 && e.maxShield > 0) {
      const sp = clamp(e.shield / e.maxShield, 0, 1);
      ctx.fillStyle = JUICE.shieldColor;
      ctx.fillRect(-w / 2, y - 3, w * sp, 2.5);
    }
  }

  _drawTracks(ctx) {
    for (const tr of this.tracks) {
      const p = this.toScreen(tr.x, tr.y);
      const a = (1 - tr.t / tr.dur) * 0.28;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(tr.ang);
      ctx.fillStyle = `rgba(15, 15, 20, ${a})`;
      ctx.fillRect(-4, -tr.r * this.tile * 0.5, 7, 2);
      ctx.fillRect(-4, tr.r * this.tile * 0.5 - 2, 7, 2);
      ctx.restore();
    }
  }

  // ---- Зони на полі: Вогонь, Сльозогінний газ, Аура Вендети ----
  _drawAreas(ctx, game) {
    for (const a of game.areas) {
      const p = this.toScreen(a.x, a.y);
      const r = a.r * this.tile;
      const alpha = clamp(a.t / 1.2, 0.25, 1);
      ctx.save();

      if (a.kind === 'gas') {
        const g = ctx.createRadialGradient(p.x, p.y, r * 0.1, p.x, p.y, r);
        g.addColorStop(0, `rgba(163, 230, 53, ${0.42 * alpha})`);
        g.addColorStop(0.65, `rgba(101, 163, 13, ${0.32 * alpha})`);
        g.addColorStop(1, 'rgba(77, 124, 15, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + game.time * 0.9;
          const cx = p.x + Math.cos(ang) * r * 0.45;
          const cy = p.y + Math.sin(ang) * r * 0.45;
          ctx.fillStyle = `rgba(190, 242, 100, ${0.24 * alpha})`;
          ctx.beginPath(); ctx.arc(cx, cy, r * 0.34, 0, Math.PI * 2); ctx.fill();
        }
      } else if (a.kind === 'vendetta') {
        const pulse = 0.85 + Math.sin(game.time * 7) * 0.15;
        const g = ctx.createRadialGradient(p.x, p.y, r * 0.1, p.x, p.y, r);
        g.addColorStop(0, `rgba(220, 38, 38, ${0.28 * alpha})`);
        g.addColorStop(1, `rgba(185, 28, 28, ${0.06 * alpha})`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(248, 113, 113, ${0.85 * alpha * pulse})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 4]);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const g = ctx.createRadialGradient(p.x, p.y, r * 0.1, p.x, p.y, r);
        g.addColorStop(0, `rgba(253, 224, 71, ${0.42 * alpha})`);
        g.addColorStop(0.6, `rgba(249, 115, 22, ${0.36 * alpha})`);
        g.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 7; i++) {
          const ang = (i / 7) * Math.PI * 2 + game.time * 2.5;
          const rr = r * (0.35 + ((i * 37) % 10) / 22);
          const fx = p.x + Math.cos(ang) * rr, fy = p.y + Math.sin(ang) * rr;
          const fh = 6 + Math.sin(game.time * 12 + i) * 3;
          ctx.fillStyle = i % 2 === 0 ? `rgba(253, 224, 71, ${0.75 * alpha})` : `rgba(249, 115, 22, ${0.75 * alpha})`;
          ctx.beginPath(); ctx.arc(fx, fy, fh, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  _drawFlyingCards(ctx) {
    for (const c of this.cardsFly) {
      const k = c.t / c.dur;
      // Бумеранг: летить вперед до 0.55, потім повертається!
      const prog = k < 0.55 ? (k / 0.55) : (1 - (k - 0.55) / 0.45);
      const x = c.x0 + (c.x1 - c.x0) * prog;
      const y = c.y0 + (c.y1 - c.y0) * prog;
      const p = this.toScreen(x, y - 0.3);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(k * Math.PI * 8);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1.6;
      ctx.fillRect(-5, -7, 10, 14);
      ctx.strokeRect(-5, -7, 10, 14);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  _drawProjectiles(ctx, game) {
    for (const pr of game.projectiles) {
      const p = this.toScreen(pr.x, pr.y - 0.3);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(game.time * 14);
      ctx.fillStyle = '#fef9c3'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
      ctx.fillRect(-5, -6, 10, 12); ctx.strokeRect(-5, -6, 10, 12);
      ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(2, 3, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  _drawPendingSpells(ctx, game) {
    for (const sp of game.pending) {
      const k = clamp(sp.t / sp.dur, 0, 1);
      const target = this.toScreen(sp.x, sp.y);
      const r = (sp.def.splash || 2) * this.tile;

      ctx.save();
      ctx.strokeStyle = sp.side === 'P' ? 'rgba(0,229,255,0.65)' : 'rgba(255,23,68,0.75)';
      ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(target.x, target.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      if (sp.def.id === 'spell_molotov' || sp.def.id === 'spell_teargas') {
        const from = this.toScreen(sp.fx, sp.fy);
        const cx = from.x + (target.x - from.x) * k;
        const cy = from.y + (target.y - from.y) * k - Math.sin(k * Math.PI) * 90;
        const scale = 1 + Math.sin(k * Math.PI) * 0.65;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.rotate(k * Math.PI * 4);
        ctx.fillStyle = sp.def.id === 'spell_teargas' ? '#65a30d' : '#15803d';
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        ctx.fillRect(-4, -8, 8, 16); ctx.strokeRect(-4, -8, 8, 16);
        ctx.fillStyle = sp.def.id === 'spell_teargas' ? '#bef264' : '#fde047';
        ctx.beginPath(); ctx.arc(0, -11, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (sp.def.id === 'spell_sniper_shot') {
        ctx.save(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
        const sr = r * (1.3 - k * 0.4);
        ctx.beginPath();
        ctx.arc(target.x, target.y, sr, 0, Math.PI * 2);
        ctx.moveTo(target.x - sr - 5, target.y); ctx.lineTo(target.x + sr + 5, target.y);
        ctx.moveTo(target.x, target.y - sr - 5); ctx.lineTo(target.x, target.y + sr + 5);
        ctx.stroke(); ctx.restore();
      }
    }
  }

  _drawTracers(ctx) {
    for (const tr of this.tracers) {
      const a = this.toScreen(tr.x0, tr.y0), b = this.toScreen(tr.x1, tr.y1);
      ctx.save(); ctx.strokeStyle = tr.color; ctx.globalAlpha = 1 - tr.t / tr.dur; ctx.lineWidth = tr.w;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
    }
  }

  _drawRings(ctx) {
    for (const rg of this.rings) {
      const p = this.toScreen(rg.x, rg.y);
      const k = rg.t / rg.dur;
      const r = (rg.r0 + (rg.r1 - rg.r0) * k) * this.tile;
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = rg.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  }

  _drawParticles(ctx) {
    for (const pt of this.particles) {
      const p = this.toScreen(pt.x, pt.y);
      const k = pt.t / pt.dur;
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(p.x, p.y);
      if (pt.kind === 'muzzle') {
        ctx.rotate(pt.ang); ctx.fillStyle = '#fde047';
        ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
      } else if (pt.kind === 'slash') {
        ctx.rotate(pt.ang); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 12, -0.9, 0.9); ctx.stroke();
      } else if (pt.kind === 'bill') {
        ctx.rotate(pt.rot); ctx.fillStyle = '#16a34a'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2;
        ctx.fillRect(-6, -3.5, 12, 7); ctx.strokeRect(-6, -3.5, 12, 7);
        ctx.fillStyle = '#dcfce7'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0.5);
      } else if (pt.kind === 'plus') {
        ctx.fillStyle = pt.color; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('+', 0, 0);
      } else if (pt.kind === 'dust') {
        ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
        ctx.beginPath(); ctx.arc(0, 0, pt.r * this.tile * (1 + k * 0.6), 0, Math.PI * 2); ctx.fill();
      } else if (pt.kind === 'smoke') {
        ctx.fillStyle = 'rgba(120, 120, 130, 0.55)';
        ctx.beginPath(); ctx.arc(0, 0, pt.r * this.tile * (1 + k * 0.8), 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = pt.color || '#f97316';
        ctx.beginPath(); ctx.arc(0, 0, (pt.r || 0.2) * this.tile * (1 - k * 0.4), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawFloatTexts(ctx) {
    for (const ft of this.floatTexts) {
      const k = ft.t / ft.dur;
      const p = this.toScreen(ft.x, ft.y - k * 1.1);
      ctx.save(); ctx.globalAlpha = k < 0.7 ? 1 : (1 - (k - 0.7) / 0.3);
      ctx.font = `900 ${ft.big ? 15 : 12}px system-ui, sans-serif`; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = '#000';
      ctx.strokeText(ft.text, p.x, p.y); ctx.fillStyle = ft.color; ctx.fillText(ft.text, p.x, p.y);
      ctx.restore();
    }
  }

  _drawBanner(ctx) {
    const b = this.banner;
    const k = b.t / b.dur;
    const alpha = k < 0.12 ? k / 0.12 : k > 0.8 ? (1 - k) / 0.2 : 1;
    ctx.save(); ctx.globalAlpha = clamp(alpha, 0, 1);
    const y = this.h * 0.42;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; ctx.fillRect(0, y - 32, this.w, 64);
    ctx.strokeStyle = b.color || '#ef4444'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, y - 32); ctx.lineTo(this.w, y - 32); ctx.moveTo(0, y + 32); ctx.lineTo(this.w, y + 32); ctx.stroke();
    ctx.fillStyle = '#fde047'; ctx.font = '900 19px Impact, Arial Black, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(b.text, this.w / 2, y - 5);
    ctx.fillStyle = '#e2e8f0'; ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText(b.sub, this.w / 2, y + 16);
    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
}
