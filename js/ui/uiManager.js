"use strict";

class UIManager {
  constructor() {
    this.DEFENDER_KEYS = ["corn", "carrot", "broccoli", "pepper", "tomato", "watermelon"];
    this.activeScene = null;
    this.selectedDefender = null;

    this.ui = {
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
      restartButton: document.getElementById("restartGameButton"),
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
      abilityBtn: document.getElementById("abilityButton"),
      closeUpgrade: document.getElementById("closeUpgradeButton"),
      enemyGuideGrid: document.getElementById("enemyGuideGrid"),
      seed: document.getElementById("seedValue"),
      shovel: document.getElementById("shovelButton"),
      cards: [...document.querySelectorAll(".defender-card[data-defender]")],
      habits: [...document.querySelectorAll(".habit")]
    };

    this.initGlobalCallbacks();
    this.bindEvents();
    this.renderBestiary();
    this.initModeSelector();
  }

  initGlobalCallbacks() {
    window.onPhaserGameStarted = (scene) => {
      this.activeScene = scene;
      this.ui.habits.forEach(b => b.classList.remove("used"));
      this.syncUi(scene.gameState);
      this.updateTutorial(scene.gameState);
    };

    window.onPhaserSyncUi = (state) => {
      this.syncUi(state);
      this.updateWavePreviewAndProgress(state);
      if (this.selectedDefender) {
        if (!state || !state.defenders.includes(this.selectedDefender)) {
          this.ui.upgradePanel.hidden = true;
          this.selectedDefender = null;
        } else {
          this.updateUpgradePanelUI(this.selectedDefender);
        }
      }
    };

    window.onPhaserSelectDefender = (defender) => {
      this.selectedDefender = defender;
      this.updateUpgradePanelUI(defender);
      this.ui.upgradePanel.hidden = false;
    };

    window.onPhaserResetShovel = () => {
      if (this.ui.shovel) this.ui.shovel.classList.remove("selected");
    };

    window.onPhaserGameOver = (state) => {
      this.ui.overlayTitle.textContent = "💔 Fim de Jogo!";
      this.ui.overlayText.textContent = "Os super chefes e o exército de doces invadiram a casa. Ajuste sua defesa e tente novamente!";
      this.ui.modeSelector.hidden = false;
      if (this.ui.restartButton) this.ui.restartButton.hidden = true;
      this.renderResults(state, false);
      this.ui.overlayButton.textContent = "Tentar Novamente";
      this.ui.overlay.classList.add("visible");
    };

    window.onPhaserGameWin = (state) => {
      this.ui.overlayTitle.textContent = "🎉 Vitória da Família Saudável!";
      this.ui.overlayText.textContent = "Você derrotou todos os 3 Super Chefes e concluiu com sucesso as 15 Ondas da campanha!";
      this.ui.modeSelector.hidden = false;
      if (this.ui.restartButton) this.ui.restartButton.hidden = true;
      this.renderResults(state, true);
      this.ui.overlayButton.textContent = "Jogar Novamente";
      this.ui.overlay.classList.add("visible");
    };
  }

