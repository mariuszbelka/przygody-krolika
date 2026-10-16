// Dźwięk: efekty (zawsze) + spokojna muzyczka (przełączana). Wszystko syntezowane w WebAudio.
(function () {
  'use strict';
  const MUSIC_LEVEL = 0.22;
  const KEY = 'PuszekPersiSroka.music';
  let musicOn = true;
  try { musicOn = localStorage.getItem(KEY) !== '0'; } catch (e) { /* brak storage */ }

  const A = {
    ctx: null, master: null, musicBus: null, sfxBus: null, noiseBuf: null,
    last: Object.create(null),
    get musicOn() { return musicOn; },
    ensure() {
      if (this.ctx) return this.ctx;
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      try {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.8;
        const comp = this.ctx.createDynamicsCompressor();
        this.master.connect(comp);
        comp.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = musicOn ? MUSIC_LEVEL : 0;
        this.musicBus.connect(this.master);
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.connect(this.master);
      } catch (e) { this.ctx = null; }
      return this.ctx;
    },
    resume() {
      const c = this.ensure();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
    },
    tone(freq, dur, type = 'square', vol = 0.12, slide = 0, off = 0, bus = 'sfx') {
      const c = this.ctx;
      if (!c) return;
      const o = c.createOscillator();
      const g = c.createGain();
      const t = c.currentTime + off;
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(24, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(bus === 'music' ? this.musicBus : this.sfxBus);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur, vol, type = 'bandpass', f0 = 1000, f1 = 0, off = 0, q = 1) {
      const c = this.ctx;
      if (!c) return;
      if (!this.noiseBuf) {
        const n = Math.floor(c.sampleRate);
        this.noiseBuf = c.createBuffer(1, n, c.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < n; i += 1) d[i] = Math.random() * 2 - 1;
      }
      const t = c.currentTime + off;
      const src = c.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = c.createBiquadFilter();
      f.type = type;
      f.Q.value = q;
      f.frequency.setValueAtTime(f0, t);
      if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.sfxBus);
      src.start(t, Math.random() * 0.4);
      src.stop(t + dur + 0.02);
    },
    duck(depth = 0.45, hold = 0.25) {
      if (!this.musicBus || !musicOn) return;
      const t = this.ctx.currentTime;
      const g = this.musicBus.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(Math.max(0.0001, g.value), t);
      g.linearRampToValueAtTime(MUSIC_LEVEL * depth, t + 0.03);
      g.setTargetAtTime(MUSIC_LEVEL, t + hold, 0.2);
    },
    cue(name, opt = {}) {
      this.resume();
      if (!this.ctx) return;
      const now = performance.now();
      const gap = { step: 60, blocked: 150, switchTo: 80 }[name] || 0;
      if (gap && now - (this.last[name] || 0) < gap) return;
      this.last[name] = now;
      const who = opt.who;
      switch (name) {
        case 'step':
          if (who === 'C') { this.noise(0.04, 0.03, 'bandpass', 900, 0, 0, 1.6); }
          else { this.noise(0.03, 0.03, 'bandpass', 1700 + Math.random() * 400, 0, 0, 1.4); this.tone(520, 0.04, 'sine', 0.02, 640, 0); }
          break;
        case 'climb':
          this.tone(who === 'C' ? 260 : 340, 0.10, 'triangle', 0.09, who === 'C' ? 520 : 680, 0);
          break;
        case 'land':
          this.noise(0.08, 0.08, 'lowpass', 500, 160, 0, 0.8);
          this.tone(120, 0.08, 'sine', 0.08, 60, 0);
          break;
        case 'crateLand':
          this.noise(0.12, 0.14, 'lowpass', 700, 120, 0, 0.8);
          this.tone(90, 0.12, 'sine', 0.12, 50, 0);
          break;
        case 'push':
          this.noise(0.18, 0.08, 'bandpass', 420, 260, 0, 2.5);
          break;
        case 'blocked':
          this.tone(150, 0.06, 'square', 0.035, 120, 0);
          break;
        case 'dig':
          this.duck(0.6, 0.2);
          this.noise(0.18, 0.13, 'bandpass', 900, 300, 0, 0.9);
          [0.05, 0.1, 0.15].forEach((t) => this.noise(0.03, 0.05, 'bandpass', 2400, 0, t, 2));
          break;
        case 'scratch':
          this.duck(0.6, 0.2);
          [0, 0.07, 0.14].forEach((t) => this.noise(0.05, 0.08, 'highpass', 3000, 6000, t, 0.8));
          this.tone(900, 0.12, 'sawtooth', 0.02, 500, 0.14);
          break;
        case 'lever':
          this.tone(opt.on ? 700 : 500, 0.05, 'square', 0.06, 0, 0);
          this.noise(0.04, 0.06, 'bandpass', 2500, 0, 0.03, 2);
          break;
        case 'plateDown':
          this.duck(0.5, 0.3);
          this.tone(330, 0.08, 'triangle', 0.10, 0, 0);
          this.tone(495, 0.14, 'triangle', 0.09, 0, 0.07);
          this.noise(0.25, 0.04, 'bandpass', 300, 600, 0.05, 2);
          break;
        case 'plateUp':
          this.tone(495, 0.08, 'triangle', 0.08, 0, 0);
          this.tone(330, 0.14, 'triangle', 0.08, 0, 0.07);
          break;
        case 'switchTo':
          if (who === 'C') { this.tone(760, 0.08, 'triangle', 0.07, 980, 0); this.tone(660, 0.1, 'sine', 0.05, 560, 0.06); }
          else { this.tone(520, 0.05, 'sine', 0.07, 780, 0); this.tone(780, 0.07, 'sine', 0.05, 1040, 0.04); }
          break;
        case 'star':
          this.duck(0.3, 0.6);
          [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.16, 'sine', 0.10, f * 1.01, i * 0.06));
          break;
        case 'undo':
          this.tone(600, 0.08, 'sine', 0.05, 380, 0);
          break;
        case 'restart':
          this.tone(500, 0.12, 'triangle', 0.06, 250, 0);
          break;
        case 'win':
          this.duck(0.1, 1.6);
          [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.18, 'square', 0.09, 0, i * 0.09));
          this.tone(1568, 0.5, 'triangle', 0.05, 0, 0.5);
          break;
        case 'click':
          this.tone(880, 0.04, 'sine', 0.05, 0, 0);
          break;
        case 'hint':
          this.tone(660, 0.12, 'sine', 0.06, 0, 0);
          this.tone(880, 0.16, 'sine', 0.05, 0, 0.09);
          break;
      }
    },
    // spokojna pozytywka
    musicStep: 0,
    musicTimer: 0,
    song: {
      lead: [72, 0, 76, 0, 79, 0, 76, 74, 72, 0, 67, 0, 69, 0, 72, 0, 74, 0, 77, 0, 81, 0, 79, 77, 76, 0, 74, 0, 72, 0, 0, 0],
      bass: [48, 0, 0, 0, 55, 0, 0, 0, 57, 0, 0, 0, 53, 0, 0, 0, 50, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 0, 48, 0, 0, 0]
    },
    tick(dt, active) {
      if (!this.ctx || !musicOn || !active) return;
      this.musicTimer -= dt;
      if (this.musicTimer > 0) return;
      this.musicTimer += 0.21;
      const i = this.musicStep % this.song.lead.length;
      const f = (m) => 440 * Math.pow(2, (m - 69) / 12);
      const l = this.song.lead[i];
      const b = this.song.bass[i];
      if (l) { this.tone(f(l), 0.45, 'triangle', 0.10, 0, 0, 'music'); this.tone(f(l + 12), 0.25, 'sine', 0.03, 0, 0, 'music'); }
      if (b) this.tone(f(b), 0.9, 'sine', 0.16, 0, 0, 'music');
      this.musicStep += 1;
    },
    toggleMusic() {
      musicOn = !musicOn;
      try { localStorage.setItem(KEY, musicOn ? '1' : '0'); } catch (e) { /* */ }
      this.resume();
      if (this.musicBus) {
        const t = this.ctx.currentTime;
        this.musicBus.gain.cancelScheduledValues(t);
        this.musicBus.gain.setTargetAtTime(musicOn ? MUSIC_LEVEL : 0, t, 0.05);
      }
      return musicOn;
    }
  };
  window.Sfx = A;
})();
