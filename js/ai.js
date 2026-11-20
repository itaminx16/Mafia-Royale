// =====================================================================
//  AI — розумний бот-суперник (аркуш 6: bot_rules)
//  1) Накопичення 6-8$: Танк спереду, Стрілець позаду
//  2) Контратака: >=3 дрібних юнітів на його половині -> Молотов / Томмі-ган
//  3) Захист: Барикада / SWAT перед вежею, якщо її атакують
//  Бот грає за тими ж правилами Готівки, що й гравець (без чітів).
// =====================================================================
import { ARENA, CARD_MAP, CARDS, BOT_ARCHETYPES, LEVEL_MAX, TOWERS } from './data.js';

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Bot {
  constructor(game, side = 'E', difficulty = 0) {
    this.g = game;
    this.side = side;
    this.enemy = side === 'E' ? 'P' : 'E';
    this.diff = clamp(difficulty, 0, 4);
    this.think = 2.5 + Math.random();          // перші секунди — "оцінює" суперника
    this.threshold = this._rollThreshold();
    this.followUp = null;
  }

  _rollThreshold() { return Math.round(rnd(6, 8)); }
  // Перетворення координат: логіка пишеться так, ніби бот зверху (сторона E)
  Y(y) { return this.side === 'E' ? y : ARENA.H - y; }
  fromY(y) { return this.side === 'E' ? y : ARENA.H - y; }
  get sd() { return this.g.sides[this.side]; }

  reaction() {
    const base = [1.3, 1.05, 0.85, 0.7, 0.55][this.diff];
    return base * rnd(0.75, 1.25);
  }

  update(dt) {
    if (this.g.over) return;
    this.think -= dt;
    if (this.think > 0) return;
    this.think = this.reaction();
    try { this.decide(); } catch (err) { console.warn('bot error', err); }
  }

  hand() {
    return this.sd.hand.map((id, i) => ({ id, i, def: CARD_MAP[id] }));
  }
  affordable(c) { return c && this.sd.cash >= c.def.cost; }

  play(card, x, y) {
    if (!card) return false;
    // Підганяємо точку до дозволеної зони
    let yy = y;
    for (let k = 0; k < 12; k++) {
      if (this.g.canDeployAt(this.side, card.id, x, yy)) break;
      yy = this.fromY(this.Y(yy) - 0.7);
    }
    const ok = this.g.playCard(this.side, card.i, clamp(x, 0.6, ARENA.W - 0.6), yy);
    return ok;
  }

  myTowers() { return Object.values(this.sd.towers).filter(t => t.alive); }
  enemyTowers() { return Object.values(this.g.sides[this.enemy].towers).filter(t => t.alive); }

  decide() {
    const g = this.g;
    const hand = this.hand();
    const cash = this.sd.cash;
    const enemies = g.entities.filter(e => e.alive && e.side === this.enemy && e.kind === 'unit' && !e.stealth);
    const threats = enemies.filter(e => this.Y(e.y) < ARENA.riverY1 + 1.5);
    const my = g.entities.filter(e => e.alive && e.side === this.side && e.kind === 'unit');

    // ---------- Запланований стрілець позаду танка ----------
    if (this.followUp && g.time >= this.followUp.at) {
      const fu = this.followUp;
      const shooter = hand.find(c => ['shooter', 'support', 'control'].includes(c.def.aiRole) && this.affordable(c));
      if (shooter) {
        const tank = g.entities.find(e => e.id === fu.tankId && e.alive);
        const tx = tank ? tank.x : fu.x;
        const ty = tank ? this.fromY(Math.max(1.5, this.Y(tank.y) - 2.5)) : this.fromY(10);
        if (this.play(shooter, tx, ty)) { this.followUp = null; return; }
      }
      if (g.time > fu.at + 4) this.followUp = null;
    }

    // ---------- 2) Контратака по натовпу ----------
    const small = threats.filter(e => e.maxHp <= 320);
    if (small.length >= 3) {
      const c = this._cluster(small, 2.5);
      if (c.n >= 3) {
        const mol = hand.find(h => (h.id === 'spell_molotov' || h.id === 'spell_teargas') && this.affordable(h));
        if (mol && this.play(mol, c.x, c.y)) return;
        const tommy = hand.find(h => (h.id === 'unit_tommy' || h.id === 'unit_arsonist' || h.id === 'unit_croupier') && this.affordable(h));
        if (tommy && this.play(tommy, c.x, this.fromY(Math.max(1.5, this.Y(c.y) - 3)))) return;
        const splash = hand.find(h => (h.id === 'bldg_barricade' || h.id === 'unit_medic') && this.affordable(h));
        if (splash && this.play(splash, c.x, this.fromY(Math.max(2, this.Y(c.y) - 2.5)))) return;
      }
    }

    // ---------- 3) Захист ----------
    if (threats.length) {
      const danger = threats
        .map(e => ({ e, score: this._dangerScore(e) }))
        .sort((a, b) => b.score - a.score)[0];
      const t = danger.e;
      const tower = this._nearestMyTower(t);
      const underAttack = tower && dist(t, tower) < tower.range + 2.5;
      const urgent = underAttack || this.Y(t.y) < 12;
      if (urgent || cash >= 5) {
        if (this._defend(t, tower, hand, threats)) return;
      }
    }

    // ---------- Закляття-добивання ----------
    for (const tw of this.enemyTowers()) {
      const sn = hand.find(h => h.id === 'spell_sniper_shot' && this.affordable(h));
      if (sn && tw.hp <= 165 * 1.1) { if (this.play(sn, tw.x, tw.y)) return; }
      const mol = hand.find(h => h.id === 'spell_molotov' && this.affordable(h));
      if (mol && tw.hp <= 77 + 70 * 4 * 0.35 + 10) { if (this.play(mol, tw.x, tw.y)) return; }
    }

    // ---------- Хабар: заморозити вежу, яку б'ють наші ----------
    const bribe = hand.find(h => h.id === 'spell_bribe' && this.affordable(h));
    if (bribe) {
      for (const tw of this.enemyTowers()) {
        const attackers = my.filter(u => dist(u, tw) < tw.r + 2.5);
        if (attackers.length >= 2 || attackers.some(u => u.maxHp > 900)) { if (this.play(bribe, tw.x, tw.y)) return; }
      }
    }

    // ---------- Молотов по скупченню ворогів біля їхньої вежі (цінність) ----------
    const molV = hand.find(h => h.id === 'spell_molotov' && this.affordable(h));
    if (molV && enemies.length >= 3) {
      const c = this._cluster(enemies, 3);
      if (c.n >= 3 && c.hp >= 700) { if (this.play(molV, c.x, c.y)) return; }
    }

    // ---------- Закляття «Вендета»: підсилити власний пуш ----------
    const vend = hand.find(h => h.id === 'spell_vendetta' && this.affordable(h));
    if (vend && my.length >= 2) {
      const push = my.filter(u => this.Y(u.y) > ARENA.riverY0 - 1);
      if (push.length >= 2) {
        const c = this._cluster(push, 3.5);
        if (c.n >= 2 && this.play(vend, c.x, c.y)) return;
      }
    }

    // ---------- 1) Накопичення та атака ----------
    if (cash >= this.threshold) {
      const lane = this._attackLane();
      const bx = lane === 'L' ? ARENA.bridges[0].cx : ARENA.bridges[1].cx;
      const tank = hand.find(h => h.def.aiRole === 'tank' && this.affordable(h));
      if (tank) {
        const y = tank.id === 'unit_don' ? 11 : 13.6;
        if (this.play(tank, bx, this.fromY(y))) {
          const placed = g.entities.filter(e => e.side === this.side && e.cardId === tank.id).pop();
          this.followUp = { at: g.time + rnd(0.8, 1.6), x: bx, tankId: placed && placed.id };
          this.threshold = this._rollThreshold();
          return;
        }
      }
      // Швидкий натиск, якщо лінія порожня
      const defenders = enemies.filter(e => this.Y(e.y) > ARENA.riverY1);
      const rush = hand.find(h => ['rush', 'swarm', 'assassin', 'air'].includes(h.def.aiRole) && this.affordable(h));
      if (rush && defenders.length === 0) {
        if (this.play(rush, bx, this.fromY(14))) { this.threshold = this._rollThreshold(); return; }
      }
      // Будівля-спавнер у тилу
      const spawner = hand.find(h => h.def.aiRole === 'building_spawn' && this.affordable(h));
      if (spawner && cash >= 7) {
        if (this.play(spawner, lane === 'L' ? 6 : 12, this.fromY(9))) { this.threshold = this._rollThreshold(); return; }
      }
    }

    // ---------- Не дати Готівці "згоріти" на максимумі ----------
    if (cash >= 9.6) {
      const units = hand.filter(h => h.def.kind === 'unit' && this.affordable(h)).sort((a, b) => b.def.cost - a.def.cost);
      const c = units[0] || hand.find(h => h.def.kind === 'building' && h.def.aiRole !== 'building_def' && this.affordable(h));
      if (c) {
        const lane = this._attackLane();
        const x = lane === 'L' ? 3.5 : 14.5;
        // важкі юніти — ззаду (накопичити штовханину), швидкі — на міст
        const y = c.def.aiRole === 'tank' ? 4 : (c.def.aiRole === 'shooter' ? 9 : 13);
        this.play(c, x, this.fromY(y));
      }
    }
  }

  _dangerScore(e) {
    const def = CARD_MAP[e.cardId] || {};
    let s = e.hp + e.dmg * 4;
    if (e.targets === 'BUILDINGS_ONLY') s *= 1.4;
    if (def.aiRole === 'tank') s *= 1.2;
    s *= 1 + (ARENA.riverY1 - this.Y(e.y)) / 15;
    return s;
  }

  _nearestMyTower(e) {
    let best = null, bd = Infinity;
    for (const t of this.myTowers()) { const d = dist(e, t); if (d < bd) { bd = d; best = t; } }
    return best;
  }

  _cluster(list, r) {
    let best = { n: 0, x: 0, y: 0, hp: 0 };
    for (const a of list) {
      let n = 0, sx = 0, sy = 0, hp = 0;
      for (const b of list) if (dist(a, b) <= r) { n++; sx += b.x; sy += b.y; hp += b.hp; }
      if (n > best.n) best = { n, x: sx / n, y: sy / n, hp };
    }
    return best;
  }

  _attackLane() {
    const et = this.g.sides[this.enemy].towers;
    if (this.sd.pocket.L && et.K.alive) return 'L';
    if (this.sd.pocket.R && et.K.alive) return 'R';
    if (!et.L.alive) return 'L';
    if (!et.R.alive) return 'R';
    if (Math.abs(et.L.hp - et.R.hp) > 150) return et.L.hp < et.R.hp ? 'L' : 'R';
    if (!this._laneMem || Math.random() < 0.15) this._laneMem = Math.random() < 0.5 ? 'L' : 'R';
    return this._laneMem;
  }

  _defend(t, tower, hand, threats) {
    const aff = hand.filter(h => this.affordable(h) && h.def.kind !== 'spell');
    if (!aff.length && !hand.some(h => h.def.kind === 'spell' && this.affordable(h))) return false;
    const ty = this.Y(t.y);
    const txLane = t.x < ARENA.W / 2 ? 'L' : 'R';
    const towerP = tower || this.sd.towers.K;

    // Танк, що йде на будівлі -> Барикада по центру, щоб відтягнути
    if (t.targets === 'BUILDINGS_ONLY' && t.maxHp > 500) {
      const bar = aff.find(h => h.id === 'bldg_barricade');
      if (bar) {
        const x = txLane === 'L' ? 7.2 : 10.8;
        if (this.play(bar, x, this.fromY(clamp(ty - 3.5, 8, 11.5)))) return true;
      }
    }
    // Повітряна ціль -> ті, хто б'є ALL
    if (t.flying) {
      const aa = aff.filter(h => h.def.targets === 'ALL' && h.def.kind === 'unit').sort((a, b) => a.def.cost - b.def.cost)[0];
      if (aa) return this.play(aa, towerP.x, this.fromY(Math.max(1.5, this.Y(towerP.y) - 1.5)));
      const sn = hand.find(h => h.id === 'spell_sniper_shot' && this.affordable(h));
      if (sn && t.hp <= 480 * 1.2) return this.play(sn, t.x, t.y);
      const bar = aff.find(h => h.id === 'bldg_barricade');
      if (bar) return this.play(bar, towerP.x, this.fromY(this.Y(towerP.y) + 2.5));
      return false;
    }
    // Небезпечний стрілець/лікар — снайпер
    const def = CARD_MAP[t.cardId] || {};
    if (['shooter', 'support', 'control'].includes(def.aiRole) && t.hp <= 480 * 1.1) {
      const sn = hand.find(h => h.id === 'spell_sniper_shot' && this.affordable(h));
      if (sn) return this.play(sn, t.x, t.y);
    }
    // Великий натиск біля вежі -> Хабар
    const nearTower = threats.filter(e => dist(e, towerP) < towerP.range + 1);
    const pushHp = nearTower.reduce((s, e) => s + e.hp, 0);
    if (pushHp > 1600) {
      const br = hand.find(h => h.id === 'spell_bribe' && this.affordable(h));
      if (br) { const c = this._cluster(nearTower, 3); return this.play(br, c.x, c.y); }
    }
    // SWAT / Барикада перед вежею
    const swat = aff.find(h => h.id === 'unit_swat');
    if (swat && (t.maxHp > 400 || threats.length >= 2)) {
      return this.play(swat, t.x * 0.6 + towerP.x * 0.4, this.fromY(clamp(ty - 1.5, 2, 14.5)));
    }
    // Загальний вибір: дешеві бійці ближнього бою на ціль, стрільці за вежею
    const melee = aff.filter(h => h.def.kind === 'unit' && h.def.range < 2 && h.def.targets !== 'BUILDINGS_ONLY')
      .sort((a, b) => this._counterValue(b, t) - this._counterValue(a, t))[0];
    const ranged = aff.filter(h => h.def.kind === 'unit' && h.def.range >= 2)
      .sort((a, b) => this._counterValue(b, t) - this._counterValue(a, t))[0];
    const pickRanged = ranged && (!melee || this._counterValue(ranged, t) > this._counterValue(melee, t));
    if (pickRanged) {
      return this.play(ranged, towerP.x + (towerP.x < 9 ? 1 : -1), this.fromY(Math.max(1.5, this.Y(towerP.y) - 1.8)));
    }
    if (melee) {
      // Ставимо між ціллю та вежею, трохи збоку
      const x = t.x * 0.7 + towerP.x * 0.3;
      const y = this.fromY(clamp(ty - 1.8, 1.5, 14.5));
      return this.play(melee, x, y);
    }
    const bar = aff.find(h => h.id === 'bldg_barricade');
    if (bar && ty < 13) return this.play(bar, towerP.x, this.fromY(this.Y(towerP.y) + 3));
    // Якщо нічого не підходить, а Готівка повна — кидаємо будь-якого юніта
    const anyUnit = aff.find(h => h.def.kind === 'unit');
    if (anyUnit && this.sd.cash >= 8) return this.play(anyUnit, t.x, this.fromY(clamp(ty - 2, 1.5, 14.5)));
    return false;
  }

  _counterValue(card, t) {
    const d = card.def;
    let v = d.dmg / Math.max(0.5, d.atkSpeed || 1) * (d.count || 1);
    if (t.maxHp > 900 && (d.aiRole === 'swarm' || d.id === 'unit_detective')) v *= 1.6;   // натовп проти танка
    if (t.maxHp <= 320 && d.splash > 0) v *= 1.8;
    if (t.maxHp <= 320 && d.count > 1) v *= 1.2;
    if (d.id === 'unit_lawyer') v *= 1.4;
    v /= d.cost;
    return v + Math.random() * 3;
  }
}

