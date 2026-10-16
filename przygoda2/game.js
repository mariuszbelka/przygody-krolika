// Puszek i Persi: Sroka Złodziejka – turowa gra logiczna dla dwóch postaci.
(function () {
  'use strict';
  const R = window.Rules;
  const LEVELS = window.LEVELDATA.LEVELS;
  const Art = window.Art;
  const Sfx = window.Sfx;
  const W = 768;
  const H = 480;
  const CELL = 48;
  const FONT = '"Fredoka", "Trebuchet MS", sans-serif';
  const PIX = '"Press Start 2P", "Courier New", monospace';
  const STORE = 'PuszekPersiSroka.v1';
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const TOUCH = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (TOUCH) document.body.classList.add('touch');

  const WORLD_NAMES = ['Ogród', 'Szopa', 'Piwnica', 'Wieża Sroki'];
  const NAMES = { P: 'Puszek', C: 'Persi' };

  // ---------- zapis postępu ----------
  let progress = { solved: {}, seenIntro: false };
  try { const raw = localStorage.getItem(STORE); if (raw) progress = Object.assign(progress, JSON.parse(raw)); } catch (e) { /* */ }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(progress)); } catch (e) { /* */ } };
  const unlockedUpTo = () => { let i = 0; while (i < LEVELS.length && progress.solved[i]) i += 1; return Math.min(i, LEVELS.length - 1); };

  // ---------- stan gry ----------
  const G = {
    scene: 'title', t: 0, levelIndex: 0,
    geo: null, s: null, hist: [], moves: 0, active: 'P', face: { P: 1, C: 1 },
    disp: null, doors: {}, parts: [], toast: null, hint: 0, card: 0, won: 0, shake: 0,
    sel: 0, hover: null, queue: [], buttons: []
  };

  function loadLevel(i) {
    G.levelIndex = i;
    const lv = LEVELS[i];
    const { geo, state } = R.parse(lv);
    G.geo = geo;
    G.s = state;
    G.hist = [];
    G.moves = 0;
    G.active = 'P';
    G.face = { P: 1, C: 1 };
    G.hint = 0;
    G.won = 0;
    G.card = 150;
    G.parts = [];
    G.queue = [];
    G.toast = lv.story ? { text: lv.story, who: lv.storyWho || 'P', t: 420 } : null;
    snapDisplay();
    G.doors = {};
    for (let k = 0; k < geo.base.length; k += 1) if ('XYZLMK'.includes(geo.base[k])) G.doors[k] = R.doorOpen(geo, state, k) ? 1 : 0;
    G.scene = 'play';
  }

  function cellXY(i) { const x = i % G.geo.w; return [x, (i - x) / G.geo.w]; }

  function snapDisplay() {
    const mk = (i) => { const [x, y] = cellXY(i); return { x, y, path: [], vy: 0, fallFrom: null, moving: false, walkT: 0 }; };
    G.disp = { P: mk(G.s.P), C: mk(G.s.C), B: G.s.crates.map(mk) };
  }

  // ---------- animacja ruchu ----------
  function plan(prev, next, events, who, d) {
    const add = (ent, pts) => { ent.path.push(...pts.map(([x, y]) => ({ x, y }))); };
    const pos = (i) => cellXY(i);
    for (const e of events) {
      if (e.type === 'walk') { const [x, y] = pos(prev[who]); add(G.disp[who], [[x + d, y]]); }
      if (e.type === 'climb') { const [x, y] = pos(prev[who]); add(G.disp[who], [[x, y - e.h], [x + d, y - e.h]]); }
      if (e.type === 'push') {
        const [x, y] = pos(prev[who]);
        add(G.disp[who], [[x + d, y]]);
        const [cx, cy] = pos(prev.crates[e.k]);
        add(G.disp.B[e.k], [[cx + d, cy]]);
      }
    }
    const fin = (ent, i) => { const [x, y] = pos(i); const last = ent.path.length ? ent.path[ent.path.length - 1] : { x: ent.x, y: ent.y }; if (last.x !== x || last.y !== y) ent.path.push({ x, y }); };
    fin(G.disp.P, next.P);
    fin(G.disp.C, next.C);
    next.crates.forEach((c, k) => fin(G.disp.B[k], c));
  }

  function animating() {
    const e = [G.disp.P, G.disp.C].concat(G.disp.B);
    return e.some((d) => d.path.length);
  }

  function stepAnim(dt) {
    const ents = [['P', G.disp.P], ['C', G.disp.C]].concat(G.disp.B.map((d) => ['B', d]));
    for (const [kind, d] of ents) {
      d.moving = false;
      if (!d.path.length) { d.vy = 0; continue; }
      const tgt = d.path[0];
      const dx = tgt.x - d.x;
      const dy = tgt.y - d.y;
      d.moving = true;
      if (dy > 0 && Math.abs(dx) < 0.001) {
        if (d.fallFrom === null) d.fallFrom = d.y;
        d.vy = Math.min(16, d.vy + 46 * dt);
        d.y = Math.min(tgt.y, d.y + d.vy * dt);
      } else {
        const sp = 7.5 * dt;
        d.x += Math.sign(dx) * Math.min(Math.abs(dx), sp);
        d.y += Math.sign(dy) * Math.min(Math.abs(dy), sp);
        d.walkT += dt;
      }
      if (Math.abs(d.x - tgt.x) < 0.001 && Math.abs(d.y - tgt.y) < 0.001) {
        d.x = tgt.x;
        d.y = tgt.y;
        d.path.shift();
        if (d.fallFrom !== null && !(d.path.length && d.path[0].y > d.y)) {
          if (d.y - d.fallFrom >= 0.9) {
            Sfx.cue(kind === 'B' ? 'crateLand' : 'land');
            dust(d.x + 0.5, d.y + 1, kind === 'B' ? 10 : 6);
            if (kind === 'B') G.shake = 6;
          }
          d.fallFrom = null;
          d.vy = 0;
        }
        if (kind !== 'B' && d.path.length && d.path[0].y === d.y) Sfx.cue('step', { who: kind });
      }
    }
  }

  // ---------- cząsteczki ----------
  function dust(cx, cy, n, col) {
    for (let k = 0; k < n; k += 1) G.parts.push({ x: cx * CELL + (Math.random() - 0.5) * 30, y: cy * CELL - 2, vx: (Math.random() - 0.5) * 80, vy: -Math.random() * 90, life: 0.5 + Math.random() * 0.3, c: col || 'rgba(230,210,170,0.9)', s: 3 });
  }
  function burst(cx, cy, cols, n = 24) {
    for (let k = 0; k < n; k += 1) { const a = Math.random() * Math.PI * 2; const v = 60 + Math.random() * 160; G.parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.8 + Math.random() * 0.6, c: cols[k % cols.length], s: 4, g: 1 }); }
  }

  // ---------- akcje gracza ----------
  function commit(res, who, d) {
    if (!res.changed) return false;
    G.hist.push({ s: G.s, active: G.active, face: Object.assign({}, G.face), moves: G.moves });
    const prev = G.s;
    G.s = res.state;
    G.moves += 1;
    plan(prev, res.state, res.events, who, d || 0);
    for (const e of res.events) {
      if (e.type === 'walk') Sfx.cue('step', { who });
      if (e.type === 'climb') Sfx.cue('climb', { who });
      if (e.type === 'push') Sfx.cue('push');
      if (e.type === 'dig') { Sfx.cue('dig'); const [x, y] = cellXY(e.at); dust(x + 0.5, y + 1, 18, '#B88650'); G.shake = 3; }
      if (e.type === 'scratch') { Sfx.cue('scratch'); const [x, y] = cellXY(e.at); dust(x + 0.5, y + 0.6, 10, '#E8D2A0'); }
      if (e.type === 'lever') Sfx.cue('lever', { on: e.on });
      if (e.type === 'plateDown') Sfx.cue('plateDown');
      if (e.type === 'plateUp') Sfx.cue('plateUp');
      if (e.type === 'star') { Sfx.cue('star'); G.toast = { text: 'Złota marchewka! Sroka jej nie dostanie.', who, t: 200 }; }
    }
    return true;
  }

  function doMove(d) {
    const who = G.active;
    G.face[who] = d;
    const res = R.move(G.geo, G.s, who, d);
    if (!commit(res, who, d)) { Sfx.cue('blocked'); G.disp[who].bump = 0.18 * d; }
  }

  function doAction() {
    const who = G.active;
    const here = G.geo.base[G.s[who]];
    const tries = [];
    if (here === 'l' || here === 'm') tries.push('here');
    if (who === 'P') tries.push(G.face.P, 'down');
    else tries.push(G.face.C, 'up', -G.face.C);
    for (const t of tries) {
      const res = R.act(G.geo, G.s, who, t);
      if (commit(res, who, 0)) return;
    }
    Sfx.cue('blocked');
    G.toast = { text: who === 'P' ? 'Puszek kopie tylko miękką ziemię – obok albo pod sobą.' : 'Persi drapie liny – obok siebie albo nad głową. Dźwignię przełączy, gdy na niej stoi.', who, t: 220 };
  }

  function doSwitch(to) {
    G.active = to || (G.active === 'P' ? 'C' : 'P');
    Sfx.cue('switchTo', { who: G.active });
  }

  function doUndo() {
    const h = G.hist.pop();
    if (!h) return;
    G.s = h.s;
    G.active = h.active;
    G.face = h.face;
    G.moves = h.moves;
    G.won = 0;
    snapDisplay();
    Sfx.cue('undo');
  }

  function doRestart() {
    if (!G.hist.length) return;
    G.hist.push({ s: G.s, active: G.active, face: Object.assign({}, G.face), moves: G.moves });
    const { state } = R.parse(LEVELS[G.levelIndex]);
    G.s = state;
    G.moves = 0;
    G.won = 0;
    G.active = 'P';
    snapDisplay();
    Sfx.cue('restart');
  }

  function doHint() {
    const hints = LEVELS[G.levelIndex].hints || [];
    if (!hints.length) return;
    const k = Math.min(G.hint, hints.length - 1);
    G.toast = { text: `Podpowiedź ${k + 1}/${hints.length}: ${hints[k]}`, who: 'hint', t: 600 };
    G.hint = Math.min(G.hint + 1, hints.length);
    Sfx.cue('hint');
  }

  function input(cmd) {
    Sfx.resume();
    if (G.scene === 'title') { if (cmd === 'ok' || cmd === 'act') goSelect(); return; }
    if (G.scene === 'select') {
      const n = LEVELS.length;
      if (cmd === 'left') G.sel = Math.max(0, G.sel - 1);
      if (cmd === 'right') G.sel = Math.min(n - 1, G.sel + 1);
      if (cmd === 'up') G.sel = Math.max(0, G.sel - 4);
      if (cmd === 'down') G.sel = Math.min(n - 1, G.sel + 4);
      if (['left', 'right', 'up', 'down'].includes(cmd)) Sfx.cue('click');
      if ((cmd === 'ok' || cmd === 'act') && G.sel <= unlockedUpTo()) loadLevel(G.sel);
      if (cmd === 'menu') G.scene = 'title';
      return;
    }
    if (G.scene === 'clear') {
      if (cmd === 'ok' || cmd === 'act') nextLevel();
      if (cmd === 'restart') loadLevel(G.levelIndex);
      if (cmd === 'menu') goSelect();
      return;
    }
    if (G.scene === 'ending') { if (cmd === 'ok' || cmd === 'act' || cmd === 'menu') goSelect(); return; }
    if (G.scene !== 'play') return;
    if (G.card > 0 && cmd !== 'menu') G.card = Math.min(G.card, 10);
    if (G.won) return;
    if (cmd === 'undo') { doUndo(); return; }
    if (cmd === 'restart') { doRestart(); return; }
    if (cmd === 'hint') { doHint(); return; }
    if (cmd === 'menu') { goSelect(); return; }
    if (cmd === 'music') { Sfx.toggleMusic(); return; }
    if (cmd === 'switch') { doSwitch(); return; }
    if (cmd === 'selP' || cmd === 'selC') { if (G.active !== cmd[3]) doSwitch(cmd[3]); return; }
    if (animating()) { if (G.queue.length < 2) G.queue.push(cmd); return; }
    run(cmd);
  }

  function run(cmd) {
    if (cmd === 'left') doMove(-1);
    else if (cmd === 'right') doMove(1);
    else if (cmd === 'act' || cmd === 'down' || cmd === 'up') doAction();
  }

  function goSelect() {
    G.scene = 'select';
    G.sel = Math.min(unlockedUpTo(), LEVELS.length - 1);
    if (!progress.seenIntro) { progress.seenIntro = true; save(); }
  }

  function nextLevel() {
    if (G.levelIndex + 1 >= LEVELS.length) { G.scene = 'ending'; G.t = 0; return; }
    loadLevel(G.levelIndex + 1);
  }

  function checkWin() {
    if (G.s.won && !G.won && !animating()) {
      G.won = 1;
      Sfx.cue('win');
      burst((G.disp.P.x + 0.5) * CELL, G.disp.P.y * CELL, ['#FFD54A', '#FF9CCF', '#9AD8FF', '#FFFFFF'], 40);
      const lv = LEVELS[G.levelIndex];
      const prev = progress.solved[G.levelIndex] || {};
      const par = lv.par || 0;
      const rec = {
        best: prev.best ? Math.min(prev.best, G.moves) : G.moves,
        carrot: !!(prev.carrot || G.s.star),
        par: !!(prev.par || (par && G.moves <= par))
      };
      progress.solved[G.levelIndex] = rec;
      save();
      G.clearInfo = { moves: G.moves, par, carrot: !!G.s.star, hasCarrot: lv.map.join('').includes('*'), rec };
      setTimeout(() => { if (G.scene === 'play' && G.won) G.scene = 'clear'; G.t = 0; }, 1300);
    }
  }

  // ---------- klawiatura ----------
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    Space: 'act', KeyE: 'act', Enter: 'ok', Tab: 'switch', KeyQ: 'switch', ShiftLeft: 'switch', KeyZ: 'undo', Backspace: 'undo',
    KeyR: 'restart', KeyH: 'hint', Escape: 'menu', KeyM: 'music', Digit1: 'selP', Digit2: 'selC'
  };
  window.addEventListener('keydown', (e) => {
    const c = KEYMAP[e.code];
    if (!c) return;
    e.preventDefault();
    if (G.scene === 'play' && c === 'ok') { input('act'); return; }
    input(c);
  });

  // ---------- dotyk / mysz ----------
  function bindHold(id, cmd) {
    const el = document.getElementById(id);
    if (!el) return;
    let timer = null;
    const start = (e) => {
      e.preventDefault();
      el.classList.add('on');
      input(cmd);
      if (cmd === 'left' || cmd === 'right') {
        clearInterval(timer);
        timer = setInterval(() => { if (!animating()) input(cmd); }, 190);
      }
    };
    const end = () => { el.classList.remove('on'); clearInterval(timer); timer = null; };
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
  }
  bindHold('bL', 'left');
  bindHold('bR', 'right');
  bindHold('bA', 'act');
  bindHold('bS', 'switch');
  bindHold('bU', 'undo');

  canvas.addEventListener('pointerdown', (e) => {
    Sfx.resume();
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * W;
    const y = (e.clientY - r.top) / r.height * H;
    for (const b of G.buttons) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { Sfx.cue('click'); b.fn(); return; }
    }
    if (G.scene === 'play' && !G.won) {
      for (const who of ['P', 'C']) {
        const d = G.disp[who];
        if (x >= d.x * CELL && x <= d.x * CELL + CELL && y >= d.y * CELL - 10 && y <= d.y * CELL + CELL) { if (G.active !== who) doSwitch(who); return; }
      }
    }
    if (G.scene === 'title' || G.scene === 'ending') input('ok');
  });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * W;
    const y = (e.clientY - r.top) / r.height * H;
    G.hover = G.buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || null;
    canvas.style.cursor = G.hover ? 'pointer' : 'default';
  });

  // ---------- rozmiar ----------
  let scale = 1;
  function fit() {
    const land = TOUCH && window.innerWidth > window.innerHeight;
    document.body.classList.toggle('land', land);
    const extra = TOUCH && !land ? 96 : 0;
    const m = TOUCH ? 2 : 16;
    const gutter = land ? 150 : 0;
    const s = Math.min((window.innerWidth - m * 2 - gutter * 2) / W, (window.innerHeight - m * 2 - extra) / H, TOUCH ? 4 : 2.2);
    scale = Math.max(0.3, s);
    const cw = Math.floor(W * scale);
    const ch = Math.floor(H * scale);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    document.getElementById('touch').style.width = `${land ? window.innerWidth : cw}px`;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const rs = Math.max(1, Math.round(scale * dpr * 2) / 2);
    canvas.width = Math.round(W * rs);
    canvas.height = Math.round(H * rs);
    G.rs = rs;
  }
  window.addEventListener('resize', fit);
  fit();

  // ---------- rysowanie ----------
  function theme() { return Art.THEMES[LEVELS[G.levelIndex].world] || Art.THEMES[0]; }

  function drawBackground(worldIdx) {
    const th = Art.THEMES[worldIdx];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, th.sky[0]);
    g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const t = G.t;
    if (worldIdx === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let k = 0; k < 4; k += 1) {
        const x = ((k * 230 + t * 6) % (W + 160)) - 80;
        const y = 50 + k * 28;
        ctx.fillRect(x, y, 70, 14); ctx.fillRect(x + 14, y - 8, 40, 10);
      }
      hills(th.far, 300, 60, 0.004, 1);
      hills(th.near, 360, 50, 0.007, 2);
    } else if (worldIdx === 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let x = 0; x < W; x += 40) ctx.fillRect(x, 0, 3, H);
      ctx.fillStyle = 'rgba(255,220,150,0.06)';
      ctx.fillRect(500, 0, 120, H);
    } else if (worldIdx === 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      for (let y = 0; y < H; y += 24) for (let x = (y / 24) % 2 ? 0 : 24; x < W; x += 48) ctx.fillRect(x, y, 46, 22);
      const fl = 0.85 + Math.sin(t * 9) * 0.08;
      const rg = ctx.createRadialGradient(140, 120, 10, 140, 120, 260);
      rg.addColorStop(0, `rgba(255,170,80,${0.22 * fl})`);
      rg.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let k = 0; k < 40; k += 1) { const x = Art.hash(k, 3) * W; const y = Art.hash(7, k) * H * 0.6; if (Math.sin(t * 2 + k) > -0.3) ctx.fillRect(x, y, 2, 2); }
      ctx.fillStyle = '#F4E9C8';
      ctx.beginPath(); ctx.arc(640, 90, 30, 0, Math.PI * 2); ctx.fill();
      hills(th.far, 330, 40, 0.005, 3);
    }
  }
  function hills(col, base, amp, f, seed) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, base - Math.sin(x * f + seed) * amp - Math.sin(x * f * 2.3 + seed * 2) * amp * 0.4);
    ctx.lineTo(W, H);
    ctx.fill();
  }

  function drawTiles() {
    const geo = G.geo;
    const s = G.s;
    const th = theme();
    const wi = LEVELS[G.levelIndex].world;
    const T2 = CELL;
    // wnętrze (lekko przyciemnione puste pola)
    for (let i = 0; i < geo.base.length; i += 1) {
      const [x, y] = cellXY(i);
      const t = R.tileAt(geo, s, i);
      const isSolid = (xx, yy) => { if (xx < 0 || yy < 0 || xx >= geo.w || yy >= geo.h) return true; const tt = R.tileAt(geo, s, yy * geo.w + xx); return tt === '#' || tt === 'o'; };
      if (t === '#') {
        ctx.drawImage(Art.wallTile(th, !isSolid(x, y - 1), !isSolid(x - 1, y), !isSolid(x + 1, y), x, y, wi), x * T2, y * T2, T2, T2);
      } else if (t === 'D') {
        ctx.drawImage(Art.dirtTile(x * 7 + y), x * T2, y * T2, T2, T2);
      } else if (t === 'o') {
        ctx.drawImage(Art.holeTile(th, wi), x * T2, y * T2, T2, T2);
      } else if ('xyz'.includes(t)) {
        ctx.drawImage(Art.plateTile(t, R.plateDown(geo, s, t) ? 1 : 0), x * T2, y * T2, T2, T2);
      } else if (t === 'l' || t === 'm') {
        ctx.drawImage(Art.leverTile(R.leverOn(geo, s, t) ? 1 : 0), x * T2, y * T2, T2, T2);
      } else if (t === 'E') {
        const l = geo.base[i - 1] === 'E';
        const r = geo.base[i + 1] === 'E';
        ctx.drawImage(Art.exitTile(wi, l && r ? 'M' : r ? 'L' : l ? 'R' : 'S'), x * T2, y * T2, T2, T2);
      } else if (t === '*' && !s.star) {
        const bob = Math.sin(G.t * 3) * 3;
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(G.t * 4) * 0.1;
        const rg = ctx.createRadialGradient(x * T2 + 24, y * T2 + 24, 2, x * T2 + 24, y * T2 + 24, 30);
        rg.addColorStop(0, '#FFE680'); rg.addColorStop(1, 'rgba(255,230,128,0)');
        ctx.fillStyle = rg; ctx.fillRect(x * T2 - 8, y * T2 - 8, 64, 64);
        ctx.restore();
        ctx.drawImage(Art.carrotSprite(Math.floor(G.t * 3) % 2), x * T2, y * T2 + bob, T2, T2);
      }
      if (geo.base[i] === 'r') {
        const k = geo.ropeIdx.indexOf(i);
        const alive = s.rope[k];
        let top = y;
        while (top > 0 && geo.base[(top - 1) * geo.w + x] !== '#') top -= 1;
        ctx.fillStyle = '#C9A46A';
        const len = alive ? (y - top + 1) * T2 - 6 : (y - top) * T2 + 14;
        ctx.fillRect(x * T2 + 22, top * T2, 4, len);
        ctx.fillStyle = '#8E6A3A';
        for (let yy = top * T2; yy < top * T2 + len; yy += 8) ctx.fillRect(x * T2 + 22, yy, 4, 2);
        if (alive) { ctx.fillStyle = '#8E6A3A'; ctx.fillRect(x * T2 + 16, y * T2 + T2 - 8, 16, 6); }
        else { ctx.fillStyle = '#E8D2A0'; ctx.fillRect(x * T2 + 20, top * T2 + len - 2, 8, 3); }
      }
      if ('XYZLMK'.includes(geo.base[i])) {
        const target = R.doorOpen(geo, s, i) ? 1 : 0;
        const cur = G.doors[i] === undefined ? target : G.doors[i];
        G.doors[i] = cur + Math.sign(target - cur) * Math.min(Math.abs(target - cur), 0.12);
        const open = G.doors[i];
        const ch = geo.base[i];
        const letter = ch === 'K' ? 'L' : ch;
        const img = Art.doorTile(letter, ch === 'K');
        const vis = Math.max(0, 1 - open);
        if (vis > 0.01) ctx.drawImage(img, 0, Math.round(24 * open), 24, Math.round(24 * vis), x * T2, y * T2, T2, Math.round(T2 * vis));
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x * T2, y * T2, T2, 3);
      }
    }
  }

  function drawCrates() {
    const img = Art.crateTile();
    G.disp.B.forEach((d) => { ctx.drawImage(img, Math.round(d.x * CELL), Math.round(d.y * CELL), CELL, CELL); });
  }

  function drawChar(who) {
    const d = G.disp[who];
    const active = G.active === who && G.scene === 'play' && !G.won;
    let bx = d.x * CELL + (d.bump || 0) * CELL;
    if (d.bump) { d.bump *= 0.75; if (Math.abs(d.bump) < 0.01) d.bump = 0; }
    const by = d.y * CELL;
    const face = G.face[who];
    const falling = d.fallFrom !== null && d.moving;
    if (active) {
      ctx.save();
      ctx.globalAlpha = 0.28 + Math.sin(G.t * 5) * 0.08;
      ctx.fillStyle = who === 'P' ? '#FFE9F2' : '#FFE6B0';
      ctx.beginPath(); ctx.ellipse(bx + 24, by + 46, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.save();
    if (face < 0) { ctx.translate(bx * 2 + CELL, 0); ctx.scale(-1, 1); }
    if (who === 'P') {
      const A = Art.RABBIT;
      let f = A.frames.idle;
      if (G.won) f = Math.floor(G.t * 6) % 2 ? A.frames.happy : A.frames.jump;
      else if (falling) f = A.frames.fall;
      else if (d.moving) f = A.frames.run + (Math.floor(d.walkT * 14) % 8);
      else if (Math.floor(G.t * 10) % 37 === 0) f = A.frames.blink;
      const img = Art.imgs.rabbit;
      const hop = G.won ? -Math.abs(Math.sin(G.t * 9)) * 14 : 0;
      if (img) ctx.drawImage(img, f * A.w, 0, A.w, A.h, bx - A.ox * 2, by - A.oy * 2 + hop, A.w * 2, A.h * 2);
    } else {
      const A = Art.CAT;
      let f = A.frames.sit;
      let dy = -8;
      if (falling) { f = A.frames.air; }
      else if (d.moving || G.won) { f = Math.floor((d.walkT + G.t * (G.won ? 1 : 0)) * 8) % 2 ? A.frames.walk1 : A.frames.walk0; }
      else if (!active && Math.floor(G.t / 6) % 3 === 2) { f = A.frames.yawn; }
      const img = Art.imgs.cat;
      if (img) ctx.drawImage(img, f * A.w, 0, A.w, A.h, bx - A.ox * 2, by + dy, A.w * 2, A.h * 2);
    }
    ctx.restore();
    if (active) {
      const ay = by - 22 + Math.sin(G.t * 6) * 3;
      ctx.fillStyle = who === 'P' ? '#FF9CCF' : '#FFC85A';
      ctx.beginPath(); ctx.moveTo(bx + 24, ay + 10); ctx.lineTo(bx + 16, ay); ctx.lineTo(bx + 32, ay); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  function drawParts(dt) {
    G.parts = G.parts.filter((p) => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g ? 260 : 220) * dt;
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      ctx.globalAlpha = 1;
      return true;
    });
  }

  function panel(x, y, w, h, fill = 'rgba(14,10,30,0.82)', stroke = 'rgba(255,255,255,0.18)') {
    ctx.fillStyle = fill;
    roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function text(s, x, y, size = 16, col = '#fff', align = 'left', font = FONT, weight = 700) {
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillText(s, x + 1, y + 2);
    ctx.fillStyle = col;
    ctx.fillText(s, x, y);
  }
  function wrap(s, maxW, size) {
    ctx.font = `600 ${size}px ${FONT}`;
    const words = s.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    return lines;
  }
  function button(x, y, w, h, label, fn, opt = {}) {
    const hov = G.hover && G.hover.label === label;
    panel(x, y, w, h, opt.fill || (hov ? 'rgba(80,60,140,0.95)' : 'rgba(30,22,60,0.85)'), opt.stroke || 'rgba(255,255,255,0.28)');
    text(label, x + w / 2, y + h / 2 + 1, opt.size || 15, opt.col || '#fff', 'center');
    G.buttons.push({ x, y, w, h, fn, label });
  }

  function drawHUD() {
    const lv = LEVELS[G.levelIndex];
    panel(6, 5, 300, 38);
    text(`${lv.world + 1}-${(lv.indexInWorld || 0) + 1}`, 18, 25, 11, '#FFD54A', 'left', PIX, 400);
    text(lv.name, 62, 25, 17, '#fff');
    panel(312, 5, 150, 38);
    const par = lv.par ? ` / ${lv.par}` : '';
    text(`Ruchy ${G.moves}${par}`, 387, 25, 16, G.moves > (lv.par || 999) ? '#FFB4A0' : '#D9F7FF', 'center');
    // przyciski
    const bx = 468;
    const bw = 46;
    const items = [['↶', 'undo', 'Cofnij (Z)'], ['⟲', 'restart', 'Od nowa (R)'], ['?', 'hint', 'Podpowiedź (H)'], [Sfx.musicOn ? '♪' : '✕', 'music', 'Muzyka (M)'], ['☰', 'menu', 'Mapa (Esc)']];
    items.forEach(([lab, cmd], k) => {
      const x = bx + k * (bw + 4);
      const hov = G.hover && G.hover.label === cmd;
      panel(x, 5, bw, 38, hov ? 'rgba(80,60,140,0.95)' : 'rgba(14,10,30,0.82)');
      text(lab, x + bw / 2, 25, 20, '#fff', 'center');
      G.buttons.push({ x, y: 5, w: bw, h: 38, fn: () => input(cmd), label: cmd });
    });
    // kto aktywny
    const ax = W - 6 - 0;
    void ax;
  }

  function drawSwitchBadge() {
    const x = W - 118;
    const y = H - 52;
    const hov = G.hover && G.hover.label === 'switch';
    panel(x, y, 112, 46, hov ? 'rgba(80,60,140,0.95)' : 'rgba(14,10,30,0.8)');
    const img = G.active === 'P' ? Art.imgs.rabbit : Art.imgs.cat;
    const A = G.active === 'P' ? Art.RABBIT : Art.CAT;
    if (img) ctx.drawImage(img, 0, 0, A.w, A.h, x + 2, y + (G.active === 'P' ? -12 : -4), A.w * 1.5, A.h * 1.5);
    text(NAMES[G.active], x + 76, y + 16, 15, G.active === 'P' ? '#FFD7EA' : '#FFE2A8', 'center');
    text(TOUCH ? 'ZMIEŃ' : 'Tab: zmień', x + 76, y + 33, 11, '#BFB4E6', 'center', FONT, 600);
    G.buttons.push({ x, y, w: 112, h: 46, fn: () => input('switch'), label: 'switch' });
  }

  function drawToast(dt) {
    const t = G.toast;
    if (!t) return;
    t.t -= dt * 60;
    if (t.t <= 0) { G.toast = null; return; }
    const lines = wrap(t.text, 520, 16);
    const h = 18 + lines.length * 21;
    const x = 120;
    const y = 52;
    ctx.globalAlpha = Math.min(1, t.t / 20);
    panel(x, y, 528, h, t.who === 'hint' ? 'rgba(40,30,10,0.9)' : 'rgba(14,10,30,0.88)', t.who === 'hint' ? 'rgba(255,213,74,0.6)' : 'rgba(255,255,255,0.22)');
    const col = t.who === 'P' ? '#FFD7EA' : t.who === 'C' ? '#FFE2A8' : t.who === 'S' ? '#B9E6FF' : '#FFE680';
    lines.forEach((l, k) => text(l, x + 16, y + 19 + k * 21, 16, col, 'left', FONT, 600));
    ctx.globalAlpha = 1;
  }

  function drawCard() {
    if (G.card <= 0) return;
    const lv = LEVELS[G.levelIndex];
    const a = Math.min(1, G.card / 25);
    ctx.globalAlpha = a;
    panel(184, 150, 400, 120, 'rgba(14,10,30,0.92)');
    text(`${WORLD_NAMES[lv.world].toUpperCase()} · POKÓJ ${(lv.indexInWorld || 0) + 1}`, 384, 180, 11, '#FFD54A', 'center', PIX, 400);
    text(lv.name, 384, 215, 30, '#fff', 'center');
    text(lv.par ? `Mistrz: ${lv.par} ruchów` : '', 384, 248, 14, '#BFB4E6', 'center', FONT, 600);
    ctx.globalAlpha = 1;
  }

  function drawPlay(dt) {
    const shx = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    G.shake = Math.max(0, G.shake - dt * 30);
    drawBackground(LEVELS[G.levelIndex].world);
    ctx.save();
    ctx.translate(shx, shy);
    drawTiles();
    drawCrates();
    const order = G.active === 'P' ? ['C', 'P'] : ['P', 'C'];
    order.forEach(drawChar);
    drawParts(dt);
    ctx.restore();
    drawHUD();
    if (!G.won && !TOUCH) drawSwitchBadge();
    drawToast(dt);
    drawCard();
  }

  function drawTitle() {
    drawBackground(3);
    const t = G.t;
    ctx.fillStyle = '#463668';
    ctx.fillRect(0, 400, W, 80);
    ctx.fillStyle = '#5B4580';
    ctx.fillRect(0, 400, W, 6);
    text('PUSZEK i PERSI', W / 2, 78, 36, '#FFE680', 'center', PIX, 400);
    text('Sroka Złodziejka', W / 2, 128, 30, '#FFD7EA', 'center');
    const lines = [
      'Sroka Szarlotka zwędziła złote marchewki Puszka',
      'i dzwoneczek Persiego. Schowała je na szczycie swojej wieży.',
      'Tym razem królik i kot muszą działać razem!'
    ];
    lines.forEach((l, k) => text(l, W / 2, 178 + k * 26, 17, '#E6E0FF', 'center', FONT, 600));
    const rb = Art.imgs.rabbit;
    const ct = Art.imgs.cat;
    if (rb) ctx.drawImage(rb, (Math.floor(t * 2) % 37 === 0 ? 1 : 0) * 34, 0, 34, 36, 250, 400 - 72 - 24 + 24, 102, 108);
    if (ct) ctx.drawImage(ct, 4 * 34, 0, 34, 30, 420, 400 - 66 - 21 + 21, 102, 90);
    const mx = 380 + Math.sin(t * 0.8) * 200;
    const my = 300 + Math.sin(t * 1.7) * 18;
    const mg = Art.magpie(Math.floor(t * 6) % 2 ? 2 : 0);
    ctx.save();
    if (Math.cos(t * 0.8) < 0) { ctx.translate(mx * 2 + 64, 0); ctx.scale(-1, 1); }
    ctx.drawImage(mg, mx, my - 60, 64, 56);
    ctx.restore();
    const blink = Math.floor(t * 2) % 2;
    const any = Object.keys(progress.solved).length;
    button(W / 2 - 120, 418, 240, 46, any ? 'GRAJ DALEJ' : 'ZACZNIJ', () => goSelect(), { size: 18, fill: blink ? 'rgba(70,140,60,0.95)' : 'rgba(60,120,52,0.95)' });
    text('← pierwsza przygoda', 16, 462, 13, '#BFB4E6', 'left', FONT, 600);
    G.buttons.push({ x: 8, y: 448, w: 170, h: 28, fn: () => { location.href = '../'; }, label: 'back' });
  }

  function drawSelect() {
    drawBackground(Math.min(3, LEVELS[Math.min(G.sel, LEVELS.length - 1)].world));
    panel(20, 14, W - 40, H - 28, 'rgba(14,10,30,0.78)');
    text('MAPA ZAGADEK', W / 2, 46, 18, '#FFE680', 'center', PIX, 400);
    const up = unlockedUpTo();
    const byWorld = [0, 1, 2, 3].map((w) => LEVELS.map((l, i) => [l, i]).filter(([l]) => l.world === w));
    let total = 0;
    let got = 0;
    byWorld.forEach((arr, wi) => {
      const y = 92 + wi * 86;
      text(WORLD_NAMES[wi], 44, y + 22, 18, ['#9BE07A', '#E8B070', '#9AB6FF', '#FF9CCF'][wi], 'left');
      arr.forEach(([lv, i], k) => {
        const x = 200 + k * 128;
        const solved = progress.solved[i];
        const locked = i > up;
        const sel = G.sel === i;
        panel(x, y, 116, 60, locked ? 'rgba(40,36,56,0.8)' : sel ? 'rgba(90,70,160,0.95)' : 'rgba(30,24,60,0.9)', sel ? '#FFE680' : 'rgba(255,255,255,0.2)');
        text(locked ? '🔒' : String(i + 1), x + 18, y + 20, locked ? 14 : 15, '#FFE680', 'center', locked ? FONT : PIX, 400);
        const nm = lv.name.length > 13 ? lv.name.slice(0, 12) + '…' : lv.name;
        text(locked ? '' : nm, x + 36, y + 20, 12, '#fff', 'left', FONT, 600);
        total += 2;
        const s1 = !!solved;
        const s2 = !!(solved && solved.par);
        if (s1) got += 1;
        if (s2) got += 1;
        text((s1 ? '★' : '☆') + (s2 ? '★' : '☆'), x + 14, y + 44, 16, '#FFD54A', 'left');
        if (lv.map.join('').includes('*')) text(solved && solved.carrot ? '🥕' : '·', x + 96, y + 44, 14, '#FFD54A', 'center');
        if (!locked) G.buttons.push({ x, y, w: 116, h: 60, fn: () => { G.sel = i; loadLevel(i); }, label: 'lv' + i });
      });
    });
    text(`Gwiazdki: ${got} / ${total}   ·   ★ przejście   ★ w liczbie ruchów mistrza`, W / 2, H - 46, 14, '#D9D0FF', 'center', FONT, 600);
    button(36, H - 64, 110, 36, '← Tytuł', () => { G.scene = 'title'; }, { size: 14 });
  }

  function drawClear() {
    drawPlay(0);
    const c = G.clearInfo;
    ctx.fillStyle = 'rgba(10,6,24,0.55)';
    ctx.fillRect(0, 0, W, H);
    panel(164, 90, 440, 300, 'rgba(18,12,40,0.95)', '#FFE680');
    text('POKÓJ ZALICZONY!', W / 2, 128, 18, '#FFE680', 'center', PIX, 400);
    text(`Ruchy: ${c.moves}`, W / 2, 178, 24, '#fff', 'center');
    const parOk = c.par && c.moves <= c.par;
    text(parOk ? `Mistrzowsko! (mistrz: ${c.par})` : `Mistrz robi to w ${c.par} ruchach – spróbujesz?`, W / 2, 212, 16, parOk ? '#9BE07A' : '#FFD7A8', 'center', FONT, 600);
    const stars = '★' + (parOk ? '★' : '☆');
    text(stars, W / 2, 256, 40, '#FFD54A', 'center');
    if (c.hasCarrot) text(c.carrot ? 'Złota marchewka odzyskana!' : 'Złota marchewka została w pokoju…', W / 2, 296, 15, c.carrot ? '#FFE680' : '#BFB4E6', 'center', FONT, 600);
    button(184, 326, 120, 44, 'Mapa', () => goSelect());
    button(324, 326, 120, 44, 'Jeszcze raz', () => loadLevel(G.levelIndex), { size: 14 });
    button(464, 326, 120, 44, 'Dalej →', () => nextLevel(), { fill: 'rgba(60,120,52,0.95)' });
  }

  function drawEnding() {
    drawBackground(3);
    panel(90, 60, W - 180, 330, 'rgba(14,10,30,0.85)', '#FFE680');
    text('KONIEC PRZYGODY', W / 2, 100, 20, '#FFE680', 'center', PIX, 400);
    const lines = [
      'W gnieździe na szczycie wieży leżały złote marchewki,',
      'dzwoneczek Persiego… i mnóstwo innych błyskotek.',
      'Sroka Szarlotka przyznała, że było jej po prostu nudno.',
      'Od dziś przylatuje do ogrodu na wspólne zabawy –',
      'a Puszek i Persi wiedzą, że razem dadzą radę wszystkiemu.'
    ];
    lines.forEach((l, k) => text(l, W / 2, 150 + k * 30, 17, '#E6E0FF', 'center', FONT, 600));
    const mg = Art.magpie(Math.floor(G.t * 4) % 2 ? 2 : 0);
    ctx.drawImage(mg, W / 2 - 40, 312, 80, 70);
    button(W / 2 - 90, 404, 180, 44, 'Mapa zagadek', () => goSelect());
  }

  // ---------- pętla ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    G.t += dt;
    G.buttons = [];
    ctx.setTransform(G.rs, 0, 0, G.rs, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (G.scene === 'play') {
      stepAnim(dt);
      if (!animating() && G.queue.length) run(G.queue.shift());
      checkWin();
      if (G.card > 0) G.card -= dt * 60;
      drawPlay(dt);
    } else if (G.scene === 'title') drawTitle();
    else if (G.scene === 'select') drawSelect();
    else if (G.scene === 'clear') drawClear();
    else if (G.scene === 'ending') drawEnding();
    Sfx.tick(dt, G.scene !== 'title');
    requestAnimationFrame(frame);
  }

  // numeracja w świecie
  const cnt = {};
  LEVELS.forEach((l) => { l.indexInWorld = cnt[l.world] || 0; cnt[l.world] = l.indexInWorld + 1; });

  Art.load(() => {
    if (location.hash.startsWith('#room')) loadLevel(Math.max(0, Number(location.hash.slice(5)) - 1));
    requestAnimationFrame(frame);
  });
  window.__G = G;
  window.__input = input;
  window.__loadRoom = loadLevel;
})();
