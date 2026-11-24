// =====================================================================
//  MAFIA ROYALE — DATA (v0.5.0)
//  - 10 нових карт (Рикошет, Блокпост-шипи, Засідка в люку, Друкарня,
//    Контрабандний дирижабль, Зенітка ППО, Хімік, Патрульний, Шеф поліції, Аварія)
//  - Підвищена потужність Вишибали (сплеш-удар 1.5x кожен 3-й удар)
//  - Збільшені фігурки юнітів (+55% масштабу), чітко видно всі деталі
//  - 21 Арена з унікальними тактичними особливостями та погодою
//  - Башні не можуть стріляти за свою половину арени (лінія річки)
//  - 5 збережених слотів колод із швидким перемиканням
// =====================================================================

export const VERSION = '0.5.0';

// ---------- Рідкість ----------
export const RARITY = {
  common:    { id: 'common',    name: 'Звичайна',    color: '#4B5563', color2: '#374151', price: 25 },
  rare:      { id: 'rare',      name: 'Рідкісна',    color: '#1D4ED8', color2: '#1E3A8A', price: 80 },
  epic:      { id: 'epic',      name: 'Епічна',      color: '#6D28D9', color2: '#4C1D95', price: 250 },
  legendary: { id: 'legendary', name: 'Легендарна',  color: '#D97706', color2: '#92400E', price: 800 },
};

export const SPEED_CODES = {
  STATIC: 0, SLOW: 1.0, MEDIUM: 1.5, FAST: 2.0, VERY_FAST: 2.5, INSTANT: 0,
};

// ---------- Арена (Головна вежа зсунута вперед, позаду ~3 тайли для висадки!) ----------
export const ARENA = {
  W: 18,
  H: 32,
  riverY0: 15,
  riverY1: 17,
  bridges: [
    { x0: 2, x1: 5, cx: 3.5 },
    { x0: 13, x1: 16, cx: 14.5 },
  ],
  towers: {
    P: { king: { x: 9, y: 27.2 }, L: { x: 3.5, y: 24.4 }, R: { x: 14.5, y: 24.4 } },
    E: { king: { x: 9, y: 4.8 },  L: { x: 3.5, y: 7.6 },  R: { x: 14.5, y: 7.6 } },
  },
  kingRadius: 1.9,
  princessRadius: 1.45,
  pocketDepth: 5,
};

// ---------- Економіка бою (4 фази: 1хв x1 -> 2хв x1.35 -> 3хв x2 -> Дод. час x3) ----------
export const ECONOMY = {
  maxCash: 10,
  startCash: 5,
  regenPerSec: 0.4,
  min1Mult: 1.0,
  min2Mult: 1.35,
  min3Mult: 2.0,
  extraTimeMult: 3.0,
  phase2At: 60,
  overtimeAt: 120,
  matchTime: 180,
  extraMatchTime: 240,
  deployTime: 1.0,
};

// ---------- Прогресія рівнів карт (1 -> 6) ----------
export const LEVEL_MAX = 6;
export const LEVEL_STAT_MULT = 1.10;
export const UPGRADE_COST = {
  2: { cards: 2,  gold: 50 },
  3: { cards: 5,  gold: 150 },
  4: { cards: 10, gold: 400 },
  5: { cards: 20, gold: 1000 },
  6: { cards: 50, gold: 2500 },
};
export function statAtLevel(base, level) {
  return Math.round(base * Math.pow(LEVEL_STAT_MULT, (level || 1) - 1));
}

