import re, sys
from jspatch import replace_func, sub1

SRC = '/home/claude/przygody-krolika/przygoda1/index.html'
OUT = '/home/claude/przygody-krolika/przygoda3/index.html'

def sections(path):
    text = open(path, encoding='utf-8').read()
    parts = re.split(r'^//@@ (\w+)\n', text, flags=re.M)
    return [(parts[i], parts[i+1]) for i in range(1, len(parts), 2)]

src = open(SRC, encoding='utf-8').read()

# --- poziomy ---
a = src.index("  const LEVELS = [")
b = src.index("\n  ];\n", a) + len("\n  ];\n")
src = src[:a] + open('p3_levels.js', encoding='utf-8').read() + src[b:]

# --- motywy ---
src = sub1(src, "  const THEME_ORDER = ['meadow', 'hills', 'forest', 'sky', 'stream', 'garden', 'castle', 'boss'];",
           "  const THEME_ORDER = ['glade', 'canopy', 'bramble', 'windfall', 'mushking', 'marsh', 'mistbog', 'mudrun', 'toadpond', 'nightwood', 'roots', 'lichorun', 'lichotree'];")
src = sub1(src, "  function theme() {\n", """  Object.assign(THEMES, {
    glade: { sky: ['#8FD3EE', '#EAF8DA'], sun: '#FFF3B0', far: '#9CCB9E', mid: '#6FAE6E', near: '#4A8E52', grass: '#6CC24E', grassHi: '#A2E46E', grassDark: '#3A8A36', dirt: '#8A5A30', dirtDark: '#5E3A1C', stone: '#B08A5E', trunk: '#6A4428', leaf: '#4E9A56', leafHi: '#7CC478', deco: 'forest', blobs: 'flower', critters: 'butterflies' },
    canopy: { sky: ['#7EC4EE', '#F4F6DA'], sun: '#FFF6C8', far: '#B8DCC0', mid: '#7FBF86', near: '#4E9A5A', grass: '#7ACF5A', grassHi: '#B0EC80', grassDark: '#3E8E3A', dirt: '#7A5232', dirtDark: '#52341C', stone: '#A0805A', trunk: '#6E4A2C', leaf: '#5AAA5E', leafHi: '#8AD47E', deco: 'forest', blobs: 'leaf', critters: 'birds' },
    bramble: { sky: ['#9CCFC0', '#F6EDC8'], sun: '#FFE9A0', far: '#9AB894', mid: '#6E9A62', near: '#46743E', grass: '#5DAE48', grassHi: '#92D46E', grassDark: '#2F6E2E', dirt: '#7A4E2C', dirtDark: '#4E2E16', stone: '#9A7A56', trunk: '#5A3A22', leaf: '#3E7A48', leafHi: '#B84A6A', deco: 'forest', blobs: 'petal', critters: 'butterflies' },
    windfall: { sky: ['#5E7A92', '#C0CCB8'], rain: true, blobs: 'leaf', far: '#7A9A8C', mid: '#557A62', near: '#365A44', grass: '#5AA448', grassHi: '#88CC66', grassDark: '#2E6A32', dirt: '#6E4A2C', dirtDark: '#4A2E18', stone: '#8E7458', trunk: '#4E3420', leaf: '#3A6A4A', leafHi: '#C88A3A', deco: 'forest', critters: 'fireflies' },
    mushking: { sky: ['#14182E', '#3A2E52'], moon: true, far: '#2A3050', mid: '#222846', near: '#181C36', grass: '#4E8A5A', grassHi: '#7AB47E', grassDark: '#2E5A38', dirt: '#4E3E50', dirtDark: '#30263A', stone: '#6E6080', trunk: '#2E2438', leaf: '#2E4A48', leafHi: '#C86AA8', deco: 'forest', critters: 'fireflies' },
    marsh: { sky: ['#D88A6A', '#F6DEB0'], sun: '#FFD08A', far: '#9AA88A', mid: '#6E8A66', near: '#4A6A4A', grass: '#6A9A48', grassHi: '#9AC46A', grassDark: '#3A6A32', dirt: '#6A4A2E', dirtDark: '#463018', stone: '#8A8070', trunk: '#4A3A28', leaf: '#4A7A52', leafHi: '#C8A05A', deco: 'stream', water: true, mist: true, critters: 'fireflies' },
    mistbog: { sky: ['#8A9A9A', '#D6E0DA'], far: '#A8B8B0', mid: '#80988C', near: '#5A7466', grass: '#5E8E4E', grassHi: '#8AB872', grassDark: '#36603A', dirt: '#5E4A34', dirtDark: '#3E3020', stone: '#8A8A80', trunk: '#3E3428', leaf: '#4A6A58', leafHi: '#9AB89A', deco: 'forest', water: true, mist: true, critters: 'fireflies' },
    mudrun: { sky: ['#9A6A50', '#E2C29A'], sun: '#FFC27A', rain: true, far: '#8A8A72', mid: '#66705A', near: '#46523E', grass: '#5E8E44', grassHi: '#8AB866', grassDark: '#36602E', dirt: '#6A4A2C', dirtDark: '#463016', stone: '#8A7860', trunk: '#4A3420', leaf: '#4A6A42', leafHi: '#B8884A', deco: 'forest', water: true, critters: 'birds' },
    toadpond: { sky: ['#2E2840', '#7A6A70'], moon: true, far: '#4A4A5A', mid: '#3A3E4A', near: '#2A3036', grass: '#4E7A4A', grassHi: '#7AA070', grassDark: '#2E4E30', dirt: '#4E4036', dirtDark: '#302822', stone: '#6E6A66', trunk: '#2E2A26', leaf: '#3A4E44', leafHi: '#9AB070', deco: 'stream', water: true, mist: true, critters: 'fireflies' },
    nightwood: { sky: ['#0E1430', '#2E3058'], moon: true, far: '#262C50', mid: '#1E2444', near: '#151A34', grass: '#3E6E4E', grassHi: '#6A9A72', grassDark: '#24442E', dirt: '#3E3446', dirtDark: '#28202E', stone: '#5E5870', trunk: '#241E30', leaf: '#243C40', leafHi: '#4E7A6A', deco: 'forest', critters: 'fireflies' },
    roots: { sky: ['#160E2A', '#3E2A5A'], moon: true, far: '#2E2248', mid: '#241A3C', near: '#1A1230', grass: '#3E6A4E', grassHi: '#6A9A72', grassDark: '#243E2E', dirt: '#3E2E46', dirtDark: '#281E2E', stone: '#5E4E70', trunk: '#2A1A30', leaf: '#2A3A44', leafHi: '#9A6AC8', deco: 'forest', critters: 'fireflies' },
    lichorun: { sky: ['#120A24', '#3A1A4A'], moon: true, rain: true, far: '#2A1E44', mid: '#22183A', near: '#181028', grass: '#3A624A', grassHi: '#64946C', grassDark: '#223A2A', dirt: '#3A2A40', dirtDark: '#261A2A', stone: '#5A4A6A', trunk: '#26182C', leaf: '#2A3440', leafHi: '#C89AFF', deco: 'forest', critters: 'fireflies' },
    lichotree: { sky: ['#08061A', '#2A1640'], moon: true, far: '#22183A', mid: '#1A1230', near: '#120C24', grass: '#3A6248', grassHi: '#64946C', grassDark: '#203828', dirt: '#3A2A40', dirtDark: '#24182A', stone: '#5A4A6A', trunk: '#22142A', leaf: '#263040', leafHi: '#C89AFF', deco: 'forest', critters: 'fireflies' }
  });


  function theme() {
""")
src = sub1(src, "  const SONG_FOR = [['a', 0], ['b', 0], ['c', -2], ['b', 5], ['a', -3], ['b', 2], ['c', 0], ['boss', 0]];",
           "  const SONG_FOR = [['a', 2], ['b', 0], ['c', -2], ['b', 7], ['boss', 0], ['c', 3], ['a', -2], ['b', 5], ['boss', 3], ['c', -5], ['a', -4], ['b', 3], ['boss', -2]];")
