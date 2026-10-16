"use strict";

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getBiomeForWave(waveNumber) {
  const safeWave = Math.max(1, Number.isFinite(waveNumber) ? waveNumber : 1);
  const index = Math.floor((safeWave - 1) / 4) % BIOMES.length;
  return BIOMES[index] || BIOMES[0];
}

// S3 — Threat Budget: pacotes sinérgicos intencionais.
// Cada combo combina inimigos que formam uma ameaça coordenada; o premium é o
// custo extra de enfrentar a sinergia em vez de inimigos isolados.
const WAVE_COMBOS = [
  { id: "sticky_pack", minWave: 3, premium: 0.4, members: ["gum", "caramel_sticky"] },
  { id: "shield_wall", minWave: 4, premium: 0.5, members: ["chocolate", "caramel_sticky"] },
  { id: "support_line", minWave: 4, premium: 0.4, members: ["soda", "cupcake"] },
  { id: "rush", minWave: 5, premium: 0.3, members: ["marshmallow", "marshmallow", "bubblegum_jumper"] },
  { id: "artillery", minWave: 6, premium: 0.6, members: ["gummy_brigadeiro", "strawberry_shooter"] }
];

const MAX_WAVE_ITEMS = 120;
const MAX_COMPOSE_STEPS = 600;

function comboCost(combo) {
  return combo.members.reduce((sum, type) => sum + WaveRules.threatOf(type), 0) + combo.premium;
}

function cheapestThreat(pool) {
  return pool.reduce((min, type) => Math.min(min, WaveRules.threatOf(type)), Infinity);
}

function composeWave(waveNumber, seed = 582914, mode = "normal") {
  const wave = Math.max(1, Number.isFinite(waveNumber) ? Math.floor(waveNumber) : 1);
  const rand = mulberry32(((seed >>> 0) + wave * 10007) >>> 0);
  const isFinale = WaveRules.isFinale(wave, mode);
  const isBossWave = WaveRules.isBoss(wave, mode);

  const pool = WaveRules.availableEnemyPool(wave);
  const combos = WAVE_COMBOS.filter(combo =>
    wave >= combo.minWave && combo.members.every(type => pool.includes(type))
  );

  let budget = WaveRules.escortBudget(wave, mode);
  const types = [];

  // Estreias forçadas: o pacote desbloqueado nesta onda é garantido.
  for (const combo of combos) {
    if (combo.minWave !== wave) continue;
    const cost = comboCost(combo);
    if (cost <= budget) {
      budget -= cost;
      for (const member of combo.members) types.push(member);
    }
  }

  const minCost = cheapestThreat(pool);
  const singles = pool
    .map(type => ({ type, cost: WaveRules.threatOf(type) }))
    .sort((a, b) => a.cost - b.cost || a.type.localeCompare(b.type));

  let steps = 0;
  while (budget >= minCost && types.length < MAX_WAVE_ITEMS && steps < MAX_COMPOSE_STEPS) {
    steps++;
    const affordableCombos = combos.filter(combo => comboCost(combo) <= budget);
    const affordableSingles = singles.filter(entry => entry.cost <= budget);
    if (affordableSingles.length === 0 && affordableCombos.length === 0) break;

    const preferCombo = affordableCombos.length > 0 && (rand() < 0.6 || affordableSingles.length === 0);
    if (preferCombo) {
      const combo = affordableCombos[Math.floor(rand() * affordableCombos.length)];
      budget -= comboCost(combo);
      for (const member of combo.members) types.push(member);
    } else {
      const entry = affordableSingles[Math.floor(rand() * affordableSingles.length)];
      budget -= entry.cost;
      types.push(entry.type);
    }
  }

  // Bosses/finales por script (mesma regra de WaveRules). Ficam fora do budget
  // de escolta, pois a própria ameaça do chefe já é contabilizada pelo seu `threat`.
  if (isFinale) {
    ["candle", "gum_boss", "confeiteiro", "cake_robot", "lollipop_boss"].forEach((type, row) => {
      types.push({ type, row });
    });
  } else if (isBossWave) {
    const cycle = wave % 25;
    let bossType = "confeiteiro";
    if (cycle === 5) bossType = "candle";
    else if (cycle === 10) bossType = "candy_catapult_boss";
    else if (cycle === 15) bossType = "lollipop_boss";
    else if (cycle === 20) bossType = "cake_robot";
    types.push({ type: bossType, row: Math.floor(rand() * 5) });
  }

  // Distribui linhas (anti-repetição imediata) e tempos determinísticos.
  const spacing = isFinale ? 0.4 : Math.max(0.35, 1.5 - wave * 0.035);
  const list = [];
  let lastRow = -1;
  types.forEach((entry, index) => {
    const at = 1.5 + index * spacing + rand() * 0.25;
    if (typeof entry === "object") {
      list.push({ at, type: entry.type, row: entry.row, spawned: false, threat: WaveRules.threatOf(entry.type) });
      return;
    }
    let row = Math.floor(rand() * 5);
    if (row === lastRow) row = (row + 1) % 5;
    lastRow = row;
    list.push({ at, type: entry, row, spawned: false, threat: WaveRules.threatOf(entry) });
  });

  return list.sort((a, b) => a.at - b.at);
}

// Compatibilidade: consumidores legados continuam usando este contrato.
function generateProceduralWave(waveNumber, seed = 582914, mode = "normal") {
  return composeWave(waveNumber, seed, mode);
}
