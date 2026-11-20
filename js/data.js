// =====================================================================
//  MAFIA ROYALE — DATA (єдине джерело балансу, арен, сюжету, акцій)
// =====================================================================

export const VERSION = '0.2.0';

// ---------- Рідкість ----------
export const RARITY = {
  common:    { id: 'common',    name: 'Звичайна',    color: '#4B5563', color2: '#374151', price: 25 },
  rare:      { id: 'rare',      name: 'Рідкісна',    color: '#1D4ED8', color2: '#1E3A8A', price: 80 },
  epic:      { id: 'epic',      name: 'Епічна',      color: '#6D28D9', color2: '#4C1D95', price: 250 },
  legendary: { id: 'legendary', name: 'Легендарна',  color: '#D97706', color2: '#92400E', price: 800 },
};

// ---------- Словник кодів швидкості ----------
export const SPEED_CODES = {
  STATIC: 0, SLOW: 1.0, MEDIUM: 1.5, FAST: 2.0, VERY_FAST: 2.5, INSTANT: 0,
};

// ---------- Арена ----------
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
    P: { king: { x: 9, y: 29 }, L: { x: 3.5, y: 25.5 }, R: { x: 14.5, y: 25.5 } },
    E: { king: { x: 9, y: 3 },  L: { x: 3.5, y: 6.5 },  R: { x: 14.5, y: 6.5 } },
  },
  kingRadius: 2.0,
  princessRadius: 1.5,
  pocketDepth: 5,
};

