// Sprawdza, czy elementy są potrzebne: wynik bez skrzynek / bez marchewki itp.
const R = require('../rules.js');
const { LEVELS } = require('../levels.js');
function bfs(map) { let p; try { p = R.parse({ map }); } catch (e) { return 'ERR'; } const { geo, state } = p; const seen = new Set([R.key(state)]); let fr = [state]; let d = 0; while (fr.length) { const nx = []; for (const s of fr) for (const a of R.actions(geo, s)) { const r = R.apply(geo, s, a); if (!r.changed) continue; const k = R.key(r.state); if (seen.has(k)) continue; seen.add(k); if (r.state.won) return d + 1; nx.push(r.state); } fr = nx; d += 1; } return -1; }
LEVELS.forEach((lv, i) => {
  const out = [];
  const m = lv.map;
  if (m.join('').includes('B')) {
    const nB = (m.join('').match(/B/g) || []).length;
    for (let k = 0; k < nB; k += 1) { let c = -1; out.push('bez skrzynki ' + (k + 1) + ': ' + bfs(m.map((row) => row.replace(/B/g, (x) => { c += 1; return c === k ? '.' : x; })))); }
  }
  if (m.join('').match(/[xyz]/)) out.push('płyty zawsze wciśnięte: ' + bfs(m.map((r) => r.replace(/[XYZ]/g, '.'))));
  if (m.join('').includes('o')) out.push('nory jako ściana: ' + bfs(m.map((r) => r.replace(/o/g, '#'))));
  if (m.join('').includes('D')) out.push('ziemia jako ściana: ' + bfs(m.map((r) => r.replace(/D/g, '#'))));
  console.log(String(i + 1).padStart(2), lv.name.padEnd(22), out.join(' | '));
});
