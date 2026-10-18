  const ARC = (x, k, n, span, rise) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1); return makePickup(Math.round(x + t * span), Math.round(H - TILE * k - 33 - Math.sin(t * Math.PI) * rise), 'carrot'); });
  const COL = (x, k0, k1, step = 2, kind = 'carrot') => { const out = []; for (let k = k0; k <= k1; k += step) out.push(PU(x, k, kind)); return out; };
  const SP = (x) => makeSpike(x, H - TILE - 5 * PIXEL);
  const VINE = (x, kTop, kBottom = 1) => ({ x, top: H - TILE * kTop, bottom: H - TILE * kBottom });
  const T24 = (w) => Math.round(w / TILE);

  // ---- segmenty poziomów: każdy dopisuje elementy do L i zwraca swoją szerokość ----
  const ENEMY = (L, kind, x0, x1, k = 1) => {
    if (kind === 'bee') L.enemies.push(makeEnemySpawn(Math.round((x0 + x1) / 2), H - TILE * k, x0, x1, false, 'bee'));
    else L.enemies.push(makeEnemySpawn(Math.round((x0 + x1) / 2), ONP(k), x0, x1, false, kind === 'walker' ? 'walker' : kind));
  };
  const GR = (len, o = {}) => (L, x) => {
    L.platforms.push(PL(x, 1, T24(len)));
    if (o.acorns !== false) L.pickups.push(...ROW(x + 40, 1, Math.max(1, Math.floor((len - 80) / 44)), 44));
    (o.enemies || []).forEach((kind, i, arr) => {
      const span = (len - 80) / arr.length;
      const a = x + 40 + i * span;
      ENEMY(L, kind, Math.round(a), Math.round(a + span), kind === 'bee' ? 7 : 1);
    });
    if (o.cp) L.checkpoints.push(GROUND_CP(x + Math.round(len / 2)));
    if (o.power) L.pickups.push(PU(x + Math.round(len * 0.7), 3, o.power));
    if (o.heart) L.pickups.push(PU(x + Math.round(len * 0.3), 3, 'heart'));
    if (o.secret) L.secrets.push(makeSecret(x + len - 70, H - TILE * 3, 26, TILE * 2, o.secret, ['golden', 'heart']));
    return len;
  };
  const GAP = (w = 72) => (L, x) => { L.pickups.push(...ARC(x - 40, 1, 5, w + 80, 70)); return w; };
  const STAIRS = (o = {}) => (L, x) => {
    const top = o.top || 7;
    L.platforms.push(PL(x, 1, 22));
    L.platforms.push(PL(x + 80, 4, 4), PL(x + 210, top, 4), PL(x + 340, 4, 4));
    L.pickups.push(...ROW(x + 90, 4, 3), ...ROW(x + 220, top, 3), ...ROW(x + 350, 4, 3));
    if (o.jar) L.pickups.push(PU(x + 250, top + 4, 'diamond'));
    if (o.enemy) ENEMY(L, o.enemy, x + 30, x + 500);
    return 528;
  };
  const TOWER = (o = {}) => (L, x) => {
    L.platforms.push(PL(x, 1, 16));
    L.bouncers.push({ x: x + 190, y: H - TILE });
    L.pickups.push(...COL(x + 190, 4, 11, 2), ...ROW(x + 30, 1, 3, 36), ...ROW(x + 260, 1, 3, 36));
    if (o.jar) L.pickups.push(PU(x + 190, 13, 'diamond'));
    if (o.enemy) ENEMY(L, o.enemy, x + 230, x + 380);
    return 384;
  };
  const VINE_SECRET = (o = {}) => (L, x) => {
    L.platforms.push(PL(x, 1, 18), PL(x + 60, 4, 3), PL(x + 150, 7, 3), PL(x + 250, 12, 4));
    L.vines.push(VINE(x + 236, 12));
    L.pickups.push(...ROW(x + 70, 4, 2), ...ROW(x + 160, 7, 2), ...ROW(x + 262, 12, 3, 30, 'golden'), PU(x + 350, 12, o.power || 'bubble'));
    if (o.jar) L.pickups.push(PU(x + 300, 15, 'diamond'));
    return 432;
  };
  const BRANCHES = (heights, o = {}) => (L, x) => {
    heights.forEach((k, i) => {
      const px = x + 40 + i * 150;
      L.platforms.push(PL(px, k, 4));
      L.pickups.push(...ROW(px + 10, k, 3));
      if (o.squirrel === i) ENEMY(L, 'squirrel', px + 4, px + 92, k);
      if (o.jar === i) L.pickups.push(PU(px + 40, k + 4, 'diamond'));
    });
    const w = 40 + heights.length * 150;
    if (o.bee) ENEMY(L, 'bee', x + 120, x + w - 120, Math.max(...heights) + 4);
    return w;
  };
  const BRAMBLE = (len, o = {}) => (L, x) => {
    L.platforms.push(PL(x, 1, T24(len)));
    for (let bx = x + 160; bx < x + len - 120; bx += 260) {
      L.spikes.push(SP(bx), SP(bx + 24));
      if (o.over !== false) L.platforms.push(PL(bx - 24, 4, 4));
      L.pickups.push(...ARC(bx - 30, 1, 4, 110, 80));
    }
    (o.enemies || []).forEach((kind, i, arr) => {
      const span = (len - 80) / arr.length;
      const a = x + 40 + i * span;
      ENEMY(L, kind, Math.round(a), Math.round(a + span), kind === 'bee' ? 8 : 1);
    });
    if (o.power) L.pickups.push(PU(x + 60, 3, o.power));
    if (o.cp) L.checkpoints.push(GROUND_CP(x + 80));
    return len;
  };
  const PERCH = (o = {}) => (L, x) => {
    L.platforms.push(PL(x, 1, 20), PL(x + 180, 5, 4));
    ENEMY(L, 'squirrel', x + 184, x + 272, 5);
    L.pickups.push(...ROW(x + 30, 1, 4, 36), ...ROW(x + 300, 1, 4, 36), ...ROW(x + 190, 5, 3));
    if (o.jar) L.pickups.push(PU(x + 220, 9, 'diamond'));
    return 480;
  };

  function buildLevel(meta, segs) {
    const L = { ...meta, platforms: [], enemies: [], pickups: [], bouncers: [], vines: [], spikes: [], secrets: [], checkpoints: [] };
    let x = 0;
    segs.forEach((seg) => { x += seg(L, x); });
    L.worldWidth = x;
    L.exitX = x - 90;
    L.startX = 50;
    L.startY = H - TILE - PLAYER_H;
    L.checkpoint = L.checkpoints[0] || null;
    return L;
  }

  const LEVELS = [
    buildLevel({ label: 'Poziom 1: Leśna ścieżka', hint: 'Zbieraj żołędzie bez przerwy – rośnie mnożnik! Trzy słoiki ze świetlikami dają gwiazdkę.', sky1: '#9ED9F0', sky2: '#E9F9E0' }, [
      GR(520), STAIRS(), GAP(), GR(420, { enemies: ['walker'] }), TOWER({ jar: true }), GR(360, { power: 'magnet' }), GAP(),
      VINE_SECRET(), GR(480, { enemies: ['walker'], cp: true }), STAIRS({ enemy: 'walker' }), GAP(80), GR(520, { enemies: ['hopper'] }),
      TOWER(), GR(400, { heart: true }), STAIRS({ jar: true, top: 8 }), GAP(), GR(600, { enemies: ['walker', 'hopper'], cp: true }),
      GR(360, { power: 'bubble' }), STAIRS(), GAP(80), TOWER({ jar: true, enemy: 'walker' }), GR(700, { enemies: ['walker', 'walker'] }), GR(420, { acorns: false })
    ]),
    buildLevel({ label: 'Poziom 2: Korony drzew', hint: 'Wysoko w koronach! Uważaj na szyszki wiewiórek i nie spadnij w dół.', sky1: '#8FCBEE', sky2: '#F2F8E0' }, [
      GR(300), BRANCHES([4, 6, 8, 6, 8, 6], { squirrel: 2 }), GR(360), BRANCHES([4, 6, 8, 10, 8, 6, 4], { bee: true, jar: 3 }),
      GR(480, { enemies: ['walker'], cp: true }), TOWER({ jar: true }), BRANCHES([4, 6, 8, 6, 4, 6], { squirrel: 3, bee: true }),
      GR(400, { power: 'lettuce' }), VINE_SECRET({ power: 'magnet' }), BRANCHES([4, 6, 8, 10, 12, 10, 8, 6], { squirrel: 4, bee: true, jar: 4 }),
      GR(480, { enemies: ['hopper'], cp: true, heart: true }), BRANCHES([4, 6, 8, 6, 4], { squirrel: 2 }), PERCH(), BRANCHES([4, 6, 4], { bee: true }), GR(520, { enemies: ['walker'] }), GR(400, { acorns: false })
    ]),
    buildLevel({ label: 'Poziom 3: Jeżynowy gąszcz', hint: 'Jeży nie wolno skakać po grzbiecie! Bobek, zryw, tupnięcie albo Turbo-marchew.', sky1: '#A8D8C8', sky2: '#F4F0D0' }, [
      GR(400), BRAMBLE(720, { enemies: ['hedgehog'], power: 'lettuce' }), GAP(), STAIRS({ jar: true }), BRAMBLE(600, { enemies: ['bee'] }),
      GR(400, { enemies: ['walker'], cp: true, secret: 'JEŻYNOWA NORKA!' }), PERCH(), BRAMBLE(840, { enemies: ['hedgehog', 'hedgehog'] }), TOWER({ jar: true }),
      GR(400, { heart: true, power: 'bubble' }), BRAMBLE(720, { enemies: ['bee', 'hedgehog'], cp: true }), PERCH({ jar: true }), BRAMBLE(600, { enemies: ['hopper'] }),
      VINE_SECRET(), STAIRS({ enemy: 'hedgehog' }), GR(520, { enemies: ['walker', 'hedgehog'] }), GR(420, { acorns: false })
    ]),
    buildLevel({ label: 'Poziom 4: Wiatrołom', hint: 'Wiatrołom! Biegnij w prawo i nie zatrzymuj się – pień toczy się tuż za tobą.', sky1: '#6E8AA0', sky2: '#C8D4C0', chase: { speed: 2.05, delay: 170 } }, [
      GR(800, { power: 'magnet' }), GAP(), GR(500), STAIRS(), GAP(80), TOWER({ jar: true }), GR(600, { enemies: ['walker'] }), GAP(),
      GR(500, { cp: true, heart: true }), STAIRS({ jar: true }), GAP(80), GR(600, { power: 'bubble' }), TOWER(), GAP(), GR(500, { enemies: ['hopper'] }),
      GR(600, { cp: true }), GAP(), STAIRS(), TOWER({ jar: true }), GAP(80), GR(800, { enemies: ['walker'] }), GAP(), GR(500, { cp: true, heart: true }),
      STAIRS(), GAP(), GR(700, { power: 'magnet' }), GR(420, { acorns: false })
    ]),
    {
      worldWidth: 1500,
      label: 'Finał: Grzybowy Król',
      hint: 'Grzybowy Król! Przeskakuj szarżę i fale, skacz mu na kapelusz. Uciekaj spod cieni zarodników.',
      sky1: '#1E2A3A', sky2: '#3E4A5A',
      startX: 50,
      startY: H - TILE - PLAYER_H,
      exitX: 1420,
      isBoss: true,
      checkpoint: { x: 670, y: H - TILE * 4, respawnX: 638, respawnY: H - TILE * 4 - PLAYER_H },
      platforms: [
        PL(0, 1, 63),
        PL(230, 4, 7), PL(650, 4, 7), PL(1070, 4, 7)
      ],
      enemies: [makeEnemySpawn(620, H - TILE - CAT_H * 2 - 4, 360, 1040, true)],
      spikes: [],
      pickups: [
        ...ROW(250, 4, 5, 30), PU(360, 1, 'heart'), PU(690, 4, 'diamond'),
        PU(760, 1, 'heart'), ...ROW(1090, 4, 5, 30), PU(1180, 1, 'heart'), PU(1320, 1, 'bubble')
      ]
    }
  ];
