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

  preload() {
    this.load.image("hero_avatar", "assets/levi_avatar.jpg");
    TextureGenerator.generateAll(this);
  }

  create() {
    this.soundOn = true;
    this.bestScore = readNumber(STORAGE_KEYS.bestScore);
    this.tutorialSeen = readFlag(STORAGE_KEYS.tutorialSeen);
    this.selectedMode = readMode();
    this.bestEndlessWave = readNumber(STORAGE_KEYS.bestEndlessWave);

    // Initialize Entity Systems
    this.soundManager = new SoundManager(this);
    this.effectsSystem = new EffectsSystem(this);
    this.projectileSystem = new ProjectileSystem(this);
    this.defenderSystem = new DefenderSystem(this);
    this.enemySystem = new EnemySystem(this);

    this.gameState = this.createFreshState();
    
    this.drawBackgroundGraphics();
    this.drawGridGraphics();
    this.drawHouseGraphics();
    this.createHeroMascot();

    this.uiOverlayText = this.add.text(887, 34, "🌱 Prepare sua defesa", {
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
      enemyProjectiles: [],
      particles: [],
      suns: [],
      floaters: [],
      spawnQueue: generateProceduralWave(1, seed, this.selectedMode),
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

    const cTop = Phaser.Display.Color.IntegerToColor(biome.skyTop);
    const cBot = Phaser.Display.Color.IntegerToColor(biome.skyBottom);
    const steps = 24;
    const stepH = this.H / steps;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.round(cTop.r + (cBot.r - cTop.r) * ratio);
      const g = Math.round(cTop.g + (cBot.g - cTop.g) * ratio);
      const b = Math.round(cTop.b + (cBot.b - cTop.b) * ratio);
      const hex = Phaser.Display.Color.GetColor(r, g, b);
      this.bgGraphics.fillStyle(hex, 1);
      this.bgGraphics.fillRect(0, i * stepH, this.W, stepH + 1);
    }

    this.bgGraphics.fillStyle(0xffffff, 0.85);
    this.drawCloudGraphics(this.bgGraphics, 270, 53, 0.9);
    this.drawCloudGraphics(this.bgGraphics, 675, 40, 0.7);
    this.drawCloudGraphics(this.bgGraphics, 880, 74, 0.5);

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
        this.gridGraphics.fillStyle(color, 0.88);
        this.gridGraphics.fillRect(this.GRID_X + col * this.CELL_W, this.GRID_Y + row * this.CELL_H, this.CELL_W, this.CELL_H);
        this.gridGraphics.lineStyle(1, 0xffffff, 0.22);
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
    house.fillRoundedRect(48, 296, 38, 46, 5);
    house.lineStyle(3, 0xffffff, 1);
    house.strokeRoundedRect(48, 296, 38, 46, 5);
    house.fillStyle(0x9b6035, 1);
    house.fillRoundedRect(99, 361, 35, 115, 6);

    this.add.text(89, 395, "HEALTHY\nFAMILY\nHOME", {
      fontFamily: "Trebuchet MS",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#28543e",
      align: "center"
    }).setOrigin(0.5);

    house.fillStyle(0x17352a, 0.35);
    house.fillRect(this.HOUSE_X, this.GRID_Y, 4, this.ROWS * this.CELL_H);
  }

  createHeroMascot() {
    if (this.textures.exists("hero_avatar")) {
      const heroContainer = this.add.container(88, 185);
      
      const badgeBorder = this.add.graphics();
      badgeBorder.fillStyle(0xff9f1c, 1);
      badgeBorder.fillCircle(0, 0, 32);
      badgeBorder.fillStyle(0xffffff, 1);
      badgeBorder.fillCircle(0, 0, 29);
      heroContainer.add(badgeBorder);

      const avatar = this.add.image(0, 0, "hero_avatar").setDisplaySize(54, 54);
      
      const shape = this.make.graphics({ add: false });
      shape.fillCircle(88, 185, 27);
      const mask = shape.createGeometryMask();
      avatar.setMask(mask);
      
      heroContainer.add(avatar);
      heroContainer.setDepth(15);

      this.tweens.add({
        targets: heroContainer,
        y: 180,
        duration: 1400,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1
      });

      this.heroContainer = heroContainer;
    }
  }

  cleanupSceneObjects() {
    if (!this.gameState) return;
    const collections = [
      this.gameState.defenders,
      this.gameState.enemies,
      this.gameState.projectiles,
      this.gameState.enemyProjectiles,
      this.gameState.suns,
      this.gameState.floaters
    ];
    for (const collection of collections) {
      if (collection) {
        for (const item of collection) {
          if (item && item.textObj) item.textObj.destroy();
        }
      }
    }
    if (this.gameState.particles) {
      for (const p of this.gameState.particles) {
        if (p && p.gfx) p.gfx.destroy();
      }
    }
  }

  startGame() {
    this.cleanupSceneObjects();
    this.gameState = this.createFreshState();
    this.gameState.phase = "playing";
    this.uiOverlayText.setText("🌱 Prepare sua defesa");
    if (window.onPhaserGameStarted) window.onPhaserGameStarted(this);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05) * this.gameState.gameSpeed;
    if (this.gameState.phase !== "playing" || this.gameState.paused) return;

    if (this.gameState.waveActive) {
      this.gameState.time += dt;
      this.gameState.waveTime += dt;
      if (this.gameState.time > this.gameState.comboExpiresAt) this.gameState.combo = 0;

      const isBossWave = (this.gameState.wave % 5 === 0);
      if (isBossWave) {
        if (this.gameState.wave % 15 === 5) {
          this.uiOverlayText.setText("🔥 CHEFE 1 (Onda 5): VELA MESTRA!");
        } else if (this.gameState.wave % 15 === 10) {
          this.uiOverlayText.setText("🟣 CHEFE 2 (Onda 10): CHICLETE GIGANTE GRUDENTO!");
        } else {
          this.uiOverlayText.setText("🍭 CHEFE 3 FINAL (Onda 15): PIRULITO GIRATÓRIO ESPINHOSO!");
        }
      } else {
        this.uiOverlayText.setText(`⚔️ Onda ${this.gameState.wave} de ${CAMPAIGN_MAX_WAVES} em andamento`);
      }

      for (const item of this.gameState.spawnQueue) {
        if (!item.spawned && this.gameState.waveTime >= item.at) {
          this.enemySystem.spawnEnemy(item.type, item.row);
          item.spawned = true;
        }
      }

      if (this.gameState.time >= this.gameState.nextSun) {
        this.effectsSystem.spawnSun();
        this.gameState.nextSun = this.gameState.time + this.random(6, 9);
      }
    } else {
      this.uiOverlayText.setText("🌱 Prepare sua defesa");
    }

    this.defenderSystem.updateDefenders(dt);
    this.projectileSystem.updateProjectiles(dt);
    this.projectileSystem.updateEnemyProjectiles(dt);
    this.enemySystem.updateEnemies(dt);
    this.effectsSystem.updateSuns(dt);
    this.effectsSystem.updateParticles(dt);
    this.effectsSystem.updateFloaters(dt);

    if (this.gameState.phase === "playing" && this.gameState.houseHp <= 0) {
      this.gameState.phase = "gameover";
      this.gameState.paused = true;
      if (this.gameState.score > this.bestScore) {
        this.bestScore = this.gameState.score;
        writeStorage(STORAGE_KEYS.bestScore, this.bestScore);
      }
      if (window.onPhaserGameOver) window.onPhaserGameOver(this.gameState);
      return;
    }

    const spawnedAll = this.gameState.spawnQueue.length > 0 && this.gameState.spawnQueue.every(item => item.spawned);
    if (this.gameState.phase === "playing" && this.gameState.waveActive && spawnedAll && this.gameState.enemies.length === 0) {
      this.completeWave();
      if (this.gameState.mode !== "endless" && this.gameState.wave >= CAMPAIGN_MAX_WAVES) {
        this.gameState.phase = "victory";
        this.gameState.paused = true;
        if (this.gameState.score > this.bestScore) {
          this.bestScore = this.gameState.score;
          writeStorage(STORAGE_KEYS.bestScore, this.bestScore);
        }
        if (window.onPhaserGameWin) window.onPhaserGameWin(this.gameState);
      } else {
        this.nextWave();
      }
    }

    if (window.onPhaserSyncUi) window.onPhaserSyncUi(this.gameState);
  }

  completeWave() {
    this.gameState.stats.wavesCompleted += 1;
    if (!this.gameState.houseDamagedThisWave) {
      this.gameState.stats.flawlessWaves = (this.gameState.stats.flawlessWaves || 0) + 1;
      this.effectsSystem.spawnFloater(500, 140, "⭐ ONDA PERFEITA! SEM DANO! ⭐", "#69c743", 1.3);
    }
    const bonus = 40 + this.gameState.wave * 15;
    this.gameState.sun += bonus;
    this.gameState.score += bonus * 5;
    this.effectsSystem.spawnFloater(500, 180, `🎉 ONDA COMPLETA! +${bonus}☀️`, "#ffe27a", 1.4);
    this.soundManager.beep(660, 0.15, "triangle", 0.05);

    if (this.heroContainer) {
      this.tweens.add({
        targets: this.heroContainer,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 200,
        yoyo: true,
        repeat: 1
      });
    }
    return bonus;
  }

  nextWave() {
    this.gameState.wave += 1;
    this.gameState.waveTime = 0;
    this.gameState.waveActive = false;
    this.gameState.waveResolved = 0;
    this.gameState.houseDamagedThisWave = false;
    this.gameState.combo = 0;
    this.gameState.spawnQueue = generateProceduralWave(this.gameState.wave, this.gameState.seed, this.gameState.mode);

    if (this.gameState.enemyProjectiles) {
      for (const ep of this.gameState.enemyProjectiles) {
        if (ep && ep.textObj) ep.textObj.destroy();
      }
      this.gameState.enemyProjectiles = [];
    }

    if (this.gameState.mode === "endless" && this.gameState.wave > this.bestEndlessWave) {
      this.bestEndlessWave = this.gameState.wave;
      writeStorage(STORAGE_KEYS.bestEndlessWave, this.bestEndlessWave);
    }

    this.drawBackgroundGraphics();
    this.drawGridGraphics();
    const biome = getBiomeForWave(this.gameState.wave);
    this.effectsSystem.spawnFloater(500, 200, `${biome.icon} ONDA ${this.gameState.wave}!`, "#fff06a", 1.4);
    this.soundManager.beep(560, 0.11, "triangle");
  }

  upgradeDefenderPower(defender) {
    return this.defenderSystem.upgradeDefenderPower(defender);
  }

  upgradeDefenderHealth(defender) {
    return this.defenderSystem.upgradeDefenderHealth(defender);
  }

  useAbility(defender) {
    return this.defenderSystem.useAbility(defender);
  }

  handlePointerDown(x, y) {
    if (this.gameState.phase !== "playing" || this.gameState.paused) return;

    const sun = [...this.gameState.suns].reverse().find(s => Math.hypot(s.x - x, s.y - y) < 40);
    if (sun) {
      this.gameState.sun += sun.value;
      this.gameState.stats.sunCollected += sun.value;
      sun.life = 0;
      if (sun.textObj) sun.textObj.destroy();

      if (sun.type === "golden") {
        this.gameState.attackBoostUntil = this.gameState.time + 4;
        this.effectsSystem.spawnFloater(sun.x, sun.y, `+${sun.value} ☀️ IMPULSO DE ATAQUE! 🌟`, "#ffd43b", 1.35);
        this.soundManager.beep(880, 0.12, "sine", 0.05);
      } else if (sun.type === "nutrient") {
        this.gameState.houseHp = Math.min(this.gameState.maxHouseHp, this.gameState.houseHp + 80);
        this.effectsSystem.spawnFloater(sun.x, sun.y, `+${sun.value} ☀️ +80 HP CASA! 💚`, "#69c743", 1.35);
        this.soundManager.beep(820, 0.12, "sine", 0.05);
      } else {
        this.effectsSystem.spawnFloater(sun.x, sun.y, `+${sun.value} ☀️`, "#fff06a", 1.2);
        this.soundManager.beep(760, 0.08, "sine", 0.04);
      }
      return;
    }

    const col = Math.floor((x - this.GRID_X) / this.CELL_W);
    const row = Math.floor((y - this.GRID_Y) / this.CELL_H);
    if (col < 0 || col >= this.COLS || row < 0 || row >= this.ROWS) return;

    const existing = this.gameState.defenders.find(d => d.row === row && d.col === col);
    
    if (this.gameState.shovel) {
      if (existing) {
        const refund = Math.floor(existing.invested * 0.5);
        this.gameState.sun += refund;
        this.gameState.stats.refunded += refund;
        this.effectsSystem.burst(existing.x, existing.y, "#b9e4a3", 16);
        this.effectsSystem.spawnFloater(existing.x, existing.y - 20, `+${refund} ☀️`, "#b9e4a3", 1.25);
        this.soundManager.beep(420, 0.1, "triangle", 0.05);
        if (existing.textObj) existing.textObj.destroy();
        this.gameState.defenders = this.gameState.defenders.filter(d => d !== existing);
      }
      this.gameState.shovel = false;
      if (window.onPhaserResetShovel) window.onPhaserResetShovel();
      return;
    }

    if (existing) {
      if (window.onPhaserSelectDefender) window.onPhaserSelectDefender(existing);
      return;
    }

    if (this.gameState.selected) {
      this.defenderSystem.placeDefender(col, row, this.gameState.selected);
    }
  }

  random(min, max) {
    return min + Math.random() * (max - min);
  }
}
