const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROLES = require('./roles');
const RoleBalance = require('./public/role-balance');

const app = express();
app.disable('x-powered-by');
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e6 });

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

app.use((req, res, next) => {
  const lower = req.path.toLowerCase();
  if (
    ['/database.json', '/server.js', '/.env', '/package.json', '/package-lock.json', '/roles.js'].includes(lower) ||
    lower.startsWith('/scripts') ||
    lower.endsWith('.tmp')
  ) {
    return res.status(403).send('Forbidden');
  }
  next();
});

const USE_DIST = (process.env.NODE_ENV === 'production' || process.env.USE_DIST === '1') &&
  fs.existsSync(path.join(__dirname, 'public', 'dist', 'app.js'));
if (USE_DIST) {
  app.get(['/app.js', '/icons.js', '/i18n.js', '/minigames.js', '/role-balance.js', '/style.css'], (req, res, next) => {
    const distFile = path.join(__dirname, 'public', 'dist', path.basename(req.path));
    if (fs.existsSync(distFile)) return res.sendFile(distFile);
    next();
  });
}

const APP_VERSION = '1.2.2';
const CURRENT_RELEASE_NOTES = {
  version: APP_VERSION,
  date: '21.11.2026',
  titleUa: `Оновлення v${APP_VERSION} — Виправлення відображення аватара у публічному профілі`,
  titleEn: `Update v${APP_VERSION} — Public Profile Avatar Display Fix`,
  itemsUa: [
    'Виправлено розмір аватара у вікні публічного профілю на Android та інших пристроях — тепер фото коректно відображається в акуратній круглій рамці з вибраним кольором ободка та ефектом рамки.'
  ],
  itemsEn: [
    'Fixed avatar sizing in the Public Profile modal on Android and mobile devices — avatars now display cleanly inside the circular frame with your chosen ring color and equipped shop frame.'
  ]
};

app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    donationUrl: process.env.DONATION_URL || '',
    appVersion: APP_VERSION,
    releaseNotes: CURRENT_RELEASE_NOTES
  });
});

app.get(['/avatars/:file', '/roles_avatars/:file'], (req, res, next) => {
  const filePath = path.join(__dirname, 'public', req.path);
  if (fs.existsSync(filePath)) {
    try {
      const fd = fs.openSync(filePath, 'r');
      const buf = Buffer.alloc(16);
      fs.readSync(fd, buf, 0, 16, 0);
      fs.closeSync(fd);
      const head = buf.toString('utf8').trimStart();
      if (head.startsWith('<svg') || head.startsWith('<?xml')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (buf[0] === 0xFF && buf[1] === 0xD8) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else {
        res.setHeader('Content-Type', 'image/png');
      }
    } catch (e) {}
    return res.sendFile(filePath);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'database.json');
const ADMIN_NICK = process.env.ADMIN_NICK || 'Itaminx';
const DEV_SECRET_CODE = process.env.DEV_SECRET_CODE || '1616';

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

const BOT_CATALOG = [
  { id: 'bot_alex', name: 'Бот_Алекс', avatar: 'SLOT:1', style: 'Аналітик', styleEn: 'Analyst' },
  { id: 'bot_vika', name: 'Бот_Віка', avatar: 'SLOT:3', style: 'Інтуїтивна', styleEn: 'Intuitive' },
  { id: 'bot_max', name: 'Бот_Макс', avatar: 'SLOT:2', style: 'Провокатор', styleEn: 'Provoker' },
  { id: 'bot_sofia', name: 'Бот_Софія', avatar: 'SLOT:4', style: 'Миротворка', styleEn: 'Peacemaker' },
  { id: 'bot_artem', name: 'Бот_Артем', avatar: 'SLOT:5', style: 'Блефер', styleEn: 'Bluffer' },
  { id: 'bot_diana', name: 'Бот_Діана', avatar: 'SLOT:6', style: 'Шпигунка', styleEn: 'Spy' },
  { id: 'bot_taras', name: 'Бот_Тарас', avatar: 'SLOT:7', style: 'Тихій', styleEn: 'Quiet' },
  { id: 'bot_olena', name: 'Бот_Олена', avatar: 'SLOT:8', style: 'Репортерка', styleEn: 'Reporter' },
  { id: 'bot_igor', name: 'Бот_Ігор', avatar: 'SLOT:9', style: 'Захисник', styleEn: 'Protector' },
  { id: 'bot_nastya', name: 'Бот_Настя', avatar: 'SLOT:10', style: 'Хитрунка', styleEn: 'Clever' },
  { id: 'bot_denys', name: 'Бот_Денис', avatar: 'SLOT:11', style: 'Слідчий', styleEn: 'Sleuth' },
  { id: 'bot_katya', name: 'Бот_Катя', avatar: 'SLOT:12', style: 'Адвокатка', styleEn: 'Advocate' },
  { id: 'bot_bogdan', name: 'Бот_Богдан', avatar: 'SLOT:13', style: 'Тактик', styleEn: 'Tactician' },
  { id: 'bot_marina', name: 'Бот_Марина', avatar: 'SLOT:14', style: 'Лідерка', styleEn: 'Leader' },
  { id: 'bot_roman', name: 'Бот_Роман', avatar: 'SLOT:15', style: 'Вартовий', styleEn: 'Sentinel' },
  { id: 'bot_iryna', name: 'Бот_Ірина', avatar: 'SLOT:16', style: 'Агентка', styleEn: 'Agent' }
];
const BOT_NAMES = BOT_CATALOG.map(b => b.name);

const SHOP_ITEMS = [
  // === ПОДАРУНКИ ЗА СТІЛ (24 шт.) ===
  { id: 'gift_coffee', type: 'gift', category: 'gift', currency: 'coins', icon: '☕', sound: 'chime', name: '☕ Еспресо Детектива', nameEn: '☕ Detective Espresso', price: 35, desc: 'Підбадьорлива кава для гравця за столом.', descEn: 'An energizing espresso for a player at the table.' },
  { id: 'gift_rose', type: 'gift', category: 'gift', currency: 'coins', icon: '🌹', sound: 'chime', name: '🌹 Червона троянда', nameEn: '🌹 Red Rose', price: 40, desc: 'Класичний жест поваги або таємної симпатії.', descEn: 'A classic gesture of respect or secret admiration.' },
  { id: 'gift_dice', type: 'gift', category: 'gift', currency: 'coins', icon: '🎲', sound: 'chime', name: '🎲 Щасливі кості', nameEn: '🎲 Lucky Dice', price: 40, desc: 'Побажання удачі в нічних ходах та голосуванні.', descEn: 'Wishing luck in night moves and day votes.' },
  { id: 'gift_cigar', type: 'gift', category: 'gift', currency: 'coins', icon: '🚬', sound: 'toast', name: '🚬 Кубинська сигара', nameEn: '🚬 Cuban Cigar', price: 45, desc: 'Атрибут справжнього мафіозі 1930-х.', descEn: 'A true 1930s mobster signature.' },
  { id: 'gift_whiskey', type: 'gift', category: 'gift', currency: 'coins', icon: '🥃', sound: 'toast', name: '🥃 Витриманий віскі', nameEn: '🥃 Aged Whiskey', price: 50, desc: 'Солідний подарунок союзнику за столом.', descEn: 'A classy drink gift for an ally at the table.' },
  { id: 'gift_medkit', type: 'gift', category: 'gift', currency: 'coins', icon: '🩺', sound: 'chime', name: '🩺 Аптечка порятунку', nameEn: '🩺 Rescue Medkit', price: 55, desc: 'Знак довіри мирному лікарю чи союзнику.', descEn: 'A token of trust for the Doctor or an ally.' },
  { id: 'gift_handcuffs', type: 'gift', category: 'gift', currency: 'coins', icon: '⛓️', sound: 'chime', name: '⛓️ Кайданки Шерифа', nameEn: '⛓️ Sheriff Handcuffs', price: 60, desc: 'Натяк підозрілому гравцю: ми за вами стежимо.', descEn: 'A subtle warning: we are watching you.' },
  { id: 'gift_dossier', type: 'gift', category: 'gift', currency: 'coins', icon: '📁', sound: 'chime', name: '📁 Таємне досьє', nameEn: '📁 Secret Dossier', price: 65, desc: 'Зібраний компромат просто на стіл!', descEn: 'Gathered intel dropped straight onto the table!' },
  { id: 'gift_fedora', type: 'gift', category: 'gift', currency: 'coins', icon: '🎩', sound: 'toast', name: '🎩 Капелюх-федора', nameEn: '🎩 Noir Fedora', price: 70, desc: 'Знімаємо капелюха перед майстерною грою.', descEn: 'Hats off to a brilliant play.' },
  { id: 'gift_briefcase', type: 'gift', category: 'gift', currency: 'coins', icon: '💼', sound: 'chime', name: '💼 Кейс із готівкою', nameEn: '💼 Cash Briefcase', price: 70, desc: 'Стильний жест ділового партнера за столом.', descEn: 'A stylish gesture from a business partner.' },
  { id: 'gift_molotov', type: 'gift', category: 'gift', currency: 'coins', icon: '🔥', sound: 'explosion', name: '🔥 Коктейль Молотова', nameEn: '🔥 Molotov Cocktail', price: 75, desc: 'Гарячий натяк підозрюваному.', descEn: 'A fiery warning for a suspect.' },
  { id: 'gift_saxophone', type: 'gift', category: 'gift', currency: 'coins', icon: '🎷', sound: 'toast', name: '🎷 Джазовий саксофон', nameEn: '🎷 Jazz Saxophone', price: 75, desc: 'Нічна мелодія джаз-клубу для атмосферного гравця.', descEn: 'Late-night jazz melody for an atmospheric player.' },
  { id: 'gift_champagne', type: 'gift', category: 'gift', currency: 'coins', icon: '🍾', sound: 'toast', name: '🍾 Шампанське перемоги', nameEn: '🍾 Victory Champagne', price: 80, desc: 'Святковий тост на честь чудового ходу!', descEn: 'A celebratory toast to a great move!' },
  { id: 'gift_poker', type: 'gift', category: 'gift', currency: 'coins', icon: '🃏', sound: 'chime', name: '🃏 Флеш-Рояль', nameEn: '🃏 Royal Flush', price: 85, desc: 'Визнання блискучого блефу та переможної комбінації.', descEn: 'Saluting a brilliant bluff and winning hand.' },
  { id: 'gift_blackmark', type: 'gift', category: 'gift', currency: 'coins', icon: '🏴', sound: 'explosion', name: '🏴 Чорна мітка', nameEn: '🏴 Black Mark', price: 85, desc: 'Знак небезпеки поверх ніку гравця.', descEn: 'A sinister mark placed next to a player name.' },
  { id: 'gift_dagger', type: 'gift', category: 'gift', currency: 'coins', icon: '🗡️', sound: 'explosion', name: '🗡️ Кинджал зради', nameEn: '🗡️ Dagger of Betrayal', price: 90, desc: 'Для тих, хто грає занадто хитро.', descEn: 'For those playing a double game.' },
  { id: 'gift_ring', type: 'gift', category: 'gift', currency: 'coins', icon: '💍', sound: 'chime', name: '💍 Перстень Синдикату', nameEn: '💍 Syndicate Ring', price: 95, desc: 'Почесний знак прихильності.', descEn: 'An honorable token of loyalty.' },
  { id: 'gift_mask_gold', type: 'gift', category: 'gift', currency: 'coins', icon: '🎭', sound: 'toast', name: '🎭 Золота маска', nameEn: '🎭 Golden Mask', price: 110, desc: 'Для найкращого актора за столом!', descEn: 'For the best actor at the table!' },
  { id: 'gift_car', type: 'gift', category: 'gift', currency: 'coins', icon: '🚘', sound: 'toast', name: '🚘 Ретро-Кадиллак', nameEn: '🚘 Retro Cadillac', price: 120, desc: 'Розкішний нуарний лімузин 1930-х до столу!', descEn: 'Luxury 1930s noir limousine at the table!' },
  { id: 'gift_crown_mini', type: 'gift', category: 'gift', currency: 'coins', icon: '👑', sound: 'toast', name: '👑 Корона Вечора', nameEn: '👑 Crown of the Night', price: 125, desc: 'Визнання лідера цього матчу.', descEn: 'Recognizing the leader of the match.' },
  { id: 'gift_diamond_boss', type: 'gift', category: 'gift', currency: 'diamonds', icon: '💎', sound: 'rare', rare: true, name: '💎 Діамантовий Перстень Боса', nameEn: '💎 Boss Diamond Ring', price: 5, desc: 'РІДКІСНИЙ подарунок з особливим звуком та сяйвом!', descEn: 'RARE gift with special sound and glow!' },
  { id: 'gift_champagne_vip', type: 'gift', category: 'gift', currency: 'diamonds', icon: '🥂', sound: 'rare', rare: true, name: '🥂 Кришталеве шампанське', nameEn: '🥂 Crystal Champagne', price: 6, desc: 'РІДКІСНИЙ елітний тост із золотим конфеті!', descEn: 'RARE elite toast with golden confetti!' },
  { id: 'gift_tommy', type: 'gift', category: 'gift', currency: 'diamonds', icon: '🔫', sound: 'rare', rare: true, name: '🔫 Золотий Томпсон', nameEn: '🔫 Golden Tommy Gun', price: 8, desc: 'РІДКІСНИЙ легендарний трофей за стіл!', descEn: 'RARE legendary trophy for the table!' },
  { id: 'gift_voodoo', type: 'gift', category: 'gift', currency: 'diamonds', icon: '🔮', sound: 'rare', rare: true, name: '🔮 Таємний амулет нуару', nameEn: '🔮 Noir Arcane Amulet', price: 10, desc: 'РІДКІСНИЙ містичний оберіг із фіолетовим сяйвом!', descEn: 'RARE mystical charm with violet glow!' },

  // === РАМКИ АВАТАРА ===
  { id: 'frame_gold', type: 'frame', category: 'frame', currency: 'coins', name: '👑 Золота рамка Дона', nameEn: '👑 Don Gold Frame', price: 180, desc: 'Елітна золота рамка навколо вашої аватарки.', descEn: 'Elite golden frame around your avatar.' },
  { id: 'frame_neon', type: 'frame', category: 'frame', currency: 'coins', name: '💠 Неонова рамка Кібер', nameEn: '💠 Cyber Neon Frame', price: 280, desc: 'Яскраве неонове підсвічування профілю.', descEn: 'Bright neon highlight around your profile.' },
  { id: 'frame_emerald', type: 'frame', category: 'frame', currency: 'coins', name: '💚 Смарагдова рамка Боса', nameEn: '💚 Boss Emerald Frame', price: 350, desc: 'Благородне смарагдове сяйво навколо портрета.', descEn: 'Noble emerald glow around your portrait.' },
  { id: 'frame_blood', type: 'frame', category: 'frame', currency: 'coins', name: '🩸 Рубінова рамка Мафії', nameEn: '🩸 Mafia Ruby Frame', price: 420, desc: 'Темно-червона рамка для справжніх босів.', descEn: 'Deep crimson frame for true bosses.' },
  { id: 'frame_diamond', type: 'frame', category: 'frame', currency: 'diamonds', name: '💎 Діамантова рамка Еліти', nameEn: '💎 Elite Diamond Frame', price: 25, desc: 'Ексклюзивна кришталево-неонова рамка з переливом.', descEn: 'Exclusive shimmering crystal-neon frame.' },
  { id: 'frame_inferno', type: 'frame', category: 'frame', currency: 'diamonds', name: '🔥 Рамка Інферно Синдикату', nameEn: '🔥 Syndicate Inferno Frame', price: 35, desc: 'Вогняне нуарне сяйво навколо вашого портрета.', descEn: 'Fiery noir aura around your portrait.' },

  // === ЕФЕКТИ ВИБУТТЯ ===
  { id: 'fx_bullet', type: 'death_fx', category: 'death_fx', currency: 'coins', name: '🔫 Ефект: Слід від кулі', nameEn: '🔫 FX: Bullet Shot', price: 320, desc: 'Особливий ефект при вибутті з гри.', descEn: 'Special gunshot animation on elimination.' },
  { id: 'fx_glass', type: 'death_fx', category: 'death_fx', currency: 'coins', name: '💥 Ефект: Розбите скло', nameEn: '💥 FX: Shattered Glass', price: 320, desc: 'Ефект розбитого скла при вибутті.', descEn: 'Flying glass shards effect on elimination.' },
  { id: 'fx_spotlight', type: 'death_fx', category: 'death_fx', currency: 'coins', name: '🔦 Ефект: Прожектор затримання', nameEn: '🔦 FX: Police Spotlight', price: 360, desc: 'Драматичний промінь поліцейського прожектора.', descEn: 'Dramatic sweeping police searchlights.' },
  { id: 'fx_noir_rain', type: 'death_fx', category: 'death_fx', currency: 'diamonds', name: '🌧️ Ефект: Нуарна злива', nameEn: '🌧️ FX: Noir Downpour', price: 20, desc: 'Атмосферне затемнення при виході з гри.', descEn: 'Moody storm rain & lightning flash.' },
  { id: 'fx_blood_rose', type: 'death_fx', category: 'death_fx', currency: 'diamonds', name: '🥀 Ефект: Пелюстки нуару', nameEn: '🥀 FX: Noir Rose Petals', price: 25, desc: 'Ефект темних трояндових пелюсток при виході.', descEn: 'Drifting crimson rose petals farewell.' },
  { id: 'fx_gold_dust', type: 'death_fx', category: 'death_fx', currency: 'diamonds', name: '✨ Ефект: Золотий попіл', nameEn: '✨ FX: Golden Dust', price: 30, desc: 'Ефектне зникнення в золотому сяйві.', descEn: 'Dramatic fade into shimmering golden dust.' },

  // === БУСТЕРИ ТА ПРЕМІУМ ===
  { id: 'boost_xp', type: 'boost', category: 'boost', currency: 'coins', name: '⚡ Бустер досвіду x2 (5 ігор)', nameEn: '⚡ 2x XP Booster (5 Games)', price: 140, desc: 'Подвоює отриманий досвід у наступних 5 матчах.', descEn: 'Doubles XP earned in your next 5 matches.' },
  { id: 'vip_30d', type: 'premium', category: 'premium', currency: 'diamonds', name: '👑 VIP-статус на 30 днів', nameEn: '👑 VIP Status (30 Days)', price: 50, desc: '+25% досвіду та монет у кожній грі, безкоштовні подарунки інкогніто та корона VIP!', descEn: '+25% XP & coins every match, free incognito gifts, and VIP badge!' },
  { id: 'rename_ticket', type: 'premium', category: 'premium', currency: 'diamonds', name: '🪪 Талон на зміну ніку', nameEn: '🪪 Nickname Change Ticket', price: 15, desc: 'Дозволяє змінити нікнейм у Налаштуваннях ще 1 раз.', descEn: 'Unlocks 1 extra nickname change in Settings.' },
  { id: 'family_pass', type: 'premium', category: 'premium', currency: 'diamonds', name: '⚜️ Патент на Сім\'ю', nameEn: '⚜️ Family Charter Pass', price: 20, desc: 'Безкоштовне заснування власної мафіозної Сім\'ї без витрати 1500 монет.', descEn: 'Found your own Mafia Family for free instead of 1500 coins.' }
];

const DIAMOND_PACKS = {
  pack_10: { diamonds: 10, coins: 500 },
  pack_50: { diamonds: 50, coins: 3000 },
  pack_100: { diamonds: 100, coins: 7000 }
};

const BAD_WORDS_ROOTS = [
  'хуй', 'хуя', 'хує', 'пизд', 'пізд', 'бляд', 'блять', 'бля', 'сука', 'сучк',
  'їба', 'єба', 'еба', 'уеб', 'залуп', 'мудак', 'дебіл', 'долбо', 'гандон', 'шлюх',
  'курв', 'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'whore', 'slut', 'kurwa', 'dick'
];
const PHISHING_LINKS = ['http://', 'https://', 't.me/', 'bit.ly/', 'discord.gg/'];

function maskLinksOnly(text) {
  let res = String(text || '');
  PHISHING_LINKS.forEach(w => {
    const reg = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    res = res.replace(reg, '[посилання приховано] ');
  });
  return res;
}

function normalizeForProfanity(str) {
  const map = { a: 'а', e: 'е', i: 'і', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у', k: 'к', m: 'м', t: 'т', b: 'в', '0': 'о', '3': 'з', '@': 'а' };
  return String(str || '').toLowerCase()
    .split('').map(ch => map[ch] || ch).join('')
    .replace(/[._\-*!?,/\\|]+/g, '')
    .replace(/(.)\1{2,}/g, '$1');
}

function filterStopWords(text) {
  let res = maskLinksOnly(text);
  BAD_WORDS_ROOTS.forEach(w => {
    const reg = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    res = res.replace(reg, '***');
  });
  const words = res.split(/(\s+)/);
  return words.map(token => {
    if (!token.trim()) return token;
    const norm = normalizeForProfanity(token);
    if (BAD_WORDS_ROOTS.some(r => norm.includes(r))) return '***';
    return token;
  }).join('');
}

let db = {
  players: {},
  globalChat: [],
  privateChats: {},
  families: {},
  reports: [],
  modLogs: [],
  suspiciousLogs: [],
  playerIdeas: [],
  passwordResetRequests: [],
  minigameRecords: { runner: [], memory: [], whack: [], mafia_jump: [], cannon: [], snake: [], tetris: [] },
  roomLogs: [],
  recentPurchases: [],
  dailyRegistrations: [],
  matchMetrics: { started: 0, completed: 0 },
  devPosts: [
    {
      id: 1,
      title: 'Ласкаво просимо в Mafia Club: Online!',
      text: 'Тут ви можете читати новини про розробку, залишати коментарі та пропонувати ідеї для майбутніх оновлень.',
      date: new Date().toLocaleDateString('uk-UA'),
      comments: []
    }
  ]
};

function hashPassword(pass) {
  return crypto.createHash('sha256').update(String(pass)).digest('hex');
}

function generateRecoveryCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim();
let cloudGistId = (process.env.GITHUB_GIST_ID || '').trim();
const CLOUD_DB_URL = (process.env.CLOUD_DB_URL || '').trim();
const CLOUD_DB_KEY = (process.env.CLOUD_DB_KEY || '').trim();
const CLOUD_GIST_FILENAME = 'mafia-club-online-db.json';
let cloudSyncTimer = null;
let cloudSyncInProgress = false;
let cloudSyncPending = false;
let cloudLastSyncAt = '';
let cloudStatusMode = GITHUB_TOKEN ? 'github' : (CLOUD_DB_URL ? 'rest' : 'local');

function applyLoadedDatabaseObject(loaded, mergePlayers = false) {
  if (!loaded || typeof loaded !== 'object') return false;
  if (mergePlayers && db.players && loaded.players) {
    loaded.players = { ...loaded.players, ...db.players };
  }
  db = { ...db, ...loaded };
  if (!db.players || typeof db.players !== 'object') db.players = {};
  if (!db.privateChats) db.privateChats = {};
  if (!db.families) db.families = {};
  if (!db.reports) db.reports = [];
  if (!db.modLogs) db.modLogs = [];
  if (!Array.isArray(db.suspiciousLogs)) db.suspiciousLogs = [];
  if (!Array.isArray(db.playerIdeas)) db.playerIdeas = [];
  if (!Array.isArray(db.passwordResetRequests)) db.passwordResetRequests = [];
  if (!db.minigameRecords || typeof db.minigameRecords !== 'object') db.minigameRecords = { runner: [], memory: [], whack: [], mafia_jump: [], cannon: [], snake: [], tetris: [] };
  ['runner', 'memory', 'whack', 'mafia_jump', 'cannon', 'snake', 'tetris'].forEach(k => {
    if (!Array.isArray(db.minigameRecords[k])) db.minigameRecords[k] = [];
  });
  if (!db.roomLogs) db.roomLogs = [];
  if (!db.recentPurchases) db.recentPurchases = [];
  if (!Array.isArray(db.dailyRegistrations)) db.dailyRegistrations = [];
  if (!db.matchMetrics) db.matchMetrics = { started: 0, completed: 0 };
  if (!Array.isArray(db.devPosts)) db.devPosts = [];
  ensureReleaseNotesInDevPosts(false);
  return true;
}

function ensureReleaseNotesInDevPosts(shouldSave = true) {
  if (!Array.isArray(db.devPosts)) db.devPosts = [];
  const existing = db.devPosts.find(p => p && (p.releaseVersion === APP_VERSION || p.id === 'rel_' + APP_VERSION));
  const titleUa = CURRENT_RELEASE_NOTES.titleUa;
  const titleEn = CURRENT_RELEASE_NOTES.titleEn;
  const textUa = CURRENT_RELEASE_NOTES.itemsUa.map(line => '• ' + line).join('\n');
  const textEn = CURRENT_RELEASE_NOTES.itemsEn.map(line => '• ' + line).join('\n');

  if (existing) {
    const changed = existing.title !== titleUa || existing.titleEn !== titleEn || existing.text !== textUa || existing.textEn !== textEn;
    existing.releaseVersion = APP_VERSION;
    existing.title = titleUa;
    existing.titleEn = titleEn;
    existing.text = textUa;
    existing.textEn = textEn;
    existing.date = CURRENT_RELEASE_NOTES.date;
    if (changed && shouldSave) saveDB();
  } else {
    db.devPosts.unshift({
      id: 'rel_' + APP_VERSION,
      releaseVersion: APP_VERSION,
      title: titleUa,
      titleEn,
      text: textUa,
      textEn,
      date: CURRENT_RELEASE_NOTES.date,
      comments: []
    });
    if (shouldSave) saveDB();
  }
}

function writeLocalDBFile() {
  try {
    const tmpFile = DB_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (e) {
    console.error('[DB SAVE ERROR]', e.message);
  }
}

async function pushDatabaseToCloud() {
  if (!GITHUB_TOKEN && !CLOUD_DB_URL) return;
  if (cloudSyncInProgress) {
    cloudSyncPending = true;
    return;
  }
  cloudSyncInProgress = true;
  try {
    const serialized = JSON.stringify(db, null, 2);
    if (GITHUB_TOKEN) {
      const ghHeaders = {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mafia-Club-Online-Server'
      };
      if (cloudGistId) {
        const res = await fetch(`https://api.github.com/gists/${cloudGistId}`, {
          method: 'PATCH',
          headers: ghHeaders,
          body: JSON.stringify({
            description: 'Mafia Club: Online — Cloud Database (Auto-Sync)',
            files: { [CLOUD_GIST_FILENAME]: { content: serialized } }
          }),
          signal: AbortSignal.timeout(12000)
        });
        if (res.ok) {
          cloudLastSyncAt = new Date().toLocaleTimeString('uk-UA');
          cloudStatusMode = 'github';
        }
      } else {
        const createRes = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: ghHeaders,
          body: JSON.stringify({
            description: 'Mafia Club: Online — Cloud Database (Auto-Sync)',
            public: false,
            files: { [CLOUD_GIST_FILENAME]: { content: serialized } }
          }),
          signal: AbortSignal.timeout(12000)
        });
        if (createRes.ok) {
          const created = await createRes.json();
          if (created && created.id) {
            cloudGistId = created.id;
            cloudLastSyncAt = new Date().toLocaleTimeString('uk-UA');
            cloudStatusMode = 'github';
            console.log(`[CLOUD DB] Створено хмарну базу даних GitHub Gist: ${cloudGistId}`);
          }
        }
      }
    } else if (CLOUD_DB_URL) {
      const headers = { 'Content-Type': 'application/json' };
      if (CLOUD_DB_KEY) {
        headers['Authorization'] = `Bearer ${CLOUD_DB_KEY}`;
        headers['X-Master-Key'] = CLOUD_DB_KEY;
      }
      const res = await fetch(CLOUD_DB_URL, {
        method: 'PUT',
        headers,
        body: serialized,
        signal: AbortSignal.timeout(12000)
      });
      if (res.ok) {
        cloudLastSyncAt = new Date().toLocaleTimeString('uk-UA');
        cloudStatusMode = 'rest';
      }
    }
  } catch (e) {
    console.error('[CLOUD DB SYNC ERROR]', e.message);
  } finally {
    cloudSyncInProgress = false;
    if (cloudSyncPending) {
      cloudSyncPending = false;
      scheduleCloudSync(2500);
    }
  }
}

function scheduleCloudSync(delayMs = 3500) {
  if (!GITHUB_TOKEN && !CLOUD_DB_URL) return;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    cloudSyncTimer = null;
    pushDatabaseToCloud();
  }, delayMs);
}

function saveDB() {
  writeLocalDBFile();
  scheduleCloudSync(3500);
}

if (fs.existsSync(DB_FILE)) {
  try {
    const loaded = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    applyLoadedDatabaseObject(loaded, false);
  } catch (e) {
    console.log('Створено нову базу даних.');
  }
}

async function initCloudDatabase() {
  try {
    if (GITHUB_TOKEN) {
      const ghHeaders = {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Mafia-Club-Online-Server'
      };
      if (!cloudGistId) {
        const listRes = await fetch('https://api.github.com/gists?per_page=100', {
          headers: ghHeaders,
          signal: AbortSignal.timeout(12000)
        });
        if (listRes.ok) {
          const gists = await listRes.json();
          if (Array.isArray(gists)) {
            const match = gists.find(g => g && g.files && g.files[CLOUD_GIST_FILENAME]);
            if (match && match.id) cloudGistId = match.id;
          }
        }
      }
      if (cloudGistId) {
        const gRes = await fetch(`https://api.github.com/gists/${cloudGistId}`, {
          headers: ghHeaders,
          signal: AbortSignal.timeout(12000)
        });
        if (gRes.ok) {
          const gData = await gRes.json();
          const fileObj = gData && gData.files && gData.files[CLOUD_GIST_FILENAME];
          if (fileObj) {
            let rawJson = fileObj.content || '';
            if (fileObj.truncated && fileObj.raw_url) {
              const rawRes = await fetch(fileObj.raw_url, { signal: AbortSignal.timeout(12000) });
              if (rawRes.ok) rawJson = await rawRes.text();
            }
            if (rawJson) {
              const parsed = JSON.parse(rawJson);
              applyLoadedDatabaseObject(parsed, true);
              ensureReleaseNotesInDevPosts(true);
              writeLocalDBFile();
              io.emit('devPostsUpdated', db.devPosts);
              cloudLastSyncAt = new Date().toLocaleTimeString('uk-UA');
              cloudStatusMode = 'github';
              console.log(`[CLOUD DB] Завантажено хмарну БД з GitHub Gist (${Object.keys(db.players || {}).length} гравців).`);
              return;
            }
          }
        }
      }
      await pushDatabaseToCloud();
    } else if (CLOUD_DB_URL) {
      const headers = { 'Accept': 'application/json' };
      if (CLOUD_DB_KEY) {
        headers['Authorization'] = `Bearer ${CLOUD_DB_KEY}`;
        headers['X-Master-Key'] = CLOUD_DB_KEY;
      }
      const res = await fetch(CLOUD_DB_URL, { headers, signal: AbortSignal.timeout(12000) });
      if (res.ok) {
        const data = await res.json();
        const actual = (data && data.record && data.record.players) ? data.record : data;
        if (actual && typeof actual.players === 'object') {
          applyLoadedDatabaseObject(actual, true);
          writeLocalDBFile();
          cloudLastSyncAt = new Date().toLocaleTimeString('uk-UA');
          cloudStatusMode = 'rest';
          console.log(`[CLOUD DB] Завантажено хмарну БД з REST URL (${Object.keys(db.players || {}).length} гравців).`);
        }
      }
    }
  } catch (e) {
    console.error('[CLOUD DB INIT ERROR]', e.message);
  }
}
initCloudDatabase();

setInterval(() => {
  const cutoff = Date.now() - 48 * 3600 * 1000;
  if (Array.isArray(db.roomLogs) && db.roomLogs.length > 0) {
    const before = db.roomLogs.length;
    db.roomLogs = db.roomLogs.filter(log => log.createdAt > cutoff);
    if (db.roomLogs.length !== before) saveDB();
  }
}, 3600 * 1000);

if (db.players[ADMIN_NICK]) {
  db.players[ADMIN_NICK].passwordHash = hashPassword(process.env.ADMIN_PASS || 'itaminx16');
  db.players[ADMIN_NICK].staffRole = 'admin';
  if (typeof db.players[ADMIN_NICK].diamonds !== 'number') db.players[ADMIN_NICK].diamonds = 100;
  saveDB();
}
ensureReleaseNotesInDevPosts(true);

const translateCache = new Map();

function logSuspicious(socket, category, details) {
  if (!db.suspiciousLogs) db.suspiciousLogs = [];
  db.suspiciousLogs.unshift({
    id: 'susp_' + Date.now() + '_' + Math.floor(Math.random() * 999),
    nickname: (socket && socket.nickname) ? socket.nickname : 'Анонім',
    ip: (socket && socket.handshake) ? socket.handshake.address : '-',
    category: String(category || 'SUSPICIOUS'),
    details: escapeHTML(String(details || '')).slice(0, 180),
    time: new Date().toLocaleString('uk-UA')
  });
  if (db.suspiciousLogs.length > 150) db.suspiciousLogs.pop();
  saveDB();
}

function checkRateLimit(socket, eventName, maxPerWindow = 25, windowMs = 3000) {
  if (!socket._rateEvents) socket._rateEvents = [];
  const now = Date.now();
  socket._rateEvents = socket._rateEvents.filter(ts => now - ts < windowMs);
  socket._rateEvents.push(now);
  if (socket._rateEvents.length > maxPerWindow) {
    if (!socket._lastRateLog || now - socket._lastRateLog > 5000) {
      socket._lastRateLog = now;
      logSuspicious(socket, 'RATE_LIMIT', `Спам подією «${eventName}» (${socket._rateEvents.length} за ${windowMs} мс)`);
    }
    return false;
  }
  return true;
}

function getPlayBanError(player) {
  if (!player) return null;
  if (player.playBanned) {
    const r = player.playBanReason ? ` Причина: ${player.playBanReason}.` : '';
    return `🚫 Вам назавжди заборонено грати та входити в кімнати.${r} Ви можете користуватися чатом з друзями та загальним чатом.`;
  }
  if (player.playBannedUntil && player.playBannedUntil > Date.now()) {
    const until = new Date(player.playBannedUntil).toLocaleString('uk-UA');
    const r = player.playBanReason ? ` Причина: ${player.playBanReason}.` : '';
    return `⏳ Вам тимчасово заборонено грати до ${until}.${r} Спілкування в чатах доступне.`;
  }
  return null;
}

function ensureFamilyFields(fam) {
  if (!fam) return null;
  if (!fam.tag) {
    const raw = String(fam.name || 'MAF').replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9]/g, '').toUpperCase();
    fam.tag = (raw.slice(0, 4) || 'FAM');
  }
  if (typeof fam.treasury !== 'number') fam.treasury = 0;
  if (typeof fam.ratingPoints !== 'number') fam.ratingPoints = 0;
  if (typeof fam.weeklyPoints !== 'number') fam.weeklyPoints = fam.ratingPoints;
  if (!fam.ranks || typeof fam.ranks !== 'object') fam.ranks = {};
  if (fam.leader) fam.ranks[fam.leader.toLowerCase()] = 'don';
  if (!Array.isArray(fam.chat)) fam.chat = [];
  if (!fam.quests || typeof fam.quests !== 'object') fam.quests = { play_20: 0, wins_10: 0, claimed: [] };
  if (!Array.isArray(fam.quests.claimed)) fam.quests.claimed = [];
  if (typeof fam.motto !== 'string') fam.motto = '';
  if (!fam.upgrades || typeof fam.upgrades !== 'object') fam.upgrades = { vault: 0, bar: 0, radio: 0 };
  ['vault', 'bar', 'radio'].forEach(k => {
    fam.upgrades[k] = Math.max(0, Math.min(3, Number(fam.upgrades[k]) || 0));
  });
  if (!fam.dailyCheckIns || typeof fam.dailyCheckIns !== 'object') fam.dailyCheckIns = {};
  if (!fam.dailyHeists || typeof fam.dailyHeists !== 'object') fam.dailyHeists = {};
  const score = (fam.ratingPoints || 0) + Math.floor((fam.treasury || 0) / 5);
  fam.level = Math.min(10, Math.max(1, 1 + Math.floor(score / 150)));
  fam.bonusPct = Math.min(25, getFamilyBonusPct(fam.level) + (fam.upgrades.radio || 0) * 2);
  return fam;
}

