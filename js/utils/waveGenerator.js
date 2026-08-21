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
  const isFinaleWave = (waveNumber === 26 || (isEndless && waveNumber % 26 === 0));
  const isBossWave = (waveNumber % 5 === 0) || isFinaleWave;

  const enemyPool = ["gummy", "marshmallow", "lollipop"];
  if (waveNumber >= 2) enemyPool.push("soda");
  if (waveNumber >= 3) enemyPool.push("cupcake", "gum");
  if (waveNumber >= 4) enemyPool.push("chocolate");

  const count = isFinaleWave ? 45 : Math.min(6 + Math.floor(waveNumber * 2.2), 44);
  const spacing = isFinaleWave ? 0.5 : Math.max(0.45, 2.2 - waveNumber * 0.05);

  for (let i = 0; i < count; i++) {
    const at = 1.5 + i * spacing + rand() * 0.4;
    const typeIndex = Math.floor(rand() * enemyPool.length);
    const type = enemyPool[typeIndex];
    const row = Math.floor(rand() * 5);
    add(at, type, row);
  }

  if (isFinaleWave) {
    // Onda 26 Grande Finale: Todos os 5 chefes entram simultaneamente nas 5 linhas!
    const bossTime = 20.0;
    add(bossTime, "candle", 0);
    add(bossTime, "gum_boss", 1);
    add(bossTime, "confeiteiro", 2); // Líder Central
    add(bossTime, "cake_robot", 3);
    add(bossTime, "lollipop_boss", 4);
  } else if (isBossWave) {
    const bossRow = Math.floor(rand() * 5);
    const at = 2.0 + count * spacing;
    const cycle = waveNumber % 25;
    if (cycle === 5) {
      add(at, "candle", bossRow);
    } else if (cycle === 10) {
      add(at, "gum_boss", bossRow);
    } else if (cycle === 15) {
      add(at, "lollipop_boss", bossRow);
    } else if (cycle === 20) {
      add(at, "cake_robot", bossRow);
    } else if (cycle === 0 || cycle === 25) {
      add(at, "confeiteiro", bossRow);
    }
  }

  return list.sort((a, b) => a.at - b.at);
}
