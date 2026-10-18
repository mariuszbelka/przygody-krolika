//@@ drawEnemies
  function drawEnemies() {
    for (const enemy of game.enemies) {
      if (!enemy.pooped && (enemy.hitPause > 0 || enemy.counter) && Math.floor(game.frame / 3) % 2 === 0) continue;
      const hopper = enemy.kind === 'hopper';
      const grounded = enemy.standingPlatform >= 0;
      const bossWarn = enemy.boss && enemy.ai === 'telegraph' && !enemy.pooped;
      const hopWarn = hopper && grounded && enemy.hopTimer < 14 && !enemy.pooped && enemy.hitPause <= 0;
      let drawX = enemy.x - game.cameraX;
      const drawY = snap(enemy.y);
      if (bossWarn || hopWarn) drawX += (Math.floor(game.frame / 2) % 2 ? 2 : -2);
      drawX = snap(drawX);
      if (drawX + enemy.w < -40 || drawX > BASE_W + 40) continue;
      if (grounded) {
        ctx.fillStyle = 'rgba(20,12,40,0.25)';
        ctx.fillRect(drawX + 6 * enemy.scale, drawY + enemy.h - 2, enemy.w - 12 * enemy.scale, 4);
      } else if (enemy.kind === 'bee') {
        ctx.fillStyle = 'rgba(20,12,40,0.12)';
        ctx.fillRect(drawX + 12, drawY + enemy.h + 30, enemy.w - 24, 3);
      }
      const kind = enemy.boss ? 'boss' : enemy.kind;
      let state = 'walk';
      if (enemy.pooped) state = 'stun';
      else if (bossWarn || hopWarn || enemy.throwWarn) state = 'warn';
      else if (!grounded && enemy.kind !== 'bee') state = 'air';
      const surface = buildForestEnemy(kind, enemy.walkFrame, state);
      if (enemy.boss && enemy.ai === 'charge') {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let index = 0; index < 4; index += 1) {
          ctx.fillRect(snap(drawX + (enemy.chargeDir > 0 ? -20 - index * 16 : enemy.w + 8 + index * 16)), snap(drawY + 20 + index * 14), 12, 4);
        }
      }
      drawArtFootprint({ c: surface, ox: 5, oy: 7, fw: 24, fh: 21 }, drawX, drawY, enemy.w, enemy.h, enemy.kind === 'bee' || enemy.kind === 'hedgehog' || enemy.kind === 'squirrel' ? enemy.facingLeft : enemy.facingLeft);
      if (enemy.pooped) {
        for (let index = 0; index < 3; index += 1) {
          const angle = game.frame * 0.11 + index * 2.1;
          const sx = snap(drawX + enemy.w / 2 + Math.cos(angle) * 18 * enemy.scale);
          const sy = snap(drawY - 8 + Math.sin(angle) * 5);
          ctx.fillStyle = '#FFE36E';
          ctx.fillRect(sx - 2, sy - 6, 4, 12);
          ctx.fillRect(sx - 6, sy - 2, 12, 4);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(sx - 2, sy - 2, 4, 4);
        }
      }
      if (bossWarn) {
        const bx = snap(drawX + enemy.w / 2);
        const by = drawY - 60;
        const pulse = Math.floor(game.frame / 6) % 2 ? 2 : 0;
        drawPanel(bx - 14 - pulse, by - 18 - pulse, 28 + pulse * 2, 34 + pulse * 2, '#FF4A4A', '#FFB0B0', 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(bx - 2, by - 12, 4, 14);
        ctx.fillRect(bx - 2, by + 6, 4, 4);
      }
      if (enemy.boss) {
        const lx = snap(drawX + enemy.w / 2);
        const ly = drawY - 34;
        const pw = enemy.maxHp * 28 + 12;
        drawPanel(lx - pw / 2, ly - 14, pw, 30, 'rgba(14,10,30,0.82)', 'rgba(255,180,180,0.35)', 4);
        for (let index = 0; index < enemy.maxHp; index += 1) {
          drawItemArt(index < enemy.hp ? 'heart' : 'heartEmpty', lx - pw / 2 + 8 + index * 28, ly - 10, 2);
        }
      }
    }
  }
//@@ drawDefeated
  function drawDefeated() {
    for (const body of game.defeated) {
      const surface = buildForestEnemy(body.kind === 'boss' ? 'boss' : (body.kind || 'walker'), 0, 'stun');
      ctx.save();
      ctx.translate(body.x - game.cameraX + body.w / 2, body.y + body.h / 2);
      ctx.rotate(body.rot);
      ctx.globalAlpha = 0.75;
      const k = body.w / 24;
      ctx.drawImage(surface, -body.w / 2 - 5 * k, -body.h / 2 - 7 * k, surface.width * k, surface.height * k);
      ctx.restore();
      if (game.frame % 3 === 0) {
        game.particles.push({ x: body.x + body.w / 2 + (Math.random() - 0.5) * body.w, y: body.y + body.h / 2, vx: 0, vy: -1, color: '#FFF6A8', life: 18, size: 3 });
      }
    }
  }