src = sub1(src, "  const MAP_NODES = [[96, 392], [206, 330], [318, 394], [420, 312], [512, 384], [612, 300], [700, 360], [724, 192]];",
           "  const MAP_NODES = [[70, 404], [150, 334], [250, 394], [340, 320], [430, 382], [520, 436], [600, 382], [690, 440], [744, 362], [664, 292], [584, 236], [652, 180], [730, 222]];")
src = sub1(src, "  const MAP_COLORS = ['#7BD45A', '#F2A65A', '#3E9A5A', '#8FC8FF', '#4AA0E0', '#F28AB8', '#A39AB2', '#9A6CF0'];",
           "  const MAP_COLORS = ['#7BD45A', '#8FCB5A', '#C8784A', '#E8A43A', '#E9473F', '#C89A5A', '#8AA8A0', '#9A6A3E', '#6E8A3A', '#4A5A9A', '#7A5AB8', '#9A4AC8', '#C89AFF'];")
src = sub1(src, "    hi: 'PuszekV2Hi',", "    hi: 'PuszekP3Hi',")
src = sub1(src, "    stars: 'PuszekV3Progress'", "    stars: 'PuszekP3Progress'")

# --- kod P3 ---
src = sub1(src, "\n  buildMechArt();\n", "\n  buildMechArt();\n" + open('p3_add.js', encoding='utf-8').read() + "\n")
for name, code in sections('p3_draw.js'):
    src = replace_func(src, name, code)

# wrogowie
src = sub1(src, "    const baseSpeed = spawn.boss ? 1.16 : (hopper ? 0.72 : 0.88 + levelIndex * 0.03);", "    const baseSpeed = enemyBaseSpeed(spawn, levelIndex);")
src = sub1(src, "  function updateEnemies() {\n    for (const enemy of game.enemies) {\n", "  function updateEnemies() {\n    for (const enemy of game.enemies) {\n      if (enemy.kind === 'bee') { updateBee(enemy); continue; }\n")
src = sub1(src, "        enemy.x += enemy.facingLeft ? -enemy.vx : enemy.vx;\n        let turned = false;",
           "        if (enemy.kind === 'squirrel') updateSquirrel(enemy, grounded);\n        enemy.x += enemy.facingLeft ? -enemy.vx : enemy.vx;\n        let turned = false;")
src = sub1(src, "      if (falling) {\n        player.vy = -10;\n        player.airJumps = 1;\n        player.coyote = 0;\n        stompEnemy(enemy, enemy.boss ? 200 : 50,",
           "      if (enemy.kind === 'hedgehog' && !player.pounding) {\n        if (player.invul <= 0) damagePlayer('jez');\n        player.vy = -7;\n        return;\n      }\n\n      if (falling) {\n        player.vy = -10;\n        player.airJumps = 1;\n        player.coyote = 0;\n        stompEnemy(enemy, enemy.boss ? 200 : 50,")
src = sub1(src, "    if (enemy.hp <= 0) {\n      game.defeated.push({\n", "    if (enemy.hp <= 0) {\n      p3Disenchant(enemy);\n      game.defeated.push({\n        kind: enemy.kind,\n")

