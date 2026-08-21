"use strict";

const CAMPAIGN_MAX_WAVES = 26;

const STORAGE_KEYS = {
  bestScore: "healthy-family-home.best-score",
  tutorialSeen: "healthy-family-home.tutorial-seen",
  selectedMode: "healthy-family-home.selected-mode",
  bestEndlessWave: "healthy-family-home.best-endless-wave",
  sunflowerSeeds: "healthy-family-home.sunflower-seeds",
  unlockedCards: "healthy-family-home.unlocked-cards",
  deckSlots: "healthy-family-home.deck-slots"
};

const DEFENDERS = {
  potato: { name: "Batata Mina", icon: "🥔", cost: 25, hp: 80, damage: 180, cooldown: 99, color: "#d2b48c", projectile: "", area: true, seedPrice: 0, ability: { name: "Armamento Rápido", cooldown: 12, description: "arma a mina instantaneamente" } },
  garlic: { name: "Alho Repelente", icon: "🧄", cost: 50, hp: 220, damage: 0, cooldown: 99, color: "#f5f5dc", projectile: "", seedPrice: 0, ability: { name: "Névoa Repelente", cooldown: 15, description: "repela os doces próximos para linhas vizinhas" } },
  corn: { name: "Milho Atirador", icon: "🌽", cost: 50, hp: 100, damage: 20, cooldown: 1.2, color: "#ffd43b", projectile: "●", seedPrice: 0, ability: { name: "Rajada Dourada", cooldown: 18, description: "120 de dano no alvo da linha" } },
  carrot: { name: "Cenoura Arqueira", icon: "🥕", cost: 75, hp: 80, damage: 15, cooldown: .58, color: "#ff8b2c", projectile: "➤", seedPrice: 0, ability: { name: "Flecha Perfurante", cooldown: 16, description: "55 de dano em toda a linha" } },
  broccoli: { name: "Brócolis Escudo", icon: "🥦", cost: 100, hp: 350, damage: 0, cooldown: 99, color: "#48a94f", projectile: "", seedPrice: 0, ability: { name: "Fortaleza Verde", cooldown: 20, description: "cura e protege os vegetais próximos" } },
  pepper: { name: "Pimenta Flamejante", icon: "🌶️", cost: 125, hp: 120, damage: 35, cooldown: 1.35, color: "#f04b36", projectile: "🔥", burn: true, seedPrice: 100, ability: { name: "Trilha de Fogo", cooldown: 22, description: "incendeia todos os doces da linha" } },
  tomato: { name: "Tomate Bomba", icon: "🍅", cost: 150, hp: 150, damage: 50, cooldown: 2.3, color: "#e93835", projectile: "💥", area: true, seedPrice: 120, ability: { name: "Superexplosão", cooldown: 24, description: "120 de dano em uma grande área" } },
  watermelon: { name: "Melancia Devoradora", icon: "🍉", cost: 175, hp: 220, damage: 0, cooldown: 15, color: "#ff3b5c", projectile: "", seedPrice: 150, ability: { name: "Super Digestão", cooldown: 18, description: "conclui a digestão e cura 80 HP" } },
  banana: { name: "Banana Boxeadora", icon: "🍌", cost: 75, hp: 160, damage: 28, cooldown: 0.45, color: "#ffe135", melee: true, projectile: "", seedPrice: 150, ability: { name: "Combo de Socos", cooldown: 14, description: "socos super velozes por 5 segundos" } },
  orange: { name: "Laranja Ácida", icon: "🍊", cost: 100, hp: 110, damage: 18, cooldown: 1.1, color: "#ffa500", acid: true, projectile: "💧", seedPrice: 180, ability: { name: "Chuva Ácida", cooldown: 16, description: "derrete escudos e reduz a armadura dos doces da linha" } },
  strawberry: { name: "Morango Atrator", icon: "🍓", cost: 60, hp: 200, damage: 150, cooldown: 99, color: "#ff2a4b", taunt: true, explodeOnDeath: true, projectile: "", seedPrice: 200, ability: { name: "Aroma Irresistível", cooldown: 15, description: "atrai todos os doces para sua posição" } },
  apple: { name: "Maçã Esmagadora", icon: "🍎", cost: 90, hp: 120, damage: 220, cooldown: 99, color: "#e3242b", smash: true, projectile: "", seedPrice: 220, ability: { name: "Super Impacto", cooldown: 16, description: "esmaga com 300 de dano em área" } },
  pineapple: { name: "Abacaxi Mina", icon: "🍍", cost: 40, hp: 90, damage: 140, cooldown: 99, color: "#e4b419", spikeMine: true, projectile: "", seedPrice: 250, ability: { name: "Espinhos Perfurantes", cooldown: 12, description: "espalha espinhos pela grade" } },
  cauliflower: { name: "Couve-Flor Mística", icon: "🥦", cost: 125, hp: 100, damage: 24, cooldown: 1.25, color: "#d8f8e1", piercing: true, projectile: "🌀", seedPrice: 300, ability: { name: "Onda Mística", cooldown: 18, description: "projétil místico que atravessa a linha inteira" } }
};

