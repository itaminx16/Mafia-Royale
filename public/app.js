const socket = io();

function escapeHTML(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

// === ЗВУКОВА СИСТЕМА (WEB AUDIO API) ТА НАЛАШТУВАННЯ ===
let soundEnabled = localStorage.getItem('mafia_sound_enabled') !== 'false';
let soundVolume = parseFloat(localStorage.getItem('mafia_sound_volume') || '0.7');
let chatFontSize = localStorage.getItem('mafia_chat_font_size') || '13';
let chatStyle = localStorage.getItem('mafia_chat_style') || 'bubbles';
let animEnabled = localStorage.getItem('mafia_anim_enabled') !== 'false';
let profanityEnabled = localStorage.getItem('mafia_profanity_enabled') !== 'false';
let customBadWords = [];
try {
  const savedBW = JSON.parse(localStorage.getItem('mafia_custom_bad_words') || '[]');
  if (Array.isArray(savedBW)) customBadWords = savedBW;
} catch (e) {}

const BUILTIN_BAD_ROOTS = [
  'хуй', 'хуя', 'хує', 'пизд', 'пізд', 'бляд', 'блять', 'бля', 'сука', 'сучк',
  'їба', 'єба', 'еба', 'уеб', 'залуп', 'мудак', 'дебіл', 'долбо', 'гандон', 'шлюх',
  'курв', 'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'whore', 'slut', 'kurwa', 'dick'
];

function normalizeForProfanityClient(str) {
  const map = { a: 'а', e: 'е', i: 'і', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у', k: 'к', m: 'м', t: 'т', b: 'в', '0': 'о', '3': 'з', '@': 'а' };
  return String(str || '').toLowerCase()
    .replace(/&(amp|lt|gt|quot|#39);/g, '')
    .split('').map(ch => map[ch] || ch).join('')
    .replace(/[._\-*!?,/\\|]+/g, '')
    .replace(/(.)\1{2,}/g, '$1');
}

function applyProfanityFilter(safeText) {
  const str = String(safeText || '');
  if (!profanityEnabled) return str;
  const allRoots = BUILTIN_BAD_ROOTS.concat(customBadWords.map(w => normalizeForProfanityClient(w)).filter(Boolean));
  if (allRoots.length === 0) return str;
  return str.split(/(\s+)/).map(tok => {
    if (!tok.trim()) return tok;
    const norm = normalizeForProfanityClient(tok);
    if (norm.length >= 2 && allRoots.some(r => r && norm.includes(r))) return '***';
    return tok;
  }).join('');
}

function applyFontSize(sizeKey) {
  const pxMap = { '11': '11px', '13': '13px', '15': '16px', '17': '19px' };
  const validKey = pxMap[String(sizeKey)] ? String(sizeKey) : '13';
  const cssPx = pxMap[validKey];
  chatFontSize = validKey;
  document.documentElement.style.setProperty('--chat-font-size', cssPx);
  if (document.body) {
    document.body.dataset.fontSize = validKey;
    document.body.classList.toggle('chat-style-classic', chatStyle === 'classic');
  }
  const prev = document.getElementById('fontSizeLivePreview');
  if (prev) prev.style.fontSize = cssPx;
  localStorage.setItem('mafia_chat_font_size', validKey);
}

try {
  applyFontSize(chatFontSize);
} catch (e) {}

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq, type, duration, vol = 0.3) {
  if (!soundEnabled || soundVolume <= 0) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    const masterVol = soundVolume * vol;
    gain.gain.setValueAtTime(masterVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function sfxClick() {
  playTone(800, 'sine', 0.05, 0.15);
}

function sfxNewMsg() {
  playTone(587, 'sine', 0.08, 0.2);
  setTimeout(() => playTone(880, 'sine', 0.1, 0.2), 60);
}

function sfxNight() {
  playTone(220, 'sine', 0.7, 0.25);
  setTimeout(() => playTone(180, 'sine', 1.0, 0.3), 150);
}

function sfxDay() {
  playTone(523, 'triangle', 0.18, 0.25);
  setTimeout(() => playTone(659, 'triangle', 0.18, 0.25), 100);
  setTimeout(() => playTone(784, 'triangle', 0.3, 0.3), 200);
}

function sfxVote() {
  playTone(320, 'square', 0.12, 0.2);
  setTimeout(() => playTone(240, 'square', 0.18, 0.2), 80);
}
function sfxTimerTick() {
  if (!soundEnabled) return;
  playTone(760, 'sine', 0.045, 0.045);
}

function sfxWin() {
  const notes = [440, 554, 659, 880];
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 'sine', 0.35, 0.35), idx * 110);
  });
}

function sfxLose() {
  const notes = [440, 392, 330, 261];
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 'sawtooth', 0.3, 0.25), idx * 150);
  });
}

function sfxGiftChime() {
  [660, 880, 1175].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.16, 0.25), i * 70));
}
function sfxGiftToast() {
  [523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 'triangle', 0.2, 0.25), i * 90));
}
function sfxGiftExplosion() {
  playTone(130, 'sawtooth', 0.25, 0.32);
  setTimeout(() => playTone(90, 'square', 0.32, 0.26), 70);
}
function sfxGiftRare() {
  [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => playTone(f, 'triangle', 0.28, 0.3), i * 75));
}
function playGiftSound(soundType) {
  if (soundType === 'rare') sfxGiftRare();
  else if (soundType === 'explosion') sfxGiftExplosion();
  else if (soundType === 'toast') sfxGiftToast();
  else sfxGiftChime();
}

let lastPlayedPhase = null;
function handlePhaseSound(phase) {
  if (phase === lastPlayedPhase) return;
  lastPlayedPhase = phase;
  if (phase === 'night_chat' || phase === 'night_vote') sfxNight();
  else if (phase === 'day_chat') sfxDay();
  else if (phase === 'day_vote') sfxVote();
}

const AVATAR_SLOTS = [
  { id: 1, title: 'Дон Мафії', titleEn: 'Mafia Don', file: '/avatars/avatar1.png' },
  { id: 2, title: 'Шериф', titleEn: 'Sheriff', file: '/avatars/avatar2.png' },
  { id: 3, title: 'Коханка', titleEn: 'Escort', file: '/avatars/avatar3.png' },
  { id: 4, title: 'Лікар', titleEn: 'Doctor', file: '/avatars/avatar4.png' },
  { id: 5, title: 'Джокер', titleEn: 'Jester', file: '/avatars/avatar5.png' },
  { id: 6, title: 'Мафіозі', titleEn: 'Mafioso', file: '/avatars/avatar6.png' },
  { id: 7, title: 'Мирний житель', titleEn: 'Citizen', file: '/avatars/avatar7.png' },
  { id: 8, title: 'Репортер', titleEn: 'Journalist', file: '/avatars/avatar8.png' },
  { id: 9, title: 'Охоронець', titleEn: 'Bodyguard', file: '/avatars/avatar9.png' },
  { id: 10, title: 'Месник', titleEn: 'Vigilante', file: '/avatars/avatar10.png' },
  { id: 11, title: 'Шантажист', titleEn: 'Blackmailer', file: '/avatars/avatar11.png' },
  { id: 12, title: 'Адвокат', titleEn: 'Framer', file: '/avatars/avatar12.png' },
  { id: 13, title: 'Консильєре', titleEn: 'Consigliere', file: '/avatars/avatar13.png' },
  { id: 14, title: 'Мер міста', titleEn: 'Mayor', file: '/avatars/avatar14.png' },
  { id: 15, title: 'Амнезіак', titleEn: 'Amnesiac', file: '/avatars/avatar15.png' },
  { id: 16, title: 'Медіум', titleEn: 'Medium', file: '/avatars/avatar16.png' },
  { id: 17, title: 'Лідер Культу', titleEn: 'Cult Leader', file: '/avatars/avatar17.png' },
  { id: 18, title: 'Янгол-Охоронець', titleEn: 'Guardian Angel', file: '/avatars/avatar18.png' },
  { id: 19, title: 'Тюремник', titleEn: 'Jailor', file: '/avatars/avatar19.png' }
];

let editAvatarData = 'SLOT:1';
let currentUser = null;
let currentBadgeType = null;
let currentLevelInfo = { level: 1, currentLevelMinXp: 0, nextLevelXp: 60 };
let isDevAdmin = false;
let staffRole = 'player';
let allRoles = {};
let shopItemsList = [];
let botCatalogList = [];
let unreadIdeasCount = 0;
let famSearchQuery = '';
let famSortMode = 'rating';
let selectedBotsToHire = new Set();
let latestRoomsList = [];
let currentLang = window.currentLang || localStorage.getItem('mafia_lang') || 'ua';
const L = (ua, en) => (currentLang === 'en' ? en : ua);
const trSrv = (s) => (typeof window.localizeServerText === 'function' ? window.localizeServerText(s) : s);
let currentServerRegion = 'UA';
let selectedRoleIds = new Set(['citizen', 'mafioso', 'sheriff', 'doctor']);
let previousScreenBeforeMod = 'mainMenuScreen';
let activePmFriend = null;
let authMode = 'login';
let activePublicProfileNick = null;
let currentRoomNewsList = [];
let currentFamilyData = null;
let latestFamiliesList = [];
let cachedFriendsList = [];
let cachedFriendReqsList = [];
let cachedDevPosts = [];
let activeShopCategory = 'all';
let appServerConfig = { googleClientId: '', donationUrl: '' };
let msgSeqCounter = 0;
const msgRawTextMap = new Map();
let lastRoomSnapshot = null;
let activeRoomId = null;
let initializedGameRoomId = null;
let pendingTranslateMsgId = null;
let cachedUnreadMsgs = 0;
let cachedFriendReqs = 0;
let editAvatarBorderColor = '#f4a261';
let latestAppVersion = '1.2.2';
let latestReleaseNotes = null;

function updateVersionBadgesUI() {
  const vTxt = 'v' + (latestAppVersion || '1.2.0');
  ['appVersionBadge', 'authVersionBtn', 'settingsVersionBadge'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = vTxt;
  });
}

function openUpdateChangelogModal(force = false) {
  if (!latestReleaseNotes) return;
  const ver = latestReleaseNotes.version || latestAppVersion || '1.2.0';
  if (!force && localStorage.getItem('mafia_seen_version') === ver) return;

  const badgeEl = document.getElementById('changelogVersionBadge');
  const dateEl = document.getElementById('changelogDate');
  const titleEl = document.getElementById('changelogTitle');
  const listEl = document.getElementById('changelogItemsList');
  const modal = document.getElementById('updateChangelogModal');
  if (!modal || !listEl) return;

  if (badgeEl) badgeEl.innerText = 'v' + ver;
  if (dateEl) dateEl.innerText = latestReleaseNotes.date || '';
  if (titleEl) {
    titleEl.innerText = (currentLang === 'en' && latestReleaseNotes.titleEn)
      ? latestReleaseNotes.titleEn
      : (latestReleaseNotes.titleUa || L('Що нового в оновленні', "What's New in This Update"));
  }
  const items = (currentLang === 'en' && Array.isArray(latestReleaseNotes.itemsEn))
    ? latestReleaseNotes.itemsEn
    : (Array.isArray(latestReleaseNotes.itemsUa) ? latestReleaseNotes.itemsUa : []);
  listEl.innerHTML = items.map(it => '<li>' + escapeHTML(it) + '</li>').join('');
  modal.classList.add('open');
}

function buildAvatarRingStyle(borderColor) {
  const safeColor = (typeof borderColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(borderColor.trim()))
    ? borderColor.trim()
    : '#f4a261';
  return `--avatar-ring:${safeColor};`;
}

function applyAvatarRingAndFrame(el, baseClass, frameCls, borderColor) {
  if (!el) return;
  const safeFrame = (typeof frameCls === 'string' && /^frame_[a-z0-9_]+$/i.test(frameCls)) ? frameCls : '';
  el.className = baseClass + (safeFrame ? ' ' + safeFrame : '');
  const safeColor = (typeof borderColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(borderColor.trim()))
    ? borderColor.trim()
    : '#f4a261';
  el.style.setProperty('--avatar-ring', safeColor);
}

fetch('/api/config')
  .then(r => r.ok ? r.json() : {})
  .then(cfg => {
    appServerConfig = { googleClientId: cfg.googleClientId || '', donationUrl: cfg.donationUrl || '' };
    if (cfg.appVersion) latestAppVersion = cfg.appVersion;
    if (cfg.releaseNotes) latestReleaseNotes = cfg.releaseNotes;
    updateVersionBadgesUI();
    if (authMode === 'email' && typeof mountGoogleSignInButton === 'function') mountGoogleSignInButton();
  })
  .catch(() => {});

const urlParams = new URLSearchParams(window.location.search);
let pendingInviteRoomId = urlParams.get('join') || urlParams.get('room') || null;
const urlRefCode = urlParams.get('ref') || '';

function updateMainMenuSocialBadge() {
  const navBadge = document.getElementById('friendsUnreadBadge');
  if (!navBadge) return;
  const parts = [];
  if (cachedFriendReqs > 0) parts.push('+' + cachedFriendReqs + ' ' + L('заявка', 'req'));
  if (cachedUnreadMsgs > 0) parts.push('+' + cachedUnreadMsgs + ' ' + L('СМС', 'DM'));
  navBadge.innerHTML = parts.length > 0
    ? '<span class="unread-pill">' + parts.join(' • ') + '</span>'
    : '›';
}

function getGenderLabel(g) {
  if (g === 'male') return L('👨 Чоловік', '👨 Male');
  if (g === 'female') return L('👩 Жінка', '👩 Female');
  return L('🎭 Інше', '🎭 Other');
}

function getGenderIcon(g) {
  if (g === 'male') return '👨';
  if (g === 'female') return '👩';
  return '🎭';
}

function getTeamLabel(team) {
  if (team === 'mafia') return L('Мафія', 'Mafia');
  if (team === 'town') return L('Мирні', 'Town');
  if (team === 'cult') return L('Культ', 'Cult');
  return L('Нейтрал', 'Neutral');
}

function checkKyivHappyHourClient() {
  try {
    const kyivHour = Number(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Kyiv',
      hour: '2-digit',
      hour12: false
    }).format(new Date()));
    const isHappy = (kyivHour >= 6 && kyivHour < 9) || (kyivHour >= 18 && kyivHour < 21);
    const banner = document.getElementById('happyHourBanner');
    if (banner) banner.style.display = isHappy ? 'block' : 'none';
  } catch (e) {}
}

function compressImageFile(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 160, 160);
      callback(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function buildAvatarHTML(avatarValue) {
  if (avatarValue && avatarValue.startsWith('SLOT:')) {
    const parts = avatarValue.split(':');
    const slotNum = parts[1] || '1';
    return '<img src="/avatars/avatar' + slotNum + '.png" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">' +
           '<div style="display:none; flex-direction:column; align-items:center;"><span>AI #' + slotNum + '</span></div>';
  }
  if (avatarValue && avatarValue.startsWith('data:image')) {
    return '<img src="' + avatarValue + '">';
  }
  return '<span>AI #1</span>';
}

function buildBadgeHTML(badgeType) {
  if (!badgeType) return '';
  const cls = badgeType === 'copper'
    ? 'badge-100 copper'
    : (badgeType === 'silver' ? 'badge-100 silver' : 'badge-100');
  return '<span class="' + cls + '" onclick="openBadgeModal(\'' + badgeType + '\')">100</span>';
}

function initAvatarFrames(containerId, onSelect) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';

  AVATAR_SLOTS.forEach((slot, index) => {
    const isSel = editAvatarData === ('SLOT:' + slot.id) || (!AVATAR_SLOTS.some(s => ('SLOT:' + s.id) === editAvatarData) && index === 0);
    const slotTitle = (currentLang === 'en' && slot.titleEn) ? slot.titleEn : slot.title;
    const div = document.createElement('div');
    div.className = 'avatar-slot' + (isSel ? ' selected' : '');
    div.innerHTML =
      '<div class="avatar-frame">' +
        '<img src="' + slot.file + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">' +
        '<div style="display:none; flex-direction:column; align-items:center;">' +
          '<span class="placeholder-icon">+AI #' + slot.id + '</span>' +
          '<span class="placeholder-sub">' + L('Слот фото', 'Photo slot') + '</span>' +
        '</div>' +
      '</div>' +
      '<span class="avatar-label">' + escapeHTML(slotTitle) + '</span>';

    div.addEventListener('click', () => {
      grid.querySelectorAll('.avatar-slot').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      onSelect('SLOT:' + slot.id);
    });
    grid.appendChild(div);
  });
}

function openTab(tabId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(tabId);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
}

window.openPlayerProfileCard = function(nick) {
  if (!nick) return;
  socket.emit('getPlayerProfile', nick);
};

function showGiftVisualEffect(targetNick, gift, soundType) {
  if (!gift) return;
  const icon = (typeof gift === 'object' ? gift.icon : gift) || '🎁';
  const rawName = (typeof gift === 'object' ? (currentLang === 'en' && gift.nameEn ? gift.nameEn : trSrv(gift.name)) : L('Подарунок', 'Gift')) || L('Подарунок', 'Gift');
  const from = (typeof gift === 'object' && gift.from) ? trSrv(gift.from) : L('Таємний шанувальник', 'Secret Admirer');
  const isRare = !!(typeof gift === 'object' && gift.rare);

  const overlay = document.createElement('div');
  overlay.className = 'gift-fx-overlay';
  overlay.innerHTML = `<div class="gift-fx-banner${isRare ? ' rare' : ''}"><span>${icon}</span><span><b>${escapeHTML(from)}</b> ➔ <b>${escapeHTML(targetNick)}</b>: ${escapeHTML(rawName)}</span></div>`;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2900);

  if (animEnabled) {
    const particleCount = isRare ? 16 : 10;
    const cx = window.innerWidth / 2;
    const cy = Math.min(220, window.innerHeight * 0.3);
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'gift-fx-particle';
      p.textContent = (i % 3 === 0 && isRare) ? '✨' : icon;
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.4 - 0.2);
      const dist = 65 + Math.random() * 110;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--tx', Math.round(Math.cos(angle) * dist) + 'px');
      p.style.setProperty('--ty', Math.round(Math.sin(angle) * dist - 25) + 'px');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1750);
    }

    document.querySelectorAll('#insidePlayersList .compact-seat').forEach(seat => {
      if (seat.dataset.nick && seat.dataset.nick.toLowerCase() === String(targetNick || '').toLowerCase()) {
        seat.classList.remove('seat-gift-pulse');
        void seat.offsetWidth;
        seat.classList.add('seat-gift-pulse');
      }
    });
  }
}

function playGunshotSound() {
  if (!soundEnabled || soundVolume <= 0) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const dur = 0.22;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * dur), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.045));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0.01, soundVolume * 0.36), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + dur);

    // Low punch thump
    const osc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.14);
    punchGain.gain.setValueAtTime(Math.max(0.01, soundVolume * 0.32), ctx.currentTime);
    punchGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
    osc.connect(punchGain);
    punchGain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

function playDeathFxSound(fxId) {
  if (!soundEnabled || soundVolume <= 0) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const toneAt = (freqStart, freqEnd, type, delay, dur, peak) => {
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freqStart, t0);
      if (freqEnd && freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
      }
      g.gain.setValueAtTime(Math.max(0.001, soundVolume * (peak || 0.22)), t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    };
    if (fxId === 'fx_bullet') {
      playGunshotSound();
    } else if (fxId === 'fx_glass') {
      toneAt(1400, 620, 'triangle', 0, 0.12, 0.22);
      toneAt(1850, 940, 'sine', 0.06, 0.14, 0.2);
      toneAt(1100, 480, 'triangle', 0.12, 0.18, 0.18);
    } else if (fxId === 'fx_spotlight') {
      toneAt(580, 780, 'sine', 0, 0.25, 0.18);
      toneAt(780, 520, 'sine', 0.25, 0.25, 0.18);
    } else if (fxId === 'fx_noir_rain') {
      toneAt(130, 52, 'sawtooth', 0, 0.55, 0.24);
      toneAt(95, 45, 'sine', 0.12, 0.65, 0.22);
    } else if (fxId === 'fx_blood_rose') {
      toneAt(329.6, 311.1, 'triangle', 0, 0.28, 0.2);
      toneAt(261.6, 220, 'triangle', 0.18, 0.38, 0.2);
    } else if (fxId === 'fx_gold_dust') {
      toneAt(587.3, 880, 'sine', 0, 0.2, 0.2);
      toneAt(880, 1174.6, 'triangle', 0.12, 0.32, 0.2);
    } else {
      playGunshotSound();
    }
  } catch (e) {}
}

function playDeathEffectVisual(data) {
  if (!data || !data.nickname) return;
  const fxId = data.deathEffect || 'default';
  playDeathFxSound(fxId);

  const FX_META = {
    fx_bullet: { cls: 'death-fx-bullet', icon: '🔫', title: L('Фатальний постріл', 'Fatal Shot') },
    fx_glass: { cls: 'death-fx-glass', icon: '💥', title: L('Розбите скло', 'Shattered Glass') },
    fx_spotlight: { cls: 'death-fx-spotlight', icon: '🔦', title: L('Прожектор затримання', 'Arrest Spotlight') },
    fx_noir_rain: { cls: 'death-fx-rain', icon: '🌧️', title: L('Нуарна злива', 'Noir Downpour') },
    fx_blood_rose: { cls: 'death-fx-rose', icon: '🥀', title: L('Пелюстки нуару', 'Noir Petals') },
    fx_gold_dust: { cls: 'death-fx-gold', icon: '✨', title: L('Золотий попіл', 'Golden Ash') },
    default: { cls: 'death-fx-default', icon: '💀', title: L('Гравець вибув', 'Player Eliminated') }
  };
  const meta = FX_META[fxId] || FX_META.default;

  document.querySelectorAll('.death-fx-overlay').forEach(el => el.remove());

  const overlay = document.createElement('div');
  overlay.className = 'death-fx-overlay ' + meta.cls;

  if (animEnabled) {
    if (fxId === 'fx_bullet') {
      [[28, 30], [72, 24], [64, 70]].forEach(([x, y], i) => {
        const hole = document.createElement('div');
        hole.className = 'death-fx-bullet-hole';
        hole.style.left = x + '%';
        hole.style.top = y + '%';
        hole.style.animationDelay = (i * 0.11) + 's';
        overlay.appendChild(hole);
      });
    } else if (fxId === 'fx_glass') {
      for (let i = 0; i < 16; i++) {
        const sh = document.createElement('div');
        sh.className = 'death-fx-glass-shard';
        sh.style.left = (35 + Math.random() * 30) + '%';
        sh.style.top = (35 + Math.random() * 25) + '%';
        const ang = (Math.PI * 2 * i) / 16;
        const dist = 110 + Math.random() * 140;
        sh.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
        sh.style.setProperty('--dy', Math.round(Math.sin(ang) * dist) + 'px');
        overlay.appendChild(sh);
      }
    } else if (fxId === 'fx_spotlight') {
      const b1 = document.createElement('div'); b1.className = 'death-fx-beam blue';
      const b2 = document.createElement('div'); b2.className = 'death-fx-beam red';
      overlay.appendChild(b1); overlay.appendChild(b2);
    } else if (fxId === 'fx_noir_rain') {
      for (let i = 0; i < 24; i++) {
        const drop = document.createElement('div');
        drop.className = 'death-fx-raindrop';
        drop.style.left = Math.round(Math.random() * 100) + '%';
        drop.style.animationDelay = (Math.random() * 0.7).toFixed(2) + 's';
        drop.style.animationDuration = (0.55 + Math.random() * 0.5).toFixed(2) + 's';
        overlay.appendChild(drop);
      }
    } else if (fxId === 'fx_blood_rose' || fxId === 'fx_gold_dust') {
      const isRose = fxId === 'fx_blood_rose';
      for (let i = 0; i < 18; i++) {
        const pt = document.createElement('div');
        pt.className = 'death-fx-particle ' + (isRose ? 'death-fx-rose-petal' : 'death-fx-gold-dust');
        pt.textContent = isRose ? (i % 3 === 0 ? '🥀' : '🌹') : (i % 2 === 0 ? '✨' : '🪙');
        pt.style.left = (isRose ? Math.random() * 94 : (25 + Math.random() * 50)) + '%';
        pt.style.top = (isRose ? (-5 + Math.random() * 15) : (40 + Math.random() * 35)) + '%';
        pt.style.setProperty('--dx', Math.round((Math.random() - 0.5) * 140) + 'px');
        pt.style.setProperty('--dy', Math.round(-90 - Math.random() * 140) + 'px');
        pt.style.animationDelay = (Math.random() * 0.45).toFixed(2) + 's';
        overlay.appendChild(pt);
      }
    }

    document.querySelectorAll('#insidePlayersList .compact-seat').forEach(seat => {
      if (seat.dataset.nick && seat.dataset.nick.toLowerCase() === String(data.nickname).toLowerCase()) {
        seat.classList.remove('seat-death-shake');
        void seat.offsetWidth;
        seat.classList.add('seat-death-shake');
      }
    });
  }

  const reasonTxt = data.reason === 'vote'
    ? L('Вигнано голосуванням міста', 'Exiled by town vote')
    : (data.reason === 'preview' ? L('Демонстрація ефекту', 'Effect preview') : L('Загинув цієї ночі', 'Eliminated tonight'));
  const roleLabel = data.roleName
    ? (typeof window.localizeRoleName === 'function' ? window.localizeRoleName(trSrv(data.roleName)) : data.roleName)
    : '';
  const banner = document.createElement('div');
  banner.className = 'death-fx-banner';
  banner.innerHTML = `
    <div class="death-fx-banner-icon">${meta.icon}</div>
    <div class="death-fx-banner-title">${escapeHTML(data.nickname)}</div>
    <div class="death-fx-banner-sub">${escapeHTML(reasonTxt)}${roleLabel ? ` • <b>${escapeHTML(roleLabel)}</b>` : ''}</div>
  `;
  overlay.appendChild(banner);
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2950);
}

window.mentionPlayerInChat = function(nick) {
  if (!nick) return;
  const activeScr = document.querySelector('.screen.active');
  let inputEl = null;
  if (activeScr && activeScr.id === 'lobbyScreen') {
    inputEl = document.getElementById('lobbyMsgInput');
  } else if (activeScr && activeScr.id === 'roomScreen') {
    const lwBox = document.getElementById('lastWillBox');
    const lwInput = document.getElementById('lastWillInput');
    if (lwBox && lwBox.style.display !== 'none' && lwInput && !lwInput.disabled) {
      inputEl = lwInput;
    } else {
      inputEl = document.getElementById('roomMsgInput');
    }
  } else if (activeScr && activeScr.id === 'globalChatScreen') {
    inputEl = document.getElementById('globalMsgInput');
  }
  if (!inputEl || inputEl.disabled) return;
  const cur = inputEl.value;
  const prefix = cur.trim().length === 0 ? (nick + ', ') : (cur.trimEnd() + ' ' + nick + ', ');
  inputEl.value = prefix;
  inputEl.focus();
};

let lastRevealedRoleKey = null;
function openRoleRevealModal(roleId) {
  const roleObj = roleId ? allRoles[roleId] : null;
  if (!roleObj) return;
  const modal = document.getElementById('roleRevealModal');
  if (!modal) return;
  const imgWrap = document.getElementById('roleRevealImgWrap');
  const titleEl = document.getElementById('roleRevealTitle');
  const teamEl = document.getElementById('roleRevealTeam');
  const descEl = document.getElementById('roleRevealDesc');

  if (imgWrap) {
    imgWrap.innerHTML = `<img src="/roles_avatars/${roleId}.png" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'; this.parentElement.innerText='${roleObj.actionIcon || '🎭'}';">`;
  }
  if (titleEl) titleEl.innerText = roleObj.names[currentLang] || roleId;
  if (teamEl) {
    teamEl.innerText = L('Команда: ', 'Team: ') + getTeamLabel(roleObj.team);
    teamEl.style.color = roleObj.team === 'mafia' ? '#ff6b6b' : (roleObj.team === 'town' ? '#80ffdb' : '#ffd166');
  }
  if (descEl) {
    descEl.innerText = (currentLang === 'en' && roleObj.descEn)
      ? roleObj.descEn
      : (roleObj.desc || L('Використовуйте свої здібності, щоб привести команду до перемоги!', 'Use your abilities to lead your team to victory!'));
  }
  modal.classList.add('open');
}

window.openBadgeModal = function(type) {
  const titleEl = document.getElementById('badgeModalTitle');
  const descEl = document.getElementById('badgeModalDesc');
  if (type === 'copper') {
    titleEl.innerText = L('🥉 Мідний значок 100 (Топ-100 дня)', '🥉 Copper Badge 100 (Daily Top-100)');
    descEl.innerHTML = L(
      'Видається гравцям, які увійшли до <b>Топ-100 за сьогоднішній день</b> за заробленим авторитетом та активністю в матчах!',
      'Awarded to players who entered <b>Today\'s Top-100</b> leaderboard by earned authority and match activity!'
    );
  } else if (type === 'silver') {
    titleEl.innerText = L('🥈 Срібний значок 100 (Зал слави Топ-100)', '🥈 Silver Badge 100 (All-Time Top-100)');
    descEl.innerHTML = L(
      'Елітний значок для гравців, які входять до <b>загального рейтингу Топ-100</b> найкращих гравців Мафії за весь час!',
      'Elite badge for players ranked in the <b>All-Time Top-100</b> Mafia leaderboard!'
    );
  } else {
    titleEl.innerText = L('🏅 Золотий значок 100 (Безстроковий)', '🏅 Golden Badge 100 (Permanent)');
    descEl.innerHTML = L(
      'Легендарний <b>безстроковий значок 100</b> для перших і найдосвідченіших гравців Мафії!<br><br>⚠️ <i>Правило активності:</i> якщо акаунт неактивний понад <b>6 місяців (180 днів)</b>, золотий значок знімається й передається одному з активних лідерів <b>Топ-100</b>.',
      'Legendary <b>permanent 100 badge</b> for pioneers and top veterans of Mafia!<br><br>⚠️ <i>Activity rule:</i> if an account stays inactive for over <b>6 months (180 days)</b>, the golden badge is reassigned to an active <b>Top-100</b> leader.'
    );
  }
  document.getElementById('modalBadgeToggle').checked = currentUser ? currentUser.showBadge : true;
  document.getElementById('badgeInfoModal').classList.add('open');
};