// =====================================================================
//  КАРТИ — 26 шт. (18 базових + 8 нових), план до 150 карт (30 / арену)
// =====================================================================
export const CARDS = [
  // --- Арена 1: Бідний квартал ---
  {
    id: 'unit_bouncer', name: 'Викидайло', kind: 'unit', role: 'Ближній бій', rarity: 'common', unlockArena: 1,
    cost: 4, count: 1, hp: 1850, shield: 0, dmg: 125, atkSpeed: 1.5, speedCode: 'SLOW', speed: 1.0,
    range: 1, splash: 0, targets: 'BUILDINGS_ONLY', special: 'CLEAVE_EVERY_3_HITS',
    size: 0.65, sight: 7, aiRole: 'tank',
    desc: 'Колишній боксер у важкій вазі. Ігнорує дрібних ворогів і йде прямо ламати вежі, а кожен 3-й удар завдає 1.5x шкоди по площі!',
    look: { type: 'human', body: '#27272a', skin: '#c99a76', hat: 'bald', weapon: 'fists', scale: 1.28, shades: true },
  },
  {
    id: 'unit_thugs', name: 'Вулична шпана', kind: 'unit', role: 'Масовка', rarity: 'common', unlockArena: 1,
    cost: 2, count: 4, hp: 120, shield: 0, dmg: 45, atkSpeed: 1.0, speedCode: 'VERY_FAST', speed: 2.4,
    range: 1, splash: 0, targets: 'GROUND', special: 'SWARM_4',
    size: 0.36, sight: 5.5, aiRole: 'swarm',
    desc: 'Четверо зухвалих хлопців із битами та кастетами. Дешево, швидко і дуже боляче, якщо не зупинити вчасно.',
    look: { type: 'human', body: '#78512b', skin: '#d8a982', hat: 'cap', hatColor: '#404040', weapon: 'bat', scale: 0.84 },
  },
  {
    id: 'unit_hitman', name: 'Кілер', kind: 'unit', role: 'Стрілець', rarity: 'rare', unlockArena: 1,
    cost: 4, count: 1, hp: 440, shield: 0, dmg: 165, atkSpeed: 1.2, speedCode: 'MEDIUM', speed: 1.5,
    range: 6.5, splash: 0, targets: 'ALL', special: 'NONE',
    size: 0.44, sight: 7.5, aiRole: 'shooter', shot: 'sniper',
    desc: 'Професіонал у плащі зі снайперською гвинтівкою. Знімає цілі здалеку, але в ближньому бою беззахисний.',
    look: { type: 'human', body: '#1f1d1b', skin: '#e0b48f', hat: 'fedora', hatColor: '#111111', weapon: 'rifle', coat: true, shades: true },
  },
  {
    id: 'unit_biker', name: 'Байкер-підривник', kind: 'unit', role: 'Камікадзе', rarity: 'common', unlockArena: 1,
    cost: 2, count: 1, hp: 240, shield: 0, dmg: 320, atkSpeed: 0, speedCode: 'VERY_FAST', speed: 2.6,
    range: 1, splash: 2.0, targets: 'BUILDINGS_ONLY', special: 'SUICIDE_EXPLOSION',
    deathDmg: 220, // Посмертний вибух, якщо його вбили по дорозі!
    size: 0.48, sight: 7, aiRole: 'rush', vehicle: true,
    desc: 'Мчить на мотоциклі з динамітом у ворожу вежу. Навіть якщо його вбити по дорозі — динаміт вибухає і б\'є ворогів поруч!',
    look: { type: 'bike', body: '#222', skin: '#d8a982', tank: '#dc2626' },
  },
  {
    id: 'unit_k9', name: 'Кінолог із вівчарками', kind: 'unit', role: 'Загін 1+2', rarity: 'common', unlockArena: 1,
    cost: 3, count: 3, hp: 210, shield: 0, dmg: 65, atkSpeed: 0.9, speedCode: 'FAST', speed: 2.1,
    range: 1, splash: 0, targets: 'GROUND', special: 'NONE',
    size: 0.4, sight: 5.5, aiRole: 'swarm',
    desc: 'Офіцер і дві службові собаки. Швидко наздоганяють і розривають одиночних цілей.',
    look: { type: 'human', body: '#1e3a5f', skin: '#d8a982', hat: 'cap', hatColor: '#0f1f33', weapon: 'baton' },
    squadLooks: [null, { type: 'dog', body: '#855834', dark: '#2a1a0e' }, { type: 'dog', body: '#6b4423', dark: '#2a1a0e' }],
  },
  {
    id: 'unit_arsonist', name: 'Підпалювач', kind: 'unit', role: 'Вогнемет-сплеш', rarity: 'rare', unlockArena: 1,
    cost: 4, count: 1, hp: 620, shield: 0, dmg: 95, atkSpeed: 0.9, speedCode: 'MEDIUM', speed: 1.5,
    range: 2.8, splash: 1.6, targets: 'GROUND', special: 'FLAME_CONE',
    size: 0.46, sight: 5.5, aiRole: 'shooter', shot: 'flame',
    desc: 'Озброєний вогнеметом ближнього сплешу. Миттєво випалює натовпи шпани та собак перед собою.',
    look: { type: 'human', body: '#7c2d12', skin: '#d8a982', hat: 'mask', hatColor: '#292524', weapon: 'flamer', tank: '#ea580c' },
  },
  {
    id: 'spell_molotov', name: 'Коктейль Молотова', kind: 'spell', role: 'Урон по площі', rarity: 'rare', unlockArena: 1,
    cost: 4, count: 0, hp: 0, shield: 0, dmg: 220, atkSpeed: 4, speedCode: 'INSTANT', speed: 0,
    range: 99, splash: 3.5, targets: 'ALL', special: 'BURN_50_DPS_4S',
    towerPct: 0.35, burnDps: 50, burnTime: 4, flightTime: 0.6,
    aiRole: 'spell_aoe',
    desc: 'Вибухає та залишає вогняну калюжу на 4 секунди. Знищує натовпи ворогів.',
  },
  {
    id: 'spell_sniper_shot', name: 'Постріл із даху', kind: 'spell', role: 'Точковий урон', rarity: 'common', unlockArena: 1,
    cost: 3, count: 0, hp: 0, shield: 0, dmg: 480, atkSpeed: 0, speedCode: 'INSTANT', speed: 0,
    range: 99, splash: 1.5, targets: 'ALL', special: 'TOWER_DMG_35_PCT',
    towerDmg: 165, flightTime: 0.4,
    aiRole: 'spell_pick',
    desc: 'Точний постріл снайпера в обрану точку. Миттєво прибирає небезпечного стрільця або лікаря.',
  },
  {
    id: 'bldg_barricade', name: 'Барикада з кулеметом', kind: 'building', role: 'Захисна', rarity: 'common', unlockArena: 1,
    cost: 3, count: 1, hp: 720, shield: 0, dmg: 65, atkSpeed: 0.8, speedCode: 'STATIC', speed: 0,
    range: 5.5, splash: 0, targets: 'ALL', special: 'LIFETIME_35S',
    lifetime: 35, size: 0.92, aiRole: 'building_def', shot: 'mg',
    desc: 'Мішки з піском і станковий кулемет. Відволікає ворожих танків на себе.',
  },

  // --- Арена 2: Нічний порт ---
  {
    id: 'unit_swat', name: 'Бійці SWAT', kind: 'unit', role: 'Щитовики', rarity: 'rare', unlockArena: 2,
    cost: 3, count: 2, hp: 300, shield: 250, dmg: 75, atkSpeed: 1.2, speedCode: 'MEDIUM', speed: 1.5,
    range: 1.2, splash: 0, targets: 'GROUND', special: 'SHIELD_ABSORB',
    size: 0.45, sight: 5.5, aiRole: 'defender',
    desc: 'Броньовані спецпризначенці. Щит поглинає перший потужний удар, навіть вибух.',
    look: { type: 'human', body: '#1e293b', skin: '#c99a76', hat: 'helmet', hatColor: '#0f172a', weapon: 'shield' },
  },
  {
    id: 'unit_drone', name: 'Поліцейський дрон', kind: 'unit', role: 'Повітряний', rarity: 'rare', unlockArena: 2,
    cost: 3, count: 1, hp: 340, shield: 0, dmg: 85, atkSpeed: 1.0, speedCode: 'FAST', speed: 2.0,
    range: 4, splash: 0, targets: 'ALL', special: 'FLYING', flying: true,
    size: 0.46, sight: 6, aiRole: 'air', shot: 'mg',
    desc: 'Літаючий дрон із кулеметом. Наземні бійці з битами та ножами не можуть його дістати.',
    look: { type: 'drone', body: '#1e293b', light: '#3b82f6' },
  },
  {
    id: 'unit_heli', name: 'Поліцейський вертоліт', kind: 'unit', role: 'Важка авіація', rarity: 'epic', unlockArena: 2,
    cost: 6, count: 1, hp: 1180, shield: 0, dmg: 115, atkSpeed: 1.0, speedCode: 'SLOW', speed: 1.15,
    range: 4.8, splash: 0, targets: 'ALL', special: 'FLYING', flying: true,
    size: 0.68, sight: 6.5, aiRole: 'air', shot: 'tommy',
    desc: 'Важкий броньований гелікоптер із бортовим кулеметом. Домінує в небі й тримає багато влучань.',
    look: { type: 'heli', body: '#1e3a8a', accent: '#f8fafc' },
  },
  {
    id: 'unit_detective', name: 'Детектив під прикриттям', kind: 'unit', role: 'Скритний вбивця', rarity: 'epic', unlockArena: 2,
    cost: 3, count: 1, hp: 520, shield: 0, dmg: 140, atkSpeed: 1.1, speedCode: 'FAST', speed: 2.0,
    range: 1.2, splash: 0, targets: 'GROUND', special: 'STEALTH_UNTIL_HIT',
    size: 0.43, sight: 6, aiRole: 'assassin',
    desc: 'Підкрадається непоміченим. Вороги та вежі не бачать його, поки він не зробить перший удар.',
    look: { type: 'human', body: '#8a7350', skin: '#e0b48f', hat: 'fedora', hatColor: '#5b4a33', weapon: 'knife', coat: true, shades: true },
  },
  {
    id: 'spell_teargas', name: 'Сльозогінний газ', kind: 'spell', role: 'Газ + Уповільнення', rarity: 'rare', unlockArena: 2,
    cost: 3, count: 0, hp: 0, shield: 0, dmg: 45, atkSpeed: 5, speedCode: 'INSTANT', speed: 0,
    range: 99, splash: 3.5, targets: 'ALL', special: 'TEARGAS_SLOW_5S',
    gasDps: 45, gasTime: 5, slowPct: 0.35, towerPct: 0.35, flightTime: 0.45,
    aiRole: 'spell_aoe',
    desc: 'Накриває зону їдкою хмарою на 5 сек: знижує швидкість руху й атаки ворогів на 35% і завдає шкоди.',
  },

  // --- Арена 3: Центр міста (Даунтаун) ---
  {
    id: 'unit_armored_van', name: 'Броньований інкасатор', kind: 'unit', role: 'Таран + Спавн', rarity: 'rare', unlockArena: 3,
    cost: 4, count: 1, hp: 950, shield: 0, dmg: 360, atkSpeed: 0, speedCode: 'VERY_FAST', speed: 2.5,
    range: 1, splash: 1.5, targets: 'BUILDINGS_ONLY', special: 'RAM_AND_SPAWN_2_GUARDS',
    spawnToken: 'token_guard', spawnCount: 2,
    size: 0.75, sight: 7, aiRole: 'tank', vehicle: true,
    desc: 'Розганяється по вулиці та врізається у ворожу вежу. Після аварії з фургона вибігають 2 охоронці.',
    look: { type: 'van', body: '#4b5d43', stripe: '#d4af37' },
  },
  {
    id: 'unit_bulldozer', name: 'Бульдозер', kind: 'unit', role: 'Облоговий танк', rarity: 'epic', unlockArena: 3,
    cost: 5, count: 1, hp: 1750, shield: 300, dmg: 135, atkSpeed: 1.6, speedCode: 'SLOW', speed: 1.0,
    range: 1.1, splash: 0, targets: 'BUILDINGS_ONLY', special: 'DOUBLE_BLDG_DMG',
    size: 0.78, sight: 7, aiRole: 'tank', vehicle: true,
    desc: 'Повільний броньований гігант зі сталевим відвалом. Зносить будівлі та вежі з подвійною (x2) шкодою!',
    look: { type: 'bulldozer', body: '#eab308', blade: '#94a3b8' },
  },
  {
    id: 'unit_tommy', name: 'Гангстер з Томмі-ганом', kind: 'unit', role: 'Сплеш-стрілець', rarity: 'epic', unlockArena: 3,
    cost: 5, count: 1, hp: 760, shield: 0, dmg: 110, atkSpeed: 1.3, speedCode: 'MEDIUM', speed: 1.5,
    range: 4.5, splash: 1.8, targets: 'ALL', special: 'CONE_SPLASH',
    size: 0.47, sight: 6, aiRole: 'shooter', shot: 'tommy',
    desc: 'Поливає свинцем усе перед собою. Ідеально розчищає натовпи дрібних ворогів.',
    look: { type: 'human', body: '#4a3b5c', skin: '#d9a77f', hat: 'fedora', hatColor: '#3a2d1f', weapon: 'tommy', stripes: true },
  },
  {
    id: 'unit_medic', name: 'Підпільний лікар', kind: 'unit', role: 'Підтримка', rarity: 'epic', unlockArena: 3,
    cost: 4, count: 1, hp: 650, shield: 0, dmg: 40, atkSpeed: 1.5, speedCode: 'MEDIUM', speed: 1.5,
    range: 3, splash: 3, targets: 'ALL', special: 'HEAL_AURA_65',
    heal: 65, healRadius: 3.0, healInterval: 1.0,
    size: 0.43, sight: 5.5, aiRole: 'support', shot: 'pistol',
    desc: 'Працює без ліцензії, але ставить на ноги поранених союзників прямо під кулями.',
    look: { type: 'human', body: '#f1efe7', skin: '#e0b48f', hat: 'none', hair: '#555', weapon: 'bag', cross: true },
  },

  // --- Арена 4: Підпільне казино ---
  {
    id: 'unit_croupier', name: 'Круп\'є', kind: 'unit', role: 'Наскрізний стрілець', rarity: 'rare', unlockArena: 4,
    cost: 4, count: 1, hp: 510, shield: 0, dmg: 130, atkSpeed: 1.4, speedCode: 'MEDIUM', speed: 1.5,
    range: 5.0, splash: 0.9, targets: 'ALL', special: 'PIERCE_LINE',
    size: 0.43, sight: 6.2, aiRole: 'shooter', shot: 'card',
    desc: 'Кидає гострі сталеві карти-бумеранги, які пробивають наскрізь одразу всіх ворогів на лінії!',
    look: { type: 'human', body: '#18181b', skin: '#e6bf9c', hat: 'visor', hatColor: '#16a34a', weapon: 'cards', tie: '#dc2626' },
  },
  {
    id: 'unit_shotgun', name: 'Охоронець із дробовиком', kind: 'unit', role: 'Ближній стрілець', rarity: 'common', unlockArena: 4,
    cost: 4, count: 1, hp: 740, shield: 0, dmg: 250, atkSpeed: 1.6, speedCode: 'MEDIUM', speed: 1.5,
    range: 2.6, splash: 1.1, targets: 'GROUND', special: 'KNOCKBACK_CLOSE',
    knockback: 1.35,
    size: 0.48, sight: 5.5, aiRole: 'defender', shot: 'shotgun',
    desc: 'Колосальна шкода впритул і потужний залп, що фізично відкидає ворогів назад.',
    look: { type: 'human', body: '#374151', skin: '#d2a07a', hat: 'cap', hatColor: '#111827', weapon: 'shotgun', shades: true },
  },
  {
    id: 'bldg_casino_spawner', name: 'Підпільний клуб (Спавнер)', kind: 'building', role: 'Казарма', rarity: 'rare', unlockArena: 4,
    cost: 5, count: 1, hp: 850, shield: 0, dmg: 0, atkSpeed: 7, speedCode: 'STATIC', speed: 0,
    range: 0, splash: 0, targets: 'NONE', special: 'SPAWN_THUG_EVERY_7S',
    lifetime: 42, spawnEvery: 7, spawnCard: 'unit_thugs', spawnCount: 4,
    size: 1.0, aiRole: 'building_spawn',
    desc: 'При розміщенні та кожні 7 секунд випускає на вулицю 4 бійців шпани, створюючи шалений тиск на лінію.',
  },
  {
    id: 'spell_bribe', name: 'Хабар / Підкуп', kind: 'spell', role: 'Заморозка', rarity: 'epic', unlockArena: 4,
    cost: 2, count: 0, hp: 0, shield: 0, dmg: 0, atkSpeed: 3.5, speedCode: 'INSTANT', speed: 0,
    range: 99, splash: 3, targets: 'ALL', special: 'FREEZE_3_5S',
    freeze: 3.5, flightTime: 0.4,
    aiRole: 'spell_freeze',
    desc: 'У цьому місті все має ціну. Вороги та вежі в зоні дії зупиняються на 3.5 сек, щоб перерахувати гроші.',
  },

  // --- Арена 5: Особняк на пагорбах ---
  {
    id: 'unit_limo', name: 'Броньований Лімузин', kind: 'unit', role: 'Кортеж + Спавн', rarity: 'legendary', unlockArena: 5,
    cost: 7, count: 1, hp: 1950, shield: 0, dmg: 85, atkSpeed: 0.9, speedCode: 'SLOW', speed: 1.0,
    range: 4.2, splash: 0, targets: 'ALL', special: 'LIMO_DRIVEBY_AND_SPAWN_3',
    spawnToken: 'token_mobster', spawnCount: 3,
    size: 0.82, sight: 6.5, aiRole: 'tank', vehicle: true, shot: 'pistol',
    desc: 'Повільно їде прямо до ворожої вежі, відстрілюючись із вікон на ходу. Після знищення виходять 3 мафіозі!',
    look: { type: 'limo', body: '#111827', trim: '#f59e0b' },
  },
  {
    id: 'spell_vendetta', name: 'Вендета', kind: 'spell', role: 'Баф +40% шкоди', rarity: 'epic', unlockArena: 5,
    cost: 3, count: 0, hp: 0, shield: 0, dmg: 0, atkSpeed: 6, speedCode: 'INSTANT', speed: 0,
    range: 99, splash: 3.8, targets: 'ALL', special: 'VENDETTA_DMG_40',
    buffTime: 6.0, dmgBonus: 0.40, flightTime: 0.25,
    aiRole: 'spell_buff',
    desc: 'Накриває союзників багряною аурою помсти на 6 сек: усі ваші бійці в зоні завдають на +40% більше шкоди!',
  },
  {
    id: 'unit_lawyer', name: 'Продажний адвокат', kind: 'unit', role: 'Контроль', rarity: 'legendary', unlockArena: 5,
    cost: 5, count: 1, hp: 580, shield: 0, dmg: 60, atkSpeed: 2.0, speedCode: 'MEDIUM', speed: 1.5,
    range: 5, splash: 0, targets: 'GROUND', special: 'STUN_1_SEC', stun: 1.0,
    size: 0.44, sight: 6, aiRole: 'control', shot: 'paper',
    desc: 'Закидає ворогів судовими позовами. Кожен його постріл приголомшує ціль на 1 секунду.',
    look: { type: 'human', body: '#1e3a8a', skin: '#e6bf9c', hat: 'none', hair: '#2b2b2b', weapon: 'briefcase', tie: '#dc2626' },
  },
  {
    id: 'unit_don', name: 'Хрещений батько (Дон)', kind: 'unit', role: 'Бос / Бафер', rarity: 'legendary', unlockArena: 5,
    cost: 6, count: 1, hp: 1450, shield: 0, dmg: 150, atkSpeed: 1.3, speedCode: 'SLOW', speed: 1.1,
    range: 4, splash: 3.5, targets: 'ALL', special: 'BUFF_ATK_SPEED_20',
    buffRadius: 3.5, buffAtkSpeed: 0.20,
    size: 0.56, sight: 6, aiRole: 'tank', shot: 'revolver',
    desc: 'Його присутність на вулиці змушує підлеглих стріляти й битися на 20% швидше.',
    look: { type: 'human', body: '#111111', skin: '#d2a07a', hat: 'fedora', hatColor: '#f5f5f4', hatBand: '#111', weapon: 'revolver', scale: 1.18, rose: true },
  },

  // --- Арена 6+: Фабрика та Нові Тактичні Карти (10 нових карт v0.5.0) ---
  {
    id: 'spell_ricochet', name: 'Рикошет', kind: 'spell', role: 'Ланцюгова куля', rarity: 'rare', unlockArena: 2,
    cost: 2, count: 0, hp: 0, shield: 0, dmg: 120, atkSpeed: 0, speedCode: 'INSTANT', speed: 0,
    range: 99, splash: 2.5, targets: 'ALL', special: 'RICOCHET_CHAIN_4',
    baseDamage: 120, bounceRadius: 3.5, bounces: 4, damageScale: 0.15, flightTime: 0.25,
    aiRole: 'spell_damage',
    desc: 'Сліпа куля відскакує між 4 ворогами (+15% шкоди за відскок: 120 → 138 → 159 → 182). Б\'є землю, повітря і будівлі!',
  },
  {
    id: 'bldg_police_spikes', name: 'Поліцейський блокпост', kind: 'building', role: 'Пастка / Шипи', rarity: 'common', unlockArena: 2,
    cost: 2, count: 1, hp: 350, shield: 0, dmg: 25, atkSpeed: 0.5, speedCode: 'STATIC', speed: 0,
    range: 1.5, splash: 1.5, targets: 'GROUND', special: 'SPIKES_TRAP',
    lifetime: 25, dps: 50, slowPct: 0.50, vehicleMult: 3.0, size: 0.85, isTrap: true,
    aiRole: 'building_defense',
    desc: 'Смуга сталевих шипів 1x3. Сповільнює на 50%, завдає 25 шкоди/0.5с. Техніці завдає потрійної шкоди (75) та збиває таран!',
    look: { type: 'spikes', body: '#1f2937', light: '#3b82f6' },
  },
  {
    id: 'spell_manhole_ambush', name: 'Засідка в люку', kind: 'spell', role: 'Прихована пастка', rarity: 'epic', unlockArena: 3,
    cost: 3, count: 0, hp: 0, shield: 0, dmg: 90, atkSpeed: 0, speedCode: 'INSTANT', speed: 0,
    range: 99, splash: 1.2, targets: 'GROUND', special: 'MANHOLE_TRAP',
    stunDuration: 1.0, impactDmg: 90, spawnToken: 'token_sawn_off_mob', spawnCount: 2, flightTime: 0.2,
    aiRole: 'trap',
    desc: 'Невидима каналізаційна пастка. При наступі ворога кришка люка підкидає і оглушує на 1с, а з люка вистрибують 2 гангстери з обрізами!',
  },
  {
    id: 'bldg_counterfeit_press', name: 'Підпільна друкарня', kind: 'building', role: 'Економіка + Інфляція', rarity: 'epic', unlockArena: 6,
    cost: 4, count: 1, hp: 550, shield: 0, dmg: 0, atkSpeed: 8.0, speedCode: 'STATIC', speed: 0,
    range: 0, splash: 0, targets: 'NONE', special: 'COUNTERFEIT_INFLATION',
    lifetime: 30, incomeEvery: 8.0, incomeAmount: 1, size: 0.95,
    aiRole: 'building_economy',
    desc: 'Кожні 8 секунд приносить +1$. Головна фішка: заражає 1 випадкову карту в руці ворога інфляцією (+1$ до вартості)!',
    look: { type: 'press', body: '#064e3b', roller: '#10b981' },
  },
  {
    id: 'unit_contraband_blimp', name: 'Контрабандний дирижабль', kind: 'unit', role: 'Повітряний авіаносець', rarity: 'legendary', unlockArena: 6,
    cost: 7, count: 1, hp: 2100, shield: 0, dmg: 0, atkSpeed: 6.0, speedCode: 'SLOW', speed: 0.8,
    range: 0.8, splash: 0, targets: 'BUILDINGS_ONLY', special: 'BLIMP_AIR_CARRIER',
    flying: true, dropEvery: 6.0, dropCount: 2, dropCard: 'unit_thugs', deathDmg: 420, deathSplash: 2.8,
    size: 0.95, sight: 9, aiRole: 'tank',
    desc: 'Повільно пливе до ворожої вежі. Кожні 6с скидає на парашутах 2 бійців шпани. При падінні розбивається з колосальним вибухом (420 сплеш)!',
    look: { type: 'blimp', body: '#1c1917', trim: '#f59e0b' },
  },
  {
    id: 'unit_aa_truck', name: 'Зенітка на пікапі', kind: 'unit', role: 'Винищувач авіації', rarity: 'rare', unlockArena: 3,
    cost: 4, count: 1, hp: 680, shield: 0, dmg: 95, atkSpeed: 0.9, speedCode: 'MEDIUM', speed: 1.6,
    range: 6.0, splash: 0, targets: 'ALL', special: 'ANTI_AIR_BURST',
    airMult: 2.0, airSplash: 1.8, vehicle: true, shot: 'flak',
    size: 0.68, sight: 7.2, aiRole: 'shooter',
    desc: 'Мобільне ППО мафії (дальність 6.0). Пріоритетно збиває авіацію з x2 шкодою та зенітним розривом 1.8. По землі стріляє кулеметом.',
    look: { type: 'truck_flak', body: '#334155', cannon: '#0f172a' },
  },
  {
    id: 'unit_toxin_chemist', name: 'Хімік із токсинами', kind: 'unit', role: 'Кислотна зона / Дебаф', rarity: 'epic', unlockArena: 4,
    cost: 4, count: 1, hp: 520, shield: 0, dmg: 60, atkSpeed: 1.4, speedCode: 'MEDIUM', speed: 1.4,
    range: 4.5, splash: 2.0, targets: 'GROUND', special: 'ACID_PUDDLE_DOT',
    puddleDuration: 4.0, puddleDps: 35, puddleSlowAtk: 0.25, shot: 'acid_flask',
    size: 0.44, sight: 6.0, aiRole: 'control',
    desc: 'Кидає колби з кислотою. Утворює отруйну калюжу на 4 сек: 35 шкоди/сек та знижує швидкість атаки й шкоду ворогів на -25%!',
    look: { type: 'human', body: '#14532d', skin: '#e6bf9c', mask: '#84cc16', weapon: 'flask', apron: '#3f6212' },
  },
  {
    id: 'unit_police_patrol', name: 'Патрульний', kind: 'unit', role: 'Швидкий захисник', rarity: 'common', unlockArena: 1,
    cost: 2, count: 1, hp: 350, shield: 0, dmg: 65, atkSpeed: 1.1, speedCode: 'FAST', speed: 2.2,
    range: 0.7, splash: 0, targets: 'GROUND', special: 'NONE', faction: 'police',
    size: 0.42, sight: 5.5, aiRole: 'defender',
    desc: 'Швидкий офіцер патрульної поліції з кийком. Миттєво прибуває на лінію для перехоплення диверсантів та швидких ворогів.',
    look: { type: 'human', body: '#1e3a8a', skin: '#d2a07a', hat: 'police_cap', hatColor: '#172554', weapon: 'baton' },
  },
  {
    id: 'unit_police_chief', name: 'Шеф поліції', kind: 'unit', role: 'Важкий лідер + Щит', rarity: 'epic', unlockArena: 5,
    cost: 6, count: 1, hp: 1400, shield: 0, dmg: 180, atkSpeed: 1.3, speedCode: 'SLOW', speed: 1.1,
    range: 5.0, splash: 0, targets: 'ALL', special: 'CHIEF_SPAWN_SHIELD', faction: 'police',
    shieldAmount: 250, shieldRadius: 6.0, shieldDuration: 8.0, shot: 'revolver',
    size: 0.58, sight: 6.8, aiRole: 'tank',
    desc: 'Комісар міського управління. Стріляє з важкого револьвера. При виході віддає наказ у рацію: наділяє всіх союзників у радіусі 6.0 щитом 250 HP на 8 сек!',
    look: { type: 'human', body: '#0f172a', skin: '#d2a07a', hat: 'chief_hat', hatColor: '#1e293b', badge: '#facc15', weapon: 'revolver', scale: 1.18 },
  },
  {
    id: 'spell_car_crash', name: 'Аварія на дорозі', kind: 'spell', role: 'Таран + Барикада', rarity: 'epic', unlockArena: 4,
    cost: 4, count: 0, hp: 0, shield: 0, dmg: 260, atkSpeed: 0, speedCode: 'INSTANT', speed: 0,
    range: 99, splash: 2.2, targets: 'ALL', special: 'CAR_CRASH_WRECK',
    impactDmg: 260, knockback: 1.4, flightTime: 0.35,
    aiRole: 'spell_damage',
    desc: 'Автотроща: завдає 260 шкоди по площі, відкидає ворогів назад і залишає на місці палаючий остов авто (700 HP на 10с), що блокує дорогу!',
  },
];

