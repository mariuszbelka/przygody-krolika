// Symulator: strojenie liczby ruchów i progów gwiazdek.
// Gracz modelowy: 75% najlepszy ruch wg prostej oceny, 25% losowy poprawny ruch (dziecko nie zawsze widzi najlepszy).
// Jedna rozgrywka z dużym limitem ruchów daje od razu „po ilu ruchach wygrał” → krzywa szansy wygranej dla każdego limitu.
// Użycie: node tools/sim.js [N=200] [--write]
const fs = require('fs');
const path = require('path');
const R = require('../rules.js');
const LEVELS = require('../levels.js');

const N = Number(process.argv[2]) || 200;
const WRITE = process.argv.includes('--write');
const TARGET = (li) => (li < 4 ? 0.9 : li < 10 ? 0.75 : li < 15 ? 0.65 : 0.6); // szansa wygranej gracza modelowego w Czadowo
const SMART = 0.75;

function play(level, seed, mode, budget) {
  const L = { ...level, moves: budget };
  const G = R.createGame(L, { seed, mode });
  if (mode === 'S') G.moves = budget; // limit bez premii trybu – liczymy zużyte ruchy
  const pick = R.rng(seed * 31 + 7);
  let used = 0;
  while (G.status === 'play') {
    for (const h of ['P', 'C']) if (G.charge[h] >= R.HERO_NEED) {
      const s = R.findHint(G);
      if (s) R.usePower(G, h, s[0][0], s[0][1]);
    }
    if (G.status !== 'play') break;
    const list = R.validSwaps(G);
    const mv = pick() < SMART ? R.findHint(G) : list[Math.floor(pick() * list.length)];
    R.trySwap(G, mv[0], mv[1]);
    used += 1;
  }
  return { win: G.status === 'win', used, G };
}

function pct(arr, p) { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }

const out = [];
const t0 = Date.now();
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean).map(Number);
LEVELS.forEach((level, li) => {
  if (ONLY.length && !ONLY.includes(li + 1)) return;
  const usedC = [], usedS = [];
  for (let k = 0; k < N; k += 1) {
    const rc = play(level, 5000 + k * 13 + li * 100000, 'C', 120);
    usedC.push(rc.win ? rc.used : 999);
    const rs = play(level, 9000 + k * 17 + li * 100000, 'S', 120);
    usedS.push(rs.win ? rs.used : 999);
  }
  const winAt = (arr, m) => arr.filter((u) => u <= m).length / arr.length;
  let m = 8;
  while (m < 60 && winAt(usedC, m) < TARGET(li)) m += 1;
  const mS = m + Math.ceil(m * 0.2);
  // progi gwiazdek z prawdziwych wyników przy wybranym limicie (z finałem)
  const scores = [];
  for (let k = 0; k < Math.min(N, 120); k += 1) {
    const L = { ...level, moves: m };
    const G = R.createGame(L, { seed: 777 + k * 3 + li * 1000, mode: 'C' });
    const pick = R.rng(k + 99);
    while (G.status === 'play') {
      const list = R.validSwaps(G);
      const mv = pick() < SMART ? R.findHint(G) : list[Math.floor(pick() * list.length)];
      R.trySwap(G, mv[0], mv[1]);
    }
    if (G.status === 'win') { R.finale(G); scores.push(G.score); }
  }
  const s2 = Math.round(pct(scores, 0.5) / 100) * 100;
  const s3 = Math.round(pct(scores, 0.85) / 100) * 100;
  const row = {
    L: li + 1, name: level.name, moves: m,
    winC: winAt(usedC, m).toFixed(2), winS_calmMoves: winAt(usedS, mS).toFixed(2),
    medUsedC: pct(usedC, 0.5), medUsedS: pct(usedS, 0.5), stars: [s2, s3]
  };
  out.push(row);
  console.log(JSON.stringify(row));
});
console.log(`czas ${((Date.now() - t0) / 1000).toFixed(0)} s`);

if (WRITE) {
  const file = path.join(__dirname, '..', 'levels.js');
  let src = fs.readFileSync(file, 'utf8');
  out.forEach((row) => {
    const re = new RegExp(`(name: '${row.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',[^\\n]*?moves: )\\d+(, stars: \\[)\\d+, \\d+(\\])`);
    if (!re.test(src)) { console.log('nie znaleziono', row.name); return; }
    src = src.replace(re, `$1${row.moves}$2${row.stars[0]}, ${row.stars[1]}$3`);
  });
  fs.writeFileSync(file, src);
  console.log('zapisano levels.js');
}