# obrażenia
src = sub1(src, "    if (kind !== 'pit' && player.invul > 0) return;\n    game.lives -= 1;",
           """    if (kind !== 'pit' && player.invul > 0) return;
    if (kind !== 'pit' && player.bubble > 0) {
      player.bubble = 0;
      player.invul = 80;
      audio.cue('stomp');
      emitSpark(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, '#A8E0FF', 18);
      popup(player.x - game.cameraX + PLAYER_W / 2, Math.max(60, player.y - 10), 'BAŃKA!', '#A8E0FF');
      return;
    }
    game.lives -= 1;
    if (kind !== 'pit') scatterAcorns(player);""")
src = sub1(src, "    } else if (kind === 'kapusta') {", """    } else if (kind === 'jez') {
      setNotice('Jeż ma kolce! Bobek, zryw albo tupnięcie – nie skacz mu na grzbiet.', '#FFBBBB', 170, 3, 'AU!');
    } else if (kind === 'szyszka') {
      setNotice('Szyszka! Wiewiórki celują – rób uniki.', '#FFBBBB', 140, 3, 'AU!');
    } else if (kind === 'wiatrolom') {
      setNotice('Pień cię dogonił! Biegnij dalej w prawo!', '#FFBBBB', 140, 3, 'AU!');
    } else if (kind === 'kapusta') {""")

# bohater
src = sub1(src, "    if (!canGroundJump && player.airJumps <= 0) return false;\n    const strength = player.powerFrames > 0 ? JUMP_FORCE * 1.20 : JUMP_FORCE;",
           "    if (!canGroundJump && (player.airJumps <= 0 || HERO === 'C')) return false;\n    const strength = (player.powerFrames > 0 ? JUMP_FORCE * 1.20 : JUMP_FORCE) * (HERO === 'C' ? 1.08 : 1);")
src = sub1(src, "  function fireBobek() {\n    if (game.scene !== 'PLAYING') return false;\n", "  function fireBobek() {\n    if (game.scene !== 'PLAYING') return false;\n    if (HERO === 'C') return startDash(game.player);\n")
src = sub1(src, "      const cap = player.powerFrames > 0 ? MOVE_SPEED * 1.22 : MOVE_SPEED;", "      const cap = (player.powerFrames > 0 ? MOVE_SPEED * 1.22 : MOVE_SPEED) * heroSpeed();")
src = sub1(src, "    player.rolling = player.powerFrames > 0 && player.onGround && Math.abs(player.vx) > 1.55;", "    player.rolling = (player.powerFrames > 0 && player.onGround && Math.abs(player.vx) > 1.55) || player.dash > 0;")
src = sub1(src, "    if (player.boost > 0) player.boost -= 1;\n    const gravity = player.vy < 0 ?", "    p3PlayerMotion(player);\n    if (player.boost > 0) player.boost -= 1;\n    const gravity = player.p3NoGravity ? 0 : player.vy < 0 ?")
src = sub1(src, """    const canvasArt = buildRabbit(rabbitPoseFor(player));
    ctx.save();
    if (ghost) ctx.globalAlpha = 0.4;
    drawArtFootprint({ c: canvasArt, ox: RABBIT_CANVAS.ox, oy: RABBIT_CANVAS.oy, fw: 24, fh: 24 }, drawX, drawY, PLAYER_W, PLAYER_H, player.facingLeft);
    ctx.restore();""", """    if (HERO === 'C') {
      drawPersiHero(player, drawX, drawY, ghost);
    } else {
      const canvasArt = buildRabbit(rabbitPoseFor(player));
      ctx.save();
      if (ghost) ctx.globalAlpha = 0.4;
      drawArtFootprint({ c: canvasArt, ox: RABBIT_CANVAS.ox, oy: RABBIT_CANVAS.oy, fw: 24, fh: 24 }, drawX, drawY, PLAYER_W, PLAYER_H, player.facingLeft);
      ctx.restore();
    }""")

# poziom / pętla / kamera
src = sub1(src, "  function respawnPlayer() {\n    game.player = createPlayer(game.respawnX, game.respawnY);\n",
           "  function respawnPlayer() {\n    game.player = createPlayer(game.respawnX, game.respawnY);\n    if (game.level && game.level.chase) game.chaseX = game.respawnX - 340;\n")
src = sub1(src, "    game.windStreaks = [];\n    game.secrets =", "    game.windStreaks = [];\n    p3ResetLevel(source);\n    game.secrets =")
src = sub1(src, "    updatePickups();\n", "    updatePickups();\n    updateP3();\n")
src = sub1(src, "      if (dist < 56 && dist > 1) {\n        const pull = Math.min(1, 3.4 / dist);",
           "      const reach = game.magnet > 0 ? 240 : 56;\n      if (dist < reach && dist > 1) {\n        const pull = Math.min(1, (game.magnet > 0 ? 9 : 3.4) / dist);")
src = sub1(src, "      case 'heart':\n        if (game.lives < MAX_LIVES) {", """      case 'magnet':
        points = 25;
        game.magnet = 60 * 9;
        audio.cue('power');
        emitSpark(cx, cy, '#FF8A9A', 14);
        setNotice('Żołędzie same lecą do ciebie przez 9 sekund!', '#FFC8D0', 180, 3, 'MAGNES');
        break;
      case 'bubble':
        points = 25;
        game.player.bubble = 60 * 14;
        audio.cue('power');
        emitSpark(cx, cy, '#A8E0FF', 14);
        setNotice('Bańka obroni cię przed jednym trafieniem.', '#C8ECFF', 180, 3, 'BAŃKA');
        break;
      case 'heart':
        if (game.lives < MAX_LIVES) {""", count=2)