// ---------- Економіка бою (4 фази: 1хв 1x -> 2хв 1.35x -> 3хв 2x -> Додаткова хвилина 3x) ----------
export const ECONOMY = {
  maxCash: 10,
  startCash: 5,
  regenPerSec: 0.4,       // базова швидкість (+1$ / 2.5 сек)
  min1Mult: 1.0,          // 0:00 - 1:00 -> звичайний прибуток (x1)
  min2Mult: 1.35,         // 1:00 - 2:00 -> трохи швидше (x1.35)
  min3Mult: 2.0,          // 2:00 - 3:00 -> х2 (Облава)
  extraTimeMult: 3.0,     // 3:00 - 4:00 -> додатковий час при нічиїй (x3 + червоні краї)
  phase2At: 60,
  overtimeAt: 120,
  matchTime: 180,         // основний час 3:00
  extraMatchTime: 240,    // якщо нічия на 3:00 -> продовжується до 4:00
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
//  КАРТИ — 18 базових + архітектура під розширення до 150 карт за аренами
//  unlockArena: на якій арені відкривається карта
// =====================================================================
export const CARDS = [
  // --- Арена 1: Бідний квартал (базові вуличні бійці) ---
  {
    id: 'unit_bouncer', name: 'Викидайло', kind: 'unit', role: 'Ближній бій', rarity: 'common', unlockArena: 1,
    cost: 4, count: 1, hp: 1850, shield: 0, dmg: 125, atkSpeed: 1.5, speedCode: 'SLOW', speed: 1.0,
    range: 1, splash: 0, targets: 'BUILDINGS_ONLY', special: 'NONE',
    size: 0.65, sight: 7, aiRole: 'tank',
    desc: 'Колишній боксер у важкій вазі. Ігнорує дрібних ворогів і йде прямо ламати ворожі вежі.',
    look: { type: 'human', body: '#2b2b2b', skin: '#c99a76', hat: 'bald', weapon: 'fists', scale: 1.28, shades: true },
  },
  {
    id: 'unit_thugs', name: 'Вулична шпана', kind: 'unit', role: 'Масовка', rarity: 'common', unlockArena: 1,
    cost: 2, count: 4, hp: 120, shield: 0, dmg: 45, atkSpeed: 1.0, speedCode: 'VERY_FAST', speed: 2.4,
    range: 1, splash: 0, targets: 'GROUND', special: 'SWARM_4',
    size: 0.36, sight: 5.5, aiRole: 'swarm',
    desc: 'Четверо зухвалих хлопців із битами та кастетами. Дешево, швидко і дуже боляче, якщо не зупинити вчасно.',
    look: { type: 'human', body: '#6b4e2e', skin: '#d8a982', hat: 'cap', hatColor: '#525252', weapon: 'bat', scale: 0.85 },
  },
  {
    id: 'unit_hitman', name: 'Кілер', kind: 'unit', role: 'Стрілець', rarity: 'rare', unlockArena: 1,
    cost: 4, count: 1, hp: 440, shield: 0, dmg: 165, atkSpeed: 1.2, speedCode: 'MEDIUM', speed: 1.5,
    range: 6.5, splash: 0, targets: 'ALL', special: 'NONE',
    size: 0.44, sight: 7.5, aiRole: 'shooter', shot: 'sniper',
    desc: 'Професіонал у плащі зі снайперською гвинтівкою. Знімає цілі здалеку, але в ближньому бою беззахисний.',
    look: { type: 'human', body: '#23201d', skin: '#e0b48f', hat: 'fedora', hatColor: '#141414', weapon: 'rifle', shades: true },
  },
  {
    id: 'unit_biker', name: 'Байкер-підривник', kind: 'unit', role: 'Камікадзе', rarity: 'common', unlockArena: 1,
    cost: 2, count: 1, hp: 240, shield: 0, dmg: 320, atkSpeed: 0, speedCode: 'VERY_FAST', speed: 2.6,
    range: 1, splash: 2.0, targets: 'BUILDINGS_ONLY', special: 'SUICIDE_EXPLOSION',
    size: 0.48, sight: 7, aiRole: 'rush', vehicle: true,
    desc: 'Мчить на мотоциклі з динамітом прямо у ворожу точку. Підриває себе та все навколо.',
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
    id: 'unit_detective', name: 'Детектив під прикриттям', kind: 'unit', role: 'Скритний вбивця', rarity: 'epic', unlockArena: 2,
    cost: 3, count: 1, hp: 520, shield: 0, dmg: 140, atkSpeed: 1.1, speedCode: 'FAST', speed: 2.0,
    range: 1.2, splash: 0, targets: 'GROUND', special: 'STEALTH_UNTIL_HIT',
    size: 0.43, sight: 6, aiRole: 'assassin',
    desc: 'Підкрадається непоміченим. Вороги та вежі не бачать його, поки він не зробить перший удар.',
    look: { type: 'human', body: '#8a7350', skin: '#e0b48f', hat: 'fedora', hatColor: '#5b4a33', weapon: 'knife', coat: true, shades: true },
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
    id: 'bldg_casino_spawner', name: 'Підпільний клуб (Спавнер)', kind: 'building', role: 'Казарма', rarity: 'rare', unlockArena: 4,
    cost: 5, count: 1, hp: 850, shield: 0, dmg: 0, atkSpeed: 7, speedCode: 'STATIC', speed: 0,
    range: 0, splash: 0, targets: 'NONE', special: 'SPAWN_THUG_EVERY_7S',
    lifetime: 42, spawnEvery: 7, spawnCard: 'unit_thugs', spawnCount: 2,
    size: 1.0, aiRole: 'building_spawn',
    desc: 'Кожні 7 секунд випускає на вулицю двох бійців шпани, створюючи постійний тиск на лінію.',
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
];

// План розширення до 150 карт за аренами (30 слотів на кожну з 5 арен)
export const CARD_CAPACITY_TOTAL = 150;
export const CARD_CAPACITY_PER_ARENA = 30;

// Токени
export const TOKENS = {
  token_guard: {
    id: 'token_guard', name: 'Охоронець', kind: 'unit', rarity: 'rare',
    count: 1, hp: 220, shield: 0, dmg: 55, atkSpeed: 1.0, speed: 1.5, range: 3.5, splash: 0,
    targets: 'ALL', special: 'NONE', size: 0.4, sight: 5.5, shot: 'pistol',
    look: { type: 'human', body: '#4b5d43', skin: '#d2a07a', hat: 'cap', hatColor: '#2f3a2a', weapon: 'pistol' },
  },
};

export const CARD_MAP = Object.fromEntries(CARDS.map(c => [c.id, c]));
export function getDef(id) { return CARD_MAP[id] || TOKENS[id]; }

// =====================================================================
//  ВЕЖІ — 4 типи (Центральний Банк тепер дає +3$ Готівки!)
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
//  АРЕНИ (5 арен із особливими пулами розблокування карт)
// =====================================================================
export const ARENAS = [
  { id: 'arena_1', num: 1, name: 'Бідний квартал',        min: 0,   max: 99,   win: 30, lose: -15, bg: '#2C2E35', bridge: '#4A4E58', bpm: 60,  music: 'спокійний джаз-бас', theme: 'slums',
    specialty: 'Вуличні бійки та дешева масовка',
    desc: 'Стартова арена. Похмурі цегляні провулки, бочки з вогнем та старі бруківки.' },
  { id: 'arena_2', num: 2, name: 'Нічний порт',           min: 100, max: 249,  win: 30, lose: -15, bg: '#1B2838', bridge: '#34495E', bpm: 85,  music: 'напружений нуар-біт', theme: 'port',
    specialty: 'Спецпризначенці, дрони та стелс-операції',
    desc: 'Контейнерні термінали біля води, туман і світло прожекторів. Відкриває доступ до просунутих тактик.' },
  { id: 'arena_3', num: 3, name: 'Центр міста (Даунтаун)', min: 250, max: 449,  win: 30, lose: -15, bg: '#231F20', bridge: '#8E44AD', bpm: 105, music: 'динамічний синт-нуар', theme: 'downtown',
    specialty: 'Бронетехніка, Томмі-гани та польові медики',
    desc: 'Неоновий діловий центр із банками, казино та хмарочосами. Високі ставки.' },
  { id: 'arena_4', num: 4, name: 'Підпільне казино',      min: 450, max: 699,  win: 30, lose: -15, bg: '#1E352F', bridge: '#D4AF37', bpm: 115, music: 'швидкий свінг/екшн', theme: 'casino',
    specialty: 'Підпільні клуби-спавнери та підкуп охорони',
    desc: 'Червоні килими, зелене сукно та золоті люстри. Тут вирішується доля великих грошей.' },
  { id: 'arena_5', num: 5, name: 'Особняк на пагорбах',   min: 700, max: 9999, win: 30, lose: -15, bg: '#3B181E', bridge: '#E67E22', bpm: 125, music: 'епічний фінал', theme: 'mansion',
    specialty: 'Еліта кримінального світу: Дон та Адвокати',
    desc: 'Елітна резиденція Хрещеного батька. Найвища ліга кримінального світу.' },
];
export function arenaForTrophies(t) {
  let a = ARENAS[0];
  for (const ar of ARENAS) if (t >= ar.min) a = ar;
  return a;
}

// =====================================================================
//  КЕЙСИ — Збалансовані нагороди, покупка ТІЛЬКИ за монети (без безкоштовної роздачі)
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
//  СЮЖЕТНА КАМПАНІЯ («Хроніки Синдикату» — 5 глав) та Архетипи колод Бота
// =====================================================================
export const STORY_CHAPTERS = [
  {
    id: 'ch_1', num: 1, title: 'Глава I: Борги Старого Доку', boss: 'Рекет «М\'ясник» Буч',
    arenaId: 'arena_1', rewardGold: 100, botLevel: 1,
    tower: 'tower_mafia_mansion',
    deck: ['unit_bouncer', 'unit_thugs', 'unit_biker', 'unit_k9', 'bldg_barricade', 'spell_molotov', 'unit_hitman', 'spell_sniper_shot'],
    story: 'Банда Буча контролює склади Бідного кварталу і вимагає данину з ваших людей. Вибийте його викидайлів із кварталу й покажіть, чия це вулиця.',
  },
  {
    id: 'ch_2', num: 2, title: 'Глава II: Туман над Причалом №7', boss: 'Комісар Харді',
    arenaId: 'arena_2', rewardGold: 160, botLevel: 2,
    tower: 'tower_police_precinct',
    deck: ['unit_swat', 'unit_drone', 'unit_k9', 'unit_hitman', 'unit_detective', 'bldg_barricade', 'spell_sniper_shot', 'spell_molotov'],
    story: 'Нічний порт оточений спецпризначенцями SWAT і дронами комісара Харді. Прорвіть поліцейський кордон, щоб перехопити контрабандний вантаж.',
  },
  {
    id: 'ch_3', num: 3, title: 'Глава III: Пограбування на П\'ятій авеню', boss: 'Капо Вінченцо «Свинець»',
    arenaId: 'arena_3', rewardGold: 240, botLevel: 3,
    tower: 'tower_armored_bank',
    deck: ['unit_armored_van', 'unit_tommy', 'unit_medic', 'unit_hitman', 'unit_swat', 'spell_molotov', 'bldg_barricade', 'unit_biker'],
    story: 'Вінченцо жене броньовані інкасатори під прикриттям Томмі-ганів і підпільних лікарів прямо через Даунтаун. Зупиніть його колону!',
  },
  {
    id: 'ch_4', num: 4, title: 'Глава IV: Ва-банк у «Роялі»', boss: 'Мадам Рубі',
    arenaId: 'arena_4', rewardGold: 350, botLevel: 4,
    tower: 'tower_underground_casino',
    deck: ['bldg_casino_spawner', 'spell_bribe', 'unit_detective', 'unit_tommy', 'unit_bouncer', 'unit_medic', 'spell_molotov', 'unit_thugs'],
    story: 'У підпільному казино Мадам Рубі все куплено: її охоронці вибігають із клубів кожні кілька секунд, а хабарі паралізують нашу оборону.',
  },
  {
    id: 'ch_5', num: 5, title: 'Глава V: Падіння Старого Дона', boss: 'Дон Сальваторе',
    arenaId: 'arena_5', rewardGold: 600, botLevel: 5,
    tower: 'tower_mafia_mansion',
    deck: ['unit_don', 'unit_lawyer', 'unit_tommy', 'unit_medic', 'unit_armored_van', 'spell_bribe', 'spell_molotov', 'unit_hitman'],
    story: 'Фінальний штурм особняка на пагорбах. Дон Сальваторе особисто виходить на вулицю з адвокатами та елітною охороною. Заберіть титул Боса міст!',
  },
];

// Іменовані тактичні колоди Бота для режиму «Бій з Ботом» та інших режимів
export const BOT_ARCHETYPES = [
  {
    id: 'arch_rush', name: 'Вуличний Наліт', style: 'Швидкий раш',
    tower: 'tower_underground_casino',
    deck: ['unit_biker', 'unit_thugs', 'unit_k9', 'unit_detective', 'unit_armored_van', 'spell_molotov', 'spell_bribe', 'unit_hitman'],
  },
  {
    id: 'arch_police', name: 'Залізний Кордон SWAT', style: 'Оборона та контроль',
    tower: 'tower_police_precinct',
    deck: ['unit_swat', 'unit_drone', 'bldg_barricade', 'unit_lawyer', 'unit_hitman', 'unit_k9', 'spell_sniper_shot', 'unit_armored_van'],
  },
  {
    id: 'arch_syndicate', name: 'Сім\'я Хрещеного Батька', style: 'Важкий пуш із бафом',
    tower: 'tower_mafia_mansion',
    deck: ['unit_don', 'unit_bouncer', 'unit_tommy', 'unit_medic', 'bldg_casino_spawner', 'spell_molotov', 'spell_bribe', 'unit_thugs'],
  },
  {
    id: 'arch_heist', name: 'Банківський Таран', style: 'Техніка та економіка',
    tower: 'tower_armored_bank',
    deck: ['unit_armored_van', 'unit_biker', 'unit_tommy', 'unit_swat', 'bldg_barricade', 'spell_sniper_shot', 'spell_molotov', 'unit_drone'],
  },
];

export const GAME_MODES = [
  { id: 'ranked',   name: 'Рейтинговий Бій', icon: '🏆', desc: 'Бій за Авторитет (+30 / -15). Бот підбирається під вашу силу та використовує тактичні архетипи.' },
  { id: 'story',    name: 'Сюжет: Хроніки Синдикату', icon: '📜', desc: '5 сюжетних глав проти унікальних босів районів із грошовими винагородами.' },
  { id: 'raid_x2',  name: 'Режим «Подвійна Облава»', icon: '🚨', desc: 'Спецрежим: Готівка накопичується у 2 рази швидше з першої секунди бою!' },
  { id: 'draft',    name: 'Сліпий Контракт (Випадкова колода)', icon: '🎲', desc: 'Обидва гравці отримують випадкову збалансовану колоду та вежу рівних рівнів.' },
];

// ---------- JUICE / VFX параметри ----------
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
  'unit_bouncer', 'unit_thugs', 'unit_hitman', 'unit_swat',
  'unit_biker', 'spell_molotov', 'spell_sniper_shot', 'bldg_barricade',
];
export const DEFAULT_TOWER = 'tower_mafia_mansion';