function updateProfileUI() {
  if (!currentUser) return;
  const avaBox = document.getElementById('headerAvatarContainer');
  avaBox.innerHTML = buildAvatarHTML(currentUser.avatar);
  applyAvatarRingAndFrame(avaBox, 'main-avatar', currentUser.equippedFrame, currentUser.avatarBorderColor);

  document.getElementById('headerNick').innerText = currentUser.nickname;
  document.getElementById('headerBio').innerText = trSrv(currentUser.bio);
  document.getElementById('headerLevel').innerText = currentUser.level + ' / 20';
  document.getElementById('headerAuth').innerText = currentUser.authority;
  document.getElementById('headerCoins').innerText = currentUser.coins + ' 🪙';
  const hdEl = document.getElementById('headerDiamonds');
  if (hdEl) hdEl.innerText = (currentUser.diamonds || 0) + ' 💎';
  document.getElementById('shopWalletBadge').innerText = (currentUser.coins || 0) + ' 🪙 • ' + (currentUser.diamonds || 0) + ' 💎';

  const recCodeEl = document.getElementById('settingsRecoveryCode');
  if (recCodeEl) recCodeEl.innerText = currentUser.recoveryCode || '—';
  const emailInp = document.getElementById('settingsEmailInput');
  if (emailInp && document.activeElement !== emailInp) emailInp.value = currentUser.email || '';

  const titleEl = document.getElementById('headerTitleBadge');
  if (titleEl) {
    const parts = [];
    if (currentUser.vipUntil && currentUser.vipUntil > Date.now()) {
      const daysLeft = Math.max(1, Math.ceil((currentUser.vipUntil - Date.now()) / (24 * 3600 * 1000)));
      parts.push(`👑 VIP (${daysLeft}${L('д', 'd')})`);
    }
    if (currentUser.title) parts.push('⚜️ ' + trSrv(currentUser.title));
    if (currentFamilyData) parts.push(currentFamilyData.emblem + ' [' + (currentFamilyData.tag || 'FAM') + '] ' + currentFamilyData.name);
    titleEl.innerText = parts.join(' • ');
  }

  if (!currentUser.isGuest) {
    if (typeof currentUser.profanityFilter === 'boolean') {
      profanityEnabled = currentUser.profanityFilter;
      localStorage.setItem('mafia_profanity_enabled', String(profanityEnabled));
    }
    if (Array.isArray(currentUser.customBadWords)) {
      customBadWords = currentUser.customBadWords;
      localStorage.setItem('mafia_custom_bad_words', JSON.stringify(customBadWords));
    }
    const pToggle = document.getElementById('settingsProfanityToggle');
    if (pToggle) pToggle.checked = profanityEnabled;
    const pWordsInp = document.getElementById('settingsCustomWordsInput');
    if (pWordsInp && document.activeElement !== pWordsInp) pWordsInp.value = customBadWords.join(', ');
  }

  const staffBadge = document.getElementById('adminStaffBadge');
  if (staffBadge) staffBadge.innerText = (staffRole || 'player').toUpperCase();

  const nickWrap = document.getElementById('changeNickWrap');
  if (nickWrap) nickWrap.style.display = (currentUser.nickChanged || currentUser.isGuest) ? 'none' : 'block';

  const hBadge = document.getElementById('headerBadge');
  if (currentBadgeType && currentUser.showBadge) {
    hBadge.style.display = 'inline-block';
    hBadge.className = currentBadgeType === 'copper'
      ? 'badge-100 copper'
      : (currentBadgeType === 'silver' ? 'badge-100 silver' : 'badge-100');
  } else {
    hBadge.style.display = 'none';
  }

  document.getElementById('settingsBadgeToggle').checked = currentUser.showBadge;
  document.getElementById('modalBadgeToggle').checked = currentUser.showBadge;

  const legendOpt = document.getElementById('legendModeOption');
  if (legendOpt) {
    const canLegend = (currentUser.gamesPlayed >= 100 || currentUser.legendUnlocked || currentUser.isTester || isDevAdmin);
    legendOpt.disabled = !canLegend;
    legendOpt.innerText = canLegend
      ? L('Режим: Легенда', 'Mode: Legend')
      : L('Режим: Легенда (від 100 ігор)', 'Mode: Legend (100+ games)');
    if (!canLegend && document.getElementById('roomMode')?.value === 'legend') {
      document.getElementById('roomMode').value = 'classic';
    }
  }

  const winPercent = currentUser.gamesPlayed > 0
    ? Math.round((currentUser.wins / currentUser.gamesPlayed) * 100)
    : 0;
  const t = currentUser.teamStats || { town: { played: 0, wins: 0 }, mafia: { played: 0, wins: 0 }, cult: { played: 0, wins: 0 }, neutral: { played: 0, wins: 0 } };
  const isMaxLvl = currentUser.level >= 20;
  const minLvlXp = currentLevelInfo.currentLevelMinXp || 0;
  const nextLvlXp = currentLevelInfo.nextLevelXp || 60;
  const curXp = currentUser.xp || 0;
  const xpInLvl = Math.max(0, curXp - minLvlXp);
  const xpSpan = Math.max(1, nextLvlXp - minLvlXp);
  const xpPct = isMaxLvl ? 100 : Math.min(100, Math.round((xpInLvl / xpSpan) * 100));
  const xpRemaining = isMaxLvl ? 0 : Math.max(0, nextLvlXp - curXp);
  const lvlHeadText = isMaxLvl
    ? L('Максимальний рівень (20 / 20)', 'Max Level (20 / 20)')
    : L('Рівень ', 'Level ') + currentUser.level + ' → ' + (currentUser.level + 1);
  const xpRemainText = isMaxLvl
    ? L('Досягнуто вершини!', 'Peak level reached!')
    : L('До наступного рівня: ', 'To next level: ') + '<b>' + xpRemaining + ' XP</b>';
  const winsWord = L('перемог', 'wins');
  const gamesWord = L('ігор', 'games');

  // Статистика по кожній ролі з портретом
  const rStats = (currentUser.roleStats && typeof currentUser.roleStats === 'object') ? currentUser.roleStats : {};
  const rolesListArr = Object.values(allRoles || {});
  const roleStatsCardsHtml = rolesListArr.map(role => {
    const rs = rStats[role.id] || { played: 0, wins: 0 };
    const rName = (role.names && (role.names[currentLang] || role.names.ua)) || role.id;
    const teamCls = role.team === 'mafia' ? 'rs-mafia' : (role.team === 'cult' ? 'rs-cult' : (role.team && role.team.includes('neutral') ? 'rs-neutral' : 'rs-town'));
    return (
      '<div class="role-stat-card ' + teamCls + '">' +
        '<div class="role-stat-img-wrap">' +
          '<img src="/roles_avatars/' + role.id + '.png" alt="' + escapeHTML(rName) + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'inline\';">' +
          '<span style="display:none; font-size:18px;">' + (role.actionIcon || '🎭') + '</span>' +
        '</div>' +
        '<div class="role-stat-name">' + escapeHTML(rName) + '</div>' +
        '<div class="role-stat-nums">' + L('Ігор:', 'Games:') + ' <b>' + (rs.played || 0) + '</b></div>' +
        '<div class="role-stat-nums">' + L('Перемог:', 'Wins:') + ' <b style="color:#ffd166;">' + (rs.wins || 0) + '</b></div>' +
      '</div>'
    );
  }).join('');

  document.getElementById('fullStatsBox').innerHTML =
    '<div class="stats-grid">' +
      '<div class="stat-tile"><span class="num">' + currentUser.gamesPlayed + '</span><span class="lbl">' + L('Зіграно ігор', 'Games Played') + '</span></div>' +
      '<div class="stat-tile"><span class="num">' + winPercent + '%</span><span class="lbl">' + L('Відсоток перемог', 'Win Rate') + '</span></div>' +
      '<div class="stat-tile"><span class="num" style="color:#2a9d8f;">' + currentUser.wins + '</span><span class="lbl">' + L('Перемоги', 'Wins') + '</span></div>' +
      '<div class="stat-tile"><span class="num" style="color:#e63946;">' + (currentUser.losses || 0) + '</span><span class="lbl">' + L('Поразки', 'Losses') + '</span></div>' +
      '<div class="stat-tile"><span class="num" style="color:#f4a261;">' + (currentUser.winStreak || 0) + '</span><span class="lbl">' + L('Серія перемог', 'Win Streak') + '</span></div>' +
      '<div class="stat-tile"><span class="num">' + (currentUser.bestWinStreak || 0) + '</span><span class="lbl">' + L('Найкраща серія', 'Best Streak') + '</span></div>' +
    '</div>' +
    '<div class="card">' +
      '<div style="display:flex; justify-content:space-between; font-size:13px; color:#cbd5e1; margin-bottom:6px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.08);">' +
        '<span>👤 ' + L('Стать:', 'Gender:') + '</span><b>' + getGenderLabel(currentUser.gender) + '</b>' +
      '</div>' +
      '<div class="xp-progress-wrap">' +
        '<div class="xp-progress-head">' +
          '<span>🎖️ <b>' + lvlHeadText + '</b></span>' +
          '<b>' + xpPct + '%</b>' +
        '</div>' +
        '<div class="xp-progress-track">' +
          '<div class="xp-progress-fill" style="width:' + xpPct + '%;"></div>' +
        '</div>' +
        '<div class="xp-progress-meta">' +
          '<span>' + curXp + ' / ' + nextLvlXp + ' XP</span>' +
          '<span>' + xpRemainText + '</span>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex; justify-content:space-between; font-size:13px; color:#2a9d8f; margin-bottom:4px;">' +
        '<span>🛡️ ' + L('Порядність (Карма):', 'Fair Play (Karma):') + '</span><b>' + (currentUser.karma ?? 100) + ' / 100</b>' +
      '</div>' +
      '<details class="info-tri" style="margin-bottom:8px;">' +
        '<summary class="info-tri-summary">' + L('На що впливає Карма?', 'What does Karma affect?') + ' <span class="tri-caret">▾</span></summary>' +
        '<div class="info-tri-box">' + L(
          'Карма (0–100) показує чесність гри: вихід з активної гри знімає <b>-12</b> (або <b>-3</b> за скаргою гравців), мут/попередження — <b>-10</b>. За карми <b>&lt;50</b> закриті рейтингові й просунуті кімнати. Кожна дограна партія додає <b>+2</b>.',
          'Karma (0–100) reflects fair play: leaving an active game deducts <b>-12</b> (or <b>-3</b> via player penalty), mute/warn deducts <b>-10</b>. Below <b>&lt;50</b> karma, ranked &amp; advanced rooms are locked. Each completed match grants <b>+2</b>.'
        ) + '</div>' +
      '</details>' +
      '<details class="info-tri" style="margin-bottom:8px;">' +
        '<summary class="info-tri-summary">' + L('Навіщо потрібен Авторитет (⭐) і як його заробити?', 'What is Authority (⭐) for and how to earn it?') + ' <span class="tri-caret">▾</span></summary>' +
        '<div class="info-tri-box">' + L(
          '<b>Авторитет (⭐)</b> — ваш головний рейтинговий статус у Мафії!<br>• <b>Як заробляється:</b> перемоги в матчах (особливо у рейтингових кімнатах), серії перемог, виконання квестів, міні-ігри та отримання подарунків від інших гравців.<br>• <b>Що дає:</b> місце в <b>Топ-100 дня</b> (мідний значок 100), <b>Залі слави Топ-100</b> (срібний значок 100), шанс успадкувати <b>золотий значок 100</b>, престиж Сім\'ї, вищий стартовий вплив та сезонні нагороди.',
          '<b>Authority (⭐)</b> is your core prestige ranking in Mafia!<br>• <b>How to earn:</b> match wins (especially in ranked rooms), win streaks, quests, mini-games, and gifts from other players.<br>• <b>What it unlocks:</b> <b>Daily Top-100</b> (Copper 100 badge), <b>All-Time Top-100 Hall of Fame</b> (Silver 100 badge), chance to inherit a <b>Golden 100 badge</b>, Family prestige, and seasonal rank rewards.'
        ) + '</div>' +
      '</details>' +
      '<div style="font-size:12.5px; font-weight:700; color:#ffd166; margin:10px 0 4px;">⚖️ ' + L('Статистика за фракціями (всього ігор / перемог):', 'Faction Statistics (total games / wins):') + '</div>' +
      '<div class="faction-stats-grid">' +
        '<div class="faction-stat-tile">' +
          '<div class="faction-stat-title">🏙️ ' + L('Мирні жителі', 'Townsfolk') + '</div>' +
          '<div class="faction-stat-nums">' + L('Ігор:', 'Games:') + ' <b>' + t.town.played + '</b> • ' + L('Перемог:', 'Wins:') + ' <b style="color:#2a9d8f;">' + t.town.wins + '</b></div>' +
        '</div>' +
        '<div class="faction-stat-tile f-mafia">' +
          '<div class="faction-stat-title">🔫 ' + L('Мафія', 'Mafia') + '</div>' +
          '<div class="faction-stat-nums">' + L('Ігор:', 'Games:') + ' <b>' + t.mafia.played + '</b> • ' + L('Перемог:', 'Wins:') + ' <b style="color:#e63946;">' + t.mafia.wins + '</b></div>' +
        '</div>' +
        '<div class="faction-stat-tile f-cult">' +
          '<div class="faction-stat-title">🔮 ' + L('Культ', 'Cult') + '</div>' +
          '<div class="faction-stat-nums">' + L('Ігор:', 'Games:') + ' <b>' + t.cult.played + '</b> • ' + L('Перемог:', 'Wins:') + ' <b style="color:#c084fc;">' + t.cult.wins + '</b></div>' +
        '</div>' +
        '<div class="faction-stat-tile f-neutral">' +
          '<div class="faction-stat-title">🃏 ' + L('Нейтрали', 'Neutrals') + '</div>' +
          '<div class="faction-stat-nums">' + L('Ігор:', 'Games:') + ' <b>' + t.neutral.played + '</b> • ' + L('Перемог:', 'Wins:') + ' <b style="color:#f4a261;">' + t.neutral.wins + '</b></div>' +
        '</div>' +
      '</div>' +
      (roleStatsCardsHtml
        ? '<div style="font-size:12.5px; font-weight:700; color:#80ffdb; margin:12px 0 4px;">🎭 ' + L('Статистика по кожній ролі:', 'Per-Role Statistics:') + '</div>' +
          '<div class="role-stats-grid">' + roleStatsCardsHtml + '</div>'
        : '') +
      '<details class="info-tri" style="margin-top:10px;">' +
        '<summary class="info-tri-summary">' + L('Пояснення команд та умов перемоги', 'Teams & Win Conditions Explained') + ' <span class="tri-caret">▾</span></summary>' +
        '<div class="info-tri-box">' + L(
          '• <b>Мирні:</b> перемагають лише коли вбито всю Мафію і Культ.<br>• <b>Мафія:</b> перемагає лише коли знищено всіх Мирних і Культ.<br>• <b>Культ:</b> вербує мирних і виграє при більшості без Мафії.<br>• <b>Нейтрали:</b> індивідуальні умови перемоги (Джокер, Амнезіак, Янгол).',
          '• <b>Town:</b> wins only when all Mafia and Cult members are eliminated.<br>• <b>Mafia:</b> wins only when all Town and Cult members are eliminated.<br>• <b>Cult:</b> converts townsfolk and wins upon majority with no Mafia alive.<br>• <b>Neutrals:</b> individual win conditions (Jester, Amnesiac, Guardian Angel).'
        ) + '</div>' +
      '</details>' +
    '</div>';

  const histBox = document.getElementById('historyBox');
  if (currentUser.matchHistory && currentUser.matchHistory.length > 0) {
    histBox.innerHTML = currentUser.matchHistory.map(m => {
      const roleDisp = typeof window.localizeRoleName === 'function' ? window.localizeRoleName(m.role) : m.role;
      const isWin = m.result === 'Перемога' || m.result === 'Win';
      const resDisp = isWin ? L('Перемога', 'Win') : (m.result === 'Нічия' ? L('Нічия', 'Draw') : L('Поразка', 'Loss'));
      return '<div style="padding:6px 0; border-bottom:1px solid #333; font-size:13px; display:flex; justify-content:space-between;">' +
        '<span><b>' + escapeHTML(m.roomName) + '</b> (' + escapeHTML(roleDisp) + ')</span>' +
        '<span style="color:' + (isWin ? '#2a9d8f' : '#e63946') + ';">' + escapeHTML(resDisp) + ' • ' + escapeHTML(m.date) + '</span>' +
      '</div>';
    }).join('');
  } else if (histBox) {
    histBox.innerHTML = L('Історія ігор поки порожня.', 'No match history yet.');
  }
  checkKyivHappyHourClient();
  renderShop();
  renderDailyQuests();
  renderFamilyBox(latestFamiliesList);
  if (typeof renderGiftDrawerItems === 'function') renderGiftDrawerItems();
}

function renderDailyQuests() {
  const box = document.getElementById('dailyQuestsList');
  if (!box || !currentUser) return;
  const q = (currentUser.dailyStats && currentUser.dailyStats.quests) || { play_3: 0, win_town: 0, send_reaction: 0, claimed: [] };
  const items = [
    { id: 'play_3', title: L('🎮 Зіграти 3 партії за день', '🎮 Play 3 matches in a day'), cur: Math.min(3, q.play_3 || 0), max: 3, reward: 60 },
    { id: 'win_town', title: L('🏙️ Перемогти за команду Мирних', '🏙️ Win a match with the Town team'), cur: Math.min(1, q.win_town || 0), max: 1, reward: 80 },
    { id: 'send_reaction', title: L('😎 Надіслати 2 емодзі-реакції в чат', '😎 Send 2 emoji reactions in chat'), cur: Math.min(2, q.send_reaction || 0), max: 2, reward: 40 }
  ];

  box.innerHTML = '';
  items.forEach(item => {
    const done = item.cur >= item.max;
    const claimed = (q.claimed || []).includes(item.id);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div style="display:flex; justify-content:space-between; align-items:center;">' +
        '<b>' + item.title + '</b>' +
        '<span style="color:#f4a261; font-weight:bold;">+' + item.reward + ' 🪙</span>' +
      '</div>' +
      '<div style="font-size:12px; color:#aaa; margin:6px 0;">' + L('Прогрес: ', 'Progress: ') + item.cur + ' / ' + item.max + '</div>' +
      '<button type="button" ' + (!done || claimed ? 'disabled ' : '') + 'class="' + (claimed ? 'secondary' : '') + '" style="padding:7px; font-size:12px;">' +
        (claimed ? L('✅ Нагороду забрано', '✅ Reward Claimed') : (done ? L('🎁 Забрати нагороду', '🎁 Claim Reward') : L('⏳ В процесі', '⏳ In Progress'))) +
      '</button>';
    if (done && !claimed) {
      card.querySelector('button').addEventListener('click', () => socket.emit('claimDailyQuest', item.id));
    }
    box.appendChild(card);
  });
}

function decodeHtmlEntities(str) {
  return String(str || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function buildTranslateWidget(rawText) {
  const clean = decodeHtmlEntities(rawText).trim();
  if (!clean) return { btnHtml: '', lineHtml: '' };
  const msgId = 'm_' + (++msgSeqCounter);
  msgRawTextMap.set(msgId, clean);
  if (msgRawTextMap.size > 600) {
    const firstK = msgRawTextMap.keys().next().value;
    if (firstK) msgRawTextMap.delete(firstK);
  }
  const shortLbl = typeof window.t === 'function' ? window.t('tr_btn_short', L('Переклад', 'Translate')) : L('Переклад', 'Translate');
  const titleLbl = typeof window.t === 'function' ? window.t('translate_btn', L('Перекласти', 'Translate')) : L('Перекласти', 'Translate');
  const changeLangTitle = L('Змінити мову перекладу', 'Change translation language');
  return {
    btnHtml: `<span class="translate-pill-group"><button type="button" class="msg-translate-btn translate-pill-btn" data-tr-id="${msgId}" title="${titleLbl}"><span class="tr-glyph">文A</span> ${shortLbl}</button><button type="button" class="msg-translate-lang-btn translate-pill-btn" data-tr-id="${msgId}" title="${changeLangTitle}">▾</button></span>`,
    lineHtml: `<div class="msg-translated-line" id="tr_${msgId}" style="display:none;"></div>`
  };
}

function appendFamilyChatHtml(msg) {
  const box = document.getElementById('famChatBox');
  if (!box || !msg) return;
  const rankIcons = { don: '👑', capo: '🎩', soldier: '🔫', recruit: '🕵️' };
  const rIco = rankIcons[msg.rank] || '⚜️';
  const tr = buildTranslateWidget(msg.text || '');
  box.insertAdjacentHTML('beforeend',
    `<div style="margin-bottom:5px; line-height:1.35;">
      <span style="color:#64748b; font-size:10px;">[${escapeHTML(msg.time || '')}]</span>
      <span>${rIco}</span>
      <b style="color:#ffd166;">${escapeHTML(msg.author || '')}</b>:
      <span>${applyProfanityFilter(msg.text || '')}</span>${tr.btnHtml}
      ${tr.lineHtml}
    </div>`
  );
  box.scrollTop = box.scrollHeight;
}

function renderFamilyBox(allFamilies) {
  if (Array.isArray(allFamilies) && allFamilies.length > 0) latestFamiliesList = allFamilies;
  const famList = Array.isArray(allFamilies) ? allFamilies : latestFamiliesList;
  const box = document.getElementById('familyInfoBox');
  if (!box || !currentUser) return;

  const rankLabels = {
    don: L('👑 Дон', '👑 Don'),
    capo: L('🎩 Капо', '🎩 Capo'),
    soldier: L('🔫 Солдат', '🔫 Soldier'),
    recruit: L('🕵️ Новачок', '🕵️ Recruit')
  };

  if (currentFamilyData) {
    const fam = currentFamilyData;
    const myNickLower = currentUser.nickname.toLowerCase();
    const myRank = (fam.ranks && fam.ranks[myNickLower]) || (fam.leader && fam.leader.toLowerCase() === myNickLower ? 'don' : 'recruit');
    const isDon = myRank === 'don';
    const isOfficer = myRank === 'don' || myRank === 'capo';
    const members = Array.isArray(fam.memberProfiles) && fam.memberProfiles.length > 0
      ? fam.memberProfiles
      : (fam.members || []).map(n => ({ nickname: n, rank: (fam.ranks && fam.ranks[n.toLowerCase()]) || 'recruit', level: 1, authority: 0, online: false }));

    const membersHtml = members.map(m => {
      const mNickSafe = escapeHTML(m.nickname);
      const isMe = m.nickname.toLowerCase() === myNickLower;
      const canKick = isOfficer && !isMe && m.rank !== 'don' && !(myRank === 'capo' && m.rank === 'capo');
      const dot = m.online ? '<span style="color:#2a9d8f;">●</span>' : '<span style="color:#64748b;">●</span>';
      const rankSelect = (isDon && !isMe) ? `
        <select class="fam-rank-sel" data-nick="${mNickSafe}" style="width:auto; margin:0; padding:2px 4px; font-size:10px;">
          <option value="capo"${m.rank === 'capo' ? ' selected' : ''}>${rankLabels.capo}</option>
          <option value="soldier"${m.rank === 'soldier' ? ' selected' : ''}>${rankLabels.soldier}</option>
          <option value="recruit"${m.rank === 'recruit' ? ' selected' : ''}>${rankLabels.recruit}</option>
        </select>` : `<span class="fam-rank-badge">${rankLabels[m.rank] || rankLabels.recruit}</span>`;
      const kickBtn = canKick ? `<button type="button" class="fam-kick-btn secondary" data-nick="${mNickSafe}" style="width:auto; margin:0; padding:2px 6px; font-size:10px; color:#ff6b6b;">✕</button>` : '';
      return `
        <div class="fam-member-row">
          <div style="overflow:hidden; text-overflow:ellipsis;">${dot} <b>${mNickSafe}</b> <span style="font-size:10px; color:#8892b0;">(${L('Рів.', 'Lvl.')}${m.level || 1} • ${m.authority || 0}⭐)</span></div>
          <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">${rankSelect}${kickBtn}</div>
        </div>`;
    }).join('');

    const q = fam.quests || { play_20: 0, wins_10: 0, claimed: [] };
    const qPlayDone = (q.play_20 || 0) >= 20;
    const qPlayClaimed = (q.claimed || []).includes('play_20');
    const qWinDone = (q.wins_10 || 0) >= 10;
    const qWinClaimed = (q.claimed || []).includes('wins_10');

    const upg = fam.upgrades || { vault: 0, bar: 0, radio: 0 };
    const todayCheckIns = Array.isArray(fam.todayCheckIns) ? fam.todayCheckIns : [];
    const checkedInToday = todayCheckIns.includes(myNickLower);
    const barBonusCoins = 25 + ([0, 10, 20, 35][upg.bar || 0] || 0);
    const vaultBonusPct = [0, 15, 30, 50][upg.vault || 0] || 0;
    const myHeist = (fam.todayHeists && fam.todayHeists[myNickLower]) || null;

    const UPGRADE_DEFS = [
      { id: 'vault', icon: '🏦', title: L('Сейф клану', 'Clan Vault'), bonus: L('+15%/30%/50% до здобичі справ', '+15%/30%/50% to heist loot'), costs: [200, 450, 800] },
      { id: 'bar', icon: '🍸', title: L('Підпільний бар', 'Speakeasy Bar'), bonus: L('+10/+20/+35 🪙 до переклички', '+10/+20/+35 🪙 to daily check-in'), costs: [250, 500, 900] },
      { id: 'radio', icon: '📻', title: L('Радіомережа', 'Radio Network'), bonus: L('+2%/+4%/+6% XP та 🪙 у матчах', '+2%/+4%/+6% XP & 🪙 in matches'), costs: [300, 600, 1000] }
    ];
    const upgradesHtml = UPGRADE_DEFS.map(u => {
      const lvl = upg[u.id] || 0;
      const isMax = lvl >= 3;
      const cost = isMax ? 0 : u.costs[lvl];
      const actionHtml = isMax
        ? '<span style="color:#80ffdb; font-weight:bold; font-size:11px;">✅ MAX</span>'
        : (isOfficer
          ? `<button type="button" class="fam-upgrade-btn secondary" data-upg="${u.id}" style="width:auto; margin:0; padding:4px 8px; font-size:11px; color:#ffd166;">⬆️ ${cost} 🪙</button>`
          : `<span style="color:#94a3b8; font-size:10.5px;">${L('Слід. рів.:', 'Next lvl:')} ${cost} 🪙</span>`);
      return `
        <div class="fam-upgrade-row">
          <div><b>${u.icon} ${u.title}</b> <span style="color:#ffd166;">(${L('Рів.', 'Lvl.')} ${lvl}/3)</span><div style="font-size:10px; color:#94a3b8;">${u.bonus}</div></div>
          <div style="flex-shrink:0;">${actionHtml}</div>
        </div>`;
    }).join('');

    box.innerHTML = `
      <div class="fam-header-card">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <h4 style="margin:0; color:#ffd166;">${fam.emblem} [${escapeHTML(fam.tag || 'FAM')}] ${escapeHTML(fam.name)}</h4>
          <span class="tag tag-legend" style="margin:0;">${L('Рівень', 'Level')} ${fam.level || 1}/10</span>
        </div>
        <div style="font-size:11px; color:#cbd5e1; margin-top:4px;">👑 ${L('Дон:', 'Don:')} <b>${escapeHTML(fam.leader)}</b> • ${L('Бонус клану:', 'Clan bonus:')} <b style="color:#80ffdb;">+${fam.bonusPct || 5}% XP ${L('та', '&')} 🪙</b></div>
        ${fam.motto ? `<div class="fam-motto-box">📌 <b>${L('Наказ Дона:', "Don's Order:")}</b> ${fam.motto}</div>` : ''}
        ${isOfficer ? `
          <div style="display:flex; gap:5px; margin-top:6px;">
            <input type="text" id="famMottoInput" value="${escapeHTML(decodeHtmlEntities(fam.motto || ''))}" placeholder="${L("Закріпити девіз або оголошення для Сім'ї...", 'Pin a motto or announcement for the Family...')}" maxlength="160" style="margin:0; padding:5px 8px; font-size:11px;">
            <button type="button" id="saveFamMottoBtn" class="secondary" style="width:auto; margin:0; padding:0 9px; font-size:11px; color:#ffd166;">📌</button>
          </div>` : ''}
        <div class="fam-stats-grid">
          <div class="fam-stat-pill"><span>${L('Казна', 'Treasury')}</span><b>${fam.treasury || 0} 🪙</b></div>
          <div class="fam-stat-pill"><span>${L('Рейтинг', 'Rating')}</span><b>${fam.ratingPoints || 0} ⭐</b></div>
          <div class="fam-stat-pill"><span>${L('За тиждень', 'Weekly')}</span><b>${fam.weeklyPoints || 0} 🔥</b></div>
        </div>
        <div style="font-size:11px; color:#8892b0; margin-bottom:4px;">${L("Поповнити казну (+1 рейтинг за кожні 10 🪙 і підйом рівня Сім'ї):", 'Donate to treasury (+1 rating per 10 🪙 & Family level up):')}</div>
        <div style="display:flex; gap:6px;">
          <button type="button" class="fam-donate-btn secondary" data-amt="50" style="flex:1; margin:0; padding:6px; font-size:11px;">+50 🪙</button>
          <button type="button" class="fam-donate-btn secondary" data-amt="100" style="flex:1; margin:0; padding:6px; font-size:11px;">+100 🪙</button>
          <button type="button" class="fam-donate-btn secondary" data-amt="250" style="flex:1; margin:0; padding:6px; font-size:11px; color:#ffd166;">+250 🪙</button>
        </div>
      </div>

      <p id="familyFeedbackMsg" style="font-size:12px; color:#80ffdb; margin:4px 0; font-weight:bold;"></p>

      <div class="fam-interactive-card">
        <div class="fam-checkin-row">
          <div>
            <div style="font-size:12px; font-weight:bold; color:#80ffdb;">📅 ${L('Щоденна перекличка', 'Daily Roll Call')} (${todayCheckIns.length}/${members.length})</div>
            <div style="font-size:10.5px; color:#94a3b8;">${L('Відмічайся щодня:', 'Check in daily:')} <b>+${barBonusCoins} 🪙</b> ${L('тобі та', 'for you &')} <b>+20 🪙</b> ${L('у казну!', 'to treasury!')}</div>
          </div>
          <div style="display:flex; gap:5px; flex-shrink:0;">
            <button type="button" id="famCheckInBtn" ${checkedInToday ? 'disabled ' : ''}style="width:auto; margin:0; padding:6px 10px; font-size:11px; background:${checkedInToday ? '#334155' : '#2a9d8f'};">${checkedInToday ? L('✅ В строю', '✅ Checked In') : L('✋ Відмітитись', '✋ Check In')}</button>
            <button type="button" id="famToastBtn" class="secondary" style="width:auto; margin:0; padding:6px 9px; font-size:11px; color:#ffd166;" title="${L("Підняти тост за Сім'ю в чаті", 'Raise a toast for the Family in chat')}">🥂 ${L('Тост', 'Toast')}</button>
          </div>
        </div>
      </div>

      <div class="fam-interactive-card">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <b style="font-size:12px; color:#ffd166;">🕶️ ${L('Сімейна справа дня', 'Daily Family Heist')}</b>
          ${vaultBonusPct > 0 ? `<span style="font-size:10px; color:#80ffdb;">🏦 ${L('Бонус сейфа', 'Vault bonus')} +${vaultBonusPct}%</span>` : ''}
        </div>
        ${myHeist
          ? `<div style="font-size:11.5px; color:#cbd5e1; margin-top:6px;">${myHeist.won ? '✅' : '🚨'} ${L('Сьогоднішня справа завершена! Здобуто:', "Today's heist completed! Loot:")} <b style="color:#ffd166;">+${myHeist.personalCoins} 🪙</b> (${L('у казну:', 'to treasury:')} <b>+${myHeist.treasuryCoins} 🪙</b>). ${L('Нова справа буде доступна завтра!', 'Next heist available tomorrow!')}</div>`
          : `<div style="font-size:10.5px; color:#94a3b8; margin-top:2px;">${L('Оберіть ризик на сьогодні (1 справа на добу):', 'Choose your risk for today (1 heist per day):')}</div>
             <div class="fam-heist-grid">
               <button type="button" class="fam-heist-btn safe" data-tier="safe">💼 ${L('Тихий збір', 'Quiet Collection')}<br><span style="color:#80ffdb;">100% ${L('успіх', 'success')}</span><br><span style="font-size:10px; color:#94a3b8;">30–55 🪙</span></button>
               <button type="button" class="fam-heist-btn medium" data-tier="medium">🌙 ${L('Нічний рейд', 'Night Raid')}<br><span style="color:#ffd166;">75% ${L('успіх', 'success')}</span><br><span style="font-size:10px; color:#94a3b8;">60–110 🪙</span></button>
               <button type="button" class="fam-heist-btn risky" data-tier="risky">🏦 ${L('Банк міста', 'City Bank')}<br><span style="color:#ff8585;">50% ${L('джекпот', 'jackpot')}</span><br><span style="font-size:10px; color:#94a3b8;">130–220 🪙</span></button>
             </div>`
        }
      </div>

      <details class="fam-interactive-card" style="padding:8px 10px;">
        <summary style="cursor:pointer; font-size:12px; font-weight:bold; color:#cbd5e1;">🏛️ ${L("Штаб Сім'ї — Покращення (Сейф • Бар • Радіо)", 'Family HQ — Upgrades (Vault • Bar • Radio)')}</summary>
        <div style="margin-top:6px;">${upgradesHtml}</div>
      </details>

      <div class="card" style="padding:8px 10px; margin-bottom:8px;">
        <div style="font-size:12px; font-weight:bold; color:#f4a261; margin-bottom:6px;">🎯 ${L("Кланові квести Сім'ї", 'Family Clan Quests')}</div>
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; font-size:11px;">
            <span>${L('Зіграти 20 ігор учасниками', 'Play 20 matches as members')} (${Math.min(20, q.play_20 || 0)}/20)</span>
            <span style="color:#ffd166;">+150🪙 ${L('казна', 'treasury')} • +35🪙 ${L('всім', 'all')}</span>
          </div>
          <div class="fam-quest-bar"><span style="width:${Math.min(100, ((q.play_20 || 0) / 20) * 100)}%"></span></div>
          ${qPlayDone && !qPlayClaimed ? `<button type="button" class="fam-quest-claim" data-q="play_20" style="padding:4px 8px; font-size:11px; background:#2a9d8f;">🎁 ${L('Забрати нагороду', 'Claim Reward')}</button>` : (qPlayClaimed ? `<span style="font-size:10px; color:#80ffdb;">✅ ${L('Виконано', 'Completed')}</span>` : '')}
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; font-size:11px;">
            <span>${L('Здобути 10 перемог', 'Win 10 matches')} (${Math.min(10, q.wins_10 || 0)}/10)</span>
            <span style="color:#ffd166;">+250🪙 ${L('казна', 'treasury')} • +60🪙 ${L('всім', 'all')}</span>
          </div>
          <div class="fam-quest-bar"><span style="width:${Math.min(100, ((q.wins_10 || 0) / 10) * 100)}%"></span></div>
          ${qWinDone && !qWinClaimed ? `<button type="button" class="fam-quest-claim" data-q="wins_10" style="padding:4px 8px; font-size:11px; background:#2a9d8f;">🎁 ${L('Забрати нагороду', 'Claim Reward')}</button>` : (qWinClaimed ? `<span style="font-size:10px; color:#80ffdb;">✅ ${L('Виконано', 'Completed')}</span>` : '')}
        </div>
      </div>

      <div style="font-size:12px; font-weight:bold; color:#cbd5e1; margin-bottom:4px;">💬 ${L("Чат Сім'ї", 'Family Chat')}</div>
      <div id="famChatBox" class="fam-chat-box"></div>
      <div style="display:flex; gap:6px; margin-bottom:10px;">
        <input type="text" id="famMsgInput" placeholder="${L("Написати у чат Сім'ї...", 'Write to Family chat...')}" style="margin:0; font-size:12px;" maxlength="260">
        <button type="button" id="sendFamMsgBtn" style="width:auto; margin:0; padding:0 12px; background:#2a9d8f;">➤</button>
      </div>

      <details style="margin-bottom:8px;">
        <summary style="cursor:pointer; font-size:12px; font-weight:bold; color:#cbd5e1;">👥 ${L("Склад Сім'ї", 'Family Roster')} (${members.length}/30)</summary>
        <div style="margin-top:6px; max-height:180px; overflow-y:auto;">${membersHtml}</div>
      </details>

      <button type="button" id="leaveFamBtn" class="secondary" style="margin-top:4px; color:#ff6b6b;">🚪 ${L("Вийти з Сім'ї", 'Leave Family')}</button>
    `;

    (fam.chat || []).forEach(m => appendFamilyChatHtml(m));
    box.querySelector('#famCheckInBtn')?.addEventListener('click', () => socket.emit('familyCheckIn'));
    box.querySelector('#famToastBtn')?.addEventListener('click', () => socket.emit('familyToast'));
    box.querySelectorAll('.fam-heist-btn').forEach(b => b.addEventListener('click', () => socket.emit('runFamilyHeist', b.dataset.tier)));
    box.querySelectorAll('.fam-upgrade-btn').forEach(b => b.addEventListener('click', () => socket.emit('buyFamilyUpgrade', b.dataset.upg)));
    box.querySelector('#saveFamMottoBtn')?.addEventListener('click', () => {
      const val = box.querySelector('#famMottoInput')?.value || '';
      socket.emit('setFamilyAnnouncement', val);
    });
    box.querySelectorAll('.fam-donate-btn').forEach(b => b.addEventListener('click', () => socket.emit('donateFamilyTreasury', Number(b.dataset.amt))));
    box.querySelectorAll('.fam-quest-claim').forEach(b => b.addEventListener('click', () => socket.emit('claimFamilyQuest', b.dataset.q)));
    box.querySelectorAll('.fam-rank-sel').forEach(s => s.addEventListener('change', () => socket.emit('setFamilyRank', { targetNick: s.dataset.nick, rank: s.value })));
    box.querySelectorAll('.fam-kick-btn').forEach(b => b.addEventListener('click', () => {
      if (confirm(L('Виключити ' + b.dataset.nick + ' зі складу Сім\'ї?', 'Kick ' + b.dataset.nick + ' from the Family?'))) socket.emit('kickFamilyMember', b.dataset.nick);
    }));
    const sendFam = () => {
      const inp = document.getElementById('famMsgInput');
      if (inp && inp.value.trim()) { socket.emit('sendFamilyMsg', inp.value); inp.value = ''; }
    };
    box.querySelector('#sendFamMsgBtn')?.addEventListener('click', sendFam);
    box.querySelector('#famMsgInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendFam(); } });
    box.querySelector('#leaveFamBtn')?.addEventListener('click', () => {
      if (confirm(L('Вийти зі складу Сім\'ї?', 'Leave the Family?'))) socket.emit('leaveFamily');
    });
  } else {
    const getFilteredFamiliesHtml = () => {
      const q = (famSearchQuery || '').trim().toLowerCase();
      let arr = (famList || []).filter(f => {
        if (!q) return true;
        return String(f.name || '').toLowerCase().includes(q) || String(f.tag || '').toLowerCase().includes(q);
      });
      if (famSortMode === 'level') {
        arr = arr.slice().sort((a, b) => (b.level || 1) - (a.level || 1) || (b.ratingPoints || 0) - (a.ratingPoints || 0));
      } else if (famSortMode === 'slots') {
        arr = arr.slice().sort((a, b) => {
          const cntA = a.membersCount ?? (a.members ? a.members.length : 1);
          const cntB = b.membersCount ?? (b.members ? b.members.length : 1);
          const freeA = (a.maxMembers || 30) - cntA;
          const freeB = (b.maxMembers || 30) - cntB;
          return freeB - freeA || (b.ratingPoints || 0) - (a.ratingPoints || 0);
        });
      } else {
        arr = arr.slice().sort((a, b) => (b.ratingPoints || 0) - (a.ratingPoints || 0));
      }
      if (arr.length === 0) {
        return `<div style="font-size:12px; color:#777; margin-top:4px;">${q ? L('Сімей за запитом не знайдено.', 'No families match your search.') : L('Поки немає створених Сімей. Станьте першими!', 'No Families created yet. Be the first!')}</div>`;
      }
      return arr.map((f, idx) => {
        const topBadge = idx < 3 ? `<span class="fam-top-badge fam-top-${idx + 1}">${L('ТОП', 'TOP')}-${idx + 1}</span>` : '';
        const cnt = f.membersCount ?? (f.members ? f.members.length : 1);
        const maxM = f.maxMembers || 30;
        return `
          <div class="friend-row" style="margin-top:6px;">
            <div style="overflow:hidden;">
              <div>${topBadge}<b>${f.emblem || '⚜️'} [${escapeHTML(f.tag || 'FAM')}] ${escapeHTML(f.name)}</b></div>
              <div style="font-size:11px; color:#aaa;">${L('Рів.', 'Lvl.')}${f.level || 1} (+${f.bonusPct || 5}%) • ${L('Дон:', 'Don:')} ${escapeHTML(f.leader)} • 👥 ${cnt}/${maxM} • ⭐ ${f.ratingPoints || 0}</div>
            </div>
            <button type="button" class="join-fam-btn" data-fam="${f.id}" style="width:auto; padding:5px 10px; margin:0; background:#2a9d8f; font-size:12px;">${L('Вступити', 'Join')}</button>
          </div>`;
      }).join('');
    };

    const bindJoinBtns = () => {
      box.querySelectorAll('.join-fam-btn').forEach(btn => {
        btn.addEventListener('click', () => socket.emit('joinFamily', btn.getAttribute('data-fam')));
      });
    };

    const existingList = box.querySelector('#famRankingsList');
    if (existingList && document.activeElement && document.activeElement.id === 'famSearchInput') {
      existingList.innerHTML = getFilteredFamiliesHtml();
      bindJoinBtns();
      return;
    }

    const priceTxt = currentUser.freeFamilyCreate
      ? `<b style="color:#80ffdb;">${L('Безкоштовно (Патент активовано!)', 'Free (Charter activated!)')}</b>`
      : '<b>1500 🪙</b>';
    box.innerHTML =
      '<h4>⚜️ ' + L('Створити власну мафіозну Сім\'ю', 'Create Your Own Mafia Family') + '</h4>' +
      '<p id="familyFeedbackMsg" style="font-size:12px; color:#ff6b6b; margin:4px 0;"></p>' +
      '<p style="font-size:12px; color:#aaa; margin:4px 0;">' + L(
        'Об\'єднуйтесь до 30 гравців: бонус до +15% XP і монет, спільна казна, квести, чат та клановий [ТЕГ]! Вартість: ',
        'Unite up to 30 players: up to +15% XP & coins bonus, shared treasury, quests, chat & clan [TAG]! Cost: '
      ) + priceTxt + '</p>' +
      '<input type="text" id="newFamNameInput" placeholder="' + L('Назва Сім\'ї (напр. Корлеоне)...', 'Family Name (e.g. Corleone)...') + '" maxlength="24">' +
      '<div style="display:flex; gap:6px;">' +
        '<input type="text" id="newFamTagInput" placeholder="' + L('ТЕГ (2-4 букви, напр. CORL)', 'TAG (2-4 letters, e.g. CORL)') + '" maxlength="4" style="flex:1; text-transform:uppercase;">' +
        '<input type="text" id="newFamEmblemInput" placeholder="' + L('Герб (🦁)', 'Emblem (🦁)') + '" value="⚜️" maxlength="4" style="width:90px; text-align:center;">' +
      '</div>' +
      '<button type="button" id="createFamBtn" style="background:#2a9d8f;">⚜️ ' + L('Заснувати Сім\'ю ', 'Found Family ') + (currentUser.freeFamilyCreate ? L('(Патент)', '(Charter)') : '(1500 🪙)') + '</button>' +
      '<hr style="border-color:#333; margin:12px 0;">' +
      '<h4>🏆 ' + L('Рейтинг Сімей (вступ):', 'Family Rankings (join):') + '</h4>' +
      '<div class="fam-search-bar">' +
        '<input type="text" id="famSearchInput" placeholder="' + L('🔍 Пошук за назвою або тегом...', '🔍 Search by name or tag...') + '" value="' + escapeHTML(famSearchQuery) + '">' +
        '<select id="famSortSelect">' +
          '<option value="rating"' + (famSortMode === 'rating' ? ' selected' : '') + '>' + L('⭐ Рейтинг', '⭐ Rating') + '</option>' +
          '<option value="level"' + (famSortMode === 'level' ? ' selected' : '') + '>' + L('📈 Рівень', '📈 Level') + '</option>' +
          '<option value="slots"' + (famSortMode === 'slots' ? ' selected' : '') + '>' + L('👥 Вільні місця', '👥 Free slots') + '</option>' +
        '</select>' +
      '</div>' +
      '<div id="famRankingsList">' + getFilteredFamiliesHtml() + '</div>';

    box.querySelector('#createFamBtn')?.addEventListener('click', () => {
      socket.emit('createFamily', {
        name: document.getElementById('newFamNameInput')?.value || '',
        tag: document.getElementById('newFamTagInput')?.value || '',
        emblem: document.getElementById('newFamEmblemInput')?.value || '⚜️'
      });
    });
    box.querySelector('#famSearchInput')?.addEventListener('input', (e) => {
      famSearchQuery = e.target.value || '';
      const listEl = box.querySelector('#famRankingsList');
      if (listEl) {
        listEl.innerHTML = getFilteredFamiliesHtml();
        bindJoinBtns();
      }
    });
    box.querySelector('#famSortSelect')?.addEventListener('change', (e) => {
      famSortMode = e.target.value || 'rating';
      const listEl = box.querySelector('#famRankingsList');
      if (listEl) {
        listEl.innerHTML = getFilteredFamiliesHtml();
        bindJoinBtns();
      }
    });
    bindJoinBtns();
  }
}

document.querySelectorAll('.shop-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.shop-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeShopCategory = btn.getAttribute('data-cat') || 'all';
    renderShop();
  });
});

