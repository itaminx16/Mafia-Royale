// =====================================================================
//  STORAGE — система акаунтів/профілів, авто-вхід, адмін Itaminx (код 1616),
//            статистика, щоденні акції ринку та генерація кейсів
// =====================================================================
import {
  CARDS, DEFAULT_DECK, DEFAULT_TOWER, CARD_MAP, TOWER_MAP,
  UPGRADE_COST, LEVEL_MAX, CHESTS, RARITY, arenaForTrophies,
} from './data.js';

const ACCOUNTS_KEY = 'mafiaRoyale.accounts.v2';
const SESSION_KEY  = 'mafiaRoyale.session.v2';
const LEGACY_KEY   = 'mafiaRoyale.save.v1';

export const ADMIN_USERNAME = 'itaminx';
export const ADMIN_SECRET   = '1616';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Генерація 4 щоденних пропозицій ринку («Акції дня»)
export function buildDailyDeals(seedStr = todayKey()) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const nextRand = () => {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const commons = CARDS.filter(c => c.rarity === 'common');
  const rares   = CARDS.filter(c => c.rarity === 'rare');
  const epics   = CARDS.filter(c => c.rarity === 'epic');
  const legs    = CARDS.filter(c => c.rarity === 'legendary');

  const pick = arr => arr[Math.floor(nextRand() * arr.length)];
  const c1 = pick(commons);
  const c2 = pick(rares);
  const c3 = pick(epics);
  const c4 = pick(legs);

  return [
    { id: 'deal_1', cardId: c1.id, count: 4, price: 75,  oldPrice: 100, discount: '-25%', bought: false },
    { id: 'deal_2', cardId: c2.id, count: 2, price: 120, oldPrice: 160, discount: '-25%', bought: false },
    { id: 'deal_3', cardId: c3.id, count: 1, price: 190, oldPrice: 250, discount: '-24%', bought: false },
    { id: 'deal_4', cardId: c4.id, count: 1, price: 600, oldPrice: 800, discount: '-25%', bought: false },
  ];
}

function defaultProfile(username = 'Новачок', password = '') {
  const cards = {};
  for (const c of CARDS) cards[c.id] = { level: 1, count: 0 };
  const isAdmin = username.trim().toLowerCase() === ADMIN_USERNAME;
  return {
    v: 2,
    username: username.trim(),
    password,
    isAdmin,
    createdAt: new Date().toISOString(),
    trophies: 0,
    maxTrophies: 0,
    gold: 500,
    cards,
    deck: [...DEFAULT_DECK],
    tower: DEFAULT_TOWER,
    selectedArena: 'arena_1',
    autoArena: true, // автоматично піднімати арену за кубками
    gameMode: 'ranked',
    storyDone: {},   // { ch_1: true, ... }
    dailyDeals: { date: todayKey(), items: buildDailyDeals(todayKey()) },
    stats: {
      wins: 0,
      losses: 0,
      draws: 0,
      battles: 0,
      crownsWon: 0,
      crownsLost: 0,
      threeCrownWins: 0,
      streak: 0,
      bestStreak: 0,
      chestsOpened: 0,
      cardsPlayed: {},
    },
    settings: { sound: true, music: true, fullscreen: false },
  };
}

function normalizeProfile(d, fallbackName = 'Гравець') {
  const def = defaultProfile(d?.username || fallbackName, d?.password || '');
  if (!d || typeof d !== 'object') return def;

  d.username = (d.username || fallbackName).trim();
  d.isAdmin = d.username.toLowerCase() === ADMIN_USERNAME;
  d.cards = d.cards || {};
  for (const c of CARDS) if (!d.cards[c.id]) d.cards[c.id] = { level: 1, count: 0 };

  d.deck = (Array.isArray(d.deck) ? d.deck : def.deck).filter(id => CARD_MAP[id]);
  for (const id of def.deck) { if (d.deck.length >= 8) break; if (!d.deck.includes(id)) d.deck.push(id); }
  for (const c of CARDS) { if (d.deck.length >= 8) break; if (!d.deck.includes(c.id)) d.deck.push(c.id); }
  d.deck = d.deck.slice(0, 8);

  if (!TOWER_MAP[d.tower]) d.tower = def.tower;
  d.stats = Object.assign(def.stats, d.stats || {});
  d.stats.cardsPlayed = d.stats.cardsPlayed || {};
  d.settings = Object.assign(def.settings, d.settings || {});
  d.storyDone = d.storyDone || {};

  if (typeof d.trophies !== 'number') d.trophies = 0;
  if (typeof d.maxTrophies !== 'number' || d.maxTrophies < d.trophies) d.maxTrophies = d.trophies;
  if (typeof d.gold !== 'number') d.gold = def.gold;
  if (typeof d.autoArena !== 'boolean') d.autoArena = true;
  d.gameMode = d.gameMode || 'ranked';

  if (d.autoArena) {
    d.selectedArena = arenaForTrophies(d.trophies).id;
  } else {
    d.selectedArena = d.selectedArena || arenaForTrophies(d.trophies).id;
  }

  const tk = todayKey();
  if (!d.dailyDeals || d.dailyDeals.date !== tk || !Array.isArray(d.dailyDeals.items)) {
    d.dailyDeals = { date: tk, items: buildDailyDeals(tk) };
  }
  return d;
}

