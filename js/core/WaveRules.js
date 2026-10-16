"use strict";

const WaveRules = Object.freeze({
  isFinale(waveNumber, mode = "normal") {
    if (!Number.isFinite(waveNumber) || waveNumber <= 0) return false;
    if (mode === "endless") return waveNumber % CAMPAIGN_MAX_WAVES === 0;
    return waveNumber === CAMPAIGN_MAX_WAVES;
  },

  isBoss(waveNumber, mode = "normal") {
    if (!Number.isFinite(waveNumber) || waveNumber <= 0) return false;
    return waveNumber % 5 === 0 || this.isFinale(waveNumber, mode);
  },

  threatOf(type) {
    const def = ENEMIES[type];
    return def && Number.isFinite(def.threat) ? def.threat : 1;
  },

  threatBudget(waveNumber, mode = "normal") {
    if (!Number.isFinite(waveNumber) || waveNumber <= 0) return 0;
    const BASE = 7;
    const GROWTH = 2.4;
    const EXP = 1.12;
    const modeDef = MODES[mode] || MODES.normal;
    const mult = Number.isFinite(modeDef && modeDef.threatMult) ? modeDef.threatMult : 1;
    return Math.round((BASE + GROWTH * Math.pow(waveNumber - 1, EXP)) * mult);
  },

  availableEnemyPool(waveNumber) {
    const wave = Math.max(1, Number.isFinite(waveNumber) ? Math.floor(waveNumber) : 1);
    const pool = ["gummy", "marshmallow", "lollipop"];
    if (wave >= 2) pool.push("soda");
    if (wave >= 3) pool.push("cupcake", "gum");
    if (wave >= 4) pool.push("chocolate", "caramel_sticky");
    if (wave >= 5) pool.push("bubblegum_jumper");
    if (wave >= 6) pool.push("gummy_brigadeiro", "strawberry_shooter");
    return pool;
  },

  // Orçamento de escolta: quanto do budget é gasto em inimigos comuns.
  // Bosses/finales são scriptados à parte e consomem grande parte da ameaça.
  escortBudget(waveNumber, mode = "normal") {
    const budget = this.threatBudget(waveNumber, mode);
    if (this.isFinale(waveNumber, mode)) return Math.min(budget, 45);
    if (this.isBoss(waveNumber, mode)) return Math.round(budget * 0.6);
    return budget;
  },

  seedReward(waveNumber, mode = "normal") {
    if (this.isFinale(waveNumber, mode)) return 100;
    if (this.isBoss(waveNumber, mode)) return 25;
    return 10;
  },

  getThreatLevelInfo(waveNumber, mode = "normal") {
    if (this.isFinale(waveNumber, mode)) {
      return { name: "👑 BAPHO SUPREMO: 5 CHEFES SIMULTÂNEOS", color: "#ff1744", icon: "👑" };
    }
    if (this.isBoss(waveNumber, mode)) {
      return { name: "👑 AMEAÇA DE CHEFE", color: "#ff1744", icon: "👑" };
    }
    if (waveNumber <= 5) return { name: "🌱 AMEAÇA INICIAL", color: "#4caf50", icon: "🌱" };
    if (waveNumber <= 10) return { name: "⚡ AMEAÇA MODERADA", color: "#ffb703", icon: "⚡" };
    if (waveNumber <= 15) return { name: "🔥 AMEAÇA INTENSA", color: "#ff7043", icon: "🔥" };
    if (waveNumber <= 20) return { name: "☠️ AMEAÇA EXTREMA", color: "#d50000", icon: "☠️" };
    return { name: "🌋 AMEAÇA APOCALÍPTICA", color: "#9c27b0", icon: "🌋" };
  },

  getBattleBanner(waveNumber, mode = "normal") {
    if (this.isFinale(waveNumber, mode)) {
      return `👑🔥 ONDA ${waveNumber} GRANDE FINALE: CONFRONTO DOS 5 CHEFES SIMULTÂNEOS!`;
    }
    if (!this.isBoss(waveNumber, mode)) {
      const total = mode === "endless" ? "∞" : CAMPAIGN_MAX_WAVES;
      return `⚔️ Onda ${waveNumber} de ${total} em andamento`;
    }

    const cycle = waveNumber % 25;
    if (cycle === 5) return `🕯️ CHEFE 1 (Onda ${waveNumber}): VELA MESTRA!`;
    if (cycle === 10) return `🍬 CHEFE DE CERCO (Onda ${waveNumber}): GENERAL CONFEITO DA CATAPULTA!`;
    if (cycle === 15) return `🍭 CHEFE 3 (Onda ${waveNumber}): PIRULITO GIRATÓRIO SUPREMO!`;
    if (cycle === 20) return `🤖🎂 CHEFE 4 (Onda ${waveNumber}): ROBÔ BOLO MUTANTE GIGANTE!`;
    return `👨‍🍳 CHEFE 5 (Onda ${waveNumber}): O CONFEITEIRO SOMBRIO!`;
  }
});

// Compatibilidade de API: callers antigos podem continuar chamando estas funções,
// mas o flag legado de boss é deliberadamente ignorado.
function isBossWaveNumber(waveNumber, mode = "normal") {
  return WaveRules.isBoss(waveNumber, mode);
}

function getThreatLevelInfo(waveNumber, _legacyBossFlag = false, mode = "normal") {
  return WaveRules.getThreatLevelInfo(waveNumber, mode);
}
