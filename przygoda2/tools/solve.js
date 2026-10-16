// Solver BFS: sprawdza, czy każdy pokój da się przejść; liczy minimalną liczbę ruchów
// (bez marchewki i z marchewką). Użycie: node tools/solve.js [numer_pokoju]
const R = require('../rules.js');
const { LEVELS } = require('../levels.js');

function bfs(level, needStar, limit = 3e6) {
  const { geo, state } = R.parse(level);
  const start = state;
  const seen = new Map();
  seen.set(R.key(start), null);
  let frontier = [start];
  let depth = 0;
  let count = 1;
  const parents = new Map();
  while (frontier.length) {
    const next = [];
    for (const s of frontier) {
      for (const a of R.actions(geo, s)) {
        const r = R.apply(geo, s, a);
        if (!r.changed) continue;
        const k = R.key(r.state);
        if (seen.has(k)) continue;
        seen.set(k, { from: R.key(s), a });
        count += 1;
        if (r.state.won && (!needStar || r.state.star)) {
          // odtworzenie ścieżki
          const path = [];
          let cur = k;
          while (seen.get(cur)) { const e = seen.get(cur); path.push(e.a); cur = e.from; }
          path.reverse();
          return { moves: depth + 1, states: count, path };
        }
        if (r.state.won) continue; // wygrana bez marchewki – nie rozwijamy dalej
        next.push(r.state);
      }
      if (count > limit) return { moves: -1, states: count, cut: true };
    }
    frontier = next;
    depth += 1;
  }
  return { moves: -1, states: count };
}

const fmt = (a) => a.who + (a.kind === 'move' ? (a.d < 0 ? '←' : '→') : ('!' + (a.d === -1 ? '←' : a.d === 1 ? '→' : a.d === 'down' ? '↓' : a.d === 'up' ? '↑' : '•')));
const only = process.argv[2] ? Number(process.argv[2]) : null;
const show = process.argv.includes('--path');
LEVELS.forEach((lv, idx) => {
  if (only && only !== idx + 1) return;
  const t0 = Date.now();
  const a = bfs(lv, false);
  const b = lv.map.join('').includes('*') ? bfs(lv, true) : null;
  console.log(`${String(idx + 1).padStart(2)} ${lv.name.padEnd(26)} min=${a.moves} (stany ${a.states})` + (b ? `  z marchewką=${b.moves} (stany ${b.states})` : '') + `  ${Date.now() - t0}ms`);
  if (show && a.path) console.log('   ' + a.path.map(fmt).join(' '));
  if (show && b && b.path) console.log('   *' + b.path.map(fmt).join(' '));
});
