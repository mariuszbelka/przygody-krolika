// Przygoda 4: Ogród Babci Ludwiki – ekrany, animacje, efekty i sterowanie.
(function () {
  'use strict';
  const R = window.Rules;
  const LEVELS = window.LEVELS;
  const Art = window.Art;
  const SND = window.Audio4;

  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;

  // ---------------------------------------------------------------- zapis
  const STORE = 'PuszekP4Progress';
  const P = { u: 0, s: {}, b: {}, mode: 'S', seen: -1 };
  try { Object.assign(P, JSON.parse(localStorage.getItem(STORE) || '{}')); } catch (e) { /* */ }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(P)); } catch (e) { /* */ } };
  const params = new URLSearchParams(location.search);
  if (params.has('odblokuj')) P.u = LEVELS.length - 1;

  // ---------------------------------------------------------------- stan
  const S = {
    scene: 'title', overlay: null, t: 0,
    li: 0, G: null, view: new Map(), ob: [], goalsV: [], scoreV: 0, movesV: 0, chargeV: { P: 0, C: 0 }, bossHpV: 0,
    queue: [], cur: null, busy: false,
    fx: [], parts: [], texts: [], word: null, shake: 0, flash: 0,
    sel: null, drag: null, idle: 0, hint: null, power: null, powerCell: null,
    turn: null, buttons: [], L: null, boardCache: null,
    hero: { P: { jump: 0, happy: 0 }, C: { jump: 0, happy: 0 } },
    bossAnim: { hurt: 0, act: 0 }, finaleDone: false, lowWarned: -1, newReward: -1, rewardT: 0, mapNodes: [], pointer: null
  };

  // ---------------------------------------------------------------- układ
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = `${W}px`; cv.style.height = `${H}px`;
    Art.setDpr(DPR);
    if (S.G) boardLayout();
  }

  function boardLayout() {
    const G = S.G;
    const portrait = H >= W * 1.05;
    let left, right, top, bottom;
    if (portrait) { left = 10; right = 10; top = Math.min(130, H * 0.16); bottom = Math.min(132, H * 0.17); }
    else { left = Math.min(220, W * 0.22); right = Math.min(180, W * 0.18); top = 12; bottom = 12; }
    const aw = W - left - right, ah = H - top - bottom;
    const cell = Math.floor(Math.min(aw / G.W, ah / G.H, 84));
    const bw = cell * G.W, bh = cell * G.H;
    const bx = Math.round(left + (aw - bw) / 2), by = Math.round(top + (ah - bh) / 2);
    S.L = { portrait, cell, bx, by, bw, bh, left, right, top, bottom };
    S.boardCache = null;
  }
  const cx = (c) => S.L.bx + (c + 0.5) * S.L.cell;
  const cy = (r) => S.L.by + (r + 0.5) * S.L.cell;

  // ---------------------------------------------------------------- start poziomu
  function startLevel(i) {
    S.li = i;
    const level = LEVELS[i];
    S.G = R.createGame(level, { mode: P.mode, seed: (Date.now() ^ (i * 7919)) >>> 0 });
    syncView(true);
    S.goalsV = S.G.goals.map((g) => ({ ...g }));
    S.scoreV = 0; S.movesV = S.G.moves; S.chargeV = { P: 0, C: 0 };
    S.bossHpV = S.G.boss ? S.G.boss.hp : 0;
    S.queue = []; S.cur = null; S.busy = false; S.fx = []; S.parts = []; S.texts = []; S.word = null;
    S.sel = null; S.drag = null; S.idle = 0; S.hint = null; S.power = null; S.finaleDone = false; S.lowWarned = -1;
    S.scene = 'play';
    S.overlay = { kind: 'intro', t: 0 };
    boardLayout();
  }

  function syncView(reset) {
    const G = S.G;
    const old = S.view;
    const view = new Map();
    for (const cl of G.cells) {
      if (!cl.tile) continue;
      const prev = !reset && old.get(cl.tile.id);
      view.set(cl.tile.id, {
        id: cl.tile.id, k: cl.tile.k, col: cl.tile.col, sp: cl.tile.sp,
        x: cl.c, y: cl.r, scale: 1, alpha: 1, rot: 0, land: 0, anim: null,
        blink: prev ? prev.blink : 1 + Math.random() * 5, face: 'normal', wob: 0
      });
    }
    S.view = view;
    S.ob = G.cells.map((cl) => ({ v: cl.v, crate: cl.crate, cover: cl.cover, coverKind: cl.coverKind, weed: cl.weed, boss: cl.boss }));
  }

  // ---------------------------------------------------------------- kolejka kroków
  function runSteps(steps) {
    S.queue.push(...steps);
    S.busy = true;
    S.hint = null; S.idle = 0;
    if (!S.cur) nextStep();
  }
  function nextStep() {
    const s = S.queue.shift();
    if (!s) { S.cur = null; S.busy = false; onIdle(); return; }
    S.cur = { s, t: 0, dur: startStep(s) };
  }

  function startStep(s) {
    switch (s.type) {
      case 'swap': {
        const a = S.view.get(s.ida), b = S.view.get(s.idb);
        a.anim = { kind: 'move', fx: a.x, fy: a.y, tx: s.b[1], ty: s.b[0], d: 0.17 };
        b.anim = { kind: 'move', fx: b.x, fy: b.y, tx: s.a[1], ty: s.a[0], d: 0.17 };
        SND.cue('swap');
        S.movesV -= 1;
        S.turn = { cascade: 1, cleared: 0, specials: 0, combo: false, yarn: false };
        return 0.17;
      }
      case 'bad': {
        const a = S.view.get(s.ida), b = S.view.get(s.idb);
        a.anim = { kind: 'bump', fx: a.x, fy: a.y, tx: b.x, ty: b.y, d: 0.26 };
        b.anim = { kind: 'bump', fx: b.x, fy: b.y, tx: a.x, ty: a.y, d: 0.26 };
        SND.cue('bad');
        return 0.26;
      }
      case 'clear': return startClear(s);
      case 'fall': {
        let longest = 0;
        for (const m of s.moves) {
          let v = S.view.get(m.id);
          if (!v) {
            v = { id: m.id, k: m.k, col: m.col, sp: m.sp, x: m.path[0][1], y: m.path[0][0], scale: 1, alpha: 1, rot: 0, land: 0, anim: null, blink: 1 + Math.random() * 4, face: 'normal', wob: 0 };
            S.view.set(m.id, v);
          }
          if (m.grow) {
            v.scale = 0;
            v.anim = { kind: 'appear', d: 0.25 };
            longest = Math.max(longest, 0.25);
            continue;
          }
          let len = 0;
          for (let k = 1; k < m.path.length; k += 1) len += Math.hypot(m.path[k][0] - m.path[k - 1][0], m.path[k][1] - m.path[k - 1][1]);
          const d = 0.05 + 0.065 * Math.pow(len, 0.8);
          v.anim = { kind: 'fall', path: m.path, len, d };
          longest = Math.max(longest, d);
        }
        return longest + 0.02;
      }
      case 'collect':
        for (const j of s.jars) {
          const v = S.view.get(j.id);
          const tgt = goalAnchor('jar');
          if (v) v.anim = { kind: 'fly', fx: cx(v.x), fy: cy(v.y), tx: tgt.x, ty: tgt.y, d: 0.5, screen: true };
          sparkle(cx(j.c), cy(j.r), '#FF6A8A', 14);
          const g = S.goalsV.find((x) => x.type === 'jar');
          if (g) g.left = Math.max(0, g.left - 1);
          S.scoreV += 100;
          popText(cx(j.c), cy(j.r), '+100', '#FFE07A');
        }
        SND.cue('jar');
        return 0.5;
      case 'shuffle': {
        const by = new Map(s.tiles.map((t) => [t.id, t]));
        for (const [id, v] of S.view) {
          const t = by.get(id);
          if (t) v.anim = { kind: 'move', fx: v.x, fy: v.y, tx: t.c, ty: t.r, d: 0.5, arc: 1.2 };
        }
        bigWord('Tasujemy!', 1);
        SND.cue('shuffle');
        return 0.55;
      }
      case 'boss': {
        S.bossAnim.act = 0.7;
        SND.cue('bossCover');
        const bx = cx(S.G.boss.c + 0.5), by = cy(S.G.boss.r + 0.5);
        s.covered.forEach(([r, c], k) => {
          S.fx.push({ kind: 'gem', fx: bx, fy: by, tx: cx(c), ty: cy(r), t: -k * 0.08, d: 0.45 });
          S.ob[r * S.G.W + c].pending = { cover: 1, coverKind: 'bling', at: 0.45 + k * 0.08 };
        });
        return 0.7;
      }
      case 'finale': {
        if (!S.finaleDone) { S.finaleDone = true; bigWord('Wielkie sprzątanie!', 2); }
        const v = S.view.get(s.id);
        if (v) { v.sp = s.sp; v.scale = 1.4; v.anim = { kind: 'appear', d: 0.18, from: 1.4 }; }
        S.movesV = Math.max(0, S.movesV - 1);
        if (s.bonus) { S.scoreV += s.bonus; popText(W / 2, S.L.by + S.L.bh * 0.3, `+${s.bonus} za ruchy`, '#FFE07A', 1.2); S.movesV = Math.min(S.movesV, 12); }
        SND.cue('create');
        return 0.09;
      }
      default: return 0.01;
    }
  }

  function startClear(s) {
    const L = S.L;
    let effLong = 0;
    if (S.turn) {
      S.turn.cascade = Math.max(S.turn.cascade, s.cascade);
      S.turn.cleared += s.cleared.length;
      S.turn.specials += s.effects.length;
    }
    // efekty specjalnych
    for (const e of s.effects) {
      if (e.kind === 'rh' || e.kind === 'rv') { S.fx.push({ kind: 'rocket', dir: e.kind, r: e.r, c: e.c, t: 0, d: 0.42 }); SND.cue('rocket'); effLong = Math.max(effLong, 0.12); }
      else if (e.kind === 'bomb') { S.fx.push({ kind: 'boom', r: e.r, c: e.c, rad: e.rad, t: 0, d: 0.45 }); S.shake = Math.max(S.shake, 6 + e.rad * 4); S.flash = 0.25; SND.cue('bomb'); effLong = Math.max(effLong, 0.14); for (let k = 0; k < 26; k += 1) burst(cx(e.c), cy(e.r), '#FFB060', 'square', 5 + Math.random() * 6); }
      else if (e.kind === 'flypop') { sparkle(cx(e.c), cy(e.r), '#FFFFFF', 8); }
      else if (e.kind === 'fly') { S.fx.push({ kind: 'fly', fx: cx(e.c), fy: cy(e.r), tx: cx(e.tc), ty: cy(e.tr), col: colAt(e), t: 0, d: 0.42 }); SND.cue('fly'); effLong = Math.max(effLong, 0.18); }
      else if (e.kind === 'yarn') { S.fx.push({ kind: 'yarn', r: e.r, c: e.c, targets: e.targets, col: e.col, t: 0, d: 0.6 }); SND.cue('yarn'); effLong = Math.max(effLong, 0.2); if (S.turn) S.turn.yarn = true; }
      else if (e.kind === 'yarnall') { S.flash = 0.6; S.shake = 14; SND.cue('combo'); bigWord('Owocowa burza!', 3); if (S.turn) S.turn.combo = true; }
      else if (e.kind === 'dig') { S.fx.push({ kind: 'dig', c: e.c, t: 0, d: 0.5 }); SND.cue('dig'); S.shake = 6; effLong = 0.2; }
      else if (e.kind === 'claw') { S.fx.push({ kind: 'claw', r: e.r, t: 0, d: 0.45 }); SND.cue('claw'); S.shake = 5; effLong = 0.2; }
    }
    if (s.cleared.some((t) => t.combo)) { SND.cue('combo'); S.shake = Math.max(S.shake, 10); if (S.turn) S.turn.combo = true; }
    // zbite owoce
    let sx = 0, sy = 0, firstCol = 0;
    for (const t of s.cleared) {
      const v = S.view.get(t.id);
      if (v) { v.anim = { kind: 'pop', d: 0.24, delay: 0 }; v.face = 'happy'; }
      const px = cx(t.c), py = cy(t.r);
      sx += px; sy += py;
      const pal = Art.PAL[t.col] || { base: '#FFFFFF', light: '#FFFFFF' };
      for (let k = 0; k < 6; k += 1) burst(px, py, k % 2 ? pal.base : pal.light, 'circle', 3 + Math.random() * 4);
      burst(px, py, '#FFFFFF', 'star', 6);
      // liczniki celów i mocy
      if (t.col >= 0) {
        for (const g of S.goalsV) if (g.type === 'col' && g.col === t.col && g.left > 0) { g.left -= 1; S.fx.push({ kind: 'toGoal', fx: px, fy: py, col: t.col, t: 0, d: 0.5, goal: g }); }
        if (t.col === R.HERO_COLOR.P) S.chargeV.P = Math.min(R.HERO_NEED, S.chargeV.P + 1);
        if (t.col === R.HERO_COLOR.C) S.chargeV.C = Math.min(R.HERO_NEED, S.chargeV.C + 1);
      }
      if (!firstCol && t.col > 0) firstCol = t.col;
    }
    if (s.cleared.length) {
      SND.cue('match', { cascade: s.cascade, size: s.cleared.length });
      SND.cue('pop');
      const n = s.cleared.length;
      popText(sx / n, sy / n, `+${s.score}`, (Art.PAL[firstCol] || Art.PAL[3]).light, s.cascade > 1 ? 1.25 : 1);
      if (s.cascade >= 3) S.shake = Math.max(S.shake, 2 + s.cascade);
    }
    S.scoreV += s.score;
    // nowe specjalne
    for (const t of s.created) {
      S.view.set(t.id, { id: t.id, k: 'f', col: t.col, sp: t.sp, x: t.c, y: t.r, scale: 0, alpha: 1, rot: 0, land: 0, anim: { kind: 'appear', d: 0.3, delay: 0.1 }, blink: 2, face: 'happy', wob: 0 });
      ring(cx(t.c), cy(t.r), '#FFFFFF');
      SND.cue('create');
    }
    // przeszkody
    for (const d of s.damaged) {
      const i = d.r * S.G.W + d.c;
      const o = S.ob[i];
      const px = cx(d.c), py = cy(d.r);
      if (d.what === 'crate') { o.crate = d.left; SND.cue('crate'); for (let k = 0; k < 10; k += 1) burst(px, py, k % 2 ? '#C88A4A' : '#7A4E28', 'square', 4 + Math.random() * 5); if (!d.left) goalDec('crate'); }
      else if (d.what === 'web') { o.cover = d.left; if (!d.left) o.coverKind = null; SND.cue('web'); for (let k = 0; k < 8; k += 1) burst(px, py, '#FFFFFF', 'spark', 4); if (!d.left) goalDec('web'); }
      else if (d.what === 'bling') { o.cover = d.left; if (!d.left) o.coverKind = null; SND.cue('bling'); for (let k = 0; k < 8; k += 1) burst(px, py, ['#5AD8FF', '#FF6AD0', '#FFE24A'][k % 3], 'star', 5); }
      else if (d.what === 'weed') { o.weed = d.left; SND.cue('weed'); for (let k = 0; k < 8; k += 1) burst(px, py, k % 2 ? '#5AA83A' : '#8A6A3A', 'leaf', 5); if (!d.left) goalDec('weed'); }
      else if (d.what === 'boss') {
        const dmg = S.bossHpV - d.left;
        S.bossHpV = d.left;
        S.bossAnim.hurt = 0.5;
        SND.cue('bossHit');
        const g = S.goalsV.find((x) => x.type === 'boss');
        if (g) g.left = d.left;
        const bx = cx(S.G.boss.c + 0.5), by = cy(S.G.boss.r + 0.5);
        for (let k = 0; k < 6; k += 1) burst(bx, by, k % 2 ? '#16161F' : '#F6F6FA', 'feather', 6);
        if (dmg > 0) popText(bx, by - S.L.cell, `-${dmg}`, '#FF8A8A', 1.1);
      }
    }
    return 0.22 + effLong;
  }
  function colAt(e) { return (e.r != null && S.view) ? (Art.PAL[0] && 1) : 0; }
  function goalDec(type) { const g = S.goalsV.find((x) => x.type === type && x.left > 0); if (g) g.left -= 1; }
  function goalAnchor(type) { const a = S.goalAnchors && S.goalAnchors[type]; return a || { x: W / 2, y: 40 }; }

  function endStep(s) {
    if (s.type === 'clear' || s.type === 'collect') {
      const gone = s.type === 'clear' ? s.cleared : s.jars;
      for (const t of gone) { const v = S.view.get(t.id); if (v && !(s.type === 'clear' && s.created.some((c) => c.id === t.id))) S.view.delete(t.id); }
    }
    if (s.type === 'fall') {
      let landed = 0;
      for (const m of s.moves) { const v = S.view.get(m.id); if (v) { const e = m.path[m.path.length - 1]; v.x = e[1]; v.y = e[0]; v.anim = null; v.scale = 1; if (!m.grow) { v.land = 1; landed += 1; } } }
      if (landed) SND.cue('land');
    }
    if (s.type === 'swap' || s.type === 'shuffle') for (const v of S.view.values()) if (v.anim && v.anim.kind === 'move') { v.x = v.anim.tx; v.y = v.anim.ty; v.anim = null; }
    if (s.type === 'bad') for (const v of S.view.values()) if (v.anim && v.anim.kind === 'bump') { v.x = v.anim.fx; v.y = v.anim.fy; v.anim = null; }
  }

  function onIdle() {
    const G = S.G;
    if (!G) return;
    // pełna synchronizacja widoku z logiką (bez zmian, jeśli wszystko się zgadza)
    for (const cl of G.cells) {
      if (!cl.tile) continue;
      const v = S.view.get(cl.tile.id);
      if (v) { v.x = cl.c; v.y = cl.r; v.sp = cl.tile.sp; v.col = cl.tile.col; v.anim = null; v.scale = 1; v.alpha = 1; v.face = 'normal'; }
    }
    for (const id of [...S.view.keys()]) if (!G.cells.some((cl) => cl.tile && cl.tile.id === id)) S.view.delete(id);
    G.cells.forEach((cl, i) => { const o = S.ob[i]; o.crate = cl.crate; o.cover = cl.cover; o.coverKind = cl.coverKind; o.weed = cl.weed; o.pending = null; });
    S.goalsV = G.goals.map((g) => ({ ...g }));
    S.scoreV = G.score; S.movesV = G.moves; S.chargeV = { ...G.charge }; if (G.boss) S.bossHpV = G.boss.hp;
    // pochwała za ruch
    if (S.turn) {
      const t = S.turn;
      if (t.combo || t.yarn) { bigWord('Owocowo!', 3); cheer(3); }
      else if (t.cascade >= 5 || t.cleared >= 30) { bigWord('Czadowo!', 3); cheer(3); }
      else if (t.cascade >= 4 || t.cleared >= 20) { bigWord('Ekstra!', 2); cheer(2); }
      else if (t.cascade >= 3 || t.cleared >= 12) { bigWord('Super!', 1); cheer(1); }
      S.turn = null;
    }
    for (const h of ['P', 'C']) if (G.charge[h] >= R.HERO_NEED && !S.hero[h].readyShown) { S.hero[h].readyShown = true; SND.cue('heroReady'); popText(heroPos(h).x, heroPos(h).y - 50, 'Gotowy!', '#FFE07A', 1.1); }
    if (G.status === 'win') {
      if (!S.finaleDone && G.moves > 0) { const st = R.finale(G); if (st.length) { runSteps(st); return; } }
      finishWin();
    } else if (G.status === 'lose') {
      if (P.mode === 'S') S.overlay = { kind: 'extra', t: 0 };
      else { S.overlay = { kind: 'lose', t: 0 }; SND.cue('lose'); }
    } else if (G.moves <= 3 && S.lowWarned !== G.moves) {
      S.lowWarned = G.moves;
      SND.cue('moves');
    }
  }

  function finishWin() {
    const G = S.G;
    const stars = R.starsFor(LEVELS[S.li], G.score);
    const first = !(P.s[S.li] > 0);
    P.s[S.li] = Math.max(P.s[S.li] || 0, stars);
    P.b[S.li] = Math.max(P.b[S.li] || 0, G.score);
    if (S.li + 1 > P.u && S.li + 1 < LEVELS.length) P.u = S.li + 1;
    if (first) S.newReward = S.li;
    save();
    S.overlay = { kind: 'win', t: 0, stars, score: G.score, first };
    SND.cue('win');
    for (let k = 0; k < 80; k += 1) confetti();
  }

  // ---------------------------------------------------------------- efekty
  function burst(x, y, color, shape, size) {
    if (S.parts.length > 500) return;
    const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 5;
    S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, g: shape === 'feather' || shape === 'leaf' ? 0.06 : 0.22, life: 0.6 + Math.random() * 0.4, max: 1, size, color, shape, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4 });
  }
  function sparkle(x, y, color, n) { for (let k = 0; k < n; k += 1) burst(x, y, color, 'star', 4 + Math.random() * 4); }
  function ring(x, y, color) { S.fx.push({ kind: 'ring', x, y, color, t: 0, d: 0.4 }); }
  function confetti() {
    const cols = ['#F2414E', '#FFD43B', '#3F7FE0', '#7BCB3A', '#FF9A3C', '#8E4BD6', '#FFFFFF'];
    S.parts.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2, g: 0.04, life: 3 + Math.random() * 2, max: 5, size: 5 + Math.random() * 5, color: cols[Math.floor(Math.random() * cols.length)], shape: 'conf', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 });
  }
  function popText(x, y, text, color, scale = 1) { S.texts.push({ x, y, text, color, life: 0.9, scale }); }
  function bigWord(text, level) { S.word = { text, level, t: 0 }; SND.cue('word', { level }); }
  function cheer(level) { for (const h of ['P', 'C']) { S.hero[h].jump = 0.6 + level * 0.1; S.hero[h].happy = 1.2; } }

  // ---------------------------------------------------------------- aktualizacja
  function update(dt) {
    S.t += dt;
    if (S.cur) {
      S.cur.t += dt;
      animateViews(dt);
      if (S.cur.t >= S.cur.dur) { endStep(S.cur.s); nextStep(); }
    } else animateViews(dt);
    for (const o of S.ob) if (o.pending) { o.pending.at -= dt; if (o.pending.at <= 0) { o.cover = o.pending.cover; o.coverKind = o.pending.coverKind; o.pending = null; } }
    S.fx = S.fx.filter((f) => (f.t += dt) < f.d);
    S.parts = S.parts.filter((p) => {
      p.vy += p.g * 60 * dt; p.x += p.vx * 60 * dt; p.y += p.vy * 60 * dt; p.rot += p.vr; p.vx *= p.shape === 'feather' ? 0.96 : 0.99;
      if (p.shape === 'feather') p.vx += Math.sin(S.t * 6 + p.rot) * 0.1;
      return (p.life -= dt) > 0 && p.y < H + 40;
    });
    S.texts = S.texts.filter((t) => { t.y -= 40 * dt; return (t.life -= dt) > 0; });
    if (S.word) { S.word.t += dt; if (S.word.t > 1.3) S.word = null; }
    S.shake = Math.max(0, S.shake - dt * 30);
    S.flash = Math.max(0, S.flash - dt * 1.6);
    S.bossAnim.hurt = Math.max(0, S.bossAnim.hurt - dt);
    S.bossAnim.act = Math.max(0, S.bossAnim.act - dt);
    for (const h of ['P', 'C']) { S.hero[h].jump = Math.max(0, S.hero[h].jump - dt); S.hero[h].happy = Math.max(0, S.hero[h].happy - dt); }
    if (S.overlay) S.overlay.t += dt;
    if (S.rewardT > 0) S.rewardT -= dt;
    if (S.scene === 'play' && !S.busy && !S.overlay && S.G && S.G.status === 'play') {
      S.idle += dt;
      if (S.idle > 6 && !S.hint) S.hint = R.findHint(S.G);
    }
    if (S.overlay && S.overlay.kind === 'win' && S.overlay.t < 2.5 && Math.random() < 0.3) confetti();
  }

  function animateViews(dt) {
    for (const v of S.view.values()) {
      v.blink -= dt;
      if (v.blink < -0.12) v.blink = 2 + Math.random() * 5;
      if (v.land > 0) v.land = Math.max(0, v.land - dt * 6);
      const a = v.anim;
      if (!a) continue;
      a.t = (a.t || 0) + dt;
      const k = Math.min(1, Math.max(0, (a.t - (a.delay || 0)) / a.d));
      if (a.kind === 'move') {
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        v.x = a.fx + (a.tx - a.fx) * e;
        v.y = a.fy + (a.ty - a.fy) * e - (a.arc ? Math.sin(Math.PI * k) * a.arc : 0);
      } else if (a.kind === 'bump') {
        const e = Math.sin(Math.PI * k) * 0.35;
        v.x = a.fx + (a.tx - a.fx) * e;
        v.y = a.fy + (a.ty - a.fy) * e;
      } else if (a.kind === 'pop') {
        v.scale = k < 0.35 ? 1 + 0.3 * (k / 0.35) : 1.3 * (1 - (k - 0.35) / 0.65);
        v.alpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      } else if (a.kind === 'appear') {
        const from = a.from || 0;
        v.scale = k < 0.7 ? from + (1.2 - from) * (k / 0.7) : 1.2 - 0.2 * ((k - 0.7) / 0.3);
      } else if (a.kind === 'fall') {
        const e = k * k;
        let dist = e * a.len;
        const p = a.path;
        for (let i = 1; i < p.length; i += 1) {
          const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
          if (dist <= seg || i === p.length - 1) {
            const f = seg ? Math.min(1, dist / seg) : 1;
            v.y = p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f;
            v.x = p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f;
            break;
          }
          dist -= seg;
        }
      } else if (a.kind === 'fly') {
        const e = k * k * (3 - 2 * k);
        v.sx = a.fx + (a.tx - a.fx) * e;
        v.sy = a.fy + (a.ty - a.fy) * e - Math.sin(Math.PI * k) * 80;
        v.scale = 1 - 0.5 * k;
      }
    }
  }

  // ---------------------------------------------------------------- rysowanie
  function roundRect(x, y, w, h, r) { Art.roundRect(ctx, x, y, w, h, r); }
  function text(str, x, y, size, color, align = 'center', weight = 700, stroke = null, sw = 0) {
    ctx.font = `${weight} ${size}px Fredoka, "Trebuchet MS", sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    if (stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.lineWidth = sw || size * 0.18; ctx.strokeText(str, x, y); }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }
  function button(id, x, y, w, h, label, opts = {}) {
    const hover = S.pointer && S.pointer.x > x && S.pointer.x < x + w && S.pointer.y > y && S.pointer.y < y + h;
    const c1 = opts.c1 || '#FFE27A', c2 = opts.c2 || '#F2A52A', edge = opts.edge || '#9A5A08';
    ctx.save();
    ctx.fillStyle = edge;
    roundRect(x, y + 4, w, h, h * 0.4); ctx.fill();
    const gr = ctx.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    ctx.fillStyle = gr;
    roundRect(x, y + (hover ? 2 : 0), w, h, h * 0.4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(x + h * 0.25, y + 3 + (hover ? 2 : 0), w - h * 0.5, h * 0.25, h * 0.12); ctx.fill();
    text(label, x + w / 2, y + h / 2 + 1 + (hover ? 2 : 0), opts.size || Math.min(26, h * 0.45), opts.ink || '#3A2006');
    ctx.restore();
    S.buttons.push({ id, x, y, w, h, fn: opts.fn });
  }
  function panel(x, y, w, h, r = 18, fill = 'rgba(255,250,240,0.92)', edge = 'rgba(140,90,40,0.35)') {
    ctx.save();
    ctx.shadowColor = 'rgba(40,20,0,0.25)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    ctx.fillStyle = fill; roundRect(x, y, w, h, r); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = edge; ctx.lineWidth = 2; roundRect(x, y, w, h, r); ctx.stroke();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#BFE8FF'); g.addColorStop(0.55, '#E6F8D8'); g.addColorStop(1, '#8CCB64');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // bokeh
    for (let k = 0; k < 14; k += 1) {
      const x = ((k * 173) % 997) / 997 * W + Math.sin(S.t * 0.2 + k) * 20;
      const y = ((k * 331) % 911) / 911 * H * 0.7 + Math.cos(S.t * 0.15 + k) * 14;
      ctx.fillStyle = `rgba(255,255,255,${0.12 + (k % 3) * 0.05})`;
      ctx.beginPath(); ctx.arc(x, y, 18 + (k % 4) * 12, 0, Math.PI * 2); ctx.fill();
    }
    // płotek w tle
    ctx.fillStyle = 'rgba(255,248,235,0.6)';
    const fy = H * 0.82;
    ctx.fillRect(0, fy, W, 6);
    for (let x = 0; x < W; x += 26) { roundRect(x, fy - 26, 14, 60, 6); ctx.fill(); }
  }

  function buildBoardCache() {
    const { cell, bw, bh } = S.L;
    const G = S.G;
    const pad = Math.round(cell * 0.22);
    const c = document.createElement('canvas');
    c.width = Math.ceil((bw + pad * 2) * DPR); c.height = Math.ceil((bh + pad * 2) * DPR);
    const g = c.getContext('2d');
    g.scale(DPR, DPR);
    // drewniana rama tylko wokół istniejących pól
    const live = (r, cc) => r >= 0 && cc >= 0 && r < G.H && cc < G.W && !G.cells[r * G.W + cc].v;
    g.fillStyle = '#9A6232';
    for (let r = 0; r < G.H; r += 1) for (let cc = 0; cc < G.W; cc += 1) if (live(r, cc)) { Art.roundRect(g, pad + cc * cell - pad * 0.7, pad + r * cell - pad * 0.7, cell + pad * 1.4, cell + pad * 1.4, pad); g.fill(); }
    g.fillStyle = '#C88A4A';
    for (let r = 0; r < G.H; r += 1) for (let cc = 0; cc < G.W; cc += 1) if (live(r, cc)) { Art.roundRect(g, pad + cc * cell - pad * 0.45, pad + r * cell - pad * 0.45, cell + pad * 0.9, cell + pad * 0.9, pad * 0.7); g.fill(); }
    for (let r = 0; r < G.H; r += 1) {
      for (let cc = 0; cc < G.W; cc += 1) {
        if (!live(r, cc)) continue;
        g.fillStyle = (r + cc) % 2 ? '#9ED86E' : '#B4E482';
        g.fillRect(pad + cc * cell, pad + r * cell, cell, cell);
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.18)';
    for (let r = 0; r < G.H; r += 1) for (let cc = 0; cc < G.W; cc += 1) if (live(r, cc)) g.fillRect(pad + cc * cell, pad + r * cell, cell, cell * 0.08);
    S.boardCache = { c, pad };
  }

  function tileSprite(v, s) {
    if (v.k === 'jar') return Art.jarSprite(s);
    if (v.sp) return Art.specialSprite(v.sp, Math.max(0, v.col), s);
    let face = v.face;
    if (face === 'normal' && v.blink < 0) face = 'blink';
    if (face === 'normal' && S.word && S.word.level >= 2) face = 'happy';
    return Art.fruitSprite(v.col, s, face);
  }

  function drawBoard() {
    const { cell, bx, by, bw, bh } = S.L;
    const G = S.G;
    if (!S.boardCache) buildBoardCache();
    const bc = S.boardCache;
    ctx.drawImage(bc.c, bx - bc.pad, by - bc.pad, bc.c.width / DPR, bc.c.height / DPR);
    // chwasty
    S.ob.forEach((o, i) => { if (o.weed) Art.blit(ctx, Art.weedSprite(cell), cx(i % G.W), cy(Math.floor(i / G.W))); });
    // podświetlenie mocy
    if (S.power && S.powerCell) {
      ctx.fillStyle = S.power === 'P' ? 'rgba(255,170,60,0.35)' : 'rgba(170,110,240,0.35)';
      if (S.power === 'P') ctx.fillRect(bx + S.powerCell[1] * cell, by, cell, bh);
      else ctx.fillRect(bx, by + S.powerCell[0] * cell, bw, cell);
    }
    if (S.sel) {
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
      roundRect(bx + S.sel[1] * cell + 3, by + S.sel[0] * cell + 3, cell - 6, cell - 6, cell * 0.2); ctx.stroke();
    }
    // kafelki (przycięte do planszy, żeby nowe wpadały zza krawędzi)
    ctx.save();
    ctx.beginPath(); ctx.rect(bx - cell * 0.3, by, bw + cell * 0.6, bh + cell * 0.3); ctx.clip();
    const hintIds = new Set();
    if (S.hint) for (const [r, c] of S.hint) { const cl = G.cells[r * G.W + c]; if (cl.tile) hintIds.add(cl.tile.id); }
    const flying = [];
    for (const v of S.view.values()) {
      if (v.anim && v.anim.kind === 'fly') { flying.push(v); continue; }
      const s = cell * 0.98;
      let x = cx(v.x), y = cy(v.y);
      let sc = v.scale, rot = 0, syv = null;
      if (hintIds.has(v.id)) { rot = Math.sin(S.t * 14) * 0.12; sc *= 1 + Math.sin(S.t * 7) * 0.05; }
      if (S.sel && S.sel[0] === Math.round(v.y) && S.sel[1] === Math.round(v.x) && !v.anim) sc *= 1 + Math.sin(S.t * 8) * 0.06;
      if (v.land > 0) { syv = sc * (1 - 0.16 * Math.sin(v.land * Math.PI)); y += cell * 0.06 * Math.sin(v.land * Math.PI); }
      if (v.sp === 'yarn') rot += S.t * 1.5;
      if (v.sp === 'fly') y += Math.sin(S.t * 4 + v.id) * cell * 0.03;
      Art.blit(ctx, tileSprite(v, s), x, y, sc, v.alpha, rot, syv);
      if (v.sp === 'bomb' && Math.random() < 0.5) { ctx.fillStyle = Math.random() < 0.5 ? '#FFE24A' : '#FF8A2A'; ctx.fillRect(x + cell * 0.2 + Math.random() * 4, y - cell * 0.36 + Math.random() * 4, 3, 3); }
    }
    ctx.restore();
    // skrzynki i osłony
    S.ob.forEach((o, i) => {
      const x = cx(i % G.W), y = cy(Math.floor(i / G.W));
      if (o.crate) Art.blit(ctx, Art.crateSprite(cell, o.crate), x, y);
      if (o.cover && o.coverKind === 'web') Art.blit(ctx, Art.webSprite(cell), x, y);
      if (o.cover && o.coverKind === 'bling') { Art.blit(ctx, Art.blingSprite(cell), x, y, 1 + Math.sin(S.t * 5 + i) * 0.03); }
    });
    // Sroka
    if (G.boss) {
      const bxx = cx(G.boss.c + 0.5), byy = cy(G.boss.r + 0.5);
      if (S.bossHpV > 0) Art.drawMagpie(ctx, bxx, byy, cell * 2, S.t, S.bossAnim.hurt * 2, S.bossAnim.act);
      else { ctx.globalAlpha = 0.5; Art.drawMagpie(ctx, bxx, byy - (S.t % 10) * 20, cell * 2, S.t, 0, 1); ctx.globalAlpha = 1; }
    }
    for (const v of flying) Art.blit(ctx, tileSprite(v, cell), v.sx, v.sy, v.scale);
  }

  function drawFx() {
    const { cell, bx, by, bw, bh } = S.L;
    for (const f of S.fx) {
      const k = f.t / f.d;
      if (f.kind === 'rocket') {
        const x0 = cx(f.c), y0 = cy(f.r);
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = 'rgba(255,240,180,0.9)';
        if (f.dir === 'rh') ctx.fillRect(bx, y0 - cell * 0.18 * (1 - k), bw, cell * 0.36 * (1 - k));
        else ctx.fillRect(x0 - cell * 0.18 * (1 - k), by, cell * 0.36 * (1 - k), bh);
        ctx.restore();
        const dist = k * Math.max(bw, bh) * 1.1;
        for (const d of [-1, 1]) {
          const x = f.dir === 'rh' ? x0 + d * dist : x0;
          const y = f.dir === 'rv' ? y0 + d * dist : y0;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(f.dir === 'rh' ? (d > 0 ? Math.PI * 0.75 : -Math.PI * 0.25) : (d > 0 ? Math.PI * 1.25 : Math.PI * 0.25));
          Art.carrot(ctx, cell * 0.9);
          ctx.restore();
          if (Math.random() < 0.8) S.parts.push({ x, y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, g: 0, life: 0.3, max: 0.3, size: 4 + Math.random() * 4, color: Math.random() < 0.5 ? '#FFD43B' : '#FF7A2A', shape: 'circle', rot: 0, vr: 0 });
        }
      } else if (f.kind === 'boom') {
        const x = cx(f.c), y = cy(f.r);
        const R2 = cell * (f.rad + 0.6) * (0.3 + k * 1.2);
        ctx.strokeStyle = `rgba(255,200,90,${1 - k})`; ctx.lineWidth = cell * 0.25 * (1 - k);
        ctx.beginPath(); ctx.arc(x, y, R2, 0, Math.PI * 2); ctx.stroke();
        const gr = ctx.createRadialGradient(x, y, 0, x, y, R2);
        gr.addColorStop(0, `rgba(255,255,220,${0.8 * (1 - k)})`); gr.addColorStop(1, 'rgba(255,180,80,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, R2, 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'fly') {
        const e = k * k * (3 - 2 * k);
        const x = f.fx + (f.tx - f.fx) * e + Math.sin(k * Math.PI * 3) * cell * 0.6;
        const y = f.fy + (f.ty - f.fy) * e - Math.sin(k * Math.PI) * cell * 1.5;
        ctx.save(); ctx.translate(x, y); Art.butterfly(ctx, cell * 0.9, 2, Math.abs(Math.sin(S.t * 30)) * 0.8 + 0.2); ctx.restore();
        if (Math.random() < 0.6) burst(x, y, '#FFFFFF', 'star', 3);
      } else if (f.kind === 'yarn') {
        const x0 = cx(f.c), y0 = cy(f.r);
        const pal = Art.PAL[f.col] || Art.PAL[0];
        ctx.strokeStyle = pal.light; ctx.lineWidth = 3;
        f.targets.forEach(([r, c], i) => {
          const kk = Math.min(1, Math.max(0, k * 2 - i * 0.03));
          if (kk <= 0) return;
          ctx.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4;
          ctx.beginPath(); ctx.moveTo(x0, y0);
          ctx.quadraticCurveTo((x0 + cx(c)) / 2, (y0 + cy(r)) / 2 - cell, x0 + (cx(c) - x0) * kk, y0 + (cy(r) - y0) * kk);
          ctx.stroke();
          ctx.globalAlpha = 1;
        });
      } else if (f.kind === 'ring') {
        ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 6 * (1 - k);
        ctx.beginPath(); ctx.arc(f.x, f.y, cell * (0.3 + k * 0.8), 0, Math.PI * 2); ctx.stroke();
      } else if (f.kind === 'dig') {
        const x = cx(f.c);
        ctx.fillStyle = `rgba(160,100,40,${0.6 * (1 - k)})`;
        ctx.fillRect(x - cell * 0.45, by, cell * 0.9, bh);
        if (Math.random() < 0.9) burst(x + (Math.random() - 0.5) * cell, by + Math.random() * bh, '#8A5A2A', 'square', 5);
      } else if (f.kind === 'claw') {
        const y = cy(f.r);
        ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 6;
        for (let d = -1; d <= 1; d += 1) { ctx.beginPath(); ctx.moveTo(bx, y + d * cell * 0.22 - cell * 0.1); ctx.lineTo(bx + bw * Math.min(1, k * 2), y + d * cell * 0.22 + cell * 0.1); ctx.stroke(); }
      } else if (f.kind === 'gem') {
        const kk = Math.max(0, f.t / f.d);
        if (f.t < 0) continue;
        const x = f.fx + (f.tx - f.fx) * kk, y = f.fy + (f.ty - f.fy) * kk - Math.sin(Math.PI * kk) * cell;
        ctx.fillStyle = '#FFE24A'; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (f.kind === 'toGoal') {
        const a = goalAnchorFor(f.goal);
        const e = k * k;
        const x = f.fx + (a.x - f.fx) * e, y = f.fy + (a.y - f.fy) * e - Math.sin(Math.PI * k) * 60;
        Art.blit(ctx, Art.fruitSprite(f.col, cell * 0.5, 'happy'), x, y, 1 - k * 0.4, 0.9);
      }
    }
  }
  function goalAnchorFor(goal) {
    const list = S.goalRects || [];
    const r = list.find((x) => x.g === goal) || list.find((x) => x.g.type === goal.type && x.g.col === goal.col);
    return r ? { x: r.x, y: r.y } : { x: W / 2, y: 40 };
  }

  function drawParticles() {
    for (const p of S.parts) {
      const a = Math.min(1, p.life / (p.max * 0.5));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      const s = p.size;
      if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill(); }
      else if (p.shape === 'star') { ctx.beginPath(); for (let k = 0; k < 8; k += 1) { const r = k % 2 ? s * 0.25 : s * 0.7; ctx.lineTo(Math.cos(k * Math.PI / 4) * r, Math.sin(k * Math.PI / 4) * r); } ctx.closePath(); ctx.fill(); }
      else if (p.shape === 'leaf' || p.shape === 'feather') { ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.4, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (p.shape === 'spark') { ctx.fillRect(-s, -0.75, s * 2, 1.5); }
      else if (p.shape === 'conf') { ctx.fillRect(-s / 2, -s / 4, s, s / 2); }
      else ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
    }
    for (const t of S.texts) {
      const a = Math.min(1, t.life * 2);
      ctx.globalAlpha = a;
      text(t.text, t.x, t.y, 22 * t.scale, t.color, 'center', 700, '#5A2A06', 5);
      ctx.globalAlpha = 1;
    }
  }

  function drawWord() {
    const w = S.word;
    if (!w) return;
    const k = w.t;
    const sc = k < 0.25 ? 0.3 + (k / 0.25) * 0.9 : k < 0.4 ? 1.2 - (k - 0.25) / 0.15 * 0.2 : 1;
    const a = k > 1.0 ? 1 - (k - 1.0) / 0.3 : 1;
    const cols = ['#FFE07A', '#FFE07A', '#FF9AD0', '#9AF0FF'];
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.translate(S.L ? S.L.bx + S.L.bw / 2 : W / 2, S.L ? S.L.by + S.L.bh * 0.42 : H / 2);
    ctx.rotate(Math.sin(k * 6) * 0.04);
    ctx.scale(sc, sc);
    const size = Math.min(72, W * 0.12) * (0.85 + w.level * 0.1);
    text(w.text, 0, 0, size, cols[w.level] || '#FFE07A', 'center', 700, '#7A2A06', size * 0.2);
    ctx.restore();
  }

  // ---------------------------------------------------------------- HUD
  function goalIcon(g, x, y, s) {
    if (g.type === 'col') Art.blit(ctx, Art.fruitSprite(g.col, s, 'normal'), x, y, 0.95);
    else if (g.type === 'weed') Art.blit(ctx, Art.weedSprite(s), x, y, 0.8);
    else if (g.type === 'crate') Art.blit(ctx, Art.crateSprite(s, 1), x, y, 0.8);
    else if (g.type === 'web') { Art.blit(ctx, Art.fruitSprite(0, s * 0.8, 'normal'), x, y); Art.blit(ctx, Art.webSprite(s), x, y, 0.85); }
    else if (g.type === 'jar') Art.blit(ctx, Art.jarSprite(s), x, y, 0.95);
    else if (g.type === 'boss') { ctx.save(); ctx.beginPath(); ctx.rect(x - s / 2, y - s / 2, s, s); ctx.clip(); Art.drawMagpie(ctx, x - s * 0.2, y + s * 0.25, s * 1.1, S.t, 0, 0); ctx.restore(); }
  }

  function drawHud() {
    const L = S.L;
    const G = S.G;
    S.goalRects = [];
    const level = LEVELS[S.li];
    const starsNow = R.starsFor(level, S.scoreV);
    const sMax = level.stars[1] * 1.15;
    if (L.portrait) {
      const top = 8, h = Math.max(92, L.top - 16);
      panel(10, top, W - 20, h, 20);
      // ruchy
      const mx = 54, my = top + h / 2;
      const low = S.movesV <= 3 && G.status === 'play';
      const pul = low ? 1 + Math.sin(S.t * 10) * 0.06 : 1;
      ctx.fillStyle = low ? '#F2414E' : '#7A4E2A';
      ctx.beginPath(); ctx.arc(mx, my, 36 * pul, 0, Math.PI * 2); ctx.fill();
      text(String(Math.max(0, S.movesV)), mx, my - 5, 30, '#FFFFFF');
      text('ruchy', mx, my + 18, 12, '#FFE8C8', 'center', 600);
      // cele
      const n = S.goalsV.length;
      const gx0 = 104, gx1 = W - 140;
      const step = Math.min(78, (gx1 - gx0) / n);
      const gs = Math.min(46, step * 0.7, h * 0.5);
      S.goalsV.forEach((g, i) => {
        const x = gx0 + step * (i + 0.5) + ((gx1 - gx0) - step * n) / 2, y = top + h * 0.42;
        goalIcon(g, x, y, gs);
        S.goalRects.push({ g, x, y });
        if (g.left <= 0) text('✓', x + gs * 0.35, y + gs * 0.45, 20, '#3EA82A', 'center', 700, '#FFFFFF', 4);
        else text(String(g.left), x, y + gs * 0.62, 17, '#5A3416', 'center', 700, '#FFFFFF', 4);
      });
      // wynik i gwiazdki
      const sx = W - 128, sw = 106;
      text(String(S.scoreV), sx + sw / 2, top + 26, 20, '#5A3416');
      drawStarBar(sx, top + 48, sw, 10, S.scoreV / sMax, level.stars.map((t) => t / sMax), starsNow);
      button('menu', W - 58, top + h - 34, 44, 28, '☰', { size: 16, fn: () => { S.overlay = { kind: 'pause', t: 0 }; } });
      // dolny pasek z bohaterami
      const bt = H - L.bottom + 8;
      drawHero('P', W * 0.2, bt + (L.bottom - 16) / 2);
      drawHero('C', W * 0.8, bt + (L.bottom - 16) / 2);
      text(`${S.li + 1}. ${level.name}`, W / 2, bt + 22, 15, '#3A5A1A', 'center', 700, 'rgba(255,255,255,0.8)', 4);
      if (S.power) text(S.power === 'P' ? 'Puszek: wybierz kolumnę' : 'Persi: wybierz rząd', W / 2, bt + 48, 14, '#7A2A06', 'center', 700, '#FFFFFF', 4);
      else if (P.mode === 'S') text('tryb Spokojnie', W / 2, bt + 48, 12, '#4A6A2A', 'center', 600);
    } else {
      const pw = L.left - 24, px = 12;
      panel(px, 12, pw, H - 24, 20);
      text(`${S.li + 1}. ${level.name}`, px + pw / 2, 36, Math.min(18, pw * 0.09), '#5A3416');
      const mx = px + pw / 2, my = 100;
      const low = S.movesV <= 3 && G.status === 'play';
      ctx.fillStyle = low ? '#F2414E' : '#7A4E2A';
      ctx.beginPath(); ctx.arc(mx, my, 38 * (low ? 1 + Math.sin(S.t * 10) * 0.06 : 1), 0, Math.PI * 2); ctx.fill();
      text(String(Math.max(0, S.movesV)), mx, my - 6, 32, '#FFFFFF');
      text('ruchy', mx, my + 19, 12, '#FFE8C8', 'center', 600);
      const gs = Math.min(46, pw * 0.3);
      const cols = S.goalsV.length > 2 ? 2 : S.goalsV.length;
      S.goalsV.forEach((g, i) => {
        const x = px + pw * ((i % cols) + 0.5) / cols, y = 180 + Math.floor(i / cols) * (gs + 30);
        goalIcon(g, x, y, gs);
        S.goalRects.push({ g, x, y });
        if (g.left <= 0) text('✓', x + gs * 0.35, y + gs * 0.45, 20, '#3EA82A', 'center', 700, '#FFFFFF', 4);
        else text(String(g.left), x, y + gs * 0.62, 17, '#5A3416', 'center', 700, '#FFFFFF', 4);
      });
      const yy = H - 120;
      text(String(S.scoreV), px + pw / 2, yy, 22, '#5A3416');
      drawStarBar(px + 16, yy + 20, pw - 32, 10, S.scoreV / sMax, level.stars.map((t) => t / sMax), starsNow);
      button('menu', px + pw / 2 - 40, H - 70, 80, 34, 'Menu', { size: 15, fn: () => { S.overlay = { kind: 'pause', t: 0 }; } });
      const rx = W - L.right / 2;
      drawHero('P', rx, H * 0.3);
      drawHero('C', rx, H * 0.7);
      if (S.power) text(S.power === 'P' ? 'Wybierz kolumnę' : 'Wybierz rząd', rx, H * 0.5, 14, '#7A2A06', 'center', 700, '#FFFFFF', 4);
    }
    S.goalAnchors = { jar: (S.goalRects.find((r) => r.g.type === 'jar') || { x: W / 2, y: 40 }) };
  }

  function drawStarBar(x, y, w, h, frac, marks, stars) {
    ctx.fillStyle = 'rgba(90,52,22,0.25)';
    roundRect(x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = '#FFC23A';
    roundRect(x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2); ctx.fill();
    const pts = [0.08, ...marks];
    pts.forEach((m, i) => drawStar(x + w * Math.min(0.97, m), y + h / 2, 9, i < stars ? '#FFD43B' : '#E8DCC8', '#8A5A00'));
  }
  function drawStar(x, y, r, fill, edge) {
    ctx.beginPath();
    for (let k = 0; k < 10; k += 1) { const a = -Math.PI / 2 + k * Math.PI / 5; const rr = k % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 1.5; ctx.stroke();
  }

  function heroPos(h) {
    const L = S.L;
    if (!L) return { x: W / 2, y: H / 2 };
    if (L.portrait) return { x: W * (h === 'P' ? 0.2 : 0.8), y: H - L.bottom + 8 + (L.bottom - 16) / 2 };
    return { x: W - L.right / 2, y: H * (h === 'P' ? 0.3 : 0.7) };
  }

  function drawHero(h, x, y) {
    const ready = S.chargeV[h] >= R.HERO_NEED && S.G.status === 'play';
    const rad = Math.min(44, (S.L.portrait ? S.L.bottom : S.L.right) * 0.32);
    const st = S.hero[h];
    // pierścień ładowania
    ctx.fillStyle = ready ? 'rgba(255,240,170,0.95)' : 'rgba(255,250,240,0.85)';
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(90,52,22,0.2)'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = h === 'P' ? '#7BCB3A' : '#8E4BD6';
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, rad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (S.chargeV[h] / R.HERO_NEED)); ctx.stroke();
    ctx.lineCap = 'butt';
    if (ready) {
      ctx.strokeStyle = `rgba(255,220,80,${0.5 + Math.sin(S.t * 6) * 0.4})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, rad + 8 + Math.sin(S.t * 6) * 3, 0, Math.PI * 2); ctx.stroke();
      if (Math.random() < 0.1) sparkle(x + (Math.random() - 0.5) * rad * 2, y - rad * 0.5, '#FFE24A', 1);
    }
    if (S.power === h) { ctx.strokeStyle = '#F2414E'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, rad + 4, 0, Math.PI * 2); ctx.stroke(); }
    // postać
    const img = Art.imgs[h === 'P' ? 'rabbit' : 'cat'];
    const jump = st.jump > 0 ? Math.abs(Math.sin(st.jump * 9)) * rad * 0.35 : 0;
    if (img) {
      let fr;
      if (h === 'P') fr = st.jump > 0 ? Art.RABBIT.frames.jump : st.happy > 0 ? Art.RABBIT.frames.happy : (Math.floor(S.t * 0.7) % 6 === 0 ? Art.RABBIT.frames.blink : Art.RABBIT.frames.idle);
      else fr = st.jump > 0 ? Art.CAT.frames.air : (Math.floor(S.t / 4) % 5 === 4 ? Art.CAT.frames.yawn : Art.CAT.frames.sit);
      const meta = h === 'P' ? Art.RABBIT : Art.CAT;
      const sc = rad * 1.5 / meta.w;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, fr * meta.w, 0, meta.w, meta.h, x - meta.w * sc / 2, y - meta.h * sc * 0.62 - jump, meta.w * sc, meta.h * sc);
      ctx.imageSmoothingEnabled = true;
    }
    text(h === 'P' ? 'Puszek' : 'Persi', x, y + rad + 12, 13, '#3A2A1A', 'center', 700, 'rgba(255,255,255,0.9)', 4);
    if (ready) text('dotknij!', x, y - rad - 10, 12, '#7A2A06', 'center', 700, '#FFF2A0', 4);
    S.buttons.push({ id: `hero${h}`, x: x - rad, y: y - rad, w: rad * 2, h: rad * 2, fn: () => toggleHero(h) });
  }

  function toggleHero(h) {
    if (S.busy || !S.G || S.G.status !== 'play') return;
    if (S.chargeV[h] < R.HERO_NEED) { popText(heroPos(h).x, heroPos(h).y - 50, h === 'P' ? 'Zbieraj jabłka!' : 'Zbieraj śliwki!', '#FFFFFF'); SND.cue('bad'); return; }
    S.power = S.power === h ? null : h;
    S.sel = null;
    SND.cue('select');
  }

  // ---------------------------------------------------------------- nakładki
  function drawOverlay() {
    const o = S.overlay;
    if (!o) return;
    const level = LEVELS[S.li];
    ctx.fillStyle = `rgba(30,20,10,${Math.min(0.5, o.t * 2)})`;
    ctx.fillRect(0, 0, W, H);
    const pw = Math.min(460, W - 32);
    const k = Math.min(1, o.t * 4);
    const sc = 0.85 + 0.15 * (1 - Math.pow(1 - k, 3));
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(sc, sc);
    ctx.translate(-W / 2, -H / 2);
    if (o.kind === 'intro') {
      const ph = 300 + (level.tip ? 40 : 0);
      const x = (W - pw) / 2, y = (H - ph) / 2;
      panel(x, y, pw, ph, 26);
      text(`Poziom ${S.li + 1}`, W / 2, y + 34, 16, '#9A6A3A', 'center', 600);
      text(level.name, W / 2, y + 66, 28, '#5A3416');
      text('Cel:', W / 2, y + 102, 15, '#9A6A3A', 'center', 600);
      const n = S.goalsV.length, gs = 54;
      S.goalsV.forEach((g, i) => {
        const gx = W / 2 + (i - (n - 1) / 2) * 90, gy = y + 150;
        goalIcon(g, gx, gy, gs);
        text(g.type === 'boss' ? `${g.left} ♥` : String(g.left), gx, gy + 42, 18, '#5A3416', 'center', 700, '#FFFFFF', 4);
      });
      text(`Masz ${S.G.moves} ruchów`, W / 2, y + 214, 16, '#7A4E2A', 'center', 600);
      if (level.tip) wrap(level.tip, W / 2, y + 248, pw - 50, 15, '#3A6A1A');
      button('go', W / 2 - 90, y + ph - 70, 180, 52, 'Graj!', { fn: () => { S.overlay = null; SND.resume(); SND.cue('click'); } });
    } else if (o.kind === 'pause') {
      const ph = 300, x = (W - pw) / 2, y = (H - ph) / 2;
      panel(x, y, pw, ph, 26);
      text('Pauza', W / 2, y + 40, 28, '#5A3416');
      button('resume', W / 2 - 110, y + 76, 220, 46, 'Graj dalej', { fn: () => { S.overlay = null; } });
      button('restart', W / 2 - 110, y + 134, 220, 46, 'Od nowa', { c1: '#BFE8FF', c2: '#5AA8E8', edge: '#1A4A7A', ink: '#06223A', fn: () => startLevel(S.li) });
      button('map', W / 2 - 110, y + 192, 220, 46, 'Mapa ogrodu', { c1: '#C8F0A0', c2: '#6AB84A', edge: '#2A6A1A', ink: '#0A2A06', fn: () => openMap() });
      text(SND.musicOn ? 'Muzyka: włączona (M)' : 'Muzyka: wyłączona (M)', W / 2, y + 268, 14, '#7A4E2A', 'center', 600);
      S.buttons.push({ id: 'music', x: W / 2 - 110, y: y + 254, w: 220, h: 28, fn: () => SND.toggleMusic() });
    } else if (o.kind === 'win') {
      const ph = Math.min(400, H - 20), x = (W - pw) / 2, y = (H - ph) / 2;
      panel(x, y, pw, ph, 26);
      text('Brawo!', W / 2, y + 42, 34, '#5A3416');
      for (let i = 0; i < 3; i += 1) {
        const appear = o.t - 0.4 - i * 0.35;
        const on = i < o.stars;
        if (appear > 0 && appear < 0.05 && on) SND.cue('star', { n: i });
        const s = appear > 0 ? Math.min(1, appear * 5) : 0;
        const big = on ? 1 + Math.max(0, 0.3 - appear) : 1;
        ctx.save();
        ctx.translate(W / 2 + (i - 1) * 70, y + 108 - (i === 1 ? 12 : 0));
        ctx.scale(on ? s * big : 1, on ? s * big : 1);
        drawStar(0, 0, 28, on ? '#FFD43B' : '#E8DCC8', '#8A5A00');
        ctx.restore();
      }
      text(`Wynik: ${o.score}`, W / 2, y + 168, 20, '#7A4E2A', 'center', 600);
      text(o.first ? 'Nowość w ogrodzie:' : 'Rekord poziomu:', W / 2, y + 204, 15, '#9A6A3A', 'center', 600);
      text(o.first ? level.reward : String(P.b[S.li] || o.score), W / 2, y + 230, Math.min(22, pw / 18), '#3A7A1A');
      const last = S.li === LEVELS.length - 1;
      button('next', W / 2 - 110, y + ph - 116, 220, 46, last ? 'Do ogrodu!' : 'Dalej', { fn: () => { if (last) openMap(); else openMap(); } });
      button('again', W / 2 - 110, y + ph - 58, 220, 38, 'Jeszcze raz', { size: 16, c1: '#BFE8FF', c2: '#5AA8E8', edge: '#1A4A7A', ink: '#06223A', fn: () => startLevel(S.li) });
    } else if (o.kind === 'lose' || o.kind === 'extra') {
      const ph = 300, x = (W - pw) / 2, y = (H - ph) / 2;
      panel(x, y, pw, ph, 26);
      text('Zabrakło ruchów!', W / 2, y + 42, 28, '#5A3416');
      const left = S.goalsV.filter((g) => g.left > 0);
      left.forEach((g, i) => { const gx = W / 2 + (i - (left.length - 1) / 2) * 80; goalIcon(g, gx, y + 104, 46); text(String(g.left), gx, y + 140, 17, '#5A3416', 'center', 700, '#FFFFFF', 4); });
      if (o.kind === 'extra') {
        text('Babcia Ludwika daje ci 5 ruchów!', W / 2, y + 178, 16, '#3A7A1A', 'center', 600);
        button('plus', W / 2 - 110, y + ph - 74, 220, 52, '+5 ruchów', { fn: () => { R.addMoves(S.G, 5); S.movesV = S.G.moves; S.overlay = null; SND.cue('create'); } });
      } else {
        button('again', W / 2 - 110, y + ph - 120, 220, 48, 'Spróbuj jeszcze raz', { size: 18, fn: () => startLevel(S.li) });
        button('map', W / 2 - 110, y + ph - 64, 220, 40, 'Mapa ogrodu', { size: 16, c1: '#C8F0A0', c2: '#6AB84A', edge: '#2A6A1A', ink: '#0A2A06', fn: () => openMap() });
      }
    }
    ctx.restore();
  }

  function wrap(str, x, y, maxW, size, color) {
    ctx.font = `600 ${size}px Fredoka, sans-serif`;
    const words = str.split(' ');
    let line = '', yy = y;
    const lines = [];
    for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
    lines.forEach((l, i) => text(l, x, yy + i * size * 1.25 - (lines.length - 1) * size * 0.6, size, color, 'center', 600));
  }

  // ---------------------------------------------------------------- ekran tytułowy i mapa
  function openMap() {
    S.scene = 'map'; S.overlay = null; S.G = null; S.L = null;
    if (S.newReward >= 0) { S.rewardT = 2.5; SND.cue('reward'); }
  }

  function gardenScene(showAll) {
    Art.drawGardenBase(ctx, W, H, S.t);
    const unlocked = Object.keys(P.s).length;
    const sc = Math.min(W, H) * 0.22;
    Art.GARDEN_ITEMS.forEach((it, i) => {
      if (!showAll && !(P.s[i] > 0)) return;
      let s = sc;
      if (i === S.newReward && S.rewardT > 0) { const k = 1 - S.rewardT / 2.5; s = sc * Math.min(1, k * 3) * (1 + Math.max(0, 0.3 - k) ); if (Math.random() < 0.4) sparkle(it.x * W, it.y * H - sc * 0.3, '#FFE24A', 1); }
      if (s > 0) Art.drawGardenItem(ctx, it.kind, it.x * W, it.y * H, s, S.t);
    });
    return unlocked;
  }

  function drawTitle() {
    gardenScene(false);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, 0, W, H);
    const tsize = Math.min(64, W * 0.1);
    text('Ogród', W / 2, H * 0.17, tsize * 0.8, '#FFFFFF', 'center', 700, '#C2183A', tsize * 0.16);
    text('Babci Ludwiki', W / 2, H * 0.17 + tsize, tsize, '#FFE07A', 'center', 700, '#7A2A06', tsize * 0.18);
    text('Przygoda 4 · Puszek i Persi', W / 2, H * 0.17 + tsize * 1.75, Math.min(20, W * 0.045), '#5A3416', 'center', 600, 'rgba(255,255,255,0.85)', 5);
    // owoce dookoła
    for (let k = 0; k < 6; k += 1) {
      const a = S.t * 0.6 + k * Math.PI / 3;
      Art.blit(ctx, Art.fruitSprite(k, 54, Math.floor(S.t * 0.8 + k) % 7 === 0 ? 'blink' : 'happy'), W / 2 + Math.cos(a) * Math.min(W * 0.4, 260), H * 0.47 + Math.sin(a) * 44, 1);
    }
    const r = Art.imgs.rabbit, c = Art.imgs.cat;
    ctx.imageSmoothingEnabled = false;
    const hop = Math.abs(Math.sin(S.t * 3)) * 18;
    if (r) ctx.drawImage(r, (Math.floor(S.t * 2) % 2 ? 10 : 12) * 34, 0, 34, 36, W / 2 - 110, H * 0.47 - 40 - hop, 102, 108);
    if (c) ctx.drawImage(c, (Math.floor(S.t * 1.5) % 2) * 34, 0, 34, 30, W / 2 + 10, H * 0.47 - 20, 102, 90);
    ctx.imageSmoothingEnabled = true;
    const by = H * 0.66;
    const bw = Math.min(300, W - 60);
    button('play', W / 2 - bw / 2, by, bw, 60, 'Graj!', { size: 28, fn: () => { SND.resume(); SND.cue('click'); openMap(); } });
    // tryb
    const mw = bw / 2 - 6;
    const mode = (m, x, label) => {
      const on = P.mode === m;
      button(`mode${m}`, x, by + 76, mw, 40, label, on ? { size: 15, c1: '#9AE0FF', c2: '#4AA0E0', edge: '#1A4A7A', ink: '#06223A', fn: () => setMode(m) } : { size: 15, c1: '#FFFFFF', c2: '#E8E0D0', edge: '#A89878', ink: '#7A6A50', fn: () => setMode(m) });
    };
    mode('S', W / 2 - bw / 2, 'SPOKOJNIE');
    mode('C', W / 2 + 6, 'CZADOWO');
    text(P.mode === 'S' ? 'Więcej ruchów, a po ich końcu babcia daje +5.' : 'Mniej ruchów – koniec ruchów to przegrana.', W / 2, by + 136, 13, '#3A5A1A', 'center', 600, 'rgba(255,255,255,0.85)', 4);
    text('⌂ Wszystkie gry', 70, H - 24, 14, '#3A5A1A', 'center', 700, 'rgba(255,255,255,0.85)', 4);
    S.buttons.push({ id: 'home', x: 10, y: H - 44, w: 130, h: 40, fn: () => { location.href = `../${location.search}`; } });
    text(SND.musicOn ? '♪ muzyka wł.' : '♪ muzyka wył.', W - 70, H - 24, 14, '#3A5A1A', 'center', 700, 'rgba(255,255,255,0.85)', 4);
    S.buttons.push({ id: 'mus', x: W - 140, y: H - 44, w: 130, h: 40, fn: () => { SND.resume(); SND.toggleMusic(); } });
  }
  function setMode(m) { P.mode = m; save(); SND.resume(); SND.cue('select'); }

  function mapLayout() {
    const portrait = H >= W;
    const cols = portrait ? 4 : 8;
    const rows = Math.ceil(LEVELS.length / cols);
    const top = portrait ? 140 : 100, bottom = portrait ? 90 : 70;
    const nodes = [];
    for (let i = 0; i < LEVELS.length; i += 1) {
      const row = Math.floor(i / cols), k = i % cols;
      const col = row % 2 ? cols - 1 - k : k;
      const x = W * (0.1 + 0.8 * (col + 0.5) / cols);
      const y = H - bottom - (H - top - bottom) * (row + 0.5) / rows + Math.sin(i * 1.3) * 8;
      nodes.push({ x, y });
    }
    S.mapNodes = nodes;
    return nodes;
  }

  function drawMap() {
    gardenScene(false);
    const nodes = mapLayout();
    // ścieżka
    ctx.strokeStyle = 'rgba(255,248,230,0.85)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.setLineDash([2, 18]);
    ctx.beginPath(); nodes.forEach((n, i) => (i ? ctx.lineTo(n.x, n.y) : ctx.moveTo(n.x, n.y))); ctx.stroke();
    ctx.setLineDash([]); ctx.lineCap = 'butt';
    const rad = Math.min(30, W * 0.055);
    nodes.forEach((n, i) => {
      const open = i <= P.u;
      const st = P.s[i] || 0;
      const cur = i === P.u;
      const boss = !!LEVELS[i].boss;
      const pul = cur ? 1 + Math.sin(S.t * 5) * 0.08 : 1;
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(n.x, n.y + rad * 0.9, rad, rad * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      const gr = ctx.createRadialGradient(n.x - rad * 0.3, n.y - rad * 0.3, 2, n.x, n.y, rad * pul);
      gr.addColorStop(0, open ? (boss ? '#C8A0FF' : '#FFF2A0') : '#E8E8E8');
      gr.addColorStop(1, open ? (boss ? '#6A3AB8' : '#F2A52A') : '#9A9A9A');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(n.x, n.y, rad * pul, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.stroke();
      if (boss && open) { ctx.save(); ctx.beginPath(); ctx.arc(n.x, n.y, rad * 0.9, 0, Math.PI * 2); ctx.clip(); Art.drawMagpie(ctx, n.x - rad * 0.2, n.y + rad * 0.2, rad * 1.6, S.t, 0, 0); ctx.restore(); }
      else text(open ? String(i + 1) : '🔒', n.x, n.y + 1, rad * 0.8, open ? '#5A2A06' : '#FFFFFF');
      if (open) for (let k = 0; k < 3; k += 1) drawStar(n.x + (k - 1) * rad * 0.62, n.y - rad - 4 - (k === 1 ? 4 : 0), rad * 0.28, k < st ? '#FFD43B' : 'rgba(255,255,255,0.7)', '#8A5A00');
      if (cur && !S.rewardT) {
        const img = Art.imgs.rabbit;
        if (img) { ctx.imageSmoothingEnabled = false; ctx.drawImage(img, 0, 0, 34, 36, n.x - rad * 1.1, n.y - rad * 2.6 - Math.abs(Math.sin(S.t * 4)) * 8, rad * 2.2, rad * 2.3); ctx.imageSmoothingEnabled = true; }
      }
      if (open) S.buttons.push({ id: `node${i}`, x: n.x - rad, y: n.y - rad, w: rad * 2, h: rad * 2, fn: () => { SND.resume(); SND.cue('click'); startLevel(i); } });
    });
    const total = Object.values(P.s).reduce((a, b) => a + b, 0);
    const hw = Math.min(300, W - 108), hx = Math.max(W / 2 - hw / 2, 92), hc = hx + hw / 2;
    panel(hx, 12, hw, 62, 20);
    text('Ogród Babci Ludwiki', hc, 34, Math.min(20, hw / 13), '#5A3416');
    drawStar(hc - 30, 56, 9, '#FFD43B', '#8A5A00');
    text(`${total} / ${LEVELS.length * 3}`, hc + 14, 57, 15, '#7A4E2A', 'center', 700);
    button('back', 12, 12, 70, 40, '←', { size: 20, c1: '#FFFFFF', c2: '#E8E0D0', edge: '#A89878', ink: '#5A3416', fn: () => { S.scene = 'title'; } });
    if (S.rewardT > 0 && S.newReward >= 0) {
      const k = Math.min(1, (2.5 - S.rewardT) * 3);
      ctx.globalAlpha = Math.min(1, S.rewardT * 2);
      panel(W / 2 - 170, H * 0.42, 340, 70, 20, 'rgba(255,250,220,0.97)');
      text('Nowość w ogrodzie!', W / 2, H * 0.42 + 22, 15, '#9A6A3A', 'center', 600);
      text(LEVELS[S.newReward].reward, W / 2, H * 0.42 + 48, 22 * (0.8 + 0.2 * k), '#3A7A1A');
      ctx.globalAlpha = 1;
      if (S.rewardT <= 0.05) S.newReward = -1;
    }
    if (P.s[LEVELS.length - 1]) text('Ogród gotowy na wielkie święto! 🎉', W / 2, H - 30, 16, '#7A2A06', 'center', 700, '#FFF2A0', 5);
  }

  // ---------------------------------------------------------------- pętla
  function frame() {
    S.buttons = [];
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (S.scene === 'title') drawTitle();
    else if (S.scene === 'map') drawMap();
    else if (S.scene === 'play' && S.G) {
      drawBackground();
      ctx.save();
      if (S.shake > 0) ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
      drawBoard();
      drawFx();
      ctx.restore();
      drawHud();
      drawParticles();
      drawWord();
      if (S.flash > 0) { ctx.fillStyle = `rgba(255,255,240,${S.flash * 0.6})`; ctx.fillRect(0, 0, W, H); }
      drawOverlay();
    }
    if (S.scene !== 'play') drawParticles();
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    frame();
    requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------------- sterowanie
  function cellAt(x, y) {
    if (!S.L || !S.G) return null;
    const c = Math.floor((x - S.L.bx) / S.L.cell), r = Math.floor((y - S.L.by) / S.L.cell);
    if (r < 0 || c < 0 || r >= S.G.H || c >= S.G.W) return null;
    if (S.G.cells[r * S.G.W + c].v) return null;
    return [r, c];
  }
  function attemptSwap(a, b) {
    const G = S.G;
    if (!G || S.busy || G.status !== 'play') return;
    const A = R.at(G, a[0], a[1]), B = R.at(G, b[0], b[1]);
    if (!B || B.v) return;
    const steps = R.trySwap(G, a, b);
    S.sel = null;
    if (steps) { runSteps(steps); return; }
    if (A && B && A.tile && B.tile && !A.cover && !B.cover && !A.crate && !B.crate) runSteps([{ type: 'bad', ida: A.tile.id, idb: B.tile.id }]);
    else SND.cue('bad');
  }

  function pointerPos(e) { return { x: e.clientX, y: e.clientY }; }
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    SND.resume();
    const p = pointerPos(e);
    S.pointer = p;
    for (let k = S.buttons.length - 1; k >= 0; k -= 1) {
      const b = S.buttons[k];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { if (b.fn) b.fn(); return; }
    }
    if (S.scene !== 'play' || S.overlay || S.busy) return;
    const cell = cellAt(p.x, p.y);
    if (!cell) { S.sel = null; return; }
    S.idle = 0; S.hint = null;
    if (S.power) {
      const h = S.power;
      S.power = null;
      const steps = R.usePower(S.G, h, cell[0], cell[1]);
      if (steps) { S.chargeV[h] = 0; S.hero[h].readyShown = false; S.hero[h].jump = 0.8; runSteps(steps); }
      return;
    }
    S.drag = { cell, x: p.x, y: p.y };
  });
  cv.addEventListener('pointermove', (e) => {
    const p = pointerPos(e);
    S.pointer = p;
    if (S.power) S.powerCell = cellAt(p.x, p.y);
    if (!S.drag || !S.L) return;
    const dx = p.x - S.drag.x, dy = p.y - S.drag.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < S.L.cell * 0.33) return;
    const a = S.drag.cell;
    const b = Math.abs(dx) > Math.abs(dy) ? [a[0], a[1] + Math.sign(dx)] : [a[0] + Math.sign(dy), a[1]];
    S.drag = null;
    attemptSwap(a, b);
  });
  cv.addEventListener('pointerup', () => {
    if (!S.drag) return;
    const a = S.drag.cell;
    S.drag = null;
    if (S.sel && Math.abs(S.sel[0] - a[0]) + Math.abs(S.sel[1] - a[1]) === 1) { attemptSwap(S.sel, a); return; }
    if (S.sel && S.sel[0] === a[0] && S.sel[1] === a[1]) { S.sel = null; return; }
    S.sel = a;
    SND.cue('select');
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') SND.toggleMusic();
    if (e.key === 'Escape' && S.scene === 'play' && !S.overlay) S.overlay = { kind: 'pause', t: 0 };
  });
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));

  // ---------------------------------------------------------------- start
  resize();
  Art.load(() => {});
  const direct = Number(params.get('poziom'));
  if (direct >= 1 && direct <= LEVELS.length) { if (direct - 1 > P.u) P.u = direct - 1; startLevel(direct - 1); }
  requestAnimationFrame(loop);
  window.__p4 = { S, P, startLevel, openMap, R };
})();
