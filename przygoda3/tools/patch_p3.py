import re, sys
from jspatch import replace_func, sub1

SRC = '/home/claude/przygody-krolika/index.html'
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
           "  const THEME_ORDER = ['glade', 'canopy', 'bramble', 'windfall', 'mushking'];")
src = sub1(src, "  function theme() {\n", """  Object.assign(THEMES, {
    glade: { sky: ['#8FD3EE', '#EAF8DA'], sun: '#FFF3B0', far: '#9CCB9E', mid: '#6FAE6E', near: '#4A8E52', grass: '#6CC24E', grassHi: '#A2E46E', grassDark: '#3A8A36', dirt: '#8A5A30', dirtDark: '#5E3A1C', stone: '#B08A5E', trunk: '#6A4428', leaf: '#4E9A56', leafHi: '#7CC478', deco: 'forest', blobs: 'flower', critters: 'butterflies' },
    canopy: { sky: ['#7EC4EE', '#F4F6DA'], sun: '#FFF6C8', far: '#B8DCC0', mid: '#7FBF86', near: '#4E9A5A', grass: '#7ACF5A', grassHi: '#B0EC80', grassDark: '#3E8E3A', dirt: '#7A5232', dirtDark: '#52341C', stone: '#A0805A', trunk: '#6E4A2C', leaf: '#5AAA5E', leafHi: '#8AD47E', deco: 'forest', blobs: 'leaf', critters: 'birds' },
    bramble: { sky: ['#9CCFC0', '#F6EDC8'], sun: '#FFE9A0', far: '#9AB894', mid: '#6E9A62', near: '#46743E', grass: '#5DAE48', grassHi: '#92D46E', grassDark: '#2F6E2E', dirt: '#7A4E2C', dirtDark: '#4E2E16', stone: '#9A7A56', trunk: '#5A3A22', leaf: '#3E7A48', leafHi: '#B84A6A', deco: 'forest', blobs: 'petal', critters: 'butterflies' },
    windfall: { sky: ['#5E7A92', '#C0CCB8'], rain: true, blobs: 'leaf', far: '#7A9A8C', mid: '#557A62', near: '#365A44', grass: '#5AA448', grassHi: '#88CC66', grassDark: '#2E6A32', dirt: '#6E4A2C', dirtDark: '#4A2E18', stone: '#8E7458', trunk: '#4E3420', leaf: '#3A6A4A', leafHi: '#C88A3A', deco: 'forest', critters: 'fireflies' },
    mushking: { sky: ['#14182E', '#3A2E52'], moon: true, far: '#2A3050', mid: '#222846', near: '#181C36', grass: '#4E8A5A', grassHi: '#7AB47E', grassDark: '#2E5A38', dirt: '#4E3E50', dirtDark: '#30263A', stone: '#6E6080', trunk: '#2E2438', leaf: '#2E4A48', leafHi: '#C86AA8', deco: 'forest', critters: 'fireflies' }
  });

  function theme() {
""")
src = sub1(src, "  const SONG_FOR = [['a', 0], ['b', 0], ['c', -2], ['b', 5], ['a', -3], ['b', 2], ['c', 0], ['boss', 0]];",
           "  const SONG_FOR = [['a', 2], ['b', 0], ['c', -2], ['b', 7], ['boss', 0]];")
src = sub1(src, "  const MAP_NODES = [[96, 392], [206, 330], [318, 394], [420, 312], [512, 384], [612, 300], [700, 360], [724, 192]];",
           "  const MAP_NODES = [[110, 392], [250, 330], [400, 388], [550, 312], [700, 230]];")
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
src = sub1(src, "level_label=like.${encodeURIComponent(`[${EKIPA}]*`)}", "level_label=like.${encodeURIComponent(`[${EKIPA}] P3*`)}")
src = sub1(src, "level_label: EKIPA_TAG + (", "level_label: EKIPA_TAG + 'P3 ' + (")