export const Save = {
  accounts: {}, // { lowerName: profileObj }
  currentKey: null,
  data: null,

  load() {
    let accs = null;
    try { accs = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || 'null'); } catch (e) { accs = null; }
    if (!accs || typeof accs !== 'object') accs = {};

    // Якщо є старий сейв v1 і ще немає акаунтів — переносимо його як профіль
    if (Object.keys(accs).length === 0) {
      try {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
        if (legacy && typeof legacy === 'object') {
          legacy.username = legacy.username || 'Капо';
          accs[legacy.username.toLowerCase()] = normalizeProfile(legacy, 'Капо');
        }
      } catch (e) {}
    }

    for (const [k, prof] of Object.entries(accs)) {
      accs[k] = normalizeProfile(prof, prof?.username || k);
    }
    this.accounts = accs;

    let sess = null;
    try { sess = localStorage.getItem(SESSION_KEY); } catch (e) {}
    if (sess && this.accounts[sess]) {
      this.currentKey = sess;
      this.data = this.accounts[sess];
    } else {
      this.currentKey = null;
      this.data = defaultProfile('Гість', ''); // тимчасовий об'єкт до входу
    }
    this._persistAccounts();
    return this.data;
  },

  isLoggedIn() {
    return !!(this.currentKey && this.accounts[this.currentKey]);
  },

  listAccounts() {
    return Object.values(this.accounts).map(a => ({
      username: a.username,
      isAdmin: a.isAdmin,
      trophies: a.trophies,
      gold: a.gold,
    }));
  },

  isAdminName(username) {
    return (username || '').trim().toLowerCase() === ADMIN_USERNAME;
  },

  accountExists(username) {
    const key = (username || '').trim().toLowerCase();
    return !!this.accounts[key];
  },

  register(username, password, secretCode = '') {
    const clean = (username || '').trim();
    if (clean.length < 2 || clean.length > 16) {
      return { ok: false, error: 'Нікнейм має містити від 2 до 16 символів.' };
    }
    if (!password || password.length < 3) {
      return { ok: false, error: 'Пароль має містити мінімум 3 символи.' };
    }
    const key = clean.toLowerCase();
    if (this.accounts[key]) {
      return { ok: false, error: 'Такий профіль вже існує. Перейдіть на вкладку «Увійти».' };
    }
    if (key === ADMIN_USERNAME && secretCode.trim() !== ADMIN_SECRET) {
      return { ok: false, needSecret: true, error: 'Для профілю адміністратора Itaminx потрібен секретний код!' };
    }
    const prof = defaultProfile(clean, password);
    this.accounts[key] = prof;
    this.currentKey = key;
    this.data = prof;
    this.save();
    return { ok: true, profile: prof };
  },

  login(username, password, secretCode = '') {
    const clean = (username || '').trim();
    const key = clean.toLowerCase();
    const prof = this.accounts[key];
    if (!prof) {
      // Якщо це перший вхід адміна Itaminx — дозволяємо одразу створити його після перевірки 1616
      if (key === ADMIN_USERNAME) {
        if (!password || password.length < 3) {
          return { ok: false, error: 'Введіть пароль (мінімум 3 символи) для створення адмін-профілю Itaminx.' };
        }
        if (secretCode.trim() !== ADMIN_SECRET) {
          return { ok: false, needSecret: true, error: 'Введіть секретний код адміністратора.' };
        }
        return this.register(clean, password, secretCode);
      }
      return { ok: false, error: 'Профіль не знайдено. Спочатку створіть його.' };
    }
    if (prof.password !== password) {
      return { ok: false, error: 'Невірний пароль.' };
    }
    if (key === ADMIN_USERNAME && secretCode.trim() !== ADMIN_SECRET) {
      return { ok: false, needSecret: true, error: 'Введіть секретний код адміністратора!' };
    }
    this.currentKey = key;
    this.data = normalizeProfile(prof, prof.username);
    this.accounts[key] = this.data;
    this.save();
    return { ok: true, profile: this.data };
  },

  logout() {
    this.currentKey = null;
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  },

  _persistAccounts() {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(this.accounts));
      if (this.currentKey) localStorage.setItem(SESSION_KEY, this.currentKey);
    } catch (e) { console.warn('save failed', e); }
  },

  save() {
    if (this.currentKey && this.data) {
      this.accounts[this.currentKey] = this.data;
    }
    this._persistAccounts();
  },

  reset() {
    if (!this.currentKey) return;
    const old = this.data;
    const fresh = defaultProfile(old.username, old.password);
    this.accounts[this.currentKey] = fresh;
    this.data = fresh;
    this.save();
  },

  level(id) { return (this.data.cards[id] && this.data.cards[id].level) || 1; },

  levelsMap() {
    const m = {};
    for (const c of CARDS) m[c.id] = this.level(c.id);
    return m;
  },

  avgDeckLevel() {
    const d = this.data.deck;
    if (!d || !d.length) return 1;
    return d.reduce((s, id) => s + this.level(id), 0) / d.length;
  },

  favoriteCardId() {
    const cp = (this.data.stats && this.data.stats.cardsPlayed) || {};
    let best = this.data.deck[0] || CARDS[0].id, bn = -1;
    for (const [id, n] of Object.entries(cp)) {
      if (n > bn && CARD_MAP[id]) { bn = n; best = id; }
    }
    return { id: best, count: Math.max(0, bn) };
  },

  upgradeInfo(id) {
    const st = this.data.cards[id];
    if (st.level >= LEVEL_MAX) return { max: true };
    const need = UPGRADE_COST[st.level + 1];
    return {
      max: false, next: st.level + 1, cards: need.cards, gold: need.gold, have: st.count,
      canAfford: st.count >= need.cards && this.data.gold >= need.gold,
    };
  },

  upgrade(id) {
    const info = this.upgradeInfo(id);
    if (info.max || !info.canAfford) return false;
    const st = this.data.cards[id];
    st.count -= info.cards;
    this.data.gold -= info.gold;
    st.level += 1;
    this.save();
    return true;
  },

  // --- Адмін-функції для Itaminx ---
  adminGrantAll() {
    if (!this.data.isAdmin) return false;
    this.data.gold += 50000;
    for (const c of CARDS) {
      this.data.cards[c.id].count += 100;
    }
    this.save();
    return true;
  },

  adminMaxAllCards() {
    if (!this.data.isAdmin) return false;
    for (const c of CARDS) {
      this.data.cards[c.id].level = LEVEL_MAX;
      this.data.cards[c.id].count = Math.max(this.data.cards[c.id].count, 50);
    }
    this.save();
    return true;
  },

  adminSetTrophies(val) {
    if (!this.data.isAdmin) return false;
    this.data.trophies = Math.max(0, Math.round(val));
    this.data.maxTrophies = Math.max(this.data.maxTrophies || 0, this.data.trophies);
    if (this.data.autoArena) {
      this.data.selectedArena = arenaForTrophies(this.data.trophies).id;
    }
    this.save();
    return true;
  },
};

