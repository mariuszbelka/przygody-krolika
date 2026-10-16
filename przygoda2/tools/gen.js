// Poszukiwanie trudnych pokoi: hill-climbing po mutacjach szablonu, ocena przez solver.
// node tools/gen.js <seed> <sekundy>
const R = require('../rules.js');
const seed0 = Number(process.argv[2] || 1);
const secs = Number(process.argv[3] || 60);
let rs = seed0 * 7919 + 13;
const rnd = () => { rs ^= rs << 13; rs >>>= 0; rs ^= rs >> 17; rs ^= rs << 5; rs >>>= 0; return rs / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

function solve(map, limit = 120000) {
  let parsed;
  try { parsed = R.parse({ map }); } catch (e) { return null; }
  const { geo, state } = parsed;
  if (state.won) return null;
  const seen = new Map([[R.key(state), null]]);
  let frontier = [state];
  let depth = 0;
  while (frontier.length) {
    const next = [];
    for (const s of frontier) {
      for (const a of R.actions(geo, s)) {
        const r = R.apply(geo, s, a);
        if (!r.changed) continue;
        const k = R.key(r.state);
        if (seen.has(k)) continue;
        seen.set(k, { from: R.key(s), a, ev: r.events });
        if (r.state.won) {
          const path = [];
          let cur = k;
          while (seen.get(cur)) { const e = seen.get(cur); path.push(e); cur = e.from; }
          path.reverse();
          return { moves: depth + 1, states: seen.size, path };
        }
        next.push(r.state);
        if (seen.size > limit) return null;
      }
    }
    frontier = next;
    depth += 1;
  }
  return { moves: -1, states: seen.size };
}

function score(map) {
  const r = solve(map);
  if (!r || r.moves < 0) return { s: -1 };
  let switches = 0;
  let interesting = 0;
  let last = null;
  const kinds = new Set();
  for (const step of r.path) {
    if (last && step.a.who !== last) switches += 1;
    last = step.a.who;
    for (const e of step.ev) {
      if (['push', 'dig', 'scratch', 'lever', 'plateDown', 'plateUp'].includes(e.type)) { interesting += 1; kinds.add(e.type); }
      if (e.type === 'climb') interesting += 0.3;
    }
  }
  return { s: switches * 3 + interesting * 2 + r.moves * 0.25 + kinds.size * 4 + Math.log(r.states), r, switches, interesting };
}

const TEMPLATES = {
  // znaki ? to pola mutowane: . # D
  mix: [
    '################',
    '#??????????????#',
    '#??????????????#',
    '#??????????????#',
    '#??????????????#',
    '#??????????????#',
    '#??????????????#',
    '#??????????????#',
    '#??????????????#',
    '################']
};
const ITEMS = ['P', 'C', 'B', 'B', 'x', 'X', 'E', 'E'];
const extra = (process.argv[4] || '').split('');

function randomMap() {
  const g = TEMPLATES.mix.map((r) => r.split('').map((c) => (c === '?' ? (rnd() < 0.3 ? '#' : '.') : c)));
  for (const it of ITEMS.concat(extra)) place(g, it);
  return g;
}
function cells(g, f) { const out = []; g.forEach((row, y) => row.forEach((c, x) => { if (f(c, x, y)) out.push([x, y]); })); return out; }
function place(g, it) {
  const free = cells(g, (c, x, y) => c === '.' && x > 0 && x < 15 && y > 0 && y < 9);
  if (!free.length) return;
  const [x, y] = pick(free);
  g[y][x] = it;
}
function mutate(g0) {
  const g = g0.map((r) => r.slice());
  const n = 1 + Math.floor(rnd() * 3);
  for (let k = 0; k < n; k += 1) {
    const op = rnd();
    if (op < 0.6) {
      const x = 1 + Math.floor(rnd() * 14);
      const y = 1 + Math.floor(rnd() * 8);
      const c = g[y][x];
      if (c === '.') g[y][x] = rnd() < 0.8 ? '#' : 'D';
      else if (c === '#' || c === 'D') g[y][x] = '.';
    } else {
      const items = cells(g, (c) => !'.#D'.includes(c));
      const [x, y] = pick(items);
      const it = g[y][x];
      g[y][x] = '.';
      place(g, it);
    }
  }
  return g;
}
const toMap = (g) => g.map((r) => r.join(''));

let best = null;
const t0 = Date.now();
let cur = null;
let curS = -1;
while (Date.now() - t0 < secs * 1000) {
  let cand;
  if (!cur || rnd() < 0.02) cand = randomMap(); else cand = mutate(cur);
  const sc = score(toMap(cand));
  if (sc.s >= curS || rnd() < 0.01) { cur = cand; curS = sc.s; }
  if (!best || sc.s > best.s) { best = { s: sc.s, map: toMap(cand), moves: sc.r && sc.r.moves, sw: sc.switches, it: sc.interesting }; }
}
console.log(JSON.stringify(best));
