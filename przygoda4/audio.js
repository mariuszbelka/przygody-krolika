// Dźwięk Przygody 4 – wszystko syntezowane w WebAudio.
// Kaskady grają kolejne nuty skali pentatonicznej, więc długa kaskada brzmi jak melodyjka.
(function () {
  'use strict';
  const KEY = 'PuszekP4.music';
  const MUSIC_LEVEL = 0.16;
  let musicOn = true;
  try { musicOn = localStorage.getItem(KEY) !== '0'; } catch (e) { /* brak storage */ }

  // C-dur pentatonika przez 3 oktawy
  const PENTA = [];
  [523.25, 587.33, 659.25, 783.99, 880.0].forEach((f) => PENTA.push(f));
  [1046.5, 1174.66, 1318.51, 1567.98, 1760.0].forEach((f) => PENTA.push(f));
  [2093.0, 2349.32].forEach((f) => PENTA.push(f));

  const A = {
    ctx: null, master: null, sfx: null, music: null, echo: null, noiseBuf: null, last: Object.create(null),
    get musicOn() { return musicOn; },
    ensure() {
      if (this.ctx) return this.ctx;
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try {
        const c = this.ctx = new C();
        this.master = c.createGain(); this.master.gain.value = 0.9;
        const comp = c.createDynamicsCompressor();
        comp.threshold.value = -14; comp.ratio.value = 4;
        this.master.connect(comp); comp.connect(c.destination);
        this.sfx = c.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master);
        this.music = c.createGain(); this.music.gain.value = musicOn ? MUSIC_LEVEL : 0; this.music.connect(this.master);
        // echo dla „błysków”
        this.echo = c.createGain(); this.echo.gain.value = 0.3;
        const d = c.createDelay(0.5); d.delayTime.value = 0.16;
        const fb = c.createGain(); fb.gain.value = 0.32;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
        this.echo.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(this.master);
        const len = c.sampleRate;
        this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
        const ch = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i += 1) ch[i] = Math.random() * 2 - 1;
      } catch (e) { this.ctx = null; }
      return this.ctx;
    },
    resume() { const c = this.ensure(); if (c && c.state === 'suspended') c.resume().catch(() => {}); this.startMusic(); },
    toggleMusic() {
      musicOn = !musicOn;
      try { localStorage.setItem(KEY, musicOn ? '1' : '0'); } catch (e) { /* */ }
      if (this.music) this.music.gain.setTargetAtTime(musicOn ? MUSIC_LEVEL : 0, this.ctx.currentTime, 0.1);
      return musicOn;
    },
    gate(name, ms) { const now = performance.now(); if (this.last[name] && now - this.last[name] < ms) return false; this.last[name] = now; return true; },

    tone(freq, dur, type = 'sine', vol = 0.15, slide = 0, off = 0, opts = {}) {
      const c = this.ctx; if (!c) return;
      const t = c.currentTime + off;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
      if (opts.vib) { const l = c.createOscillator(); const lg = c.createGain(); l.frequency.value = opts.vib; lg.gain.value = freq * 0.04; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (opts.att || 0.006));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(opts.bus || this.sfx);
      if (opts.echo) g.connect(this.echo);
      o.start(t); o.stop(t + dur + 0.05);
    },
    noise(dur, vol, type = 'bandpass', f0 = 1000, f1 = 0, off = 0, q = 1, opts = {}) {
      const c = this.ctx; if (!c) return;
      const t = c.currentTime + off;
      const s = c.createBufferSource(); s.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
      f.frequency.setValueAtTime(f0, t);
      if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (opts.att || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.sfx);
      if (opts.echo) g.connect(this.echo);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    },
    bell(freq, off = 0, vol = 0.09) {
      this.tone(freq, 0.6, 'sine', vol, 0, off, { echo: true });
      this.tone(freq * 2.01, 0.35, 'sine', vol * 0.4, 0, off, { echo: true });
      this.tone(freq * 3.02, 0.18, 'triangle', vol * 0.18, 0, off);
    },

    // ---------------- efekty gry
    cue(name, a = {}) {
      if (!this.ctx) return;
      switch (name) {
        case 'click': this.tone(880, 0.06, 'triangle', 0.08, 1200); break;
        case 'select': this.tone(660, 0.07, 'sine', 0.08, 880); break;
        case 'swap':
          this.noise(0.12, 0.05, 'bandpass', 900, 2600, 0, 2);
          this.tone(440, 0.08, 'triangle', 0.05, 620);
          break;
        case 'bad':
          this.tone(300, 0.1, 'square', 0.05, 260);
          this.tone(220, 0.14, 'square', 0.05, 180, 0.09);
          break;
        case 'match': {
          if (!this.gate('match', 50)) return;
          const n = Math.min(PENTA.length - 3, (a.cascade || 1) - 1 + Math.floor((a.size || 3) / 5));
          const f = PENTA[n];
          this.tone(f, 0.22, 'triangle', 0.11, 0, 0, { echo: (a.cascade || 1) > 2 });
          this.tone(f * 1.5, 0.16, 'sine', 0.05, 0, 0.02);
          this.noise(0.05, 0.05, 'highpass', 3000, 0, 0, 0.7);
          if ((a.size || 3) >= 5) this.tone(PENTA[n + 2], 0.18, 'sine', 0.06, 0, 0.06, { echo: true });
          break;
        }
        case 'pop': if (this.gate('pop', 30)) this.noise(0.04, 0.04, 'bandpass', 2400, 0, 0, 3); break;
        case 'create':
          [0, 2, 4].forEach((k, i) => this.tone(PENTA[3 + k], 0.2, 'sine', 0.08, 0, i * 0.05, { echo: true }));
          this.noise(0.3, 0.03, 'highpass', 6000, 0, 0, 0.5, { echo: true });
          break;
        case 'rocket':
          if (!this.gate('rocket', 60)) return;
          this.noise(0.35, 0.09, 'bandpass', 600, 4200, 0, 1.5);
          this.tone(300, 0.3, 'sawtooth', 0.04, 1400);
          break;
        case 'bomb':
          if (!this.gate('bomb', 80)) return;
          this.tone(140, 0.5, 'sine', 0.28, 38);
          this.noise(0.5, 0.18, 'lowpass', 1800, 120, 0, 0.7);
          this.noise(0.15, 0.08, 'highpass', 2500, 0, 0, 0.5);
          break;
        case 'fly':
          for (let k = 0; k < 6; k += 1) this.tone(700 + k * 60, 0.05, 'triangle', 0.04, 900 + k * 60, k * 0.035);
          this.noise(0.25, 0.04, 'bandpass', 1500, 3500, 0, 2);
          break;
        case 'yarn':
          for (let k = 0; k < 10; k += 1) this.tone(PENTA[k], 0.16, 'sine', 0.06, 0, k * 0.03, { echo: true });
          this.noise(0.6, 0.04, 'highpass', 5000, 0, 0, 0.5, { echo: true });
          break;
        case 'combo':
          this.tone(110, 0.6, 'sine', 0.22, 50);
          for (let k = 0; k < 6; k += 1) this.tone(PENTA[2 + k], 0.25, 'triangle', 0.07, 0, k * 0.045, { echo: true });
          this.noise(0.4, 0.1, 'bandpass', 800, 5000, 0, 1.2);
          break;
        case 'land': if (this.gate('land', 70)) this.tone(180, 0.05, 'sine', 0.04, 120); break;
        case 'crate': if (this.gate('crate', 50)) { this.noise(0.12, 0.12, 'bandpass', 700, 300, 0, 2); this.tone(160, 0.08, 'square', 0.03, 90); } break;
        case 'web': if (this.gate('web', 50)) this.noise(0.15, 0.06, 'highpass', 4000, 9000, 0, 1); break;
        case 'weed': if (this.gate('weed', 50)) { this.noise(0.18, 0.05, 'bandpass', 1200, 500, 0, 1.2); this.tone(520, 0.08, 'triangle', 0.03, 380); } break;
        case 'bling': if (this.gate('bling', 50)) { this.bell(2349, 0, 0.05); this.bell(3136, 0.04, 0.04); } break;
        case 'jar': this.bell(1046.5); this.bell(1318.5, 0.08); this.bell(1568, 0.16); break;
        case 'bossHit':
          if (!this.gate('bossHit', 120)) return;
          this.tone(1300, 0.08, 'sawtooth', 0.05, 900, 0, { vib: 30 });
          this.tone(1100, 0.12, 'sawtooth', 0.05, 700, 0.07, { vib: 30 });
          break;
        case 'bossCover':
          for (let k = 0; k < 5; k += 1) this.tone(1500 - k * 90, 0.06, 'sawtooth', 0.035, 1200 - k * 90, k * 0.07, { vib: 40 });
          this.noise(0.3, 0.04, 'bandpass', 1800, 2400, 0.1, 3);
          break;
        case 'shuffle':
          for (let k = 0; k < 8; k += 1) this.tone(400 + (k % 4) * 120, 0.06, 'triangle', 0.04, 0, k * 0.04);
          break;
        case 'heroReady': this.bell(1568); this.bell(2093, 0.1); break;
        case 'dig':
          for (let k = 0; k < 5; k += 1) this.noise(0.08, 0.1, 'lowpass', 900, 300, k * 0.07, 1);
          this.tone(200, 0.4, 'sine', 0.12, 70, 0.05);
          break;
        case 'claw':
          for (let k = 0; k < 3; k += 1) this.noise(0.09, 0.12, 'highpass', 2500, 6000, k * 0.08, 1);
          this.tone(900, 0.2, 'sawtooth', 0.04, 500, 0, { vib: 25 });
          break;
        case 'word': {
          const lv = a.level || 1;
          const seq = lv >= 3 ? [0, 2, 4, 5, 7] : lv === 2 ? [0, 2, 4, 7] : [0, 4, 7];
          seq.forEach((k, i) => this.tone(PENTA[Math.min(PENTA.length - 1, 2 + k)], 0.2, 'square', 0.045, 0, i * 0.06, { echo: true }));
          if (lv >= 3) this.noise(0.3, 0.06, 'lowpass', 300, 100, 0, 0.6);
          break;
        }
        case 'star': this.bell(PENTA[4 + (a.n || 0) * 2], 0, 0.1); break;
        case 'win':
          [0, 2, 4, 5, 7, 9].forEach((k, i) => this.tone(PENTA[k], 0.3, 'triangle', 0.09, 0, i * 0.09, { echo: true }));
          this.tone(130.8, 0.8, 'sine', 0.12, 0, 0.1);
          break;
        case 'lose':
          [523, 466, 415, 349].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.08, 0, i * 0.16));
          break;
        case 'moves': this.tone(990, 0.08, 'square', 0.04, 0); this.tone(990, 0.08, 'square', 0.04, 0, 0.12); break;
        case 'reward': for (let k = 0; k < 8; k += 1) this.bell(PENTA[k], k * 0.06, 0.06); this.tone(130.8, 0.6, 'sine', 0.12, 65, 0); break;
        case 'boing': this.tone(180, 0.35, 'sine', 0.14, 620, 0, { vib: 12 }); this.tone(620, 0.2, 'triangle', 0.05, 300, 0.25); break;
        case 'giggle': for (let k = 0; k < 5; k += 1) this.tone(900 + (k % 2) * 160, 0.07, 'triangle', 0.06, 0, k * 0.08); break;
        case 'crunch': this.noise(0.08, 0.14, 'lowpass', 2500, 600, 0, 1); this.noise(0.06, 0.08, 'bandpass', 3000, 0, 0.05, 2); break;
        case 'sneeze': this.noise(0.25, 0.16, 'bandpass', 1800, 5000, 0, 1.5); this.tone(700, 0.15, 'square', 0.04, 300); break;
        case 'meow': this.tone(560, 0.16, 'sawtooth', 0.05, 900, 0, { vib: 8 }); this.tone(900, 0.28, 'sawtooth', 0.05, 480, 0.14, { vib: 8 }); break;
        case 'yawn': this.tone(420, 0.8, 'sine', 0.08, 220, 0, { vib: 5, att: 0.2 }); this.noise(0.6, 0.03, 'lowpass', 900, 300, 0.1, 0.7); break;
        case 'purr': for (let k = 0; k < 24; k += 1) this.noise(0.05, 0.08, 'lowpass', 160, 0, k * 0.055, 0.8); break;
        default: break;
      }
    },

    // ---------------- muzyczka: spokojne arpeggio w C-dur, 90 bpm
    startMusic() {
      if (!this.ctx || this.musicTimer) return;
      const c = this.ctx;
      const beat = 60 / 90 / 2;
      const chords = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]];
      const mel = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 7, 5, 4, 2, 0];
      let step = 0;
      let next = c.currentTime + 0.1;
      const tick = () => {
        while (next < c.currentTime + 0.4) {
          const ch = chords[Math.floor(step / 8) % 4];
          const f = ch[step % 3] * (step % 4 === 3 ? 2 : 1);
          this.tone(f, beat * 1.6, 'triangle', 0.07, 0, next - c.currentTime, { bus: this.music, att: 0.01 });
          if (step % 8 === 0) this.tone(ch[0] / 2, beat * 7, 'sine', 0.1, 0, next - c.currentTime, { bus: this.music, att: 0.05 });
          if (step % 2 === 0 && Math.floor(step / 16) % 2 === 1) {
            const m = mel[(step / 2) % mel.length];
            this.tone(PENTA[m] / 2, beat * 1.8, 'sine', 0.05, 0, next - c.currentTime, { bus: this.music, att: 0.02 });
          }
          step += 1;
          next += beat;
        }
      };
      this.musicTimer = setInterval(tick, 120);
      tick();
    }
  };
  window.Audio4 = A;
})();