# menu: wybór bohatera
src = sub1(src, '        <div id="menuActionRow">', """        <div id="heroRow"><button type="button" data-hero="P">PUSZEK</button><button type="button" data-hero="C">PERSI</button></div>
        <div id="heroCap"></div>
        <div id="menuActionRow">""")
src = sub1(src, ".hidden { display:none !important; }\n</style>", """#heroRow { display:flex; gap:8px; }
#heroRow button { flex:1; height:40px; border-radius:12px; border:2px solid rgba(255,255,255,0.25); background:rgba(20,30,40,0.8); color:#DDE8F0;
  font:700 15px "Fredoka","Trebuchet MS",sans-serif; letter-spacing:1px; cursor:pointer; }
#heroRow button.on { background:linear-gradient(180deg,#FFD86A 0%,#E8A42A 100%); color:#2A1A06; border-color:#FFF2B0; }
#heroCap { min-height:30px; font:600 12px "Fredoka","Trebuchet MS",sans-serif; color:#E8F4D8; text-align:center; line-height:1.25; }
.hidden { display:none !important; }
</style>""")
src = re.sub(r'<div id="p2link".*?</div>', '<div style="display:flex;justify-content:center;gap:14px;padding:2px 0;font:700 12px Fredoka,sans-serif;"><a href="../" style="color:#FFE680;text-decoration:none;">← Przygoda 1</a><a href="../przygoda2/" style="color:#FFE680;text-decoration:none;">Przygoda 2: zagadki</a></div>', src, count=1)
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
          setNotice('Król jest za duży na zryw – skacz mu na kapelusz!', '#FFB5B5', 180, 3, 'HMM');
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

# teksty
REPL = [
    ("const title = 'PUSZEK I MARCHEWKI';", "const title = 'PUSZEK I PERSI';"),
    ("drawPixelText('kontra Persi',", "drawPixelText('Zaczarowany Las',"),
    ("'Wielki Persi zrzuca kłębki! Uciekaj spod cieni.'", "'Grzybowy Król sypie zarodnikami! Uciekaj spod cieni.'"),
    ("'Wielki Persi jest za ciężki na tupnięcie. Wskocz mu na głowę!'", "'Grzybowy Król jest za ciężki na tupnięcie. Wskocz mu na kapelusz!'"),
    ("'Wielki Persi odpuścił! Portal jest otwarty.'", "'Grzybowy Król odczarowany! Ścieżka wolna.'"),
    ("'Persi z boku zabiera serce. Wskakuj mu na głowę!'", "'Z boku zabiera serce! Wskakuj wrogom na głowę.'"),
    ("'Persi ogłuszony! Wskocz mu na głowę za +100.'", "'Ogłuszony! Wskocz mu na głowę za +100.'"),
    ("'Każda marchewka to bobek do rzucania.'", "'Żołędzie to punkty – a Puszkowi dają bobki do rzucania.'"),
    ("'Brak bobków – zbieraj marchewki.'", "'Brak bobków – zbieraj żołędzie.'"),
    ("'Skaczesz wyżej. Rozpędź się po ziemi – Puszek zwinie się w taran!'", "'Turbo! Skaczesz wyżej, a rozpędzony wpadasz we wrogów jak taran.'"),
    ("'To Persi. Wskocz mu na głowę albo rzuć bobkiem (X).'", "'Zaczarowany muchomorek! Wskocz mu na głowę – odczarujesz go.'"),
    ("'Szary Persi skacze. Przebiegnij pod nim, gdy jest w górze.'", "'Żabka skacze. Przebiegnij pod nią, gdy jest w górze.'"),
    ("'Taran! Wpadaj w Persiego z boku.'", "'Taran! Wpadaj we wrogów z boku.'"),
    ("'Persi wygrał tym razem…'", "'Leśne Licho wygrało tym razem…'"),
    ("'Puszek jest bezpieczny i szczęśliwy!'", "'Polana Grzybów odczarowana! Ciąg dalszy nastąpi…'"),
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

open(OUT, 'w', encoding='utf-8').write(src)
print('ok', len(src))