  bindEvents() {
    this.ui.closeUpgrade.addEventListener("click", () => {
      this.ui.upgradePanel.hidden = true;
      this.selectedDefender = null;
    });

    this.ui.powerUpgrade.addEventListener("click", () => {
      if (!this.activeScene || !this.selectedDefender) return;
      if (this.activeScene.upgradeDefenderPower(this.selectedDefender)) {
        this.showToast("Ataque melhorado! ⚔️");
        this.updateUpgradePanelUI(this.selectedDefender);
        this.syncUi(this.activeScene.gameState);
      }
    });

    this.ui.healthUpgrade.addEventListener("click", () => {
      if (!this.activeScene || !this.selectedDefender) return;
      if (this.activeScene.upgradeDefenderHealth(this.selectedDefender)) {
        this.showToast("Vitalidade aumentada! 💚");
        this.updateUpgradePanelUI(this.selectedDefender);
        this.syncUi(this.activeScene.gameState);
      }
    });

    this.ui.abilityBtn.addEventListener("click", () => {
      if (!this.activeScene || !this.selectedDefender) return;
      if (this.activeScene.useAbility(this.selectedDefender)) {
        this.showToast(`Habilidade ${this.selectedDefender.ability.name} ativada! ✨`);
        this.updateUpgradePanelUI(this.selectedDefender);
        this.syncUi(this.activeScene.gameState);
      }
    });

    this.ui.skipTutorial.addEventListener("click", () => {
      if (this.activeScene) this.activeScene.gameState.tutorialStep = -1;
      writeStorage(STORAGE_KEYS.tutorialSeen, "true");
      this.ui.tutorial.hidden = true;
      this.showToast("Tutorial ignorado");
    });

    this.ui.cards.forEach(card => card.addEventListener("click", () => {
      this.selectDefenderType(card.dataset.defender);
    }));

    if (this.ui.shovel) {
      this.ui.shovel.addEventListener("click", () => {
        this.toggleShovel();
      });
    }

    this.ui.startWave.addEventListener("click", () => {
      if (!this.activeScene || this.activeScene.gameState.phase !== "playing") return;
      this.activeScene.gameState.waveActive = true;
      this.showToast(`Onda ${this.activeScene.gameState.wave} iniciada! ⚔️`);
    });

    this.ui.overlayButton.addEventListener("click", () => {
      if (this.activeScene && this.activeScene.gameState.paused && this.activeScene.gameState.phase === "playing") {
        this.resumeGame();
        return;
      }

      this.ui.overlay.classList.remove("visible");
      this.ui.resultSummary.hidden = true;
      if (this.ui.restartButton) this.ui.restartButton.hidden = true;
      
      if (!window.phaserGame) {
        window.phaserGame = new Phaser.Game(window.phaserConfig);
      } else if (this.activeScene) {
        this.activeScene.startGame();
      }
    });

    if (this.ui.restartButton) {
      this.ui.restartButton.addEventListener("click", () => {
        this.restartGame();
      });
    }

    this.ui.modeButtons.forEach(button => {
      button.addEventListener("click", () => {
        const mode = button.dataset.mode;
        writeStorage(STORAGE_KEYS.selectedMode, mode);
        if (this.activeScene) {
          this.activeScene.selectedMode = mode;
          this.activeScene.gameState.mode = mode;
        }
        this.ui.modeButtons.forEach(btn => btn.setAttribute("aria-pressed", String(btn === button)));
        this.showToast(`Modo selecionado: ${MODES[mode].label}`);
      });
    });

    this.ui.habits.forEach(button => {
      button.addEventListener("click", () => {
        if (!this.activeScene || this.activeScene.gameState.phase !== "playing") return;
        const name = button.dataset.habit;
        if (this.activeScene.gameState.usedHabits.has(name)) return;
        this.activeScene.gameState.usedHabits.add(name);
        this.activeScene.gameState.stats.habitsUsed += 1;
        button.classList.add("used");
        if (name === "water") this.activeScene.gameState.sun += 50;
        if (name === "fruit") this.activeScene.gameState.sun += 100;
        if (name === "vegetables") this.activeScene.gameState.pepperUnlocked = true;
        if (name === "exercise") this.activeScene.gameState.attackBoostUntil = this.activeScene.gameState.time + 20;
        if (name === "teeth") this.activeScene.gameState.houseHp = Math.min(this.activeScene.gameState.maxHouseHp, this.activeScene.gameState.houseHp + 300);
        if (name === "sleep") {
          for (const enemy of this.activeScene.gameState.enemies) this.activeScene.enemySystem.damageEnemy(enemy, enemy.boss ? 400 : 220, "#72d9ff");
        }
        this.showToast(`Hábito ativado: ${button.querySelector("strong")?.textContent || name}! ✨`);
        this.syncUi(this.activeScene.gameState);
      });
    });

    this.ui.speed.addEventListener("click", () => {
      if (!this.activeScene) return;
      this.activeScene.gameState.gameSpeed = this.activeScene.gameState.gameSpeed === 1 ? 2 : 1;
      this.ui.speed.textContent = `⏩ ${this.activeScene.gameState.gameSpeed}×`;
      this.showToast(`Velocidade ${this.activeScene.gameState.gameSpeed}×`);
    });

    this.ui.pause.addEventListener("click", () => {
      this.togglePauseGame();
    });

    this.ui.sound.addEventListener("click", () => {
      if (!this.activeScene) return;
      this.activeScene.soundOn = !this.activeScene.soundOn;
      this.ui.sound.textContent = this.activeScene.soundOn ? "🔊" : "🔇";
      this.ui.sound.setAttribute("aria-pressed", String(!this.activeScene.soundOn));
      this.showToast(this.activeScene.soundOn ? "Som ativado 🔊" : "Som desativado 🔇");
    });

    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const key = e.key;

    if (["1", "2", "3", "4", "5", "6"].includes(key)) {
      const index = parseInt(key, 10) - 1;
      if (index >= 0 && index < this.DEFENDER_KEYS.length) {
        this.selectDefenderType(this.DEFENDER_KEYS[index]);
      }
      return;
    }

    if (key === "p" || key === "P" || key === "x" || key === "X") {
      this.toggleShovel();
      return;
    }

    if (key === " ") {
      e.preventDefault();
      if (this.ui.overlay.classList.contains("visible")) {
        if (this.activeScene && this.activeScene.gameState.paused) {
          this.resumeGame();
        } else {
          this.ui.overlayButton.click();
        }
      } else if (this.activeScene && !this.activeScene.gameState.waveActive) {
        this.ui.startWave.click();
      } else {
        this.togglePauseGame();
      }
      return;
    }

    if (key === "Escape") {
      if (!this.ui.upgradePanel.hidden) {
        this.ui.upgradePanel.hidden = true;
        this.selectedDefender = null;
      } else if (this.activeScene && (this.activeScene.gameState.selected || this.activeScene.gameState.shovel)) {
        this.activeScene.gameState.selected = null;
        this.activeScene.gameState.shovel = false;
        this.ui.cards.forEach(c => c.classList.remove("selected"));
        if (this.ui.shovel) this.ui.shovel.classList.remove("selected");
        this.showToast("Seleção cancelada");
      }
      return;
    }
  }

