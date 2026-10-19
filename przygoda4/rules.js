// Przygoda 4: Ogród Babci Ludwiki – czysta logika gry „3 w rzędzie”.
// Bez DOM: ten sam plik działa w przeglądarce (window.Rules) i w Node (testy, symulator).
(function (root) {
  'use strict';

  // kolory owoców: 0 truskawka, 1 jabłko, 2 śliwka, 3 cytryna, 4 borówka, 5 morela
  const FRUITS = ['truskawka', 'jabłko', 'śliwka', 'cytryna', 'borówka', 'morela'];
  const HERO_COLOR = { P: 1, C: 2 }; // jabłka ładują Puszka, śliwki Persiego
  const HERO_NEED = 24;

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------------- tworzenie gry
  function createGame(level, opts = {}) {
    const calm = opts.mode === 'S';
    const G = {
      level,
      W: level.map[0].length,
      H: level.map.length,
      colors: Math.max(4, Math.min(6, level.colors)),
      moves: level.moves + (calm ? Math.ceil(level.moves * 0.2) : 0),
      calm,
      rnd: rng(opts.seed == null ? Date.now() : opts.seed),
      nextId: 1,
      cells: [],
      score: 0,
      goals: level.goals.map((g) => ({ ...g, left: g.n })),
      charge: { P: 0, C: 0 },
      status: 'play',
      turn: 0,
      boss: null,
      jarsOnBoardMax: level.jarMax || 2,
      jarsSpawned: 0,
      stats: { specials: 0, combos: 0, cascadeMax: 0 }
    };
    const { W, H } = G;
    for (let r = 0; r < H; r += 1) {
      for (let c = 0; c < W; c += 1) {
        const ch = level.map[r][c];
        const cell = { r, c, v: ch === '#', tile: null, cover: 0, coverKind: null, crate: 0, weed: 0, boss: false };
        if (ch === 'w') cell.weed = 1;
        if (ch === 'c') cell.crate = 1;
        if (ch === 'C') cell.crate = 2;
        if (ch === 'x') { cell.cover = 1; cell.coverKind = 'web'; }
        if (ch === 'X') { cell.cover = 1; cell.coverKind = 'web'; cell.weed = 1; }
        if (ch === 'b') cell.boss = true;
        G.cells.push(cell);
      }
    }
    for (const g of G.goals) {
      if (g.n !== 'auto') continue;
      if (g.type === 'weed') g.n = G.cells.filter((cl) => cl.weed).length;
      if (g.type === 'crate') g.n = G.cells.filter((cl) => cl.crate).length;
      if (g.type === 'web') g.n = G.cells.filter((cl) => cl.cover).length;
      g.left = g.n;
    }
    if (level.boss) {
      const first = G.cells.find((cl) => cl.boss);
      G.boss = { r: first.r, c: first.c, hp: level.boss.hp - (calm ? Math.ceil(level.boss.hp * 0.3) : 0), every: level.boss.every || 3, n: level.boss.n || 2, timer: 0 };
      G.boss.maxHp = G.boss.hp;
      G.goals.forEach((g) => { if (g.type === 'boss') { g.n = G.boss.hp; g.left = G.boss.hp; } });
    }
    // owoce startowe bez gotowych dopasowań
    for (const cell of G.cells) {
      if (cell.v || cell.crate || cell.boss) continue;
      const ch = level.map[cell.r][cell.c];
      if (ch === 'j') { cell.tile = newTile(G, 'jar', -1); G.jarsSpawned += 1; continue; }
      cell.tile = newTile(G, 'f', pickColor(G, cell));
    }
    ensurePlayable(G, []);
    return G;
  }

  function newTile(G, k, col, sp = null) { return { id: G.nextId++, k, col, sp }; }
  const idx = (G, r, c) => r * G.W + c;
  const at = (G, r, c) => (r >= 0 && c >= 0 && r < G.H && c < G.W ? G.cells[r * G.W + c] : null);
  const live = (cl) => cl && !cl.v;
  const isFruit = (cl) => cl && cl.tile && cl.tile.k === 'f';
  const colOf = (cl) => (isFruit(cl) && cl.tile.sp !== 'yarn' ? cl.tile.col : -1);
  const movable = (cl) => live(cl) && cl.tile && !cl.cover && !cl.crate && !cl.boss;

  function pickColor(G, cell) {
    const bad = new Set();
    const L1 = at(G, cell.r, cell.c - 1), L2 = at(G, cell.r, cell.c - 2);
    if (colOf(L1) >= 0 && colOf(L1) === colOf(L2)) bad.add(colOf(L1));
    const U1 = at(G, cell.r - 1, cell.c), U2 = at(G, cell.r - 2, cell.c);
    if (colOf(U1) >= 0 && colOf(U1) === colOf(U2)) bad.add(colOf(U1));
    const UL = at(G, cell.r - 1, cell.c - 1);
    if (colOf(L1) >= 0 && colOf(L1) === colOf(U1) && colOf(U1) === colOf(UL)) bad.add(colOf(L1));
    const opts = [];
    for (let k = 0; k < G.colors; k += 1) if (!bad.has(k)) opts.push(k);
    return opts.length ? opts[Math.floor(G.rnd() * opts.length)] : Math.floor(G.rnd() * G.colors);
  }

  // ---------------------------------------------------------------- dopasowania
  function findGroups(G) {
    const { W, H } = G;
    const runs = [];
    for (let r = 0; r < H; r += 1) {
      let c = 0;
      while (c < W) {
        const k = colOf(at(G, r, c));
        let e = c + 1;
        if (k >= 0) while (e < W && colOf(at(G, r, e)) === k) e += 1;
        if (k >= 0 && e - c >= 3) runs.push({ dir: 'h', col: k, cells: range(c, e).map((x) => idx(G, r, x)) });
        c = e;
      }
    }
    for (let c = 0; c < W; c += 1) {
      let r = 0;
      while (r < H) {
        const k = colOf(at(G, r, c));
        let e = r + 1;
        if (k >= 0) while (e < H && colOf(at(G, e, c)) === k) e += 1;
        if (k >= 0 && e - r >= 3) runs.push({ dir: 'v', col: k, cells: range(r, e).map((y) => idx(G, y, c)) });
        r = e;
      }
    }
    for (let r = 0; r < H - 1; r += 1) {
      for (let c = 0; c < W - 1; c += 1) {
        const k = colOf(at(G, r, c));
        if (k < 0) continue;
        if (colOf(at(G, r, c + 1)) === k && colOf(at(G, r + 1, c)) === k && colOf(at(G, r + 1, c + 1)) === k) {
          runs.push({ dir: 's', col: k, cells: [idx(G, r, c), idx(G, r, c + 1), idx(G, r + 1, c), idx(G, r + 1, c + 1)] });
        }
      }
    }
    // łączenie zachodzących na siebie w grupy
    const groups = [];
    const owner = new Map();
    for (const run of runs) {
      const hit = new Set();
      for (const i of run.cells) if (owner.has(i)) hit.add(owner.get(i));
      let g;
      if (!hit.size) { g = { col: run.col, cells: new Set(), runs: [] }; groups.push(g); }
      else {
        const list = [...hit];
        g = list[0];
        for (const o of list.slice(1)) {
          o.cells.forEach((i) => { g.cells.add(i); owner.set(i, g); });
          g.runs.push(...o.runs);
          groups.splice(groups.indexOf(o), 1);
        }
      }
      run.cells.forEach((i) => { g.cells.add(i); owner.set(i, g); });
      g.runs.push(run);
    }
    for (const g of groups) {
      const lines = g.runs.filter((x) => x.dir !== 's');
      const longest = lines.reduce((m, x) => Math.max(m, x.cells.length), 0);
      const hasH = lines.some((x) => x.dir === 'h');
      const hasV = lines.some((x) => x.dir === 'v');
      if (longest >= 5) g.make = 'yarn';
      else if (hasH && hasV) g.make = 'bomb';
      else if (longest === 4) g.make = lines.find((x) => x.cells.length === 4).dir === 'h' ? 'rh' : 'rv';
      else if (g.runs.some((x) => x.dir === 's')) g.make = 'fly';
      else g.make = null;
      // środek dla kafelka specjalnego
      if (g.make === 'bomb') {
        const hs = new Set(lines.filter((x) => x.dir === 'h').flatMap((x) => x.cells));
        g.center = lines.filter((x) => x.dir === 'v').flatMap((x) => x.cells).find((i) => hs.has(i));
      } else if (g.make) {
        const base = g.make === 'fly' ? g.runs.find((x) => x.dir === 's').cells : lines.reduce((a, b) => (b.cells.length > a.cells.length ? b : a)).cells;
        g.center = base[Math.floor((base.length - 1) / 2)];
      }
    }
    return groups;
  }
  function range(a, b) { const o = []; for (let i = a; i < b; i += 1) o.push(i); return o; }

  // ---------------------------------------------------------------- trafienia
  // Zbiera wszystkie skutki jednej fazy: zbite owoce, efekty specjalnych, uszkodzenia przeszkód.
  function makePhase(G, cascade) { return { type: 'clear', cascade, cleared: [], created: [], effects: [], damaged: [], score: 0, hit: new Set(), adj: new Set() }; }

  function fireSpecial(G, ph, i, tile, forced) {
    const cell = G.cells[i];
    const { r, c } = cell;
    const sp = forced || tile.sp;
    const add = (rr, cc) => { const t = at(G, rr, cc); if (live(t)) hitCell(G, ph, idx(G, rr, cc)); };
    G.stats.specials += 1;
    if (sp === 'rh' || sp === 'rv') {
      ph.effects.push({ kind: sp, r, c });
      if (sp === 'rh') for (let x = 0; x < G.W; x += 1) add(r, x);
      else for (let y = 0; y < G.H; y += 1) add(y, c);
    } else if (sp === 'bomb' || sp === 'bomb2') {
      const rad = sp === 'bomb2' ? 2 : 1;
      ph.effects.push({ kind: 'bomb', r, c, rad });
      for (let y = r - rad; y <= r + rad; y += 1) for (let x = c - rad; x <= c + rad; x += 1) add(y, x);
    } else if (sp === 'fly') {
      ph.effects.push({ kind: 'flypop', r, c });
      add(r - 1, c); add(r + 1, c); add(r, c - 1); add(r, c + 1);
      const t = flyTarget(G, ph, i);
      if (t >= 0) {
        ph.effects.push({ kind: 'fly', r, c, tr: G.cells[t].r, tc: G.cells[t].c, carry: tile.carry || null });
        if (tile.carry) fireSpecial(G, ph, t, { sp: tile.carry }, tile.carry);
        else hitCell(G, ph, t);
      }
    } else if (sp === 'yarn') {
      const col = tile.target != null ? tile.target : commonColor(G);
      const targets = [];
      for (let k = 0; k < G.cells.length; k += 1) if (colOf(G.cells[k]) === col) targets.push(k);
      ph.effects.push({ kind: 'yarn', r, c, targets: targets.map((k) => [G.cells[k].r, G.cells[k].c]), col });
      targets.forEach((k) => hitCell(G, ph, k));
    }
  }

  function commonColor(G) {
    const n = new Array(6).fill(0);
    for (const cl of G.cells) if (colOf(cl) >= 0) n[cl.tile.col] += 1;
    let best = 0;
    for (let k = 1; k < 6; k += 1) if (n[k] > n[best]) best = k;
    return best;
  }

  function goalColors(G) { return G.goals.filter((g) => g.type === 'col' && g.left > 0).map((g) => g.col); }

  function flyTarget(G, ph, from) {
    const tiers = [[], [], [], []];
    const wantCol = new Set(goalColors(G));
    G.cells.forEach((cl, k) => {
      if (!live(cl) || k === from || ph.hit.has(k)) return;
      if (cl.boss) tiers[0].push(k);
      else if (cl.crate) tiers[0].push(k);
      else if (cl.cover) tiers[1].push(k);
      else if (cl.weed && cl.tile) tiers[1].push(k);
      else if (cl.tile && cl.tile.k === 'f' && wantCol.has(cl.tile.col)) tiers[2].push(k);
      else if (cl.tile && cl.tile.k === 'f') tiers[3].push(k);
    });
    const goalTypes = new Set(G.goals.filter((g) => g.left > 0).map((g) => g.type));
    if (!goalTypes.has('boss')) tiers[0] = tiers[0].filter((k) => !G.cells[k].boss);
    for (const t of tiers) if (t.length) return t[Math.floor(G.rnd() * t.length)];
    return -1;
  }

  function hitCell(G, ph, i) {
    if (ph.hit.has(i)) return;
    ph.hit.add(i);
    const cell = G.cells[i];
    if (!live(cell)) return;
    if (cell.boss) { damageBoss(G, ph, 1, cell); return; }
    if (cell.crate) {
      cell.crate -= 1;
      ph.damaged.push({ what: 'crate', r: cell.r, c: cell.c, left: cell.crate });
      if (!cell.crate) goal(G, 'crate', 1);
      return;
    }
    if (cell.cover) {
      cell.cover -= 1;
      ph.damaged.push({ what: cell.coverKind, r: cell.r, c: cell.c, left: cell.cover });
      if (!cell.cover) { if (cell.coverKind === 'web') goal(G, 'web', 1); cell.coverKind = null; }
      return;
    }
    const tile = cell.tile;
    if (!tile || tile.k === 'jar') return;
    cell.tile = null;
    ph.cleared.push({ id: tile.id, r: cell.r, c: cell.c, col: tile.col, sp: tile.sp });
    ph.score += 10 * ph.cascade;
    if (tile.col >= 0) {
      goal(G, 'col', 1, tile.col);
      if (tile.col === HERO_COLOR.P) G.charge.P = Math.min(HERO_NEED, G.charge.P + 1);
      if (tile.col === HERO_COLOR.C) G.charge.C = Math.min(HERO_NEED, G.charge.C + 1);
    }
    if (cell.weed) {
      cell.weed -= 1;
      ph.damaged.push({ what: 'weed', r: cell.r, c: cell.c, left: cell.weed });
      if (!cell.weed) goal(G, 'weed', 1);
    }
    if (tile.sp) { ph.score += 40; fireSpecial(G, ph, i, tile); }
  }

  function damageBoss(G, ph, n, cell) {
    if (!G.boss || G.boss.hp <= 0) return;
    G.boss.hp = Math.max(0, G.boss.hp - n);
    ph.damaged.push({ what: 'boss', r: cell ? cell.r : G.boss.r, c: cell ? cell.c : G.boss.c, left: G.boss.hp });
    ph.score += 50 * n;
    goal(G, 'boss', n);
  }

  function goal(G, type, n, col) {
    for (const g of G.goals) {
      if (g.type !== type || g.left <= 0) continue;
      if (type === 'col' && g.col !== col) continue;
      g.left = Math.max(0, g.left - n);
    }
  }

  // dopasowanie obok: skrzynki dostają, Sroka obrywa
  function adjacentEffects(G, ph, matchedCells) {
    let bossHits = 0;
    for (const i of matchedCells) {
      const cl = G.cells[i];
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = at(G, cl.r + dr, cl.c + dc);
        if (!live(n)) continue;
        const k = idx(G, n.r, n.c);
        if (n.crate && !ph.adj.has(k) && !ph.hit.has(k)) {
          ph.adj.add(k);
          n.crate -= 1;
          ph.damaged.push({ what: 'crate', r: n.r, c: n.c, left: n.crate });
          if (!n.crate) goal(G, 'crate', 1);
        }
        if (n.boss && !ph.adj.has(-1 - i)) { ph.adj.add(-1 - i); bossHits += 1; }
      }
    }
    if (bossHits) damageBoss(G, ph, bossHits, null);
  }

  // jedna faza z gotowych grup (dopasowania). preferIdx = gdzie powstaje specjalny
  function resolveGroups(G, groups, cascade, prefer) {
    const ph = makePhase(G, cascade);
    const make = [];
    for (const g of groups) {
      if (!g.make) continue;
      let spot = g.center;
      for (const p of prefer || []) if (g.cells.has(p)) { spot = p; break; }
      make.push({ spot, make: g.make, col: g.col });
    }
    const matched = [];
    for (const g of groups) g.cells.forEach((i) => matched.push(i));
    for (const i of matched) hitCell(G, ph, i);
    adjacentEffects(G, ph, matched);
    for (const m of make) {
      const cell = G.cells[m.spot];
      if (cell.tile || cell.crate || cell.boss) continue;
      cell.tile = newTile(G, 'f', m.make === 'yarn' ? -1 : m.col, m.make);
      ph.created.push({ id: cell.tile.id, r: cell.r, c: cell.c, col: cell.tile.col, sp: m.make });
      ph.score += 60;
    }
    return ph;
  }

  // ---------------------------------------------------------------- grawitacja
  function aboveCell(G, r, c) { for (let y = r - 1; y >= 0; y -= 1) { const cl = at(G, y, c); if (live(cl)) return cl; } return null; }
  function belowCell(G, r, c) { for (let y = r + 1; y < G.H; y += 1) { const cl = at(G, y, c); if (live(cl)) return cl; } return null; }
  const emptyCell = (cl) => live(cl) && !cl.tile && !cl.crate && !cl.boss;
  const fallTile = (cl) => live(cl) && cl.tile && !cl.cover && !cl.crate && !cl.boss;

  function gravity(G) {
    const moves = new Map();
    const spawnCount = new Array(G.W).fill(0);
    const track = (tile, from, to, spawn) => {
      let m = moves.get(tile.id);
      if (!m) { m = { id: tile.id, k: tile.k, col: tile.col, sp: tile.sp, path: [from], spawn }; moves.set(tile.id, m); }
      m.path.push(to);
    };
    const straight = () => {
      let changed = true, any = false;
      while (changed) {
        changed = false;
        for (let r = G.H - 1; r >= 0; r -= 1) {
          for (let c = 0; c < G.W; c += 1) {
            const e = at(G, r, c);
            if (!emptyCell(e)) continue;
            const a = aboveCell(G, r, c);
            if (a && fallTile(a)) {
              e.tile = a.tile; a.tile = null;
              track(e.tile, [a.r, a.c], [r, c], false);
              changed = any = true;
            } else if (!a) {
              spawnCount[c] += 1;
              e.tile = spawnTile(G);
              track(e.tile, [r - spawnCount[c], c], [r, c], true);
              changed = any = true;
            }
          }
        }
      }
      return any;
    };
    let guard = 0;
    for (;;) {
      straight();
      // jeden ruch po skosie, gdy prosto się nie da
      let moved = false;
      for (let r = G.H - 1; r >= 0 && !moved; r -= 1) {
        for (let c = 0; c < G.W && !moved; c += 1) {
          const e = at(G, r, c);
          if (!emptyCell(e)) continue;
          const a = aboveCell(G, r, c);
          if (a && (fallTile(a) || emptyCell(a))) continue;
          for (const dc of [-1, 1]) {
            const d = at(G, r - 1, c + dc);
            if (!fallTile(d)) continue;
            const b = belowCell(G, d.r, d.c);
            if (b && emptyCell(b)) continue;
            e.tile = d.tile; d.tile = null;
            track(e.tile, [d.r, d.c], [r, c], false);
            moved = true;
            break;
          }
        }
      }
      if (!moved || ++guard > 400) break;
    }
    // pola bez źródła (pod skrzynkami przy brzegu): owoc wyrasta na miejscu
    for (const e of G.cells) {
      if (!emptyCell(e)) continue;
      e.tile = spawnTile(G);
      track(e.tile, [e.r, e.c], [e.r, e.c], true);
      moves.get(e.tile.id).grow = true;
    }
    return [...moves.values()];
  }

  function spawnTile(G) {
    const jarGoal = G.goals.find((g) => g.type === 'jar');
    if (jarGoal) {
      let onBoard = 0;
      for (const cl of G.cells) if (cl.tile && cl.tile.k === 'jar') onBoard += 1;
      const need = jarGoal.left - onBoard;
      if (need > 0 && onBoard < G.jarsOnBoardMax && (onBoard === 0 || G.rnd() < (G.level.jarChance || 0.3))) {
        G.jarsSpawned += 1;
        return newTile(G, 'jar', -1);
      }
    }
    return newTile(G, 'f', Math.floor(G.rnd() * G.colors));
  }

  function collectJars(G) {
    const out = [];
    for (const cl of G.cells) {
      if (!cl.tile || cl.tile.k !== 'jar') continue;
      if (belowCell(G, cl.r, cl.c)) continue;
      out.push({ id: cl.tile.id, r: cl.r, c: cl.c });
      cl.tile = null;
      goal(G, 'jar', 1);
      G.score += 100;
    }
    return out;
  }

  // ---------------------------------------------------------------- pętla rozwiązywania
  function settle(G, steps, startCascade) {
    let cascade = startCascade;
    let guard = 0;
    for (;;) {
      const fall = gravity(G);
      if (fall.length) steps.push({ type: 'fall', moves: fall });
      const jars = collectJars(G);
      if (jars.length) { steps.push({ type: 'collect', jars }); continue; }
      const groups = findGroups(G);
      if (!groups.length || ++guard > 60) break;
      cascade += 1;
      const ph = resolveGroups(G, groups, cascade, null);
      pushPhase(G, steps, ph);
    }
    G.stats.cascadeMax = Math.max(G.stats.cascadeMax, cascade);
    return cascade;
  }

  function pushPhase(G, steps, ph) {
    G.score += ph.score;
    delete ph.hit; delete ph.adj;
    steps.push(ph);
  }

  function endTurn(G, steps, usedMove) {
    if (usedMove) G.moves -= 1;
    G.turn += 1;
    updateStatus(G);
    if (G.status === 'play' && G.boss && G.boss.hp > 0 && usedMove) {
      G.boss.timer += 1;
      if (G.boss.timer >= G.boss.every) {
        G.boss.timer = 0;
        const n = G.boss.n + (G.boss.hp <= G.boss.maxHp / 2 ? 1 : 0);
        const cand = G.cells.filter((cl) => isFruit(cl) && !cl.cover && !cl.tile.sp);
        const picked = [];
        for (let k = 0; k < n && cand.length; k += 1) {
          const j = Math.floor(G.rnd() * cand.length);
          const cl = cand.splice(j, 1)[0];
          cl.cover = 1; cl.coverKind = 'bling';
          picked.push([cl.r, cl.c]);
        }
        if (picked.length) steps.push({ type: 'boss', covered: picked });
      }
    }
    if (G.status === 'play') ensurePlayable(G, steps);
  }

  function updateStatus(G) {
    if (G.goals.every((g) => g.left <= 0)) G.status = 'win';
    else if (G.moves <= 0) G.status = 'lose';
  }

  // ---------------------------------------------------------------- ruchy
  function adjacent(a, b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1; }

  function swapCells(A, B) { const t = A.tile; A.tile = B.tile; B.tile = t; }

  function trySwap(G, a, b) {
    if (G.status !== 'play' || !adjacent(a, b)) return null;
    const A = at(G, a[0], a[1]), B = at(G, b[0], b[1]);
    if (!movable(A) || !movable(B)) return null;
    const spA = A.tile.k === 'f' ? A.tile.sp : null;
    const spB = B.tile.k === 'f' ? B.tile.sp : null;
    const steps = [{ type: 'swap', a, b, ida: A.tile.id, idb: B.tile.id }];
    swapCells(A, B);
    const ia = idx(G, b[0], b[1]); // gdzie teraz jest kafelek A
    const ib = idx(G, a[0], a[1]);
    let ph;
    if (spA && spB) {
      ph = combo(G, ia, ib);
    } else if (spA === 'yarn' || spB === 'yarn') {
      const yi = spA === 'yarn' ? ia : ib;
      const oi = spA === 'yarn' ? ib : ia;
      const other = G.cells[oi].tile;
      ph = makePhase(G, 1);
      const yarnTile = G.cells[yi].tile;
      if (other.k === 'jar') { swapCells(A, B); return null; }
      yarnTile.target = other.col;
      hitCell(G, ph, yi);
    } else if (spA || spB) {
      ph = makePhase(G, 1);
      const si = spA ? ia : ib;
      hitCell(G, ph, si);
      const groups = findGroups(G);
      if (groups.length) {
        const ph2 = resolveGroups(G, groups, 1, [ia, ib]);
        mergePhase(ph, ph2);
      }
    } else {
      const groups = findGroups(G);
      if (!groups.length) {
        swapCells(A, B);
        return null;
      }
      ph = resolveGroups(G, groups, 1, [ia, ib]);
    }
    pushPhase(G, steps, ph);
    settle(G, steps, 1);
    endTurn(G, steps, true);
    return steps;
  }

  function mergePhase(a, b) {
    a.cleared.push(...b.cleared);
    a.created.push(...b.created);
    a.effects.push(...b.effects);
    a.damaged.push(...b.damaged);
    a.score += b.score;
  }

  function combo(G, ia, ib) {
    const ph = makePhase(G, 1);
    const ta = G.cells[ia].tile, tb = G.cells[ib].tile;
    const set = new Set([ta.sp, tb.sp]);
    G.stats.combos += 1;
    // oba znikają bez własnego wybuchu; efekt łączony w miejscu ib (tam, gdzie przesunięto)
    const center = G.cells[ia];
    for (const i of [ia, ib]) {
      const cl = G.cells[i];
      ph.cleared.push({ id: cl.tile.id, r: cl.r, c: cl.c, col: cl.tile.col, sp: cl.tile.sp, combo: true });
      cl.tile = null;
      ph.hit.add(i);
    }
    const { r, c } = center;
    const line = (rr, cc, d) => { ph.effects.push({ kind: d, r: rr, c: cc }); if (d === 'rh') for (let x = 0; x < G.W; x += 1) hitCell(G, ph, idx(G, rr, x)); else for (let y = 0; y < G.H; y += 1) hitCell(G, ph, idx(G, y, cc)); };
    const okRow = (y) => y >= 0 && y < G.H;
    const okCol = (x) => x >= 0 && x < G.W;
    if (set.has('yarn')) {
      const other = ta.sp === 'yarn' ? tb : ta;
      if (other.sp === 'yarn') {
        ph.effects.push({ kind: 'yarnall', r, c });
        G.cells.forEach((cl, k) => hitCell(G, ph, k));
      } else {
        const col = other.col >= 0 ? other.col : commonColor(G);
        const targets = [];
        G.cells.forEach((cl, k) => { if (colOf(cl) === col) targets.push(k); });
        ph.effects.push({ kind: 'yarn', r, c, targets: targets.map((k) => [G.cells[k].r, G.cells[k].c]), col, turn: other.sp });
        for (const k of targets) {
          const t = G.cells[k].tile;
          t.sp = other.sp === 'rh' || other.sp === 'rv' ? (G.rnd() < 0.5 ? 'rh' : 'rv') : other.sp;
        }
        for (const k of targets) hitCell(G, ph, k);
      }
    } else if (set.has('fly')) {
      const other = ta.sp === 'fly' ? tb : ta;
      if (other.sp === 'fly') {
        for (let k = 0; k < 3; k += 1) fireSpecial(G, ph, ia, { sp: 'fly' }, 'fly');
      } else {
        fireSpecial(G, ph, ia, { sp: 'fly', carry: other.sp }, 'fly');
      }
    } else if (set.has('bomb') && (set.has('rh') || set.has('rv'))) {
      for (let d = -1; d <= 1; d += 1) { if (okRow(r + d)) line(r + d, c, 'rh'); if (okCol(c + d)) line(r, c + d, 'rv'); }
    } else if (set.has('bomb')) {
      fireSpecial(G, ph, ia, { sp: 'bomb2' }, 'bomb2');
    } else {
      line(r, c, 'rh');
      line(r, c, 'rv');
    }
    return ph;
  }

  // moc bohatera: Puszek kolumna, Persi rząd (bez zużycia ruchu)
  function usePower(G, hero, r, c) {
    if (G.status !== 'play' || G.charge[hero] < HERO_NEED) return null;
    const cell = at(G, r, c);
    if (!live(cell)) return null;
    G.charge[hero] = 0;
    const steps = [];
    const ph = makePhase(G, 1);
    ph.effects.push({ kind: hero === 'P' ? 'dig' : 'claw', r, c });
    if (hero === 'P') for (let y = 0; y < G.H; y += 1) hitCell(G, ph, idx(G, y, c));
    else for (let x = 0; x < G.W; x += 1) hitCell(G, ph, idx(G, r, x));
    pushPhase(G, steps, ph);
    settle(G, steps, 1);
    endTurn(G, steps, false);
    return steps;
  }

  // ---------------------------------------------------------------- grywalność planszy
  function validSwaps(G) {
    const out = [];
    for (const cl of G.cells) {
      if (!movable(cl)) continue;
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const n = at(G, cl.r + dr, cl.c + dc);
        if (!movable(n)) continue;
        if (isValidSwap(G, cl, n)) out.push([[cl.r, cl.c], [n.r, n.c]]);
      }
    }
    return out;
  }

  function isValidSwap(G, A, B) {
    const sa = A.tile.k === 'f' && A.tile.sp, sb = B.tile.k === 'f' && B.tile.sp;
    if (sa || sb) return !(A.tile.k === 'jar' || B.tile.k === 'jar') || (sa && sa !== 'yarn') || (sb && sb !== 'yarn');
    swapCells(A, B);
    const ok = lineAt(G, A) || lineAt(G, B);
    swapCells(A, B);
    return ok;
  }

  function lineAt(G, cl) {
    const k = colOf(cl);
    if (k < 0) return false;
    const same = (r, c) => colOf(at(G, r, c)) === k;
    let h = 1; for (let x = cl.c - 1; same(cl.r, x); x -= 1) h += 1; for (let x = cl.c + 1; same(cl.r, x); x += 1) h += 1;
    if (h >= 3) return true;
    let v = 1; for (let y = cl.r - 1; same(y, cl.c); y -= 1) v += 1; for (let y = cl.r + 1; same(y, cl.c); y += 1) v += 1;
    if (v >= 3) return true;
    for (const [dr, dc] of [[-1, -1], [-1, 0], [0, -1], [0, 0]]) {
      const r0 = cl.r + dr, c0 = cl.c + dc;
      if (same(r0, c0) && same(r0 + 1, c0) && same(r0, c0 + 1) && same(r0 + 1, c0 + 1)) return true;
    }
    return false;
  }

  function ensurePlayable(G, steps) {
    let tries = 0;
    while (findGroups(G).length || !validSwaps(G).length) {
      tries += 1;
      const spots = G.cells.filter((cl) => movable(cl) && cl.tile.k === 'f' && !cl.tile.sp);
      const cols = spots.map((cl) => cl.tile);
      for (let k = cols.length - 1; k > 0; k -= 1) { const j = Math.floor(G.rnd() * (k + 1)); [cols[k], cols[j]] = [cols[j], cols[k]]; }
      spots.forEach((cl, k) => { cl.tile = cols[k]; });
      if (tries > 30) {
        // twardy reset kolorów
        spots.forEach((cl) => { cl.tile.col = -9; });
        spots.forEach((cl) => { cl.tile.col = pickColor(G, cl); });
      }
      if (tries > 80) break;
    }
    if (tries && steps) steps.push({ type: 'shuffle', tiles: G.cells.filter((cl) => cl.tile).map((cl) => ({ id: cl.tile.id, r: cl.r, c: cl.c })) });
  }

  // podpowiedź: najlepszy ruch wg prostej oceny
  function findHint(G) {
    const list = validSwaps(G);
    let best = null, bestV = -1;
    for (const s of list) {
      const v = quickValue(G, s);
      if (v > bestV) { bestV = v; best = s; }
    }
    return best;
  }

  // ocena ruchu bez kaskad (dla podpowiedzi i symulatora)
  function quickValue(G, s) {
    const A = at(G, s[0][0], s[0][1]), B = at(G, s[1][0], s[1][1]);
    const sa = A.tile.sp, sb = B.tile.sp;
    const want = new Set(goalColors(G));
    if (sa && sb) return 60;
    if (sa === 'yarn' || sb === 'yarn') return 45 + (want.has((sa === 'yarn' ? B : A).tile.col) ? 10 : 0);
    let v = (sa || sb) ? 18 : 0;
    swapCells(A, B);
    const groups = findGroups(G);
    swapCells(A, B);
    for (const g of groups) {
      v += g.cells.size;
      if (g.make === 'yarn') v += 30; else if (g.make === 'bomb') v += 16; else if (g.make) v += 10;
      if (want.has(g.col)) v += g.cells.size * 2;
      g.cells.forEach((i) => {
        const cl = G.cells[i];
        if (cl.weed) v += 3;
        if (cl.cover) v += 3;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = at(G, cl.r + dr, cl.c + dc); if (n && (n.crate || n.boss)) v += 3; }
      });
    }
    // słoiki niżej = lepiej
    if (G.goals.some((g) => g.type === 'jar' && g.left > 0)) {
      for (const g of groups) g.cells.forEach((i) => {
        const cl = G.cells[i];
        for (let y = cl.r - 1; y >= 0; y -= 1) { const up = at(G, y, cl.c); if (up && up.tile && up.tile.k === 'jar') { v += 10; break; } }
      });
    }
    return v;
  }

  // finał: zostałe ruchy zamieniają się w rakiety (jak „wielkie sprzątanie”)
  function finale(G) {
    const steps = [];
    const cand = G.cells.filter((cl) => isFruit(cl) && !cl.tile.sp && !cl.cover);
    const n = Math.min(G.moves, 12, cand.length);
    const extra = G.moves - n;
    if (extra > 0) G.score += extra * 120;
    G.moves = 0;
    const picked = [];
    for (let k = 0; k < n; k += 1) {
      const j = Math.floor(G.rnd() * cand.length);
      const cl = cand.splice(j, 1)[0];
      cl.tile.sp = G.rnd() < 0.5 ? 'rh' : 'rv';
      picked.push(cl);
      steps.push({ type: 'finale', r: cl.r, c: cl.c, id: cl.tile.id, sp: cl.tile.sp, bonus: k === 0 ? extra * 120 : 0 });
    }
    // wszystkie specjalne na planszy wybuchają razem, potem jeszcze raz, jeśli coś zostało
    let left = G.cells.filter((cl) => isFruit(cl) && cl.tile.sp);
    let guard = 0;
    while (left.length && guard++ < 6) {
      const ph = makePhase(G, 1);
      left.forEach((cl) => hitCell(G, ph, idx(G, cl.r, cl.c)));
      pushPhase(G, steps, ph);
      settle(G, steps, 1);
      left = G.cells.filter((cl) => isFruit(cl) && cl.tile.sp);
    }
    return steps;
  }

  function addMoves(G, n) { G.moves += n; if (G.status === 'lose') G.status = 'play'; }

  function starsFor(level, score) {
    const t = level.stars || [0, 0];
    return 1 + (score >= t[0] ? 1 : 0) + (score >= t[1] ? 1 : 0);
  }

  const Rules = { FRUITS, HERO_COLOR, HERO_NEED, rng, createGame, trySwap, usePower, validSwaps, findHint, quickValue, finale, addMoves, starsFor, findGroups, at };
  if (typeof module !== 'undefined' && module.exports) module.exports = Rules;
  else root.Rules = Rules;
})(typeof window !== 'undefined' ? window : globalThis);
