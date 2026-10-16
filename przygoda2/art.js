// Grafika: kafelki 24×24 px (rysowane ×2), sprite'y postaci z pierwszej części (assets/*.png).
(function () {
  'use strict';
  const T = 24;
  const cache = new Map();

  function hash(x, y, s = 0) {
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function mk(key, w, h, draw) {
    let c = cache.get(key);
    if (c) return c;
    c = canvas(w, h);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    draw(g, w, h);
    cache.set(key, c);
    return c;
  }
  const px = (g, x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

  const THEMES = [
    { name: 'Ogród', sky: ['#7FCBF2', '#D6F2FF'], far: '#9FD39A', near: '#76BD6E', inner: 'rgba(40,70,40,0.0)',
      wall: ['#6E4520', '#8B5A2B', '#A8743E'], top: ['#3E8E3A', '#5DBB4A', '#8EDB6A'], line: '#4A2E14' },
    { name: 'Szopa', sky: ['#3A2A20', '#5E4330'], far: '#4A3527', near: '#57402F', inner: 'rgba(0,0,0,0)',
      wall: ['#6F4B2C', '#93653B', '#B9874F'], top: ['#5B3D22', '#B9874F', '#D7A86A'], line: '#3A2414' },
    { name: 'Piwnica', sky: ['#1B1F2B', '#2C3242'], far: '#252A38', near: '#2E3445', inner: 'rgba(0,0,0,0)',
      wall: ['#4E525E', '#6C717F', '#8F95A4'], top: ['#4E525E', '#8F95A4', '#B4BAC8'], line: '#2A2D36' },
    { name: 'Wieża Sroki', sky: ['#2A2250', '#6B4A7E'], far: '#3A2E5C', near: '#463668', inner: 'rgba(0,0,0,0)',
      wall: ['#7D3E33', '#A85A43', '#C7765A'], top: ['#6B5A4A', '#C9B79C', '#E6D8BE'], line: '#4A231C' }
  ];

  function wallTile(th, openTop, openLeft, openRight, seedX, seedY, worldIdx) {
    return mk(`w${worldIdx}|${openTop}|${openLeft}|${openRight}|${(seedX * 7 + seedY * 3) % 4}`, T, T, (g) => {
      const [d, m, l] = th.wall;
      px(g, 0, 0, m, T, T);
      if (worldIdx === 0) {
        for (let i = 0; i < 26; i += 1) {
          const x = Math.floor(hash(i, seedX, seedY) * 22);
          const y = Math.floor(hash(seedY, i, seedX) * 22);
          px(g, x, y, hash(x, y) < 0.5 ? d : l, 2, 2);
        }
      } else if (worldIdx === 1) {
        for (let y = 0; y < T; y += 6) {
          px(g, 0, y, d, T, 1);
          px(g, 0, y + 1, l, T, 1);
          const off = (y / 6 + seedX) % 2 ? 4 : 15;
          px(g, off, y + 1, d, 1, 5);
          px(g, off + 2, y + 3, '#2E1E10', 1, 1);
        }
      } else if (worldIdx === 2) {
        const rows = [0, 8, 16];
        rows.forEach((y, r) => {
          px(g, 0, y, d, T, 1);
          const off = (r + seedX) % 2 ? 0 : 12;
          px(g, off, y, d, 1, 8);
          px(g, (off + 12) % 24, y, d, 1, 8);
          px(g, off + 1, y + 1, l, 10, 1);
          px(g, (off + 13) % 24, y + 1, l, 10, 1);
        });
        for (let i = 0; i < 6; i += 1) px(g, Math.floor(hash(i, seedX) * 23), Math.floor(hash(seedY, i) * 23), '#5E6370');
      } else {
        for (let r = 0; r < 4; r += 1) {
          const y = r * 6;
          px(g, 0, y, '#D9C3A6', T, 1);
          const off = (r + seedX) % 2 ? 0 : 6;
          for (let x = off; x < T; x += 12) px(g, x, y, '#D9C3A6', 1, 6);
          for (let x = 0; x < T; x += 1) if (hash(x, y + r, seedY) < 0.12) px(g, x, y + 2 + (x % 3), d);
        }
      }
      if (openTop) {
        const [td, tm, tl] = th.top;
        if (worldIdx === 0) {
          px(g, 0, 0, tm, T, 5);
          px(g, 0, 0, tl, T, 1);
          px(g, 0, 5, td, T, 1);
          for (let x = 0; x < T; x += 2) if (hash(x, seedX) < 0.5) px(g, x, 6, td, 1, 1 + Math.floor(hash(seedY, x) * 2));
          for (let x = 1; x < T; x += 5) px(g, x, 0, tl, 1, 1);
        } else {
          px(g, 0, 0, tl, T, 2);
          px(g, 0, 2, tm, T, 1);
        }
      }
      if (openLeft) px(g, 0, 0, th.line, 1, T);
      if (openRight) px(g, T - 1, 0, th.line, 1, T);
      if (openTop) px(g, 0, 0, th.line, T, 1);
    });
  }

  function dirtTile(seed) {
    return mk(`dirt${seed % 3}`, T, T, (g) => {
      px(g, 0, 0, '#9A6A3A', T, T);
      for (let i = 0; i < 40; i += 1) {
        const x = Math.floor(hash(i, seed, 3) * 23);
        const y = Math.floor(hash(seed, i, 5) * 23);
        px(g, x, y, hash(x, y, 9) < 0.5 ? '#7A4F28' : '#B88650', 1 + (i % 2), 1);
      }
      px(g, 4, 6, '#C9A57A', 2, 2);
      px(g, 15, 15, '#C9A57A', 2, 1);
      px(g, 9, 18, '#5E3A1B', 3, 2);
      // korzonki
      px(g, 18, 3, '#E0C7A0', 1, 4);
      px(g, 19, 6, '#E0C7A0', 2, 1);
      px(g, 0, 0, '#5E3A1B', T, 1);
      px(g, 0, T - 1, '#5E3A1B', T, 1);
      px(g, 0, 0, '#5E3A1B', 1, T);
      px(g, T - 1, 0, '#5E3A1B', 1, T);
    });
  }

  function holeTile(th, worldIdx) {
    return mk(`hole${worldIdx}`, T, T, (g) => {
      g.drawImage(wallTile(th, false, false, false, 1, 1, worldIdx), 0, 0);
      g.fillStyle = '#120B08';
      for (let y = 8; y < T; y += 1) {
        const k = (y - 8) / 16;
        const half = Math.round(9 * Math.sqrt(Math.max(0, 1 - Math.pow(1 - k, 2) * 0.9)));
        g.fillRect(12 - half, y, half * 2, 1);
      }
      px(g, 6, 9, '#3A2414', 12, 1);
      px(g, 4, 12, '#3A2414', 1, 12);
      px(g, 19, 12, '#3A2414', 1, 12);
    });
  }

  function crateTile() {
    return mk('crate', T, T, (g) => {
      px(g, 1, 1, '#5A3A1C', 22, 22);
      px(g, 2, 2, '#C08A4A', 20, 20);
      px(g, 2, 2, '#D9A666', 20, 2);
      px(g, 2, 20, '#8A5A2C', 20, 2);
      px(g, 2, 2, '#8A5A2C', 2, 20);
      px(g, 20, 2, '#8A5A2C', 2, 20);
      for (let i = 0; i < 16; i += 1) { px(g, 4 + i, 4 + i, '#7A4C22', 2, 1); px(g, 18 - i, 4 + i, '#7A4C22', 2, 1); }
      [[3, 3], [19, 3], [3, 19], [19, 19]].forEach(([x, y]) => px(g, x, y, '#3A2A1A', 2, 2));
    });
  }

  const PLATE_COL = { x: ['#FFD54A', '#B88A10'], y: ['#6FC3FF', '#1F6FB0'], z: ['#FF8FC8', '#B0407A'], l: ['#9BE07A', '#3C8A2A'], m: ['#FFA45A', '#B05A1A'] };

  function plateTile(letter, down) {
    return mk(`plate${letter}${down}`, T, T, (g) => {
      const [c, d] = PLATE_COL[letter];
      const h = down ? 2 : 4;
      px(g, 2, T - h - 1, '#3A3A44', 20, h + 1);
      px(g, 3, T - h, d, 18, h);
      px(g, 3, T - h, c, 18, 1);
      if (down) px(g, 6, T - 3, '#FFFFFF', 12, 1);
    });
  }

  function doorTile(letter, inverse) {
    const col = PLATE_COL[letter.toLowerCase()] || PLATE_COL.l;
    return mk(`door${letter}${inverse}`, T, T, (g) => {
      px(g, 0, 0, '#2A2A34', T, T);
      for (let x = 2; x < T; x += 5) {
        px(g, x, 0, '#7A7F8E', 3, T);
        px(g, x, 0, '#A7ADBD', 1, T);
      }
      px(g, 0, 4, col[1], T, 3);
      px(g, 0, 4, col[0], T, 1);
      px(g, 0, 16, col[1], T, 3);
      px(g, 0, 16, col[0], T, 1);
      if (inverse) { px(g, 9, 9, '#FFFFFF', 6, 2); }
      else { px(g, 9, 9, '#FFFFFF', 6, 2); px(g, 11, 7, '#FFFFFF', 2, 6); }
    });
  }

  function leverTile(on) {
    return mk(`lever${on}`, T, T, (g) => {
      px(g, 6, 19, '#3A3A44', 12, 5);
      px(g, 7, 20, '#6A6E7C', 10, 3);
      g.strokeStyle = '#C9CCD6';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(12, 20);
      g.lineTo(on ? 19 : 5, 9);
      g.stroke();
      px(g, on ? 17 : 3, 6, on ? '#9BE07A' : '#FF6A6A', 5, 5);
    });
  }

  function carrotSprite(frame) {
    return mk(`carrot${frame}`, T, T, (g) => {
      const c1 = '#FFD54A';
      const c2 = '#E8A41A';
      for (let i = 0; i < 12; i += 1) {
        const w = Math.max(1, Math.round(5 - i * 0.38));
        px(g, 12 - Math.floor(w / 2), 6 + i, i % 3 === 1 ? c2 : c1, w, 1);
      }
      px(g, 10, 9, '#FFF6C2', 1, 3);
      px(g, 10, 2, '#5DBB4A', 2, 4);
      px(g, 12, 1, '#3E8E3A', 2, 5);
      px(g, 14, 3, '#5DBB4A', 2, 3);
      if (frame) { px(g, 4, 4, '#FFFFFF'); px(g, 19, 10, '#FFFFFF'); px(g, 6, 16, '#FFF6C2'); }
    });
  }

  function exitTile(worldIdx, part) {
    return mk(`exit${worldIdx}${part}`, T, T, (g) => {
      // drewniane drzwiczki do norki – część lewa/prawa/samodzielna
      px(g, 0, 4, '#2A1608', T, 20);
      const frame = '#7A4C22';
      if (part !== 'R') px(g, 0, 4, frame, 3, 20);
      if (part !== 'L') px(g, T - 3, 4, frame, 3, 20);
      px(g, 0, 4, frame, T, 3);
      px(g, 3, 8, '#5DBB4A', T - (part === 'S' ? 6 : 3), 15);
      for (let y = 9; y < 23; y += 3) px(g, 3, y, '#4A9A3C', T - 6, 1);
      if (part === 'L' || part === 'S') px(g, 18, 15, '#FFD54A', 2, 2);
      px(g, 0, 23, '#3A2414', T, 1);
    });
  }

  // sroka (procedural, 32×28)
  function magpie(frame) {
    return mk(`magpie${frame}`, 32, 28, (g) => {
      const B = '#14141E';
      const W = '#F4F4F8';
      const S = '#2F5E8E';
      const S2 = '#3E8A7A';
      const ell = (cx, cy, rx, ry, col) => {
        for (let y = -ry; y <= ry; y += 1) for (let x = -rx; x <= rx; x += 1) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) px(g, cx + x, cy + y, col);
      };
      // ogon
      for (let i = 0; i < 12; i += 1) px(g, 2 + i, 18 + Math.floor(i / 3) - (frame ? 1 : 0), i % 2 ? S2 : S, 2, 2);
      ell(16, 16, 7, 6, B);
      ell(17, 18, 5, 3, W);
      ell(23, 9, 4, 4, B);
      // skrzydło
      for (let i = 0; i < 8; i += 1) px(g, 11 + i, 12 + (frame ? -2 : 0) + Math.floor(i / 3), i < 4 ? W : S, 2, 2);
      px(g, 24, 8, '#FFFFFF', 2, 2);
      px(g, 25, 8, '#000000', 1, 1);
      px(g, 27, 10, '#3A3A3A', 4, 1);
      px(g, 27, 11, '#2A2A2A', 3, 1);
      px(g, 16, 22, '#3A3A3A', 1, 4);
      px(g, 19, 22, '#3A3A3A', 1, 4);
      // błyskotka w dziobie
      if (frame === 2) { px(g, 30, 10, '#FFD54A', 2, 2); }
    });
  }

  const Art = {
    T, THEMES, hash,
    imgs: {},
    load(cb) {
      const names = ['rabbit', 'cat'];
      let left = names.length;
      names.forEach((n) => {
        const im = new Image();
        im.onload = () => { Art.imgs[n] = im; left -= 1; if (!left) cb(); };
        im.onerror = () => { left -= 1; if (!left) cb(); };
        im.src = `assets/${n}.png`;
      });
    },
    wallTile, dirtTile, holeTile, crateTile, plateTile, doorTile, leverTile, carrotSprite, exitTile, magpie, px,
    // klatki z arkuszy: królik 34×36 (ox 5, oy 12), kot 34×30 (ox 5, oy 7)
    RABBIT: { w: 34, h: 36, ox: 5, oy: 12, frames: { idle: 0, blink: 1, run: 2, jump: 10, fall: 11, happy: 12 } },
    CAT: { w: 34, h: 30, ox: 5, oy: 7, frames: { walk0: 0, walk1: 1, air: 2, crouch: 3, sit: 4, yawn: 5, sleep0: 6, sleep1: 7 } }
  };
  window.Art = Art;
})();