  renderBestiary() {
    if (!this.ui.enemyGuideGrid) return;
    this.ui.enemyGuideGrid.innerHTML = "";
    for (const [key, enemy] of Object.entries(ENEMIES)) {
      const card = document.createElement("div");
      card.className = "enemy-guide-card";
      card.innerHTML = `
        <span class="enemy-guide-icon">${enemy.icon}</span>
        <div>
          <strong>${enemy.name} ${enemy.boss ? "👑" : ""}</strong>
          <small>HP ${enemy.hp} · Vel ${enemy.speed} · +${enemy.reward}☀️</small>
          <p>${enemy.description}</p>
        </div>
      `;
      this.ui.enemyGuideGrid.appendChild(card);
    }
  }

  renderResults(state, isWin) {
    if (!this.ui.resultSummary) return;
    this.ui.resultSummary.hidden = false;
    
    let stars = 1;
    if (state.houseHp >= state.maxHouseHp * 0.75) stars = 3;
    else if (state.houseHp >= state.maxHouseHp * 0.35) stars = 2;
    if (!isWin) stars = 0;

    this.ui.resultStars.textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);

    const bestDef = Object.entries(state.damageByType || {})
      .sort((a, b) => b[1] - a[1])[0];
    const bestDefName = bestDef ? (DEFENDERS[bestDef[0]]?.name || bestDef[0]) : "Nenhum";

