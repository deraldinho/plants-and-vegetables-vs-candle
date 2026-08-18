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
  const index = Math.floor((waveNumber - 1) / 4) % BIOMES.length;
  return BIOMES[index];
}

function generateProceduralWave(waveNumber, seed = 582914, mode = "normal") {
  const rand = mulberry32(seed + waveNumber * 10007);
  const list = [];
  const add = (at, type, row) => list.push({ at, type, row, spawned: false });

  const isEndless = (mode === "endless");
  const isBossWave = (waveNumber % 5 === 0);

  const enemyPool = ["gummy", "marshmallow", "lollipop"];
  if (waveNumber >= 2) enemyPool.push("soda");
  if (waveNumber >= 3) enemyPool.push("cupcake", "gum");
  if (waveNumber >= 4) enemyPool.push("chocolate");

  const count = Math.min(6 + Math.floor(waveNumber * 2.4), 42);
  const spacing = Math.max(0.5, 2.2 - waveNumber * 0.06);

  for (let i = 0; i < count; i++) {
    const at = 1.5 + i * spacing + rand() * 0.4;
    const typeIndex = Math.floor(rand() * enemyPool.length);
    const type = enemyPool[typeIndex];
    const row = Math.floor(rand() * 5);
    add(at, type, row);
  }

  if (isBossWave) {
    const bossRow = Math.floor(rand() * 5);
    let bossType = "candle";
    if (waveNumber % 15 === 5) bossType = "candle";
    else if (waveNumber % 15 === 10) bossType = "gum_boss";
    else if (waveNumber % 15 === 0) bossType = "lollipop_boss";

    add(2.0 + count * spacing, bossType, bossRow);
  }

  return list.sort((a, b) => a.at - b.at);
}