function renderShop() {
  const box = document.getElementById('shopItemsContainer');
  if (!box || !currentUser) return;
  box.innerHTML = '';

  if (activeShopCategory === 'exchange') {
    const packs = [
      { id: 'pack_10', diamonds: 10, coins: 500, label: L('Стартовий сейф', 'Starter Safe'), bonus: '' },
      { id: 'pack_50', diamonds: 50, coins: 3000, label: L('Скарбниця Дона', "Don's Treasury"), bonus: L('+20% вигоди', '+20% bonus') },
      { id: 'pack_100', diamonds: 100, coins: 7000, label: L('Золото Синдикату', 'Syndicate Gold'), bonus: L('+40% вигоди!', '+40% bonus!') }
    ];
    box.innerHTML = `<p style="font-size:12px; color:#80ffdb; margin-bottom:8px;">💱 ${L('Односторонній офіційний курс обміну: <b>💎 Діаманти ➔ 🪙 Монети</b>', 'One-way official exchange rate: <b>💎 Diamonds ➔ 🪙 Coins</b>')}</p>`;
    packs.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card exchange-card';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b>${p.label} ${p.bonus ? `<span style="color:#ffd166; font-size:11px;">(${p.bonus})</span>` : ''}</b>
          <span style="color:#80ffdb; font-weight:bold;">${p.diamonds} 💎 ➔ ${p.coins} 🪙</span>
        </div>
        <button type="button" style="margin-top:8px; padding:8px; font-size:12px; background:#2a9d8f;">${L(`Обміняти ${p.diamonds} 💎 на ${p.coins} 🪙`, `Exchange ${p.diamonds} 💎 for ${p.coins} 🪙`)}</button>
      `;
      card.querySelector('button').addEventListener('click', () => socket.emit('exchangeDiamonds', p.id));
      box.appendChild(card);
    });
    return;
  }

  if (activeShopCategory === 'donate') {
    const todayUtc = new Date().toISOString().split('T')[0];
    const claimedToday = currentUser && currentUser.lastApologyBonusDate === todayUtc;
    const isGuest = !currentUser || currentUser.isGuest;
    const dTitle = typeof window.t === 'function'
      ? window.t('donate_unavailable_title', L('💳 Донат тимчасово недоступний', '💳 Donations Temporarily Unavailable'))
      : L('💳 Донат тимчасово недоступний', '💳 Donations Temporarily Unavailable');
    const dCard = document.createElement('div');
    dCard.className = 'card donate-box';
    dCard.innerHTML = `
      <h4 style="color:#ffd166; margin-bottom:6px;">${dTitle}</h4>
      <p style="font-size:12px; color:#e2e8f0; line-height:1.45; margin-bottom:10px;">
        ${L(
          'Платіжна система та прямі поповнення за тарифами наразі ще підключаються (для чесного та легального запуску). Вибачте за тимчасові незручності!',
          'The payment gateway and direct tariff top-ups are currently being integrated (for a fair and compliant launch). Sorry for the temporary inconvenience!'
        )}
      </p>
      <div style="background:rgba(42, 157, 143, 0.16); border:1px solid #2a9d8f; padding:10px; border-radius:10px; margin-bottom:10px;">
        <div style="font-size:13px; font-weight:bold; color:#80ffdb; margin-bottom:4px;">🎁 ${L('Щоденна компенсація для гравців', 'Daily Player Compensation')}</div>
        <div style="font-size:12px; color:#e2e8f0; line-height:1.4;">
          ${L(
            'У якості вибачення отримуйте <b>кожного дня по +500 золота (🪙)</b> на подарунки, рамки, ефекти та прокачку!',
            'As an apology, claim <b>+500 Gold (🪙) every single day</b> for gifts, frames, effects, and upgrades!'
          )}
        </div>
      </div>
      <button type="button" id="claimApologyBonusBtn" ${(claimedToday || isGuest) ? 'disabled ' : ''}style="background:${claimedToday ? '#334155' : 'linear-gradient(135deg, #f4a261, #e76f51)'}; color:${claimedToday ? '#94a3b8' : '#111'}; font-weight:bold; padding:11px; font-size:13px;">
        ${isGuest
          ? L('🔒 Увійдіть у зареєстрований акаунт для отримання +500 🪙', '🔒 Sign in to a registered account to claim +500 🪙')
          : (claimedToday
            ? L('✅ Сьогоднішні +500 🪙 вже отримано (приходьте завтра)', "✅ Today's +500 🪙 already claimed (come back tomorrow)")
            : L('🎁 Отримати щоденні +500 🪙 в якості вибачення!', '🎁 Claim Daily +500 🪙 Apology Bonus!'))}
      </button>
      <div style="font-size:11px; color:#94a3b8; margin-top:8px; text-align:center;">
        ${L(
          'Донат <b>НЕ дає переваг</b> у ролях — всі грають чесно, а Діаманти (💎) поки можна вигравати у турнірах та подіях від адміністрації.',
          'Donations grant <b>NO gameplay advantages</b> — everyone plays fairly, and Diamonds (💎) can be won in tournaments and admin events.'
        )}
      </div>
    `;
    const claimBtn = dCard.querySelector('#claimApologyBonusBtn');
    if (claimBtn && !claimedToday && !isGuest) {
      claimBtn.addEventListener('click', () => {
        claimBtn.disabled = true;
        socket.emit('claimDailyApologyBonus');
      });
    }
    box.appendChild(dCard);
    return;
  }

  const filtered = shopItemsList.filter(item => {
    if (activeShopCategory === 'all') return true;
    if (activeShopCategory === 'premium') return item.type === 'premium' || item.type === 'boost';
    return item.type === activeShopCategory || item.category === activeShopCategory;
  });

  if (filtered.length === 0) {
    box.innerHTML = `<div class="card" style="font-size:12px; color:#888;">${L('У цій категорії поки немає товарів.', 'No items in this category yet.')}</div>`;
    return;
  }

  filtered.forEach(item => {
    const isConsumable = item.type === 'gift' || item.id === 'boost_xp' || item.id === 'rename_ticket' || item.id === 'vip_30d' || item.id === 'family_pass';
    const ownedCount = (currentUser.inventory || []).filter(id => id === item.id).length;
    const owned = !isConsumable && ownedCount > 0;
    const isFrame = item.type === 'frame';
    const isFx = item.type === 'death_fx';
    const isEquipped = (isFrame && currentUser.equippedFrame === item.id) || (isFx && currentUser.equippedDeathFx === item.id);
    const curIcon = item.currency === 'diamonds' ? '💎' : '🪙';
    const curColor = item.currency === 'diamonds' ? '#80ffdb' : '#f4a261';

    let btnLabel = L('Купити', 'Buy');
    let btnDisabled = false;
    let btnClass = '';

    if (owned && (isFrame || isFx)) {
      btnLabel = isEquipped
        ? L('✨ Активовано (Зняти)', '✨ Equipped (Unequip)')
        : (isFrame ? L('👕 Одягти рамку', '👕 Equip Frame') : L('💥 Активувати ефект', '💥 Equip Effect'));
      btnClass = 'secondary';
    } else if (owned) {
      btnLabel = L('✅ У колекції', '✅ Owned');
      btnDisabled = true;
      btnClass = 'secondary';
    } else if (item.type === 'gift' && ownedCount > 0) {
      btnLabel = L('Купити ще (є: ' + ownedCount + ' шт.)', 'Buy More (owned: ' + ownedCount + ')');
    } else if (item.id === 'family_pass' && currentUser.freeFamilyCreate) {
      btnLabel = L('✅ Патент активний (використайте у вкладці Сім\'я)', '✅ Charter Active (use in Family tab)');
      btnDisabled = true;
      btnClass = 'secondary';
    } else if (item.id === 'vip_30d' && currentUser.vipUntil && currentUser.vipUntil > Date.now()) {
      btnLabel = L('👑 Продовжити VIP ще на 30 дн.', '👑 Extend VIP (+30 days)');
    }

    const dispName = (currentLang === 'en' && item.nameEn) ? item.nameEn : item.name;
    const dispDesc = (currentLang === 'en' && item.descEn) ? item.descEn : item.desc;

    const card = document.createElement('div');
    card.className = 'card' + (item.rare ? ' rare-gift' : '');
    card.innerHTML =
      '<div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">' +
        '<b>' + dispName + '</b>' +
        '<span style="color:' + curColor + '; font-weight:bold; flex-shrink:0;">' + item.price + ' ' + curIcon + '</span>' +
      '</div>' +
      '<p style="font-size:12px; color:#aaa; margin:6px 0;">' + dispDesc + '</p>' +
      '<button type="button" ' + (btnDisabled ? 'disabled ' : '') + 'class="' + btnClass + ' buy-item-btn" style="padding:8px; font-size:12px;">' +
        btnLabel +
      '</button>' +
      (isFx ? '<button type="button" class="secondary fx-preview-btn" style="margin-top:5px; padding:5px 8px; font-size:11px; color:#80ffdb;">👁️ ' + L('Переглянути ефект', 'Preview Effect') + '</button>' : '');

    if (!btnDisabled) {
      card.querySelector('.buy-item-btn')?.addEventListener('click', () => socket.emit('buyShopItem', item.id));
    }
    const prevBtn = card.querySelector('.fx-preview-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        playDeathEffectVisual({ nickname: currentUser.nickname, roleName: L('Перевірка ефекту', 'Effect Preview'), deathEffect: item.id, reason: 'preview' });
      });
    }
    box.appendChild(card);
  });
}

function renderRulesScreen() {
  const box = document.getElementById('rulesRolesList');
  if (!box) return;
  box.innerHTML = '';

  Object.values(allRoles).forEach(r => {
    const modeTag = r.mode === 'legend'
      ? '<span class="tag tag-legend">' + L('ЛЕГЕНДА', 'LEGEND') + '</span>'
      : '<span class="tag tag-classic">' + L('КЛАСИКА', 'CLASSIC') + '</span>';
    const iconBadge = r.actionIcon ? ' <span style="font-size:13px;">' + r.actionIcon + '</span>' : '';
    const rDesc = (currentLang === 'en' && r.descEn) ? r.descEn : (r.desc || '');
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML =
      '<div>' + modeTag + ' <b>' + (r.names[currentLang] || r.names.ua || r.id) + '</b>' + iconBadge + ' <span style="font-size:11px; color:#aaa;">(' + getTeamLabel(r.team) + ')</span></div>' +
      '<p style="font-size:12px; color:#ccc; margin-top:6px; line-height:1.4;">' + rDesc + '</p>';
    box.appendChild(div);
  });
}

function renderFriendsList(friends) {
  if (Array.isArray(friends)) cachedFriendsList = friends;
  const list = Array.isArray(friends) ? friends : cachedFriendsList;
  const box = document.getElementById('friendsListBox');
  cachedUnreadMsgs = (list || []).reduce((sum, f) => sum + (f.unreadCount || 0), 0);
  updateMainMenuSocialBadge();
  if (!box) return;

  if (!list || list.length === 0) {
    box.innerHTML = '<div class="card" style="font-size:13px; color:#aaa;">' + L('Список друзів порожній. Знайди друга через пошук вище!', 'Your friends list is empty. Find a friend using the search bar above!') + '</div>';
    return;
  }

  box.innerHTML = '';
  list.forEach(f => {
    const row = document.createElement('div');
    row.className = 'friend-row';
    const statusDot = f.online
      ? '<span style="color:#2a9d8f;">● ' + L('онлайн', 'online') + '</span>'
      : '<span style="color:#777;">● ' + L('офлайн', 'offline') + '</span>';
    const unreadHtml = f.unreadCount > 0 ? '<span class="unread-pill">+' + f.unreadCount + ' ' + L('СМС', 'DM') + '</span>' : '';

    const frFrame = (f.equippedFrame && /^frame_[a-z0-9_]+$/i.test(f.equippedFrame)) ? (' ' + f.equippedFrame) : '';
    row.innerHTML =
      '<div style="display:flex; align-items:center; gap:10px; flex:1; overflow:hidden;">' +
        '<div class="mini-friend-ava' + frFrame + '" style="' + buildAvatarRingStyle(f.avatarBorderColor) + '" title="' + L('Переглянути профіль', 'View profile') + '">' + buildAvatarHTML(f.avatar) + '</div>' +
        '<div style="overflow:hidden;">' +
          '<div><b>' + f.nickname + '</b> ' + buildBadgeHTML(f.badgeType) + ' ' + unreadHtml + '</div>' +
          '<div style="font-size:11px; color:#aaa; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + statusDot + (f.lastMsg ? ' • ' + f.lastMsg : '') + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex; gap:4px;">' +
        '<button type="button" class="open-pm-btn secondary" style="width:auto; padding:6px 10px; margin:0; font-size:12px;">💬 ' + L('Чат', 'Chat') + '</button>' +
        '<button type="button" class="del-fr-btn secondary" style="width:auto; padding:6px 8px; margin:0; font-size:12px; color:#ff6b6b;" title="' + L('Видалити з друзів', 'Remove friend') + '">✕</button>' +
      '</div>';

    row.querySelector('.mini-friend-ava').addEventListener('click', () => socket.emit('getPlayerProfile', f.nickname));
    row.querySelector('.open-pm-btn').addEventListener('click', () => {
      activePmFriend = f.nickname;
      document.getElementById('pmChatTitle').innerText = L('✉️ Чат з ', '✉️ Chat with ') + f.nickname;
      socket.emit('openPrivateChat', f.nickname);
      openTab('privateChatScreen');
    });
    row.querySelector('.del-fr-btn').addEventListener('click', () => {
      if (confirm(L('Видалити ' + f.nickname + ' зі списку друзів?', 'Remove ' + f.nickname + ' from friends?'))) socket.emit('removeFriend', f.nickname);
    });
    box.appendChild(row);
  });
}

function renderFriendRequests(reqs) {
  if (Array.isArray(reqs)) cachedFriendReqsList = reqs;
  const list = Array.isArray(reqs) ? reqs : cachedFriendReqsList;
  cachedFriendReqs = (list && list.length) ? list.length : 0;
  updateMainMenuSocialBadge();

  const box = document.getElementById('friendRequestsBox');
  const countBadge = document.getElementById('reqTabCount');
  if (countBadge) {
    countBadge.innerHTML = cachedFriendReqs > 0 ? '<span class="unread-pill">' + cachedFriendReqs + '</span>' : '';
  }
  if (!box) return;
  if (cachedFriendReqs === 0) {
    box.innerHTML = '<div class="card" style="color:#aaa; font-size:13px;">' + L('Вхідних заявок у друзі немає.', 'No incoming friend requests.') + '</div>';
    return;
  }
  box.innerHTML = '';
  list.forEach(nick => {
    const div = document.createElement('div');
    div.className = 'friend-row';
    div.innerHTML =
      '<span><b>' + nick + '</b> ' + L('хоче додати вас у друзі', 'wants to add you as a friend') + '</span>' +
      '<div style="display:flex; gap:6px;">' +
        '<button type="button" class="accept-req-btn" style="width:auto; padding:6px 12px; margin:0; background:#2a9d8f;">✓ ' + L('Прийняти', 'Accept') + '</button>' +
        '<button type="button" class="decline-req-btn secondary" style="width:auto; padding:6px 10px; margin:0;">✕</button>' +
      '</div>';
    div.querySelector('.accept-req-btn').addEventListener('click', () => socket.emit('respondFriendRequest', { fromNick: nick, accept: true }));
    div.querySelector('.decline-req-btn').addEventListener('click', () => socket.emit('respondFriendRequest', { fromNick: nick, accept: false }));
    box.appendChild(div);
  });
}

function updateRolesForecast() {
  const box = document.getElementById('rolesForecastBox');
  const submitBtn = document.getElementById('submitRoomBtn');
  const errEl = document.getElementById('roomError');
  const hintEl = document.getElementById('rolesSelectedLimitHint');
  const minP = Number(document.getElementById('roomMinPlayers')?.value || 5);
  const maxP = Number(document.getElementById('roomMaxPlayers')?.value || 8);

  if (selectedRoleIds.size > minP) {
    const arr = Array.from(selectedRoleIds);
    for (let i = arr.length - 1; i >= 0 && selectedRoleIds.size > minP; i--) {
      if (arr[i] !== 'citizen' && arr[i] !== 'mafioso' && arr[i] !== 'godfather') {
        selectedRoleIds.delete(arr[i]);
      }
    }
  }
  if (hintEl) {
    hintEl.innerText = L(
      `Обрано ${selectedRoleIds.size} із макс. ${minP} карт ролей (за мін. гравців)`,
      `Selected ${selectedRoleIds.size} of max ${minP} role cards (by min players)`
    );
  }
  if (!box || !window.RoleBalance) return;

  const mode = document.getElementById('roomMode')?.value || 'classic';
  const selArr = Array.from(selectedRoleIds);

  const maxRes = window.RoleBalance.computeRoleDistribution(maxP, selArr, allRoles, mode);
  if (!maxRes.ok) {
    const errText = (currentLang === 'en' && maxRes.errorEn) ? maxRes.errorEn : maxRes.error;
    box.innerHTML = `<div class="forecast-error">⚠️ ${escapeHTML(errText)}</div>`;
    if (submitBtn) submitBtn.disabled = true;
    if (errEl) errEl.innerText = errText;
    return;
  }

  if (submitBtn) submitBtn.disabled = false;
  if (errEl) errEl.innerText = '';

  const minRes = window.RoleBalance.computeRoleDistribution(minP, selArr, allRoles, mode);
  const pillsHtml = Object.entries(maxRes.counts).map(([id, cnt]) => {
    const r = allRoles[id];
    const name = r ? (r.names[currentLang] || r.names.ua || id) : id;
    const ico = (r && r.actionIcon) || (id === 'citizen' ? '🛡️' : '🎭');
    const cls = r ? (r.team === 'mafia' ? 'mafia' : (r.team === 'town' ? 'town' : 'neutral')) : 'neutral';
    return `<span class="forecast-pill ${cls}">${ico} ${escapeHTML(name)} <b>×${cnt}</b></span>`;
  }).join('');

  const minSummary = Object.entries(minRes.counts).map(([id, cnt]) => {
    const r = allRoles[id];
    const name = r ? (r.names[currentLang] || r.names.ua || id) : id;
    return `${escapeHTML(name)} ×${cnt}`;
  }).join(', ');

  const extraNeutral = (maxRes.teamCounts.neutral || 0) + (maxRes.teamCounts.cult || 0);
  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
      <b style="color:#ffd166;">⚖️ ${L(`Прогноз ролей на ${maxP} гравців:`, `Role forecast for ${maxP} players:`)}</b>
      <span style="font-size:11px; color:#cbd5e1;">${L('Мафія:', 'Mafia:')} <b style="color:#ff8585;">${maxRes.teamCounts.mafia}</b> • ${L('Мирні:', 'Town:')} <b style="color:#80ffdb;">${maxRes.teamCounts.town}</b>${extraNeutral > 0 ? ` • ${L('Інші:', 'Other:')} <b style="color:#ffd166;">${extraNeutral}</b>` : ''}</span>
    </div>
    <div class="forecast-pills">${pillsHtml}</div>
    ${minP !== maxP ? `<div style="font-size:10.5px; color:#94a3b8; margin-top:4px;">${L(`При старті від <b>${minP}</b> гравців:`, `When starting with <b>${minP}</b> players:`)} ${minSummary}</div>` : ''}
    <div style="font-size:10px; color:#64748b; margin-top:3px;">🔒 ${L(`Дон Мафії завжди 1; Шериф макс. 1 до 15 гравців (2 від 16); мафії не більше ${window.RoleBalance.getMaxMafiaCount(maxP)}.`, `Mafia Don is always 1; Sheriff max 1 up to 15 players (2 from 16+); max Mafia is ${window.RoleBalance.getMaxMafiaCount(maxP)}.`)}</div>
    ${maxRes.hasOverflow ? `<div style="font-size:10px; color:#f4a261; margin-top:2px;">🎲 ${L(`Обрано більше ролей, ніж місць на ${maxP} гравців — спецролі чергуватимуться випадково в кожній грі!`, `More roles selected than slots for ${maxP} players — special roles will rotate randomly each match!`)}</div>` : ''}
  `;
}

function renderRoleCards() {
  const mode = document.getElementById('roomMode').value;
  const container = document.getElementById('rolesGridContainer');
  if (!container) return;
  container.innerHTML = '';

  // При виборі Класики вилучаємо будь-які збережені ролі Легенди
  if (mode === 'classic') {
    for (const id of Array.from(selectedRoleIds)) {
      if (allRoles[id] && allRoles[id].mode === 'legend') {
        selectedRoleIds.delete(id);
      }
    }
  }

  const maxLimit = mode === 'legend' ? 32 : 16;
  const maxSlider = document.getElementById('roomMaxPlayers');
  const minSlider = document.getElementById('roomMinPlayers');
  maxSlider.max = maxLimit;
  minSlider.max = maxLimit;
  if (Number(maxSlider.value) > maxLimit) maxSlider.value = maxLimit;
  if (Number(minSlider.value) > Number(maxSlider.value)) minSlider.value = maxSlider.value;
  document.getElementById('maxPlayersVal').innerText = maxSlider.value;
  document.getElementById('minPlayersVal').innerText = minSlider.value;

  const minCap = Number(minSlider.value || 5);
  if (selectedRoleIds.size > minCap) {
    const arr = Array.from(selectedRoleIds);
    for (let i = arr.length - 1; i >= 0 && selectedRoleIds.size > minCap; i--) {
      if (arr[i] !== 'citizen' && arr[i] !== 'mafioso' && arr[i] !== 'godfather') {
        selectedRoleIds.delete(arr[i]);
      }
    }
  }

  Object.values(allRoles).forEach(role => {
    if (mode === 'classic' && role.mode === 'legend') return;

    const isSelected = selectedRoleIds.has(role.id);
    const teamClass = role.team === 'mafia' ? 'team-mafia' : (role.team.includes('neutral') || role.team === 'cult' ? 'team-neutral' : '');

    const card = document.createElement('div');
    card.className = 'role-card-item ' + (isSelected ? 'active-role ' : '') + teamClass;
    card.innerHTML =
      '<div class="role-avatar-circle">' +
        '<img src="/roles_avatars/' + role.id + '.png" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
        '<span style="display:none;">+AI</span>' +
      '</div>' +
      '<div class="role-card-title">' + role.names[currentLang] + '</div>' +
      '<div class="role-card-team">' + getTeamLabel(role.team) + '</div>';

    card.addEventListener('click', () => {
      const errEl = document.getElementById('roomError');
      const curMin = Number(document.getElementById('roomMinPlayers')?.value || 5);
      if (selectedRoleIds.has(role.id)) {
        selectedRoleIds.delete(role.id);
        if (errEl) errEl.innerText = '';
      } else {
        if (selectedRoleIds.size >= curMin) {
          if (errEl) {
            errEl.innerText = L(
              `⚠️ Кількість обраних карт ролей не може перевищувати мінімум гравців (${curMin})! Збільшіть повзунок «Мін. гравців».`,
              `⚠️ Selected role cards cannot exceed minimum players (${curMin})! Increase the "Min players" slider.`
            );
          }
          return;
        }
        selectedRoleIds.add(role.id);
        if (errEl) errEl.innerText = '';
      }
      renderRoleCards();
    });
    container.appendChild(card);
  });
  updateRolesForecast();
}

function renderDevPosts(posts) {
  if (Array.isArray(posts)) cachedDevPosts = posts;
  const list = Array.isArray(posts) ? posts : cachedDevPosts;
  const box = document.getElementById('devPostsContainer');
  if (!box) return;
  box.innerHTML = '';
  (list || []).forEach(p => {
    const postTitle = (currentLang === 'en' && p.titleEn) ? p.titleEn : p.title;
    const rawPostText = (currentLang === 'en' && p.textEn) ? p.textEn : (p.text || '');
    const formattedPostText = escapeHTML(rawPostText).replace(/\n/g, '<br>');
    const postTr = (p.textEn && currentLang === 'en') ? { btnHtml: '', lineHtml: '' } : buildTranslateWidget(rawPostText);
    const commentsHtml = (p.comments || []).map(c => {
      const cTr = buildTranslateWidget(c.text || '');
      return '<div style="font-size:12px; padding:4px 0; border-top:1px solid #333;"><b>' + escapeHTML(c.author) + '</b> ' + buildBadgeHTML(c.badgeType) + ': ' + applyProfanityFilter(c.text) + cTr.btnHtml + cTr.lineHtml + '</div>';
    }).join('');

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div style="font-size:11px; color:#888;">' + escapeHTML(p.date) + (p.releaseVersion ? ' • <span class="app-version-pill" style="pointer-events:none;">v' + escapeHTML(p.releaseVersion) + '</span>' : '') + '</div>' +
      '<h4>' + escapeHTML(postTitle) + '</h4>' +
      '<p style="font-size:13.5px; margin:6px 0; line-height:1.45;">' + formattedPostText + ' ' + postTr.btnHtml + '</p>' +
      postTr.lineHtml +
      '<div style="margin-top:8px;">' + commentsHtml + '</div>' +
      '<input type="text" id="comment_' + p.id + '" placeholder="' + L('Залишити коментар...', 'Leave a comment...') + '">' +
      '<button type="button" class="secondary" style="padding:6px;">' + L('Коментувати', 'Comment') + '</button>';

    card.querySelector('button:not(.msg-translate-btn):not(.msg-translate-lang-btn)').addEventListener('click', () => {
      const input = document.getElementById('comment_' + p.id);
      socket.emit('addDevComment', { postId: p.id, text: input.value });
      input.value = '';
    });
    box.appendChild(card);
  });
}

let roomMsgCount = 0;

function createModernMsgHTML(author, text, time, badgeType, isMafiaSecret, isGhostChat, avatarVal, familyTag) {
  const isMe = currentUser && (String(author).toLowerCase() === String(currentUser.nickname).toLowerCase());
  const rowClass = isMe ? 'chat-msg-row msg-row-mine' : 'chat-msg-row msg-row-other';

  let bubbleClass = isMe ? 'chat-bubble-content bubble-mine' : 'chat-bubble-content bubble-other';
  let authorClass = isMe ? 'author-name is-me' : 'author-name';
  let prefix = '';

  if (isMafiaSecret) {
    bubbleClass = 'chat-bubble-content bubble-mafia';
    authorClass = 'author-name is-mafia';
    prefix = L('🤫 [Мафія] ', '🤫 [Mafia] ');
  } else if (isGhostChat) {
    bubbleClass = 'chat-bubble-content bubble-ghost';
    authorClass = 'author-name is-ghost';
    prefix = L('👻 [Привиди] ', '👻 [Ghosts] ');
  }

  const avatarHTML = !isMe ? '<div class="chat-bubble-avatar">' + buildAvatarHTML(avatarVal || 'SLOT:1') + '</div>' : '';
  const safeAuthor = escapeHTML(author || '');
  const safeAuthorJs = String(author || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const tagHtml = familyTag ? `<span class="family-tag-pill">[${escapeHTML(familyTag)}]</span>` : '';
  const authorDisplay = isMe
    ? (tagHtml + '<b>' + L('Ви', 'You') + '</b>')
    : (prefix + tagHtml + '<b class="clickable-nick" onclick="mentionPlayerInChat(\'' + safeAuthorJs + '\')" title="' + L('Натисніть, щоб звернутися в чаті', 'Click to mention in chat') + '">' + safeAuthor + '</b>');
  const badgeHTML = buildBadgeHTML(badgeType);
  const timeSuffix = isMe ? ' ✓✓' : '';

  const filteredHtml = applyProfanityFilter(text);
  const isSystemMsg = !author || author === 'Система' || author === 'System';
  const tr = isSystemMsg ? { btnHtml: '', lineHtml: '' } : buildTranslateWidget(text);

  return (
    '<div class="' + rowClass + '">' +
      avatarHTML +
      '<div class="' + bubbleClass + '">' +
        '<div class="chat-meta-bar">' +
          '<span class="' + authorClass + '">' + authorDisplay + ' ' + badgeHTML + '</span>' +
          '<span style="display:inline-flex; align-items:center;">' +
            '<span class="msg-timestamp">' + (time || '') + timeSuffix + '</span>' +
            tr.btnHtml +
          '</span>' +
        '</div>' +
        '<div class="chat-msg-text">' + filteredHtml + '</div>' +
        tr.lineHtml +
      '</div>' +
    '</div>'
  );
}

const TRANSLATE_LANGUAGE_OPTIONS = [
  { code: 'uk', flag: '🇺🇦', name: 'Українська' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'ru', flag: '❓', name: 'росийский' },
  { code: 'be', flag: '⚪🔴⚪', name: 'Беларуская' },
  { code: 'kk', flag: '🇰🇿', name: 'Қазақша' },
  { code: 'az', flag: '🇦🇿', name: 'Azərbaycanca' },
  { code: 'ka', flag: '🇬🇪', name: 'ქართული' },
  { code: 'hy', flag: '🇦🇲', name: 'Հայերեն' },
  { code: 'ro', flag: '🇲🇩', name: 'Română' },
  { code: 'uz', flag: '🇺🇿', name: 'Oʻzbekcha' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
  { code: 'pl', flag: '🇵🇱', name: 'Polski' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
  { code: 'pt', flag: '🇵🇹', name: 'Português' },
  { code: 'cs', flag: '🇨🇿', name: 'Čeština' },
  { code: 'ja', flag: '🇯🇵', name: '日本語' }
];

function getSavedTranslateLang() {
  const saved = localStorage.getItem('mafia_translate_target') || '';
  return TRANSLATE_LANGUAGE_OPTIONS.some(x => x.code === saved) ? saved : '';
}

function setSavedTranslateLang(code) {
  const valid = TRANSLATE_LANGUAGE_OPTIONS.some(x => x.code === code) ? code : 'uk';
  localStorage.setItem('mafia_translate_target', valid);
  const sel = document.getElementById('settingsTranslateLang');
  if (sel) sel.value = valid;
  return valid;
}

function triggerMessageTranslation(msgId, langCode) {
  const rawText = msgRawTextMap.get(msgId);
  if (!msgId || !rawText) return;
  const opt = TRANSLATE_LANGUAGE_OPTIONS.find(x => x.code === langCode) || TRANSLATE_LANGUAGE_OPTIONS[0];
  const outEl = document.getElementById('tr_' + msgId);
  if (outEl) {
    outEl.style.display = 'block';
    outEl.textContent = `🌐 ${opt.flag} ${opt.name}: ` + (typeof window.t === 'function' ? window.t('translating', 'Переклад...') : 'Переклад...');
  }
  socket.emit('translateMsg', { id: msgId, text: rawText, targetLang: opt.code });
}

function openTranslateLangModal(msgId, rawText) {
  pendingTranslateMsgId = msgId;
  const modal = document.getElementById('translateLangModal');
  const snippet = document.getElementById('trModalSnippet');
  const grid = document.getElementById('trModalLangGrid');
  if (!modal || !grid) return;

  if (snippet) {
    snippet.textContent = rawText.length > 140 ? rawText.slice(0, 140) + '...' : rawText;
  }
  const preferred = getSavedTranslateLang() || (currentLang === 'en' ? 'en' : 'uk');
  grid.innerHTML = '';
  TRANSLATE_LANGUAGE_OPTIONS.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tr-lang-option' + (opt.code === preferred ? ' active' : '');
    btn.innerHTML = `<span>${opt.flag}</span><span>${escapeHTML(opt.name)}</span>`;
    btn.addEventListener('click', () => {
      setSavedTranslateLang(opt.code);
      modal.classList.remove('open');
      if (pendingTranslateMsgId) {
        triggerMessageTranslation(pendingTranslateMsgId, opt.code);
      }
    });
    grid.appendChild(btn);
  });
  modal.classList.add('open');
}

document.getElementById('closeTranslateLangModalBtn')?.addEventListener('click', () => {
  document.getElementById('translateLangModal')?.classList.remove('open');
});
document.getElementById('translateLangModal')?.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'translateLangModal') {
    e.target.classList.remove('open');
  }
});