    const isEndless = (state.mode === "endless");
    const endlessWaveStat = isEndless ? `<div class="result-stat"><span>Recorde Infinito</span><strong>Onda ${this.activeScene ? this.activeScene.bestEndlessWave : 0}</strong></div>` : "";

    this.ui.resultStats.innerHTML = `
      <div class="result-stat"><span>Pontos</span><strong>${state.score}</strong></div>
      <div class="result-stat"><span>Doces Derrotados</span><strong>${state.stats.enemiesDefeated}</strong></div>
      <div class="result-stat"><span>Ondas Concluídas</span><strong>${state.stats.wavesCompleted}</strong></div>
      <div class="result-stat"><span>Ondas Sem Dano</span><strong>${state.stats.flawlessWaves || 0} ⭐</strong></div>
      <div class="result-stat"><span>Maior Combo</span><strong>${state.stats.maxCombo}x</strong></div>
      <div class="result-stat"><span>Melhor Vegetal</span><strong>${bestDefName}</strong></div>
      <div class="result-stat"><span>Hábitos Usados</span><strong>${state.stats.habitsUsed}</strong></div>
      ${endlessWaveStat}
    `;
  }

  updateWavePreviewAndProgress(state) {
    if (!state) return;
    const isCampaign = (state.mode !== "endless");
    const totalWaveCount = isCampaign ? CAMPAIGN_MAX_WAVES : "∞";
    this.ui.wavePreviewTitle.textContent = `Onda ${state.wave} de ${totalWaveCount}`;
    this.ui.wavePreviewMode.textContent = MODES[state.mode]?.label || "Modo Normal";

    if (!state.waveActive) {
      this.ui.waveProgress.hidden = true;
      this.ui.startWave.hidden = false;
      const uniqueTypes = [...new Set(state.spawnQueue.map(item => item.type))];
      this.ui.wavePreviewEnemies.innerHTML = uniqueTypes.map(t => {
        const enemy = ENEMIES[t];
        const isBoss = enemy?.boss;
        return `<span class="enemy-preview-chip" title="${enemy?.name || t}">${enemy?.icon || "🍬"} ${isBoss ? "👑 BOSS" : (enemy?.name || t)}</span>`;
      }).join(" ");
    } else {
      this.ui.startWave.hidden = true;
      this.ui.waveProgress.hidden = false;
      const total = state.spawnQueue.length;
      const resolved = state.waveResolved || 0;
      const pct = Math.min(100, Math.floor((resolved / Math.max(1, total)) * 100));
      this.ui.waveProgressFill.style.width = `${pct}%`;
      this.ui.waveProgressText.textContent = `${resolved} de ${total} doces neutralizados`;
    }
  }

  updateUpgradePanelUI(def) {
    if (!def) return;
    this.ui.upgradeIcon.textContent = def.icon;
    this.ui.upgradeName.textContent = def.name;
    const totalLevel = (def.powerLevel || 0) + (def.healthLevel || 0) + 1;
    this.ui.upgradeLevel.textContent = `Nível ${totalLevel} (Ataque ${def.powerLevel || 0}/3 · Vida ${def.healthLevel || 0}/3)`;
    
    this.ui.upgradeStats.innerHTML = `
      ⚔️ Dano: <strong>${def.damage}</strong> | 💚 Vida: <strong>${Math.ceil(def.hp)}/${def.maxHp}</strong><br>
      <small>${def.ability ? `${def.ability.name}: ${def.ability.description}` : ""}</small>
    `;

    const powerCost = Math.round(def.cost * (0.6 + (def.powerLevel || 0) * 0.4));
    const powerBtnSmall = this.ui.powerUpgrade.querySelector("small");
    if (def.powerLevel >= 3) {
      this.ui.powerUpgrade.disabled = true;
      if (powerBtnSmall) powerBtnSmall.textContent = "MÁXIMO";
    } else {
      this.ui.powerUpgrade.disabled = (this.activeScene?.gameState.sun < powerCost);
      if (powerBtnSmall) powerBtnSmall.textContent = `${powerCost} ☀️`;
    }

    const healthCost = Math.round(def.cost * (0.5 + (def.healthLevel || 0) * 0.35));
    const healthBtnSmall = this.ui.healthUpgrade.querySelector("small");
    if (def.healthLevel >= 3) {
      this.ui.healthUpgrade.disabled = true;
      if (healthBtnSmall) healthBtnSmall.textContent = "MÁXIMO";
    } else {
      this.ui.healthUpgrade.disabled = (this.activeScene?.gameState.sun < healthCost);
      if (healthBtnSmall) healthBtnSmall.textContent = `${healthCost} ☀️`;
    }

    const abilityBtnSmall = this.ui.abilityBtn.querySelector("small");
    if (totalLevel < 2) {
      this.ui.abilityBtn.disabled = true;
      if (abilityBtnSmall) abilityBtnSmall.textContent = "Desbloqueia no Nível 2";
    } else {
      const now = this.activeScene?.gameState.time || 0;
      const ready = (def.abilityReadyAt || 0) <= now;
      this.ui.abilityBtn.disabled = !ready;
      if (abilityBtnSmall) abilityBtnSmall.textContent = ready ? "PRONTO!" : `${Math.ceil((def.abilityReadyAt || 0) - now)}s`;
    }
  }

  updateTutorial(state) {
    if (!state || state.tutorialStep < 0) {
      this.ui.tutorial.hidden = true;
      return;
    }
    this.ui.tutorial.hidden = false;
    if (state.tutorialStep === 0) {
      this.ui.tutorialStep.textContent = "Tutorial 1/3";
      this.ui.tutorialText.textContent = "Escolha um vegetal na bandeja (teclas 1-6) e clique na grade para posicioná-lo!";
    } else if (state.tutorialStep === 1) {
      this.ui.tutorialStep.textContent = "Tutorial 2/3";
      this.ui.tutorialText.textContent = "Clique nos sóis caindo para acumular Energia Solar!";
    } else {
      this.ui.tutorialStep.textContent = "Tutorial 3/3";
      this.ui.tutorialText.textContent = "Use os Hábitos do Levi para ganhar super bônus ou clique num vegetal colocado para melhorá-lo!";
    }
  }

  syncUi(state) {
    if (!state) return;
    this.ui.sun.textContent = Math.floor(state.sun);
    this.ui.health.textContent = Math.ceil(state.houseHp);
    this.ui.healthBar.style.width = `${Math.max(0, state.houseHp / state.maxHouseHp * 100)}%`;
    this.ui.healthBar.style.background = state.houseHp < 300 ? "#ef476f" : "linear-gradient(90deg, #69c743, #b8e34d)";
    const biome = getBiomeForWave(state.wave);
    this.ui.wave.textContent = `Onda ${state.wave} (${biome.icon} ${biome.name})`;
    if (this.ui.seed) this.ui.seed.textContent = state.seed || "------";
    this.ui.score.textContent = state.score;
    this.ui.bestScore.textContent = this.activeScene ? (state.mode === "endless" && this.activeScene.bestEndlessWave > 0 ? `${this.activeScene.bestScore} (Onda ${this.activeScene.bestEndlessWave})` : this.activeScene.bestScore) : 0;
    this.updateCards(state);
    if (state.defenders.length > 0 && state.tutorialStep === 0) state.tutorialStep = 1;
    if (state.stats.sunCollected > 50 && state.tutorialStep === 1) state.tutorialStep = 2;
    this.updateTutorial(state);
  }

  updateCards(state) {
    if (!state) return;
    for (const card of this.ui.cards) {
      const type = card.dataset.defender;
      const def = DEFENDERS[type];
      const canAfford = (state.sun >= def.cost);
      const isLocked = (type === "pepper" && !state.pepperUnlocked);

      card.classList.toggle("unaffordable", !canAfford);
      card.classList.toggle("ready-to-buy", canAfford && !isLocked);

      if (type === "pepper") {
        card.classList.toggle("locked", !state.pepperUnlocked);
        const titleSpan = card.querySelector("strong");
        if (titleSpan) titleSpan.textContent = state.pepperUnlocked ? "[4] Pimenta" : "[4] Pimenta 🔒";
      }
    }
  }

  showToast(message) {
    this.ui.toast.textContent = message;
    this.ui.toast.classList.add("show");
    setTimeout(() => this.ui.toast.classList.remove("show"), 2300);
  }

  selectDefenderType(type) {
    if (!this.activeScene || this.activeScene.gameState.phase !== "playing") return;
    if (type === "pepper" && !this.activeScene.gameState.pepperUnlocked) {
      this.showToast("Coma vegetais nas missões para liberar a Pimenta! 🥗");
      return;
    }
    if (this.activeScene.gameState.sun < DEFENDERS[type].cost) {
      this.showToast("Energia Solar insuficiente! ☀️");
      return;
    }
    this.activeScene.gameState.shovel = false;
    this.activeScene.gameState.selected = type;
    this.ui.cards.forEach(c => c.classList.toggle("selected", c.dataset.defender === type));
    if (this.ui.shovel) this.ui.shovel.classList.remove("selected");
  }

  toggleShovel() {
    if (!this.activeScene || this.activeScene.gameState.phase !== "playing") return;
    this.activeScene.gameState.shovel = !this.activeScene.gameState.shovel;
    this.activeScene.gameState.selected = null;
    this.ui.cards.forEach(c => c.classList.remove("selected"));
    if (this.ui.shovel) this.ui.shovel.classList.toggle("selected", this.activeScene.gameState.shovel);
    if (this.activeScene.gameState.shovel) {
      this.showToast("🪏 Modo Pá ativo: toque em um vegetal para remover e recuperar 50%!");
    } else {
      this.showToast("Modo Pá desativado.");
    }
  }

  togglePauseGame() {
    if (!this.activeScene || this.activeScene.gameState.phase !== "playing") return;
    this.activeScene.gameState.paused = !this.activeScene.gameState.paused;
    const isPaused = this.activeScene.gameState.paused;
    this.ui.pause.textContent = isPaused ? "▶ Continuar" : "⏸ Pausar";

    if (isPaused) {
      this.ui.overlayTitle.textContent = "⏸ Jogo Pausado";
      this.ui.overlayText.textContent = "Sua defesa está aguardando. Clique em Continuar para retomar a batalha exatamente de onde parou.";
      this.ui.overlayButton.textContent = "▶ Continuar Partida";
      if (this.ui.restartButton) this.ui.restartButton.hidden = false;
      this.ui.modeSelector.hidden = true;
      this.ui.resultSummary.hidden = true;
      this.ui.overlay.classList.add("visible");
    } else {
      this.ui.overlay.classList.remove("visible");
    }
  }

  resumeGame() {
    if (!this.activeScene) return;
    this.activeScene.gameState.paused = false;
    this.ui.pause.textContent = "⏸ Pausar";
    this.ui.overlay.classList.remove("visible");
    this.showToast("Partida continuada!");
  }

  restartGame() {
    if (!this.activeScene) return;
    this.activeScene.gameState.paused = false;
    this.ui.pause.textContent = "⏸ Pausar";
    this.ui.overlay.classList.remove("visible");
    if (this.ui.restartButton) this.ui.restartButton.hidden = true;
    this.activeScene.startGame();
    this.showToast("Partida reiniciada!");
  }

  initModeSelector() {
    const currentMode = readMode();
    this.ui.modeButtons.forEach(btn => btn.setAttribute("aria-pressed", String(btn.dataset.mode === currentMode)));
  }
}