export const CARD_CAPACITY_TOTAL = 150;
export const CARD_CAPACITY_PER_ARENA = 30;

// Токени (охоронці, мафіозі, гангстери з обрізами, остов авто)
export const TOKENS = {
  token_guard: {
    id: 'token_guard', name: 'Охоронець', kind: 'unit', rarity: 'rare',
    count: 1, hp: 220, shield: 0, dmg: 55, atkSpeed: 1.0, speed: 1.5, range: 3.5, splash: 0,
    targets: 'ALL', special: 'NONE', size: 0.4, sight: 5.5, shot: 'pistol',
    look: { type: 'human', body: '#4b5d43', skin: '#d2a07a', hat: 'cap', hatColor: '#2f3a2a', weapon: 'pistol' },
  },
  token_mobster: {
    id: 'token_mobster', name: 'Мафіозі', kind: 'unit', rarity: 'epic',
    count: 1, hp: 260, shield: 0, dmg: 70, atkSpeed: 1.0, speed: 1.6, range: 3.8, splash: 0,
    targets: 'ALL', special: 'NONE', size: 0.4, sight: 5.8, shot: 'pistol',
    look: { type: 'human', body: '#18181b', skin: '#e0b48f', hat: 'fedora', hatColor: '#27272a', weapon: 'pistol' },
  },
  token_sawn_off_mob: {
    id: 'token_sawn_off_mob', name: 'Гангстер з обрізом', kind: 'unit', rarity: 'epic',
    count: 1, hp: 280, shield: 0, dmg: 85, atkSpeed: 1.0, speed: 1.8, range: 1.5, splash: 0.6,
    targets: 'GROUND', special: 'NONE', size: 0.42, sight: 5.5, shot: 'shotgun',
    look: { type: 'human', body: '#27272a', skin: '#d2a07a', hat: 'fedora', hatColor: '#18181b', weapon: 'shotgun' },
  },
  token_burning_wreck: {
    id: 'token_burning_wreck', name: 'Палаючий остов авто', kind: 'building', rarity: 'epic',
    count: 1, hp: 700, shield: 0, dmg: 0, atkSpeed: 10, speed: 0, range: 0, splash: 0,
    targets: 'NONE', special: 'WRECK_OBSTACLE', size: 0.9, lifetime: 10, decayPerSec: 70, isObstacle: true,
    look: { type: 'wreck', body: '#18181b', fire: true },
  },
};

