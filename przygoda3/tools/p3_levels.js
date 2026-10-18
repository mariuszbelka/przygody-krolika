  const ARC = (x, k, n, span, rise) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0.5 : i / (n - 1); return makePickup(Math.round(x + t * span), Math.round(H - TILE * k - 33 - Math.sin(t * Math.PI) * rise), 'carrot'); });
  const COL = (x, k0, k1, step = 2, kind = 'carrot') => { const out = []; for (let k = k0; k <= k1; k += step) out.push(PU(x, k, kind)); return out; };
  const SP = (x) => makeSpike(x, H - TILE - 5 * PIXEL);
  const SPK = (x, k) => makeSpike(x, H - TILE * k - 5 * PIXEL);
  const VINE = (x, kTop, kBottom = 1) => ({ x, top: H - TILE * kTop, bottom: H - TILE * kBottom });

  const LEVELS = [
    {
      worldWidth: 3300,
      label: 'Poziom 1: Leśna ścieżka',
      hint: 'Zbieraj żołędzie bez przerwy – rośnie mnożnik! Słoiki ze świetlikami dają gwiazdkę.',
      sky1: '#9ED9F0', sky2: '#E9F9E0',
      startX: 50,
      startY: H - TILE - PLAYER_H,
      exitX: 3220,
      checkpoint: GROUND_CP(1420),
      platforms: [
        PL(0, 1, 30), PL(800, 1, 20), PL(1360, 1, 25), PL(2040, 1, 53),
        PL(240, 4, 4), PL(400, 6, 3), PL(540, 4, 4),
        PL(960, 5, 5),
        PL(1480, 4, 3), PL(1620, 7, 3), PL(1760, 4, 3), PL(1540, 12, 4),
        PL(2280, 4, 5), PL(2480, 7, 4), PL(2680, 4, 4),
        PL(3000, 5, 4)
      ],
      bouncers: [{ x: 1150, y: H - TILE }, { x: 2180, y: H - TILE }],
      vines: [VINE(1714, 12)],
      enemies: [
        makeEnemySpawn(900, ONP(1), 820, 1120, false),
        makeEnemySpawn(1820, ONP(1), 1700, 1950, false),
        makeEnemySpawn(2400, ONP(1), 2240, 2660, false, 'hopper'),
        makeEnemySpawn(2900, ONP(1), 2820, 3150, false)
      ],
      spikes: [],
      pickups: [
        ...ROW(70, 1, 6, 32), ...ROW(250, 4, 3), ...ROW(410, 6, 2), ...ROW(550, 4, 3),
        ...ARC(690, 1, 5, 140, 70), ...ROW(840, 1, 3), ...ROW(972, 5, 4), PU(1060, 5, 'magnet'),
        ...COL(1150, 4, 10, 3), PU(1150, 13, 'diamond'),
        ...ARC(1250, 1, 5, 140, 70), ...ROW(1390, 1, 3), ...ROW(1490, 4, 2), ...ROW(1630, 7, 2),
        ...ROW(1550, 12, 3, 30, 'golden'), ...ROW(1770, 4, 2), PU(1900, 1, 'heart'),
        ...ARC(1930, 1, 5, 140, 70), ...COL(2180, 4, 9, 2), ...ROW(2290, 4, 4), PU(2410, 1, 'bubble'),
        ...ROW(2490, 7, 2), PU(2550, 7, 'diamond'), ...ROW(2690, 4, 3),
        ...ROW(2800, 1, 6, 34), ...ROW(3010, 5, 2), PU(3070, 5, 'diamond'), ...ROW(3120, 1, 3, 30)
      ]
    },
    {
      worldWidth: 3420,
      label: 'Poziom 2: Korony drzew',
      hint: 'Wysoko w koronach! Uważaj na szyszki wiewiórek i nie spadnij w dół.',
      sky1: '#8FCBEE', sky2: '#F2F8E0',
      startX: 50,
      startY: H - TILE - PLAYER_H,
      exitX: 3330,
      checkpoint: { x: 1660, y: H - TILE * 4, respawnX: 1640, respawnY: H - TILE * 4 - PLAYER_H },
      platforms: [
        PL(0, 1, 12),
        PL(300, 4, 4), PL(440, 6, 4), PL(600, 8, 4), PL(780, 6, 5), PL(960, 8, 4), PL(1120, 10, 4),
        PL(1300, 8, 5), PL(1480, 6, 4), PL(1620, 4, 6),
        PL(1600, 1, 20), PL(1860, 12, 4),
        PL(2100, 4, 4), PL(2240, 7, 4), PL(2400, 9, 5), PL(2580, 7, 4), PL(2740, 5, 4), PL(2900, 3, 4),
        PL(3000, 1, 18)
      ],
      bouncers: [{ x: 1730, y: H - TILE * 4 }],
      vines: [VINE(1830, 12)],
      enemies: [
        makeEnemySpawn(830, ONP(6), 784, 896, false, 'squirrel'),
        makeEnemySpawn(1350, ONP(8), 1304, 1416, false, 'squirrel'),
        makeEnemySpawn(1040, H - TILE * 13, 940, 1260, false, 'bee'),
        makeEnemySpawn(1820, ONP(1), 1780, 2070, false),
        makeEnemySpawn(2300, H - TILE * 12, 2180, 2580, false, 'bee'),
        makeEnemySpawn(2440, ONP(9), 2404, 2516, false, 'squirrel'),
        makeEnemySpawn(3200, ONP(1), 3060, 3380, false, 'hopper')
      ],
      spikes: [],
      pickups: [
        ...ROW(60, 1, 5, 34), ...ROW(310, 4, 3), ...ROW(450, 6, 3), ...ROW(610, 8, 3), ...ARC(690, 8, 4, 90, 40),
        ...ROW(790, 6, 3), ...ROW(970, 8, 3), ...ROW(1130, 10, 2), PU(1170, 10, 'diamond'), ...ARC(1210, 10, 4, 90, 40),
        ...ROW(1310, 8, 4), ...ROW(1490, 6, 3), ...ROW(1630, 4, 3), ...COL(1730, 6, 10, 2), PU(1730, 12, 'diamond'),
        ...ROW(1870, 12, 3, 30, 'golden'), PU(1960, 12, 'bubble'), ...ROW(1620, 1, 8, 50), PU(2000, 1, 'heart'),
        PU(2120, 4, 'lettuce'), ...ROW(2250, 7, 3), ...ROW(2410, 9, 3), PU(2500, 9, 'diamond'), ...ARC(2520, 9, 4, 60, 30),
        ...ROW(2590, 7, 3), ...ROW(2750, 5, 3), ...ROW(2910, 3, 3), ...ROW(3040, 1, 8, 34)
      ]
    },
    {
      worldWidth: 3600,
      label: 'Poziom 3: Jeżynowy gąszcz',
      hint: 'Jeży nie wolno skakać po grzbiecie! Bobek, zryw, tupnięcie albo Turbo-marchew.',
      sky1: '#A8D8C8', sky2: '#F4F0D0',
      startX: 50,
      startY: H - TILE - PLAYER_H,
      exitX: 3520,
      checkpoint: GROUND_CP(1900),
      platforms: [
        PL(0, 1, 40), PL(1040, 1, 30), PL(1840, 1, 35), PL(2760, 1, 36),
        PL(380, 4, 4), PL(1200, 4, 5), PL(1400, 6, 3), PL(2000, 4, 4), PL(2160, 6, 4),
        PL(2900, 4, 5), PL(3100, 7, 3)
      ],
      enemies: [
        makeEnemySpawn(700, ONP(1), 640, 940, false, 'hedgehog'),
        makeEnemySpawn(1100, H - TILE * 9, 1000, 1380, false, 'bee'),
        makeEnemySpawn(1560, ONP(1), 1480, 1740, false, 'hedgehog'),
        makeEnemySpawn(2100, ONP(1), 1880, 2380, false),
        makeEnemySpawn(2190, ONP(6), 2164, 2252, false, 'squirrel'),
        makeEnemySpawn(2520, ONP(1), 2420, 2670, false, 'hedgehog'),
        makeEnemySpawn(2860, H - TILE * 10, 2780, 3220, false, 'bee'),
        makeEnemySpawn(3420, ONP(1), 3380, 3600, false, 'hopper')
      ],
      spikes: [SP(560), SP(584), SP(1290), SP(1314), SP(1600 + 160), SP(2300 + 30), SP(2354), SP(3300), SP(3324)],
      secrets: [makeSecret(2620, H - TILE * 3, 26, TILE * 2, 'JEŻYNOWA NORKA!', ['golden', 'heart'])],
      pickups: [
        ...ROW(60, 1, 6, 34), PU(400, 4, 'lettuce'), ...ROW(440, 4, 2), ...ARC(520, 1, 4, 100, 70),
        ...ROW(700, 1, 6, 40), PU(1100, 1, 'heart'), ...ROW(1210, 4, 4), PU(1290, 4, 'bubble'), ...ROW(1410, 6, 2), PU(1440, 6, 'diamond'),
        ...ARC(1720, 1, 5, 130, 70), ...ROW(1900, 1, 3), ...ROW(2010, 4, 3), PU(2060, 4, 'magnet'), ...ROW(2170, 6, 3), PU(2230, 6, 'diamond'),
        ...ARC(2290, 1, 4, 100, 70), ...ROW(2440, 1, 6, 36), ...ARC(2660, 1, 5, 120, 70), PU(2800, 1, 'heart'),
        ...ROW(2910, 4, 4), ...ROW(3110, 7, 2), PU(3140, 7, 'diamond'), ...ARC(3270, 1, 4, 100, 70), ...ROW(3400, 1, 4, 30)
      ]
    },
    {
      worldWidth: 4300,
      label: 'Poziom 4: Wiatrołom',
      hint: 'Wiatrołom! Biegnij w prawo i nie zatrzymuj się – pień toczy się tuż za tobą.',
      sky1: '#6E8AA0', sky2: '#C8D4C0',
      startX: 50,
      startY: H - TILE - PLAYER_H,
      exitX: 4220,
      chase: { speed: 2.05, delay: 170 },
      checkpoint: GROUND_CP(2000),
      platforms: [
        PL(0, 1, 30), PL(790, 1, 20), PL(1340, 1, 18), PL(1840, 1, 25), PL(2510, 1, 20), PL(3060, 1, 22), PL(3650, 1, 28),
        PL(1000, 4, 4), PL(1500, 4, 4), PL(2100, 5, 4), PL(2700, 4, 4), PL(3300, 5, 4), PL(3900, 4, 4)
      ],
      bouncers: [{ x: 1220, y: H - TILE }, { x: 2330, y: H - TILE }, { x: 3500, y: H - TILE }],
      enemies: [
        makeEnemySpawn(1100, ONP(1), 1000, 1260, false),
        makeEnemySpawn(2860, H - TILE * 8, 2700, 3000, false, 'bee'),
        makeEnemySpawn(3800, ONP(1), 3700, 4100, false, 'hopper')
      ],
      spikes: [],
      pickups: [
        PU(400, 1, 'magnet'), ...ROW(120, 1, 8, 34), ...ARC(690, 1, 5, 150, 80), ...ROW(1010, 4, 3), ...COL(1220, 4, 10, 2),
        ...ARC(1240, 1, 5, 130, 70), ...ROW(1510, 4, 2), PU(1560, 4, 'diamond'), ...ARC(1740, 1, 5, 130, 70), PU(1900, 1, 'heart'),
        ...ROW(2110, 5, 3), ...COL(2330, 4, 10, 2), PU(2330, 12, 'diamond'), ...ARC(2410, 1, 5, 130, 70), PU(2600, 1, 'bubble'),
        ...ROW(2710, 4, 3), ...ARC(2960, 1, 5, 130, 70), ...ROW(3100, 1, 5, 34), ...ROW(3310, 5, 2), PU(3360, 5, 'diamond'),
        ...COL(3500, 4, 10, 2), ...ARC(3560, 1, 5, 110, 70), ...ROW(3910, 4, 3), ...ROW(4000, 1, 6, 34)
      ]
    },
    {
      worldWidth: 1500,
      label: 'Finał: Grzybowy Król',
      hint: 'Grzybowy Król! Przeskakuj szarżę i skacz mu na kapelusz. Uciekaj spod cieni zarodników.',
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
        ...ROW(250, 4, 5, 30), PU(360, 1, 'heart'), PU(690, 4, 'diamond'), PU(750, 4, 'lettuce'),
        PU(760, 1, 'heart'), ...ROW(1090, 4, 5, 30), PU(1180, 1, 'heart'), PU(1320, 1, 'bubble')
      ]
    }
  ];
