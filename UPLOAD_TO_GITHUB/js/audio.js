// =====================================================================
//  AUDIO — Web Audio синтезатор (SFX + Фоновий нуар-джаз меню і арен)
// =====================================================================

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.sfxOn = true;
    this.musicOn = true;
    this.lastPlay = {};
    this.music = { playing: false, bpm: 60, step: 0, nextTime: 0, timer: null, tempoMult: 1, bar: 0 };
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ctx.destination);

      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.58;
      this.sfx.connect(this.master);

      this.mus = this.ctx.createGain();
      this.mus.gain.value = 0.35;
      this.mus.connect(this.master);

      const len = this.ctx.sampleRate * 1.0;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  setSfx(on) { this.sfxOn = on; }
  setMusic(on, currentBpm = 68) {
    this.musicOn = on;
    if (!on) this.stopMusic();
    else if (!this.music.playing) this.startMusic(currentBpm);
  }

  _throttle(name, ms) {
    const now = performance.now();
    if (this.lastPlay[name] && now - this.lastPlay[name] < ms) return false;
    this.lastPlay[name] = now;
    return true;
  }

  _noise(t, dur, { type = 'lowpass', freq = 800, q = 1, gain = 0.5, attack = 0.002 } = {}) {
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfx);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
    return { f, g };
  }

  _tone(t, { type = 'sine', f0 = 440, f1 = null, dur = 0.1, gain = 0.3, attack = 0.003, dest = null }) {
    const c = this.ctx;
    const o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  play(name, opt = {}) {
    this.unlock();
    if (!this.ctx || !this.sfxOn) return;
    const fn = this['s_' + name];
    if (fn) fn.call(this, this.ctx.currentTime + 0.005, opt);
  }

  s_pistol(t) {
    if (!this._throttle('pistol', 45)) return;
    this._tone(t, { type: 'triangle', f0: 180, f1: 40, dur: 0.08, gain: 0.45 });
    this._noise(t, 0.07, { type: 'lowpass', freq: 800, gain: 0.5 });
  }
  s_tommy(t) {
    if (!this._throttle('tommy', 120)) return;
    const n = 3 + (Math.random() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const tt = t + i * 0.05;
      this._noise(tt, 0.04, { type: 'bandpass', freq: 1200, q: 1.2, gain: 0.45 });
      this._tone(tt, { type: 'sine', f0: 120, f1: 60, dur: 0.05, gain: 0.3 });
    }
  }
  s_sniper(t) {
    if (!this._throttle('sniper', 60)) return;
    this._tone(t, { type: 'triangle', f0: 260, f1: 35, dur: 0.18, gain: 0.5 });
    this._noise(t, 0.25, { type: 'lowpass', freq: 2200, gain: 0.55 });
    this._noise(t + 0.05, 0.4, { type: 'bandpass', freq: 500, q: 0.6, gain: 0.12 });
  }
  s_mg(t) {
    if (!this._throttle('mg', 70)) return;
    this._noise(t, 0.035, { type: 'bandpass', freq: 1600, q: 1.5, gain: 0.3 });
    this._tone(t, { type: 'square', f0: 160, f1: 70, dur: 0.04, gain: 0.1 });
  }
  s_paper(t) {
    if (!this._throttle('paper', 80)) return;
    this._noise(t, 0.12, { type: 'highpass', freq: 3000, gain: 0.2 });
  }
  s_melee(t) {
    if (!this._throttle('melee', 50)) return;
    this._tone(t, { type: 'sine', f0: 140, f1: 55, dur: 0.07, gain: 0.35 });
    this._noise(t, 0.05, { type: 'lowpass', freq: 1200, gain: 0.25 });
  }
  s_bite(t) {
    if (!this._throttle('bite', 70)) return;
    this._noise(t, 0.06, { type: 'bandpass', freq: 2500, q: 2, gain: 0.25 });
  }
  s_coin(t) {
    if (!this._throttle('coin', 60)) return;
    this._tone(t, { type: 'sine', f0: 987.77, dur: 0.06, gain: 0.3 });
    this._tone(t + 0.06, { type: 'sine', f0: 1318.51, dur: 0.15, gain: 0.3 });
  }
  s_siren(t) {
    const c = this.ctx;
    const o = c.createOscillator(); o.type = 'triangle';
    o.frequency.value = 800;
    const lfo = c.createOscillator(); lfo.frequency.value = 1.6;
    const lg = c.createGain(); lg.gain.value = 150;
    lfo.connect(lg); lg.connect(o.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.1);
    g.gain.setValueAtTime(0.25, t + 2.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
    o.connect(g); g.connect(this.sfx);
    o.start(t); lfo.start(t); o.stop(t + 2.55); lfo.stop(t + 2.55);
  }
  s_explosion(t, opt) {
    if (!this._throttle('explosion', 80)) return;
    const big = opt && opt.big;
    this._tone(t, { type: 'sine', f0: 100, f1: 25, dur: big ? 0.8 : 0.4, gain: big ? 0.9 : 0.7 });
    this._noise(t, big ? 1.0 : 0.5, { type: 'lowpass', freq: 400, gain: big ? 0.9 : 0.7 });
  }
  s_fire(t) {
    if (!this._throttle('fire', 200)) return;
    this._noise(t, 0.6, { type: 'lowpass', freq: 600, gain: 0.25, attack: 0.08 });
  }
  s_glass(t) {
    this._noise(t, 0.15, { type: 'highpass', freq: 4000, gain: 0.3 });
    this._tone(t, { type: 'sine', f0: 2400, f1: 1800, dur: 0.12, gain: 0.08 });
  }
  s_freeze(t) {
    for (let i = 0; i < 6; i++) this._tone(t + i * 0.04, { type: 'sine', f0: 1200 + Math.random() * 1600, dur: 0.12, gain: 0.08 });
    this._noise(t, 0.3, { type: 'highpass', freq: 5000, gain: 0.1 });
  }
  s_heal(t) {
    if (!this._throttle('heal', 600)) return;
    this._tone(t, { type: 'sine', f0: 660, dur: 0.12, gain: 0.08 });
    this._tone(t + 0.08, { type: 'sine', f0: 880, dur: 0.18, gain: 0.08 });
  }
  s_shield(t) {
    this._tone(t, { type: 'square', f0: 900, f1: 300, dur: 0.15, gain: 0.12 });
    this._noise(t, 0.12, { type: 'highpass', freq: 3000, gain: 0.25 });
  }
  s_ricochet(t, opt) {
    const step = (opt && opt.step) || 0;
    const baseF = 1800 + step * 400; // наростаючий дзвін відскоку (1800 -> 2200 -> 2600 -> 3000 Hz)
    this._tone(t, { type: 'sine', f0: baseF, f1: baseF + 350, dur: 0.08, gain: 0.35 });
    this._tone(t, { type: 'triangle', f0: baseF * 1.5, dur: 0.04, gain: 0.2 });
  }
  s_tire_pop(t) {
    if (!this._throttle('tire_pop', 100)) return;
    this._noise(t, 0.08, { type: 'highpass', freq: 2800, gain: 0.4 });
    this._noise(t + 0.04, 0.25, { type: 'bandpass', freq: 1200, q: 2, gain: 0.35 });
  }
  s_manhole(t) {
    if (!this._throttle('manhole', 200)) return;
    this._tone(t, { type: 'triangle', f0: 320, f1: 90, dur: 0.25, gain: 0.6 });
    this._noise(t, 0.3, { type: 'lowpass', freq: 700, gain: 0.5 });
  }
  s_flak(t) {
    if (!this._throttle('flak', 90)) return;
    this._tone(t, { type: 'sine', f0: 220, f1: 50, dur: 0.22, gain: 0.55 });
    this._noise(t, 0.28, { type: 'bandpass', freq: 1000, q: 1.5, gain: 0.5 });
  }
  s_acid(t) {
    if (!this._throttle('acid', 180)) return;
    this._noise(t, 0.45, { type: 'highpass', freq: 2600, gain: 0.25, attack: 0.05 });
    this._tone(t, { type: 'sine', f0: 420, f1: 180, dur: 0.3, gain: 0.08 });
  }
  s_deploy(t) {
    if (!this._throttle('deploy', 60)) return;
    this._tone(t, { type: 'triangle', f0: 220, f1: 330, dur: 0.12, gain: 0.15 });
  }
  s_engine(t) {
    if (!this._throttle('engine', 300)) return;
    this._tone(t, { type: 'sawtooth', f0: 60, f1: 120, dur: 0.5, gain: 0.08 });
  }
  s_click(t) { this._tone(t, { type: 'square', f0: 700, f1: 500, dur: 0.04, gain: 0.08 }); }
  s_select(t) { this._tone(t, { type: 'triangle', f0: 520, f1: 780, dur: 0.07, gain: 0.12 }); }
  s_error(t) { this._tone(t, { type: 'square', f0: 160, f1: 120, dur: 0.15, gain: 0.12 }); }
  s_crown(t) {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this._tone(t + i * 0.08, { type: 'triangle', f0: f, dur: 0.25, gain: 0.18 }));
  }
  s_victory(t) {
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this._tone(t + i * 0.13, { type: 'triangle', f0: f, dur: 0.45, gain: 0.2 }));
    this._tone(t + 0.7, { type: 'sine', f0: 1046.5, dur: 1.0, gain: 0.15 });
  }
  s_defeat(t) {
    [392, 349.23, 311.13, 261.63].forEach((f, i) => this._tone(t + i * 0.22, { type: 'triangle', f0: f, dur: 0.5, gain: 0.18 }));
  }
  s_chest(t) {
    this._noise(t, 0.3, { type: 'bandpass', freq: 900, gain: 0.3 });
    this._tone(t, { type: 'sine', f0: 200, f1: 80, dur: 0.3, gain: 0.3 });
  }
  s_reveal(t, opt) {
    const r = (opt && opt.rarity) || 'common';
    const base = { common: 600, rare: 700, epic: 820, legendary: 980 }[r];
    this._tone(t, { type: 'triangle', f0: base, dur: 0.15, gain: 0.15 });
    this._tone(t + 0.07, { type: 'triangle', f0: base * 1.5, dur: 0.25, gain: 0.12 });
    if (r === 'legendary' || r === 'epic') this._tone(t + 0.14, { type: 'sine', f0: base * 2, dur: 0.5, gain: 0.12 });
  }
  s_tick(t) { this._tone(t, { type: 'sine', f0: 1000, dur: 0.05, gain: 0.1 }); }

  // =================================================================
  //  ФОНОВА МУЗИКА — процедурний нуар-джаз (меню + арени)
  // =================================================================
  startMusic(bpm = 68) {
    this.unlock();
    if (!this.ctx || !this.musicOn) return;
    if (this.music.playing && this.music.bpm === bpm) return;
    this.stopMusic();
    const m = this.music;
    m.playing = true; m.bpm = bpm; m.step = 0; m.bar = 0; m.tempoMult = 1;
    m.nextTime = this.ctx.currentTime + 0.08;
    m.timer = setInterval(() => this._schedule(), 25);
  }

  setTempoMult(x) { this.music.tempoMult = x; }

  stopMusic() {
    const m = this.music;
    m.playing = false;
    if (m.timer) clearInterval(m.timer);
    m.timer = null;
  }

  _schedule() {
    const m = this.music;
    if (!m.playing || !this.ctx || !this.musicOn) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
      return;
    }
    if (m.nextTime < this.ctx.currentTime) {
      m.nextTime = this.ctx.currentTime + 0.05;
    }
    while (m.nextTime < this.ctx.currentTime + 0.14) {
      this._musicStep(m.step, m.nextTime);
      const beat = 60 / (m.bpm * m.tempoMult);
      const eighth = beat / 2;
      const swing = (m.step % 2 === 0) ? eighth * 1.32 : eighth * 0.68;
      m.nextTime += swing;
      m.step = (m.step + 1) % 32;
      if (m.step === 0) m.bar++;
    }
  }

  _musicStep(step, t) {
    const bpm = this.music.bpm;
    // Прогресія Am7 – Dm7 – E7 – Am7 (нуар-джаз)
    const chordTones = [
      [110, 130.81, 164.81, 196],
      [146.83, 174.61, 220, 261.63],
      [164.81, 207.65, 246.94, 293.66],
      [110, 130.81, 164.81, 220],
    ];
    const bar = Math.floor(step / 8);
    const inBar = step % 8;

    // Контрабас (Walking Bass) — добре чутний навіть на динаміках телефону
    if (inBar % 2 === 0) {
      const tones = chordTones[bar];
      const walk = [tones[0], tones[1], tones[2], tones[3] * (inBar === 6 ? 0.94 : 1)];
      const f = walk[inBar / 2] * 0.5;
      this._tone(t, { type: 'triangle', f0: f * 2, dur: 0.34, gain: 0.42, attack: 0.008, dest: this.mus });
      this._tone(t, { type: 'sawtooth', f0: f * 2, dur: 0.18, gain: 0.09, attack: 0.005, dest: this.mus });
    }

    // Щітки ударних / хай-хет
    const hatGain = bpm >= 100 ? 0.15 : 0.11;
    this._musNoise(t, 0.05, 6500, inBar % 4 === 2 ? hatGain * 1.4 : hatGain * 0.8);

    // М'яка джазова бочка
    if (inBar === 0 || (bpm >= 95 && inBar === 4)) {
      this._musKick(t, bpm >= 85 ? 0.48 : 0.35);
    }

    // Rimshot / малий барабан на 2 і 4
    if (inBar === 2 || inBar === 6) {
      this._musNoise(t, 0.075, 1700, 0.14);
    }

    // Акорди піаніно / вібрафона
    if (inBar === 1 || inBar === 5) {
      for (const f of chordTones[bar]) {
        this._tone(t, { type: 'sine', f0: f * 2, dur: 0.38, gain: 0.075, attack: 0.01, dest: this.mus });
      }
    }

    // Соло нуарного саксофона/кларнета
    const melodyPattern = [220, 261.63, 293.66, 311.13, 329.63, 392, 440];
    if ((inBar === 0 || inBar === 3 || inBar === 6) && (this.music.bar + bar) % 2 === 0) {
      const idx = (step * 3 + this.music.bar) % melodyPattern.length;
      const mf = melodyPattern[idx];
      this._tone(t, { type: 'triangle', f0: mf * 2, dur: 0.28, gain: 0.09, attack: 0.02, dest: this.mus });
    }
  }

  _musNoise(t, dur, freq, gain) {
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.mus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  _musKick(t, gain) {
    this._tone(t, { type: 'sine', f0: 130, f1: 42, dur: 0.18, gain, dest: this.mus });
  }
}

export const Audio = new AudioEngine();