export const CARD_MAP = Object.fromEntries(CARDS.map(c => [c.id, c]));
export function getDef(id) { return CARD_MAP[id] || TOKENS[id]; }

// =====================================================================
//  ВЕЖІ — 4 типи
// =====================================================================
export const TOWERS = [
  {
    id: 'tower_mafia_mansion', name: 'Особняк Дона (Мафія)',
    kingHp: 3000, kingDmg: 90, princessHp: 1600, princessDmg: 70, atkSpeed: 0.8, range: 7.5,
    passive: 'CASH_REGEN_PLUS_10_LAST_MIN', overtimeMult: 2.2, shot: 'tommy',
    desc: 'Класичний маєток кримінальної сім\'ї. Бонус: у фінальну хвилину бою Готівка накопичується на 10% швидше.',
    look: { roof: '#5b3a29', wall: '#3a2418', trim: '#d4af37', style: 'mansion' },
  },
  {
    id: 'tower_police_precinct', name: 'Поліцейський відділок',
    kingHp: 3300, kingDmg: 85, princessHp: 1800, princessDmg: 65, atkSpeed: 1.0, range: 8,
    passive: 'TOWER_HP_PLUS_10_RANGE_PLUS_05', shot: 'pistol',
    desc: 'Укріплений департамент поліції. Бонус: усі ваші вежі мають +10% здоров\'я та +0.5 тайла дальності стрільби.',
    look: { roof: '#2b3f5c', wall: '#1a2638', trim: '#38bdf8', style: 'police' },
  },
  {
    id: 'tower_underground_casino', name: 'Підпільне казино «Рояль»',
    kingHp: 2800, kingDmg: 105, princessHp: 1500, princessDmg: 85, atkSpeed: 0.9, range: 7.5,
    passive: 'TOWER_DMG_PLUS_15_START_CASH_6', startCash: 6, shot: 'pistol',
    desc: 'Агресивний стиль гри. Вежі мають менше броні, але завдають на 15% більше шкоди, а бій починається з 6$ замість 5$.',
    look: { roof: '#6b1220', wall: '#3d0a12', trim: '#f43f5e', style: 'casino' },
  },
  {
    id: 'tower_armored_bank', name: 'Центральний Банк',
    kingHp: 3100, kingDmg: 80, princessHp: 1700, princessDmg: 60, atkSpeed: 0.85, range: 7.5,
    passive: 'BONUS_3_CASH_ON_TOWER_DESTROY', towerDestroyCash: 3, shot: 'pistol',
    desc: 'Охороняє золотий запас. Коли ви знищуєте ворожу вежу або втрачаєте свою, ви миттєво отримуєте +3$ Готівки.',
    look: { roof: '#6b7280', wall: '#374151', trim: '#facc15', style: 'bank' },
  },
];
export const TOWER_MAP = Object.fromEntries(TOWERS.map(t => [t.id, t]));

