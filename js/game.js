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
    this.traps = [];
    this.barrels = [];
    this.tunnels = [];
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
      const rng = isKing ? t.range + 1.0 : t.range;
      const e = this._baseEntity(side, {
        kind: 'tower', role, lane, x: p.x, y: p.y,
        r: isKing ? ARENA.kingRadius : ARENA.princessRadius,
        hp: isKing ? t.kingHp : t.princessHp,
        dmg: isKing ? t.kingDmg : t.princessDmg,
        atkSpeed: t.atkSpeed, range: rng, sight: rng,
        targets: 'ALL', isBuilding: true, shot: t.shot,
        towerType: t.id,
      });
      // Головні вежі (King) завжди мають активну пушку і стріляють на 1 клітинку далі за сусідні!
      e.active = true;
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
      vendetta: false, slowT: 0, trailSlowT: 0,
      lifetime: 0, age: 0, spawnT: 0, healT: 0,
      chiefShielded: false, followId: null, rage: false, rampT: 0, rampTargetId: null,
    }, o, { maxHp: o.hp });
  }

  // ------------------------------------------------------------------
  //  Зони розгортання
  // ------------------------------------------------------------------
  canDeployAt(side, cardId, x, y) {
    const def = CARD_MAP[cardId];
    if (!def) return false;
    if (x < 0 || x > ARENA.W || y < 0 || y > ARENA.H) return false;
    if (def.special === 'MANHOLE_TRAP') {
      // Засідка в люку: лише на своїй половині та першій половині противника (ближче до річки)
      return side === 'P' ? (y >= 8.0 && y <= ARENA.H - 0.5) : (y <= 24.0 && y >= 0.5);
    }
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

  hasCounterfeit(side) {
    const opp = other(side);
    return this.entities.some(e => e.alive && e.side === opp && e.special === 'COUNTERFEIT_INFLATION');
  }

  cardCost(side, cardId, handIndex = 0) {
    const def = CARD_MAP[cardId];
    if (!def) return 0;
    let cost = def.cost;
    // Підпільна друкарня (Фальшивомонетники): заражає 1 карту в руці ворога інфляцією (+1$ до вартості)
    if (this.hasCounterfeit(side) && handIndex === 0) cost += 1;
    return cost;
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
    const cost = this.cardCost(side, cardId, handIndex);
    if (sd.cash < cost) return false;
    if (!this.canDeployAt(side, cardId, x, y)) return false;
    sd.cash -= cost;
    sd.hand[handIndex] = sd.queue.shift();
    sd.queue.push(cardId);
    const level = sd.levels[cardId] || 1;
    this.playedCards[side][cardId] = (this.playedCards[side][cardId] || 0) + 1;
    this.emit('play', { side, cardId, x, y, cost });

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
    if (def.special === 'SWAT_WALL_6' && !opts.raw) {
      // Поліцейська облава: горизонтальна шеренга на всю ширину арени (3 ліворуч, 3 праворуч)
      const xs = [2.0, 3.5, 5.0, 13.0, 14.5, 16.0];
      const out = [];
      for (const sx of xs) {
        const res = this._spawnUnits(side, def, level, sx, y, { count: 1, raw: true, silent: true, deployT: opts.deployT });
        out.push(...res);
      }
      if (!opts.silent) this.emit('deploy', { side, x, y, cardId: def.id });
      return out;
    }

    if (def.special === 'PROTECTED_WITNESS_SQUAD' && !opts.raw) {
      // Свідок під захистом: 1 Свідок попереду + 2 Агенти ФБР позаду
      const dir = side === 'P' ? 1 : -1;
      const wDef = getDef('token_witness');
      const aDef = getDef('token_fbi_agent');
      const [witness] = this._spawnUnits(side, wDef, level, x, y, { count: 1, raw: true, silent: true, deployT: opts.deployT });
      const agents = this._spawnUnits(side, aDef, level, x, clamp(y + 0.9 * dir, 0.5, ARENA.H - 0.5), { count: 2, raw: true, silent: true, deployT: opts.deployT });
      agents.forEach((ag, idx) => {
        ag.followId = witness.id;
        ag.x = clamp(x + (idx === 0 ? -0.65 : 0.65), 0.4, ARENA.W - 0.4);
      });
      if (!opts.silent) this.emit('deploy', { side, x, y, cardId: def.id });
      return [witness, ...agents];
    }

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
      isObstacle: !!def.isObstacle, untargetable: !!def.untargetable,
    });
    e.decay = def.lifetime ? (e.maxHp / def.lifetime) : 0;
    if (def.special === 'SPAWN_THUG_EVERY_7S') {
      e.spawnT = def.spawnEvery;
      // Відразу випускаємо першу хвилю з 4 бійців шпани при розміщенні будівлі
      const dy = side === 'P' ? -1.3 : 1.3;
      this._spawnUnits(side, CARD_MAP[def.spawnCard], level, x, y + dy, { count: def.spawnCount || 4, deployT: 0.3, silent: true });
      this.emit('spawnerPop', { x, y });
    } else if (def.special === 'COUNTERFEIT_INFLATION') {
      e.incomeT = def.incomeEvery || 8.0;
    } else if (def.special === 'SPIKES_TRAP') {
      e.isTrap = true;
      e.tickT = 0.5;
    }
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
    } else if (def.special === 'RICOCHET_CHAIN_4') {
      // Рикошет (Сліпа куля): обирає 1-шу ціль з найбільшим HP, відскакує 4 рази (+15% шкоди за відскок)
      const candidates = this.entities.filter(e => e.alive && e.side !== side && dist(e, { x, y }) <= (def.splash || 2.5));
      if (candidates.length === 0) {
        const wider = this.entities.filter(e => e.alive && e.side !== side && dist(e, { x, y }) <= 4.0);
        if (wider.length) candidates.push(...wider);
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => b.hp - a.hp);
        let curr = candidates[0];
        const hitSet = new Set([curr]);
        const chainPoints = [{ x: p.fx, y: p.fy }, { x: curr.x, y: curr.y }];
        const baseDmg = statAtLevel(def.baseDamage || 120, level);
        const mults = [1.0, 1.15, 1.30, 1.45];

        for (let step = 0; step < 4; step++) {
          const dmg = Math.round(baseDmg * mults[step]);
          this.damage(curr, dmg, { side });
          this.emit('ricochetHit', { x: curr.x, y: curr.y, step, dmg });
          if (step === 3) break;

          let next = null, bestD = (def.bounceRadius || 3.5);
          for (const e of this.entities) {
            if (!e.alive || e.side === side || hitSet.has(e)) continue;
            const d = dist(e, curr);
            if (d <= bestD) {
              bestD = d;
              next = e;
            }
          }
          if (!next) break;
          hitSet.add(next);
          chainPoints.push({ x: next.x, y: next.y });
          curr = next;
        }
        this.emit('ricochetChain', { points: chainPoints, side });
      }
    } else if (def.special === 'MANHOLE_TRAP') {
      // Засідка в люку: невидима пастка, спрацьовує при наступі ворога
      this.traps.push({
        id: NEXT_ID++,
        side,
        cardId: def.id,
        level,
        x, y,
        r: def.splash || 1.2,
        stunDuration: def.stunDuration || 1.0,
        impactDmg: statAtLevel(def.impactDmg || 90, level),
        spawnToken: def.spawnToken || 'token_sawn_off_mob',
        spawnCount: def.spawnCount || 2,
      });
      this.emit('trapPlaced', { side, x, y, cardId: def.id });
    } else if (def.special === 'CAR_CRASH_WRECK') {
      // Аварія на дорозі: 260 шкоди по площі + відкидання ворогів + спавн палаючого остова
      const dmg = statAtLevel(def.impactDmg || 260, level);
      for (const e of inR) {
        this.damage(e, e.kind === 'tower' ? Math.round(dmg * 0.4) : dmg, { splash: true, side });
        if (e.kind === 'unit' && !e.flying) {
          const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1;
          e.x = clamp(e.x + (dx / d) * (def.knockback || 1.4), 0.5, ARENA.W - 0.5);
          e.y = clamp(e.y + (dy / d) * (def.knockback || 1.4), 0.5, ARENA.H - 0.5);
        }
      }
      const wreckDef = getDef('token_burning_wreck');
      if (wreckDef) {
        this._spawnBuilding(side, wreckDef, level, x, y);
      }
      this.emit('carCrashImpact', { x, y, r: def.splash || 2.2 });
    } else if (def.special === 'METRO_HEIST_TELEPORT') {
      // Метрополітен: точка А (вхід) на своїй половині, точка Б (вихід) на половині ворога (мін. дистанція до веж)
      const onOwnHalf = side === 'P' ? (y >= 16) : (y <= 16);
      let ax = clamp(x, 1.5, ARENA.W - 1.5);
      let ay = onOwnHalf ? clamp(y, side === 'P' ? 17.5 : 2.5, side === 'P' ? 28.0 : 14.5) : (side === 'P' ? 21.5 : 10.5);
      let bx = ax;
      let by = onOwnHalf ? (side === 'P' ? 10.5 : 21.5) : clamp(y, side === 'P' ? 4.0 : 17.5, side === 'P' ? 14.5 : 28.0);
      // Відсунути точку Б від ворожих веж мінімум на 2.5 тайла
      for (const tw of Object.values(this.sides[other(side)].towers)) {
        if (!tw.alive) continue;
        const d = Math.hypot(bx - tw.x, by - tw.y);
        if (d < tw.r + 2.2) {
          const ang = Math.atan2(by - tw.y, bx - tw.x) || (side === 'P' ? Math.PI / 2 : -Math.PI / 2);
          bx = clamp(tw.x + Math.cos(ang) * (tw.r + 2.3), 1.5, ARENA.W - 1.5);
          by = clamp(tw.y + Math.sin(ang) * (tw.r + 2.3), 2.5, ARENA.H - 2.5);
        }
      }
      this.tunnels.push({
        id: NEXT_ID++, side, level, ax, ay, bx, by,
        t: 0, dur: def.tunnelDuration || 3.0, warnTime: def.warnTime || 1.5, warned: false,
        spawnToken: def.spawnToken || 'token_metro_robber', spawnCount: def.spawnCount || 3,
      });
      this.emit('metroStart', { side, ax, ay, bx, by });
    } else if (def.special === 'TOXIC_BARREL_ROLL') {
      // Бочка з токсичними відходами: котиться по прямій 6.5 тайлів, відкидає і лишає слід на 5с
      this.barrels.push({
        id: NEXT_ID++, side, x, y,
        dir: side === 'P' ? -1 : 1,
        dist: 0, maxDist: def.rollDist || 6.5, speed: def.rollSpeed || 6.5,
        dmg: statAtLevel(def.dmg || 75, level), knockback: def.knockback || 1.1,
        hitSet: new Set(), trailStep: 0,
        puddleDuration: def.puddleDuration || 5.0,
        puddleDps: statAtLevel(def.puddleDps || 40, level),
        slowPct: def.slowPct || 0.15,
      });
      this.emit('barrelLaunch', { side, x, y });
    }
  }

  // ------------------------------------------------------------------
  //  Шкода / лікування / смерть
  // ------------------------------------------------------------------
  damage(e, amount, opts = {}) {
    if (!e.alive || amount <= 0) return;
    // Поліцейська облава (SWAT Wall): передня броня блокує 30% шкоди у секторі 120°
    if (e.special === 'SWAT_WALL_6' && opts.attacker && !opts.splash) {
      const angToAtk = Math.atan2(opts.attacker.y - e.y, opts.attacker.x - e.x);
      let diff = Math.abs(angToAtk - e.angle);
      while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
      if (diff <= Math.PI / 3) amount = Math.round(amount * 0.70);
    }
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
    if (e.special === 'WITNESS_RUNNER') {
      // Якщо Свідок гине — Агенти ФБР впадають у Лють (+25% швидкості атаки й руху) і шукають ворогів самі
      for (const ag of this.entities) {
        if (ag.alive && ag.followId === e.id) {
          ag.followId = null;
          ag.rage = true;
          ag.speed *= 1.25;
          ag.atkSpeed /= 1.25;
        }
      }
      this.emit('witnessRage', { x: e.x, y: e.y, side: e.side });
    }
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
    } else if (e.special === 'BLIMP_AIR_CARRIER') {
      // Контрабандний дирижабль: при знищенні падає і вибухає з колосальним сплешем 420 по землі!
      const def = CARD_MAP.unit_contraband_blimp;
      const dDmg = statAtLevel(def.deathDmg || 420, e.level || 1);
      this._explode(e, dDmg, def.deathSplash || 2.8, {});
      this.emit('blimpCrash', { x: e.x, y: e.y, r: def.deathSplash || 2.8 });
      this.emit('death', { x: e.x, y: e.y, kind: e.kind, cardId: e.cardId, side: e.side, look: 'blimp', exploded: true });
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
    if (t.untargetable || t.special === 'SPIKES_TRAP') return false;
    if (a.targets === 'NONE') return false;
    if (a.targets === 'BUILDINGS_ONLY') return t.isBuilding;
    if (t.flying) {
      // Повітряні юніти можуть атакувати тільки ті юніти, які мають дальню атаку або самі літають / вежі
      const canHitAir = (a.targets === 'ALL' || a.targets === 'AIR') && (a.range >= 2.0 || a.flying || a.kind === 'tower' || a.kind === 'building');
      if (!canHitAir) return false;
    }
    if (a.targets === 'GROUND') return !t.flying;
    // Башні не можуть стріляти за свою половину арени (річка/середина Y = 16)
    if (a.kind === 'tower') {
      const midY = (ARENA.riverY0 + ARENA.riverY1) / 2; // 16
      if (a.side === 'P' && t.y < midY) return false;
      if (a.side === 'E' && t.y > midY) return false;
    }
    return true;
  }

  laneTower(e) {
    const en = this.sides[other(e.side)].towers;
    const lane = e.x < ARENA.W / 2 ? 'L' : 'R';
    if (en[lane].alive) return en[lane];
    // Якщо вежу лінії знищено — обираємо найближчу живу вежу ворога (щоб юніт по центру атакував вежу)
    const alive = [en.K, en.L, en.R].filter(tw => tw && tw.alive);
    if (!alive.length) return null;
    alive.sort((a, b) => dist(e, a) - dist(e, b));
    return alive[0];
  }

  findTarget(e) {
    // Зенітка на пікапі: пріоритетно збиває повітряні цілі
    if (e.special === 'ANTI_AIR_BURST') {
      let airBest = null, abd = Infinity;
      for (const t of this.entities) {
        if (!this.canTarget(e, t) || !t.flying) continue;
        const d = dist(e, t) - t.r;
        if (d <= e.sight && d < abd) { abd = d; airBest = t; }
      }
      if (airBest) return airBest;
    }

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

    // Зони на полі: Вогонь (Молотов), Сльозогінний газ, Вендета, Кислота, Слід бочки
    for (const e of this.entities) {
      e.vendetta = false;
      if (e.acidDebuff > 0) e.acidDebuff -= dt;
      if (e.trailSlowT > 0) e.trailSlowT -= dt;
    }

    // Метрополітен: підземний тунель (3с) + попередження за 1.5с до виходу
    for (const tn of this.tunnels) {
      tn.t += dt;
      if (!tn.warned && tn.t >= (tn.dur - tn.warnTime)) {
        tn.warned = true;
        this.emit('metroWarn', { x: tn.bx, y: tn.by });
      }
      if (tn.t >= tn.dur) {
        tn.done = true;
        const mDef = getDef(tn.spawnToken || 'token_metro_robber');
        if (mDef) {
          this._spawnUnits(tn.side, mDef, tn.level, tn.bx, tn.by, { count: tn.spawnCount || 3, deployT: 0.25 });
        }
        this.emit('metroEmerge', { x: tn.bx, y: tn.by, side: tn.side });
      }
    }
    this.tunnels = this.tunnels.filter(tn => !tn.done);

    // Бочка з токсичними відходами: котиться по прямій 6.5 тайлів, відкидає наземних ворогів і спавнить слід
    for (const br of this.barrels) {
      const step = br.speed * dt;
      br.y += br.dir * step;
      br.dist += step;
      br.trailStep += step;
      // Спавн токсичної зони по сліду
      if (br.trailStep >= 1.1) {
        br.trailStep = 0;
        this.areas.push({
          side: br.side, x: br.x, y: br.y, r: 1.45, t: br.puddleDuration || 5.0, tick: 0.5,
          dps: br.puddleDps || 40, slowPct: br.slowPct || 0.15, kind: 'acid_trail',
        });
      }
      // Контакт з наземними юнітами ворога (повний імунітет у повітряних, будівель і веж)
      for (const e of this.entities) {
        if (!e.alive || e.side === br.side || e.flying || e.isBuilding || e.kind === 'tower') continue;
        if (br.hitSet.has(e.id)) continue;
        if (dist(e, br) <= 1.35 + e.r) {
          br.hitSet.add(e.id);
          this.damage(e, br.dmg, { splash: true, side: br.side });
          if (e.alive && !e.vehicle) {
            e.y = clamp(e.y + br.dir * (br.knockback || 1.1), 0.4, ARENA.H - 0.4);
            e.rampT = 0; // Knockback скидає таймер Ведмежатника!
          }
        }
      }
      if (br.dist >= br.maxDist || br.y < 0.5 || br.y > ARENA.H - 0.5) br.done = true;
    }
    this.barrels = this.barrels.filter(br => !br.done);

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
      } else if (a.kind === 'acid_trail') {
        // Слід від токсичної бочки: шкода раз на 0.5с + -15% швидкості руху (імунітет у повітря, будівель і веж)
        for (const e of this.entities) {
          if (!e.alive || e.side === a.side || e.flying || e.isBuilding || e.kind === 'tower') continue;
          if (dist(e, a) <= a.r + e.r * 0.5) e.trailSlowT = Math.max(e.trailSlowT || 0, 0.35);
        }
        if (a.tick <= 0 && a.t > -0.01) {
          a.tick += 0.5;
          for (const e of this.entities) {
            if (!e.alive || e.side === a.side || e.flying || e.isBuilding || e.kind === 'tower') continue;
            if (dist(e, a) <= a.r + e.r * 0.5) {
              this.damage(e, Math.round(a.dps * 0.5), { splash: true, side: a.side });
            }
          }
        }
      } else if (a.kind === 'acid') {
        // Кислотна калюжа: 35 DoT/с + -25% швидкості атак і шкоди
        for (const e of this.entities) {
          if (!e.alive || e.side === a.side || e.flying) continue;
          if (dist(e, a) <= a.r + e.r * 0.5) {
            e.acidDebuff = Math.max(e.acidDebuff || 0, 0.6);
            e.slowT = Math.max(e.slowT, 0.35);
          }
        }
        if (a.tick <= 0 && a.t > -0.01) {
          a.tick += 0.5;
          for (const e of this.entities) {
            if (!e.alive || e.side === a.side || e.flying) continue;
            if (dist(e, a) <= a.r + e.r * 0.5) {
              this.damage(e, Math.round(a.dps * 0.5), { splash: true, side: a.side });
            }
          }
          this.emit('acidTick', { x: a.x, y: a.y });
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

    // Пастки (Засідка в люку)
    for (const tr of this.traps) {
      if (tr.triggered) continue;
      for (const e of this.entities) {
        if (!e.alive || e.side === tr.side || e.flying || e.kind !== 'unit') continue;
        if (dist(e, tr) <= tr.r + e.r * 0.5) {
          tr.triggered = true;
          // Оглушення на 1с, підкидання і 90 шкоди
          e.stun = Math.max(e.stun, tr.stunDuration || 1.0);
          e.atkTimer = Math.max(e.atkTimer, 0.5);
          this.damage(e, tr.impactDmg || 90, { side: tr.side });
          // З люка вистрибують 2 гангстери з обрізами
          const mobDef = getDef(tr.spawnToken || 'token_sawn_off_mob');
          if (mobDef) {
            const spawned = this._spawnUnits(tr.side, mobDef, tr.level, tr.x, tr.y, { count: tr.spawnCount || 2, deployT: 0.25, silent: true });
            spawned.forEach((u, i) => { u.x += (i === 0 ? -0.4 : 0.4); });
          }
          this.emit('manholeTrigger', { x: tr.x, y: tr.y });
          break;
        }
      }
    }
    this.traps = this.traps.filter(tr => !tr.triggered);

    // Аури (Дон + Шеф поліції)
    const dons = this.entities.filter(e => e.alive && e.special === 'BUFF_ATK_SPEED_20' && e.deployT <= 0);
    const chiefs = this.entities.filter(e => e.alive && e.special === 'CHIEF_SHIELD_AURA' && e.deployT <= 0);
    for (const e of this.entities) {
      e.buffed = false;
      if (!e.alive || e.kind === 'tower') continue;
      for (const d of dons) if (d !== e && d.side === e.side && dist(d, e) <= CARD_MAP.unit_don.buffRadius) { e.buffed = true; break; }
      if (!e.chiefShielded && e.kind === 'unit') {
        for (const c of chiefs) {
          if (c.side === e.side && dist(c, e) <= (CARD_MAP.unit_police_chief.shieldRadius || 4.5)) {
            const sVal = statAtLevel(CARD_MAP.unit_police_chief.shieldAmount || 250, c.level || 1);
            e.shield = (e.shield || 0) + sVal;
            e.maxShield = Math.max(e.maxShield || 0, e.shield);
            e.chiefShielded = true;
            this.emit('chiefShield', { x: e.x, y: e.y, r: 1.2, side: e.side });
            break;
          }
        }
      }
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

    if (e.freeze > 0) { e.freeze -= dt; e.moving = false; e.rampT = 0; return; }
    if (e.stun > 0) { e.stun -= dt; e.moving = false; e.rampT = 0; return; }

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

    if (e.special === 'COUNTERFEIT_INFLATION') {
      // Підпільна друкарня: +1$ кожні 8 секунд
      e.incomeT = (e.incomeT || 8.0) - dt;
      if (e.incomeT <= 0) {
        e.incomeT += 8.0;
        this.sides[e.side].cash = Math.min(ECONOMY.maxCash, this.sides[e.side].cash + 1);
        this.emit('cashIncome', { side: e.side, x: e.x, y: e.y, amount: 1 });
      }
      return;
    }

    if (e.special === 'SPIKES_TRAP') {
      // Блокпост із шипами: періодична шкода + сповільнення, 3x шкода по техніці та збивання тарану
      e.tickT = (e.tickT || 0.5) - dt;
      if (e.tickT <= 0) {
        e.tickT += 0.5;
        for (const o of this.entities) {
          if (!o.alive || o.side === e.side || o.flying || o.kind !== 'unit') continue;
          if (dist(o, e) <= (e.r + o.r + 0.6)) {
            const isVehicleOrFast = o.vehicle || o.speed >= 2.0;
            const dmg = isVehicleOrFast ? 75 : 25;
            this.damage(o, dmg, { side: e.side, splash: true });
            o.slowT = Math.max(o.slowT, isVehicleOrFast ? 1.0 : 0.6);
            if (isVehicleOrFast) {
              e.hp -= e.maxHp * 0.25;
              this.emit('spikesHit', { x: o.x, y: o.y, vehicle: true });
              if (e.hp <= 0) { this.kill(e); return; }
            }
          }
        }
      }
      return;
    }

    if (e.special === 'BLIMP_AIR_CARRIER') {
      // Дирижабль: скидає 2 парашутистів шпани кожні 6 секунд прямо під себе
      e.dropT = (e.dropT || 6.0) - dt;
      if (e.dropT <= 0) {
        e.dropT += 6.0;
        const thugs = this._spawnUnits(e.side, CARD_MAP.unit_thugs, e.level, e.x, e.y, { count: 2, deployT: 0.5, silent: true });
        thugs.forEach((u, i) => { u.x += (i === 0 ? -0.4 : 0.4); });
        this.emit('blimpDrop', { x: e.x, y: e.y });
      }
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
    // Агенти ФБР: супроводжують Свідка (біжать трохи позаду нього і захищають від ворогів у радіусі)
    if (e.special === 'FBI_BODYGUARD' && e.followId) {
      const witness = this.entities.find(w => w.alive && w.id === e.followId);
      if (witness) {
        const dir = e.side === 'P' ? 1 : -1;
        const followPt = { x: witness.x, y: clamp(witness.y + 0.9 * dir, 0.5, ARENA.H - 0.5) };
        let threat = null, bd = Infinity;
        for (const o of this.entities) {
          if (!this.canTarget(e, o)) continue;
          const dw = dist(witness, o);
          if (dw <= 4.5 && dw < bd) { bd = dw; threat = o; }
        }
        if (threat && this.inRange(e, threat)) {
          e.moving = false;
          e.angle = Math.atan2(threat.y - e.y, threat.x - e.x);
          e.atkTimer -= dt;
          if (e.atkTimer <= 0) {
            e.atkTimer = e.atkSpeed;
            e.attackAnim = 0.18;
            this._attack(e, threat);
          }
        } else {
          // Рух за Свідком з його швидкістю
          const savedSpd = e.speed;
          e.speed = witness.speed;
          if (dist(e, followPt) > 0.4) this._move(e, followPt, dt);
          else e.moving = false;
          e.speed = savedSpd;
        }
        return;
      } else {
        e.followId = null;
      }
    }

    // Ведмежатник: нарощує таймер зламу поки атакує ту саму вежу/будівлю
    if (e.special === 'SAFECRACKER_RAMP') {
      if (e.target && e.target.alive && this.inRange(e, e.target)) {
        if (e.rampTargetId !== e.target.id) {
          e.rampTargetId = e.target.id;
          e.rampT = 0;
        } else {
          e.rampT += dt;
        }
      } else {
        e.rampT = 0;
        e.rampTargetId = null;
      }
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

    let dmg = Math.round(e.dmg * (e.vendetta ? 1.4 : 1));
    if (e.acidDebuff > 0) dmg = Math.round(dmg * 0.75); // Кислотний дебаф -25% шкоди

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
            o.rampT = 0;
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
    // Зенітка на пікапі: винищувач авіації (x2 шкода та зенітний розрив по повітрю)
    if (e.special === 'ANTI_AIR_BURST') {
      if (t.flying) {
        const flakDmg = Math.round(dmg * 2.0);
        this.emit('flakBurst', { x: t.x, y: t.y, tx: t.x, ty: t.y });
        this.damage(t, flakDmg, { side: e.side });
        for (const o of this.entities) {
          if (o === t || !this.canTarget(e, o) || !o.flying) continue;
          if (dist(o, t) <= (e.splash || 1.8)) this.damage(o, flakDmg, { splash: true, side: e.side });
        }
      } else {
        this.emit('shot', { id: e.id, shot: 'tommy', x: e.x, y: e.y, tx: t.x, ty: t.y, side: e.side });
        this.damage(t, dmg, { side: e.side });
      }
      return;
    }
    // Хімік із токсинами: кидає кислотну колбу, утворюючи калюжу на 4 секунди
    if (e.special === 'ACID_PUDDLE_DOT') {
      this.emit('shot', { id: e.id, shot: 'acid', x: e.x, y: e.y, tx: t.x, ty: t.y, side: e.side });
      this.damage(t, dmg, { side: e.side });
      this.areas.push({
        side: e.side,
        x: t.x,
        y: t.y,
        r: e.splash || 2.0,
        t: 4.0,
        tick: 0.5,
        dps: statAtLevel(35, e.level || 1),
        kind: 'acid',
      });
      this.emit('acidSplash', { x: t.x, y: t.y, r: e.splash || 2.0 });
      return;
    }
    const ranged = e.range >= 2 || e.kind === 'tower' || e.kind === 'building';
    if (ranged) {
      this.emit('shot', { id: e.id, shot: e.shot || 'pistol', x: e.x, y: e.y, tx: t.x, ty: t.y, side: e.side, tower: e.kind === 'tower', flying: e.flying });
      this.damage(t, dmg, { side: e.side, attacker: e });
      if (e.special === 'CONE_SPLASH') {
        for (const o of this.entities) {
          if (o === t || !this.canTarget(e, o)) continue;
          if (dist(o, t) <= e.splash) this.damage(o, dmg, { splash: true, side: e.side, attacker: e });
        }
      }
    } else {
      const dog = e.look && e.look.type === 'dog';
      // Бульдозер: x2 шкода по будівлях та вежах! Ведмежатник: 100% -> 250% -> 500%!
      let finalDmg = (e.special === 'DOUBLE_BLDG_DMG' && t.isBuilding) ? dmg * 2 : dmg;
      if (e.special === 'SAFECRACKER_RAMP') {
        const rampMult = e.rampT >= 4.0 ? 5.0 : e.rampT >= 2.0 ? 2.5 : 1.0;
        finalDmg = Math.round(dmg * rampMult);
      }
      this.emit('melee', { id: e.id, x: e.x, y: e.y, tx: t.x, ty: t.y, dog });
      // Викидайло: кожен 3-й удар завдає 1.5x шкоди по площі (радіус 2.0)
      if (e.special === 'CLEAVE_EVERY_3_HITS') {
        e.hitCount = (e.hitCount || 0) + 1;
        if (e.hitCount % 3 === 0) {
          const cleaveDmg = Math.round(finalDmg * 1.5);
          this.emit('bouncerCleave', { x: t.x, y: t.y, r: 2.0 });
          this.damage(t, cleaveDmg, { side: e.side, attacker: e });
          for (const o of this.entities) {
            if (o === t || !this.canTarget(e, o)) continue;
            if (dist(o, t) <= 2.0) this.damage(o, cleaveDmg, { splash: true, side: e.side, attacker: e });
          }
          return;
        }
      }
      this.damage(t, finalDmg, { side: e.side, attacker: e });
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
    const spd = e.speed * (e.slowT > 0 ? 0.65 : 1) * (e.trailSlowT > 0 ? 0.85 : 1);
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
    const solids = this.entities.filter(e => e.alive && !e.untargetable && e.special !== 'SPIKES_TRAP' && (e.kind === 'tower' || e.kind === 'building'));
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