function getFamilyBonusPct(level) {
  return Math.min(15, 4 + (Number(level) || 1));
}

function pruneFamilyDailyMaps(fam) {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const keep = new Set([today.toISOString().split('T')[0], yesterday.toISOString().split('T')[0]]);
  Object.keys(fam.dailyCheckIns || {}).forEach(k => { if (!keep.has(k)) delete fam.dailyCheckIns[k]; });
  Object.keys(fam.dailyHeists || {}).forEach(k => { if (!keep.has(k)) delete fam.dailyHeists[k]; });
}

function buildEnrichedFamily(fam) {
  if (!fam) return null;
  ensureFamilyFields(fam);
  const today = getTodayDateString();
  const memberProfiles = (fam.members || []).map(nick => {
    const rec = findPlayerRecord(nick);
    return {
      nickname: nick,
      rank: fam.ranks[nick.toLowerCase()] || (fam.leader.toLowerCase() === nick.toLowerCase() ? 'don' : 'recruit'),
      level: rec ? (rec.level || 1) : 1,
      authority: rec ? (rec.authority || 0) : 0,
      gamesPlayed: rec ? (rec.gamesPlayed || 0) : 0,
      online: isUserOnline(nick)
    };
  });
  return {
    ...fam,
    todayCheckIns: Array.isArray(fam.dailyCheckIns[today]) ? fam.dailyCheckIns[today] : [],
    todayHeists: (fam.dailyHeists[today] && typeof fam.dailyHeists[today] === 'object') ? fam.dailyHeists[today] : {},
    memberProfiles
  };
}

function getFamilyTagForPlayer(player) {
  if (!player || !player.familyId || !db.families[player.familyId]) return '';
  const fam = ensureFamilyFields(db.families[player.familyId]);
  return fam ? fam.tag : '';
}

const rooms = {};
const onlineUsers = {};
const emptyRoomTimers = {};

function getSocketsForUser(nickname) {
  const lower = String(nickname || '').trim().toLowerCase();
  if (!lower) return [];
  const res = [];
  for (const s of io.sockets.sockets.values()) {
    if (s && s.connected && s.nickname && s.nickname.toLowerCase() === lower) {
      res.push(s);
    }
  }
  return res;
}

function isUserOnline(nickname) {
  const lower = String(nickname || '').trim().toLowerCase();
  if (!lower) return false;
  return getSocketsForUser(lower).length > 0 || !!onlineUsers[lower];
}

function emitToUser(nickname, event, payload) {
  const lower = String(nickname || '').trim().toLowerCase();
  if (!lower) return false;
  let delivered = false;
  const sockets = getSocketsForUser(lower);
  sockets.forEach(s => {
    s.emit(event, payload);
    delivered = true;
  });
  if (!delivered) {
    const sid = onlineUsers[lower];
    if (sid) {
      io.to(sid).emit(event, payload);
      delivered = true;
    }
  }
  return delivered;
}

function refreshOnlineUserEntry(nickLower) {
  if (!nickLower) return;
  const active = getSocketsForUser(nickLower);
  if (active.length > 0) {
    onlineUsers[nickLower] = active[active.length - 1].id;
  } else {
    delete onlineUsers[nickLower];
  }
}

function findPlayerRecord(nick) {
  if (!nick) return null;
  const key = Object.keys(db.players).find(k => k.toLowerCase() === String(nick).trim().toLowerCase());
  return key ? db.players[key] : null;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

function isKyivHappyHour() {
  try {
    const kyivHour = Number(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Kyiv',
      hour: '2-digit',
      hour12: false
    }).format(new Date()));
    return (kyivHour >= 6 && kyivHour < 9) || (kyivHour >= 18 && kyivHour < 21);
  } catch (e) {
    return false;
  }
}

function getLevelInfo(xp) {
  let level = 1;
  let currentLevelMinXp = 0;
  let step = 60;
  while (level < 20 && xp >= currentLevelMinXp + step) {
    currentLevelMinXp += step;
    level++;
    step += 45;
  }
  const nextLevelXp = level < 20 ? currentLevelMinXp + step : currentLevelMinXp;
  return { level, currentLevelMinXp, nextLevelXp };
}

function ensurePlayerFields(p) {
  const today = getTodayDateString();
  if (!p.dailyStats || p.dailyStats.date !== today) {
    p.dailyStats = {
      date: today,
      authority: 0,
      wins: 0,
      xp: 0,
      quests: { play_3: 0, win_town: 0, send_reaction: 0, claimed: [] }
    };
  }
  if (!p.dailyStats.quests) {
    p.dailyStats.quests = { play_3: 0, win_town: 0, send_reaction: 0, claimed: [] };
  }
  if (!p.teamStats) {
    p.teamStats = {
      town: { played: 0, wins: 0 },
      mafia: { played: 0, wins: 0 },
      cult: { played: 0, wins: 0 },
      neutral: { played: 0, wins: 0 }
    };
  }
  if (!p.roleStats || typeof p.roleStats !== 'object') p.roleStats = {};
  if (!Array.isArray(p.friends)) p.friends = [];
  if (!Array.isArray(p.friendRequests)) p.friendRequests = [];
  if (!Array.isArray(p.inventory)) p.inventory = [];
  if (typeof p.equippedFrame !== 'string') p.equippedFrame = '';
  if (typeof p.avatarBorderColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(p.avatarBorderColor)) p.avatarBorderColor = '#f4a261';
  if (typeof p.equippedDeathFx !== 'string') p.equippedDeathFx = 'default';
  if (typeof p.doubleXpGames !== 'number') p.doubleXpGames = 0;
  if (typeof p.showBadge !== 'boolean') p.showBadge = true;
  if (!p.gender) p.gender = 'other';
  if (typeof p.karma !== 'number') p.karma = 100;
  if (typeof p.survivedGames !== 'number') p.survivedGames = 0;
  if (typeof p.winStreak !== 'number') p.winStreak = 0;
  if (typeof p.bestWinStreak !== 'number') p.bestWinStreak = 0;
  if (typeof p.nickChanged !== 'boolean') p.nickChanged = false;
  if (typeof p.referralsCount !== 'number') p.referralsCount = 0;
  if (typeof p.vipUntil !== 'number') p.vipUntil = 0;
  if (typeof p.registeredAt !== 'number') p.registeredAt = Date.now() - 5 * 86400000;
  if (typeof p.lastGameAt !== 'number') p.lastGameAt = p.registeredAt;
  if (typeof p.isFirstHundred !== 'boolean') {
    const totalCount = Object.keys(db.players || {}).length;
    p.isFirstHundred = totalCount <= 100;
  }
  if (!p.recoveryCode) p.recoveryCode = generateRecoveryCode();
  if (typeof p.isTester !== 'boolean') p.isTester = false;
  if (typeof p.legendUnlocked !== 'boolean') p.legendUnlocked = false;
  if (typeof p.bratikSecretCode !== 'string') p.bratikSecretCode = '';
  if (typeof p.bratikCodeRequired !== 'boolean') p.bratikCodeRequired = false;
  if (!p.staffRole) p.staffRole = p.nickname.toLowerCase() === ADMIN_NICK.toLowerCase() ? 'admin' : 'player';
  if (typeof p.diamonds !== 'number') p.diamonds = p.nickname.toLowerCase() === ADMIN_NICK.toLowerCase() ? 100 : 0;
  if (typeof p.profanityFilter !== 'boolean') p.profanityFilter = true;
  if (!Array.isArray(p.customBadWords)) p.customBadWords = [];
  if (typeof p.playBanned !== 'boolean') p.playBanned = false;
  if (typeof p.playBannedUntil !== 'number') p.playBannedUntil = 0;
  if (typeof p.playBanReason !== 'string') p.playBanReason = '';
  if (typeof p.seenWelcome !== 'boolean') p.seenWelcome = false;
  if (typeof p.freeFamilyCreate !== 'boolean') p.freeFamilyCreate = false;
  if (typeof p.lastApologyBonusDate !== 'string') p.lastApologyBonusDate = '';
  p.level = getLevelInfo(p.xp).level;
}

let lastBadgeRebalanceAt = 0;
function rebalanceGoldBadgesIfNeeded() {
  const now = Date.now();
  if (now - lastBadgeRebalanceAt < 5 * 60 * 1000) return;
  lastBadgeRebalanceAt = now;
  const sixMonthsMs = 180 * 24 * 3600 * 1000;
  let slotsToTransfer = 0;
  Object.values(db.players || {}).forEach(p => {
    if (!p || !p.isFirstHundred) return;
    if (p.nickname && p.nickname.toLowerCase() === ADMIN_NICK.toLowerCase()) return;
    const lastActive = Math.max(p.lastGameAt || 0, p.registeredAt || 0);
    if (lastActive > 0 && (now - lastActive) > sixMonthsMs) {
      p.isFirstHundred = false;
      slotsToTransfer++;
    }
  });
  if (slotsToTransfer > 0) {
    const candidates = Object.values(db.players || {})
      .filter(p => p && !p.banned && !p.isFirstHundred && ((now - Math.max(p.lastGameAt || 0, p.registeredAt || 0)) <= sixMonthsMs))
      .sort((a, b) => ((b.authority || 0) - (a.authority || 0)) || ((b.wins || 0) - (a.wins || 0)));
    for (let i = 0; i < slotsToTransfer && i < candidates.length; i++) {
      candidates[i].isFirstHundred = true;
    }
    saveDB();
  }
}

function getAllTimeTop100Set() {
  rebalanceGoldBadgesIfNeeded();
  const top = Object.values(db.players || {})
    .filter(p => p && !p.banned && (p.authority || 0) > 0)
    .sort((a, b) => ((b.authority || 0) - (a.authority || 0)) || ((b.wins || 0) - (a.wins || 0)))
    .slice(0, 100);
  const s = new Set();
  top.forEach(p => {
    s.add(p.nickname);
    s.add(p.nickname.toLowerCase());
  });
  return s;
}

function getTodayTop100Set() {
  rebalanceGoldBadgesIfNeeded();
  const today = getTodayDateString();
  const activeToday = Object.values(db.players)
    .filter(p => p.dailyStats && p.dailyStats.date === today && (p.dailyStats.authority > 0 || p.dailyStats.xp > 0 || (p.dailyStats.gamesPlayed || 0) > 0))
    .sort((a, b) => (b.dailyStats.authority - a.dailyStats.authority) || (b.dailyStats.xp - a.dailyStats.xp))
    .slice(0, 100);
  const s = new Set();
  activeToday.forEach(p => {
    s.add(p.nickname);
    s.add(p.nickname.toLowerCase());
  });
  return s;
}

function getBadgeType(player, todayTopSet, allTimeTopSet) {
  if (!player || !player.showBadge) return null;
  rebalanceGoldBadgesIfNeeded();

  // 1. Золотий значок «100»: безстроковий для перших 100, але якщо неактивний > 180 днів — передається гравцю з Топ-100
  if (player.isFirstHundred) {
    return 'gold';
  }

  const nick = player.nickname || '';
  const nickLower = nick.toLowerCase();

  // 2. Срібний значок «100»: для гравців у Топ-100 рейтингу авторитету за весь час
  const allSet = allTimeTopSet || getAllTimeTop100Set();
  if (allSet.has(nick) || allSet.has(nickLower)) {
    return 'silver';
  }

  // 3. Мідний значок «100»: для гравців, які потрапили до Топ-100 лише за сьогоднішній день
  if (todayTopSet && (todayTopSet.has(nick) || todayTopSet.has(nickLower))) {
    return 'copper';
  }

  return null;
}

function getPrivateChatKey(nickA, nickB) {
  return [nickA.toLowerCase(), nickB.toLowerCase()].sort().join('__');
}

function buildFriendsPayload(player) {
  if (!player || player.isGuest) return [];
  const todaySet = getTodayTop100Set();
  const allTimeSet = getAllTimeTop100Set();
  const nicknames = new Set((player.friends || []).slice());
  const currentNick = player.nickname.toLowerCase();

  Object.keys(db.privateChats).forEach(key => {
    const participants = key.split('__');
    if (!participants.includes(currentNick)) return;
    participants.forEach(nick => {
      if (nick === currentNick) return;
      const record = Object.values(db.players).find(p =>
        p.nickname && p.nickname.toLowerCase() === nick
      );
      if (record) nicknames.add(record.nickname);
    });
  });

  return Array.from(nicknames).map(fNick => {
    const fp = findPlayerRecord(fNick);
    if (!fp) return null;
    ensurePlayerFields(fp);
    const key = getPrivateChatKey(player.nickname, fp.nickname);
    const msgs = db.privateChats[key] || [];
    const unreadCount = msgs.filter(m => m.to.toLowerCase() === player.nickname.toLowerCase() && !m.read).length;
    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    return {
      nickname: fp.nickname,
      avatar: fp.avatar,
      equippedFrame: fp.equippedFrame || '',
      avatarBorderColor: fp.avatarBorderColor || '#f4a261',
      gender: fp.gender,
      level: fp.level,
      authority: fp.authority,
      online: isUserOnline(fp.nickname),
      badgeType: getBadgeType(fp, todaySet, allTimeSet),
      unreadCount,
      lastMsg: lastMsg ? lastMsg.text : ''
    };
  }).filter(Boolean);
}
function isPlayerCultMember(p) {
  if (!p) return false;
  return !!((p.role && ROLES[p.role] && ROLES[p.role].team === 'cult') || p.convertedToCult);
}

function getPlayerRoleDeathLabel(p) {
  const baseName = (p && p.role && ROLES[p.role] && ROLES[p.role].names.ua) || 'Мирний житель';
  if (p && p.convertedToCult && p.role !== 'cult_leader') {
    return `${baseName}, обернений у Культ`;
  }
  return baseName;
}

const playerDisconnectTimers = {};
function cancelPlayerDisconnectTimer(nickname) {
  if (!nickname) return;
  const key = String(nickname).toLowerCase();
  if (playerDisconnectTimers[key]) {
    clearTimeout(playerDisconnectTimers[key]);
    delete playerDisconnectTimers[key];
  }
}

function schedulePlayerDisconnectPenalty(roomId, nickname, isGuest) {
  if (!roomId || !nickname) return;
  const key = String(nickname).toLowerCase();
  cancelPlayerDisconnectTimer(key);
  playerDisconnectTimers[key] = setTimeout(() => {
    delete playerDisconnectTimers[key];
    const room = rooms[roomId];
    if (!room || room.status !== 'playing') return;
    const pInRoom = room.players.find(p => p.nickname && p.nickname.toLowerCase() === key);
    if (!pInRoom || !pInRoom.alive || pInRoom.isSpectator) return;
    const activeSocks = getSocketsForUser(key);
    if (activeSocks.some(s => s.currentRoomId === roomId)) return;

    pInRoom.leftRoom = true;
    pInRoom.leftEarly = true;
    pushRoomNews(room, `⏸️ ${pInRoom.nickname} покинув гру достроково (може повернутися; гра триває).`);
    checkAllVotedOrActed(room);
    broadcastRoomState(room);
    io.emit('roomsUpdated', getPublicRoomsList());
  }, 25000);
}

function getPublicRoomsList() {
  const todaySet = getTodayTop100Set();
  const allTimeSet = getAllTimeTop100Set();
  return Object.values(rooms).filter(r => r.status !== 'ended').map(r => ({
    id: r.id,
    creator: r.creator,
    name: r.name,
    mode: r.mode,
    serverRegion: 'GLOBAL',
    minPlayers: r.minPlayers || 5,
    playersCount: r.players.filter(p => !p.isSpectator).length,
    maxPlayers: r.maxPlayers,
    minAuthority: r.minAuthority,
    minKarma: r.minKarma || 0,
    isPrivate: !!r.isPrivate,
    isRanked: !!r.isRanked,
    selectedRoles: r.selectedRoles,
    status: r.status,
    dayNumber: r.dayNumber || 0,
    playersList: r.players.map(p => {
      const dbP = findPlayerRecord(p.nickname);
      return {
        nickname: p.nickname,
        avatar: p.avatar,
        isBot: p.isBot,
        isSpectator: !!p.isSpectator,
        isCreator: !!p.isCreator,
        alive: p.alive,
        leftRoom: !!p.leftRoom,
        badgeType: dbP ? getBadgeType(dbP, todaySet, allTimeSet) : null
      };
    })
  }));
}

function getActiveAliveMatchForPlayer(nickname) {
  if (!nickname) return null;
  const target = nickname.toLowerCase();
  return Object.values(rooms).find(r =>
    r.status === 'playing' && r.players.some(p => p.nickname && p.nickname.toLowerCase() === target && p.alive && !p.isSpectator)
  ) || null;
}

function hasActiveHumansInRoom(room, excludeSocketId = null) {
  if (!room || !Array.isArray(room.players)) return false;
  for (const s of io.sockets.sockets.values()) {
    if (!s || !s.connected || s.id === excludeSocketId) continue;
    if (s.currentRoomId === room.id && s.nickname) {
      const p = room.players.find(pl => !pl.isBot && pl.nickname && pl.nickname.toLowerCase() === s.nickname.toLowerCase());
      if (p) return true;
    }
  }
  if (room.status === 'playing') {
    return room.players.some(p => {
      if (p.isBot || p.leftRoom) return false;
      return getSocketsForUser(p.nickname).some(s => s.id !== excludeSocketId);
    });
  }
  return false;
}

function cancelEmptyRoomCleanup(roomId) {
  if (emptyRoomTimers[roomId]) {
    clearTimeout(emptyRoomTimers[roomId]);
    delete emptyRoomTimers[roomId];
  }
}

function scheduleEmptyRoomCleanup(roomId, excludeSocketId = null) {
  cancelEmptyRoomCleanup(roomId);
  const targetRoom = rooms[roomId];
  const delayMs = (targetRoom && targetRoom.status === 'playing') ? 60000 : 12000;
  emptyRoomTimers[roomId] = setTimeout(() => {
    delete emptyRoomTimers[roomId];
    const r = rooms[roomId];
    if (!r) return;
    if (!hasActiveHumansInRoom(r, excludeSocketId)) {
      if (r.timerInterval) clearInterval(r.timerInterval);
      if (r.lobbyCountdownInterval) clearInterval(r.lobbyCountdownInterval);
      delete rooms[roomId];
      io.emit('roomsUpdated', getPublicRoomsList());
    }
  }, delayMs);
}

function recordTimelineEvent(room, entry) {
  if (!room || !entry) return;
  if (!Array.isArray(room.gameTimeline)) room.gameTimeline = [];
  room.gameTimeline.push(entry);
  if (room.gameTimeline.length > 1000) room.gameTimeline.shift();
}

function pushPrivateRoomNews(room, targetNick, text) {
  if (!room || !targetNick || !text) return;
  emitToUser(targetNick, 'systemNews', text);
  if (room.status === 'playing' || room.status === 'ended') {
    recordTimelineEvent(room, {
      kind: 'private_news',
      targetNick,
      text,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      visibility: 'private'
    });
  }
}

function emitDeathEffect(room, victim, reason) {
  if (!room || !victim) return;
  const rec = victim.isBot ? null : findPlayerRecord(victim.nickname);
  const fx = (rec && rec.equippedDeathFx) || victim.deathEffect || 'default';
  const roleName = getPlayerRoleDeathLabel(victim);
  io.to(room.id).emit('playerEliminatedEffect', {
    nickname: victim.nickname,
    role: victim.role,
    roleName,
    convertedToCult: !!victim.convertedToCult,
    deathEffect: fx,
    reason: reason || 'night',
    avatar: victim.avatar
  });
}

function detachSocketFromCurrentRoom(socket, { penalizeAlive = false } = {}) {
  const oldRoomId = socket.currentRoomId;
  if (!oldRoomId || !rooms[oldRoomId]) {
    socket.currentRoomId = null;
    return;
  }
  const oldRoom = rooms[oldRoomId];
  const nickLower = (socket.nickname || '').toLowerCase();
  cancelPlayerDisconnectTimer(nickLower);
  const pInRoom = oldRoom.players.find(p => p.nickname && p.nickname.toLowerCase() === nickLower);

  if (oldRoom.status === 'playing') {
    if (pInRoom && pInRoom.alive && !pInRoom.isSpectator) {
      pInRoom.leftRoom = true;
      if (penalizeAlive) {
        pInRoom.leftEarly = true;
        pushRoomNews(oldRoom, `⏸️ ${socket.nickname} покинув гру достроково (може повернутися; гра триває).`);
        checkAllVotedOrActed(oldRoom);
        io.emit('roomsUpdated', getPublicRoomsList());
      }
    } else if (pInRoom && !pInRoom.alive && !pInRoom.isSpectator) {
      pInRoom.leftRoom = true;
    } else if (pInRoom && pInRoom.isSpectator) {
      oldRoom.players = oldRoom.players.filter(p => !p.nickname || p.nickname.toLowerCase() !== nickLower);
    }
  } else {
    oldRoom.players = oldRoom.players.filter(p => !p.nickname || p.nickname.toLowerCase() !== nickLower);
  }

  socket.leave(oldRoomId);
  socket.currentRoomId = null;

  if (!hasActiveHumansInRoom(oldRoom)) {
    scheduleEmptyRoomCleanup(oldRoomId);
  } else {
    broadcastRoomState(oldRoom);
  }
}

function buildFilteredTimelineForViewer(room, viewer, viewerRole, vNick) {
  const raw = Array.isArray(room.gameTimeline) ? room.gameTimeline : [];
  const isEnded = room.status === 'ended';
  const isMafia = !!(viewerRole && viewerRole.team === 'mafia');
  const isMedium = !!(viewer && viewer.role === 'medium');
  const isGhost = !viewer || !viewer.alive || !!viewer.isSpectator;
  const out = [];

  for (const entry of raw) {
    if (!entry) continue;
    if (entry.visibility === 'all') {
      out.push(entry);
    } else if (entry.visibility === 'private') {
      if (vNick && entry.targetNick && entry.targetNick.toLowerCase() === vNick) {
        out.push(entry);
      }
    } else if (entry.visibility === 'mafia') {
      if (isEnded || isMafia) {
        out.push(entry);
      } else if (isMedium && entry.incognitoMsg) {
        out.push({ kind: 'msg', msg: entry.incognitoMsg, visibility: 'mafia' });
      }
    } else if (entry.visibility === 'ghost') {
      if (isEnded || isGhost || isMedium) {
        out.push(entry);
      }
    }
  }
  return out;
}

function sanitizeRoomForPlayer(room, viewerNick, includeTimeline = false) {
  const vNick = (viewerNick || '').toLowerCase();
  const viewer = room.players.find(p => p.nickname && p.nickname.toLowerCase() === vNick);
  const viewerRole = viewer && viewer.role ? ROLES[viewer.role] : null;
  const isViewerCult = isPlayerCultMember(viewer);
  const isNight = room.status === 'playing' && (room.phase === 'night_chat' || room.phase === 'night_vote');
  const todaySet = getTodayTop100Set();
  const allTimeSet = getAllTimeTop100Set();

  const healedSet = new Set();
  if (isNight) {
    room.players.forEach(p => {
      if (p.alive && !p.isSpectator && (p.role === 'doctor' || p.role === 'guardian_angel') && room.nightActions[p.nickname]) {
        healedSet.add(room.nightActions[p.nickname]);
      }
    });
  }

  const payload = {
    id: room.id,
    creator: room.creator,
    name: room.name,
    mode: room.mode,
    serverRegion: room.serverRegion,
    minPlayers: room.minPlayers,
    maxPlayers: room.maxPlayers,
    minAuthority: room.minAuthority,
    minKarma: room.minKarma || 0,
    isPrivate: !!room.isPrivate,
    isRanked: !!room.isRanked,
    selectedRoles: (room.selectedRoles || []).filter(r => ROLES[r] && (room.mode === 'legend' || ROLES[r].mode === 'classic')),
    status: room.status,
    phase: room.phase,
    timeLeft: room.timeLeft,
    lobbyCountdown: room.lobbyCountdown,
    dayNumber: room.dayNumber,
    newsLog: room.newsLog || [],
    voteLogs: room.voteLogs || [],
    votes: (room.status === 'playing' && room.phase === 'day_vote') ? (room.votes || {}) : {},
    myLockedVote: (viewer && room.status === 'playing' && room.phase === 'day_vote') ? (room.votes[viewer.nickname] || null) : null,
    tableGifts: room.tableGifts || {},
    minigameScores: room.minigameScores || {},
    myRole: viewer ? viewer.role : null,
    myConvertedToCult: viewer ? !!viewer.convertedToCult : false,
    myJesterWon: viewer ? !!viewer.jesterWon : false,
    myAlive: viewer ? viewer.alive : false,
    myIsSpectator: viewer ? !!viewer.isSpectator : true,
    myWillSent: viewer ? !!viewer.willSent : false,
    myNightTarget: (viewer && isNight) ? (room.nightActions[viewer.nickname] || null) : null,
    players: room.players.filter(p => !p.isSpectator).map(p => {
      const isTargetCult = isPlayerCultMember(p);
      const canSeeRole = room.status === 'ended' || (!p.alive && !(viewer && viewer.isSpectator)) || p.nickname === viewerNick ||
        (viewerRole && viewerRole.team === 'mafia' && p.role && ROLES[p.role] && ROLES[p.role].team === 'mafia') ||
        (isViewerCult && isTargetCult);
      const dbRec = p.isBot ? null : findPlayerRecord(p.nickname);
      return {
        nickname: p.nickname,
        avatar: p.avatar,
        equippedFrame: (dbRec && dbRec.equippedFrame) || '',
        avatarBorderColor: (dbRec && dbRec.avatarBorderColor) || '#f4a261',
        badgeType: dbRec ? getBadgeType(dbRec, todaySet, allTimeSet) : p.badgeType,
        familyTag: getFamilyTagForPlayer(dbRec),
        isCreator: p.isCreator,
        isBot: p.isBot,
        botStyle: p.botStyle || '',
        alive: p.alive,
        leftRoom: !!p.leftRoom,
        deathEffect: (dbRec && dbRec.equippedDeathFx) || p.deathEffect || 'default',
        isHealed: isNight && healedSet.has(p.nickname) && (p.nickname === viewerNick || (viewer && viewer.role === 'doctor')),
        role: canSeeRole ? p.role : null,
        convertedToCult: (canSeeRole || (isViewerCult && isTargetCult)) ? !!p.convertedToCult : false,
        jesterWon: !!p.jesterWon
      };
    })
  };

  if (includeTimeline) {
    if (room.status === 'waiting') {
      payload.lobbyChatHistory = (room.lobbyChat || []).slice(-60);
    } else if (room.status === 'playing' || room.status === 'ended') {
      payload.gameTimeline = buildFilteredTimelineForViewer(room, viewer, viewerRole, vNick);
    }
  }
  return payload;
}

function broadcastRoomState(room) {
  if (!room || !Array.isArray(room.players)) return;
  for (const sock of io.sockets.sockets.values()) {
    if (!sock || !sock.connected || sock.currentRoomId !== room.id || !sock.nickname) continue;
    sock.emit('roomStateUpdated', sanitizeRoomForPlayer(room, sock.nickname, false));
  }
}

function checkLobbyCountdown(room) {
  if (!room || room.status !== 'waiting') return;
  const activeCount = room.players.filter(p => !p.isSpectator).length;

  // Якщо кімната повністю заповнена — швидкий автостарт через 3 секунди!
  if (activeCount >= room.maxPlayers) {
    if (!room.lobbyCountdownInterval) {
      room.lobbyCountdown = 3;
      pushRoomNews(room, `🔥 Кімната заповнена (${activeCount}/${room.maxPlayers})! Гра розпочинається автоматично через 3 сек...`);
      io.to(room.id).emit('lobbyCountdownTick', room.lobbyCountdown);
      room.lobbyCountdownInterval = setInterval(() => {
        if (!rooms[room.id] || room.status !== 'waiting') {
          clearInterval(room.lobbyCountdownInterval);
          room.lobbyCountdownInterval = null;
          return;
        }
        const curCount = room.players.filter(p => !p.isSpectator).length;
        if (curCount < room.minPlayers) {
          clearInterval(room.lobbyCountdownInterval);
          room.lobbyCountdownInterval = null;
          room.lobbyCountdown = null;
          pushRoomNews(room, '⚠️ Гравців стало менше мінімуму — автостарт скасовано.');
          broadcastRoomState(room);
          return;
        }
        room.lobbyCountdown--;
        io.to(room.id).emit('lobbyCountdownTick', room.lobbyCountdown);
        if (room.lobbyCountdown <= 0) {
          clearInterval(room.lobbyCountdownInterval);
          room.lobbyCountdownInterval = null;
          room.lobbyCountdown = null;
          startGameInRoom(room);
        }
      }, 1000);
    } else if (room.lobbyCountdown > 3) {
      room.lobbyCountdown = 3;
      pushRoomNews(room, `🔥 Кімната заповнена (${activeCount}/${room.maxPlayers})! Автостарт прискорено до 3 сек...`);
      io.to(room.id).emit('lobbyCountdownTick', room.lobbyCountdown);
    }
    return;
  }

  if (activeCount >= room.minPlayers) {
    if (!room.lobbyCountdownInterval) {
      room.lobbyCountdown = 40;
      io.to(room.id).emit('lobbyCountdownTick', room.lobbyCountdown);
      room.lobbyCountdownInterval = setInterval(() => {
        if (!rooms[room.id] || room.status !== 'waiting') {
          clearInterval(room.lobbyCountdownInterval);
          room.lobbyCountdownInterval = null;
          return;
        }
        const curCount = room.players.filter(p => !p.isSpectator).length;
        if (curCount < room.minPlayers) {
          clearInterval(room.lobbyCountdownInterval);
          room.lobbyCountdownInterval = null;
          room.lobbyCountdown = null;
          pushRoomNews(room, '⚠️ Гравців стало менше мінімуму — автостарт скасовано.');
          broadcastRoomState(room);
          return;
        }
        room.lobbyCountdown--;
        io.to(room.id).emit('lobbyCountdownTick', room.lobbyCountdown);
        if (room.lobbyCountdown <= 0) {
          clearInterval(room.lobbyCountdownInterval);
          room.lobbyCountdownInterval = null;
          room.lobbyCountdown = null;
          startGameInRoom(room);
        }
      }, 1000);
    }
  }
}

function pushRoomNews(room, text) {
  if (!room.newsLog) room.newsLog = [];
  room.newsLog.unshift(text);
  if (room.newsLog.length > 300) room.newsLog.pop();
  if (room.status === 'playing' || room.status === 'ended') {
    recordTimelineEvent(room, {
      kind: 'news',
      text,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      visibility: 'all'
    });
  }
  io.to(room.id).emit('systemNews', text);
}