// =====================================================================
//  АРЕНИ (21 Арена з унікальними особливостями та модами)
// =====================================================================
export const ARENAS = [
  {
    id: 'arena_1', num: 1, name: 'Бідний квартал (Слемс)', min: 0, max: 99,
    win: 30, lose: -10, bg: '#23252b', bridge: '#4A4E58', bpm: 65, music: 'спокійний джаз-бас', theme: 'slums',
    featureName: 'Вулична сутичка', featureDesc: 'Стандартний темп бою, ідеальний для вивчення колоди.',
    cashMult: 1.0, bridgeSpeedMult: 1.0, bonusGold: 30, weather: 'fog',
    specialty: 'Вуличні бійки, підпалювачі та дешева масовка',
    desc: 'Стартова арена. Похмурі цегляні провулки, бочки з вогнем та старі бруківки.'
  },
  {
    id: 'arena_2', num: 2, name: 'Нічний порт і Доки', min: 100, max: 249,
    win: 30, lose: -12, bg: '#162332', bridge: '#34495E', bpm: 75, music: 'напружений нуар-біт', theme: 'port',
    featureName: 'Вологий причал', featureDesc: 'Юніти біжать дерев\'яними мостами на +10% швидше.',
    cashMult: 1.0, bridgeSpeedMult: 1.10, bonusGold: 35, weather: 'rain',
    specialty: 'SWAT, вертольоти, дрони та сльозогінний газ',
    desc: 'Контейнерні термінали біля води, солоний туман і світло прожекторів.'
  },
  {
    id: 'arena_3', num: 3, name: 'Провулки Чайнатауну', min: 250, max: 449,
    win: 30, lose: -14, bg: '#2b1b1d', bridge: '#b91c1c', bpm: 85, music: 'східний синт-нуар', theme: 'chinatown',
    featureName: 'Червоні ліхтарі', featureDesc: 'За перемогу нараховується на +15% більше золота.',
    cashMult: 1.0, bridgeSpeedMult: 1.0, bonusGold: 45, weather: 'neon_red',
    specialty: 'Димові завіси, кинджали та швидкі диверсанти',
    desc: 'Вузькі багряні провулки під сяйвом неонових ієрогліфів та паперових ліхтарів.'
  },
  {
    id: 'arena_4', num: 4, name: 'Залізничне депо (Промзона)', min: 450, max: 699,
    win: 30, lose: -15, bg: '#1c1f24', bridge: '#475569', bpm: 90, music: 'індустріальний ритм', theme: 'depot',
    featureName: 'Залізнична броня', featureDesc: 'Міцність усіх веж підвищена на +150 HP.',
    cashMult: 1.0, towerHpBonus: 150, bonusGold: 50, weather: 'smog',
    specialty: 'Інкасатори, танки-бульдозери та металеві барикади',
    desc: 'Старі товарні вагони, свист пари з котлів та важкий промисловий смог.'
  },
  {
    id: 'arena_5', num: 5, name: 'Підпільний пивзавод', min: 700, max: 949,
    win: 30, lose: -16, bg: '#2d2217', bridge: '#b45309', bpm: 95, music: 'драйвовий бутлегер-джаз', theme: 'brewery',
    featureName: 'Хмільний раш', featureDesc: 'Швидкість накопичення готівки збільшена на +8%.',
    cashMult: 1.08, bonusGold: 55, weather: 'barrels',
    specialty: 'Сухий закон, вибухові бочки та відчайдушні байкери',
    desc: 'Схований у підвалах завод із бочками віскі. Запах хмелю та пороху.'
  },
  {
    id: 'arena_6', num: 6, name: 'Фабрика фальшивомонетників', min: 950, max: 1199,
    win: 30, lose: -17, bg: '#13281e', bridge: '#059669', bpm: 100, music: 'швидкі клавіші свінгу', theme: 'counterfeit',
    featureName: 'Грошовий станок', featureDesc: 'Стартова готівка у бою: 6$ замість 5$.',
    startCashBonus: 1, bonusGold: 60, weather: 'green_glow',
    specialty: 'Друкарські верстати, відмивання каси та куплені свідки',
    desc: 'Підпільні ротаційні машини щохвилини штампують сотні підроблених франклінів.'
  },
  {
    id: 'arena_7', num: 7, name: 'Центральний Даунтаун', min: 1200, max: 1449,
    win: 30, lose: -18, bg: '#181b26', bridge: '#6366f1', bpm: 105, music: 'динамічний синт-нуар', theme: 'downtown',
    featureName: 'Удар по будівлях', featureDesc: 'Усі атаки по будівлях та вежах наносять на +8% більше шкоди.',
    bldgDmgMult: 1.08, bonusGold: 65, weather: 'neon_blue',
    specialty: 'Бульдозери, автоматники Томмі та бронемашини',
    desc: 'Хмарочоси ділового центру, сяючі вітрини банків та перестрілки на перехрестях.'
  },
  {
    id: 'arena_8', num: 8, name: 'Готель «Континенталь»', min: 1450, max: 1699,
    win: 30, lose: -18, bg: '#241a1a', bridge: '#991b1b', bpm: 110, music: 'холодний нуарний вальс', theme: 'continental',
    featureName: 'Кодекс ассасинів', featureDesc: 'Стрілецькі юніти отримують +0.4 до радіусу прицілювання.',
    rangeBonus: 0.4, bonusGold: 70, weather: 'gold_dust',
    specialty: 'Нейтральна територія, дуелі на снайперках та приховані вбивці',
    desc: 'Легендарний готель, де діє закон золотих монет і де кожен офіціант — найманий стрілець.'
  },
  {
    id: 'arena_9', num: 9, name: 'Окружний суд та Мерія', min: 1700, max: 1949,
    win: 30, lose: -19, bg: '#23201e', bridge: '#78716c', bpm: 112, music: 'басовий трилер', theme: 'courthouse',
    featureName: 'Затяжні позови', featureDesc: 'Будь-який стан чи заморозка ворогів діє на 0.4 сек довше.',
    ccBonus: 0.4, bonusGold: 75, weather: 'spotlights',
    specialty: 'Адвокати з чемоданами, підкуплені присяжні та сльозогінний газ',
    desc: 'Мармурові колони правосуддя, під якими укладаються найбрудніші угоди століття.'
  },
  {
    id: 'arena_10', num: 10, name: 'Підпільне казино «Монте-Карло»', min: 1950, max: 2199,
    win: 30, lose: -20, bg: '#142921', bridge: '#eab308', bpm: 115, music: 'швидкий свінг/екшн', theme: 'casino',
    featureName: 'Золотий Джекпот', featureDesc: 'Кожні 30 секунд гри генерується випадкова грошова надбавка +1$.',
    jackpotCash: true, bonusGold: 80, weather: 'casino_sparkle',
    specialty: 'Круп\'є, карти-бумеранги, дробовики та охорона столів',
    desc: 'Зелене сукно покерних столів, звук рулетки та ріки шампанського під дулами револьверів.'
  },
  {
    id: 'arena_11', num: 11, name: 'Приватне сховище банку «Федерал»', min: 2200, max: 2449,
    win: 30, lose: -20, bg: '#1a221f', bridge: '#10b981', bpm: 118, music: 'драйвовий техно-джаз', theme: 'bank_vault',
    featureName: 'Банківський приріст', featureDesc: 'Швидкість відновлення готівки збільшена на +10%.',
    cashMult: 1.10, bonusGold: 85, weather: 'gold_vault',
    specialty: 'Броньовані сейфи, лазерні пастки та важкі танки',
    desc: 'Найбезпечніше сховище в країні: титанові двері вагою 20 тонн та мільйони в золотих злитках.'
  },
  {
    id: 'arena_12', num: 12, name: 'Склад контрабанди в Доках', min: 2450, max: 2699,
    win: 30, lose: -21, bg: '#101d28', bridge: '#0284c7', bpm: 120, music: 'штормовий біт', theme: 'smugglers',
    featureName: 'Чорні знижки', featureDesc: 'Усі закляття коштують на 1$ дешевше в останні 60 секунд бою.',
    lateSpellDiscount: 1, bonusGold: 90, weather: 'heavy_rain',
    specialty: 'Імпортний динаміт, ящики з гвинтівками та нічні вилазки',
    desc: 'Лабіринт із портових контейнерів під шквальною зливою. Тут немає поліції, тільки кулі.'
  },
  {
    id: 'arena_13', num: 13, name: 'Метрополітен (Підземний вокзал)', min: 2700, max: 2949,
    win: 30, lose: -21, bg: '#1c1b22', bridge: '#8b5cf6', bpm: 122, music: 'темний урбан-біт', theme: 'subway',
    featureName: 'Висока напруга', featureDesc: 'Піші юніти рухаються на +10% швидше по всій арені.',
    unitSpeedMult: 1.10, bonusGold: 95, weather: 'subway_flicker',
    specialty: 'Перестрілки на платформах, поїзди-привиди та засідки',
    desc: 'Покинуті тунелі метро, де прокладено таємні гілки для перевезення мафіозних вантажів.'
  },
  {
    id: 'arena_14', num: 14, name: 'Королівський іподром', min: 2950, max: 3199,
    win: 30, lose: -22, bg: '#18241b', bridge: '#15803d', bpm: 124, music: 'швидкісний брас-рок', theme: 'racecourse',
    featureName: 'Турбо-спринт', featureDesc: 'Швидкісні юніти (байкери, пси, техніка) біжать на +15% швидше.',
    fastUnitBonus: 1.15, bonusGold: 100, weather: 'turf_green',
    specialty: 'Підставні перегони, швидкісні камікадзе та тоталізатор',
    desc: 'Елітний іподром з підстриженими газонами, де на один забіг ставлять цілі заводи.'
  },
  {
    id: 'arena_15', num: 15, name: 'Оперний театр «Ла Скала»', min: 3200, max: 3449,
    win: 30, lose: -22, bg: '#2b1419', bridge: '#be123c', bpm: 126, music: 'драматична опера-нуар', theme: 'opera',
    featureName: 'Драматична Вендета', featureDesc: 'Аура «Вендета» дає +50% до шкоди союзникам (замість +40%).',
    vendettaBonus: 1.50, bonusGold: 105, weather: 'velvet_red',
    specialty: 'Оксамитові ложі, оркестрові ями та фатальні помсти',
    desc: 'Величний зал із золотою ліпниною, де аплодисменти заглушають черги автоматів.'
  },
  {
    id: 'arena_16', num: 16, name: 'Поліцейська фортеця SWAT', min: 3450, max: 3699,
    win: 30, lose: -23, bg: '#111827', bridge: '#38bdf8', bpm: 128, music: 'сиренний марш SWAT', theme: 'swat_hq',
    featureName: 'Бронещит веж', featureDesc: 'Обидві головні вежі починають бій із захисним щитом у 300 од.',
    towerShieldBonus: 300, bonusGold: 110, weather: 'police_flashing',
    specialty: 'Спецпризначенці, важкі шоломи, гелікоптери та димові шашки',
    desc: 'Головне управління поліції: колючий дріт, бетонні ДОТи та безперервне патрулювання.'
  },
  {
    id: 'arena_17', num: 17, name: 'Нічний хмарочос Синдикату', min: 3700, max: 3949,
    win: 30, lose: -23, bg: '#0b1329', bridge: '#0ea5e9', bpm: 130, music: 'електронний кібер-нуар', theme: 'skyscraper',
    featureName: 'Висотний вітер', featureDesc: 'Повітряні юніти (вертольоти, дрони) отримують +18% HP.',
    airHpBonus: 1.18, bonusGold: 115, weather: 'wind_clouds',
    specialty: 'Гелікоптерні майданчики на даху 80-го поверху, снайпери з оптикою',
    desc: 'Дах найвищого хмарочоса в місті. Вогні мегаполіса внизу та шалений висотний вітер.'
  },
  {
    id: 'arena_18', num: 18, name: 'Таємний бункер мафії', min: 3950, max: 4199,
    win: 30, lose: -24, bg: '#23180c', bridge: '#d97706', bpm: 132, music: 'важкий темний ембієнт', theme: 'bunker',
    featureName: 'Фортифікація', featureDesc: 'Усі встановлені будівлі живуть на +8 секунд довше.',
    bldgLifetimeBonus: 8, bonusGold: 120, weather: 'bunker_amber',
    specialty: 'Командні пульти, герметичні шлюзи та нескінченні спавнери',
    desc: 'Глибоко під містом побудовано мережу бункерів на випадок війни між кланами.'
  },
  {
    id: 'arena_19', num: 19, name: 'Острівна в\'язниця «Алькатрас»', min: 4200, max: 4499,
    win: 30, lose: -24, bg: '#101720', bridge: '#475569', bpm: 135, music: 'льодяний саспенс', theme: 'alcatraz',
    featureName: 'Крижана протока', featureDesc: 'Ворожі юніти під час переходу річки сповільнюються на 20%.',
    riverSlow: 0.20, bonusGold: 130, weather: 'fog_searchlights',
    specialty: 'Кам\'яні стіни, сторожові вежі, морські прожектори та акули',
    desc: 'Острів-скеля серед крижаної протоки. Звідси ще ніхто не втікав живим.'
  },
  {
    id: 'arena_20', num: 20, name: 'Особняк на пагорбах Донів', min: 4500, max: 4899,
    win: 30, lose: -25, bg: '#361118', bridge: '#f59e0b', bpm: 138, music: 'епічна симфонія Донів', theme: 'mansion',
    featureName: 'Гвардія Сім\'ї', featureDesc: 'Головна вежа наносить на +15% більше шкоди будь-яким ворогам.',
    kingDmgBonus: 1.15, bonusGold: 140, weather: 'mansion_gold',
    specialty: 'Лімузини, кортежі найманців, легендарні дони та вендета',
    desc: 'Палац на вершині пагорба з видом на підкорене місто. Золоті статуї та мармурові басейни.'
  },
  {
    id: 'arena_21', num: 21, name: 'Зала Верховного Конклаву (Легендарна)', min: 4900, max: 99999,
    win: 30, lose: -25, bg: '#1e0f2d', bridge: '#a855f7', bpm: 142, music: 'фінальний гімн мафії', theme: 'conclave',
    featureName: 'Абсолютна Влада', featureDesc: 'Готівка x1.25 весь бій, а подвійний час настає вже на 90-й секунді!',
    cashMult: 1.25, earlyOvertime: 90, bonusGold: 160, weather: 'conclave_legendary',
    specialty: 'Еліта світового синдикату. Максимальні ставки та найвищий рівень майстерності',
    desc: 'Таємна зала світового кримінального уряду. Тут вирішується доля імперій та королів.'
  }
];
export function arenaForTrophies(t) {
  let a = ARENAS[0];
  for (const ar of ARENAS) if (t >= ar.min) a = ar;
  return a;
}