document.addEventListener('click', (e) => {
  const pickBtn = e.target.closest('.msg-translate-lang-btn');
  if (pickBtn) {
    const msgId = pickBtn.getAttribute('data-tr-id');
    const rawText = msgRawTextMap.get(msgId);
    if (msgId && rawText) openTranslateLangModal(msgId, rawText);
    return;
  }
  const trBtn = e.target.closest('.msg-translate-btn');
  if (!trBtn) return;
  const msgId = trBtn.getAttribute('data-tr-id');
  const rawText = msgRawTextMap.get(msgId);
  if (!msgId || !rawText) return;
  const savedLang = getSavedTranslateLang();
  if (savedLang) {
    triggerMessageTranslation(msgId, savedLang);
  } else {
    openTranslateLangModal(msgId, rawText);
  }
});

function renderGlobalChat(msgs) {
  const box = document.getElementById('globalChatBox');
  if (!box) return;
  box.innerHTML = '';
  msgs.forEach(m => {
    box.insertAdjacentHTML('beforeend', createModernMsgHTML(m.author, m.text, m.time, m.badgeType, false, false, 'SLOT:1', m.familyTag));
  });
  box.scrollTop = box.scrollHeight;
}

function getPhaseLabel(phase, dayNum) {
  if (phase === 'night_chat') return L('🌙 Ніч №' + dayNum + ' — Чат Мафії', '🌙 Night #' + dayNum + ' — Mafia Chat');
  if (phase === 'night_vote') return L('🎯 Ніч №' + dayNum + ' — Вибір цілей (чат закрито)', '🎯 Night #' + dayNum + ' — Target Selection (chat closed)');
  if (phase === 'day_chat') return L('☀️ День №' + dayNum + ' — Обговорення в чаті', '☀️ Day #' + dayNum + ' — Town Discussion');
  if (phase === 'day_vote') return L('⚖️ День №' + dayNum + ' — Голосування (чат закрито)', '⚖️ Day #' + dayNum + ' — Voting (chat closed)');
  if (phase === 'waiting') return L('⏳ Очікування гравців у лобі...', '⏳ Waiting for players in lobby...');
  return L('🏁 Гра завершена', '🏁 Match Ended');
}

function renderNewspaperEvents(newsArr) {
  const feed = document.getElementById('newspaperEventsFeed');
  if (!feed) return;
  const list = Array.isArray(newsArr) && newsArr.length > 0 ? newsArr : [L('Гра розпочалася!', 'The game has started!')];
  feed.innerHTML = list.map((item, idx) => {
    const isFirst = idx === 0 ? ' style="color:#ffd166; font-weight:bold;"' : '';
    return `<div class="newspaper-item"${isFirst}>• ${escapeHTML(trSrv(item))}</div>`;
  }).join('');
}

function renderNewspaperVoteLogs(voteLogs) {
  const feed = document.getElementById('newspaperVoteLogFeed');
  if (!feed) return;
  if (!Array.isArray(voteLogs) || voteLogs.length === 0) {
    feed.innerHTML = `<div class="newspaper-item" style="color:#888;">${L('Голосувань ще не відбувалося.', 'No voting rounds have occurred yet.')}</div>`;
    return;
  }
  feed.innerHTML = voteLogs.map(round => {
    const votesArr = Object.entries(round.votes || {});
    const votesText = votesArr.length > 0
      ? votesArr.map(([voter, target]) => `<span class="vote-pair"><b>${escapeHTML(voter)}</b> ➔ ${escapeHTML(target)}</span>`).join(', ')
      : L('Голосів не було', 'No votes cast');
    const exRole = round.exiled && round.exiled.role
      ? (typeof window.localizeRoleName === 'function' ? window.localizeRoleName(round.exiled.role) : round.exiled.role)
      : '';
    const resultText = round.exiled
      ? `<span style="color:#e63946; font-weight:bold;">${L('Вигнано:', 'Exiled:')} ${escapeHTML(round.exiled.nickname)} (${escapeHTML(exRole)})</span>`
      : `<span style="color:#2a9d8f; font-weight:bold;">${L('Нікого не вигнано', 'No one exiled')}</span>`;
    return `
      <div class="vote-round-item">
        <div class="vote-round-title">⚖️ <b>${L('День №', 'Day #')}${round.day}</b> — ${resultText}</div>
        <div class="vote-round-details">${votesText}</div>
      </div>
    `;
  }).join('');
}

function pushNewspaperItem(text) {
  if (!text) return;
  const localized = trSrv(text);
  const displayTxt = applyProfanityFilter(escapeHTML(localized));
  if (currentRoomNewsList.length === 1 && (currentRoomNewsList[0] === 'Гра розпочалася!' || currentRoomNewsList[0] === 'The game has started!')) {
    currentRoomNewsList = [];
  }
  currentRoomNewsList.unshift(localized);
  if (currentRoomNewsList.length > 300) currentRoomNewsList.pop();
  renderNewspaperEvents(currentRoomNewsList);

  // Пишемо події гри охайно прямо в чат (без окремої громіздкої газети і без перекладу системних повідомлень)
  const isWaiting = lastRoomSnapshot && lastRoomSnapshot.status === 'waiting';
  const targetChat = document.getElementById(isWaiting ? 'lobbyChatBox' : 'roomChatBox');
  if (targetChat) {
    targetChat.insertAdjacentHTML('beforeend', `<div class="game-event-pill"><span>${displayTxt}</span></div>`);
    targetChat.scrollTop = targetChat.scrollHeight;
  }
}

let lobbyMsgCount = 0;

function appendLobbyMessage(msg, silent = false) {
  const b = document.getElementById('lobbyChatBox');
  if (!b) return;
  lobbyMsgCount++;
  const counterEl = document.getElementById('lobbyChatCounterBadge');
  if (counterEl) counterEl.innerText = lobbyMsgCount + ' ' + L('смс', 'msgs');
  let avatarVal = 'SLOT:1';
  if (lastRoomSnapshot && lastRoomSnapshot.players) {
    const pObj = lastRoomSnapshot.players.find(p => p.nickname.toLowerCase() === String(msg.author).toLowerCase());
    if (pObj && pObj.avatar) avatarVal = pObj.avatar;
  }
  b.insertAdjacentHTML('beforeend', createModernMsgHTML(msg.author, msg.text, msg.time, msg.badgeType, false, false, avatarVal, msg.familyTag));
  b.scrollTop = b.scrollHeight;
  if (!silent && msg.author && currentUser && msg.author.toLowerCase() !== currentUser.nickname.toLowerCase()) {
    sfxNewMsg();
  }
}

function renderGiftDrawerItems(room = lastRoomSnapshot) {
  const targetSel = document.getElementById('giftDrawerTarget');
  const itemsGrid = document.getElementById('giftDrawerItems');
  if (!targetSel || !itemsGrid) return;

  if (room && Array.isArray(room.players)) {
    const prevVal = targetSel.value;
    const candidates = room.players.filter(p => !currentUser || p.nickname.toLowerCase() !== currentUser.nickname.toLowerCase());
    targetSel.innerHTML = candidates.length > 0
      ? candidates.map(p => `<option value="${escapeHTML(p.nickname)}">${escapeHTML(p.nickname)}${!p.alive ? ' (💀)' : ''}</option>`).join('')
      : `<option value="">${L('Немає інших гравців', 'No other players')}</option>`;
    if (prevVal && candidates.some(p => p.nickname === prevVal)) targetSel.value = prevVal;
  }

  const inv = (currentUser && Array.isArray(currentUser.inventory)) ? currentUser.inventory : [];
  const counts = {};
  inv.forEach(id => {
    if (id.startsWith('gift_')) counts[id] = (counts[id] || 0) + 1;
  });
  const ownedGiftIds = Object.keys(counts);

  if (ownedGiftIds.length === 0) {
    itemsGrid.innerHTML = `
      <div style="grid-column:1 / -1; text-align:center; padding:8px 4px; font-size:11px; color:#94a3b8;">
        ${L(
          'У вас немає подарунків у сумці. Придбайте каву, троянду, чорну мітку або рідкісний Томпсон у <b>🛒 Крамниці</b>!',
          'You have no gifts in your bag. Buy coffee, a rose, a black mark, or a rare Tommy Gun in the <b>🛒 Shop</b>!'
        )}
      </div>`;
    return;
  }

  itemsGrid.innerHTML = '';
  ownedGiftIds.forEach(gid => {
    const itemObj = shopItemsList.find(i => i.id === gid);
    const icon = (itemObj && itemObj.icon) || '🎁';
    const itemTitle = itemObj ? ((currentLang === 'en' && itemObj.nameEn) ? itemObj.nameEn : itemObj.name) : gid;
    const rawName = itemTitle ? itemTitle.replace(/^[^\wА-Яа-яІіЇїЄєҐґ]+/, '') : gid;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gift-drawer-item' + (itemObj && itemObj.rare ? ' rare-gift' : '');
    btn.innerHTML = `<span>${icon}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(rawName)}</span><span class="gift-count-pill">x${counts[gid]}</span>`;
    btn.addEventListener('click', () => {
      const targetNick = targetSel.value;
      if (!targetNick) return alert(L('Оберіть отримувача подарунка!', 'Select a gift recipient!'));
      const incognito = !!(document.getElementById('giftIncognitoCheck')?.checked);
      socket.emit('sendTableGift', { targetNick, giftId: gid, incognito });
      const drawer = document.getElementById('giftDrawer');
      const gBtn = document.getElementById('toggleGiftDrawerBtn');
      if (drawer) drawer.style.display = 'none';
      if (gBtn) gBtn.classList.remove('active');
    });
    itemsGrid.appendChild(btn);
  });
}

function updateRoomScreen(room) {
  if (!room) return;
  if (activeRoomId && room.id && room.id !== activeRoomId) return;
  if (!activeRoomId && room.id) activeRoomId = room.id;
  const prevStatus = lastRoomSnapshot ? lastRoomSnapshot.status : null;
  lastRoomSnapshot = room;

  const filteredRoles = (room.selectedRoles || []).filter(id => {
    if (!allRoles[id]) return true;
    if (room.mode === 'classic' && allRoles[id].mode === 'legend') return false;
    return true;
  });
  const rolesHtml = filteredRoles.map(id => {
    const roleObj = allRoles[id];
    const rName = roleObj ? roleObj.names[currentLang] : id;
    return (
      '<div class="inside-role-pill">' +
        '<div class="mini-circle">' +
          '<img src="/roles_avatars/' + id + '.png" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
          '<span style="display:none;">+AI</span>' +
        '</div>' +
        '<span>' + rName + '</span>' +
      '</div>'
    );
  }).join('');

  // === РЕЖИМ ЛОБІ (ОКРЕМЕ ВІКНО ОЧІКУВАННЯ) ===
  if (room.status === 'waiting') {
    const lTitle = document.getElementById('lobbyRoomTitle');
    if (lTitle) lTitle.innerText = room.name;
    const lTag = document.getElementById('lobbyRoomModeTag');
    if (lTag) {
      lTag.innerText = room.mode === 'legend' ? L('ЛЕГЕНДА', 'LEGEND') : L('КЛАСИКА', 'CLASSIC');
      lTag.className = room.mode === 'legend' ? 'tag tag-legend' : 'tag tag-classic';
    }
    const lMeta = document.getElementById('lobbyRoomMeta');
    if (lMeta) lMeta.innerText = L('мін. ', 'min ') + (room.minPlayers || 5) + ' | ' + L('макс. ', 'max ') + room.maxPlayers + ' | ' + L('авторитет ', 'authority ') + room.minAuthority + '+';
    const lCount = document.getElementById('lobbyPlayersCount');
    if (lCount) lCount.innerText = room.players.length + '/' + room.maxPlayers;

    const lStatus = document.getElementById('lobbyStatusText');
    if (lStatus) {
      if (room.players.length >= room.maxPlayers) {
        lStatus.innerText = L('🔥 Кімната заповнена! Автостарт...', '🔥 Room is full! Auto-starting...');
      } else if (room.players.length >= (room.minPlayers || 5)) {
        lStatus.innerText = L('✅ Мінімум зібрано — очікування старту...', '✅ Minimum reached — waiting to start...');
      } else {
        lStatus.innerText = L(
          '⏳ Очікування гравців (' + room.players.length + '/' + (room.minPlayers || 5) + ' мін.)...',
          '⏳ Waiting for players (' + room.players.length + '/' + (room.minPlayers || 5) + ' min)...'
        );
      }
    }

    const cdBadge = document.getElementById('lobbyCountdownBadge');
    if (cdBadge) {
      if (room.lobbyCountdown) {
        cdBadge.style.display = 'inline-block';
        cdBadge.innerText = '⏳ ' + room.lobbyCountdown + ' ' + L('с', 's');
      } else {
        cdBadge.style.display = 'none';
      }
    }

    const lRoles = document.getElementById('lobbyRoomRolesGrid');
    if (lRoles) lRoles.innerHTML = rolesHtml;

    const lList = document.getElementById('lobbyPlayersList');
    if (lList) {
      lList.innerHTML = '';
      room.players.forEach(p => {
        const botLabel = p.botStyle ? '🤖 ' + trSrv(p.botStyle) : L('🤖 Бот', '🤖 Bot');
        const subStatus = p.isCreator
          ? L('👑 Творець', '👑 Host')
          : (p.isBot ? botLabel : (p.leftRoom ? L('⏸️ Офлайн', '⏸️ Away') : L('🟢 Готовий', '🟢 Ready')));
        const safeJsNick = String(p.nickname || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const famTagHtml = p.familyTag ? `<span class="family-tag-pill">[${escapeHTML(p.familyTag)}]</span>` : '';
        const card = document.createElement('div');
        card.className = 'compact-seat';
        card.dataset.nick = p.nickname || '';
        const seatFrame = (p.equippedFrame && /^frame_[a-z0-9_]+$/i.test(p.equippedFrame)) ? (' ' + p.equippedFrame) : '';
        const seatRing = buildAvatarRingStyle(p.avatarBorderColor);
        const avaAttrs = p.isBot
          ? `class="seat-avatar${seatFrame}" style="${seatRing}"`
          : `class="seat-avatar clickable-avatar${seatFrame}" style="${seatRing}" onclick="openPlayerProfileCard('${safeJsNick}')" title="${L('Переглянути профіль', 'View profile')}"`;
        card.innerHTML =
          '<div style="display:flex; align-items:center; gap:7px; overflow:hidden; flex:1;">' +
            '<div ' + avaAttrs + '>' + buildAvatarHTML(p.avatar) + '</div>' +
            '<div style="overflow:hidden; text-overflow:ellipsis;">' +
              '<div>' + famTagHtml + '<b class="clickable-nick" onclick="mentionPlayerInChat(\'' + safeJsNick + '\')" title="' + L('Натисніть, щоб вписати нік у чат', 'Click to mention in chat') + '">' + escapeHTML(p.nickname) + '</b> ' + buildBadgeHTML(p.badgeType) + '</div>' +
              '<div style="font-size:10px; color:#aaa;">' + subStatus + '</div>' +
            '</div>' +
          '</div>';
        lList.appendChild(card);
      });
    }

    if (room.minigameScores && typeof window.updateLobbyMinigamesLeaderboard === 'function') {
      window.updateLobbyMinigamesLeaderboard(room.minigameScores, null);
    }
    if (typeof window.updateLobbyMinigamesCountdown === 'function') {
      window.updateLobbyMinigamesCountdown(room.lobbyCountdown || 0);
    }

    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
      const isCreatorMe = currentUser && room.creator && room.creator.toLowerCase() === currentUser.nickname.toLowerCase();
      startBtn.style.display = isCreatorMe ? 'block' : 'none';
    }
    return;
  }

  // === ПЕРЕХІД З ЛОБІ В ОКРЕМЕ ВІКНО ГРИ ===
  if (prevStatus === 'waiting' && room.status === 'playing') {
    if (typeof window.closeLobbyMinigames === 'function') window.closeLobbyMinigames();
    lastRevealedRoleKey = null;
    openTab('roomScreen');
  }

  // === РЕЖИМ АКТИВНОЇ ГРИ (ІГРОВИЙ СТІЛ) ===
  document.getElementById('insideRoomTitle').innerText = room.name;
  const tag = document.getElementById('insideRoomModeTag');
  tag.innerText = room.mode === 'legend' ? L('ЛЕГЕНДА', 'LEGEND') : L('КЛАСИКА', 'CLASSIC');
  tag.className = room.mode === 'legend' ? 'tag tag-legend' : 'tag tag-classic';

  const minKarmaPart = (room.minKarma && room.minKarma > 0) ? (' | ' + L('карма ', 'karma ') + room.minKarma + '+') : '';
  document.getElementById('insideRoomMeta').innerText = L('мін. ', 'min ') + (room.minPlayers || 5) + ' | ' + L('макс. ', 'max ') + room.maxPlayers + ' | ' + L('авторитет ', 'authority ') + room.minAuthority + '+' + minKarmaPart;
  document.getElementById('insidePlayersCount').innerText = room.players.length + '/' + room.maxPlayers;

  const rolesStrip = document.getElementById('insideRoomRolesGrid');
  if (rolesStrip) rolesStrip.innerHTML = rolesHtml;

  const timerBadge = document.getElementById('phaseTimerBadge');
  const rolePill = document.getElementById('myRoleMiniPill');
  const willBox = document.getElementById('lastWillBox');
  const deadFreeBanner = document.getElementById('deadFreePlayBanner');
  const shareBtn = document.getElementById('shareMatchResultBtn');

  if (deadFreeBanner) deadFreeBanner.style.display = (room.status === 'playing' && !room.myAlive && !room.myIsSpectator) ? 'flex' : 'none';
  if (willBox) willBox.style.display = (room.status === 'playing' && !room.myAlive && !room.myIsSpectator && !room.myWillSent) ? 'block' : 'none';
  if (shareBtn) shareBtn.style.display = room.status === 'ended' ? 'block' : 'none';

  document.getElementById('phaseTitleText').innerText = getPhaseLabel(room.phase, room.dayNumber);

  const myRoleObj = room.myRole ? allRoles[room.myRole] : null;
  if (room.status === 'playing' || room.status === 'ended') {
    timerBadge.style.display = room.status === 'playing' ? 'inline-block' : 'none';
    timerBadge.innerText = room.timeLeft + ' ' + L('с', 's');
    if (rolePill) {
      if (myRoleObj) {
        rolePill.style.display = 'inline-block';
        const cultSuffix = (room.myConvertedToCult && room.myRole !== 'cult_leader')
          ? ' • 🕯️ ' + L('Культист', 'Cultist')
          : '';
        rolePill.innerText = (myRoleObj.actionIcon || '🎭') + ' ' + myRoleObj.names[currentLang] + cultSuffix;
      } else {
        rolePill.style.display = 'none';
      }
    }
    // Автоматично показуємо спливаюче вікно з роллю та її описом 1 раз на початку партії
    if (room.status === 'playing' && myRoleObj && !room.myIsSpectator) {
      const revealKey = room.id + '_' + room.myRole;
      if (lastRevealedRoleKey !== revealKey) {
        lastRevealedRoleKey = revealKey;
        openRoleRevealModal(room.myRole);
      }
    }
  } else {
    timerBadge.style.display = 'none';
    if (rolePill) rolePill.style.display = 'none';
  }

  // Звук завершення матчу
  if (prevStatus === 'playing' && room.status === 'ended') {
    if (myRoleObj) sfxWin();
  }

  const passiveRoles = ['citizen', 'mayor', 'jester', 'medium'];
  // ЦЕМЕНТНА ЛОГІКА: Активні нічні ходи (Мафія, Лікар, Шериф та ін.) працюють СУВОРО у 2-му циклі ночі (night_vote)!
  const canActNight = room.status === 'playing' && room.myAlive && !room.myIsSpectator && !room.myConvertedToCult && room.phase === 'night_vote' && !passiveRoles.includes(room.myRole);
  const canVoteDay = room.status === 'playing' && room.myAlive && !room.myIsSpectator && room.phase === 'day_vote';
  const roleIcon = (myRoleObj && myRoleObj.actionIcon) ? myRoleObj.actionIcon : '🎯';

  const nightArr = Array.isArray(room.myNightTarget) ? room.myNightTarget : (room.myNightTarget ? [room.myNightTarget] : []);
  const neededNightTargets = room.myRole === 'journalist' ? 2 : 1;
  const hasLockedNight = canActNight && nightArr.length >= neededNightTargets;
  const myDayVote = (canVoteDay && room.votes && currentUser) ? room.votes[currentUser.nickname] : null;
  const hasLockedVote = Boolean(myDayVote);

  // Банер-підказка поточної фази
  const hintBanner = document.getElementById('nightActionHintBanner');
  if (hintBanner) {
    if (room.status === 'playing' && room.myAlive && !room.myIsSpectator) {
      if (room.phase === 'night_chat') {
        hintBanner.style.display = 'block';
        if (myRoleObj && myRoleObj.team === 'mafia') {
          hintBanner.style.background = 'rgba(230, 57, 70, 0.2)';
          hintBanner.style.border = '1px solid #e63946';
          hintBanner.style.color = '#ff8585';
          hintBanner.innerText = L(
            '🤫 Ніч (Етап 1/2): Нічний чат Мафії відкрито! Обговоріть ціль — вибір жертви у 2-му етапі.',
            '🤫 Night (Stage 1/2): Mafia Night Chat is open! Discuss your target — target selection is in Stage 2.'
          );
        } else {
          hintBanner.style.background = 'rgba(100, 116, 139, 0.2)';
          hintBanner.style.border = '1px solid #475569';
          hintBanner.style.color = '#cbd5e1';
          hintBanner.innerText = L(
            '🌙 Ніч (Етап 1/2): Місто спить, Мафія радиться... Активні ролі ходять у 2-му етапі ночі.',
            '🌙 Night (Stage 1/2): The town sleeps while the Mafia conspires... Active roles act in Stage 2.'
          );
        }
      } else if (room.phase === 'night_vote') {
        hintBanner.style.display = 'block';
        if (canActNight) {
          hintBanner.style.background = 'rgba(42, 157, 143, 0.25)';
          hintBanner.style.border = '1px solid #2a9d8f';
          hintBanner.style.color = '#80ffdb';
          const chosenDisplay = nightArr.join(' + ');
          const chosenTxt = chosenDisplay ? L(' (🔒 Зафіксовано: ' + chosenDisplay + ')', ' (🔒 Locked: ' + chosenDisplay + ')') : '';
          const roleExtra = room.myRole === 'journalist' ? L(' [Оберіть 2 гравців]', ' [Select 2 players]') : '';
          hintBanner.innerText = hasLockedNight
            ? L('🔒 Нічний вибір зафіксовано: ' + chosenDisplay + '. Очікуйте інших гравців...', '🔒 Night target locked: ' + chosenDisplay + '. Waiting for others...')
            : L(
                '🎯 Ніч (Етап 2/2) — ВАШ ХІД!' + roleExtra + ' Натисніть ' + roleIcon + ' біля гравця нижче' + chosenTxt,
                '🎯 Night (Stage 2/2) — YOUR TURN!' + roleExtra + ' Click ' + roleIcon + ' next to a player below' + chosenTxt
              );
        } else {
          hintBanner.style.background = 'rgba(100, 116, 139, 0.2)';
          hintBanner.style.border = '1px solid #475569';
          hintBanner.style.color = '#cbd5e1';
          hintBanner.innerText = L(
            '🌙 Ніч (Етап 2/2): Активні ролі роблять свій хід... Очікуйте світанку.',
            '🌙 Night (Stage 2/2): Active roles are making their moves... Await the dawn.'
          );
        }
      } else if (room.phase === 'day_vote') {
        hintBanner.style.display = 'block';
        hintBanner.style.background = 'rgba(244, 162, 97, 0.2)';
        hintBanner.style.border = '1px solid #f4a261';
        hintBanner.style.color = '#ffd166';
        hintBanner.innerText = hasLockedVote
          ? L('🔒 Ваш голос зафіксовано за: ' + myDayVote + ' (змінити не можна).', '🔒 Your vote is locked on: ' + myDayVote + ' (static choice).')
          : L('⚖️ Час денного голосування! Натисніть 🗳️ біля підозрюваного (голос остаточний).', '⚖️ Day voting time! Click 🗳️ next to a suspect (choice is final).');
      } else {
        hintBanner.style.display = 'none';
      }
    } else {
      hintBanner.style.display = 'none';
    }
  }

  const list = document.getElementById('insidePlayersList');
  list.innerHTML = '';
  const isMyMafia = myRoleObj && myRoleObj.team === 'mafia' && !room.myConvertedToCult;

  room.players.forEach(p => {
    const baseRoleName = p.role && allRoles[p.role] ? allRoles[p.role].names[currentLang] : '';
    const cultTag = (p.convertedToCult && p.role !== 'cult_leader')
      ? (baseRoleName ? ', ' + L('обернений у Культ', 'converted to Cult') : '🕯️ ' + L('Культист', 'Cultist'))
      : '';
    const jesterWinTag = p.jesterWon ? ' <span style="color:#ffd166; font-weight:bold;">🃏 ' + L('Переміг', 'Won') + '</span>' : '';
    const roleReveal = ((baseRoleName || cultTag) ? ' [' + baseRoleName + cultTag + ']' : '') + jesterWinTag;
    const healTag = p.isHealed ? ' <span class="heal-plus-badge">✚</span>' : '';
    const rawGift = room.tableGifts ? room.tableGifts[p.nickname] : null;
    let giftTag = '';
    if (rawGift) {
      if (typeof rawGift === 'object') {
        const gCls = rawGift.rare ? 'seat-gift-badge rare-gift' : 'seat-gift-badge';
        const gName = (currentLang === 'en' && rawGift.nameEn) ? rawGift.nameEn : trSrv(rawGift.name || L('Подарунок', 'Gift'));
        const gFrom = trSrv(rawGift.from || L('Таємно', 'Incognito'));
        const gTitle = L(`Подарунок: ${gName} (від: ${gFrom})`, `Gift: ${gName} (from: ${gFrom})`);
        giftTag = ` <span class="${gCls}" title="${escapeHTML(gTitle)}">${rawGift.icon || '🎁'}</span>`;
      } else {
        giftTag = ` <span class="seat-gift-badge">${rawGift}</span>`;
      }
    }
    const famTagHtml = p.familyTag ? `<span class="family-tag-pill">[${escapeHTML(p.familyTag)}]</span>` : '';
    const botLabel = p.botStyle ? '🤖 ' + trSrv(p.botStyle) : L('🤖 Бот', '🤖 Bot');
    const subStatus = !p.alive
      ? L('💀 Вибув', '💀 Eliminated')
      : (p.leftRoom
        ? L('⏸️ Вийшов (офлайн)', '⏸️ Left (away)')
        : (p.isCreator ? L('👑 Творець', '👑 Host') : (p.isBot ? botLabel : L('🟢 У грі', '🟢 Alive'))));

    // Лічильник голосів проти гравця під час денного голосування
    let voteCounterHTML = '';
    const isDayVotePhase = room.status === 'playing' && room.phase === 'day_vote';
    if (isDayVotePhase && p.alive && room.votes) {
      const voters = Object.entries(room.votes)
        .filter(([voter, target]) => target === p.nickname)
        .map(([voter]) => voter);
      if (voters.length > 0) {
        const count = voters.length;
        const votersStr = escapeHTML(voters.join(', '));
        voteCounterHTML = `<div class="vote-counter-tag" title="${L('Голосували:', 'Voted by:')} ${votersStr}">🗳️ ${count} <span class="voters-pill">(${votersStr})</span></div>`;
      }
    }

    const isNightChosen = canActNight && nightArr.includes(p.nickname);
    const isVoteChosen = canVoteDay && myDayVote === p.nickname;
    const isTargetLocked = isNightChosen || isVoteChosen;

    const safeJsNick = String(p.nickname || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const card = document.createElement('div');
    card.className = 'compact-seat' + (!p.alive ? ' dead-player' : '') + (isTargetLocked ? ' locked-choice' : '');
    if (p.leftRoom && p.alive) card.style.opacity = '0.72';
    card.dataset.nick = p.nickname || '';
    const seatFrame = (p.equippedFrame && /^frame_[a-z0-9_]+$/i.test(p.equippedFrame)) ? (' ' + p.equippedFrame) : '';
    const seatRing = buildAvatarRingStyle(p.avatarBorderColor);
    const avaAttrs = p.isBot
      ? `class="seat-avatar${seatFrame}" style="${seatRing}"`
      : `class="seat-avatar clickable-avatar${seatFrame}" style="${seatRing}" onclick="openPlayerProfileCard('${safeJsNick}')" title="${L('Переглянути профіль', 'View profile')}"`;
    card.innerHTML =
      '<div style="display:flex; align-items:center; gap:7px; overflow:hidden; flex:1;">' +
        '<div ' + avaAttrs + '>' + buildAvatarHTML(p.avatar) + '</div>' +
        '<div style="overflow:hidden; text-overflow:ellipsis;">' +
          '<div>' + famTagHtml + '<b class="clickable-nick" onclick="mentionPlayerInChat(\'' + safeJsNick + '\')" title="' + L('Натисніть, щоб вписати нік у чат', 'Click to mention in chat') + '">' + escapeHTML(p.nickname) + '</b> ' + buildBadgeHTML(p.badgeType) + healTag + giftTag + '</div>' +
          '<div style="font-size:10px; color:#aaa;">' + subStatus + roleReveal + '</div>' +
          voteCounterHTML +
        '</div>' +
      '</div>' +
      '<div class="seat-actions" style="display:flex; gap:3px; flex-shrink:0;"></div>';

    const actionsWrap = card.querySelector('.seat-actions');
    const validTarget = (room.myRole === 'amnesiac') ? !p.alive : p.alive;
    const isSelf = currentUser && p.nickname.toLowerCase() === currentUser.nickname.toLowerCase();
    const isTargetFellowMafia = canActNight && isMyMafia && !p.convertedToCult && p.role && allRoles[p.role] && allRoles[p.role].team === 'mafia' && room.myRole !== 'consigliere' && room.myRole !== 'framer';
    const isTargetFellowCult = canActNight && room.myRole === 'cult_leader' && ((p.role && allRoles[p.role] && allRoles[p.role].team === 'cult') || p.convertedToCult);
    const allowBtn = validTarget && !isSelf && !isTargetFellowMafia && !isTargetFellowCult && (canActNight || canVoteDay);

    if (allowBtn) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'action-target-btn';
      btn.style.padding = '4px 7px';
      btn.style.fontSize = '12px';
      const lockedOut = (canVoteDay && hasLockedVote) || (canActNight && (hasLockedNight || isNightChosen));
      if (isTargetLocked) {
        btn.style.background = isVoteChosen ? '#e63946' : '#2a9d8f';
        btn.innerText = '🔒 ' + (canVoteDay ? '🗳️' : roleIcon);
        btn.disabled = true;
      } else if (lockedOut) {
        btn.style.display = 'none';
      } else {
        btn.innerText = canVoteDay ? '🗳️' : roleIcon;
        btn.addEventListener('click', () => {
          socket.emit('submitAction', p.nickname);
        });
      }
      if (btn.style.display !== 'none') actionsWrap.appendChild(btn);
    }

    list.appendChild(card);
  });

  renderGiftDrawerItems(room);
  updateChatChannelUI(room);
}

