// =====================================================================
//  UI — Авторизація, Адмінка Itaminx (1616), Профіль/Статистика,
//       Компактний Хаб (Арена, Колода, Режими/Сюжет), Ринок/Акції дня,
//       Повноекранний бій, Плавна висадка пальцем і радіус споруд
// =====================================================================
import {
  VERSION, CARDS, CARD_MAP, TOWERS, TOWER_MAP, ARENAS, CHESTS, RARITY,
  ECONOMY, LEVEL_MAX, CARD_CAPACITY_TOTAL, CARD_CAPACITY_PER_ARENA,
  STORY_CAMPAIGNS, STORY_CHAPTERS, GAME_MODES, GAME_NEWS, TROPHY_ROAD, EMOTES,
  statAtLevel, arenaForTrophies,
} from './data.js';
import {
  Save, rollChestType, generateChest, applyChest,
  recordBattleLog, addCrownChestProgress,
} from './storage.js';
import { Audio } from './audio.js';
import { portraitSVG } from './portraits.js';
import { Game } from './game.js';
import { Bot, makeBotDeck, computeBotMatchup } from './ai.js';
import { Renderer } from './renderer.js';

const RANK_TITLES = [
  { min: 0,    name: 'Вуличний новачок' },
  { min: 250,  name: 'Боєць кварталу' },
  { min: 700,  name: 'Солдат сім\'ї' },
  { min: 1200, name: 'Сержант мафії' },
  { min: 1700, name: 'Капореджиме' },
  { min: 2450, name: 'Молодший бос' },
  { min: 3200, name: 'Консильєрі' },
  { min: 4000, name: 'Хрещений батько' },
  { min: 4900, name: 'Глава Конклаву' },
];
function rankForTrophies(t) {
  let r = RANK_TITLES[0].name;
  for (const it of RANK_TITLES) if (t >= it.min) r = it.name;
  return r;
}

class AppUI {
  constructor() {
    Save.load();
    this.tab = 'battle';
    this.authMode = 'login';
    this.pendingAdminAuth = null; // { mode, username, password }
    this.swapCardId = null;
    this.deckFilters = { rarity: 'all', kind: 'all', sort: 'arena' };

    this.game = null;
    this.bot = null;
    this.renderer = null;
    this.raf = null;
    this.lastTs = 0;
    this.activeStoryChapter = null;
    this.activeStorySabotage = false;

    // Стан вибору/плавного перетягування карти та інспекції будівель
    this.selectedHandIdx = null;
    this.inspectedEntityId = null;
    this.drag = {
      active: false,
      fromArena: false,
      handIdx: null,
      cardId: null,
      clientX: 0,
      clientY: 0,
      inArena: false,
      tileX: 0,
      tileY: 0,
      isTouch: false,
    };
  }

  init() {
    this._cacheDOM();
    this._bindAuthEvents();
    this._bindMenuEvents();
    this._bindBattleEvents();

    Audio.setSfx(Save.data.settings.sound);
    Audio.setMusic(Save.data.settings.music);

    // Розблокування аудіо та автозапуск музики меню при першому кліку/тачі
    const unlockOnce = () => {
      Audio.unlock();
      if (Save.data && Save.data.settings.music && !this.game) {
        Audio.startMusic(68);
      }
      window.removeEventListener('pointerdown', unlockOnce);
    };
    window.addEventListener('pointerdown', unlockOnce, { passive: true });

    window.addEventListener('resize', () => {
      if (this.renderer && !this.el.battleScreen.classList.contains('hidden')) {
        this.renderer.resize();
      }
    });

    if (Save.isLoggedIn()) {
      this.enterMenu();
    } else {
      this.showAuthScreen();
    }

    // Автоматична перевірка оновлень через 1.5с після запуску (якщо є інтернет)
    setTimeout(() => this.checkForUpdates(false), 1500);
  }

  _cacheDOM() {
    const $ = id => document.getElementById(id);
    this.el = {
      // Екрани
      authScreen: $('auth-screen'),
      menuScreen: $('menu-screen'),
      battleScreen: $('battle-screen'),
      // Auth
      authTabs: document.querySelectorAll('.auth-tab'),
      authForm: $('auth-form'),
      authUsername: $('auth-username'),
      authPassword: $('auth-password'),
      authError: $('auth-error'),
      authSubmitBtn: $('auth-submit-btn'),
      savedAccountsBox: $('saved-accounts-box'),
      savedAccountsList: $('saved-accounts-list'),
      // Секретна панель адміна
      secretModal: $('secret-modal'),
      secretInput: $('secret-code-input'),
      secretError: $('secret-error'),
      btnSecretConfirm: $('btn-secret-confirm'),
      btnSecretCancel: $('btn-secret-cancel'),
      // Верхня панель меню
      btnOpenProfile: $('btn-open-profile'),
      topAvatar: $('top-avatar'),
      topUsername: $('top-username'),
      topRank: $('top-rank'),
      topTrophies: $('top-trophies'),
      topGold: $('top-gold'),
      btnNews: $('btn-news'),
      newsBadgeDot: $('news-badge-dot'),
      btnSettings: $('btn-settings'),
      // Вкладки
      tabs: document.querySelectorAll('.nav-tab'),
      pages: {
        battle: $('tab-battle'),
        deck: $('tab-deck'),
        shop: $('tab-shop'),
      },
      // Головний Хаб
      heroArenaCard: $('hero-arena-card'),
      activeDeckPreview: $('active-deck-preview'),
      btnHubDeck: $('btn-hub-deck'),
      hubDeckAvg: $('hub-deck-avg'),
      btnStartBattle: $('btn-start-battle'),
      hubModeLabel: $('hub-mode-label'),
      btnHubModes: $('btn-hub-modes'),
      hubModeIcon: $('hub-mode-icon'),
      battleStatsLine: $('battle-stats-line'),
      // Колода
      towerGrid: $('tower-grid'),
      deckSlots: $('deck-slots'),
      avgCost: $('deck-avg-cost'),
      swapBanner: $('swap-banner'),
      swapBannerName: $('swap-banner-name'),
      btnCancelSwap: $('btn-cancel-swap'),
      collectionCount: $('collection-count'),
      collectionGrid: $('collection-grid'),
      collectionRoadmap: $('collection-roadmap'),
      // Ринок
      dailyDealsGrid: $('daily-deals-grid'),
      chestGrid: $('chest-grid'),
      // Екран бою
      canvas: $('battle-canvas'),
      hudArenaName: $('hud-arena-name'),
      hudBotName: $('hud-bot-name'),
      hudTimer: $('hud-timer'),
      hudMult: $('hud-mult'),
      hudCrownsP: $('hud-crowns-p'),
      hudCrownsE: $('hud-crowns-e'),
      btnFullscreenBattle: $('btn-fullscreen-battle'),
      btnSurrender: $('btn-surrender'),
      handSlots: $('hand-slots'),
      nextCardSlot: $('next-card-slot'),
      cashFill: $('cash-bar-fill'),
      cashTicks: $('cash-bar-ticks'),
      cashValue: $('cash-value'),
      dragGhost: $('drag-ghost'),
      // Модалки
      cardModal: $('card-modal'),
      cardModalBody: $('card-modal-body'),
      chestModal: $('chest-modal'),
      chestModalBody: $('chest-modal-body'),
      resultModal: $('result-modal'),
      resultModalBody: $('result-modal-body'),
      arenaModal: $('arena-modal'),
      arenaModalBody: $('arena-modal-body'),
      modesModal: $('modes-modal'),
      modesModalBody: $('modes-modal-body'),
      profileModal: $('profile-modal'),
      profileModalBody: $('profile-modal-body'),
      settingsModal: $('settings-modal'),
      settingsModalBody: $('settings-modal-body'),
      adminModal: $('admin-modal'),
      adminModalBody: $('admin-modal-body'),
      whatsNewModal: $('whats-new-modal'),
      whatsNewModalBody: $('whats-new-modal-body'),
      newsModal: $('news-modal'),
      newsModalBody: $('news-modal-body'),
    };
  }

  // ==================================================================
  //  АВТОРИЗАЦІЯ ТА СЕКРЕТНА ПАНЕЛЬ АДМІНА Itaminx (1616)
  // ==================================================================
  showAuthScreen() {
    Audio.stopMusic();
    this.el.menuScreen.classList.add('hidden');
    this.el.battleScreen.classList.add('hidden');
    this.el.authScreen.classList.remove('hidden');
    this.el.authError.classList.add('hidden');
    this.el.authPassword.value = '';
    this._renderSavedAccounts();
  }

