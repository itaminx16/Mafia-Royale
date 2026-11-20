// =====================================================================
//  GAME — чиста симуляція бою (без DOM). Події -> this.events
//  Сторони: 'P' — гравець (низ), 'E' — суперник/бот (верх)
//  4 фази економіки: 1хв (x1) -> 2хв (x1.35) -> 3хв (x2) -> Дод. час при нічиїй (x3)
// =====================================================================
import { ARENA, ECONOMY, TOWER_MAP, getDef, statAtLevel, CARD_MAP } from './data.js';

let NEXT_ID = 1;
const other = s => (s === 'P' ? 'E' : 'P');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Game {
  /**
   * @param {object} cfg { P:{deck,tower,levels}, E:{deck,tower,levels}, arena, mode }
   */
  constructor(cfg) {
    this.cfg = cfg;
    this.arena = cfg.arena;
    this.mode = cfg.mode || 'ranked'; // ranked | story | raid_x2 | draft
    this.time = 0;
    this.over = false;
    this.result = null;
    this.phase = 1;        // 1: 0-60s (x1), 2: 60-120s (x1.35), 3: 120-180s (x2), 4: 180-240s (x3 Extra Time)
    this.overtime = false; // 3-тя хвилина (Облава x2)
    this.extraTime = false; // 4-та хвилина при нічиїй (x3 + червоні краї + раптова смерть)
    this.entities = [];
    this.projectiles = [];
    this.areas = [];
    this.pending = [];
    this.events = [];
    this.sides = {};
    this.playedCards = { P: {}, E: {} };

    for (const s of ['P', 'E']) {
      const c = cfg[s];
      const tower = TOWER_MAP[c.tower];
      const order = shuffle(c.deck);
      this.sides[s] = {
        id: s,
        tower,
        levels: c.levels || {},
        cash: tower.startCash || ECONOMY.startCash,
        hand: order.slice(0, 4),
        queue: order.slice(4),
        crowns: 0,
        pocket: { L: false, R: false },
        towers: {},
      };
      this._makeTowers(s);
    }
  }

  nextCard(side) { return this.sides[side].queue[0]; }

  timeLeft() {
    if (this.extraTime) return Math.max(0, ECONOMY.extraMatchTime - this.time);
    return Math.max(0, ECONOMY.matchTime - this.time);
  }

  cashMult(side = 'P') {
    const sd = this.sides[side];
    let m = ECONOMY.min1Mult;
    if (this.extraTime) {
      m = ECONOMY.extraTimeMult;
      if (sd.tower.passive === 'CASH_REGEN_PLUS_10_LAST_MIN') m *= 1.1;
    } else if (this.overtime) {
      m = sd.tower.overtimeMult || ECONOMY.min3Mult;
    } else if (this.phase >= 2) {
      m = ECONOMY.min2Mult;
    }
    if (this.mode === 'raid_x2') m *= 2.0;
    return m;
  }

  emit(type, data) { this.events.push(Object.assign({ type }, data)); }

  // ------------------------------------------------------------------
  _makeTowers(side) {
    const t = this.sides[side].tower;
    const pos = ARENA.towers[side];
    const mk = (role, lane, p) => {
      const isKing = role === 'king';
      const e = this._baseEntity(side, {
        kind: 'tower', role, lane, x: p.x, y: p.y,
        r: isKing ? ARENA.kingRadius : ARENA.princessRadius,
        hp: isKing ? t.kingHp : t.princessHp,
        dmg: isKing ? t.kingDmg : t.princessDmg,
        atkSpeed: t.atkSpeed, range: t.range, sight: t.range,
        targets: 'ALL', isBuilding: true, shot: t.shot,
        towerType: t.id,
      });
      e.active = !isKing;
      e.deployT = 0;
      this.entities.push(e);
      this.sides[side].towers[lane || 'K'] = e;
      return e;
    };
    mk('king', 'K', pos.king);
    mk('princess', 'L', pos.L);
    mk('princess', 'R', pos.R);
  }

  _baseEntity(side, o) {
    return Object.assign({
      id: NEXT_ID++, side, alive: true,
      x: 0, y: 0, r: 0.4, hp: 100, maxHp: o.hp, shield: 0, maxShield: 0,
      dmg: 0, atkSpeed: 1, range: 1, sight: 5.5, speed: 0, targets: 'GROUND',
      flying: false, isBuilding: false, special: 'NONE',
      deployT: ECONOMY.deployTime, deployMax: ECONOMY.deployTime,
      atkTimer: 0, target: null, retargetT: 0,
      stun: 0, freeze: 0, flashT: 0, damaged: false, stealth: false,
      angle: side === 'P' ? -Math.PI / 2 : Math.PI / 2,
      moving: false, walkT: Math.random() * 10, attackAnim: 0, buffed: false,
      vendetta: false, slowT: 0,
      lifetime: 0, age: 0, spawnT: 0, healT: 0,
    }, o, { maxHp: o.hp });
  }

  // ------------------------------------------------------------------
  //  Зони розгортання
  // ------------------------------------------------------------------
  canDeployAt(side, cardId, x, y) {
    const def = CARD_MAP[cardId];
    if (!def) return false;
    if (x < 0 || x > ARENA.W || y < 0 || y > ARENA.H) return false;
    if (def.kind === 'spell') return true;
    const xi = clamp(x, 0.5, ARENA.W - 0.5);
    if (Math.abs(xi - x) > 0.01) return false;
    for (const e of this.entities) {
      if (e.kind === 'tower' && e.alive && dist(e, { x, y }) < e.r + 0.2) return false;
    }
    if (side === 'P') {
      if (y >= ARENA.riverY1 && y <= ARENA.H - 0.5) return true;
      if (def.kind === 'building') return false;
      const sd = this.sides.P;
      if (y < ARENA.riverY0 && y >= ARENA.riverY0 - ARENA.pocketDepth) {
        if (x < ARENA.W / 2 && sd.pocket.L) return true;
        if (x >= ARENA.W / 2 && sd.pocket.R) return true;
      }
      return false;
    } else {
      if (y <= ARENA.riverY0 && y >= 0.5) return true;
      if (def.kind === 'building') return false;
      const sd = this.sides.E;
      if (y > ARENA.riverY1 && y <= ARENA.riverY1 + ARENA.pocketDepth) {
        if (x < ARENA.W / 2 && sd.pocket.L) return true;
        if (x >= ARENA.W / 2 && sd.pocket.R) return true;
      }
      return false;
    }
  }

  // ------------------------------------------------------------------
  //  Розіграш карти
  // ------------------------------------------------------------------
  playCard(side, handIndex, x, y) {
    if (this.over) return false;
    const sd = this.sides[side];
    const cardId = sd.hand[handIndex];
    if (!cardId) return false;
    const def = CARD_MAP[cardId];
    if (sd.cash < def.cost) return false;
    if (!this.canDeployAt(side, cardId, x, y)) return false;
    sd.cash -= def.cost;
    sd.hand[handIndex] = sd.queue.shift();
    sd.queue.push(cardId);
    const level = sd.levels[cardId] || 1;
    this.playedCards[side][cardId] = (this.playedCards[side][cardId] || 0) + 1;
    this.emit('play', { side, cardId, x, y, cost: def.cost });

    if (def.kind === 'spell') this._castSpell(side, def, level, x, y);
    else if (def.kind === 'building') this._spawnBuilding(side, def, level, x, y);
    else this._spawnUnits(side, def, level, x, y);
    return true;
  }

  _formation(n) {
    if (n === 4) return [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]];
    if (n === 3) return [[0, -0.5], [-0.7, 0.4], [0.7, 0.4]];
    if (n === 2) return [[-0.6, 0], [0.6, 0]];
    return [[0, 0]];
  }

  _spawnUnits(side, def, level, x, y, opts = {}) {
    const n = opts.count || def.count || 1;
    const form = this._formation(n);
    const dir = side === 'P' ? 1 : -1;
    const out = [];
    for (let i = 0; i < n; i++) {
      const [ox, oy] = form[i] || [0, 0];
      const look = (def.squadLooks && def.squadLooks[i]) || def.look;
      const e = this._baseEntity(side, {
        kind: 'unit', cardId: def.id, level,
        x: clamp(x + ox, 0.4, ARENA.W - 0.4), y: clamp(y + oy * dir, 0.4, ARENA.H - 0.4),
        r: look && look.type === 'dog' ? 0.34 : (def.size || 0.42),
        hp: statAtLevel(def.hp, level),
        shield: statAtLevel(def.shield || 0, level),
        dmg: statAtLevel(def.dmg, level),
        atkSpeed: def.atkSpeed, range: def.range, sight: Math.max(def.sight || 5.5, def.range + 0.5),
        speed: def.speed, targets: def.targets, special: def.special,
        flying: !!def.flying, vehicle: !!def.vehicle, shot: def.shot || null, look,
        splash: def.splash || 0,
      });
      e.maxShield = e.shield;
      if (def.special === 'STEALTH_UNTIL_HIT') e.stealth = true;
      if (opts.deployT != null) { e.deployT = opts.deployT; e.deployMax = Math.max(0.01, opts.deployT); }
      this.entities.push(e);
      out.push(e);
    }
    if (!opts.silent) this.emit('deploy', { side, x, y, cardId: def.id });
    return out;
  }

  _spawnBuilding(side, def, level, x, y) {
    const e = this._baseEntity(side, {
      kind: 'building', cardId: def.id, level, x, y,
      r: def.size || 0.92,
      hp: statAtLevel(def.hp, level),
      dmg: statAtLevel(def.dmg, level),
      atkSpeed: def.atkSpeed, range: def.range, sight: def.range,
      targets: def.targets, special: def.special, isBuilding: true,
      lifetime: def.lifetime, shot: def.shot || null,
    });
    e.decay = e.maxHp / def.lifetime;
    if (def.special === 'SPAWN_THUG_EVERY_7S') e.spawnT = def.spawnEvery;
    this.entities.push(e);
    this.emit('deploy', { side, x, y, cardId: def.id });
  }

  _castSpell(side, def, level, x, y) {
    const from = ARENA.towers[side].king;
    this.pending.push({ side, def, level, x, y, fx: from.x, fy: from.y, t: 0, dur: def.flightTime || 0.4 });
    this.emit('spellCast', { side, cardId: def.id, x, y, fx: from.x, fy: from.y, dur: def.flightTime || 0.4 });
  }

  _resolveSpell(p) {
    const { side, def, level, x, y } = p;
    const enemies = this.entities.filter(e => e.alive && e.side !== side);
    const inR = enemies.filter(e => dist(e, { x, y }) <= def.splash + (e.kind === 'unit' ? e.r * 0.5 : e.r * 0.6));
    if (def.special === 'BURN_50_DPS_4S') {
      const dmg = statAtLevel(def.dmg, level);
      for (const e of inR) this.damage(e, e.isBuilding && e.kind === 'tower' ? Math.round(dmg * def.towerPct) : dmg, { splash: true, side });
      this.areas.push({ side, x, y, r: def.splash, t: def.burnTime, tick: 1.0, dps: statAtLevel(def.burnDps, level), towerPct: def.towerPct, kind: 'fire' });
      this.emit('molotov', { x, y, r: def.splash });
    } else if (def.special === 'FREEZE_3_5S') {
      for (const e of inR) {
        e.freeze = Math.max(e.freeze, def.freeze);
        if (e.kind === 'tower' && e.role === 'king') e.active = true;
      }
      this.emit('bribe', { x, y, r: def.splash, n: inR.length });
    } else if (def.special === 'TOWER_DMG_35_PCT') {
      const dmg = statAtLevel(def.dmg, level);
      const tdmg = statAtLevel(def.towerDmg, level);
      for (const e of inR) this.damage(e, e.kind === 'tower' ? tdmg : dmg, { splash: true, side });
      this.emit('sniperShot', { x, y, r: def.splash });
    } else if (def.special === 'TEARGAS_SLOW_5S') {
      this.areas.push({
        side, x, y, r: def.splash, t: def.gasTime, tick: 0.2,
        dps: statAtLevel(def.gasDps, level), towerPct: def.towerPct, slowPct: def.slowPct, kind: 'gas',
      });
      this.emit('teargas', { x, y, r: def.splash });
    } else if (def.special === 'VENDETTA_DMG_40') {
      this.areas.push({
        side, x, y, r: def.splash, t: def.buffTime, tick: 99,
        dmgBonus: def.dmgBonus, kind: 'vendetta',
      });
      this.emit('vendetta', { x, y, r: def.splash, side });
    }
  }

  // ------------------------------------------------------------------
  //  Шкода / лікування / смерть
  // ------------------------------------------------------------------
  damage(e, amount, opts = {}) {
    if (!e.alive || amount <= 0) return;
    amount = Math.round(amount);
    if (opts.splash && e.stealth) e.stealth = false;
    e.flashT = 0.08;
    e.damaged = true;
    if (e.kind === 'tower' && e.role === 'king' && !e.active) { e.active = true; this.emit('kingWake', { side: e.side }); }
    if (e.shield > 0) {
      e.shield -= amount;
      this.emit('dmg', { x: e.x, y: e.y, amount, id: e.id, shield: true });
      if (e.shield <= 0) { e.shield = 0; this.emit('shieldBreak', { x: e.x, y: e.y }); }
      return;
    }
    e.hp -= amount;
    this.emit('dmg', { x: e.x, y: e.y, amount, id: e.id, tower: e.kind === 'tower' });
    if (e.hp <= 0) this.kill(e);
  }

  heal(e, amount) {
    if (!e.alive || e.hp >= e.maxHp) return;
    const h = Math.min(amount, e.maxHp - e.hp);
    e.hp += h;
    this.emit('heal', { x: e.x, y: e.y, amount: Math.round(h) });
  }

  kill(e) {
    if (!e.alive) return;
    e.alive = false;
    e.hp = 0;
    if (e.kind === 'tower') return this._towerDestroyed(e);
    if (e.special === 'RAM_AND_SPAWN_2_GUARDS') {
      this._explode(e, e.dmg, e.splash, { buildingsAndUnits: true });
      const def = getDef('token_guard');
      const g = this._spawnUnits(e.side, def, e.level || 1, e.x, e.y, { count: 2, deployT: 0.35, silent: true });
      g.forEach((u, i) => { u.x += (i ? 0.5 : -0.5); });
      this.emit('vanCrash', { x: e.x, y: e.y });
    } else if (e.special === 'LIMO_DRIVEBY_AND_SPAWN_3') {
      this._explode(e, Math.round(e.dmg * 1.5), 1.6, { buildingsAndUnits: true });
      const def = getDef('token_mobster');
      const m = this._spawnUnits(e.side, def, e.level || 1, e.x, e.y, { count: 3, deployT: 0.35, silent: true });
      m.forEach((u, i) => { u.x += (i - 1) * 0.55; });
      this.emit('vanCrash', { x: e.x, y: e.y });
    } else if (e.special === 'SUICIDE_EXPLOSION') {
      // Якщо Байкера-підривника вбили по дорозі — він усе одно вибухає і б'є ворогів поруч!
      const def = CARD_MAP.unit_biker;
      const dDmg = statAtLevel(def.deathDmg || 220, e.level || 1);
      this._explode(e, dDmg, e.splash || 2.0, {});
      this.emit('death', { x: e.x, y: e.y, kind: e.kind, cardId: e.cardId, side: e.side, look: 'bike', exploded: true });
    } else {
      this.emit('death', { x: e.x, y: e.y, kind: e.kind, cardId: e.cardId, side: e.side, look: e.look && e.look.type });
    }
  }

  _explode(src, dmg, radius, opts = {}) {
    for (const t of this.entities) {
      if (!t.alive || t.side === src.side) continue;
      if (t.flying && !opts.air) continue;
      if (dist(t, src) <= radius + t.r) this.damage(t, dmg, { splash: true, side: src.side });
    }
    this.emit('explosion', { x: src.x, y: src.y, r: radius });
  }

  _towerDestroyed(t) {
    const owner = this.sides[t.side];
    const enemy = this.sides[other(t.side)];
    const isKing = t.role === 'king';
    enemy.crowns = isKing ? 3 : Math.min(3, enemy.crowns + 1);
    this.emit('towerDown', { x: t.x, y: t.y, side: t.side, king: isKing, r: t.r });

    // Бонус Центрального Банку: +3$ при знищенні ворожої або втраті своєї вежі
    for (const sd of [owner, enemy]) {
      if (sd.tower.towerDestroyCash > 0) {
        sd.cash = Math.min(ECONOMY.maxCash, sd.cash + sd.tower.towerDestroyCash);
        const k = sd.towers.K;
        this.emit('bankBonus', { side: sd.id, x: k.x, y: k.y, amount: sd.tower.towerDestroyCash });
      }
    }

    if (isKing) {
      this._finish(other(t.side));
    } else if (this.extraTime) {
      // У додатковий час (раптова смерть) перша знесена вежа приносить перемогу!
      this._finish(other(t.side));
    } else {
      const king = owner.towers.K;
      if (king.alive && !king.active) { king.active = true; this.emit('kingWake', { side: t.side }); }
      enemy.pocket[t.lane] = true;
    }
  }

  // ------------------------------------------------------------------
  //  Пошук цілей
  // ------------------------------------------------------------------
  canTarget(a, t) {
    if (!t.alive || t.side === a.side) return false;
    if (t.stealth) return false;
    if (a.targets === 'NONE') return false;
    if (a.targets === 'BUILDINGS_ONLY') return t.isBuilding;
    if (a.targets === 'GROUND') return !t.flying;
    return true;
  }

  laneTower(e) {
    const en = this.sides[other(e.side)].towers;
    const lane = e.x < ARENA.W / 2 ? 'L' : 'R';
    if (en[lane].alive) return en[lane];
    const o = lane === 'L' ? 'R' : 'L';
    if (en.K.alive) return en.K;
    return en[o].alive ? en[o] : null;
  }

  findTarget(e) {
    let best = null, bd = Infinity;
    for (const t of this.entities) {
      if (!this.canTarget(e, t)) continue;
      if (t.kind === 'tower' && e.kind === 'unit') continue;
      const d = dist(e, t) - t.r;
      if (d <= e.sight && d < bd) { bd = d; best = t; }
    }
    if (e.kind === 'unit') {
      const lt = this.laneTower(e);
      for (const tw of Object.values(this.sides[other(e.side)].towers)) {
        if (!tw.alive || !this.canTarget(e, tw)) continue;
        const d = dist(e, tw) - tw.r;
        if (d <= e.sight && d < bd) { bd = d; best = tw; }
      }
      if (!best && lt && this.canTarget(e, lt)) best = lt;
    }
    return best;
  }

  inRange(e, t) {
    return dist(e, t) <= e.range + e.r + t.r;
  }

  // ------------------------------------------------------------------
  //  Головний крок симуляції
  // ------------------------------------------------------------------
  update(dt) {
    if (this.over) return;
    this.time += dt;

    // Фаза 2 (1:00 - 2:00): трохи швидше (x1.35)
    if (this.phase === 1 && this.time >= ECONOMY.phase2At) {
      this.phase = 2;
      this.emit('phase2', {});
    }
    // Фаза 3 (2:00 - 3:00): Облава (x2)
    if (!this.overtime && this.time >= ECONOMY.overtimeAt) {
      this.phase = 3;
      this.overtime = true;
      this.emit('overtime', {});
    }

    // Регенерація Готівки
    for (const s of ['P', 'E']) {
      const sd = this.sides[s];
      const rate = ECONOMY.regenPerSec * this.cashMult(s);
      sd.cash = Math.min(ECONOMY.maxCash, sd.cash + rate * dt);
    }

    // Закляття в польоті
    for (const p of this.pending) {
      p.t += dt;
      if (p.t >= p.dur) { p.done = true; this._resolveSpell(p); }
    }
    this.pending = this.pending.filter(p => !p.done);

    // Зони на полі: Вогонь (Молотов), Сльозогінний газ (уповільнення + шкода), Вендета (+40% шкоди союзникам)
    for (const e of this.entities) e.vendetta = false;

    for (const a of this.areas) {
      a.t -= dt; a.tick -= dt;
      if (a.kind === 'gas') {
        for (const e of this.entities) {
          if (!e.alive || e.side === a.side) continue;
          if (dist(e, a) <= a.r + e.r * 0.5) e.slowT = Math.max(e.slowT, 0.35);
        }
        if (a.tick <= 0 && a.t > -0.01) {
          a.tick += 1.0;
          for (const e of this.entities) {
            if (!e.alive || e.side === a.side) continue;
            if (dist(e, a) <= a.r + e.r * 0.5) {
              this.damage(e, e.kind === 'tower' ? Math.round(a.dps * a.towerPct) : a.dps, { splash: true, side: a.side });
            }
          }
        }
      } else if (a.kind === 'vendetta') {
        for (const e of this.entities) {
          if (!e.alive || e.side !== a.side || e.kind !== 'unit') continue;
          if (dist(e, a) <= a.r + e.r * 0.5) e.vendetta = true;
        }
      } else if (a.tick <= 0 && a.t > -0.01) {
        a.tick += 1.0;
        for (const e of this.entities) {
          if (!e.alive || e.side === a.side) continue;
          if (dist(e, a) <= a.r + e.r * 0.5) this.damage(e, e.kind === 'tower' ? Math.round(a.dps * a.towerPct) : a.dps, { splash: true, side: a.side });
        }
        this.emit('burnTick', { x: a.x, y: a.y });
      }
    }
    this.areas = this.areas.filter(a => a.t > 0);

    // Аури (Дон)
    const dons = this.entities.filter(e => e.alive && e.special === 'BUFF_ATK_SPEED_20' && e.deployT <= 0);
    for (const e of this.entities) {
      e.buffed = false;
      if (!e.alive || e.kind === 'tower') continue;
      for (const d of dons) if (d !== e && d.side === e.side && dist(d, e) <= CARD_MAP.unit_don.buffRadius) { e.buffed = true; break; }
    }

    for (const e of this.entities) if (e.alive) this._updateEntity(e, dt);

    // Снаряди
    for (const p of this.projectiles) {
      const t = p.target;
      const tx = t.alive ? t.x : p.tx, ty = t.alive ? t.y : p.ty;
      p.tx = tx; p.ty = ty;
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      const step = p.speed * dt;
      if (d <= step) {
        p.done = true;
        if (t.alive) {
          this.damage(t, p.dmg, { side: p.side });
          if (p.stun && t.alive) {
            t.stun = Math.max(t.stun, p.stun);
            t.atkTimer = Math.max(t.atkTimer, t.atkSpeed * 0.5);
            this.emit('stun', { x: t.x, y: t.y });
          }
        }
      } else { p.x += dx / d * step; p.y += dy / d * step; }
    }
    this.projectiles = this.projectiles.filter(p => !p.done);

    this._separate();
    this.entities = this.entities.filter(e => e.alive || e.kind === 'tower');

    // Перевірка кінця основного часу (3:00) та додаткового часу (4:00)
    if (!this.over) {
      if (!this.extraTime && this.time >= ECONOMY.matchTime) {
        const P = this.sides.P.crowns, E = this.sides.E.crowns;
        if (P !== E) {
          this._finish(P > E ? 'P' : 'E');
        } else {
          // Нічия на 3:00 -> додаткова хвилина з x3 Готівкою + червоні краї
          this.extraTime = true;
          this.phase = 4;
          this.emit('extraTime', {});
        }
      } else if (this.extraTime && this.time >= ECONOMY.extraMatchTime) {
        const P = this.sides.P.crowns, E = this.sides.E.crowns;
        if (P !== E) this._finish(P > E ? 'P' : 'E');
        else this._finish(null); // Якщо навіть після додаткової хвилини нічия -> НІЧИЯ!
      }
    }
  }

  _finish(winner) {
    if (this.over) return;
    this.over = true;
    this.result = {
      winner,
      crownsP: this.sides.P.crowns,
      crownsE: this.sides.E.crowns,
      time: this.time,
      playedP: { ...this.playedCards.P },
    };
    this.emit('gameOver', this.result);
  }

  _updateEntity(e, dt) {
    e.flashT = Math.max(0, e.flashT - dt);
    e.attackAnim = Math.max(0, e.attackAnim - dt);
    e.slowT = Math.max(0, e.slowT - dt);
    e.age += dt;

    if (e.deployT > 0) { e.deployT -= dt; return; }

    if (e.kind === 'building' && e.lifetime) {
      e.hp -= e.decay * dt;
      if (e.hp <= 0) { this.kill(e); return; }
    }

    if (e.freeze > 0) { e.freeze -= dt; e.moving = false; return; }
    if (e.stun > 0) { e.stun -= dt; e.moving = false; return; }

    if (e.special === 'SPAWN_THUG_EVERY_7S') {
      const def = CARD_MAP[e.cardId];
      e.spawnT -= dt;
      if (e.spawnT <= 0) {
        e.spawnT += def.spawnEvery;
        const dy = e.side === 'P' ? -1.3 : 1.3;
        this._spawnUnits(e.side, CARD_MAP[def.spawnCard], e.level, e.x, e.y + dy, { count: def.spawnCount, deployT: 0.3, silent: true });
        this.emit('spawnerPop', { x: e.x, y: e.y });
      }
      return;
    }

    if (e.special === 'HEAL_AURA_65') {
      const def = CARD_MAP[e.cardId];
      e.healT -= dt;
      if (e.healT <= 0) {
        e.healT += def.healInterval;
        let any = false;
        for (const a of this.entities) {
          if (a === e || !a.alive || a.side !== e.side || a.kind !== 'unit' || a.deployT > 0) continue;
          if (dist(a, e) <= def.healRadius && a.hp < a.maxHp) { this.heal(a, def.heal); any = true; }
        }
        if (any) this.emit('healPulse', { x: e.x, y: e.y, r: def.healRadius });
      }
    }

    if (e.kind === 'tower') {
      if (!e.active) return;
      this._combat(e, dt, false);
      return;
    }
    // Броньований Лімузин: повільно їде до вежі/будівлі і ОДНОЧАСНО відстрілюється з вікон по ворогах!
    if (e.special === 'LIMO_DRIVEBY_AND_SPAWN_3') {
      const dest = this.laneTower(e);
      if (dest && dist(e, dest) > e.r + dest.r + 1.2) {
        this._move(e, dest, dt);
      } else {
        e.moving = false;
      }
      const shootTarget = this._findStaticTarget(e);
      if (shootTarget) {
        const mult = (e.buffed ? (1 - CARD_MAP.unit_don.buffAtkSpeed) : 1) * (e.slowT > 0 ? 1.35 : 1);
        e.atkTimer -= dt / mult;
        if (e.atkTimer <= 0) {
          e.atkTimer = e.atkSpeed;
          this._attack(e, shootTarget);
        }
      }
      return;
    }
    this._combat(e, dt, e.kind === 'unit');
  }

  _combat(e, dt, canMove) {
    if (e.target && (!e.target.alive || !this.canTarget(e, e.target))) e.target = null;
    const attacking = e.target && this.inRange(e, e.target);
    e.retargetT -= dt;
    if (!e.target || (!attacking && e.retargetT <= 0)) {
      e.retargetT = 0.25;
      const nt = e.kind === 'unit' ? this.findTarget(e) : this._findStaticTarget(e);
      if (nt !== e.target) { e.target = nt; if (nt && e.atkTimer <= 0) e.atkTimer = Math.min(0.35, e.atkSpeed * 0.4); }
    }
    const t = e.target;
    if (!t) { e.moving = false; return; }

    if (this.inRange(e, t)) {
      e.moving = false;
      e.angle = Math.atan2(t.y - e.y, t.x - e.x);
      const mult = (e.buffed ? (1 - CARD_MAP.unit_don.buffAtkSpeed) : 1) * (e.slowT > 0 ? 1.35 : 1);
      e.atkTimer -= dt / mult;
      if (e.atkTimer <= 0) {
        e.atkTimer = e.atkSpeed > 0 ? e.atkSpeed : 1;
        this._attack(e, t);
      }
    } else if (canMove) {
      this._move(e, t, dt);
    } else {
      e.target = null;
    }
  }

  _findStaticTarget(e) {
    let best = null, bd = Infinity;
    for (const t of this.entities) {
      if (!this.canTarget(e, t)) continue;
      const d = dist(e, t);
      if (d <= e.range + e.r + t.r && d < bd) { bd = d; best = t; }
    }
    return best;
  }

  _attack(e, t) {
    e.attackAnim = 0.18;
    if (e.stealth) e.stealth = false;

    const dmg = Math.round(e.dmg * (e.vendetta ? 1.4 : 1));

    if (e.special === 'SUICIDE_EXPLOSION') {
      this._explode(e, dmg, e.splash, {});
      e.alive = false; e.hp = 0;
      this.emit('death', { x: e.x, y: e.y, kind: 'unit', cardId: e.cardId, side: e.side, look: 'bike', exploded: true });
      return;
    }
    if (e.special === 'RAM_AND_SPAWN_2_GUARDS') {
      this.kill(e);
      return;
    }
    if (e.special === 'STUN_1_SEC') {
      this.projectiles.push({ side: e.side, x: e.x, y: e.y, tx: t.x, ty: t.y, target: t, dmg, stun: CARD_MAP.unit_lawyer.stun, speed: 9, kind: 'paper' });
      this.emit('shot', { id: e.id, shot: 'paper', x: e.x, y: e.y, tx: t.x, ty: t.y, side: e.side, noTracer: true });
      return;
    }
    // Круп'є: кидає карту-бумеранг, що пробиває всіх ворогів на лінії!
    if (e.special === 'PIERCE_LINE') {
      const ang = Math.atan2(t.y - e.y, t.x - e.x);
      const len = e.range + 1.2;
      const ex = e.x + Math.cos(ang) * len, ey = e.y + Math.sin(ang) * len;
      this.emit('cardThrow', { x0: e.x, y0: e.y, x1: ex, y1: ey, side: e.side });
      for (const o of this.entities) {
        if (!this.canTarget(e, o)) continue;
        // Відстань від точки o до відрізка (e -> end)
        const vx = ex - e.x, vy = ey - e.y;
        const l2 = vx * vx + vy * vy || 1;
        const proj = clamp(((o.x - e.x) * vx + (o.y - e.y) * vy) / l2, 0, 1);
        const px = e.x + proj * vx, py = e.y + proj * vy;
        if (Math.hypot(o.x - px, o.y - py) <= (e.splash || 0.9) + o.r) {
          this.damage(o, dmg, { splash: true, side: e.side });
        }
      }
      return;
    }
    // Охоронець із дробовиком: колосальна шкода впритул + відкидання ворогів назад!
    if (e.special === 'KNOCKBACK_CLOSE') {
      this.emit('shot', { id: e.id, shot: 'tommy', x: e.x, y: e.y, tx: t.x, ty: t.y, side: e.side });
      const kb = CARD_MAP.unit_shotgun.knockback || 1.35;
      for (const o of this.entities) {
        if (!this.canTarget(e, o)) continue;
        if (o === t || dist(o, t) <= (e.splash || 1.1)) {
          this.damage(o, dmg, { splash: o !== t, side: e.side });
          if (o.alive && o.kind === 'unit' && !o.vehicle) {
            const ka = Math.atan2(o.y - e.y, o.x - e.x);
            o.x = clamp(o.x + Math.cos(ka) * kb, 0.4, ARENA.W - 0.4);
            o.y = clamp(o.y + Math.sin(ka) * kb, 0.4, ARENA.H - 0.4);
          }
        }
      }
      return;
    }
    // Підпалювач: вогняний конус ближнього сплешу
    if (e.special === 'FLAME_CONE') {
      this.emit('flame', { x0: e.x, y0: e.y, x1: t.x, y1: t.y, r: e.splash || 1.6 });
      this.damage(t, dmg, { side: e.side });
      for (const o of this.entities) {
        if (o === t || !this.canTarget(e, o)) continue;
        if (dist(o, t) <= (e.splash || 1.6)) this.damage(o, dmg, { splash: true, side: e.side });
      }
      return;
    }
    const ranged = e.range >= 2 || e.kind === 'tower' || e.kind === 'building';
    if (ranged) {
      this.emit('shot', { id: e.id, shot: e.shot || 'pistol', x: e.x, y: e.y, tx: t.x, ty: t.y, side: e.side, tower: e.kind === 'tower', flying: e.flying });
      this.damage(t, dmg, { side: e.side });
      if (e.special === 'CONE_SPLASH') {
        for (const o of this.entities) {
          if (o === t || !this.canTarget(e, o)) continue;
          if (dist(o, t) <= e.splash) this.damage(o, dmg, { splash: true, side: e.side });
        }
      }
    } else {
      const dog = e.look && e.look.type === 'dog';
      // Бульдозер: x2 шкода по будівлях та вежах!
      const finalDmg = (e.special === 'DOUBLE_BLDG_DMG' && t.isBuilding) ? dmg * 2 : dmg;
      this.emit('melee', { id: e.id, x: e.x, y: e.y, tx: t.x, ty: t.y, dog });
      this.damage(t, finalDmg, { side: e.side });
    }
  }

  _waypoint(e, tx, ty) {
    if (e.flying) return { x: tx, y: ty };
    const r0 = ARENA.riverY0, r1 = ARENA.riverY1;
    const side = y => (y < r0 ? -1 : y > r1 ? 1 : 0);
    const es = side(e.y), ts = side(ty);
    if (es === ts && es !== 0) return { x: tx, y: ty };
    let best = ARENA.bridges[0], bc = Infinity;
    for (const b of ARENA.bridges) {
      const c = Math.abs(e.x - b.cx) + Math.abs(tx - b.cx) * 0.6;
      if (c < bc) { bc = c; best = b; }
    }
    const onBridgeX = e.x > best.x0 + 0.3 && e.x < best.x1 - 0.3;
    const goingUp = ty < e.y;
    if (es === 0) {
      return { x: clamp(e.x, best.x0 + 0.5, best.x1 - 0.5), y: goingUp ? r0 - 0.6 : r1 + 0.6 };
    }
    const nearY = es < 0 ? r0 - 0.3 : r1 + 0.3;
    if (onBridgeX && Math.abs(e.y - nearY) < 1.5) {
      return { x: clamp(e.x, best.x0 + 0.5, best.x1 - 0.5), y: goingUp ? r0 - 0.6 : r1 + 0.6 };
    }
    return { x: best.cx, y: nearY };
  }

  _move(e, t, dt) {
    const wp = this._waypoint(e, t.x, t.y);
    const dx = wp.x - e.x, dy = wp.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.001) { e.moving = false; return; }
    const spd = e.speed * (e.slowT > 0 ? 0.65 : 1);
    const step = Math.min(d, spd * dt);
    e.x += dx / d * step;
    e.y += dy / d * step;
    const ta = Math.atan2(dy, dx);
    let da = ta - e.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    e.angle += da * Math.min(1, dt * 10);
    e.moving = true;
    e.walkT += dt;
  }

  _separate() {
    const units = this.entities.filter(e => e.alive && e.kind === 'unit');
    for (let i = 0; i < units.length; i++) {
      const a = units[i];
      for (let j = i + 1; j < units.length; j++) {
        const b = units[j];
        if (a.flying !== b.flying) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const min = (a.r + b.r) * 0.85;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) {
          if (d2 === 0) { a.x -= 0.01; b.x += 0.01; }
          continue;
        }
        const d = Math.sqrt(d2);
        const push = (min - d) * 0.5;
        const ma = a.r * a.r * (a.vehicle ? 3 : 1) * (a.deployT > 0 ? 4 : 1);
        const mb = b.r * b.r * (b.vehicle ? 3 : 1) * (b.deployT > 0 ? 4 : 1);
        const wa = mb / (ma + mb), wb = ma / (ma + mb);
        a.x -= dx / d * push * wa * 2; a.y -= dy / d * push * wa * 2;
        b.x += dx / d * push * wb * 2; b.y += dy / d * push * wb * 2;
      }
    }
    const solids = this.entities.filter(e => e.alive && (e.kind === 'tower' || e.kind === 'building'));
    for (const u of units) {
      if (!u.flying) {
        for (const s of solids) {
          const dx = u.x - s.x, dy = u.y - s.y;
          const min = s.r + u.r * 0.6;
          const d = Math.hypot(dx, dy);
          if (d < min && d > 0.0001) { u.x = s.x + dx / d * min; u.y = s.y + dy / d * min; }
        }
        if (u.y > ARENA.riverY0 && u.y < ARENA.riverY1) {
          let inBridge = false, nb = null, nd = Infinity;
          for (const b of ARENA.bridges) {
            if (u.x >= b.x0 + 0.2 && u.x <= b.x1 - 0.2) inBridge = true;
            const dd = Math.abs(u.x - b.cx);
            if (dd < nd) { nd = dd; nb = b; }
          }
          if (!inBridge) u.x = clamp(u.x, nb.x0 + 0.25, nb.x1 - 0.25);
        }
      }
      u.x = clamp(u.x, 0.3, ARENA.W - 0.3);
      u.y = clamp(u.y, 0.3, ARENA.H - 0.3);
    }
  }
}