const ENEMIES = {
  gummy: { name: "Ursinho de Goma", icon: "🧸", hp: 130, speed: 24, damage: 18, attackRate: 1, reward: 25, scale: 1, description: "Inimigo básico e equilibrado." },
  lollipop: { name: "Pirulito Giratório", icon: "🍭", hp: 210, speed: 18, damage: 24, attackRate: 1.1, reward: 35, scale: 1.05, description: "Resistente e constante." },
  cupcake: { name: "Cupcake Tanque", icon: "🧁", hp: 430, speed: 10, damage: 35, attackRate: 1.2, reward: 55, scale: 1.15, description: "Muita vida, mas anda devagar." },
  marshmallow: { name: "Marshmallow Veloz", icon: "⬜", hp: 100, speed: 45, damage: 14, attackRate: .75, reward: 30, scale: .9, description: "Pouca vida e velocidade extrema." },
  chocolate: { name: "Chocolate Blindado", icon: "🍫", hp: 300, speed: 14, damage: 28, attackRate: 1.1, reward: 50, scale: 1.1, shield: 150, preview: "escudo", description: "Possui um escudo que precisa ser quebrado primeiro." },
  soda: { name: "Refrigerante Energético", icon: "🥤", hp: 180, speed: 22, damage: 18, attackRate: 1, reward: 40, scale: 1.05, aura: true, preview: "acelera aliados", description: "Acelera doces próximos na mesma linha." },
  gum: { name: "Chiclete Pegajoso", icon: "🟣", hp: 190, speed: 20, damage: 20, attackRate: .9, reward: 45, scale: 1, sticky: true, preview: "causa lentidão", description: "Desacelera o ataque do defensor atingido." },
  candle: { name: "Vela Mestra (Chefe 1)", icon: "🕯️", hp: 2200, speed: 8, damage: 55, attackRate: 1.05, reward: 500, scale: 1.55, boss: true, description: "Chefe 1 da Onda 5: Enorme vida e dano violento." },
  gum_boss: { name: "Chiclete Gigante Grudento (Chefe 2)", icon: "🟣", hp: 3800, speed: 7, damage: 65, attackRate: .95, reward: 750, scale: 1.65, sticky: true, boss: true, description: "Chefe 2 da Onda 10: Lança bombas de chiclete grudento desacelerando os vegetais." },
  lollipop_boss: { name: "Pirulito Giratório Supremo (Chefe 3)", icon: "🍭", hp: 5800, speed: 9, damage: 80, attackRate: .85, reward: 1200, scale: 1.7, boss: true, description: "Chefe 3 da Onda 15: Gira furiosamente e spamma tempestades de espinhos." },
  confeiteiro: { name: "O Confeiteiro Sombrio (Chefe Supremo)", icon: "👨‍🍳", hp: 8500, speed: 6, damage: 100, attackRate: .8, reward: 2000, scale: 1.85, boss: true, description: "O Chefão Supremo da Onda Final! Invoca doces ajudantes e dispara projéteis pesados." },
  cake_robot: { name: "Robô Bolo Mutante Gigante (Chefe Robótico)", icon: "🤖🎂", hp: 6500, speed: 5, damage: 90, attackRate: 1, reward: 1500, scale: 1.8, boss: true, description: "Uma criação cibernética de bolo mutante! Lança raios de laser de cobertura e paralisa vegetais." }
};

