"use strict";

const CAMPAIGN_MAX_WAVES = 15;

const STORAGE_KEYS = {
  bestScore: "healthy-family-home.best-score",
  tutorialSeen: "healthy-family-home.tutorial-seen",
  selectedMode: "healthy-family-home.selected-mode",
  bestEndlessWave: "healthy-family-home.best-endless-wave"
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
  candle: { name: "Vela Mestra (Chefe 1)", icon: "🕯️", hp: 2200, speed: 8, damage: 55, attackRate: 1.05, reward: 500, scale: 1.55, boss: true, description: "Chefe 1 da Onda 5: Enorme vida e dano violento." },
  gum_boss: { name: "Chiclete Gigante Grudento (Chefe 2)", icon: "🟣", hp: 3800, speed: 7, damage: 65, attackRate: .95, reward: 750, scale: 1.65, sticky: true, boss: true, description: "Chefe 2 da Onda 10: Lança bombas de chiclete grudento desacelerando os vegetais." },
  lollipop_boss: { name: "Pirulito Giratório Supremo (Chefe 3)", icon: "🍭", hp: 5800, speed: 9, damage: 80, attackRate: .85, reward: 1200, scale: 1.7, boss: true, description: "Chefe 3 da Onda 15: Gira furiosamente e spamma tempestades de espinhos." }
};

const MODES = {
  easy: { label: "Modo Tranquilo", startSun: 225, houseHp: 1200, enemyHp: .78, enemySpeed: .9, enemyDamage: .78, scoreMultiplier: .8, preparationBonus: 90 },
  normal: { label: "Modo Normal", startSun: 150, houseHp: 1000, enemyHp: 1, enemySpeed: 1, enemyDamage: 1, scoreMultiplier: 1, preparationBonus: 75 },
  hard: { label: "Modo Desafio", startSun: 125, houseHp: 850, enemyHp: 1.28, enemySpeed: 1.12, enemyDamage: 1.22, scoreMultiplier: 1.35, preparationBonus: 60 },
  endless: { label: "Modo Infinito", startSun: 175, houseHp: 1000, enemyHp: 1, enemySpeed: 1, enemyDamage: 1, scoreMultiplier: 1.1, preparationBonus: 65 }
};

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
