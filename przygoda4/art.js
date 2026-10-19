// Grafika Przygody 4: owoce z minkami, kafelki specjalne, przeszkody, Sroka i ogród babci Ludwiki.
// Wszystko rysowane wektorowo w Canvas 2D; gotowe sprite'y są buforowane per rozmiar.
(function () {
  'use strict';

  const PAL = [
    { name: 'truskawka', base: '#F2414E', dark: '#A3172A', light: '#FF8A8F', glow: '255,90,100' },
    { name: 'jabłko', base: '#7BCB3A', dark: '#3E7F16', light: '#C6F08A', glow: '140,220,80' },
    { name: 'śliwka', base: '#8E4BD6', dark: '#4C1F86', light: '#C6A2F2', glow: '170,110,240' },
    { name: 'cytryna', base: '#FFD43B', dark: '#C08A0A', light: '#FFF2A6', glow: '255,220,80' },
    { name: 'borówka', base: '#3F7FE0', dark: '#1D3F8E', light: '#9CC3FF', glow: '90,150,255' },
    { name: 'morela', base: '#FF9A3C', dark: '#B9561A', light: '#FFD0A0', glow: '255,160,70' }
  ];

  const cache = new Map();
  let DPR = 1;
  function setDpr(d) { if (d !== DPR) { DPR = d; cache.clear(); } }

  function sprite(key, s, paint, pad = 0.2) {
    const k = `${key}|${Math.round(s)}|${DPR}`;
    let c = cache.get(k);
    if (c) return c;
    const size = Math.ceil(s * (1 + pad * 2));
    c = document.createElement('canvas');
    c.width = Math.ceil(size * DPR);
    c.height = Math.ceil(size * DPR);
    const g = c.getContext('2d');
    g.scale(DPR, DPR);
    g.translate(size / 2, size / 2);
    paint(g, s);
    c.logical = size;
    cache.set(k, c);
    return c;
  }
  function blit(ctx, c, x, y, scale = 1, alpha = 1, rot = 0, sy = null) {
    const w = c.logical * scale;
    const h = c.logical * (sy == null ? scale : sy);
    if (alpha <= 0 || w <= 0 || h <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.drawImage(c, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  // ---------------------------------------------------------------- pomocnicze
  function shade(g, r, base, dark, light, cx = 0, cy = 0) {
    const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r * 1.15);
    gr.addColorStop(0, light);
    gr.addColorStop(0.45, base);
    gr.addColorStop(1, dark);
    return gr;
  }
  function gloss(g, x, y, rx, ry, a = 0.55) {
    g.save();
    g.fillStyle = `rgba(255,255,255,${a})`;
    g.beginPath();
    g.ellipse(x, y, rx, ry, -0.5, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  function leaf(g, x, y, len, ang, col = '#4FAE3A', dark = '#2A6E1E') {
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    g.fillStyle = col;
    g.strokeStyle = dark;
    g.lineWidth = len * 0.08;
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(len * 0.5, -len * 0.45, len, 0);
    g.quadraticCurveTo(len * 0.5, len * 0.45, 0, 0);
    g.fill();
    g.stroke();
    g.restore();
  }
  function face(g, s, kind, y0 = 0.04, spread = 0.12) {
    const ex = s * spread, ey = s * y0, er = s * 0.055;
    g.save();
    g.lineCap = 'round';
    if (kind === 'blink' || kind === 'happy') {
      g.strokeStyle = '#2A1420';
      g.lineWidth = s * 0.035;
      for (const d of [-1, 1]) {
        g.beginPath();
        if (kind === 'happy') g.arc(d * ex, ey + er * 0.4, er, Math.PI * 1.1, Math.PI * 1.9);
        else { g.moveTo(d * ex - er, ey); g.lineTo(d * ex + er, ey); }
        g.stroke();
      }
    } else {
      for (const d of [-1, 1]) {
        g.fillStyle = '#2A1420';
        g.beginPath();
        g.ellipse(d * ex, ey, er * (kind === 'wow' ? 1.15 : 0.9), er * (kind === 'wow' ? 1.3 : 1.15), 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#FFFFFF';
        g.beginPath();
        g.arc(d * ex - er * 0.3, ey - er * 0.4, er * 0.38, 0, Math.PI * 2);
        g.fill();
      }
    }
    // policzki
    g.fillStyle = 'rgba(255,120,140,0.45)';
    for (const d of [-1, 1]) { g.beginPath(); g.ellipse(d * ex * 1.75, ey + s * 0.07, s * 0.05, s * 0.032, 0, 0, Math.PI * 2); g.fill(); }
    // buzia
    g.strokeStyle = '#2A1420';
    g.fillStyle = '#7A1E2E';
    g.lineWidth = s * 0.03;
    g.beginPath();
    if (kind === 'wow') { g.ellipse(0, ey + s * 0.1, s * 0.035, s * 0.045, 0, 0, Math.PI * 2); g.fill(); }
    else if (kind === 'happy') { g.arc(0, ey + s * 0.07, s * 0.06, 0.1, Math.PI - 0.1); g.closePath(); g.fill(); g.stroke(); }
    else { g.arc(0, ey + s * 0.07, s * 0.045, 0.2, Math.PI - 0.2); g.stroke(); }
    g.restore();
  }

  // ---------------------------------------------------------------- owoce
  const FRUIT = [
    // truskawka
    (g, s, f) => {
      const p = PAL[0];
      g.beginPath();
      g.moveTo(0, s * 0.42);
      g.bezierCurveTo(-s * 0.5, s * 0.12, -s * 0.44, -s * 0.36, 0, -s * 0.28);
      g.bezierCurveTo(s * 0.44, -s * 0.36, s * 0.5, s * 0.12, 0, s * 0.42);
      g.fillStyle = shade(g, s * 0.42, p.base, p.dark, p.light, 0, 0);
      g.fill();
      g.strokeStyle = p.dark; g.lineWidth = s * 0.03; g.stroke();
      g.fillStyle = '#FFE58A';
      for (const [x, y] of [[-0.22, -0.08], [0.22, -0.08], [-0.27, 0.12], [0.27, 0.12], [-0.12, 0.28], [0.12, 0.28], [0, 0.34], [-0.05, -0.16], [0.08, -0.17]]) {
        g.beginPath(); g.ellipse(x * s, y * s, s * 0.018, s * 0.028, 0, 0, Math.PI * 2); g.fill();
      }
      for (let k = 0; k < 5; k += 1) leaf(g, 0, -s * 0.3, s * 0.2, -Math.PI / 2 + (k - 2) * 0.62);
      g.fillStyle = '#3E8E2A'; g.fillRect(-s * 0.015, -s * 0.46, s * 0.03, s * 0.12);
      gloss(g, -s * 0.18, -s * 0.12, s * 0.07, s * 0.04);
      face(g, s, f, 0.02);
    },
    // jabłko
    (g, s, f) => {
      const p = PAL[1];
      g.beginPath();
      g.moveTo(0, -s * 0.28);
      g.bezierCurveTo(s * 0.18, -s * 0.42, s * 0.5, -s * 0.3, s * 0.42, s * 0.08);
      g.bezierCurveTo(s * 0.36, s * 0.4, s * 0.12, s * 0.44, 0, s * 0.36);
      g.bezierCurveTo(-s * 0.12, s * 0.44, -s * 0.36, s * 0.4, -s * 0.42, s * 0.08);
      g.bezierCurveTo(-s * 0.5, -s * 0.3, -s * 0.18, -s * 0.42, 0, -s * 0.28);
      g.fillStyle = shade(g, s * 0.44, p.base, p.dark, p.light, 0, s * 0.02);
      g.fill();
      g.strokeStyle = p.dark; g.lineWidth = s * 0.03; g.stroke();
      g.strokeStyle = '#6A4020'; g.lineWidth = s * 0.045; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, -s * 0.26); g.quadraticCurveTo(s * 0.02, -s * 0.4, s * 0.07, -s * 0.46); g.stroke();
      leaf(g, s * 0.05, -s * 0.38, s * 0.2, -0.5);
      gloss(g, -s * 0.22, -s * 0.12, s * 0.08, s * 0.05);
      face(g, s, f, 0.05);
    },
    // śliwka
    (g, s, f) => {
      const p = PAL[2];
      g.beginPath();
      g.ellipse(0, s * 0.03, s * 0.36, s * 0.41, 0.15, 0, Math.PI * 2);
      g.fillStyle = shade(g, s * 0.42, p.base, p.dark, p.light, 0, 0);
      g.fill();
      g.strokeStyle = p.dark; g.lineWidth = s * 0.03; g.stroke();
      g.strokeStyle = 'rgba(60,20,110,0.5)'; g.lineWidth = s * 0.025;
      g.beginPath(); g.moveTo(s * 0.04, -s * 0.36); g.quadraticCurveTo(s * 0.22, 0, s * 0.1, s * 0.4); g.stroke();
      g.fillStyle = 'rgba(230,220,255,0.25)';
      g.beginPath(); g.ellipse(-s * 0.1, -s * 0.05, s * 0.2, s * 0.26, 0.15, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#6A4020'; g.lineWidth = s * 0.04; g.lineCap = 'round';
      g.beginPath(); g.moveTo(s * 0.02, -s * 0.36); g.lineTo(-s * 0.04, -s * 0.48); g.stroke();
      leaf(g, -s * 0.03, -s * 0.44, s * 0.17, -2.5);
      gloss(g, -s * 0.16, -s * 0.16, s * 0.07, s * 0.045);
      face(g, s, f, 0.05);
    },
    // cytryna
    (g, s, f) => {
      const p = PAL[3];
      g.beginPath();
      g.ellipse(0, 0, s * 0.42, s * 0.32, 0, 0, Math.PI * 2);
      g.fillStyle = shade(g, s * 0.42, p.base, p.dark, p.light, 0, 0);
      g.fill();
      g.beginPath(); g.ellipse(-s * 0.43, 0, s * 0.06, s * 0.05, 0, 0, Math.PI * 2); g.ellipse(s * 0.43, 0, s * 0.06, s * 0.05, 0, 0, Math.PI * 2);
      g.fillStyle = p.base; g.fill();
      g.beginPath(); g.ellipse(0, 0, s * 0.42, s * 0.32, 0, 0, Math.PI * 2);
      g.strokeStyle = p.dark; g.lineWidth = s * 0.03; g.stroke();
      g.fillStyle = 'rgba(200,140,10,0.35)';
      for (let k = 0; k < 14; k += 1) { const a = k * 2.4; g.beginPath(); g.arc(Math.cos(a) * s * 0.25, Math.sin(a) * s * 0.17, s * 0.012, 0, Math.PI * 2); g.fill(); }
      leaf(g, s * 0.08, -s * 0.3, s * 0.2, -0.7);
      gloss(g, -s * 0.2, -s * 0.12, s * 0.09, s * 0.045);
      face(g, s, f, 0.02);
    },
    // borówka
    (g, s, f) => {
      const p = PAL[4];
      g.beginPath();
      g.arc(0, s * 0.03, s * 0.38, 0, Math.PI * 2);
      g.fillStyle = shade(g, s * 0.4, p.base, p.dark, p.light, 0, 0);
      g.fill();
      g.strokeStyle = p.dark; g.lineWidth = s * 0.03; g.stroke();
      g.fillStyle = 'rgba(220,235,255,0.25)';
      g.beginPath(); g.arc(-s * 0.08, -s * 0.02, s * 0.25, 0, Math.PI * 2); g.fill();
      // korona
      g.save();
      g.translate(0, -s * 0.31);
      g.fillStyle = p.dark;
      g.beginPath();
      for (let k = 0; k < 10; k += 1) { const a = -Math.PI / 2 + k * Math.PI / 5; const r = k % 2 ? s * 0.04 : s * 0.1; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.6); }
      g.closePath(); g.fill();
      g.restore();
      gloss(g, -s * 0.18, -s * 0.12, s * 0.07, s * 0.045);
      face(g, s, f, 0.07);
    },
    // morela
    (g, s, f) => {
      const p = PAL[5];
      g.beginPath();
      g.arc(0, s * 0.03, s * 0.39, 0, Math.PI * 2);
      g.fillStyle = shade(g, s * 0.42, p.base, p.dark, p.light, 0, 0);
      g.fill();
      g.strokeStyle = p.dark; g.lineWidth = s * 0.03; g.stroke();
      g.fillStyle = 'rgba(255,90,60,0.28)';
      g.beginPath(); g.arc(s * 0.12, s * 0.1, s * 0.22, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(150,60,10,0.45)'; g.lineWidth = s * 0.025;
      g.beginPath(); g.moveTo(-s * 0.02, -s * 0.36); g.quadraticCurveTo(-s * 0.22, 0, -s * 0.06, s * 0.41); g.stroke();
      leaf(g, s * 0.02, -s * 0.36, s * 0.2, -0.9);
      gloss(g, -s * 0.18, -s * 0.14, s * 0.075, s * 0.045);
      face(g, s, f, 0.06);
    }
  ];

  function fruitSprite(col, s, f = 'normal') {
    return sprite(`f${col}${f}`, s, (g) => FRUIT[col](g, s, f));
  }

  // ---------------------------------------------------------------- kafelki specjalne
  function disc(g, s, col) {
    const p = PAL[col] || PAL[0];
    const gr = g.createRadialGradient(0, 0, s * 0.05, 0, 0, s * 0.48);
    gr.addColorStop(0, p.light);
    gr.addColorStop(0.7, p.base);
    gr.addColorStop(1, p.dark);
    g.fillStyle = gr;
    g.beginPath(); g.arc(0, 0, s * 0.44, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#FFFFFF'; g.lineWidth = s * 0.04; g.stroke();
  }
  function carrot(g, s) {
    g.save();
    g.rotate(-Math.PI / 4);
    g.beginPath();
    g.moveTo(0, -s * 0.32);
    g.quadraticCurveTo(s * 0.13, -s * 0.28, s * 0.11, -s * 0.12);
    g.lineTo(0, s * 0.3);
    g.lineTo(-s * 0.11, -s * 0.12);
    g.quadraticCurveTo(-s * 0.13, -s * 0.28, 0, -s * 0.32);
    const gr = g.createLinearGradient(-s * 0.12, 0, s * 0.12, 0);
    gr.addColorStop(0, '#FFB24A'); gr.addColorStop(1, '#E2620E');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = '#9A3E06'; g.lineWidth = s * 0.025; g.stroke();
    g.strokeStyle = 'rgba(150,60,10,0.6)'; g.lineWidth = s * 0.02;
    for (const y of [-0.15, -0.03, 0.09]) { g.beginPath(); g.moveTo(-s * 0.07, y * s); g.lineTo(s * 0.02, y * s + s * 0.02); g.stroke(); }
    leaf(g, 0, -s * 0.31, s * 0.15, -Math.PI / 2 - 0.4, '#5BC23E');
    leaf(g, 0, -s * 0.31, s * 0.17, -Math.PI / 2 + 0.3, '#5BC23E');
    g.restore();
  }
  function arrows(g, s, dir) {
    g.save();
    if (dir === 'rv') g.rotate(Math.PI / 2);
    g.fillStyle = '#FFFFFF';
    g.strokeStyle = 'rgba(0,0,0,0.35)';
    g.lineWidth = s * 0.02;
    for (const d of [-1, 1]) {
      g.beginPath();
      g.moveTo(d * s * 0.47, 0);
      g.lineTo(d * s * 0.35, -s * 0.09);
      g.lineTo(d * s * 0.35, s * 0.09);
      g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
  }
  function pumpkin(g, s) {
    g.fillStyle = '#E8761E';
    g.strokeStyle = '#8A3A08';
    g.lineWidth = s * 0.025;
    for (const [x, rx] of [[-0.14, 0.17], [0.14, 0.17], [0, 0.19]]) {
      g.beginPath(); g.ellipse(x * s, s * 0.06, rx * s, s * 0.24, 0, 0, Math.PI * 2);
      const gr = g.createRadialGradient(x * s - s * 0.05, -s * 0.02, s * 0.02, x * s, s * 0.06, s * 0.25);
      gr.addColorStop(0, '#FFB060'); gr.addColorStop(1, '#D25E10');
      g.fillStyle = gr; g.fill(); g.stroke();
    }
    g.fillStyle = '#4E7A22'; g.fillRect(-s * 0.03, -s * 0.24, s * 0.06, s * 0.08);
    // lont
    g.strokeStyle = '#5A3A1A'; g.lineWidth = s * 0.03; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, -s * 0.22); g.quadraticCurveTo(s * 0.1, -s * 0.36, s * 0.2, -s * 0.33); g.stroke();
    // buzia dyni
    g.fillStyle = '#5A2006';
    g.beginPath(); g.moveTo(-s * 0.12, -s * 0.02); g.lineTo(-s * 0.05, -s * 0.02); g.lineTo(-s * 0.085, -s * 0.08); g.fill();
    g.beginPath(); g.moveTo(s * 0.12, -s * 0.02); g.lineTo(s * 0.05, -s * 0.02); g.lineTo(s * 0.085, -s * 0.08); g.fill();
    g.beginPath(); g.moveTo(-s * 0.12, s * 0.1); g.quadraticCurveTo(0, s * 0.22, s * 0.12, s * 0.1); g.quadraticCurveTo(0, s * 0.15, -s * 0.12, s * 0.1); g.fill();
  }
  function butterfly(g, s, col, flap = 1) {
    const p = PAL[col] || PAL[0];
    for (const d of [-1, 1]) {
      g.save();
      g.scale(d * flap, 1);
      g.fillStyle = p.base;
      g.strokeStyle = p.dark;
      g.lineWidth = s * 0.025;
      g.beginPath(); g.ellipse(s * 0.17, -s * 0.1, s * 0.17, s * 0.14, -0.5, 0, Math.PI * 2); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(s * 0.14, s * 0.12, s * 0.12, s * 0.1, 0.5, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#FFFFFF';
      g.beginPath(); g.arc(s * 0.2, -s * 0.12, s * 0.045, 0, Math.PI * 2); g.fill();
      g.fillStyle = p.light;
      g.beginPath(); g.arc(s * 0.15, s * 0.12, s * 0.035, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    g.fillStyle = '#3A2A3A';
    g.beginPath(); g.ellipse(0, 0, s * 0.045, s * 0.17, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#3A2A3A'; g.lineWidth = s * 0.02;
    g.beginPath(); g.moveTo(0, -s * 0.15); g.quadraticCurveTo(-s * 0.05, -s * 0.25, -s * 0.1, -s * 0.26); g.moveTo(0, -s * 0.15); g.quadraticCurveTo(s * 0.05, -s * 0.25, s * 0.1, -s * 0.26); g.stroke();
  }
  function yarn(g, s) {
    const cols = ['#F2414E', '#FF9A3C', '#FFD43B', '#7BCB3A', '#3F7FE0', '#8E4BD6'];
    g.beginPath(); g.arc(0, 0, s * 0.38, 0, Math.PI * 2);
    const gr = g.createRadialGradient(-s * 0.1, -s * 0.12, s * 0.05, 0, 0, s * 0.4);
    gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, '#F4D0E8');
    g.fillStyle = gr; g.fill();
    g.save();
    g.clip();
    g.lineWidth = s * 0.07;
    for (let k = 0; k < 6; k += 1) {
      g.strokeStyle = cols[k];
      g.beginPath();
      g.ellipse(0, 0, s * 0.42, s * (0.1 + k * 0.06), k * 0.55, 0, Math.PI * 2);
      g.stroke();
    }
    g.restore();
    g.strokeStyle = '#7A3A6A'; g.lineWidth = s * 0.03;
    g.beginPath(); g.arc(0, 0, s * 0.38, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = '#F2414E'; g.lineWidth = s * 0.04; g.lineCap = 'round';
    g.beginPath(); g.moveTo(s * 0.3, s * 0.24); g.quadraticCurveTo(s * 0.46, s * 0.4, s * 0.36, s * 0.48); g.stroke();
    gloss(g, -s * 0.15, -s * 0.17, s * 0.08, s * 0.05, 0.7);
  }
  function jar(g, s) {
    g.fillStyle = 'rgba(220,240,255,0.55)';
    g.strokeStyle = '#5A6A80';
    g.lineWidth = s * 0.03;
    roundRect(g, -s * 0.28, -s * 0.24, s * 0.56, s * 0.62, s * 0.1);
    g.fill(); g.stroke();
    g.fillStyle = '#C2183A';
    roundRect(g, -s * 0.24, -s * 0.1, s * 0.48, s * 0.44, s * 0.08);
    g.fill();
    g.fillStyle = 'rgba(255,120,150,0.5)';
    g.fillRect(-s * 0.2, -s * 0.08, s * 0.08, s * 0.36);
    // ściereczka w kratkę
    g.fillStyle = '#F4F4F4';
    roundRect(g, -s * 0.34, -s * 0.38, s * 0.68, s * 0.18, s * 0.05); g.fill();
    g.fillStyle = '#E8475A';
    for (let x = -3; x <= 3; x += 2) g.fillRect(x * s * 0.09, -s * 0.38, s * 0.09, s * 0.18);
    g.fillStyle = 'rgba(232,71,90,0.45)';
    g.fillRect(-s * 0.34, -s * 0.33, s * 0.68, s * 0.06);
    g.strokeStyle = '#B83A4A'; g.lineWidth = s * 0.025;
    roundRect(g, -s * 0.34, -s * 0.38, s * 0.68, s * 0.18, s * 0.05); g.stroke();
    // etykieta z serduszkiem
    g.fillStyle = '#FFF4D8';
    roundRect(g, -s * 0.15, s * 0.04, s * 0.3, s * 0.18, s * 0.04); g.fill();
    g.fillStyle = '#E8475A';
    g.beginPath(); g.moveTo(0, s * 0.18); g.bezierCurveTo(-s * 0.1, s * 0.11, -s * 0.05, s * 0.05, 0, s * 0.1); g.bezierCurveTo(s * 0.05, s * 0.05, s * 0.1, s * 0.11, 0, s * 0.18); g.fill();
    gloss(g, s * 0.16, -s * 0.05, s * 0.03, s * 0.12, 0.6);
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function specialSprite(sp, col, s) {
    return sprite(`sp${sp}${col}`, s, (g) => {
      if (sp === 'yarn') { yarn(g, s); return; }
      disc(g, s, col);
      if (sp === 'rh' || sp === 'rv') { arrows(g, s, sp); carrot(g, s * 0.95); }
      else if (sp === 'bomb') pumpkin(g, s * 1.05);
      else if (sp === 'fly') butterfly(g, s, col, 1);
    });
  }
  function jarSprite(s) { return sprite('jar', s, (g) => jar(g, s)); }

  // ---------------------------------------------------------------- przeszkody i pola
  function crateSprite(s, hp) {
    return sprite(`crate${hp}`, s, (g) => {
      const w = s * 0.9;
      const strong = hp >= 2;
      g.fillStyle = strong ? '#8A5A30' : '#C88A4A';
      g.strokeStyle = strong ? '#3E2410' : '#6A4020';
      g.lineWidth = s * 0.04;
      roundRect(g, -w / 2, -w / 2, w, w, s * 0.08);
      g.fill(); g.stroke();
      g.strokeStyle = strong ? '#5A3818' : '#9A6230';
      g.lineWidth = s * 0.03;
      for (const y of [-0.15, 0.15]) { g.beginPath(); g.moveTo(-w / 2 + s * 0.04, y * s); g.lineTo(w / 2 - s * 0.04, y * s); g.stroke(); }
      g.strokeStyle = strong ? '#4A2E14' : '#8A5428';
      g.lineWidth = s * 0.07;
      g.beginPath(); g.moveTo(-w / 2 + s * 0.08, -w / 2 + s * 0.08); g.lineTo(w / 2 - s * 0.08, w / 2 - s * 0.08); g.stroke();
      if (strong) {
        g.fillStyle = '#B8C0C8';
        for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc(x * w * 0.36, y * w * 0.36, s * 0.06, 0, Math.PI * 2); g.fill(); }
      }
      gloss(g, -w * 0.28, -w * 0.3, s * 0.12, s * 0.03, 0.25);
    }, 0.1);
  }
  function webSprite(s) {
    return sprite('web', s, (g) => {
      g.strokeStyle = 'rgba(255,255,255,0.9)';
      g.lineWidth = s * 0.025;
      const R = s * 0.48;
      for (let k = 0; k < 8; k += 1) { const a = k * Math.PI / 4 + 0.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R, Math.sin(a) * R); g.stroke(); }
      for (const rr of [0.16, 0.3, 0.44]) {
        g.beginPath();
        for (let k = 0; k <= 8; k += 1) { const a = k * Math.PI / 4 + 0.2; const x = Math.cos(a) * rr * s, y = Math.sin(a) * rr * s; if (k) g.quadraticCurveTo(Math.cos(a - Math.PI / 8) * rr * s * 0.85, Math.sin(a - Math.PI / 8) * rr * s * 0.85, x, y); else g.moveTo(x, y); }
        g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill();
    }, 0.1);
  }
  function blingSprite(s) {
    return sprite('bling', s, (g) => {
      g.fillStyle = 'rgba(255,230,120,0.28)';
      g.beginPath(); g.arc(0, 0, s * 0.46, 0, Math.PI * 2); g.fill();
      const gem = (x, y, r, c) => {
        g.fillStyle = c; g.strokeStyle = '#FFFFFF'; g.lineWidth = s * 0.02;
        g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.8, y); g.lineTo(x, y + r); g.lineTo(x - r * 0.8, y); g.closePath(); g.fill(); g.stroke();
      };
      gem(-s * 0.26, -s * 0.24, s * 0.1, '#5AD8FF');
      gem(s * 0.28, -s * 0.2, s * 0.08, '#FF6AD0');
      gem(s * 0.24, s * 0.26, s * 0.1, '#FFE24A');
      gem(-s * 0.24, s * 0.26, s * 0.07, '#9AF07A');
      g.strokeStyle = 'rgba(255,215,90,0.95)'; g.lineWidth = s * 0.05;
      g.beginPath(); g.arc(0, 0, s * 0.43, 0, Math.PI * 2); g.stroke();
    }, 0.1);
  }
  function weedSprite(s) {
    return sprite('weed', s, (g) => {
      const w = s * 0.94;
      g.fillStyle = '#6A4A2A';
      roundRect(g, -w / 2, -w / 2, w, w, s * 0.14); g.fill();
      g.fillStyle = 'rgba(40,24,10,0.35)';
      for (let k = 0; k < 7; k += 1) { g.beginPath(); g.arc(Math.cos(k * 2.1) * s * 0.3, Math.sin(k * 3.3) * s * 0.3, s * 0.04, 0, Math.PI * 2); g.fill(); }
      for (const [x, y, a] of [[-0.4, -0.4, 0.8], [0.4, -0.4, 2.3], [-0.4, 0.4, -0.8], [0.4, 0.4, -2.3], [0, -0.46, 1.57], [0, 0.46, -1.57]]) {
        leaf(g, x * s, y * s, s * 0.2, a + 0.3, '#5AA83A', '#2E6A1E');
        leaf(g, x * s, y * s, s * 0.17, a - 0.3, '#6ABE48', '#2E6A1E');
      }
    }, 0.1);
  }

  // ---------------------------------------------------------------- Sroka (2×2)
  function drawMagpie(g, x, y, s, t, hurt, act) {
    // s = szerokość 2 pól
    g.save();
    g.translate(x, y + Math.sin(t * 3) * s * 0.02);
    if (hurt > 0) g.translate(Math.sin(t * 60) * s * 0.03 * hurt, 0);
    const k = s / 2;
    // ogon
    g.fillStyle = '#2C5E9A';
    g.beginPath(); g.moveTo(-k * 0.3, k * 0.3); g.lineTo(-k * 1.0, k * 0.85); g.lineTo(-k * 0.82, k * 0.98); g.lineTo(-k * 0.1, k * 0.5); g.closePath(); g.fill();
    g.fillStyle = '#3E9A8A';
    g.beginPath(); g.moveTo(-k * 0.3, k * 0.4); g.lineTo(-k * 0.92, k * 0.98); g.lineTo(-k * 0.75, k * 1.02); g.lineTo(-k * 0.15, k * 0.55); g.closePath(); g.fill();
    // ciało
    g.fillStyle = '#16161F';
    g.beginPath(); g.ellipse(0, k * 0.2, k * 0.62, k * 0.55, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#F6F6FA';
    g.beginPath(); g.ellipse(k * 0.12, k * 0.36, k * 0.38, k * 0.32, 0, 0, Math.PI * 2); g.fill();
    // skrzydło
    const flap = act > 0 ? Math.sin(t * 30) * 0.5 : 0;
    g.save();
    g.translate(-k * 0.15, k * 0.05);
    g.rotate(-0.3 - flap);
    g.fillStyle = '#16161F';
    g.beginPath(); g.ellipse(0, 0, k * 0.5, k * 0.24, 0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#F6F6FA';
    g.beginPath(); g.ellipse(-k * 0.02, -k * 0.02, k * 0.26, k * 0.1, 0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2C5E9A';
    g.beginPath(); g.ellipse(-k * 0.28, k * 0.08, k * 0.22, k * 0.09, 0.4, 0, Math.PI * 2); g.fill();
    g.restore();
    // głowa
    g.fillStyle = '#16161F';
    g.beginPath(); g.arc(k * 0.42, -k * 0.38, k * 0.36, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#FFFFFF';
    g.beginPath(); g.arc(k * 0.54, -k * 0.46, k * 0.12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#16161F';
    g.beginPath(); g.arc(k * 0.57, -k * 0.45, k * (hurt > 0 ? 0.03 : 0.06), 0, Math.PI * 2); g.fill();
    g.fillStyle = '#FFFFFF';
    g.beginPath(); g.arc(k * 0.55, -k * 0.48, k * 0.025, 0, Math.PI * 2); g.fill();
    // brew – złośliwa mina
    g.strokeStyle = '#16161F'; g.lineWidth = k * 0.06; g.lineCap = 'round';
    g.beginPath(); g.moveTo(k * 0.42, -k * 0.62); g.lineTo(k * 0.66, -k * 0.56); g.stroke();
    // dziób z błyskotką
    g.fillStyle = '#3A3A44';
    g.beginPath(); g.moveTo(k * 0.7, -k * 0.4); g.lineTo(k * 1.02, -k * 0.32); g.lineTo(k * 0.7, -k * 0.26); g.closePath(); g.fill();
    g.fillStyle = '#FFE24A'; g.strokeStyle = '#FFFFFF'; g.lineWidth = k * 0.02;
    g.beginPath(); g.moveTo(k * 1.0, -k * 0.4); g.lineTo(k * 1.07, -k * 0.32); g.lineTo(k * 1.0, -k * 0.24); g.lineTo(k * 0.93, -k * 0.32); g.closePath(); g.fill(); g.stroke();
    // nogi
    g.strokeStyle = '#3A3A44'; g.lineWidth = k * 0.06;
    g.beginPath(); g.moveTo(-k * 0.1, k * 0.7); g.lineTo(-k * 0.12, k * 0.92); g.moveTo(k * 0.15, k * 0.7); g.lineTo(k * 0.17, k * 0.92); g.stroke();
    g.restore();
  }

  // ---------------------------------------------------------------- ogród (mapa)
  // nagrody: kolejne elementy ogrodu, pozycje w ułamkach sceny
  const GARDEN_ITEMS = [
    { kind: 'beds', x: 0.18, y: 0.72 }, { kind: 'fence', x: 0.5, y: 0.93 }, { kind: 'appletree', x: 0.12, y: 0.42 },
    { kind: 'bench', x: 0.42, y: 0.58 }, { kind: 'cathouse', x: 0.84, y: 0.7 }, { kind: 'flowers', x: 0.62, y: 0.8 },
    { kind: 'path', x: 0.5, y: 0.7 }, { kind: 'well', x: 0.3, y: 0.86 }, { kind: 'swing', x: 0.78, y: 0.45 },
    { kind: 'hive', x: 0.92, y: 0.52 }, { kind: 'bushes', x: 0.06, y: 0.84 }, { kind: 'plumtree', x: 0.62, y: 0.38 },
    { kind: 'table', x: 0.36, y: 0.47 }, { kind: 'gazebo', x: 0.88, y: 0.3 }, { kind: 'pond', x: 0.64, y: 0.6 }, { kind: 'garland', x: 0.5, y: 0.2 }
  ];

  function drawGardenBase(g, W, H, t) {
    const sky = g.createLinearGradient(0, 0, 0, H * 0.45);
    sky.addColorStop(0, '#8FD3F4'); sky.addColorStop(1, '#E6F7FF');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // słońce
    const sx = W * 0.85, sy = H * 0.1;
    const sg = g.createRadialGradient(sx, sy, 4, sx, sy, H * 0.16);
    sg.addColorStop(0, 'rgba(255,245,180,1)'); sg.addColorStop(0.25, 'rgba(255,230,120,0.9)'); sg.addColorStop(1, 'rgba(255,230,120,0)');
    g.fillStyle = sg; g.fillRect(sx - H * 0.2, sy - H * 0.2, H * 0.4, H * 0.4);
    // chmurki
    g.fillStyle = 'rgba(255,255,255,0.9)';
    for (let k = 0; k < 4; k += 1) {
      const cx = ((k * 0.31 + t * 0.006) % 1.3 - 0.15) * W, cy = H * (0.06 + (k % 2) * 0.07);
      for (const [dx, dy, r] of [[0, 0, 0.035], [0.03, -0.015, 0.04], [0.065, 0, 0.032]]) { g.beginPath(); g.arc(cx + dx * W, cy + dy * H, r * Math.max(W, H) * 0.6, 0, Math.PI * 2); g.fill(); }
    }
    // dom babci
    const hx = W * 0.3, hy = H * 0.3, hw = Math.min(W, H) * 0.26;
    g.fillStyle = '#F4E2C0'; g.fillRect(hx - hw / 2, hy - hw * 0.35, hw, hw * 0.55);
    g.fillStyle = '#C8503A';
    g.beginPath(); g.moveTo(hx - hw * 0.62, hy - hw * 0.33); g.lineTo(hx, hy - hw * 0.78); g.lineTo(hx + hw * 0.62, hy - hw * 0.33); g.closePath(); g.fill();
    g.fillStyle = '#8A4A2A'; g.fillRect(hx - hw * 0.08, hy - hw * 0.05, hw * 0.16, hw * 0.25);
    g.fillStyle = '#9AD8F4';
    for (const d of [-1, 1]) { g.fillRect(hx + d * hw * 0.28 - hw * 0.08, hy - hw * 0.22, hw * 0.16, hw * 0.13); }
    g.fillStyle = '#FFFFFF';
    for (const d of [-1, 1]) { g.fillRect(hx + d * hw * 0.28 - hw * 0.006, hy - hw * 0.22, hw * 0.012, hw * 0.13); }
    g.fillStyle = '#A04030'; g.fillRect(hx + hw * 0.22, hy - hw * 0.7, hw * 0.08, hw * 0.2);
    // trawa
    const grass = g.createLinearGradient(0, H * 0.32, 0, H);
    grass.addColorStop(0, '#9AD86A'); grass.addColorStop(1, '#5AAE3E');
    g.fillStyle = grass;
    g.beginPath(); g.moveTo(0, H * 0.36);
    for (let x = 0; x <= W; x += W / 8) g.lineTo(x, H * 0.34 + Math.sin(x / W * 6) * H * 0.015);
    g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)';
    for (let k = 0; k < 40; k += 1) { const x = ((k * 97) % 100) / 100 * W, y = H * 0.4 + ((k * 61) % 60) / 100 * H; g.fillRect(x, y, 2, 6); }
  }

  function tree(g, x, y, s, fruitCol) {
    g.fillStyle = '#7A5230'; g.fillRect(x - s * 0.06, y - s * 0.3, s * 0.12, s * 0.4);
    g.fillStyle = '#4E9A3A';
    for (const [dx, dy, r] of [[0, -0.55, 0.32], [-0.22, -0.4, 0.24], [0.22, -0.4, 0.24]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(x - s * 0.1, y - s * 0.66, s * 0.12, 0, Math.PI * 2); g.fill();
    g.fillStyle = fruitCol;
    for (const [dx, dy] of [[-0.2, -0.5], [0.1, -0.68], [0.24, -0.42], [-0.05, -0.4], [0.16, -0.56]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, s * 0.045, 0, Math.PI * 2); g.fill(); }
  }

  function drawGardenItem(g, kind, x, y, s, t) {
    g.save();
    g.lineCap = 'round';
    switch (kind) {
      case 'beds':
        for (let k = 0; k < 2; k += 1) {
          g.fillStyle = '#7A4E2A'; roundRect(g, x - s * 0.4, y - s * 0.1 + k * s * 0.22, s * 0.8, s * 0.16, s * 0.05); g.fill();
          for (let j = 0; j < 5; j += 1) { g.fillStyle = '#4E9A3A'; g.beginPath(); g.arc(x - s * 0.32 + j * s * 0.16, y - s * 0.06 + k * s * 0.22, s * 0.055, 0, Math.PI * 2); g.fill(); g.fillStyle = '#F2414E'; g.beginPath(); g.arc(x - s * 0.3 + j * s * 0.16, y - s * 0.02 + k * s * 0.22, s * 0.025, 0, Math.PI * 2); g.fill(); }
        }
        break;
      case 'fence':
        g.fillStyle = '#FFF6E6'; g.strokeStyle = '#B89A72'; g.lineWidth = s * 0.02;
        g.fillRect(x - s * 1.6, y - s * 0.16, s * 3.2, s * 0.05);
        for (let k = -8; k <= 8; k += 1) { roundRect(g, x + k * s * 0.19 - s * 0.05, y - s * 0.28, s * 0.1, s * 0.3, s * 0.04); g.fill(); g.stroke(); }
        break;
      case 'appletree': tree(g, x, y, s * 1.3, '#E8475A'); break;
      case 'plumtree': tree(g, x, y, s * 1.2, '#8E4BD6'); break;
      case 'bench':
        g.fillStyle = '#A0683A'; g.fillRect(x - s * 0.35, y - s * 0.12, s * 0.7, s * 0.07); g.fillRect(x - s * 0.35, y - s * 0.26, s * 0.7, s * 0.06);
        g.fillStyle = '#6A4020'; g.fillRect(x - s * 0.3, y - s * 0.05, s * 0.05, s * 0.14); g.fillRect(x + s * 0.25, y - s * 0.05, s * 0.05, s * 0.14);
        break;
      case 'cathouse':
        g.fillStyle = '#E8A060'; g.fillRect(x - s * 0.25, y - s * 0.25, s * 0.5, s * 0.32);
        g.fillStyle = '#B8503A'; g.beginPath(); g.moveTo(x - s * 0.32, y - s * 0.23); g.lineTo(x, y - s * 0.48); g.lineTo(x + s * 0.32, y - s * 0.23); g.fill();
        g.fillStyle = '#3A2A1A'; g.beginPath(); g.arc(x, y - s * 0.02, s * 0.11, Math.PI, 0); g.fillRect(x - s * 0.11, y - s * 0.02, s * 0.22, s * 0.09); g.fill();
        g.fillStyle = '#FFFFFF'; g.font = `700 ${s * 0.09}px Fredoka, sans-serif`; g.textAlign = 'center'; g.fillText('PERSI', x, y - s * 0.17);
        break;
      case 'flowers':
        for (let k = 0; k < 7; k += 1) {
          const fx = x + (k - 3) * s * 0.13, fy = y + Math.sin(k * 2) * s * 0.05;
          g.strokeStyle = '#3E8A2A'; g.lineWidth = s * 0.02; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy - s * 0.16); g.stroke();
          g.fillStyle = ['#FF6AA0', '#FFD43B', '#9A7AF0', '#FF8A3C'][k % 4];
          for (let p = 0; p < 5; p += 1) { const a = p * 1.256 + t; g.beginPath(); g.arc(fx + Math.cos(a) * s * 0.035, fy - s * 0.18 + Math.sin(a) * s * 0.035, s * 0.03, 0, Math.PI * 2); g.fill(); }
          g.fillStyle = '#FFF2A0'; g.beginPath(); g.arc(fx, fy - s * 0.18, s * 0.02, 0, Math.PI * 2); g.fill();
        }
        break;
      case 'path':
        g.fillStyle = 'rgba(230,200,150,0.9)';
        for (let k = 0; k < 6; k += 1) { g.beginPath(); g.ellipse(x + Math.sin(k) * s * 0.1, y - k * s * 0.13, s * 0.11, s * 0.05, 0, 0, Math.PI * 2); g.fill(); }
        break;
      case 'well':
        g.fillStyle = '#9A9AA8'; roundRect(g, x - s * 0.22, y - s * 0.12, s * 0.44, s * 0.2, s * 0.04); g.fill();
        g.fillStyle = '#6A4020'; g.fillRect(x - s * 0.2, y - s * 0.42, s * 0.04, s * 0.3); g.fillRect(x + s * 0.16, y - s * 0.42, s * 0.04, s * 0.3);
        g.fillStyle = '#B8503A'; g.beginPath(); g.moveTo(x - s * 0.28, y - s * 0.4); g.lineTo(x, y - s * 0.56); g.lineTo(x + s * 0.28, y - s * 0.4); g.fill();
        break;
      case 'swing':
        g.strokeStyle = '#7A5230'; g.lineWidth = s * 0.05;
        g.beginPath(); g.moveTo(x - s * 0.3, y); g.lineTo(x - s * 0.22, y - s * 0.6); g.lineTo(x + s * 0.22, y - s * 0.6); g.lineTo(x + s * 0.3, y); g.stroke();
        { const sw = Math.sin(t * 2) * 0.25; g.save(); g.translate(x, y - s * 0.58); g.rotate(sw); g.strokeStyle = '#C8A070'; g.lineWidth = s * 0.015; g.beginPath(); g.moveTo(-s * 0.08, 0); g.lineTo(-s * 0.08, s * 0.4); g.moveTo(s * 0.08, 0); g.lineTo(s * 0.08, s * 0.4); g.stroke(); g.fillStyle = '#E8475A'; g.fillRect(-s * 0.11, s * 0.4, s * 0.22, s * 0.04); g.restore(); }
        break;
      case 'hive':
        g.fillStyle = '#FFC23A';
        for (let k = 0; k < 4; k += 1) { g.beginPath(); g.ellipse(x, y - k * s * 0.08, s * (0.16 - k * 0.025), s * 0.05, 0, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#5A3A1A'; g.beginPath(); g.arc(x, y - s * 0.04, s * 0.03, 0, Math.PI * 2); g.fill();
        for (let k = 0; k < 3; k += 1) { const a = t * 3 + k * 2; g.fillStyle = '#2A2A2A'; g.beginPath(); g.arc(x + Math.cos(a) * s * 0.28, y - s * 0.2 + Math.sin(a * 1.3) * s * 0.12, s * 0.02, 0, Math.PI * 2); g.fill(); }
        break;
      case 'bushes':
        for (let k = 0; k < 3; k += 1) { g.fillStyle = '#3E8A3A'; g.beginPath(); g.arc(x + k * s * 0.18, y - s * 0.08, s * 0.14, 0, Math.PI * 2); g.fill(); g.fillStyle = '#3F7FE0'; for (let j = 0; j < 4; j += 1) { g.beginPath(); g.arc(x + k * s * 0.18 + Math.cos(j * 1.7) * s * 0.07, y - s * 0.1 + Math.sin(j * 2.3) * s * 0.06, s * 0.025, 0, Math.PI * 2); g.fill(); } }
        break;
      case 'table':
        g.fillStyle = '#FFFFFF'; g.fillRect(x - s * 0.3, y - s * 0.2, s * 0.6, s * 0.08);
        g.fillStyle = '#E8475A'; for (let k = 0; k < 6; k += 1) if (k % 2) g.fillRect(x - s * 0.3 + k * s * 0.1, y - s * 0.2, s * 0.1, s * 0.08);
        g.fillStyle = '#8A5A30'; g.fillRect(x - s * 0.26, y - s * 0.12, s * 0.04, s * 0.16); g.fillRect(x + s * 0.22, y - s * 0.12, s * 0.04, s * 0.16);
        g.fillStyle = '#F4C870'; g.beginPath(); g.ellipse(x, y - s * 0.24, s * 0.1, s * 0.04, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#C2183A'; g.beginPath(); g.ellipse(x, y - s * 0.26, s * 0.08, s * 0.025, 0, 0, Math.PI * 2); g.fill();
        break;
      case 'gazebo':
        g.fillStyle = '#FFF6E6'; g.fillRect(x - s * 0.3, y - s * 0.4, s * 0.05, s * 0.4); g.fillRect(x + s * 0.25, y - s * 0.4, s * 0.05, s * 0.4);
        g.fillStyle = '#7AA8D8'; g.beginPath(); g.moveTo(x - s * 0.4, y - s * 0.38); g.quadraticCurveTo(x, y - s * 0.75, x + s * 0.4, y - s * 0.38); g.closePath(); g.fill();
        g.fillStyle = '#4E9A3A'; for (let k = 0; k < 6; k += 1) { g.beginPath(); g.arc(x - s * 0.3 + k * s * 0.12, y - s * 0.38, s * 0.05, 0, Math.PI * 2); g.fill(); }
        break;
      case 'pond':
        g.fillStyle = '#5AB8E8'; g.beginPath(); g.ellipse(x, y, s * 0.42, s * 0.16, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = s * 0.015; g.beginPath(); g.ellipse(x - s * 0.1 + Math.sin(t) * s * 0.03, y, s * 0.12, s * 0.03, 0, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#4EAE4A'; g.beginPath(); g.ellipse(x + s * 0.18, y + s * 0.03, s * 0.07, s * 0.03, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#FF9AC8'; g.beginPath(); g.arc(x + s * 0.18, y + s * 0.01, s * 0.025, 0, Math.PI * 2); g.fill();
        break;
      case 'garland': {
        const cols = ['#F2414E', '#FFD43B', '#3F7FE0', '#7BCB3A', '#FF9A3C', '#8E4BD6'];
        g.strokeStyle = '#A07A50'; g.lineWidth = s * 0.015;
        g.beginPath(); g.moveTo(x - s * 1.6, y); g.quadraticCurveTo(x, y + s * 0.3, x + s * 1.6, y); g.stroke();
        for (let k = 0; k < 15; k += 1) {
          const u = k / 14; const px = x - s * 1.6 + u * s * 3.2; const py = y + 4 * u * (1 - u) * s * 0.15;
          g.fillStyle = cols[k % 6]; g.beginPath(); g.moveTo(px - s * 0.06, py); g.lineTo(px + s * 0.06, py); g.lineTo(px, py + s * 0.14 + Math.sin(t * 3 + k) * s * 0.01); g.closePath(); g.fill();
        }
        break;
      }
      default: break;
    }
    g.restore();
  }

  window.Art = {
    PAL, setDpr, sprite, blit, fruitSprite, specialSprite, jarSprite, crateSprite, webSprite, blingSprite, weedSprite,
    drawMagpie, butterfly, carrot, pumpkin, roundRect, GARDEN_ITEMS, drawGardenBase, drawGardenItem,
    imgs: {},
    load(cb) {
      const names = ['rabbit', 'cat'];
      let left = names.length;
      names.forEach((n) => {
        const im = new Image();
        im.onload = () => { this.imgs[n] = im; if (!--left) cb(); };
        im.onerror = () => { if (!--left) cb(); };
        im.src = `assets/${n}.png`;
      });
    },
    RABBIT: { w: 34, h: 36, frames: { idle: 0, blink: 1, run: 2, jump: 10, fall: 11, happy: 12 } },
    CAT: { w: 34, h: 30, frames: { walk0: 0, walk1: 1, air: 2, crouch: 3, sit: 4, yawn: 5, sleep0: 6, sleep1: 7 } }
  };
})();