const MODES = {
  easy: { label: "Modo Tranquilo", startSun: 225, houseHp: 1200, enemyHp: .78, enemySpeed: .9, enemyDamage: .78, scoreMultiplier: .8, preparationBonus: 90, levelHpScaling: 0.10, levelSpeedScaling: 0.012, levelRewardScaling: 0.08 },
  normal: { label: "Modo Normal", startSun: 150, houseHp: 1000, enemyHp: 1, enemySpeed: 1, enemyDamage: 1, scoreMultiplier: 1, preparationBonus: 75, levelHpScaling: 0.14, levelSpeedScaling: 0.018, levelRewardScaling: 0.12 },
  hard: { label: "Modo Desafio", startSun: 125, houseHp: 850, enemyHp: 1.28, enemySpeed: 1.12, enemyDamage: 1.22, scoreMultiplier: 1.35, preparationBonus: 60, levelHpScaling: 0.20, levelSpeedScaling: 0.025, levelRewardScaling: 0.16 },
  endless: { label: "Modo Infinito", startSun: 175, houseHp: 1000, enemyHp: 1, enemySpeed: 1, enemyDamage: 1, scoreMultiplier: 1.1, preparationBonus: 65, levelHpScaling: 0.16, levelSpeedScaling: 0.020, levelRewardScaling: 0.14 }
};

function getThreatLevelInfo(waveNumber, isBossWave) {
  if (waveNumber === 26 || (waveNumber % 26 === 0 && waveNumber > 0)) {
    return { name: "👑 BAPHO SUPREMO: 5 CHEFES SIMULTÂNEOS", color: "#ff1744", icon: "👑" };
  }
  if (isBossWave) {
    return { name: "👑 AMEAÇA DE CHEFE", color: "#ff1744", icon: "👑" };
  }
  if (waveNumber <= 5) {
    return { name: "🌱 AMEAÇA INICIAL", color: "#4caf50", icon: "🌱" };
  }
  if (waveNumber <= 10) {
    return { name: "⚡ AMEAÇA MODERADA", color: "#ffb703", icon: "⚡" };
  }
  if (waveNumber <= 15) {
    return { name: "🔥 AMEAÇA INTENSA", color: "#ff7043", icon: "🔥" };
  }
  if (waveNumber <= 20) {
    return { name: "☠️ AMEAÇA EXTREMA", color: "#d50000", icon: "☠️" };
  }
  return { name: "🌋 AMEAÇA APOCALÍPTICA", color: "#9c27b0", icon: "🌋" };
}

const BIOMES = [
  { name: "Jardim Saudável", icon: "🌱", skyTop: 0x95dff5, skyBottom: 0x4c9d45, gridColor1: 0x65b74a, gridColor2: 0x7cc952, bushColor: 0x4a8c3e },
  { name: "Deserto Açucarado", icon: "🏜️", skyTop: 0xffb703, skyBottom: 0xf4a261, gridColor1: 0xe9c46a, gridColor2: 0xf4a261, bushColor: 0x2a9d8f },
  { name: "Floresta Noturna", icon: "🌌", skyTop: 0x2b2d42, skyBottom: 0x1d3557, gridColor1: 0x3d5a80, gridColor2: 0x293241, bushColor: 0x000814 },
  { name: "Vulcão de Caramelo", icon: "🌋", skyTop: 0x6b705c, skyBottom: 0xbb3e03, gridColor1: 0xae2012, gridColor2: 0x9b2226, bushColor: 0x000000 }
];

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

function readUnlockedCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.unlockedCards);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return ["potato", "garlic", "corn", "carrot", "broccoli"];
}

function saveUnlockedCards(cardsArray) {
  writeStorage(STORAGE_KEYS.unlockedCards, JSON.stringify(cardsArray));
}

function readDeckSlots() {
  try {
    const val = Number.parseInt(localStorage.getItem(STORAGE_KEYS.deckSlots), 10);
    if (!Number.isNaN(val) && val >= 5) return Math.min(7, val);
  } catch (_) {}
  return 5;
}

function saveDeckSlots(slotsCount) {
  writeStorage(STORAGE_KEYS.deckSlots, slotsCount);
}
