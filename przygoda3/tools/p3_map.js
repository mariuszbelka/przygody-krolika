//@@ buildMapArt
  function buildMapArt() {
    const W = 400;
    const H2 = 240;
    const floor = ['#2E5E34', '#376E3C', '#417C44', '#4E8A4C'].map(hexRgb);
    const meadow = ['#6EAE52', '#7CBE5C', '#8CCB66', '#A2D874'].map(hexRgb);
    const marsh = ['#2E5A5E', '#3A6E6E', '#4E8480', '#6E9E94'].map(hexRgb);
    const dusk = ['#2A2440', '#33294C', '#3E3058', '#4A3A64'].map(hexRgb);
    const sand = hexRgb('#D9C48A');
    const pts = mapPathPoints().map(([x, y]) => [x / 2, y / 2]);
    const nodes = MAP_NODES.map(([x, y]) => [x / 2, y / 2]);
    const pathDist = (x, y) => { let d = 1e9; for (let i = 0; i < pts.length; i += 2) { const dd = Math.hypot(x - pts[i][0], y - pts[i][1]); if (dd < d) d = dd; } return d; };
    const nodeDist = (x, y) => Math.min(...nodes.map(([nx, ny]) => Math.hypot(x - nx, y - ny)));
    const inMarsh = (x, y) => ((x - 350) / 78) ** 2 + ((y - 205) / 48) ** 2 < 1;
    const inDusk = (x, y) => ((x - 352) / 70) ** 2 + ((y - 62) / 64) ** 2 < 1;
    const distField = new Float32Array(W * H2);
    for (let y = 0; y < H2; y += 1) for (let x = 0; x < W; x += 1) distField[y * W + x] = Math.min(pathDist(x, y), nodeDist(x, y) - 6);
    const base = imageCanvas(W, H2, (set) => {
      for (let y = 0; y < H2; y += 1) {
        for (let x = 0; x < W; x += 1) {
          const n = noise2(x * 0.07, y * 0.07, 21) * 0.7 + noise2(x * 0.25, y * 0.25, 22) * 0.3 + (bayer(x, y) - 0.5) * 0.16;
          const ti = n < 0.36 ? 0 : n < 0.56 ? 1 : n < 0.76 ? 2 : 3;
          let rgb = floor[ti];
          const d = distField[y * W + x];
          if (d < 17) rgb = meadow[Math.min(3, ti + (d < 7 ? 1 : 0))];
          if (inDusk(x, y)) rgb = dusk[ti];
          if (inMarsh(x, y)) {
            const water = noise2(x * 0.12, y * 0.12, 5) > 0.55;
            rgb = water ? marsh[(x + y) % 7 === 0 ? 3 : 1] : marsh[ti > 1 ? 2 : 0];
          }
          if (d < 2.2 && d > -100) rgb = sand;
          set(x, y, rgb);
        }
      }
    });
    const g = base.getContext('2d');
    // ścieżka z kamyków
    pts.forEach(([x, y], i) => {
      if (i % 3 === 2) return;
      g.fillStyle = '#8A6A38';
      g.fillRect(Math.round(x) - 1, Math.round(y) + 1, 3, 1);
      g.fillStyle = '#F2E2AA';
      g.fillRect(Math.round(x) - 1, Math.round(y), 3, 1);
    });
    const decor = new PixelGrid(W, H2);
    const mats = [
      makeMat('#3E8A44', '#14301A', { tones: ['#1E4A26', '#2E6A34', '#4A9A4A', '#7AC468'] }),
      makeMat('#5A3A22', '#1E120A', { strength: 0.6 }),
      makeMat('#E9473F', '#4A0E0E'),
      makeMat('#F4ECD8', null, { flat: true }),
      makeMat('#4A3A6E', '#140E24', { tones: ['#1E1430', '#2E2248', '#4A3A6E', '#6A5A9A'] }),
      makeMat('#FFE65A', null, { flat: true }),
      makeMat('#7A9A8A', null, { strength: 0.5 }),
      makeMat('#C86AA8', null, { flat: true })
    ];
    const crown = (x, y, s, m = 0) => {
      decor.rect(x, y + 2 * s, 1, 3, 1, 1);
      decor.ellipse(x + 0.5, y, 5 * s, 4.4 * s, m);
    };
    // gęsty las poza polaną
    for (let y = 8; y < H2 + 6; y += 9) {
      for (let x = 4 + ((y / 9) % 2) * 5; x < W; x += 10) {
        const jx = x + Math.round((hash01(x * 3.1 + y) - 0.5) * 5);
        const jy = y + Math.round((hash01(y * 7.3 + x) - 0.5) * 5);
        if (jx < 0 || jx >= W || jy < 0 || jy >= H2) continue;
        if (distField[jy * W + jx] < 21) continue;
        if (inMarsh(jx, jy) && !(((jx - 350) / 78) ** 2 + ((jy - 205) / 48) ** 2 > 0.82)) continue;
        if (inDusk(jx, jy)) { if (((jx - 352) / 70) ** 2 + ((jy - 62) / 64) ** 2 > 0.55) crown(jx, jy, 0.8, 4); continue; }
        crown(jx, jy, 0.75 + hash01(jx + jy * 13) * 0.4);
      }
    }
    // grzybki przy ścieżce
    for (let i = 0; i < pts.length; i += 9) {
      const [px, py] = pts[i];
      const side = i % 18 ? 9 : -9;
      const mx = Math.round(px + side * 0.7);
      const my = Math.round(py + side);
      decor.rect(mx, my, 1, 2, 3, 2);
      decor.ellipse(mx + 0.5, my - 0.5, 2.2, 1.4, 2);
      decor.put(mx, my - 1, 3);
    }
    // krąg grzybów przy królu
    const [kx, ky] = nodes[4];
    for (let k = 0; k < 12; k += 1) {
      const a = k / 12 * Math.PI * 2;
      const mx = Math.round(kx + Math.cos(a) * 17);
      const my = Math.round(ky + Math.sin(a) * 11);
      decor.rect(mx, my, 1, 2, 3, 2);
      decor.ellipse(mx + 0.5, my - 0.5, 2, 1.3, k % 2 ? 2 : 7);
    }
    // trzciny na mokradłach
    for (let k = 0; k < 40; k += 1) {
      const rx = Math.round(290 + hash01(k * 5.1) * 120);
      const ry = Math.round(170 + hash01(k * 9.7) * 70);
      if (!inMarsh(rx, ry)) continue;
      decor.rect(rx, ry - 4, 1, 4, 6, 1);
      decor.rect(rx, ry - 5, 1, 2, 1, 1);
    }
    // Drzewo Licha
    decor.capsule(352, 118, 352, 52, 9, 6, 1);
    decor.capsule(352, 70, 330, 44, 3, 2, 1);
    decor.capsule(352, 66, 378, 40, 3, 2, 1);
    decor.ellipse(352, 40, 34, 22, 4);
    decor.ellipse(330, 52, 16, 12, 4);
    decor.ellipse(376, 50, 16, 12, 4);
    decor.ellipse(345, 74, 2, 1.4, 5);
    decor.ellipse(359, 74, 2, 1.4, 5);
    decor.rect(348, 86, 8, 7, -1);
    g.drawImage(decor.render(mats, false), 0, 0);
    // mgła nad mokradłami i poświata nad drzewem
    for (let y = 150; y < H2; y += 2) for (let x = 270; x < W; x += 2) {
      if (!inMarsh(x, y)) continue;
      const f = noise2(x * 0.05, y * 0.08, 9);
      if (f > 0.55 && (x + y) % 4 === 0) { g.fillStyle = 'rgba(230,240,240,0.35)'; g.fillRect(x, y, 2, 1); }
    }
    const glow = g.createRadialGradient(352, 44, 4, 352, 44, 60);
    glow.addColorStop(0, 'rgba(200,120,255,0.35)');
    glow.addColorStop(1, 'rgba(200,120,255,0)');
    g.fillStyle = glow;
    g.fillRect(290, 0, 110, 110);
    return base;
  }
//@@ mapPathPoints
  function mapPathPoints() {
    const pts = [];
    for (let i = 0; i < MAP_NODES.length - 1; i += 1) {
      const [x0, y0] = MAP_NODES[i];
      const [x1, y1] = MAP_NODES[i + 1];
      const cx = (x0 + x1) / 2 + (i % 2 ? 30 : -30);
      const cy = (y0 + y1) / 2 + (i % 2 ? -26 : 30);
      for (let t = 0; t <= 1; t += 0.02) {
        const a = (1 - t) * (1 - t);
        const b = 2 * (1 - t) * t;
        const c = t * t;
        pts.push([a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1, i]);
      }
    }
    return pts;
  }