function startGameInRoom(room) {
  if (room.lobbyCountdownInterval) {
    clearInterval(room.lobbyCountdownInterval);
    room.lobbyCountdownInterval = null;
    room.lobbyCountdown = null;
  }
  room.status = 'playing';
  room.dayNumber = 1;
  room.newsLog = [];
  room.gameTimeline = [];
  room.chat = []; // Очищуємо ігровий чат — повідомлення з лобі не потрапляють у гру
  room.tableGifts = {};
  room.voteLogs = [];
  room.votes = {};
  room.nightActions = {};
  room.lastAfkPlayers = [];
  room.afkPenaltiesByVoter = {};
  room.botIntel = createFreshBotIntel();
  db.matchMetrics.started = (db.matchMetrics.started || 0) + 1;

  const activePlayers = room.players.filter(p => !p.isSpectator);
  const shuffledPlayers = [...activePlayers].sort(() => Math.random() - 0.5);
  let dist = RoleBalance.computeRoleDistribution(shuffledPlayers.length, room.selectedRoles, ROLES, room.mode, { randomizeOverflow: true });
  if (!dist.ok || dist.rolesArray.length !== shuffledPlayers.length) {
    dist = RoleBalance.computeRoleDistribution(shuffledPlayers.length, ['citizen', 'mafioso', 'sheriff', 'doctor'], ROLES, room.mode, { randomizeOverflow: true });
  }
  const assignedRoles = [...dist.rolesArray].sort(() => Math.random() - 0.5);

  shuffledPlayers.forEach((p, idx) => {
    p.role = assignedRoles[idx];
    p.alive = true;
    p.leftRoom = false;
    p.leftEarly = false;
    p.actionsCount = 0;
    p.silenced = false;
    p.willSent = false;
    p.convertedToCult = false;
    p.jesterWon = false;
    p.lastHealedTarget = null;
    p.botChecks = [];
    p.botComparisons = [];
    p.botConFindings = [];
    if (!p.isBot) {
      cancelPlayerDisconnectTimer(p.nickname);
      const dbP = findPlayerRecord(p.nickname);
      if (dbP) {
        dbP.lastGameAt = Date.now();
      }
    }
  });

  io.to(room.id).emit('gameStarted', { roomId: room.id });
  pushRoomNews(room, '🎭 Ролі роздано! Місто засинає... (Ніч №1)');
  io.emit('roomsUpdated', getPublicRoomsList());
  switchPhase(room, 'night_chat', 30);

  room.timerInterval = setInterval(() => {
    if (!rooms[room.id]) return clearInterval(room.timerInterval);
    room.timeLeft--;
    io.to(room.id).emit('timerTick', { phase: room.phase, timeLeft: room.timeLeft, dayNumber: room.dayNumber });

    if ([53, 45, 35, 25, 20, 15, 8].includes(room.timeLeft)) {
      runBotsAI(room);
    }

    if (room.timeLeft <= 0) {
      if (room.phase === 'night_chat') switchPhase(room, 'night_vote', 30);
      else if (room.phase === 'night_vote') {
        resolveNight(room);
        if (!checkWinCondition(room)) switchPhase(room, 'day_chat', 60);
      } else if (room.phase === 'day_chat') switchPhase(room, 'day_vote', 30);
      else if (room.phase === 'day_vote') {
        resolveDayVote(room);
        if (!checkWinCondition(room)) {
          room.dayNumber++;
          switchPhase(room, 'night_chat', 30);
        }
      }
    }
  }, 1000);
}

function checkAllVotedOrActed(room) {
  if (!room || room.status !== 'playing' || room.timeLeft <= 3) return;
  const activeAlive = room.players.filter(p => p.alive && !p.isSpectator && !p.leftRoom);
  if (activeAlive.length === 0) return;

  if (room.phase === 'day_vote') {
    const allVoted = activeAlive.every(p => !!room.votes[p.nickname]);
    if (allVoted) {
      room.timeLeft = 3;
      io.to(room.id).emit('timerTick', { phase: room.phase, timeLeft: 3, dayNumber: room.dayNumber });
      pushRoomNews(room, '⚡ Усі гравці проголосували! Підсумок через 3 сек...');
    }
    return;
  }

  if (room.phase === 'night_vote') {
    const passiveRoles = ['citizen', 'mayor', 'jester', 'medium'];
    const hasDeadPlayers = room.players.some(p => !p.alive && !p.isSpectator);
    const activeActors = activeAlive.filter(p => {
      if (p.convertedToCult || passiveRoles.includes(p.role)) return false;
      if (p.role === 'amnesiac' && !hasDeadPlayers) return false;
      return true;
    });
    if (activeActors.length === 0) return;
    const allActed = activeActors.every(p => {
      const act = room.nightActions[p.nickname];
      if (p.role === 'journalist') return Array.isArray(act) && act.length >= 2;
      return !!act;
    });
    if (allActed) {
      room.timeLeft = 3;
      io.to(room.id).emit('timerTick', { phase: room.phase, timeLeft: 3, dayNumber: room.dayNumber });
      pushRoomNews(room, '⚡ Усі активні ролі зробили хід! Ранок через 3 сек...');
    }
  }
}

function switchPhase(room, phase, seconds) {
  room.phase = phase;
  room.timeLeft = seconds;
  if (phase === 'night_chat') {
    room.nightActions = {};
    room.players.forEach(p => { p.silenced = false; });
    pushRoomNews(room, `🌙 Ніч №${room.dayNumber} (Етап 1): Нічний чат Мафії (30 с). Активні ролі ходять у 2-му етапі.`);
  } else if (phase === 'night_vote') {
    pushRoomNews(room, `🎯 Ніч №${room.dayNumber} (Етап 2): Час нічних дій — Мафія, Лікар, Шериф та активні ролі обирають ціль (30 с).`);
  } else if (phase === 'day_chat') {
    pushRoomNews(room, `☀️ День №${room.dayNumber}: Місто прокидається! Обговорення в чаті (60 с).`);
  } else if (phase === 'day_vote') {
    room.votes = {};
    pushRoomNews(room, `⚖️ День №${room.dayNumber}: Денне голосування за вигнання (30 с).`);
  }
  broadcastRoomState(room);
}

function createFreshBotIntel() {
  return {
    claimedSheriffs: [],
    accusedMafia: {},
    clearedTown: [],
    mafiaPlannedTarget: null,
    mafiaKnownRoles: {},
    lastKilledNick: null,
    lastSavedNick: null,
    repliedByDay: {},
    lastSpokeNick: ''
  };
}

function ensureRoomBotIntel(room) {
  if (!room.botIntel) room.botIntel = createFreshBotIntel();
  return room.botIntel;
}

function pickRandom(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function emitBotMessage(room, bot, rawText, isMafiaSecret = false) {
  if (!rooms[room.id] || !bot || !bot.alive) return false;
  if (!isMafiaSecret && (room.phase !== 'day_chat' || bot.silenced)) return false;
  if (isMafiaSecret && room.phase !== 'night_chat') return false;
  const cleanText = escapeHTML(String(rawText || '').trim()).slice(0, 280);
  if (!cleanText) return false;

  const msg = {
    author: bot.nickname,
    badgeType: null,
    text: cleanText,
    isMafiaSecret: !!isMafiaSecret,
    isBot: true,
    time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  };
  if (!room.chat) room.chat = [];
  room.chat.push(msg);
  bot.actionsCount = (bot.actionsCount || 0) + 1;

  if (isMafiaSecret) {
    const mediumAnonMsg = { ...msg, author: '🕵️ Невідомий мафіозі', isIncognitoMafia: true };
    recordTimelineEvent(room, { kind: 'msg', msg, incognitoMsg: mediumAnonMsg, visibility: 'mafia' });
    room.players.forEach(p => {
      if (!p.isBot && p.alive && !p.isSpectator) {
        if (ROLES[p.role] && ROLES[p.role].team === 'mafia') {
          emitToUser(p.nickname, 'newRoomMsg', msg);
        } else if (p.role === 'medium') {
          emitToUser(p.nickname, 'newRoomMsg', mediumAnonMsg);
        }
      }
    });
  } else {
    recordTimelineEvent(room, { kind: 'msg', msg, visibility: 'all' });
    io.to(room.id).emit('newRoomMsg', msg);
    const intel = ensureRoomBotIntel(room);
    intel.lastSpokeNick = bot.nickname;
    analyzeRoomChatForBots(room, bot.nickname, rawText, false, true);
  }
  return true;
}

function analyzeRoomChatForBots(room, authorNick, rawText, isMafiaNight = false, fromBot = false) {
  if (!room || room.status !== 'playing' || !authorNick || !rawText) return;
  const intel = ensureRoomBotIntel(room);
  const txt = String(rawText).trim();
  const lower = txt.toLowerCase();
  const alive = room.players.filter(p => p.alive && !p.isSpectator);

  if (isMafiaNight) {
    // Якщо людина-мафія назвала ціль у нічному чаті — боти-мафіозі підхоплюють і відповідають!
    const mentioned = alive.find(p =>
      p.nickname.toLowerCase() !== authorNick.toLowerCase() &&
      (!ROLES[p.role] || ROLES[p.role].team !== 'mafia') &&
      lower.includes(p.nickname.toLowerCase())
    );
    if (mentioned) {
      intel.mafiaPlannedTarget = mentioned.nickname;
      if (!fromBot) {
        const mafiaBots = alive.filter(p => p.isBot && ROLES[p.role] && ROLES[p.role].team === 'mafia');
        const responder = pickRandom(mafiaBots);
        const dayKey = `mreply_${room.dayNumber}`;
        if (responder && !intel.repliedByDay[dayKey]) {
          intel.repliedByDay[dayKey] = true;
          setTimeout(() => {
            if (!rooms[room.id] || room.phase !== 'night_chat' || !responder.alive) return;
            const lines = [
              `Прийнято, працюємо по ${mentioned.nickname}!`,
              `Згоден, прибираємо ${mentioned.nickname} цієї ночі.`,
              `Добра ціль! Я теж голосую за ${mentioned.nickname}.`
            ];
            emitBotMessage(room, responder, pickRandom(lines), true);
          }, 1600 + Math.floor(Math.random() * 1400));
        }
      }
    }
    return;
  }

  if (room.phase !== 'day_chat') return;

  // 1. Виявляємо розкриття Шерифа (від людини або від бота)
  const isSheriffClaim =
    /(я\s+шериф|я\s*-\s*шериф|я\s+коп|i\s*am\s*sheriff|i'm\s*sheriff|лікар[юу]?\s*,?\s*(прикрий|лікуй|хіл|сейв)|doctor\s*,?\s*heal\s*me|перевірив\s+.+(мафі|чист|мирн))/i.test(lower);
  if (isSheriffClaim) {
    if (!intel.claimedSheriffs.some(n => n.toLowerCase() === authorNick.toLowerCase())) {
      intel.claimedSheriffs.push(authorNick);
    }
  }
  const authorIsClaimedSheriff = intel.claimedSheriffs.some(n => n.toLowerCase() === authorNick.toLowerCase());

  // 2. Виявляємо згадки гравців (звинувачення у мафії або підтвердження мирного)
  const hasMafiaWord = /(мафі|маф|mafia|винен|голосу|зливай|киляй|підозр|suspect|guilty|vote|чорн)/i.test(lower);
  const hasCleanWord = /(чист|мирн|не\s*маф|clean|innocent|town|довіря|trust|біл)/i.test(lower);

  alive.forEach(p => {
    if (p.nickname.toLowerCase() === authorNick.toLowerCase()) return;
    if (!lower.includes(p.nickname.toLowerCase())) return;

    if (hasMafiaWord) {
      const prev = intel.accusedMafia[p.nickname] || { by: authorNick, weight: 0 };
      const addW = authorIsClaimedSheriff ? 12 : 2;
      intel.accusedMafia[p.nickname] = {
        by: authorIsClaimedSheriff ? authorNick : prev.by,
        weight: Math.min(20, prev.weight + addW)
      };

      // Якщо людина звинуватила живого незаглушеного бота — бот живо відповідає в чаті!
      if (!fromBot && p.isBot && !p.silenced) {
        const repKey = `def_${room.dayNumber}_${p.nickname}`;
        if (!intel.repliedByDay[repKey]) {
          intel.repliedByDay[repKey] = true;
          setTimeout(() => {
            if (!rooms[room.id] || room.phase !== 'day_chat' || !p.alive || p.silenced) return;
            let defenseLines;
            if (p.role === 'jester') {
              defenseLines = [
                `Ого, ${authorNick}, одразу проти мене? Ну спробуйте вигнати, подивитесь що буде!`,
                `Хм, цікаво ${authorNick}... А може я й справді не такий простий? 😉`
              ];
            } else if (p.role === 'sheriff') {
              defenseLines = [
                `Стій, ${authorNick}! Я Шериф, не чіпайте мене — перевірю тебе вночі!`,
                `${authorNick}, ти помиляєшся, я на боці міста! Лікарю, зверни увагу на мене.`
              ];
              if (!intel.claimedSheriffs.includes(p.nickname)) intel.claimedSheriffs.push(p.nickname);
            } else if (ROLES[p.role] && ROLES[p.role].team === 'mafia') {
              const scapegoat = pickRandom(alive.filter(x => x.nickname !== p.nickname && x.nickname !== authorNick && (!ROLES[x.role] || ROLES[x.role].team !== 'mafia')));
              defenseLines = [
                `${authorNick}, це просто здогадка без доказів! Я мирний, краще придивись до ${scapegoat ? scapegoat.nickname : 'мовчунів'}.`,
                `Не поспішай, ${authorNick}, я точно не мафія! Хтось спеціально відводить підозру на мене.`
              ];
            } else {
              defenseLines = [
                `${authorNick}, я мирний житель! Не зливайте свого дарма.`,
                `А які докази, ${authorNick}? Я за місто, перевірте мене якщо не вірите!`,
                `${authorNick}, ти зараз граєш на руку мафії. Я чистий!`
              ];
            }
            emitBotMessage(room, p, pickRandom(defenseLines), false);
          }, 1800 + Math.floor(Math.random() * 1400));
        }
      }
    } else if (hasCleanWord && authorIsClaimedSheriff) {
      if (!intel.clearedTown.some(n => n.toLowerCase() === p.nickname.toLowerCase())) {
        intel.clearedTown.push(p.nickname);
      }
    }
  });
}

function getTopSuspectForTown(room, alive, excludeNick) {
  const intel = ensureRoomBotIntel(room);
  const candidates = alive
    .filter(p => p.nickname !== excludeNick)
    .filter(p => !intel.claimedSheriffs.includes(p.nickname) && !intel.clearedTown.includes(p.nickname));
  let best = null;
  let bestW = 0;
  candidates.forEach(p => {
    const rec = intel.accusedMafia[p.nickname];
    if (rec && rec.weight > bestW) {
      bestW = rec.weight;
      best = { player: p, weight: rec.weight, by: rec.by };
    }
  });
  return best;
}

function buildSmartBotDayLine(room, bot, alive) {
  const intel = ensureRoomBotIntel(room);
  const others = alive.filter(p => p.nickname !== bot.nickname);
  if (others.length === 0) return null;
  const botRole = ROLES[bot.role];
  const isMafia = !!(botRole && botRole.team === 'mafia' && !bot.convertedToCult);

  // 1. ШЕРИФ: публікує свої перевірки!
  if (bot.role === 'sheriff' && !bot.convertedToCult) {
    const checks = Array.isArray(bot.botChecks) ? bot.botChecks : [];
    const mafiaHit = checks.find(c => !c.announced && c.isMaf && alive.some(p => p.nickname === c.target));
    if (mafiaHit) {
      mafiaHit.announced = true;
      if (!intel.claimedSheriffs.includes(bot.nickname)) intel.claimedSheriffs.push(bot.nickname);
      intel.accusedMafia[mafiaHit.target] = { by: bot.nickname, weight: 15 };
      return pickRandom([
        `🕵️ Я Шериф! Перевірив ${mafiaHit.target} — це МАФІЯ! Лікарю, прикрий мене вночі! Голосуємо проти ${mafiaHit.target}!`,
        `🕵️ Увага, місто! Я Шериф: ${mafiaHit.target} — 100% МАФІЯ! Лікарю, похіляй мене вночі, а зараз усі виганяємо ${mafiaHit.target}!`
      ]);
    }
    const cleanHit = checks.find(c => !c.announced && !c.isMaf && alive.some(p => p.nickname === c.target));
    if (cleanHit && (room.dayNumber >= 2 || (intel.accusedMafia[cleanHit.target] && intel.accusedMafia[cleanHit.target].weight >= 2))) {
      cleanHit.announced = true;
      if (!intel.claimedSheriffs.includes(bot.nickname)) intel.claimedSheriffs.push(bot.nickname);
      if (!intel.clearedTown.includes(cleanHit.target)) intel.clearedTown.push(cleanHit.target);
      return `🕵️ Я Шериф! Перевірив ${cleanHit.target} — гравець чистий (мирний), довіряю йому. Лікарю, прикрий мене за нагоди.`;
    }
  }

  // 2. РЕПОРТЕР: коментує своє порівняння
  if (bot.role === 'journalist' && !bot.convertedToCult) {
    const comps = Array.isArray(bot.botComparisons) ? bot.botComparisons : [];
    const fresh = comps.find(c => !c.announced && alive.some(p => p.nickname === c.p1) && alive.some(p => p.nickname === c.p2));
    if (fresh) {
      fresh.announced = true;
      return fresh.sameTeam
        ? `📸 Зверніть увагу на зведення: ${fresh.p1} і ${fresh.p2} в ОДНІЙ команді! Якщо один із них мирний — другий теж.`
        : `📸 ${fresh.p1} і ${fresh.p2} у РІЗНИХ командах! Мінімум один із них грає проти міста, давайте розбиратись.`;
    }
  }

  // 3. ДЖОКЕР: веде себе провокативно, щоб його вигнали
  if (bot.role === 'jester') {
    const rnd = pickRandom(others);
    return pickRandom([
      `Та годі вам шукати, може я й мафія, спробуйте доведіть! 😏`,
      `Мені здається, ${rnd.nickname} щось приховує... або я просто плутаю карти?`,
      `Голосую проти всіх підряд, нудно слухати ваші теорії!`
    ]);
  }

  // 4. МАФІЯ: прикидається мирним, відводить підозру від своїх
  if (isMafia) {
    const nonMaf = others.filter(p => !ROLES[p.role] || ROLES[p.role].team !== 'mafia');
    const target = pickRandom(nonMaf.length > 0 ? nonMaf : others);
    const exposedAlly = alive.find(p => ROLES[p.role] && ROLES[p.role].team === 'mafia' && intel.accusedMafia[p.nickname]?.weight >= 8);
    if (exposedAlly && exposedAlly.nickname !== bot.nickname && Math.random() < 0.65) {
      return pickRandom([
        `А ви впевнені, що це справжній Шериф? Може це лже-шериф або підстава проти ${exposedAlly.nickname}?`,
        `Зачекайте, мені ${target.nickname} здається значно підозрілішим, ніж ${exposedAlly.nickname}!`
      ]);
    }
    return pickRandom([
      `Як на мене, ${target.nickname} сьогодні поводиться підозріло. Хто ще так думає?`,
      `Після цієї ночі треба думати холодно. ${target.nickname}, яка твоя думка по столу?`,
      `Я за місто. Мені не подобається тиша від ${target.nickname}, давайте перевіримо або проголосуємо.`,
      `Треба знайти мафію сьогодні, інакше завтра буде пізно. Придивіться до ${target.nickname}.`
    ]);
  }

  // 5. МИРНІ / ЛІКАР / ОХОРОНЕЦЬ / ІНШІ РОЛІ: реагують на Шерифа та нічні події
  const topSus = getTopSuspectForTown(room, alive, bot.nickname);
  if (topSus && topSus.weight >= 8) {
    return pickRandom([
      `Підтримую перевірку! Голосую проти ${topSus.player.nickname}, мафію треба прибирати одразу.`,
      `Якщо є перевірка на ${topSus.player.nickname} — я з містом, мій голос проти ${topSus.player.nickname}!`,
      `Лікарю, обов'язково прикрий Шерифа вночі! А зараз усі тиснемо на ${topSus.player.nickname}.`
    ]);
  }

  const rndSuspect = pickRandom(others.filter(p => !intel.claimedSheriffs.includes(p.nickname) && !intel.clearedTown.includes(p.nickname))) || pickRandom(others);
  if (intel.lastSavedNick && room.timeLeft >= 45 && Math.random() < 0.45) {
    return `Красавчик Лікар, врятував ${intel.lastSavedNick}! Тепер треба вирахувати, хто стріляв. Що скажеш, ${rndSuspect.nickname}?`;
  }
  if (intel.lastKilledNick && room.timeLeft >= 45 && Math.random() < 0.45) {
    return `Шкода, що прибрали ${intel.lastKilledNick}... Хто з вас мовчить? ${rndSuspect.nickname}, які підозри?`;
  }

  const style = bot.botStyle || '';
  if (style === 'Аналітик' || style === 'Слідчий' || style === 'Тактик') {
    return `Дивлюся по активності за столом — ${rndSuspect.nickname} викликає питання. Хто підтримає перевірку?`;
  }
  if (style === 'Провокатор' || style === 'Блефер') {
    return `${rndSuspect.nickname}, чого ховаєшся? Скажи прямо, за кого граєш!`;
  }
  if (style === 'Миротворка' || style === 'Захисник') {
    return `Не сварімося, давайте слухати Шерифа і не розкидати голоси. ${rndSuspect.nickname}, кого підозрюєш?`;
  }
  return pickRandom([
    `Поки що придивляюся до ${rndSuspect.nickname}. Якщо у Шерифа є перевірки — пишіть!`,
    `Мені здається, серед тихих точно є мафія. ${rndSuspect.nickname}, твоя позиція?`,
    `Я граю за мирних. Давайте обговоримо кандидатуру ${rndSuspect.nickname} перед голосуванням.`
  ]);
}

function runBotsAI(room) {
  const alive = room.players.filter(p => p.alive && !p.isSpectator);
  const bots = alive.filter(p => p.isBot);
  if (bots.length === 0) return;
  const intel = ensureRoomBotIntel(room);

  // === 1. ЖИВИЙ ДЕННИЙ ЧАТ (Кілька хвиль, Шериф вскривається першим!) ===
  if (room.phase === 'day_chat' && [53, 45, 35, 25, 15].includes(room.timeLeft)) {
    const speakableBots = bots.filter(b => !b.silenced);
    if (speakableBots.length > 0) {
      const chosen = [];
      // Пріоритет 1: Шериф з неоголошеною перевіркою мафії говорить одразу!
      const sheriffWithHit = speakableBots.find(b =>
        b.role === 'sheriff' && !b.convertedToCult &&
        (b.botChecks || []).some(c => !c.announced && c.isMaf && alive.some(p => p.nickname === c.target))
      );
      if (sheriffWithHit) chosen.push(sheriffWithHit);

      // Пріоритет 2: Репортер із свіжим порівнянням
      const journoWithNews = speakableBots.find(b =>
        b.role === 'journalist' && !b.convertedToCult && !chosen.includes(b) &&
        (b.botComparisons || []).some(c => !c.announced && alive.some(p => p.nickname === c.p1) && alive.some(p => p.nickname === c.p2))
      );
      if (journoWithNews && room.timeLeft >= 45) chosen.push(journoWithNews);

      const desiredCount = (room.timeLeft === 53 || room.timeLeft === 45) ? Math.min(2, speakableBots.length) : 1;
      const pool = speakableBots
        .filter(b => !chosen.includes(b) && (speakableBots.length <= 2 || b.nickname !== intel.lastSpokeNick))
        .sort(() => Math.random() - 0.5);
      while (chosen.length < desiredCount && pool.length > 0) {
        chosen.push(pool.shift());
      }

      chosen.forEach((talkativeBot, idx) => {
        setTimeout(() => {
          if (!rooms[room.id] || room.phase !== 'day_chat' || !talkativeBot.alive || talkativeBot.silenced) return;
          const line = buildSmartBotDayLine(room, talkativeBot, alive);
          if (line) emitBotMessage(room, talkativeBot, line, false);
        }, 500 + idx * 2200 + Math.floor(Math.random() * 800));
      });
    }
  }

  // === 2. КООРДИНАЦІЯ МАФІЇ У НІЧНОМУ ЧАТІ ===
  if (room.phase === 'night_chat' && (room.timeLeft === 25 || room.timeLeft === 15)) {
    const mafiaBots = bots.filter(b => ROLES[b.role] && ROLES[b.role].team === 'mafia' && !b.convertedToCult);
    if (mafiaBots.length > 0) {
      const nonMaf = alive.filter(p => !ROLES[p.role] || ROLES[p.role].team !== 'mafia');
      if (nonMaf.length > 0) {
        if (room.timeLeft === 25) {
          // Обираємо розумну пріоритетну ціль для всієї Мафії
          const claimedSh = nonMaf.find(p => intel.claimedSheriffs.includes(p.nickname));
          const knownKeyRole = nonMaf.find(p => ['sheriff', 'doctor', 'bodyguard', 'jailor'].includes(intel.mafiaKnownRoles[p.nickname]));
          const target = claimedSh || knownKeyRole || pickRandom(nonMaf);
          intel.mafiaPlannedTarget = target.nickname;

          const speaker = mafiaBots.find(b => b.role === 'godfather') || pickRandom(mafiaBots);
          const conBot = mafiaBots.find(b => b.role === 'consigliere' && (b.botConFindings || []).some(f => !f.shared && alive.some(a => a.nickname === f.target)));
          if (conBot) {
            const f = conBot.botConFindings.find(x => !x.shared && alive.some(a => a.nickname === x.target));
            f.shared = true;
            emitBotMessage(room, conBot, `🕵️ Я дізнався роль ${f.target} — це ${f.roleName}! Пропоную працювати по ${intel.mafiaPlannedTarget}.`, true);
          } else {
            const reasonTxt = claimedSh
              ? `Шериф ${target.nickname} надто небезпечний — прибираємо його цієї ночі!`
              : `Пропоную цієї ночі прибрати ${target.nickname}, працюємо злагоджено.`;
            emitBotMessage(room, speaker, reasonTxt, true);
          }
        } else if (room.timeLeft === 15 && mafiaBots.length >= 2 && intel.mafiaPlannedTarget) {
          const second = mafiaBots.find(b => b.nickname !== intel.lastSpokeNick) || mafiaBots[1];
          emitBotMessage(room, second, pickRandom([
            `Згоден, голосую вночі за ${intel.mafiaPlannedTarget}.`,
            `Прийнято! Головне вдень триматись спокійно й не видати себе.`
          ]), true);
        }
      }
    }
  }

  // === 3. НІЧНІ ДІЇ ВСІХ РОЛЕЙ ТА ЛОГІЧНЕ ДЕННЕ ГОЛОСУВАННЯ ===
  let votesUpdated = false;
  bots.forEach(bot => {
    const botRole = ROLES[bot.role];
    const others = alive.filter(p => p.nickname !== bot.nickname);
    if (others.length === 0) return;

    if (room.phase === 'night_vote' && !bot.convertedToCult && !['citizen', 'mayor', 'jester', 'medium'].includes(bot.role)) {
      if (bot.role === 'journalist') {
        if (Array.isArray(room.nightActions[bot.nickname]) && room.nightActions[bot.nickname].length >= 2) return;
        if (others.length >= 2) {
          const topSus = getTopSuspectForTown(room, alive, bot.nickname);
          const first = topSus ? topSus.player : pickRandom(others);
          const secondPool = others.filter(p => p.nickname !== first.nickname);
          const second = pickRandom(secondPool);
          if (first && second) {
            room.nightActions[bot.nickname] = [first.nickname, second.nickname];
            bot.actionsCount = (bot.actionsCount || 0) + 1;
          }
        }
        return;
      }
      if (room.nightActions[bot.nickname]) return;

      if (bot.role === 'amnesiac') {
        const dead = room.players.filter(p => !p.alive && !p.isSpectator);
        const preferredDead = dead.find(d => ['sheriff', 'doctor', 'mafioso', 'godfather', 'vigilante'].includes(d.role)) || dead[0];
        if (preferredDead) room.nightActions[bot.nickname] = preferredDead.nickname;
      } else if (bot.role === 'doctor' || bot.role === 'guardian_angel') {
        // ЛІКАР / ЯНГОЛ: пріоритет — розкритий Шериф (з урахуванням правила не лікувати 2 ночі поспіль!)
        const healPool = (alive.length >= 4 && bot.lastHealedTarget)
          ? others.filter(p => p.nickname !== bot.lastHealedTarget)
          : others;
        const pool = healPool.length > 0 ? healPool : others;
        const sheriffToHeal = pool.find(p => intel.claimedSheriffs.includes(p.nickname));
        const clearedToHeal = pool.find(p => intel.clearedTown.includes(p.nickname));
        const chosenHeal = sheriffToHeal || (clearedToHeal && Math.random() < 0.7 ? clearedToHeal : pickRandom(pool));
        if (chosenHeal) room.nightActions[bot.nickname] = chosenHeal.nickname;
      } else if (bot.role === 'bodyguard') {
        // ОХОРОНЕЦЬ: прикриває розкритого Шерифа в пріоритеті!
        const sheriffToGuard = others.find(p => intel.claimedSheriffs.includes(p.nickname));
        const clearedToGuard = others.find(p => intel.clearedTown.includes(p.nickname));
        const chosenGuard = sheriffToGuard || clearedToGuard || pickRandom(others);
        if (chosenGuard) room.nightActions[bot.nickname] = chosenGuard.nickname;
      } else if (bot.role === 'sheriff') {
        // ШЕРИФ: не перевіряє двічі одного й того самого, пріоритет — підозрювані
        const alreadyChecked = new Set((bot.botChecks || []).map(c => c.target));
        const unchecked = others.filter(p => !alreadyChecked.has(p.nickname));
        const pool = unchecked.length > 0 ? unchecked : others;
        const suspect = pool.find(p => intel.accusedMafia[p.nickname] && intel.accusedMafia[p.nickname].weight >= 2);
        const chosenCheck = suspect || pickRandom(pool);
        if (chosenCheck) room.nightActions[bot.nickname] = chosenCheck.nickname;
      } else if (bot.role === 'vigilante') {
        // МЕСНИК: стріляє тільки по виявленій мафії або з 2-ї ночі по сильному підозрюваному (ніколи в Шерифа!)
        const topSus = getTopSuspectForTown(room, alive, bot.nickname);
        if (topSus && (topSus.weight >= 8 || (room.dayNumber >= 2 && topSus.weight >= 4))) {
          room.nightActions[bot.nickname] = topSus.player.nickname;
        }
      } else if (bot.role === 'escort' || bot.role === 'jailor') {
        const topSus = getTopSuspectForTown(room, alive, bot.nickname);
        const safePool = others.filter(p => !intel.claimedSheriffs.includes(p.nickname) && !intel.clearedTown.includes(p.nickname));
        const target = (topSus && topSus.player) || pickRandom(safePool.length > 0 ? safePool : others);
        if (target) room.nightActions[bot.nickname] = target.nickname;
      } else if (bot.role === 'cult_leader') {
        const nonCult = others.filter(p => !isPlayerCultMember(p) && !intel.claimedSheriffs.includes(p.nickname));
        const fallback = others.filter(p => !isPlayerCultMember(p));
        const target = pickRandom(nonCult.length > 0 ? nonCult : fallback);
        if (target) room.nightActions[bot.nickname] = target.nickname;
      } else if (botRole && botRole.team === 'mafia') {
        const nonMafia = others.filter(p => !ROLES[p.role] || ROLES[p.role].team !== 'mafia');
        const pool = nonMafia.length > 0 ? nonMafia : others;

        if (bot.role === 'consigliere') {
          const unknown = pool.filter(p => !intel.mafiaKnownRoles[p.nickname]);
          const target = pickRandom(unknown.length > 0 ? unknown : pool);
          if (target) room.nightActions[bot.nickname] = target.nickname;
        } else if (bot.role === 'blackmailer') {
          const sheriffTarget = pool.find(p => intel.claimedSheriffs.includes(p.nickname));
          const target = sheriffTarget || pickRandom(pool);
          if (target) room.nightActions[bot.nickname] = target.nickname;
        } else if (bot.role === 'framer') {
          const notCleared = pool.filter(p => !intel.clearedTown.includes(p.nickname));
          const target = pickRandom(notCleared.length > 0 ? notCleared : pool);
          if (target) room.nightActions[bot.nickname] = target.nickname;
        } else {
          // Узгоджене вбивство Мафії (Дон + Мафіозі б'ють в одну ціль!)
          const plannedValid = intel.mafiaPlannedTarget && pool.find(p => p.nickname === intel.mafiaPlannedTarget);
          const existingMafTarget = Object.entries(room.nightActions).find(([nick, t]) => {
            const pObj = alive.find(pl => pl.nickname === nick);
            return pObj && (pObj.role === 'godfather' || pObj.role === 'mafioso') && pool.some(nm => nm.nickname === t);
          });
          const sheriffHit = pool.find(p => intel.claimedSheriffs.includes(p.nickname));
          const chosen = plannedValid
            ? plannedValid.nickname
            : (existingMafTarget ? existingMafTarget[1] : (sheriffHit ? sheriffHit.nickname : pickRandom(pool).nickname));
          room.nightActions[bot.nickname] = chosen;
          intel.mafiaPlannedTarget = chosen;
        }
      } else {
        room.nightActions[bot.nickname] = pickRandom(others).nickname;
      }
      if (room.nightActions[bot.nickname]) bot.actionsCount = (bot.actionsCount || 0) + 1;

    } else if (room.phase === 'day_vote' && !room.votes[bot.nickname]) {
      let targetObj = null;

      if (botRole && botRole.team === 'mafia' && !bot.convertedToCult) {
        const nonMaf = others.filter(p => !ROLES[p.role] || ROLES[p.role].team !== 'mafia');
        const pool = nonMaf.length > 0 ? nonMaf : others;
        // Мафія підтримує вже наявний голос проти мирного або голосує проти розкритого Шерифа / випадкового мирного
        const existingNonMafVote = Object.values(room.votes).find(t => pool.some(c => c.nickname === t));
        const sheriffTarget = pool.find(p => intel.claimedSheriffs.includes(p.nickname));
        targetObj = (existingNonMafVote && pool.find(c => c.nickname === existingNonMafVote))
          || (sheriffTarget && Math.random() < 0.65 ? sheriffTarget : null)
          || pickRandom(pool);
      } else if (isPlayerCultMember(bot)) {
        const nonCult = others.filter(p => !isPlayerCultMember(p));
        const pool = nonCult.length > 0 ? nonCult : others;
        const topSus = getTopSuspectForTown(room, alive, bot.nickname);
        targetObj = (topSus && pool.some(c => c.nickname === topSus.player.nickname)) ? topSus.player : pickRandom(pool);
      } else if (bot.role === 'jester') {
        targetObj = pickRandom(others);
      } else {
        // МИРНІ: логічно голосують за викриту Шерифом мафію, не чіпають Шерифа та перевірених мирних!
        const safePool = others.filter(p => !intel.claimedSheriffs.includes(p.nickname) && !intel.clearedTown.includes(p.nickname));
        const candidatePool = safePool.length > 0 ? safePool : others;

        // Власна перевірка бота-Шерифа має абсолютний пріоритет
        const ownMafiaHit = (bot.role === 'sheriff' && Array.isArray(bot.botChecks))
          ? bot.botChecks.find(c => c.isMaf && candidatePool.some(p => p.nickname === c.target))
          : null;
        if (ownMafiaHit) {
          targetObj = candidatePool.find(p => p.nickname === ownMafiaHit.target);
        }

        if (!targetObj) {
          const topSus = getTopSuspectForTown(room, alive, bot.nickname);
          if (topSus && topSus.weight >= 8 && Math.random() < 0.88) {
            targetObj = candidatePool.find(p => p.nickname === topSus.player.nickname) || topSus.player;
          } else if (topSus && topSus.weight >= 2 && Math.random() < 0.65) {
            targetObj = candidatePool.find(p => p.nickname === topSus.player.nickname) || topSus.player;
          }
        }

        if (!targetObj) {
          const votedTargets = Object.values(room.votes).filter(t => candidatePool.some(c => c.nickname === t));
          targetObj = (votedTargets.length > 0 && Math.random() < 0.65)
            ? candidatePool.find(c => c.nickname === pickRandom(votedTargets))
            : pickRandom(candidatePool);
        }
      }

      if (targetObj) {
        room.votes[bot.nickname] = targetObj.nickname;
        bot.actionsCount = (bot.actionsCount || 0) + 1;
        pushRoomNews(room, `🗳️ ${bot.nickname} голосує проти ${targetObj.nickname}`);
        votesUpdated = true;
      }
    }
  });

  if (votesUpdated) broadcastRoomState(room);
  checkAllVotedOrActed(room);
}

function resolveNight(room) {
  const actions = room.nightActions;
  const blocked = new Set();
  const healed = new Set();
  const framed = new Set();
  const bodyguardMap = {};
  const kills = new Set();
  const eliminated = [];
  let news = [];

  room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && (p.role === 'escort' || p.role === 'jailor')).forEach(p => {
    const t = actions[p.nickname];
    if (t) {
      blocked.add(t);
      if (p.role === 'jailor') healed.add(t);
    }
  });

  room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && (p.role === 'doctor' || p.role === 'guardian_angel')).forEach(p => {
    if (!blocked.has(p.nickname) && actions[p.nickname]) {
      healed.add(actions[p.nickname]);
      p.lastHealedTarget = actions[p.nickname];
    } else {
      p.lastHealedTarget = null;
    }
  });

  room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && p.role === 'bodyguard').forEach(bg => {
    if (!blocked.has(bg.nickname) && actions[bg.nickname]) {
      const t = actions[bg.nickname];
      if (!bodyguardMap[t]) bodyguardMap[t] = [];
      bodyguardMap[t].push(bg.nickname);
    }
  });

  const tryBodyguardIntercept = (targetNick, attackerNick) => {
    if (!targetNick || !attackerNick) return false;
    const guards = bodyguardMap[targetNick];
    if (Array.isArray(guards) && guards.length > 0) {
      const bgNick = guards.shift();
      kills.add(bgNick);
      kills.add(attackerNick);
      news.push(`🛡️ Охоронець ${bgNick} ціною власного життя врятував ${targetNick} та вбив нападника ${attackerNick}!`);
      return true;
    }
    return false;
  };

  room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && p.role === 'framer').forEach(fr => {
    if (!blocked.has(fr.nickname) && actions[fr.nickname]) framed.add(actions[fr.nickname]);
  });

  room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && p.role === 'blackmailer').forEach(bm => {
    if (!blocked.has(bm.nickname) && actions[bm.nickname]) {
      const target = room.players.find(pl => pl.nickname === actions[bm.nickname]);
      if (target && !healed.has(target.nickname)) target.silenced = true;
    }
  });

  // Хід Мафії: пріоритет має живий незаблокований Дон; інакше — голос більшості живих мафіозі
  const mafias = room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && ROLES[p.role] && ROLES[p.role].team === 'mafia' && !blocked.has(p.nickname));
  const don = mafias.find(p => p.role === 'godfather');
  let mafiaTargetNick = null;
  let mafiaKillerNick = null;
  if (don && actions[don.nickname]) {
    mafiaTargetNick = actions[don.nickname];
    mafiaKillerNick = don.nickname;
  } else {
    const mafiaKillers = mafias.filter(p => p.role === 'mafioso' || p.role === 'godfather');
    const votersPool = mafiaKillers.length > 0 ? mafiaKillers : mafias.filter(p => p.role !== 'consigliere' && p.role !== 'framer' && p.role !== 'blackmailer');
    const mafiaTally = {};
    votersPool.forEach(m => {
      const t = actions[m.nickname];
      if (t) {
        mafiaTally[t] = (mafiaTally[t] || 0) + 1;
      }
    });
    let bestCount = 0;
    Object.entries(mafiaTally).forEach(([tNick, cnt]) => {
      if (cnt > bestCount) { bestCount = cnt; mafiaTargetNick = tNick; }
    });
    if (mafiaTargetNick) {
      const actualKiller = votersPool.find(m => actions[m.nickname] === mafiaTargetNick);
      mafiaKillerNick = actualKiller ? actualKiller.nickname : (votersPool[0] && votersPool[0].nickname);
    }
  }

  if (mafiaTargetNick && mafiaKillerNick) {
    if (!tryBodyguardIntercept(mafiaTargetNick, mafiaKillerNick)) {
      kills.add(mafiaTargetNick);
    }
  }

  room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && p.role === 'vigilante' && !blocked.has(p.nickname)).forEach(v => {
    const t = actions[v.nickname];
    if (t) {
      if (!tryBodyguardIntercept(t, v.nickname)) {
        kills.add(t);
        const tObj = room.players.find(pl => pl.nickname === t);
        if (tObj && !isPlayerCultMember(tObj) && ROLES[tObj.role] && ROLES[tObj.role].team === 'town') {
          kills.add(v.nickname);
        }
      }
    }
  });

  // Вербування у Культ виконує лише оригінальний Лідер Культу (обернені культисти не мають права вербувати інших)
  room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && p.role === 'cult_leader' && !blocked.has(p.nickname)).forEach(cl => {
    const tNick = actions[cl.nickname];
    const tObj = room.players.find(pl => pl.nickname === tNick && pl.alive);
    if (tObj && !kills.has(tObj.nickname) && !healed.has(tObj.nickname) && !isPlayerCultMember(tObj) && ROLES[tObj.role] && ROLES[tObj.role].team === 'town') {
      tObj.convertedToCult = true;
      pushPrivateRoomNews(room, tObj.nickname, '🕯️ Вночі вас навернули у таємний Культ! Ви стали культистом (без права вербувати інших), бачите всіх членів Культу і перемагаєте разом із Культом.');
      room.players.forEach(cm => {
        if (cm.alive && !cm.isSpectator && isPlayerCultMember(cm) && cm.nickname !== tObj.nickname) {
          pushPrivateRoomNews(room, cm.nickname, `🕯️ До вашого Культу приєднався новий культист: ${tObj.nickname}!`);
        }
      });
    }
  });

  const intel = ensureRoomBotIntel(room);
  intel.lastKilledNick = null;
  intel.lastSavedNick = null;
  intel.mafiaPlannedTarget = null;

  kills.forEach(victimNick => {
    if (!healed.has(victimNick)) {
      const victim = room.players.find(p => p.nickname === victimNick);
      if (victim && victim.alive) {
        victim.alive = false;
        eliminated.push(victim);
        intel.lastKilledNick = victim.nickname;
        const roleLabel = getPlayerRoleDeathLabel(victim);
        news.push(`💀 Вночі було вбито ${victim.nickname} (${roleLabel})!`);
      }
    } else {
      intel.lastSavedNick = victimNick;
      news.push(`💉 Лікар врятував життя гравцю ${victimNick}!`);
    }
  });

  room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && p.role === 'sheriff' && !blocked.has(p.nickname)).forEach(sh => {
    const tObj = room.players.find(p => p.nickname === actions[sh.nickname]);
    if (tObj) {
      const isMaf = (!isPlayerCultMember(tObj) && tObj.role && ROLES[tObj.role] && ROLES[tObj.role].team === 'mafia' && tObj.role !== 'godfather') || framed.has(tObj.nickname);
      if (sh.isBot) {
        if (!Array.isArray(sh.botChecks)) sh.botChecks = [];
        sh.botChecks.push({ target: tObj.nickname, isMaf, day: room.dayNumber, announced: false });
      }
      pushPrivateRoomNews(room, sh.nickname, `🔍 Перевірка ${tObj.nickname}: ${isMaf ? 'ЦЕ МАФІЯ!' : 'Чистий.'}`);
    }
  });

  room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && p.role === 'consigliere' && !blocked.has(p.nickname)).forEach(con => {
    const tObj = room.players.find(p => p.nickname === actions[con.nickname]);
    if (tObj && ROLES[tObj.role]) {
      const rName = getPlayerRoleDeathLabel(tObj);
      if (con.isBot) {
        intel.mafiaKnownRoles[tObj.nickname] = tObj.role;
        if (!Array.isArray(con.botConFindings)) con.botConFindings = [];
        con.botConFindings.push({ target: tObj.nickname, role: tObj.role, roleName: rName, shared: false });
      }
      pushPrivateRoomNews(room, con.nickname, `🕵️ Розвідка Консильєре — ${tObj.nickname}: ${rName}.`);
    }
  });

  room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && p.role === 'journalist' && !blocked.has(p.nickname)).forEach(jr => {
    const pair = Array.isArray(actions[jr.nickname]) ? actions[jr.nickname] : [];
    if (pair.length === 2) {
      const p1 = room.players.find(p => p.nickname === pair[0]);
      const p2 = room.players.find(p => p.nickname === pair[1]);
      if (p1 && p2) {
        const effTeam = (pl) => {
          if (framed.has(pl.nickname)) return 'mafia';
          if (isPlayerCultMember(pl)) return 'cult';
          const tm = (ROLES[pl.role] && ROLES[pl.role].team) || 'town';
          if (tm.includes('neutral')) return 'neutral';
          return tm;
        };
        const sameTeam = effTeam(p1) === effTeam(p2);
        if (jr.isBot) {
          if (!Array.isArray(jr.botComparisons)) jr.botComparisons = [];
          jr.botComparisons.push({ p1: p1.nickname, p2: p2.nickname, sameTeam, day: room.dayNumber, announced: false });
        }
        news.push(`📸 Зведення Репортера: ${p1.nickname} та ${p2.nickname} — ${sameTeam ? 'в ОДНІЙ команді!' : 'у РІЗНИХ командах!'}`);
      }
    }
  });

  room.players.filter(p => p.alive && !p.isSpectator && !p.convertedToCult && p.role === 'amnesiac' && !blocked.has(p.nickname)).forEach(amn => {
    const deadObj = room.players.find(p => p.nickname === actions[amn.nickname] && !p.alive && !p.isSpectator);
    if (deadObj && deadObj.role && ROLES[deadObj.role]) {
      amn.role = deadObj.role;
      amn.convertedToCult = !!deadObj.convertedToCult;
      pushPrivateRoomNews(room, amn.nickname, `🧠 Ви згадали минуле! Ваша нова роль: ${getPlayerRoleDeathLabel(amn)}.`);
    }
  });

  pushRoomNews(room, news.length > 0 ? news.join(' | ') : '🌅 Ніч минула спокійно, ніхто не загинув.');

  if (eliminated.length > 0) {
    eliminated.forEach((vic, idx) => {
      if (idx === 0) emitDeathEffect(room, vic, 'night');
      else {
        setTimeout(() => {
          if (rooms[room.id]) emitDeathEffect(room, vic, 'night');
        }, idx * 2700);
      }
    });
    io.emit('roomsUpdated', getPublicRoomsList());
  }
}

