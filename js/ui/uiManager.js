"use strict";

class UIManager {
  constructor(deckService = window.deckService) {
    this.deckService = deckService;
    this.activeDeck = this.deckService?.getActiveDeck() || ["potato", "garlic", "corn", "carrot", "broccoli"];
    this.DEFENDER_KEYS = [...this.activeDeck];
    this.activeScene = null;
    this.selectedDefender = null;
    this.soundOn = readFlag(STORAGE_KEYS.soundOn, true);

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
      fertilizer: document.getElementById("fertilizerButton"),
      shovel: document.getElementById("shovelButton"),
      seeds: document.getElementById("seedsValue"),
      deckSlotsGrid: document.getElementById("deckSlotsGrid"),
      availableCardsGrid: document.getElementById("availableCardsGrid"),
      cards: [...document.querySelectorAll(".defender-card[data-defender]")],
      habits: [...document.querySelectorAll(".habit")]
    };

    this.initGlobalCallbacks();
    this.bindEvents();
    this.renderBestiary();
    this.initModeSelector();
    this.renderDeckBuilder();
  }

  // Helper: registra click + touchstart sem o delay de 300ms do mobile.
  // Usa touchstart quando disponível; previne o click duplicado.
  addTouchClick(el, handler) {
    if (!el) return;
    let touchFired = false;
    el.addEventListener("touchstart", (e) => {
      e.preventDefault();
      touchFired = true;
      handler(e);
    }, { passive: false });
    el.addEventListener("click", (e) => {
      if (touchFired) { touchFired = false; return; }
      handler(e);
    });
  }

  initGlobalCallbacks() {
    window.onPhaserGameStarted = (scene) => {
      this.activeScene = scene;
      scene.soundOn = this.soundOn;
      this.deckService?.syncScene(scene);
      this.refreshDeckFromService();
      this.resetInteractionUi();
      this.ui.habits.forEach(b => b.classList.remove("used"));
      if (this.ui.speed) this.ui.speed.textContent = "⏩ 1×";
      if (this.ui.sound) {
        this.ui.sound.textContent = this.soundOn ? "🔊" : "🔇";
        this.ui.sound.setAttribute("aria-pressed", String(!this.soundOn));
      }
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

    window.onPhaserResetInteraction = () => this.resetInteractionUi();
    window.onPhaserResetShovel = () => this.resetInteractionUi();

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
      this.ui.overlayText.textContent = "Você derrotou O Confeiteiro Sombrio 👨‍🍳 e o Robô Bolo Mutante Gigante 🤖🎂, salvando a Healthy Family Home!";
      this.ui.modeSelector.hidden = false;
      if (this.ui.restartButton) this.ui.restartButton.hidden = true;
      this.renderResults(state, true);
      this.ui.overlayButton.textContent = "Jogar Novamente";
      this.ui.overlay.classList.add("visible");
    };
  }

  bindEvents() {
    this.addTouchClick(this.ui.closeUpgrade, () => {
      this.ui.upgradePanel.hidden = true;
      this.selectedDefender = null;
    });

    this.addTouchClick(this.ui.powerUpgrade, () => {
      if (!this.activeScene || !this.selectedDefender) return;
      if (this.activeScene.upgradeDefenderPower(this.selectedDefender)) {
        this.showToast("Ataque melhorado! ⚔️");
        this.updateUpgradePanelUI(this.selectedDefender);
        this.syncUi(this.activeScene.gameState);
      }
    });

    this.addTouchClick(this.ui.healthUpgrade, () => {
      if (!this.activeScene || !this.selectedDefender) return;
      if (this.activeScene.upgradeDefenderHealth(this.selectedDefender)) {
        this.showToast("Vitalidade aumentada! 💚");
        this.updateUpgradePanelUI(this.selectedDefender);
        this.syncUi(this.activeScene.gameState);
      }
    });

    this.addTouchClick(this.ui.abilityBtn, () => {
      if (!this.activeScene || !this.selectedDefender) return;
      const def = this.selectedDefender;
      const now = this.activeScene.gameState.time || 0;
      const isFertilized = (def.fertilizerBoostUntil || 0) > now;
      const totalLevel = (def.powerLevel || 0) + (def.healthLevel || 0) + 1;
      const unlocked = totalLevel >= 2 || isFertilized;
      if (!unlocked) {
        this.showToast("Desbloqueie o Nível 2 ou use Adubo para ativar a habilidade! ✨");
        return;
      }
      if ((def.abilityReadyAt || 0) > now) {
        this.showToast(`Recarga: ${Math.ceil(def.abilityReadyAt - now)}s restantes`);
        return;
      }
      if (this.activeScene.useAbility(def)) {
        this.showToast(`Habilidade ${def.ability.name} ativada! ✨`);
        this.updateUpgradePanelUI(def);
        this.syncUi(this.activeScene.gameState);
      }
    });

    this.addTouchClick(this.ui.skipTutorial, () => {
      if (this.activeScene) this.activeScene.gameState.tutorialStep = -1;
      writeStorage(STORAGE_KEYS.tutorialSeen, "true");
      this.ui.tutorial.hidden = true;
      this.showToast("Tutorial ignorado");
    });

    // Nota: as cartas da bandeja são criadas dinamicamente em updateDefenderTrayUI();
    // os listeners são adicionados lá. Não vinculamos os cards estáticos aqui.
    this.addTouchClick(this.ui.shovel, () => this.toggleShovel());
    this.addTouchClick(this.ui.fertilizer, () => this.toggleFertilizer());

    this.addTouchClick(this.ui.startWave, () => {
      if (!this.activeScene || this.activeScene.gameState.phase !== "playing") return;
      this.activeScene.gameState.waveActive = true;
      this.showToast(`Onda ${this.activeScene.gameState.wave} iniciada! ⚔️`);
    });

    this.addTouchClick(this.ui.overlayButton, () => {
      if (this.activeScene && this.activeScene.gameState.paused && this.activeScene.gameState.phase === "playing") {
        this.resumeGame();
        return;
      }

      this.ui.overlay.classList.remove("visible");
      this.ui.resultSummary.hidden = true;
      if (this.ui.restartButton) this.ui.restartButton.hidden = true;

      if (!window.phaserGame) window.phaserGame = new Phaser.Game(window.phaserConfig);
      else if (this.activeScene) this.activeScene.startGame();
    });

    this.addTouchClick(this.ui.restartButton, () => this.restartGame());

    this.ui.modeButtons.forEach(button => {
      this.addTouchClick(button, () => {
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
      this.addTouchClick(button, () => {
        if (!this.activeScene || this.activeScene.gameState.phase !== "playing") return;
        const state = this.activeScene.gameState;
        const name = button.dataset.habit;
        if (state.usedHabits.has(name)) return;

        if (name === "teeth" && state.houseHp >= state.maxHouseHp) {
          this.showToast("A Casa já está com a vida máxima! 💚");
          return;
        }

        if (name === "sleep") {
          const aliveEnemies = state.enemies.filter(e => e && !e.removed && e.hp > 0);
          if (aliveEnemies.length === 0) {
            this.showToast("Nenhum doce na tela para adormecer! 😴");
            return;
          }
          for (const enemy of aliveEnemies) {
            this.activeScene.enemySystem.damageEnemy(enemy, enemy.boss ? 400 : 220, "#72d9ff");
          }
        }

        state.usedHabits.add(name);
        state.stats.habitsUsed += 1;
        button.classList.add("used");

        if (name === "water") state.sun += 50;
        if (name === "fruit") state.sun += 100;
        if (name === "vegetables") state.vegetableBoostUntil = state.time + 15;
        if (name === "exercise") state.attackBoostUntil = state.time + 20;
        if (name === "teeth") state.houseHp = Math.min(state.maxHouseHp, state.houseHp + 300);

        this.showToast(`Hábito ativado: ${button.querySelector("strong")?.textContent || name}! ✨`);
        this.syncUi(state);
      });
    });

    this.addTouchClick(this.ui.speed, () => {
      if (!this.activeScene) return;
      this.activeScene.gameState.gameSpeed = this.activeScene.gameState.gameSpeed === 1 ? 2 : 1;
      this.ui.speed.textContent = `⏩ ${this.activeScene.gameState.gameSpeed}×`;
      this.showToast(`Velocidade ${this.activeScene.gameState.gameSpeed}×`);
    });

    this.addTouchClick(this.ui.pause, () => this.togglePauseGame());

    this.addTouchClick(this.ui.sound, () => {
      this.soundOn = !this.soundOn;
      writeStorage(STORAGE_KEYS.soundOn, String(this.soundOn));
      if (this.activeScene) this.activeScene.soundOn = this.soundOn;
      this.ui.sound.textContent = this.soundOn ? "🔊" : "🔇";
      this.ui.sound.setAttribute("aria-pressed", String(!this.soundOn));
      this.showToast(this.soundOn ? "Som ativado 🔊" : "Som desativado 🔇");
    });

    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const key = e.key;

    if (["1", "2", "3", "4", "5", "6", "7", "8"].includes(key)) {
      const index = parseInt(key, 10) - 1;
      if (index >= 0 && index < this.DEFENDER_KEYS.length) this.selectDefenderType(this.DEFENDER_KEYS[index]);
      return;
    }

    if (key === "x" || key === "X" || key === "Delete") {
      this.toggleShovel();
      return;
    }

    if (key === "a" || key === "A") {
      this.toggleFertilizer();
      return;
    }

    if (key === " ") {
      e.preventDefault();
      if (this.ui.overlay.classList.contains("visible")) {
        if (this.activeScene && this.activeScene.gameState.paused && this.activeScene.gameState.phase === "playing") {
          this.resumeGame();
        } else if (this.activeScene && (this.activeScene.gameState.phase === "gameover" || this.activeScene.gameState.phase === "victory")) {
          this.restartGame();
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
      } else if (this.activeScene && this.activeScene.gameState.interactionMode !== "none") {
        this.activeScene.resetInteractionMode();
        this.showToast("Seleção cancelada");
      }
    }
  }

  renderBestiary() {
    if (!this.ui.enemyGuideGrid) return;
    this.ui.enemyGuideGrid.innerHTML = "";
    for (const enemy of Object.values(ENEMIES)) {
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

  refreshDeckFromService() {
    if (!this.deckService) return;
    this.activeDeck = this.deckService.getActiveDeck();
    this.DEFENDER_KEYS = [...this.activeDeck];
    if (this.activeScene) this.deckService.syncScene(this.activeScene);
  }

  resetInteractionUi() {
    this.ui.cards.forEach(c => c.classList.remove("selected"));
    this.ui.shovel?.classList.remove("selected");
    this.ui.fertilizer?.classList.remove("selected");
  }

  setInteractionMode(mode, selectedType = null) {
    if (!this.activeScene || this.activeScene.gameState.phase !== "playing") return;
    const state = this.activeScene.gameState;
    state.interactionMode = mode;
    state.selected = mode === "place" ? selectedType : null;
    state.shovel = mode === "shovel";

    this.ui.cards.forEach(c => c.classList.toggle("selected", mode === "place" && c.dataset.defender === selectedType));
    this.ui.shovel?.classList.toggle("selected", mode === "shovel");
    this.ui.fertilizer?.classList.toggle("selected", mode === "fertilizer");
  }

  toggleFertilizer() {
    if (!this.activeScene || this.activeScene.gameState.phase !== "playing") return;
    const active = this.activeScene.gameState.interactionMode === "fertilizer";
    this.setInteractionMode(active ? "none" : "fertilizer");
    this.showToast(active ? "Adubo desativado" : "Saco de Adubo selecionado! 🎒 Toque em uma planta para Nível Máximo por 8s");
  }

  renderDeckBuilder() {
    if (!this.ui.deckSlotsGrid || !this.ui.availableCardsGrid) return;
    this.refreshDeckFromService();
    this.ui.deckSlotsGrid.innerHTML = "";
    this.ui.availableCardsGrid.innerHTML = "";

    const maxSlots = this.deckService?.getMaxSlots() || readDeckSlots();
    const allCards = Object.keys(DEFENDERS);

    const slotsLegend = document.querySelector(".deck-selector legend");
    if (slotsLegend) slotsLegend.textContent = `🃏 Escolha seu Baralho (${this.activeDeck.length}/${maxSlots} Slots Liberados)`;

    for (let index = 0; index < maxSlots; index++) {
      const slot = document.createElement("div");
      slot.className = "deck-slot-item";
      const type = this.activeDeck[index];
      slot.innerHTML = type
        ? `<span class="card-picker-icon">${DEFENDERS[type].icon}</span><span class="card-picker-cost">${index + 1}</span>`
        : `<span class="card-picker-icon">＋</span><span class="card-picker-cost">Vazio</span>`;
      this.ui.deckSlotsGrid.appendChild(slot);
    }

    allCards.forEach(key => {
      const def = DEFENDERS[key];
      const isUnlocked = this.deckService?.isUnlocked(key) ?? (def.seedPrice === 0 || readUnlockedCards().includes(key));
      const isSelected = this.activeDeck.includes(key);
      const cardEl = document.createElement("div");

      if (isUnlocked) {
        cardEl.className = `card-picker-item ${isSelected ? "selected" : ""}`;
        cardEl.title = isSelected ? "Clique para remover do baralho" : "Clique para adicionar ao baralho";
        cardEl.innerHTML = `<span class="card-picker-icon">${def.icon}</span><span class="card-picker-cost">${def.cost}☀️</span>`;
        cardEl.addEventListener("click", () => {
          const result = isSelected ? this.deckService.remove(key) : this.deckService.add(key);
          if (!result.ok) {
            if (result.reason === "slots") this.showToast(`Limite de ${maxSlots} slots atingido! Avance ondas para liberar mais! 🌻`);
            if (result.reason === "minimum") this.showToast("O baralho precisa ter pelo menos 1 vegetal.");
            if (result.reason === "locked") this.showToast("Desbloqueie esta semente primeiro. 🌻");
            return;
          }
          this.refreshDeckFromService();
          this.renderDeckBuilder();
          this.updateDefenderTrayUI();
        });
      } else {
        cardEl.className = "card-picker-item locked-card";
        cardEl.title = `Clique para desbloquear por ${def.seedPrice} Sementes 🌻`;
        cardEl.innerHTML = `<span class="card-picker-icon">${def.icon}</span><span class="card-picker-cost">${def.seedPrice}🌻 🔒</span>`;
        cardEl.addEventListener("click", () => {
          const currentSeeds = readNumber(STORAGE_KEYS.sunflowerSeeds);
          if (currentSeeds < def.seedPrice) {
            this.showToast(`Faltam sementes! Custo: ${def.seedPrice} 🌻 (Você tem ${currentSeeds} 🌻)`);
            return;
          }

          writeStorage(STORAGE_KEYS.sunflowerSeeds, currentSeeds - def.seedPrice);
          saveUnlockedCards([...readUnlockedCards(), key]);
          if (this.activeScene) this.activeScene.gameState.pepperUnlocked = this.deckService.isUnlocked("pepper");
          this.showToast(`🎉 ${def.name} desbloqueada para o seu baralho!`);
          this.renderDeckBuilder();
          if (this.activeScene) this.syncUi(this.activeScene.gameState);
        });
      }

      this.ui.availableCardsGrid.appendChild(cardEl);
    });
  }

  updateDefenderTrayUI() {
    this.refreshDeckFromService();
    const tray = document.querySelector(".defender-tray");
    if (!tray) return;
    tray.querySelectorAll(".defender-card[data-defender]").forEach(el => el.remove());

    const shovelBtn = this.ui.shovel || document.getElementById("shovelButton");
    this.activeDeck.forEach((key, index) => {
      const def = DEFENDERS[key];
      if (!def) return;
      const btn = document.createElement("button");
      btn.className = "defender-card";
      btn.dataset.defender = key;
      btn.type = "button";
      btn.title = `Atalho: Tecla ${index + 1}`;
      btn.innerHTML = `<span class="card-icon">${def.icon}</span><span class="card-copy"><strong>[${index + 1}] ${def.name.split(" ")[0]}</strong><small>${def.cost} ☀️</small></span>`;
      this.addTouchClick(btn, () => this.selectDefenderType(key));
      if (shovelBtn) tray.insertBefore(btn, shovelBtn);
      else tray.appendChild(btn);
    });

    this.DEFENDER_KEYS = [...this.activeDeck];
    this.ui.cards = [...document.querySelectorAll(".defender-card[data-defender]")];
  }

  renderResults(state, isWin) {
    if (!this.ui.resultSummary) return;
    this.ui.resultSummary.hidden = false;

    let stars = 1;
    if (state.houseHp >= state.maxHouseHp * 0.75) stars = 3;
    else if (state.houseHp >= state.maxHouseHp * 0.35) stars = 2;
    if (!isWin) stars = 0;

    this.ui.resultStars.textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
    const bestDef = Object.entries(state.damageByType || {}).sort((a, b) => b[1] - a[1])[0];
    const bestDefName = bestDef ? (DEFENDERS[bestDef[0]]?.name || bestDef[0]) : "Nenhum";
    const endlessWaveStat = state.mode === "endless"
      ? `<div class="result-stat"><span>Recorde Infinito</span><strong>Onda ${this.activeScene ? this.activeScene.bestEndlessWave : 0}</strong></div>`
      : "";

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
    const totalWaveCount = state.mode === "endless" ? "∞" : CAMPAIGN_MAX_WAVES;
    this.ui.wavePreviewTitle.textContent = `Onda ${state.wave} de ${totalWaveCount}`;
    this.ui.wavePreviewMode.textContent = MODES[state.mode]?.label || "Modo Normal";

    if (!state.waveActive) {
      this.ui.waveProgress.hidden = true;
      this.ui.startWave.hidden = false;
      const uniqueTypes = [...new Set(state.spawnQueue.map(item => item.type))];
      this.ui.wavePreviewEnemies.innerHTML = uniqueTypes.map(t => {
        const enemy = ENEMIES[t];
        return `<span class="enemy-preview-chip" title="${enemy?.name || t}">${enemy?.icon || "🍬"} ${enemy?.boss ? "👑 BOSS" : (enemy?.name || t)}</span>`;
      }).join(" ");
    } else {
      this.ui.startWave.hidden = true;
      this.ui.waveProgress.hidden = false;
      const total = state.spawnQueue.length + (state.waveSummoned || 0);
      const resolved = Math.min(state.waveResolved || 0, total);
      const pct = Math.min(100, Math.floor((resolved / Math.max(1, total)) * 100));
      this.ui.waveProgressFill.style.width = `${pct}%`;
      this.ui.waveProgressText.textContent = `${resolved} de ${total} doces neutralizados`;
    }
  }

  updateUpgradePanelUI(def) {
    if (!def) return;
    const now = this.activeScene?.gameState.time || 0;
    const fertilized = (def.fertilizerBoostUntil || 0) > now;
    const effectiveDamage = this.activeScene?.defenderSystem.getEffectiveDamage(def) ?? def.damage;
    const totalLevel = (def.powerLevel || 0) + (def.healthLevel || 0) + 1;

    this.ui.upgradeIcon.textContent = def.icon;
    this.ui.upgradeName.textContent = def.name;
    this.ui.upgradeLevel.textContent = fertilized
      ? `🎒 Nível Máximo temporário (${Math.ceil(def.fertilizerBoostUntil - now)}s) · permanente ATK ${def.powerLevel || 0}/3 · VIDA ${def.healthLevel || 0}/3`
      : `Nível ${totalLevel} (Ataque ${def.powerLevel || 0}/3 · Vida ${def.healthLevel || 0}/3)`;

    this.ui.upgradeStats.innerHTML = `
      ⚔️ Dano: <strong>${effectiveDamage}</strong> | 💚 Vida: <strong>${Math.ceil(def.hp)}/${def.maxHp}</strong><br>
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
    const abilityUnlocked = totalLevel >= 2 || fertilized;
    if (!abilityUnlocked) {
      this.ui.abilityBtn.disabled = true;
      if (abilityBtnSmall) abilityBtnSmall.textContent = "Desbloqueia no Nível 2";
    } else {
      const ready = (def.abilityReadyAt || 0) <= now;
      this.ui.abilityBtn.disabled = !ready;
      if (abilityBtnSmall) abilityBtnSmall.textContent = ready ? "PRONTO! ✨" : `Recarga: ${Math.ceil((def.abilityReadyAt || 0) - now)}s`;
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
      this.ui.tutorialText.textContent = "Escolha um vegetal na bandeja (teclas 1-8) e clique na grade para posicioná-lo!";
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
    const threat = WaveRules.getThreatLevelInfo(state.wave, state.mode);
    this.ui.wave.textContent = `Onda ${state.wave} ${threat.icon} ${threat.name} (${biome.icon} ${biome.name})`;
    if (this.ui.seed) this.ui.seed.textContent = state.seed || "------";
    if (this.ui.seeds) this.ui.seeds.textContent = readNumber(STORAGE_KEYS.sunflowerSeeds) || 0;
    this.ui.score.textContent = state.score;
    this.ui.bestScore.textContent = this.activeScene
      ? (state.mode === "endless" && this.activeScene.bestEndlessWave > 0 ? `${this.activeScene.bestScore} (Onda ${this.activeScene.bestEndlessWave})` : this.activeScene.bestScore)
      : 0;
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
      if (!def) continue;
      const canAfford = state.sun >= def.cost;
      const unlocked = this.deckService?.isUnlocked(type) ?? true;
      card.classList.toggle("unaffordable", !canAfford);
      card.classList.toggle("locked", !unlocked);
      card.classList.toggle("ready-to-buy", canAfford && unlocked);
      card.setAttribute("aria-disabled", String(!canAfford || !unlocked));
    }
  }

  showToast(message) {
    this.ui.toast.textContent = message;
    this.ui.toast.classList.add("show");
    setTimeout(() => this.ui.toast.classList.remove("show"), 2300);
  }

  selectDefenderType(type) {
    if (!this.activeScene || this.activeScene.gameState.phase !== "playing") return;
    this.refreshDeckFromService();
    if (!this.activeDeck.includes(type) || !this.deckService?.isUnlocked(type)) {
      this.showToast("Este vegetal não está disponível no seu baralho. 🃏");
      return;
    }
    if (this.activeScene.gameState.sun < DEFENDERS[type].cost) {
      this.showToast("Energia Solar insuficiente! ☀️");
      return;
    }
    this.setInteractionMode("place", type);
  }

  toggleShovel() {
    if (!this.activeScene || this.activeScene.gameState.phase !== "playing") return;
    const active = this.activeScene.gameState.interactionMode === "shovel";
    this.setInteractionMode(active ? "none" : "shovel");
    this.showToast(active ? "Modo Pá desativado." : "🪏 Modo Pá ativo: toque em um vegetal para remover e recuperar 50%!");
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
    if (this.ui.speed) this.ui.speed.textContent = "⏩ 1×";
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
