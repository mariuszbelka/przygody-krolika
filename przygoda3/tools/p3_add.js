  // =====================================================================
  // PRZYGODA 3: Zaczarowany Las – wybór bohatera, leśni wrogowie, moce
  // =====================================================================
  let HERO = safeLoadText('PuszekP3Hero', 'P') === 'C' ? 'C' : 'P';
  const HERO_NAME = () => (HERO === 'C' ? 'Persi' : 'Puszek');
  function heroSpeed() { return HERO === 'C' ? 1.12 : 1; }
  function syncHeroUi() {
    document.querySelectorAll('#heroRow button').forEach((b) => b.classList.toggle('on', b.dataset.hero === HERO));
    const cap = document.getElementById('heroCap');
    if (cap) {
      cap.textContent = HERO === 'C'
        ? 'Persi: szybszy, wyżej skacze, wspina się po pnączach (trzymaj skok), X – zryw z pazurkami.'
        : 'Puszek: podwójny skok, X – rzut bobkiem, w locie ↓ – tupnięcie.';
    }
    const sb = document.getElementById('mobileShootBtn');
    if (sb) sb.innerHTML = HERO === 'C' ? 'ZRYW' : 'BOBEK';
  }
  function setHero(h) {
    HERO = h === 'C' ? 'C' : 'P';
    safeSave('PuszekP3Hero', HERO);
    syncHeroUi();
    audio.cue(HERO === 'C' ? 'meow' : 'jump');
  }
  document.querySelectorAll('#heroRow button').forEach((b) => {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); setHero(b.dataset.hero); });
  });
  syncHeroUi();

  // ---------- grafika przedmiotów ----------
  (function buildForestItems() {
    const oldGolden = ITEM_ART.get('golden');
    if (oldGolden) ITEM_ART.set('lettuce', oldGolden); // Turbo-marchew
    const acorn = (gold) => {
      const g = new PixelGrid(14, 18);
      const mats = gold
        ? [makeMat('#C9902A', '#4A2A06'), makeMat('#FFD64A', '#5A3A06'), makeMat('#7A4A10', null, { flat: true })]
        : [makeMat('#7A4E2A', '#2A160A'), makeMat('#C88A4A', '#3A200C'), makeMat('#4A2A12', null, { flat: true })];
      g.ellipse(7, 11.6, 3.6, 4.4, 1);
      g.ellipse(7, 7.4, 4.8, 2.8, 0);
      g.pattern(0, (x, y) => (x + y) % 3 === 0, -1);
      g.rect(6.5, 3, 1.4, 2.2, 2);
      g.put(5, 10, 1, 3);
      g.put(5, 11, 1, 3);
      return { canvas: g.render(mats), ox: 1, oy: 1 };
    };
    ITEM_ART.set('carrot', acorn(false));
    ITEM_ART.set('golden', acorn(true));
    {
      const g = new PixelGrid(14, 17);
      const mats = [makeMat('#BFE6F2', '#2A4A5E', { tones: ['#7AA8C0', '#A8D4E8', '#D6F2FF', '#FFFFFF'] }), makeMat('#8A5A2C', '#2A160A'), makeMat('#FFE65A', null, { flat: true }), makeMat('#FFFFFF', null, { flat: true })];
      g.rect(2, 4, 10, 12, 0);
      g.ellipse(7, 15, 5, 1.6, 0);
      g.rect(1.5, 1.5, 11, 3, 1);
      [[4, 8], [9, 7], [6, 11], [10, 12], [5, 14]].forEach(([x, y]) => g.put(x, y, 2));
      g.rect(3, 5, 1, 6, 3);
      ITEM_ART.set('diamond', { canvas: g.render(mats), ox: 1, oy: 1 });
    }
    {
      const g = new PixelGrid(16, 16);
      const mats = [makeMat('#E8475A', '#4A0E16'), makeMat('#D8DEE8', '#2A2E3A')];
      g.capsule(4, 4, 4, 10, 2.4, 2.4, 0);
      g.capsule(12, 4, 12, 10, 2.4, 2.4, 0);
      g.ellipse(8, 11, 6.2, 4, 0);
      g.ellipse(8, 10, 2.6, 2.2, -1);
      for (let y = 0; y < 16; y += 1) for (let x = 0; x < 16; x += 1) if (Math.abs(x - 8) < 2.6 && Math.abs(y - 10) < 2.4) g.mat[y * 16 + x] = -1;
      g.rect(2, 1, 5, 3, 1);
      g.rect(10, 1, 5, 3, 1);
      ITEM_ART.set('magnet', { canvas: g.render(mats), ox: 2, oy: 1 });
    }
    {
      const g = new PixelGrid(16, 16);
      const mats = [makeMat('#8FD8FF', '#2A6E9A', { tones: ['#4A9AD0', '#7AC4F0', '#B8E8FF', '#FFFFFF'] }), makeMat('#FFFFFF', null, { flat: true })];
      for (let y = 0; y < 16; y += 1) for (let x = 0; x < 16; x += 1) { const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8); if (d < 7.4 && d > 5.6) g.put(x, y, 0, d > 6.5 ? 1 : 2); }
      g.rect(4, 4, 2, 2, 1);
      g.put(6, 3, 1);
      ITEM_ART.set('bubble', { canvas: g.render(mats), ox: 2, oy: 1 });
    }
  })();

  // ---------- leśni wrogowie (PixelGrid 34×30, ślad 24×21 jak koty) ----------
  const forestCache = new Map();
  function forestMats(kind) {
    const pals = {
      walker: [['#E9473F', '#4A0E0E'], ['#F4ECD8', '#4A3A2A'], ['#FFFFFF', null], ['#1A1420', null], ['#8A5A3A', '#2A160A']],
      hopper: [['#5FBF4A', '#163A14'], ['#B8E87A', '#1E4A1A'], ['#FFFFFF', null], ['#1A1420', null], ['#3E8A32', '#163A14']],
      hedgehog: [['#7A5A3E', '#24160C'], ['#E8C8A0', '#4A2E18'], ['#FFFFFF', null], ['#1A1420', null], ['#4A321E', '#1A0E06']],
      squirrel: [['#D9762E', '#4A1E06'], ['#F4D8B0', '#4A2E18'], ['#FFFFFF', null], ['#1A1420', null], ['#B85A1E', '#3A1606']],
      bee: [['#FFD23A', '#3A2A06'], ['#2A2230', '#120E16'], ['#FFFFFF', null], ['#1A1420', null], ['#DDEEFF', '#7A8AA8']],
      boss: [['#B8402E', '#3A0E08'], ['#F0E2C4', '#4A3A2A'], ['#FFFFFF', null], ['#1A1420', null], ['#FFC62E', '#5A3A06']]
    };
    return (pals[kind] || pals.walker).map(([c, o], i) => (i === 2 || i === 3) ? makeMat(c, null, { flat: true }) : makeMat(c, o));
  }
  function buildForestEnemy(kind, frame = 0, state = 'walk') {
    const key = `${kind}|${frame}|${state}`;
    const hit = forestCache.get(key);
    if (hit) return hit;
    const g = new PixelGrid(34, 30);
    const X = (v) => 5 + v;
    const Y = (v) => 7 + v;
    const stun = state === 'stun';
    const air = state === 'air';
    const warn = state === 'warn';
    const eye = (x, y, big = 1.3) => {
      if (stun) { g.put(X(x - 1), Y(y - 1), 3); g.put(X(x + 1), Y(y + 1), 3); g.put(X(x + 1), Y(y - 1), 3); g.put(X(x - 1), Y(y + 1), 3); g.put(X(x), Y(y), 3); return; }
      g.ellipse(X(x), Y(y), big, big + 0.3, 2, 0, true);
      g.put(X(x + 0.4), Y(y + 0.2), 3);
    };
    const step = frame ? 1 : -1;
    if (kind === 'walker' || kind === 'boss') {
      const sq = warn ? 1.2 : 0;
      g.ellipse(X(12), Y(15 + sq * 0.5), 6, 6 - sq * 0.5, 1);
      if (!air) { g.ellipse(X(8 + step), Y(20.5), 2.4, 1.2, 4); g.ellipse(X(16 - step), Y(20.5), 2.4, 1.2, 4); }
      else { g.ellipse(X(9), Y(19.5), 2, 1.2, 4); g.ellipse(X(15), Y(19.5), 2, 1.2, 4); }
      g.ellipse(X(12), Y(8 + sq), 11.5, 6.4 - sq * 0.4, 0);
      g.pattern(0, (x, y) => y > Y(10 + sq), -1);
      [[6, 6], [12, 4], [17, 7], [9, 10], [15, 10.5]].forEach(([x, y]) => g.ellipse(X(x), Y(y + sq), 1.5, 1.2, 2, 0, true));
      eye(9.6, 15.5);
      eye(14.4, 15.5);
      if (kind === 'boss') {
        g.rect(X(8), Y(-1), 9, 2, 4);
        g.put(X(8), Y(-2), 4); g.put(X(12), Y(-3), 4); g.put(X(12), Y(-2), 4); g.put(X(16), Y(-2), 4);
        g.rect(X(9.5), Y(13.2), 2.5, 0.8, 3, 2);
        g.rect(X(13), Y(13.2), 2.5, 0.8, 3, 2);
      }
    } else if (kind === 'hopper') {
      const crouch = warn ? 1.5 : 0;
      g.ellipse(X(12), Y(15 + crouch * 0.6), 9, 5.5 - crouch * 0.4, 0);
      g.ellipse(X(12), Y(17 + crouch * 0.4), 6, 3, 1);
      g.ellipse(X(7.5), Y(10 + crouch), 3, 3, 0);
      g.ellipse(X(16.5), Y(10 + crouch), 3, 3, 0);
      eye(7.5, 9.6 + crouch, 1.6);
      eye(16.5, 9.6 + crouch, 1.6);
      if (air) { g.capsule(X(5), Y(18), X(1), Y(21), 1.4, 1, 4); g.capsule(X(19), Y(18), X(23), Y(21), 1.4, 1, 4); }
      else { g.ellipse(X(4), Y(20.4), 3.4, 1.2, 4); g.ellipse(X(20), Y(20.4), 3.4, 1.2, 4); }
      g.rect(X(9.5), Y(15.6), 5, 0.8, 3, 2);
    } else if (kind === 'hedgehog') {
      const ball = stun;
      if (ball) {
        g.ellipse(X(12), Y(14), 8, 7, 0);
      } else {
        g.ellipse(X(11), Y(15), 9, 5.6, 0);
        g.ellipse(X(19), Y(16.4), 4, 3.4, 1);
        g.put(X(23), Y(16.4), 3);
        g.put(X(22.8), Y(15.6), 3);
        eye(19.4, 14.6, 1);
        g.ellipse(X(7 + step), Y(20.6), 2, 1, 4);
        g.ellipse(X(16 - step), Y(20.6), 2, 1, 4);
      }
      for (let k = 0; k < 9; k += 1) {
        const a = Math.PI * (0.95 + k * 0.12);
        const cx = ball ? 12 : 11;
        const cy = ball ? 14 : 15;
        const r = ball ? 7 : 5.5;
        g.tri(X(cx + Math.cos(a) * r * 0.7 - 1.4), Y(cy + Math.sin(a) * r * 0.7), X(cx + Math.cos(a) * r * 0.7 + 1.4), Y(cy + Math.sin(a) * r * 0.7), X(cx + Math.cos(a) * (r + 3.4)), Y(cy + Math.sin(a) * (r + 3.4)), 4, 1);
      }
    } else if (kind === 'squirrel') {
      const t = warn ? -1 : 0;
      g.ellipse(X(5), Y(9 + t), 4.4, 7, 0);
      g.ellipse(X(4), Y(4 + t), 3.6, 3, 0);
      g.pattern(0, (x, y) => x < X(5), -1);
      g.ellipse(X(13), Y(15), 5, 5.4, 0);
      g.ellipse(X(14), Y(16.4), 3, 3.4, 1);
      g.ellipse(X(16), Y(9), 4.4, 4, 0);
      g.tri(X(14), Y(6), X(16), Y(6), X(14.6), Y(2.4), 0, 1);
      g.tri(X(17), Y(6), X(19), Y(6), X(18.4), Y(2.6), 0, 1);
      g.ellipse(X(19.2), Y(10.4), 1.6, 1.2, 1);
      eye(17, 8.6, 1.1);
      g.put(X(20.4), Y(10), 3);
      g.ellipse(X(11 + step), Y(20.5), 2, 1, 4);
      g.ellipse(X(16 - step), Y(20.5), 2, 1, 4);
      if (warn) g.ellipse(X(20), Y(12), 2, 2, 4);
    } else if (kind === 'bee') {
      const wing = frame ? -2 : 0;
      g.ellipse(X(8), Y(5 + wing), 4.4, 3, 4, 0, true);
      g.ellipse(X(15), Y(5 + wing), 4.4, 3, 4, 0, true);
      g.ellipse(X(12), Y(12), 8.4, 6, 0);
      g.pattern(0, (x) => (x - X(4)) % 5 < 2 && x < X(16), -3);
      for (let y = 0; y < 30; y += 1) for (let x = 0; x < 34; x += 1) { const i = y * 34 + x; if (g.mat[i] === 0 && (x - X(4)) % 5 < 2 && x < X(15)) g.mat[i] = 1; }
      eye(16.5, 10.6, 1.3);
      g.tri(X(3), Y(12), X(3), Y(14), X(-0.5), Y(13), 3, 2);
    }
    const surface = g.render(forestMats(kind));
    forestCache.set(key, surface);
    return surface;
  }

  // ---------- stan P3 ----------
  function p3ResetLevel(source) {
    game.vines = (source.vines || []).map((v) => ({ ...v }));
    game.cones = [];
    game.scatter = [];
    game.magnet = 0;
    game.chaseX = source.chase ? source.startX - 360 : -1e9;
    game.vineHintShown = false;
    if (HERO === 'C') game.guide.doubleDone = true;
  }

  function enemyBaseSpeed(spawn, levelIndex) {
    if (spawn.boss) return 1.16;
    switch (spawn.kind) {
      case 'hopper': return 0.72;
      case 'hedgehog': return 0.7;
      case 'squirrel': return 0.32;
      case 'bee': return 1.15;
      default: return 0.88 + levelIndex * 0.03;
    }
  }

  function updateBee(enemy) {
    if (enemy.baseY === undefined) { enemy.baseY = enemy.y; enemy.t = Math.random() * 100; }
    enemy.t += 1;
    enemy.walkTick += 1;
    if (enemy.walkTick >= 3) { enemy.walkTick = 0; enemy.walkFrame ^= 1; }
    if (enemy.hitPause > 0) { enemy.hitPause -= 1; return; }
    if (enemy.pooped) {
      enemy.poopTimer -= 1;
      enemy.y = Math.min(enemy.baseY + 40, enemy.y + 0.8);
      if (enemy.poopTimer <= 0) enemy.pooped = false;
      return;
    }
    enemy.x += enemy.facingLeft ? -enemy.vx : enemy.vx;
    if (enemy.x <= enemy.minX) { enemy.x = enemy.minX; enemy.facingLeft = false; }
    if (enemy.x + enemy.w >= enemy.maxX) { enemy.x = enemy.maxX - enemy.w; enemy.facingLeft = true; }
    const target = enemy.baseY + Math.sin(enemy.t * 0.06) * 26;
    enemy.y += (target - enemy.y) * 0.2;
  }

  function updateSquirrel(enemy, grounded) {
    if (enemy.throwTimer === undefined) enemy.throwTimer = 60 + Math.floor(Math.random() * 60);
    const p = game.player;
    const dx = p.x - enemy.x;
    const near = Math.abs(dx) < 380 && Math.abs(p.y - enemy.y) < 220;
    if (near) enemy.facingLeft = dx < 0;
    enemy.throwTimer -= 1;
    enemy.throwWarn = near && enemy.throwTimer < 18;
    if (enemy.throwTimer <= 0 && grounded) {
      enemy.throwTimer = 120 + Math.floor(Math.random() * 40);
      if (near) {
        const sx = enemy.x + enemy.w / 2;
        const sy = enemy.y + 6;
        const tx = p.x + PLAYER_W / 2 + p.vx * 24;
        const vx = clamp((tx - sx) / 48, -5.2, 5.2);
        game.cones.push({ x: sx, y: sy, vx, vy: -7.6, rot: 0, life: 260 });
        audio.tone(520, 0.08, 'triangle', 0.06, 760, 0);
      }
    }
  }

  function p3Disenchant(enemy) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    for (let k = 0; k < (enemy.boss ? 40 : 16); k += 1) {
      const a = Math.random() * Math.PI * 2;
      const v = 1 + Math.random() * 3;
      game.particles.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, color: ['#FFF6A8', '#9AF0FF', '#FFB8F0', '#FFFFFF'][k % 4], life: 34 + Math.random() * 20, size: 3 });
    }
    if (!enemy.boss) popup(cx - game.cameraX, enemy.y - 26, 'ODCZAROWANY!', '#B8F4FF');
    audio.tone(880, 0.1, 'sine', 0.06, 1320, 0.05);
    audio.tone(1320, 0.14, 'sine', 0.05, 1760, 0.12);
  }

  function scatterAcorns(player) {
    const n = 6;
    for (let k = 0; k < n; k += 1) {
      const a = -Math.PI / 2 + (k - (n - 1) / 2) * 0.42;
      game.scatter.push({ x: player.x + PLAYER_W / 2 - 12, y: player.y + 6, vx: Math.cos(a) * 3.4, vy: Math.sin(a) * 5.2 - 2, t: 0 });
    }
  }

  function startDash(player) {
    if ((player.dashCool || 0) > 0 || player.dash > 0) return false;
    player.dash = 13;
    player.dashCool = 40;
    player.dashDir = player.facingLeft ? -1 : 1;
    player.pounding = false;
    audio.noise(0.18, 0.1, 'bandpass', 700, 3200, 0, 1);
    audio.tone(520, 0.12, 'triangle', 0.07, 1100, 0);
    game.guide.shootDone = true;
    return true;
  }

  function p3PlayerMotion(player) {
    player.p3NoGravity = false;
    if (player.dashCool > 0) player.dashCool -= 1;
    if (player.dash > 0) {
      player.dash -= 1;
      player.vx = player.dashDir * 8.4;
      player.vy = 0;
      player.p3NoGravity = true;
      player.facingLeft = player.dashDir < 0;
      if (game.frame % 2 === 0) game.particles.push({ x: player.x + PLAYER_W / 2 - player.dashDir * 14, y: player.y + 18 + Math.random() * 16, vx: -player.dashDir * 1.2, vy: 0, color: 'rgba(255,240,200,0.9)', life: 14, size: 4 });
      if (player.dash === 0) player.vx = player.dashDir * 3;
      return;
    }
    player.climbing = false;
    if (HERO !== 'C' || !game.vines || !game.vines.length) return;
    const cx = player.x + PLAYER_W / 2;
    const feet = player.y + PLAYER_H;
    const v = game.vines.find((vv) => Math.abs(cx - vv.x) < 20 && feet > vv.top - 4 && player.y < vv.bottom);
    if (!v || player.onGround) return;
    if (input.jumpHeld && feet > v.top + 2) {
      player.vy = -3.6;
      player.p3NoGravity = true;
      player.climbing = true;
      player.x += (v.x - cx) * 0.2;
      player.airJumps = 0;
      if (game.frame % 10 === 0) audio.tone(300 + (game.frame % 20) * 10, 0.04, 'triangle', 0.03, 0, 0);
    } else if (input.jumpHeld && feet <= v.top + 2) {
      player.vy = Math.min(player.vy, -6.5);
    }
  }

  function updateP3() {
    const player = game.player;
    if (game.magnet > 0) game.magnet -= 1;
    if (player.bubble > 0) player.bubble -= 1;
    // pnącza – podpowiedź
    if (!game.vineHintShown && game.vines.some((v) => v.x - game.cameraX > 120 && v.x - game.cameraX < BASE_W - 120)) {
      game.vineHintShown = true;
      setNotice(HERO === 'C' ? 'Pnącze! Podskocz i trzymaj skok – Persi się wspina.' : 'Pnącza są dla Persiego. Puszek ma za to podwójny skok!', '#C8F0A8', 220, 2, 'PNĄCZE');
    }
    // szyszki
    game.cones = game.cones.filter((c) => {
      c.vy = Math.min(10, c.vy + 0.32);
      c.x += c.vx;
      c.y += c.vy;
      c.rot += c.vx * 0.12;
      c.life -= 1;
      for (const p of game.platforms) {
        if (p.gone) continue;
        if (c.x > p.x && c.x < p.x + p.w && c.y + 6 >= p.y && c.y + 6 <= p.y + 16 && c.vy > 0) {
          emitDust(c.x, p.y - 2, 5);
          audio.noise(0.06, 0.05, 'bandpass', 1200, 0, 0, 2);
          return false;
        }
      }
      if (c.life <= 0 || c.y > BASE_H + 40) return false;
      if (overlap(player.x + 8, player.y + 6, PLAYER_W - 16, PLAYER_H - 10, c.x - 7, c.y - 7, 14, 14)) {
        if (player.dash > 0) { emitSpark(c.x, c.y, '#C88A4A', 8); return false; }
        if (player.invul <= 0) damagePlayer('szyszka');
        return false;
      }
      return true;
    });
    // rozsypane żołędzie
    game.scatter = game.scatter.filter((a) => {
      a.t += 1;
      a.vy = Math.min(9, a.vy + 0.36);
      a.x += a.vx;
      a.y += a.vy;
      a.vx *= 0.99;
      for (const p of game.platforms) {
        if (p.gone) continue;
        if (a.x + 18 > p.x && a.x + 6 < p.x + p.w && a.vy > 0 && a.y + 28 >= p.y && a.y + 28 - a.vy <= p.y + 4) {
          a.y = p.y - 28;
          a.vy = -a.vy * 0.45;
          a.vx *= 0.8;
          if (Math.abs(a.vy) < 1) a.vy = 0;
        }
      }
      if (a.y > BASE_H + 40 || a.t > 420) return false;
      if (a.t > 22 && overlap(player.x, player.y, PLAYER_W, PLAYER_H, a.x, a.y, 24, 28)) {
        game.score += 10;
        audio.cue('collect', { streak: 1 });
        emitSpark(a.x + 12, a.y + 12, '#E8C890', 6);
        return false;
      }
      return true;
    });
    // pościg
    if (game.level.chase && !game.celebrate) {
      const ch = game.level.chase;
      if (game.levelFrames > (ch.delay || 150) && player.x < game.level.exitX - 160) game.chaseX += ch.speed;
      if (game.levelFrames % 50 === 0 && game.chaseX > game.cameraX - 200) triggerShake(2, 6);
      if (player.x < game.chaseX + 30) {
        if (player.invul <= 0) damagePlayer('wiatrolom');
        if (game.scene === 'PLAYING') {
          player.x = Math.max(player.x, game.chaseX + 120);
          player.vy = Math.min(player.vy, -7);
        }
      }
    }
  }

  function drawP3Back() {
    for (const v of game.vines || []) {
      const x = snap(v.x - game.cameraX);
      if (x < -30 || x > BASE_W + 30) continue;
      for (let y = v.top; y < v.bottom; y += 12) {
        const sway = Math.round(Math.sin(y * 0.05 + game.frame * 0.03) * 2);
        ctx.fillStyle = '#2E6A2A';
        ctx.fillRect(x - 2 + sway, y, 5, 12);
        ctx.fillStyle = '#5AAE46';
        ctx.fillRect(x - 1 + sway, y, 2, 12);
        if ((y / 12) % 2 === 0) {
          ctx.fillStyle = '#6CC456';
          ctx.fillRect(x + 3 + sway, y + 2, 7, 4);
          ctx.fillStyle = '#3E8A32';
          ctx.fillRect(x + 3 + sway, y + 5, 7, 1);
        } else {
          ctx.fillStyle = '#6CC456';
          ctx.fillRect(x - 10 + sway, y + 4, 7, 4);
        }
      }
    }
  }

  const CONE_ART = (() => {
    const g = new PixelGrid(14, 16);
    const mats = [makeMat('#9A6A3A', '#2A160A'), makeMat('#C8925A', '#3A200C')];
    g.ellipse(7, 8.5, 5, 6.5, 0);
    for (let y = 3; y < 15; y += 3) for (let x = 3; x < 12; x += 3) g.put(x + (y % 2), y, 1, 3);
    return g.render(mats);
  })();

  function drawP3Front() {
    for (const c of game.cones) {
      ctx.save();
      ctx.translate(snap(c.x - game.cameraX), snap(c.y));
      ctx.rotate(c.rot);
      ctx.drawImage(CONE_ART, -14, -16, 28, 32);
      ctx.restore();
    }
    for (const a of game.scatter) {
      if (a.t > 360 && Math.floor(a.t / 4) % 2) continue;
      drawItemArt('carrot', snap(a.x - game.cameraX), snap(a.y), ART);
    }
    const player = game.player;
    if (player.bubble > 0) {
      const cx = snap(player.x - game.cameraX + PLAYER_W / 2);
      const cy = snap(player.y + PLAYER_H / 2);
      const blink = player.bubble < 90 && Math.floor(player.bubble / 6) % 2;
      if (!blink) {
        ctx.strokeStyle = 'rgba(160,220,255,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 36 + Math.sin(game.frame * 0.15) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(160,220,255,0.12)';
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(cx - 20, cy - 22, 6, 6);
      }
    }
    if (game.magnet > 0) {
      const cx = player.x - game.cameraX + PLAYER_W / 2;
      const cy = player.y + PLAYER_H / 2;
      for (let k = 0; k < 6; k += 1) {
        const a = game.frame * 0.08 + k * Math.PI / 3;
        const r = 50 + (game.frame * 2 + k * 20) % 60;
        ctx.fillStyle = k % 2 ? 'rgba(255,120,130,0.7)' : 'rgba(220,230,255,0.7)';
        ctx.fillRect(snap(cx + Math.cos(a) * r), snap(cy + Math.sin(a) * r * 0.6), 3, 3);
      }
    }
    // pościg: wiatrołom – toczący się pień i burza liści
    if (game.level.chase) {
      const sx = game.chaseX - game.cameraX;
      if (sx > -260) {
        const ground = BASE_H - TILE;
        ctx.save();
        const grad = ctx.createLinearGradient(sx - 300, 0, sx + 40, 0);
        grad.addColorStop(0, 'rgba(40,60,40,0.85)');
        grad.addColorStop(1, 'rgba(40,60,40,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(sx - 300, 0, 340, BASE_H);
        for (let k = 0; k < 26; k += 1) {
          const t = game.frame * 0.05 + k * 1.7;
          const lx = sx - 40 + Math.sin(t * 1.3 + k) * 60 - (k % 5) * 20;
          const ly = ((k * 53 + game.frame * (2 + (k % 3))) % (BASE_H - 40));
          ctx.fillStyle = ['#C86A2A', '#E8A43A', '#7AA84A', '#A04A1E'][k % 4];
          ctx.fillRect(snap(lx), snap(ly), 8, 5);
        }
        const r = 70;
        const cx = sx - 20;
        const cy = ground - r;
        ctx.translate(snap(cx), snap(cy));
        ctx.rotate(game.chaseX * 0.03);
        ctx.fillStyle = '#5A3A1E';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#C8955A';
        ctx.beginPath(); ctx.arc(0, 0, r - 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8A5A2E';
        ctx.lineWidth = 4;
        for (let rr = 14; rr < r - 10; rr += 14) { ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = '#5A3A1E';
        ctx.fillRect(-4, -r + 12, 8, r - 12);
        ctx.restore();
      }
    }
  }

  function drawPersiHero(player, drawX, drawY, ghost) {
    let surface;
    if (player.dash > 0) surface = buildCat('walker', 0, 'air');
    else if (player.climbing) surface = buildCat('walker', Math.floor(game.frame / 8) % 2, 'walk');
    else if (!player.onGround) surface = buildCat('walker', 0, 'air');
    else if (Math.abs(player.vx) > 0.3) surface = buildCat('walker', player.walkFrame, 'walk');
    else surface = buildCatPose('walker', Math.floor(game.levelFrames / 240) % 4 === 3 ? 'yawn' : 'sit');
    ctx.save();
    if (ghost) ctx.globalAlpha = 0.4;
    drawArtFootprint({ c: surface, ox: CAT_CANVAS.ox, oy: CAT_CANVAS.oy, fw: 24, fh: 21 }, drawX, drawY + 6, PLAYER_W, PLAYER_H, player.facingLeft);
    ctx.restore();
    if (player.dash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let k = 0; k < 3; k += 1) ctx.fillRect(snap(drawX + (player.dashDir > 0 ? -16 - k * 14 : PLAYER_W + 6 + k * 14)), snap(drawY + 14 + k * 10), 12, 3);
    }
  }
