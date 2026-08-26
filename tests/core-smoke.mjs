import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const configSource = read("../js/config.js");
const waveRulesSource = read("../js/core/WaveRules.js");
const waveSource = read("../js/utils/waveGenerator.js");
const deckSource = read("../js/core/DeckService.js");
const statusSource = read("../js/core/StatusEffectSystem.js");
const defenderSource = read("../js/entities/DefenderSystem.js");
const enemySource = read("../js/entities/EnemySystem.js");
const projectileSource = read("../js/entities/ProjectileSystem.js");
const effectsSource = read("../js/entities/EffectsSystem.js");
const sceneSource = read("../js/scenes/MainScene.js");
const mainSource = read("../js/main.js");

const storage = new Map();
const context = vm.createContext({
  console,
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); }
  }
});

vm.runInContext(`${configSource}\n${waveRulesSource}\n;globalThis.__core = { CAMPAIGN_MAX_WAVES, DEFENDERS, ENEMIES, MODES, WaveRules, isBossWaveNumber, getThreatLevelInfo };`, context);
vm.runInContext(`${waveSource}\n;globalThis.__waves = { generateProceduralWave };`, context);

const { CAMPAIGN_MAX_WAVES, DEFENDERS, ENEMIES, WaveRules, isBossWaveNumber, getThreatLevelInfo } = context.__core;
const { generateProceduralWave } = context.__waves;

assert.equal(CAMPAIGN_MAX_WAVES, 26, "campaign must have 26 waves");
assert.equal(DEFENDERS.banana.melee, true, "banana must remain a melee defender");
assert.match(DEFENDERS.banana.ability.description, /4º golpe/i, "banana ability must document combo knockback");
assert.match(DEFENDERS.orange.ability.description, /ácido/i, "orange ability must describe the real acid effect");

assert.equal(ENEMIES.gummy_brigadeiro.ranged, true, "brigadeiro gummy must be ranged");
assert.ok(ENEMIES.gummy_brigadeiro.range >= 250, "brigadeiro gummy needs meaningful artillery range");
assert.ok(ENEMIES.gummy_brigadeiro.slowMultiplier < 1, "brigadeiro must slow defender attack speed");
assert.equal(ENEMIES.gummy_cannon, undefined, "only one canonical brigadeiro gummy id may exist");

assert.equal(isBossWaveNumber(15, "normal"), true, "wave 15 is a boss wave");
assert.equal(isBossWaveNumber(16, "normal"), false, "wave 16 must not be a boss wave");
assert.equal(isBossWaveNumber(26, "normal"), true, "wave 26 is the campaign finale");
assert.equal(getThreatLevelInfo(16, true, "normal").icon, "☠️", "legacy bad boss flag must not reclassify wave 16");
assert.equal(getThreatLevelInfo(52, false, "endless").icon, "👑", "wave 52 must be an endless finale");
assert.equal(WaveRules.seedReward(26, "normal"), 100, "campaign finale seed reward must be authoritative");
assert.equal(WaveRules.seedReward(52, "endless"), 100, "recurring endless finales must receive finale seed reward");
assert.equal(WaveRules.seedReward(50, "endless"), 25, "ordinary boss waves must keep boss reward");

const wave6 = generateProceduralWave(6, 582914, "normal");
assert.ok(wave6.some(item => item.type === "gummy_brigadeiro"), "wave 6 must introduce the brigadeiro gummy");

const finale = generateProceduralWave(26, 582914, "normal");
const finaleBosses = finale.filter(item => ["candle", "gum_boss", "lollipop_boss", "cake_robot", "confeiteiro"].includes(item.type));
assert.equal(finaleBosses.length, 5, "wave 26 must contain all five bosses");
assert.deepEqual(new Set(finaleBosses.map(item => item.row)), new Set([0, 1, 2, 3, 4]), "final bosses must occupy all five lanes");

const endlessFinale = generateProceduralWave(52, 582914, "endless");
assert.equal(endlessFinale.filter(item => ENEMIES[item.type]?.boss).length, 5, "endless wave 52 must contain all five bosses");

assert.match(deckSource, /class DeckService/, "DeckService must own deck persistence and validation");
assert.match(deckSource, /getMaxSlots\(\)/, "deck slot limit must be enforced by the deck owner");
assert.match(defenderSource, /gameState\?\.activeDeck/, "defender admission must consume the game-state deck");
assert.doesNotMatch(defenderSource, /window\.uiManager/, "DefenderSystem must not depend on UI globals");

assert.match(statusSource, /class StatusEffectSystem/, "status effects need a single owner");
assert.match(statusSource, /applyDot/, "DoT application must be centralized");
assert.match(statusSource, /getAttackSpeedMultiplier/, "attack-speed slow must be centralized");
assert.match(statusSource, /getDamageTakenMultiplier/, "guard damage reduction must be centralized");
assert.match(projectileSource, /applyDot\(hit, "acid"/, "orange projectile must apply real acid DoT");
assert.match(enemySource, /updateEnemy\(enemy\)/, "enemy status effects must tick in runtime");

assert.match(defenderSource, /removeDefender\(/, "all defender removals need a lifecycle owner");
assert.match(sceneSource, /removeDefender\(existing, "shovel"/, "shovel must use defender lifecycle ownership");
assert.match(sceneSource, /interactionMode/, "place/shovel/fertilizer must share one interaction mode");
assert.doesNotMatch(sceneSource, /window\.uiManager\.fertilizerActive/, "scene must not read fertilizer state from UI");

assert.match(defenderSource, /fertilizerBoostUntil/, "fertilizer must use a temporary override");
assert.doesNotMatch(defenderSource, /applyFertilizer[\s\S]{0,500}powerLevel\s*=\s*3/, "fertilizer must never mutate permanent power level");

assert.match(enemySource, /summonBudget:\s*type === "confeiteiro" \? 20/, "Confeiteiro summons need a total budget");
assert.match(enemySource, /maxAliveSummons = 6/, "Confeiteiro summons need an alive cap");
assert.match(enemySource, /rewardMultiplier:\s*0\.25/, "summoned minions must not retain full farming rewards");
assert.match(sceneSource, /waveSummoned/, "dynamic summons must participate in wave accounting");

assert.match(projectileSource, /minX[\s\S]{0,300}maxX/, "projectile collision must use swept segments");
assert.match(enemySource, /meltShield\(/, "shield melt accounting must live in EnemySystem");
assert.doesNotMatch(mainSource, /\.prototype\./, "bootstrap must not monkey-patch runtime prototypes");
assert.doesNotMatch(mainSource, /__projectileShieldAudit/, "bootstrap must not contain hidden damage accounting");

const gameplayRandomSources = [defenderSource, enemySource, projectileSource, effectsSource, sceneSource].join("\n");
assert.doesNotMatch(gameplayRandomSources, /Math\.random\s*\(/, "gameplay runtime randomness must be seed-owned");
assert.match(sceneSource, /URLSearchParams[\s\S]*seed/, "a seed query parameter must support deterministic replay");

console.log("GAME_CORE_SMOKE_PASS");