function resolveDayVote(room) {
  const tally = {};
  Object.entries(room.votes).forEach(([voterNick, targetNick]) => {
    const voter = room.players.find(p => p.nickname === voterNick);
    const weight = (voter && voter.role === 'mayor') ? 2 : 1;
    tally[targetNick] = (tally[targetNick] || 0) + weight;
  });

  let maxVotes = 0;
  let topCandidates = [];
  Object.entries(tally).forEach(([nick, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      topCandidates = [nick];
    } else if (count === maxVotes && count > 0) {
      topCandidates.push(nick);
    }
  });
  const isTie = topCandidates.length > 1;
  const exiledNick = topCandidates.length > 0
    ? (isTie ? topCandidates[Math.floor(Math.random() * topCandidates.length)] : topCandidates[0])
    : null;
  const victim = exiledNick ? room.players.find(p => p.nickname === exiledNick) : null;

  if (!room.voteLogs) room.voteLogs = [];
  room.voteLogs.unshift({
    day: room.dayNumber,
    tally: { ...tally },
    votes: { ...room.votes },
    exiled: victim ? { nickname: victim.nickname, role: getPlayerRoleDeathLabel(victim) } : null
  });

  if (victim && maxVotes > 0) {
    victim.alive = false;
    const roleLabel = getPlayerRoleDeathLabel(victim);
    if (isTie) {
      pushRoomNews(room, `⚖️ Голоси розділилися порівну (${topCandidates.join(', ')})! Жереб вигнав ${victim.nickname} (${roleLabel})!`);
    } else {
      pushRoomNews(room, `⚖️ Місто вигнало ${victim.nickname} (${roleLabel})!`);
    }
    emitDeathEffect(room, victim, 'vote');
    io.emit('roomsUpdated', getPublicRoomsList());
    if (victim.role === 'jester' && !victim.convertedToCult) {
      victim.jesterWon = true;
      pushRoomNews(room, `🃏 Джокер ${victim.nickname} домігся свого вигнання і здобуває особисту перемогу! Гра триває між іншими командами!`);
    }
  } else {
    pushRoomNews(room, '🤷 Голосів не було — нікого не вигнано.');
  }
}

function checkWinCondition(room) {
  if (room.status === 'ended') return true;
  const alive = room.players.filter(p => p.alive && !p.isSpectator);
  if (alive.length === 0) { finishMatch(room, 'draw'); return true; }

  const mafiaAlive = alive.filter(p => !isPlayerCultMember(p) && ROLES[p.role] && ROLES[p.role].team === 'mafia').length;
  const cultAlive = alive.filter(p => isPlayerCultMember(p)).length;
  const townAlive = alive.filter(p => !isPlayerCultMember(p) && ((ROLES[p.role] && ROLES[p.role].team === 'town') || p.role === 'guardian_angel')).length;

  // Культ перемагає, якщо всі опоненти вибули або Культ став більшістю за відсутності Мафії
  if (cultAlive > 0 && mafiaAlive === 0 && cultAlive >= Math.ceil(alive.length / 2)) {
    finishMatch(room, 'cult');
    return true;
  }
  if (cultAlive > 0 && townAlive === 0 && mafiaAlive === 0) {
    finishMatch(room, 'cult');
    return true;
  }
  // Мирні перемагають лише коли вбиті всі мафіозі (і культ)
  if (mafiaAlive === 0 && cultAlive === 0) { finishMatch(room, 'town'); return true; }
  // Мафія перемагає лише тоді, коли всі мирні (і культ) вбиті
  if (townAlive === 0 && cultAlive === 0 && mafiaAlive > 0) { finishMatch(room, 'mafia'); return true; }
  return false;
}

function finishMatch(room, winner) {
  if (room.status === 'ended') return;
  room.status = 'ended';
  room.phase = 'ended';
  clearInterval(room.timerInterval);
  db.matchMetrics.completed = (db.matchMetrics.completed || 0) + 1;

  if (room.chat && room.chat.length > 0) {
    db.roomLogs.push({
      roomId: room.id,
      roomName: room.name,
      createdAt: Date.now(),
      messages: room.chat.slice(-150)
    });
  }

  const todaySet = getTodayTop100Set();
  const allTimeSet = getAllTimeTop100Set();
  const happyMult = isKyivHappyHour() ? 2 : 1;

  const afkPlayers = (room.players || [])
    .filter(p => !p.isBot && !p.isSpectator && (p.leftRoom || p.leftEarly || ((p.actionsCount || 0) === 0 && (room.dayNumber || 1) >= 2)))
    .map(p => ({
      nickname: p.nickname,
      leftEarly: !!(p.leftRoom || p.leftEarly),
      actionsCount: p.actionsCount || 0
    }));
  room.lastAfkPlayers = afkPlayers;
  room.afkPenaltiesByVoter = {};

  room.players.forEach(p => {
    if (!p.isBot) cancelPlayerDisconnectTimer(p.nickname);
    if (p.isBot || p.isSpectator) return;
    if (p.isGuest) {
      emitToUser(p.nickname, 'promptGuestSave');
      return;
    }
    const prof = findPlayerRecord(p.nickname);
    if (!prof) return;
    ensurePlayerFields(prof);

    const roleObj = (p.role && ROLES[p.role]) ? ROLES[p.role] : (ROLES.citizen || { team: 'town', names: { ua: 'Мирний житель' } });
    const inCult = isPlayerCultMember(p);
    const effTeam = inCult ? 'cult' : (roleObj.team || 'town');
    const isJesterPersonalWin = !inCult && p.role === 'jester' && !!p.jesterWon;
    const isGuardianWin = winner !== 'draw' && !inCult && p.role === 'guardian_angel' && (winner === 'town' || p.alive);
    const isWin = isJesterPersonalWin || (winner !== 'draw' && (isGuardianWin || effTeam === winner));
    const isDraw = winner === 'draw' && !isJesterPersonalWin;
    const teamKey = inCult ? 'cult' : ((roleObj.team && roleObj.team.includes('neutral')) ? 'neutral' : (roleObj.team || 'town'));
    if (!prof.teamStats) {
      prof.teamStats = { town: { played: 0, wins: 0 }, mafia: { played: 0, wins: 0 }, cult: { played: 0, wins: 0 }, neutral: { played: 0, wins: 0 } };
    }
    if (!prof.teamStats[teamKey]) prof.teamStats[teamKey] = { played: 0, wins: 0 };
    if (!prof.roleStats || typeof prof.roleStats !== 'object') prof.roleStats = {};
    if (p.role) {
      if (!prof.roleStats[p.role]) prof.roleStats[p.role] = { played: 0, wins: 0 };
      prof.roleStats[p.role].played += 1;
      if (isWin) prof.roleStats[p.role].wins += 1;
    }

    const isVip = prof.vipUntil && prof.vipUntil > Date.now();
    const vipBonus = isVip ? 1.25 : 1;
    let famBonus = 1;
    let playerFam = (prof.familyId && db.families[prof.familyId]) ? ensureFamilyFields(db.families[prof.familyId]) : null;
    if (playerFam) {
      famBonus = 1 + (playerFam.bonusPct || 5) / 100;
      playerFam.quests.play_20 = Math.min(20, (playerFam.quests.play_20 || 0) + 1);
      if (isWin) playerFam.quests.wins_10 = Math.min(10, (playerFam.quests.wins_10 || 0) + 1);
    }

    const xpMult = (prof.doubleXpGames > 0 ? 2 : 1) * happyMult * vipBonus * famBonus;
    const coinMult = happyMult * vipBonus * famBonus;
    if (prof.doubleXpGames > 0) prof.doubleXpGames -= 1;

    prof.gamesPlayed += 1;
    prof.dailyStats.quests.play_3 = Math.min(3, (prof.dailyStats.quests.play_3 || 0) + 1);
    if (p.alive) prof.survivedGames += 1;
    prof.teamStats[teamKey].played += 1;

    if (isDraw) {
      const gainedXp = Math.round(15 * xpMult);
      const gainedCoins = Math.round(8 * coinMult);
      prof.xp += gainedXp;
      prof.coins += gainedCoins;
      prof.dailyStats.xp += gainedXp;
    } else if (isWin) {
      const baseAuth = (p.alive || isJesterPersonalWin) ? 4 : 3;
      const gainedAuth = room.isRanked ? Math.round(baseAuth * 1.5) : baseAuth;
      const gainedXp = Math.round(25 * xpMult);
      const gainedCoins = Math.round(15 * coinMult);
      prof.wins += 1;
      prof.winStreak += 1;
      if (prof.winStreak > prof.bestWinStreak) prof.bestWinStreak = prof.winStreak;
      prof.teamStats[teamKey].wins += 1;
      if (teamKey === 'town') prof.dailyStats.quests.win_town = 1;
      prof.xp += gainedXp;
      prof.coins += gainedCoins;
      prof.authority += gainedAuth;
      prof.dailyStats.authority += gainedAuth;
      prof.dailyStats.wins += 1;
      prof.dailyStats.xp += gainedXp;

      if (playerFam) {
        playerFam.ratingPoints = (playerFam.ratingPoints || 0) + 10;
        playerFam.weeklyPoints = (playerFam.weeklyPoints || 0) + 10;
        ensureFamilyFields(playerFam);
      }
    } else {
      const gainedXp = Math.round(10 * xpMult);
      const gainedCoins = Math.round(5 * coinMult);
      prof.losses += 1;
      prof.winStreak = 0;
      prof.xp += gainedXp;
      prof.coins += gainedCoins;
      prof.authority = Math.max(0, (prof.authority || 0) - 2);
      prof.dailyStats.xp += gainedXp;
    }

    prof.level = getLevelInfo(prof.xp).level;
    prof.matchHistory.unshift({
      roomName: room.name,
      role: getPlayerRoleDeathLabel(p),
      result: isDraw ? 'Нічия' : (isWin ? 'Перемога' : 'Поразка'),
      date: new Date().toLocaleDateString('uk-UA')
    });
    if (prof.matchHistory.length > 20) prof.matchHistory.pop();

    const safeP = { ...prof };
    delete safeP.passwordHash;
    delete safeP.bratikSecretCode;
    emitToUser(p.nickname, 'profileUpdated', { player: safeP, badgeType: getBadgeType(prof, todaySet, allTimeSet), levelInfo: getLevelInfo(prof.xp) });
    if (playerFam) emitToUser(p.nickname, 'familyUpdated', buildEnrichedFamily(playerFam));
  });

  saveDB();
  const winBanner = winner === 'draw' ? '🤝 ГРУ ЗАВЕРШЕНО! Бойова нічия!' : `🏆 ГРУ ЗАВЕРШЕНО! Перемогли: ${winner.toUpperCase()}!`;
  pushRoomNews(room, winBanner);
  if (afkPlayers.length > 0) {
    const afkNames = afkPlayers.map(a => `${a.nickname}${a.leftEarly ? ' (вийшов достроково)' : ' (без жодного ходу)'}`).join(', ');
    pushRoomNews(room, `⚠️ Неактивні / вийшли достроково: ${afkNames}. Ви можете подати скаргу або зняти 3 карми!`);
  }
  broadcastRoomState(room);
  io.to(room.id).emit('matchEndedAfkList', { roomId: room.id, afkPlayers, winner });
  io.emit('roomsUpdated', getPublicRoomsList());
  if (!hasActiveHumansInRoom(room)) {
    scheduleEmptyRoomCleanup(room.id);
  }

  // Автоматично видаляємо завершену кімнату з пам'яті через 90 сек (час на перегляд підсумків та скарг на AFK)
  setTimeout(() => {
    if (rooms[room.id] && rooms[room.id].status === 'ended') {
      cancelEmptyRoomCleanup(room.id);
      delete rooms[room.id];
      io.emit('roomsUpdated', getPublicRoomsList());
    }
  }, 90 * 1000);
}
function completePlayerLogin(socket, player) {
  if (!player) return;
  const isAdminNick = player.nickname.toLowerCase() === ADMIN_NICK.toLowerCase();
  if (player.banned) {
    const reasonTxt = player.banReason ? ` Причина: ${player.banReason}` : '';
    return socket.emit('authError', `🚫 Цей акаунт заблоковано назавжди.${reasonTxt}`);
  }
  if (player.bannedUntil && player.bannedUntil > Date.now()) {
    const untilStr = new Date(player.bannedUntil).toLocaleString('uk-UA');
    const reasonTxt = player.banReason ? ` Причина: ${player.banReason}` : '';
    return socket.emit('authError', `⏳ Акаунт тимчасово заблоковано до ${untilStr}.${reasonTxt}`);
  }
  if (isAdminNick) player.staffRole = 'admin';

  ensurePlayerFields(player);
  saveDB();

  socket.nickname = player.nickname;
  socket.isGuest = false;
  socket.isAdmin = isAdminNick || player.staffRole === 'admin' || player.staffRole === 'bratik';
  socket.staffRole = isAdminNick ? 'admin' : (player.staffRole || 'player');
  socket.join('user:' + player.nickname.toLowerCase());
  refreshOnlineUserEntry(player.nickname.toLowerCase());

  const todaySet = getTodayTop100Set();
  const allTimeSet = getAllTimeTop100Set();
  const safePlayer = { ...player };
  delete safePlayer.passwordHash;
  delete safePlayer.bratikSecretCode;
  const famObj = (player.familyId && db.families[player.familyId]) ? buildEnrichedFamily(db.families[player.familyId]) : null;
  const unreadIdeasCount = socket.isAdmin ? (db.playerIdeas || []).filter(i => !i.read).length : 0;

  socket.emit('loginSuccess', {
    player: safePlayer,
    badgeType: getBadgeType(player, todaySet, allTimeSet),
    levelInfo: getLevelInfo(player.xp),
    isAdmin: socket.isAdmin,
    staffRole: socket.staffRole,
    rolesConfig: ROLES,
    botCatalog: BOT_CATALOG,
    shopItems: SHOP_ITEMS,
    devPosts: db.devPosts,
    globalChat: db.globalChat.slice(-50),
    friendsData: buildFriendsPayload(player),
    friendRequests: player.friendRequests,
    familyData: famObj,
    unreadIdeasCount,
    appVersion: APP_VERSION,
    releaseNotes: CURRENT_RELEASE_NOTES
  });

  if (player.staffRole === 'bratik' && (!player.bratikSecretCode || player.bratikCodeRequired)) {
    socket.emit('promptBratikCodeSetup', { nickname: player.nickname });
  }

  const activeMatch = getActiveAliveMatchForPlayer(player.nickname);
  const activeLobby = !activeMatch
    ? Object.values(rooms).find(r => r.status === 'waiting' && r.players.some(p => p.nickname && p.nickname.toLowerCase() === player.nickname.toLowerCase()))
    : null;
  const rejoinTarget = activeMatch || activeLobby;
  if (rejoinTarget) {
    cancelPlayerDisconnectTimer(player.nickname);
    const rp = rejoinTarget.players.find(p => p.nickname && p.nickname.toLowerCase() === player.nickname.toLowerCase());
    if (rp) rp.leftRoom = false;
    cancelEmptyRoomCleanup(rejoinTarget.id);
    socket.join(rejoinTarget.id);
    socket.currentRoomId = rejoinTarget.id;
    socket.emit('joinedRoom', sanitizeRoomForPlayer(rejoinTarget, player.nickname, true));
    broadcastRoomState(rejoinTarget);
  }
}

