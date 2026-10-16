// Reguły gry „Puszek i Persi: Sroka Złodziejka” – czysta logika, wspólna dla gry i solvera.
// Plansza: znaki
//  #  ściana          D  ziemia (Puszek kopie)     o  nora (tylko Puszek)
//  r  lina (podtrzymuje skrzynkę pod sobą; Persi drapie)
//  E  wyjście (obie postacie muszą stać na E)     *  złota marchewka (opcjonalna)
//  x y z  płyty naciskowe      X Y Z  drzwi otwierane płytą tej samej litery
//  l m    dźwignie             L M    drzwi otwarte, gdy dźwignia włączona;  K  otwarte, gdy l wyłączona
//  B  skrzynka   P  Puszek   C  Persi   .  pusto
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Rules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CLIMB = { P: 1, C: 2 };

  function parse(level) {
    const rows = level.map.map((r) => r.replace(/\s+$/, ''));
    const h = rows.length;
    const w = Math.max(...rows.map((r) => r.length));
    const base = [];
    const dirtIdx = [];
    const ropeIdx = [];
    const levers = [];
    const crates = [];
    let P = -1;
    let C = -1;
    const stars = [];
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let ch = rows[y][x] || '.';
        const i = y * w + x;
        if (ch === 'P') { P = i; ch = '.'; }
        else if (ch === 'C') { C = i; ch = '.'; }
        else if (ch === 'B') { crates.push(i); ch = '.'; }
        else if (ch === '*') { stars.push(i); }
        if (ch === 'D') dirtIdx.push(i);
        if (ch === 'r') ropeIdx.push(i);
        if (ch === 'l' || ch === 'm') { if (!levers.includes(ch)) levers.push(ch); }
        base.push(ch);
      }
    }
    if (P < 0 || C < 0) throw new Error('Brak P lub C w poziomie ' + (level.name || ''));
    const geo = { w, h, base, dirtIdx, ropeIdx, levers, stars };
    const state = {
      P, C,
      crates: crates.slice(),
      dirt: dirtIdx.map(() => 1),
      rope: ropeIdx.map(() => 1),
      lever: 0,
      star: 0,
      won: false
    };
    settle(geo, state, []);
    return { geo, state };
  }

  function clone(s) {
    return { P: s.P, C: s.C, crates: s.crates.slice(), dirt: s.dirt.slice(), rope: s.rope.slice(), lever: s.lever, star: s.star, won: s.won };
  }

  function key(s) {
    return s.P + ',' + s.C + '|' + s.crates.slice().sort((a, b) => a - b).join(',') + '|' + s.dirt.join('') + '|' + s.rope.join('') + '|' + s.lever + '|' + s.star;
  }

  function tileAt(geo, s, i) {
    const ch = geo.base[i];
    if (ch === 'D') {
      const k = geo.dirtIdx.indexOf(i);
      return s.dirt[k] ? 'D' : '.';
    }
    if (ch === 'r') {
      const k = geo.ropeIdx.indexOf(i);
      return s.rope[k] ? 'r' : '.';
    }
    return ch;
  }

  function leverOn(geo, s, letter) {
    const k = geo.levers.indexOf(letter);
    return k >= 0 && ((s.lever >> k) & 1) === 1;
  }

  function occupant(s, i) {
    if (s.P === i) return 'P';
    if (s.C === i) return 'C';
    if (s.crates.includes(i)) return 'B';
    return null;
  }

  function plateDown(geo, s, letter) {
    for (let i = 0; i < geo.base.length; i += 1) {
      if (geo.base[i] === letter && occupant(s, i)) return true;
    }
    return false;
  }

  function doorOpen(geo, s, i) {
    const ch = geo.base[i];
    if (occupant(s, i)) return true; // drzwi nie zamkną się na kimś
    if (ch === 'X' || ch === 'Y' || ch === 'Z') return plateDown(geo, s, ch.toLowerCase());
    if (ch === 'L' || ch === 'M') return leverOn(geo, s, ch.toLowerCase());
    if (ch === 'K') return !leverOn(geo, s, 'l');
    return true;
  }

  // czy komórka jest „ścianą” dla danego typu (bez uwzględnienia zajętości)
  function solidFor(geo, s, i, who) {
    const t = tileAt(geo, s, i);
    if (t === '#' || t === 'D') return true;
    if (t === 'o') return who !== 'P';
    if (t === 'r') return true;
    if ('XYZLMK'.includes(t)) return !doorOpen(geo, s, i);
    return false;
  }

  function inside(geo, x, y) {
    return x >= 0 && y >= 0 && x < geo.w && y < geo.h;
  }

  function free(geo, s, x, y, who) {
    if (!inside(geo, x, y)) return false;
    const i = y * geo.w + x;
    return !solidFor(geo, s, i, who) && !occupant(s, i);
  }

  // grawitacja + drzwi do stanu stabilnego
  function settle(geo, s, events) {
    const w = geo.w;
    for (let guard = 0; guard < 200; guard += 1) {
      let moved = false;
      const ents = [{ t: 'P' }, { t: 'C' }].concat(s.crates.map((_, k) => ({ t: 'B', k })));
      const pos = (e) => (e.t === 'B' ? s.crates[e.k] : s[e.t]);
      ents.sort((a, b) => pos(b) - pos(a));
      for (const e of ents) {
        const i = pos(e);
        const x = i % w;
        const y = (i - x) / w;
        if (e.t === 'B') {
          const above = (y - 1) * w + x;
          if (y > 0 && tileAt(geo, s, above) === 'r') continue; // wisi na linie
        }
        if (y + 1 >= geo.h) continue;
        const below = i + w;
        if (solidFor(geo, s, below, e.t) || occupant(s, below)) continue;
        if (e.t === 'B') s.crates[e.k] = below; else s[e.t] = below;
        moved = true;
        events.push({ type: 'fall', who: e.t, k: e.k });
      }
      if (!moved) break;
    }
    // zebranie gwiazdki
    for (const st of geo.stars) {
      if (!s.star && (s.P === st || s.C === st)) {
        s.star = 1;
        events.push({ type: 'star' });
      }
    }
    const onExit = (i) => geo.base[i] === 'E';
    if (!s.won && onExit(s.P) && onExit(s.C)) {
      s.won = true;
      events.push({ type: 'win' });
    }
  }

  // ruch postaci who ('P'|'C') w kierunku d (-1|1)
  function move(geo, prev, who, d) {
    const s = clone(prev);
    const ev = [];
    const w = geo.w;
    const i = s[who];
    const x = i % w;
    const y = (i - x) / w;
    const tx = x + d;
    if (free(geo, s, tx, y, who)) {
      s[who] = y * w + tx;
      ev.push({ type: 'walk', who });
    } else {
      const ti = y * w + tx;
      const ck = inside(geo, tx, y) ? s.crates.indexOf(ti) : -1;
      if (who === 'C' && ck >= 0 && free(geo, s, tx + d, y, 'B') && !(y > 0 && tileAt(geo, s, (y - 1) * w + tx) === 'r')) {
        s.crates[ck] = ti + d;
        s[who] = ti;
        ev.push({ type: 'push', who, k: ck });
      } else {
        let ok = false;
        for (let hgt = 1; hgt <= CLIMB[who] && !ok; hgt += 1) {
          if (!free(geo, s, x, y - hgt, who)) break; // brak miejsca nad głową
          if (!free(geo, s, tx, y - hgt, who)) continue;
          const sup = (y - hgt + 1) * w + tx;
          if (!(solidFor(geo, s, sup, who) || occupant(s, sup))) continue;
          s[who] = (y - hgt) * w + tx;
          ev.push({ type: 'climb', who, h: hgt });
          ok = true;
        }
        if (!ok) return { state: prev, events: [{ type: 'blocked', who }], changed: false };
      }
    }
    const pressedBefore = platesSnapshot(geo, prev);
    settle(geo, s, ev);
    diffPlates(geo, pressedBefore, s, ev);
    return { state: s, events: ev, changed: true };
  }

  // akcja: dir = -1 (lewo), 1 (prawo), 'down', 'up', 'here'
  function act(geo, prev, who, dir) {
    const s = clone(prev);
    const ev = [];
    const w = geo.w;
    const i = s[who];
    const x = i % w;
    const y = (i - x) / w;
    const cellOf = (dd) => {
      if (dd === 'down') return inside(geo, x, y + 1) ? i + w : -1;
      if (dd === 'up') return inside(geo, x, y - 1) ? i - w : -1;
      if (dd === 'upside') return null;
      return inside(geo, x + dd, y) ? i + dd : -1;
    };
    let done = false;
    if (dir === 'here') {
      const t = geo.base[i];
      if (t === 'l' || t === 'm') {
        const k = geo.levers.indexOf(t);
        s.lever ^= (1 << k);
        ev.push({ type: 'lever', who, on: ((s.lever >> k) & 1) === 1 });
        done = true;
      }
    } else if (who === 'P') {
      const c = cellOf(dir);
      if (c >= 0 && dir !== 'up' && tileAt(geo, s, c) === 'D' && !occupant(s, c)) {
        s.dirt[geo.dirtIdx.indexOf(c)] = 0;
        ev.push({ type: 'dig', who, at: c });
        done = true;
      }
    } else if (who === 'C') {
      const cands = dir === 'up' ? [i - w] : (typeof dir === 'number' ? [i + dir, i - w + dir] : []);
      for (const c of cands) {
        if (c < 0) continue;
        const cx = c % w;
        if (Math.abs(cx - x) > 1) continue;
        if (tileAt(geo, s, c) === 'r') {
          s.rope[geo.ropeIdx.indexOf(c)] = 0;
          ev.push({ type: 'scratch', who, at: c });
          done = true;
          break;
        }
      }
    }
    if (!done) return { state: prev, events: [{ type: 'nothing', who }], changed: false };
    const pressedBefore = platesSnapshot(geo, prev);
    settle(geo, s, ev);
    diffPlates(geo, pressedBefore, s, ev);
    return { state: s, events: ev, changed: true };
  }

  function platesSnapshot(geo, s) {
    const out = {};
    for (const L of 'xyz') out[L] = plateDown(geo, s, L);
    return out;
  }

  function diffPlates(geo, before, s, ev) {
    for (const L of 'xyz') {
      const now = plateDown(geo, s, L);
      if (now !== before[L]) ev.push({ type: now ? 'plateDown' : 'plateUp', letter: L });
    }
  }

  // wszystkie możliwe akcje (dla solvera)
  function actions(geo, s) {
    const out = [];
    for (const who of ['P', 'C']) {
      out.push({ who, kind: 'move', d: -1 }, { who, kind: 'move', d: 1 });
      const t = geo.base[s[who]];
      if (t === 'l' || t === 'm') out.push({ who, kind: 'act', d: 'here' });
      if (who === 'P') out.push({ who, kind: 'act', d: -1 }, { who, kind: 'act', d: 1 }, { who, kind: 'act', d: 'down' });
      if (who === 'C' && geo.ropeIdx.length) out.push({ who, kind: 'act', d: -1 }, { who, kind: 'act', d: 1 }, { who, kind: 'act', d: 'up' });
    }
    return out;
  }

  function apply(geo, s, a) {
    return a.kind === 'move' ? move(geo, s, a.who, a.d) : act(geo, s, a.who, a.d);
  }

  return { parse, clone, key, move, act, actions, apply, tileAt, doorOpen, plateDown, leverOn, occupant, CLIMB };
});