// Колода бота, збалансована за ролями (танк, стрілець, натовп, захист, закляття)
export function makeBotDeck() {
  const pools = {
    tank: ['unit_bouncer', 'unit_armored_van', 'unit_don'],
    shooter: ['unit_hitman', 'unit_tommy', 'unit_lawyer', 'unit_medic'],
    swarm: ['unit_thugs', 'unit_k9', 'unit_detective', 'unit_biker', 'unit_drone'],
    def: ['bldg_barricade', 'unit_swat', 'bldg_casino_spawner'],
    spell: ['spell_molotov', 'spell_bribe', 'spell_sniper_shot'],
  };
  const pick = (arr, n, out) => {
    const a = arr.filter(x => !out.includes(x)).sort(() => Math.random() - 0.5);
    out.push(...a.slice(0, n));
  };
  const deck = [];
  pick(pools.tank, 2, deck);
  pick(pools.shooter, 2, deck);
  pick(pools.swarm, 2, deck);
  pick(pools.def, 1, deck);
  pick(pools.spell, 1, deck);
  // гарантуємо Молотов або Томмі-ган для контратак (правило 2)
  if (!deck.includes('spell_molotov') && !deck.includes('unit_tommy')) deck[deck.length - 1] = 'spell_molotov';
  // гарантуємо Барикаду або SWAT (правило 3)
  if (!deck.includes('bldg_barricade') && !deck.includes('unit_swat')) deck[6] = Math.random() < 0.5 ? 'bldg_barricade' : 'unit_swat';
  const uniq = [...new Set(deck)];
  for (const c of CARDS) { if (uniq.length >= 8) break; if (!uniq.includes(c.id)) uniq.push(c.id); }
  return uniq.slice(0, 8);
}

