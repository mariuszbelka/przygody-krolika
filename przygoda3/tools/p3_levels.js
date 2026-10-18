  const ARC = (x, k, n, span, rise) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1); return makePickup(Math.round(x + t * span), Math.round(H - TILE * k - 33 - Math.sin(t * Math.PI) * rise), 'carrot'); });
  const COL = (x, k0, k1, step = 2, kind = 'carrot') => { const out = []; for (let k = k0; k <= k1; k += step) out.push(PU(x, k, kind)); return out; };
  const SP = (x) => makeSpike(x, H - TILE - 5 * PIXEL);
  const VINE = (x, kTop, kBottom = 1) => ({ x, top: H - TILE * kTop, bottom: H - TILE * kBottom });
  const T24 = (w) => Math.round(w / TILE);

  // ---- segmenty poziomów: każdy dopisuje elementy do L i zwraca swoją szerokość ----
  const ENEMY = (L, kind, x0, x1, k = 1) => {
    if (kind === 'bee' || kind === 'owl') L.enemies.push(makeEnemySpawn(Math.round((x0 + x1) / 2), H - TILE * k, x0, x1, false, kind));
    else L.enemies.push(makeEnemySpawn(Math.round((x0 + x1) / 2), ONP(k), x0, x1, false, kind === 'walker' ? 'walker' : kind));
  };
  const GR = (len, o = {}) => (L, x) => {
    L.platforms.push(PL(x, 1, T24(len)));
    if (o.acorns !== false) L.pickups.push(...ROW(x + 40, 1, Math.max(1, Math.floor((len - 80) / 44)), 44));
    (o.enemies || []).forEach((kind, i, arr) => {
      const span = (len - 80) / arr.length;
      const a = x + 40 + i * span;
      ENEMY(L, kind, Math.round(a), Math.round(a + span), kind === 'bee' ? 7 : kind === 'owl' ? 10 : 1);
    });
    if (o.mud) for (let mx = x + 130; mx < x + len - 190; mx += 320) L.mud.push({ x: mx, w: 160 });
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
      ENEMY(L, kind, Math.round(a), Math.round(a + span), kind === 'bee' ? 8 : kind === 'owl' ? 10 : 1);
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

  // ---- kraina 2 i 3: staw z liliami, spadające kłody, kruszące się kamienie ----
  const POND = (n = 5, o = {}) => (L, x) => {
    for (let i = 0; i < n; i += 1) {
      const px = x + 40 + i * 104;
      L.platforms.push(PL(px, 1, 2, 'lily'));
      L.pickups.push(...ARC(px - 30, 1, 3, 70, 60));
    }
    if (o.jar) {
      const mid = x + 40 + Math.floor(n / 2) * 104 - 12;
      L.platforms.push(PL(mid, 6, 3));
      L.pickups.push(PU(mid + 24, 6, 'diamond'));
    }
    if (o.bee) ENEMY(L, 'bee', x + 60, x + n * 104, 7);
    return 40 + n * 104 + 16;
  };
  const LOGS = (n = 4, o = {}) => (L, x) => {
    for (let i = 0; i < n; i += 1) {
      const px = x + 40 + i * 120;
      const k = 2 + (i % 2);
      L.platforms.push(PL(px, k, 3, 'log'));
      L.pickups.push(...ROW(px + 8, k, 2, 30));
    }
    if (o.jar) L.pickups.push(PU(x + 40 + Math.floor(n / 2) * 120 + 20, 7, 'diamond'));
    if (o.owl) ENEMY(L, 'owl', x + 40, x + n * 120, 10);
    return 40 + n * 120 + 30;
  };
  const CRUMBLE = (n = 4, o = {}) => (L, x) => {
    for (let i = 0; i < n; i += 1) {
      const px = x + 40 + i * 110;
      const k = 2 + (i % 2) * 2;
      L.platforms.push(PL(px, k, 3, 'crumble'));
      L.pickups.push(...ROW(px + 10, k, 2, 30));
    }
    if (o.jar) L.pickups.push(PU(x + 40 + Math.floor(n / 2) * 110 + 20, 8, 'diamond'));
    return 40 + n * 110 + 30;
  };

  function buildLevel(meta, segs) {
    const L = { ...meta, platforms: [], enemies: [], pickups: [], bouncers: [], vines: [], spikes: [], secrets: [], checkpoints: [], mud: [] };
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
      label: 'Boss: Grzybowy Król',
      bossKind: 'king',
      mud: [],
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
    },
    // ================= KRAINA 2: MOKRADŁA I MGŁA =================
    buildLevel({ label: 'Poziom 6: Błotna grobla', hint: 'Lilie toną, gdy na nich stoisz – skacz dalej! Błoto spowalnia. Ziemia drży? To Korzeniak!', sky1: '#E8A878', sky2: '#F6E0B8' }, [
      GR(420), POND(5), GR(500, { mud: true, enemies: ['root'] }), STAIRS({ jar: true }), POND(6), GR(480, { cp: true, mud: true, enemies: ['hopper', 'root'] }),
      TOWER(), LOGS(4), GR(400, { power: 'magnet' }), VINE_SECRET(), POND(7, { jar: true }), GR(600, { mud: true, enemies: ['root', 'root'], cp: true, heart: true }),
      BRANCHES([4, 6, 8, 6, 4], { bee: true }), LOGS(5), GR(500, { enemies: ['hopper'] }), PERCH({ jar: true }), POND(5, { bee: true }), GR(640, { mud: true, enemies: ['root', 'walker'], cp: true }),
      GR(420, { acorns: false })
    ]),
    buildLevel({ label: 'Poziom 7: Mglisty gąszcz', hint: 'Mgła! Widać tylko kawałek wokół ciebie. Ogniki i słoiki świecą w mroku.', sky1: '#A8B8B8', sky2: '#E0E8E0' }, [
      GR(420), BRAMBLE(600, { enemies: ['root'] }), POND(5), GR(500, { enemies: ['hopper', 'bee'], cp: true }), TOWER({ jar: true }), LOGS(4),
      GR(520, { mud: true, enemies: ['root', 'root'] }), BRANCHES([4, 6, 8, 10, 8, 6], { squirrel: 2, bee: true, jar: 3 }), GR(480, { cp: true, heart: true, power: 'bubble' }),
      POND(6), STAIRS({ enemy: 'root' }), VINE_SECRET({ power: 'magnet', jar: true }), BRAMBLE(720, { enemies: ['hedgehog', 'bee'], cp: true }), LOGS(5),
      GR(600, { mud: true, enemies: ['root', 'hopper'] }), GR(420, { acorns: false })
    ]),
    buildLevel({ label: 'Poziom 8: Błotna fala', hint: 'Błotna fala! Biegnij w prawo – lilie i kłody nie poczekają.', sky1: '#B07858', sky2: '#E8C8A0', chase: { speed: 2.1, delay: 170, kind: 'mud' } }, [
      GR(800, { power: 'magnet' }), POND(4), GR(500), LOGS(3), STAIRS(), GR(500, { cp: true, heart: true }), TOWER({ jar: true }), POND(5), GR(600, { enemies: ['root'] }), GAP(),
      STAIRS({ jar: true }), GR(500, { cp: true }), LOGS(4), GR(500, { enemies: ['hopper'] }), POND(4), TOWER({ jar: true }), GR(500, { cp: true, heart: true }), GAP(),
      GR(700, { power: 'bubble' }), GR(420, { acorns: false })
    ]),
    {
      worldWidth: 1500,
      label: 'Boss: Ropuch Mgielnik',
      bossKind: 'toad',
      hint: 'Ropuch Mgielnik! Skacze i robi fale – podskakuj nad nimi. Pluje błotem, a w złości woła żabki.',
      sky1: '#40384A', sky2: '#8A7A78',
      startX: 50,
      startY: H - TILE - PLAYER_H,
      exitX: 1420,
      isBoss: true,
      mud: [],
      checkpoint: { x: 670, y: H - TILE * 4, respawnX: 638, respawnY: H - TILE * 4 - PLAYER_H },
      platforms: [PL(0, 1, 63), PL(200, 5, 6), PL(640, 4, 8), PL(1120, 5, 6)],
      enemies: [makeEnemySpawn(620, H - TILE - CAT_H * 2 - 4, 360, 1040, true)],
      spikes: [],
      pickups: [...ROW(214, 5, 4, 30), PU(380, 1, 'heart'), PU(700, 4, 'diamond'), PU(780, 1, 'heart'), ...ROW(1134, 5, 4, 30), PU(1200, 1, 'heart'), PU(1320, 1, 'bubble')]
    },
    // ================= KRAINA 3: DRZEWO LICHA =================
    buildLevel({ label: 'Poziom 10: Nocny las', hint: 'Noc! Sowy pikują z góry – gdy pod tobą pojawi się cień, uskocz.', sky1: '#1A2440', sky2: '#3A3A60' }, [
      GR(420), GR(500, { enemies: ['owl'] }), STAIRS({ jar: true }), GAP(), GR(500, { enemies: ['root', 'owl'], cp: true }), TOWER(),
      BRANCHES([4, 6, 8, 10, 8, 6], { squirrel: 2, jar: 3 }), GR(480, { heart: true, power: 'bubble', enemies: ['owl'] }), LOGS(4, { owl: true }), VINE_SECRET({ jar: true }),
      GR(600, { cp: true, enemies: ['root', 'hedgehog', 'owl'] }), CRUMBLE(5), PERCH(), BRAMBLE(600, { enemies: ['owl'] }), STAIRS({ enemy: 'root' }),
      GR(640, { cp: true, enemies: ['owl', 'root'] }), GR(420, { acorns: false })
    ]),
    buildLevel({ label: 'Poziom 11: Korzenie Drzewa', hint: 'Korzenie Drzewa Licha. Kamienie kruszą się pod łapkami – nie stój długo!', sky1: '#20183A', sky2: '#4A3A68' }, [
      GR(420), CRUMBLE(4), GR(480, { enemies: ['root', 'root'] }), BRANCHES([4, 6, 8, 10, 12, 10, 8], { squirrel: 3, jar: 4 }), GR(400, { cp: true, enemies: ['owl'] }),
      CRUMBLE(5, { jar: true }), GR(500, { enemies: ['hedgehog', 'owl'], power: 'magnet' }), VINE_SECRET({ power: 'bubble' }), BRAMBLE(720, { enemies: ['root', 'owl'], cp: true }),
      LOGS(5, { owl: true }), GR(480, { heart: true, enemies: ['root'] }), TOWER({ jar: true, enemy: 'hedgehog' }), CRUMBLE(6), GR(500, { cp: true, enemies: ['owl', 'root'] }),
      BRANCHES([4, 6, 8, 6, 4], { squirrel: 2, bee: true }), GR(640, { enemies: ['root', 'owl', 'root'] }), GR(420, { acorns: false })
    ]),
    buildLevel({ label: 'Poziom 12: Gniew Licha', hint: 'Licho się gniewa – kolczaste korzenie gonią cię przez las. Biegnij!', sky1: '#160E2A', sky2: '#3A2050', chase: { speed: 2.2, delay: 170, kind: 'roots' } }, [
      GR(800, { power: 'magnet' }), GAP(), STAIRS(), LOGS(3), GR(500, { cp: true, heart: true }), TOWER({ jar: true }), CRUMBLE(4), GR(600, { enemies: ['root'] }), GAP(),
      STAIRS({ jar: true }), GR(500, { cp: true }), LOGS(4), GR(500, { enemies: ['owl'] }), CRUMBLE(4), TOWER({ jar: true }), GR(500, { cp: true, heart: true }), GAP(),
      GR(700, { power: 'bubble' }), GR(420, { acorns: false })
    ]),
    {
      worldWidth: 1500,
      label: 'Finał: Leśne Licho',
      bossKind: 'licho',
      hint: 'Leśne Licho! Znika i pojawia się obok, rzuca ognikami i budzi Korzeniaki. Skacz mu na głowę!',
      sky1: '#0A0818', sky2: '#2A1840',
      startX: 50,
      startY: H - TILE - PLAYER_H,
      exitX: 1420,
      isBoss: true,
      mud: [],
      checkpoint: { x: 670, y: H - TILE * 4, respawnX: 638, respawnY: H - TILE * 4 - PLAYER_H },
      platforms: [PL(0, 1, 63), PL(240, 4, 6), PL(600, 6, 6), PL(1060, 4, 6)],
      enemies: [makeEnemySpawn(620, H - TILE - CAT_H * 2 - 4, 360, 1040, true)],
      spikes: [],
      pickups: [...ROW(254, 4, 4, 30), PU(380, 1, 'heart'), PU(660, 6, 'diamond'), PU(780, 1, 'heart'), ...ROW(1074, 4, 4, 30), PU(1200, 1, 'heart'), PU(1320, 1, 'bubble')]
    }
  ];