function updateChatChannelUI(room) {
  const dot = document.getElementById('channelDot');
  const title = document.getElementById('channelTitle');
  const input = document.getElementById('roomMsgInput');
  const sendBtn = document.getElementById('sendRoomMsgBtn');
  const emojiToggleBtn = document.getElementById('toggleEmojiDrawerBtn');
  const emojiDrawer = document.getElementById('emojiDrawer');
  if (!dot || !title || !input) return;

  dot.className = 'channel-dot';
  input.disabled = false;
  if (sendBtn) sendBtn.disabled = false;
  if (emojiToggleBtn) emojiToggleBtn.disabled = false;

  const lockChat = (titleTxt, placeholderTxt, dotClass = 'mute-dot') => {
    if (dotClass) dot.classList.add(dotClass);
    title.innerText = titleTxt;
    input.placeholder = placeholderTxt;
    input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    if (emojiToggleBtn) {
      emojiToggleBtn.disabled = true;
      emojiToggleBtn.classList.remove('active');
    }
    if (emojiDrawer) emojiDrawer.style.display = 'none';
  };

  if (room.status === 'waiting') {
    title.innerText = L('💬 ЧАТ ЛОБІ (ОЧІКУВАННЯ)', '💬 LOBBY CHAT (WAITING)');
    input.placeholder = L('Спілкування в лобі... (Enter для відправки)', 'Chat in the lobby... (Enter to send)');
  } else if (room.status === 'playing') {
    if (room.phase === 'day_vote') {
      lockChat(
        L('⚖️ ДЕНЬ №' + (room.dayNumber || 1) + ' — ГОЛОСУВАННЯ (ЧАТ ВИМКНЕНО)', '⚖️ DAY #' + (room.dayNumber || 1) + ' — VOTING (CHAT LOCKED)'),
        L('Під час голосування чат вимкнено для всіх...', 'Chat is disabled for everyone during voting...')
      );
    } else if (room.phase === 'night_vote') {
      lockChat(
        L('🎯 НІЧНИЙ ВИБІР ЦІЛЕЙ (ЧАТ ВИМКНЕНО)', '🎯 NIGHT TARGET SELECTION (CHAT LOCKED)'),
        L('Активні ролі обирають цілі... Чат призупинено.', 'Active roles are choosing targets... Chat paused.')
      );
    } else if (!room.myAlive || room.myIsSpectator) {
      dot.classList.add('ghost-dot');
      title.innerText = L('👻 АСТРАЛЬНИЙ ЧАТ ПРИВИДІВ', '👻 ASTRAL GHOST CHAT');
      input.placeholder = L('Чат вибулих гравців... (Enter для відправки)', 'Eliminated players chat... (Enter to send)');
    } else if (room.phase === 'night_chat') {
      const myRoleObj = room.myRole ? allRoles[room.myRole] : null;
      const isMafia = (myRoleObj && myRoleObj.team === 'mafia') ||
                      ['mafioso', 'godfather', 'blackmailer', 'consigliere', 'framer'].includes(room.myRole);
      if (isMafia) {
        dot.classList.add('mafia-dot');
        title.innerText = L('🤫 ТАЄМНИЙ ЧАТ МАФІЇ', '🤫 SECRET MAFIA CHAT');
        input.placeholder = L('Обговорення плану мафії... (Enter для відправки)', 'Discuss Mafia strategy... (Enter to send)');
      } else if (room.myRole === 'medium') {
        lockChat(
          L('🕯️ МЕДІУМ ПІДСЛУХОВУЄ МАФІЮ', '🕯️ MEDIUM EAVESDROPPING ON MAFIA'),
          L('Ви чуєте голоси Мафії інкогніто...', 'You hear Mafia voices incognito...'),
          'ghost-dot'
        );
      } else {
        lockChat(
          L('🌙 МІСТО СПИТЬ (ТИША)', '🌙 TOWN IS ASLEEP (SILENCE)'),
          L('Вночі місто спить... Чат відкритий лише Мафії.', 'The town sleeps at night... Chat is open only to Mafia.')
        );
      }
    } else if (room.phase === 'day_chat') {
      const myP = room.players.find(p => p.nickname === (currentUser && currentUser.nickname));
      if (myP && myP.silenced) {
        lockChat(
          L('🤐 ШАНТАЖ (ВИ МОВЧИТЕ)', '🤐 BLACKMAILED (SILENCED)'),
          L('Вас зашантажовано! Сьогодні ви не можете говорити.', 'You are blackmailed! You cannot speak today.')
        );
      } else {
        title.innerText = L('☀️ ДЕНЬ №' + (room.dayNumber || 1) + ' — ОБГОВОРЕННЯ', '☀️ DAY #' + (room.dayNumber || 1) + ' — DISCUSSION');
        input.placeholder = L('Денне обговорення... (Enter для відправки)', 'Daytime discussion... (Enter to send)');
      }
    }
  } else if (room.status === 'ended') {
    title.innerText = L('🏆 ГРУ ЗАВЕРШЕНО', '🏆 MATCH ENDED');
    input.placeholder = L('Обговорення підсумків гри... (Enter для відправки)', 'Post-match discussion... (Enter to send)');
  }
}

function appendRoomMessage(msg, silent = false) {
  const box = document.getElementById('roomChatBox');
  if (!box) return;

  const playerObj = (!msg.isIncognitoMafia && lastRoomSnapshot && lastRoomSnapshot.players)
    ? lastRoomSnapshot.players.find(p => p.nickname && p.nickname.toLowerCase() === (msg.author || '').toLowerCase())
    : null;
  const avatarVal = msg.isIncognitoMafia
    ? 'SLOT:6'
    : (playerObj ? playerObj.avatar : (currentUser && msg.author && msg.author.toLowerCase() === currentUser.nickname.toLowerCase() ? currentUser.avatar : 'SLOT:1'));

  box.insertAdjacentHTML('beforeend', createModernMsgHTML(
    msg.author,
    msg.text,
    msg.time,
    msg.badgeType,
    msg.isMafiaSecret,
    msg.isGhostChat,
    avatarVal,
    msg.familyTag
  ));

  roomMsgCount++;
  const counterEl = document.getElementById('chatCounterBadge');
  if (counterEl) counterEl.innerText = roomMsgCount + ' ' + L('смс', 'msgs');

  box.scrollTop = box.scrollHeight;
  if (!silent && msg.author && currentUser && msg.author.toLowerCase() !== currentUser.nickname.toLowerCase()) {
    sfxNewMsg();
  }
}

function renderMatchSummaryCanvas(room) {
  const canvas = document.getElementById('matchSummaryCanvas');
  if (!canvas || !room) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14161d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#f4a261';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = '#f4a261';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('MAFIA CLUB: ONLINE', canvas.width / 2, 46);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(L('Стіл: ', 'Table: ') + room.name, canvas.width / 2, 74);

  ctx.textAlign = 'left';
  let y = 110;
  (room.players || []).forEach(p => {
    const baseRole = (p.role && allRoles[p.role]) ? allRoles[p.role].names[currentLang] : L('Гравець', 'Player');
    const cultSuffix = (p.convertedToCult && p.role !== 'cult_leader')
      ? ', ' + L('обернений у Культ', 'converted to Cult')
      : '';
    const jesterSuffix = p.jesterWon ? ' 🏆' : '';
    const rName = baseRole + cultSuffix + jesterSuffix;
    ctx.fillStyle = p.alive ? '#80ffdb' : '#ff8fa3';
    ctx.font = '13px sans-serif';
    ctx.fillText((p.alive ? '🟢 ' : '💀 ') + p.nickname + ' — ' + rName, 26, y);
    y += 24;
  });

  ctx.fillStyle = '#aaa';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(window.location.origin, canvas.width / 2, canvas.height - 24);
}
function applyLogoTheme(theme) {
  const validTheme = ['gold', 'ruby', 'emerald'].includes(theme) ? theme : 'gold';
  const logo = document.getElementById('mainGameLogo');
  const sel = document.getElementById('logoThemeSelect');
  const previewBox = document.getElementById('settingsLogoPreview');
  if (logo) logo.className = 'logo-card-box logo-' + validTheme;
  if (sel) sel.value = validTheme;
  if (previewBox && logo) previewBox.innerHTML = logo.outerHTML;
  if (document.body) document.body.setAttribute('data-theme', validTheme);
  localStorage.setItem('mafia_logo_theme', validTheme);
}

function loadSavedRoomSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('mafia_room_preset'));
    if (!saved) return;
    if (saved.roomName) document.getElementById('roomName').value = saved.roomName;
    if (saved.mode) document.getElementById('roomMode').value = saved.mode;
    if (saved.minPlayers) { document.getElementById('roomMinPlayers').value = saved.minPlayers; document.getElementById('minPlayersVal').innerText = saved.minPlayers; }
    if (saved.maxPlayers) { document.getElementById('roomMaxPlayers').value = saved.maxPlayers; document.getElementById('maxPlayersVal').innerText = saved.maxPlayers; }
    if (typeof saved.minAuthority === 'number') { document.getElementById('roomMinAuth').value = saved.minAuthority; document.getElementById('minAuthVal').innerText = saved.minAuthority; }
    if (typeof saved.minKarma === 'number') {
      const mkEl = document.getElementById('roomMinKarma');
      const mkValEl = document.getElementById('minKarmaVal');
      if (mkEl) mkEl.value = saved.minKarma;
      if (mkValEl) mkValEl.innerText = saved.minKarma;
    }
    if (Array.isArray(saved.selectedRoles) && saved.selectedRoles.length > 0) selectedRoleIds = new Set(saved.selectedRoles);
  } catch (e) {}
}

initAvatarFrames('editAvatarGrid', (val) => { editAvatarData = val; });
applyLogoTheme(localStorage.getItem('mafia_logo_theme') || 'gold');
loadSavedRoomSettings();
checkKyivHappyHourClient();

if (urlRefCode && document.getElementById('refCodeInput')) {
  document.getElementById('refCodeInput').value = urlRefCode;
}
if (localStorage.getItem('mafia_cookie_accepted') && document.getElementById('cookieBanner')) {
  document.getElementById('cookieBanner').style.display = 'none';
}
document.getElementById('acceptCookieBtn')?.addEventListener('click', () => {
  localStorage.setItem('mafia_cookie_accepted', '1');
  document.getElementById('cookieBanner').style.display = 'none';
});

function tryAutoAuth() {
  const savedAuth = localStorage.getItem('mafia_saved_auth');
  if (savedAuth) {
    try {
      const parsed = JSON.parse(savedAuth);
      if (parsed && parsed.mode === 'email' && parsed.email && parsed.password) {
        socket.emit('authEmail', { email: parsed.email, password: parsed.password, isRegister: false });
      } else if (parsed && parsed.nickname && parsed.password) {
        socket.emit('authUser', { nickname: parsed.nickname, password: parsed.password, devCode: parsed.devCode || '', isAutoLogin: true });
      }
    } catch (e) {}
  }
}
socket.on('connect', () => {
  tryAutoAuth();
});
if (socket.connected) tryAutoAuth();

document.getElementById('headerAvatarContainer').addEventListener('click', (e) => {
  e.stopPropagation();
  if (!currentUser) return;
  const zp = document.getElementById('zoomedAvatarPreview');
  zp.innerHTML = buildAvatarHTML(currentUser.avatar);
  applyAvatarRingAndFrame(zp, 'zoomed-avatar-circle', currentUser.equippedFrame, currentUser.avatarBorderColor);
  document.getElementById('avatarZoomModal').classList.add('open');
});
function syncRingColorSwatchesUI() {
  document.querySelectorAll('#avatarBorderColorPicker .ring-color-swatch').forEach(btn => {
    const col = (btn.getAttribute('data-ring-color') || '').toLowerCase();
    btn.classList.toggle('active', col === String(editAvatarBorderColor || '#f4a261').toLowerCase());
  });
}
document.querySelectorAll('#avatarBorderColorPicker .ring-color-swatch').forEach(btn => {
  btn.addEventListener('click', () => {
    const col = btn.getAttribute('data-ring-color');
    if (col) {
      editAvatarBorderColor = col;
      syncRingColorSwatchesUI();
    }
  });
});
document.getElementById('zoomedAvatarPreview').addEventListener('click', () => {
  document.getElementById('avatarZoomModal').classList.remove('open');
  if (currentUser.isGuest) return;
  editAvatarData = currentUser.avatar;
  editAvatarBorderColor = currentUser.avatarBorderColor || '#f4a261';
  syncRingColorSwatchesUI();
  document.getElementById('editGenderSelect').value = currentUser.gender || 'other';
  document.getElementById('editBioInput').value = currentUser.bio || '';
  document.getElementById('editAvatarModal').classList.add('open');
});
document.getElementById('closeZoomModalBtn').addEventListener('click', () => document.getElementById('avatarZoomModal').classList.remove('open'));
document.getElementById('editCustomPhoto')?.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    compressImageFile(e.target.files[0], (dataUrl) => { editAvatarData = dataUrl; });
  }
});
document.getElementById('saveProfileEditBtn').addEventListener('click', () => {
  socket.emit('updateProfileData', {
    avatar: editAvatarData,
    avatarBorderColor: editAvatarBorderColor,
    bio: document.getElementById('editBioInput').value.trim(),
    gender: document.getElementById('editGenderSelect').value
  });
  document.getElementById('editAvatarModal').classList.remove('open');
});
document.getElementById('cancelProfileEditBtn').addEventListener('click', () => document.getElementById('editAvatarModal').classList.remove('open'));
document.getElementById('headerBadge').addEventListener('click', (e) => { e.stopPropagation(); openBadgeModal(currentBadgeType || 'gold'); });
document.getElementById('closeBadgeModalBtn').addEventListener('click', () => document.getElementById('badgeInfoModal').classList.remove('open'));
document.getElementById('modalBadgeToggle').addEventListener('change', (e) => socket.emit('updateProfileData', { showBadge: e.target.checked }));
document.getElementById('settingsBadgeToggle').addEventListener('change', (e) => socket.emit('updateProfileData', { showBadge: e.target.checked }));
document.getElementById('closePubProfBtn').addEventListener('click', () => document.getElementById('publicProfileModal').classList.remove('open'));
document.getElementById('pubProfAddFriendBtn').addEventListener('click', () => {
  if (activePublicProfileNick) {
    socket.emit('sendFriendRequest', activePublicProfileNick);
    document.getElementById('publicProfileModal').classList.remove('open');
  }
});
document.getElementById('pubProfRemoveFriendBtn')?.addEventListener('click', () => {
  if (activePublicProfileNick && confirm(L('Видалити ' + activePublicProfileNick + ' зі списку друзів?', 'Remove ' + activePublicProfileNick + ' from friends?'))) {
    socket.emit('removeFriend', activePublicProfileNick);
    document.getElementById('publicProfileModal').classList.remove('open');
  }
});
document.getElementById('pubProfSendSmsBtn')?.addEventListener('click', () => {
  if (!activePublicProfileNick) return;
  activePmFriend = activePublicProfileNick;
  document.getElementById('pmChatTitle').innerText = L('✉️ Чат з ', '✉️ Chat with ') + activePublicProfileNick;
  socket.emit('openPrivateChat', activePublicProfileNick);
  document.getElementById('publicProfileModal').classList.remove('open');
  openTab('privateChatScreen');
});
let reportScreenshotData = null;

document.getElementById('pubProfReportBtn')?.addEventListener('click', () => {
  if (!activePublicProfileNick) return;
  document.getElementById('publicProfileModal').classList.remove('open');
  document.getElementById('reportModalTargetNick').innerText = activePublicProfileNick;
  document.getElementById('reportDetailsInput').value = '';
  reportScreenshotData = null;
  const prevWrap = document.getElementById('reportScreenshotPreviewWrap');
  if (prevWrap) prevWrap.style.display = 'none';
  const fileInput = document.getElementById('reportScreenshotInput');
  if (fileInput) fileInput.value = '';
  document.getElementById('reportPlayerModal').classList.add('open');
});

document.getElementById('cancelReportModalBtn')?.addEventListener('click', () => {
  document.getElementById('reportPlayerModal').classList.remove('open');
});

document.getElementById('reportScreenshotInput')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      reportScreenshotData = ev.target.result;
      const prev = document.getElementById('reportScreenshotPreview');
      const wrap = document.getElementById('reportScreenshotPreviewWrap');
      if (prev && wrap) {
        prev.src = reportScreenshotData;
        wrap.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
});

window.addEventListener('paste', (e) => {
  const reportModal = document.getElementById('reportPlayerModal');
  if (!reportModal || !reportModal.classList.contains('open')) return;
  const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      const reader = new FileReader();
      reader.onload = (ev) => {
        reportScreenshotData = ev.target.result;
        const prev = document.getElementById('reportScreenshotPreview');
        const wrap = document.getElementById('reportScreenshotPreviewWrap');
        if (prev && wrap) {
          prev.src = reportScreenshotData;
          wrap.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
      break;
    }
  }
});

document.getElementById('removeReportScreenshotBtn')?.addEventListener('click', () => {
  reportScreenshotData = null;
  const wrap = document.getElementById('reportScreenshotPreviewWrap');
  if (wrap) wrap.style.display = 'none';
  const fileInput = document.getElementById('reportScreenshotInput');
  if (fileInput) fileInput.value = '';
});

document.getElementById('submitReportModalBtn')?.addEventListener('click', () => {
  const targetNick = document.getElementById('reportModalTargetNick').innerText.trim();
  const cat = document.getElementById('reportCategorySelect').value;
  const details = document.getElementById('reportDetailsInput').value.trim();
  const reason = details ? `${cat}: ${details}` : cat;
  if (!targetNick) return;
  socket.emit('reportPlayer', {
    targetNick,
    reason,
    screenshot: reportScreenshotData
  });
  document.getElementById('reportPlayerModal').classList.remove('open');
});

document.getElementById('claimRewardBtn')?.addEventListener('click', () => {
  document.getElementById('rewardReceivedModal')?.classList.remove('open');
});

document.getElementById('closeScreenshotViewBtn')?.addEventListener('click', () => {
  document.getElementById('screenshotViewModal')?.classList.remove('open');
});
document.getElementById('closeRoomPlayersModalBtn').addEventListener('click', () => document.getElementById('roomPlayersModal').classList.remove('open'));
document.getElementById('openProfileStatsBtn').addEventListener('click', () => openTab('profileScreen'));

document.getElementById('authLangUaBtn')?.addEventListener('click', () => {
  if (typeof window.applyLanguage === 'function') window.applyLanguage('ua');
});
document.getElementById('authLangEnBtn')?.addEventListener('click', () => {
  if (typeof window.applyLanguage === 'function') window.applyLanguage('en');
});

const tabLoginBtn = document.getElementById('tabLoginMode');
const tabRegBtn = document.getElementById('tabRegisterMode');
const tabEmailBtn = document.getElementById('tabEmailMode');
const tabGuestBtn = document.getElementById('tabGuestMode');
const authHintEl = document.getElementById('authModeHint');
const mainLoginBtn = document.getElementById('guestLoginBtn');
const regExtraWrap = document.getElementById('regExtraWrap');
const passWrap = document.getElementById('passWrap');
const nickWrap = document.getElementById('nickWrap');
const emailAuthWrap = document.getElementById('emailAuthWrap');
let pendingAdminAuth = null;

function setAuthError(msg) { const el = document.getElementById('authError'); if (el) el.innerText = trSrv(msg); }

function mountGoogleSignInButton() {
  const mount = document.getElementById('googleBtnMount');
  const note = document.getElementById('googleFallbackNote');
  if (!mount) return;
  const cid = appServerConfig.googleClientId || '';
  if (!cid) {
    mount.innerHTML = '';
    if (note) note.innerText = L(
      '⚡ Вхід через Google (GIS) готовий та активується після додавання GOOGLE_CLIENT_ID на сервері. Зараз можна увійти по E-mail нижче!',
      '⚡ Google Sign-In (GIS) is ready and activates once GOOGLE_CLIENT_ID is configured on the server. You can sign in via E-mail below right now!'
    );
    return;
  }
  if (note) note.innerText = '';
  if (window.google && window.google.accounts && window.google.accounts.id) {
    try {
      window.google.accounts.id.initialize({
        client_id: cid,
        callback: (response) => {
          if (response && response.credential) {
            socket.emit('authGoogle', { idToken: response.credential });
          }
        }
      });
      mount.innerHTML = '';
      window.google.accounts.id.renderButton(mount, { theme: 'filled_black', size: 'large', width: 260, text: 'signin_with' });
    } catch (e) {}
    return;
  }
  if (!window._gisScriptRequested) {
    window._gisScriptRequested = true;
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => mountGoogleSignInButton();
    document.head.appendChild(s);
  }
}

function setActiveAuthTab(mode) {
  authMode = mode;
  [tabLoginBtn, tabRegBtn, tabEmailBtn, tabGuestBtn].forEach(b => b && b.classList.remove('active'));
  if (mode === 'login') tabLoginBtn?.classList.add('active');
  if (mode === 'register') tabRegBtn?.classList.add('active');
  if (mode === 'email') tabEmailBtn?.classList.add('active');
  if (mode === 'guest') tabGuestBtn?.classList.add('active');

  if (nickWrap) nickWrap.style.display = mode === 'email' ? 'none' : 'block';
  if (emailAuthWrap) emailAuthWrap.style.display = mode === 'email' ? 'block' : 'none';
  if (passWrap) passWrap.style.display = mode === 'guest' ? 'none' : 'block';
  if (regExtraWrap) regExtraWrap.style.display = mode === 'register' ? 'block' : 'none';

  if (mode === 'login') {
    authHintEl.innerText = L('Увійди у свій існуючий профіль за нікнеймом та паролем.', 'Sign in to your existing profile with your nickname and password.');
    mainLoginBtn.innerText = L('Увійти в гру', 'Sign In to Game');
  } else if (mode === 'register') {
    authHintEl.innerText = L('Створи новий унікальний профіль з паролем.', 'Create a new unique profile with a password.');
    mainLoginBtn.innerText = L('Створити профіль та увійти', 'Create Profile & Sign In');
  } else if (mode === 'email') {
    authHintEl.innerText = L('Швидкий вхід або реєстрація через Google чи вашу електронну пошту.', 'Quick sign-in or registration via Google or your e-mail.');
    mainLoginBtn.innerText = L('Продовжити через E-mail', 'Continue with E-mail');
    mountGoogleSignInButton();
  } else {
    authHintEl.innerText = L('Швидкий вхід без пароля! Сідай за стіл за 2 секунди.', 'Quick sign-in without a password! Take a seat in 2 seconds.');
    mainLoginBtn.innerText = L('🎭 Увійти як Гість', '🎭 Play as Guest');
  }
  setAuthError('');
}

tabLoginBtn.addEventListener('click', () => setActiveAuthTab('login'));
tabRegBtn.addEventListener('click', () => setActiveAuthTab('register'));
tabEmailBtn?.addEventListener('click', () => setActiveAuthTab('email'));
tabGuestBtn.addEventListener('click', () => setActiveAuthTab('guest'));

function submitAuthRequest(nickname, password, gender, devCode, refCode) {
  localStorage.setItem('mafia_saved_auth', JSON.stringify({ nickname, password, devCode }));
  socket.emit('authUser', { nickname, password, gender, devCode, refCode, isRegister: authMode === 'register', isAutoLogin: false });
}

mainLoginBtn.addEventListener('click', () => {
  setAuthError('');
  if (authMode === 'email') {
    const email = document.getElementById('emailInput')?.value.trim() || '';
    const password = document.getElementById('passInput').value.trim();
    const isRegister = !!(document.getElementById('emailIsRegisterCheck')?.checked);
    if (isRegister && password.length < 6) {
      return setAuthError(L('Пароль має містити щонайменше 6 символів!', 'Password must be at least 6 characters!'));
    }
    localStorage.setItem('mafia_saved_auth', JSON.stringify({ mode: 'email', email, password }));
    socket.emit('authEmail', { email, password, isRegister });
    return;
  }

  const nickname = document.getElementById('nickInput').value.trim();
  if (authMode === 'guest') return socket.emit('authGuest', { nickname });

  const password = document.getElementById('passInput').value.trim();
  if (authMode === 'register') {
    if (nickname.length > 10) {
      return setAuthError(L('Нікнейм може містити максимум 10 символів!', 'Nickname can be at most 10 characters!'));
    }
    if (password.length < 6) {
      return setAuthError(L('Пароль має містити щонайменше 6 символів!', 'Password must be at least 6 characters!'));
    }
  }
  const gender = document.getElementById('regGenderSelect')?.value || 'other';
  const refCode = document.getElementById('refCodeInput')?.value.trim() || '';
  pendingAdminAuth = { nickname, password, gender, refCode };
  if (nickname.toLowerCase() === 'itaminx') {
    document.getElementById('modalDevCodeInput').value = '';
    document.getElementById('devModalError').innerText = '';
    document.getElementById('devCodeModal').classList.add('open');
    setTimeout(() => document.getElementById('modalDevCodeInput').focus(), 100);
    return;
  }
  submitAuthRequest(nickname, password, gender, '', refCode);
});

document.getElementById('forgotPasswordBtn')?.addEventListener('click', () => {
  const fb = document.getElementById('fpFeedback');
  if (fb) fb.innerText = '';
  const nickVal = document.getElementById('nickInput')?.value.trim() || '';
  const fpId = document.getElementById('fpIdentifierInput');
  const fpAdminNick = document.getElementById('fpAdminNickInput');
  if (fpId && !fpId.value && nickVal) fpId.value = nickVal;
  if (fpAdminNick && !fpAdminNick.value && nickVal) fpAdminNick.value = nickVal;
  document.getElementById('forgotPasswordModal')?.classList.add('open');
});
document.getElementById('closeForgotPasswordBtn')?.addEventListener('click', () => {
  document.getElementById('forgotPasswordModal')?.classList.remove('open');
});
document.getElementById('fpTabCode')?.addEventListener('click', () => {
  document.getElementById('fpTabCode')?.classList.add('active');
  document.getElementById('fpTabAdmin')?.classList.remove('active');
  const cp = document.getElementById('fpCodePane');
  const ap = document.getElementById('fpAdminPane');
  if (cp) cp.style.display = 'block';
  if (ap) ap.style.display = 'none';
});
document.getElementById('fpTabAdmin')?.addEventListener('click', () => {
  document.getElementById('fpTabAdmin')?.classList.add('active');
  document.getElementById('fpTabCode')?.classList.remove('active');
  const cp = document.getElementById('fpCodePane');
  const ap = document.getElementById('fpAdminPane');
  if (cp) cp.style.display = 'none';
  if (ap) ap.style.display = 'block';
});
document.getElementById('fpSubmitCodeBtn')?.addEventListener('click', () => {
  const identifier = document.getElementById('fpIdentifierInput')?.value.trim() || '';
  const recoveryCode = document.getElementById('fpRecoveryCodeInput')?.value.trim() || '';
  const newPassword = document.getElementById('fpNewPassCodeInput')?.value.trim() || '';
  socket.emit('resetPasswordWithCode', { identifier, recoveryCode, newPassword });
});
document.getElementById('fpSubmitAdminBtn')?.addEventListener('click', () => {
  const nickname = document.getElementById('fpAdminNickInput')?.value.trim() || '';
  const newPassword = document.getElementById('fpAdminNewPassInput')?.value.trim() || '';
  const note = document.getElementById('fpAdminNoteInput')?.value.trim() || '';
  socket.emit('requestPasswordResetAdmin', { nickname, newPassword, note });
});
socket.on('passwordResetResult', ({ ok, msg }) => {
  const fb = document.getElementById('fpFeedback');
  if (fb) {
    fb.style.color = ok ? '#80ffdb' : '#ff6b6b';
    fb.innerText = trSrv(msg || '');
  }
});

socket.on('needDevCodePrompt', ({ isBratik } = {}) => {
  if (!pendingAdminAuth) {
    try {
      const saved = JSON.parse(localStorage.getItem('mafia_saved_auth') || '{}');
      pendingAdminAuth = {
        nickname: saved.nickname || document.getElementById('nickInput')?.value.trim() || '',
        password: saved.password || document.getElementById('passInput')?.value.trim() || '',
        gender: document.getElementById('regGenderSelect')?.value || 'other',
        refCode: document.getElementById('refCodeInput')?.value.trim() || ''
      };
    } catch (e) {}
  }
  const errEl = document.getElementById('devModalError');
  const inp = document.getElementById('modalDevCodeInput');
  if (inp) inp.value = '';
  if (errEl) {
    errEl.style.color = '#ffd166';
    errEl.innerText = isBratik
      ? L('🤝 Введіть ваш особистий секретний код Братіка:', '🤝 Enter your personal Bratik secret code:')
      : L('🔐 Введіть секретний код розробника:', '🔐 Enter developer secret code:');
  }
  document.getElementById('devCodeModal')?.classList.add('open');
  setTimeout(() => inp && inp.focus(), 100);
});

let pendingBratikNewCode = '';
document.getElementById('saveBratikCodeBtn')?.addEventListener('click', () => {
  const inp = document.getElementById('bratikNewSecretCodeInput');
  const errEl = document.getElementById('bratikCodeError');
  const code = (inp?.value || '').trim();
  if (code.length < 3 || code.length > 16) {
    if (errEl) errEl.innerText = L('Код має містити від 3 до 16 символів!', 'Code must be 3 to 16 characters!');
    return;
  }
  if (errEl) errEl.innerText = '';
  pendingBratikNewCode = code;
  socket.emit('setBratikSecretCode', { secretCode: code });
});
socket.on('promptBratikCodeSetup', () => {
  const inp = document.getElementById('bratikNewSecretCodeInput');
  const errEl = document.getElementById('bratikCodeError');
  if (inp) inp.value = '';
  if (errEl) errEl.innerText = '';
  document.getElementById('setupBratikCodeModal')?.classList.add('open');
  setTimeout(() => inp && inp.focus(), 100);
});
socket.on('bratikCodeFeedback', ({ ok, msg }) => {
  const errEl = document.getElementById('bratikCodeError');
  if (ok) {
    try {
      const saved = JSON.parse(localStorage.getItem('mafia_saved_auth') || '{}');
      if (saved && saved.nickname && pendingBratikNewCode) {
        saved.devCode = pendingBratikNewCode;
        localStorage.setItem('mafia_saved_auth', JSON.stringify(saved));
      }
    } catch (e) {}
    pendingBratikNewCode = '';
    document.getElementById('setupBratikCodeModal')?.classList.remove('open');
    if (typeof showPhoneNotification === 'function') {
      showPhoneNotification('🤝 ' + L('Братік', 'Bratik'), trSrv(msg || ''), 'bratik-code');
    } else {
      alert(trSrv(msg || ''));
    }
  } else if (errEl) {
    errEl.innerText = trSrv(msg || '');
  }
});

document.getElementById('confirmDevCodeBtn').addEventListener('click', () => {
  if (!pendingAdminAuth) return;
  const code = document.getElementById('modalDevCodeInput').value.trim();
  if (!code) { document.getElementById('devModalError').innerText = L('Введіть секретний код!', 'Enter the secret code!'); return; }
  document.getElementById('devCodeModal').classList.remove('open');
  submitAuthRequest(pendingAdminAuth.nickname, pendingAdminAuth.password, pendingAdminAuth.gender, code, pendingAdminAuth.refCode);
});
document.getElementById('cancelDevCodeBtn').addEventListener('click', () => { pendingAdminAuth = null; document.getElementById('devCodeModal').classList.remove('open'); });
document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('mafia_saved_auth'); location.reload(); });
document.getElementById('deleteGdprBtn')?.addEventListener('click', () => {
  if (confirm(L('Ви впевнені? Ваш акаунт та всі дані будуть безповоротно видалені (GDPR).', 'Are you sure? Your account and all data will be permanently deleted (GDPR).'))) {
    socket.emit('deleteMyAccount');
  }
});
document.getElementById('saveNewNickBtn')?.addEventListener('click', () => {
  const val = document.getElementById('newNickInput').value.trim();
  if (val.length >= 2 && val.length <= 10) socket.emit('updateProfileData', { newNickname: val });
});

document.querySelectorAll('[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.getAttribute('data-tab');
    if (tab === 'modMenuScreen') {
      previousScreenBeforeMod = 'mainMenuScreen';
      socket.emit('getAdminDashboard');
    }
    if (tab === 'friendsScreen') {
      const q = document.getElementById('searchPlayerInput')?.value.trim() || '';
      if (q) socket.emit('searchPlayers', q);
      else {
        const resBox = document.getElementById('playerSearchResults');
        if (resBox) resBox.innerHTML = '';
      }
      socket.emit('getFamiliesList');
    }
    openTab(tab);
  });
});

document.getElementById('bannerNewsBtn')?.addEventListener('click', () => openTab('devScreen'));
document.getElementById('bannerDevChatBtn')?.addEventListener('click', () => {
  if (!currentUser || currentUser.isGuest) return openTab('devScreen');
  activePmFriend = 'Itaminx';
  document.getElementById('pmChatTitle').innerText = L('👨‍💻 Конфіденційний чат з Itaminx', '👨‍💻 Confidential Chat with Itaminx');
  socket.emit('openPrivateChat', 'Itaminx');
  openTab('privateChatScreen');
});

const logoThemeSel = document.getElementById('logoThemeSelect');
if (logoThemeSel) logoThemeSel.addEventListener('change', (e) => applyLogoTheme(e.target.value));

// Налаштування звуку, шрифту та анімацій
const soundToggle = document.getElementById('settingsSoundToggle');
if (soundToggle) {
  soundToggle.checked = soundEnabled;
  soundToggle.addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
    localStorage.setItem('mafia_sound_enabled', soundEnabled);
    if (soundEnabled) sfxClick();
  });
}

const volumeSlider = document.getElementById('settingsVolumeSlider');
const volumeVal = document.getElementById('settingsVolumeVal');
if (volumeSlider) {
  volumeSlider.value = Math.round(soundVolume * 100);
  if (volumeVal) volumeVal.innerText = volumeSlider.value + '%';
  volumeSlider.addEventListener('input', (e) => {
    soundVolume = parseInt(e.target.value, 10) / 100;
    if (volumeVal) volumeVal.innerText = e.target.value + '%';
    localStorage.setItem('mafia_sound_volume', soundVolume);
  });
  volumeSlider.addEventListener('change', () => {
    sfxClick();
  });
}

const chatFontSelect = document.getElementById('settingsChatFontSize');
if (chatFontSelect) {
  chatFontSelect.value = chatFontSize;
  applyFontSize(chatFontSize);
  chatFontSelect.addEventListener('change', (e) => applyFontSize(e.target.value));
  chatFontSelect.addEventListener('input', (e) => applyFontSize(e.target.value));
}

const chatStyleSelect = document.getElementById('settingsChatStyle');
if (chatStyleSelect) {
  chatStyleSelect.value = chatStyle;
  chatStyleSelect.addEventListener('change', (e) => {
    chatStyle = e.target.value;
    localStorage.setItem('mafia_chat_style', chatStyle);
    document.body.classList.toggle('chat-style-classic', chatStyle === 'classic');
  });
}

const settingsTranslateLangSel = document.getElementById('settingsTranslateLang');
if (settingsTranslateLangSel) {
  const initialTr = getSavedTranslateLang() || (currentLang === 'en' ? 'en' : 'uk');
  settingsTranslateLangSel.value = initialTr;
  settingsTranslateLangSel.addEventListener('change', (e) => {
    setSavedTranslateLang(e.target.value);
  });
}

const pushBtn = document.getElementById('enablePushNotificationsBtn');
if (pushBtn) {
  const refreshPushBtnText = () => {
    const enabled = localStorage.getItem('mafia_push_enabled') !== '0';
    const granted = ('Notification' in window) && Notification.permission === 'granted';
    if (granted && enabled) {
      pushBtn.innerText = L('🔔 Сповіщення в шторці: УВІМКНЕНО (натисніть для вимкн.)', '🔔 Push notifications: ON (tap to disable)');
      pushBtn.style.borderColor = '#2a9d8f';
    } else {
      pushBtn.innerText = L('🔕 Увімкнути сповіщення в шторці телефону', '🔕 Enable phone shade notifications');
      pushBtn.style.borderColor = '#80ffdb';
    }
  };
  refreshPushBtnText();
  pushBtn.addEventListener('click', async () => {
    if (!('Notification' in window)) {
      return alert(L('Ваш браузер не підтримує системні Push-сповіщення. Використовуватиметься верхня шторка всередині гри.', 'Your browser does not support system Push notifications. In-app notification shade will be used.'));
    }
    const curEnabled = localStorage.getItem('mafia_push_enabled') !== '0';
    if (Notification.permission === 'granted' && curEnabled) {
      localStorage.setItem('mafia_push_enabled', '0');
      refreshPushBtnText();
      return;
    }
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm === 'granted') {
      localStorage.setItem('mafia_push_enabled', '1');
      refreshPushBtnText();
      if (typeof showPhoneNotification === 'function') {
        showPhoneNotification('Mafia Club', L('✅ Сповіщення увімкнено!', '✅ Notifications enabled!'), 'push-test');
      }
    } else {
      localStorage.setItem('mafia_push_enabled', '0');
      refreshPushBtnText();
      alert(L('Дозвіл на сповіщення не надано у налаштуваннях браузера/телефону.', 'Notification permission was denied in browser/device settings.'));
    }
  });
}