src = sub1(src, "    drawPlatforms();\n    drawGrassBlades(false);", "    drawPlatforms();\n    drawP3Back();\n    drawGrassBlades(false);")
src = sub1(src, "    drawRollers();\n    drawDefeated();", "    drawRollers();\n    drawP3Front();\n    drawDefeated();")
src = sub1(src, "    game.cameraX = clamp(game.cameraX, 0, game.level.worldWidth - BASE_W);\n  }",
           "    if (game.level.chase) game.cameraX = Math.max(game.cameraX, game.chaseX - 80);\n    game.cameraX = clamp(game.cameraX, 0, game.level.worldWidth - BASE_W);\n  }")

# ranking osobny dla części 3
src = sub1(src, "level_label=like.${encodeURIComponent(`[${EKIPA}]*`)}", "level_label=like.${encodeURIComponent(`[${EKIPA}] ${MODE_TAG()}*`)}")
src = sub1(src, "level_label: EKIPA_TAG + (", "level_label: EKIPA_TAG + MODE_TAG() + (")

# menu: wybór bohatera
src = sub1(src, '        <div id="menuActionRow">', """        <div id="heroRow"><button type="button" data-hero="P">PUSZEK</button><button type="button" data-hero="C">PERSI</button></div>
        <div id="modeRow"><button type="button" data-mode="S">SPOKOJNIE</button><button type="button" data-mode="C">CZADOWO</button></div>
        <div id="heroCap"></div>
        <div id="menuActionRow">""")
src = sub1(src, ".hidden { display:none !important; }\n</style>", """#heroRow { display:flex; gap:8px; }
#heroRow button { flex:1; height:40px; border-radius:12px; border:2px solid rgba(255,255,255,0.25); background:rgba(20,30,40,0.8); color:#DDE8F0;
  font:700 15px "Fredoka","Trebuchet MS",sans-serif; letter-spacing:1px; cursor:pointer; }
#heroRow button.on { background:linear-gradient(180deg,#FFD86A 0%,#E8A42A 100%); color:#2A1A06; border-color:#FFF2B0; }
#modeRow { display:flex; gap:8px; }
#modeRow button { flex:1; height:30px; border-radius:10px; border:2px solid rgba(255,255,255,0.2); background:rgba(20,30,40,0.7); color:#C8D8E4;
  font:700 12px "Fredoka","Trebuchet MS",sans-serif; letter-spacing:1px; cursor:pointer; }
#modeRow button.on { background:linear-gradient(180deg,#9AE0FF 0%,#4AA0E0 100%); color:#06223A; border-color:#D8F4FF; }
#heroCap { min-height:30px; font:600 12px "Fredoka","Trebuchet MS",sans-serif; color:#E8F4D8; text-align:center; line-height:1.25; }
.hidden { display:none !important; }
</style>""")
src = re.sub(r'<div id="p2link".*?</div>', '<div style="display:flex;justify-content:center;gap:14px;padding:2px 0;font:700 12px Fredoka,sans-serif;"><a class="keepq" href="../" style="color:#D9F0FF;text-decoration:none;">⌂ Wszystkie gry</a><a class="keepq" href="../przygoda1/" style="color:#FFE680;text-decoration:none;">Przygoda 1</a><a class="keepq" href="../przygoda2/" style="color:#FFE680;text-decoration:none;">Przygoda 2</a></div>', src, count=1)
src = sub1(src, "<title>Puszek i marchewki kontra Persi</title>", "<title>Puszek i Persi: Zaczarowany Las</title>")


# P3: podpowiedzi zależne od bohatera, ikonka postępu
src = sub1(src, "    const rabbitIcon = buildRabbit({ state: 'run', phase: (game.frame % 32) / 32, ear: -0.4, blink: false, sx: 1, sy: 1 });",
           "    const rabbitIcon = HERO === 'C' ? buildCat('walker', Math.floor(game.frame / 8) % 2, 'walk') : buildRabbit({ state: 'run', phase: (game.frame % 32) / 32, ear: -0.4, blink: false, sx: 1, sy: 1 });")
src = src.replace("'◀ LEWO i PRAWO ▶ prowadzą Puszka.'", "'◀ LEWO i PRAWO ▶ prowadzą ' + (HERO === 'C' ? 'Persiego.' : 'Puszka.')")
src = src.replace("'A / D albo strzałki prowadzą Puszka.'", "'A / D albo strzałki prowadzą ' + (HERO === 'C' ? 'Persiego.' : 'Puszka.')")
src = src.replace("'W locie ▼ TUP – Puszek tupie w ziemię.'", "'W locie ▼ TUP – ' + HERO_NAME() + ' tupie w ziemię.'")
src = src.replace("'W locie ↓ lub S – Puszek tupie w ziemię.'", "'W locie ↓ lub S – ' + HERO_NAME() + ' tupie w ziemię.'")
src = sub1(src, "    if (game.ammo > 0 && !game.guide.shootDone) {\n      return {\n        title: 'MASZ BOBKA',",
           "    if (HERO === 'C' && !game.guide.shootDone) {\n      return { title: 'ZRYW Z PAZURKAMI', lines: SHOW_TOUCH_UI ? ['BOBEK – u Persiego to zryw do przodu.', 'Zryw przebija wrogów i szyszki.'] : ['X albo Shift – zryw z pazurkami.', 'Zryw przebija wrogów i szyszki.'] };\n    }\n    if (game.ammo > 0 && !game.guide.shootDone) {\n      return {\n        title: 'MASZ BOBKA',")


