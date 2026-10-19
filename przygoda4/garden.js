// Ogród Babci Ludwiki – scena nagród. Każdy element ma własny rysunek, cień i animację „życia”.
// Pozycje są w ułamkach ekranu, osobno dla układu poziomego (L) i pionowego (P); u = jednostka wielkości.
(function () {
  'use strict';
  const OUT = '#3A2414';
  const RR = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const rad = (g, x, y, r, stops) => { const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  function fillStroke(g, fill, u, w = 0.025) { g.fillStyle = fill; g.fill(); g.strokeStyle = OUT; g.lineWidth = u * w; g.stroke(); }
  function shadow(g, x, y, rx, ry, a = 0.22) { g.fillStyle = `rgba(30,50,10,${a})`; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
  function blob(g, x, y, r, c1, c2, u) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); fillStroke(g, rad(g, x, y, r, [[0, c1], [1, c2]]), u, 0.02); }
  function leafy(g, x, y, r, n, seed, c1, c2, u) {
    // korona z kilku kul
    const pts = [];
    for (let k = 0; k < n; k += 1) { const a = seed + k * 2.4; pts.push([x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.4, r * (0.5 + ((k * 37) % 10) / 30)]); }
    g.fillStyle = OUT;
    pts.forEach(([px, py, pr]) => { g.beginPath(); g.arc(px, py, pr + u * 0.03, 0, Math.PI * 2); g.fill(); });
    pts.forEach(([px, py, pr]) => { g.beginPath(); g.arc(px, py, pr, 0, Math.PI * 2); g.fillStyle = rad(g, px, py, pr, [[0, c1], [1, c2]]); g.fill(); });
    g.fillStyle = 'rgba(255,255,255,0.18)';
    pts.slice(0, 3).forEach(([px, py, pr]) => { g.beginPath(); g.arc(px - pr * 0.3, py - pr * 0.35, pr * 0.35, 0, Math.PI * 2); g.fill(); });
  }

  // ---------------------------------------------------------------- elementy
  const ITEMS = {
    beds: {
      L: [0.2, 0.75, 1], P: [0.25, 0.74, 0.95],
      draw(g, x, y, u, t) {
        shadow(g, x, y + u * 0.02, u * 0.75, u * 0.12);
        for (let k = 0; k < 2; k += 1) {
          const yy = y - u * 0.36 + k * u * 0.3;
          RR(g, x - u * 0.7, yy, u * 1.4, u * 0.24, u * 0.06); fillStroke(g, lin(g, 0, yy, 0, yy + u * 0.24, [[0, '#B07A44'], [1, '#7A4E28']]), u);
          RR(g, x - u * 0.64, yy + u * 0.03, u * 1.28, u * 0.12, u * 0.05); g.fillStyle = '#5A3A1E'; g.fill();
          for (let j = 0; j < 6; j += 1) {
            const px = x - u * 0.55 + j * u * 0.22, py = yy + u * 0.06;
            const sw = Math.sin(t * 2 + j + k) * 0.12;
            g.save(); g.translate(px, py); g.rotate(sw);
            for (const a of [-0.6, 0, 0.6]) { g.save(); g.rotate(a); g.beginPath(); g.ellipse(0, -u * 0.07, u * 0.045, u * 0.08, 0, 0, Math.PI * 2); fillStroke(g, '#5DBE3E', u, 0.012); g.restore(); }
            g.beginPath(); g.moveTo(0, -u * 0.04); g.bezierCurveTo(-u * 0.05, -u * 0.02, -u * 0.035, u * 0.06, 0, u * 0.08); g.bezierCurveTo(u * 0.035, u * 0.06, u * 0.05, -u * 0.02, 0, -u * 0.04);
            fillStroke(g, '#F2414E', u, 0.012);
            g.fillStyle = '#FFE58A'; g.fillRect(-u * 0.015, u * 0.01, u * 0.01, u * 0.01); g.fillRect(u * 0.01, u * 0.03, u * 0.01, u * 0.01);
            g.restore();
          }
        }
      }
    },
    fence: {
      L: [0.5, 0.995, 1], P: [0.5, 0.995, 1], layer: 'front',
      draw(g, x, y, u, t, W) {
        const w = W * 1.05;
        g.fillStyle = '#F4ECDC'; g.strokeStyle = OUT; g.lineWidth = u * 0.02;
        for (const yy of [-u * 0.36, -u * 0.16]) { RR(g, x - w / 2, y + yy, w, u * 0.07, u * 0.03); g.fill(); g.stroke(); }
        const n = Math.ceil(w / (u * 0.3));
        for (let k = 0; k <= n; k += 1) {
          const px = x - w / 2 + k * (w / n);
          g.beginPath(); g.moveTo(px - u * 0.06, y); g.lineTo(px - u * 0.06, y - u * 0.46); g.lineTo(px, y - u * 0.54); g.lineTo(px + u * 0.06, y - u * 0.46); g.lineTo(px + u * 0.06, y); g.closePath();
          g.fillStyle = lin(g, px - u * 0.06, 0, px + u * 0.06, 0, [[0, '#FFFFFF'], [1, '#E2D6C0']]); g.fill(); g.stroke();
        }
        // pnące różyczki
        for (let k = 0; k < n; k += 3) { const px = x - w / 2 + k * (w / n) + u * 0.1; g.fillStyle = '#FF6A90'; g.beginPath(); g.arc(px, y - u * 0.3 + Math.sin(k) * u * 0.05, u * 0.04, 0, Math.PI * 2); g.fill(); g.fillStyle = '#4E9A3A'; g.beginPath(); g.ellipse(px + u * 0.06, y - u * 0.28, u * 0.04, u * 0.02, 0.5, 0, Math.PI * 2); g.fill(); }
      }
    },
    sunflowers: {
      L: [0.42, 0.54, 0.95], P: [0.17, 0.51, 0.85],
      draw(g, x, y, u, t) {
        shadow(g, x, y, u * 0.4, u * 0.07);
        [[-0.22, 1.25, 0], [0.04, 1.5, 1.3], [0.26, 1.15, 2.4]].forEach(([dx, h, ph]) => {
          const sx = x + dx * u, top = y - h * u;
          const sw = Math.sin(t * 1.2 + ph) * u * 0.04;
          g.strokeStyle = '#3E8A2A'; g.lineWidth = u * 0.05; g.beginPath(); g.moveTo(sx, y); g.quadraticCurveTo(sx - u * 0.04, (y + top) / 2, sx + sw, top); g.stroke();
          for (const s of [-1, 1]) { g.beginPath(); g.ellipse(sx + s * u * 0.1, y - h * u * 0.45, u * 0.1, u * 0.045, s * 0.5, 0, Math.PI * 2); fillStroke(g, '#5AAE3A', u, 0.012); }
          g.save(); g.translate(sx + sw, top); g.rotate(Math.sin(t * 0.8 + ph) * 0.15);
          for (let k = 0; k < 14; k += 1) { g.save(); g.rotate(k * Math.PI / 7); g.beginPath(); g.ellipse(0, -u * 0.17, u * 0.05, u * 0.1, 0, 0, Math.PI * 2); fillStroke(g, '#FFD43B', u, 0.01); g.restore(); }
          g.beginPath(); g.arc(0, 0, u * 0.12, 0, Math.PI * 2); fillStroke(g, rad(g, 0, 0, u * 0.12, [[0, '#9A5A1E'], [1, '#5A3010']]), u, 0.015);
          g.fillStyle = '#3A2010'; for (let k = 0; k < 8; k += 1) { g.beginPath(); g.arc(Math.cos(k * 0.8) * u * 0.06, Math.sin(k * 0.8) * u * 0.06, u * 0.012, 0, Math.PI * 2); g.fill(); }
          // uśmiech
          g.strokeStyle = '#FFE8A0'; g.lineWidth = u * 0.015; g.beginPath(); g.arc(0, u * 0.01, u * 0.05, 0.3, Math.PI - 0.3); g.stroke();
          g.fillStyle = '#FFE8A0'; g.beginPath(); g.arc(-u * 0.035, -u * 0.03, u * 0.012, 0, Math.PI * 2); g.arc(u * 0.035, -u * 0.03, u * 0.012, 0, Math.PI * 2); g.fill();
          g.restore();
        });
      }
    },
    birdhouse: {
      L: [0.6, 0.6, 0.85], P: [0.85, 0.5, 0.8],
      draw(g, x, y, u, t) {
        shadow(g, x, y, u * 0.2, u * 0.05);
        RR(g, x - u * 0.04, y - u * 1.0, u * 0.08, u * 1.0, u * 0.02); fillStroke(g, '#8A5A30', u);
        const top = y - u * 1.45;
        RR(g, x - u * 0.24, top, u * 0.48, u * 0.42, u * 0.04); fillStroke(g, lin(g, 0, top, 0, top + u * 0.42, [[0, '#7AC4F0'], [1, '#4A94C8']]), u);
        g.beginPath(); g.moveTo(x - u * 0.34, top + u * 0.04); g.lineTo(x, top - u * 0.26); g.lineTo(x + u * 0.34, top + u * 0.04); g.closePath(); fillStroke(g, '#E8475A', u);
        g.beginPath(); g.arc(x, top + u * 0.2, u * 0.08, 0, Math.PI * 2); fillStroke(g, '#2A1A10', u, 0.015);
        g.fillStyle = '#8A5A30'; g.fillRect(x - u * 0.02, top + u * 0.3, u * 0.04, u * 0.08);
        // ptaszek dziobie ziarenka
        const hop = Math.max(0, Math.sin(t * 3)) * u * 0.04;
        const peck = Math.sin(t * 9) > 0.7 ? 0.5 : 0;
        g.save(); g.translate(x + u * 0.12, top + u * 0.44 - hop); g.rotate(peck);
        g.beginPath(); g.ellipse(0, -u * 0.06, u * 0.08, u * 0.06, 0, 0, Math.PI * 2); fillStroke(g, '#FF9A3C', u, 0.012);
        g.beginPath(); g.arc(u * 0.06, -u * 0.11, u * 0.045, 0, Math.PI * 2); fillStroke(g, '#FF9A3C', u, 0.012);
        g.fillStyle = '#2A1A10'; g.beginPath(); g.arc(u * 0.075, -u * 0.12, u * 0.01, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#FFD43B'; g.beginPath(); g.moveTo(u * 0.1, -u * 0.12); g.lineTo(u * 0.14, -u * 0.105); g.lineTo(u * 0.1, -u * 0.095); g.fill();
        g.restore();
      }
    },
    appletree: {
      L: [0.08, 0.57, 1.5], P: [0.15, 0.41, 1.25],
      draw(g, x, y, u, t) { tree(g, x, y, u, t, '#E8475A', 0.3); }
    },
    plumtree: {
      L: [0.66, 0.39, 1.3], P: [0.86, 0.39, 1.1],
      draw(g, x, y, u, t) { tree(g, x, y, u, t, '#8E4BD6', 1.7); }
    },
    bench: {
      L: [0.5, 0.74, 0.85], P: [0.42, 0.63, 0.8],
      draw(g, x, y, u, t) {
        shadow(g, x, y, u * 0.55, u * 0.08);
        for (const s of [-1, 1]) { RR(g, x + s * u * 0.42 - u * 0.04, y - u * 0.36, u * 0.08, u * 0.36, u * 0.02); fillStroke(g, '#5A3A1E', u); }
        for (let k = 0; k < 2; k += 1) { RR(g, x - u * 0.55, y - u * 0.62 + k * u * 0.12, u * 1.1, u * 0.09, u * 0.03); fillStroke(g, '#C07A3E', u); }
        RR(g, x - u * 0.58, y - u * 0.36, u * 1.16, u * 0.1, u * 0.03); fillStroke(g, '#D88A48', u);
        // poduszka w kratkę i kubek
        RR(g, x - u * 0.38, y - u * 0.46, u * 0.32, u * 0.11, u * 0.04); fillStroke(g, '#F2414E', u, 0.015);
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x - u * 0.3, y - u * 0.46, u * 0.04, u * 0.11); g.fillRect(x - u * 0.18, y - u * 0.46, u * 0.04, u * 0.11);
        RR(g, x + u * 0.2, y - u * 0.5, u * 0.12, u * 0.14, u * 0.02); fillStroke(g, '#FFFFFF', u, 0.015);
        for (let k = 0; k < 3; k += 1) { const ph = (t * 0.6 + k / 3) % 1; g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - ph)})`; g.lineWidth = u * 0.015; g.beginPath(); g.moveTo(x + u * 0.26, y - u * 0.52 - ph * u * 0.3); g.quadraticCurveTo(x + u * 0.3, y - u * 0.6 - ph * u * 0.3, x + u * 0.26, y - u * 0.68 - ph * u * 0.3); g.stroke(); }
      }
    },
    cathouse: {
      L: [0.86, 0.73, 1], P: [0.84, 0.86, 0.9],
      draw(g, x, y, u, t) {
        shadow(g, x, y, u * 0.55, u * 0.09);
        RR(g, x - u * 0.45, y - u * 0.62, u * 0.9, u * 0.62, u * 0.05); fillStroke(g, lin(g, 0, y - u * 0.6, 0, y, [[0, '#F2B070'], [1, '#C8783A']]), u);
        g.strokeStyle = 'rgba(90,50,20,0.35)'; g.lineWidth = u * 0.015; for (let k = 1; k < 4; k += 1) { g.beginPath(); g.moveTo(x - u * 0.45, y - u * 0.62 + k * u * 0.155); g.lineTo(x + u * 0.45, y - u * 0.62 + k * u * 0.155); g.stroke(); }
        g.beginPath(); g.moveTo(x - u * 0.58, y - u * 0.58); g.lineTo(x, y - u * 1.02); g.lineTo(x + u * 0.58, y - u * 0.58); g.closePath(); fillStroke(g, lin(g, 0, y - u, 0, y - u * 0.58, [[0, '#E8604A'], [1, '#A8352A']]), u);
        g.beginPath(); g.arc(x, y - u * 0.18, u * 0.2, Math.PI, 0); g.lineTo(x + u * 0.2, y); g.lineTo(x - u * 0.2, y); g.closePath(); fillStroke(g, '#2A1A10', u);
        // tabliczka
        RR(g, x - u * 0.22, y - u * 0.76, u * 0.44, u * 0.14, u * 0.03); fillStroke(g, '#FFF4D8', u, 0.015);
        g.fillStyle = '#7A3A1A'; g.font = `700 ${u * 0.1}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PERSI', x, y - u * 0.69);
        // miseczka
        g.beginPath(); g.ellipse(x + u * 0.42, y - u * 0.02, u * 0.13, u * 0.05, 0, 0, Math.PI * 2); fillStroke(g, '#3F7FE0', u, 0.015);
        // świecące oczka w środku
        if (Math.sin(t * 0.7) > -0.6) { g.fillStyle = '#FFE24A'; g.beginPath(); g.ellipse(x - u * 0.06, y - u * 0.15, u * 0.025, Math.sin(t * 3) > 0.95 ? u * 0.004 : u * 0.03, 0, 0, Math.PI * 2); g.ellipse(x + u * 0.06, y - u * 0.15, u * 0.025, Math.sin(t * 3) > 0.95 ? u * 0.004 : u * 0.03, 0, 0, Math.PI * 2); g.fill(); }
      }
    },
    flowers: {
      L: [0.68, 0.88, 0.95], P: [0.48, 0.85, 0.9],
      draw(g, x, y, u, t) {
        shadow(g, x, y, u * 0.6, u * 0.08);
        RR(g, x - u * 0.6, y - u * 0.18, u * 1.2, u * 0.18, u * 0.06); fillStroke(g, '#8A5A30', u);
        const cols = ['#FF6AA0', '#FFD43B', '#9A7AF0', '#FF8A3C', '#5AD8FF', '#FF4A6A'];
        for (let k = 0; k < 9; k += 1) {
          const fx = x - u * 0.5 + k * u * 0.125, h = u * (0.3 + ((k * 7) % 5) * 0.06);
          const sw = Math.sin(t * 1.6 + k) * u * 0.03;
          g.strokeStyle = '#3E8A2A'; g.lineWidth = u * 0.025; g.beginPath(); g.moveTo(fx, y - u * 0.16); g.quadraticCurveTo(fx, y - u * 0.16 - h / 2, fx + sw, y - u * 0.16 - h); g.stroke();
          g.beginPath(); g.ellipse(fx + u * 0.04, y - u * 0.16 - h * 0.4, u * 0.04, u * 0.018, -0.6, 0, Math.PI * 2); g.fillStyle = '#5AAE3A'; g.fill();
          const c = cols[k % cols.length];
          g.save(); g.translate(fx + sw, y - u * 0.16 - h); g.rotate(t * 0.3 + k);
          for (let p = 0; p < 5; p += 1) { g.save(); g.rotate(p * 1.2566); g.beginPath(); g.ellipse(0, -u * 0.045, u * 0.032, u * 0.045, 0, 0, Math.PI * 2); fillStroke(g, c, u, 0.008); g.restore(); }
          g.beginPath(); g.arc(0, 0, u * 0.026, 0, Math.PI * 2); g.fillStyle = '#FFF2A0'; g.fill();
          g.restore();
        }
        // motylek
        const bx = x + Math.sin(t * 0.9) * u * 0.5, by = y - u * 0.7 + Math.sin(t * 2.3) * u * 0.12;
        const fl = Math.abs(Math.sin(t * 14));
        g.fillStyle = '#FF9AD0';
        g.beginPath(); g.ellipse(bx - u * 0.04 * fl, by, u * 0.045 * fl + u * 0.005, u * 0.035, 0, 0, Math.PI * 2); g.ellipse(bx + u * 0.04 * fl, by, u * 0.045 * fl + u * 0.005, u * 0.035, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#3A2A3A'; g.fillRect(bx - u * 0.006, by - u * 0.03, u * 0.012, u * 0.06);
      }
    },
    path: {
      L: [0.5, 0.99, 1], P: [0.5, 0.99, 1], layer: 'ground',
      draw(g, x, y, u, t, W, H, pos) {
        const h = pos.house;
        const pts = [];
        for (let k = 0; k <= 14; k += 1) { const s = k / 14; pts.push([h.x + (x - h.x) * s + Math.sin(s * 5) * u * 0.6 * s, h.y + (y - h.y) * s]); }
        pts.forEach(([px, py], k) => {
          const s = k / 14; const r = u * (0.1 + s * 0.16);
          for (const d of [-1, 1]) { g.beginPath(); g.ellipse(px + d * r * 0.9, py, r, r * 0.45, 0, 0, Math.PI * 2); fillStroke(g, k % 2 ? '#E8D2A8' : '#DCC496', u, 0.012); }
        });
      }
    },
    well: {
      L: [0.34, 0.87, 0.9], P: [0.14, 0.86, 0.8],
      draw(g, x, y, u, t) {
        shadow(g, x, y, u * 0.45, u * 0.08);
        g.beginPath(); g.ellipse(x, y - u * 0.4, u * 0.38, u * 0.12, 0, 0, Math.PI * 2); g.fillStyle = '#2A3A4A'; g.fill();
        RR(g, x - u * 0.38, y - u * 0.4, u * 0.76, u * 0.4, u * 0.06); fillStroke(g, lin(g, 0, y - u * 0.4, 0, y, [[0, '#B8B8C4'], [1, '#7A7A88']]), u);
        g.strokeStyle = 'rgba(60,60,70,0.4)'; g.lineWidth = u * 0.012;
        for (let r = 0; r < 3; r += 1) for (let c = 0; c < 4; c += 1) { g.strokeRect(x - u * 0.38 + c * u * 0.19 + (r % 2) * u * 0.09, y - u * 0.4 + r * u * 0.13, u * 0.19, u * 0.13); }
        for (const s of [-1, 1]) { RR(g, x + s * u * 0.32 - u * 0.04, y - u * 1.05, u * 0.08, u * 0.66, u * 0.02); fillStroke(g, '#7A5230', u); }
        g.beginPath(); g.moveTo(x - u * 0.5, y - u * 0.98); g.lineTo(x, y - u * 1.3); g.lineTo(x + u * 0.5, y - u * 0.98); g.closePath(); fillStroke(g, '#C8503A', u);
        g.strokeStyle = '#5A3A1E'; g.lineWidth = u * 0.05; g.beginPath(); g.moveTo(x - u * 0.32, y - u * 0.85); g.lineTo(x + u * 0.32, y - u * 0.85); g.stroke();
        const by = y - u * 0.62 + Math.sin(t * 1.4) * u * 0.05;
        g.strokeStyle = '#8A7A5A'; g.lineWidth = u * 0.012; g.beginPath(); g.moveTo(x, y - u * 0.85); g.lineTo(x, by); g.stroke();
        RR(g, x - u * 0.09, by, u * 0.18, u * 0.14, u * 0.03); fillStroke(g, '#9A6A3A', u, 0.015);
      }
    },
    swing: {
      L: [0.77, 0.51, 1.05], P: [0.8, 0.63, 0.9],
      draw(g, x, y, u, t) {
        shadow(g, x, y, u * 0.6, u * 0.08);
        g.strokeStyle = OUT; g.lineWidth = u * 0.09; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x - u * 0.6, y); g.lineTo(x - u * 0.42, y - u * 1.3); g.lineTo(x + u * 0.42, y - u * 1.3); g.lineTo(x + u * 0.6, y); g.stroke();
        g.strokeStyle = '#A0703E'; g.lineWidth = u * 0.06;
        g.beginPath(); g.moveTo(x - u * 0.6, y); g.lineTo(x - u * 0.42, y - u * 1.3); g.lineTo(x + u * 0.42, y - u * 1.3); g.lineTo(x + u * 0.6, y); g.stroke();
        const sw = Math.sin(t * 1.8) * 0.4;
        g.save(); g.translate(x, y - u * 1.28); g.rotate(sw);
        g.strokeStyle = '#D8C08A'; g.lineWidth = u * 0.02; g.beginPath(); g.moveTo(-u * 0.15, 0); g.lineTo(-u * 0.15, u * 0.9); g.moveTo(u * 0.15, 0); g.lineTo(u * 0.15, u * 0.9); g.stroke();
        RR(g, -u * 0.22, u * 0.88, u * 0.44, u * 0.07, u * 0.02); fillStroke(g, '#E8475A', u, 0.015);
        g.restore();
        g.lineCap = 'butt';
      }
    },
    hive: {
      L: [0.95, 0.56, 0.8], P: [0.13, 0.63, 0.75],
      draw(g, x, y, u, t) {
        shadow(g, x, y, u * 0.3, u * 0.06);
        RR(g, x - u * 0.05, y - u * 0.35, u * 0.1, u * 0.35, u * 0.02); fillStroke(g, '#7A5230', u);
        for (let k = 0; k < 4; k += 1) { g.beginPath(); g.ellipse(x, y - u * 0.42 - k * u * 0.13, u * (0.3 - k * 0.05), u * 0.09, 0, 0, Math.PI * 2); fillStroke(g, lin(g, 0, y - u * 0.5 - k * u * 0.13, 0, y - u * 0.33 - k * u * 0.13, [[0, '#FFD86A'], [1, '#E8A42A']]), u, 0.018); }
        g.beginPath(); g.arc(x, y - u * 0.45, u * 0.05, 0, Math.PI * 2); g.fillStyle = '#3A2010'; g.fill();
        for (let k = 0; k < 4; k += 1) {
          const a = t * (2 + k * 0.3) + k * 1.6;
          const bx = x + Math.cos(a) * u * (0.45 + k * 0.05), by = y - u * 0.55 + Math.sin(a * 1.4) * u * 0.25;
          g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(bx, by - u * 0.03, u * 0.03, u * 0.018, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#FFD23A'; g.beginPath(); g.ellipse(bx, by, u * 0.035, u * 0.025, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#2A2A2A'; g.fillRect(bx - u * 0.005, by - u * 0.025, u * 0.012, u * 0.05);
        }
      }
    },
    bushes: {
      L: [0.06, 0.87, 0.9], P: [0.32, 0.95, 0.8],
      draw(g, x, y, u, t) {
        shadow(g, x, y, u * 0.6, u * 0.08);
        leafy(g, x, y - u * 0.3, u * 0.42, 6, 0.7, '#5AAE4A', '#2E6A2A', u);
        g.fillStyle = '#3F7FE0';
        for (let k = 0; k < 14; k += 1) { const bx = x + Math.cos(k * 2.3) * u * 0.38, by = y - u * 0.32 + Math.sin(k * 1.7) * u * 0.18; g.beginPath(); g.arc(bx, by, u * 0.035, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(bx - u * 0.015, by - u * 0.02, u * 0.012, u * 0.012); g.fillStyle = '#3F7FE0'; }
      }
    },
    table: {
      L: [0.54, 0.43, 0.8], P: [0.62, 0.355, 0.7],
      draw(g, x, y, u, t) {
        shadow(g, x, y, u * 0.6, u * 0.08);
        for (const s of [-1, 1]) { RR(g, x + s * u * 0.45 - u * 0.04, y - u * 0.5, u * 0.08, u * 0.5, u * 0.02); fillStroke(g, '#7A5230', u); }
        RR(g, x - u * 0.62, y - u * 0.6, u * 1.24, u * 0.16, u * 0.04); fillStroke(g, '#FFFFFF', u);
        g.fillStyle = '#E8475A'; for (let k = 0; k < 8; k += 1) if (k % 2) g.fillRect(x - u * 0.62 + k * u * 0.155, y - u * 0.6, u * 0.155, u * 0.16);
        g.strokeStyle = OUT; g.lineWidth = u * 0.025; RR(g, x - u * 0.62, y - u * 0.6, u * 1.24, u * 0.16, u * 0.04); g.stroke();
        // szarlotka babci z parą
        g.beginPath(); g.ellipse(x - u * 0.2, y - u * 0.66, u * 0.22, u * 0.08, 0, 0, Math.PI * 2); fillStroke(g, '#F4C870', u, 0.015);
        g.strokeStyle = '#C8843A'; g.lineWidth = u * 0.012; for (let k = -2; k <= 2; k += 1) { g.beginPath(); g.moveTo(x - u * 0.2 + k * u * 0.06, y - u * 0.72); g.lineTo(x - u * 0.2 + k * u * 0.06 + u * 0.03, y - u * 0.6); g.stroke(); }
        for (let k = 0; k < 3; k += 1) { const ph = (t * 0.5 + k / 3) % 1; g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - ph)})`; g.lineWidth = u * 0.018; g.beginPath(); g.moveTo(x - u * 0.28 + k * u * 0.08, y - u * 0.74 - ph * u * 0.4); g.quadraticCurveTo(x - u * 0.24 + k * u * 0.08, y - u * 0.82 - ph * u * 0.4, x - u * 0.28 + k * u * 0.08, y - u * 0.9 - ph * u * 0.4); g.stroke(); }
        // dzbanek kompotu
        RR(g, x + u * 0.2, y - u * 0.88, u * 0.18, u * 0.28, u * 0.05); fillStroke(g, 'rgba(230,80,110,0.85)', u, 0.015);
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x + u * 0.23, y - u * 0.84, u * 0.03, u * 0.18);
      }
    },
    gazebo: {
      L: [0.89, 0.37, 1.15], P: [0.52, 0.53, 0.95],
      draw(g, x, y, u, t) {
        shadow(g, x, y, u * 0.75, u * 0.1);
        g.beginPath(); g.ellipse(x, y - u * 0.04, u * 0.7, u * 0.12, 0, 0, Math.PI * 2); fillStroke(g, '#D8C8A8', u);
        for (const s of [-1, -0.33, 0.33, 1]) { RR(g, x + s * u * 0.58 - u * 0.04, y - u * 1.1, u * 0.08, u * 1.06, u * 0.02); fillStroke(g, '#FFF6E6', u); }
        g.beginPath(); g.moveTo(x - u * 0.82, y - u * 1.05); g.quadraticCurveTo(x - u * 0.4, y - u * 1.25, x, y - u * 1.75); g.quadraticCurveTo(x + u * 0.4, y - u * 1.25, x + u * 0.82, y - u * 1.05); g.closePath();
        fillStroke(g, lin(g, 0, y - u * 1.7, 0, y - u * 1.05, [[0, '#9AC8F0'], [1, '#4A88C8']]), u);
        g.beginPath(); g.arc(x, y - u * 1.78, u * 0.06, 0, Math.PI * 2); fillStroke(g, '#FFD43B', u, 0.015);
        // bluszcz z kwiatkami i lampionem
        for (let k = 0; k < 12; k += 1) { const px = x - u * 0.75 + k * u * 0.135, py = y - u * 1.06 + Math.sin(k * 1.3) * u * 0.04; g.beginPath(); g.ellipse(px, py, u * 0.07, u * 0.045, k, 0, Math.PI * 2); g.fillStyle = k % 2 ? '#5AAE3A' : '#4A9A32'; g.fill(); if (k % 3 === 0) { g.fillStyle = '#FF8AC0'; g.beginPath(); g.arc(px, py + u * 0.03, u * 0.025, 0, Math.PI * 2); g.fill(); } }
        const lx = x + Math.sin(t * 1.5) * u * 0.03;
        g.strokeStyle = OUT; g.lineWidth = u * 0.01; g.beginPath(); g.moveTo(x, y - u * 1.2); g.lineTo(lx, y - u * 0.95); g.stroke();
        g.beginPath(); g.ellipse(lx, y - u * 0.88, u * 0.08, u * 0.1, 0, 0, Math.PI * 2); fillStroke(g, '#FFB040', u, 0.015);
        g.fillStyle = `rgba(255,220,120,${0.25 + Math.sin(t * 4) * 0.08})`; g.beginPath(); g.arc(lx, y - u * 0.88, u * 0.25, 0, Math.PI * 2); g.fill();
      }
    },
    pond: {
      L: [0.7, 0.67, 1.1], P: [0.68, 0.75, 0.95], layer: 'ground',
      draw(g, x, y, u, t) {
        g.beginPath(); g.ellipse(x, y - u * 0.12, u * 0.85, u * 0.3, 0, 0, Math.PI * 2); fillStroke(g, '#9A9AA8', u);
        g.beginPath(); g.ellipse(x, y - u * 0.13, u * 0.74, u * 0.24, 0, 0, Math.PI * 2); g.fillStyle = lin(g, 0, y - u * 0.37, 0, y + u * 0.1, [[0, '#7AD0F4'], [1, '#2A88C8']]); g.fill();
        for (let k = 0; k < 3; k += 1) { const ph = (t * 0.4 + k / 3) % 1; g.strokeStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`; g.lineWidth = u * 0.012; g.beginPath(); g.ellipse(x - u * 0.2 + k * u * 0.2, y - u * 0.12, u * 0.08 + ph * u * 0.18, (u * 0.08 + ph * u * 0.18) * 0.3, 0, 0, Math.PI * 2); g.stroke(); }
        for (const [dx, dy] of [[-0.45, -0.05], [0.35, -0.2], [0.5, 0]]) { g.beginPath(); g.ellipse(x + dx * u, y - u * 0.12 + dy * u, u * 0.12, u * 0.045, 0, 0.3, Math.PI * 2 - 0.1); g.lineTo(x + dx * u, y - u * 0.12 + dy * u); g.closePath(); fillStroke(g, '#4EAE4A', u, 0.012); }
        g.fillStyle = '#FF9AC8'; g.beginPath(); g.arc(x + u * 0.35, y - u * 0.34, u * 0.04, 0, Math.PI * 2); g.fill();
        // złota rybka wyskakuje co jakiś czas
        const ph = (t * 0.35) % 1;
        if (ph < 0.25) {
          const k = ph / 0.25; const fx = x - u * 0.3 + k * u * 0.5, fy = y - u * 0.15 - Math.sin(Math.PI * k) * u * 0.45;
          g.save(); g.translate(fx, fy); g.rotate(-1 + k * 2);
          g.beginPath(); g.ellipse(0, 0, u * 0.08, u * 0.045, 0, 0, Math.PI * 2); fillStroke(g, '#FF8A2A', u, 0.012);
          g.beginPath(); g.moveTo(-u * 0.07, 0); g.lineTo(-u * 0.13, -u * 0.04); g.lineTo(-u * 0.13, u * 0.04); g.closePath(); g.fillStyle = '#FF6A1A'; g.fill();
          g.restore();
        }
      }
    },
    garland: {
      L: [0.5, 0.23, 1], P: [0.5, 0.28, 1], layer: 'top',
      draw(g, x, y, u, t, W) {
        const cols = ['#F2414E', '#FFD43B', '#3F7FE0', '#7BCB3A', '#FF9A3C', '#8E4BD6'];
        const x0 = x - W * 0.46, x1 = x + W * 0.46, sag = u * 0.35;
        g.strokeStyle = '#A07A50'; g.lineWidth = u * 0.02;
        g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); g.stroke();
        const n = Math.round((x1 - x0) / (u * 0.22));
        for (let k = 0; k <= n; k += 1) {
          const s = k / n; const px = x0 + (x1 - x0) * s; const py = y + 4 * s * (1 - s) * sag;
          const fl = Math.sin(t * 3 + k) * u * 0.03;
          g.beginPath(); g.moveTo(px - u * 0.08, py); g.lineTo(px + u * 0.08, py); g.lineTo(px + fl, py + u * 0.2); g.closePath(); fillStroke(g, cols[k % 6], u, 0.012);
        }
        // lampki
        for (let k = 0; k < n; k += 2) { const s = (k + 0.5) / n; const px = x0 + (x1 - x0) * s; const py = y + 4 * s * (1 - s) * sag + u * 0.02; g.fillStyle = `rgba(255,240,150,${0.5 + 0.5 * Math.sin(t * 5 + k)})`; g.beginPath(); g.arc(px, py, u * 0.03, 0, Math.PI * 2); g.fill(); }
      }
    }
  };

  function tree(g, x, y, u, t, fruit, seed) {
    shadow(g, x, y, u * 0.6, u * 0.1);
    const sway = Math.sin(t * 0.9 + seed) * u * 0.03;
    g.beginPath(); g.moveTo(x - u * 0.12, y); g.quadraticCurveTo(x - u * 0.06, y - u * 0.5, x - u * 0.1 + sway, y - u * 0.9); g.lineTo(x + u * 0.1 + sway, y - u * 0.9); g.quadraticCurveTo(x + u * 0.06, y - u * 0.5, x + u * 0.14, y); g.closePath();
    fillStroke(g, lin(g, x - u * 0.12, 0, x + u * 0.12, 0, [[0, '#9A6A3E'], [1, '#6A4222']]), u);
    leafy(g, x + sway * 1.5, y - u * 1.15, u * 0.62, 7, seed, '#6CC24E', '#2E7A2A', u);
    for (let k = 0; k < 9; k += 1) {
      const fx = x + sway * 1.5 + Math.cos(k * 2.1 + seed) * u * 0.42, fy = y - u * 1.15 + Math.sin(k * 1.7 + seed) * u * 0.3;
      g.beginPath(); g.arc(fx, fy, u * 0.065, 0, Math.PI * 2); fillStroke(g, rad(g, fx, fy, u * 0.065, [[0, '#FFFFFF'], [0.25, fruit], [1, fruit]]), u, 0.012);
    }
  }

  // ---------------------------------------------------------------- tło, dom, babcia
  function background(g, W, H, t, portrait) {
    const hor = H * (portrait ? 0.27 : 0.32);
    g.fillStyle = lin(g, 0, 0, 0, hor, [[0, '#7CC8F2'], [1, '#DDF4FF']]); g.fillRect(0, 0, W, hor + 4);
    const sx = W * 0.86, sy = H * 0.09, sr = Math.min(W, H) * 0.08;
    g.fillStyle = 'rgba(255,240,170,0.35)'; g.beginPath(); g.arc(sx, sy, sr * 1.9 + Math.sin(t * 2) * 3, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fillStyle = rad(g, sx, sy, sr, [[0, '#FFFBE0'], [1, '#FFD84A']]); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.95)';
    for (let k = 0; k < 4; k += 1) {
      const cx = ((k * 0.29 + t * 0.008) % 1.3 - 0.15) * W, cy = hor * (0.25 + (k % 2) * 0.25), s = Math.min(W, H) * 0.05;
      for (const [dx, dy, r] of [[0, 0, 1], [1, -0.4, 1.2], [2, 0, 0.9], [1, 0.3, 1]]) { g.beginPath(); g.arc(cx + dx * s * 0.9, cy + dy * s, r * s, 0, Math.PI * 2); g.fill(); }
    }
    // dalekie wzgórza i drzewa
    g.fillStyle = '#A8DC88'; g.beginPath(); g.moveTo(0, hor); for (let x = 0; x <= W; x += W / 10) g.lineTo(x, hor - Math.sin(x / W * 5 + 1) * H * 0.03 - H * 0.02); g.lineTo(W, hor + 10); g.lineTo(0, hor + 10); g.fill();
    g.fillStyle = lin(g, 0, hor, 0, H, [[0, '#9AD86A'], [1, '#56AA3A']]); g.fillRect(0, hor, W, H - hor);
    // pasy koszonej trawy
    g.fillStyle = 'rgba(255,255,255,0.06)';
    for (let k = 0; k < 6; k += 1) { g.beginPath(); g.moveTo(W * (k / 6), hor); g.lineTo(W * ((k + 0.5) / 6), hor); g.lineTo(W * ((k + 0.5) / 6) + (k - 3) * W * 0.08, H); g.lineTo(W * (k / 6) + (k - 3) * W * 0.08, H); g.fill(); }
    for (let k = 0; k < 60; k += 1) { const x = ((k * 97) % 100) / 100 * W, y = hor + 20 + ((k * 61) % 100) / 100 * (H - hor); g.strokeStyle = 'rgba(40,110,30,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y - 6); g.moveTo(x + 3, y); g.lineTo(x + 4, y - 5); g.stroke(); }
    return hor;
  }

  function house(g, x, y, u, t) {
    shadow(g, x, y, u * 1.1, u * 0.12);
    const w = u * 1.8, h = u * 1.05;
    RR(g, x - w / 2, y - h, w, h, u * 0.04); fillStroke(g, lin(g, 0, y - h, 0, y, [[0, '#FFF2DA'], [1, '#EAD4AE']]), u);
    g.beginPath(); g.moveTo(x - w * 0.6, y - h + u * 0.04); g.lineTo(x, y - h - u * 0.85); g.lineTo(x + w * 0.6, y - h + u * 0.04); g.closePath(); fillStroke(g, lin(g, 0, y - h - u * 0.8, 0, y - h, [[0, '#E8604A'], [1, '#B03A2A']]), u);
    RR(g, x + w * 0.22, y - h - u * 0.75, u * 0.18, u * 0.4, u * 0.02); fillStroke(g, '#A04030', u);
    for (let k = 0; k < 3; k += 1) { const ph = (t * 0.25 + k / 3) % 1; g.fillStyle = `rgba(240,240,240,${0.7 * (1 - ph)})`; g.beginPath(); g.arc(x + w * 0.22 + u * 0.09 + Math.sin(ph * 6) * u * 0.1, y - h - u * 0.8 - ph * u * 0.8, u * (0.07 + ph * 0.1), 0, Math.PI * 2); g.fill(); }
    RR(g, x - u * 0.16, y - u * 0.62, u * 0.32, u * 0.62, u * 0.12); fillStroke(g, '#8A4A2A', u);
    g.fillStyle = '#FFD43B'; g.beginPath(); g.arc(x + u * 0.09, y - u * 0.3, u * 0.025, 0, Math.PI * 2); g.fill();
    for (const s of [-1, 1]) {
      const wx = x + s * w * 0.3;
      RR(g, wx - u * 0.18, y - h + u * 0.22, u * 0.36, u * 0.32, u * 0.03); fillStroke(g, '#9AD8F4', u);
      g.strokeStyle = '#FFFFFF'; g.lineWidth = u * 0.03; g.beginPath(); g.moveTo(wx, y - h + u * 0.22); g.lineTo(wx, y - h + u * 0.54); g.moveTo(wx - u * 0.18, y - h + u * 0.38); g.lineTo(wx + u * 0.18, y - h + u * 0.38); g.stroke();
      RR(g, wx - u * 0.22, y - h + u * 0.54, u * 0.44, u * 0.1, u * 0.03); fillStroke(g, '#8A5A30', u, 0.015);
      for (let k = 0; k < 4; k += 1) { g.fillStyle = ['#FF6AA0', '#FFD43B', '#FF4A6A', '#9A7AF0'][k]; g.beginPath(); g.arc(wx - u * 0.15 + k * u * 0.1, y - h + u * 0.53, u * 0.04, 0, Math.PI * 2); g.fill(); }
    }
  }

  function granny(g, x, y, u, t, cheer) {
    shadow(g, x, y, u * 0.25, u * 0.05);
    const bob = cheer > 0 ? Math.abs(Math.sin(t * 10)) * u * 0.08 : Math.sin(t * 2) * u * 0.01;
    g.save(); g.translate(0, -bob);
    // sukienka
    g.beginPath(); g.moveTo(x - u * 0.24, y); g.quadraticCurveTo(x - u * 0.22, y - u * 0.5, x - u * 0.12, y - u * 0.62); g.lineTo(x + u * 0.12, y - u * 0.62); g.quadraticCurveTo(x + u * 0.22, y - u * 0.5, x + u * 0.24, y); g.closePath();
    fillStroke(g, lin(g, 0, y - u * 0.6, 0, y, [[0, '#9A6AD0'], [1, '#6A3AA8']]), u);
    g.fillStyle = 'rgba(255,255,255,0.55)'; for (let k = 0; k < 6; k += 1) { g.beginPath(); g.arc(x - u * 0.15 + (k % 3) * u * 0.15, y - u * 0.12 - Math.floor(k / 3) * u * 0.2, u * 0.02, 0, Math.PI * 2); g.fill(); }
    // fartuch
    g.beginPath(); g.moveTo(x - u * 0.12, y - u * 0.45); g.lineTo(x + u * 0.12, y - u * 0.45); g.lineTo(x + u * 0.15, y - u * 0.08); g.lineTo(x - u * 0.15, y - u * 0.08); g.closePath(); fillStroke(g, '#FFFFFF', u, 0.015);
    g.fillStyle = '#F2414E'; g.beginPath(); g.arc(x, y - u * 0.3, u * 0.035, 0, Math.PI * 2); g.fill();
    // ręce: jedna macha
    const wave = Math.sin(t * (cheer > 0 ? 14 : 4)) * 0.5;
    g.save(); g.translate(x + u * 0.12, y - u * 0.56); g.rotate(-2.2 + wave);
    RR(g, -u * 0.04, 0, u * 0.08, u * 0.3, u * 0.04); fillStroke(g, '#9A6AD0', u, 0.015);
    g.beginPath(); g.arc(0, u * 0.32, u * 0.05, 0, Math.PI * 2); fillStroke(g, '#FFD8B8', u, 0.012);
    g.restore();
    g.save(); g.translate(x - u * 0.12, y - u * 0.56); g.rotate(0.3);
    RR(g, -u * 0.04, 0, u * 0.08, u * 0.28, u * 0.04); fillStroke(g, '#9A6AD0', u, 0.015);
    g.restore();
    // głowa
    g.beginPath(); g.arc(x, y - u * 0.78, u * 0.17, 0, Math.PI * 2); fillStroke(g, '#FFE0C8', u);
    g.beginPath(); g.arc(x, y - u * 0.86, u * 0.17, Math.PI * 1.05, Math.PI * 1.95); fillStroke(g, '#E4E4EC', u, 0.015);
    g.beginPath(); g.arc(x, y - u * 1.02, u * 0.08, 0, Math.PI * 2); fillStroke(g, '#E4E4EC', u, 0.015);
    // okulary i uśmiech
    g.strokeStyle = '#5A3A2A'; g.lineWidth = u * 0.015;
    for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * u * 0.065, y - u * 0.78, u * 0.045, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.moveTo(x - u * 0.02, y - u * 0.78); g.lineTo(x + u * 0.02, y - u * 0.78); g.stroke();
    g.fillStyle = '#3A2A1A'; for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * u * 0.065, y - u * 0.78, u * 0.013, 0, Math.PI * 2); g.fill(); }
    g.beginPath(); g.arc(x, y - u * 0.72, u * 0.05, 0.2, Math.PI - 0.2); g.stroke();
    g.fillStyle = 'rgba(255,120,140,0.45)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * u * 0.11, y - u * 0.72, u * 0.03, u * 0.018, 0, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }

  // ---------------------------------------------------------------- scena
  function layout(W, H) {
    const portrait = H >= W;
    const u = portrait ? Math.min(W * 0.2, H * 0.11) : Math.min(H * 0.17, W * 0.1);
    const hor = H * (portrait ? 0.27 : 0.32);
    const houseP = portrait ? { x: W * 0.3, y: hor + H * 0.05 } : { x: W * 0.24, y: hor + H * 0.06 };
    const pos = { house: houseP, granny: { x: houseP.x + u * (portrait ? 1.25 : 1.15), y: houseP.y + u * 0.15 } };
    for (const k in ITEMS) { const p = ITEMS[k][portrait ? 'P' : 'L']; pos[k] = { x: p[0] * W, y: p[1] * H, s: p[2] }; }
    return { portrait, u, hor, pos };
  }

  // owned: Set nazw elementów; reveal: {kind, k}; extra: {cheer, next}
  function draw(g, W, H, t, owned, reveal, extra = {}) {
    const lay = layout(W, H);
    const { u, pos } = lay;
    background(g, W, H, t, lay.portrait);
    // warstwa „ziemi”
    const isShown = (k) => owned.has(k) || (reveal && reveal.kind === k);
    for (const k of ['path', 'pond']) if (isShown(k)) drawItem(g, k, lay, t, W, H, reveal);
    house(g, pos.house.x, pos.house.y, u, t);
    const list = Object.keys(ITEMS).filter((k) => !ITEMS[k].layer && isShown(k));
    const actors = [{ y: pos.granny.y, fn: () => granny(g, pos.granny.x, pos.granny.y, u, t, extra.cheer || 0) }];
    if (extra.actors) extra.actors(actors, lay);
    const all = list.map((k) => ({ y: pos[k].y, fn: () => drawItem(g, k, lay, t, W, H, reveal) })).concat(actors);
    // tabliczka „wkrótce” przy następnej nagrodzie
    if (extra.next && !owned.has(extra.next) && !(reveal && reveal.kind === extra.next)) {
      const p = pos[extra.next];
      all.push({ y: p.y, fn: () => sign(g, p.x, p.y, u * 0.8, t) });
    }
    all.sort((a, b) => a.y - b.y).forEach((o) => o.fn());
    if (isShown('fence')) drawItem(g, 'fence', lay, t, W, H, reveal);
    if (isShown('garland')) drawItem(g, 'garland', lay, t, W, H, reveal);
    return lay;
  }

  function drawItem(g, k, lay, t, W, H, reveal) {
    const p = lay.pos[k];
    const u = lay.u * p.s;
    g.save();
    if (reveal && reveal.kind === k) {
      const q = reveal.k;
      if (q < 0) { g.restore(); return; }
      // spada z góry, odbija się i sprężynuje
      const fall = Math.min(1, q / 0.35);
      const dy = -(1 - fall * fall) * H * 0.7;
      let sx = 1, sy = 1;
      if (q >= 0.35) { const b = (q - 0.35) / 0.5; const e = Math.exp(-4 * b) * Math.cos(b * 14); sx = 1 + 0.18 * e; sy = 1 - 0.18 * e; }
      g.translate(p.x, p.y + dy);
      g.scale(sx, sy);
      g.translate(-p.x, -p.y);
    }
    ITEMS[k].draw(g, p.x, p.y, u, t, W, H, lay.pos);
    g.restore();
  }

  function sign(g, x, y, u, t) {
    const sw = Math.sin(t * 2) * 0.05;
    g.save(); g.translate(x, y); g.rotate(sw);
    RR(g, -u * 0.04, -u * 0.6, u * 0.08, u * 0.6, u * 0.02); fillStroke(g, '#8A5A30', u);
    RR(g, -u * 0.3, -u * 0.86, u * 0.6, u * 0.34, u * 0.05); fillStroke(g, '#E8C890', u);
    g.fillStyle = '#7A3A1A'; g.font = `700 ${u * 0.24}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, -u * 0.69);
    g.restore();
  }

  // ikonka nagrody (np. na ekranie wygranej): rysuje element w ramce w*h
  function icon(g, kind, cx, cy, size, t) {
    const it = ITEMS[kind];
    if (!it) return;
    g.save();
    const u = size * (kind === 'fence' || kind === 'garland' || kind === 'path' ? 0.5 : kind.includes('tree') || kind === 'gazebo' || kind === 'swing' || kind === 'sunflowers' || kind === 'birdhouse' ? 0.5 : 0.75);
    const base = cy + size * 0.42;
    g.beginPath(); g.arc(cx, cy, size * 0.62, 0, Math.PI * 2); g.clip();
    g.fillStyle = lin(g, 0, cy - size, 0, cy + size, [[0, '#CFEFFF'], [0.55, '#E8F8D8'], [0.56, '#9AD86A'], [1, '#6ABE48']]);
    g.fillRect(cx - size, cy - size, size * 2, size * 2);
    if (kind === 'fence') it.draw(g, cx, base, u, t, size * 1.3);
    else if (kind === 'garland') it.draw(g, cx, cy - size * 0.2, u, t, size * 1.4);
    else if (kind === 'path') { const pos = { house: { x: cx - size * 0.1, y: cy - size * 0.3 } }; it.draw(g, cx + size * 0.1, base, u, t, size, size, pos); }
    else it.draw(g, cx, base, u, t, size, size);
    g.restore();
  }

  window.Garden = { ITEMS, draw, icon, layout };
})();