// =====================================================================
//  АДАПТИВНИЙ ПІДБІР БОТА (рівні карт, архетип колоди та складність AI)
//  Бот завжди тримається близько до середнього рівня колоди гравця,
//  щоб не бути ні занадто слабким, ні нечесно сильним на будь-якій арені.
// =====================================================================
export function computeBotMatchup(playerAvgLevel, trophies, arenaIdx, mode = 'ranked', recentResults = []) {
  // 1) Рівень карт бота: точно відповідає середньому рівню колоди гравця (чесний баланс)
  const baseLv = Math.max(1, Math.min(LEVEL_MAX, Math.round(playerAvgLevel)));
  const levels = {};
  for (const c of CARDS) {
    let lv = baseLv;
    const r = Math.random();
    if (r < 0.14 && lv > 1) lv -= 1;
    else if (r > 0.90 && trophies >= 200 && lv < LEVEL_MAX) lv += 1;
    levels[c.id] = lv;
  }

  // 2) Динамічний MMR за останніми 6 боями (щоб бот ніколи не був занадто слабким чи неможливим)
  const last = Array.isArray(recentResults) ? recentResults.slice(-6) : [];
  let formDelta = 0;
  const wins = last.filter(x => x === 'W').length;
  const losses = last.filter(x => x === 'L').length;
  if (last.length >= 3 && wins >= last.length - 1) formDelta = 1;       // серія перемог -> бот зібраніший
  else if (last.length >= 2 && losses >= last.length - 1) formDelta = -1; // серія поразок -> трохи спокійніший темп

  const trophyTier = Math.min(4, Math.floor(trophies / 180));
  const difficulty = Math.max(0, Math.min(4, Math.round((arenaIdx + trophyTier) / 2) + formDelta));

  // 3) Логічні синергійні колоди (80% тактичний архетип, 20% збалансована збірка)
  if (mode !== 'draft' && Math.random() < 0.80) {
    const arch = BOT_ARCHETYPES[Math.floor(Math.random() * BOT_ARCHETYPES.length)];
    return {
      name: arch.name,
      style: arch.style,
      tower: arch.tower,
      deck: [...arch.deck],
      levels,
      difficulty,
    };
  }
  return {
    name: 'Вуличний Синдикат',
    style: 'Збалансована тактика',
    tower: TOWERS[Math.floor(Math.random() * TOWERS.length)].id,
    deck: makeBotDeck(),
    levels,
    difficulty,
  };
}
