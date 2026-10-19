// Testy logiki: losowa gra na wszystkich poziomach + odtwarzanie kroków tak, jak robi to renderer.
const R = require('../rules.js');
const LEVELS = require('../levels.js');

function check(cond, msg) { if (!cond) throw new Error(msg); }

function applySteps(view, steps) {
  // view: Map id -> {r,c}
  for (const s of steps) {
    if (s.type === 'swap') {
      const a = view.get(s.ida), b = view.get(s.idb);
      check(a && b, 'swap: brak kafelka w widoku');
      view.set(s.ida, { r: s.b[0], c: s.b[1] });
      view.set(s.idb, { r: s.a[0], c: s.a[1] });
    } else if (s.type === 'clear') {
      for (const t of s.cleared) { check(view.has(t.id), `clear: brak id ${t.id}`); view.delete(t.id); }
      for (const t of s.created) view.set(t.id, { r: t.r, c: t.c });
    } else if (s.type === 'fall') {
      for (const m of s.moves) {
        if (!m.spawn) check(view.has(m.id), `fall: brak id ${m.id}`);
        const last = m.path[m.path.length - 1];
        view.set(m.id, { r: last[0], c: last[1] });
      }
    } else if (s.type === 'collect') {
      for (const j of s.jars) { check(view.has(j.id), 'collect: brak słoika'); view.delete(j.id); }
    } else if (s.type === 'shuffle') {
      view.clear();
      for (const t of s.tiles) view.set(t.id, { r: t.r, c: t.c });
    }
  }
}

function boardView(G) {
  const m = new Map();
  for (const cl of G.cells) if (cl.tile) m.set(cl.tile.id, { r: cl.r, c: cl.c });
  return m;
}

function sameView(a, b) {
  if (a.size !== b.size) return `rozmiar ${a.size} vs ${b.size}`;
  for (const [id, p] of b) { const q = a.get(id); if (!q || q.r !== p.r || q.c !== p.c) return `id ${id} ${JSON.stringify(q)} vs ${JSON.stringify(p)}`; }
  return null;
}

let games = 0, moves = 0, wins = 0;
const t0 = Date.now();
LEVELS.forEach((level, li) => {
  for (let g = 0; g < 25; g += 1) {
    for (const mode of ['S', 'C']) {
      const G = R.createGame(level, { seed: 1000 * li + g * 7 + (mode === 'S' ? 1 : 0), mode });
      games += 1;
      check(!R.findGroups(G).length, `L${li + 1}: gotowe dopasowanie na starcie`);
      check(R.validSwaps(G).length > 0, `L${li + 1}: brak ruchu na starcie`);
      let view = boardView(G);
      let guard = 0;
      while (G.status === 'play' && guard++ < 200) {
        let steps;
        if (G.charge.P >= R.HERO_NEED && g % 2) steps = R.usePower(G, 'P', 2, 3);
        else {
          const list = R.validSwaps(G);
          check(list.length, `L${li + 1}: brak ruchu w trakcie`);
          const pick = g % 3 === 0 ? list[Math.floor(G.rnd() * list.length)] : R.findHint(G);
          steps = R.trySwap(G, pick[0], pick[1]);
          check(steps, `L${li + 1}: odrzucony ruch z listy poprawnych ${JSON.stringify(pick)}`);
          moves += 1;
        }
        applySteps(view, steps);
        const diff = sameView(view, boardView(G));
        check(!diff, `L${li + 1}: widok rozjechany: ${diff}`);
        if (G.status === 'play') check(!R.findGroups(G).length, `L${li + 1}: zostały dopasowania po ruchu`);
        const holes = G.cells.filter((cl) => !cl.v && !cl.tile && !cl.crate && !cl.boss).length;
        check(holes === 0, `L${li + 1}: puste pola po ruchu: ${holes}`);
      }
      if (G.status === 'win') {
        wins += 1;
        const st = R.finale(G);
        applySteps(view, st);
        const diff = sameView(view, boardView(G));
        check(!diff, `L${li + 1}: finał rozjechany: ${diff}`);
      }
    }
  }
});
console.log(`OK: ${games} gier, ${moves} ruchów, wygrane ${wins}, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
