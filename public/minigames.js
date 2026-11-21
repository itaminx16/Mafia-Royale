(function () {
  let _socket = null;
  let _activeTab = 'runner';
  let _roomScores = {};
  let _globalRecords = {};

  let _runnerRaf = null;
  let _runnerRunning = false;
  let _jumpRaf = null;
  let _jumpRunning = false;
  let _whackTimer = null;
  let _whackSpawn = null;
  let _cannonRaf = null;
  let _cannonRunning = false;
  let _snakeTimer = null;
  let _snakeRunning = false;
  let _tetrisRaf = null;
  let _tetrisRunning = false;

  let _mgAudioCtx = null;

  function _getMgAudioCtx() {
    if (!_mgAudioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) _mgAudioCtx = new Ctx();
    }
    if (_mgAudioCtx && _mgAudioCtx.state === 'suspended') {
      _mgAudioCtx.resume().catch(() => {});
    }
    return _mgAudioCtx;
  }

  function _playToneAt(ctx, master, freqStart, freqEnd, type, delay, dur, gainPeak) {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freqStart, t0);
    if (freqEnd && freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
    }
    g.gain.setValueAtTime(Math.max(0.001, master * (gainPeak || 0.2)), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.01);
  }

  function mgSfx(kind) {
    try {
      if (localStorage.getItem('mafia_sound_enabled') === 'false') return;
      const rawVol = parseFloat(localStorage.getItem('mafia_sound_volume') || '0.7');
      const vol = Number.isFinite(rawVol) ? Math.max(0, Math.min(1, rawVol)) : 0.7;
      if (vol <= 0) return;
      const ctx = _getMgAudioCtx();
      if (!ctx) return;

      switch (kind) {
        case 'start':
          _playToneAt(ctx, vol, 440, 660, 'triangle', 0, 0.12, 0.22);
          _playToneAt(ctx, vol, 660, 880, 'triangle', 0.09, 0.14, 0.22);
          break;
        case 'jump':
          _playToneAt(ctx, vol, 260, 520, 'sine', 0, 0.11, 0.18);
          break;
        case 'spring':
          _playToneAt(ctx, vol, 320, 920, 'triangle', 0, 0.18, 0.22);
          _playToneAt(ctx, vol, 560, 1120, 'sine', 0.06, 0.14, 0.16);
          break;
        case 'crack':
          _playToneAt(ctx, vol, 210, 95, 'sawtooth', 0, 0.12, 0.18);
          break;
        case 'milestone':
          _playToneAt(ctx, vol, 523.25, 523.25, 'triangle', 0, 0.1, 0.2);
          _playToneAt(ctx, vol, 659.25, 659.25, 'triangle', 0.08, 0.1, 0.2);
          _playToneAt(ctx, vol, 783.99, 1046.5, 'triangle', 0.16, 0.2, 0.24);
          break;
        case 'flip':
          _playToneAt(ctx, vol, 480, 620, 'sine', 0, 0.07, 0.14);
          break;
        case 'match':
          _playToneAt(ctx, vol, 523.25, 659.25, 'triangle', 0, 0.12, 0.2);
          _playToneAt(ctx, vol, 783.99, 783.99, 'triangle', 0.08, 0.16, 0.22);
          break;
        case 'mismatch':
          _playToneAt(ctx, vol, 240, 175, 'sawtooth', 0, 0.14, 0.14);
          break;
        case 'hit':
          _playToneAt(ctx, vol, 540, 820, 'triangle', 0, 0.09, 0.18);
          break;
        case 'shoot':
          _playToneAt(ctx, vol, 680, 290, 'square', 0, 0.04, 0.06);
          break;
        case 'boom':
          _playToneAt(ctx, vol, 180, 55, 'sawtooth', 0, 0.2, 0.22);
          break;
        case 'penalty':
          _playToneAt(ctx, vol, 190, 110, 'square', 0, 0.18, 0.16);
          break;
        case 'win':
          _playToneAt(ctx, vol, 523.25, 523.25, 'triangle', 0, 0.12, 0.24);
          _playToneAt(ctx, vol, 659.25, 659.25, 'triangle', 0.1, 0.12, 0.24);
          _playToneAt(ctx, vol, 783.99, 783.99, 'triangle', 0.2, 0.14, 0.24);
          _playToneAt(ctx, vol, 1046.5, 1046.5, 'triangle', 0.32, 0.28, 0.26);
          break;
        case 'gameover':
          _playToneAt(ctx, vol, 340, 220, 'sawtooth', 0, 0.16, 0.2);
          _playToneAt(ctx, vol, 220, 120, 'sawtooth', 0.14, 0.26, 0.2);
          break;
        default:
          break;
      }
    } catch (e) {}
  }

  function _tr(key, fallback) {
    return typeof window.t === 'function' ? window.t(key, fallback) : fallback;
  }

  function _isEn() {
    return window.currentLang === 'en';
  }

  function _loc(ua, en) {
    return _isEn() ? en : ua;
  }

  function stopAllLoops() {
    if (_runnerRaf) { cancelAnimationFrame(_runnerRaf); _runnerRaf = null; }
    _runnerRunning = false;
    if (_jumpRaf) { cancelAnimationFrame(_jumpRaf); _jumpRaf = null; }
    _jumpRunning = false;
    if (_whackTimer) { clearInterval(_whackTimer); _whackTimer = null; }
    if (_whackSpawn) { clearTimeout(_whackSpawn); clearInterval(_whackSpawn); _whackSpawn = null; }
    if (_cannonRaf) { cancelAnimationFrame(_cannonRaf); _cannonRaf = null; }
    _cannonRunning = false;
    if (_snakeTimer) { clearTimeout(_snakeTimer); clearInterval(_snakeTimer); _snakeTimer = null; }
    _snakeRunning = false;
    if (_tetrisRaf) { cancelAnimationFrame(_tetrisRaf); _tetrisRaf = null; }
    _tetrisRunning = false;
  }

  function submitScore(game, score) {
    if (_socket && score > 0) {
      _socket.emit('submitMinigameScore', { game, score: Math.floor(score) });
    }
  }

  function renderLeaderboardBox(game) {
    const box = document.getElementById('mgLeaderboardBox');
    if (!box) return;
    const roomTop = (_roomScores && _roomScores[game]) || [];
    const globalTop = (_globalRecords && _globalRecords[game]) || [];

    const renderList = (arr, emptyTxt) => arr.length
      ? arr.slice(0, 5).map((x, idx) => `<div class="mg-lb-row"><span>${idx + 1}. <b>${x.nickname}</b></span><span style="color:#ffd166;">${x.score}</span></div>`).join('')
      : `<div style="color:#64748b; font-size:11px;">${emptyTxt}</div>`;

    box.innerHTML = `
      <div class="mg-lb-grid">
        <div class="mg-lb-col">
          <div class="mg-lb-title">🏠 ${_tr('mg_room_top', _loc('Топ кімнати', 'Room Top'))}</div>
          ${renderList(roomTop, _tr('mg_no_scores', _loc('Ще немає рекордів', 'No scores yet')))}
        </div>
        <div class="mg-lb-col">
          <div class="mg-lb-title">🌍 ${_tr('mg_global_top', _loc('Рекорди сервера', 'Server Records'))}</div>
          ${renderList(globalTop, _tr('mg_no_scores', _loc('Ще немає рекордів', 'No scores yet')))}
        </div>
      </div>`;
  }

  // === 1. НУАР-РАННЕР ===
  function mountRunner(stage) {
    stage.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:12px;">
        <span>🏃 <b id="mgRunnerScore">0</b> <span style="color:#8892b0;">(${_loc('Рекорд', 'Best')}: <b id="mgRunnerBest" style="color:#ffd166;">0</b>)</span></span>
        <button type="button" id="mgRunnerRestartBtn" class="secondary" style="width:auto; margin:0; padding:4px 10px; font-size:11px;">${_loc('▶ Старт / Рестарт', '▶ Start / Restart')}</button>
      </div>
      <canvas id="mgRunnerCanvas" width="340" height="160" class="mg-canvas"></canvas>
      <div style="font-size:11px; color:#8892b0; margin-top:4px; text-align:center;">${_loc('Торкнись поля або натисни <b>Пробіл / ↑</b>, щоб перестрибувати перешкоди!', 'Tap field or press <b>Space / ↑</b> to jump over obstacles!')}</div>
    `;

    const canvas = document.getElementById('mgRunnerCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('mgRunnerScore');
    const bestEl = document.getElementById('mgRunnerBest');
    let best = Number(localStorage.getItem('mafia_runner_best') || 0);
    bestEl.textContent = best;

    const groundY = 128;
    let player = { x: 42, y: groundY - 30, w: 22, h: 30, vy: 0, onGround: true };
    let obstacles = [];
    let speed = 3.2;
    let score = 0;
    let frame = 0;
    let tickAccum = 0;
    let lastTs = 0;
    let lastMilestone = 0;
    let gameOver = false;

    function resetGame() {
      stopAllLoops();
      player = { x: 42, y: groundY - 30, w: 22, h: 30, vy: 0, onGround: true };
      obstacles = [];
      speed = 3.2;
      score = 0;
      frame = 0;
      tickAccum = 0;
      lastTs = performance.now();
      lastMilestone = 0;
      gameOver = false;
      _runnerRunning = true;
      mgSfx('start');
      _runnerRaf = requestAnimationFrame(loop);
    }

    function jump() {
      if (gameOver || !_runnerRunning) {
        resetGame();
        return;
      }
      if (player.onGround) {
        player.vy = -8.6;
        player.onGround = false;
        mgSfx('jump');
      }
    }

    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
    document.getElementById('mgRunnerRestartBtn').onclick = resetGame;
    const keyHandler = (e) => {
      if (_activeTab !== 'runner') return;
      const modal = document.getElementById('lobbyMinigamesModal');
      if (!modal || !modal.classList.contains('open')) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.removeEventListener('keydown', window._mgRunnerKeyHandler);
    window._mgRunnerKeyHandler = keyHandler;
    window.addEventListener('keydown', keyHandler);

    function drawFrame() {
      ctx.fillStyle = '#0d111a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(290, 34, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#151c2c';
      for (let i = 0; i < 10; i++) {
        const bx = ((i * 44) - ((frame * 0.6) % 44));
        const bh = 28 + ((i * 17) % 38);
        ctx.fillRect(bx, groundY - bh, 32, bh);
      }

      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      ctx.fillStyle = '#f4a261';
      ctx.fillRect(player.x, player.y + 8, player.w, player.h - 8);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(player.x + 4, player.y + 2, 14, 10);
      ctx.fillStyle = '#111';
      ctx.fillRect(player.x + 1, player.y, 20, 4);
      ctx.fillRect(player.x + 4, player.y - 5, 14, 6);

      obstacles.forEach(ob => {
        ctx.fillStyle = ob.type === 'tall' ? '#e63946' : '#9b5de5';
        ctx.fillRect(ob.x, groundY - ob.h, ob.w, ob.h);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(ob.x + 3, groundY - ob.h + 3, ob.w - 6, 4);
      });

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`GAME OVER • ${Math.floor(score)} pts`, canvas.width / 2, 74);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '12px sans-serif';
        ctx.fillText(_loc('Торкнись або натисни Пробіл для нової спроби', 'Tap or press Space to try again'), canvas.width / 2, 98);
      } else if (!_runnerRunning) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#80ffdb';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(_loc('Натисни для старту забігу!', 'Tap or press Space to run!'), canvas.width / 2, 82);
      }
    }

    function loop(now) {
      if (!_runnerRunning) { drawFrame(); return; }
      const ts = now || performance.now();
      const dt = lastTs ? Math.min(2.0, Math.max(0.25, (ts - lastTs) / 16.6667)) : 1;
      lastTs = ts;

      frame += dt;
      tickAccum += dt;
      player.vy += 0.44 * dt;
      player.y += player.vy * dt;
      if (player.y >= groundY - player.h) {
        player.y = groundY - player.h;
        player.vy = 0;
        player.onGround = true;
      }

      const spawnEvery = Math.max(46, Math.floor(86 - speed * 4));
      if (tickAccum >= spawnEvery) {
        tickAccum = 0;
        const isTall = Math.random() > 0.62;
        obstacles.push({
          x: canvas.width + 10,
          w: isTall ? 18 : 22,
          h: isTall ? 32 : 20,
          type: isTall ? 'tall' : 'wide'
        });
      }

      obstacles.forEach(ob => { ob.x -= speed * dt; });
      obstacles = obstacles.filter(ob => ob.x + ob.w > -10);

      for (const ob of obstacles) {
        const hitX = player.x + 3 < ob.x + ob.w && player.x + player.w - 3 > ob.x;
        const hitY = player.y + player.h - 2 > groundY - ob.h;
        if (hitX && hitY) {
          gameOver = true;
          _runnerRunning = false;
          mgSfx('gameover');
          const finalPts = Math.floor(score);
          if (finalPts > best) {
            best = finalPts;
            localStorage.setItem('mafia_runner_best', String(best));
            bestEl.textContent = best;
          }
          submitScore('runner', finalPts);
          drawFrame();
          return;
        }
      }

      score += 0.22 * dt;
      const ms = Math.floor(score / 100);
      if (ms > lastMilestone) {
        lastMilestone = ms;
        mgSfx('milestone');
      }
      speed = Math.min(9.5, 3.2 + score * 0.0085);
      scoreEl.textContent = `${Math.floor(score)} (⚡x${(speed / 3.2).toFixed(1)})`;
      drawFrame();
      _runnerRaf = requestAnimationFrame(loop);
    }

    drawFrame();
  }

  // === 2. ПАМ'ЯТЬ РОЛЕЙ ===
  function mountMemory(stage) {
    const pairs = [
      { id: 'sheriff', img: '/roles_avatars/sheriff.png', label: _loc('Шериф', 'Sheriff') },
      { id: 'doctor', img: '/roles_avatars/doctor.png', label: _loc('Лікар', 'Doctor') },
      { id: 'godfather', img: '/roles_avatars/godfather.png', label: _loc('Дон', 'Don') },
      { id: 'mafioso', img: '/roles_avatars/mafioso.png', label: _loc('Мафія', 'Mafia') },
      { id: 'jester', img: '/roles_avatars/jester.png', label: _loc('Джокер', 'Jester') },
      { id: 'escort', img: '/roles_avatars/escort.png', label: _loc('Коханка', 'Escort') }
    ];
    let deck = [...pairs, ...pairs].sort(() => Math.random() - 0.5);
    let flipped = [];
    let matched = 0;
    let moves = 0;
    let locked = false;

    stage.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:12px;">
        <span>🃏 ${_loc('Ходів', 'Moves')}: <b id="mgMemMoves">0</b> • ${_loc('Знайдено', 'Found')}: <b id="mgMemMatched">0/6</b></span>
        <button type="button" id="mgMemResetBtn" class="secondary" style="width:auto; margin:0; padding:4px 10px; font-size:11px;">${_loc('🔄 Нова колода', '🔄 New Deck')}</button>
      </div>
      <div id="mgMemGrid" class="mg-memory-grid"></div>
      <div id="mgMemStatus" style="font-size:11px; color:#80ffdb; text-align:center; margin-top:6px;">${_loc('Відкрийте однакові портрети ролей за мінімум ходів!', 'Match all role portraits in as few moves as possible!')}</div>
    `;

    const grid = document.getElementById('mgMemGrid');
    deck.forEach((card, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mg-mem-card';
      btn.dataset.idx = idx;
      btn.innerHTML = `<span class="mg-mem-back">?</span><img src="${card.img}" alt="${card.label}" class="mg-mem-front" onerror="this.style.display='none'">`;
      btn.onclick = () => {
        if (locked || btn.classList.contains('flipped') || btn.classList.contains('matched')) return;
        btn.classList.add('flipped');
        mgSfx('flip');
        flipped.push({ btn, card });
        if (flipped.length === 2) {
          moves++;
          document.getElementById('mgMemMoves').textContent = moves;
          const [a, b] = flipped;
          if (a.card.id === b.card.id) {
            a.btn.classList.add('matched');
            b.btn.classList.add('matched');
            matched++;
            document.getElementById('mgMemMatched').textContent = `${matched}/6`;
            flipped = [];
            if (matched === 6) {
              mgSfx('win');
              const pts = Math.max(100, 1200 - moves * 45);
              document.getElementById('mgMemStatus').innerHTML = _loc(
                `🎉 Перемога за ${moves} ходів! Рахунок: <b style="color:#ffd166;">${pts}</b>`,
                `🎉 Won in ${moves} moves! Score: <b style="color:#ffd166;">${pts}</b>`
              );
              submitScore('memory', pts);
            } else {
              mgSfx('match');
            }
          } else {
            mgSfx('mismatch');
            locked = true;
            setTimeout(() => {
              a.btn.classList.remove('flipped');
              b.btn.classList.remove('flipped');
              flipped = [];
              locked = false;
            }, 650);
          }
        }
      };
      grid.appendChild(btn);
    });

    document.getElementById('mgMemResetBtn').onclick = () => { mgSfx('start'); mountMemory(stage); };
  }

  // === 3. ВПІЙМАЙ МАФІЮ (УСІ 19 РОЛЕЙ) ===
  function mountWhack(stage) {
    const WHACK_ROLES = [
      { id: 'godfather', labelUa: 'Дон +35', labelEn: 'Don +35', pts: 35, bad: true },
      { id: 'consigliere', labelUa: 'Консильєре +25', labelEn: 'Consigl. +25', pts: 25, bad: true },
      { id: 'cult_leader', labelUa: 'Культ +25', labelEn: 'Cult +25', pts: 25, bad: true },
      { id: 'blackmailer', labelUa: 'Шантаж. +20', labelEn: 'Blackm. +20', pts: 20, bad: true },
      { id: 'framer', labelUa: 'Адвокат +20', labelEn: 'Framer +20', pts: 20, bad: true },
      { id: 'mafioso', labelUa: 'Мафіозі +15', labelEn: 'Mafioso +15', pts: 15, bad: true },
      { id: 'jester', labelUa: 'Джокер +10', labelEn: 'Jester +10', pts: 10, bad: true },
      { id: 'citizen', labelUa: 'Мирний -20', labelEn: 'Citizen -20', pts: -20, bad: false },
      { id: 'sheriff', labelUa: 'Шериф -20', labelEn: 'Sheriff -20', pts: -20, bad: false },
      { id: 'doctor', labelUa: 'Лікар -20', labelEn: 'Doctor -20', pts: -20, bad: false },
      { id: 'escort', labelUa: 'Коханка -20', labelEn: 'Escort -20', pts: -20, bad: false },
      { id: 'bodyguard', labelUa: 'Охоронець -20', labelEn: 'Bodyg. -20', pts: -20, bad: false },
      { id: 'jailor', labelUa: 'Тюремник -20', labelEn: 'Jailor -20', pts: -20, bad: false },
      { id: 'journalist', labelUa: 'Репортер -20', labelEn: 'Journ. -20', pts: -20, bad: false },
      { id: 'medium', labelUa: 'Медіум -20', labelEn: 'Medium -20', pts: -20, bad: false },
      { id: 'mayor', labelUa: 'Мер -20', labelEn: 'Mayor -20', pts: -20, bad: false },
      { id: 'vigilante', labelUa: 'Месник -20', labelEn: 'Vigil. -20', pts: -20, bad: false },
      { id: 'guardian_angel', labelUa: 'Янгол -20', labelEn: 'Angel -20', pts: -20, bad: false },
      { id: 'amnesiac', labelUa: 'Амнезіак -20', labelEn: 'Amnes. -20', pts: -20, bad: false }
    ];
    const villains = WHACK_ROLES.filter(r => r.bad);
    const townies = WHACK_ROLES.filter(r => !r.bad);

    stage.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:12px;">
        <span>🎯 ${_loc('Рахунок', 'Score')}: <b id="mgWhackScore" style="color:#ffd166;">0</b> • ⏳ <b id="mgWhackTime">25</b> ${_loc('с', 's')}</span>
        <button type="button" id="mgWhackStartBtn" class="secondary" style="width:auto; margin:0; padding:4px 10px; font-size:11px;">${_loc('▶ Почати раунд', '▶ Start Round')}</button>
      </div>
      <div id="mgWhackGrid" class="mg-whack-grid"></div>
      <div style="font-size:11px; color:#8892b0; margin-top:6px; text-align:center;">${_loc('Бий Мафію, Культ і Джокера (+10…+35), але НЕ чіпай Мирних і Комісарів (-20)!', 'Tap Mafia, Cult & Jester (+10…+35), but DO NOT tap Townies (-20)!')}</div>
    `;

    const grid = document.getElementById('mgWhackGrid');
    const scoreEl = document.getElementById('mgWhackScore');
    const timeEl = document.getElementById('mgWhackTime');
    const cells = [];
    for (let i = 0; i < 9; i++) {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'mg-whack-cell';
      grid.appendChild(c);
      cells.push(c);
    }

    let score = 0;
    let timeLeft = 25;
    let activeIdx = -1;
    let activeRole = null;

    function clearActive() {
      cells.forEach(c => { c.innerHTML = ''; c.classList.remove('active-mafia', 'active-good'); });
      activeIdx = -1;
      activeRole = null;
    }

    function startRound() {
      stopAllLoops();
      mgSfx('start');
      score = 0;
      timeLeft = 25;
      scoreEl.textContent = '0';
      timeEl.textContent = '25';
      clearActive();

      function scheduleNextSpawn() {
        clearActive();
        if (timeLeft <= 0) return;
        const idx = Math.floor(Math.random() * 9);
        const pickBad = Math.random() < 0.64;
        const pool = pickBad ? villains : townies;
        const role = pool[Math.floor(Math.random() * pool.length)];
        activeIdx = idx;
        activeRole = role;
        const c = cells[idx];
        c.classList.add(role.bad ? 'active-mafia' : 'active-good');
        const lbl = _isEn() ? role.labelEn : role.labelUa;
        c.innerHTML = `<img src="/roles_avatars/${role.id}.png" alt="${role.id}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;"><span>${lbl}</span>`;
        const delayMs = Math.max(360, Math.floor(780 - (25 - timeLeft) * 16));
        _whackSpawn = setTimeout(scheduleNextSpawn, delayMs);
      }
      scheduleNextSpawn();

      _whackTimer = setInterval(() => {
        timeLeft--;
        timeEl.textContent = Math.max(0, timeLeft);
        if (timeLeft <= 0) {
          stopAllLoops();
          clearActive();
          if (score >= 100) mgSfx('win');
          else mgSfx('gameover');
          submitScore('whack', Math.max(0, score));
        }
      }, 1000);
    }

    cells.forEach((c, idx) => {
      c.onclick = () => {
        if (idx !== activeIdx || !activeRole) return;
        mgSfx(activeRole.bad ? 'hit' : 'penalty');
        score = Math.max(0, score + activeRole.pts);
        scoreEl.textContent = score;
        clearActive();
      };
    });

    document.getElementById('mgWhackStartBtn').onclick = startRound;
  }

  // === 4. МАФІЯ ДЖАМП (ВЕРТИКАЛЬНИЙ ПЛАТФОРМЕР ЯК DOODLE JUMP) ===
  function mountMafiaJump(stage) {
    stage.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:12px;">
        <span>⬆️ ${_loc('Висота', 'Height')}: <b id="mgJumpScore" style="color:#80ffdb;">0</b> <span style="color:#8892b0;">(${_loc('Рекорд', 'Best')}: <b id="mgJumpBest" style="color:#ffd166;">0</b>)</span></span>
        <button type="button" id="mgJumpRestartBtn" class="secondary" style="width:auto; margin:0; padding:4px 10px; font-size:11px;">${_loc('▶ Старт / Рестарт', '▶ Start / Restart')}</button>
      </div>
      <canvas id="mgJumpCanvas" width="320" height="300" class="mg-canvas"></canvas>
      <div style="font-size:11px; color:#8892b0; margin-top:4px; text-align:center;">${_loc('Стрілки ◀ ▶ (A / D) або натискай ліву/праву половину екрана!', 'Arrow keys ◀ ▶ (A / D) or tap left/right half of screen!')}</div>
    `;

    const canvas = document.getElementById('mgJumpCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('mgJumpScore');
    const bestEl = document.getElementById('mgJumpBest');
    let best = Number(localStorage.getItem('mafia_jump_best') || 0);
    bestEl.textContent = best;

    let hero, platforms, score, moveDir, pointerActive, pointerX, gameOver, lastTs = 0, lastMilestone = 0;

    function makePlat(y, forceType) {
      const r = Math.random();
      const type = forceType || (r < 0.14 ? 'spring' : (r < 0.34 ? 'moving' : (r < 0.48 ? 'fragile' : 'normal')));
      return {
        x: Math.random() * (canvas.width - 62),
        y,
        w: 62,
        h: 9,
        type,
        dx: type === 'moving' ? (Math.random() > 0.5 ? 0.85 : -0.85) : 0,
        broken: false
      };
    }

    function initGame() {
      stopAllLoops();
      hero = { x: canvas.width / 2 - 11, y: 230, w: 22, h: 28, vx: 0, vy: -6.2 };
      platforms = [{ x: canvas.width / 2 - 36, y: 274, w: 72, h: 10, type: 'normal', dx: 0, broken: false }];
      for (let y = 228; y > -20; y -= 44) {
        platforms.push(makePlat(y));
      }
      score = 0;
      moveDir = 0;
      pointerActive = false;
      pointerX = canvas.width / 2;
      gameOver = false;
      lastTs = performance.now();
      lastMilestone = 0;
      scoreEl.textContent = '0';
      _jumpRunning = true;
      mgSfx('start');
      _jumpRaf = requestAnimationFrame(loop);
    }

    const onKeyDown = (e) => {
      if (_activeTab !== 'mafia_jump') return;
      const modal = document.getElementById('lobbyMinigamesModal');
      if (!modal || !modal.classList.contains('open')) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveDir = -1;
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') moveDir = 1;
      else if (e.code === 'Space' && (!hero || gameOver || !_jumpRunning)) {
        e.preventDefault();
        initGame();
      }
    };
    const onKeyUp = (e) => {
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && moveDir === -1) moveDir = 0;
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && moveDir === 1) moveDir = 0;
    };
    window.removeEventListener('keydown', window._mgJumpKeyDown);
    window.removeEventListener('keyup', window._mgJumpKeyUp);
    window._mgJumpKeyDown = onKeyDown;
    window._mgJumpKeyUp = onKeyUp;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function setPointer(clientX) {
      const rect = canvas.getBoundingClientRect();
      pointerX = ((clientX - rect.left) / rect.width) * canvas.width;
    }
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!_jumpRunning || gameOver) { initGame(); return; }
      pointerActive = true;
      setPointer(e.clientX);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (pointerActive) setPointer(e.clientX);
    });
    window.addEventListener('pointerup', () => { pointerActive = false; });
    document.getElementById('mgJumpRestartBtn').onclick = initGame;

    function draw() {
      ctx.fillStyle = '#0c1018';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255, 209, 102, 0.9)';
      ctx.beginPath();
      ctx.arc(270, 38, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < canvas.width; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); ctx.stroke();
      }

      if (platforms) {
        platforms.forEach(p => {
          if (p.broken) return;
          ctx.fillStyle = p.type === 'spring' ? '#80ffdb' : (p.type === 'moving' ? '#f4a261' : (p.type === 'fragile' ? '#e63946' : '#38bdf8'));
          ctx.fillRect(p.x, p.y, p.w, p.h);
          if (p.type === 'spring') {
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(p.x + p.w / 2 - 7, p.y - 4, 14, 4);
          }
        });
      }

      if (hero) {
        ctx.fillStyle = '#f4a261';
        ctx.fillRect(hero.x, hero.y + 8, hero.w, hero.h - 8);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(hero.x + 4, hero.y + 2, 14, 10);
        ctx.fillStyle = '#111';
        ctx.fillRect(hero.x + 1, hero.y, 20, 4);
        ctx.fillRect(hero.x + 4, hero.y - 5, 14, 6);
      }

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.68)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`GAME OVER • ${Math.floor(score)} ${_loc('м', 'm')}`, canvas.width / 2, 132);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '12px sans-serif';
        ctx.fillText(_loc('Торкнись екрана або натисни Пробіл', 'Tap screen or press Space'), canvas.width / 2, 156);
      } else if (!_jumpRunning) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#80ffdb';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(_loc('Торкнись, щоб почати підйом у Мафія Джамп!', 'Tap to start climbing in Mafia Jump!'), canvas.width / 2, 150);
      }
    }

    function loop(now) {
      if (!_jumpRunning) { draw(); return; }
      const ts = now || performance.now();
      const dtBase = lastTs ? Math.min(2.0, Math.max(0.25, (ts - lastTs) / 16.6667)) : 1;
      lastTs = ts;
      const speedMult = 1 + Math.min(0.85, score / 1400);
      const dt = dtBase * speedMult;

      if (pointerActive) {
        hero.vx = pointerX < canvas.width / 2 ? -2.65 : 2.65;
      } else if (moveDir !== 0) {
        hero.vx = moveDir * 2.75;
      } else {
        hero.vx *= Math.pow(0.84, dt);
      }

      hero.x += hero.vx * dt;
      if (hero.x + hero.w < 0) hero.x = canvas.width;
      if (hero.x > canvas.width) hero.x = -hero.w;

      hero.vy += 0.17 * dt;
      hero.y += hero.vy * dt;

      platforms.forEach(p => {
        if (p.dx) {
          p.x += p.dx * dt;
          if (p.x <= 0 || p.x + p.w >= canvas.width) p.dx *= -1;
        }
        if (p.broken) return;
        if (
          hero.vy > 0 &&
          hero.x + hero.w - 4 > p.x &&
          hero.x + 4 < p.x + p.w &&
          hero.y + hero.h >= p.y &&
          hero.y + hero.h <= p.y + p.h + 10
        ) {
          if (p.type === 'fragile') {
            p.broken = true;
            hero.vy = -5.7;
            mgSfx('crack');
          } else if (p.type === 'spring') {
            hero.vy = -9.6;
            mgSfx('spring');
          } else {
            hero.vy = -6.2;
            mgSfx('jump');
          }
        }
      });

      if (hero.y < 125) {
        const dy = 125 - hero.y;
        hero.y = 125;
        score += dy * 0.4;
        const ms = Math.floor(score / 100);
        if (ms > lastMilestone) {
          lastMilestone = ms;
          mgSfx('milestone');
        }
        scoreEl.textContent = `${Math.floor(score)} (⚡x${speedMult.toFixed(1)})`;
        platforms.forEach(p => { p.y += dy; });
        platforms = platforms.filter(p => p.y < canvas.height + 15);
        while (platforms.length < 7) {
          const highestY = platforms.reduce((m, p) => Math.min(m, p.y), canvas.height);
          platforms.push(makePlat(highestY - (38 + Math.random() * 14)));
        }
      }

      if (hero.y > canvas.height + 20) {
        gameOver = true;
        _jumpRunning = false;
        mgSfx('gameover');
        const finalPts = Math.floor(score);
        if (finalPts > best) {
          best = finalPts;
          localStorage.setItem('mafia_jump_best', String(best));
          bestEl.textContent = best;
        }
        submitScore('mafia_jump', finalPts);
        draw();
        return;
      }

      draw();
      _jumpRaf = requestAnimationFrame(loop);
    }

    draw();
  }

  // === 5. ГАРМАТА СИНДИКАТУ (BALL BLAST: КАМІННЯ РІЗНИХ ТИПІВ + АПГРЕЙДИ) ===
  function mountCannon(stage) {
    stage.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:12px;">
        <span>💥 <b id="mgCannonScore" style="color:#ffd166;">0</b> <span style="color:#8892b0;">(${_loc('Рекорд', 'Best')}: <b id="mgCannonBest">0</b>)</span> • ⚙️ <b id="mgCannonScrap" style="color:#80ffdb;">0</b></span>
        <button type="button" id="mgCannonRestartBtn" class="secondary" style="width:auto; margin:0; padding:4px 10px; font-size:11px;">${_loc('▶ Старт / Рестарт', '▶ Start / Restart')}</button>
      </div>
      <canvas id="mgCannonCanvas" width="320" height="280" class="mg-canvas"></canvas>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:5px; margin-top:6px;">
        <button type="button" id="mgCannonUpRate" class="secondary" style="margin:0; padding:6px 4px; font-size:10.5px; border-color:#80ffdb; color:#80ffdb;">⚡ ${_loc('Темп', 'Rate')} (3⚙️)</button>
        <button type="button" id="mgCannonUpMulti" class="secondary" style="margin:0; padding:6px 4px; font-size:10.5px; border-color:#f4a261; color:#ffd166;">🔥 ${_loc('Стволи', 'Barrels')} (6⚙️)</button>
        <button type="button" id="mgCannonUpPower" class="secondary" style="margin:0; padding:6px 4px; font-size:10.5px; border-color:#ff758f; color:#ff9ebb;">💣 ${_loc('Сила', 'Power')} (4⚙️)</button>
      </div>
      <div style="font-size:10.5px; color:#8892b0; margin-top:4px; text-align:center;">${_loc('Води пальцем / мишею або ◀ ▶: ухиляйся від каменів — гармата стріляє автоматично!', 'Drag finger/mouse or ◀ ▶ to dodge rocks — cannon auto-fires!')}</div>
    `;

    const canvas = document.getElementById('mgCannonCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('mgCannonScore');
    const bestEl = document.getElementById('mgCannonBest');
    const scrapEl = document.getElementById('mgCannonScrap');
    const upRateBtn = document.getElementById('mgCannonUpRate');
    const upMultiBtn = document.getElementById('mgCannonUpMulti');
    const upPowerBtn = document.getElementById('mgCannonUpPower');

    let best = Number(localStorage.getItem('mafia_cannon_best') || 0);
    bestEl.textContent = best;

    let cannon, bullets, rocks, particles, score, scrap, wave, gameOver, fireCd;
    let rateLv = 1, multiLv = 1, powerLv = 1;
    let moveDir = 0, pointerDown = false, targetPointerX = canvas.width / 2, lastTs = 0, spawnTimer = 0;

    const ROCK_TYPES = [
      { id: 'normal', color: '#475569', border: '#94a3b8', icon: '', hpMult: 1, scrap: 1, spd: 1 },
      { id: 'safe', color: '#334155', border: '#e2e8f0', icon: '🛡️', hpMult: 1.65, scrap: 3, spd: 0.78 },
      { id: 'gold', color: '#b45309', border: '#ffd166', icon: '🪙', hpMult: 1.1, scrap: 4, spd: 1.22 },
      { id: 'ice', color: '#0e7490', border: '#67e8f9', icon: '❄️', hpMult: 0.9, scrap: 2, spd: 1.05 },
      { id: 'tnt', color: '#991b1b', border: '#ff6b6b', icon: '💣', hpMult: 0.85, scrap: 2, spd: 1.0 }
    ];

    function refreshUpgradeBtns() {
      const cRate = rateLv * 3;
      const cMulti = multiLv * 6;
      const cPower = powerLv * 4;
      upRateBtn.textContent = rateLv >= 6 ? `⚡ ${_loc('Темп MAX', 'Rate MAX')}` : `⚡ ${_loc('Темп', 'Rate')} Lv${rateLv} (${cRate}⚙️)`;
      upMultiBtn.textContent = multiLv >= 4 ? `🔥 ${_loc('Стволи MAX', 'Barrels MAX')}` : `🔥 ${_loc('Стволи', 'Barrels')} ×${multiLv} (${cMulti}⚙️)`;
      upPowerBtn.textContent = powerLv >= 6 ? `💣 ${_loc('Сила MAX', 'Power MAX')}` : `💣 ${_loc('Сила', 'Power')} Lv${powerLv} (${cPower}⚙️)`;
      upRateBtn.disabled = rateLv >= 6 || scrap < cRate;
      upMultiBtn.disabled = multiLv >= 4 || scrap < cMulti;
      upPowerBtn.disabled = powerLv >= 6 || scrap < cPower;
    }

    function spawnRock(custom) {
      if (custom) { rocks.push(custom); return; }
      const rPool = wave < 2 ? [ROCK_TYPES[0], ROCK_TYPES[2]] : ROCK_TYPES;
      const kind = rPool[Math.floor(Math.random() * rPool.length)];
      const r = 18 + Math.random() * 14;
      const baseHp = Math.floor((6 + wave * 3.5 + Math.random() * (4 + wave * 2)) * kind.hpMult);
      const fromLeft = Math.random() > 0.5;
      rocks.push({
        x: fromLeft ? r + 4 : canvas.width - r - 4,
        y: 26 + Math.random() * 30,
        r,
        vx: (fromLeft ? 1 : -1) * (1.1 + Math.random() * 1.1) * kind.spd,
        vy: 0.4,
        hp: baseHp,
        maxHp: baseHp,
        kind,
        splitGen: 0
      });
    }

    function initGame() {
      stopAllLoops();
      cannon = { x: canvas.width / 2, y: canvas.height - 22, w: 34, h: 20 };
      bullets = [];
      rocks = [];
      particles = [];
      score = 0;
      scrap = 0;
      wave = 1;
      rateLv = 1;
      multiLv = 1;
      powerLv = 1;
      fireCd = 0;
      spawnTimer = 0;
      gameOver = false;
      lastTs = performance.now();
      scoreEl.textContent = '0';
      scrapEl.textContent = '0';
      refreshUpgradeBtns();
      _cannonRunning = true;
      mgSfx('start');
      spawnRock();
      _cannonRaf = requestAnimationFrame(loop);
    }

    upRateBtn.onclick = () => {
      const cost = rateLv * 3;
      if (!_cannonRunning || rateLv >= 6 || scrap < cost) return;
      scrap -= cost; rateLv++; scrapEl.textContent = scrap; mgSfx('milestone'); refreshUpgradeBtns();
    };
    upMultiBtn.onclick = () => {
      const cost = multiLv * 6;
      if (!_cannonRunning || multiLv >= 4 || scrap < cost) return;
      scrap -= cost; multiLv++; scrapEl.textContent = scrap; mgSfx('milestone'); refreshUpgradeBtns();
    };
    upPowerBtn.onclick = () => {
      const cost = powerLv * 4;
      if (!_cannonRunning || powerLv >= 6 || scrap < cost) return;
      scrap -= cost; powerLv++; scrapEl.textContent = scrap; mgSfx('milestone'); refreshUpgradeBtns();
    };

    const setPtr = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      targetPointerX = ((clientX - rect.left) / rect.width) * canvas.width;
    };
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!_cannonRunning || gameOver) { initGame(); return; }
      pointerDown = true; setPtr(e.clientX);
    });
    canvas.addEventListener('pointermove', (e) => { if (pointerDown) setPtr(e.clientX); });
    window.addEventListener('pointerup', () => { pointerDown = false; });

    const onKeyDown = (e) => {
      if (_activeTab !== 'cannon') return;
      const modal = document.getElementById('lobbyMinigamesModal');
      if (!modal || !modal.classList.contains('open')) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveDir = -1;
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') moveDir = 1;
      else if (e.code === 'Space' && (!cannon || gameOver || !_cannonRunning)) { e.preventDefault(); initGame(); }
    };
    const onKeyUp = (e) => {
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && moveDir === -1) moveDir = 0;
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && moveDir === 1) moveDir = 0;
    };
    window.removeEventListener('keydown', window._mgCannonKeyDown);
    window.removeEventListener('keyup', window._mgCannonKeyUp);
    window._mgCannonKeyDown = onKeyDown;
    window._mgCannonKeyUp = onKeyUp;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.getElementById('mgCannonRestartBtn').onclick = initGame;

    function triggerBoom(rx, ry, dmg) {
      mgSfx('boom');
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        particles.push({ x: rx, y: ry, vx: Math.cos(a) * 3.5, vy: Math.sin(a) * 3.5, life: 18, color: '#ff6b6b' });
      }
      rocks.forEach(other => {
        if (Math.hypot(other.x - rx, other.y - ry) < 110) other.hp -= dmg;
      });
    }

    function draw() {
      ctx.fillStyle = '#0c1019';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(pt => {
        ctx.fillStyle = pt.color || '#ffd166';
        ctx.globalAlpha = Math.max(0.1, pt.life / 18);
        ctx.fillRect(pt.x, pt.y, 4, 4);
      });
      ctx.globalAlpha = 1;

      if (bullets) {
        bullets.forEach(b => {
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(b.x - 2.5, b.y - 6, 5, 11);
        });
      }

      if (rocks) {
        rocks.forEach(rk => {
          ctx.beginPath();
          ctx.arc(rk.x, rk.y, rk.r, 0, Math.PI * 2);
          ctx.fillStyle = rk.kind.color;
          ctx.fill();
          ctx.lineWidth = 2.2;
          ctx.strokeStyle = rk.kind.border;
          ctx.stroke();

          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `bold ${rk.r > 18 ? 12 : 10}px sans-serif`;
          const lbl = (rk.kind.icon ? rk.kind.icon : '') + Math.max(1, Math.ceil(rk.hp));
          ctx.fillText(lbl, rk.x, rk.y);
        });
      }

      if (cannon) {
        // Корпус гармати
        ctx.fillStyle = '#334155';
        ctx.fillRect(cannon.x - cannon.w / 2, cannon.y, cannon.w, cannon.h - 4);
        ctx.fillStyle = '#f4a261';
        const barrels = multiLv;
        const spread = 7;
        for (let i = 0; i < barrels; i++) {
          const bx = cannon.x + (i - (barrels - 1) / 2) * spread - 2.5;
          ctx.fillRect(bx, cannon.y - 10, 5, 12);
        }
        // Колеса
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(cannon.x - 11, cannon.y + cannon.h - 2, 6, 0, Math.PI * 2);
        ctx.arc(cannon.x + 11, cannon.y + cannon.h - 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`GAME OVER • ${Math.floor(score)} pts`, canvas.width / 2, 122);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '12px sans-serif';
        ctx.fillText(_loc('Торкнись або натисни Пробіл для рестарту', 'Tap or press Space to restart'), canvas.width / 2, 148);
      } else if (!_cannonRunning) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#80ffdb';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(_loc('Торкнись, щоб запустити Гармату!', 'Tap to start Syndicate Cannon!'), canvas.width / 2, 140);
      }
    }

    function loop(now) {
      if (!_cannonRunning) { draw(); return; }
      const ts = now || performance.now();
      const dtBase = lastTs ? Math.min(2.0, Math.max(0.25, (ts - lastTs) / 16.6667)) : 1;
      lastTs = ts;
      const spdFactor = 1 + Math.min(1.1, score / 2500);
      const dt = dtBase;

      if (pointerDown) {
        const diff = targetPointerX - cannon.x;
        cannon.x += Math.max(-7.5, Math.min(7.5, diff * 0.35)) * dt;
      } else if (moveDir !== 0) {
        cannon.x += moveDir * 5.2 * dt;
      }
      cannon.x = Math.max(cannon.w / 2, Math.min(canvas.width - cannon.w / 2, cannon.x));

      fireCd -= dt;
      const fireDelay = Math.max(4, 13 - rateLv * 1.6);
      if (fireCd <= 0) {
        fireCd = fireDelay;
        for (let i = 0; i < multiLv; i++) {
          const bx = cannon.x + (i - (multiLv - 1) / 2) * 7;
          bullets.push({ x: bx, y: cannon.y - 12, dmg: 1 + (powerLv - 1) * 0.75 });
        }
        mgSfx('shoot');
      }

      bullets.forEach(b => { b.y -= 7.8 * dt; });
      bullets = bullets.filter(b => b.y > -12);

      spawnTimer += dt * spdFactor;
      const maxRocks = Math.min(8, 3 + Math.floor(wave / 2));
      if (spawnTimer > 115 && rocks.length < maxRocks) {
        spawnTimer = 0;
        spawnRock();
      }

      for (let i = rocks.length - 1; i >= 0; i--) {
        const rk = rocks[i];
        rk.vy += 0.14 * spdFactor * dt;
        rk.x += rk.vx * spdFactor * dt;
        rk.y += rk.vy * dt;

        if (rk.x - rk.r < 0) { rk.x = rk.r; rk.vx = Math.abs(rk.vx); }
        if (rk.x + rk.r > canvas.width) { rk.x = canvas.width - rk.r; rk.vx = -Math.abs(rk.vx); }
        if (rk.y + rk.r > canvas.height - 4) {
          rk.y = canvas.height - 4 - rk.r;
          rk.vy = -(4.8 + Math.min(2.6, rk.r * 0.08)) * Math.min(1.3, spdFactor);
        }

        // Перевірка влучань куль
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          if (Math.hypot(b.x - rk.x, b.y - rk.y) <= rk.r + 4) {
            rk.hp -= b.dmg;
            score += 2;
            bullets.splice(j, 1);
            if (rk.hp <= 0) break;
          }
        }

        if (rk.hp <= 0) {
          const bonusPts = rk.kind.id === 'gold' ? 35 : (rk.kind.id === 'safe' ? 25 : 15);
          score += bonusPts;
          scrap += rk.kind.scrap;
          scrapEl.textContent = scrap;
          mgSfx('hit');
          if (rk.kind.id === 'tnt') triggerBoom(rk.x, rk.y, 12 + wave * 3);

          // Розщеплення великих каменів
          if (rk.r > 16 && rk.splitGen < 1) {
            const splitCount = rk.kind.id === 'ice' ? 3 : 2;
            const childR = Math.max(11, rk.r * 0.62);
            const childHp = Math.max(3, Math.ceil(rk.maxHp * 0.45));
            for (let s = 0; s < splitCount; s++) {
              const dir = s === 0 ? -1.4 : (s === 1 ? 1.4 : 0);
              spawnRock({
                x: rk.x, y: rk.y - 4, r: childR,
                vx: dir + (Math.random() - 0.5) * 0.6,
                vy: -3.2, hp: childHp, maxHp: childHp,
                kind: rk.kind, splitGen: rk.splitGen + 1
              });
            }
          }
          rocks.splice(i, 1);
          wave = 1 + Math.floor(score / 220);
          scoreEl.textContent = `${Math.floor(score)} (⚡x${spdFactor.toFixed(1)})`;
          refreshUpgradeBtns();
          continue;
        }

        // Перевірка зіткнення з гарматою
        const cx = Math.max(cannon.x - cannon.w / 2 + 3, Math.min(rk.x, cannon.x + cannon.w / 2 - 3));
        const cy = Math.max(cannon.y + 2, Math.min(rk.y, cannon.y + cannon.h));
        if (Math.hypot(rk.x - cx, rk.y - cy) < rk.r - 2) {
          gameOver = true;
          _cannonRunning = false;
          mgSfx('gameover');
          const finalPts = Math.floor(score);
          if (finalPts > best) {
            best = finalPts;
            localStorage.setItem('mafia_cannon_best', String(best));
            bestEl.textContent = best;
          }
          submitScore('cannon', finalPts);
          draw();
          return;
        }
      }

      particles.forEach(pt => { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt; });
      particles = particles.filter(pt => pt.life > 0);
      scoreEl.textContent = `${Math.floor(score)} (⚡x${spdFactor.toFixed(1)})`;

      draw();
      _cannonRaf = requestAnimationFrame(loop);
    }

    draw();
  }

  // === 6. МАФІОЗНА ЗМІЙКА (З ПРИШВИДШЕННЯМ) ===
  function mountSnake(stage) {
    stage.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:12px;">
        <span>🐍 <b id="mgSnakeScore" style="color:#80ffdb;">0</b> <span style="color:#8892b0;">(${_loc('Рекорд', 'Best')}: <b id="mgSnakeBest" style="color:#ffd166;">0</b>)</span></span>
        <button type="button" id="mgSnakeRestartBtn" class="secondary" style="width:auto; margin:0; padding:4px 10px; font-size:11px;">${_loc('▶ Старт / Рестарт', '▶ Start / Restart')}</button>
      </div>
      <canvas id="mgSnakeCanvas" width="300" height="260" class="mg-canvas"></canvas>
      <div style="display:flex; justify-content:center; gap:8px; margin-top:6px;">
        <button type="button" class="secondary" data-sdir="L" style="width:46px; margin:0; padding:6px;">⬅️</button>
        <button type="button" class="secondary" data-sdir="U" style="width:46px; margin:0; padding:6px;">⬆️</button>
        <button type="button" class="secondary" data-sdir="D" style="width:46px; margin:0; padding:6px;">⬇️</button>
        <button type="button" class="secondary" data-sdir="R" style="width:46px; margin:0; padding:6px;">➡️</button>
      </div>
    `;

    const canvas = document.getElementById('mgSnakeCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('mgSnakeScore');
    const bestEl = document.getElementById('mgSnakeBest');
    let best = Number(localStorage.getItem('mafia_snake_best') || 0);
    bestEl.textContent = best;

    const COLS = 15, ROWS = 13, CELL = 20;
    let snake, dir, nextDir, food, score, eatenCount, gameOver;

    function spawnFood() {
      const types = [
        { icon: '🪙', pts: 15 }, { icon: '🪙', pts: 15 },
        { icon: '💼', pts: 30 }, { icon: '💎', pts: 50 }
      ];
      const pick = types[Math.floor(Math.random() * types.length)];
      let x = 0, y = 0, guard = 0;
      do {
        x = Math.floor(Math.random() * COLS);
        y = Math.floor(Math.random() * ROWS);
        guard++;
      } while (snake.some(s => s.x === x && s.y === y) && guard < 100);
      food = { x, y, ...pick };
    }

    function draw() {
      ctx.fillStyle = '#0c1018';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvas.width, y * CELL); ctx.stroke();
      }

      if (food) {
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(food.icon, food.x * CELL + CELL / 2, food.y * CELL + CELL / 2 + 1);
      }

      if (snake) {
        snake.forEach((seg, idx) => {
          ctx.fillStyle = idx === 0 ? '#ffd166' : '#2a9d8f';
          ctx.fillRect(seg.x * CELL + 1.5, seg.y * CELL + 1.5, CELL - 3, CELL - 3);
        });
      }

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.68)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`GAME OVER • ${score} pts`, canvas.width / 2, 120);
      } else if (!_snakeRunning) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#80ffdb';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(_loc('Натисни Старт або стрілки!', 'Press Start or arrow keys!'), canvas.width / 2, 130);
      }
    }

    function step() {
      if (!_snakeRunning) return;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver = true;
        _snakeRunning = false;
        mgSfx('gameover');
        if (score > best) {
          best = score;
          localStorage.setItem('mafia_snake_best', String(best));
          bestEl.textContent = best;
        }
        submitScore('snake', score);
        draw();
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += food.pts;
        eatenCount++;
        mgSfx('hit');
        spawnFood();
      } else {
        snake.pop();
      }

      const tickMs = Math.max(60, Math.floor(155 - eatenCount * 3.5));
      const mult = (155 / tickMs).toFixed(1);
      scoreEl.textContent = `${score} (⚡x${mult})`;
      draw();
      _snakeTimer = setTimeout(step, tickMs);
    }

    function initGame() {
      stopAllLoops();
      snake = [{ x: 7, y: 6 }, { x: 6, y: 6 }, { x: 5, y: 6 }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      eatenCount = 0;
      gameOver = false;
      spawnFood();
      scoreEl.textContent = '0';
      _snakeRunning = true;
      mgSfx('start');
      draw();
      _snakeTimer = setTimeout(step, 155);
    }

    function setDir(code) {
      if (!_snakeRunning || gameOver) initGame();
      if (code === 'L' && dir.x !== 1) nextDir = { x: -1, y: 0 };
      else if (code === 'R' && dir.x !== -1) nextDir = { x: 1, y: 0 };
      else if (code === 'U' && dir.y !== 1) nextDir = { x: 0, y: -1 };
      else if (code === 'D' && dir.y !== -1) nextDir = { x: 0, y: 1 };
    }

    stage.querySelectorAll('[data-sdir]').forEach(b => {
      b.onclick = () => setDir(b.dataset.sdir);
    });
    document.getElementById('mgSnakeRestartBtn').onclick = initGame;
    const onKey = (e) => {
      if (_activeTab !== 'snake') return;
      const modal = document.getElementById('lobbyMinigamesModal');
      if (!modal || !modal.classList.contains('open')) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); setDir('L'); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); setDir('R'); }
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); setDir('U'); }
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); setDir('D'); }
    };
    window.removeEventListener('keydown', window._mgSnakeKey);
    window._mgSnakeKey = onKey;
    window.addEventListener('keydown', onKey);
    snake = [{ x: 7, y: 6 }, { x: 6, y: 6 }, { x: 5, y: 6 }];
    spawnFood();
    draw();
  }

  // === 7. НУАРНИЙ ТЕТРІС (З ПРИШВИДШЕННЯМ) ===
  function mountTetris(stage) {
    stage.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:12px;">
        <span>🧱 <b id="mgTetrisScore" style="color:#ffd166;">0</b> <span style="color:#8892b0;">(${_loc('Рекорд', 'Best')}: <b id="mgTetrisBest">0</b>)</span></span>
        <button type="button" id="mgTetrisRestartBtn" class="secondary" style="width:auto; margin:0; padding:4px 10px; font-size:11px;">${_loc('▶ Старт / Рестарт', '▶ Start / Restart')}</button>
      </div>
      <canvas id="mgTetrisCanvas" width="240" height="288" class="mg-canvas"></canvas>
      <div style="display:flex; justify-content:center; gap:6px; margin-top:6px;">
        <button type="button" class="secondary" data-tact="L" style="width:44px; margin:0; padding:6px;">⬅️</button>
        <button type="button" class="secondary" data-tact="ROT" style="width:44px; margin:0; padding:6px;">🔄</button>
        <button type="button" class="secondary" data-tact="D" style="width:44px; margin:0; padding:6px;">⬇️</button>
        <button type="button" class="secondary" data-tact="DROP" style="width:44px; margin:0; padding:6px;">⏬</button>
        <button type="button" class="secondary" data-tact="R" style="width:44px; margin:0; padding:6px;">➡️</button>
      </div>
    `;

    const canvas = document.getElementById('mgTetrisCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('mgTetrisScore');
    const bestEl = document.getElementById('mgTetrisBest');
    let best = Number(localStorage.getItem('mafia_tetris_best') || 0);
    bestEl.textContent = best;

    const COLS = 10, ROWS = 18, CELL = 16;
    const SHAPES = [
      { m: [[1, 1, 1, 1]], c: '#38bdf8' },
      { m: [[1, 1], [1, 1]], c: '#ffd166' },
      { m: [[0, 1, 0], [1, 1, 1]], c: '#9b5de5' },
      { m: [[0, 1, 1], [1, 1, 0]], c: '#2a9d8f' },
      { m: [[1, 1, 0], [0, 1, 1]], c: '#e63946' },
      { m: [[1, 0, 0], [1, 1, 1]], c: '#f4a261' },
      { m: [[0, 0, 1], [1, 1, 1]], c: '#80ffdb' }
    ];

    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    let piece = null, nextPiece = null, score = 0, linesCleared = 0, level = 1, gameOver = false;
    let lastDrop = 0;

    function randomPiece() {
      const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      return { m: s.m.map(r => r.slice()), c: s.c, x: Math.floor((COLS - s.m[0].length) / 2), y: 0 };
    }

    function collides(m, ox, oy) {
      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (!m[r][c]) continue;
          const nx = ox + c, ny = oy + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
      }
      return false;
    }

    function rotateMatrix(m) {
      return m[0].map((_, idx) => m.map(row => row[idx]).reverse());
    }

    function mergeAndSweep() {
      piece.m.forEach((row, r) => row.forEach((v, c) => {
        if (v && piece.y + r >= 0) board[piece.y + r][piece.x + c] = piece.c;
      }));
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(Boolean)) {
          board.splice(r, 1);
          board.unshift(Array(COLS).fill(null));
          cleared++;
          r++;
        }
      }
      if (cleared > 0) {
        const pts = [0, 100, 300, 500, 800][cleared] || 800;
        score += pts * level;
        linesCleared += cleared;
        level = 1 + Math.floor(linesCleared / 4);
        mgSfx('milestone');
      } else {
        score += 10;
        mgSfx('flip');
      }
      piece = nextPiece || randomPiece();
      nextPiece = randomPiece();
      if (collides(piece.m, piece.x, piece.y)) {
        gameOver = true;
        _tetrisRunning = false;
        mgSfx('gameover');
        if (score > best) {
          best = score;
          localStorage.setItem('mafia_tetris_best', String(best));
          bestEl.textContent = best;
        }
        submitScore('tetris', score);
      }
    }

    function draw() {
      ctx.fillStyle = '#0c1018';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Сітка 10x18 (160px шириною)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
          if (board[r][c]) {
            ctx.fillStyle = board[r][c];
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }

      if (piece && !gameOver) {
        ctx.fillStyle = piece.c;
        piece.m.forEach((row, r) => row.forEach((v, c) => {
          if (v && piece.y + r >= 0) {
            ctx.fillRect((piece.x + c) * CELL + 1, (piece.y + r) * CELL + 1, CELL - 2, CELL - 2);
          }
        }));
      }

      // Бічна панель Next + Level
      ctx.fillStyle = '#151b28';
      ctx.fillRect(162, 0, 78, canvas.height);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(_loc('ДАЛІ:', 'NEXT:'), 170, 22);
      if (nextPiece) {
        ctx.fillStyle = nextPiece.c;
        nextPiece.m.forEach((row, r) => row.forEach((v, c) => {
          if (v) ctx.fillRect(172 + c * 13, 32 + r * 13, 11, 11);
        }));
      }
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`${_loc('Рів.', 'Lv.')} ${level}`, 170, 120);
      ctx.fillText(`${_loc('Ліній', 'Lines')}: ${linesCleared}`, 170, 140);
      const speedMult = (1 + (level - 1) * 0.2).toFixed(1);
      ctx.fillStyle = '#80ffdb';
      ctx.fillText(`⚡x${speedMult}`, 170, 162);

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(0, 0, 160, canvas.height);
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', 80, 132);
        ctx.fillText(`${score} pts`, 80, 152);
      } else if (!_tetrisRunning) {
        ctx.fillStyle = 'rgba(0,0,0,0.48)';
        ctx.fillRect(0, 0, 160, canvas.height);
        ctx.fillStyle = '#80ffdb';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(_loc('Натисни Старт!', 'Press Start!'), 80, 144);
      }
    }

    function initGame() {
      stopAllLoops();
      board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      piece = randomPiece();
      nextPiece = randomPiece();
      score = 0; linesCleared = 0; level = 1; gameOver = false;
      lastDrop = performance.now();
      scoreEl.textContent = '0';
      _tetrisRunning = true;
      mgSfx('start');
      draw();
      _tetrisRaf = requestAnimationFrame(loop);
    }

    function act(op) {
      if (!_tetrisRunning || gameOver) { initGame(); return; }
      if (op === 'L' && !collides(piece.m, piece.x - 1, piece.y)) piece.x--;
      else if (op === 'R' && !collides(piece.m, piece.x + 1, piece.y)) piece.x++;
      else if (op === 'D') {
        if (!collides(piece.m, piece.x, piece.y + 1)) piece.y++;
        else mergeAndSweep();
      } else if (op === 'DROP') {
        while (!collides(piece.m, piece.x, piece.y + 1)) piece.y++;
        mergeAndSweep();
      } else if (op === 'ROT') {
        const rot = rotateMatrix(piece.m);
        if (!collides(rot, piece.x, piece.y)) piece.m = rot;
        else if (!collides(rot, piece.x - 1, piece.y)) { piece.x--; piece.m = rot; }
        else if (!collides(rot, piece.x + 1, piece.y)) { piece.x++; piece.m = rot; }
      }
      scoreEl.textContent = `${score} (⚡x${(1 + (level - 1) * 0.2).toFixed(1)})`;
      draw();
    }

    function loop(now) {
      if (!_tetrisRunning) return;
      const dropMs = Math.max(120, 620 - (level - 1) * 65);
      if (now - lastDrop >= dropMs) {
        lastDrop = now;
        if (!collides(piece.m, piece.x, piece.y + 1)) piece.y++;
        else mergeAndSweep();
        scoreEl.textContent = `${score} (⚡x${(1 + (level - 1) * 0.2).toFixed(1)})`;
      }
      draw();
      if (_tetrisRunning) _tetrisRaf = requestAnimationFrame(loop);
    }

    stage.querySelectorAll('[data-tact]').forEach(b => { b.onclick = () => act(b.dataset.tact); });
    document.getElementById('mgTetrisRestartBtn').onclick = initGame;
    const onKey = (e) => {
      if (_activeTab !== 'tetris') return;
      const modal = document.getElementById('lobbyMinigamesModal');
      if (!modal || !modal.classList.contains('open')) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); act('L'); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); act('R'); }
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); act('D'); }
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); act('ROT'); }
      else if (e.code === 'Space') { e.preventDefault(); act('DROP'); }
    };
    window.removeEventListener('keydown', window._mgTetrisKey);
    window._mgTetrisKey = onKey;
    window.addEventListener('keydown', onKey);
    draw();
  }

  function switchTab(tab) {
    _activeTab = tab;
    stopAllLoops();
    document.querySelectorAll('.mg-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.mg === tab));
    const stage = document.getElementById('mgStageContainer');
    if (!stage) return;
    if (tab === 'runner') mountRunner(stage);
    else if (tab === 'memory') mountMemory(stage);
    else if (tab === 'whack') mountWhack(stage);
    else if (tab === 'cannon') mountCannon(stage);
    else if (tab === 'snake') mountSnake(stage);
    else if (tab === 'tetris') mountTetris(stage);
    else mountMafiaJump(stage);
    renderLeaderboardBox(tab);
  }

  window.openLobbyMinigames = function (socketRef, countdownSec) {
    if (socketRef) _socket = socketRef;
    const modal = document.getElementById('lobbyMinigamesModal');
    if (!modal) return;
    window.updateLobbyMinigamesCountdown(countdownSec);
    modal.classList.add('open');
    document.querySelectorAll('.mg-tab-btn').forEach(btn => {
      btn.onclick = () => switchTab(btn.dataset.mg);
    });
    switchTab(_activeTab || 'runner');
  };

  window.closeLobbyMinigames = function () {
    stopAllLoops();
    const modal = document.getElementById('lobbyMinigamesModal');
    if (modal) modal.classList.remove('open');
  };

  window.updateLobbyMinigamesCountdown = function (sec) {
    const el = document.getElementById('mgLobbyCountdownText');
    if (!el) return;
    if (sec && sec > 0) {
      el.textContent = _loc(`⏳ Старт гри через ${sec} с`, `⏳ Starts in ${sec}s`);
      el.style.display = 'inline-block';
    } else {
      el.style.display = 'none';
    }
  };

  window.updateLobbyMinigamesLeaderboard = function (roomScores, globalRecords) {
    if (roomScores) _roomScores = roomScores;
    if (globalRecords) _globalRecords = globalRecords;
    const modal = document.getElementById('lobbyMinigamesModal');
    if (modal && modal.classList.contains('open')) {
      renderLeaderboardBox(_activeTab);
    }
  };
})();