  _renderSavedAccounts() {
    const list = Save.listAccounts();
    if (!list.length) {
      this.el.savedAccountsBox.classList.add('hidden');
      return;
    }
    this.el.savedAccountsBox.classList.remove('hidden');
    this.el.savedAccountsList.innerHTML = list.map(a => `
      <button type="button" class="saved-chip ${a.isAdmin ? 'admin' : ''}" data-pick-acc="${a.username}">
        ${a.isAdmin ? '👑' : '🎩'} ${a.username} (${a.trophies}🏆)
      </button>
    `).join('');
    this.el.savedAccountsList.querySelectorAll('[data-pick-acc]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.el.authUsername.value = btn.dataset.pickAcc;
        this._setAuthMode('login');
        this.el.authPassword.focus();
      });
    });
  }

  _setAuthMode(mode) {
    this.authMode = mode;
    this.el.authTabs.forEach(t => t.classList.toggle('active', t.dataset.authMode === mode));
    this.el.authSubmitBtn.querySelector('.btn-battle-main').textContent =
      mode === 'login' ? 'УВІЙТИ В МІСТО' : 'СТВОРИТИ ПРОФІЛЬ';
    this.el.authError.classList.add('hidden');
  }

  _bindAuthEvents() {
    this.el.authTabs.forEach(t => {
      t.addEventListener('click', () => this._setAuthMode(t.dataset.authMode));
    });

    this.el.authForm.addEventListener('submit', e => {
      e.preventDefault();
      Audio.unlock();
      const username = this.el.authUsername.value.trim();
      const password = this.el.authPassword.value;

      if (!username || !password) {
        this._showAuthError('Заповніть нікнейм та пароль.');
        return;
      }

      // Якщо це адмін Itaminx — спочатку перевіряємо пароль (якщо профіль вже існує) і показуємо секретну панель 1616!
      if (Save.isAdminName(username)) {
        if (this.authMode === 'login' && Save.accountExists(username)) {
          const existing = Save.accounts[username.toLowerCase()];
          if (existing.password !== password) {
            this._showAuthError('Невірний пароль.');
            return;
          }
        } else if (password.length < 3) {
          this._showAuthError('Пароль має містити мінімум 3 символи.');
          return;
        }
        this.pendingAdminAuth = { mode: this.authMode, username, password };
        this.el.secretInput.value = '';
        this.el.secretError.classList.add('hidden');
        this.el.secretModal.classList.remove('hidden');
        setTimeout(() => this.el.secretInput.focus(), 60);
        return;
      }

      const res = this.authMode === 'login'
        ? Save.login(username, password)
        : Save.register(username, password);

      if (!res.ok) {
        Audio.play('error');
        this._showAuthError(res.error);
        return;
      }
      Audio.play('crown');
      this.enterMenu();
    });

    const submitSecret = () => {
      if (!this.pendingAdminAuth) return;
      const code = this.el.secretInput.value.trim();
      const { mode, username, password } = this.pendingAdminAuth;
      const res = mode === 'login'
        ? Save.login(username, password, code)
        : Save.register(username, password, code);
      if (!res.ok) {
        Audio.play('error');
        this.el.secretError.textContent = res.error || 'Невірний секретний код!';
        this.el.secretError.classList.remove('hidden');
        return;
      }
      this.pendingAdminAuth = null;
      this.el.secretModal.classList.add('hidden');
      Audio.play('victory');
      this.enterMenu();
    };

    this.el.btnSecretConfirm.addEventListener('click', submitSecret);
    this.el.secretInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); submitSecret(); }
    });
    this.el.btnSecretCancel.addEventListener('click', () => {
      this.pendingAdminAuth = null;
      this.el.secretModal.classList.add('hidden');
    });
  }

  _showAuthError(msg) {
    this.el.authError.textContent = msg;
    this.el.authError.classList.remove('hidden');
  }

  enterMenu() {
    this.el.authScreen.classList.add('hidden');
    this.el.battleScreen.classList.add('hidden');
    this.el.menuScreen.classList.remove('hidden');
    Audio.setSfx(Save.data.settings.sound);
    Audio.setMusic(Save.data.settings.music, 68);
    if (Save.data.settings.music) Audio.startMusic(68);
    this.refreshAll();

    // Автоматично відкриваємо вікно «Що нового» після оновлення версії
    if (Save.hasUnreadUpdate(VERSION)) {
      setTimeout(() => this.openWhatsNewModal(VERSION), 450);
    }
  }

  // ==================================================================
  //  ПОДІЇ ГОЛОВНОГО МЕНЮ ТА МОДАЛОК
  // ==================================================================
  _bindMenuEvents() {
    this.el.tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        Audio.unlock();
        Audio.play('click');
        this.switchTab(btn.dataset.tab);
      });
    });

    this.el.btnOpenProfile.addEventListener('click', () => {
      Audio.play('click');
      this.openProfileModal();
    });

    this.el.btnSettings.addEventListener('click', () => {
      Audio.play('click');
      this.openSettingsModal();
    });

    if (this.el.btnNews) {
      this.el.btnNews.addEventListener('click', () => {
        Audio.play('click');
        this.openNewsModal();
      });
    }

    this.el.heroArenaCard.addEventListener('click', () => {
      Audio.play('click');
      this.openArenaModal();
    });

    this.el.btnHubDeck.addEventListener('click', () => {
      Audio.play('click');
      this.switchTab('deck');
    });

    this.el.btnHubModes.addEventListener('click', () => {
      Audio.play('click');
      this.openModesModal();
    });

    this.el.btnStartBattle.addEventListener('click', () => {
      Audio.unlock();
      if (Save.data.deck.length < 8) {
        Audio.play('error');
        this.showToast(`У колоді має бути 8 карт! Зараз: ${Save.data.deck.length}/8`, '🃏');
        this.switchTab('deck');
        return;
      }
      Audio.play('select');
      if (Save.data.gameMode === 'story') {
        this.openModesModal(true);
      } else {
        this.startBattle({ mode: Save.data.gameMode || 'ranked' });
      }
    });

    this.el.btnCancelSwap.addEventListener('click', () => {
      this.swapCardId = null;
      this.renderDeckTab();
    });

    // Закриття модалок по кліку на фон або [data-close-modal]
    const closable = [
      this.el.cardModal, this.el.arenaModal, this.el.modesModal,
      this.el.profileModal, this.el.settingsModal, this.el.adminModal,
      this.el.whatsNewModal, this.el.newsModal, document.getElementById('road-modal'),
    ].filter(Boolean);
    for (const m of closable) {
      m.addEventListener('click', e => {
        if (e.target === m || e.target.closest('[data-close-modal]')) {
          m.classList.add('hidden');
        }
      });
    }
  }

  showToast(msg, icon = '👑') {
    const el = document.getElementById('game-toast');
    if (!el) return;
    el.innerHTML = `<span class="gt-icon">${icon}</span><span class="gt-msg">${msg}</span>`;
    el.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
  }

  switchTab(tab) {
    this.tab = tab;
    this.el.tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    Object.entries(this.el.pages).forEach(([k, node]) => {
      node.classList.toggle('hidden', k !== tab);
    });
    if (tab !== 'deck') this.swapCardId = null;
    this.refreshAll();
  }

  refreshAll() {
    if (!Save.isLoggedIn()) return;
    this.renderTopBar();
    this.renderBattleTab();
    this.renderDeckTab();
    this.renderShopTab();
  }

  renderTopBar() {
    const d = Save.data;
    this.el.topAvatar.textContent = d.isAdmin ? '👑' : '🎩';
    this.el.topUsername.textContent = d.username;
    this.el.topRank.textContent = d.isAdmin ? 'АДМІНІСТРАТОР' : rankForTrophies(d.trophies);
    this.el.btnOpenProfile.classList.toggle('is-admin', d.isAdmin);
    this.el.topTrophies.textContent = d.trophies;
    this.el.topGold.textContent = d.gold;

    if (this.el.newsBadgeDot) {
      const hasUnread = Save.hasUnreadUpdate(VERSION);
      this.el.newsBadgeDot.classList.toggle('hidden', !hasUnread);
    }
  }

  // ==================================================================
  //  ВКЛАДКА 1: КОМПАКТНИЙ ХАБ (Арена по центру, нижче Колода / В БІЙ / Режими)
  // ==================================================================
  renderBattleTab() {
    const d = Save.data;
    const autoArena = arenaForTrophies(d.trophies);
    if (d.autoArena) d.selectedArena = autoArena.id;
    const ar = ARENAS.find(a => a.id === d.selectedArena) || autoArena;
    const arIdx = ARENAS.indexOf(ar);
    const nextAr = ARENAS[arIdx + 1];

    const progPct = nextAr
      ? Math.min(100, Math.max(0, Math.round(((d.trophies - ar.min) / (nextAr.min - ar.min)) * 100)))
      : 100;
    const progTxt = nextAr ? `${d.trophies} / ${nextAr.min} 🏆 до «${nextAr.name}»` : `Максимальна ліга (${d.trophies} 🏆)`;

    this.el.heroArenaCard.style.background = `linear-gradient(160deg, ${ar.bg} 0%, #0d1017 100%)`;
    this.el.heroArenaCard.style.borderColor = ar.bridge;
    this.el.heroArenaCard.innerHTML = `
      <div class="hero-arena-top">
        <span class="hero-arena-badge">АРЕНА ${ar.num}${d.autoArena ? ' • АВТО' : ' • ОБРАНО'}</span>
        <span class="hero-arena-tap">🗺️ Усі арени ▾</span>
      </div>
      <div class="hero-arena-visual" style="background:radial-gradient(circle at 50% 50%, ${ar.bg} 0%, #090b10 100%); border-color:${ar.bridge}">
        <div class="hero-mini-tower enemy" style="left:22%"></div>
        <div class="hero-mini-tower enemy king" style="left:50%"></div>
        <div class="hero-mini-tower enemy" style="left:78%"></div>
        <div class="hero-river">
          <div class="hero-bridge" style="background:${ar.bridge}"></div>
          <div class="hero-bridge" style="background:${ar.bridge}"></div>
        </div>
        <div class="hero-mini-tower player" style="left:22%"></div>
        <div class="hero-mini-tower player king" style="left:50%"></div>
        <div class="hero-mini-tower player" style="left:78%"></div>
      </div>
      <div class="hero-arena-title">${ar.name}</div>
      <div class="hero-arena-spec">✨ ${ar.specialty} • 🎵 ${ar.bpm} BPM</div>
      <div class="hero-arena-feature">⚡ <strong>${ar.featureName}:</strong> ${ar.featureDesc}</div>
      <div class="hero-arena-progress">
        <div class="hero-prog-bar"><div class="hero-prog-fill" style="width:${progPct}%"></div></div>
        <div class="hero-prog-label">
          <span>${progTxt}</span>
          <span>+${ar.win} / ${ar.lose} 🏆</span>
        </div>
      </div>
    `;

    // Прев'ю поточної вежі та 8 карт колоди
    const tower = TOWER_MAP[d.tower];
    const avg = (d.deck.reduce((s, id) => s + CARD_MAP[id].cost, 0) / d.deck.length).toFixed(1);
    this.el.hubDeckAvg.textContent = `${avg}$`;

    const modeObj = GAME_MODES.find(m => m.id === d.gameMode) || GAME_MODES[0];
    this.el.hubModeLabel.textContent = modeObj.name;
    this.el.hubModeIcon.textContent = modeObj.icon;

    this.el.activeDeckPreview.innerHTML = `
      <div class="mini-tower-pill">
        <div class="mini-portrait">${portraitSVG(tower.id)}</div>
        <div>
          <div class="mini-label">Вежа • Середній рівень колоди: ${Save.avgDeckLevel().toFixed(1)}</div>
          <div class="mini-name">${tower.name}</div>
        </div>
      </div>
      <div class="mini-deck-row">
        ${d.deck.map(id => {
          const c = CARD_MAP[id];
          const lv = Save.level(id);
          return `<div class="mini-card" title="${c.name} (Рів. ${lv})">
            ${portraitSVG(id)}
            <span class="mini-cost">${c.cost}$</span>
            <span class="mini-lv">Р${lv}</span>
          </div>`;
        }).join('')}
      </div>
    `;

    const st = d.stats;
    this.el.battleStatsLine.textContent = `Боїв: ${st.battles} • Перемог: ${st.wins} • Поразок: ${st.losses} • Нічиїх: ${st.draws}`;

    // Скринька за корони (10 корон) + Трофейна дорога
    const cc = d.crownChest || { crowns: 0, target: 10 };
    const ccEl = document.getElementById('crown-chest-count');
    const ccBtn = document.getElementById('btn-crown-chest');
    if (ccEl && ccBtn) {
      ccEl.textContent = cc.crowns >= cc.target ? 'ВІДКРИТИ!' : `${cc.crowns} / ${cc.target}`;
      ccBtn.classList.toggle('ready', cc.crowns >= cc.target);
      ccBtn.onclick = () => {
        Audio.unlock();
        if ((Save.data.crownChest?.crowns || 0) >= 10) {
          Save.data.crownChest.crowns -= 10;
          Save.save();
          const goldChest = CHESTS.find(c => c.id === 'gold') || CHESTS[1];
          this.renderBattleTab();
          this.openChestSequence(goldChest);
        } else {
          Audio.play('click');
          this.showToast(`Зберіть ще ${10 - (Save.data.crownChest?.crowns || 0)} корон у боях, щоб відкрити Золотий Кейс!`, '👑');
        }
      };
    }
    const unclaimed = TROPHY_ROAD.filter(m => (d.maxTrophies || d.trophies) >= m.trophies && !(d.claimedRoad || []).includes(m.id));
    const roadBadge = document.getElementById('trophy-road-badge');
    const roadBtn = document.getElementById('btn-trophy-road');
    if (roadBadge) {
      roadBadge.textContent = unclaimed.length;
      roadBadge.classList.toggle('hidden', unclaimed.length === 0);
    }
    if (roadBtn) {
      roadBtn.onclick = () => {
        Audio.unlock();
        Audio.play('click');
        this.openTrophyRoadModal();
      };
    }
  }

  openTrophyRoadModal() {
    const d = Save.data;
    const modal = document.getElementById('road-modal');
    const body = document.getElementById('road-modal-body');
    const best = Math.max(d.trophies, d.maxTrophies || 0);
    const claimed = d.claimedRoad || [];
    body.innerHTML = `
      <div class="modal-title">
        <h3>🛤️ Трофейна дорога (${best} 🏆)</h3>
        <button class="btn-ghost-sm" data-close-modal>✕</button>
      </div>
      <p class="modal-desc">Досягайте нових порогів Авторитету та забирайте нагороди!</p>
      <div class="road-list">
        ${TROPHY_ROAD.map(m => {
          const ok = best >= m.trophies;
          const got = claimed.includes(m.id);
          return `
            <div class="road-row ${ok && !got ? 'unlocked' : ''}">
              <div>
                <strong>${m.icon} ${m.label}</strong>
                <div style="font-size:11px; color:#9ca3af">Поріг: ${m.trophies} 🏆</div>
              </div>
              ${got
                ? '<span style="color:#22c55e; font-weight:700">✔ Забрано</span>'
                : ok
                  ? `<button class="btn-gold btn-claim-road" data-road-id="${m.id}" style="padding:6px 10px; font-size:11px">Забрати!</button>`
                  : `<span style="color:#6b7280">🔒 ${m.trophies} 🏆</span>`}
            </div>
          `;
        }).join('')}
      </div>
      <button class="btn-ghost" data-close-modal style="width:100%">Закрити</button>
    `;
    modal.classList.remove('hidden');
    body.querySelectorAll('.btn-claim-road').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = TROPHY_ROAD.find(x => x.id === btn.dataset.roadId);
        if (!m || Save.data.claimedRoad.includes(m.id)) return;
        Save.data.claimedRoad.push(m.id);
        if (m.type === 'gold') {
          Save.data.gold += m.amount;
          Save.save();
          Audio.play('coin');
          this.refreshAll();
          this.openTrophyRoadModal();
        } else {
          Save.save();
          modal.classList.add('hidden');
          const ch = CHESTS.find(c => c.id === m.chestId) || CHESTS[0];
          this.refreshAll();
          this.openChestSequence(ch);
        }
      });
    });
  }

  // ==================================================================
  //  МОДАЛКА ВИБОРУ АРЕН (Авто-ріст + ручний вибір + слоти під 150 карт)
  // ==================================================================
  openArenaModal() {
    const d = Save.data;
    const autoArena = arenaForTrophies(d.trophies);

    this.el.arenaModalBody.innerHTML = `
      <div class="modal-title">
        <h3>🗺️ Арени міста (${ARENAS.length} Арен)</h3>
        <button class="btn-ghost-sm" data-close-modal>✕</button>
      </div>
      <div class="settings-row">
        <span>Автоматичний ріст арени за кубками</span>
        <button id="btn-toggle-auto-arena" class="toggle-btn ${d.autoArena ? '' : 'off'}">${d.autoArena ? 'УВІМК' : 'ВИМК'}</button>
      </div>
      <div class="arena-list">
        ${ARENAS.map(ar => {
          const unlocked = d.trophies >= ar.min || d.isAdmin;
          const isSel = d.selectedArena === ar.id;
          const isLeague = autoArena.id === ar.id;
          const arenaCards = CARDS.filter(c => c.unlockArena === ar.num);
          const names = arenaCards.map(c => c.name).join(', ');
          return `
            <div class="arena-card ${isSel ? 'selected' : ''} ${unlocked ? '' : 'locked'}" data-pick-arena="${ar.id}">
              <div class="arena-swatch" style="background:${ar.bg}; border-color:${ar.bridge}">
                <div class="arena-bridge-preview" style="background:${ar.bridge}"></div>
                <span class="arena-num">АРЕНА ${ar.num}</span>
                ${isLeague ? '<span class="arena-badge-current">ВАША ЛІГА</span>' : ''}
                ${!unlocked ? `<span class="arena-badge-lock">🔒 ${ar.min}🏆</span>` : ''}
              </div>
              <div class="arena-info">
                <div class="arena-title">${ar.name}</div>
                <div class="arena-meta">
                  <span>🏆 ${ar.max >= 9999 ? ar.min + '+' : ar.min + '–' + ar.max}</span>
                  <span>🎵 ${ar.bpm} BPM</span>
                  <span>🃏 ${arenaCards.length} / ${CARD_CAPACITY_PER_ARENA} карт</span>
                </div>
                <div class="arena-feature-pill">⚡ <strong>${ar.featureName}:</strong> ${ar.featureDesc}</div>
                <p class="arena-desc">${ar.specialty}</p>
                <div class="arena-unlocks">Особливі юніти: ${names || 'Скоро'}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    this.el.arenaModal.classList.remove('hidden');

    document.getElementById('btn-toggle-auto-arena').addEventListener('click', () => {
      Audio.play('click');
      d.autoArena = !d.autoArena;
      if (d.autoArena) d.selectedArena = arenaForTrophies(d.trophies).id;
      Save.save();
      this.renderBattleTab();
      this.openArenaModal();
    });

    this.el.arenaModalBody.querySelectorAll('[data-pick-arena]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.pickArena;
        Audio.play('select');
        d.autoArena = false;
        d.selectedArena = id;
        Save.save();
        this.el.arenaModal.classList.add('hidden');
        this.renderBattleTab();
      });
    });
  }

  // ==================================================================
  //  МОДАЛКА ІГРОВИХ РЕЖИМІВ ТА СЮЖЕТУ (2 ГІЛКИ: МАФІЯ / СИЛОВИКИ + ДИВЕРСІЇ)
  // ==================================================================
  openModesModal(focusStory = false) {
    const d = Save.data;
    const renderBody = (showStory) => {
      if (showStory) {
        const branchKey = d.storyBranch === 'police' ? 'police' : 'mafia';
        const camp = STORY_CAMPAIGNS[branchKey];
        const chapters = camp.chapters;

        this.el.modesModalBody.innerHTML = `
          <div class="modal-title">
            <h3>📜 Сюжетна кампанія</h3>
            <button class="btn-ghost-sm" id="btn-modes-back">← Режими</button>
          </div>
          <div class="auth-tabs" style="margin-bottom:10px">
            <button class="auth-tab ${branchKey === 'mafia' ? 'active' : ''}" data-branch="mafia">🎩 Мафія</button>
            <button class="auth-tab ${branchKey === 'police' ? 'active' : ''}" data-branch="police">🚔 Силовики</button>
          </div>
          <p class="modal-desc">${camp.subtitle}.<br/><em>Поразка запускає «Вендету» (+50% золота за реванш) і відкриває Диверсію для ослаблення боса.</em></p>
          ${chapters.map(ch => {
            const done = !!d.storyDone[ch.id];
            const prevId = `${ch.branch === 'mafia' ? 'm' : 'p'}_${ch.num - 1}`;
            const prevDone = ch.num === 1 || !!d.storyDone[prevId] || d.isAdmin;
            const st = d.storyState[ch.id] || { losses: 0, vendetta: false, sabotageDone: false };
            const effLv = Math.max(1, ch.botLevel - (st.sabotageDone ? 1 : 0));
            const goldRew = st.vendetta ? Math.round(ch.rewardGold * 1.5) : ch.rewardGold;
            return `
              <div class="story-card ${done ? 'done' : ''}" style="${st.vendetta && !done ? 'border-color:#ef4444' : ''}">
                <div class="mode-head">
                  <span>${ch.title}</span>
                  <span>${done ? '✅ Пройдено' : (st.vendetta ? `🔥 🪙 +${goldRew}` : `🪙 +${goldRew}`)}</span>
                </div>
                <div class="mode-desc" style="margin-bottom:6px">
                  <strong>Бос:</strong> ${ch.boss} (Рів. ${effLv}${st.sabotageDone ? ' — ослаблений диверсією!' : ''})<br/>
                  ${ch.story}
                  ${st.vendetta && !done ? `<div style="color:#fca5a5; margin-top:4px"><strong>🔥 ВЕНДЕТА (поразок: ${st.losses}):</strong> ${ch.taunt}</div>` : ''}
                </div>
                <div style="display:flex; flex-direction:column; gap:6px">
                  <button class="btn-primary ${prevDone ? '' : 'disabled'}" data-play-story="${ch.id}" style="width:100%">
                    ${prevDone ? (done ? '⚔️ Переграти главу' : (st.vendetta ? '🔥 Реванш (Вендета +50% 🪙)' : '⚔️ Почати главу')) : '🔒 Пройдіть попередню главу'}
                  </button>
                  ${prevDone && !done && st.losses > 0 && !st.sabotageDone ? `
                    <button class="btn-secondary" data-play-sabotage="${ch.id}" style="width:100%">
                      🕵️ Диверсія: ${ch.sabotageTitle} (послабить боса -1 рів.)
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        `;

        document.getElementById('btn-modes-back').addEventListener('click', () => renderBody(false));
        this.el.modesModalBody.querySelectorAll('[data-branch]').forEach(b => {
          b.addEventListener('click', () => {
            Audio.play('click');
            d.storyBranch = b.dataset.branch;
            Save.save();
            renderBody(true);
          });
        });
        this.el.modesModalBody.querySelectorAll('[data-play-story]').forEach(btn => {
          btn.addEventListener('click', () => {
            const ch = chapters.find(c => c.id === btn.dataset.playStory);
            const prevId = `${ch.branch === 'mafia' ? 'm' : 'p'}_${ch.num - 1}`;
            const prevDone = ch.num === 1 || !!d.storyDone[prevId] || d.isAdmin;
            if (!prevDone) { Audio.play('error'); return; }
            Audio.play('select');
            this.el.modesModal.classList.add('hidden');
            this.startBattle({ mode: 'story', chapter: ch, isSabotage: false });
          });
        });
        this.el.modesModalBody.querySelectorAll('[data-play-sabotage]').forEach(btn => {
          btn.addEventListener('click', () => {
            const ch = chapters.find(c => c.id === btn.dataset.playSabotage);
            if (!ch) return;
            Audio.play('select');
            this.el.modesModal.classList.add('hidden');
            this.startBattle({ mode: 'story', chapter: ch, isSabotage: true });
          });
        });
        return;
      }

      this.el.modesModalBody.innerHTML = `
        <div class="modal-title">
          <h3>🎮 Ігрові режими</h3>
          <button class="btn-ghost-sm" data-close-modal>✕</button>
        </div>
        ${GAME_MODES.map(m => `
          <div class="mode-card ${d.gameMode === m.id ? 'selected' : ''}" data-pick-mode="${m.id}">
            <div class="mode-head">
              <span>${m.icon} ${m.name}</span>
              <span>${d.gameMode === m.id ? '✔' : ''}</span>
            </div>
            <div class="mode-desc">${m.desc}</div>
          </div>
        `).join('')}
        <div class="modal-actions" style="margin-top:8px">
          <button class="btn-gold" id="btn-open-story-chapters">📜 Сюжет: Мафія / Силовики (10 глав)</button>
          <button class="btn-ghost" data-close-modal>Готово</button>
        </div>
      `;

      this.el.modesModalBody.querySelectorAll('[data-pick-mode]').forEach(el => {
        el.addEventListener('click', () => {
          Audio.play('select');
          d.gameMode = el.dataset.pickMode;
          Save.save();
          this.renderBattleTab();
          if (d.gameMode === 'story') renderBody(true);
          else renderBody(false);
        });
      });
      document.getElementById('btn-open-story-chapters').addEventListener('click', () => {
        Audio.play('click');
        d.gameMode = 'story';
        Save.save();
        this.renderBattleTab();
        renderBody(true);
      });
    };

    renderBody(focusStory);
    this.el.modesModal.classList.remove('hidden');
  }

  // ==================================================================
  //  МОДАЛКА ПРОФІЛЮ ТА СТАТИСТИКИ
  // ==================================================================
  openProfileModal() {
    const d = Save.data;
    const st = d.stats;
    const winrate = st.battles > 0 ? Math.round((st.wins / st.battles) * 100) : 0;
    const fav = Save.favoriteCardId();
    const favCard = CARD_MAP[fav.id];
    const storyCount = Object.keys(d.storyDone || {}).length;

    this.el.profileModalBody.innerHTML = `
      <div class="modal-title">
        <h3>${d.isAdmin ? '👑' : '🎩'} Профіль: ${d.username}</h3>
        <button class="btn-ghost-sm" data-close-modal>✕</button>
      </div>
      <div class="modal-desc">
        Звання: <strong>${d.isAdmin ? 'Адміністратор Синдикату' : rankForTrophies(d.trophies)}</strong> •
        Середній рівень колоди: <strong>${Save.avgDeckLevel().toFixed(1)}</strong>
      </div>
      <div class="modal-stats-grid">
        <div class="stat-box"><span>🏆 Авторитет</span><strong>${d.trophies} (Макс: ${d.maxTrophies})</strong></div>
        <div class="stat-box"><span>⚔️ Боїв / Перемог</span><strong>${st.battles} / ${st.wins} (${winrate}%)</strong></div>
        <div class="stat-box"><span>👑 Корон здобуто</span><strong>${st.crownsWon} (3-корон: ${st.threeCrownWins})</strong></div>
        <div class="stat-box"><span>🔥 Серія перемог</span><strong>${st.streak} (Рекорд: ${st.bestStreak})</strong></div>
        <div class="stat-box"><span>💼 Відкрито кейсів</span><strong>${st.chestsOpened || 0}</strong></div>
        <div class="stat-box"><span>📜 Сюжет пройдено</span><strong>${storyCount} / ${STORY_CHAPTERS.length} глав</strong></div>
      </div>
      ${favCard ? `
        <div class="mini-tower-pill" style="margin-bottom:10px">
          <div class="mini-portrait">${portraitSVG(favCard.id)}</div>
          <div>
            <div class="mini-label">Улюблена карта (зіграно: ${fav.count})</div>
            <div class="mini-name">${favCard.name} (Рів. ${Save.level(favCard.id)})</div>
          </div>
        </div>
      ` : ''}
      <div class="stat-box" style="margin-bottom:12px">
        <span>🤖 Баланс сили Бота</span>
        <div style="font-size:11.5px; color:#cbd5e1; margin-top:3px; line-height:1.35">
          Рівень карт бота автоматично підлаштовується під середній рівень вашої колоди (${Save.avgDeckLevel().toFixed(1)}), а складність тактики плавно зростає разом із вашими кубками.
        </div>
      </div>
      <div style="font-size:12px; font-weight:800; color:#fde047; margin-bottom:6px">📜 Останні бої (Історія):</div>
      <div class="battle-log-list" style="max-height:200px">
        ${(d.battleLog && d.battleLog.length) ? d.battleLog.map(b => {
          const cls = b.winner === 'P' ? 'win' : b.winner === 'E' ? 'lose' : 'draw';
          const lbl = b.winner === 'P' ? 'ПЕРЕМОГА' : b.winner === 'E' ? 'ПОРАЗКА' : 'НІЧИЯ';
          const dTxt = b.delta ? (b.delta > 0 ? `+${b.delta}🏆` : `${b.delta}🏆`) : '0🏆';
          return `<div class="blog-row ${cls}">
            <div>
              <strong>${lbl} (${b.crownsP}:${b.crownsE} 👑)</strong>
              <div style="font-size:10.5px; color:#9ca3af">vs ${b.botName || 'Бот'} • ${b.date || ''}</div>
            </div>
            <span style="font-weight:800; color:${b.delta > 0 ? '#22c55e' : b.delta < 0 ? '#ef4444' : '#9ca3af'}">${dTxt}</span>
          </div>`;
        }).join('') : '<div class="hint-text">Ще немає зіграних боїв</div>'}
      </div>
      <button class="btn-ghost" data-close-modal style="width:100%">Закрити</button>
    `;
    this.el.profileModal.classList.remove('hidden');
  }

  // ==================================================================
  //  МОДАЛКА НАЛАШТУВАНЬ (Кружок ⚙️ зверху) + АДМІН-ПАНЕЛЬ Itaminx
  // ==================================================================
  openSettingsModal() {
    const d = Save.data;
    const isFs = !!document.fullscreenElement;
    this.el.settingsModalBody.innerHTML = `
      <div class="modal-title">
        <h3>⚙️ Налаштування</h3>
        <button class="btn-ghost-sm" data-close-modal>✕</button>
      </div>
      <div class="settings-row">
        <span>🔊 Звукові ефекти (SFX)</span>
        <button id="set-sfx" class="toggle-btn ${d.settings.sound ? '' : 'off'}">${d.settings.sound ? 'УВІМК' : 'ВИМК'}</button>
      </div>
      <div class="settings-row">
        <span>🎷 Фонова музика (Нуар-джаз)</span>
        <button id="set-music" class="toggle-btn ${d.settings.music ? '' : 'off'}">${d.settings.music ? 'УВІМК' : 'ВИМК'}</button>
      </div>
      <div class="settings-row">
        <span>⛶ Повноекранний режим</span>
        <button id="set-fs" class="toggle-btn ${isFs ? '' : 'off'}">${isFs ? 'АКТИВНИЙ' : 'УВІМКНУТИ'}</button>
      </div>
      <div class="settings-row">
        <span>📦 Версія гри: <strong>v${VERSION}</strong></span>
        <button id="set-check-update" class="toggle-btn" style="background:#2563eb">🔄 Перевірити</button>
      </div>
      <div class="settings-row">
        <span>📰 Що нового та новини міста</span>
        <button id="set-open-news" class="toggle-btn" style="background:#059669">Читати</button>
      </div>
      <div class="modal-actions" style="margin-top:12px">
        ${d.isAdmin ? `<button id="btn-open-admin" class="btn-gold">👑 Адмін-панель (Itaminx)</button>` : ''}
        <button id="btn-logout" class="btn-secondary">🚪 Вийти з акаунту (${d.username})</button>
        <button id="btn-reset-acc" class="btn-danger">🗑 Скинути прогрес цього профілю</button>
        <button class="btn-ghost" data-close-modal>Закрити</button>
      </div>
    `;
    this.el.settingsModal.classList.remove('hidden');

    document.getElementById('set-sfx').addEventListener('click', () => {
      Audio.unlock();
      d.settings.sound = !d.settings.sound;
      Audio.setSfx(d.settings.sound);
      Save.save();
      Audio.play('click');
      this.openSettingsModal();
    });

    document.getElementById('set-music').addEventListener('click', () => {
      Audio.unlock();
      d.settings.music = !d.settings.music;
      Audio.setMusic(d.settings.music, 68);
      Save.save();
      Audio.play('click');
      this.openSettingsModal();
    });

    document.getElementById('set-fs').addEventListener('click', () => {
      this._toggleFullscreen();
      setTimeout(() => this.openSettingsModal(), 250);
    });

    document.getElementById('set-check-update').addEventListener('click', () => {
      Audio.play('click');
      this.el.settingsModal.classList.add('hidden');
      this.checkForUpdates(true);
    });

    const openNewsBtn = document.getElementById('set-open-news');
    if (openNewsBtn) {
      openNewsBtn.addEventListener('click', () => {
        Audio.play('click');
        this.el.settingsModal.classList.add('hidden');
        this.openNewsModal();
      });
    }

    const admBtn = document.getElementById('btn-open-admin');
    if (admBtn) {
      admBtn.addEventListener('click', () => {
        Audio.play('select');
        this.el.settingsModal.classList.add('hidden');
        this.openAdminModal();
      });
    }

    document.getElementById('btn-logout').addEventListener('click', () => {
      Audio.play('click');
      this.el.settingsModal.classList.add('hidden');
      Save.logout();
      this.showAuthScreen();
    });

    document.getElementById('btn-reset-acc').addEventListener('click', () => {
      if (confirm(`Скинути весь прогрес профілю ${d.username}?`)) {
        Save.reset();
        this.el.settingsModal.classList.add('hidden');
        this.refreshAll();
      }
    });
  }

  openAdminModal() {
    if (!Save.data.isAdmin) return;
    this.el.adminModalBody.innerHTML = `
      <div class="modal-title">
        <h3>👑 Адмін-панель (Itaminx)</h3>
        <button class="btn-ghost-sm" data-close-modal>✕</button>
      </div>
      <p class="modal-desc">Режим тестування: безкоштовний доступ до всіх ресурсів, карт, арен та кейсів.</p>
      <div class="modal-actions">
        <button id="adm-grant-all" class="btn-gold">💎 Отримати все (+50 000 🪙 та +100 усіх карт)</button>
        <button id="adm-max-cards" class="btn-primary">⬆️ Прокачати всі ${CARDS.length} карт до 6 рівня</button>
        <button id="adm-unlock-story" class="btn-secondary">📜 Відкрити всі ${STORY_CHAPTERS.length} глав Сюжету</button>
        <div class="settings-row" style="margin-top:4px; flex-wrap:wrap; gap:6px">
          <span>🏆 Швидко виставити кубки:</span>
          <div style="display:flex; gap:4px; flex-wrap:wrap">
            ${[0, 100, 250, 450, 750].map(t => `<button class="btn-ghost-sm" data-adm-t="${t}">${t}</button>`).join('')}
          </div>
        </div>
        <div class="settings-row" style="flex-wrap:wrap; gap:6px">
          <span>💼 Тест кейсів (безкоштовно):</span>
          <div style="display:flex; gap:4px; flex-wrap:wrap">
            ${CHESTS.map(ch => `<button class="btn-ghost-sm" data-adm-chest="${ch.id}">${ch.name}</button>`).join('')}
          </div>
        </div>
        <button class="btn-ghost" data-close-modal>Закрити</button>
      </div>
    `;
    this.el.adminModal.classList.remove('hidden');

    document.getElementById('adm-grant-all').addEventListener('click', () => {
      Save.adminGrantAll();
      Audio.play('victory');
      this.refreshAll();
      this.showToast('Нараховано +50 000 🪙 та по +100 копій кожної карти!', '💎');
    });

    document.getElementById('adm-max-cards').addEventListener('click', () => {
      Save.adminMaxAllCards();
      Audio.play('crown');
      this.refreshAll();
      this.showToast('Усі карти прокачано до 6 рівня!', '⬆️');
    });

    document.getElementById('adm-unlock-story').addEventListener('click', () => {
      for (const ch of STORY_CHAPTERS) Save.data.storyDone[ch.id] = true;
      Save.save();
      Audio.play('select');
      this.showToast(`Усі ${STORY_CHAPTERS.length} глав Сюжету відкрито!`, '📜');
    });

    this.el.adminModalBody.querySelectorAll('[data-adm-t]').forEach(btn => {
      btn.addEventListener('click', () => {
        Save.adminSetTrophies(+btn.dataset.admT);
        Audio.play('coin');
        this.refreshAll();
      });
    });

    this.el.adminModalBody.querySelectorAll('[data-adm-chest]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ch = CHESTS.find(c => c.id === btn.dataset.admChest);
        this.el.adminModal.classList.add('hidden');
        if (ch) this.openChestSequence(ch);
      });
    });
  }

  _toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  }

  // ==================================================================
  //  СИСТЕМА АВТООНОВЛЕННЯ З ПРОГРЕС-БАРОМ (0% -> 100% -> Перезапуск)
  // ==================================================================
  async checkForUpdates(manual = false) {
    if (this._updating || this.game) return;
    if (!navigator.onLine) {
      if (manual) this.showToast('Офлайн-режим (v' + VERSION + '). Перевірте інтернет.', '📡');
      return;
    }
    try {
      const resp = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!resp.ok) {
        if (manual) this.showToast('Не вдалося перевірити оновлення.', '⚠️');
        return;
      }
      const info = await resp.json();
      if (!info || !info.version) return;

      if (info.version === VERSION) {
        if (manual) {
          this.openWhatsNewModal(VERSION);
        }
        return;
      }

      // Знайдено нову версію! Показуємо прогрес-бар і завантажуємо всі свіжі файли в кеш
      this._updating = true;
      const overlay = document.getElementById('update-overlay');
      const title = document.getElementById('update-title');
      const notes = document.getElementById('update-notes');
      const fill = document.getElementById('update-bar-fill');
      const status = document.getElementById('update-status');

      title.textContent = `Оновлення до v${info.version}`;
      notes.textContent = info.notes || 'Завантаження нових файлів гри...';
      fill.style.width = '5%';
      status.textContent = 'Підключення... 5%';
      overlay.classList.remove('hidden');

      const files = [
        './index.html', './style.css', './manifest.json', './version.json',
        './js/data.js', './js/storage.js', './js/audio.js', './js/portraits.js',
        './js/game.js', './js/ai.js', './js/renderer.js', './js/ui.js',
        './icons/icon-192.png', './icons/icon-512.png',
      ];

      // Очищаємо старий кеш і примусово качаємо кожен файл із реальним прогресом
      let cache = null;
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        cache = await caches.open(`mafia-royale-v${info.version}`);
      }

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const pct = Math.round(((i + 1) / files.length) * 95);
        status.textContent = `Завантаження (${i + 1}/${files.length})... ${pct}%`;
        fill.style.width = `${pct}%`;
        try {
          const r = await fetch(`${f}?v=${info.version}&t=${Date.now()}`, { cache: 'reload' });
          if (r && r.ok && cache) await cache.put(f, r.clone());
        } catch (e) {}
      }

      if (window._mrSwReg) {
        try { await window._mrSwReg.update(); } catch (e) {}
      }

      fill.style.width = '100%';
      status.textContent = 'Готово! Перезапуск гри... 100%';
      setTimeout(() => {
        window.location.reload();
      }, 650);
    } catch (e) {
      this._updating = false;
      if (manual) this.showToast('Помилка перевірки оновлень.', '⚠️');
    }
  }

  // ==================================================================
  //  ВІКНО «ЩО НОВОГО В ОНОВЛЕННІ» ТА КРИМІНАЛЬНА ХРОНІКА (НОВИНИ)
  // ==================================================================
  openWhatsNewModal(version = VERSION) {
    const news = GAME_NEWS.find(n => n.version === version) || GAME_NEWS[0];
    this.el.whatsNewModalBody.innerHTML = `
      <div class="modal-title">
        <div class="wn-badge-row">
          <span class="wn-badge">${news.badge || 'ОНОВЛЕННЯ'}</span>
          <span class="wn-version-tag">Версія v${news.version}</span>
          <span class="wn-date">${news.date}</span>
        </div>
        <button class="btn-ghost-sm" data-close-modal>✕</button>
      </div>
      <div class="wn-hero">
        <div class="wn-hero-icon">${news.bannerEmoji || '🗞️'}</div>
        <h2 class="wn-hero-title">${news.title}</h2>
        <p class="wn-hero-summary">${news.summary}</p>
      </div>
      <div class="wn-changes-box">
        <div class="wn-changes-header">⚡ Що було змінено та доопрацьовано:</div>
        <ul class="wn-changes-list">
          ${news.changes.map(ch => `<li><span class="wn-check">✔</span><span class="wn-text">${ch}</span></li>`).join('')}
        </ul>
      </div>
      <div class="modal-actions wn-actions">
        <button id="btn-wn-confirm" class="btn-battle-big wn-confirm-btn">
          <span class="btn-battle-main">⚔️ ЗРОЗУМІЛО — ДО ГРИ!</span>
        </button>
        <button id="btn-wn-read-all" class="btn-secondary">
          📰 Всі випуски новин міста
        </button>
      </div>
    `;
    this.el.whatsNewModal.classList.remove('hidden');
    Audio.play('crown');

    const confirmBtn = document.getElementById('btn-wn-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        Audio.play('select');
        Save.markVersionSeen(VERSION);
        this.el.whatsNewModal.classList.add('hidden');
        this.renderTopBar();
      });
    }

    const readAllBtn = document.getElementById('btn-wn-read-all');
    if (readAllBtn) {
      readAllBtn.addEventListener('click', () => {
        Audio.play('click');
        Save.markVersionSeen(VERSION);
        this.el.whatsNewModal.classList.add('hidden');
        this.openNewsModal();
      });
    }
  }

  openNewsModal() {
    this.el.newsModalBody.innerHTML = `
      <div class="modal-title">
        <h3>📰 Кримінальна хроніка та новини</h3>
        <button class="btn-ghost-sm" data-close-modal>✕</button>
      </div>
      <p class="modal-desc">Оперативні зведення, патч-ноути оновлень та плани розширення Mafia Royale.</p>

      <div class="news-list-container">
        ${GAME_NEWS.map(n => `
          <article class="news-card ${n.version === VERSION ? 'current-release' : ''}">
            <div class="news-card-header">
              <span class="news-badge" style="background:${n.badgeColor || '#3B82F6'}">${n.badge}</span>
              <span class="news-tag">Версія v${n.version}</span>
              <span class="news-date">${n.date}</span>
            </div>
            <h4 class="news-card-title">${n.bannerEmoji || '🗞️'} ${n.title}</h4>
            <p class="news-card-summary">${n.summary}</p>
            <div class="news-card-details">
              <div class="news-details-title">⚡ Що нового:</div>
              <ul class="news-details-list">
                ${n.changes.map(c => `<li>${c}</li>`).join('')}
              </ul>
            </div>
          </article>
        `).join('')}
      </div>

      <div class="modal-actions" style="margin-top:14px">
        <button class="btn-primary" data-close-modal>Зрозуміло</button>
      </div>
    `;
    this.el.newsModal.classList.remove('hidden');
    Save.markVersionSeen(VERSION);
    this.renderTopBar();
  }

  // ==================================================================
  //  ВКЛАДКА 2: КОЛОДА, ВЕЖІ ТА КОЛЕКЦІЯ (18 / 150)
  // ==================================================================
  renderDeckTab() {
    const d = Save.data;

    this.el.towerGrid.innerHTML = TOWERS.map(t => {
      const sel = d.tower === t.id;
      return `
        <div class="tower-card ${sel ? 'selected' : ''}" data-tower-id="${t.id}">
          <div class="tower-art">${portraitSVG(t.id)}</div>
          <div class="tower-body">
            <div class="tower-name">${t.name}</div>
            <div class="tower-stats">
              <span>👑 HP ${t.kingHp} / ⚔️ ${t.kingDmg}</span>
              <span>🗼 HP ${t.princessHp} / ⚔️ ${t.princessDmg}</span>
              <span>⏱ ${t.atkSpeed}с • 🎯 ${t.range}</span>
            </div>
            <div class="tower-desc">${t.desc}</div>
          </div>
          <div class="tower-check">${sel ? '✔ ОБРАНО' : 'ОБРАТИ'}</div>
        </div>
      `;
    }).join('');

    this.el.towerGrid.querySelectorAll('.tower-card').forEach(el => {
      el.addEventListener('click', () => {
        Audio.unlock();
        Audio.play('select');
        Save.data.tower = el.dataset.towerId;
        Save.save();
        this.renderDeckTab();
        this.renderBattleTab();
      });
    });

    // Перемикач 5 слотів колод
    document.querySelectorAll('.btn-deck-slot').forEach(btn => {
      const s = +btn.dataset.deckSlot;
      btn.classList.toggle('active', s === d.deckSlot);
      btn.onclick = () => {
        Audio.unlock();
        Audio.play('click');
        Save.selectDeckSlot(s);
        this.swapCardId = null;
    this.deckFilters = { rarity: 'all', kind: 'all', sort: 'arena' };
        this.refreshAll();
      };
    });

    const clearBtn = document.getElementById('btn-clear-deck');
    if (clearBtn) {
      clearBtn.onclick = () => {
        Audio.unlock();
        Audio.play('click');
        Save.clearCurrentDeck();
        this.swapCardId = null;
    this.deckFilters = { rarity: 'all', kind: 'all', sort: 'arena' };
        this.refreshAll();
      };
    }

    if (this.swapCardId) {
      const c = CARD_MAP[this.swapCardId];
      this.el.swapBanner.classList.remove('hidden');
      this.el.swapBannerName.textContent = c ? c.name : '';
    } else {
      this.el.swapBanner.classList.add('hidden');
    }

    const avg = d.deck.length > 0
      ? (d.deck.reduce((s, id) => s + (CARD_MAP[id] ? CARD_MAP[id].cost : 0), 0) / d.deck.length).toFixed(1)
      : '0.0';
    this.el.avgCost.textContent = `${avg}$`;
    const countEl = document.getElementById('deck-card-count');
    if (countEl) countEl.textContent = d.deck.length;
    this.el.collectionCount.textContent = CARDS.length;

    const deckTiles = d.deck.map((id, idx) => this._renderCardTile(id, { inDeck: true, slotIdx: idx }));
    for (let i = d.deck.length; i < 8; i++) {
      deckTiles.push(`
        <div class="card-tile empty-slot" data-empty-slot="${i}">
          <div class="empty-slot-plus">＋</div>
          <div class="empty-slot-text">Слот ${i + 1}</div>
          <div class="empty-slot-sub">Вільне місце</div>
        </div>
      `);
    }
    this.el.deckSlots.innerHTML = deckTiles.join('');

    // Фільтри та сортування колекції карт (за рівнем, рідкістю, типом, ціною)
    const fRar = document.getElementById('filter-rarity');
    const fKind = document.getElementById('filter-kind');
    const fSort = document.getElementById('filter-sort');
    if (fRar && !fRar.dataset.bound) {
      fRar.dataset.bound = '1';
      fRar.value = this.deckFilters.rarity;
      fRar.onchange = () => { this.deckFilters.rarity = fRar.value; Audio.play('click'); this.renderDeckTab(); };
    }
    if (fKind && !fKind.dataset.bound) {
      fKind.dataset.bound = '1';
      fKind.value = this.deckFilters.kind;
      fKind.onchange = () => { this.deckFilters.kind = fKind.value; Audio.play('click'); this.renderDeckTab(); };
    }
    if (fSort && !fSort.dataset.bound) {
      fSort.dataset.bound = '1';
      fSort.value = this.deckFilters.sort;
      fSort.onchange = () => { this.deckFilters.sort = fSort.value; Audio.play('click'); this.renderDeckTab(); };
    }

    const rarOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
    let rest = CARDS.filter(c => !d.deck.includes(c.id));
    if (this.deckFilters.rarity !== 'all') rest = rest.filter(c => c.rarity === this.deckFilters.rarity);
    if (this.deckFilters.kind !== 'all') rest = rest.filter(c => c.kind === this.deckFilters.kind);
    rest.sort((a, b) => {
      const s = this.deckFilters.sort;
      if (s === 'level') return (Save.getCardState(b.id).level - Save.getCardState(a.id).level) || (a.cost - b.cost);
      if (s === 'cost_asc') return (a.cost - b.cost) || (a.unlockArena - b.unlockArena);
      if (s === 'cost_desc') return (b.cost - a.cost) || (a.unlockArena - b.unlockArena);
      if (s === 'rarity') return (rarOrder[b.rarity] - rarOrder[a.rarity]) || (a.cost - b.cost);
      return (a.unlockArena - b.unlockArena) || (a.cost - b.cost);
    });
    this.el.collectionGrid.innerHTML = rest.length
      ? rest.map(c => this._renderCardTile(c.id, { inDeck: false })).join('')
      : `<div class="hint-text" style="grid-column:1/-1;text-align:center;padding:18px;">Немає карт за обраним фільтром</div>`;

    // Місце під розширення до 150 карт за аренами (по 30 слотів на арену)
    this.el.collectionRoadmap.innerHTML = `
      <div style="font-size:12px; font-weight:800; color:#fde047">📦 Слоти під розширення колекції (${CARDS.length} / ${CARD_CAPACITY_TOTAL} карт)</div>
      ${ARENAS.map(ar => {
        const cnt = CARDS.filter(c => c.unlockArena === ar.num).length;
        return `<div class="roadmap-row">
          <span><strong>Арена ${ar.num}:</strong> ${ar.name}</span>
          <span style="color:#93c5fd">${cnt} / ${CARD_CAPACITY_PER_ARENA} слотів (+${CARD_CAPACITY_PER_ARENA - cnt} вільних)</span>
        </div>`;
      }).join('')}
    `;

    const bindTile = el => {
      const id = el.dataset.cardId;
      const inDeck = el.dataset.inDeck === 'true';
      el.addEventListener('click', e => {
        Audio.unlock();
        if (e.target.closest('[data-action="upgrade"]')) {
          e.stopPropagation();
          this._tryUpgrade(id);
          return;
        }
        if (this.swapCardId && inDeck) {
          const idx = +el.dataset.slotIdx;
          Save.data.deck[idx] = this.swapCardId;
          Save.save();
          this.swapCardId = null;
    this.deckFilters = { rarity: 'all', kind: 'all', sort: 'arena' };
          Audio.play('select');
          this.refreshAll();
          return;
        }
        Audio.play('click');
        this.openCardModal(id);
      });
    };
    this.el.deckSlots.querySelectorAll('.card-tile').forEach(bindTile);
    this.el.collectionGrid.querySelectorAll('.card-tile').forEach(bindTile);
  }

  _renderCardTile(id, { inDeck, slotIdx = -1 }) {
    const c = CARD_MAP[id];
    const st = Save.data.cards[id];
    const up = Save.upgradeInfo(id);
    const rar = RARITY[c.rarity];
    const progTxt = up.max ? 'МАКС' : `${st.count}/${up.cards}`;
    const progPct = up.max ? 100 : Math.min(100, Math.round((st.count / up.cards) * 100));
    const swapTarget = this.swapCardId && inDeck;

    return `
      <div class="card-tile rarity-${c.rarity} ${swapTarget ? 'swap-pulse' : ''}"
           data-card-id="${id}" data-in-deck="${inDeck}" data-slot-idx="${slotIdx}">
        <div class="card-cost">${c.cost}$</div>
        <div class="card-level">Рів. ${st.level}</div>
        <div class="card-art">${portraitSVG(id)}</div>
        <div class="card-name">${c.name}</div>
        <div class="card-role" style="color:${rar.color === '#4B5563' ? '#9ca3af' : '#c4b5fd'}">А${c.unlockArena} • ${c.role}</div>
        <div class="card-prog">
          <div class="card-prog-fill ${up.canAfford ? 'ready' : ''}" style="width:${progPct}%"></div>
          <span class="card-prog-text">${progTxt}</span>
        </div>
        ${up.canAfford ? `<button class="btn-card-up" data-action="upgrade">⬆ ${up.gold}🪙</button>` : ''}
      </div>
    `;
  }

  _tryUpgrade(id) {
    if (Save.upgrade(id)) {
      Audio.play('coin');
      Audio.play('crown');
      this.refreshAll();
      if (!this.el.cardModal.classList.contains('hidden')) this.openCardModal(id);
    } else {
      Audio.play('error');
    }
  }

  openCardModal(id) {
    const c = CARD_MAP[id];
    if (!c) return;
    const st = Save.data.cards[id];
    const up = Save.upgradeInfo(id);
    const rar = RARITY[c.rarity];
    const inDeck = Save.data.deck.includes(id);

    const hp = statAtLevel(c.hp, st.level);
    const dmg = statAtLevel(c.dmg, st.level);
    const shield = statAtLevel(c.shield || 0, st.level);
    const nextHp = !up.max ? statAtLevel(c.hp, st.level + 1) : hp;
    const nextDmg = !up.max ? statAtLevel(c.dmg, st.level + 1) : dmg;

    this.el.cardModalBody.innerHTML = `
      <div class="modal-card-header rarity-${c.rarity}">
        <div class="modal-card-art">${portraitSVG(id)}</div>
        <div>
          <span class="rarity-pill" style="background:${rar.color}">${rar.name} • ${c.cost}$ • Арена ${c.unlockArena}</span>
          <h3>${c.name}</h3>
          <div class="modal-sub">Рівень ${st.level} / ${LEVEL_MAX} • ${c.role}</div>
        </div>
      </div>
      <p class="modal-desc">${c.desc}</p>
      <div class="modal-stats-grid">
        ${c.hp > 0 ? `<div class="stat-box"><span>❤️ Здоров'я</span><strong>${hp}${!up.max ? ` <em>(+${nextHp - hp})</em>` : ''}</strong></div>` : ''}
        ${c.shield > 0 ? `<div class="stat-box"><span>🛡 Щит</span><strong>${shield}</strong></div>` : ''}
        ${c.dmg > 0 ? `<div class="stat-box"><span>⚔️ Шкода</span><strong>${dmg}${!up.max ? ` <em>(+${nextDmg - dmg})</em>` : ''}</strong></div>` : ''}
        ${c.atkSpeed > 0 ? `<div class="stat-box"><span>⏱ Атака</span><strong>${c.atkSpeed} сек</strong></div>` : ''}
        ${c.speed > 0 ? `<div class="stat-box"><span>👟 Швидкість</span><strong>${c.speed} т/с</strong></div>` : ''}
        ${c.range > 0 && c.range < 50 ? `<div class="stat-box"><span>🎯 Дальність</span><strong>${c.range} тайли</strong></div>` : ''}
        ${c.splash > 0 ? `<div class="stat-box"><span>💥 Радіус</span><strong>${c.splash} тайли</strong></div>` : ''}
        ${c.count > 1 ? `<div class="stat-box"><span>👥 Кількість</span><strong>x${c.count}</strong></div>` : ''}
        <div class="stat-box"><span>🎯 Цілі</span><strong>${c.targets}</strong></div>
      </div>
      <div class="modal-actions">
        ${!up.max ? `
          <button class="btn-primary ${up.canAfford ? '' : 'disabled'}" id="modal-btn-upgrade">
            ⬆ Покращити до рів. ${up.next} (${st.count}/${up.cards} карт • ${up.gold} 🪙)
          </button>
        ` : `<div class="max-level-badge">✨ Максимальний 6 рівень досягнуто!</div>`}
        ${!inDeck ? `
          <button class="btn-secondary" id="modal-btn-use">
            🃏 ${Save.data.deck.length < 8 ? 'Взяти в колоду (+)' : 'Замінити карту в колоді'}
          </button>
        ` : `
          <button class="btn-danger" id="modal-btn-remove">
            ❌ Прибрати з цієї колоди
          </button>
        `}
        <button class="btn-ghost" data-close-modal>Закрити</button>
      </div>
    `;

    this.el.cardModal.classList.remove('hidden');

    const upBtn = document.getElementById('modal-btn-upgrade');
    if (upBtn) upBtn.addEventListener('click', () => this._tryUpgrade(id));
    const useBtn = document.getElementById('modal-btn-use');
    if (useBtn) {
      useBtn.addEventListener('click', () => {
        if (Save.data.deck.length < 8) {
          Save.addCardToDeck(id);
          Audio.unlock();
          Audio.play('select');
          this.el.cardModal.classList.add('hidden');
          this.refreshAll();
        } else {
          this.swapCardId = id;
          this.el.cardModal.classList.add('hidden');
          this.switchTab('deck');
        }
      });
    }
    const remBtn = document.getElementById('modal-btn-remove');
    if (remBtn) {
      remBtn.addEventListener('click', () => {
        Save.removeCardFromDeck(id);
        Audio.unlock();
        Audio.play('click');
        this.el.cardModal.classList.add('hidden');
        this.refreshAll();
      });
    }
  }

  // ==================================================================
  //  ВКЛАДКА 3: РИНОК (Акції дня + Кейси ТІЛЬКИ за монети)
  // ==================================================================
  renderShopTab() {
    const d = Save.data;
    const deals = (d.dailyDeals && d.dailyDeals.items) || [];

    this.el.dailyDealsGrid.innerHTML = deals.map(dl => {
      const c = CARD_MAP[dl.cardId];
      if (!c) return '';
      const canBuy = !dl.bought && d.gold >= dl.price;
      return `
        <div class="deal-card rarity-${c.rarity} ${dl.bought ? 'bought' : ''}">
          <span class="deal-badge">${dl.discount}</span>
          <div class="deal-art">${portraitSVG(c.id)}</div>
          <div class="deal-title">${c.name} ×${dl.count}</div>
          <div class="deal-price-row">
            <span class="deal-old">${dl.oldPrice}🪙</span>
            <strong style="color:#fde047">${dl.price} 🪙</strong>
          </div>
          <button class="btn-primary ${canBuy ? '' : 'disabled'}" data-buy-deal="${dl.id}" style="width:100%; padding:6px">
            ${dl.bought ? '✔ Куплено' : `Купити (${dl.price} 🪙)`}
          </button>
        </div>
      `;
    }).join('');

    this.el.dailyDealsGrid.querySelectorAll('[data-buy-deal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dl = deals.find(x => x.id === btn.dataset.buyDeal);
        if (!dl || dl.bought) return;
        if (d.gold < dl.price) {
          Audio.play('error');
          this.showToast('Недостатньо монет! Заробляйте монети в боях.', '🪙');
          return;
        }
        d.gold -= dl.price;
        d.cards[dl.cardId].count += dl.count;
        dl.bought = true;
        Save.save();
        Audio.play('coin');
        Audio.play('reveal', { rarity: CARD_MAP[dl.cardId].rarity });
        this.refreshAll();
      });
    });

    const icons = { chest_envelope: '✉️', chest_safe: '🗄️', chest_briefcase: '💼' };
    this.el.chestGrid.innerHTML = CHESTS.map(ch => {
      const canBuy = d.gold >= ch.price;
      return `
        <div class="chest-card">
          <div class="chest-visual" style="background:radial-gradient(circle, ${ch.color}, #111827)">
            <span class="chest-emoji">${icons[ch.id] || '📦'}</span>
            <span class="chest-chance">У бою: ${Math.round(ch.chance * 100)}%</span>
          </div>
          <div class="chest-info">
            <h4>${ch.name}</h4>
            <p>${ch.desc}</p>
            <ul class="chest-loot-list">
              <li>🪙 Золото: <strong>${ch.goldMin}–${ch.goldMax}</strong></li>
              <li>🃏 Карт: <strong>${ch.cards}</strong></li>
              ${ch.rare ? `<li>💙 Рідкісних: <strong>${ch.rare}</strong></li>` : ''}
              ${ch.epic ? `<li>💜 Епічних: <strong>${ch.epic}</strong></li>` : ''}
              ${ch.legendaryChance ? `<li>🧡 Легендарна: <strong>${Math.round(ch.legendaryChance * 100)}%</strong></li>` : ''}
            </ul>
            <button class="btn-gold ${canBuy ? '' : 'disabled'}" data-buy-chest="${ch.id}" style="margin-top:4px">
              🪙 Купити за ${ch.price} монет
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.el.chestGrid.querySelectorAll('[data-buy-chest]').forEach(btn => {
      btn.addEventListener('click', () => {
        Audio.unlock();
        const ch = CHESTS.find(c => c.id === btn.dataset.buyChest);
        if (!ch) return;
        if (Save.data.gold < ch.price) {
          Audio.play('error');
          this.showToast(`Недостатньо монет! Потрібно ${ch.price} 🪙.`, '🪙');
          return;
        }
        Save.data.gold -= ch.price;
        Save.save();
        this.openChestSequence(ch);
      });
    });
  }

  openChestSequence(chest) {
    const reward = generateChest(chest);
    applyChest(reward);
    this.refreshAll();

    const icons = { chest_envelope: '✉️', chest_safe: '🗄️', chest_briefcase: '💼' };
    this.el.chestModal.classList.remove('hidden');

    this.el.chestModalBody.innerHTML = `
      <div class="chest-stage">
        <div class="chest-shake-box" id="chest-anim-box">
          <div class="chest-big-icon">${icons[chest.id] || '💼'}</div>
          <div class="chest-title">${chest.name}</div>
          <div class="chest-hint">Натисніть, щоб розкрити здобич!</div>
        </div>
      </div>
    `;
    Audio.play('chest');

    const showLoot = () => {
      Audio.play('coin');
      reward.cards.forEach((it, idx) => {
        setTimeout(() => Audio.play('reveal', { rarity: it.rarity }), idx * 140);
      });

      this.el.chestModalBody.innerHTML = `
        <div class="chest-loot-result">
          <h3>${chest.name} відкрито!</h3>
          <div class="loot-gold-banner">🪙 +${reward.gold} Золота</div>
          <div class="loot-cards-grid">
            ${reward.cards.map((it, i) => {
              const c = CARD_MAP[it.id];
              const rar = RARITY[it.rarity];
              return `
                <div class="loot-card-item rarity-${it.rarity}" style="animation-delay:${i * 110}ms">
                  <div class="loot-card-count">x${it.count}</div>
                  <div class="loot-card-art">${portraitSVG(it.id)}</div>
                  <div class="loot-card-name">${c.name}</div>
                  <div class="loot-card-rar" style="color:${rar.color === '#4B5563' ? '#d1d5db' : '#fde047'}">${rar.name}</div>
                </div>
              `;
            }).join('')}
          </div>
          <button class="btn-primary" id="btn-close-chest">Забрати здобич</button>
        </div>
      `;
      document.getElementById('btn-close-chest').addEventListener('click', () => {
        Audio.play('click');
        this.el.chestModal.classList.add('hidden');
        this.refreshAll();
      });
    };

    const box = document.getElementById('chest-anim-box');
    let opened = false;
    const trigger = () => {
      if (opened) return;
      opened = true;
      box.classList.add('opening');
      setTimeout(showLoot, chest.id === 'chest_safe' ? 650 : 420);
    };
    box.addEventListener('click', trigger);
    setTimeout(trigger, 850);
  }

  // ==================================================================
  //  БІЙ НА CANVAS (Плавна висадка, радіус споруд, 4 фази економіки)
  // ==================================================================
  startBattle({ mode = 'ranked', chapter = null, isSabotage = false } = {}) {
    const d = Save.data;
    this.activeStoryChapter = chapter;
    this.activeStorySabotage = !!isSabotage;

    let arena = ARENAS.find(a => a.id === d.selectedArena) || arenaForTrophies(d.trophies);
    let playerDeck = [...d.deck];
    let playerTower = d.tower;
    let playerLevels = Save.levelsMap();
    let botDeck, botTower, botLevels, botDiff, botLabel;

    if (mode === 'story' && chapter) {
      arena = ARENAS.find(a => a.id === chapter.arenaId) || arena;
      const st = d.storyState[chapter.id] || { losses: 0, vendetta: false, sabotageDone: false };
      botDeck = [...chapter.deck];
      botTower = chapter.tower;
      const lv = isSabotage
        ? Math.max(1, chapter.botLevel - 1)
        : Math.max(1, chapter.botLevel - (st.sabotageDone ? 1 : 0));
      botLevels = {};
      for (const c of CARDS) botLevels[c.id] = lv;
      botDiff = isSabotage ? Math.max(0, chapter.num - 2) : Math.min(4, chapter.num - 1);
      botLabel = isSabotage ? `Диверсія: ${chapter.boss}` : `Бос: ${chapter.boss}`;
    } else if (mode === 'draft') {
      playerDeck = makeBotDeck();
      playerTower = TOWERS[Math.floor(Math.random() * TOWERS.length)].id;
      botDeck = makeBotDeck();
      botTower = TOWERS[Math.floor(Math.random() * TOWERS.length)].id;
      const eqLv = {};
      for (const c of CARDS) eqLv[c.id] = 3;
      playerLevels = eqLv;
      botLevels = eqLv;
      botDiff = 2;
      botLabel = 'Сліпий Контракт';
    } else {
      const arIdx = ARENAS.indexOf(arena);
      const m = computeBotMatchup(Save.avgDeckLevel(), d.trophies, arIdx, mode, d.stats.recentResults);
      botDeck = m.deck;
      botTower = m.tower;
      botLevels = m.levels;
      botDiff = m.difficulty;
      botLabel = m.name;
    }

    this.game = new Game({
      P: { deck: playerDeck, tower: playerTower, levels: playerLevels },
      E: { deck: botDeck, tower: botTower, levels: botLevels },
      arena,
      mode,
    });
    this.bot = new Bot(this.game, 'E', botDiff);

    this.el.menuScreen.classList.add('hidden');
    this.el.battleScreen.classList.remove('hidden');
    this.el.battleScreen.classList.remove('extra-time');
    this.el.resultModal.classList.add('hidden');

    if (!this.renderer) this.renderer = new Renderer(this.el.canvas);
    this.renderer.reset();
    this.renderer.resize();

    this.selectedHandIdx = null;
    this.inspectedEntityId = null;
    this.drag.active = false;
    this._lastHandKey = '';

    this.el.hudArenaName.textContent = arena.name;
    this.el.hudBotName.textContent = botLabel;
    this.el.cashTicks.innerHTML = Array.from({ length: 10 }, (_, i) => `<span class="cash-tick" data-idx="${i + 1}"></span>`).join('');

    Audio.startMusic(arena.bpm);

    this.lastTs = performance.now();
    if (this.raf) cancelAnimationFrame(this.raf);
    const loop = ts => {
      const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
      this.lastTs = ts;
      this._stepBattle(dt);
      if (this.game) this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  _stepBattle(dt) {
    const g = this.game;
    if (!g) return;

    if (!g.over) {
      this.bot.update(dt);
      g.update(dt);
    }

    const overEv = g.events.find(e => e.type === 'gameOver');
    this.renderer.consumeEvents(g);
    this.renderer.updateFX(g, dt);

    // Очищаємо інспекцію, якщо споруда знищена
    if (this.inspectedEntityId != null) {
      const ent = g.entities.find(e => e.id === this.inspectedEntityId && e.alive);
      if (!ent) this.inspectedEntityId = null;
    }

    let aim = null;
    if (this.drag.active && this.drag.cardId) {
      aim = { cardId: this.drag.cardId, x: this.drag.tileX, y: this.drag.tileY, inArena: this.drag.inArena };
    } else if (this.selectedHandIdx != null) {
      const cid = g.sides.P.hand[this.selectedHandIdx];
      if (cid) aim = { cardId: cid, x: this.drag.tileX, y: this.drag.tileY, inArena: this.drag.inArena };
    }

    this.renderer.render(g, aim, this.inspectedEntityId);
    this._updateBattleHUD(g);

    if (overEv) {
      this._onBattleFinished(overEv);
    }
  }

  _updateBattleHUD(g) {
    const left = Math.ceil(g.timeLeft());
    const mm = Math.floor(left / 60);
    const ss = String(left % 60).padStart(2, '0');
    this.el.hudTimer.textContent = `${mm}:${ss}`;
    this.el.hudTimer.classList.toggle('overtime', g.overtime && !g.extraTime);
    this.el.hudTimer.classList.toggle('extra-time', g.extraTime);
    this.el.battleScreen.classList.toggle('extra-time', g.extraTime);

    const mult = g.cashMult('P');
    const multTxt = Number.isInteger(mult) ? `x${mult}` : `x${mult.toFixed(2).replace(/0$/, '')}`;
    this.el.hudMult.textContent = multTxt;
    this.el.hudMult.className = 'hud-mult' + (mult >= 3 ? ' x3' : mult >= 2 ? ' x2' : '');

    this.el.hudCrownsP.textContent = g.sides.P.crowns;
    this.el.hudCrownsE.textContent = g.sides.E.crowns;

    const cash = g.sides.P.cash;
    const whole = Math.floor(cash);
    this.el.cashValue.textContent = `${whole}$`;
    this.el.cashFill.style.width = `${(cash / ECONOMY.maxCash) * 100}%`;

    const hand = g.sides.P.hand;
    const nextId = g.nextCard('P');
    const fakeOn = g.hasCounterfeit('P');
    const key = hand.join(',') + '|' + nextId + '|' + this.selectedHandIdx + '|' + fakeOn;
    if (key !== this._lastHandKey) {
      this._lastHandKey = key;
      this.el.handSlots.innerHTML = hand.map((cid, idx) => {
        const c = CARD_MAP[cid];
        const lv = g.sides.P.levels[cid] || 1;
        const sel = this.selectedHandIdx === idx;
        const effCost = g.cardCost('P', cid, idx);
        const isFake = fakeOn && idx === 0;
        return `
          <div class="battle-card rarity-${c.rarity} ${sel ? 'selected' : ''}" data-hand-idx="${idx}" data-card-id="${cid}">
            ${isFake ? '<span class="bcard-fake-badge">FAKE +1$</span>' : ''}
            <span class="bcard-cost">${effCost}$</span>
            <span class="bcard-lv">Р${lv}</span>
            <div class="bcard-art">${portraitSVG(cid)}</div>
            <div class="bcard-name">${c.name}</div>
          </div>
        `;
      }).join('');

      const nc = CARD_MAP[nextId];
      this.el.nextCardSlot.innerHTML = nc ? `
        <div class="next-label">ДАЛІ</div>
        <div class="next-art">${portraitSVG(nextId)}</div>
        <div class="next-cost">${nc.cost}$</div>
      ` : '';
    }

    this.el.handSlots.querySelectorAll('.battle-card').forEach(el => {
      const idx = +el.dataset.handIdx;
      const cid = el.dataset.cardId;
      const cost = g.cardCost('P', cid, idx);
      el.classList.toggle('unaffordable', cash < cost);
    });
  }

  _bindBattleEvents() {
    this.el.btnFullscreenBattle.addEventListener('click', () => {
      this._toggleFullscreen();
      setTimeout(() => this.renderer && this.renderer.resize(), 250);
    });

    this.el.btnSurrender.addEventListener('click', () => {
      if (!this.game || this.game.over) return;
      Audio.play('click');
      this.game._finish('E');
    });

    const emoteBtn = document.getElementById('btn-emote-toggle');
    const emotePicker = document.getElementById('emote-picker');
    if (emoteBtn && emotePicker) {
      emotePicker.innerHTML = EMOTES.map(em => `<button class="emote-btn" data-emote-id="${em.id}">${em.emoji}</button>`).join('');
      emoteBtn.addEventListener('click', () => {
        Audio.play('click');
        emotePicker.classList.toggle('hidden');
      });
      emotePicker.querySelectorAll('.emote-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const em = EMOTES.find(x => x.id === btn.dataset.emoteId);
          if (!em || !this.renderer) return;
          Audio.play('select');
          this.renderer.addEmote('P', em.emoji, em.text);
          emotePicker.classList.add('hidden');
          // Бот відповідає емодзі через 0.9 сек
          setTimeout(() => {
            if (!this.game || this.game.over || !this.renderer) return;
            const rep = EMOTES[Math.floor(Math.random() * EMOTES.length)];
            this.renderer.addEmote('E', rep.emoji, rep.text);
          }, 900);
        });
      });
    }

    // 1) Натискання на карту в руці — ДОЗВОЛЕНО навіть якщо не вистачає коштів!
    this.el.handSlots.addEventListener('pointerdown', e => {
      const cardEl = e.target.closest('.battle-card');
      if (!cardEl || !this.game || this.game.over) return;
      e.preventDefault();
      Audio.unlock();

      const idx = +cardEl.dataset.handIdx;
      const cid = this.game.sides.P.hand[idx];
      if (!CARD_MAP[cid]) return;

      this.inspectedEntityId = null;
      this.selectedHandIdx = idx;
      this._lastHandKey = '';
      Audio.play('select');

      this.drag.active = true;
      this.drag.fromArena = false;
      this.drag.handIdx = idx;
      this.drag.cardId = cid;
      this.drag.isTouch = e.pointerType === 'touch';
      this._updateDragPosition(e.clientX, e.clientY);

      this.el.dragGhost.innerHTML = portraitSVG(cid);
      this.el.dragGhost.classList.remove('hidden');
    });

    // 2) Натискання на арену:
    //    - Якщо обрана карта -> НЕ ставимо миттєво! Вмикаємо плавне прицілювання пальцем,
    //      щоб гравець міг провести по екрану і поставити тільки коли прибере палець (pointerup)!
    //    - Якщо карта НЕ обрана -> перевіряємо клік по будівлі/вежі, щоб показати її радіус атаки!
    this.el.canvas.addEventListener('pointerdown', e => {
      if (!this.game || this.game.over) return;
      e.preventDefault();
      Audio.unlock();

      if (this.selectedHandIdx != null) {
        const cid = this.game.sides.P.hand[this.selectedHandIdx];
        if (cid) {
          this.drag.active = true;
          this.drag.fromArena = true;
          this.drag.handIdx = this.selectedHandIdx;
          this.drag.cardId = cid;
          this.drag.isTouch = e.pointerType === 'touch';
          this._updateDragPosition(e.clientX, e.clientY);
          this.el.dragGhost.innerHTML = portraitSVG(cid);
          this.el.dragGhost.classList.remove('hidden');
        }
        return;
      }

      // Інспекція будівель/веж: показ радіусу атаки при кліку
      const pt = this.renderer.toTile(e.clientX, e.clientY);
      let found = null;
      for (const ent of this.game.entities) {
        if (!ent.alive) continue;
        if (ent.kind === 'building' || ent.kind === 'tower') {
          const d = Math.hypot(ent.x - pt.x, ent.y - pt.y);
          if (d <= ent.r + 0.7) { found = ent; break; }
        }
      }
      if (found) {
        this.inspectedEntityId = (this.inspectedEntityId === found.id) ? null : found.id;
        Audio.play('click');
      } else {
        this.inspectedEntityId = null;
      }
    });

    // 3) Плавний рух пальця/миші по екрану
    window.addEventListener('pointermove', e => {
      if (!this.game || this.game.over) return;
      if (this.drag.active) {
        this._updateDragPosition(e.clientX, e.clientY);
      }
    });

    // 4) Відпускання пальця/миші -> акуратна висадка юніта в обрану точку
    window.addEventListener('pointerup', e => {
      if (!this.drag.active) return;
      this._updateDragPosition(e.clientX, e.clientY);
      this.el.dragGhost.classList.add('hidden');

      if (this.drag.inArena && this.game && !this.game.over) {
        const ok = this.game.playCard('P', this.drag.handIdx, this.drag.tileX, this.drag.tileY);
        if (ok) {
          this.selectedHandIdx = null;
          this._lastHandKey = '';
        } else {
          Audio.play('error');
        }
      }
      this.drag.active = false;
      this.drag.inArena = false;
    });
  }

  _updateDragPosition(clientX, clientY) {
    // На смартфоні зміщуємо точку прицілу трохи вище пальця (на 36px), щоб палець не затуляв юніта
    const aimY = this.drag.isTouch ? clientY - 36 : clientY;
    this.drag.clientX = clientX;
    this.drag.clientY = aimY;
    this.el.dragGhost.style.left = `${clientX}px`;
    this.el.dragGhost.style.top = `${aimY}px`;

    if (!this.renderer) return;
    const rect = this.el.canvas.getBoundingClientRect();
    const inside = clientX >= rect.left && clientX <= rect.right && aimY >= rect.top && aimY <= rect.bottom;
    this.drag.inArena = inside;
    if (inside) {
      const t = this.renderer.toTile(clientX, aimY);
      this.drag.tileX = t.x;
      this.drag.tileY = t.y;
    }
  }

  // ------------------------------------------------------------------
  //  Завершення бою: Статистика, Авторитет, Сюжетна нагорода, Кейс
  // ------------------------------------------------------------------
  _onBattleFinished(res) {
    Audio.stopMusic();
    const d = Save.data;
    const st = d.stats;
    const arena = this.game.arena;
    const mode = this.game.mode;

    st.battles++;
    st.crownsWon = (st.crownsWon || 0) + res.crownsP;
    st.crownsLost = (st.crownsLost || 0) + res.crownsE;
    for (const [cid, cnt] of Object.entries(res.playedP || {})) {
      st.cardsPlayed[cid] = (st.cardsPlayed[cid] || 0) + cnt;
    }

    let delta = 0;
    let bonusGold = 0;
    let title = 'НІЧИЯ';
    let badgeClass = 'draw';
    let wonChest = null;
    let storyNote = '';

    st.recentResults = Array.isArray(st.recentResults) ? st.recentResults : [];

    if (res.winner === 'P') {
      st.wins++;
      st.streak = (st.streak || 0) + 1;
      if (st.streak > (st.bestStreak || 0)) st.bestStreak = st.streak;
      if (res.crownsP >= 3) st.threeCrownWins = (st.threeCrownWins || 0) + 1;
      if (mode !== 'story') st.recentResults = [...st.recentResults, 'W'].slice(-6);

      title = 'ПЕРЕМОГА!';
      badgeClass = 'win';
      Audio.play('victory');

      if (mode === 'story' && this.activeStoryChapter) {
        const ch = this.activeStoryChapter;
        const cs = d.storyState[ch.id] || { losses: 0, vendetta: false, sabotageDone: false };
        if (this.activeStorySabotage) {
          cs.sabotageDone = true;
          d.storyState[ch.id] = cs;
          bonusGold = 40;
          d.gold += bonusGold;
          storyNote = `🕵️ Диверсія вдалася! Бос «${ch.boss}» ослаблений на -1 рівень для реваншу!`;
        } else {
          if (!d.storyDone[ch.id]) {
            d.storyDone[ch.id] = true;
            bonusGold = cs.vendetta ? Math.round(ch.rewardGold * 1.5) : ch.rewardGold;
            if (cs.vendetta) storyNote = '🔥 ВЕНДЕТА ЗДІЙСНЕНА! Отримано +50% золота за реванш!';
            cs.vendetta = false;
            d.storyState[ch.id] = cs;
            d.gold += bonusGold;
          } else {
            bonusGold = 25;
            d.gold += bonusGold;
          }
          wonChest = rollChestType();
        }
      } else if (mode === 'training') {
        bonusGold = 10;
        d.gold += bonusGold;
      } else {
        delta = arena.win;
        d.trophies += delta;
        if (d.trophies > (d.maxTrophies || 0)) d.maxTrophies = d.trophies;
        bonusGold = 25;
        d.gold += bonusGold;
        wonChest = rollChestType();
      }
    } else if (res.winner === 'E') {
      st.losses++;
      st.streak = 0;
      if (mode !== 'story' && mode !== 'training') st.recentResults = [...st.recentResults, 'L'].slice(-6);
      title = 'ПОРАЗКА';
      badgeClass = 'lose';
      Audio.play('defeat');
      if (mode === 'story' && this.activeStoryChapter && !this.activeStorySabotage) {
        const ch = this.activeStoryChapter;
        const cs = d.storyState[ch.id] || { losses: 0, vendetta: false, sabotageDone: false };
        cs.losses = (cs.losses || 0) + 1;
        cs.vendetta = true;
        d.storyState[ch.id] = cs;
        storyNote = `🔥 Активовано «Вендету» (+50% золота за реванш) і відкрито Диверсію: «${ch.sabotageTitle}»!`;
      } else if (mode !== 'story' && mode !== 'training') {
        delta = arena.lose;
        d.trophies = Math.max(0, d.trophies + delta);
      }
    } else {
      st.draws++;
      if (mode !== 'story' && mode !== 'training') st.recentResults = [...st.recentResults, 'D'].slice(-6);
    }

    if (mode !== 'training' && res.crownsP > 0) {
      addCrownChestProgress(res.crownsP);
    }
    const nowStr = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    recordBattleLog({
      date: nowStr,
      mode,
      winner: res.winner,
      crownsP: res.crownsP,
      crownsE: res.crownsE,
      delta,
      botName: this.el.hudBotName?.textContent || 'Бот',
    });

    if (d.autoArena) {
      d.selectedArena = arenaForTrophies(d.trophies).id;
    }
    Save.save();

    const sign = delta > 0 ? `+${delta}` : `${delta}`;
    this.el.resultModalBody.innerHTML = `
      <div class="result-box ${badgeClass}">
        <div class="result-banner">${title}</div>
        <div class="result-crowns">
          <div class="rc-side"><span>ВИ</span><strong>👑 ${res.crownsP}</strong></div>
          <div class="rc-vs">:</div>
          <div class="rc-side"><span>СУПЕРНИК</span><strong>👑 ${res.crownsE}</strong></div>
        </div>
        ${storyNote ? `<div class="modal-desc" style="color:#fde047; margin:0">${storyNote}</div>` : ''}
        ${mode !== 'story' ? `
          <div class="result-trophies">
            Авторитет: <strong>${sign} 🏆</strong> (Всього: ${d.trophies} 🏆)
          </div>
        ` : ''}
        ${bonusGold > 0 ? `<div class="loot-gold-banner">🪙 +${bonusGold} монет за бій</div>` : ''}
        ${wonChest ? `
          <div class="result-chest-offer">
            <p>Здобич за перемогу: <strong>${wonChest.name}</strong></p>
            <button class="btn-primary" id="btn-result-open-chest">💼 Відкрити кейс та вийти</button>
          </div>
        ` : ''}
        <button class="btn-secondary" id="btn-result-menu" style="width:100%">В головне меню</button>
      </div>
    `;
    this.el.resultModal.classList.remove('hidden');

    const exitToMenu = (chestToOpen = null) => {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
      this.game = null;
      this.activeStoryChapter = null;
    this.activeStorySabotage = false;
      this.el.resultModal.classList.add('hidden');
      this.el.battleScreen.classList.add('hidden');
      this.el.menuScreen.classList.remove('hidden');
      if (Save.data.settings.music) Audio.startMusic(68);
      this.refreshAll();
      if (chestToOpen) this.openChestSequence(chestToOpen);
    };

    document.getElementById('btn-result-menu').addEventListener('click', () => {
      Audio.play('click');
      exitToMenu(null);
    });
    const chBtn = document.getElementById('btn-result-open-chest');
    if (chBtn) {
      chBtn.addEventListener('click', () => {
        Audio.play('click');
        exitToMenu(wonChest);
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new AppUI();
  app.init();
  window.MafiaRoyaleApp = app;
});