// =====================================================================
//  КЕЙСИ — Тільки за монети (без безкоштовної роздачі)
// =====================================================================
export const CHESTS = [
  { id: 'chest_envelope',  name: 'Вуличний конверт', chance: 0.70, price: 80,  goldMin: 20,  goldMax: 45,  cards: 2, rare: 0, rareChance: 0.35, epic: 0, legendaryChance: 0,
    color: '#c8a46a', desc: 'Конверт із вуличною виручкою. Містить трохи золота та 2 картки бійців.' },
  { id: 'chest_safe',      name: 'Сейф капо',        chance: 0.25, price: 220, goldMin: 60,  goldMax: 120, cards: 5, rare: 1, epic: 0, epicChance: 0.35, legendaryChance: 0,
    color: '#6b7280', desc: 'Металевий сейф капо: 5 карт (гарантовано Рідкісна та шанс на Епічну).' },
  { id: 'chest_briefcase', name: 'Дипломат дона',    chance: 0.05, price: 550, goldMin: 150, goldMax: 260, cards: 9, rare: 2, epic: 1, legendaryChance: 0.15,
    color: '#7c4a1e', desc: 'Дипломат із касою сім\'ї: 9 карт (2 Рідкісні, 1 Епічна та 15% шанс на Легендарну).' },
];

