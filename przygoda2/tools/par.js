// Wpisuje "par" (min ruchów +10%) do levels.js
const fs = require('fs');
const path = require('path');
const R = require('../rules.js');
const file = path.join(__dirname, '..', 'levels.js');
const { LEVELS } = require('../levels.js');
function bfs(map) { const { geo, state } = R.parse({ map }); const seen = new Set([R.key(state)]); let fr = [state]; let d = 0; while (fr.length) { const nx = []; for (const s of fr) for (const a of R.actions(geo, s)) { const r = R.apply(geo, s, a); if (!r.changed) continue; const k = R.key(r.state); if (seen.has(k)) continue; seen.add(k); if (r.state.won) return d + 1; nx.push(r.state); } fr = nx; d += 1; } return -1; }
let src = fs.readFileSync(file, 'utf8');
LEVELS.forEach((lv) => {
  const min = bfs(lv.map);
  if (min < 0) throw new Error('Nierozwiązywalny: ' + lv.name);
  const par = Math.ceil(min * 1.1);
  const re = new RegExp(`(name: '${lv.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',)( par: \\d+,)?`);
  src = src.replace(re, `$1 par: ${par},`);
  console.log(lv.name, min, '→ par', par);
});
fs.writeFileSync(file, src);
