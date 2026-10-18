const fs = require('fs');
const H = 480, TILE = 24, PLAYER_H = 48, PLAYER_W = 48, CAT_H = 42, PIXEL = 3;
function makePlatform(x, y, tiles, moving = false, opts = null) { return { x, y, w: tiles * TILE, moving, kind: (opts && opts.kind) || null }; }
function makePickup(x, y, kind) { return { x, y, kind }; }
function makeEnemySpawn() { return {}; }
function makeSpike(x, y) { return { x, y }; }
function makeSecret() { return {}; }
const PL = (x, k, tiles, kind = null) => makePlatform(x, H - TILE * k, tiles, kind === 'moving', kind && kind !== 'moving' ? { kind } : null);
const PU = (x, k, kind = 'carrot') => makePickup(x, H - TILE * k - 33, kind);
const ROW = (x, k, n, step = 30, kind = 'carrot') => Array.from({ length: n }, (_, i) => PU(x + i * step, k, kind));
const GROUND_CP = (x) => ({ x });
const ONP = (k) => H - TILE * k - CAT_H;
eval(fs.readFileSync('p3_levels.js', 'utf8').replace('const LEVELS', 'global.LEVELS'));
const G_UP = 0.52, G_DN = 0.6, LAUNCH = -15.8;
function run(hero) {
  const JUMP = -10.7 * (hero === 'C' ? 1.08 : 1);
  const SPEED = 2.75 * (hero === 'C' ? 1.12 : 1);
  const DJs = hero === 'C' ? [-1] : [-1, 6, 14, 22, 30];
  LEVELS.forEach((L, li) => {
    const S = L.platforms.map((p) => ({ x0: p.x, x1: p.x + p.w, y: p.y }));
    (L.bouncers || []).forEach((b) => S.push({ x0: b.x - 24, x1: b.x + 24, y: b.y - 22, bouncer: true }));
    function sim(sx, sy, vy0, dir, speed, djAt, boost) {
      let x = sx, y = sy, vy = vy0; const pts = [];
      for (let t = 0; t < 240; t++) {
        if (t === djAt) vy = -10.7 * 0.96;
        vy += vy < 0 ? G_UP : G_DN; vy = Math.min(vy, 16);
        const prevB = y + PLAYER_H; x += dir * speed; y += vy; pts.push([x, y]);
        if (vy >= 0) for (let i = 0; i < S.length; i++) { const s = S[i]; if (x + PLAYER_W - 4 <= s.x0 || x + 4 >= s.x1) continue; if (prevB <= s.y + 6 && y + PLAYER_H >= s.y) return { land: i, pts }; }
        if (y > H + 100) return { land: -1, pts };
      }
      return { land: -1, pts };
    }
    const start = S.findIndex((s) => s.y === H - TILE && L.startX >= s.x0 && L.startX < s.x1);
    const seen = new Set([start]); const q = [start]; const trails = [];
    const vineStarts = [];
    while (q.length) {
      const i = q.shift(); const s = S[i]; const starts = [];
      if (s.bouncer) starts.push({ x: (s.x0 + s.x1) / 2 - 24, vy0: LAUNCH });
      else for (let x = s.x0 - 40; x <= s.x1 - 8; x += 8) { starts.push({ x, vy0: JUMP }); starts.push({ x, vy0: 0.1 }); }
      if (hero === 'C') for (const v of (L.vines || [])) if (v.x > s.x0 - 20 && v.x < s.x1 + 20 && v.bottom >= s.y - 4 && v.top < s.y) starts.push({ x: v.x - 24, vy0: -6.5, y: v.top - PLAYER_H });
      for (const st of starts) for (const dir of [1, -1]) for (const sp of [SPEED, 1.6, 0.6]) for (const dj of DJs) {
        const r = sim(st.x, st.y !== undefined ? st.y : s.y - PLAYER_H, st.vy0, dir, sp, dj);
        trails.push(r.pts);
        if (r.land >= 0 && !seen.has(r.land)) { seen.add(r.land); q.push(r.land); }
      }
    }
    const exitS = S.findIndex((s) => L.exitX >= s.x0 && L.exitX < s.x1 && s.y === H - TILE);
    const un = S.map((s, i) => seen.has(i) ? null : `${s.x0}@k${(H - s.y) / TILE}`).filter(Boolean);
    const jars = L.pickups.filter((p) => p.kind === 'diamond').map((d) => trails.some((pts) => pts.some(([x, y]) => x + 40 > d.x && x + 8 < d.x + 24 && y + 40 > d.y && y + 8 < d.y + 30)) ? 'ok' : `BRAK@${d.x}`);
    console.log(`${hero} L${li + 1}: meta ${seen.has(exitS) ? 'OK' : 'BRAK'} | słoiki ${jars.join(' ')} | nieosiągalne: ${un.join(', ') || '-'}`);
  });
}
run('P'); run('C');