//@@ drawRollers
  function drawRollers() {
    for (const r of game.rollers) {
      const x = r.x - game.cameraX;
      if (x < -40 || x > BASE_W + 40) continue;
      if (r.kind === 'yarn') {
        const cx = snap(x + 14);
        const cy = snap(r.y + 14);
        ctx.fillStyle = '#5A2A4A';
        ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#C86AA8';
        ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#F4C8E8';
        for (let k = 0; k < 5; k += 1) { const a = r.rot + k * 1.25; ctx.fillRect(snap(cx + Math.cos(a) * 6) - 2, snap(cy + Math.sin(a) * 6) - 2, 4, 4); }
        continue;
      }
      const frame = Math.floor(r.rot * 4 / Math.PI) % 4;
      const art = MECH_ART.get(`${r.kind}${(frame + 4) % 4}`);
      ctx.drawImage(art, snap(x - 2), snap(r.y - 2), art.width * ART, art.height * ART);
    }
  }
//@@ updateBossAI
  function updateBossAI(enemy, grounded) {
    const player = game.player;
    const rage = enemy.maxHp - enemy.hp;
    if (enemy.counter && enemy.ai !== 'leap' && enemy.ai !== 'telegraph') enemy.counter = false;
    if (enemy.counter) enemy.pooped = false;
    const phase = enemy.hp > 4 ? 1 : enemy.hp > 2 ? 2 : 3;
    if (enemy.lastPhase !== phase) {
      if (enemy.lastPhase) setNotice(phase === 2 ? 'Król się złości! Fale przy lądowaniu – podskocz nad nimi!' : 'Ostatnia faza! Król przywołuje muchomorki.', '#FFB5B5', 220, 4, `FAZA ${phase}`);
      enemy.lastPhase = phase;
    }
    const playerCenter = player.x + PLAYER_W / 2;
    const bossCenter = enemy.x + enemy.w / 2;
    const toward = playerCenter < bossCenter ? -1 : 1;
    enemy.aiTimer -= 1;
    switch (enemy.ai) {
      case 'patrol': {
        const speed = enemy.vx + rage * 0.22;
        enemy.x += enemy.facingLeft ? -speed : speed;
        if (enemy.aiTimer <= 0 && grounded && Math.abs(playerCenter - bossCenter) < 600) {
          enemy.ai = 'telegraph';
          enemy.aiTimer = Math.max(26, 50 - rage * 5);
          enemy.facingLeft = toward < 0;
          enemy.chargeDir = toward;
          audio.cue('meow');
          if (phase >= 2 && Math.random() < 0.5) bossVolley(enemy);
        }
        break;
      }
      case 'telegraph':
        if (enemy.aiTimer <= 0) {
          enemy.counter = false;
          if (phase === 3 && Math.random() < 0.35) bossSummon(enemy);
          if (rage >= 1 && Math.random() < (phase >= 2 ? 0.55 : 0.4)) {
            enemy.ai = 'leap';
            enemy.vy = -10.5 - (phase === 3 ? 1.2 : 0);
            enemy.airborne = true;
            enemy.leapVx = toward * (2.3 + rage * 0.35);
            enemy.facingLeft = toward < 0;
            enemy.leapsLeft = phase === 3 ? 1 : 0;
          } else {
            enemy.ai = 'charge';
            enemy.aiTimer = 90;
          }
        }
        break;
      case 'charge': {
        enemy.x += enemy.chargeDir * (3.3 + rage * 0.45);
        if (game.frame % 3 === 0) emitDust(enemy.x + (enemy.chargeDir > 0 ? 0 : enemy.w), enemy.y + enemy.h - 4, 2);
        const hitWall = enemy.x <= enemy.minX || enemy.x + enemy.w >= enemy.maxX;
        if (hitWall || enemy.aiTimer <= 0) {
          enemy.ai = 'recover';
          enemy.aiTimer = phase === 1 ? 54 : 40;
          if (hitWall) { triggerShake(4, 8); if (phase >= 2) bossShockwave(enemy); }
        }
        break;
      }
      case 'leap':
        enemy.x += enemy.leapVx;
        if (enemy.aiTimer < -200) {
          enemy.ai = 'recover';
          enemy.aiTimer = 40;
        }
        break;
      default:
        if (enemy.aiTimer <= 0) {
          enemy.ai = 'patrol';
          enemy.aiTimer = Math.max(50, 130 - rage * 16);
          enemy.facingLeft = toward < 0;
        }
        break;
    }
    if (enemy.x <= enemy.minX) {
      enemy.x = enemy.minX;
      enemy.facingLeft = false;
    }
    if (enemy.x + enemy.w >= enemy.maxX) {
      enemy.x = enemy.maxX - enemy.w;
      enemy.facingLeft = true;
    }
  }