src = sub1(src, "      if (player.rolling) {\n        player.vy = -7;", """      if (enemy.boss && player.dash > 0) {
        player.dash = 0;
        player.vx = player.x < enemy.x ? -5 : 5;
        player.vy = -6;
        if (!game.guide.bossDashShown) {
          game.guide.bossDashShown = true;
          setNotice(`${BOSS().name} jest za duży na zryw – skacz na ${BOSS().head}!`, '#FFB5B5', 180, 3, 'HMM');
        }
        continue;
      }

      if (player.rolling) {
        player.vy = -7;""")
src = sub1(src, "for (const id in labels) { const el = document.getElementById(id); if (el) el.innerHTML = labels[id]; }",
           "for (const id in labels) { const el = document.getElementById(id); if (el) el.innerHTML = (id === 'mobileShootBtn' && HERO === 'C') ? 'ZRYW' : labels[id]; }")


src = sub1(src, """    const [bx, by] = MAP_NODES[7];
    const sleeper = buildCatPose('boss', 'sleep', Math.floor(t / 40) % 2);
    drawArtFootprint({ c: sleeper, ox: CAT_CANVAS.ox, oy: CAT_CANVAS.oy, fw: 24, fh: 21 }, bx + 22, by - 30, 36, 31.5, true);""",
"""    const [bx, by] = MAP_NODES[MAP_NODES.length - 1];
    const sleeper = buildForestEnemy('boss', Math.floor(t / 40) % 2, 'walk');
    drawArtFootprint({ c: sleeper, ox: 5, oy: 7, fw: 24, fh: 21 }, bx + 22, by - 30, 36, 31.5, true);""")
src = sub1(src, """    drawArtFootprint({ c: rabbit, ox: RABBIT_CANVAS.ox, oy: RABBIT_CANVAS.oy, fw: 24, fh: 24 }, snap(px - 18), snap(py - 40), 36, 36, tx < fx);""",
"""    if (HERO === 'C') {
      const cat = moving ? buildCat('walker', 0, 'air') : buildCatPose('walker', 'sit');
      drawArtFootprint({ c: cat, ox: CAT_CANVAS.ox, oy: CAT_CANVAS.oy, fw: 24, fh: 21 }, snap(px - 18), snap(py - 34), 36, 32, tx < fx);
    } else {
      drawArtFootprint({ c: rabbit, ox: RABBIT_CANVAS.ox, oy: RABBIT_CANVAS.oy, fw: 24, fh: 24 }, snap(px - 18), snap(py - 40), 36, 36, tx < fx);
    }""")


# Grzybowy Król: twardszy
src = sub1(src, "    const hp = spawn.boss ? 3 : 1;", "    const hp = spawn.boss ? bossMaxHp(levelIndex) : 1;")
src = sub1(src, "          enemy.poopTimer = enemy.boss ? 140 : 180;", "          enemy.poopTimer = enemy.boss ? 75 : 180;")
src = sub1(src, """          if (enemy.ai === 'leap') {
            enemy.ai = 'recover';
            enemy.aiTimer = 46;
          }""", """          if (enemy.ai === 'leap') {
            if (bossPhase(enemy) >= 2 || game.level.bossKind === 'toad') bossShockwave(enemy);
            if (enemy.leapsLeft > 0) {
              enemy.leapsLeft -= 1;
              enemy.vy = -9.5;
              enemy.airborne = true;
              enemy.leapVx = (game.player.x < enemy.x ? -1 : 1) * 3;
            } else if (enemy.counter) {
              // po kontrze: od razu szykuje atak, nietykalny aż do szarży
              enemy.ai = 'telegraph';
              enemy.aiTimer = (bossPhase(enemy) === 3 ? 18 : 24) + (CALM() ? 14 : 0);
              enemy.chargeDir = game.player.x + PLAYER_W / 2 < enemy.x + enemy.w / 2 ? -1 : 1;
              enemy.facingLeft = enemy.chargeDir < 0;
            } else {
              enemy.ai = 'recover';
              enemy.aiTimer = 46;
            }
          }""")
src = sub1(src, "      if (player.rolling) {\n        player.vy = -7;", """      if (enemy.boss && player.rolling) {
        player.vx = player.x < enemy.x ? -5 : 5;
        player.vy = -6;
        continue;
      }

      if (player.rolling) {
        player.vy = -7;""")
src = sub1(src, "    drawP3Front();\n", "    drawP3Front();\n    drawBossExtras();\n")
src = src.replace("    } else if (kind === 'jez') {", """    } else if (kind === 'fala') {
      setNotice('Fala uderzeniowa! Podskocz, gdy sunie po ziemi.', '#FFBBBB', 150, 3, 'AU!');
    } else if (kind === 'jez') {""", 1)
src = sub1(src, "'Gdy pojawi się „!”, szykuje szarżę. Przeskocz go i wskocz mu na głowę 3 razy.'", "`Gdy pojawi się „!”, szykuje atak. Przeskocz go i skacz na ${BOSS().head} – ${bossMaxHp()} razy!`")


for name, code in sections('p3_map.js'):
    src = replace_func(src, name, code)
