"use strict";

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  init() {
    this.W = 1000;
    this.H = 620;
    this.ROWS = 5;
    this.COLS = 8;
    this.GRID_X = 185;
    this.GRID_Y = 118;
    this.CELL_W = 92;
    this.CELL_H = 92;
    this.HOUSE_X = 118;
  }

  create() {
    this.audioCtx = null;
    this.soundOn = true;
    this.upgradeTarget = null;
    this.bestScore = readNumber(STORAGE_KEYS.bestScore);
    this.tutorialSeen = readFlag(STORAGE_KEYS.tutorialSeen);
    this.selectedMode = readMode();
    this.bestEndlessWave = readNumber(STORAGE_KEYS.bestEndlessWave);

    this.gameState = this.createFreshState();
    
    this.drawBackgroundGraphics();
    this.drawGridGraphics();
    this.drawHouseGraphics();

    this.particlesGroup = this.add.group();
    this.floatersGroup = this.add.group();
    this.defendersGroup = this.add.group();
    this.enemiesGroup = this.add.group();
    this.projectilesGroup = this.add.group();
    this.sunsGroup = this.add.group();

    this.graphicsOverlay = this.add.graphics();
    this.uiOverlayText = this.add.text(887, 34, "Prepare sua defesa", {
      fontFamily: "Trebuchet MS",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.input.on("pointerdown", (pointer) => {
      this.handlePointerDown(pointer.x, pointer.y);
    });

    this.input.on("pointermove", (pointer) => {
      this.gameState.mouse = { x: pointer.x, y: pointer.y };
    });

    this.startGame();
  }

  createFreshState() {
    const mode = MODES[this.selectedMode];
    const seed = Math.floor(Math.random() * 899999) + 100000;
    return {
      phase: "intro",
      paused: false,
      gameSpeed: 1,
      time: 0,
      mode: this.selectedMode,
      seed: seed,
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
      spawnQueue: generateProceduralWave(1, seed),
      usedHabits: new Set(),
      nextSun: 5,
      tutorialStep: this.tutorialSeen ? -1 : 0,
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

  drawBackgroundGraphics() {
    if (!this.bgGraphics) this.bgGraphics = this.add.graphics();
    this.bgGraphics.clear();
    const biome = getBiomeForWave(this.gameState ? this.gameState.wave : 1);
    this.bgGraphics.fillGradientStyle(biome.skyTop, biome.skyTop, biome.skyBottom, biome.skyBottom, 1);
    this.bgGraphics.fillRect(0, 0, this.W, this.H);

    this.bgGraphics.fillStyle(0xffffff, 0.85);
    this.drawCloudGraphics(this.bgGraphics, 270, 53, .9);
    this.drawCloudGraphics(this.bgGraphics, 675, 40, .7);
    this.drawCloudGraphics(this.bgGraphics, 880, 74, .5);

    this.bgGraphics.fillStyle(biome.bushColor, 1);
    for (let x = 0; x < this.W; x += 38) {
      this.bgGraphics.fillCircle(x, 105 + Math.sin(x) * 5, 25);
    }
  }

  drawCloudGraphics(g, x, y, s) {
    g.fillCircle(x, y, 25 * s);
    g.fillCircle(x + 27 * s, y - 11 * s, 31 * s);
    g.fillCircle(x + 58 * s, y, 23 * s);
  }

  drawGridGraphics() {
    if (!this.gridGraphics) this.gridGraphics = this.add.graphics();
    this.gridGraphics.clear();
    const biome = getBiomeForWave(this.gameState ? this.gameState.wave : 1);
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const color = (row + col) % 2 ? biome.gridColor1 : biome.gridColor2;
        this.gridGraphics.fillStyle(color, 0.85);
        this.gridGraphics.fillRect(this.GRID_X + col * this.CELL_W, this.GRID_Y + row * this.CELL_H, this.CELL_W, this.CELL_H);
        this.gridGraphics.lineStyle(1, 0xffffff, 0.16);
        this.gridGraphics.strokeRect(this.GRID_X + col * this.CELL_W, this.GRID_Y + row * this.CELL_H, this.CELL_W, this.CELL_H);
      }
    }
  }

  drawHouseGraphics() {
    const house = this.add.graphics();
    house.fillStyle(0xfff3d5, 1);
    house.fillRoundedRect(24, 256, 130, 220, 16);
    house.fillStyle(0xe24b42, 1);
    house.fillTriangle(12, 268, 90, 216, 166, 268);
    house.fillStyle(0x68b8e8, 1);
    house.fillRoundedRect(50, 299, 38, 46, 5);
    house.lineStyle(4, 0xffffff, 1);
    house.strokeRoundedRect(50, 299, 38, 46, 5);
    house.fillStyle(0x9b6035, 1);
    house.fillRoundedRect(99, 361, 35, 115, 6);

    this.add.text(89, 380, "HEALTHY\nFAMILY\nHOME", {
      fontFamily: "Trebuchet MS",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#28543e",
      align: "center"
    }).setOrigin(0.5);

    house.fillStyle(0x17352a, 0.35);
    house.fillRect(this.HOUSE_X, this.GRID_Y, 4, this.ROWS * this.CELL_H);
  }

  startGame() {
    this.gameState = this.createFreshState();
    this.gameState.phase = "playing";
    if (window.onPhaserGameStarted) window.onPhaserGameStarted(this);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05) * this.gameState.gameSpeed;
    if (this.gameState.phase !== "playing" || this.gameState.paused) return;

    if (this.gameState.waveActive) {
      this.gameState.time += dt;
      this.gameState.waveTime += dt;
      if (this.gameState.time > this.gameState.comboExpiresAt) this.gameState.combo = 0;

      for (const item of this.gameState.spawnQueue) {
        if (!item.spawned && this.gameState.waveTime >= item.at) {
          this.spawnEnemy(item.type, item.row);
          item.spawned = true;
        }
      }

      if (this.gameState.time >= this.gameState.nextSun) {
        this.spawnSun();
        this.gameState.nextSun = this.gameState.time + this.random(6, 9);
      }
    }

    this.updateDefenders(dt);
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateSuns(dt);
    this.updateParticles(dt);
    this.updateFloaters(dt);

    const spawnedAll = this.gameState.spawnQueue.length > 0 && this.gameState.spawnQueue.every(item => item.spawned);
    if (this.gameState.phase === "playing" && this.gameState.waveActive && spawnedAll && this.gameState.enemies.length === 0) {
      this.completeWave();
      this.nextWave();
    }

    if (window.onPhaserSyncUi) window.onPhaserSyncUi(this.gameState);
  }

  completeWave() {
    this.gameState.stats.wavesCompleted += 1;
    const bonus = 40 + this.gameState.wave * 15;
    this.gameState.sun += bonus;
    this.gameState.score += bonus * 5;
    return bonus;
  }

  nextWave() {
    this.gameState.wave += 1;
    this.gameState.waveTime = 0;
    this.gameState.waveActive = false;
    this.gameState.waveResolved = 0;
    this.gameState.combo = 0;
    this.gameState.spawnQueue = generateProceduralWave(this.gameState.wave, this.gameState.seed);
    this.drawBackgroundGraphics();
    this.drawGridGraphics();
    const biome = getBiomeForWave(this.gameState.wave);
    this.spawnFloater(500, 200, `${biome.icon} ONDA ${this.gameState.wave}!`, "#fff06a", 1.4);
    this.beep(560, .11, "triangle");
  }

  spawnSun() {
    const sunObj = {
      x: this.random(this.GRID_X + 30, this.GRID_X + this.COLS * this.CELL_W - 30),
      y: -25,
      targetY: this.random(this.GRID_Y + 10, this.GRID_Y + this.ROWS * this.CELL_H - 20),
      life: 10,
      value: 25,
      pulse: 0
    };
    sunObj.textObj = this.add.text(sunObj.x, sunObj.y, "☀️", { fontSize: "36px" }).setOrigin(0.5);
    this.gameState.suns.push(sunObj);
  }

  updateSuns(dt) {
    for (const s of this.gameState.suns) {
      s.pulse += dt * 4;
      s.life -= dt;
      if (s.y < s.targetY) s.y = Math.min(s.targetY, s.y + 75 * dt);
      if (s.textObj) {
        s.textObj.setPosition(s.x, s.y);
        const scale = 1 + Math.sin(s.pulse) * 0.08;
        s.textObj.setScale(scale);
        if (s.life <= 0) {
          s.textObj.destroy();
        }
      }
    }
    this.gameState.suns = this.gameState.suns.filter(s => s.life > 0);
  }

  spawnEnemy(type, row) {
    const base = ENEMIES[type];
    const mode = MODES[this.gameState.mode];
    const endlessGrowth = this.gameState.mode === "endless" ? Math.max(0, this.gameState.wave - 3) : 0;
    const waveHpScale = 1 + (this.gameState.wave - 1) * (this.gameState.mode === "endless" ? .16 : .13);
    const hpScale = (base.boss ? 1 + endlessGrowth * .12 : waveHpScale) * mode.enemyHp;
    const speedScale = mode.enemySpeed * (1 + Math.min(.3, endlessGrowth * .015));
    const damageScale = mode.enemyDamage * (1 + Math.min(.5, endlessGrowth * .025));

    const x = this.W + 42;
    const y = this.GRID_Y + row * this.CELL_H + this.CELL_H / 2;

    const enemy = {
      ...base, type, row, x, y,
      hp: Math.round(base.hp * hpScale), maxHp: Math.round(base.hp * hpScale),
      shield: Math.round((base.shield || 0) * hpScale), maxShield: Math.round((base.shield || 0) * hpScale),
      speed: base.speed * speedScale, damage: Math.round(base.damage * damageScale),
      attackTimer: 0, hitFlash: 0, burnUntil: 0, burnTick: 0, wobble: Math.random() * 6
    };

    enemy.textObj = this.add.text(x, y, base.icon, { fontSize: `${46 * base.scale}px` }).setOrigin(0.5);
    this.gameState.enemies.push(enemy);

    if (type === "candle") {
      this.triggerShake(12, 450);
      this.beep(130, .4, "sawtooth");
    }
  }

  updateDefenders(dt) {
    const boosted = this.gameState.time < this.gameState.attackBoostUntil;
    for (const defender of this.gameState.defenders) {
      const slowed = defender.slowUntil > this.gameState.time;
      defender.cooldownLeft -= dt * (boosted ? 2 : 1) * (slowed ? .6 : 1);

      if (defender.type === "watermelon" && defender.cooldownLeft <= 0) {
        const prey = this.gameState.enemies
          .filter(enemy => enemy.row === defender.row && enemy.hp > 0 && !enemy.removed && Math.abs(enemy.x - (defender.x + 15)) < 65 && enemy.x >= defender.x - 15)
          .sort((a, b) => a.x - b.x)[0];
        if (prey) {
          defender.cooldownLeft = defender.cooldown;
          this.beep(160, .22, "sawtooth", .08);
          this.triggerShake(6, 200);
          this.burst(defender.x + 25, defender.y, "#ff3b5c", 18);
          if (prey.boss) {
            const bossDamage = Math.round(450 * (1 + defender.powerLevel * .2));
            this.damageEnemy(prey, bossDamage, "#ff3b5c", defender.type);
            this.spawnFloater(prey.x, prey.y - 45, `NHAM! -${bossDamage}💥`, "#ff3b5c", 1.25);
          } else {
            const totalHp = prey.hp + (prey.shield || 0);
            this.damageEnemy(prey, totalHp, "#ff3b5c", defender.type);
            this.spawnFloater(defender.x + 20, defender.y - 35, "NHAM! 🍉", "#ff3b5c", 1.2);
          }
        }
        continue;
      }

      const target = this.gameState.enemies
        .filter(enemy => enemy.row === defender.row && enemy.x > defender.x - 5)
        .sort((a, b) => a.x - b.x)[0];
      if (target && defender.damage > 0 && defender.cooldownLeft <= 0) {
        defender.cooldownLeft = defender.cooldown;
        this.spawnProjectile(defender);
        this.beep(defender.type === "pepper" ? 260 : 520, .025, "square", .025);
      }
    }
  }

  spawnProjectile(defender) {
    const p = {
      x: defender.x + 25,
      y: defender.y - 3,
      row: defender.row,
      speed: defender.type === "carrot" ? 360 : 280,
      damage: defender.damage,
      color: defender.color,
      icon: defender.projectile,
      area: defender.area,
      burn: defender.burn,
      sourceType: defender.type,
      removed: false
    };
    p.textObj = this.add.text(p.x, p.y, p.icon, { fontSize: "24px" }).setOrigin(0.5);
    this.gameState.projectiles.push(p);
  }

  updateProjectiles(dt) {
    for (const p of this.gameState.projectiles) {
      p.x += p.speed * dt;
      if (p.textObj) p.textObj.setPosition(p.x, p.y);

      if (p.sourceType === "pepper" && Math.random() < 0.4) {
        this.burst(p.x - 10, p.y, "#ff6b4a", 1);
      }

      const hit = this.gameState.enemies.filter(e => e.row === p.row && e.hp > 0 && Math.abs(e.x - p.x) < 32).sort((a, b) => a.x - b.x)[0];
      if (!hit) continue;

      if (p.area) {
        for (const enemy of this.gameState.enemies) {
          const distance = Math.hypot(enemy.x - hit.x, (enemy.row - hit.row) * this.CELL_H);
          if (distance < 125) this.damageEnemy(enemy, p.damage, "#f94f37", p.sourceType);
        }
        this.burst(hit.x, hit.y, "#ff5638", 22);
        this.triggerShake(8, 250);
        this.beep(95, .12, "sawtooth", .06);
      } else {
        this.damageEnemy(hit, p.damage, p.color, p.sourceType);
        if (p.burn) {
          hit.burnUntil = this.gameState.time + 3;
          hit.burnTick = 0;
          hit.burnDamage = 7;
          hit.burnSource = p.sourceType;
        }
        this.burst(hit.x, hit.y, p.color, 8);
      }
      p.removed = true;
      if (p.textObj) p.textObj.destroy();
    }
    this.gameState.projectiles = this.gameState.projectiles.filter(p => !p.removed && p.x < this.W + 30);
  }

  damageEnemy(enemy, amount, color, sourceType = null) {
    if (enemy.hp <= 0) return;
    let remainingDamage = amount;
    let absorbedDamage = 0;
    if (enemy.shield > 0) {
      absorbedDamage = Math.min(enemy.shield, remainingDamage);
      enemy.shield -= absorbedDamage;
      remainingDamage -= absorbedDamage;
      if (enemy.shield <= 0) {
        this.burst(enemy.x, enemy.y, "#72d9ff", 20);
        this.spawnFloater(enemy.x, enemy.y - 45, "ESCUDO QUEBRADO! 🛡️", "#72d9ff", 1.15);
      }
    }

    const actualDamage = absorbedDamage + Math.min(enemy.hp, remainingDamage);
    enemy.hp -= remainingDamage;
    this.gameState.stats.damageDealt += actualDamage;
    if (sourceType) this.gameState.damageByType[sourceType] = (this.gameState.damageByType[sourceType] || 0) + actualDamage;

    const isBigHit = actualDamage >= 70;
    const floatText = isBigHit ? `-${Math.round(actualDamage)}💥` : `-${Math.round(actualDamage)}`;
    this.spawnFloater(enemy.x, enemy.y - 30, floatText, absorbedDamage > 0 ? "#72d9ff" : color, isBigHit ? 1.25 : 1);

    if (enemy.hp <= 0) {
      this.gameState.stats.enemiesDefeated += 1;
      this.gameState.waveResolved += 1;
      this.gameState.combo = this.gameState.time <= this.gameState.comboExpiresAt ? this.gameState.combo + 1 : 1;
      this.gameState.comboExpiresAt = this.gameState.time + 4;
      this.gameState.stats.maxCombo = Math.max(this.gameState.stats.maxCombo, this.gameState.combo);

      const mode = MODES[this.gameState.mode];
      const endlessMultiplier = this.gameState.mode === "endless" ? 1 + (this.gameState.wave - 1) * .03 : 1;
      const comboMultiplier = 1 + (this.gameState.combo - 1) * .25;

      this.gameState.score += Math.round(enemy.reward * 10 * mode.scoreMultiplier * endlessMultiplier * comboMultiplier);
      this.gameState.sun += enemy.reward;
      enemy.removed = true;

      if (enemy.textObj) enemy.textObj.destroy();
      this.burst(enemy.x, enemy.y, "#ffc44d", enemy.boss ? 50 : 18);
      this.beep(enemy.boss ? 100 : 180, enemy.boss ? .5 : .08, "triangle", .06);
      if (enemy.boss) this.triggerShake(15, 450);
    }
  }

  updateEnemies(dt) {
    for (const enemy of this.gameState.enemies) {
      if (enemy.hp <= 0 || enemy.removed) continue;

      const blocker = this.gameState.defenders.find(d => d.row === enemy.row && Math.abs(enemy.x - d.x) < 44 && d.hp > 0);

      if (blocker) {
        enemy.attackTimer = (enemy.attackTimer || 0) - dt;
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = enemy.attackRate || 1;
          const damage = enemy.damage || 18;
          blocker.hp -= damage;

          this.burst(blocker.x + 10, blocker.y, "#fff0a8", 6);
          this.spawnFloater(blocker.x, blocker.y - 28, `-${damage}💔`, "#ff4d4d", 1.1);
          this.beep(220, .05, "sawtooth", .03);

          if (blocker.hp <= 0) {
            this.spawnFloater(blocker.x, blocker.y - 35, "Derrotado! 💔", "#ef476f", 1.2);
            if (blocker.textObj) blocker.textObj.destroy();
            this.burst(blocker.x, blocker.y, "#ef476f", 18);
          }
        }
      } else {
        enemy.x -= enemy.speed * dt;
        if (enemy.textObj) enemy.textObj.setPosition(enemy.x, enemy.y);
      }

      if (enemy.x < this.HOUSE_X) {
        this.gameState.houseHp -= enemy.boss ? 450 : Math.max(80, enemy.maxHp * .5);
        this.gameState.houseDamagedThisWave = true;
        this.gameState.waveResolved += 1;
        enemy.removed = true;
        if (enemy.textObj) enemy.textObj.destroy();
        this.burst(this.HOUSE_X, enemy.y, "#ef476f", 25);
        this.triggerShake(9, 280);
        this.beep(85, .25, "sawtooth", .08);
      }
    }
    this.gameState.defenders = this.gameState.defenders.filter(d => d.hp > 0);
    this.gameState.enemies = this.gameState.enemies.filter(e => e.hp > 0 && !e.removed);
  }

  updateParticles(dt) {
    for (const p of this.gameState.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.gfx) {
        p.gfx.setPosition(p.x, p.y);
        p.gfx.setAlpha(Math.max(0, p.life * 1.5));
        if (p.life <= 0) p.gfx.destroy();
      }
    }
    this.gameState.particles = this.gameState.particles.filter(p => p.life > 0);
  }

  updateFloaters(dt) {
    for (const f of this.gameState.floaters) {
      f.y -= 30 * dt;
      f.life -= dt;
      if (f.textObj) {
        f.textObj.setPosition(f.x, f.y);
        f.textObj.setAlpha(Math.min(1, f.life * 2));
        if (f.life <= 0) f.textObj.destroy();
      }
    }
    this.gameState.floaters = this.gameState.floaters.filter(f => f.life > 0);
  }

  burst(x, y, colorHex, count) {
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.random(25, 130);
      const gfx = this.add.graphics();
      gfx.fillStyle(color, 1);
      gfx.fillCircle(0, 0, this.random(2, 6));
      this.gameState.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: this.random(.3, .8), gfx
      });
    }
  }

  spawnFloater(x, y, text, color, scale = 1) {
    const textObj = this.add.text(x, y, text, {
      fontFamily: "Trebuchet MS",
      fontSize: "18px",
      fontStyle: "bold",
      color: color,
      stroke: "#10251c",
      strokeThickness: 4
    }).setOrigin(0.5).setScale(scale);
    this.gameState.floaters.push({ x, y, text, color, life: 0.8, textObj });
  }

  triggerShake(intensity = 8, duration = 250) {
    this.cameras.main.shake(duration, intensity / 1000);
  }

  handlePointerDown(x, y) {
    if (this.gameState.phase !== "playing" || this.gameState.paused) return;

    const sun = [...this.gameState.suns].reverse().find(s => Math.hypot(s.x - x, s.y - y) < 40);
    if (sun) {
      this.gameState.sun += sun.value;
      this.gameState.stats.sunCollected += sun.value;
      sun.life = 0;
      if (sun.textObj) sun.textObj.destroy();
      this.spawnFloater(sun.x, sun.y, `+${sun.value} ☀️`, "#fff06a", 1.2);
      this.beep(760, .08, "sine", .04);
      return;
    }

    const col = Math.floor((x - this.GRID_X) / this.CELL_W);
    const row = Math.floor((y - this.GRID_Y) / this.CELL_H);
    if (col < 0 || col >= this.COLS || row < 0 || row >= this.ROWS) return;

    const existing = this.gameState.defenders.find(d => d.row === row && d.col === col);
    if (this.gameState.shovel) {
      if (existing) {
        const refund = Math.floor(existing.invested * .5);
        this.gameState.sun += refund;
        this.gameState.stats.refunded += refund;
        this.burst(existing.x, existing.y, "#b9e4a3", 12);
        this.spawnFloater(existing.x, existing.y - 20, `+${refund} ☀️`, "#b9e4a3", 1.2);
        if (existing.textObj) existing.textObj.destroy();
        this.gameState.defenders = this.gameState.defenders.filter(d => d !== existing);
      }
      this.gameState.shovel = false;
      return;
    }

    if (existing) {
      if (window.onPhaserSelectDefender) window.onPhaserSelectDefender(existing);
      return;
    }

    if (this.gameState.selected) {
      this.placeDefender(col, row, this.gameState.selected);
    }
  }

  placeDefender(col, row, type) {
    const config = DEFENDERS[type];
    if (this.gameState.sun < config.cost) return;

    this.gameState.sun -= config.cost;
    const x = this.GRID_X + col * this.CELL_W + this.CELL_W / 2;
    const y = this.GRID_Y + row * this.CELL_H + this.CELL_H / 2;

    const defender = {
      ...config, type, row, col, x, y,
      maxHp: config.hp, cooldownLeft: .2, hitFlash: 0, slowUntil: 0, guardUntil: 0, abilityReadyAt: 0, sway: Math.random() * 5,
      powerLevel: 0, healthLevel: 0, armor: 0, invested: config.cost
    };

    defender.textObj = this.add.text(x, y, config.icon, { fontSize: "48px" }).setOrigin(0.5);
    this.gameState.defenders.push(defender);
    this.gameState.stats.defendersPlaced += 1;

    this.burst(x, y, "#d8ff91", 14);
    this.beep(330, .07, "sine", .04);
  }

  beep(frequency, duration, type = "sine", volume = .035) {
    try {
      this.audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, this.audioCtx.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(this.audioCtx.destination);
      oscillator.start();
      oscillator.stop(this.audioCtx.currentTime + duration);
    } catch (_) { /* som é opcional */ }
  }

  random(min, max) { return min + Math.random() * (max - min); }
}
