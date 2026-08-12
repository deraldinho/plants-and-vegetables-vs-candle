"use strict";

(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const ROWS = 5;
  const COLS = 8;
  const GRID_X = 185;
  const GRID_Y = 118;
  const CELL_W = 92;
  const CELL_H = 92;
  const HOUSE_X = 118;
  const STORAGE_KEYS = {
    bestScore: "healthy-family-home.best-score",
    tutorialSeen: "healthy-family-home.tutorial-seen",
    selectedMode: "healthy-family-home.selected-mode",
    bestEndlessWave: "healthy-family-home.best-endless-wave"
  };

  const ui = {
    sun: document.getElementById("sunValue"),
    health: document.getElementById("houseHealthValue"),
    healthBar: document.getElementById("houseHealthBar"),
    wave: document.getElementById("waveValue"),
    score: document.getElementById("scoreValue"),
    bestScore: document.getElementById("bestScoreValue"),
    overlay: document.getElementById("gameOverlay"),
    overlayTitle: document.getElementById("overlayTitle"),
    overlayText: document.getElementById("overlayText"),
    overlayButton: document.getElementById("overlayButton"),
    overlayCard: document.querySelector(".overlay-card"),
    resultSummary: document.getElementById("resultSummary"),
    resultStars: document.getElementById("resultStars"),
    resultStats: document.getElementById("resultStats"),
    modeSelector: document.getElementById("modeSelector"),
    modeButtons: [...document.querySelectorAll("[data-mode]")],
    pause: document.getElementById("pauseButton"),
    speed: document.getElementById("speedButton"),
    sound: document.getElementById("soundButton"),
    toast: document.getElementById("toast"),
    wavePreview: document.getElementById("wavePreview"),
    wavePreviewTitle: document.getElementById("wavePreviewTitle"),
    wavePreviewMode: document.getElementById("wavePreviewMode"),
    wavePreviewEnemies: document.getElementById("wavePreviewEnemies"),
    waveProgress: document.getElementById("waveProgress"),
    waveProgressFill: document.getElementById("waveProgressFill"),
    waveProgressText: document.getElementById("waveProgressText"),
    startWave: document.getElementById("startWaveButton"),
    tutorial: document.getElementById("tutorialPanel"),
    tutorialStep: document.getElementById("tutorialStep"),
    tutorialText: document.getElementById("tutorialText"),
    skipTutorial: document.getElementById("skipTutorialButton"),
    upgradePanel: document.getElementById("upgradePanel"),
    upgradeIcon: document.getElementById("upgradeIcon"),
    upgradeName: document.getElementById("upgradeName"),
    upgradeLevel: document.getElementById("upgradeLevel"),
    upgradeStats: document.getElementById("upgradeStats"),
    powerUpgrade: document.getElementById("powerUpgradeButton"),
    healthUpgrade: document.getElementById("healthUpgradeButton"),
    ability: document.getElementById("abilityButton"),
    closeUpgrade: document.getElementById("closeUpgradeButton"),
    enemyGuide: document.getElementById("enemyGuideGrid"),
    cards: [...document.querySelectorAll(".defender-card[data-defender]")],
    habits: [...document.querySelectorAll(".habit")]
  };

  const DEFENDERS = {
    corn: { name: "Milho Atirador", icon: "🌽", cost: 50, hp: 100, damage: 20, cooldown: 1.2, color: "#ffd43b", projectile: "●", ability: { name: "Rajada Dourada", cooldown: 18, description: "120 de dano no alvo da linha" } },
    carrot: { name: "Cenoura Arqueira", icon: "🥕", cost: 75, hp: 80, damage: 15, cooldown: .58, color: "#ff8b2c", projectile: "➤", ability: { name: "Flecha Perfurante", cooldown: 16, description: "55 de dano em toda a linha" } },
    broccoli: { name: "Brócolis Escudo", icon: "🥦", cost: 100, hp: 350, damage: 0, cooldown: 99, color: "#48a94f", projectile: "", ability: { name: "Fortaleza Verde", cooldown: 20, description: "cura e protege os vegetais próximos" } },
    pepper: { name: "Pimenta Flamejante", icon: "🌶️", cost: 125, hp: 120, damage: 35, cooldown: 1.35, color: "#f04b36", projectile: "🔥", burn: true, ability: { name: "Trilha de Fogo", cooldown: 22, description: "incendeia todos os doces da linha" } },
    tomato: { name: "Tomate Bomba", icon: "🍅", cost: 150, hp: 150, damage: 50, cooldown: 2.3, color: "#e93835", projectile: "💥", area: true, ability: { name: "Superexplosão", cooldown: 24, description: "120 de dano em uma grande área" } },
    watermelon: { name: "Melancia Devoradora", icon: "🍉", cost: 175, hp: 220, damage: 0, cooldown: 15, color: "#ff3b5c", projectile: "", ability: { name: "Super Digestão", cooldown: 18, description: "conclui a digestão e cura 80 HP" } }
  };

  const ENEMIES = {
    gummy: { name: "Ursinho de Goma", icon: "🧸", hp: 130, speed: 24, damage: 18, attackRate: 1, reward: 25, scale: 1, description: "Inimigo básico e equilibrado." },
    lollipop: { name: "Pirulito Giratório", icon: "🍭", hp: 210, speed: 18, damage: 24, attackRate: 1.1, reward: 35, scale: 1.05, description: "Resistente e constante." },
    cupcake: { name: "Cupcake Tanque", icon: "🧁", hp: 430, speed: 10, damage: 35, attackRate: 1.2, reward: 55, scale: 1.15, description: "Muita vida, mas anda devagar." },
    marshmallow: { name: "Marshmallow Veloz", icon: "⬜", hp: 100, speed: 45, damage: 14, attackRate: .75, reward: 30, scale: .9, description: "Pouca vida e velocidade extrema." },
    chocolate: { name: "Chocolate Blindado", icon: "🍫", hp: 300, speed: 14, damage: 28, attackRate: 1.1, reward: 50, scale: 1.1, shield: 150, preview: "escudo", description: "Possui um escudo que precisa ser quebrado primeiro." },
    soda: { name: "Refrigerante Energético", icon: "🥤", hp: 180, speed: 22, damage: 18, attackRate: 1, reward: 40, scale: 1.05, aura: true, preview: "acelera aliados", description: "Acelera doces próximos na mesma linha." },
    gum: { name: "Chiclete Pegajoso", icon: "🟣", hp: 190, speed: 20, damage: 20, attackRate: .9, reward: 45, scale: 1, sticky: true, preview: "causa lentidão", description: "Desacelera o ataque do defensor atingido." },
    candle: { name: "Vela Mestra", icon: "🕯️", hp: 2000, speed: 8, damage: 55, attackRate: 1.05, reward: 500, scale: 1.55, boss: true, description: "Chefe com enorme vida e dano." }
  };

  const MODES = {
    easy: { label: "Modo Tranquilo", startSun: 225, houseHp: 1200, enemyHp: .78, enemySpeed: .9, enemyDamage: .78, scoreMultiplier: .8, preparationBonus: 90 },
    normal: { label: "Modo Normal", startSun: 150, houseHp: 1000, enemyHp: 1, enemySpeed: 1, enemyDamage: 1, scoreMultiplier: 1, preparationBonus: 75 },
    hard: { label: "Modo Desafio", startSun: 125, houseHp: 850, enemyHp: 1.28, enemySpeed: 1.12, enemyDamage: 1.22, scoreMultiplier: 1.35, preparationBonus: 60 },
    endless: { label: "Modo Infinito", startSun: 175, houseHp: 1000, enemyHp: 1, enemySpeed: 1, enemyDamage: 1, scoreMultiplier: 1.1, preparationBonus: 65 }
  };

  let audioCtx = null;
  let soundOn = true;
  let toastTimer = null;
  let animationId = null;
  let lastTime = 0;
  let state;
  let upgradeTarget = null;
  let bestScore = readNumber(STORAGE_KEYS.bestScore);
  let tutorialSeen = readFlag(STORAGE_KEYS.tutorialSeen);
  let selectedMode = readMode();
  let bestEndlessWave = readNumber(STORAGE_KEYS.bestEndlessWave);

  function freshState() {
    const mode = MODES[selectedMode];
    return {
      phase: "intro",
      paused: false,
      gameSpeed: 1,
      time: 0,
      mode: selectedMode,
      sun: mode.startSun,
      houseHp: mode.houseHp,
      maxHouseHp: mode.houseHp,
      score: 0,
      wave: 1,
      waveTime: 0,
      waveActive: false,
      waveResolved: 0,
      houseDamagedThisWave: false,
      combo: 0,
      comboExpiresAt: 0,
      selected: null,
      shovel: false,
      pepperUnlocked: false,
      attackBoostUntil: 0,
      defenders: [],
      enemies: [],
      projectiles: [],
      particles: [],
      suns: [],
      floaters: [],
      shake: { intensity: 0, duration: 0, x: 0, y: 0 },
      spawnQueue: makeWave(1),
      usedHabits: new Set(),
      nextSun: 5,
      tutorialStep: tutorialSeen ? -1 : 0,
      stats: {
        enemiesDefeated: 0,
        sunCollected: 0,
        defendersPlaced: 0,
        upgradesBought: 0,
        refunded: 0,
        habitsUsed: 0,
        abilitiesUsed: 0,
        wavesCompleted: 0,
        flawlessWaves: 0,
        maxCombo: 0,
        damageDealt: 0
      },
      damageByType: {},
      mouse: { x: -1, y: -1 }
    };
  }

  function triggerShake(intensity, duration) {
    if (!state) return;
    state.shake = { intensity, duration, x: 0, y: 0 };
  }

  function makeWave(number) {
    const list = [];
    const add = (at, type, row) => list.push({ at, type, row, spawned: false });
    if (number === 1) {
      add(2, "gummy", 0); add(5, "gummy", 2); add(8, "marshmallow", 4); add(11, "gummy", 1); add(14, "lollipop", 3); add(18, "gummy", 2);
    } else if (number === 2) {
      add(2, "marshmallow", 0); add(4, "gummy", 4); add(6, "soda", 2); add(7.2, "lollipop", 2); add(9, "cupcake", 1); add(11, "gum", 3); add(14, "lollipop", 4); add(15, "chocolate", 4); add(17, "cupcake", 0); add(20, "gummy", 2);
    } else if (number === 3) {
      add(2, "marshmallow", 1); add(3.5, "marshmallow", 3); add(6, "chocolate", 0); add(7, "soda", 0); add(8, "lollipop", 4); add(10, "gum", 2); add(11, "cupcake", 2); add(13, "gummy", 1); add(14, "gum", 3); add(17, "soda", 4); add(18, "lollipop", 4); add(22, "candle", 2);
    } else {
      const pool = ["gummy", "marshmallow", "lollipop", "soda", "cupcake", "gum", "chocolate", "marshmallow"];
      const count = Math.min(8 + number * 2, 28);
      const spacing = Math.max(.72, 2.2 - number * .07);
      for (let i = 0; i < count; i++) add(1.5 + i * spacing, pool[(i * 3 + number) % pool.length], (i * 2 + number) % ROWS);
      if (number % 5 === 0) add(2.5 + count * spacing, "candle", number % ROWS);
    }
    return list;
  }

  function startGame() {
    state = freshState();
    state.phase = "playing";
    ui.overlay.classList.remove("visible");
    ui.overlayCard.classList.remove("result-mode");
    ui.resultSummary.hidden = true;
    ui.modeSelector.hidden = true;
    ui.overlayButton.textContent = "Começar aventura";
    ui.pause.textContent = "⏸ Pausar";
    ui.speed.textContent = "⏩ 1×";
    ui.speed.setAttribute("aria-label", "Aumentar velocidade para 2×");
    ui.habits.forEach(button => button.classList.remove("used"));
    showWavePreparation();
    if (state.tutorialStep >= 0) showTutorial(0);
    else hideTutorial();
    updateCards();
    syncUi();
    lastTime = performance.now();
    if (!animationId) animationId = requestAnimationFrame(loop);
    beep(420, .08, "sine");
    showToast("Prepare sua defesa e inicie a primeira onda!");
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, .05);
    lastTime = now;
    if (state && state.phase === "playing" && !state.paused) update(dt * state.gameSpeed);
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function update(dt) {
    if (state.shake && state.shake.duration > 0) {
      state.shake.duration -= dt;
      const factor = state.shake.duration > 0 ? state.shake.intensity : 0;
      state.shake.x = (Math.random() - 0.5) * factor * 2;
      state.shake.y = (Math.random() - 0.5) * factor * 2;
    } else if (state.shake) {
      state.shake.x = 0;
      state.shake.y = 0;
    }

    if (!state.waveActive) {
      updateParticles(dt);
      updateFloaters(dt);
      state.particles = state.particles.filter(p => p.life > 0);
      state.floaters = state.floaters.filter(f => f.life > 0);
      syncUi();
      return;
    }
    state.time += dt;
    state.waveTime += dt;
    if (state.time > state.comboExpiresAt) state.combo = 0;

    for (const item of state.spawnQueue) {
      if (!item.spawned && state.waveTime >= item.at) {
        spawnEnemy(item.type, item.row);
        item.spawned = true;
      }
    }

    if (state.time >= state.nextSun) {
      state.suns.push({ x: random(GRID_X + 30, GRID_X + COLS * CELL_W - 30), y: -25, targetY: random(GRID_Y + 10, GRID_Y + ROWS * CELL_H - 20), life: 10, value: 25, pulse: 0 });
      state.nextSun = state.time + random(6, 9);
    }

    updateSuns(dt);
    updateDefenders(dt);
    updateProjectiles(dt);
    updateEnemies(dt);
    updateParticles(dt);
    updateFloaters(dt);

    state.defenders = state.defenders.filter(d => d.hp > 0);
    state.enemies = state.enemies.filter(e => e.hp > 0 && !e.removed);
    state.projectiles = state.projectiles.filter(p => !p.removed && p.x < W + 30);
    state.particles = state.particles.filter(p => p.life > 0);
    state.suns = state.suns.filter(s => s.life > 0);
    state.floaters = state.floaters.filter(f => f.life > 0);

    const spawnedAll = state.spawnQueue.every(item => item.spawned);
    if (state.phase === "playing" && state.waveActive && spawnedAll && state.enemies.length === 0) {
      const flawlessBonus = completeWave();
      if (state.mode === "endless" || state.wave < 3) nextWave(flawlessBonus);
      else endGame(true);
    }
    syncUi();
  }

  function completeWave() {
    state.stats.wavesCompleted += 1;
    if (state.houseDamagedThisWave) return 0;
    const bonus = 40 + state.wave * 15;
    state.sun += bonus;
    state.score += bonus * 5;
    state.stats.flawlessWaves += 1;
    return bonus;
  }

  function nextWave(flawlessBonus = 0) {
    state.wave += 1;
    state.waveTime = 0;
    state.waveActive = false;
    state.waveResolved = 0;
    state.combo = 0;
    state.spawnQueue = makeWave(state.wave);
    const mode = MODES[state.mode];
    const bonus = state.mode === "endless" ? Math.min(mode.preparationBonus + state.wave * 5, 120) : mode.preparationBonus;
    state.sun += bonus;
    showWavePreparation();
    showToast(`Prepare a onda ${state.wave}! +${bonus} ☀️${flawlessBonus ? ` · Onda perfeita: +${flawlessBonus} ☀️` : ""}`);
    beep(560, .11, "triangle");
    setTimeout(() => beep(700, .12, "triangle"), 130);
  }

  function startWave() {
    if (state.phase !== "playing" || state.paused || state.waveActive) return;
    state.waveActive = true;
    state.waveTime = 0;
    state.houseDamagedThisWave = false;
    state.combo = 0;
    updateWavePreview();
    if (state.tutorialStep === 2) completeTutorial();
    showToast(`Onda ${state.wave} — os doces estão chegando!`);
    beep(560, .11, "triangle");
  }

  function showWavePreparation() {
    state.waveActive = false;
    clearSelection();
    updateWavePreview();
  }

  function updateWavePreview() {
    if (!state) return;
    const counts = state.spawnQueue.reduce((result, item) => {
      result[item.type] = (result[item.type] || 0) + 1;
      return result;
    }, {});
    const mode = MODES[state.mode];
    ui.wavePreviewMode.textContent = state.mode === "endless" && bestEndlessWave > 0
      ? `${mode.label} · Recorde: onda ${bestEndlessWave}`
      : mode.label;
    ui.wavePreviewTitle.textContent = `Onda ${state.wave}: ${state.spawnQueue.length} inimigos`;
    ui.wavePreviewEnemies.replaceChildren(...Object.entries(counts).map(([type, count]) => {
      const chip = document.createElement("span");
      chip.className = "enemy-preview-chip";
      chip.textContent = `${ENEMIES[type].icon} ${count}× ${ENEMIES[type].name}${ENEMIES[type].preview ? ` · ${ENEMIES[type].preview}` : ""}`;
      chip.title = ENEMIES[type].description;
      return chip;
    }));
    ui.wavePreview.classList.toggle("in-progress", state.waveActive);
    ui.waveProgress.hidden = !state.waveActive;
    ui.startWave.disabled = state.waveActive || (state.tutorialStep >= 0 && state.tutorialStep < 2);
    ui.startWave.textContent = state.waveActive ? "Onda em andamento" : "Iniciar onda";
  }

  function spawnEnemy(type, row) {
    const base = ENEMIES[type];
    const mode = MODES[state.mode];
    const endlessGrowth = state.mode === "endless" ? Math.max(0, state.wave - 3) : 0;
    const waveHpScale = 1 + (state.wave - 1) * (state.mode === "endless" ? .16 : .13);
    const hpScale = (base.boss ? 1 + endlessGrowth * .12 : waveHpScale) * mode.enemyHp;
    const speedScale = mode.enemySpeed * (1 + Math.min(.3, endlessGrowth * .015));
    const damageScale = mode.enemyDamage * (1 + Math.min(.5, endlessGrowth * .025));
    state.enemies.push({
      ...base, type, row, x: W + 42, y: GRID_Y + row * CELL_H + CELL_H / 2,
      hp: Math.round(base.hp * hpScale), maxHp: Math.round(base.hp * hpScale),
      shield: Math.round((base.shield || 0) * hpScale), maxShield: Math.round((base.shield || 0) * hpScale),
      speed: base.speed * speedScale, damage: Math.round(base.damage * damageScale),
      attackTimer: 0, hitFlash: 0, burnUntil: 0, burnTick: 0, wobble: Math.random() * 6
    });
    if (type === "candle") {
      showToast("🔥 CHEFÃO: Vela Mestra entrou no jardim!");
      beep(130, .4, "sawtooth");
      triggerShake(12, 0.45);
    }
  }

  function updateDefenders(dt) {
    const boosted = state.time < state.attackBoostUntil;
    for (const defender of state.defenders) {
      const slowed = defender.slowUntil > state.time;
      defender.cooldownLeft -= dt * (boosted ? 2 : 1) * (slowed ? .6 : 1);
      defender.hitFlash = Math.max(0, defender.hitFlash - dt * 6);

      if (defender.type === "watermelon" && defender.cooldownLeft <= 0) {
        const prey = state.enemies
          .filter(enemy => enemy.row === defender.row && enemy.hp > 0 && !enemy.removed && Math.abs(enemy.x - (defender.x + 15)) < 65 && enemy.x >= defender.x - 15)
          .sort((a, b) => a.x - b.x)[0];
        if (prey) {
          defender.cooldownLeft = defender.cooldown;
          beep(160, .22, "sawtooth", .08);
          triggerShake(6, 0.2);
          burst(defender.x + 25, defender.y, "#ff3b5c", 18);
          if (prey.boss) {
            const bossDamage = Math.round(450 * (1 + defender.powerLevel * .2));
            damageEnemy(prey, bossDamage, "#ff3b5c", defender.type);
            state.floaters.push({ x: prey.x, y: prey.y - 45, text: `NHAM! -${bossDamage}💥`, color: "#ff3b5c", life: 1, scale: 1.25 });
          } else {
            const totalHp = prey.hp + (prey.shield || 0);
            damageEnemy(prey, totalHp, "#ff3b5c", defender.type);
            state.floaters.push({ x: defender.x + 20, y: defender.y - 35, text: "NHAM! 🍉", color: "#ff3b5c", life: 1, scale: 1.2 });
          }
        }
        continue;
      }

      const target = state.enemies
        .filter(enemy => enemy.row === defender.row && enemy.x > defender.x - 5)
        .sort((a, b) => a.x - b.x)[0];
      if (target && defender.damage > 0 && defender.cooldownLeft <= 0) {
        defender.cooldownLeft = defender.cooldown;
        state.projectiles.push({
          x: defender.x + 25, y: defender.y - 3, row: defender.row, speed: defender.type === "carrot" ? 360 : 280,
          damage: defender.damage, color: defender.color, icon: defender.projectile, area: defender.area, burn: defender.burn,
          sourceType: defender.type, removed: false
        });
        beep(defender.type === "pepper" ? 260 : 520, .025, "square", .025);
      }
    }
  }

  function updateProjectiles(dt) {
    for (const p of state.projectiles) {
      p.x += p.speed * dt;
      if (p.sourceType === "pepper" && Math.random() < 0.4) {
        state.particles.push({ x: p.x - 10, y: p.y + random(-4, 4), vx: random(-30, -10), vy: random(-15, 15), size: random(2, 5), color: "#ff6b4a", life: random(0.2, 0.4) });
      } else if (p.sourceType === "tomato" && Math.random() < 0.4) {
        state.particles.push({ x: p.x - 10, y: p.y + random(-4, 4), vx: random(-20, 0), vy: random(-10, 10), size: random(2, 6), color: "#ff3b30", life: random(0.25, 0.45) });
      }

      const hit = state.enemies.filter(e => e.row === p.row && e.hp > 0 && Math.abs(e.x - p.x) < 32).sort((a, b) => a.x - b.x)[0];
      if (!hit) continue;
      if (p.area) {
        for (const enemy of state.enemies) {
          const distance = Math.hypot(enemy.x - hit.x, (enemy.row - hit.row) * CELL_H);
          if (distance < 125) damageEnemy(enemy, p.damage, "#f94f37", p.sourceType);
        }
        burst(hit.x, hit.y, "#ff5638", 25);
        triggerShake(8, 0.25);
        beep(95, .12, "sawtooth", .06);
      } else {
        damageEnemy(hit, p.damage, p.color, p.sourceType);
        if (p.burn) {
          hit.burnUntil = state.time + 3;
          hit.burnTick = 0;
          hit.burnDamage = 7;
          hit.burnSource = p.sourceType;
        }
        burst(hit.x, hit.y, p.color, 8);
      }
      p.removed = true;
    }
  }

  function damageEnemy(enemy, amount, color, sourceType = null) {
    if (enemy.hp <= 0) return;
    let remainingDamage = amount;
    let absorbedDamage = 0;
    if (enemy.shield > 0) {
      absorbedDamage = Math.min(enemy.shield, remainingDamage);
      enemy.shield -= absorbedDamage;
      remainingDamage -= absorbedDamage;
      if (enemy.shield <= 0) {
        burst(enemy.x, enemy.y, "#72d9ff", 20);
        showToast(`O escudo do ${enemy.name} foi quebrado!`);
        state.floaters.push({ x: enemy.x, y: enemy.y - 45, text: "ESCUDO QUEBRADO! 🛡️", color: "#72d9ff", life: 1.1, scale: 1.15 });
      }
    }
    const actualDamage = absorbedDamage + Math.min(enemy.hp, remainingDamage);
    enemy.hp -= remainingDamage;
    state.stats.damageDealt += actualDamage;
    if (sourceType) state.damageByType[sourceType] = (state.damageByType[sourceType] || 0) + actualDamage;
    enemy.hitFlash = 1;

    const isBigHit = actualDamage >= 70;
    const floatText = isBigHit ? `-${Math.round(actualDamage)}💥` : `-${Math.round(actualDamage)}`;
    state.floaters.push({
      x: enemy.x + random(-8, 8),
      y: enemy.y - 30,
      text: floatText,
      color: absorbedDamage > 0 ? "#72d9ff" : (sourceType === "tomato" || sourceType === "pepper" ? "#ff4d4d" : color),
      life: isBigHit ? 0.9 : 0.7,
      scale: isBigHit ? 1.25 : 1
    });

    if (enemy.hp <= 0) {
      state.stats.enemiesDefeated += 1;
      state.waveResolved += 1;
      state.combo = state.time <= state.comboExpiresAt ? state.combo + 1 : 1;
      state.comboExpiresAt = state.time + 4;
      state.stats.maxCombo = Math.max(state.stats.maxCombo, state.combo);
      const mode = MODES[state.mode];
      const endlessMultiplier = state.mode === "endless" ? 1 + (state.wave - 1) * .03 : 1;
      const comboMultiplier = 1 + (state.combo - 1) * .25;
      state.score += Math.round(enemy.reward * 10 * mode.scoreMultiplier * endlessMultiplier * comboMultiplier);
      state.sun += enemy.reward;
      enemy.removed = true;
      if (state.combo > 1) state.floaters.push({ x: enemy.x, y: enemy.y - 52, text: `COMBO ×${state.combo}`, color: "#fff06a", life: 1, scale: 1.2 });
      burst(enemy.x, enemy.y, "#ffc44d", enemy.boss ? 50 : 18);
      beep(enemy.boss ? 100 : 180, enemy.boss ? .5 : .08, "triangle", .06);
      if (enemy.boss) triggerShake(15, 0.45);
    }
  }

  function updateEnemies(dt) {
    for (const enemy of state.enemies) {
      enemy.auraBoosted = state.enemies.some(source => source !== enemy && source.type === "soda" && source.hp > 0 && !source.removed && source.row === enemy.row && Math.abs(source.x - enemy.x) < 175);
    }
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0 || enemy.removed) continue;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 7);
      if (enemy.burnUntil > state.time) {
        enemy.burnTick -= dt;
        if (enemy.burnTick <= 0) {
          enemy.burnTick = .5;
          damageEnemy(enemy, enemy.burnDamage || 7, "#ff6b2b", enemy.burnSource);
          burst(enemy.x, enemy.y - 15, "#ff9c32", 3);
        }
      }
      if (enemy.hp <= 0 || enemy.removed) continue;

      const blocker = state.defenders.find(d => d.row === enemy.row && Math.abs(enemy.x - d.x) < 48);
      if (blocker) {
        enemy.attackTimer -= dt;
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = enemy.attackRate;
          const temporaryGuard = blocker.guardUntil > state.time ? .25 : 0;
          const damageReduction = 1 - (1 - (blocker.armor || 0)) * (1 - temporaryGuard);
          blocker.hp -= enemy.damage * (1 - damageReduction);
          blocker.hitFlash = 1;
          if (enemy.sticky) {
            const newlySlowed = blocker.slowUntil <= state.time;
            blocker.slowUntil = state.time + 4;
            if (newlySlowed) showToast(`${blocker.name} ficou coberto de chiclete!`);
          }
          burst(blocker.x + 10, blocker.y, "#fff0a8", 6);
          if (blocker.hp <= 0) showToast(`${blocker.name} foi derrotado!`);
        }
      } else {
        enemy.x -= enemy.speed * (enemy.auraBoosted ? 1.28 : 1) * dt;
      }

      if (enemy.x < HOUSE_X) {
        state.houseHp -= enemy.boss ? 450 : Math.max(80, enemy.maxHp * .5);
        state.houseDamagedThisWave = true;
        state.waveResolved += 1;
        state.combo = 0;
        enemy.removed = true;
        burst(HOUSE_X, enemy.y, "#ef476f", 25);
        triggerShake(9, 0.28);
        beep(85, .25, "sawtooth", .08);
        if (state.houseHp <= 0) {
          state.houseHp = 0;
          endGame(false);
          return;
        }
      }
    }
  }

  function updateSuns(dt) {
    for (const sun of state.suns) {
      sun.pulse += dt * 4;
      sun.life -= dt;
      if (sun.y < sun.targetY) sun.y = Math.min(sun.targetY, sun.y + 75 * dt);
    }
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.life -= dt;
    }
  }

  function updateFloaters(dt) {
    for (const f of state.floaters) { f.y -= 30 * dt; f.life -= dt; }
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = random(25, 130);
      state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: random(2, 6), color, life: random(.3, .8) });
    }
  }

  function placeAt(x, y) {
    if (state.phase !== "playing" || state.paused) return;

    const sun = [...state.suns].reverse().find(s => Math.hypot(s.x - x, s.y - y) < 40);
    if (sun) {
      state.sun += sun.value;
      state.stats.sunCollected += sun.value;
      sun.life = 0;
      state.floaters.push({ x: sun.x, y: sun.y, text: `+${sun.value} ☀️`, color: "#fff06a", life: 1 });
      beep(760, .08, "sine", .04);
      syncUi();
      return;
    }

    const col = Math.floor((x - GRID_X) / CELL_W);
    const row = Math.floor((y - GRID_Y) / CELL_H);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    const existing = state.defenders.find(d => d.row === row && d.col === col);

    if (state.shovel) {
      if (existing) {
        const refund = Math.floor(existing.invested * .5);
        existing.hp = 0;
        state.sun += refund;
        state.stats.refunded += refund;
        burst(existing.x, existing.y, "#b9e4a3", 12);
        state.defenders = state.defenders.filter(defender => defender !== existing);
        showToast(`Espaço liberado: +${refund} ☀️ reembolsados!`);
      }
      clearSelection();
      return;
    }

    if (existing) { openUpgradePanel(existing); return; }
    if (!state.selected) { showToast("Escolha um vegetal ou toque em um defensor para melhorá-lo."); return; }
    const config = DEFENDERS[state.selected];
    if (state.sun < config.cost) { showToast("Energia Solar insuficiente!"); beep(110, .1, "square", .04); return; }
    if (state.selected === "pepper" && !state.pepperUnlocked) { showToast("Complete o hábito de comer vegetais para liberar!"); return; }

    state.sun -= config.cost;
    state.defenders.push({
      ...config, type: state.selected, row, col,
      x: GRID_X + col * CELL_W + CELL_W / 2,
      y: GRID_Y + row * CELL_H + CELL_H / 2,
      maxHp: config.hp, cooldownLeft: .2, hitFlash: 0, slowUntil: 0, guardUntil: 0, abilityReadyAt: 0, sway: Math.random() * 5,
      powerLevel: 0, healthLevel: 0, armor: 0, invested: config.cost
    });
    state.stats.defendersPlaced += 1;
    burst(GRID_X + col * CELL_W + CELL_W / 2, GRID_Y + row * CELL_H + CELL_H / 2, "#d8ff91", 14);
    beep(330, .07, "sine", .04);
    if (state.tutorialStep === 1) showTutorial(2);
    syncUi();
    updateCards();
  }

  function useHabit(name, button) {
    if (state.phase !== "playing" || state.usedHabits.has(name)) return;
    state.usedHabits.add(name);
    state.stats.habitsUsed += 1;
    button.classList.add("used");
    const messages = {
      water: "Hidratação completa: +50 Energia Solar!",
      fruit: "Lanche saudável: +100 Energia Solar!",
      vegetables: "Pimenta Flamejante liberada!",
      exercise: "Super velocidade de ataque por 20 segundos!",
      teeth: "Casa protegida: +300 HP!",
      sleep: "Ataque especial do Levi ativado!"
    };
    if (name === "water") state.sun += 50;
    if (name === "fruit") state.sun += 100;
    if (name === "vegetables") state.pepperUnlocked = true;
    if (name === "exercise") state.attackBoostUntil = state.time + 20;
    if (name === "teeth") state.houseHp = Math.min(state.maxHouseHp, state.houseHp + 300);
    if (name === "sleep") {
      for (const enemy of state.enemies) damageEnemy(enemy, enemy.boss ? 400 : 220, "#72d9ff");
      for (let i = 0; i < 80; i++) burst(random(GRID_X, W), random(GRID_Y, GRID_Y + ROWS * CELL_H), "#b8f1ff", 1);
    }
    showToast(messages[name]);
    beep(620, .1, "triangle", .05);
    setTimeout(() => beep(820, .12, "sine", .04), 110);
    updateCards();
    syncUi();
  }

  function openUpgradePanel(defender) {
    clearSelection();
    upgradeTarget = defender;
    ui.upgradePanel.hidden = false;
    renderUpgradePanel();
    beep(440, .05, "sine", .025);
  }

  function closeUpgradePanel() {
    upgradeTarget = null;
    ui.upgradePanel.hidden = true;
  }

  function getUpgradeCost(defender, kind) {
    const level = kind === "power" ? defender.powerLevel : defender.healthLevel;
    const multiplier = kind === "power" ? .65 : .5;
    return Math.ceil((defender.cost * multiplier + level * 35) / 5) * 5;
  }

  function renderUpgradePanel() {
    if (!upgradeTarget || upgradeTarget.hp <= 0 || !state.defenders.includes(upgradeTarget)) {
      closeUpgradePanel();
      return;
    }
    const defender = upgradeTarget;
    const totalLevel = 1 + defender.powerLevel + defender.healthLevel;
    const powerCost = getUpgradeCost(defender, "power");
    const healthCost = getUpgradeCost(defender, "health");
    const powerMaxed = defender.powerLevel >= 3;
    const healthMaxed = defender.healthLevel >= 3;
    const powerName = defender.type === "broccoli" ? "Armadura" : "Ataque";
    const powerEffect = defender.type === "broccoli" ? "+12% resistência" : "+25% dano · +8% velocidade";

    ui.upgradeIcon.textContent = defender.icon;
    ui.upgradeName.textContent = defender.name;
    ui.upgradeLevel.textContent = `Nível ${totalLevel} · Investido: ${defender.invested} ☀️`;
    ui.upgradeStats.textContent = defender.type === "broccoli"
      ? `Vida ${Math.ceil(defender.hp)}/${defender.maxHp} · Resistência ${Math.round(defender.armor * 100)}%`
      : `Vida ${Math.ceil(defender.hp)}/${defender.maxHp} · Dano ${defender.damage} · Ataque ${defender.cooldown.toFixed(2)}s`;
    ui.powerUpgrade.querySelector("strong").textContent = powerName;
    ui.powerUpgrade.querySelector("small").textContent = powerMaxed ? "Nível máximo" : `${powerEffect} · ${powerCost} ☀️`;
    ui.healthUpgrade.querySelector("small").textContent = healthMaxed ? "Nível máximo" : `+30% vida · ${healthCost} ☀️`;
    ui.powerUpgrade.disabled = powerMaxed || state.sun < powerCost;
    ui.healthUpgrade.disabled = healthMaxed || state.sun < healthCost;
    const ability = defender.ability;
    const abilityRemaining = Math.max(0, Math.ceil(defender.abilityReadyAt - state.time));
    const abilityUnlocked = totalLevel >= 2;
    const hasTarget = defender.type === "broccoli" || state.enemies.some(enemy => enemy.hp > 0 && !enemy.removed && enemy.row === defender.row);
    ui.ability.querySelector("strong").textContent = `${defender.icon} ${ability.name}`;
    ui.ability.querySelector("small").textContent = !abilityUnlocked
      ? "Desbloqueia no nível 2"
      : abilityRemaining > 0
        ? `Recarga: ${abilityRemaining}s`
        : !hasTarget
          ? `${ability.description} · aguarde inimigos`
          : `${ability.description} · usar agora`;
    ui.ability.disabled = !abilityUnlocked || abilityRemaining > 0 || !hasTarget;
    ui.ability.classList.toggle("ready", !ui.ability.disabled);
  }

  function buyUpgrade(kind) {
    if (!upgradeTarget || state.phase !== "playing") return;
    const defender = upgradeTarget;
    const currentLevel = kind === "power" ? defender.powerLevel : defender.healthLevel;
    if (currentLevel >= 3) return;
    const cost = getUpgradeCost(defender, kind);
    if (state.sun < cost) { showToast("Energia Solar insuficiente para esta melhoria!"); return; }

    state.sun -= cost;
    defender.invested += cost;
    state.stats.upgradesBought += 1;
    if (kind === "power") {
      defender.powerLevel += 1;
      if (defender.type === "broccoli") defender.armor = Math.min(.45, defender.armor + .12);
      else {
        defender.damage = Math.round(defender.damage * 1.25);
        defender.cooldown = Math.max(.25, defender.cooldown * .92);
      }
    } else {
      defender.healthLevel += 1;
      const healthGain = Math.round(DEFENDERS[defender.type].hp * .3);
      defender.maxHp += healthGain;
      defender.hp += healthGain;
    }
    burst(defender.x, defender.y, kind === "power" ? "#ffd43b" : "#65d6ad", 22);
    showToast(`${defender.name} melhorou para o nível ${1 + defender.powerLevel + defender.healthLevel}!`);
    beep(620, .1, "triangle", .05);
    syncUi();
    renderUpgradePanel();
  }

  function useDefenderAbility() {
    if (!upgradeTarget || state.phase !== "playing") return;
    const defender = upgradeTarget;
    const level = 1 + defender.powerLevel + defender.healthLevel;
    const ability = defender.ability;
    if (level < 2 || defender.abilityReadyAt > state.time) return;
    const rowEnemies = state.enemies.filter(enemy => enemy.hp > 0 && !enemy.removed && enemy.row === defender.row).sort((a, b) => a.x - b.x);
    if (defender.type !== "broccoli" && rowEnemies.length === 0) return;
    const powerBonus = 1 + defender.powerLevel * .2;

    if (defender.type === "corn") {
      damageEnemy(rowEnemies[0], Math.round(120 * powerBonus), "#ffd43b", defender.type);
      burst(rowEnemies[0].x, rowEnemies[0].y, "#ffe66d", 28);
      triggerShake(6, 0.2);
    } else if (defender.type === "carrot") {
      for (const enemy of rowEnemies) {
        damageEnemy(enemy, Math.round(55 * powerBonus), "#ff8b2c", defender.type);
        burst(enemy.x, enemy.y, "#ffb15d", 10);
      }
      triggerShake(5, 0.2);
    } else if (defender.type === "broccoli") {
      const protectedDefenders = state.defenders.filter(candidate => Math.abs(candidate.row - defender.row) <= 1 && Math.abs(candidate.col - defender.col) <= 1);
      for (const candidate of protectedDefenders) {
        candidate.hp = Math.min(candidate.maxHp, candidate.hp + 120);
        candidate.guardUntil = state.time + 8;
        burst(candidate.x, candidate.y, "#72d9a4", 18);
        state.floaters.push({ x: candidate.x, y: candidate.y - 25, text: "+120 HP 💚", color: "#65d6ad", life: 1, scale: 1.1 });
      }
    } else if (defender.type === "pepper") {
      triggerShake(9, 0.28);
      for (const enemy of rowEnemies) {
        damageEnemy(enemy, Math.round(40 * powerBonus), "#f04b36", defender.type);
        enemy.burnUntil = state.time + 6;
        enemy.burnTick = 0;
        enemy.burnDamage = 12;
        enemy.burnSource = defender.type;
        state.floaters.push({ x: enemy.x, y: enemy.y - 38, text: "TRILHA DE FOGO! 🔥", color: "#ff6b4a", life: 1, scale: 1.15 });
      }
    } else if (defender.type === "tomato") {
      const target = rowEnemies[0];
      triggerShake(14, 0.4);
      for (const enemy of state.enemies) {
        const distance = Math.hypot(enemy.x - target.x, (enemy.row - target.row) * CELL_H);
        if (enemy.hp > 0 && !enemy.removed && distance < 175) damageEnemy(enemy, Math.round(120 * powerBonus), "#e93835", defender.type);
      }
      burst(target.x, target.y, "#ff5638", 60);
    } else if (defender.type === "watermelon") {
      defender.cooldownLeft = 0;
      defender.hp = Math.min(defender.maxHp, defender.hp + 80);
      burst(defender.x, defender.y, "#ff3b5c", 22);
      state.floaters.push({ x: defender.x, y: defender.y - 30, text: "SUPER DIGESTÃO! 🍉", color: "#ff3b5c", life: 1, scale: 1.15 });
      triggerShake(7, 0.22);
    }

    defender.abilityReadyAt = state.time + ability.cooldown;
    state.stats.abilitiesUsed += 1;
    showToast(`${defender.icon} ${ability.name} ativada!`);
    beep(defender.type === "tomato" ? 95 : 680, .18, defender.type === "tomato" ? "sawtooth" : "triangle", .07);
    syncUi();
    renderUpgradePanel();
  }

  function endGame(win) {
    state.phase = win ? "won" : "lost";
    closeUpgradePanel();
    const isNewRecord = state.score > bestScore;
    const isNewEndless = state.mode === "endless" && state.wave > bestEndlessWave;
    if (isNewEndless) {
      bestEndlessWave = state.wave;
      writeStorage(STORAGE_KEYS.bestEndlessWave, String(bestEndlessWave));
    }
    ui.overlayTitle.textContent = win ? "Vitória saudável!" : "A casa ficou açucarada!";
    ui.overlayText.textContent = state.mode === "endless"
      ? `Você alcançou a onda ${state.wave}${isNewEndless ? " e estabeleceu um novo recorde!" : "!"}`
      : win
      ? `A Vela Mestra foi derrotada${isNewRecord ? " e você bateu o recorde!" : "!"}`
      : "Os doces chegaram à Healthy Family Home. Reorganize a defesa e tente novamente.";
    ui.overlayButton.textContent = "Jogar novamente";
    ui.overlayCard.classList.add("result-mode");
    ui.modeSelector.hidden = false;
    updateModeSelector();
    renderResults(win, isNewRecord, isNewEndless);
    ui.overlay.classList.add("visible");
    if (isNewRecord) {
      bestScore = state.score;
      writeStorage(STORAGE_KEYS.bestScore, String(bestScore));
      ui.bestScore.textContent = bestScore;
    }
    if (win) {
      for (let i = 0; i < 130; i++) burst(random(0, W), random(0, H / 2), ["#ffd43b", "#ef476f", "#65d6ad", "#72a7ff"][i % 4], 1);
      beep(520, .15, "triangle", .07);
      setTimeout(() => beep(660, .18, "triangle", .07), 170);
      setTimeout(() => beep(780, .28, "triangle", .07), 350);
    }
  }

  function renderResults(win, isNewRecord, isNewEndless) {
    const houseRatio = Math.max(0, state.houseHp / state.maxHouseHp);
    const stars = state.mode === "endless"
      ? Math.min(3, Math.floor(state.wave / 5))
      : win ? 1 + Number(houseRatio >= .5) + Number(houseRatio >= .8) : 0;
    const topEntry = Object.entries(state.damageByType).sort((a, b) => b[1] - a[1])[0];
    const topDefender = topEntry ? `${DEFENDERS[topEntry[0]].icon} ${DEFENDERS[topEntry[0]].name} · ${Math.round(topEntry[1])}` : "—";
    const results = [
      ["🎮 Modo", MODES[state.mode].label.replace("Modo ", "")],
      ["⭐ Pontuação", state.score],
      ["🍬 Eliminados", state.stats.enemiesDefeated],
      ["💥 Dano total", Math.round(state.stats.damageDealt)],
      ["☀️ Energia coletada", state.stats.sunCollected],
      ["🏡 Casa restante", `${Math.round(houseRatio * 100)}%`],
      ["🌱 Defensores", state.stats.defendersPlaced],
      ["⬆️ Melhorias", state.stats.upgradesBought],
      ["♻️ Reembolsado", `${state.stats.refunded} ☀️`],
      ["💚 Hábitos usados", state.stats.habitsUsed],
      ["✨ Habilidades", state.stats.abilitiesUsed],
      ["🌊 Ondas completas", state.stats.wavesCompleted],
      ["🌟 Ondas perfeitas", state.stats.flawlessWaves],
      ["⚡ Combo máximo", `×${Math.max(1, state.stats.maxCombo)}`],
      ["🏹 Mais eficiente", topDefender]
    ];
    if (state.mode === "endless") results.splice(1, 0, ["🌊 Onda alcançada", state.wave]);
    ui.resultStars.textContent = `${"★".repeat(stars)}${"☆".repeat(3 - stars)}`;
    ui.resultStars.setAttribute("aria-label", `${stars} de 3 estrelas conquistadas`);
    ui.resultStats.replaceChildren(...results.map(([label, value]) => {
      const item = document.createElement("div");
      item.className = "result-stat";
      const labelElement = document.createElement("span");
      const valueElement = document.createElement("strong");
      labelElement.textContent = label;
      valueElement.textContent = value;
      item.append(labelElement, valueElement);
      return item;
    }));
    if (isNewRecord) {
      const badge = document.createElement("div");
      badge.className = "result-stat";
      badge.innerHTML = "<span>🏆 Conquista</span><strong>Novo recorde!</strong>";
      ui.resultStats.prepend(badge);
    }
    if (isNewEndless) {
      const badge = document.createElement("div");
      badge.className = "result-stat";
      badge.innerHTML = "<span>♾️ Infinito</span><strong>Novo recorde!</strong>";
      ui.resultStats.prepend(badge);
    }
    ui.resultSummary.hidden = false;
  }

  function clearSelection() {
    state.selected = null; state.shovel = false;
    closeUpgradePanel();
    ui.cards.forEach(card => card.classList.remove("selected"));
    document.getElementById("shovelButton").classList.remove("selected");
  }

  function updateCards() {
    if (!state) return;
    for (const card of ui.cards) {
      const type = card.dataset.defender;
      card.classList.toggle("unaffordable", state.sun < DEFENDERS[type].cost);
      card.setAttribute("aria-disabled", String(state.sun < DEFENDERS[type].cost || (type === "pepper" && !state.pepperUnlocked)));
      if (type === "pepper") {
        card.classList.toggle("locked", !state.pepperUnlocked);
        card.querySelector("strong").textContent = state.pepperUnlocked ? "Pimenta" : "Pimenta 🔒";
      }
    }
  }

  function syncUi() {
    if (!state) return;
    ui.sun.textContent = Math.floor(state.sun);
    ui.health.textContent = Math.ceil(state.houseHp);
    ui.healthBar.style.width = `${Math.max(0, state.houseHp / state.maxHouseHp * 100)}%`;
    ui.healthBar.style.background = state.houseHp < 300 ? "#ef476f" : "linear-gradient(90deg, #69c743, #b8e34d)";
    ui.wave.textContent = state.mode === "endless" ? `${state.wave}/∞` : `${state.wave}/3`;
    ui.score.textContent = state.score;
    ui.bestScore.textContent = bestScore;
    const waveTotal = state.spawnQueue.length;
    const waveProgress = waveTotal ? Math.min(1, state.waveResolved / waveTotal) : 0;
    ui.waveProgressFill.style.width = `${waveProgress * 100}%`;
    ui.waveProgressText.textContent = `${state.waveResolved} de ${waveTotal} resolvidos`;
    updateCards();
    if (upgradeTarget) renderUpgradePanel();
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 2300);
  }

  function draw() {
    if (!state) state = freshState();
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (state.shake && state.shake.duration > 0) {
      ctx.translate(state.shake.x, state.shake.y);
    }
    drawBackground();
    drawGrid();
    drawHouse();
    drawDefenders();
    drawEnemies();
    drawProjectiles();
    drawSuns();
    drawParticles();
    drawFloaters();
    drawWaveBanner();
    ctx.restore();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#95dff5"); sky.addColorStop(.29, "#dff5c6"); sky.addColorStop(.3, "#7ecb5a"); sky.addColorStop(1, "#4c9d45");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    drawCloud(270, 53, .9); drawCloud(675, 40, .7); drawCloud(880, 74, .5);
    ctx.fillStyle = "#4a8c3e";
    for (let x = 0; x < W; x += 38) {
      ctx.beginPath(); ctx.arc(x, 105 + Math.sin(x) * 5, 30, Math.PI, 0); ctx.fill();
    }
  }

  function drawCloud(x, y, s) {
    ctx.beginPath(); ctx.arc(x, y, 25*s, 0, Math.PI*2); ctx.arc(x+27*s, y-11*s, 31*s, 0, Math.PI*2); ctx.arc(x+58*s, y, 23*s, 0, Math.PI*2); ctx.fill();
  }

  function drawGrid() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        ctx.fillStyle = (row + col) % 2 ? "rgba(101,183,74,.75)" : "rgba(124,201,82,.78)";
        ctx.fillRect(GRID_X + col * CELL_W, GRID_Y + row * CELL_H, CELL_W, CELL_H);
        ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.strokeRect(GRID_X + col * CELL_W, GRID_Y + row * CELL_H, CELL_W, CELL_H);
      }
    }
    for (const row of getDangerousRows()) {
      ctx.fillStyle = `rgba(239, 71, 111, ${.1 + Math.sin(state.time * 7) * .04})`;
      ctx.fillRect(GRID_X, GRID_Y + row * CELL_H, COLS * CELL_W, CELL_H);
    }
    if (state.mouse.x >= GRID_X && state.mouse.y >= GRID_Y) {
      const col = Math.floor((state.mouse.x - GRID_X) / CELL_W);
      const row = Math.floor((state.mouse.y - GRID_Y) / CELL_H);
      if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
        ctx.fillStyle = state.shovel ? "rgba(90,160,230,.28)" : "rgba(255,238,99,.28)";
        ctx.fillRect(GRID_X + col * CELL_W, GRID_Y + row * CELL_H, CELL_W, CELL_H);
      }
    }
  }

  function drawHouse() {
    ctx.save();
    ctx.translate(12, 216);
    ctx.fillStyle = "#fff3d5"; roundRect(12, 40, 130, 220, 16); ctx.fill();
    ctx.fillStyle = "#e24b42"; ctx.beginPath(); ctx.moveTo(0, 52); ctx.lineTo(78, 0); ctx.lineTo(154, 52); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#68b8e8"; roundRect(38, 83, 38, 46, 5); ctx.fill(); ctx.strokeStyle = "white"; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = "#9b6035"; roundRect(87, 145, 35, 115, 6); ctx.fill();
    ctx.fillStyle = "#f8d95c"; ctx.beginPath(); ctx.arc(95, 204, 3, 0, Math.PI*2); ctx.fill();
    ctx.font = "bold 13px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillStyle = "#28543e"; ctx.fillText("HEALTHY", 77, 158); ctx.fillText("FAMILY", 77, 174); ctx.fillText("HOME", 77, 190);
    ctx.restore();
    ctx.fillStyle = "rgba(23,53,42,.35)"; ctx.fillRect(HOUSE_X, GRID_Y, 4, ROWS * CELL_H);
  }

  function drawDefenders() {
    for (const d of state.defenders) {
      ctx.save(); ctx.translate(d.x, d.y);
      const bob = Math.sin(state.time * 2.6 + d.sway) * 2;
      ctx.fillStyle = "rgba(28,81,37,.23)"; ctx.beginPath(); ctx.ellipse(0, 28, 31, 10, 0, 0, Math.PI*2); ctx.fill();

      const level = 1 + d.powerLevel + d.healthLevel;
      const abilityReady = level > 1 && d.abilityReadyAt <= state.time;
      if (abilityReady) {
        ctx.strokeStyle = `rgba(255, 240, 106, ${.4 + Math.sin(state.time * 6) * .3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 36 + Math.sin(state.time * 4) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.font = `${d.type === "broccoli" ? 54 : 49}px "Segoe UI Emoji"`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (d.hitFlash > 0) { ctx.shadowColor = "white"; ctx.shadowBlur = 20; }
      if (d.guardUntil > state.time) {
        ctx.fillStyle = "rgba(114, 217, 164, .22)"; ctx.beginPath(); ctx.arc(0, 0, 39, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#72d9a4"; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.fillText(d.icon, 0, bob);
      if (d.type === "watermelon" && d.cooldownLeft > 0) {
        ctx.font = "16px Segoe UI Emoji";
        ctx.fillText("😋", 22, -18);
        drawHealth(-29, -48, 58, 1 - (d.cooldownLeft / d.cooldown), "#ff5d73");
      }
      if (d.slowUntil > state.time) {
        ctx.font = "20px Segoe UI Emoji"; ctx.fillStyle = "#9b5de5"; ctx.fillText("🟣", 23, 18);
      }
      drawHealth(-29, -40, 58, d.hp / d.maxHp, "#57c84d");
      if (level > 1) {
        ctx.fillStyle = "#17352a"; ctx.beginPath(); ctx.arc(25, 23, 13, 0, Math.PI*2); ctx.fill();
        ctx.font = "bold 12px Trebuchet MS"; ctx.fillStyle = "#ffe27a"; ctx.fillText(`★${level}`, 25, 24);
      }
      if (abilityReady) {
        ctx.font = "bold 18px Trebuchet MS"; ctx.fillStyle = "#fff06a"; ctx.fillText("✦", -27, 25);
      }
      if (d === upgradeTarget) {
        ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI*2); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const e of state.enemies) {
      if (e.hp <= 0) continue;
      ctx.save(); ctx.translate(e.x, e.y);
      const bounce = Math.sin(state.time * 6 + e.wobble) * 3;
      ctx.fillStyle = "rgba(70,30,50,.22)"; ctx.beginPath(); ctx.ellipse(0, 29*e.scale, 30*e.scale, 9, 0, 0, Math.PI*2); ctx.fill();
      if (e.aura) {
        ctx.strokeStyle = "rgba(255, 190, 45, .75)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 48 + Math.sin(state.time * 5) * 4, 0, Math.PI*2); ctx.stroke();
      }
      if (e.auraBoosted) {
        ctx.fillStyle = "rgba(255, 214, 64, .18)"; ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI*2); ctx.fill();
      }
      if (e.boss) {
        ctx.fillStyle = "rgba(255,75,30,.15)"; ctx.beginPath(); ctx.arc(0, 0, 48 + Math.sin(state.time*4)*4, 0, Math.PI*2); ctx.fill();
      }
      ctx.font = `${52 * e.scale}px "Segoe UI Emoji"`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (e.hitFlash > 0) { ctx.shadowColor = "white"; ctx.shadowBlur = 22; }
      ctx.fillText(e.icon, 0, bounce);
      if (e.auraBoosted) { ctx.font = "18px Segoe UI Emoji"; ctx.fillText("⚡", 28 * e.scale, -22 * e.scale); }
      if (e.type === "marshmallow") {
        ctx.font = "25px sans-serif"; ctx.fillStyle = "#442c3b"; ctx.fillText("•ᴗ•", 0, bounce + 1);
      }
      drawHealth(-34*e.scale, -42*e.scale, 68*e.scale, e.hp / e.maxHp, e.boss ? "#d92e58" : "#ffcc42");
      if (e.maxShield > 0 && e.shield > 0) drawHealth(-34*e.scale, -53*e.scale, 68*e.scale, e.shield / e.maxShield, "#72d9ff");
      if (e.boss) { ctx.font = "bold 12px Trebuchet MS"; ctx.fillStyle = "#72203a"; ctx.fillText("VELA MESTRA", 0, -58); }
      ctx.restore();
    }
  }

  function drawProjectiles() {
    for (const p of state.projectiles) {
      ctx.save(); ctx.translate(p.x, p.y);
      if (p.icon === "●") { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = "#97740c"; ctx.lineWidth = 2; ctx.stroke(); }
      else { ctx.font = `${p.icon === "➤" ? 27 : 24}px "Segoe UI Emoji"`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(p.icon, 0, 0); }
      ctx.restore();
    }
  }

  function drawSuns() {
    for (const s of state.suns) {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.pulse * .15);
      const scale = 1 + Math.sin(s.pulse) * .08; ctx.scale(scale, scale);
      ctx.fillStyle = "rgba(255,222,57,.25)"; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI*2); ctx.fill();
      ctx.font = "39px Segoe UI Emoji"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("☀️", 0, 0); ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of state.particles) { ctx.globalAlpha = Math.max(0, p.life * 1.7); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  function drawFloaters() {
    for (const f of state.floaters) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, f.life * 2);
      const scale = f.scale || 1;
      ctx.translate(f.x, f.y);
      ctx.scale(scale, scale);
      ctx.font = "bold 18px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillStyle = f.color;
      ctx.strokeStyle = "#10251c";
      ctx.lineWidth = 4;
      ctx.strokeText(f.text, 0, 0);
      ctx.fillText(f.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawWaveBanner() {
    if (state.phase !== "playing") return;
    if (!state.waveActive) {
      ctx.fillStyle = "rgba(23,53,42,.78)"; roundRect(785, 15, 195, 38, 18); ctx.fill();
      ctx.font = "bold 14px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillStyle = "white";
      ctx.fillText("Prepare sua defesa", 882, 40);
      return;
    }
    const pending = state.spawnQueue.filter(s => !s.spawned).length;
    const dangerRows = getDangerousRows();
    ctx.fillStyle = dangerRows.length ? "rgba(210, 48, 82, .9)" : "rgba(23,53,42,.78)"; roundRect(795, 15, 185, 38, 18); ctx.fill();
    ctx.font = "bold 14px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillStyle = "white";
    ctx.fillText(dangerRows.length ? `⚠ Linha ${dangerRows[0] + 1} em perigo!` : pending ? `${pending} inimigos a caminho` : "Últimos inimigos!", 887, 40);
    if (state.time < state.attackBoostUntil) {
      ctx.fillStyle = "rgba(255,112,31,.9)"; roundRect(15, 15, 205, 38, 18); ctx.fill();
      ctx.fillStyle = "white"; ctx.fillText(`⚡ Ataque rápido: ${Math.ceil(state.attackBoostUntil - state.time)}s`, 117, 40);
    }
    if (state.combo > 1 && state.time <= state.comboExpiresAt) {
      ctx.fillStyle = "rgba(111, 55, 163, .92)"; roundRect(15, 62, 160, 34, 17); ctx.fill();
      ctx.fillStyle = "#fff06a"; ctx.fillText(`COMBO ×${state.combo}`, 95, 85);
    }
  }

  function getDangerousRows() {
    if (!state.waveActive) return [];
    return [...new Set(state.enemies.filter(enemy => enemy.hp > 0 && !enemy.removed && enemy.x < GRID_X + CELL_W * 1.5).map(enemy => enemy.row))];
  }

  function drawHealth(x, y, width, ratio, color) {
    ctx.fillStyle = "rgba(25,36,30,.65)"; roundRect(x, y, width, 8, 4); ctx.fill();
    ctx.fillStyle = color; roundRect(x + 1, y + 1, Math.max(0, (width - 2) * Math.max(0, ratio)), 6, 3); ctx.fill();
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, Math.abs(width)/2, Math.abs(height)/2);
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+width,y,x+width,y+height,r); ctx.arcTo(x+width,y+height,x,y+height,r); ctx.arcTo(x,y+height,x,y,r); ctx.arcTo(x,y,x+width,y,r); ctx.closePath();
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
  }

  function beep(frequency, duration, type = "sine", volume = .035) {
    if (!soundOn) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator(); const gain = audioCtx.createGain();
      oscillator.type = type; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(volume, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
      oscillator.connect(gain); gain.connect(audioCtx.destination); oscillator.start(); oscillator.stop(audioCtx.currentTime + duration);
    } catch (_) { /* som é opcional */ }
  }

  function random(min, max) { return min + Math.random() * (max - min); }

  function readNumber(key) {
    try { return Math.max(0, Number.parseInt(localStorage.getItem(key), 10) || 0); }
    catch (_) { return 0; }
  }

  function readFlag(key) {
    try { return localStorage.getItem(key) === "true"; }
    catch (_) { return false; }
  }

  function readMode() {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEYS.selectedMode);
      return Object.hasOwn(MODES, savedMode) ? savedMode : "normal";
    } catch (_) { return "normal"; }
  }

  function writeStorage(key, value) {
    try { localStorage.setItem(key, value); }
    catch (_) { /* persistência é opcional */ }
  }

  function updateModeSelector() {
    ui.modeButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mode === selectedMode)));
    const legend = ui.modeSelector.querySelector("legend");
    legend.textContent = state && (state.phase === "won" || state.phase === "lost") ? "Modo da próxima partida" : "Escolha o modo";
  }

  function renderEnemyGuide() {
    ui.enemyGuide.replaceChildren(...Object.values(ENEMIES).map(enemy => {
      const card = document.createElement("article");
      card.className = "enemy-guide-card";
      const icon = document.createElement("span");
      icon.className = "enemy-guide-icon";
      icon.textContent = enemy.icon;
      const copy = document.createElement("div");
      const name = document.createElement("strong");
      const description = document.createElement("small");
      name.textContent = enemy.name;
      description.textContent = `${enemy.description} · ${enemy.hp} HP base`;
      copy.append(name, description);
      card.append(icon, copy);
      return card;
    }));
  }

  function selectMode(modeName) {
    if (!Object.hasOwn(MODES, modeName) || state.phase === "playing") return;
    selectedMode = modeName;
    writeStorage(STORAGE_KEYS.selectedMode, selectedMode);
    updateModeSelector();
    ui.overlayButton.textContent = state.phase === "intro" ? "Começar aventura" : `Jogar no ${MODES[selectedMode].label}`;
    if (state.phase === "intro") {
      state = freshState();
      syncUi();
      updateWavePreview();
      draw();
    }
  }

  function showTutorial(step) {
    const instructions = [
      "Escolha um vegetal. O Milho é uma boa opção para começar.",
      "Agora toque em um quadrado do jardim para posicionar o defensor.",
      "Veja quais inimigos virão e clique em Iniciar onda quando estiver pronto."
    ];
    state.tutorialStep = step;
    ui.tutorial.hidden = false;
    ui.tutorialStep.textContent = `Tutorial ${step + 1}/3`;
    ui.tutorialText.textContent = instructions[step];
    document.querySelectorAll(".tutorial-focus").forEach(element => element.classList.remove("tutorial-focus"));
    if (step === 0) ui.cards[0].classList.add("tutorial-focus");
    if (step === 1) canvas.classList.add("tutorial-focus");
    if (step === 2) ui.startWave.classList.add("tutorial-focus");
    updateWavePreview();
  }

  function hideTutorial() {
    ui.tutorial.hidden = true;
    document.querySelectorAll(".tutorial-focus").forEach(element => element.classList.remove("tutorial-focus"));
  }

  function completeTutorial() {
    tutorialSeen = true;
    state.tutorialStep = -1;
    writeStorage(STORAGE_KEYS.tutorialSeen, "true");
    hideTutorial();
    updateWavePreview();
  }

  ui.cards.forEach(card => card.addEventListener("click", () => {
    if (state.phase !== "playing") return;
    const type = card.dataset.defender;
    if (type === "pepper" && !state.pepperUnlocked) { showToast("Coma vegetais para liberar a Pimenta!"); return; }
    if (state.sun < DEFENDERS[type].cost) { showToast("Energia Solar insuficiente!"); return; }
    closeUpgradePanel();
    state.selected = type; state.shovel = false;
    ui.cards.forEach(c => c.classList.toggle("selected", c === card));
    document.getElementById("shovelButton").classList.remove("selected");
    if (state.tutorialStep === 0) showTutorial(1);
  }));

  document.getElementById("shovelButton").addEventListener("click", event => {
    if (state.phase !== "playing") return;
    closeUpgradePanel();
    state.selected = null; state.shovel = true;
    ui.cards.forEach(c => c.classList.remove("selected"));
    event.currentTarget.classList.add("selected");
  });

  ui.habits.forEach(button => button.addEventListener("click", () => useHabit(button.dataset.habit, button)));
  ui.modeButtons.forEach(button => button.addEventListener("click", () => selectMode(button.dataset.mode)));
  ui.startWave.addEventListener("click", startWave);
  ui.skipTutorial.addEventListener("click", completeTutorial);
  ui.closeUpgrade.addEventListener("click", closeUpgradePanel);
  ui.powerUpgrade.addEventListener("click", () => buyUpgrade("power"));
  ui.healthUpgrade.addEventListener("click", () => buyUpgrade("health"));
  ui.ability.addEventListener("click", useDefenderAbility);
  ui.overlayButton.addEventListener("click", () => {
    if (state.phase === "playing" && state.paused) {
      state.paused = false;
      ui.overlay.classList.remove("visible");
      ui.pause.textContent = "⏸ Pausar";
      lastTime = performance.now();
      return;
    }
    startGame();
  });
  ui.speed.addEventListener("click", () => {
    if (state.phase !== "playing") return;
    state.gameSpeed = state.gameSpeed === 1 ? 2 : 1;
    ui.speed.textContent = `⏩ ${state.gameSpeed}×`;
    ui.speed.setAttribute("aria-label", state.gameSpeed === 1 ? "Aumentar velocidade para 2×" : "Reduzir velocidade para 1×");
    showToast(`Velocidade ${state.gameSpeed}×`);
  });
  ui.pause.addEventListener("click", () => {
    if (state.phase !== "playing") return;
    state.paused = !state.paused;
    ui.pause.textContent = state.paused ? "▶ Continuar" : "⏸ Pausar";
    ui.overlayTitle.textContent = "Jogo pausado";
    ui.overlayText.textContent = "Respire, beba água e continue quando estiver pronto.";
    ui.overlayButton.textContent = "Continuar";
    ui.modeSelector.hidden = true;
    ui.resultSummary.hidden = true;
    ui.overlayCard.classList.remove("result-mode");
    ui.overlay.classList.toggle("visible", state.paused);
  });
  ui.sound.addEventListener("click", () => {
    soundOn = !soundOn;
    ui.sound.textContent = soundOn ? "🔊" : "🔇";
    ui.sound.setAttribute("aria-pressed", String(!soundOn));
    ui.sound.setAttribute("aria-label", soundOn ? "Desativar som" : "Ativar som");
  });
  canvas.addEventListener("pointerdown", event => { event.preventDefault(); const p = pointerPosition(event); placeAt(p.x, p.y); });
  canvas.addEventListener("pointermove", event => { state.mouse = pointerPosition(event); });
  canvas.addEventListener("pointerleave", () => { state.mouse = { x: -1, y: -1 }; });
  window.addEventListener("keydown", event => {
    if (event.code === "Space") { event.preventDefault(); ui.pause.click(); }
    if (event.code === "KeyF") ui.speed.click();
    if (event.key >= "1" && event.key <= "6") ui.cards[Number(event.key) - 1]?.click();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.phase === "playing" && !state.paused) ui.pause.click();
  });

  state = freshState();
  renderEnemyGuide();
  updateModeSelector();
  syncUi();
  updateWavePreview();
  draw();
})();