src = sub1(src, "    ctx.drawImage(mapArt, 0, 0, BASE_W, BASE_H);\n", """    ctx.drawImage(mapArt, 0, 0, BASE_W, BASE_H);
    ctx.save();
    ctx.textAlign = 'center';
    drawOutlinedText('DRZEWO LICHA', 704, 262, 'bold 15px "Fredoka", sans-serif', '#E8C8FF', '#1A1030', 4);
    drawOutlinedText('wkrótce', 704, 280, 'bold 12px "Fredoka", sans-serif', '#C8B0E8', '#1A1030', 3);
    drawOutlinedText('MOKRADŁA I MGŁA', 700, 342, 'bold 15px "Fredoka", sans-serif', '#D8F0EC', '#10302E', 4);
    drawOutlinedText('wkrótce', 700, 360, 'bold 12px "Fredoka", sans-serif', '#B8D8D4', '#10302E', 3);
    drawOutlinedText('POLANA GRZYBÓW', 130, 300, 'bold 15px "Fredoka", sans-serif', '#FFF2B0', '#2A3A10', 4);
    ctx.restore();
""")


src = sub1(src, """    enemy.hitPause = enemy.boss ? 56 : 44;
    enemy.pooped = false;
    if (enemy.boss) {
      enemy.ai = 'recover';
      enemy.aiTimer = 24;
    }""", """    enemy.hitPause = enemy.boss ? 10 : 44;
    enemy.pooped = false;
    if (enemy.boss) {
      // kontra: odskok od gracza, w 2. i 3. fazie z falą przy lądowaniu
      enemy.ai = 'leap';
      enemy.aiTimer = 0;
      enemy.counter = true;
      enemy.vy = enemy.airborne ? Math.max(enemy.vy, -3) : -10;
      enemy.airborne = true;
      enemy.leapVx = (game.player.x + PLAYER_W / 2 < enemy.x + enemy.w / 2 ? 1 : -1) * 5.2;
      enemy.facingLeft = enemy.leapVx < 0;
      enemy.leapsLeft = 0;
    }""")

# teksty
REPL = [
    ("'Kłębek spadł na głowę! Uciekaj spod cieni.'", "'Zarodnik trafił! Uciekaj spod cieni i przed salwami.'"),
    ("const title = 'PUSZEK I MARCHEWKI';", "const title = 'PUSZEK I PERSI';"),
    ("drawPixelText('kontra Persi',", "drawPixelText('Zaczarowany Las',"),
    ("'Wielki Persi zrzuca kłębki! Uciekaj spod cieni.'", "BOSS().drops"),
    ("'Wielki Persi jest za ciężki na tupnięcie. Wskocz mu na głowę!'", "`${BOSS().name} jest za ciężki na tupnięcie. Skacz na ${BOSS().head}!`"),
    ("'Wielki Persi odpuścił! Portal jest otwarty.'", "BOSS().freed"),
    ("'Persi z boku zabiera serce. Wskakuj mu na głowę!'", "'Z boku zabiera serce! Wskakuj wrogom na głowę.'"),
    ("'Persi ogłuszony! Wskocz mu na głowę za +100.'", "'Ogłuszony! Wskocz mu na głowę za +100.'"),
    ("'Każda marchewka to bobek do rzucania.'", "'Żołędzie to punkty – a Puszkowi dają bobki do rzucania.'"),
    ("'Brak bobków – zbieraj marchewki.'", "'Brak bobków – zbieraj żołędzie.'"),
    ("'Skaczesz wyżej. Rozpędź się po ziemi – Puszek zwinie się w taran!'", "'Turbo! Skaczesz wyżej, a rozpędzony wpadasz we wrogów jak taran.'"),
    ("'To Persi. Wskocz mu na głowę albo rzuć bobkiem (X).'", "'Zaczarowany muchomorek! Wskocz mu na głowę – odczarujesz go.'"),
    ("'Szary Persi skacze. Przebiegnij pod nim, gdy jest w górze.'", "'Żabka skacze. Przebiegnij pod nią, gdy jest w górze.'"),
    ("'Taran! Wpadaj w Persiego z boku.'", "'Taran! Wpadaj we wrogów z boku.'"),
    ("'Persi wygrał tym razem…'", "'Leśne Licho wygrało tym razem…'"),
    ("'Puszek jest bezpieczny i szczęśliwy!'", "'Cały Zaczarowany Las odczarowany! Świetliki znów świecą.'"),
    ("'Wszystkie diamenty z tego poziomu!'", "'Wszystkie słoiki ze świetlikami!'"),
    ("'Enter – start. Zbieraj gwiazdki: meta, diamenty, bez utraty serca.'", "'Wybierz bohatera i Enter. Gwiazdki: meta, słoiki, bez utraty serca.'"),
    ("'Gwiazdki: meta · wszystkie diamenty · bez utraty serca'", "'Gwiazdki: meta · wszystkie słoiki · bez utraty serca'"),
    ("`Diamenty ${stats.diamonds}/${stats.diamondsTotal}", "`Słoiki ${stats.diamonds}/${stats.diamondsTotal}"),
    ("['Marchewka = punkty i bobek.', 'Sałata = super skok i taran.', 'Diamenty = gwiazdka.']", "['Żołędzie = punkty (i bobki).', 'Turbo-marchew = skok i taran.', 'Słoiki ze świetlikami = gwiazdka.']"),
    ("['Rzut ogłusza Persiego.', 'Ogłuszonego przeskocz albo wskocz mu na głowę za +100.']", "['Bobek albo zryw ogłusza wroga.', 'Jeża nie skacz! Resztę odczarujesz skokiem na głowę.']"),
    ("'ZANIM PUSZEK RUSZY'", "'ZANIM RUSZYSZ'"),
    ("case 'carrot': return 'MARCHEWKA';", "case 'carrot': return 'ŻOŁĄDŹ';"),
    ("case 'golden': return 'ZŁOTA MARCHEW';", "case 'golden': return 'ZŁOTY ŻOŁĄDŹ';"),
    ("'ZŁOTA SAŁATA'", "'TURBO-MARCHEW'"),
    ("'Tak dosięgniesz wysokich marchewek.'", "'Tak dosięgniesz wysokich żołędzi.'"),
    ("'BOBEK ogłusza Persiego na kilka sekund.'", "'BOBEK ogłusza wroga na kilka sekund.'"),
    ("'Ogłuszonego Persiego wskocz: +100.'", "'Ogłuszonego wroga wskocz: +100.'"),
    ("Fala ogłusza Persich.", "Fala ogłusza wrogów."),
    ("'Puszek przecisnal sie przez ukryta scianke i odkryl skrytke.'", "HERO_NAME() + ' przecisnął się przez ukrytą ściankę i odkrył skrytkę.'"),
    ("'Puszek zgarnal prezenty ze skrytki.'", "HERO_NAME() + ' zgarnął prezenty ze skrytki.'"),
    ("'Puszek zlapal specjalna moc.'", "'Turbo-marchew!'"),
    ("Przez 8 sekund Puszek skacze wyzej.", "Przez 8 sekund skaczesz wyzej."),
    ("Puszek sam zwinie sie wtedy w taran.", "Wtedy wpadasz we wrogow jak taran."),
    ("W taranie wpadaj w Persiego z boku.", "W taranie wpadaj we wrogow z boku."),
]
for old, new in REPL:
    if old not in src:
        print('BRAK:', old[:70]); continue
    src = src.replace(old, new)