document.getElementById('saveSettingsEmailBtn')?.addEventListener('click', () => {
  const emailInp = document.getElementById('settingsEmailInput');
  const email = (emailInp?.value || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return alert(L('Введіть коректну адресу електронної пошти!', 'Please enter a valid e-mail address!'));
  }
  socket.emit('updateProfileData', { email });
  const btn = document.getElementById('saveSettingsEmailBtn');
  if (btn) {
    const oldTxt = btn.innerText;
    btn.innerText = L('✅ Збережено', '✅ Saved');
    setTimeout(() => { btn.innerText = oldTxt; }, 1800);
  }
});

document.getElementById('quickCreateRoomBtn')?.addEventListener('click', () => {
  openTab('playScreen');
  const f = document.getElementById('createRoomForm');
  if (f) {
    f.style.display = 'block';
    setTimeout(() => f.scrollIntoView({ behavior: 'smooth' }), 60);
  }
});

const animToggle = document.getElementById('settingsAnimToggle');
if (animToggle) {
  animToggle.checked = animEnabled;
  animToggle.addEventListener('change', (e) => {
    animEnabled = e.target.checked;
    localStorage.setItem('mafia_anim_enabled', animEnabled);
  });
}

const profToggle = document.getElementById('settingsProfanityToggle');
const customWordsInp = document.getElementById('settingsCustomWordsInput');
const saveCustomWordsBtn = document.getElementById('saveCustomWordsBtn');
if (profToggle) {
  profToggle.checked = profanityEnabled;
  profToggle.addEventListener('change', (e) => {
    profanityEnabled = e.target.checked;
    localStorage.setItem('mafia_profanity_enabled', String(profanityEnabled));
    if (currentUser && !currentUser.isGuest) {
      socket.emit('updateProfileData', { profanityFilter: profanityEnabled });
    }
  });
}
if (customWordsInp) customWordsInp.value = customBadWords.join(', ');
if (saveCustomWordsBtn) {
  saveCustomWordsBtn.addEventListener('click', () => {
    const raw = (customWordsInp?.value || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 50);
    customBadWords = raw;
    localStorage.setItem('mafia_custom_bad_words', JSON.stringify(customBadWords));
    if (currentUser && !currentUser.isGuest) {
      socket.emit('updateProfileData', { profanityFilter: profanityEnabled, customBadWords });
    }
    const fb = document.getElementById('customWordsFeedback');
    if (fb) fb.innerText = L(`✅ Збережено (${customBadWords.length} слів)!`, `✅ Saved (${customBadWords.length} words)!`);
  });
}

// Вітальне вікно розробника та ідеї
document.getElementById('openDevWelcomeBtn')?.addEventListener('click', () => {
  const fb = document.getElementById('welcomeIdeaFeedback');
  if (fb) fb.innerText = '';
  document.getElementById('devWelcomeModal')?.classList.add('open');
});
document.getElementById('closeDevWelcomeBtn')?.addEventListener('click', () => {
  document.getElementById('devWelcomeModal')?.classList.remove('open');
  if (currentUser && !currentUser.isGuest && currentUser.seenWelcome === false) {
    currentUser.seenWelcome = true;
    socket.emit('markWelcomeSeen');
  }
  if (latestReleaseNotes && localStorage.getItem('mafia_seen_version') !== (latestReleaseNotes.version || latestAppVersion)) {
    setTimeout(() => openUpdateChangelogModal(false), 250);
  }
});
document.getElementById('submitWelcomeIdeaBtn')?.addEventListener('click', () => {
  const inp = document.getElementById('welcomeIdeaInput');
  const txt = (inp?.value || '').trim();
  if (!txt) return;
  socket.emit('submitPlayerIdea', txt);
  if (inp) inp.value = '';
});
socket.on('ideaFeedback', (msg) => {
  const fb = document.getElementById('welcomeIdeaFeedback');
  if (fb) fb.innerText = trSrv(msg);
});

// Звук на натискання кнопок інтерфейсу
document.addEventListener('click', (e) => {
  if (e.target.closest('button, .menu-btn, .action-target-btn, .role-card-item, .quick-react-btn, .auth-tab-btn')) {
    sfxClick();
  }
});

const tabMyFriendsBtn = document.getElementById('tabMyFriends');
const tabFriendReqsBtn = document.getElementById('tabFriendReqs');
const tabFamilyBtn = document.getElementById('tabFamily');
if (tabMyFriendsBtn && tabFriendReqsBtn && tabFamilyBtn) {
  tabMyFriendsBtn.addEventListener('click', () => {
    tabMyFriendsBtn.classList.add('active'); tabFriendReqsBtn.classList.remove('active'); tabFamilyBtn.classList.remove('active');
    document.getElementById('friendsMainPane').style.display = 'block';
    document.getElementById('friendsReqPane').style.display = 'none';
    document.getElementById('familyPane').style.display = 'none';
  });
  tabFriendReqsBtn.addEventListener('click', () => {
    tabFriendReqsBtn.classList.add('active'); tabMyFriendsBtn.classList.remove('active'); tabFamilyBtn.classList.remove('active');
    document.getElementById('friendsMainPane').style.display = 'none';
    document.getElementById('friendsReqPane').style.display = 'block';
    document.getElementById('familyPane').style.display = 'none';
  });
  tabFamilyBtn.addEventListener('click', () => {
    tabFamilyBtn.classList.add('active'); tabMyFriendsBtn.classList.remove('active'); tabFriendReqsBtn.classList.remove('active');
    document.getElementById('friendsMainPane').style.display = 'none';
    document.getElementById('friendsReqPane').style.display = 'none';
    document.getElementById('familyPane').style.display = 'block';
    socket.emit('getFamiliesList');
  });
}

const searchPlayerInp = document.getElementById('searchPlayerInput');
const searchPlayerBtn = document.getElementById('searchPlayerBtn');
let searchDebounceTimer = null;
function triggerPlayerSearch() {
  const q = (searchPlayerInp?.value || '').trim();
  const resBox = document.getElementById('playerSearchResults');
  if (!q) {
    if (resBox) resBox.innerHTML = '';
    return;
  }
  socket.emit('searchPlayers', q);
}
if (searchPlayerInp) {
  searchPlayerInp.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    if (!searchPlayerInp.value.trim()) {
      const resBox = document.getElementById('playerSearchResults');
      if (resBox) resBox.innerHTML = '';
      return;
    }
    searchDebounceTimer = setTimeout(triggerPlayerSearch, 240);
  });
  searchPlayerInp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerPlayerSearch();
    }
  });
}
if (searchPlayerBtn) {
  searchPlayerBtn.addEventListener('click', triggerPlayerSearch);
}

socket.on('searchPlayersResult', (list) => {
  const resBox = document.getElementById('playerSearchResults');
  if (!resBox) return;
  if (!list || list.length === 0) {
    const q = (searchPlayerInp?.value || '').trim();
    resBox.innerHTML = `<div style="font-size:12px; color:#aaa; padding:6px 0;">${q
      ? L(`Зареєстрованих гравців за запитом «${escapeHTML(q)}» не знайдено.`, `No registered players found matching "${escapeHTML(q)}".`)
      : L('Поки немає інших зареєстрованих гравців (лише гості не відображаються у загальному списку).', 'No other registered players yet (guest accounts are not listed).')}</div>`;
    return;
  }
  resBox.innerHTML = '<div style="font-size:11px; color:#8892b0; margin-bottom:4px;">' + L('Знайдено профілів', 'Profiles found') + ' (' + list.length + '):</div>';
  list.forEach(p => {
    const row = document.createElement('div');
    row.className = 'friend-row';
    row.style.marginTop = '4px';
    const dot = p.online ? '<span style="color:#2a9d8f;">●</span>' : '<span style="color:#666;">●</span>';
    const friendBtnHtml = p.isFriend
      ? '<span style="font-size:11px; color:#2a9d8f; font-weight:bold;">✓ ' + L('Друг', 'Friend') + '</span>'
      : (p.requestSent
        ? '<span style="font-size:11px; color:#f4a261;">⏳ ' + L('Запит', 'Pending') + '</span>'
        : '<button type="button" class="add-fr-direct-btn" style="width:auto; padding:5px 8px; margin:0; background:#2a9d8f; font-size:11px;">➕ ' + L('Дружити', 'Add Friend') + '</button>');

    const pFrame = (p.equippedFrame && /^frame_[a-z0-9_]+$/i.test(p.equippedFrame)) ? (' ' + p.equippedFrame) : '';
    row.innerHTML =
      '<div style="display:flex; align-items:center; gap:8px; flex:1; overflow:hidden;">' +
        '<div class="mini-friend-ava' + pFrame + '" style="' + buildAvatarRingStyle(p.avatarBorderColor) + '" title="' + L('Відкрити профіль', 'Open profile') + '">' + buildAvatarHTML(p.avatar) + '</div>' +
        '<div style="overflow:hidden;">' +
          '<div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + dot + ' <b>' + p.nickname + '</b> ' + buildBadgeHTML(p.badgeType) + '</div>' +
          '<div style="font-size:11px; color:#aaa;">' + L('Рівень ', 'Level ') + p.level + ' • ' + L('Карма ', 'Karma ') + p.karma + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex; gap:4px; align-items:center;">' +
        friendBtnHtml +
        '<button type="button" class="open-prof-btn secondary" style="width:auto; padding:5px 8px; margin:0; font-size:11px;">👤</button>' +
      '</div>';

    row.querySelector('.mini-friend-ava').addEventListener('click', () => socket.emit('getPlayerProfile', p.nickname));
    row.querySelector('.open-prof-btn').addEventListener('click', () => socket.emit('getPlayerProfile', p.nickname));
    const addBtn = row.querySelector('.add-fr-direct-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        socket.emit('sendFriendRequest', p.nickname);
        addBtn.disabled = true;
        addBtn.innerText = L('⏳ Надіслано', '⏳ Sent');
      });
    }
    resBox.appendChild(row);
  });
});

document.getElementById('copyRefLinkBtn')?.addEventListener('click', () => {
  if (!currentUser) return;
  const link = window.location.origin + '/?ref=' + encodeURIComponent(currentUser.nickname);
  navigator.clipboard?.writeText(link);
  document.getElementById('friendFeedback').innerText = L('✅ Реферальне посилання скопійовано: ', '✅ Referral link copied: ') + link;
});

const copyRoomLinkBtn = document.getElementById('copyRoomLinkBtn');
if (copyRoomLinkBtn) {
  copyRoomLinkBtn.addEventListener('click', () => {
    const roomId = copyRoomLinkBtn.getAttribute('data-room-id') || '';
    const link = window.location.origin + '/?join=' + roomId;
    navigator.clipboard?.writeText(link);
    copyRoomLinkBtn.innerText = L('✅ Скопійовано!', '✅ Copied!');
    setTimeout(() => { copyRoomLinkBtn.innerText = L('🔗 Запросити', '🔗 Invite'); }, 2000);
  });
}

document.getElementById('shareMatchResultBtn')?.addEventListener('click', () => {
  renderMatchSummaryCanvas(lastRoomSnapshot);
  document.getElementById('matchCardModal').classList.add('open');
});
document.getElementById('closeMatchCardBtn')?.addEventListener('click', () => document.getElementById('matchCardModal').classList.remove('open'));
document.getElementById('downloadMatchCardBtn')?.addEventListener('click', () => {
  const canvas = document.getElementById('matchSummaryCanvas');
  const link = document.createElement('a');
  link.download = 'mafia-club-result.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

const sendLastWillBtn = document.getElementById('sendLastWillBtn');
if (sendLastWillBtn) {
  sendLastWillBtn.addEventListener('click', () => {
    const inp = document.getElementById('lastWillInput');
    if (inp && inp.value.trim()) { socket.emit('submitLastWill', inp.value); inp.value = ''; }
  });
}
document.getElementById('sendPmBtn').addEventListener('click', () => {
  const inp = document.getElementById('pmMsgInput');
  if (activePmFriend && inp.value.trim()) { socket.emit('sendPrivateMsg', { toNick: activePmFriend, text: inp.value }); inp.value = ''; }
});
document.getElementById('topAllBtn').addEventListener('click', () => { document.getElementById('topAllBtn').className = ''; document.getElementById('topTodayBtn').className = 'secondary'; socket.emit('getLeaderboard', 'all'); });
document.getElementById('topTodayBtn').addEventListener('click', () => { document.getElementById('topTodayBtn').className = ''; document.getElementById('topAllBtn').className = 'secondary'; socket.emit('getLeaderboard', 'today'); });
document.getElementById('openTopBtn').addEventListener('click', () => { socket.emit('getLeaderboard', 'all'); openTab('topScreen'); });

document.getElementById('inRoomModBtn').addEventListener('click', () => { previousScreenBeforeMod = 'roomScreen'; socket.emit('getAdminDashboard'); openTab('modMenuScreen'); });
document.getElementById('inLobbyModBtn')?.addEventListener('click', () => { previousScreenBeforeMod = 'lobbyScreen'; socket.emit('getAdminDashboard'); openTab('modMenuScreen'); });
document.getElementById('modBackBtn').addEventListener('click', () => openTab(previousScreenBeforeMod));
document.getElementById('refreshDashboardBtn')?.addEventListener('click', () => socket.emit('getAdminDashboard'));

document.getElementById('leaveLobbyBtn')?.addEventListener('click', () => {
  if (typeof window.closeLobbyMinigames === 'function') window.closeLobbyMinigames();
  activeRoomId = null;
  initializedGameRoomId = null;
  socket.emit('leaveRoom');
  openTab('playScreen');
});
document.getElementById('openLobbyMinigamesBtn')?.addEventListener('click', () => {
  if (typeof window.openLobbyMinigames === 'function') {
    window.openLobbyMinigames(socket, lastRoomSnapshot ? lastRoomSnapshot.lobbyCountdown : 0);
  }
});
document.getElementById('closeLobbyMinigamesBtn')?.addEventListener('click', () => {
  if (typeof window.closeLobbyMinigames === 'function') window.closeLobbyMinigames();
});
const lobbyMsgInputEl = document.getElementById('lobbyMsgInput');
document.getElementById('sendLobbyMsgBtn')?.addEventListener('click', () => {
  if (!lobbyMsgInputEl) return;
  const val = lobbyMsgInputEl.value.trim();
  if (val) {
    socket.emit('sendRoomMsg', val);
    lobbyMsgInputEl.value = '';
  }
});
lobbyMsgInputEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('sendLobbyMsgBtn')?.click();
  }
});
document.getElementById('copyLobbyLinkBtn')?.addEventListener('click', () => {
  const rid = document.getElementById('copyLobbyLinkBtn')?.getAttribute('data-room-id') || (lastRoomSnapshot && lastRoomSnapshot.id);
  if (!rid) return;
  const url = location.origin + '/?join=' + rid;
  if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
  alert(L('Посилання на кімнату скопійовано:\n', 'Room link copied:\n') + url);
});

function renderHireBotsGrid() {
  const grid = document.getElementById('hireBotsGrid');
  const priceTag = document.getElementById('hireBotsPriceTag');
  const selBtn = document.getElementById('hireSelectedBotsBtn');
  if (!grid) return;

  const isFree = !!(isDevAdmin || staffRole === 'bratik' || (currentUser && currentUser.isTester));
  if (priceTag) {
    priceTag.innerText = isFree
      ? L('🎁 Безкоштовно (Адмін / Братік / Тестер)', '🎁 Free (Admin / Bratik / Tester)')
      : L('25 🪙 / бот (особливий ШІ)', '25 🪙 / bot (custom AI)');
  }

  const inLobbyNames = new Set(((lastRoomSnapshot && lastRoomSnapshot.players) || []).map(p => (p.nickname || '').toLowerCase()));
  grid.innerHTML = '';

  (botCatalogList || []).forEach(bot => {
    const alreadyIn = inLobbyNames.has((bot.name || '').toLowerCase());
    const isSel = selectedBotsToHire.has(bot.id) && !alreadyIn;
    const card = document.createElement('div');
    card.className = 'bot-hire-card' + (isSel ? ' selected' : '') + (alreadyIn ? ' in-lobby' : '');
    card.innerHTML =
      '<div class="mini-friend-ava" style="margin:0 auto 4px;">' + buildAvatarHTML(bot.avatar || 'SLOT:1') + '</div>' +
      '<div style="font-size:11px; font-weight:bold; color:#ffd166; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + escapeHTML(bot.name) + '</div>' +
      '<div style="font-size:10px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + escapeHTML(trSrv(bot.style || '')) + '</div>' +
      '<div style="font-size:10px; margin-top:3px; color:' + (alreadyIn ? '#80ffdb' : '#cbd5e1') + ';">' +
        (alreadyIn ? L('✅ У лобі', '✅ In lobby') : (isSel ? L('☑️ Обрано', '☑️ Selected') : (isFree ? L('🎁 0 🪙', '🎁 0 🪙') : '25 🪙'))) +
      '</div>';

    if (!alreadyIn) {
      card.addEventListener('click', () => {
        if (selectedBotsToHire.has(bot.id)) selectedBotsToHire.delete(bot.id);
        else selectedBotsToHire.add(bot.id);
        renderHireBotsGrid();
      });
    }
    grid.appendChild(card);
  });

  if (selBtn) {
    const cnt = selectedBotsToHire.size;
    const costTxt = isFree ? L('Безкоштовно', 'Free') : `${cnt * 25} 🪙`;
    selBtn.disabled = cnt === 0;
    selBtn.innerText = cnt > 0
      ? L(`🤖 Додати обраних (${cnt} • ${costTxt})`, `🤖 Hire Selected (${cnt} • ${costTxt})`)
      : L('🤖 Додати обраних', '🤖 Hire Selected');
  }
}

document.getElementById('openHireBotsBtn')?.addEventListener('click', () => {
  selectedBotsToHire.clear();
  const fb = document.getElementById('hireBotsFeedback');
  if (fb) fb.innerText = '';
  renderHireBotsGrid();
  document.getElementById('hireBotsModal')?.classList.add('open');
});
document.getElementById('closeHireBotsBtn')?.addEventListener('click', () => {
  document.getElementById('hireBotsModal')?.classList.remove('open');
});
document.getElementById('hireSelectedBotsBtn')?.addEventListener('click', () => {
  const botIds = Array.from(selectedBotsToHire);
  if (botIds.length === 0) return;
  socket.emit('hireLobbyBots', { botIds });
});
document.getElementById('hireRandom3BotsBtn')?.addEventListener('click', () => {
  const inLobbyNames = new Set(((lastRoomSnapshot && lastRoomSnapshot.players) || []).map(p => (p.nickname || '').toLowerCase()));
  const avail = (botCatalogList || []).filter(b => !inLobbyNames.has((b.name || '').toLowerCase()));
  const shuffled = avail.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  if (shuffled.length === 0) {
    const fb = document.getElementById('hireBotsFeedback');
    if (fb) fb.innerText = L('⚠️ Всі 16 ботів вже в лобі!', '⚠️ All 16 bots are already in the lobby!');
    return;
  }
  socket.emit('hireLobbyBots', { botIds: shuffled.map(b => b.id) });
});
socket.on('hireBotsResult', ({ ok, msg }) => {
  const fb = document.getElementById('hireBotsFeedback');
  if (fb) {
    fb.style.color = ok ? '#80ffdb' : '#ff6b6b';
    fb.innerText = trSrv(msg || '');
  }
  if (ok) {
    selectedBotsToHire.clear();
    renderHireBotsGrid();
  }
});

document.getElementById('modAssignBratikBtn')?.addEventListener('click', () => {
  const targetNick = document.getElementById('modBratikNick')?.value.trim();
  if (!targetNick) return alert(L('Введіть нікнейм гравця для посади «Братік»!', 'Enter player nickname for Bratik role!'));
  socket.emit('adminCommand', { action: 'assignBratik', payload: { targetNick, revoke: false } });
});
document.getElementById('modRevokeBratikBtn')?.addEventListener('click', () => {
  const targetNick = document.getElementById('modBratikNick')?.value.trim();
  if (!targetNick) return alert(L('Введіть нікнейм гравця, щоб зняти посаду «Братік»!', 'Enter nickname to revoke Bratik role!'));
  socket.emit('adminCommand', { action: 'assignBratik', payload: { targetNick, revoke: true } });
});
document.getElementById('modGrantTesterBtn')?.addEventListener('click', () => {
  const targetNick = document.getElementById('modTesterNick')?.value.trim();
  if (!targetNick) return alert(L('Введіть нікнейм гравця для видачі Тестера!', 'Enter player nickname to grant Tester!'));
  socket.emit('adminCommand', { action: 'grantTester', payload: { targetNick, revoke: false } });
});
document.getElementById('modRevokeTesterBtn')?.addEventListener('click', () => {
  const targetNick = document.getElementById('modTesterNick')?.value.trim();
  if (!targetNick) return alert(L('Введіть нікнейм гравця, щоб зняти Тестера!', 'Enter nickname to revoke Tester!'));
  socket.emit('adminCommand', { action: 'grantTester', payload: { targetNick, revoke: true } });
});
document.getElementById('modSetStaffRoleBtn')?.addEventListener('click', () => {
  const targetNick = document.getElementById('modStaffNick')?.value.trim();
  const role = document.getElementById('modStaffRoleSelect')?.value || 'player';
  if (!targetNick) return alert(L('Введіть нікнейм гравця для зміни ролі персоналу!', 'Enter player nickname to change staff role!'));
  socket.emit('adminCommand', { action: 'setStaffRole', payload: { targetNick, role } });
});
document.getElementById('modIdeasDetails')?.addEventListener('toggle', (e) => {
  if (e.target.open && unreadIdeasCount > 0) {
    socket.emit('adminCommand', { action: 'markIdeasRead', payload: {} });
    if (typeof updateAdminIdeasBadges === 'function') updateAdminIdeasBadges(0);
  }
});
document.getElementById('modAdd4Bots').addEventListener('click', () => socket.emit('adminCommand', { action: 'addBots', payload: { count: 4 } }));
document.getElementById('modAdd8Bots').addEventListener('click', () => socket.emit('adminCommand', { action: 'addBots', payload: { count: 8 } }));
document.getElementById('modClearBots').addEventListener('click', () => socket.emit('adminCommand', { action: 'clearBots', payload: {} }));
document.getElementById('modBotStyle').addEventListener('change', (e) => socket.emit('adminCommand', { action: 'setBotStyle', payload: { style: e.target.value } }));
document.getElementById('modSkipPhaseBtn').addEventListener('click', () => socket.emit('adminCommand', { action: 'skipPhase', payload: {} }));
document.getElementById('modBotSayBtn').addEventListener('click', () => socket.emit('adminCommand', { action: 'botOrder', payload: { orderType: 'say', botNick: document.getElementById('modBotTargetNick').value.trim(), text: document.getElementById('modBotSayText').value.trim() } }));
document.getElementById('modBotVoteBtn').addEventListener('click', () => socket.emit('adminCommand', { action: 'botOrder', payload: { orderType: 'vote', botNick: document.getElementById('modBotTargetNick').value.trim(), targetNick: document.getElementById('modBotVoteTarget').value.trim() } }));
document.getElementById('modApplyPunishBtn')?.addEventListener('click', () => {
  const targetNick = document.getElementById('modPunishNick')?.value.trim();
  if (!targetNick) return alert(L('Введіть нікнейм гравця!', 'Enter a player nickname!'));
  const punishType = document.getElementById('modPunishType')?.value || 'warn';
  const reason = document.getElementById('modPunishReason')?.value.trim() || '';
  socket.emit('adminCommand', { action: 'punishUser', payload: { targetNick, punishType, reason } });
});
document.getElementById('modUnmuteBtn')?.addEventListener('click', () => {
  const targetNick = document.getElementById('modPunishNick')?.value.trim();
  if (!targetNick) return alert(L('Введіть нікнейм гравця для зняття муту!', 'Enter a player nickname to unmute!'));
  socket.emit('adminCommand', { action: 'unmuteUser', payload: { targetNick } });
});
document.getElementById('modUnplaybanBtn')?.addEventListener('click', () => {
  const targetNick = document.getElementById('modPunishNick')?.value.trim();
  if (!targetNick) return alert(L('Введіть нікнейм гравця для зняття заборони на гру!', 'Enter a player nickname to lift play-ban!'));
  socket.emit('adminCommand', { action: 'unplaybanUser', payload: { targetNick } });
});
document.getElementById('modUnbanBtn')?.addEventListener('click', () => {
  const targetNick = document.getElementById('modPunishNick')?.value.trim();
  if (!targetNick) return alert(L('Введіть нікнейм гравця для розбану!', 'Enter a player nickname to unban!'));
  socket.emit('adminCommand', { action: 'unbanUser', payload: { targetNick } });
});
document.getElementById('clearSuspiciousLogsBtn')?.addEventListener('click', () => {
  if (confirm(L('Очистити журнал підозрілих дій (античит)?', 'Clear suspicious activity log (anti-cheat)?'))) {
    socket.emit('adminCommand', { action: 'clearSuspiciousLogs', payload: {} });
  }
});

let cachedAdminReports = [];
let currentReportFilter = 'open';
document.querySelectorAll('.report-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.report-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentReportFilter = btn.getAttribute('data-filter') || 'open';
    renderAdminReportsList();
  });
});
document.getElementById('adminReportSearchInput')?.addEventListener('input', renderAdminReportsList);
document.getElementById('modGiftBtn').addEventListener('click', () => {
  const targetNick = document.getElementById('modGiftNick').value.trim();
  if (!targetNick) return alert(L('Вкажіть нікнейм гравця для нарахування нагороди!', 'Enter a player nickname to grant rewards!'));
  socket.emit('adminCommand', {
    action: 'giftResources',
    payload: {
      targetNick,
      coins: document.getElementById('modGiftCoins').value,
      diamonds: document.getElementById('modGiftDiamonds')?.value || 0,
      authority: document.getElementById('modGiftAuth').value,
      xp: document.getElementById('modGiftXp').value,
      comment: document.getElementById('modGiftComment')?.value?.trim() || ''
    }
  });
});
document.getElementById('modCreatePostBtn')?.addEventListener('click', () => {
  socket.emit('adminCommand', { action: 'createDevPost', payload: { title: document.getElementById('modPostTitle').value, text: document.getElementById('modPostText').value } });
  document.getElementById('modPostTitle').value = '';
  document.getElementById('modPostText').value = '';
});

document.getElementById('roomIsPrivate')?.addEventListener('change', (e) => {
  document.getElementById('roomPasswordInput').style.display = e.target.checked ? 'block' : 'none';
});
document.getElementById('roomMinPlayers').addEventListener('input', (e) => {
  const minVal = Number(e.target.value), maxSlider = document.getElementById('roomMaxPlayers');
  document.getElementById('minPlayersVal').innerText = minVal;
  if (Number(maxSlider.value) < minVal) { maxSlider.value = minVal; document.getElementById('maxPlayersVal').innerText = minVal; }
  renderRoleCards();
});
document.getElementById('roomMaxPlayers').addEventListener('input', (e) => {
  const maxVal = Number(e.target.value), minSlider = document.getElementById('roomMinPlayers');
  document.getElementById('maxPlayersVal').innerText = maxVal;
  if (Number(minSlider.value) > maxVal) { minSlider.value = maxVal; document.getElementById('minPlayersVal').innerText = maxVal; renderRoleCards(); }
  else updateRolesForecast();
});
document.getElementById('roomMinAuth').addEventListener('input', (e) => { document.getElementById('minAuthVal').innerText = e.target.value; });
document.getElementById('roomMinKarma')?.addEventListener('input', (e) => {
  const kv = document.getElementById('minKarmaVal');
  if (kv) kv.innerText = e.target.value;
});
document.querySelectorAll('.stepper-btn[data-slider][data-delta]').forEach(btn => {
  btn.addEventListener('click', () => {
    const slider = document.getElementById(btn.getAttribute('data-slider'));
    const delta = Number(btn.getAttribute('data-delta') || 0);
    if (!slider || !delta) return;
    const min = Number(slider.min || 0);
    const max = Number(slider.max || 100);
    const step = Number(slider.step || 1);
    const cur = Number(slider.value || min);
    const next = Math.max(min, Math.min(max, cur + delta * (Math.abs(delta) < step ? step : 1)));
    slider.value = next;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
});
document.getElementById('toggleCreateRoomBtn').addEventListener('click', () => {
  if (!currentUser) return alert(L('Будь ласка, увійдіть у свій акаунт!', 'Please sign in to your account!'));
  const myActive = latestRoomsList.find(r => r.status === 'playing' && (r.playersList || []).some(p => p.nickname && p.nickname.toLowerCase() === currentUser.nickname.toLowerCase() && p.alive));
  if (myActive) return alert(L('⚠️ Ви ще живі у грі «' + myActive.name + '»! Не можна створювати нові кімнати.', '⚠️ You are still alive in match "' + myActive.name + '"! Cannot create new rooms.'));

  const myWaiting = latestRoomsList.find(r => r.status === 'waiting' && r.creator && r.creator.toLowerCase() === currentUser.nickname.toLowerCase());
  if (myWaiting) {
    if (confirm(L(
      'У вас вже є створена кімната «' + myWaiting.name + '»!\n\nНатисніть «ОК», щоб перейти в її лобі, або «Скасувати», щоб відкрити меню налаштування іншої кімнати.',
      'You already have an open room "' + myWaiting.name + '"!\n\nClick "OK" to enter its lobby, or "Cancel" to open the settings form for another room.'
    ))) {
      socket.emit('joinRoom', { roomId: myWaiting.id });
      return;
    }
  }

  const f = document.getElementById('createRoomForm');
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
  document.getElementById('roomError').innerText = '';
  if (f.style.display === 'block') {
    updateRolesForecast();
    setTimeout(() => f.scrollIntoView({ behavior: 'smooth' }), 50);
  }
});
document.getElementById('roomMode').addEventListener('change', renderRoleCards);
document.getElementById('submitRoomBtn').addEventListener('click', () => {
  if (!currentUser) return alert(L('Будь ласка, увійдіть у свій акаунт перед створенням кімнати!', 'Please sign in before creating a room!'));
  const myActive = latestRoomsList.find(r => r.status === 'playing' && (r.playersList || []).some(p => p.nickname && p.nickname.toLowerCase() === currentUser.nickname.toLowerCase() && p.alive));
  if (myActive) return alert(L('⚠️ Ви ще живі у грі «' + myActive.name + '»! Дочекайтеся завершення гри.', '⚠️ You are still alive in match "' + myActive.name + '"! Wait until it finishes.'));

  const mode = document.getElementById('roomMode').value;
  if (window.RoleBalance) {
    const chk = window.RoleBalance.validateSelectedRoles(Array.from(selectedRoleIds), allRoles, mode);
    if (!chk.ok) {
      const errEl = document.getElementById('roomError');
      if (errEl) errEl.innerText = (currentLang === 'en' && chk.errorEn) ? chk.errorEn : chk.error;
      return;
    }
  }

  const submitBtn = document.getElementById('submitRoomBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = L('⏳ Створення та вхід у лобі...', '⏳ Creating & entering lobby...');
  }

  const preset = {
    roomName: (document.getElementById('roomName')?.value || '').trim() || (L('Стіл ', 'Table ') + currentUser.nickname),
    mode,
    serverRegion: 'GLOBAL',
    isRanked: document.getElementById('roomIsRanked')?.checked || false,
    isPrivate: document.getElementById('roomIsPrivate')?.checked || false,
    password: document.getElementById('roomPasswordInput')?.value || '',
    minPlayers: Number(document.getElementById('roomMinPlayers').value),
    maxPlayers: Number(document.getElementById('roomMaxPlayers').value),
    minAuthority: Number(document.getElementById('roomMinAuth').value),
    minKarma: Number(document.getElementById('roomMinKarma')?.value || 0),
    selectedRoles: Array.from(selectedRoleIds)
  };
  localStorage.setItem('mafia_room_preset', JSON.stringify(preset));
  socket.emit('createRoom', preset);
});
document.getElementById('leaveRoomBtn').addEventListener('click', () => {
  activeRoomId = null;
  initializedGameRoomId = null;
  socket.emit('leaveRoom');
  openTab('playScreen');
});
document.getElementById('deadFreePlayGoBtn')?.addEventListener('click', () => {
  activeRoomId = null;
  initializedGameRoomId = null;
  socket.emit('leaveRoom');
  openTab('playScreen');
});

const roomMsgInputEl = document.getElementById('roomMsgInput');
document.getElementById('sendRoomMsgBtn').addEventListener('click', () => {
  if (!roomMsgInputEl) return;
  const val = roomMsgInputEl.value.trim();
  if (val) {
    socket.emit('sendRoomMsg', val);
    roomMsgInputEl.value = '';
  }
});
roomMsgInputEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('sendRoomMsgBtn')?.click();
  }
});

// Висувні інвентарі смайлів та подарунків біля чату
const toggleEmojiBtn = document.getElementById('toggleEmojiDrawerBtn');
const toggleGiftBtn = document.getElementById('toggleGiftDrawerBtn');
const emojiDrawerEl = document.getElementById('emojiDrawer');
const giftDrawerEl = document.getElementById('giftDrawer');
if (toggleEmojiBtn && emojiDrawerEl) {
  toggleEmojiBtn.addEventListener('click', () => {
    const isOpen = emojiDrawerEl.style.display === 'block';
    emojiDrawerEl.style.display = isOpen ? 'none' : 'block';
    toggleEmojiBtn.classList.toggle('active', !isOpen);
    if (giftDrawerEl) giftDrawerEl.style.display = 'none';
    if (toggleGiftBtn) toggleGiftBtn.classList.remove('active');
  });
}
if (toggleGiftBtn && giftDrawerEl) {
  toggleGiftBtn.addEventListener('click', () => {
    const isOpen = giftDrawerEl.style.display === 'block';
    giftDrawerEl.style.display = isOpen ? 'none' : 'block';
    toggleGiftBtn.classList.toggle('active', !isOpen);
    if (emojiDrawerEl) emojiDrawerEl.style.display = 'none';
    if (toggleEmojiBtn) toggleEmojiBtn.classList.remove('active');
    if (!isOpen) renderGiftDrawerItems(lastRoomSnapshot);
  });
}

// Швидкі реакції емодзі
document.querySelectorAll('.quick-react-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const emoji = btn.getAttribute('data-emoji');
    if (!emoji || !roomMsgInputEl || roomMsgInputEl.disabled) return;
    socket.emit('sendRoomMsg', emoji);
    if (emojiDrawerEl) emojiDrawerEl.style.display = 'none';
    if (toggleEmojiBtn) toggleEmojiBtn.classList.remove('active');
  });
});

document.getElementById('startGameBtn').addEventListener('click', () => socket.emit('startGame'));

const globalMsgInputEl = document.getElementById('globalMsgInput');
document.getElementById('sendGlobalBtn').addEventListener('click', () => {
  if (!globalMsgInputEl) return;
  const val = globalMsgInputEl.value.trim();
  if (val) {
    socket.emit('sendGlobalMsg', val);
    globalMsgInputEl.value = '';
  }
});
globalMsgInputEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('sendGlobalBtn')?.click();
  }
});

const pmMsgInputEl = document.getElementById('pmMsgInput');
pmMsgInputEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('sendPmBtn')?.click();
  }
});