// ---------- Генерація вмісту кейсу (помірні, збалансовані нагороди) ----------
function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function rollChestType() {
  const r = Math.random();
  let acc = 0;
  for (const c of CHESTS) { acc += c.chance; if (r < acc) return c; }
  return CHESTS[0];
}

export function generateChest(chest) {
  const byR = r => CARDS.filter(c => c.rarity === r);
  const gold = randInt(chest.goldMin, chest.goldMax);
  const list = [];

  let legendary = 0;
  if (chest.legendaryChance && Math.random() < chest.legendaryChance) legendary = 1;
  let epic = chest.epic || 0;
  if (chest.epicChance && Math.random() < chest.epicChance) epic += 1;
  let rare = chest.rare || 0;
  if (chest.rareChance && Math.random() < chest.rareChance) rare += 1;

  const commons = Math.max(0, chest.cards - rare - epic - legendary);

  const addStacks = (rarity, n, maxStacks) => {
    if (n <= 0) return;
    const pool = byR(rarity);
    const stacks = Math.min(n, maxStacks);
    const chosen = [];
    for (let i = 0; i < stacks; i++) {
      let p = pick(pool), guard = 0;
      while (chosen.includes(p.id) && guard++ < 10) p = pick(pool);
      chosen.push(p.id);
    }
    const counts = chosen.map(() => 1);
    for (let i = stacks; i < n; i++) counts[randInt(0, stacks - 1)]++;
    chosen.forEach((id, i) => list.push({ id, count: counts[i], rarity }));
  };

  addStacks('common', commons, 2);
  addStacks('rare', rare, 2);
  addStacks('epic', epic, 1);
  addStacks('legendary', legendary, 1);

  const merged = [];
  for (const it of list) {
    const m = merged.find(x => x.id === it.id);
    if (m) m.count += it.count; else merged.push({ ...it });
  }
  const order = Object.keys(RARITY);
  merged.sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
  return { chest, gold, cards: merged };
}

export function applyChest(reward) {
  Save.data.gold += reward.gold;
  for (const it of reward.cards) Save.data.cards[it.id].count += it.count;
  Save.data.stats.chestsOpened = (Save.data.stats.chestsOpened || 0) + 1;
  Save.save();
}