# --- kontra bossa: nietykalny aż do lądowania (anty-żonglerka w powietrzu) ---
src = sub1(src, """      if (enemy.hitPause > 0 && !enemy.pooped) continue;
      if (!overlap(player.x + 4, player.y + 4, PLAYER_W - 8, PLAYER_H - 8, enemy.x, enemy.y, enemy.w, enemy.h)) continue;
""", """      if (enemy.hitPause > 0 && !enemy.pooped) continue;
      if (!overlap(player.x + 4, player.y + 4, PLAYER_W - 8, PLAYER_H - 8, enemy.x, enemy.y, enemy.w, enemy.h)) continue;
      if (enemy.boss && enemy.counter) {
        player.vy = Math.min(player.vy, -6);
        player.vx = player.x + PLAYER_W / 2 < enemy.x + enemy.w / 2 ? -4 : 4;
        continue;
      }
""")
src = sub1(src, "'WIELKI PERSI POKONANY!'", "BOSS().done")
src = sub1(src, "'NA PERSIEGO',", "'NA WROGÓW',")

# --- krainy 2 i 3: nowi wrogowie, błoto, tryb Spokojny ---
src = sub1(src, "      if (enemy.kind === 'bee') { updateBee(enemy); continue; }\n",
           "      if (enemy.kind === 'bee') { updateBee(enemy); continue; }\n      if (enemy.kind === 'owl') { updateOwl(enemy); continue; }\n      if (enemy.kind === 'root' && updateRoot(enemy)) continue;\n")
src = sub1(src, """      if (enemy.hitPause > 0 && !enemy.pooped) continue;
      if (!overlap(player.x + 4, player.y + 4, PLAYER_W - 8, PLAYER_H - 8, enemy.x, enemy.y, enemy.w, enemy.h)) continue;
""", """      if (enemy.hidden || enemy.ghost) continue;
      if (enemy.hitPause > 0 && !enemy.pooped) continue;
      if (!overlap(player.x + 4, player.y + 4, PLAYER_W - 8, PLAYER_H - 8, enemy.x, enemy.y, enemy.w, enemy.h)) continue;
""")
src = sub1(src, "        if (enemy.pooped || enemy.hp <= 0) continue;\n", "        if (enemy.pooped || enemy.hp <= 0 || enemy.hidden || enemy.ghost) continue;\n")
src = sub1(src, "      if (Math.abs(ex - cx) > 140 || Math.abs((enemy.y + enemy.h) - by) > 40 || enemy.standingPlatform < 0) continue;\n",
           "      if (enemy.hidden && Math.abs(ex - cx) < 140 && Math.abs((enemy.y + enemy.h) - by) < 40) rootPop(enemy);\n      else if (Math.abs(ex - cx) > 140 || Math.abs((enemy.y + enemy.h) - by) > 40 || enemy.standingPlatform < 0) continue;\n")
src = sub1(src, "* (HERO === 'C' ? 1.08 : 1);", "* (HERO === 'C' ? 1.08 : 1) * (player.inMud ? 0.8 : 1);")
src = sub1(src, """    if (kind !== 'pit' && player.invul > 0) return;
    if (kind !== 'pit' && player.bubble > 0) {""", """    if (kind !== 'pit' && player.invul > 0) return;
    if (kind === 'pit' && CALM()) {
      audio.cue('fall');
      respawnPlayer();
      openWipe(game.player.x - game.cameraX + PLAYER_W / 2, game.player.y + PLAYER_H / 2);
      setNotice('Spokojnie – wracasz bez straty serca.', '#C8ECFF', 120, 2, 'HOP');
      return;
    }
    if (kind !== 'pit' && player.bubble > 0) {""")
src = sub1(src, "      setNotice('Pień cię dogonił! Biegnij dalej w prawo!', '#FFBBBB', 140, 3, 'AU!');",
           "      setNotice(({ mud: 'Błotna fala cię dogoniła!', roots: 'Korzenie cię dosięgły!' }[game.level.chase && game.level.chase.kind] || 'Pień cię dogonił!') + ' Biegnij dalej w prawo!', '#FFBBBB', 140, 3, 'AU!');")