const willInputEl = document.getElementById('lastWillInput');
willInputEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('sendLastWillBtn')?.click();
  }
});
window.onLanguageChanged = (lang) => {
  currentLang = lang;
  setActiveAuthTab(authMode || 'login');
  initAvatarFrames('editAvatarGrid', (val) => { editAvatarData = val; });
  updateMainMenuSocialBadge();
  if (currentUser) {
    updateProfileUI();
  } else {
    renderShop();
    renderDailyQuests();
    renderFamilyBox(latestFamiliesList);
  }
  renderRoleCards();
  renderRulesScreen();
  renderRoomsList(latestRoomsList);
  renderFriendsList(cachedFriendsList);
  renderFriendRequests(cachedFriendReqsList);
  renderDevPosts(cachedDevPosts);
  renderAdminReportsList();
  const lobbyCounter = document.getElementById('lobbyChatCounterBadge');
  if (lobbyCounter) lobbyCounter.innerText = lobbyMsgCount + ' ' + L('смс', 'msgs');
  const roomCounter = document.getElementById('chatCounterBadge');
  if (roomCounter) roomCounter.innerText = roomMsgCount + ' ' + L('смс', 'msgs');
  if (lastRoomSnapshot) updateRoomScreen(lastRoomSnapshot);
  if (document.getElementById('updateChangelogModal')?.classList.contains('open')) {
    openUpdateChangelogModal(true);
  }
};
document.getElementById('uiLangSelect').addEventListener('change', (e) => {
  if (typeof window.applyLanguage === 'function') window.applyLanguage(e.target.value);
  else { currentLang = e.target.value; window.onLanguageChanged(currentLang); }
});
document.getElementById('sendEmailBtn').addEventListener('click', () => {
  window.location.href =
    'mailto:itaminx16@gmail.com' +
    '?subject=' + encodeURIComponent(document.getElementById('emailSubject').value || 'Mafia Club: Online') +
    '&body=' + encodeURIComponent(document.getElementById('emailBody').value || '');
});

function openRoomPlayersModal(room) {
  document.getElementById('roomModalTitle').innerText = '👥 ' + room.name;
  document.getElementById('roomModalStatus').innerText = room.status === 'playing'
    ? L('🔥 Йде гра • Гравців: ', '🔥 In Progress • Players: ') + room.playersCount + '/' + room.maxPlayers
    : L('🟢 Очікування гравців (', '🟢 Waiting for players (') + room.playersCount + '/' + room.maxPlayers + ')';
  const listBox = document.getElementById('roomModalPlayersList'); listBox.innerHTML = '';
  (room.playersList || []).forEach(p => {
    const statusTxt = p.isSpectator
      ? L('👁️ Спостерігач', '👁️ Spectator')
      : (p.alive ? L('🟢 Живий', '🟢 Alive') : L('💀 Вибув', '💀 Eliminated'));
    const hostTxt = p.isCreator ? L(' • 👑 Творець', ' • 👑 Host') : '';
    const botTxt = p.isBot ? L(' • 🤖 Бот', ' • 🤖 Bot') : '';
    const row = document.createElement('div'); row.className = 'friend-row';
    row.innerHTML =
      '<div style="display:flex; align-items:center; gap:8px;">' +
        '<div class="mini-friend-ava">' + buildAvatarHTML(p.avatar) + '</div>' +
        '<div><b>' + p.nickname + '</b> ' + buildBadgeHTML(p.badgeType) + '<div style="font-size:11px; color:#aaa;">' + statusTxt + hostTxt + botTxt + '</div></div>' +
      '</div>';
    if (!p.isBot) row.querySelector('.mini-friend-ava').addEventListener('click', () => socket.emit('getPlayerProfile', p.nickname));
    listBox.appendChild(row);
  });
  document.getElementById('roomPlayersModal').classList.add('open');
}

function renderRoomsList(rooms) {
  latestRoomsList = rooms || [];
  const box = document.getElementById('roomsContainer'); if (!box) return;
  const myWaitingRoom = currentUser ? latestRoomsList.find(r => r.status === 'waiting' && r.creator && r.creator.toLowerCase() === currentUser.nickname.toLowerCase()) : null;
  const myActiveAliveRoom = currentUser ? latestRoomsList.find(r => r.status === 'playing' && (r.playersList || []).some(p => p.nickname && p.nickname.toLowerCase() === currentUser.nickname.toLowerCase() && p.alive && !p.isSpectator)) : null;

  const createBtn = document.getElementById('toggleCreateRoomBtn');
  if (createBtn) {
    createBtn.disabled = !!myActiveAliveRoom;
    createBtn.innerText = myActiveAliveRoom
      ? L('🔒 Завершіть поточну гру', '🔒 Finish Current Match')
      : L('➕ Створити свою кімнату', '➕ Create Your Own Room');
  }

  // Оновлюємо верхній банер у playScreen
  const playNotice = document.getElementById('playScreenTopNotice');
  if (playNotice) {
    if (myActiveAliveRoom) {
      playNotice.innerHTML = `
        <div class="card" style="border: 2px solid #e76f51; background: rgba(231,111,81,0.18); margin-bottom: 12px; padding: 12px 14px; border-radius: 10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <div style="font-size:14px; font-weight:bold; color:#e76f51;">⚠️ ${L(`Ви ще живі у грі «${escapeHTML(myActiveAliveRoom.name)}»!`, `You are still alive in match "${escapeHTML(myActiveAliveRoom.name)}"!`)}</div>
              <div style="font-size:11px; color:#ccc;">${L('Поки гра триває, створення інших кімнат заблоковано.', 'Creating other rooms is locked while your match is in progress.')}</div>
            </div>
            <button type="button" id="topRejoinActiveBtn" style="background:#2a9d8f; font-weight:bold; margin:0; padding:8px 14px;">🔄 ${L('Повернутися за стіл', 'Return to Table')}</button>
          </div>
        </div>
      `;
      document.getElementById('topRejoinActiveBtn')?.addEventListener('click', () => {
        socket.emit('rejoinActiveRoom');
        openTab('roomScreen');
      });
    } else if (myWaitingRoom) {
      playNotice.innerHTML = `
        <div class="card my-room-banner">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <div style="font-size:15px; font-weight:bold; color:#2a9d8f;">👑 ${L(`Ваша кімната «${escapeHTML(myWaitingRoom.name)}» відкрита!`, `Your room "${escapeHTML(myWaitingRoom.name)}" is open!`)}</div>
              <div style="font-size:12px; color:#cbd5e1;">${L('Гравців:', 'Players:')} <b>${myWaitingRoom.playersCount}/${myWaitingRoom.maxPlayers}</b> • ${L('Режим:', 'Mode:')} <b>${myWaitingRoom.mode === 'legend' ? L('Легенда', 'Legend') : L('Класика', 'Classic')}</b></div>
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" id="topRejoinWaitingBtn" style="background:#2a9d8f; color:#fff; font-weight:bold; margin:0; padding:8px 16px;">🟢 ${L('Увійти в лобі', 'Enter Lobby')}</button>
              <button type="button" id="topCloseWaitingBtn" class="secondary" style="color:#ff6b6b; margin:0; padding:8px 12px;">🗑️ ${L('Закрити', 'Close')}</button>
            </div>
          </div>
        </div>
      `;
      document.getElementById('topRejoinWaitingBtn')?.addEventListener('click', () => {
        socket.emit('joinRoom', { roomId: myWaitingRoom.id });
      });
      document.getElementById('topCloseWaitingBtn')?.addEventListener('click', () => {
        if (confirm(L('Закрити вашу кімнату «' + myWaitingRoom.name + '»?', 'Close your room "' + myWaitingRoom.name + '"?'))) {
          socket.emit('closeRoom', myWaitingRoom.id);
        }
      });
    } else {
      playNotice.innerHTML = '';
    }
  }

  // Оновлюємо банер у головному меню
  const menuNotice = document.getElementById('mainMenuRoomNotice');
  if (menuNotice) {
    if (myActiveAliveRoom) {
      menuNotice.style.display = 'block';
      menuNotice.innerHTML = `
        <div class="card" style="border: 2px solid #e76f51; background: rgba(231,111,81,0.18); margin:0; padding:10px 14px; border-radius: 10px; display:flex; justify-content:space-between; align-items:center;">
          <div><b style="color:#f4a261;">⚠️ ${L('Активна гра:', 'Active Match:')}</b> «${escapeHTML(myActiveAliveRoom.name)}»</div>
          <button type="button" id="menuRejoinActiveBtn" style="background:#2a9d8f; font-weight:bold; margin:0; padding:6px 14px; font-size:12px;">🔄 ${L('Зайти', 'Rejoin')}</button>
        </div>
      `;
      document.getElementById('menuRejoinActiveBtn')?.addEventListener('click', () => {
        socket.emit('rejoinActiveRoom');
        openTab('roomScreen');
      });
    } else if (myWaitingRoom) {
      menuNotice.style.display = 'block';
      menuNotice.innerHTML = `
        <div class="card my-room-banner" style="margin:0; padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">
          <div><b style="color:#2a9d8f;">👑 ${L('Ваша кімната:', 'Your Room:')}</b> «${escapeHTML(myWaitingRoom.name)}» (${myWaitingRoom.playersCount}/${myWaitingRoom.maxPlayers})</div>
          <button type="button" id="menuRejoinWaitingBtn" style="background:#2a9d8f; color:#fff; font-weight:bold; margin:0; padding:6px 14px; font-size:12px;">🟢 ${L('В лобі', 'Lobby')}</button>
        </div>
      `;
      document.getElementById('menuRejoinWaitingBtn')?.addEventListener('click', () => {
        socket.emit('joinRoom', { roomId: myWaitingRoom.id });
      });
    } else {
      menuNotice.style.display = 'none';
      menuNotice.innerHTML = '';
    }
  }

  let filtered = [...latestRoomsList];
  if (myWaitingRoom && !filtered.some(r => r.id === myWaitingRoom.id)) {
    filtered.unshift(myWaitingRoom);
  }
  filtered.sort((a, b) => {
    const aMine = currentUser && a.creator && a.creator.toLowerCase() === currentUser.nickname.toLowerCase() ? 1 : 0;
    const bMine = currentUser && b.creator && b.creator.toLowerCase() === currentUser.nickname.toLowerCase() ? 1 : 0;
    return bMine - aMine;
  });

  if (filtered.length === 0) {
    box.innerHTML = '<div class="card" style="color:#aaa; font-size:13px;">' + L('Немає відкритих кімнат. Створіть свою першу кімнату кнопкою вище!', 'No open rooms yet. Create your first room using the button above!') + '</div>';
    return;
  }

  box.innerHTML = '';

  filtered.forEach(r => {
    const roleNames = r.selectedRoles.map(id => allRoles[id] ? allRoles[id].names[currentLang] : id).join(', ');
    const modeTag = r.mode === 'legend'
      ? '<span class="tag tag-legend">' + L('ЛЕГЕНДА', 'LEGEND') + '</span>'
      : '<span class="tag tag-classic">' + L('КЛАСИКА', 'CLASSIC') + '</span>';
    const lockTag = r.isPrivate ? ' 🔒' : (r.isRanked ? ' 🏆' : '');
    const statusPill = r.status === 'playing'
      ? '<span class="room-status-pill room-status-playing">🔥 ' + L('Йде гра', 'In Progress') + '</span>'
      : '<span class="room-status-pill room-status-waiting">🟢 ' + L('Набір гравців', 'Recruiting') + '</span>';

    const isMyRoom = currentUser && r.creator && r.creator.toLowerCase() === currentUser.nickname.toLowerCase();
    const myRecInRoom = currentUser && (r.playersList || []).find(p => p.nickname && p.nickname.toLowerCase() === currentUser.nickname.toLowerCase());
    const amIDeadHere = !!(myRecInRoom && !myRecInRoom.alive && !myRecInRoom.isSpectator);
    let actionButtons = '';
    if (r.status === 'waiting') {
      if (isMyRoom) {
        actionButtons += '<button type="button" class="join-room-btn" style="margin:0; padding:8px 14px; font-size:13px; background:#2a9d8f; font-weight:bold;">👑 ' + L('Увійти у свою кімнату', 'Enter Your Room') + '</button>';
        actionButtons += '<button type="button" class="close-my-room-btn secondary" style="margin:0; padding:8px 10px; font-size:12px; color:#ff6b6b;" title="' + L('Закрити кімнату', 'Close room') + '">🗑️ ' + L('Закрити', 'Close') + '</button>';
      } else if (!myActiveAliveRoom) {
        actionButtons += '<button type="button" class="join-room-btn" style="margin:0; padding:8px 14px; font-size:13px;">' + L('Увійти в кімнату', 'Join Room') + '</button>';
      }
    } else if (r.status === 'playing') {
      if (amIDeadHere) {
        actionButtons += '<button type="button" class="join-room-btn secondary" style="margin:0; padding:8px 12px; font-size:13px;">👻 ' + L('Повернутися (Привид)', 'Return (Ghost)') + '</button>';
      } else if (isMyRoom) {
        actionButtons += '<button type="button" class="join-room-btn" style="margin:0; padding:8px 14px; font-size:13px; background:#f4a261; color:#111; font-weight:bold;">👑 ' + L('Повернутися за стіл', 'Return to Table') + '</button>';
      } else if (!myActiveAliveRoom) {
        actionButtons += '<button type="button" class="spectate-room-btn secondary" style="margin:0; padding:8px 12px; font-size:13px;">👻 ' + L('Спостерігати', 'Spectate') + '</button>';
      }
    }
    actionButtons += '<button type="button" class="view-players-btn secondary" style="margin:0; padding:8px 10px; font-size:12px; width:auto;">👥 ' + r.playersCount + '/' + r.maxPlayers + '</button>';

    const div = document.createElement('div');
    div.className = 'card' + (isMyRoom ? ' my-room-banner' : '');
    div.innerHTML =
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
        '<div>' + modeTag + ' <b>' + escapeHTML(r.name) + lockTag + '</b></div>' +
        statusPill +
      '</div>' +
      '<div style="font-size:12px; color:#aaa;">' + L('Творець: ', 'Host: ') + (isMyRoom ? '<b style="color:#2a9d8f;">' + L('Ви (Творець)', 'You (Host)') + '</b>' : escapeHTML(r.creator)) + ' | ' + L('Гравців: ', 'Players: ') + r.playersCount + '/' + r.maxPlayers + ' | ' + L('Авторитет: ', 'Authority: ') + r.minAuthority + '+</div>' +
      '<div style="font-size:11px; color:#8892b0; margin:4px 0 8px;">' + L('Ролі: ', 'Roles: ') + roleNames + '</div>' +
      '<div style="display:flex; gap:6px; flex-wrap:wrap;">' + actionButtons + '</div>';

    const joinBtn = div.querySelector('.join-room-btn');
    if (joinBtn) {
      joinBtn.addEventListener('click', () => {
        if (isMyRoom || amIDeadHere) {
          socket.emit('joinRoom', { roomId: r.id });
        } else {
          let pass = '';
          if (r.isPrivate) pass = prompt(L('Введіть пароль від приватної кімнати:', 'Enter private room password:')) || '';
          socket.emit('joinRoom', { roomId: r.id, password: pass });
        }
      });
    }
    const closeBtn = div.querySelector('.close-my-room-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (confirm(L('Закрити вашу кімнату «' + r.name + '»?', 'Close your room "' + r.name + '"?'))) {
          socket.emit('closeRoom', r.id);
        }
      });
    }
    const specBtn = div.querySelector('.spectate-room-btn');
    if (specBtn) specBtn.addEventListener('click', () => socket.emit('joinRoom', { roomId: r.id, asSpectator: true }));
    div.querySelector('.view-players-btn').addEventListener('click', () => openRoomPlayersModal(r));
    box.appendChild(div);
  });
}

let phoneToastTimer = null;
function showPhoneNotification(title, body, tag) {
  const cleanTitle = String(title || 'Mafia Club');
  const cleanBody = trSrv(String(body || '')).slice(0, 140);
  const toast = document.getElementById('phoneToastShade');
  if (toast) {
    toast.innerHTML =
      '<div class="toast-title">' + escapeHTML(cleanTitle) + '</div>' +
      '<div class="toast-body">' + escapeHTML(cleanBody) + '</div>';
    toast.style.display = 'block';
    toast.onclick = () => { toast.style.display = 'none'; };
    clearTimeout(phoneToastTimer);
    phoneToastTimer = setTimeout(() => { toast.style.display = 'none'; }, 4500);
  }
  if ('Notification' in window && Notification.permission === 'granted' && localStorage.getItem('mafia_push_enabled') !== '0') {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          if (reg && reg.showNotification) {
            reg.showNotification(cleanTitle, { body: cleanBody, icon: '/avatars/avatar1.png', tag: tag || 'mafia-msg' });
          } else {
            new Notification(cleanTitle, { body: cleanBody, icon: '/avatars/avatar1.png', tag: tag || 'mafia-msg' });
          }
        }).catch(() => {
          try { new Notification(cleanTitle, { body: cleanBody, icon: '/avatars/avatar1.png', tag: tag || 'mafia-msg' }); } catch (e) {}
        });
      } else {
        new Notification(cleanTitle, { body: cleanBody, icon: '/avatars/avatar1.png', tag: tag || 'mafia-msg' });
      }
    } catch (e) {}
  }
}

function updateAdminIdeasBadges(count) {
  unreadIdeasCount = Math.max(0, Number(count) || 0);
  ['adminIdeasMenuBadge', 'adminIdeasSectionBadge'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = unreadIdeasCount;
    el.style.display = unreadIdeasCount > 0 ? 'inline-block' : 'none';
  });
}

function applyStaffVisibilityUI() {
  const canMod = ['helper', 'senior_mod', 'bratik', 'admin'].includes(staffRole) || isDevAdmin;
  const fullAdmin = isDevAdmin || staffRole === 'admin' || staffRole === 'bratik';
  const openBtn = document.getElementById('openModMenuBtn');
  if (openBtn) openBtn.style.display = canMod ? 'flex' : 'none';
  const roomBtn = document.getElementById('inRoomModBtn');
  if (roomBtn) roomBtn.style.display = canMod ? 'inline-block' : 'none';
  const lModBtn = document.getElementById('inLobbyModBtn');
  if (lModBtn) lModBtn.style.display = canMod ? 'inline-block' : 'none';
  const staffSec = document.getElementById('modStaffSection');
  if (staffSec) staffSec.style.display = fullAdmin ? 'block' : 'none';
}

['appVersionBadge', 'authVersionBtn', 'settingsVersionBadge'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', (e) => {
    e.stopPropagation();
    openUpdateChangelogModal(true);
  });
});
document.getElementById('closeChangelogModalBtn')?.addEventListener('click', () => {
  if (latestAppVersion) localStorage.setItem('mafia_seen_version', latestAppVersion);
  document.getElementById('updateChangelogModal')?.classList.remove('open');
});
document.getElementById('openNewsFromChangelogBtn')?.addEventListener('click', () => {
  if (latestAppVersion) localStorage.setItem('mafia_seen_version', latestAppVersion);
  document.getElementById('updateChangelogModal')?.classList.remove('open');
  openTab('devScreen');
});

socket.on('authError', (msg) => { localStorage.removeItem('mafia_saved_auth'); setAuthError(msg); });
socket.on('loginSuccess', ({ player, badgeType, levelInfo, isAdmin, staffRole: sRole, rolesConfig, botCatalog, shopItems, devPosts, globalChat, friendsData, friendRequests, familyData, unreadIdeasCount: uIdeas, appVersion, releaseNotes }) => {
  currentUser = player; currentBadgeType = badgeType; currentLevelInfo = levelInfo || currentLevelInfo;
  isDevAdmin = !!isAdmin; staffRole = sRole || 'player'; allRoles = rolesConfig || {};
  botCatalogList = Array.isArray(botCatalog) ? botCatalog : botCatalogList;
  shopItemsList = shopItems || [];
  currentFamilyData = familyData || null;
  if (appVersion) latestAppVersion = appVersion;
  if (releaseNotes) latestReleaseNotes = releaseNotes;
  updateVersionBadgesUI();

  applyStaffVisibilityUI();
  updateAdminIdeasBadges(uIdeas || 0);

  updateProfileUI(); renderRoleCards(); renderRulesScreen(); renderDevPosts(devPosts || []);
  renderGlobalChat(globalChat || []); renderFriendsList(friendsData || []); renderFriendRequests(friendRequests || []);
  renderRoomsList(latestRoomsList);
  const activeScr = document.querySelector('.screen.active');
  if (!activeScr || activeScr.id === 'authScreen') {
    openTab('mainMenuScreen');
  } else if (activeScr.id === 'privateChatScreen' && activePmFriend) {
    socket.emit('openPrivateChat', activePmFriend);
  }
  let openedWelcome = false;
  if (!player.isGuest && player.seenWelcome === false) {
    const wFb = document.getElementById('welcomeIdeaFeedback');
    if (wFb) wFb.innerText = '';
    document.getElementById('devWelcomeModal')?.classList.add('open');
    openedWelcome = true;
  }
  if (!openedWelcome && latestReleaseNotes && localStorage.getItem('mafia_seen_version') !== (latestReleaseNotes.version || latestAppVersion)) {
    setTimeout(() => openUpdateChangelogModal(false), 350);
  }
  if (pendingInviteRoomId) {
    const invitedRoom = latestRoomsList.find(r => r.id === pendingInviteRoomId);
    if (invitedRoom && invitedRoom.isPrivate) {
      const pass = prompt(L('Введіть пароль від приватної кімнати:', 'Enter private room password:')) || '';
      socket.emit('joinRoom', { roomId: pendingInviteRoomId, password: pass });
    } else {
      socket.emit('joinRoom', pendingInviteRoomId);
    }
    pendingInviteRoomId = null;
  }
});

socket.on('staffStatusUpdated', ({ isAdmin, staffRole: sRole }) => {
  isDevAdmin = !!isAdmin;
  staffRole = sRole || 'player';
  applyStaffVisibilityUI();
  updateProfileUI();
  showPhoneNotification('👑 ' + L('Статус персоналу оновлено', 'Staff status updated'), L('Нова роль: ', 'New role: ') + staffRole.toUpperCase(), 'staff-role');
});
socket.on('newPlayerIdeaAlert', ({ author, text, unreadCount }) => {
  updateAdminIdeasBadges(typeof unreadCount === 'number' ? unreadCount : (unreadIdeasCount + 1));
  sfxNewMsg();
  showPhoneNotification('💡 ' + L('Нова ідея гравця!', 'New Player Idea!'), `${author || ''}: ${text || ''}`, 'player-idea');
});
socket.on('adminPasswordResetAlert', ({ nickname, note }) => {
  sfxNewMsg();
  showPhoneNotification('🔑 ' + L('Запит на скидання пароля', 'Password Reset Request'), `${nickname || ''}${note ? ' (' + note + ')' : ''}`, 'pwd-reset');
});

socket.on('promptGuestSave', () => {
  if (confirm(L(
    'Сподобалась гра? Створіть постійний акаунт за 10 секунд, щоб зберігати досвід, монети та додавати друзів!',
    'Enjoyed the match? Create a permanent account in 10 seconds to save your XP, coins, and add friends!'
  ))) {
    location.reload();
  }
});

socket.on('profileUpdated', ({ player, badgeType, levelInfo }) => { currentUser = player; currentBadgeType = badgeType; if (levelInfo) currentLevelInfo = levelInfo; updateProfileUI(); });
socket.on('familyUpdated', (fam) => { currentFamilyData = fam; updateProfileUI(); });
socket.on('newFamilyMsg', (msg) => {
  if (currentFamilyData) {
    if (!Array.isArray(currentFamilyData.chat)) currentFamilyData.chat = [];
    currentFamilyData.chat.push(msg);
    if (currentFamilyData.chat.length > 80) currentFamilyData.chat.shift();
  }
  appendFamilyChatHtml(msg);
  if (msg && msg.author && (!currentUser || msg.author.toLowerCase() !== currentUser.nickname.toLowerCase())) {
    sfxNewMsg();
    showPhoneNotification('⚜️ ' + L("Чат Сім'ї", 'Family Chat'), msg.author + ': ' + (msg.text || ''), 'fam-msg');
  }
});
socket.on('familyFeedback', (msg) => {
  const txt = trSrv(msg);
  const el = document.getElementById('familyFeedbackMsg');
  if (el) el.innerText = txt;
  else {
    const ff = document.getElementById('friendFeedback');
    if (ff) ff.innerText = txt;
  }
});
socket.on('familiesListData', (list) => renderFamilyBox(list));
socket.on('shopFeedback', ({ msg }) => { document.getElementById('shopFeedback').innerText = trSrv(msg); });
socket.on('friendFeedback', (msg) => { document.getElementById('friendFeedback').innerText = trSrv(msg); });
socket.on('friendsListUpdated', renderFriendsList);
socket.on('friendRequestsUpdated', (reqs) => {
  if (Array.isArray(reqs) && reqs.length > cachedFriendReqs) {
    const newest = reqs[reqs.length - 1];
    sfxNewMsg();
    showPhoneNotification('👥 ' + L('Нова заявка в друзі!', 'New Friend Request!'), L('Від: ', 'From: ') + newest, 'friend-req');
  }
  renderFriendRequests(reqs);
});

socket.on('privateChatHistory', ({ withNick, messages }) => {
  const b = document.getElementById('pmChatBox');
  if (!b) return;
  if (withNick) activePmFriend = withNick;
  b.innerHTML = '';
  if (!messages || messages.length === 0) {
    b.innerHTML = '<div class="system-msg" style="opacity:0.7;">💬 ' + L('Повідомлень поки немає. Напишіть першим!', 'No messages yet. Say hello first!') + '</div>';
    return;
  }
  messages.forEach(m => {
    b.insertAdjacentHTML('beforeend', createModernMsgHTML(m.from, m.text, m.time, null, false, false, 'SLOT:1'));
  });
  b.scrollTop = b.scrollHeight;
});
socket.on('newPrivateMsg', ({ withNick, msg }) => {
  if (msg && msg.from && (!currentUser || msg.from.toLowerCase() !== currentUser.nickname.toLowerCase())) {
    sfxNewMsg();
    showPhoneNotification('✉️ ' + msg.from, msg.text || '', 'pm-' + msg.from);
  }
  if (activePmFriend && withNick && activePmFriend.toLowerCase() === withNick.toLowerCase()) {
    const b = document.getElementById('pmChatBox');
    if (!b) return;
    const emptyMsg = b.querySelector('.system-msg');
    if (emptyMsg && (emptyMsg.innerText.includes('Повідомлень поки немає') || emptyMsg.innerText.includes('No messages yet'))) emptyMsg.remove();
    b.insertAdjacentHTML('beforeend', createModernMsgHTML(msg.from, msg.text, msg.time, null, false, false, 'SLOT:1'));
    b.scrollTop = b.scrollHeight;
  }
});

socket.on('publicProfileData', (p) => {
  activePublicProfileNick = p.nickname;
  const pubAva = document.getElementById('pubProfAvatar');
  pubAva.innerHTML = buildAvatarHTML(p.avatar);
  applyAvatarRingAndFrame(pubAva, 'main-avatar', p.equippedFrame, p.avatarBorderColor);
  document.getElementById('pubProfNick').innerHTML = p.nickname + ' ' + buildBadgeHTML(p.badgeType);
  document.getElementById('pubProfGender').innerText = L('Стать: ', 'Gender: ') + getGenderLabel(p.gender) + (p.familyName ? ' • ⚜️ ' + p.familyName : '');
  document.getElementById('pubProfBio').innerText = trSrv(p.bio);
  const bioTrWrap = document.getElementById('pubProfBioTrWrap');
  if (bioTrWrap) {
    const bioTr = buildTranslateWidget(p.bio || '');
    bioTrWrap.innerHTML = bioTr.btnHtml + bioTr.lineHtml;
  }
  document.getElementById('pubProfStats').innerHTML =
    '<div>' + L('Рівень', 'Level') + '<span>' + p.level + '</span></div>' +
    '<div>' + L('Авторитет', 'Authority') + '<span>' + p.authority + '</span></div>' +
    '<div>' + L('Перемоги', 'Wins') + '<span>' + p.wins + '/' + p.gamesPlayed + '</span></div>';

  const addBtn = document.getElementById('pubProfAddFriendBtn');
  const remBtn = document.getElementById('pubProfRemoveFriendBtn');
  if (addBtn && remBtn && currentUser) {
    const isMe = p.nickname.toLowerCase() === currentUser.nickname.toLowerCase();
    const canSocial = !isMe && !p.isGuest && !currentUser.isGuest;
    addBtn.style.display = (canSocial && !p.isFriend) ? 'block' : 'none';
    remBtn.style.display = (canSocial && p.isFriend) ? 'block' : 'none';
    const smsBtn = document.getElementById('pubProfSendSmsBtn');
    if (smsBtn) smsBtn.style.display = canSocial ? 'block' : 'none';
    const repBtn = document.getElementById('pubProfReportBtn');
    if (repBtn) repBtn.style.display = isMe ? 'none' : 'block';
  }
  document.getElementById('publicProfileModal').classList.add('open');
});

function renderAdminReportsList() {
  const repBox = document.getElementById('adminReportsList');
  if (!repBox) return;
  const searchVal = (document.getElementById('adminReportSearchInput')?.value || '').trim().toLowerCase();

  let list = cachedAdminReports || [];
  if (currentReportFilter === 'open') list = list.filter(r => r.status === 'open');
  else if (currentReportFilter === 'closed') list = list.filter(r => r.status === 'closed');

  if (searchVal) {
    list = list.filter(r =>
      (r.from || '').toLowerCase().includes(searchVal) ||
      (r.target || '').toLowerCase().includes(searchVal) ||
      (r.reason || '').toLowerCase().includes(searchVal)
    );
  }

  if (list.length === 0) {
    repBox.innerHTML = '<div style="font-size:12px; color:#aaa; padding:8px;">' + L('Скарг за цим фільтром не знайдено.', 'No reports found for this filter.') + '</div>';
    return;
  }

  const verdictLabels = {
    warn: L('Попередження (-10 карми)', 'Warning (-10 karma)'),
    mute_30m: L('Мут 30 хв', 'Mute 30m'),
    mute_2h: L('Мут 2 год', 'Mute 2h'),
    mute: L('Мут 2 год', 'Mute 2h'),
    mute_24h: L('Мут 24 год', 'Mute 24h'),
    playban_24h: L('Заборона гри 24 год', 'Play-ban 24h'),
    playban_7d: L('Заборона гри 7 днів', 'Play-ban 7d'),
    playban_perm: L('Заборона гри назавжди', 'Permanent play-ban'),
    playban: L('Заборона гри', 'Play-ban'),
    tempban_24h: L('Бан 24 год', 'Ban 24h'),
    tempban: L('Бан 24 год', 'Ban 24h'),
    tempban_7d: L('Бан 7 днів', 'Ban 7d'),
    permban: L('Пермабан', 'Permaban'),
    dismiss: L('Відхилено', 'Dismissed')
  };

  repBox.innerHTML = '';
  list.forEach(r => {
    const card = document.createElement('div');
    card.className = 'report-admin-card';

    let screenshotHTML = '';
    if (r.screenshot) {
      screenshotHTML = `<div style="margin-top:4px;"><label style="font-size:10px; color:#aaa;">${L('Скріншот порушення (клік для збільшення):', 'Violation screenshot (click to zoom):')}</label><br><img src="${r.screenshot}" class="report-screenshot-thumb" title="${L('Натисніть для перегляду', 'Click to view')}"></div>`;
    }

    let contextHTML = '';
    if (r.context) {
      const authMsgs = Array.isArray(r.context.fromAuthor) ? r.context.fromAuthor : [];
      const tgtMsgs = Array.isArray(r.context.fromTarget) ? r.context.fromTarget : [];
      const totalMsgs = [...authMsgs, ...tgtMsgs].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      if (totalMsgs.length > 0) {
        const listHTML = totalMsgs.map(m => {
          const isTarget = (m.author || '').toLowerCase() === (r.target || '').toLowerCase();
          const cls = isTarget ? 'report-context-target' : 'report-context-author';
          return `<div class="report-context-msg"><span class="${cls}">${escapeHTML(m.author)}:</span> ${escapeHTML(m.text)} <span style="color:#666; font-size:9px;">(${m.time})</span></div>`;
        }).join('');
        contextHTML = `
          <details style="margin-top:5px;">
            <summary style="font-size:11px; color:#ffd166; cursor:pointer;">📜 ${L(`Контекст чату (${totalMsgs.length} смс: автор + порушник)`, `Chat context (${totalMsgs.length} msgs: reporter + suspect)`)} ▼</summary>
            <div class="report-context-box">${listHTML}</div>
          </details>
        `;
      }
    }

    const hist = r.targetHistory || {};
    const histBadges = `
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin:4px 0; font-size:10px;">
        <span style="background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:#cbd5e1;">${L('Скарг на гравця:', 'Reports on player:')} <b>${hist.totalReports || 1}</b></span>
        <span style="background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:#ffd166;">${L('Покарань:', 'Punishments:')} <b>${hist.punishCount || 0}</b></span>
        <span style="background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:#80ffdb;">${L('Карма:', 'Karma:')} <b>${hist.karma ?? 100}</b></span>
        ${hist.isMuted ? `<span style="background:rgba(244,162,97,0.25); padding:2px 6px; border-radius:4px; color:#f4a261;">🔇 ${L('У муті', 'Muted')}</span>` : ''}
        ${hist.isPlayBanned ? `<span style="background:rgba(144,224,239,0.22); padding:2px 6px; border-radius:4px; color:#90e0ef;">🎮 ${L('Заборона гри', 'Play-banned')}</span>` : ''}
        ${hist.isBanned ? `<span style="background:rgba(230,57,70,0.25); padding:2px 6px; border-radius:4px; color:#ff6b6b;">🚫 ${L('У бані', 'Banned')}</span>` : ''}
      </div>
    `;

    const verdictText = verdictLabels[r.verdict] || r.verdict || L('розглянуто', 'resolved');
    const statusTag = r.status === 'open'
      ? `<span style="color:#ff6b6b; font-weight:bold;">[${L('ВІДКРИТО', 'OPEN')}]</span>`
      : `<span style="color:#80ffdb;">[${L('ЗАКРИТО', 'CLOSED')}: ${escapeHTML(verdictText)}]</span>`;

    const modInfoHtml = (r.status === 'closed' && (r.resolvedBy || r.modComment))
      ? `<div style="font-size:10px; color:#aaa; margin-top:4px;">${L('Модератор:', 'Moderator:')} <b>${escapeHTML(r.resolvedBy || '-')}</b> (${r.resolvedAt || ''})${r.modComment ? ' • ' + L('Коментар:', 'Comment:') + ' «' + escapeHTML(r.modComment) + '»' : ''}</div>`
      : '';

    const reasonTr = buildTranslateWidget(r.reason || '');
    card.innerHTML = `
      <div class="report-admin-header">
        <div><b>${escapeHTML(r.from)}</b> ➔ <b style="color:#e63946;">${escapeHTML(r.target)}</b></div>
        <div>${statusTag}</div>
      </div>
      <div style="font-size:11px; color:#eee; margin:3px 0;"><b>${L('Причина:', 'Reason:')}</b> ${escapeHTML(trSrv(r.reason))} ${reasonTr.btnHtml}${reasonTr.lineHtml}</div>
      <div style="font-size:10px; color:#888;">📅 ${r.createdAt}</div>
      ${histBadges}
      ${screenshotHTML}
      ${contextHTML}
      ${modInfoHtml}
      ${r.status === 'open' ? `
        <input type="text" class="report-mod-comment" placeholder="${L("Коментар модератора (необов'язково)...", 'Moderator comment (optional)...')}" style="margin-top:6px; padding:5px 8px; font-size:11px;">
        <div class="punishment-select-row">
          <select class="report-punish-select">
            <option value="warn">⚠️ ${L('Попередження (-10 карми)', 'Warning (-10 karma)')}</option>
            <option value="mute_30m">🔇 ${L('Мут чату на 30 хв', 'Chat mute for 30 min')}</option>
            <option value="mute_2h">🔇 ${L('Мут чату на 2 год', 'Chat mute for 2 hours')}</option>
            <option value="mute_24h">🔇 ${L('Мут чату на 24 год', 'Chat mute for 24 hours')}</option>
            <option value="playban_24h">🎮 ${L('Заборона грати на 24 год', 'Play-ban for 24 hours')}</option>
            <option value="playban_7d">🎮 ${L('Заборона грати на 7 днів', 'Play-ban for 7 days')}</option>
            <option value="playban_perm">🎮 ${L('Заборона грати назавжди', 'Permanent play-ban')}</option>
            <option value="tempban_24h">⏳ ${L('Бан на 24 год', 'Ban for 24 hours')}</option>
            <option value="tempban_7d">⏳ ${L('Бан на 7 днів', 'Ban for 7 days')}</option>
            <option value="permban">🚫 ${L('Перманентний бан', 'Permanent ban')}</option>
            <option value="dismiss">✕ ${L('Відхилити скаргу', 'Dismiss report')}</option>
          </select>
          <button type="button" class="apply-punish-btn" style="width:auto; padding:5px 12px; margin:0; background:#e63946; font-size:11px;">${L('Застосувати', 'Apply')}</button>
        </div>
      ` : `
        <div style="display:flex; gap:6px; margin-top:6px;">
          <button type="button" class="revoke-report-btn secondary" style="margin:0; padding:5px 10px; font-size:11px; color:#ffd166;">↩️ ${L('Скасувати покарання і перевідкрити', 'Revoke punishment & reopen')}</button>
        </div>
      `}
    `;

    const thumb = card.querySelector('.report-screenshot-thumb');
    if (thumb) {
      thumb.addEventListener('click', () => {
        const img = document.getElementById('screenshotViewImg');
        if (img) img.src = r.screenshot;
        document.getElementById('screenshotViewModal').classList.add('open');
      });
    }

    const applyBtn = card.querySelector('.apply-punish-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const sel = card.querySelector('.report-punish-select');
        const cmt = card.querySelector('.report-mod-comment');
        socket.emit('adminCommand', {
          action: 'resolveReport',
          payload: {
            reportId: r.id,
            punishment: sel ? sel.value : 'warn',
            modComment: cmt ? cmt.value.trim() : ''
          }
        });
      });
    }

    const revokeBtn = card.querySelector('.revoke-report-btn');
    if (revokeBtn) {
      revokeBtn.addEventListener('click', () => {
        if (confirm(L('Скасувати покарання для ' + r.target + ' і повернути скаргу у «Відкриті»?', 'Revoke punishment for ' + r.target + ' and reopen report?'))) {
          socket.emit('adminCommand', {
            action: 'reopenReport',
            payload: { reportId: r.id, revokePunishment: true }
          });
        }
      });
    }

    repBox.appendChild(card);
  });
}