// =====================================================================
//  СЮЖЕТНІ КАМПАНІЇ — 2 ГІЛКИ: «МАФІЯ» ТА «СИЛОВИКИ»
//  Поразки відкривають режим «Вендета» (+50% золота за реванш)
//  та обхідну Диверсію (послаблює боса на -1 рівень перед реваншем)
// =====================================================================
export const STORY_CAMPAIGNS = {
  mafia: {
    id: 'mafia',
    name: '🎩 Гілка Мафії: Влада Сім\'ї',
    subtitle: 'Боротьба за території міста проти інших Донів та поліції',
    chapters: [
      {
        id: 'm_1', branch: 'mafia', num: 1, title: 'I. Борги Старого Доку', boss: 'Рекет «М\'ясник» Буч',
        arenaId: 'arena_1', rewardGold: 110, botLevel: 1, tower: 'tower_mafia_mansion',
        taunt: '«Цей квартал мій! Приходь, коли набереш справжніх бійців!»',
        sabotageTitle: 'Підпалити склади Буча',
        deck: ['unit_bouncer', 'unit_thugs', 'unit_arsonist', 'unit_biker', 'bldg_barricade', 'spell_molotov', 'unit_hitman', 'spell_sniper_shot'],
        story: 'Банда Буча вимагає данину з ваших складів у Бідному кварталі. Вибийте його підпалювачів і закріпіть контроль над вулицею.',
      },
      {
        id: 'm_2', branch: 'mafia', num: 2, title: 'II. Облава в Нічному Порту', boss: 'Комісар Харді',
        arenaId: 'arena_2', rewardGold: 170, botLevel: 2, tower: 'tower_police_precinct',
        taunt: '«Усі причали перекрито вертольотами! Здавайтеся!»',
        sabotageTitle: 'Знеструмити портові радари',
        deck: ['unit_swat', 'unit_heli', 'unit_drone', 'spell_teargas', 'unit_k9', 'unit_hitman', 'bldg_barricade', 'spell_sniper_shot'],
        story: 'Поліція заблокувала ваш контрабандний вантаж у порту. Прорвіть кордон SWAT, вертольота та сльозогінного газу.',
      },
      {
        id: 'm_3', branch: 'mafia', num: 3, title: 'III. Війна в Даунтауні', boss: 'Капо Вінченцо «Бульдозер»',
        arenaId: 'arena_3', rewardGold: 250, botLevel: 3, tower: 'tower_armored_bank',
        taunt: '«Мій бульдозер перетворить твої вежі на пил!»',
        sabotageTitle: 'Замінувати інкасаторський міст',
        deck: ['unit_bulldozer', 'unit_armored_van', 'unit_tommy', 'unit_medic', 'unit_swat', 'spell_molotov', 'bldg_barricade', 'unit_biker'],
        story: 'Суперницький клан Вінченцо кинув важку бронетехніку на захоплення фінансового центру. Зупиніть його колону!',
      },
      {
        id: 'm_4', branch: 'mafia', num: 4, title: 'IV. Ва-банк у «Роялі»', boss: 'Мадам Рубі',
        arenaId: 'arena_4', rewardGold: 360, botLevel: 4, tower: 'tower_underground_casino',
        taunt: '«У цьому казино ставки роблю тільки я. Твоя карта бита!»',
        sabotageTitle: 'Підкупити круп\'є казино',
        deck: ['unit_croupier', 'unit_shotgun', 'bldg_casino_spawner', 'spell_bribe', 'unit_detective', 'unit_tommy', 'unit_medic', 'spell_molotov'],
        story: 'Мадам Рубі контролює підпільні клуби. Її круп\'є та охоронці з дробовиками не пускають чужих до каси.',
      },
      {
        id: 'm_5', branch: 'mafia', num: 5, title: 'V. Трон Хрещеного Батька', boss: 'Дон Сальваторе',
        arenaId: 'arena_5', rewardGold: 620, botLevel: 5, tower: 'tower_mafia_mansion',
        taunt: '«Сім\'я пам\'ятає твою поразку. Готовий до Вендети?»',
        sabotageTitle: 'Перехопити кортеж адвокатів',
        deck: ['unit_limo', 'unit_don', 'spell_vendetta', 'unit_lawyer', 'unit_tommy', 'unit_medic', 'spell_bribe', 'unit_hitman'],
        story: 'Фінальна битва за владу в Сіті. Дон Сальваторе виїжджає на броньованому лімузині під аурою Вендети.',
      },
    ],
  },

  police: {
    id: 'police',
    name: '🚔 Гілка Силовиків: Операція «Зачистка»',
    subtitle: 'Боротьба поліції та спецслужб проти мафії і приватних військових структур',
    chapters: [
      {
        id: 'p_1', branch: 'police', num: 1, title: 'I. Вуличний Рейд', boss: 'Ватажок «Іскра»',
        arenaId: 'arena_1', rewardGold: 110, botLevel: 1, tower: 'tower_mafia_mansion',
        taunt: '«Копи не встигнуть загасити наші вулиці!»',
        sabotageTitle: 'Накрити підпільний гараж',
        deck: ['unit_arsonist', 'unit_thugs', 'unit_biker', 'unit_bouncer', 'spell_molotov', 'unit_k9', 'bldg_barricade', 'unit_hitman'],
        story: 'Молоді банди влаштували підпали в Бідному кварталі. Поверніть порядок на вулиці за допомогою К9 та барикад.',
      },
      {
        id: 'p_2', branch: 'police', num: 2, title: 'II. Контрабандний Причал', boss: 'Директор ПВК «Привид»',
        arenaId: 'arena_2', rewardGold: 170, botLevel: 2, tower: 'tower_armored_bank',
        taunt: '«Наші найманці діють у тіні — ваші радари сліпі!»',
        sabotageTitle: 'Перекрити канал постачання дронів',
        deck: ['unit_detective', 'unit_drone', 'unit_hitman', 'unit_swat', 'spell_sniper_shot', 'spell_teargas', 'unit_biker', 'bldg_barricade'],
        story: 'Приватна охоронна структура перекидає нелегальну зброю через порт. Нейтралізуйте їхніх диверсантів і дронів.',
      },
      {
        id: 'p_3', branch: 'police', num: 3, title: 'III. Штурм ПВК «Чорний Щит»', boss: 'Полковник Красс',
        arenaId: 'arena_3', rewardGold: 250, botLevel: 3, tower: 'tower_police_precinct',
        taunt: '«Ваша поліція слабша за нашу приватну армію!»',
        sabotageTitle: 'Зламати бронетехніку ПВК',
        deck: ['unit_bulldozer', 'unit_heli', 'unit_armored_van', 'unit_medic', 'unit_swat', 'spell_teargas', 'unit_tommy', 'spell_sniper_shot'],
        story: 'Приватна військова компанія «Чорний Щит» заблокувала центр міста бульдозерами та авіацією. Зламайте їхній опір.',
      },
      {
        id: 'p_4', branch: 'police', num: 4, title: 'IV. Обшук у «Роялі»', boss: 'Бос Служби Безпеки',
        arenaId: 'arena_4', rewardGold: 360, botLevel: 4, tower: 'tower_underground_casino',
        taunt: '«У нас все куплено — навіть твої свідки мовчать!»',
        sabotageTitle: 'Заморозити рахунки казино',
        deck: ['unit_shotgun', 'unit_croupier', 'spell_bribe', 'bldg_casino_spawner', 'unit_lawyer', 'unit_tommy', 'spell_molotov', 'unit_medic'],
        story: 'Підпільна імперія відмиває мільярди. Прорвіть лінію дробовиків, круп\'є та продажних адвокатів.',
      },
      {
        id: 'p_5', branch: 'police', num: 5, title: 'V. Арешт Ради Донів', boss: 'Синдикат Тіні',
        arenaId: 'arena_5', rewardGold: 620, botLevel: 5, tower: 'tower_mafia_mansion',
        taunt: '«Закон безсилий проти нашого кортежу!»',
        sabotageTitle: 'Заблокувати шляхи відступу',
        deck: ['unit_limo', 'unit_don', 'unit_bulldozer', 'spell_vendetta', 'unit_lawyer', 'unit_heli', 'unit_croupier', 'spell_bribe'],
        story: 'Вирішальна спецоперація на пагорбах: затримайте верхівку мафії та приватних найманців раз і назавжди!',
      },
    ],
  },
};

export const STORY_CHAPTERS = [
  ...STORY_CAMPAIGNS.mafia.chapters,
  ...STORY_CAMPAIGNS.police.chapters,
];

// =====================================================================
//  10 ЛОГІЧНИХ АРХЕТИПІВ КОЛОД БОТА (з усіма новими картами)
// =====================================================================
export const BOT_ARCHETYPES = [
  {
    id: 'arch_rush', name: 'Вуличний Наліт', style: 'Швидкий раш',
    tower: 'tower_underground_casino',
    deck: ['unit_biker', 'unit_thugs', 'unit_k9', 'unit_detective', 'unit_armored_van', 'spell_molotov', 'spell_bribe', 'unit_hitman'],
  },
  {
    id: 'arch_fire', name: 'Вогняна Вулиця', style: 'Підпал і сплеш',
    tower: 'tower_mafia_mansion',
    deck: ['unit_arsonist', 'unit_bouncer', 'spell_molotov', 'unit_biker', 'unit_tommy', 'unit_medic', 'bldg_barricade', 'unit_thugs'],
  },
  {
    id: 'arch_police', name: 'Залізний Кордон SWAT', style: 'Оборона та газ',
    tower: 'tower_police_precinct',
    deck: ['unit_swat', 'unit_heli', 'unit_drone', 'spell_teargas', 'bldg_barricade', 'unit_hitman', 'unit_k9', 'spell_sniper_shot'],
  },
  {
    id: 'arch_siege', name: 'Сталевий Бульдозер', style: 'Облога веж x2',
    tower: 'tower_armored_bank',
    deck: ['unit_bulldozer', 'unit_medic', 'unit_tommy', 'unit_shotgun', 'spell_teargas', 'spell_vendetta', 'unit_thugs', 'bldg_barricade'],
  },
  {
    id: 'arch_casino', name: 'Казино «Ва-Банк»', style: 'Круп\'є та дробовики',
    tower: 'tower_underground_casino',
    deck: ['unit_croupier', 'unit_shotgun', 'bldg_casino_spawner', 'spell_bribe', 'unit_detective', 'unit_bouncer', 'spell_molotov', 'unit_thugs'],
  },
  {
    id: 'arch_cortege', name: 'Кортеж Хрещеного Батька', style: 'Лімузин + Вендета',
    tower: 'tower_mafia_mansion',
    deck: ['unit_limo', 'unit_don', 'spell_vendetta', 'unit_medic', 'unit_croupier', 'unit_lawyer', 'spell_bribe', 'unit_swat'],
  },
  {
    id: 'arch_air', name: 'Небесна Облава', style: 'Повітряний контроль',
    tower: 'tower_police_precinct',
    deck: ['unit_heli', 'unit_drone', 'unit_bouncer', 'spell_teargas', 'unit_hitman', 'bldg_barricade', 'unit_shotgun', 'spell_sniper_shot'],
  },
  {
    id: 'arch_heist', name: 'Банківський Таран', style: 'Техніка та економіка',
    tower: 'tower_armored_bank',
    deck: ['unit_armored_van', 'unit_bulldozer', 'unit_biker', 'unit_croupier', 'unit_swat', 'spell_molotov', 'spell_sniper_shot', 'unit_drone'],
  },
];