io.on('connection', (socket) => {
  socket.use(([event, ...args], next) => {
    if (!checkRateLimit(socket, event, 30, 3000)) {
      return next(new Error('Rate limit exceeded'));
    }
    try {
      const first = args[0];
      const maxLen = event === 'reportPlayer' ? 600000 : 80000;
      if (first !== undefined && JSON.stringify(first).length > maxLen) {
        logSuspicious(socket, 'OVERSIZE_PAYLOAD', `Подія ${event} перевищила ліміт розміру`);
        return next(new Error('Payload too large'));
      }
    } catch (e) {}
    next();
  });

  socket.emit('roomsUpdated', getPublicRoomsList());
  socket.emit('minigameRecordsData', db.minigameRecords || { runner: [], memory: [], whack: [], mafia_jump: [], cannon: [], snake: [], tetris: [] });

  socket.on('authUser', ({ nickname, password, avatar, bio, gender, devCode, isRegister, isAutoLogin, refCode }) => {
    const rawTrimNick = (nickname || '').trim();
    const cleanNick = escapeHTML(rawTrimNick).slice(0, isRegister ? 10 : 20);
    const rawPass = String(password || '').trim();

    if (!cleanNick || cleanNick.length < 2) return socket.emit('authError', 'Нікнейм має містити щонайменше 2 символи!');
    if (isRegister && rawTrimNick.length > 10) return socket.emit('authError', 'Нікнейм може містити максимум 10 символів!');
    if (!rawPass || rawPass.length < (isRegister ? 6 : 4)) {
      return socket.emit('authError', isRegister ? 'Пароль має містити щонайменше 6 символів!' : 'Пароль має містити щонайменше 4 символи!');
    }

    const isAdminNick = cleanNick.toLowerCase() === ADMIN_NICK.toLowerCase();
    if (isAdminNick && devCode !== DEV_SECRET_CODE) return socket.emit('authError', 'Невірний секретний код розробника!');

    const existingPlayer = findPlayerRecord(cleanNick);
    const validAvatar = avatar && (avatar.startsWith('SLOT:') || avatar.startsWith('data:image')) ? avatar : 'SLOT:1';
    const validGender = ['male', 'female', 'other'].includes(gender) ? gender : 'other';

    if (isRegister) {
      if (existingPlayer) return socket.emit('authError', 'Цей нікнейм вже зайнятий!');
      const totalPlayers = Object.keys(db.players).length;
      let startCoins = 250;
      const startInv = [];

      const inviter = refCode ? findPlayerRecord(refCode) : null;
      if (inviter) {
        startCoins = 500;
        startInv.push('stickers_starter');
        ensurePlayerFields(inviter);
        inviter.referralsCount += 1;
        if (inviter.referralsCount === 1) {
          inviter.coins += 500;
          if (!inviter.inventory.includes('stickers_starter')) inviter.inventory.push('stickers_starter');
        } else if (inviter.referralsCount === 3) {
          if (!inviter.inventory.includes('frame_gold')) inviter.inventory.push('frame_gold');
          inviter.vipUntil = Math.max(Date.now(), inviter.vipUntil) + 3 * 24 * 3600 * 1000;
        } else if (inviter.referralsCount === 5) {
          inviter.title = 'Хрещений батько';
          if (!inviter.inventory.includes('fx_bullet')) inviter.inventory.push('fx_bullet');
        }
      }

      db.players[cleanNick] = {
        nickname: cleanNick,
        passwordHash: hashPassword(rawPass),
        recoveryCode: generateRecoveryCode(),
        avatar: validAvatar,
        bio: escapeHTML((bio || '').trim()).slice(0, 120) || 'Новий гравець Mafia Club: Online',
        gender: validGender,
        xp: 0,
        level: 1,
        authority: 10,
        coins: startCoins,
        diamonds: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        isFirstHundred: totalPlayers < 100,
        showBadge: true,
        banned: false,
        seenWelcome: false,
        matchHistory: [],
        friends: [],
        friendRequests: [],
        inventory: startInv,
        equippedFrame: '',
        equippedDeathFx: 'default',
        doubleXpGames: 0,
        referralsCount: 0,
        referredBy: inviter ? inviter.nickname : null
      };
      db.dailyRegistrations.push(Date.now());
      saveDB();
    } else {
      if (!existingPlayer) return socket.emit('authError', 'Акаунт не знайдено!');
      if (!existingPlayer.passwordHash) {
        existingPlayer.passwordHash = hashPassword(rawPass);
        saveDB();
      } else if (existingPlayer.passwordHash !== hashPassword(rawPass)) {
        return socket.emit('authError', isAutoLogin ? 'Сесія застаріла. Введіть пароль ще раз.' : 'Невірний пароль!');
      }
      if (existingPlayer.staffRole === 'bratik' && existingPlayer.bratikSecretCode) {
        if (!devCode) {
          return socket.emit('needDevCodePrompt', { isBratik: true });
        }
        if (devCode !== existingPlayer.bratikSecretCode) {
          return socket.emit('authError', 'Невірний особистий секретний код Братіка!');
        }
      }
    }

    const player = findPlayerRecord(cleanNick);
    completePlayerLogin(socket, player);
  });

  socket.on('authEmail', ({ email, password, isRegister }) => {
    const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 80);
    const rawPass = String(password || '').trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return socket.emit('authError', 'Введіть коректний E-mail!');
    }
    if (!rawPass || rawPass.length < (isRegister ? 6 : 4)) {
      return socket.emit('authError', isRegister ? 'Пароль має містити щонайменше 6 символів!' : 'Пароль має містити щонайменше 4 символи!');
    }

    const existing = Object.values(db.players).find(p => p.email && p.email.toLowerCase() === cleanEmail);
    if (isRegister) {
      if (existing) return socket.emit('authError', 'Акаунт з таким E-mail вже існує! Увійдіть.');
      let baseNick = escapeHTML(cleanEmail.split('@')[0].replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9_]/g, '')).slice(0, 10) || 'Player';
      if (baseNick.length < 2) baseNick = 'Player' + Math.floor(10 + Math.random() * 89);
      let finalNick = baseNick;
      while (findPlayerRecord(finalNick)) {
        finalNick = baseNick.slice(0, 7) + '_' + Math.floor(10 + Math.random() * 89);
      }
      const totalPlayers = Object.keys(db.players).length;
      db.players[finalNick] = {
        nickname: finalNick,
        email: cleanEmail,
        passwordHash: hashPassword(rawPass),
        recoveryCode: generateRecoveryCode(),
        avatar: 'SLOT:' + ((Math.floor(Math.random() * 19)) + 1),
        bio: 'Увійшов через E-mail • Mafia Club: Online',
        gender: 'other',
        xp: 0,
        level: 1,
        authority: 10,
        coins: 250,
        diamonds: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        isFirstHundred: totalPlayers < 100,
        showBadge: true,
        banned: false,
        seenWelcome: false,
        matchHistory: [],
        friends: [],
        friendRequests: [],
        inventory: [],
        equippedFrame: '',
        equippedDeathFx: 'default',
        doubleXpGames: 0,
        referralsCount: 0
      };
      db.dailyRegistrations.push(Date.now());
      saveDB();
      return completePlayerLogin(socket, db.players[finalNick]);
    } else {
      if (!existing) return socket.emit('authError', 'Акаунт з таким E-mail не знайдено!');
      if (existing.passwordHash !== hashPassword(rawPass)) return socket.emit('authError', 'Невірний пароль!');
      return completePlayerLogin(socket, existing);
    }
  });

  socket.on('authGoogle', async ({ idToken }) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    if (!clientId) {
      return socket.emit('authError', 'Google-вхід ще не налаштований на сервері (потрібен GOOGLE_CLIENT_ID). Використайте вкладку E-mail або Вхід.');
    }
    if (!idToken || typeof idToken !== 'string') {
      return socket.emit('authError', 'Некоректний токен Google.');
    }
    try {
      const { OAuth2Client } = require('google-auth-library');
      const gClient = new OAuth2Client(clientId);
      const ticket = await gClient.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) return socket.emit('authError', 'Не вдалося отримати дані Google-профілю.');
      const email = payload.email.toLowerCase();
      let player = Object.values(db.players).find(p => (p.googleSub && p.googleSub === payload.sub) || (p.email && p.email.toLowerCase() === email));
      if (!player) {
        let baseNick = escapeHTML(String(payload.given_name || payload.name || email.split('@')[0]).replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9_]/g, '')).slice(0, 10) || 'Player';
        if (baseNick.length < 2) baseNick = 'Player' + Math.floor(10 + Math.random() * 89);
        let finalNick = baseNick;
        while (findPlayerRecord(finalNick)) {
          finalNick = baseNick.slice(0, 7) + '_' + Math.floor(10 + Math.random() * 89);
        }
        const totalPlayers = Object.keys(db.players).length;
        db.players[finalNick] = {
          nickname: finalNick,
          email,
          googleSub: payload.sub,
          passwordHash: hashPassword(crypto.randomBytes(16).toString('hex')),
          recoveryCode: generateRecoveryCode(),
          avatar: 'SLOT:' + ((Math.floor(Math.random() * 19)) + 1),
          bio: 'Увійшов через Google • Mafia Club: Online',
          gender: 'other',
          xp: 0,
          level: 1,
          authority: 10,
          coins: 250,
          diamonds: 0,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          isFirstHundred: totalPlayers < 100,
          showBadge: true,
          banned: false,
          seenWelcome: false,
          matchHistory: [],
          friends: [],
          friendRequests: [],
          inventory: [],
          equippedFrame: '',
          equippedDeathFx: 'default',
          doubleXpGames: 0,
          referralsCount: 0
        };
        db.dailyRegistrations.push(Date.now());
        saveDB();
        player = db.players[finalNick];
      } else {
        player.googleSub = payload.sub;
        saveDB();
      }
      return completePlayerLogin(socket, player);
    } catch (e) {
      return socket.emit('authError', 'Помилка перевірки Google-акаунта: ' + (e.message || 'недійсний токен'));
    }
  });

  socket.on('markWelcomeSeen', () => {
    const p = findPlayerRecord(socket.nickname);
    if (p && !p.seenWelcome) {
      p.seenWelcome = true;
      saveDB();
    }
  });

  socket.on('resetPasswordWithCode', ({ identifier, recoveryCode, newPassword }) => {
    const rawId = String(identifier || '').trim().toLowerCase();
    const rawCode = String(recoveryCode || '').trim();
    const rawPass = String(newPassword || '').trim();
    if (!rawId || !rawCode) return socket.emit('passwordResetResult', { ok: false, msg: 'Вкажіть нікнейм/E-mail та код відновлення!' });
    if (rawPass.length < 6) return socket.emit('passwordResetResult', { ok: false, msg: 'Новий пароль має містити щонайменше 6 символів!' });

    const player = Object.values(db.players || {}).find(p =>
      p && ((p.nickname && p.nickname.toLowerCase() === rawId) || (p.email && p.email.toLowerCase() === rawId))
    );
    if (!player) return socket.emit('passwordResetResult', { ok: false, msg: 'Акаунт не знайдено!' });
    if (player.nickname.toLowerCase() === ADMIN_NICK.toLowerCase()) {
      return socket.emit('passwordResetResult', { ok: false, msg: 'Адмін-пароль змінюється через змінні середовища сервера.' });
    }
    ensurePlayerFields(player);
    const codeMatch = rawCode.toUpperCase() === String(player.recoveryCode || '').toUpperCase();
    const emailMatch = player.email && rawCode.toLowerCase() === player.email.toLowerCase();
    if (!codeMatch && !emailMatch) {
      return socket.emit('passwordResetResult', { ok: false, msg: 'Невірний код відновлення або E-mail!' });
    }
    player.passwordHash = hashPassword(rawPass);
    player.recoveryCode = generateRecoveryCode();
    saveDB();
    socket.emit('passwordResetResult', { ok: true, msg: '✅ Пароль успішно змінено! Увійдіть із новим паролем.' });
  });

  socket.on('requestPasswordResetAdmin', ({ nickname, newPassword, note }) => {
    const rawNick = String(nickname || '').trim();
    const rawPass = String(newPassword || '').trim();
    if (!rawNick) return socket.emit('passwordResetResult', { ok: false, msg: 'Введіть ваш нікнейм!' });
    if (rawPass.length < 6) return socket.emit('passwordResetResult', { ok: false, msg: 'Бажаний новий пароль має містити щонайменше 6 символів!' });
    const player = findPlayerRecord(rawNick);
    if (!player) return socket.emit('passwordResetResult', { ok: false, msg: 'Гравця з таким нікнеймом не знайдено!' });
    if (player.nickname.toLowerCase() === ADMIN_NICK.toLowerCase()) {
      return socket.emit('passwordResetResult', { ok: false, msg: 'Недоступно для акаунта розробника.' });
    }
    if (!Array.isArray(db.passwordResetRequests)) db.passwordResetRequests = [];
    const reqObj = {
      id: 'pwr_' + Date.now(),
      nickname: player.nickname,
      newPasswordHash: hashPassword(rawPass),
      note: escapeHTML(String(note || '').trim()).slice(0, 120),
      time: new Date().toLocaleString('uk-UA')
    };
    db.passwordResetRequests = db.passwordResetRequests.filter(r => r.nickname.toLowerCase() !== player.nickname.toLowerCase());
    db.passwordResetRequests.unshift(reqObj);
    if (db.passwordResetRequests.length > 40) db.passwordResetRequests.pop();
    saveDB();
    Object.values(db.players || {}).forEach(p => {
      if (p && (p.nickname.toLowerCase() === ADMIN_NICK.toLowerCase() || p.staffRole === 'admin' || p.staffRole === 'bratik')) {
        emitToUser(p.nickname, 'adminPasswordResetAlert', reqObj);
      }
    });
    socket.emit('passwordResetResult', { ok: true, msg: '📩 Запит передано адміністратору/Братіку! Після підтвердження новий пароль запрацює.' });
  });

  socket.on('setBratikSecretCode', ({ secretCode }) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || player.staffRole !== 'bratik') return;
    const clean = String(secretCode || '').trim();
    if (clean.length < 3 || clean.length > 16) {
      return socket.emit('bratikCodeFeedback', { ok: false, msg: 'Код має містити від 3 до 16 символів!' });
    }
    player.bratikSecretCode = clean;
    player.bratikCodeRequired = false;
    saveDB();
    socket.emit('bratikCodeFeedback', { ok: true, msg: '🔐 Особистий секретний код Братіка збережено! Надалі вводьте його при вході.' });
  });

  socket.on('submitPlayerIdea', (text) => {
    const clean = escapeHTML(String(text || '').trim()).slice(0, 400);
    if (!clean || clean.length < 3) return socket.emit('ideaFeedback', '⚠️ Напишіть хоча б кілька слів!');
    if (!db.playerIdeas) db.playerIdeas = [];
    const ideaObj = {
      id: 'idea_' + Date.now(),
      author: socket.nickname || 'Гість',
      text: clean,
      read: false,
      time: new Date().toLocaleString('uk-UA')
    };
    db.playerIdeas.unshift(ideaObj);
    if (db.playerIdeas.length > 100) db.playerIdeas.pop();
    saveDB();
    const unreadCount = db.playerIdeas.filter(i => !i.read).length;
    Object.values(db.players || {}).forEach(p => {
      if (p && (p.nickname.toLowerCase() === ADMIN_NICK.toLowerCase() || p.staffRole === 'admin' || p.staffRole === 'bratik')) {
        emitToUser(p.nickname, 'newPlayerIdeaAlert', { ...ideaObj, unreadCount });
      }
    });
    socket.emit('ideaFeedback', '✅ Дякуємо! Вашу ідею та відгук передано розробнику!');
  });

  socket.on('authGuest', ({ nickname }) => {
    const baseNick = escapeHTML((nickname || '').trim()).slice(0, 10) || ('Гравець' + Math.floor(100 + Math.random() * 899));
    const guestNick = 'Гість_' + baseNick;
    socket.nickname = guestNick;
    socket.isGuest = true;
    socket.isAdmin = false;
    socket.staffRole = 'guest';
    socket.join('user:' + guestNick.toLowerCase());
    refreshOnlineUserEntry(guestNick.toLowerCase());

    socket.emit('loginSuccess', {
      player: {
        nickname: guestNick,
        isGuest: true,
        avatar: 'SLOT:1',
        bio: 'Гостьовий профіль',
        gender: 'other',
        level: 1,
        xp: 0,
        authority: 10,
        coins: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        karma: 100,
        showBadge: false,
        friends: [],
        inventory: [],
        teamStats: { town: { played: 0, wins: 0 }, mafia: { played: 0, wins: 0 }, cult: { played: 0, wins: 0 }, neutral: { played: 0, wins: 0 } },
        roleStats: {}
      },
      badgeType: null,
      levelInfo: getLevelInfo(0),
      isAdmin: false,
      staffRole: 'guest',
      rolesConfig: ROLES,
      botCatalog: BOT_CATALOG,
      shopItems: SHOP_ITEMS,
      devPosts: db.devPosts,
      globalChat: db.globalChat.slice(-50),
      friendsData: [],
      friendRequests: [],
      familyData: null,
      appVersion: APP_VERSION,
      releaseNotes: CURRENT_RELEASE_NOTES
    });
  });

  // === ПОШУК ГРАВЦІВ, ДРУЗІ, ВИДАЛЕННЯ З ДРУЗІВ ТА ПРИВАТНИЙ ЧАТ ===
  socket.on('searchPlayers', (query) => {
    if (!socket.nickname) return;
    const q = String(query || '').trim().toLowerCase();
    if (!q) {
      return socket.emit('searchPlayersResult', []);
    }
    const todaySet = getTodayTop100Set();
    const allTimeSet = getAllTimeTop100Set();
    const me = findPlayerRecord(socket.nickname);
    const myFriendsLower = new Set(me ? (me.friends || []).map(n => n.toLowerCase()) : []);

    const results = Object.values(db.players)
      .filter(p => !p.banned && p.nickname.toLowerCase() !== socket.nickname.toLowerCase())
      .filter(p => p.nickname.toLowerCase().includes(q))
      .map(p => {
        ensurePlayerFields(p);
        return {
          nickname: p.nickname,
          avatar: p.avatar,
          equippedFrame: p.equippedFrame || '',
          avatarBorderColor: p.avatarBorderColor || '#f4a261',
          gender: p.gender,
          level: p.level,
          authority: p.authority || 0,
          karma: p.karma ?? 100,
          online: isUserOnline(p.nickname),
          badgeType: getBadgeType(p, todaySet, allTimeSet),
          isFriend: myFriendsLower.has(p.nickname.toLowerCase()),
          requestSent: (p.friendRequests || []).some(n => n.toLowerCase() === socket.nickname.toLowerCase())
        };
      })
      .sort((a, b) => (Number(b.online) - Number(a.online)) || (b.authority - a.authority))
      .slice(0, 25);

    socket.emit('searchPlayersResult', results);
  });

  socket.on('getPlayerProfile', (targetNick) => {
    const p = findPlayerRecord(targetNick);
    if (!p) {
      return socket.emit('publicProfileData', {
        nickname: String(targetNick || 'Гість'),
        avatar: 'SLOT:1',
        equippedFrame: '',
        avatarBorderColor: '#f4a261',
        gender: 'other',
        bio: 'Гостьовий профіль (ще не зареєстрований)',
        level: 1,
        authority: 10,
        gamesPlayed: 0,
        wins: 0,
        karma: 100,
        title: 'Гість',
        familyName: '',
        badgeType: null,
        isFriend: false,
        isGuest: true
      });
    }
    ensurePlayerFields(p);
    const todaySet = getTodayTop100Set();
    const allTimeSet = getAllTimeTop100Set();
    const me = findPlayerRecord(socket.nickname);
    const isFriend = me ? (me.friends || []).some(n => n.toLowerCase() === p.nickname.toLowerCase()) : false;

    socket.emit('publicProfileData', {
      nickname: p.nickname,
      avatar: p.avatar,
      equippedFrame: p.equippedFrame || '',
      avatarBorderColor: p.avatarBorderColor || '#f4a261',
      gender: p.gender,
      bio: p.bio,
      level: p.level,
      authority: p.authority,
      gamesPlayed: p.gamesPlayed,
      wins: p.wins,
      karma: p.karma,
      title: p.title || '',
      familyName: (p.familyId && db.families[p.familyId]) ? db.families[p.familyId].name : '',
      badgeType: getBadgeType(p, todaySet, allTimeSet),
      isFriend
    });
  });

  socket.on('sendFriendRequest', (targetNick) => {
    if (socket.isGuest) return socket.emit('friendFeedback', 'Гості не можуть додавати друзів. Створіть акаунт!');
    const me = findPlayerRecord(socket.nickname);
    const target = findPlayerRecord(targetNick);
    if (!me || !target || target.nickname.toLowerCase() === me.nickname.toLowerCase()) return;

    ensurePlayerFields(me);
    ensurePlayerFields(target);

    if (me.friends.some(n => n.toLowerCase() === target.nickname.toLowerCase())) {
      return socket.emit('friendFeedback', `Ви вже дружите з ${target.nickname}!`);
    }
    if (target.friendRequests.some(n => n.toLowerCase() === me.nickname.toLowerCase())) {
      return socket.emit('friendFeedback', `Заявку гравцю ${target.nickname} вже надіслано.`);
    }

    if (me.friendRequests.some(n => n.toLowerCase() === target.nickname.toLowerCase())) {
      me.friendRequests = me.friendRequests.filter(n => n.toLowerCase() !== target.nickname.toLowerCase());
      me.friends.push(target.nickname);
      target.friends.push(me.nickname);
      saveDB();
      emitToUser(me.nickname, 'friendsListUpdated', buildFriendsPayload(me));
      emitToUser(me.nickname, 'friendRequestsUpdated', me.friendRequests);
      emitToUser(target.nickname, 'friendsListUpdated', buildFriendsPayload(target));
      emitToUser(target.nickname, 'friendFeedback', `🤝 Ви та ${me.nickname} тепер друзі!`);
      return socket.emit('friendFeedback', `🤝 Ви та ${target.nickname} тепер друзі!`);
    }

    target.friendRequests.push(me.nickname);
    saveDB();
    emitToUser(target.nickname, 'friendRequestsUpdated', target.friendRequests);
    emitToUser(target.nickname, 'friendFeedback', `📩 Нова заявка в друзі від ${me.nickname}!`);
    socket.emit('friendFeedback', `📩 Заявку у друзі надіслано гравцю ${target.nickname}!`);
  });

  socket.on('respondFriendRequest', ({ fromNick, accept }) => {
    const me = findPlayerRecord(socket.nickname);
    if (!me) return;
    ensurePlayerFields(me);
    me.friendRequests = me.friendRequests.filter(n => n.toLowerCase() !== String(fromNick).toLowerCase());

    const sender = findPlayerRecord(fromNick);
    if (accept && sender) {
      ensurePlayerFields(sender);
      if (!me.friends.some(n => n.toLowerCase() === sender.nickname.toLowerCase())) me.friends.push(sender.nickname);
      if (!sender.friends.some(n => n.toLowerCase() === me.nickname.toLowerCase())) sender.friends.push(me.nickname);
      saveDB();
      emitToUser(sender.nickname, 'friendsListUpdated', buildFriendsPayload(sender));
      emitToUser(sender.nickname, 'friendFeedback', `🤝 ${me.nickname} прийняв вашу заявку у друзі!`);
      emitToUser(me.nickname, 'friendFeedback', `🤝 Ви тепер дружите з ${sender.nickname}!`);
    } else {
      saveDB();
    }
    emitToUser(me.nickname, 'friendsListUpdated', buildFriendsPayload(me));
    emitToUser(me.nickname, 'friendRequestsUpdated', me.friendRequests);
  });

  socket.on('removeFriend', (targetNick) => {
    const me = findPlayerRecord(socket.nickname);
    const target = findPlayerRecord(targetNick);
    if (!me || !target) return;
    ensurePlayerFields(me);
    ensurePlayerFields(target);

    me.friends = me.friends.filter(n => n.toLowerCase() !== target.nickname.toLowerCase());
    target.friends = target.friends.filter(n => n.toLowerCase() !== me.nickname.toLowerCase());
    saveDB();

    emitToUser(me.nickname, 'friendsListUpdated', buildFriendsPayload(me));
    socket.emit('friendFeedback', `Ви видалили ${target.nickname} зі списку друзів.`);
    emitToUser(target.nickname, 'friendsListUpdated', buildFriendsPayload(target));
  });

  socket.on('openPrivateChat', (friendNick) => {
    const me = findPlayerRecord(socket.nickname);
    if (!me) return socket.emit('errorMsg', 'Особистий чат доступний лише для зареєстрованих акаунтів. Увійдіть знову!');
    const target = findPlayerRecord(friendNick);
    const targetNick = target ? target.nickname : String(friendNick || '').trim();
    if (!targetNick) return;
    const key = getPrivateChatKey(me.nickname, targetNick);
    const msgs = db.privateChats[key] || [];
    msgs.forEach(m => { if (m.to && m.to.toLowerCase() === me.nickname.toLowerCase()) m.read = true; });
    saveDB();
    emitToUser(me.nickname, 'friendsListUpdated', buildFriendsPayload(me));
    socket.emit('privateChatHistory', { withNick: targetNick, messages: msgs.slice(-60) });
  });

  function emitProfileTo(targetSocket, player) {
    if (!player) return;
    const safeP = { ...player };
    delete safeP.passwordHash;
    delete safeP.bratikSecretCode;
    const payload = {
      player: safeP,
      badgeType: getBadgeType(player, getTodayTop100Set(), getAllTimeTop100Set()),
      levelInfo: getLevelInfo(player.xp)
    };
    if (targetSocket && targetSocket.emit) targetSocket.emit('profileUpdated', payload);
    if (player.nickname) emitToUser(player.nickname, 'profileUpdated', payload);
  }

  function broadcastFamilyUpdate(fam) {
    if (!fam) return;
    const enriched = buildEnrichedFamily(fam);
    (fam.members || []).forEach(mNick => {
      emitToUser(mNick, 'familyUpdated', enriched);
    });
  }

  socket.on('sendPrivateMsg', ({ toNick, text }) => {
    const me = findPlayerRecord(socket.nickname);
    if (!me) return socket.emit('errorMsg', 'Особисті повідомлення доступні лише для зареєстрованих акаунтів!');
    const target = findPlayerRecord(toNick);
    if (!target) return socket.emit('errorMsg', 'Отримувача не знайдено!');
    if (!text || !text.trim()) return;

    const cleanText = maskLinksOnly(escapeHTML(text.trim()).slice(0, 300));
    const key = getPrivateChatKey(me.nickname, target.nickname);
    if (!db.privateChats[key]) db.privateChats[key] = [];
    const msg = {
      from: me.nickname,
      to: target.nickname,
      text: cleanText,
      read: false,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
    db.privateChats[key].push(msg);
    if (db.privateChats[key].length > 100) db.privateChats[key].shift();
    saveDB();

    emitToUser(me.nickname, 'friendsListUpdated', buildFriendsPayload(me));
    emitToUser(me.nickname, 'newPrivateMsg', { withNick: target.nickname, msg });
    emitToUser(target.nickname, 'newPrivateMsg', { withNick: me.nickname, msg });
    emitToUser(target.nickname, 'friendsListUpdated', buildFriendsPayload(target));
  });

  // === КІМНАТИ (БЛОКУВАННЯ РЕЖИМУ ЛЕГЕНДА <100 ІГОР, ПРИВАТНІ, РАНГОВІ, СПОСТЕРІГАЧ, КАРМА) ===
  socket.on('createRoom', (data) => {
    if (!socket.nickname) return socket.emit('errorMsg', 'Будь ласка, увійдіть у свій профіль!');
    const player = findPlayerRecord(socket.nickname);
    const pBan = getPlayBanError(player);
    if (pBan) return socket.emit('errorMsg', pBan);
    const mode = data.mode === 'legend' ? 'legend' : 'classic';

    const hasLegendAccess = !!(socket.isAdmin || (player && (player.legendUnlocked || player.isTester || (player.gamesPlayed || 0) >= 100)));
    if (mode === 'legend' && !hasLegendAccess) {
      return socket.emit('errorMsg', '🔒 Режим «Легенда» відкривається після 100 зіграних партій!');
    }
    if (player && player.karma < 50 && Number(data.minAuthority) > 0) {
      return socket.emit('errorMsg', 'Через низьку карму (<50) ви можете створювати лише базові кімнати.');
    }

    const activeLock = getActiveAliveMatchForPlayer(socket.nickname);
    if (activeLock) return socket.emit('errorMsg', `⚠️ Ви ще живі у грі «${activeLock.name}»! Дочекайтеся завершення гри перед створенням нової.`);

    const roleCheck = RoleBalance.validateSelectedRoles(data.selectedRoles, ROLES, mode);
    if (!roleCheck.ok) {
      return socket.emit('errorMsg', roleCheck.error);
    }

    if (socket.currentRoomId) {
      detachSocketFromCurrentRoom(socket, { penalizeAlive: false });
    }

    const existingWaitingRoom = Object.values(rooms).find(r => r.creator && r.creator.toLowerCase() === socket.nickname.toLowerCase() && r.status === 'waiting');
    if (existingWaitingRoom) {
      if (existingWaitingRoom.timerInterval) clearInterval(existingWaitingRoom.timerInterval);
      if (existingWaitingRoom.lobbyCountdownInterval) clearInterval(existingWaitingRoom.lobbyCountdownInterval);
      cancelEmptyRoomCleanup(existingWaitingRoom.id);
      delete rooms[existingWaitingRoom.id];
    }

    const roomId = 'room_' + Math.floor(1000 + Math.random() * 9000);
    const minP = Math.max(5, Math.min(32, Number(data.minPlayers) || 5));
    const maxP = Math.max(minP, Math.min(mode === 'legend' ? 32 : 16, Number(data.maxPlayers) || 8));
    const minKarma = Math.max(0, Math.min(90, Number(data.minKarma) || 0));
    const selRoles = roleCheck.validRoles;

    const todaySet = getTodayTop100Set();
    const allTimeSet = getAllTimeTop100Set();
    rooms[roomId] = {
      id: roomId,
      creator: socket.nickname,
      name: escapeHTML((data.roomName || '').trim()).slice(0, 28) || `Стіл ${socket.nickname}`,
      mode,
      serverRegion: 'GLOBAL',
      minPlayers: minP,
      maxPlayers: maxP,
      minAuthority: Math.max(0, Number(data.minAuthority) || 0),
      minKarma,
      isPrivate: !!data.isPrivate,
      password: String(data.password || '').trim().slice(0, 20),
      isRanked: !!data.isRanked,
      selectedRoles: selRoles,
      status: 'waiting',
      phase: 'waiting',
      dayNumber: 0,
      timeLeft: 0,
      lobbyCountdown: null,
      newsLog: [],
      lobbyChat: [],
      gameTimeline: [],
      chat: [],
      nightActions: {},
      votes: {},
      tableGifts: {},
      players: [{
        nickname: socket.nickname,
        avatar: player ? player.avatar : 'SLOT:1',
        badgeType: player ? getBadgeType(player, todaySet, allTimeSet) : null,
        isCreator: true,
        isBot: false,
        isSpectator: false,
        alive: true,
        leftRoom: false,
        role: null,
        silenced: false,
        willSent: false,
        deathEffect: player ? player.equippedDeathFx : 'default',
        ip: socket.handshake.address
      }]
    };

    socket.join(roomId);
    socket.currentRoomId = roomId;
    socket.emit('joinedRoom', sanitizeRoomForPlayer(rooms[roomId], socket.nickname, true));
    io.emit('roomsUpdated', getPublicRoomsList());
  });

  socket.on('joinRoom', (payload) => {
    const roomId = typeof payload === 'object' ? payload.roomId : payload;
    const pass = typeof payload === 'object' ? (payload.password || '') : '';
    const asSpectator = typeof payload === 'object' ? !!payload.asSpectator : false;

    if (!socket.nickname) return socket.emit('errorMsg', 'Будь ласка, увійдіть у свій профіль!');
    const room = rooms[roomId];
    if (!room) return socket.emit('errorMsg', 'Кімнату не знайдено або її вже закрито.');

    const player = findPlayerRecord(socket.nickname);
    const pBan = getPlayBanError(player);
    if (pBan && !asSpectator) return socket.emit('errorMsg', pBan);

    const isCreator = !!(socket.nickname && room.creator && room.creator.trim().toLowerCase() === socket.nickname.trim().toLowerCase());
    const isAlreadyInside = !!(socket.nickname && room.players.some(p => p.nickname && p.nickname.trim().toLowerCase() === socket.nickname.trim().toLowerCase()));

    const sockIp = socket.handshake.address || '';
    const isLocalIp = ['::1', '127.0.0.1', '::ffff:127.0.0.1', ''].includes(sockIp);
    if (!isLocalIp && !isAlreadyInside && !asSpectator) {
      const sameIpP = room.players.find(p => p.ip && p.ip === sockIp && !p.isBot && p.nickname.toLowerCase() !== socket.nickname.toLowerCase());
      if (sameIpP) {
        logSuspicious(socket, 'MULTI_ACCOUNT_IP', `Спільний IP (${sockIp}) з гравцем ${sameIpP.nickname} у кімнаті «${room.name}»`);
      }
    }

    const activeLock = getActiveAliveMatchForPlayer(socket.nickname);
    if (activeLock && activeLock.id !== roomId) {
      return socket.emit('errorMsg', `⚠️ Ви ще живі у грі «${activeLock.name}»! Дочекайтеся завершення поточної гри.`);
    }

    const hasLegendAccess = !!(socket.isAdmin || (player && (player.legendUnlocked || player.isTester || (player.gamesPlayed || 0) >= 100)));
    if (!asSpectator && !isCreator && !isAlreadyInside) {
      if (room.status !== 'waiting') return socket.emit('errorMsg', 'Гра вже почалася! Ви можете зайти як спостерігач.');
      if (room.mode === 'legend' && !hasLegendAccess) {
        return socket.emit('errorMsg', '🔒 У кімнату режиму «Легенда» можна зайти лише від 100 зіграних ігор!');
      }
      if (room.players.filter(p => !p.isSpectator).length >= room.maxPlayers) return socket.emit('errorMsg', 'Кімната заповнена!');
      if (room.isPrivate && room.password && room.password !== pass) return socket.emit('errorMsg', 'Невірний пароль від приватної кімнати!');
      if (player && player.authority < room.minAuthority) return socket.emit('errorMsg', `Потрібен авторитет ${room.minAuthority}+!`);
      if (player && (player.karma ?? 100) < (room.minKarma || 0)) return socket.emit('errorMsg', `Потрібна карма ${room.minKarma}+ для входу в цю кімнату!`);
      if (player && player.karma < 50 && room.minAuthority > 0) return socket.emit('errorMsg', 'Низька карма (<50): доступні лише кімнати 1 рівня.');

      if (room.isRanked && player) {
        const hasFriendInside = room.players.some(p => (player.friends || []).some(f => f.toLowerCase() === p.nickname.toLowerCase()));
        const hasSameIp = room.players.some(p => p.ip && p.ip === socket.handshake.address && p.nickname !== socket.nickname);
        if (hasFriendInside || hasSameIp) {
          return socket.emit('errorMsg', 'Анти-тімінг: у рангову гру не можна заходити разом із друзями або з одного IP!');
        }
      }
    }

    if (socket.currentRoomId && socket.currentRoomId !== roomId) {
      detachSocketFromCurrentRoom(socket, { penalizeAlive: false });
    }

    cancelEmptyRoomCleanup(roomId);
    cancelPlayerDisconnectTimer(socket.nickname);
    const todaySet = getTodayTop100Set();
    const allTimeSet = getAllTimeTop100Set();
    const existingPlayer = room.players.find(p => p.nickname && p.nickname.trim().toLowerCase() === socket.nickname.trim().toLowerCase());
    if (!existingPlayer) {
      const forceSpec = asSpectator || room.status === 'playing';
      room.players.push({
        nickname: socket.nickname,
        avatar: player ? player.avatar : 'SLOT:1',
        badgeType: player ? getBadgeType(player, todaySet, allTimeSet) : null,
        isCreator: isCreator,
        isBot: false,
        isSpectator: forceSpec,
        alive: !forceSpec,
        leftRoom: false,
        role: null,
        silenced: false,
        willSent: false,
        deathEffect: player ? player.equippedDeathFx : 'default',
        ip: socket.handshake.address
      });
    } else {
      existingPlayer.leftRoom = false;
      if (isCreator) existingPlayer.isCreator = true;
    }

    socket.join(roomId);
    socket.currentRoomId = roomId;
    socket.emit('joinedRoom', sanitizeRoomForPlayer(room, socket.nickname, true));
    broadcastRoomState(room);
    io.emit('roomsUpdated', getPublicRoomsList());
    if (!asSpectator) checkLobbyCountdown(room);
  });

  socket.on('hireLobbyBots', ({ botIds }) => {
    const room = rooms[socket.currentRoomId];
    if (!room || room.status !== 'waiting') return socket.emit('hireBotsResult', { ok: false, msg: 'Ботів можна додавати лише у відкритому лобі до старту гри!' });
    const reqIds = Array.isArray(botIds) ? botIds : [];
    if (reqIds.length === 0) return socket.emit('hireBotsResult', { ok: false, msg: 'Оберіть хоча б одного бота!' });

    const player = findPlayerRecord(socket.nickname);
    const isFree = !!(socket.isAdmin || socket.staffRole === 'bratik' || (player && player.isTester));
    const curBotsCount = room.players.filter(p => p.isBot).length;
    const freeSlots = Math.min(16 - curBotsCount, room.maxPlayers - room.players.filter(p => !p.isSpectator).length);
    if (freeSlots <= 0) return socket.emit('hireBotsResult', { ok: false, msg: 'У кімнаті вже немає вільних місць або досягнуто ліміт 16 ботів!' });

    const usedNames = new Set(room.players.map(p => p.nickname.toLowerCase()));
    const candidates = reqIds
      .map(id => BOT_CATALOG.find(b => b.id === id))
      .filter(b => b && !usedNames.has(b.name.toLowerCase()))
      .slice(0, freeSlots);

    if (candidates.length === 0) return socket.emit('hireBotsResult', { ok: false, msg: 'Обрані боти вже перебувають у цьому лобі!' });

    const totalCost = isFree ? 0 : candidates.length * 25;
    if (totalCost > 0) {
      if (!player) return socket.emit('hireBotsResult', { ok: false, msg: 'Гості не можуть купувати ботів (потрібно 25 🪙 за бота).' });
      ensurePlayerFields(player);
      if ((player.coins || 0) < totalCost) {
        return socket.emit('hireBotsResult', { ok: false, msg: `Недостатньо монет! Потрібно ${totalCost} 🪙 (25 🪙 × ${candidates.length}), а у вас ${player.coins || 0} 🪙.` });
      }
      player.coins -= totalCost;
      saveDB();
      emitProfileTo(socket, player);
    }

    candidates.forEach(bot => {
      room.players.push({
        nickname: bot.name,
        avatar: bot.avatar,
        badgeType: null,
        isCreator: false,
        isBot: true,
        botStyle: bot.style,
        isSpectator: false,
        alive: true,
        leftRoom: false,
        role: null,
        silenced: false,
        willSent: false
      });
    });

    pushRoomNews(room, `🤖 ${socket.nickname} додав до столу ${candidates.length} бот(ів): ${candidates.map(b => b.name).join(', ')}.`);
    broadcastRoomState(room);
    io.emit('roomsUpdated', getPublicRoomsList());
    checkLobbyCountdown(room);
    socket.emit('hireBotsResult', {
      ok: true,
      msg: totalCost > 0
        ? `🤖 Додано ${candidates.length} бот(ів) за ${totalCost} 🪙!`
        : `🤖 Безкоштовно додано ${candidates.length} бот(ів)!`
    });
  });

  socket.on('penalizeAfkPlayer', ({ roomId, targetNick }) => {
    const room = rooms[roomId || socket.currentRoomId];
    if (!room || room.status !== 'ended' || !socket.nickname || !targetNick) return;
    const callerLower = socket.nickname.toLowerCase();
    const targetLower = String(targetNick).trim().toLowerCase();
    if (callerLower === targetLower) return;

    const wasCallerInRoom = (room.players || []).some(p => !p.isBot && p.nickname.toLowerCase() === callerLower);
    const isTargetAfk = (room.lastAfkPlayers || []).some(a => a.nickname.toLowerCase() === targetLower);
    if (!wasCallerInRoom || !isTargetAfk) return;

    if (!room.afkPenaltiesByVoter) room.afkPenaltiesByVoter = {};
    if (!Array.isArray(room.afkPenaltiesByVoter[callerLower])) room.afkPenaltiesByVoter[callerLower] = [];
    if (room.afkPenaltiesByVoter[callerLower].includes(targetLower)) {
      return socket.emit('afkPenaltyResult', { ok: false, targetNick, msg: `Ви вже зняли карму з ${targetNick} за цю гру.` });
    }
    room.afkPenaltiesByVoter[callerLower].push(targetLower);

    const targetAcc = findPlayerRecord(targetNick);
    if (targetAcc) {
      ensurePlayerFields(targetAcc);
      targetAcc.karma = Math.max(0, (targetAcc.karma ?? 100) - 3);
      saveDB();
      emitToUser(targetAcc.nickname, 'systemNews', `📉 Гравець ${socket.nickname} зняв вам -3 карми за достроковий вихід / неактивність у матчі «${room.name}».`);
      emitProfileTo(null, targetAcc);
    }
    socket.emit('afkPenaltyResult', { ok: true, targetNick, msg: `📉 З гравця ${targetNick} знято 3 карми за достроковий вихід!` });
  });

  socket.on('closeRoom', (roomIdToClose) => {
    const rId = roomIdToClose || socket.currentRoomId;
    const room = rId ? rooms[rId] : Object.values(rooms).find(r => r.creator && r.creator.toLowerCase() === (socket.nickname || '').toLowerCase() && r.status === 'waiting');
    if (room && (socket.isAdmin || (room.creator && room.creator.toLowerCase() === (socket.nickname || '').toLowerCase()))) {
      if (room.lobbyCountdownInterval) clearInterval(room.lobbyCountdownInterval);
      if (room.timerInterval) clearInterval(room.timerInterval);
      cancelEmptyRoomCleanup(room.id);
      delete rooms[room.id];
      io.to(room.id).emit('errorMsg', 'Кімнату закрито творцем.');
      io.emit('roomsUpdated', getPublicRoomsList());
      socket.emit('systemNews', 'Вашу кімнату успішно закрито.');
    }
  });

  socket.on('rejoinActiveRoom', () => {
    const player = findPlayerRecord(socket.nickname);
    const pBan = getPlayBanError(player);
    if (pBan) return socket.emit('errorMsg', pBan);
    const room = getActiveAliveMatchForPlayer(socket.nickname);
    if (!room) return;
    cancelPlayerDisconnectTimer(socket.nickname);
    const rp = room.players.find(p => p.nickname && p.nickname.toLowerCase() === socket.nickname.toLowerCase());
    if (rp) rp.leftRoom = false;
    cancelEmptyRoomCleanup(room.id);
    socket.join(room.id);
    socket.currentRoomId = room.id;
    socket.emit('joinedRoom', sanitizeRoomForPlayer(room, socket.nickname, true));
    broadcastRoomState(room);
  });

  socket.on('leaveRoom', () => {
    if (!socket.currentRoomId || !rooms[socket.currentRoomId]) {
      socket.currentRoomId = null;
      return;
    }
    detachSocketFromCurrentRoom(socket, { penalizeAlive: true });
    io.emit('roomsUpdated', getPublicRoomsList());
  });

  // === СІМ'Ї (КЛАНИ): ТЕГИ, РАНГИ, КАЗНА, ЧАТ, КВЕСТИ, РІВНІ ТА РЕЙТИНГ ===
  function buildSortedFamiliesList() {
    return Object.values(db.families || {})
      .map(f => {
        ensureFamilyFields(f);
        return {
          id: f.id,
          name: f.name,
          tag: f.tag,
          emblem: f.emblem,
          leader: f.leader,
          membersCount: (f.members || []).length,
          level: f.level,
          bonusPct: f.bonusPct,
          treasury: f.treasury,
          ratingPoints: f.ratingPoints || 0,
          weeklyPoints: f.weeklyPoints || 0
        };
      })
      .sort((a, b) => (b.ratingPoints - a.ratingPoints) || (b.weeklyPoints - a.weeklyPoints));
  }

  socket.on('createFamily', ({ name, emblem, tag }) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player) return socket.emit('familyFeedback', 'Гості не можуть створювати Сім\'ю!');
    ensurePlayerFields(player);
    if (player.familyId && db.families[player.familyId]) {
      return socket.emit('familyFeedback', '⚠️ Ви вже перебуваєте у Сім\'ї! Спочатку вийдіть із поточної.');
    }
    const usePass = !!player.freeFamilyCreate;
    if (!usePass && (player.coins || 0) < 1500) {
      return socket.emit('familyFeedback', `❌ Недостатньо монет! Потрібно 1 500 🪙, а у вас зараз ${player.coins || 0} 🪙.`);
    }
    const cleanName = escapeHTML(String(name || '').trim()).slice(0, 24);
    if (cleanName.length < 3) return socket.emit('familyFeedback', '⚠️ Назва Сім\'ї має містити мінімум 3 символи!');

    const rawTag = String(tag || '').replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9]/g, '').toUpperCase().slice(0, 4);
    const finalTag = rawTag.length >= 2 ? rawTag : (cleanName.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9]/g, '').toUpperCase().slice(0, 4) || 'FAM');

    if (usePass) player.freeFamilyCreate = false;
    else player.coins -= 1500;

    const famId = 'fam_' + Date.now();
    db.families[famId] = {
      id: famId,
      name: cleanName,
      tag: finalTag,
      emblem: escapeHTML(String(emblem || '⚜️').slice(0, 4)),
      leader: player.nickname,
      members: [player.nickname],
      ranks: { [player.nickname.toLowerCase()]: 'don' },
      treasury: 0,
      ratingPoints: 0,
      weeklyPoints: 0,
      chat: [{
        author: 'Система',
        rank: 'don',
        text: `⚜️ Сім'ю «${cleanName}» [${finalTag}] засновано! Грайте матчі, поповнюйте казну та підіймайте рівень Сім'ї.`,
        time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
      }],
      quests: { play_20: 0, wins_10: 0, claimed: [] }
    };
    ensureFamilyFields(db.families[famId]);
    player.familyId = famId;
    saveDB();

    emitProfileTo(socket, player);
    socket.emit('familyUpdated', buildEnrichedFamily(db.families[famId]));
    io.emit('familiesListData', buildSortedFamiliesList());
    socket.emit('familyFeedback', `🎉 Сім'ю «${cleanName}» [${finalTag}] успішно засновано!`);
  });

  socket.on('getFamiliesList', () => {
    const player = findPlayerRecord(socket.nickname);
    socket.emit('familiesListData', buildSortedFamiliesList());
    if (player && player.familyId && db.families[player.familyId]) {
      socket.emit('familyUpdated', buildEnrichedFamily(db.families[player.familyId]));
    }
  });

  socket.on('joinFamily', (famId) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player) return socket.emit('familyFeedback', 'Гості не можуть вступати у Сім\'ю!');
    if (player.familyId && db.families[player.familyId]) {
      return socket.emit('familyFeedback', '⚠️ Ви вже є учасником Сім\'ї! Ви не можете вступити в нову.');
    }
    const fam = db.families[famId];
    if (!fam) return socket.emit('familyFeedback', 'Сім\'ю не знайдено.');
    ensureFamilyFields(fam);
    if (fam.members.length >= 30) return socket.emit('familyFeedback', 'У цій Сім\'ї вже максимум гравців (30/30).');

    fam.members.push(player.nickname);
    fam.ranks[player.nickname.toLowerCase()] = 'recruit';
    const joinMsg = {
      author: 'Система',
      rank: 'recruit',
      text: `🤝 ${player.nickname} приєднався до Сім'ї!`,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
    fam.chat.push(joinMsg);
    if (fam.chat.length > 80) fam.chat.shift();
    player.familyId = famId;
    saveDB();
    const enrichedFam = buildEnrichedFamily(fam);
    (fam.members || []).forEach(mNick => {
      emitToUser(mNick, 'familyUpdated', enrichedFam);
      emitToUser(mNick, 'newFamilyMsg', joinMsg);
    });
    io.emit('familiesListData', buildSortedFamiliesList());
    socket.emit('familyFeedback', `🤝 Ви вступили до Сім'ї «${fam.name}» [${fam.tag}]!`);
  });

  socket.on('leaveFamily', () => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || !player.familyId) return;
    const fam = db.families[player.familyId];
    if (fam) {
      ensureFamilyFields(fam);
      fam.members = fam.members.filter(m => m.toLowerCase() !== player.nickname.toLowerCase());
      delete fam.ranks[player.nickname.toLowerCase()];
      if (fam.members.length === 0) {
        delete db.families[fam.id];
      } else {
        if (fam.leader.toLowerCase() === player.nickname.toLowerCase()) {
          const capo = fam.members.find(m => fam.ranks[m.toLowerCase()] === 'capo');
          fam.leader = capo || fam.members[0];
          fam.ranks[fam.leader.toLowerCase()] = 'don';
        }
        const enrichedFam = buildEnrichedFamily(fam);
        fam.members.forEach(mNick => emitToUser(mNick, 'familyUpdated', enrichedFam));
      }
    }
    player.familyId = null;
    saveDB();
    emitProfileTo(socket, player);
    emitToUser(player.nickname, 'familyUpdated', null);
    io.emit('familiesListData', buildSortedFamiliesList());
    socket.emit('familyFeedback', 'Ви вийшли зі складу Сім\'ї.');
  });

  socket.on('donateFamilyTreasury', (amountRaw) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || !player.familyId || !db.families[player.familyId]) return;
    ensurePlayerFields(player);
    const amount = Math.floor(Number(amountRaw) || 0);
    if (amount < 10 || amount > 5000) return socket.emit('familyFeedback', '⚠️ Вкажіть суму від 10 до 5000 🪙.');
    if ((player.coins || 0) < amount) return socket.emit('familyFeedback', '❌ Недостатньо монет для внеску!');

    const fam = db.families[player.familyId];
    ensureFamilyFields(fam);
    player.coins -= amount;
    fam.treasury += amount;
    const pts = Math.max(1, Math.floor(amount / 10));
    fam.ratingPoints += pts;
    fam.weeklyPoints = (fam.weeklyPoints || 0) + pts;
    ensureFamilyFields(fam);

    const sysMsg = {
      author: 'Казна',
      rank: fam.ranks[player.nickname.toLowerCase()] || 'recruit',
      text: `💰 ${player.nickname} вніс у казну ${amount} 🪙 (+${pts} рейтингу)! Рівень Сім'ї: ${fam.level} (+${fam.bonusPct}% XP/монет).`,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
    fam.chat.push(sysMsg);
    if (fam.chat.length > 80) fam.chat.shift();
    saveDB();

    emitProfileTo(socket, player);
    const enrichedFam = buildEnrichedFamily(fam);
    (fam.members || []).forEach(mNick => {
      emitToUser(mNick, 'familyUpdated', enrichedFam);
      emitToUser(mNick, 'newFamilyMsg', sysMsg);
    });
    io.emit('familiesListData', buildSortedFamiliesList());
    socket.emit('familyFeedback', `✅ Внесено ${amount} 🪙 у казну Сім'ї!`);
  });

  socket.on('sendFamilyMsg', (text) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || !player.familyId || !db.families[player.familyId] || !text || !text.trim()) return;
    if (player.mutedUntil && player.mutedUntil > Date.now()) {
      return socket.emit('familyFeedback', '🔇 Вам видано мут модератором!');
    }
    const fam = db.families[player.familyId];
    ensureFamilyFields(fam);
    const msg = {
      author: player.nickname,
      rank: fam.ranks[player.nickname.toLowerCase()] || 'recruit',
      badgeType: getBadgeType(player, getTodayTop100Set(), getAllTimeTop100Set()),
      text: maskLinksOnly(escapeHTML(text.trim()).slice(0, 260)),
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
    fam.chat.push(msg);
    if (fam.chat.length > 80) fam.chat.shift();
    saveDB();
    (fam.members || []).forEach(mNick => {
      emitToUser(mNick, 'newFamilyMsg', msg);
    });
  });

  socket.on('setFamilyRank', ({ targetNick, rank }) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || !player.familyId || !db.families[player.familyId]) return;
    const fam = db.families[player.familyId];
    ensureFamilyFields(fam);
    if (fam.leader.toLowerCase() !== player.nickname.toLowerCase()) {
      return socket.emit('familyFeedback', '❌ Лише Дон (лідер) може призначати ранги у Сім\'ї!');
    }
    if (!['capo', 'soldier', 'recruit'].includes(rank)) return;
    const targetLower = String(targetNick || '').toLowerCase();
    if (!targetLower || targetLower === fam.leader.toLowerCase()) return;
    if (!fam.members.some(m => m.toLowerCase() === targetLower)) return;

    fam.ranks[targetLower] = rank;
    saveDB();
    const enrichedFam = buildEnrichedFamily(fam);
    (fam.members || []).forEach(mNick => emitToUser(mNick, 'familyUpdated', enrichedFam));
    const labels = { capo: 'Капо', soldier: 'Солдат', recruit: 'Новачок' };
    socket.emit('familyFeedback', `✅ Гравцю ${targetNick} призначено ранг «${labels[rank]}».`);
  });

  socket.on('kickFamilyMember', (targetNick) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || !player.familyId || !db.families[player.familyId]) return;
    const fam = db.families[player.familyId];
    ensureFamilyFields(fam);
    const myRank = fam.ranks[player.nickname.toLowerCase()] || 'recruit';
    if (myRank !== 'don' && myRank !== 'capo') {
      return socket.emit('familyFeedback', '❌ Виганяти учасників можуть лише Дон або Капо!');
    }
    const targetLower = String(targetNick || '').toLowerCase();
    if (!targetLower || targetLower === fam.leader.toLowerCase() || targetLower === player.nickname.toLowerCase()) {
      return socket.emit('familyFeedback', '❌ Неможливо вигнати Дона або себе!');
    }
    const targetRank = fam.ranks[targetLower] || 'recruit';
    if (myRank === 'capo' && targetRank === 'capo') {
      return socket.emit('familyFeedback', '❌ Капо не може вигнати іншого Капо!');
    }

    fam.members = fam.members.filter(m => m.toLowerCase() !== targetLower);
    delete fam.ranks[targetLower];
    const tp = findPlayerRecord(targetNick);
    if (tp) tp.familyId = null;
    saveDB();

    emitToUser(targetNick, 'familyUpdated', null);
    emitToUser(targetNick, 'familyFeedback', `⚠️ Вас виключили зі складу Сім'ї «${fam.name}».`);
    const enrichedFam = buildEnrichedFamily(fam);
    (fam.members || []).forEach(mNick => emitToUser(mNick, 'familyUpdated', enrichedFam));
    io.emit('familiesListData', buildSortedFamiliesList());
    socket.emit('familyFeedback', `🚫 Гравця ${targetNick} виключено зі Сім'ї.`);
  });

  socket.on('claimFamilyQuest', (questId) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || !player.familyId || !db.families[player.familyId]) return;
    const fam = db.families[player.familyId];
    ensureFamilyFields(fam);
    const q = fam.quests;
    const defs = {
      play_20: { ok: (q.play_20 || 0) >= 20, treasury: 150, rating: 60, coinsEach: 35, label: 'Зіграти 20 ігор Сім\'єю' },
      wins_10: { ok: (q.wins_10 || 0) >= 10, treasury: 250, rating: 120, coinsEach: 60, label: 'Здобути 10 перемог Сім\'єю' }
    };
    const d = defs[questId];
    if (!d || !d.ok || q.claimed.includes(questId)) return;

    q.claimed.push(questId);
    fam.treasury += d.treasury;
    fam.ratingPoints += d.rating;
    fam.weeklyPoints = (fam.weeklyPoints || 0) + d.rating;
    ensureFamilyFields(fam);
    const todaySet = getTodayTop100Set();
    const allTimeSet = getAllTimeTop100Set();
    (fam.members || []).forEach(mNick => {
      const rec = findPlayerRecord(mNick);
      if (rec) {
        ensurePlayerFields(rec);
        rec.coins += d.coinsEach;
        const safeRec = { ...rec };
        delete safeRec.passwordHash;
        delete safeRec.bratikSecretCode;
        emitToUser(rec.nickname, 'profileUpdated', { player: safeRec, badgeType: getBadgeType(rec, todaySet, allTimeSet), levelInfo: getLevelInfo(rec.xp) });
      }
    });
    saveDB();
    const enrichedFam = buildEnrichedFamily(fam);
    (fam.members || []).forEach(mNick => emitToUser(mNick, 'familyUpdated', enrichedFam));
    io.emit('familiesListData', buildSortedFamiliesList());
    socket.emit('familyFeedback', `🏆 Квест «${d.label}» виконано! +${d.treasury} 🪙 в казну, +${d.rating} рейтингу та +${d.coinsEach} 🪙 кожному члену!`);
  });

  socket.on('familyCheckIn', () => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || !player.familyId || !db.families[player.familyId]) return;
    ensurePlayerFields(player);
    const fam = db.families[player.familyId];
    ensureFamilyFields(fam);
    pruneFamilyDailyMaps(fam);
    const today = getTodayDateString();
    if (!Array.isArray(fam.dailyCheckIns[today])) fam.dailyCheckIns[today] = [];
    const lowerNick = player.nickname.toLowerCase();
    if (fam.dailyCheckIns[today].includes(lowerNick)) {
      return socket.emit('familyFeedback', '✅ Ви вже відмітилися сьогодні у Сім\'ї!');
    }
    fam.dailyCheckIns[today].push(lowerNick);
    const barLvl = (fam.upgrades && fam.upgrades.bar) || 0;
    const personalCoins = 25 + ([0, 10, 20, 35][barLvl] || 0);
    const treasuryGain = 20;
    const ratingGain = 5;
    player.coins = (player.coins || 0) + personalCoins;
    fam.treasury += treasuryGain;
    fam.ratingPoints += ratingGain;
    fam.weeklyPoints = (fam.weeklyPoints || 0) + ratingGain;
    ensureFamilyFields(fam);

    const sysMsg = {
      author: 'Штаб Сім\'ї',
      rank: fam.ranks[lowerNick] || 'recruit',
      text: `📅 ${player.nickname} пройшов щоденну перекличку! +${personalCoins} 🪙 гравцю, +${treasuryGain} 🪙 у казну та +${ratingGain} ⭐.`,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
    fam.chat.push(sysMsg);
    if (fam.chat.length > 80) fam.chat.shift();
    saveDB();

    emitProfileTo(socket, player);
    const enrichedFam = buildEnrichedFamily(fam);
    (fam.members || []).forEach(mNick => {
      emitToUser(mNick, 'familyUpdated', enrichedFam);
      emitToUser(mNick, 'newFamilyMsg', sysMsg);
    });
    io.emit('familiesListData', buildSortedFamiliesList());
    socket.emit('familyFeedback', `✅ Перекличку зараховано! Ви отримали +${personalCoins} 🪙 та внесли +${treasuryGain} 🪙 у казну!`);
  });

  socket.on('runFamilyHeist', (tier) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || !player.familyId || !db.families[player.familyId]) return;
    ensurePlayerFields(player);
    const fam = db.families[player.familyId];
    ensureFamilyFields(fam);
    pruneFamilyDailyMaps(fam);
    const today = getTodayDateString();
    if (!fam.dailyHeists[today] || typeof fam.dailyHeists[today] !== 'object') fam.dailyHeists[today] = {};
    const lowerNick = player.nickname.toLowerCase();
    if (fam.dailyHeists[today][lowerNick]) {
      return socket.emit('familyFeedback', '⏳ Ваша щоденна сімейна справа на сьогодні вже виконана!');
    }

    const cleanTier = ['safe', 'medium', 'risky'].includes(tier) ? tier : 'safe';
    const vaultLvl = (fam.upgrades && fam.upgrades.vault) || 0;
    const mult = [1, 1.15, 1.3, 1.5][vaultLvl] || 1;
    let won = true;
    let personalCoins = 0;
    let treasuryCoins = 0;
    let ratingGain = 0;

    if (cleanTier === 'safe') {
      personalCoins = Math.round((30 + Math.floor(Math.random() * 26)) * mult);
      treasuryCoins = Math.round(30 * mult);
      ratingGain = 5;
    } else if (cleanTier === 'medium') {
      won = Math.random() < 0.75;
      if (won) {
        personalCoins = Math.round((60 + Math.floor(Math.random() * 51)) * mult);
        treasuryCoins = Math.round(60 * mult);
        ratingGain = 12;
      } else {
        personalCoins = 10;
        treasuryCoins = 0;
        ratingGain = 1;
      }
    } else {
      won = Math.random() < 0.5;
      if (won) {
        personalCoins = Math.round((130 + Math.floor(Math.random() * 91)) * mult);
        treasuryCoins = Math.round(120 * mult);
        ratingGain = 25;
      } else {
        personalCoins = 15;
        treasuryCoins = 0;
        ratingGain = 2;
      }
    }

    fam.dailyHeists[today][lowerNick] = { tier: cleanTier, won, personalCoins, treasuryCoins };
    player.coins = (player.coins || 0) + personalCoins;
    fam.treasury += treasuryCoins;
    fam.ratingPoints += ratingGain;
    fam.weeklyPoints = (fam.weeklyPoints || 0) + ratingGain;
    ensureFamilyFields(fam);

    const tierLabel = cleanTier === 'safe' ? 'Тихий збір' : (cleanTier === 'medium' ? 'Нічний рейд' : 'Пограбування банку');
    const resultMsg = won
      ? `🕶️ ${tierLabel} вдався! +${personalCoins} 🪙 вам, +${treasuryCoins} 🪙 в казну Сім'ї (+${ratingGain} ⭐)!`
      : `🚨 Патруль зірвав «${tierLabel}», але ви втекли з +${personalCoins} 🪙 (+${ratingGain} ⭐).`;

    const sysMsg = {
      author: 'Операція Сім\'ї',
      rank: fam.ranks[lowerNick] || 'recruit',
      text: won
        ? `💰 ${player.nickname} провів справу «${tierLabel}»: +${personalCoins} 🪙 собі та +${treasuryCoins} 🪙 у казну!`
        : `🚨 ${player.nickname} ледве вирвався із засідки під час «${tierLabel}» (+${personalCoins} 🪙).`,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
    fam.chat.push(sysMsg);
    if (fam.chat.length > 80) fam.chat.shift();
    saveDB();

    emitProfileTo(socket, player);
    socket.emit('familyHeistResult', { ok: won, tier: cleanTier, personalCoins, treasuryCoins, msg: resultMsg });
    const enrichedFam = buildEnrichedFamily(fam);
    (fam.members || []).forEach(mNick => {
      emitToUser(mNick, 'familyUpdated', enrichedFam);
      emitToUser(mNick, 'newFamilyMsg', sysMsg);
    });
    io.emit('familiesListData', buildSortedFamiliesList());
  });

  socket.on('buyFamilyUpgrade', (upgradeId) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || !player.familyId || !db.families[player.familyId]) return;
    const fam = db.families[player.familyId];
    ensureFamilyFields(fam);
    const lowerNick = player.nickname.toLowerCase();
    const myRank = fam.ranks[lowerNick] || 'recruit';
    if (myRank !== 'don' && myRank !== 'capo') {
      return socket.emit('familyFeedback', '❌ Покращення штабу за кошти казни можуть купувати лише Дон або Капо!');
    }
    const UPGRADE_COSTS = {
      vault: { name: '🏦 Сейф клану', costs: [200, 450, 800] },
      bar: { name: '🍸 Підпільний бар', costs: [250, 500, 900] },
      radio: { name: '📻 Радіомережа клану', costs: [300, 600, 1000] }
    };
    const cfg = UPGRADE_COSTS[upgradeId];
    if (!cfg) return;
    const curLvl = fam.upgrades[upgradeId] || 0;
    if (curLvl >= 3) return socket.emit('familyFeedback', `✅ ${cfg.name} вже покращено до максимального 3 рівня!`);
    const cost = cfg.costs[curLvl];
    if ((fam.treasury || 0) < cost) {
      return socket.emit('familyFeedback', `❌ Недостатньо монет у казні! Потрібно ${cost} 🪙 (зараз: ${fam.treasury || 0} 🪙).`);
    }

    fam.treasury -= cost;
    fam.upgrades[upgradeId] = curLvl + 1;
    fam.ratingPoints += 20;
    fam.weeklyPoints = (fam.weeklyPoints || 0) + 20;
    ensureFamilyFields(fam);

    const sysMsg = {
      author: 'Штаб Сім\'ї',
      rank: myRank,
      text: `🏗️ ${player.nickname} покращив ${cfg.name} до Рівня ${curLvl + 1}/3 за ${cost} 🪙 з казни!`,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
    fam.chat.push(sysMsg);
    if (fam.chat.length > 80) fam.chat.shift();
    saveDB();

    const enrichedFam = buildEnrichedFamily(fam);
    (fam.members || []).forEach(mNick => {
      emitToUser(mNick, 'familyUpdated', enrichedFam);
      emitToUser(mNick, 'newFamilyMsg', sysMsg);
    });
    io.emit('familiesListData', buildSortedFamiliesList());
    socket.emit('familyFeedback', `🎉 ${cfg.name} покращено до Рівня ${curLvl + 1}!`);
  });

  socket.on('setFamilyAnnouncement', (text) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || !player.familyId || !db.families[player.familyId]) return;
    const fam = db.families[player.familyId];
    ensureFamilyFields(fam);
    const lowerNick = player.nickname.toLowerCase();
    const myRank = fam.ranks[lowerNick] || 'recruit';
    if (myRank !== 'don' && myRank !== 'capo') {
      return socket.emit('familyFeedback', '❌ Закріплювати девіз чи наказ клану можуть лише Дон або Капо!');
    }
    fam.motto = maskLinksOnly(escapeHTML(String(text || '').trim()).slice(0, 160));
    saveDB();
    const enrichedFam = buildEnrichedFamily(fam);
    (fam.members || []).forEach(mNick => emitToUser(mNick, 'familyUpdated', enrichedFam));
    socket.emit('familyFeedback', fam.motto ? '📌 Оголошення Сім\'ї оновлено!' : '📌 Оголошення Сім\'ї очищено.');
  });

  socket.on('familyToast', () => {
    const player = findPlayerRecord(socket.nickname);
    if (!player || !player.familyId || !db.families[player.familyId]) return;
    const now = Date.now();
    if (socket.lastFamToastAt && now - socket.lastFamToastAt < 5 * 60 * 1000) {
      return socket.emit('familyFeedback', '⏳ Тост за Сім\'ю можна підіймати раз на 5 хвилин!');
    }
    socket.lastFamToastAt = now;
    const fam = db.families[player.familyId];
    ensureFamilyFields(fam);
    const toasts = [
      `🥂 ${player.nickname} підіймає келих за вірність і перемоги «${fam.name}»!`,
      `🥃 ${player.nickname} проголошує тост: «Нехай місто пам'ятає ім'я [${fam.tag}]!»`,
      `🎩 ${player.nickname} салютує капелюхом усій Сім'ї — разом до топу!`
    ];
    const msg = {
      author: 'Традиція',
      rank: fam.ranks[player.nickname.toLowerCase()] || 'recruit',
      text: toasts[Math.floor(Math.random() * toasts.length)],
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
    fam.chat.push(msg);
    if (fam.chat.length > 80) fam.chat.shift();
    saveDB();
    (fam.members || []).forEach(mNick => emitToUser(mNick, 'newFamilyMsg', msg));
    socket.emit('familyFeedback', '🥂 Тост надіслано у чат Сім\'ї!');
  });

  // === ПРОФІЛЬ, МАГАЗИН, ДЕЙЛІКИ, ПОДАРУНКИ ===
  socket.on('updateProfileData', ({ avatar, bio, gender, showBadge, newNickname, profanityFilter, customBadWords, email, avatarBorderColor }) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player) return;
    ensurePlayerFields(player);

    if (typeof avatarBorderColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(avatarBorderColor.trim())) {
      player.avatarBorderColor = avatarBorderColor.trim().toLowerCase();
    }

    if (typeof email === 'string') {
      const cleanEmail = email.trim().toLowerCase().slice(0, 80);
      if (!cleanEmail) player.email = '';
      else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) player.email = cleanEmail;
    }

    if (newNickname && !player.nickChanged) {
      const rawNew = String(newNickname).trim();
      const cleanNew = escapeHTML(rawNew).slice(0, 10);
      if (rawNew.length > 10) {
        socket.emit('systemNews', '⚠️ Нікнейм може містити максимум 10 символів!');
      } else if (cleanNew.length >= 2 && !findPlayerRecord(cleanNew)) {
        const oldNick = player.nickname;
        const oldLower = oldNick.toLowerCase();
        const newLower = cleanNew.toLowerCase();
        delete db.players[oldNick];
        player.nickname = cleanNew;
        player.nickChanged = true;
        db.players[cleanNew] = player;
        socket.leave('user:' + oldLower);
        socket.nickname = cleanNew;
        socket.join('user:' + newLower);
        refreshOnlineUserEntry(oldLower);
        refreshOnlineUserEntry(newLower);

        Object.values(db.players).forEach(other => {
          if (Array.isArray(other.friends)) {
            other.friends = other.friends.map(fn => fn.toLowerCase() === oldLower ? cleanNew : fn);
          }
          if (Array.isArray(other.friendRequests)) {
            other.friendRequests = other.friendRequests.map(rn => rn.toLowerCase() === oldLower ? cleanNew : rn);
          }
        });

        if (player.familyId && db.families && db.families[player.familyId]) {
          const fam = db.families[player.familyId];
          if (fam.leader && fam.leader.toLowerCase() === oldLower) fam.leader = cleanNew;
          if (Array.isArray(fam.members)) {
            fam.members = fam.members.map(mn => mn.toLowerCase() === oldLower ? cleanNew : mn);
          }
          if (fam.ranks && fam.ranks[oldLower]) {
            fam.ranks[newLower] = fam.ranks[oldLower];
            if (newLower !== oldLower) delete fam.ranks[oldLower];
          }
          if (Array.isArray(fam.todayCheckIns)) {
            fam.todayCheckIns = fam.todayCheckIns.map(cn => cn.toLowerCase() === oldLower ? newLower : cn);
          }
          if (fam.todayHeists && fam.todayHeists[oldLower]) {
            fam.todayHeists[newLower] = fam.todayHeists[oldLower];
            if (newLower !== oldLower) delete fam.todayHeists[oldLower];
          }
        }

        Object.values(rooms).forEach(rm => {
          if (rm.creator && rm.creator.toLowerCase() === oldLower) rm.creator = cleanNew;
          (rm.players || []).forEach(rp => {
            if (rp.nickname && rp.nickname.toLowerCase() === oldLower) rp.nickname = cleanNew;
          });
        });
      }
    }

    if (avatar && (avatar.startsWith('SLOT:') || avatar.startsWith('data:image'))) player.avatar = avatar;
    if (typeof bio === 'string') player.bio = escapeHTML(bio.trim()).slice(0, 120) || 'Гравець Mafia Club: Online';
    if (['male', 'female', 'other'].includes(gender)) player.gender = gender;
    if (typeof showBadge === 'boolean') player.showBadge = showBadge;
    if (typeof profanityFilter === 'boolean') player.profanityFilter = profanityFilter;
    if (Array.isArray(customBadWords)) {
      player.customBadWords = customBadWords
        .map(w => escapeHTML(String(w || '').trim().toLowerCase()).slice(0, 32))
        .filter(Boolean)
        .slice(0, 50);
    }
    saveDB();

    emitProfileTo(socket, player);
  });

  socket.on('deleteMyAccount', () => {
    if (!socket.nickname || socket.isGuest || socket.nickname.toLowerCase() === ADMIN_NICK.toLowerCase()) return;
    const nick = socket.nickname;
    delete db.players[nick];
    delete onlineUsers[nick.toLowerCase()];
    saveDB();
    socket.emit('forceLogout', 'Ваш акаунт та всі персональні дані успішно видалено (GDPR).');
  });

  socket.on('claimDailyQuest', (questId) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player) return;
    ensurePlayerFields(player);
    const q = player.dailyStats.quests;
    const rewards = { play_3: [q.play_3 >= 3, 60], win_town: [q.win_town >= 1, 80], send_reaction: [q.send_reaction >= 2, 40] };
    if (!rewards[questId] || !rewards[questId][0] || q.claimed.includes(questId)) return;

    q.claimed.push(questId);
    player.coins += rewards[questId][1];
    saveDB();
    emitProfileTo(socket, player);
    socket.emit('shopFeedback', { ok: true, msg: `Нагороду за завдання отримано: +${rewards[questId][1]} 🪙!` });
  });

  socket.on('buyShopItem', (itemId) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player) return;
    ensurePlayerFields(player);

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (item.type === 'frame' && player.inventory.includes(item.id)) {
      player.equippedFrame = player.equippedFrame === item.id ? '' : item.id;
      saveDB();
      emitProfileTo(socket, player);
      if (socket.currentRoomId && rooms[socket.currentRoomId]) broadcastRoomState(rooms[socket.currentRoomId]);
      return socket.emit('shopFeedback', { ok: true, msg: player.equippedFrame ? 'Рамку одягнено!' : 'Рамку знято!' });
    }
    if (item.type === 'death_fx' && player.inventory.includes(item.id)) {
      player.equippedDeathFx = player.equippedDeathFx === item.id ? 'default' : item.id;
      Object.values(rooms).forEach(rm => {
        const rp = rm.players && rm.players.find(pl => !pl.isBot && pl.nickname && pl.nickname.toLowerCase() === player.nickname.toLowerCase());
        if (rp) rp.deathEffect = player.equippedDeathFx;
      });
      saveDB();
      emitProfileTo(socket, player);
      return socket.emit('shopFeedback', { ok: true, msg: player.equippedDeathFx === item.id ? 'Ефект активовано!' : 'Ефект вимкнено!' });
    }

    const cur = item.currency === 'diamonds' ? 'diamonds' : 'coins';
    if ((player[cur] || 0) < item.price) {
      return socket.emit('shopFeedback', { ok: false, msg: cur === 'diamonds' ? 'Недостатньо діамантів (💎)!' : 'Недостатньо монет (🪙)!' });
    }

    player[cur] -= item.price;
    if (item.id === 'boost_xp') player.doubleXpGames += 5;
    else if (item.id === 'vip_30d') player.vipUntil = Math.max(Date.now(), player.vipUntil || 0) + 30 * 24 * 3600 * 1000;
    else if (item.id === 'rename_ticket') player.nickChanged = false;
    else if (item.id === 'family_pass') player.freeFamilyCreate = true;
    else player.inventory.push(item.id);

    if (item.type === 'frame') player.equippedFrame = item.id;
    if (item.type === 'death_fx') {
      player.equippedDeathFx = item.id;
      Object.values(rooms).forEach(rm => {
        const rp = rm.players && rm.players.find(pl => !pl.isBot && pl.nickname && pl.nickname.toLowerCase() === player.nickname.toLowerCase());
        if (rp) rp.deathEffect = player.equippedDeathFx;
      });
    }

    db.recentPurchases.unshift({
      nickname: player.nickname,
      item: item.name,
      price: item.price,
      currency: cur === 'diamonds' ? '💎' : '🪙',
      time: new Date().toLocaleTimeString('uk-UA')
    });
    if (db.recentPurchases.length > 30) db.recentPurchases.pop();
    saveDB();

    emitProfileTo(socket, player);
    socket.emit('shopFeedback', { ok: true, msg: `Успішно придбано: ${item.name}!` });
  });

  socket.on('claimDailyApologyBonus', () => {
    const player = findPlayerRecord(socket.nickname);
    if (!player) {
      return socket.emit('shopFeedback', { ok: false, msg: 'Увійдіть у зареєстрований акаунт, щоб щодня забирати +500 🪙!' });
    }
    ensurePlayerFields(player);
    const today = getTodayDateString();
    if (player.lastApologyBonusDate === today) {
      return socket.emit('shopFeedback', { ok: false, msg: '✅ Ви вже забрали сьогоднішні +500 🪙! Повертайтеся завтра.' });
    }
    player.lastApologyBonusDate = today;
    player.coins = (player.coins || 0) + 500;
    saveDB();
    emitProfileTo(socket, player);
    socket.emit('shopFeedback', { ok: true, msg: '🎁 Вам нараховано щоденні +500 🪙 в якості вибачення!' });
    socket.emit('rewardReceived', {
      coins: 500,
      diamonds: 0,
      authority: 0,
      xp: 0,
      comment: 'Донат тимчасово недоступний — прийміть +500 золота в якості вибачення!'
    });
  });

  socket.on('exchangeDiamonds', (packId) => {
    const player = findPlayerRecord(socket.nickname);
    if (!player) return;
    ensurePlayerFields(player);
    const pack = DIAMOND_PACKS[packId];
    if (!pack) return socket.emit('shopFeedback', { ok: false, msg: 'Невірний пакет обміну.' });
    if ((player.diamonds || 0) < pack.diamonds) {
      return socket.emit('shopFeedback', { ok: false, msg: `Потрібно ${pack.diamonds} 💎! Зараз у вас ${player.diamonds || 0} 💎.` });
    }
    player.diamonds -= pack.diamonds;
    player.coins += pack.coins;
    saveDB();
    emitProfileTo(socket, player);
    socket.emit('shopFeedback', { ok: true, msg: `💱 Обміняно ${pack.diamonds} 💎 на +${pack.coins} 🪙!` });
  });

  socket.on('sendTableGift', ({ targetNick, giftId, incognito }) => {
    const room = rooms[socket.currentRoomId];
    const player = findPlayerRecord(socket.nickname);
    if (!room || !player || !targetNick) return;
    ensurePlayerFields(player);

    const targetPlayer = room.players.find(p => !p.isSpectator && p.nickname && p.nickname.toLowerCase() === String(targetNick).trim().toLowerCase());
    if (!targetPlayer) return socket.emit('systemNews', '⚠️ Отримувача не знайдено за цим столом!');

    const idx = player.inventory.indexOf(giftId);
    if (idx === -1) return socket.emit('systemNews', '⚠️ У вас немає цього подарунка в інвентарі! Придбайте його у Крамниці.');

    const isVip = !!(player.vipUntil && player.vipUntil > Date.now());
    const useIncognito = !!incognito;
    if (useIncognito && !isVip) {
      if ((player.coins || 0) < 15) return socket.emit('systemNews', '⚠️ Доплата за анонімність (Інкогніто) — 15 🪙!');
      player.coins -= 15;
    }

    player.inventory.splice(idx, 1);
    saveDB();

    const item = SHOP_ITEMS.find(i => i.id === giftId);
    const giftObj = {
      id: giftId,
      icon: (item && item.icon) || '🎁',
      name: (item && item.name) || 'Подарунок',
      from: useIncognito ? 'Таємний шанувальник' : player.nickname,
      incognito: useIncognito,
      rare: !!(item && item.rare)
    };
    if (!room.tableGifts) room.tableGifts = {};
    room.tableGifts[targetPlayer.nickname] = giftObj;

    emitProfileTo(socket, player);
    io.to(room.id).emit('tableGiftEffect', {
      targetNick: targetPlayer.nickname,
      gift: giftObj,
      sound: (item && item.sound) || 'chime'
    });
    const senderLabel = useIncognito ? '🕵️ Таємний' : player.nickname;
    pushRoomNews(room, `🎁 ${senderLabel} ➔ ${targetPlayer.nickname}: ${giftObj.name}`);
    broadcastRoomState(room);
  });

  // === ІГРОВІ ПОДІЇ ТА ЧАТИ ===
  socket.on('startGame', () => {
    const room = rooms[socket.currentRoomId];
    if (!room || room.status !== 'waiting') return;
    const isCreator = !!(room.creator && socket.nickname && room.creator.toLowerCase() === socket.nickname.toLowerCase());
    if (!isCreator) {
      logSuspicious(socket, 'UNAUTHORIZED_START', `Спроба старту чужої кімнати «${room.name}»`);
      return;
    }
    if (room.players.filter(p => !p.isSpectator).length < 3) {
      return socket.emit('errorMsg', 'Потрібно мінімум 3 гравці (або додайте ботів)!');
    }
    startGameInRoom(room);
  });

  socket.on('submitLastWill', (willText) => {
    const room = rooms[socket.currentRoomId];
    if (!room || room.status !== 'playing') return;
    const pInRoom = room.players.find(p => p.nickname && p.nickname.toLowerCase() === (socket.nickname || '').toLowerCase());
    if (!pInRoom || pInRoom.alive || pInRoom.isSpectator || pInRoom.willSent) return;

    const cleanWill = maskLinksOnly(escapeHTML((willText || '').trim()).slice(0, 180));
    if (!cleanWill) return;

    pInRoom.willSent = true;
    pushRoomNews(room, `📜 Заповіт ${pInRoom.nickname}: «${cleanWill}»`);
    broadcastRoomState(room);
  });

  socket.on('sendRoomMsg', (text) => {
    const room = rooms[socket.currentRoomId];
    if (!room || !text || !text.trim()) return;

    const prof = findPlayerRecord(socket.nickname);
    if (prof && prof.mutedUntil && prof.mutedUntil > Date.now()) {
      return socket.emit('systemNews', '🔇 Вам видано мут модератором!');
    }

    const now = Date.now();
    if (socket.lastMsgTime && now - socket.lastMsgTime < 3000) {
      return socket.emit('systemNews', '⏳ Антиспам: зачекайте 3 секунди.');
    }
    if (socket.lastMsgText === text.trim()) {
      return socket.emit('systemNews', '⚠️ Не дублюйте однакове повідомлення поспіль.');
    }
    socket.lastMsgTime = now;
    socket.lastMsgText = text.trim();

    const pInRoom = room.players.find(p => p.nickname && p.nickname.toLowerCase() === (socket.nickname || '').toLowerCase());
    if (!pInRoom) return;
    const todaySet = getTodayTop100Set();
    const allTimeSet = getAllTimeTop100Set();
    const filteredText = maskLinksOnly(escapeHTML(text.trim()).slice(0, 300));
    const famTag = getFamilyTagForPlayer(prof);
    if (prof && /^[\p{Emoji}\s]+$/u.test(text.trim())) {
      ensurePlayerFields(prof);
      prof.dailyStats.quests.send_reaction = Math.min(2, (prof.dailyStats.quests.send_reaction || 0) + 1);
      saveDB();
    }

    if (room.status === 'waiting') {
      const lobbyMsg = {
        author: socket.nickname,
        badgeType: prof ? getBadgeType(prof, todaySet, allTimeSet) : null,
        familyTag: famTag,
        text: filteredText,
        isLobby: true,
        time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
      };
      if (!room.lobbyChat) room.lobbyChat = [];
      room.lobbyChat.push(lobbyMsg);
      if (room.lobbyChat.length > 60) room.lobbyChat.shift();
      io.to(room.id).emit('newLobbyMsg', lobbyMsg);
      return;
    }

    if (room.status === 'playing' && (room.phase === 'day_vote' || room.phase === 'night_vote')) {
      return socket.emit('systemNews', room.phase === 'day_vote'
        ? '🔇 Під час денного голосування чат вимкнено для всіх!'
        : '🔇 Під час фази нічних дій чат вимкнено для всіх!');
    }

    if ((room.status === 'playing' && !pInRoom.alive) || pInRoom.isSpectator) {
      const deadMsg = {
        author: socket.nickname,
        badgeType: prof ? getBadgeType(prof, todaySet, allTimeSet) : null,
        familyTag: famTag,
        text: filteredText,
        isGhostChat: true,
        time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
      };
      recordTimelineEvent(room, { kind: 'msg', msg: deadMsg, visibility: 'ghost' });
      room.players.forEach(p => {
        if (!p.isBot && (!p.alive || p.isSpectator || (p.role === 'medium' && (room.phase === 'night_chat' || room.phase === 'night_vote')))) {
          emitToUser(p.nickname, 'newRoomMsg', deadMsg);
        }
      });
      return;
    }

    if (room.status === 'playing') {
      if (pInRoom.silenced && room.phase === 'day_chat') {
        return socket.emit('systemNews', '🤐 Вас зашантажували вночі! Сьогодні ви не можете говорити.');
      }
      if (room.phase === 'night_vote' || room.phase === 'day_vote') {
        return socket.emit('systemNews', '🔇 Під час фази дій та голосування чат заблоковано!');
      }
      if (room.phase === 'night_chat') {
        const rObj = ROLES[pInRoom.role];
        if (!rObj || rObj.team !== 'mafia') return socket.emit('systemNews', '🌙 У 1-му етапі ночі чат доступний лише Мафії!');
      }
    }

    pInRoom.actionsCount = (pInRoom.actionsCount || 0) + 1;
    const isMafiaNight = room.status === 'playing' && room.phase === 'night_chat';
    const msg = {
      author: socket.nickname,
      badgeType: prof ? getBadgeType(prof, todaySet, allTimeSet) : null,
      familyTag: famTag,
      text: filteredText,
      isMafiaSecret: isMafiaNight,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };

    room.chat.push(msg);
    if (room.status === 'playing') {
      analyzeRoomChatForBots(room, socket.nickname, text.trim(), isMafiaNight, false);
    }
    if (isMafiaNight) {
      const mediumAnonMsg = {
        author: '🕵️ Невідомий мафіозі',
        badgeType: null,
        familyTag: '',
        text: filteredText,
        isMafiaSecret: true,
        isIncognitoMafia: true,
        time: msg.time
      };
      recordTimelineEvent(room, { kind: 'msg', msg, incognitoMsg: mediumAnonMsg, visibility: 'mafia' });
      room.players.forEach(p => {
        if (!p.isBot && p.alive && !p.isSpectator) {
          if (ROLES[p.role] && ROLES[p.role].team === 'mafia') {
            emitToUser(p.nickname, 'newRoomMsg', msg);
          } else if (p.role === 'medium') {
            emitToUser(p.nickname, 'newRoomMsg', mediumAnonMsg);
          }
        }
      });
    } else {
      recordTimelineEvent(room, { kind: 'msg', msg, visibility: 'all' });
      io.to(room.id).emit('newRoomMsg', msg);
    }
  });

  socket.on('submitAction', (targetNickname) => {
    const room = rooms[socket.currentRoomId];
    if (!room || room.status !== 'playing') return;

    const actor = room.players.find(p => p.nickname && p.nickname.toLowerCase() === (socket.nickname || '').toLowerCase());
    const target = room.players.find(p => p.nickname && p.nickname.toLowerCase() === String(targetNickname || '').trim().toLowerCase() && !p.isSpectator);
    if (!actor || !target) return;
    if (!actor.alive || actor.isSpectator) {
      logSuspicious(socket, 'ACT_WHILE_DEAD', `Спроба дії у стані мертвого/спостерігача проти ${target.nickname}`);
      return;
    }

    const passiveRoles = ['citizen', 'mayor', 'jester', 'medium'];

    if (room.phase === 'night_chat') {
      return socket.emit('systemNews', '⏳ Нічні дії (Мафія, Лікар, Шериф та ін.) відкриваються у 2-му етапі ночі — після чату Мафії!');
    }

    if (room.phase === 'night_vote') {
      if (actor.convertedToCult) {
        return socket.emit('systemNews', '🕯️ Навернені культисти не можуть вербувати інших — це право має лише Лідер Культу!');
      }
      if (passiveRoles.includes(actor.role)) {
        logSuspicious(socket, 'ACT_PASSIVE_ROLE', `Пасивна роль (${actor.role}) надіслала submitAction вночі`);
        return socket.emit('systemNews', '🌙 Ваша роль не має активної нічної дії.');
      }
      if (actor.role === 'journalist') {
        const existingPair = Array.isArray(room.nightActions[actor.nickname]) ? room.nightActions[actor.nickname] : [];
        if (existingPair.length >= 2) {
          return socket.emit('systemNews', '🔒 Ви вже обрали 2 гравців цієї ночі! Вибір зафіксовано.');
        }
      } else if (room.nightActions[actor.nickname]) {
        return socket.emit('systemNews', '🔒 Ви вже зробили свій вибір цієї ночі! Змінити ціль не можна.');
      }

      if (actor.role === 'amnesiac' && target.alive) {
        return socket.emit('systemNews', '🧠 Амнезіак може обрати лише вибулого гравця!');
      }
      if (actor.role !== 'amnesiac' && !target.alive) {
        logSuspicious(socket, 'ACT_DEAD_TARGET', `Спроба нічної дії по мертвому гравцю ${target.nickname}`);
        return socket.emit('systemNews', '⚠️ Цей гравець вже вибув!');
      }
      if (actor.nickname.toLowerCase() === target.nickname.toLowerCase()) {
        logSuspicious(socket, 'ACT_SELF_TARGET', `Спроба застосувати нічну дію на себе (${actor.role})`);
        return socket.emit('systemNews', '⚠️ Не можна застосовувати нічну дію на самого себе!');
      }
      if ((actor.role === 'doctor' || actor.role === 'guardian_angel') && actor.lastHealedTarget && actor.lastHealedTarget === target.nickname) {
        const aliveCount = room.players.filter(p => p.alive && !p.isSpectator).length;
        if (aliveCount >= 4) {
          return socket.emit('systemNews', '💉 Не можна лікувати одного й того самого гравця дві ночі поспіль!');
        }
      }
      const actorRoleObj = ROLES[actor.role];
      const targetRoleObj = ROLES[target.role];
      if (actorRoleObj && actorRoleObj.team === 'mafia' && targetRoleObj && targetRoleObj.team === 'mafia' && !target.convertedToCult && actor.role !== 'consigliere' && actor.role !== 'framer') {
        return socket.emit('systemNews', '⚠️ Не можна атакувати союзника по команді Мафії!');
      }
      if (actor.role === 'cult_leader' && isPlayerCultMember(target)) {
        return socket.emit('systemNews', '🕯️ Цей гравець уже належить до вашого Культу!');
      }
      if (actor.role === 'journalist') {
        const cur = Array.isArray(room.nightActions[actor.nickname]) ? [...room.nightActions[actor.nickname]] : [];
        let next = cur;
        if (cur.length === 0) next = [target.nickname];
        else if (cur.length === 1) {
          if (cur[0] === target.nickname) return socket.emit('systemNews', '⚠️ Оберіть іншого другого гравця для порівняння!');
          next = [cur[0], target.nickname];
        }
        room.nightActions[actor.nickname] = next;
        actor.actionsCount = (actor.actionsCount || 0) + 1;
        if (next.length < 2) {
          socket.emit('systemNews', `📸 Репортер: обрано 1/2 (${next[0]}). Оберіть ще одного гравця!`);
        } else {
          socket.emit('systemNews', `📸 Репортер порівняє вранці: ${next[0]} та ${next[1]}! (Зафіксовано)`);
        }
        broadcastRoomState(room);
        if (next.length >= 2) checkAllVotedOrActed(room);
        return;
      }
      room.nightActions[actor.nickname] = target.nickname;
      actor.actionsCount = (actor.actionsCount || 0) + 1;
      const icon = (actorRoleObj && actorRoleObj.actionIcon) || '🎯';
      socket.emit('systemNews', `${icon} Вибір зафіксовано на Ніч №${room.dayNumber}: ${target.nickname}`);
      broadcastRoomState(room);
      checkAllVotedOrActed(room);
    } else if (room.phase === 'day_vote') {
      if (room.votes[actor.nickname]) {
        return socket.emit('systemNews', '🔒 Ваш голос уже зафіксовано! Змінити голос на іншого гравця не можна.');
      }
      if (!target.alive) {
        logSuspicious(socket, 'VOTE_DEAD_TARGET', `Спроба голосувати за мертвого ${target.nickname}`);
        return;
      }
      if (actor.nickname.toLowerCase() === target.nickname.toLowerCase()) {
        logSuspicious(socket, 'ACT_SELF_TARGET', 'Спроба проголосувати проти самого себе');
        return;
      }
      room.votes[actor.nickname] = target.nickname;
      actor.actionsCount = (actor.actionsCount || 0) + 1;
      pushRoomNews(room, `🗳️ ${actor.nickname} голосує проти ${target.nickname}`);
      broadcastRoomState(room);
      checkAllVotedOrActed(room);
    }
  });

  // === СКАРГИ ТА АДМІН-ДАШБОРД ===
  socket.on('reportPlayer', ({ targetNick, reason, screenshot }) => {
    if (!socket.nickname || !targetNick || targetNick === socket.nickname) return;
    const room = socket.currentRoomId ? rooms[socket.currentRoomId] : null;
    const sourceChat = room ? (room.chat || []) : (db.globalChat || []);

    const authorMsgs = sourceChat.filter(m => (m.author || '').toLowerCase() === socket.nickname.toLowerCase()).slice(-12);
    const targetMsgs = sourceChat.filter(m => (m.author || '').toLowerCase() === targetNick.toLowerCase()).slice(-12);

    const reportObj = {
      id: 'rep_' + Date.now(),
      from: socket.nickname,
      target: targetNick,
      reason: escapeHTML(String(reason || 'Порушення правил')).slice(0, 200),
      serverRegion: room ? room.serverRegion : 'GLOBAL',
      context: {
        fromAuthor: authorMsgs,
        fromTarget: targetMsgs
      },
      screenshot: (screenshot && typeof screenshot === 'string' && screenshot.startsWith('data:image/')) ? screenshot : null,
      status: 'open',
      createdAt: new Date().toLocaleString('uk-UA')
    };

    if (!db.reports) db.reports = [];
    db.reports.unshift(reportObj);
    saveDB();
    socket.emit('systemNews', `🚩 Скаргу на ${targetNick} надіслано модераторам.`);
  });

  function buildAdminDashboardPayload() {
    const now = Date.now();
    const allRooms = Object.values(rooms);
    const playingRoomsCount = allRooms.filter(r => r.status === 'playing').length;
    const waitingRoomsCount = allRooms.filter(r => r.status === 'waiting').length;
    const inRoomsCount = allRooms.reduce((sum, r) => sum + r.players.filter(p => !p.isBot).length, 0);
    const botsCount = allRooms.reduce((sum, r) => sum + r.players.filter(p => p.isBot).length, 0);
    const totalOnline = Object.keys(onlineUsers).length;
    const allPlayersArr = Object.values(db.players || {});
    const totalRegistered = allPlayersArr.length;
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const newRegsToday = (db.dailyRegistrations || []).filter(ts => ts >= todayStart).length;
    const started = db.matchMetrics?.started || 0;
    const completed = db.matchMetrics?.completed || 0;
    const completionRate = started > 0 ? Math.round((completed / started) * 100) : 100;

    const activePunishments = [];
    allPlayersArr.forEach(p => {
      if (p.banned) {
        activePunishments.push({
          nickname: p.nickname,
          type: 'permban',
          label: '🚫 Пермабан',
          reason: p.banReason || 'Без причини',
          untilText: 'Назавжди'
        });
      } else if (p.bannedUntil && p.bannedUntil > now) {
        activePunishments.push({
          nickname: p.nickname,
          type: 'tempban',
          label: '⏳ Тимчасовий бан',
          reason: p.banReason || 'Без причини',
          untilText: 'до ' + new Date(p.bannedUntil).toLocaleString('uk-UA')
        });
      }
      if (p.mutedUntil && p.mutedUntil > now) {
        activePunishments.push({
          nickname: p.nickname,
          type: 'mute',
          label: '🔇 Мут чату',
          reason: p.muteReason || 'Без причини',
          untilText: 'до ' + new Date(p.mutedUntil).toLocaleString('uk-UA')
        });
      }
      if (p.playBanned) {
        activePunishments.push({
          nickname: p.nickname,
          type: 'playban',
          label: '🎮 Заборона гри (Назавжди)',
          reason: p.playBanReason || 'Без причини',
          untilText: 'Назавжди'
        });
      } else if (p.playBannedUntil && p.playBannedUntil > now) {
        activePunishments.push({
          nickname: p.nickname,
          type: 'playban',
          label: '🎮 Заборона гри',
          reason: p.playBanReason || 'Без причини',
          untilText: 'до ' + new Date(p.playBannedUntil).toLocaleString('uk-UA')
        });
      }
    });

    const onlinePlayers = Object.keys(onlineUsers).map(nickLower => {
      const rec = findPlayerRecord(nickLower);
      const dispNick = rec ? rec.nickname : nickLower;
      const rFound = allRooms.find(r => r.players.some(p => p.nickname && p.nickname.toLowerCase() === nickLower));
      return {
        nickname: dispNick,
        inRoom: rFound ? `${rFound.name} (${rFound.status === 'playing' ? 'гра' : 'лобі'})` : 'Головне меню',
        staffRole: rec ? (rec.staffRole || 'player') : 'guest',
        isTester: !!(rec && rec.isTester)
      };
    });

    const reportsList = (db.reports || []).slice(0, 60).map(r => {
      const targetRec = findPlayerRecord(r.target);
      const totalReportsOnTarget = (db.reports || []).filter(x => (x.target || '').toLowerCase() === (r.target || '').toLowerCase()).length;
      return {
        ...r,
        targetHistory: {
          totalReports: totalReportsOnTarget,
          punishCount: targetRec ? (targetRec.punishCount || 0) : 0,
          karma: targetRec ? (targetRec.karma ?? 100) : 100,
          isMuted: !!(targetRec && targetRec.mutedUntil && targetRec.mutedUntil > now),
          isPlayBanned: !!(targetRec && getPlayBanError(targetRec)),
          isBanned: !!(targetRec && (targetRec.banned || (targetRec.bannedUntil && targetRec.bannedUntil > now)))
        }
      };
    });

    const testersList = allPlayersArr.filter(p => p.isTester).map(p => ({
      nickname: p.nickname,
      coins: p.coins || 0,
      authority: p.authority || 0,
      diamonds: p.diamonds || 0,
      staffRole: p.staffRole || 'player'
    }));

    const staffList = allPlayersArr
      .filter(p => p.staffRole && p.staffRole !== 'player')
      .map(p => ({
        nickname: p.nickname,
        staffRole: p.staffRole,
        hasBratikCode: !!p.bratikSecretCode
      }));

    const passwordResetRequests = (db.passwordResetRequests || []).slice(0, 40).map(req => ({
      id: req.id,
      nickname: req.nickname,
      note: req.note || '',
      time: req.time || ''
    }));

    return {
      metrics: {
        totalOnline,
        inRoomsCount,
        inLobbyCount: Math.max(0, totalOnline - inRoomsCount),
        totalRegistered,
        newRegsToday,
        activeRoomsCount: allRooms.length,
        playingRoomsCount,
        waitingRoomsCount,
        botsCount,
        matchesStarted: started,
        matchesCompleted: completed,
        completionRate,
        openReportsCount: (db.reports || []).filter(r => r.status === 'open').length,
        closedReportsCount: (db.reports || []).filter(r => r.status === 'closed').length,
        activeMutesCount: activePunishments.filter(x => x.type === 'mute').length,
        activePlayBansCount: activePunishments.filter(x => x.type === 'playban').length,
        activeBansCount: activePunishments.filter(x => x.type === 'tempban' || x.type === 'permban').length,
        uptimeMinutes: Math.floor(process.uptime() / 60),
        recentPurchases: (db.recentPurchases || []).slice(0, 15),
        cloudDbMode: cloudStatusMode,
        cloudLastSync: cloudLastSyncAt || '-',
        unreadIdeasCount: (db.playerIdeas || []).filter(i => !i.read).length
      },
      onlinePlayers,
      activePunishments,
      reports: reportsList,
      modLogs: (db.modLogs || []).slice(0, 60),
      suspiciousLogs: (db.suspiciousLogs || []).slice(0, 80),
      playerIdeas: (db.playerIdeas || []).slice(0, 80),
      testersList,
      staffList,
      passwordResetRequests
    };
  }

  function applyPunishment(tp, punishType, reasonText) {
    ensurePlayerFields(tp);
    const cleanReason = escapeHTML(String(reasonText || 'Порушення правил')).slice(0, 160);
    tp.punishCount = (tp.punishCount || 0) + 1;

    if (punishType === 'warn') {
      tp.karma = Math.max(0, (tp.karma ?? 100) - 10);
      emitToUser(tp.nickname, 'systemNews', `⚠️ Попередження від модератора (-10 карми)! Причина: ${cleanReason}`);
      emitProfileTo(null, tp);
      return `⚠️ Гравцю ${tp.nickname} видано попередження (-10 карми).`;
    }
    if (punishType === 'mute_30m' || punishType === 'mute_2h' || punishType === 'mute_24h' || punishType === 'mute') {
      const mins = punishType === 'mute_30m' ? 30 : (punishType === 'mute_24h' ? 1440 : 120);
      const label = mins === 30 ? '30 хв' : (mins === 1440 ? '24 год' : '2 год');
      tp.mutedUntil = Date.now() + mins * 60 * 1000;
      tp.muteReason = cleanReason;
      tp.karma = Math.max(0, (tp.karma ?? 100) - 10);
      emitToUser(tp.nickname, 'systemNews', `🔇 Вам видано мут чату на ${label}! Причина: ${cleanReason}`);
      emitProfileTo(null, tp);
      return `🔇 Гравцю ${tp.nickname} видано мут на ${label}.`;
    }
    if (punishType === 'playban_24h' || punishType === 'playban_7d' || punishType === 'playban_perm' || punishType === 'playban') {
      const isPerm = punishType === 'playban_perm';
      const hours = punishType === 'playban_7d' ? 168 : 24;
      const label = isPerm ? 'Назавжди' : (hours === 168 ? '7 днів' : '24 год');
      if (isPerm) tp.playBanned = true;
      else tp.playBannedUntil = Date.now() + hours * 3600 * 1000;
      tp.playBanReason = cleanReason;

      Object.values(rooms).forEach(r => {
        if (r.status === 'waiting') {
          const before = r.players.length;
          r.players = r.players.filter(p => !p.nickname || p.nickname.toLowerCase() !== tp.nickname.toLowerCase());
          if (r.players.length !== before) {
            broadcastRoomState(r);
            io.emit('roomsUpdated', getPublicRoomsList());
          }
        }
      });
      getSocketsForUser(tp.nickname).forEach(tSock => {
        if (tSock.currentRoomId && rooms[tSock.currentRoomId] && rooms[tSock.currentRoomId].status === 'waiting') {
          tSock.leave(tSock.currentRoomId);
          tSock.currentRoomId = null;
          tSock.emit('kickedFromLobbyByPlayBan', getPlayBanError(tp));
        }
      });
      emitProfileTo(null, tp);
      emitToUser(tp.nickname, 'errorMsg', `🚫 Вам заборонено грати (${label}). Спілкування у чатах та з друзями залишається доступним! Причина: ${cleanReason}`);
      return `🎮 Гравцю ${tp.nickname} заборонено грати (${label}).`;
    }
    if (punishType === 'tempban_24h' || punishType === 'tempban_7d' || punishType === 'tempban') {
      const hours = punishType === 'tempban_7d' ? 168 : 24;
      const label = hours === 168 ? '7 днів' : '24 год';
      tp.bannedUntil = Date.now() + hours * 3600 * 1000;
      tp.banReason = cleanReason;
      emitToUser(tp.nickname, 'forceLogout', `⏳ Ваш акаунт тимчасово заблоковано на ${label}. Причина: ${cleanReason}`);
      return `⏳ Гравцю ${tp.nickname} видано бан на ${label}.`;
    }
    if (punishType === 'permban') {
      tp.banned = true;
      tp.banReason = cleanReason;
      emitToUser(tp.nickname, 'forceLogout', `🚫 Ваш акаунт заблоковано назавжди. Причина: ${cleanReason}`);
      return `🚫 Гравця ${tp.nickname} заблоковано назавжди.`;
    }
    return 'Дію виконано.';
  }

  function isFullAdminSocket(sock) {
    return !!(sock && (sock.isAdmin || sock.staffRole === 'admin' || sock.staffRole === 'bratik'));
  }

  socket.on('getAdminDashboard', () => {
    const isStaff = isFullAdminSocket(socket) || ['helper', 'senior_mod'].includes(socket.staffRole);
    if (!isStaff) {
      logSuspicious(socket, 'UNAUTHORIZED_ADMIN', 'Спроба запиту getAdminDashboard без прав персоналу');
      return;
    }
    socket.emit('adminDashboardData', buildAdminDashboardPayload());
  });

  socket.on('adminCommand', ({ action, payload }) => {
    const isFullAdmin = isFullAdminSocket(socket);
    const isMod = ['helper', 'senior_mod'].includes(socket.staffRole);
    const isStaff = isFullAdmin || isMod;
    if (!isStaff) {
      logSuspicious(socket, 'UNAUTHORIZED_ADMIN', `Спроба виклику adminCommand (${action || '?'}) без прав персоналу`);
      return;
    }
    const isOwner = !!(socket.nickname && socket.nickname.toLowerCase() === ADMIN_NICK.toLowerCase());
    const room = rooms[socket.currentRoomId];

    // Обмеження прав модераторів: щоб модер не міг зламати гру чи роздавати ресурси/пермабани
    const MOD_ALLOWED_ACTIONS = ['resolveReport', 'reopenReport', 'unmuteUser', 'muteUser', 'punishUser'];
    if (!isFullAdmin) {
      if (!MOD_ALLOWED_ACTIONS.includes(action)) {
        return socket.emit('adminFeedback', '⛔ Ця дія доступна лише Адміністратору або Братіку!');
      }
      if (action === 'punishUser') {
        const pt = payload?.punishType || 'warn';
        if (!['warn', 'mute_30m', 'mute_2h', 'mute_24h', 'mute'].includes(pt)) {
          return socket.emit('adminFeedback', '⛔ Модератор може видавати лише попередження або мут чату (до 24 год)! Пермабан/бан гри доступний Адміну/Братіку.');
        }
      }
      if (action === 'resolveReport') {
        const pt = payload?.punishment || 'dismiss';
        if (!['dismiss', 'warn', 'mute_30m', 'mute_2h', 'mute_24h', 'mute'].includes(pt)) {
          return socket.emit('adminFeedback', '⛔ У вердикті модератор може обрати лише: Відхилити, Попередження або Мут (30хв/2год/24год).');
        }
      }
      const targetCheck = payload?.targetNick ? findPlayerRecord(payload.targetNick) : null;
      if (targetCheck && targetCheck.staffRole && targetCheck.staffRole !== 'player') {
        return socket.emit('adminFeedback', '⛔ Модератор не може застосовувати санкції до персоналу чи адміністрації!');
      }
    }

    if (action === 'markIdeasRead' && isFullAdmin) {
      (db.playerIdeas || []).forEach(i => { i.read = true; });
      saveDB();
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return;
    }

    const logId = 'log_' + Date.now() + '_' + Math.floor(Math.random() * 999);
    const punishVerb = payload?.punishType || payload?.punishment || (action === 'muteUser' ? 'mute' : '');
    if (action !== 'markIdeasRead') {
      db.modLogs.unshift({
        id: logId,
        moderator: socket.nickname,
        role: socket.staffRole,
        action,
        target: payload?.targetNick || payload?.botNick || payload?.reportId || '-',
        detail: punishVerb || payload?.reason || '',
        reverted: false,
        time: new Date().toLocaleString('uk-UA')
      });
      if (db.modLogs.length > 200) db.modLogs.pop();
    }

    if (action === 'punishUser') {
      const tp = findPlayerRecord(payload?.targetNick);
      if (!tp || tp.nickname.toLowerCase() === ADMIN_NICK.toLowerCase() || (tp.staffRole === 'bratik' && !isOwner)) {
        return socket.emit('adminFeedback', '❌ Гравця не знайдено або неможливо покарати адміністрацію!');
      }
      const feedback = applyPunishment(tp, payload.punishType || 'warn', payload.reason);
      saveDB();
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', feedback);
    }

    if (action === 'unmuteUser') {
      const tp = findPlayerRecord(payload?.targetNick);
      if (!tp) return socket.emit('adminFeedback', '❌ Гравця не знайдено!');
      tp.mutedUntil = 0;
      tp.muteReason = '';
      saveDB();
      emitToUser(tp.nickname, 'systemNews', '🔊 Модератор зняв з вас мут чату!');
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', `🔊 Мут з гравця ${tp.nickname} успішно знято.`);
    }

    if (action === 'unplaybanUser' && isFullAdmin) {
      const tp = findPlayerRecord(payload?.targetNick);
      if (!tp) return socket.emit('adminFeedback', '❌ Гравця не знайдено!');
      tp.playBanned = false;
      tp.playBannedUntil = 0;
      tp.playBanReason = '';
      saveDB();
      emitProfileTo(null, tp);
      emitToUser(tp.nickname, 'systemNews', '🎮 Адміністратор зняв з вас заборону на гру! Тепер ви можете грати знову.');
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', `🎮 Заборону на гру з ${tp.nickname} успішно знято.`);
    }

    if (action === 'unbanUser' && isFullAdmin) {
      const tp = findPlayerRecord(payload?.targetNick);
      if (!tp) return socket.emit('adminFeedback', '❌ Гравця не знайдено!');
      tp.banned = false;
      tp.bannedUntil = 0;
      tp.banReason = '';
      saveDB();
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', `🔓 Бан з гравця ${tp.nickname} успішно знято.`);
    }

    if (action === 'revertModAction' && isFullAdmin && payload?.logId) {
      const entry = (db.modLogs || []).find(l => l.id === payload.logId);
      if (!entry || entry.reverted) return socket.emit('adminFeedback', 'Запис не знайдено або вже скасовано.');
      let revertMsg = 'Дію скасовано.';
      if (entry.action === 'resolveReport' && entry.target) {
        const rep = (db.reports || []).find(r => r.id === entry.target);
        if (rep) {
          const tp = findPlayerRecord(rep.target);
          if (tp && rep.verdict && rep.verdict !== 'dismiss') {
            tp.mutedUntil = 0; tp.muteReason = '';
            tp.playBanned = false; tp.playBannedUntil = 0; tp.playBanReason = '';
            tp.banned = false; tp.bannedUntil = 0; tp.banReason = '';
            if (rep.verdict === 'warn') tp.karma = Math.min(100, (tp.karma ?? 100) + 10);
            emitProfileTo(null, tp);
          }
          rep.status = 'open';
          rep.verdict = null;
          revertMsg = `↩️ Скасовано вердикт по скарзі ${rep.id} (ціль: ${rep.target}).`;
        }
      } else if (entry.target && entry.target !== '-') {
        const tp = findPlayerRecord(entry.target);
        if (tp) {
          tp.mutedUntil = 0; tp.muteReason = '';
          tp.playBanned = false; tp.playBannedUntil = 0; tp.playBanReason = '';
          tp.banned = false; tp.bannedUntil = 0; tp.banReason = '';
          if (entry.detail === 'warn' || entry.detail.startsWith('mute')) {
            tp.karma = Math.min(100, (tp.karma ?? 100) + 10);
          }
          emitProfileTo(null, tp);
          emitToUser(tp.nickname, 'systemNews', '🛡️ Адміністрація скасувала попереднє рішення модератора щодо вас.');
          revertMsg = `↩️ Скасовано дію щодо ${tp.nickname}.`;
        }
      }
      entry.reverted = true;
      entry.revertedBy = socket.nickname;
      saveDB();
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', revertMsg);
    }

    if (action === 'grantTester' && isFullAdmin) {
      const tp = findPlayerRecord(payload?.targetNick);
      if (!tp) return socket.emit('adminFeedback', `❌ Гравця «${payload?.targetNick}» не знайдено!`);
      ensurePlayerFields(tp);
      const revoke = !!payload?.revoke;
      tp.isTester = !revoke;
      if (!revoke) {
        tp.coins = (tp.coins || 0) + 10000;
        tp.authority = (tp.authority || 0) + 1000;
        tp.diamonds = (tp.diamonds || 0) + 250;
        tp.vipUntil = Math.max(Date.now(), tp.vipUntil || 0) + 30 * 24 * 3600 * 1000;
        tp.legendUnlocked = true;
        saveDB();
        emitProfileTo(null, tp);
        emitToUser(tp.nickname, 'rewardReceived', {
          coins: 10000,
          diamonds: 250,
          authority: 1000,
          xp: 0,
          comment: '🧪 Вас призначено Тестером гри! Нараховано ресурси для повного тестування (+10 000 🪙, +1 000 ⭐, +250 💎, VIP, режим Легенда та безкоштовні боти).'
        });
        socket.emit('adminDashboardData', buildAdminDashboardPayload());
        return socket.emit('adminFeedback', `🧪 Гравця ${tp.nickname} призначено Тестером (+10 000 🪙, +1 000 ⭐, +250 💎, VIP)!`);
      } else {
        saveDB();
        emitProfileTo(null, tp);
        socket.emit('adminDashboardData', buildAdminDashboardPayload());
        return socket.emit('adminFeedback', `🧪 Статус Тестера знято з ${tp.nickname}.`);
      }
    }

    if (action === 'assignBratik') {
      if (!isOwner) return socket.emit('adminFeedback', '⛔ Призначати посаду «Братік» може лише головний розробник!');
      const tp = findPlayerRecord(payload?.targetNick);
      if (!tp || tp.nickname.toLowerCase() === ADMIN_NICK.toLowerCase()) {
        return socket.emit('adminFeedback', `❌ Гравця «${payload?.targetNick}» не знайдено!`);
      }
      ensurePlayerFields(tp);
      const revoke = !!payload?.revoke;
      tp.staffRole = revoke ? 'player' : 'bratik';
      if (!revoke) {
        if (!tp.bratikSecretCode) tp.bratikCodeRequired = true;
      } else {
        tp.bratikCodeRequired = false;
      }
      saveDB();
      getSocketsForUser(tp.nickname).forEach(s => {
        s.isAdmin = !revoke;
        s.staffRole = tp.staffRole;
        s.emit('staffStatusUpdated', { isAdmin: s.isAdmin, staffRole: s.staffRole });
      });
      emitProfileTo(null, tp);
      if (!revoke && !tp.bratikSecretCode) {
        emitToUser(tp.nickname, 'promptBratikCodeSetup', { nickname: tp.nickname });
      }
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', revoke
        ? `🤝 Посаду Братіка знято з ${tp.nickname}.`
        : `🤝 Гравця ${tp.nickname} призначено Братіком! Йому надіслано вікно створення особистого секретного коду.`);
    }

    if (action === 'setStaffRole' && isFullAdmin) {
      const tp = findPlayerRecord(payload?.targetNick);
      const newRole = ['player', 'helper', 'senior_mod'].includes(payload?.role) ? payload.role : null;
      if (!tp || !newRole || tp.nickname.toLowerCase() === ADMIN_NICK.toLowerCase() || tp.staffRole === 'bratik') {
        return socket.emit('adminFeedback', '❌ Гравця не знайдено або роль недоступна!');
      }
      tp.staffRole = newRole;
      saveDB();
      getSocketsForUser(tp.nickname).forEach(s => {
        s.isAdmin = false;
        s.staffRole = newRole;
        s.emit('staffStatusUpdated', { isAdmin: false, staffRole: newRole });
      });
      emitProfileTo(null, tp);
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', `🛡️ Гравцю ${tp.nickname} призначено роль персоналу: ${newRole}.`);
    }

    if (action === 'resolvePasswordReset' && isFullAdmin && payload?.requestId) {
      const idx = (db.passwordResetRequests || []).findIndex(r => r.id === payload.requestId);
      if (idx === -1) return socket.emit('adminFeedback', 'Запит не знайдено.');
      const reqObj = db.passwordResetRequests[idx];
      db.passwordResetRequests.splice(idx, 1);
      if (payload.approve) {
        const tp = findPlayerRecord(reqObj.nickname);
        if (tp && reqObj.newPasswordHash) {
          tp.passwordHash = reqObj.newPasswordHash;
          tp.recoveryCode = generateRecoveryCode();
        }
      }
      saveDB();
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', payload.approve
        ? `✅ Новий пароль для ${reqObj.nickname} підтверджено та активовано!`
        : `❌ Запит на скидання пароля для ${reqObj.nickname} відхилено.`);
    }

    if (action === 'clearSuspiciousLogs' && isFullAdmin) {
      db.suspiciousLogs = [];
      saveDB();
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', '🧹 Журнал підозрілих дій очищено.');
    }

    if (action === 'muteUser') {
      const tp = findPlayerRecord(payload.targetNick);
      if (!tp || tp.nickname.toLowerCase() === ADMIN_NICK.toLowerCase() || (tp.staffRole === 'bratik' && !isOwner)) {
        return socket.emit('adminFeedback', 'Неможливо видати мут!');
      }
      const hours = Math.max(1, Math.min(24, Number(payload.hours) || 2));
      tp.mutedUntil = Date.now() + hours * 3600 * 1000;
      tp.muteReason = escapeHTML(String(payload.reason || 'Мут від модератора')).slice(0, 120);
      tp.karma = Math.max(0, (tp.karma ?? 100) - 10);
      saveDB();
      emitToUser(tp.nickname, 'systemNews', `🔇 Вам видано мут чату на ${hours} год. Причина: ${tp.muteReason}`);
      emitProfileTo(null, tp);
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', `🔇 Гравцю ${tp.nickname} видано мут на ${hours} год. (-10 карми).`);
    }

    if (action === 'resolveReport' && payload.reportId) {
      const rep = db.reports.find(r => r.id === payload.reportId);
      if (rep) {
        rep.status = 'closed';
        rep.resolvedAt = new Date().toLocaleString('uk-UA');
        rep.resolvedBy = socket.nickname;
        const punishment = payload.punishment || (payload.penalize ? 'warn' : 'dismiss');
        rep.verdict = punishment;
        rep.modComment = escapeHTML(String(payload.modComment || '')).slice(0, 200);
        const tp = findPlayerRecord(rep.target);
        if (tp && punishment !== 'dismiss' && tp.nickname.toLowerCase() !== ADMIN_NICK.toLowerCase()) {
          applyPunishment(tp, punishment, rep.modComment || rep.reason);
        }
        saveDB();
      }
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', '✅ Скаргу успішно розглянуто.');
    }

    if (action === 'reopenReport' && payload.reportId) {
      const rep = db.reports.find(r => r.id === payload.reportId);
      if (rep) {
        if (payload.revokePunishment && isFullAdmin) {
          const tp = findPlayerRecord(rep.target);
          if (tp) {
            if (rep.verdict && rep.verdict.startsWith('mute')) {
              tp.mutedUntil = 0;
              tp.muteReason = '';
            } else if (rep.verdict && rep.verdict.startsWith('playban')) {
              tp.playBanned = false;
              tp.playBannedUntil = 0;
              tp.playBanReason = '';
            } else if (rep.verdict && (rep.verdict.startsWith('tempban') || rep.verdict === 'permban')) {
              tp.banned = false;
              tp.bannedUntil = 0;
              tp.banReason = '';
            } else if (rep.verdict === 'warn') {
              tp.karma = Math.min(100, (tp.karma ?? 100) + 10);
            }
          }
        }
        rep.status = 'open';
        rep.verdict = null;
        rep.resolvedAt = null;
        rep.resolvedBy = null;
        saveDB();
      }
      socket.emit('adminDashboardData', buildAdminDashboardPayload());
      return socket.emit('adminFeedback', '↩️ Скаргу перевідкрито' + (payload.revokePunishment ? ' та покарання скасовано!' : '.'));
    }

    if (action === 'addBots' && isFullAdmin && room && room.status === 'waiting') {
      const count = Math.min(Number(payload.count) || 4, room.maxPlayers - room.players.length);
      for (let i = 0; i < count; i++) {
        const used = new Set(room.players.map(p => p.nickname));
        const freeBot = BOT_CATALOG.find(b => !used.has(b.name));
        const freeName = freeBot ? freeBot.name : ('Бот_' + Math.floor(Math.random() * 999));
        const avatarSlot = freeBot ? freeBot.avatar : ('SLOT:' + ((Math.floor(Math.random() * 19)) + 1));
        room.players.push({
          nickname: freeName,
          avatar: avatarSlot,
          badgeType: null,
          isCreator: false,
          isBot: true,
          botStyle: freeBot ? freeBot.style : '',
          isSpectator: false,
          alive: true,
          leftRoom: false,
          role: null,
          silenced: false,
          willSent: false
        });
      }
      broadcastRoomState(room);
      io.emit('roomsUpdated', getPublicRoomsList());
      checkLobbyCountdown(room);
      return socket.emit('adminFeedback', `Додано ботів: ${count} шт.`);
    }

    if (action === 'clearBots' && isFullAdmin && room && room.status === 'waiting') {
      room.players = room.players.filter(p => !p.isBot);
      broadcastRoomState(room);
      io.emit('roomsUpdated', getPublicRoomsList());
      return socket.emit('adminFeedback', 'Усіх ботів видалено з кімнати.');
    }

    if (action === 'setBotStyle' && isFullAdmin && room) {
      room.botStyle = payload.style || 'balanced';
      return socket.emit('adminFeedback', `Характер ботів змінено на: ${room.botStyle}`);
    }

    if (action === 'skipPhase' && isFullAdmin && room && room.status === 'playing') {
      room.timeLeft = 1;
      return socket.emit('adminFeedback', 'Таймер поточної фази скорочено до 1 сек!');
    }

    if (action === 'botOrder' && isFullAdmin && room) {
      const bot = room.players.find(p => p.isBot && p.alive && p.nickname.toLowerCase() === (payload.botNick || '').toLowerCase());
      if (!bot) return socket.emit('adminFeedback', 'Живого бота з таким ніком не знайдено!');
      if (payload.orderType === 'say' && payload.text) {
        const botMsg = {
          author: bot.nickname,
          badgeType: null,
          text: escapeHTML(payload.text),
          time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
        };
        if (!room.chat) room.chat = [];
        room.chat.push(botMsg);
        io.to(room.id).emit('newRoomMsg', botMsg);
        return socket.emit('adminFeedback', `Бот ${bot.nickname} написав у чат.`);
      }
      if (payload.orderType === 'vote' && payload.targetNick) {
        room.votes[bot.nickname] = payload.targetNick;
        pushRoomNews(room, `🗳️ ${bot.nickname} голосує проти ${payload.targetNick}`);
        checkAllVotedOrActed(room);
        return socket.emit('adminFeedback', `Бот ${bot.nickname} проголосував проти ${payload.targetNick}.`);
      }
    }

    if (action === 'giftResources' && isFullAdmin) {
      const tp = findPlayerRecord(payload.targetNick);
      if (!tp) return socket.emit('adminFeedback', `❌ Гравця «${payload.targetNick}» не знайдено!`);
      ensurePlayerFields(tp);
      const coins = Number(payload.coins) || 0;
      const diamonds = Number(payload.diamonds) || 0;
      const auth = Number(payload.authority) || 0;
      const xp = Number(payload.xp) || 0;
      const comment = escapeHTML(String(payload.comment || '').trim()).slice(0, 200);

      tp.coins = Math.max(0, (tp.coins || 0) + coins);
      tp.diamonds = Math.max(0, (tp.diamonds || 0) + diamonds);
      tp.authority = Math.max(0, (tp.authority || 0) + auth);
      tp.xp = Math.max(0, (tp.xp || 0) + xp);
      tp.level = getLevelInfo(tp.xp).level;
      saveDB();
      emitProfileTo(null, tp);
      emitToUser(tp.nickname, 'rewardReceived', {
        coins,
        diamonds,
        authority: auth,
        xp,
        comment: comment || 'Вітаємо! Адміністрація нарахувала вам нагороду.'
      });
      return socket.emit('adminFeedback', `✅ Нараховано гравцю ${tp.nickname}: +${coins} 🪙, +${diamonds} 💎, +${auth} ⭐, +${xp} XP!`);
    }

    if (action === 'createDevPost' && isFullAdmin) {
      if (!payload.title || !payload.text) return;
      db.devPosts.unshift({
        id: Date.now(),
        title: escapeHTML(payload.title),
        text: escapeHTML(payload.text),
        date: new Date().toLocaleDateString('uk-UA'),
        comments: []
      });
      saveDB();
      io.emit('devPostsUpdated', db.devPosts);
      return socket.emit('adminFeedback', '📰 Новину опубліковано в журналі розробки!');
    }

    if (action === 'banUser' && isFullAdmin) {
      const tp = findPlayerRecord(payload.targetNick);
      if (!tp || tp.nickname.toLowerCase() === ADMIN_NICK.toLowerCase() || (tp.staffRole === 'bratik' && !isOwner)) {
        return socket.emit('adminFeedback', 'Неможливо заблокувати!');
      }
      tp.banned = true;
      saveDB();
      emitToUser(tp.nickname, 'forceLogout', 'Ваш акаунт заблоковано адміністратором.');
      return socket.emit('adminFeedback', `🚫 Гравець ${tp.nickname} заблокований!`);
    }

    if (action === 'exportDatabase' && isFullAdmin) {
      socket.emit('adminDatabaseExport', {
        filename: `mafia-club-db-${getTodayDateString()}.json`,
        json: JSON.stringify(db, null, 2)
      });
      return socket.emit('adminFeedback', '💾 Резервну копію бази даних сформовано для завантаження!');
    }

    if (action === 'importDatabase' && isFullAdmin) {
      try {
        const rawJson = payload && payload.json;
        const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
        if (!parsed || typeof parsed.players !== 'object') {
          return socket.emit('adminFeedback', '❌ Невірний формат файлу бази даних!');
        }
        applyLoadedDatabaseObject(parsed, true);
        writeLocalDBFile();
        pushDatabaseToCloud();
        socket.emit('adminDashboardData', buildAdminDashboardPayload());
        return socket.emit('adminFeedback', `✅ Базу даних успішно відновлено та синхронізовано (${Object.keys(db.players || {}).length} акаунтів)!`);
      } catch (e) {
        return socket.emit('adminFeedback', '❌ Помилка читання JSON файлу бази даних!');
      }
    }
  });

  socket.on('sendGlobalMsg', (text) => {
    const player = findPlayerRecord(socket.nickname);
    if (!socket.nickname || !text || !text.trim()) return;
    if (player && player.mutedUntil && player.mutedUntil > Date.now()) {
      return socket.emit('systemNews', '🔇 Вам видано мут модератором!');
    }
    const now = Date.now();
    if (socket.lastGlobalTime && now - socket.lastGlobalTime < 3000) return;
    socket.lastGlobalTime = now;

    const msg = {
      author: socket.nickname,
      badgeType: player ? getBadgeType(player, getTodayTop100Set(), getAllTimeTop100Set()) : null,
      familyTag: getFamilyTagForPlayer(player),
      text: maskLinksOnly(escapeHTML(text.trim()).slice(0, 250)),
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
    db.globalChat.push(msg);
    if (db.globalChat.length > 100) db.globalChat.shift();
    saveDB();
    io.emit('newGlobalMsg', msg);
  });

  socket.on('addDevComment', ({ postId, text }) => {
    if (!socket.nickname || !text || !text.trim()) return;
    const player = findPlayerRecord(socket.nickname);
    const post = db.devPosts.find(p => p.id === postId);
    if (!post) return;
    post.comments.push({
      author: socket.nickname,
      badgeType: player ? getBadgeType(player, getTodayTop100Set(), getAllTimeTop100Set()) : null,
      familyTag: getFamilyTagForPlayer(player),
      text: maskLinksOnly(escapeHTML(text.trim()).slice(0, 200))
    });
    saveDB();
    io.emit('devPostsUpdated', db.devPosts);
  });

  // === МІНІ-ІГРИ В ЛОБІ ===
  socket.on('submitMinigameScore', ({ game, score }) => {
    const MAX_SCORES = { runner: 5000, memory: 1000, whack: 1500, mafia_jump: 15000, cannon: 25000, snake: 10000, tetris: 20000 };
    if (!socket.nickname || !MAX_SCORES[game]) return;
    const now = Date.now();
    if (socket.lastMinigameSubmitAt && now - socket.lastMinigameSubmitAt < 1800) return;
    socket.lastMinigameSubmitAt = now;

    const rawScore = Math.floor(Number(score) || 0);
    if (rawScore <= 0) return;
    if (rawScore > MAX_SCORES[game]) {
      logSuspicious(socket, 'MINIGAME_SCORE_CHEAT', `Підозрілий рекорд у міні-грі ${game}: ${rawScore} (ліміт ${MAX_SCORES[game]})`);
      return;
    }
    const cleanScore = Math.max(0, Math.min(MAX_SCORES[game], rawScore));
    const room = rooms[socket.currentRoomId];
    if (room && room.status === 'waiting') {
      if (!room.minigameScores) room.minigameScores = {};
      if (!room.minigameScores[game]) room.minigameScores[game] = [];
      const existing = room.minigameScores[game].find(x => x.nickname.toLowerCase() === socket.nickname.toLowerCase());
      if (existing) {
        if (cleanScore > existing.score) existing.score = cleanScore;
      } else {
        room.minigameScores[game].push({ nickname: socket.nickname, score: cleanScore });
      }
      room.minigameScores[game].sort((a, b) => b.score - a.score);
      room.minigameScores[game] = room.minigameScores[game].slice(0, 10);
      io.to(room.id).emit('roomMinigameScores', room.minigameScores);
    }

    if (!db.minigameRecords) db.minigameRecords = { runner: [], memory: [], whack: [], mafia_jump: [], cannon: [], snake: [], tetris: [] };
    if (!Array.isArray(db.minigameRecords[game])) db.minigameRecords[game] = [];
    const gList = db.minigameRecords[game];
    const gEntry = gList.find(x => x.nickname.toLowerCase() === socket.nickname.toLowerCase());
    if (gEntry) {
      if (cleanScore > gEntry.score) gEntry.score = cleanScore;
    } else {
      gList.push({ nickname: socket.nickname, score: cleanScore });
    }
    db.minigameRecords[game] = gList.sort((a, b) => b.score - a.score).slice(0, 10);
    saveDB();
    io.emit('minigameRecordsData', db.minigameRecords);
  });

  // === АВТОПЕРЕКЛАД ПОВІДОМЛЕНЬ (МУЛЬТИМОВНИЙ, GOOGLE + MYMEMORY З ВИПРАВЛЕННЯМ RU->UK) ===
  socket.on('translateMsg', async ({ id, text, targetLang }) => {
    if (!id || !text || typeof text !== 'string') return;
    const clean = text.trim().slice(0, 500);
    if (!clean) return;
    const TRANSLATE_LANGS = {
      uk: 'Ukrainian',
      en: 'English',
      ru: 'Russian',
      be: 'Belarusian',
      kk: 'Kazakh',
      az: 'Azerbaijani',
      ka: 'Georgian',
      hy: 'Armenian',
      ro: 'Romanian',
      uz: 'Uzbek',
      ar: 'Arabic',
      pl: 'Polish',
      de: 'German',
      es: 'Spanish',
      fr: 'French',
      it: 'Italian',
      tr: 'Turkish',
      pt: 'Portuguese',
      cs: 'Czech',
      ja: 'Japanese'
    };
    const lang = TRANSLATE_LANGS[targetLang] ? targetLang : 'uk';
    const cacheKey = `${lang}:${clean}`;
    if (translateCache.has(cacheKey)) {
      return socket.emit('msgTranslated', { id, translatedText: translateCache.get(cacheKey), targetLang: lang });
    }

    const now = Date.now();
    if (socket.lastTranslateAt && now - socket.lastTranslateAt < 2000) {
      return socket.emit('msgTranslated', {
        id,
        translatedText: '⏳ Зачекайте 2 секунди перед наступним перекладом...',
        targetLang: lang,
        rateLimited: true
      });
    }
    socket.lastTranslateAt = now;

    const normCmp = (s) => String(s || '').toLowerCase().replace(/[^a-zа-яіїєґёъыэ0-9]/g, '');
    const isSameText = (a, b) => normCmp(a) && normCmp(a) === normCmp(b);

    async function callGoogleTranslate(sl, tl) {
      try {
        const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(clean)}`;
        const gr = await fetch(gUrl, { signal: AbortSignal.timeout(4500) });
        if (!gr.ok) return { text: '', detected: '' };
        const gData = await gr.json();
        const joined = (Array.isArray(gData) && Array.isArray(gData[0]))
          ? gData[0].map(part => (Array.isArray(part) && part[0]) ? String(part[0]) : '').join('').trim()
          : '';
        const detected = (gData && typeof gData[2] === 'string') ? gData[2] : '';
        return { text: joined, detected };
      } catch (e) {
        return { text: '', detected: '' };
      }
    }

    let translated = '';
    const hasCyrillic = /[а-яА-ЯіІїЇєЄґҐёЁъыэЪЫЭ]/.test(clean);
    const hasUaSpecific = /[іїєґІЇЄҐ]/.test(clean);
    const gAuto = await callGoogleTranslate('auto', lang);
    translated = gAuto.text;

    // Якщо Google auto помилково прийняв російський текст за український або повернув незмінений рядок — форсуємо sl=ru
    if ((lang === 'uk' || lang === 'be' || lang === 'kk') && hasCyrillic && !hasUaSpecific && (!translated || isSameText(translated, clean) || gAuto.detected === lang)) {
      const gRu = await callGoogleTranslate('ru', lang);
      if (gRu.text && !isSameText(gRu.text, clean)) {
        translated = gRu.text;
      }
    } else if (lang === 'ru' && hasUaSpecific && (!translated || isSameText(translated, clean))) {
      const gUk = await callGoogleTranslate('uk', 'ru');
      if (gUk.text && !isSameText(gUk.text, clean)) {
        translated = gUk.text;
      }
    }

    // 2. Безкоштовний MyMemory API (запасний варіант або якщо Google повернув оригінал)
    if (!translated || isSameText(translated, clean)) {
      try {
        const hasArabic = /[\u0600-\u06FF]/.test(clean);
        const srcLang = hasArabic
          ? (lang === 'ar' ? 'en' : 'ar')
          : (hasCyrillic ? (lang === 'ru' ? 'uk' : 'ru') : (lang === 'en' ? 'pl' : 'en'));
        if (srcLang !== lang) {
          const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${srcLang}|${lang}`;
          const r = await fetch(url, { signal: AbortSignal.timeout(4500) });
          if (r.ok) {
            const data = await r.json();
            const candidate = data?.responseData?.translatedText;
            if (candidate && !String(candidate).includes('MYMEMORY WARNING') && !isSameText(candidate, clean)) {
              translated = String(candidate).trim();
            }
          }
        }
      } catch (e) {}
    }

    // 3. Gemini AI — крайній резерв
    if ((!translated || isSameText(translated, clean)) && ai) {
      try {
        const langName = TRANSLATE_LANGS[lang];
        const resp = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Translate this short game chat message accurately into ${langName}. Return ONLY the translated text without quotes or explanations:\n${clean}`
        });
        if (resp && resp.text) translated = resp.text.trim();
      } catch (e) {}
    }

    if (!translated) translated = clean;
    if (translateCache.size >= 500) {
      const firstKey = translateCache.keys().next().value;
      if (firstKey) translateCache.delete(firstKey);
    }
    translateCache.set(cacheKey, translated);
    socket.emit('msgTranslated', { id, translatedText: translated, targetLang: lang });
  });

  socket.on('getLeaderboard', (period) => {
    const today = getTodayDateString();
    const todaySet = getTodayTop100Set();
    const allTimeSet = getAllTimeTop100Set();
    let list = Object.values(db.players).filter(p => !p.banned);
    list.forEach(ensurePlayerFields);

    if (period === 'today') {
      list = list
        .filter(p => p.dailyStats && p.dailyStats.date === today && (p.dailyStats.authority > 0 || p.dailyStats.xp > 0))
        .sort((a, b) => (b.dailyStats.authority - a.dailyStats.authority) || (b.dailyStats.xp - a.dailyStats.xp));
    } else {
      list = list.sort((a, b) => (b.authority - a.authority) || (b.wins - a.wins));
    }

    list = list.slice(0, 100).map(p => ({
      nickname: p.nickname,
      avatar: p.avatar,
      equippedFrame: p.equippedFrame || '',
      avatarBorderColor: p.avatarBorderColor || '#f4a261',
      authority: period === 'today' ? p.dailyStats.authority : p.authority,
      wins: period === 'today' ? p.dailyStats.wins : p.wins,
      level: p.level,
      coins: p.coins,
      badgeType: getBadgeType(p, todaySet, allTimeSet)
    }));
    socket.emit('leaderboardData', { period, list });
  });

  socket.on('disconnect', () => {
    const nickLower = socket.nickname ? socket.nickname.toLowerCase() : '';
    const roomId = socket.currentRoomId;
    socket.currentRoomId = null;
    if (nickLower) {
      setTimeout(() => refreshOnlineUserEntry(nickLower), 20);
    }
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      if (room.status === 'waiting') {
        const stillInRoomViaOtherTab = nickLower && Array.from(io.sockets.sockets.values())
          .some(s => s && s.connected && s.id !== socket.id && s.nickname && s.nickname.toLowerCase() === nickLower && s.currentRoomId === roomId);
        if (!stillInRoomViaOtherTab) {
          room.players = room.players.filter(p => !p.nickname || p.nickname.toLowerCase() !== nickLower);
          checkLobbyCountdown(room);
        }
      } else if (room.status === 'playing' && socket.nickname) {
        const pInRoom = room.players.find(p => p.nickname && p.nickname.toLowerCase() === nickLower);
        if (pInRoom && pInRoom.alive && !pInRoom.isSpectator) {
          schedulePlayerDisconnectPenalty(roomId, socket.nickname, socket.isGuest);
        } else if (pInRoom && pInRoom.isSpectator) {
          room.players = room.players.filter(p => !p.nickname || p.nickname.toLowerCase() !== nickLower);
        }
      }
      if (!hasActiveHumansInRoom(room, socket.id)) {
        scheduleEmptyRoomCleanup(roomId, socket.id);
      } else {
        broadcastRoomState(room);
      }
      io.emit('roomsUpdated', getPublicRoomsList());
    }
  });
});

const { GoogleGenAI } = require('@google/genai');

const geminiApiKey = process.env.GEMINI_API_KEY || '';
let ai = null;
if (geminiApiKey && geminiApiKey !== 'ВАШ_API_КЛЮЧ_З_AI_STUDIO') {
  try {
    ai = new GoogleGenAI({ apiKey: geminiApiKey });
  } catch (e) {
    console.warn('Помилка ініціалізації Gemini SDK:', e.message);
  }
}

async function askBot(gameContext, playerMessage, role = 'мирний житель') {
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Ти граєш у гру "Мафія". Твоя роль: ${role}.
Контекст гри: ${gameContext}.
Гравець написав у чат: "${playerMessage}".
Відповідай коротко (1-2 речення), як живий гравець у чаті, українською мовою.`,
      });
      if (response && response.text) return response.text.trim();
    } catch (error) {
      console.error('Помилка Gemini API:', error.message);
    }
  }
  const fallbackReplies = [
    'Я мирний житель! Давайте краще аналізувати нічні події, а не сперечатись без фактів.',
    'Хм, підозріло це звучить. Хто вночі мав можливість діяти?',
    'Не поспішаймо виганяти своїх, мафія тільки й чекає на нашу помилку.',
    'Я голосуватиму тільки за чіткими доказами. Шериф, є що сказати?',
    'Уважно стежте за голосами, саме там мафія себе видає.'
  ];
  return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер Mafia Online успішно запущено: http://0.0.0.0:${PORT}`);
});