socket.on('adminDashboardData', ({ metrics, onlinePlayers, activePunishments, reports, modLogs, suspiciousLogs, playerIdeas, testersList, staffList, passwordResetRequests }) => {
  applyStaffVisibilityUI();
  updateAdminIdeasBadges(metrics?.unreadIdeasCount || 0);
  const mGrid = document.getElementById('adminMetricsGrid');
  if (mGrid && metrics) {
    mGrid.innerHTML =
      '<div class="stat-tile"><span class="num">' + metrics.totalOnline + '</span><span class="lbl">' + L('Онлайн (Лобі: ', 'Online (Lobby: ') + metrics.inLobbyCount + L(' / Ігри: ', ' / Matches: ') + metrics.inRoomsCount + ')</span></div>' +
      '<div class="stat-tile"><span class="num" style="color:#80ffdb;">' + (metrics.activeRoomsCount ?? 0) + '</span><span class="lbl">' + L('Кімнат (Гра: ', 'Rooms (Playing: ') + (metrics.playingRoomsCount ?? 0) + L(' / Лобі: ', ' / Lobby: ') + (metrics.waitingRoomsCount ?? 0) + L(' • Боти: ', ' • Bots: ') + (metrics.botsCount ?? 0) + ')</span></div>' +
      '<div class="stat-tile"><span class="num" style="color:#2a9d8f;">' + (metrics.totalRegistered ?? 0) + '</span><span class="lbl">' + L('Акаунтів (Нових сьогодні: +', 'Accounts (New today: +') + (metrics.newRegsToday ?? 0) + ')</span></div>' +
      '<div class="stat-tile"><span class="num" style="color:#f4a261;">' + (metrics.completionRate ?? 100) + '%</span><span class="lbl">' + L('Матчів завершено (', 'Matches completed (') + (metrics.matchesCompleted ?? 0) + '/' + (metrics.matchesStarted ?? 0) + ')</span></div>' +
      '<div class="stat-tile"><span class="num" style="color:#e63946;">' + (metrics.openReportsCount ?? 0) + '</span><span class="lbl">' + L('Відкритих скарг (Закритих: ', 'Open reports (Closed: ') + (metrics.closedReportsCount ?? 0) + ')</span></div>' +
      '<div class="stat-tile"><span class="num" style="color:#ffd166;">' + (metrics.activeMutesCount ?? 0) + ' / ' + (metrics.activePlayBansCount ?? 0) + ' / ' + (metrics.activeBansCount ?? 0) + '</span><span class="lbl">' + L('Мути / Заборони гри / Бани • Uptime: ', 'Mutes / Play-bans / Bans • Uptime: ') + (metrics.uptimeMinutes ?? 0) + L(' хв', ' min') + '</span></div>';
  }

  const cloudEl = document.getElementById('adminCloudDbStatus');
  if (cloudEl && metrics) {
    if (metrics.cloudDbMode === 'github') {
      cloudEl.style.color = '#80ffdb';
      cloudEl.innerText = L(
        `🟢 Хмарна БД активна (GitHub Cloud • остання синхр.: ${metrics.cloudLastSync || '-'})`,
        `🟢 Cloud DB Active (GitHub Cloud • last sync: ${metrics.cloudLastSync || '-'})`
      );
    } else if (metrics.cloudDbMode === 'rest') {
      cloudEl.style.color = '#80ffdb';
      cloudEl.innerText = L(
        `🟢 Хмарна БД активна (REST Cloud • остання синхр.: ${metrics.cloudLastSync || '-'})`,
        `🟢 Cloud DB Active (REST Cloud • last sync: ${metrics.cloudLastSync || '-'})`
      );
    } else {
      cloudEl.style.color = '#ffd166';
      cloudEl.innerText = L(
        '🟡 Локальна БД: додайте GITHUB_TOKEN у змінні на Render для вічного хмарного збереження!',
        '🟡 Local DB: add GITHUB_TOKEN to Render env vars for permanent cloud persistence!'
      );
    }
  }

  const onlineBox = document.getElementById('adminOnlinePlayersList');
  if (onlineBox) {
    if (!onlinePlayers || onlinePlayers.length === 0) {
      onlineBox.innerHTML = '<span style="font-size:11px; color:#888;">' + L('Немає гравців онлайн.', 'No players online.') + '</span>';
    } else {
      onlineBox.innerHTML = '';
      onlinePlayers.forEach(op => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'admin-quick-pill';
        const roomDisp = trSrv(op.inRoom);
        pill.title = L('Натисніть, щоб підставити нік у форму покарання/нагороди • ', 'Click to fill nickname into punishment/reward form • ') + roomDisp;
        pill.innerText = '🟢 ' + op.nickname + ' (' + roomDisp + ')';
        pill.addEventListener('click', () => {
          const pInp = document.getElementById('modPunishNick');
          const gInp = document.getElementById('modGiftNick');
          if (pInp) pInp.value = op.nickname;
          if (gInp) gInp.value = op.nickname;
          const fb = document.getElementById('modFeedback');
          if (fb) fb.innerText = L('📌 Обрано гравця: ', '📌 Selected player: ') + op.nickname;
        });
        onlineBox.appendChild(pill);
      });
    }
  }

  const punishBox = document.getElementById('adminActivePunishmentsList');
  if (punishBox) {
    if (!activePunishments || activePunishments.length === 0) {
      punishBox.innerHTML = '<div style="font-size:11px; color:#888;">' + L('Активних мутів чи банів зараз немає.', 'No active mutes or bans right now.') + '</div>';
    } else {
      punishBox.innerHTML = '';
      activePunishments.forEach(ap => {
        const cancelAction = ap.type === 'mute' ? 'unmuteUser' : (ap.type === 'playban' ? 'unplaybanUser' : 'unbanUser');
        const cancelLabel = ap.type === 'mute'
          ? L('🔊 Зняти', '🔊 Unmute')
          : (ap.type === 'playban' ? L('🎮 Дозволити гру', '🎮 Lift Play-ban') : L('🔓 Розбанити', '🔓 Unban'));
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:6px; padding:6px 8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:5px; font-size:11px;';
        row.innerHTML =
          '<div style="overflow:hidden;">' +
            '<div><b>' + escapeHTML(ap.nickname) + '</b> — <span style="color:#f4a261;">' + trSrv(ap.label) + '</span></div>' +
            '<div style="font-size:10px; color:#aaa;">' + escapeHTML(trSrv(ap.untilText)) + ' • ' + escapeHTML(trSrv(ap.reason)) + '</div>' +
          '</div>' +
          '<button type="button" class="cancel-punish-btn secondary" style="width:auto; margin:0; padding:4px 8px; font-size:11px; color:#80ffdb;">' + cancelLabel + '</button>';
        row.querySelector('.cancel-punish-btn').addEventListener('click', () => {
          socket.emit('adminCommand', {
            action: cancelAction,
            payload: { targetNick: ap.nickname }
          });
        });
        punishBox.appendChild(row);
      });
    }
  }

  const unreadBadge = document.getElementById('adminOpenReportsBadge');
  if (unreadBadge) {
    const count = metrics?.openReportsCount || (reports ? reports.filter(r => r.status === 'open').length : 0);
    unreadBadge.innerText = count;
    unreadBadge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  cachedAdminReports = reports || [];
  renderAdminReportsList();

  const logsBox = document.getElementById('adminModLogsList');
  if (logsBox) {
    if (!modLogs || modLogs.length === 0) {
      logsBox.innerHTML = '<div style="color:#888;">' + L('Журнал порожній.', 'Log is empty.') + '</div>';
    } else {
      const canRevert = isDevAdmin || staffRole === 'admin' || staffRole === 'bratik';
      logsBox.innerHTML = modLogs.map(l => {
        const revTag = l.reverted
          ? ` <span style="color:#80ffdb; font-size:10px;">[↩️ ${L('Скасовано', 'Reverted')}]</span>`
          : ((canRevert && l.id && l.target && l.target !== '-')
            ? ` <button type="button" class="revert-mod-log-btn secondary" data-log-id="${escapeHTML(l.id)}" style="width:auto; display:inline-block; margin:0 0 0 4px; padding:1px 6px; font-size:10px; color:#ffd166;">↩️ ${L('Скасувати', 'Revert')}</button>`
            : '');
        return `<div style="padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.06); color:#cbd5e1;">
          <span style="color:#888;">[${escapeHTML(l.time)}]</span> <b style="color:#f4a261;">${escapeHTML(l.moderator)}</b>: ${escapeHTML(trSrv(l.action))} ➔ <b>${escapeHTML(l.target)}</b>${l.detail ? ' (' + escapeHTML(trSrv(l.detail)) + ')' : ''}${revTag}
        </div>`;
      }).join('');
      logsBox.querySelectorAll('.revert-mod-log-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const logId = btn.getAttribute('data-log-id');
          if (logId) socket.emit('adminCommand', { action: 'revertModAction', payload: { logId } });
        });
      });
    }
  }

  const suspBadge = document.getElementById('adminSuspiciousBadge');
  const suspBox = document.getElementById('adminSuspiciousLogsList');
  const sList = Array.isArray(suspiciousLogs) ? suspiciousLogs : [];
  if (suspBadge) {
    suspBadge.innerText = sList.length;
    suspBadge.style.display = sList.length > 0 ? 'inline-block' : 'none';
  }
  if (suspBox) {
    suspBox.innerHTML = sList.length === 0
      ? '<div style="color:#888;">' + L('Підозрілих дій не зафіксовано.', 'No suspicious actions recorded.') + '</div>'
      : sList.map(s =>
          `<div class="susp-log-card">
            <div><b style="color:#ff8585;">[${escapeHTML(s.category)}]</b> <b>${escapeHTML(s.nickname)}</b> <span style="color:#888;">(${escapeHTML(s.ip)})</span></div>
            <div style="color:#cbd5e1; margin-top:2px;">${escapeHTML(trSrv(s.details))}</div>
            <div style="color:#64748b; font-size:10px;">${escapeHTML(s.time)}</div>
          </div>`
        ).join('');
  }

  const ideasBox = document.getElementById('adminIdeasList');
  const iList = Array.isArray(playerIdeas) ? playerIdeas : [];
  if (ideasBox) {
    ideasBox.innerHTML = iList.length === 0
      ? '<div style="color:#888;">' + L('Ідей та відгуків поки немає.', 'No player ideas or feedback yet.') + '</div>'
      : iList.map(it => {
          const iTr = buildTranslateWidget(it.text || '');
          return `<div class="idea-log-card">
            <div><b style="color:#80ffdb;">${escapeHTML(it.author)}</b> <span style="color:#64748b; font-size:10px;">• ${escapeHTML(it.time)}</span>${it.read === false ? ` <span class="unread-pill" style="background:#e63946;">NEW</span>` : ''}${iTr.btnHtml}</div>
            <div style="color:#e2e8f0; margin-top:2px;">${escapeHTML(it.text)}</div>
            ${iTr.lineHtml}
          </div>`;
        }).join('');
  }

  const testersBox = document.getElementById('adminTestersList');
  if (testersBox) {
    const tList = Array.isArray(testersList) ? testersList : [];
    testersBox.innerHTML = tList.length === 0
      ? '<span style="color:#64748b;">' + L('Тестерів поки немає.', 'No testers yet.') + '</span>'
      : tList.map(t => `<span class="admin-quick-pill">🧪 ${escapeHTML(t.nickname)} (${t.coins || 0}🪙 • ${t.authority || 0}⭐ • ${t.diamonds || 0}💎)</span>`).join(' ');
  }

  const staffBox = document.getElementById('adminStaffList');
  if (staffBox) {
    const stList = Array.isArray(staffList) ? staffList : [];
    staffBox.innerHTML = stList.length === 0
      ? '<span style="color:#64748b;">' + L('Персонал ще не призначено.', 'No staff assigned yet.') + '</span>'
      : stList.map(st => `<span class="admin-quick-pill">${st.staffRole === 'bratik' ? '🤝' : '🛡️'} <b>${escapeHTML(st.nickname)}</b> (${escapeHTML(String(st.staffRole || '').toUpperCase())}${st.staffRole === 'bratik' ? (st.hasBratikCode ? ' 🔐' : ' ⏳') : ''})</span>`).join(' ');
  }

  const pwdBadge = document.getElementById('adminPwdResetBadge');
  const pwdBox = document.getElementById('adminPasswordResetsList');
  const pList = Array.isArray(passwordResetRequests) ? passwordResetRequests : [];
  if (pwdBadge) {
    pwdBadge.innerText = pList.length;
    pwdBadge.style.display = pList.length > 0 ? 'inline-block' : 'none';
  }
  if (pwdBox) {
    if (pList.length === 0) {
      pwdBox.innerHTML = '<div style="color:#64748b;">' + L('Активних запитів на скидання пароля немає.', 'No pending password reset requests.') + '</div>';
    } else {
      pwdBox.innerHTML = '';
      pList.forEach(req => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:6px; padding:6px 8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:5px;';
        row.innerHTML =
          '<div style="overflow:hidden;">' +
            '<div>🔑 <b>' + escapeHTML(req.nickname) + '</b> <span style="color:#64748b; font-size:10px;">• ' + escapeHTML(req.time) + '</span></div>' +
            (req.note ? '<div style="color:#cbd5e1; font-size:10px;">«' + escapeHTML(req.note) + '»</div>' : '') +
          '</div>' +
          '<div style="display:flex; gap:4px; flex-shrink:0;">' +
            '<button type="button" class="pwd-approve-btn" style="width:auto; margin:0; padding:4px 8px; background:#2a9d8f; font-size:11px;">✓</button>' +
            '<button type="button" class="pwd-reject-btn secondary" style="width:auto; margin:0; padding:4px 8px; color:#ff6b6b; font-size:11px;">✕</button>' +
          '</div>';
        row.querySelector('.pwd-approve-btn').addEventListener('click', () => {
          socket.emit('adminCommand', { action: 'resolvePasswordReset', payload: { requestId: req.id, approve: true } });
        });
        row.querySelector('.pwd-reject-btn').addEventListener('click', () => {
          socket.emit('adminCommand', { action: 'resolvePasswordReset', payload: { requestId: req.id, approve: false } });
        });
        pwdBox.appendChild(row);
      });
    }
  }
});

socket.on('adminFeedback', (msg) => { document.getElementById('modFeedback').innerText = trSrv(msg); });
socket.on('adminDatabaseExport', ({ filename, json }) => {
  try {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'mafia-club-db-backup.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (e) {}
});
document.getElementById('adminExportDbBtn')?.addEventListener('click', () => {
  socket.emit('adminCommand', { action: 'exportDatabase', payload: {} });
});
document.getElementById('adminImportDbBtn')?.addEventListener('click', () => {
  document.getElementById('adminImportDbFile')?.click();
});
document.getElementById('adminImportDbFile')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const content = ev.target && ev.target.result;
    if (content && confirm(L('Відновити та об\'єднати базу даних із вибраного файлу?', 'Restore and merge database from the selected file?'))) {
      socket.emit('adminCommand', { action: 'importDatabase', payload: { json: content } });
    }
    e.target.value = '';
  };
  reader.readAsText(file, 'utf-8');
});
socket.on('forceLogout', (msg) => { localStorage.removeItem('mafia_saved_auth'); alert(trSrv(msg)); location.reload(); });
socket.on('errorMsg', (msg) => {
  const txt = trSrv(msg);
  const submitBtn = document.getElementById('submitRoomBtn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerText = L('🟢 Створити кімнату та увійти в лобі', '🟢 Create Room & Enter Lobby');
  }
  const errEl = document.getElementById('roomError');
  if (errEl) errEl.innerText = txt;
  pushNewspaperItem('⚠️ ' + txt);
  const chatBox = document.getElementById('roomChatBox');
  if (chatBox) {
    chatBox.insertAdjacentHTML('beforeend', '<div class="system-msg" style="border-color:#ff6b6b; color:#ff8585;">⚠️ ' + escapeHTML(txt) + '</div>');
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  const activeScr = document.querySelector('.screen.active');
  if (activeScr && (activeScr.id === 'playScreen' || activeScr.id === 'mainMenuScreen')) {
    alert(L('Повідомлення: ', 'Notice: ') + txt);
  }
});
socket.on('activeMatchLock', () => renderRoomsList(latestRoomsList));
socket.on('systemNews', pushNewspaperItem);
socket.on('lobbyCountdownTick', (sec) => {
  const b = document.getElementById('lobbyCountdownBadge');
  if (b) {
    b.style.display = 'inline-block';
    b.innerText = '⏳ ' + sec + ' ' + L('с', 's');
  }
  if (typeof window.updateLobbyMinigamesCountdown === 'function') {
    window.updateLobbyMinigamesCountdown(sec);
  }
});
socket.on('joinedRoom', (room) => {
  const submitBtn = document.getElementById('submitRoomBtn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerText = L('🟢 Створити кімнату та увійти в лобі', '🟢 Create Room & Enter Lobby');
  }
  const f = document.getElementById('createRoomForm');
  if (f) f.style.display = 'none';

  activeRoomId = room.id;
  lastRoomSnapshot = room;

  const lobbyChat = document.getElementById('lobbyChatBox');
  if (lobbyChat) lobbyChat.innerHTML = '';
  lobbyMsgCount = 0;
  const lobbyCounter = document.getElementById('lobbyChatCounterBadge');
  if (lobbyCounter) lobbyCounter.innerText = '0 ' + L('смс', 'msgs');

  const roomChat = document.getElementById('roomChatBox');
  if (roomChat) roomChat.innerHTML = '';
  roomMsgCount = 0;
  const counterEl = document.getElementById('chatCounterBadge');
  if (counterEl) counterEl.innerText = '0 ' + L('смс', 'msgs');

  const invBtn = document.getElementById('copyRoomLinkBtn');
  if (invBtn) invBtn.setAttribute('data-room-id', room.id);
  const lobbyInvBtn = document.getElementById('copyLobbyLinkBtn');
  if (lobbyInvBtn) lobbyInvBtn.setAttribute('data-room-id', room.id);

  if (room.status === 'waiting') {
    initializedGameRoomId = null;
    if (Array.isArray(room.lobbyChatHistory)) {
      room.lobbyChatHistory.forEach(m => appendLobbyMessage(m, true));
    }
  } else {
    initializedGameRoomId = room.id;
    currentRoomNewsList = [];
    if (roomChat) {
      roomChat.innerHTML = '<div class="game-event-pill" style="border-left-color:#2a9d8f; color:#80ffdb;">' +
        L('🎭 Гра розпочалася! Повідомлення з лобі приховано — бажаємо вдалої партії!', '🎭 The match has started! Lobby messages are hidden — have a great game!') +
        '</div>';
    }
    if (Array.isArray(room.gameTimeline)) {
      room.gameTimeline.forEach(entry => {
        if (!entry) return;
        if (entry.kind === 'news' || entry.kind === 'private_news') {
          pushNewspaperItem(entry.text);
        } else if (entry.kind === 'msg' && entry.msg) {
          appendRoomMessage(entry.msg, true);
        }
      });
    }
    renderNewspaperEvents(currentRoomNewsList);
    if (roomChat) roomChat.scrollTop = roomChat.scrollHeight;
  }

  updateRoomScreen(room);
  if (room.status === 'waiting') {
    openTab('lobbyScreen');
  } else {
    openTab('roomScreen');
  }
});
document.getElementById('myRoleMiniPill')?.addEventListener('click', () => {
  if (lastRoomSnapshot && lastRoomSnapshot.myRole) {
    openRoleRevealModal(lastRoomSnapshot.myRole);
  }
});
document.getElementById('closeRoleRevealBtn')?.addEventListener('click', () => {
  document.getElementById('roleRevealModal')?.classList.remove('open');
});

socket.on('gameStarted', (payload) => {
  if (typeof window.closeLobbyMinigames === 'function') window.closeLobbyMinigames();
  const rId = (payload && payload.roomId) || activeRoomId;
  if (rId && initializedGameRoomId === rId) return;
  initializedGameRoomId = rId || null;
  lastRevealedRoleKey = null;
  currentRoomNewsList = [];
  const roomChat = document.getElementById('roomChatBox');
  if (roomChat) {
    roomChat.innerHTML = '<div class="game-event-pill" style="border-left-color:#2a9d8f; color:#80ffdb;">' +
      L('🎭 Гра розпочалася! Повідомлення з лобі приховано — бажаємо вдалої партії!', '🎭 The match has started! Lobby messages are hidden — have a great game!') +
      '</div>';
  }
  roomMsgCount = 0;
  const counterEl = document.getElementById('chatCounterBadge');
  if (counterEl) counterEl.innerText = '0 ' + L('смс', 'msgs');
  sfxNight();
  openTab('roomScreen');
});
socket.on('newLobbyMsg', (m) => appendLobbyMessage(m, false));
socket.on('roomStateUpdated', updateRoomScreen);
socket.on('newRoomMsg', (m) => appendRoomMessage(m, false));
socket.on('playerEliminatedEffect', playDeathEffectVisual);
socket.on('familyHeistResult', ({ ok, msg }) => {
  const fb = document.getElementById('familyFeedbackMsg');
  if (fb) {
    fb.style.color = ok ? '#80ffdb' : '#ffd166';
    fb.innerText = trSrv(msg || '');
  }
  if (ok) sfxWin();
  else sfxVote();
});
socket.on('timerTick', ({ phase, timeLeft, dayNumber }) => {
  document.getElementById('phaseTitleText').innerText = getPhaseLabel(phase, dayNumber);
  document.getElementById('phaseTimerBadge').innerText = timeLeft + ' ' + L('с', 's');
  if (timeLeft <= 5 && timeLeft > 0) {
    sfxTimerTick();
  }
  if (lastRoomSnapshot) {
    const oldPhase = lastRoomSnapshot.phase;
    lastRoomSnapshot.phase = phase;
    lastRoomSnapshot.timeLeft = timeLeft;
    lastRoomSnapshot.dayNumber = dayNumber;
    if (oldPhase !== phase) {
      updateChatChannelUI(lastRoomSnapshot);
      handlePhaseSound(phase);
    }
  }
});
socket.on('roomsUpdated', renderRoomsList);
socket.on('newGlobalMsg', (msg) => {
  const b = document.getElementById('globalChatBox');
  if (!b) return;
  b.insertAdjacentHTML('beforeend', createModernMsgHTML(msg.author, msg.text, msg.time, msg.badgeType, false, false, 'SLOT:1', msg.familyTag));
  b.scrollTop = b.scrollHeight;
  if (msg.author && currentUser && msg.author.toLowerCase() !== currentUser.nickname.toLowerCase()) {
    sfxNewMsg();
  }
});
socket.on('rewardReceived', ({ coins, diamonds, authority, xp, comment }) => {
  const modal = document.getElementById('rewardReceivedModal');
  const itemsWrap = document.getElementById('rewardItemsDisplay');
  const commentEl = document.getElementById('rewardCommentDisplay');
  showPhoneNotification(
    '🎁 ' + L('Нагорода від Адміністрації!', 'Reward from Administration!'),
    comment || (`+${coins || 0} 🪙 • +${authority || 0} ⭐ • +${xp || 0} XP`),
    'admin-reward'
  );
  if (!modal || !itemsWrap) return;

  itemsWrap.innerHTML = `
    <div class="reward-item-tile"><span class="num">+${coins || 0}</span><span class="lbl">${L('Монет 🪙', 'Coins 🪙')}</span></div>
    ${diamonds > 0 ? `<div class="reward-item-tile"><span class="num" style="color:#80ffdb;">+${diamonds}</span><span class="lbl">${L('Діамантів 💎', 'Diamonds 💎')}</span></div>` : ''}
    <div class="reward-item-tile"><span class="num">+${authority || 0}</span><span class="lbl">${L('Авторитету ⭐', 'Authority ⭐')}</span></div>
    <div class="reward-item-tile"><span class="num">+${xp || 0}</span><span class="lbl">${L('Досвіду XP', 'Experience XP')}</span></div>
  `;
  if (commentEl) {
    commentEl.innerText = comment ? `💬 «${trSrv(comment)}»` : L('💬 Вітаємо від імені адміністрації гри!', '💬 Congratulations from the game administration!');
  }
  sfxWin();
  modal.classList.add('open');
});

document.getElementById('closeAfkPenaltyModalBtn')?.addEventListener('click', () => {
  document.getElementById('afkPenaltyModal')?.classList.remove('open');
});
socket.on('matchEndedAfkList', ({ roomId, afkPlayers }) => {
  const list = Array.isArray(afkPlayers) ? afkPlayers : [];
  const myNickLower = currentUser ? currentUser.nickname.toLowerCase() : '';
  const targets = list.filter(a => a && a.nickname && a.nickname.toLowerCase() !== myNickLower);
  if (targets.length === 0) return;

  const box = document.getElementById('afkPlayersActionList');
  const modal = document.getElementById('afkPenaltyModal');
  if (!box || !modal) return;

  box.innerHTML = '';
  targets.forEach(a => {
    const reasonLbl = a.leftEarly
      ? L('покинув гру достроково', 'left the match early')
      : L('без жодного ходу за кілька днів', 'no actions across multiple days');
    const row = document.createElement('div');
    row.className = 'friend-row';
    row.style.marginBottom = '8px';
    row.dataset.afkNick = a.nickname.toLowerCase();
    row.innerHTML =
      '<div style="overflow:hidden;">' +
        '<div><b style="color:#ffd166;">' + escapeHTML(a.nickname) + '</b></div>' +
        '<div style="font-size:11px; color:#fca5a5;">' + reasonLbl + '</div>' +
        '<div class="afk-row-status" style="font-size:10px; color:#80ffdb;"></div>' +
      '</div>' +
      '<div style="display:flex; gap:5px; flex-shrink:0;">' +
        '<button type="button" class="afk-karma-btn secondary" style="width:auto; margin:0; padding:5px 8px; font-size:11px; color:#f4a261;">📉 -3 ' + L('Карми', 'Karma') + '</button>' +
        '<button type="button" class="afk-report-btn" style="width:auto; margin:0; padding:5px 8px; font-size:11px; background:#e63946;">🚩 ' + L('Скарга', 'Report') + '</button>' +
      '</div>';

    row.querySelector('.afk-karma-btn').addEventListener('click', (e) => {
      e.currentTarget.disabled = true;
      socket.emit('penalizeAfkPlayer', { roomId, targetNick: a.nickname });
    });
    row.querySelector('.afk-report-btn').addEventListener('click', () => {
      modal.classList.remove('open');
      document.getElementById('reportModalTargetNick').innerText = a.nickname;
      const detailsInp = document.getElementById('reportDetailsInput');
      if (detailsInp) detailsInp.value = L('Достроковий вихід / неактивність у матчі', 'Left game early / AFK in match');
      reportScreenshotData = null;
      const prevWrap = document.getElementById('reportScreenshotPreviewWrap');
      if (prevWrap) prevWrap.style.display = 'none';
      const fileInput = document.getElementById('reportScreenshotInput');
      if (fileInput) fileInput.value = '';
      document.getElementById('reportPlayerModal')?.classList.add('open');
    });
    box.appendChild(row);
  });
  modal.classList.add('open');
});
socket.on('afkPenaltyResult', ({ ok, targetNick, msg }) => {
  const row = targetNick
    ? document.querySelector(`#afkPlayersActionList .friend-row[data-afk-nick="${CSS.escape(targetNick.toLowerCase())}"]`)
    : null;
  if (row) {
    const st = row.querySelector('.afk-row-status');
    if (st) {
      st.style.color = ok ? '#80ffdb' : '#ffd166';
      st.innerText = trSrv(msg || '');
    }
  }
});
socket.on('tableGiftEffect', ({ targetNick, gift, sound }) => {
  playGiftSound(sound);
  showGiftVisualEffect(targetNick, gift, sound);
});
socket.on('msgTranslated', ({ id, translatedText, targetLang, rateLimited }) => {
  const el = document.getElementById('tr_' + id);
  if (!el) return;
  el.style.display = 'block';
  if (rateLimited) {
    el.textContent = trSrv(translatedText);
    return;
  }
  const prefix = typeof window.t === 'function' ? window.t('translated_prefix', L('Переклад', 'Translation')) : L('Переклад', 'Translation');
  const opt = TRANSLATE_LANGUAGE_OPTIONS.find(x => x.code === targetLang);
  const langTag = opt ? ` (${opt.flag} ${opt.code.toUpperCase()})` : '';
  el.textContent = `🌐 ${prefix}${langTag}: ${translatedText}`;
});
socket.on('roomMinigameScores', (scores) => {
  if (typeof window.updateLobbyMinigamesLeaderboard === 'function') {
    window.updateLobbyMinigamesLeaderboard(scores, null);
  }
});
socket.on('minigameRecordsData', (recs) => {
  if (typeof window.updateLobbyMinigamesLeaderboard === 'function') {
    window.updateLobbyMinigamesLeaderboard(null, recs);
  }
});
socket.on('kickedFromLobbyByPlayBan', (msg) => {
  if (typeof window.closeLobbyMinigames === 'function') window.closeLobbyMinigames();
  openTab('mainMenuScreen');
  if (msg) alert(trSrv(msg));
});
socket.on('leaderboardData', ({ list }) => {
  const box = document.getElementById('leaderboardList');
  if (!list || list.length === 0) {
    box.innerHTML = '<div class="card" style="color:#aaa;">' + L('За цей період поки немає активних гравців.', 'No active players for this period yet.') + '</div>';
    return;
  }
  box.innerHTML = '';
  list.forEach((p, idx) => {
    const row = document.createElement('div'); row.className = 'friend-row';
    const lbFrame = (p.equippedFrame && /^frame_[a-z0-9_]+$/i.test(p.equippedFrame)) ? (' ' + p.equippedFrame) : '';
    row.innerHTML =
      '<div style="display:flex; align-items:center; gap:8px;">' +
        '<b style="color:#f4a261;">#' + (idx + 1) + '</b>' +
        '<div class="mini-friend-ava' + lbFrame + '" style="' + buildAvatarRingStyle(p.avatarBorderColor) + '">' + buildAvatarHTML(p.avatar) + '</div>' +
        '<div><b>' + p.nickname + '</b> ' + buildBadgeHTML(p.badgeType) + '<div style="font-size:11px; color:#aaa;">' + L('Рівень ', 'Level ') + p.level + ' • ' + L('Перемог: ', 'Wins: ') + p.wins + '</div></div>' +
      '</div>' +
      '<b style="color:#f4a261;">' + p.authority + ' ⭐</b>';
    row.querySelector('.mini-friend-ava').addEventListener('click', () => socket.emit('getPlayerProfile', p.nickname));
    box.appendChild(row);
  });
});
socket.on('devPostsUpdated', renderDevPosts);

// === РЕЄСТРАЦІЯ SERVICE WORKER (АВТООНОВЛЕННЯ ДОДАТКУ) ТА ВСТАНОВЛЕННЯ PWA ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.update().catch(() => {});
    }).catch(() => {});
  });
}

let deferredPwaPrompt = null;
const installAppBtns = [
  document.getElementById('installAppMenuBtn'),
  document.getElementById('installAppAuthBtn')
].filter(Boolean);
const isStandaloneApp = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
if (isStandaloneApp) {
  installAppBtns.forEach(b => { b.style.display = 'none'; });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
  if (!isStandaloneApp) {
    installAppBtns.forEach(b => { b.style.display = 'block'; });
  }
});

window.addEventListener('appinstalled', () => {
  deferredPwaPrompt = null;
  installAppBtns.forEach(b => { b.style.display = 'none'; });
});

installAppBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      try {
        await deferredPwaPrompt.userChoice;
      } catch (e) {}
      deferredPwaPrompt = null;
      return;
    }
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
    if (isIos) {
      alert(L(
        '📲 Щоб встановити Mafia Club на iPhone/iPad:\n1. Натисніть кнопку «Поділитися» (квадрат зі стрілкою вгору внизу Safari).\n2. Оберіть «На Початковий екран» (Add to Home Screen).',
        '📲 To install Mafia Club on iPhone/iPad:\n1. Tap the Share button at the bottom of Safari.\n2. Select "Add to Home Screen".'
      ));
    } else {
      alert(L(
        '📲 Щоб встановити додаток:\n• На Android (Chrome): відкрийте меню браузера (⋮) у верхньому кутку → «Встановити додаток» або «Додати на головний екран».\n• На ПК (Chrome/Edge): натисніть значок встановлення (📥) справа в адресному рядку.',
        '📲 To install the app:\n• On Android (Chrome): tap the browser menu (⋮) → "Install app" or "Add to Home screen".\n• On PC (Chrome/Edge): click the install icon (📥) on the right side of the address bar.'
      ));
    }
  });
});

if (typeof window.applyLanguage === 'function') {
  window.applyLanguage(currentLang);
}