src = sub1(src, "        kind: enemy.kind,\n", "        kind: enemy.boss ? BOSS().art : enemy.kind,\n")
# krainy w nagłówkach
src = sub1(src, "    return level.isBoss ? 'FINAŁ' : `POZIOM ${index + 1}`;",
           "    const w = worldOf(index);\n    if (w < 0) return `POZIOM ${index + 1}`;\n    return `KRAINA ${w + 1} · ` + (level.isBoss ? 'BOSS' : `POZIOM ${index - WORLDS[w].start + 1}`);")
src = sub1(src, "    ctx.fillText(game.level.isBoss ? 'FINAŁ' : `${game.levelIndex + 1}/${LEVELS.length - 1}`, px + 12, top + 23);",
           "    { const w = WORLDS[Math.max(0, worldOf(game.levelIndex))]; ctx.fillText(game.level.isBoss ? 'BOSS' : `${game.levelIndex - w.start + 1}/${w.end - w.start}`, px + 12, top + 23); }")
src = sub1(src, "    ctx.fillText(game.level.isBoss ? 'WIELKI FINAŁ' : `POZIOM ${game.levelIndex + 1} Z ${LEVELS.length - 1}`, BASE_W / 2, y + 24);",
           "    ctx.fillText(game.levelIndex === LEVELS.length - 1 ? 'WIELKI FINAŁ' : `${WORLDS[Math.max(0, worldOf(game.levelIndex))].name.toUpperCase()} · ${levelBadge(game.levelIndex).split(' · ')[1]}`, BASE_W / 2, y + 24);")
# mapa: podpisy krain, ikony bossów, bez starych błysków wody
src = sub1(src, """    drawOutlinedText('DRZEWO LICHA', 704, 262, 'bold 15px "Fredoka", sans-serif', '#E8C8FF', '#1A1030', 4);
    drawOutlinedText('wkrótce', 704, 280, 'bold 12px "Fredoka", sans-serif', '#C8B0E8', '#1A1030', 3);
    drawOutlinedText('MOKRADŁA I MGŁA', 700, 342, 'bold 15px "Fredoka", sans-serif', '#D8F0EC', '#10302E', 4);
    drawOutlinedText('wkrótce', 700, 360, 'bold 12px "Fredoka", sans-serif', '#B8D8D4', '#10302E', 3);
    drawOutlinedText('POLANA GRZYBÓW', 130, 300, 'bold 15px "Fredoka", sans-serif', '#FFF2B0', '#2A3A10', 4);""",
"""    drawOutlinedText('3 · DRZEWO LICHA', 690, 28, 'bold 14px "Fredoka", sans-serif', '#E8C8FF', '#1A1030', 4);
    drawOutlinedText('2 · MOKRADŁA I MGŁA', 640, 472, 'bold 14px "Fredoka", sans-serif', '#D8F0EC', '#10302E', 4);
    drawOutlinedText('1 · POLANA GRZYBÓW', 200, 472, 'bold 14px "Fredoka", sans-serif', '#FFF2B0', '#2A3A10', 4);""")
src = sub1(src, """    // water glints
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let k = 0; k < 14; k += 1) {""", """    // water glints (wyłączone – mapa lasu)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let k = 0; k < 0; k += 1) {""")
src = sub1(src, """    const [bx, by] = MAP_NODES[MAP_NODES.length - 1];
    const sleeper = buildForestEnemy('boss', Math.floor(t / 40) % 2, 'walk');
    drawArtFootprint({ c: sleeper, ox: 5, oy: 7, fw: 24, fh: 21 }, bx + 22, by - 30, 36, 31.5, true);
    ctx.fillStyle = '#FFFFFF';
    drawZ(bx + 44, by - 44 - (t % 60) * 0.3, 2);
    drawZ(bx + 56, by - 58 - (t % 60) * 0.3, 2);""", """    LEVELS.forEach((L, bi) => {
      if (!L.isBoss) return;
      const [bx, by] = MAP_NODES[bi];
      const left = bx > BASE_W - 90;
      const sleeper = buildForestEnemy(BOSS(bi).art, Math.floor(t / 40) % 2, 'walk');
      drawArtFootprint({ c: sleeper, ox: 5, oy: 7, fw: 24, fh: 21 }, left ? bx - 58 : bx + 22, by - 30, 36, 31.5, !left);
      ctx.fillStyle = '#FFFFFF';
      drawZ(left ? bx - 40 : bx + 44, by - 44 - (t % 60) * 0.3, 2);
    });""")

src = sub1(src, "    boss: { color: '6,8,24', alpha: 0.56, player: 150 }\n  };", """    boss: { color: '6,8,24', alpha: 0.56, player: 150 },
    mistbog: { color: '214,224,220', alpha: 0.6, player: 200 },
    toadpond: { color: '20,18,36', alpha: 0.3, player: 190 },
    nightwood: { color: '6,8,24', alpha: 0.52, player: 180 },
    roots: { color: '12,6,26', alpha: 0.48, player: 180 },
    lichorun: { color: '12,6,26', alpha: 0.4, player: 190 },
    lichotree: { color: '10,4,24', alpha: 0.45, player: 190 }
  };""")
src = sub1(src, "      return { title: 'FINAŁ', text: '„!” = szarża. Przeskocz go i wskocz mu na głowę.', color: '#FFB5B5' };",
           "      return { title: 'BOSS', text: `„!” = atak. Przeskocz i skacz na ${BOSS().head}.`, color: '#FFB5B5' };")
open(OUT, 'w', encoding='utf-8').write(src)
print('ok', len(src))