export const GAME_MODES = [
  { id: 'ranked',   name: 'Рейтинговий Бій', icon: '🏆', desc: 'Бій за Авторитет (+30 / -15). Адаптивний бот використовує 8+ тактичних колод.' },
  { id: 'story',    name: 'Сюжет: Мафія / Силовики', icon: '📜', desc: '2 сюжетні гілки (10 глав), диверсії та механіка «Вендета» після поразок.' },
  { id: 'raid_x2',  name: 'Режим «Подвійна Облава»', icon: '🚨', desc: 'Готівка накопичується у 2 рази швидше з першої секунди бою!' },
  { id: 'draft',    name: 'Сліпий Контракт (Випадкова колода)', icon: '🎲', desc: 'Обидва гравці отримують випадкову збалансовану колоду та вежу рівних рівнів.' },
];

export const JUICE = {
  hitFlash: 0.08,
  floatTextTime: 0.7,
  shakeSmall: { amp: 5, time: 0.25 },
  shakeBig: { amp: 10, time: 0.5 },
  teamColor: { P: '#00E5FF', E: '#FF1744' },
  shieldColor: '#38BDF8',
  hpBar: { w: 28, h: 4 },
  forbidden: 'rgba(255,0,0,0.2)',
};

export const DEFAULT_DECK = [
  'unit_bouncer', 'unit_thugs', 'unit_hitman', 'unit_arsonist',
  'unit_biker', 'spell_molotov', 'spell_sniper_shot', 'bldg_barricade',
];
export const DEFAULT_TOWER = 'tower_mafia_mansion';

// =====================================================================
//  КРИМІНАЛЬНА ХРОНІКА ТА НОВИНИ ОНОВЛЕНЬ (GAME_NEWS)
// =====================================================================
export const GAME_NEWS = [
  {
    id: 'news_v0_5_0',
    version: '0.5.0',
    date: '24.11.2026',
    badge: '10 НОВИХ КАРТ',
    badgeColor: '#EC4899',
    title: 'Арсенал Синдикату: 10 нових карт, пастки та ППО!',
    summary: 'Грандіозне поповнення арсеналу: ланцюговий Рикошет, дорожні шипи, засідка в люку, фальшивомонетники, дирижабль, зенітка ППО, токсичний хімік, патрульні, шеф поліції та автотроща!',
    bannerEmoji: '⚡',
    changes: [
      '⚡ Рикошет (Сліпа куля): влучає в найжирнішу ціль і відскакує 4 рази із наростаючою шкодою (+15% за відскок: 120 → 138 → 159 → 182).',
      '🚧 Поліцейський блокпост (Шипи): смуга шипів на мосту сповільнює на 50%, завдає потрійної шкоди техніці (75/0.5с) та збиває таран.',
      '🕳️ Засідка в люку: невидима пастка підкидає і оглушує ворога на 1с, а з люка вискакують 2 гангстери з обрізами прямо за спину ворогу.',
      '🖨️ Підпільна друкарня: друкує +1$ кожні 8с і заражає 1 випадкову карту в руці ворога інфляцією (+1$ до вартості).',
      '🎈 Контрабандний дирижабль: повітряний супер-танк (2100 HP), скидає по 2 десантники кожні 6с та падає з вибухом на 420 сплеш-шкоди.',
      '🚚 Зенітка на пікапі: збиває ворожу авіацію на дистанції 6.0 із подвійною шкодою та розривним сплешем.',
      '🧪 Хімік із токсинами: кидає кислотні колби, створюючи токсичну калюжу (35 DoT/с та -25% швидкості атаки ворогів).',
      '👮 Патрульний та Шеф поліції: швидкий патрульний з кийком (2$) та Шеф (6$), що наділяє союзників щитом 250 HP на 8 секунд.',
      '💥 Аварія на дорозі: таран із відкиданням (260 шкоди) та залишенням палаючого остова (700 HP) як барикади.',
      '🥊 Посилення Вишибали: кожен 3-й удар колишнього боксера тепер завдає 1.5x шкоди по площі!'
    ]
  },
  {
    id: 'news_v0_4_0',
    version: '0.4.0',
    date: '24.11.2026',
    badge: 'МАСШТАБНИЙ АПДЕЙТ',
    badgeColor: '#F59E0B',
    title: '21 Арена, 5 слотів колод та великі фігурки бійців!',
    summary: 'Грандіозне оновлення: фігурки бійців стали на 55% більшими, додано 21 унікальну арену, 5 наборів колод та нові правила веж.',
    bannerEmoji: '👑',
    changes: [
      '🔍 Збільшені фігурки: персонажі, машини та тварини тепер на 55% більші, виразні та чітко помітні на екранах будь-яких телефонів.',
      '🗺️ 21 унікальна Арена: від бідних кварталів до Зали Верховного Конклаву з окремими погодними ефектами та тактичними бонусами (швидкість, готівка, джекпоти, щити).',
      '🗼 Чесні вежі: башні більше не стріляють за свою половину поля — перестрілки через річку відбуваються лише за участі бійців.',
      '🃏 5 збережених колод: перемикайтеся між 5 наборами карт однією кнопкою [1] [2] [3] [4] [5].',
      '🗑 Очищення та авто-слоти: додано кнопку очищення колоди, а натискання «Взяти в колоду» автоматично займає перший вільний слот.',
      '🎰 Потужний спавнер: Підпільний клуб тепер випускає відразу 4 шпани негайно при встановленні будівлі та кожні 7 секунд.'
    ]
  },
  {
    id: 'news_v0_3_2',
    version: '0.3.2',
    date: '21.11.2026',
    badge: 'ОНОВЛЕННЯ',
    badgeColor: '#10B981',
    title: 'Розкол міста: 8 нових карт, 2.5D графіка та Журнал новин!',
    summary: 'Масштабне оновлення балансу, новий тактичний візуал та оперативні зведення з фронту протистояння Мафії та Силовиків.',
    bannerEmoji: '🗞️',
    changes: [
      '🃏 8 нових тактичних карт: Підпалювач, Поліцейський вертоліт, Сльозогінний газ, Бульдозер, Круп\'є, Охоронець із дробовиком, Броньований лімузин та Закляття «Вендета».',
      '💥 Покращений Байкер-підривник: тепер вибухає навіть якщо гине на шляху, завдаючи сплеш-шкоди навколишнім ворогам.',
      '🏰 Тактична висадка: головна вежа зсунута вперед, позаду з\'явилося місце (~3 тайли) для безпечного розгортання захисників.',
      '🎮 2.5D жива перспектива: бійці тепер мають деталізовані тіла, капелюхи, зброю та анімацію пересування.',
      '📜 2 повноцінні кампанії Сюжету: окрема гілка Мафії (5 глав) та Поліції (5 глав) із механікою «Вендета» після поразок.',
      '🤖 Розумні боти: 8 адаптивних архетипів колод (від швидкого рашу до броньованої облоги).',
      '📰 Система сповіщень: вікно «Що нового» після оновлення та цілодобовий доступ до журналу новин.'
    ]
  },
  {
    id: 'news_v0_3_1',
    version: '0.3.1',
    date: '20.11.2026',
    badge: 'ОНОВЛЕННЯ',
    badgeColor: '#3B82F6',
    title: 'Система автооновлень та поліпшення мережевого кешу',
    summary: 'Додано надійний Service Worker з механізмом миттєвої перевірки версії та прогрес-баром оновлення без втрати збережень.',
    bannerEmoji: '⚡',
    changes: [
      '⬇️ Інтерактивний оверлей завантаження оновлень із відображенням 0% — 100%.',
      '💾 Автоматичне збереження профілів та підтримка гри в повному офлайн-режимі.',
      '📱 Покращений Android PWA маніфест з окремими маскованими іконками високої роздільності.'
    ]
  },
  {
    id: 'news_v0_3_0',
    version: '0.3.0',
    date: '20.11.2026',
    badge: 'РЕЛІЗ',
    badgeColor: '#D97706',
    title: 'Офіційний старт Mafia Royale: Нуарна RTS у браузері',
    summary: 'Початок битви за кримінальний контроль над містом: 18 базових карт, 4 унікальні вежі та нуар-джаз саундтрек.',
    bannerEmoji: '🎩',
    changes: [
      '⚔️ Вертикальне поле бою 9:16 у стилі Clash Royale з двома мостами та річкою.',
      '💼 3 типи кейсів (Конверт, Сейф, Дипломат) та щоденні акції чорного ринку.',
      '🎷 Живий нуар-джазовий саундтрек та автентичні звукові ефекти перестрілок.'
    ]
  }
];
