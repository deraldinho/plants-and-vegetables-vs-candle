import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const configSource = fs.readFileSync(new URL("../js/config.js", import.meta.url), "utf8");
const waveSource = fs.readFileSync(new URL("../js/utils/waveGenerator.js", import.meta.url), "utf8");
const defenderSource = fs.readFileSync(new URL("../js/entities/DefenderSystem.js", import.meta.url), "utf8");
const enemySource = fs.readFileSync(new URL("../js/entities/EnemySystem.js", import.meta.url), "utf8");
const projectileSource = fs.readFileSync(new URL("../js/entities/ProjectileSystem.js", import.meta.url), "utf8");

const storage = new Map();
const context = vm.createContext({
  console,
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); }
  }
});

vm.runInContext(`${configSource}\n;globalThis.__core = { CAMPAIGN_MAX_WAVES, DEFENDERS, ENEMIES, MODES, isBossWaveNumber, getThreatLevelInfo };`, context);
vm.runInContext(`${waveSource}\n;globalThis.__waves = { generateProceduralWave };`, context);

const { CAMPAIGN_MAX_WAVES, DEFENDERS, ENEMIES, isBossWaveNumber, getThreatLevelInfo } = context.__core;
const { generateProceduralWave } = context.__waves;

assert.equal(CAMPAIGN_MAX_WAVES, 26, "campaign must have 26 waves");
assert.equal(DEFENDERS.banana.melee, true, "banana must remain a melee defender");
assert.match(DEFENDERS.banana.ability.description, /4º golpe/i, "banana ability must document the combo knockback");

assert.equal(ENEMIES.gummy_brigadeiro.ranged, true, "brigadeiro gummy must be ranged");
assert.ok(ENEMIES.gummy_brigadeiro.range >= 250, "brigadeiro gummy needs meaningful artillery range");
assert.ok(ENEMIES.gummy_brigadeiro.slowMultiplier < 1, "brigadeiro must slow defender attack speed");

assert.equal(isBossWaveNumber(15, "normal"), true, "wave 15 is a boss wave");
assert.equal(isBossWaveNumber(16, "normal"), false, "wave 16 must not be a boss wave");
assert.equal(isBossWaveNumber(26, "normal"), true, "wave 26 is the campaign finale");
assert.equal(getThreatLevelInfo(16, true, "normal").icon, "🔥", "legacy bad boss flag must not reclassify wave 16");

const wave6 = generateProceduralWave(6, 582914, "normal");
assert.ok(wave6.some(item => item.type === "gummy_brigadeiro"), "wave 6 must introduce the brigadeiro gummy");

const finale = generateProceduralWave(26, 582914, "normal");
const finaleBosses = finale.filter(item => ["candle", "gum_boss", "lollipop_boss", "cake_robot", "confeiteiro"].includes(item.type));
assert.equal(finaleBosses.length, 5, "wave 26 must contain all five bosses");
assert.deepEqual(new Set(finaleBosses.map(item => item.row)), new Set([0, 1, 2, 3, 4]), "final bosses must occupy all five lanes");

assert.match(defenderSource, /defeatDefender\(/, "defender lifecycle owner is required");
assert.match(defenderSource, /deathEffectResolved/, "on-death effects must be idempotent");
assert.match(defenderSource, /punchCombo/, "banana combo state must exist");
assert.match(defenderSource, /isTypeAllowed/, "deck must be enforced by gameplay placement");
assert.match(enemySource, /fireRangedProjectile/, "ranged enemy behavior must exist");
assert.match(enemySource, /gummy_brigadeiro/, "brigadeiro gummy behavior must be wired");
assert.match(projectileSource, /brigadeiro-projectile/, "brigadeiro projectile effect must be wired");
assert.match(projectileSource, /damageDefender/, "enemy projectiles must use defender lifecycle ownership");

console.log("GAME_CORE_SMOKE_PASS");
