"use strict";

(() => {
  const ACTIVE_DECK_STORAGE_KEY = "healthy-family-home.active-deck";

  function readPersistedDeck() {
    try {
      const raw = localStorage.getItem(ACTIVE_DECK_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function normalizeDeck(deck) {
    const unlocked = new Set(typeof readUnlockedCards === "function" ? readUnlockedCards() : []);
    const maxSlots = typeof readDeckSlots === "function" ? readDeckSlots() : 5;
    const seen = new Set();
    const result = [];

    for (const key of Array.isArray(deck) ? deck : []) {
      const def = DEFENDERS[key];
      if (!def || seen.has(key)) continue;
      if (def.seedPrice > 0 && !unlocked.has(key)) continue;
      seen.add(key);
      result.push(key);
      if (result.length >= maxSlots) break;
    }
    return result;
  }

  function persistDeck(deck) {
    try {
      localStorage.setItem(ACTIVE_DECK_STORAGE_KEY, JSON.stringify(normalizeDeck(deck)));
    } catch (_) {}
  }

  // One authoritative threat rule. Extra legacy arguments from old callers are
  // intentionally ignored, so wave 16 can never be promoted to boss by UI code.
  const authoritativeIsBossWaveNumber = (waveNumber) => {
    return waveNumber > 0 && (waveNumber % 5 === 0 || waveNumber % CAMPAIGN_MAX_WAVES === 0);
  };

  const authoritativeThreatLevelInfo = (waveNumber) => {
    const isFinale = waveNumber > 0 && waveNumber % CAMPAIGN_MAX_WAVES === 0;
    if (isFinale) {
      return { name: "👑 BAPHO SUPREMO: 5 CHEFES SIMULTÂNEOS", color: "#ff1744", icon: "👑" };
    }
    if (authoritativeIsBossWaveNumber(waveNumber)) {
      return { name: "👑 AMEAÇA DE CHEFE", color: "#ff1744", icon: "👑" };
    }
    if (waveNumber <= 5) return { name: "🌱 AMEAÇA INICIAL", color: "#4caf50", icon: "🌱" };
    if (waveNumber <= 10) return { name: "⚡ AMEAÇA MODERADA", color: "#ffb703", icon: "⚡" };
    if (waveNumber <= 15) return { name: "🔥 AMEAÇA INTENSA", color: "#ff7043", icon: "🔥" };
    if (waveNumber <= 20) return { name: "☠️ AMEAÇA EXTREMA", color: "#d50000", icon: "☠️" };
    return { name: "🌋 AMEAÇA APOCALÍPTICA", color: "#9c27b0", icon: "🌋" };
  };

  globalThis.isBossWaveNumber = authoritativeIsBossWaveNumber;
  globalThis.getThreatLevelInfo = authoritativeThreatLevelInfo;

  // Keep the canonical enemy id consistent across balance helpers.
  if (typeof KNOCKBACK_RESISTANCE === "object" && KNOCKBACK_RESISTANCE) {
    KNOCKBACK_RESISTANCE.gummy_brigadeiro = KNOCKBACK_RESISTANCE.gummy_brigadeiro ?? KNOCKBACK_RESISTANCE.gummy_cannon ?? 0.7;
    delete KNOCKBACK_RESISTANCE.gummy_cannon;
  }

  // Gameplay owns deck admission. UI only mirrors/edits the game-state deck.
  DefenderSystem.prototype.isTypeAllowed = function(type) {
    const deck = this.scene?.gameState?.activeDeck;
    if (!Array.isArray(deck)) return false;
    return deck.includes(type);
  };

  // Audit shield damage performed outside EnemySystem.damageEnemy so every
  // point melted by Orange is attributed to the attacking defender.
  const originalDamageEnemy = EnemySystem.prototype.damageEnemy;
  EnemySystem.prototype.damageEnemy = function(enemy, amount, color, sourceType = null) {
    const shieldBefore = Math.max(0, Number(enemy?.shield) || 0);
    const result = originalDamageEnemy.call(this, enemy, amount, color, sourceType);
    const shieldAfter = Math.max(0, Number(enemy?.shield) || 0);
    const audit = this.scene?.__projectileShieldAudit;
    if (audit && enemy) {
      audit.set(enemy, (audit.get(enemy) || 0) + Math.max(0, shieldBefore - shieldAfter));
    }
    return result;
  };

  const originalUpdateProjectiles = ProjectileSystem.prototype.updateProjectiles;
  ProjectileSystem.prototype.updateProjectiles = function(dt) {
    const state = this.scene.gameState;
    const shieldBefore = new Map();
    for (const enemy of state.enemies) {
      if (!enemy.removed && enemy.hp > 0 && (Number(enemy.shield) || 0) > 0) {
        shieldBefore.set(enemy, Number(enemy.shield) || 0);
      }
    }

    const audit = new Map();
    this.scene.__projectileShieldAudit = audit;
    try {
      originalUpdateProjectiles.call(this, dt);
    } finally {
      for (const [enemy, before] of shieldBefore) {
        const totalShieldLoss = Math.max(0, before - (Number(enemy.shield) || 0));
        const alreadyAccounted = audit.get(enemy) || 0;
        const externalMelt = Math.max(0, totalShieldLoss - alreadyAccounted);
        if (externalMelt > 0) {
          state.stats.damageDealt += externalMelt;
          state.damageByType.orange = (state.damageByType.orange || 0) + externalMelt;
        }
      }
      delete this.scene.__projectileShieldAudit;
    }
  };

  // Swept collision prevents ranged shots from tunnelling through a nearby
  // defender at 2x speed or on a long frame.
  ProjectileSystem.prototype.updateEnemyProjectiles = function(dt) {
    const state = this.scene.gameState;
    if (!state.enemyProjectiles) state.enemyProjectiles = [];

    for (const ep of state.enemyProjectiles) {
      if (!ep || ep.removed) continue;

      const previousX = ep.x;
      ep.x -= (ep.speed || 300) * dt;
      if (ep.textObj) ep.textObj.setPosition(ep.x, ep.y);

      const minX = Math.min(previousX, ep.x) - 32;
      const maxX = Math.max(previousX, ep.x) + 32;
      const targetDef = state.defenders
        .filter(d => d && !d.removed && d.hp > 0 && d.row === ep.row && d.x >= minX && d.x <= maxX)
        .sort((a, b) => b.x - a.x)[0];

      if (targetDef) {
        const brigadeiro = ep.effect === "brigadeiro";
        this.scene.defenderSystem.damageDefender(targetDef, ep.damage, {
          reason: brigadeiro ? "brigadeiro-projectile" : "enemy-projectile",
          slowDuration: brigadeiro ? (ep.slowDuration || 5) : 0,
          slowMultiplier: brigadeiro ? (ep.slowMultiplier || 0.7) : undefined,
          color: brigadeiro ? "#8b4b2b" : (ep.color || "#ff3b9a"),
          burstColor: ep.color || "#ff3b9a",
          suffix: brigadeiro ? "🍫" : "🌵"
        });

        if (brigadeiro && !targetDef.removed) {
          this.scene.effectsSystem.spawnFloater(targetDef.x, targetDef.y - 45, "BRIGADEIRO GRUDENTO! -30% ATAQUE 🍫", "#8b4b2b", 1.05);
        }

        this.scene.soundManager.beep(brigadeiro ? 145 : 200, 0.05, "sawtooth", 0.03);
        ep.removed = true;
        if (ep.textObj) ep.textObj.destroy();
      } else if (ep.x < this.scene.HOUSE_X) {
        const houseDamage = ep.effect === "brigadeiro" ? Math.max(15, Math.round(ep.damage * 0.6)) : 20;
        state.houseHp -= houseDamage;
        state.houseDamagedThisWave = true;
        this.scene.effectsSystem.burst(this.scene.HOUSE_X, ep.y, ep.color || "#ff3b9a", 12);
        this.scene.effectsSystem.spawnFloater(this.scene.HOUSE_X + 20, ep.y - 15, `-${houseDamage} HP`, ep.color || "#ff3b9a", 1.1);
        ep.removed = true;
        if (ep.textObj) ep.textObj.destroy();
      }
    }

    this.scene.defenderSystem.cleanupDefeated();
    state.enemyProjectiles = state.enemyProjectiles.filter(ep => ep && !ep.removed && ep.x > 0);
  };

  window.phaserGame = null;
  window.phaserConfig = {
    type: Phaser.CANVAS,
    renderType: Phaser.CANVAS,
    width: 1000,
    height: 620,
    parent: "gameContainer",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MainScene]
  };

  const persistedDeck = normalizeDeck(readPersistedDeck());
  window.uiManager = new UIManager();

  if (persistedDeck.length > 0) {
    window.uiManager.activeDeck = persistedDeck;
  }

  const baseRenderDeckBuilder = window.uiManager.renderDeckBuilder.bind(window.uiManager);
  window.uiManager.renderDeckBuilder = function() {
    const result = baseRenderDeckBuilder();
    persistDeck(this.activeDeck);
    if (this.activeScene?.gameState) {
      this.activeScene.gameState.activeDeck = [...this.activeDeck];
      if (this.activeDeck.includes("pepper")) this.activeScene.gameState.pepperUnlocked = true;
    }
    return result;
  };

  const baseOnGameStarted = window.onPhaserGameStarted;
  window.onPhaserGameStarted = (scene) => {
    scene.gameState.activeDeck = [...window.uiManager.activeDeck];
    if (scene.gameState.activeDeck.includes("pepper")) scene.gameState.pepperUnlocked = true;
    if (baseOnGameStarted) baseOnGameStarted(scene);
  };

  const baseOnSyncUi = window.onPhaserSyncUi;
  window.onPhaserSyncUi = (state) => {
    if (state) {
      state.activeDeck = [...window.uiManager.activeDeck];
      if (state.activeDeck.includes("pepper")) state.pepperUnlocked = true;
    }
    if (baseOnSyncUi) baseOnSyncUi(state);

    if (state && state.wave > 0 && state.wave % CAMPAIGN_MAX_WAVES === 0 && window.uiManager.activeScene?.uiOverlayText) {
      window.uiManager.activeScene.uiOverlayText.setText(`👑🔥 ONDA ${state.wave} GRANDE FINALE: CONFRONTO DOS 5 CHEFES SIMULTÂNEOS!`);
    }
  };

  // Apply restored deck after the constructor created the first UI snapshot.
  window.uiManager.renderDeckBuilder();
  window.uiManager.updateDefenderTrayUI();
})();
