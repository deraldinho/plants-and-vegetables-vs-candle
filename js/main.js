"use strict";

(() => {
  let phaserGame = null;
  let activeScene = null;

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
    closeUpgrade: document.getElementById("closeUpgradeButton"),
    seed: document.getElementById("seedValue"),
    cards: [...document.querySelectorAll(".defender-card[data-defender]")],
    habits: [...document.querySelectorAll(".habit")]
  };

  const phaserConfig = {
    type: Phaser.CANVAS,
    width: 1000,
    height: 620,
    parent: document.querySelector(".board-wrap"),
    canvas: document.getElementById("gameCanvas"),
    physics: {
      default: "arcade",
      arcade: { debug: false }
    },
    scene: [MainScene]
  };

  window.onPhaserGameStarted = (scene) => {
    activeScene = scene;
    syncUi(scene.gameState);
  };

  window.onPhaserSyncUi = (state) => {
    syncUi(state);
  };

  function syncUi(state) {
    if (!state) return;
    ui.sun.textContent = Math.floor(state.sun);
    ui.health.textContent = Math.ceil(state.houseHp);
    ui.healthBar.style.width = `${Math.max(0, state.houseHp / state.maxHouseHp * 100)}%`;
    ui.healthBar.style.background = state.houseHp < 300 ? "#ef476f" : "linear-gradient(90deg, #69c743, #b8e34d)";
    const biome = getBiomeForWave(state.wave);
    ui.wave.textContent = `Onda ${state.wave} (${biome.icon} ${biome.name})`;
    if (ui.seed) ui.seed.textContent = state.seed || "------";
    ui.score.textContent = state.score;
    ui.bestScore.textContent = activeScene ? activeScene.bestScore : 0;
    updateCards(state);
  }

  function updateCards(state) {
    if (!state) return;
    for (const card of ui.cards) {
      const type = card.dataset.defender;
      card.classList.toggle("unaffordable", state.sun < DEFENDERS[type].cost);
      if (type === "pepper") {
        card.classList.toggle("locked", !state.pepperUnlocked);
        card.querySelector("strong").textContent = state.pepperUnlocked ? "Pimenta" : "Pimenta 🔒";
      }
    }
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    setTimeout(() => ui.toast.classList.remove("show"), 2300);
  }

  ui.cards.forEach(card => card.addEventListener("click", () => {
    if (!activeScene || activeScene.gameState.phase !== "playing") return;
    const type = card.dataset.defender;
    if (type === "pepper" && !activeScene.gameState.pepperUnlocked) {
      showToast("Coma vegetais para liberar a Pimenta!");
      return;
    }
    if (activeScene.gameState.sun < DEFENDERS[type].cost) {
      showToast("Energia Solar insuficiente!");
      return;
    }
    activeScene.gameState.selected = type;
    ui.cards.forEach(c => c.classList.toggle("selected", c === card));
    document.getElementById("shovelButton").classList.remove("selected");
  }));

  document.getElementById("shovelButton").addEventListener("click", event => {
    if (!activeScene || activeScene.gameState.phase !== "playing") return;
    activeScene.gameState.selected = null;
    ui.cards.forEach(c => c.classList.remove("selected"));
    event.currentTarget.classList.add("selected");
  });

  ui.startWave.addEventListener("click", () => {
    if (!activeScene || activeScene.gameState.phase !== "playing") return;
    activeScene.gameState.waveActive = true;
    showToast(`Onda ${activeScene.gameState.wave} iniciada!`);
  });

  ui.overlayButton.addEventListener("click", () => {
    ui.overlay.classList.remove("visible");
    if (!phaserGame) {
      phaserGame = new Phaser.Game(phaserConfig);
    } else if (activeScene) {
      activeScene.startGame();
    }
  });

  ui.modeButtons.forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      writeStorage(STORAGE_KEYS.selectedMode, mode);
      if (activeScene) {
        activeScene.selectedMode = mode;
        activeScene.gameState.mode = mode;
      }
      ui.modeButtons.forEach(btn => btn.setAttribute("aria-pressed", String(btn === button)));
      showToast(`Modo selecionado: ${MODES[mode].label}`);
    });
  });

  ui.habits.forEach(button => {
    button.addEventListener("click", () => {
      if (!activeScene || activeScene.gameState.phase !== "playing") return;
      const name = button.dataset.habit;
      if (activeScene.gameState.usedHabits.has(name)) return;
      activeScene.gameState.usedHabits.add(name);
      button.classList.add("used");
      if (name === "water") activeScene.gameState.sun += 50;
      if (name === "fruit") activeScene.gameState.sun += 100;
      if (name === "vegetables") activeScene.gameState.pepperUnlocked = true;
      if (name === "exercise") activeScene.gameState.attackBoostUntil = activeScene.gameState.time + 20;
      if (name === "teeth") activeScene.gameState.houseHp = Math.min(activeScene.gameState.maxHouseHp, activeScene.gameState.houseHp + 300);
      if (name === "sleep") {
        for (const enemy of activeScene.gameState.enemies) activeScene.damageEnemy(enemy, enemy.boss ? 400 : 220, "#72d9ff");
      }
      showToast(`Hábito ativado: ${name}!`);
      syncUi(activeScene.gameState);
    });
  });

  ui.speed.addEventListener("click", () => {
    if (!activeScene) return;
    activeScene.gameState.gameSpeed = activeScene.gameState.gameSpeed === 1 ? 2 : 1;
    ui.speed.textContent = `⏩ ${activeScene.gameState.gameSpeed}×`;
    showToast(`Velocidade ${activeScene.gameState.gameSpeed}×`);
  });

  ui.pause.addEventListener("click", () => {
    if (!activeScene) return;
    activeScene.gameState.paused = !activeScene.gameState.paused;
    ui.pause.textContent = activeScene.gameState.paused ? "▶ Continuar" : "⏸ Pausar";
    ui.overlay.classList.toggle("visible", activeScene.gameState.paused);
  });
})();
