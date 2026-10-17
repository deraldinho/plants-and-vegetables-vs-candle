import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const configSource = read("../js/config.js");
const waveRulesSource = read("../js/core/WaveRules.js");
const waveSource = read("../js/utils/waveGenerator.js");
const deckSource = read("../js/core/DeckService.js");
const economySource = read("../js/core/EconomyService.js");
const statusSource = read("../js/core/StatusEffectSystem.js");
const defenderSource = read("../js/entities/DefenderSystem.js");
const enemySource = read("../js/entities/EnemySystem.js");
const projectileSource = read("../js/entities/ProjectileSystem.js");
const effectsSource = read("../js/entities/EffectsSystem.js");
const sceneSource = read("../js/scenes/MainScene.js");
const mainSource = read("../js/main.js");
const uiSource = read("../js/ui/uiManager.js");

const storage = new Map();
const context = vm.createContext({
  console,
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); }
  }
});

vm.runInContext(`${configSource}\n${waveRulesSource}\n${economySource}\n;globalThis.__core = { CAMPAIGN_MAX_WAVES, STORAGE_KEYS, DEFENDERS, ENEMIES, MODES, ITEMS, SKINS, KNOCKBACK_RESISTANCE, WaveRules, isBossWaveNumber, getThreatLevelInfo, EconomyService };`, context);
vm.runInContext(`${waveSource}\n;globalThis.__waves = { generateProceduralWave, composeWave };`, context);

const { CAMPAIGN_MAX_WAVES, STORAGE_KEYS, DEFENDERS, ENEMIES, MODES, ITEMS, SKINS, WaveRules, isBossWaveNumber, getThreatLevelInfo, EconomyService } = context.__core;
const { generateProceduralWave, composeWave } = context.__waves;

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

// --- S3 Threat Budget / Wave Composition ---
assert.equal(typeof WaveRules.threatBudget, "function", "WaveRules must own the wave threat budget");
assert.equal(typeof WaveRules.availableEnemyPool, "function", "WaveRules must own wave gating");
assert.equal(typeof WaveRules.threatOf, "function", "threat cost lookup must be centralized");
assert.equal(typeof composeWave, "function", "the threat-budget composer must be exported");

for (const type of Object.keys(ENEMIES)) {
  assert.ok(Number.isFinite(ENEMIES[type].threat) && ENEMIES[type].threat > 0, `enemy ${type} needs a positive threat cost`);
}
for (const mode of Object.keys(MODES)) {
  assert.ok(Number.isFinite(MODES[mode].threatMult) && MODES[mode].threatMult > 0, `mode ${mode} needs a threat multiplier`);
}

for (const mode of ["easy", "normal", "hard", "endless"]) {
  let previous = 0;
  for (let wave = 1; wave <= 40; wave++) {
    const budget = WaveRules.threatBudget(wave, mode);
    assert.ok(budget >= previous, `budget must be non-decreasing (${mode} wave ${wave})`);
    previous = budget;
  }
}
assert.ok(WaveRules.threatBudget(10, "hard") > WaveRules.threatBudget(10, "normal"), "hard budget must exceed normal");
assert.ok(WaveRules.threatBudget(10, "normal") > WaveRules.threatBudget(10, "easy"), "normal budget must exceed easy");

assert.deepEqual(composeWave(9, 582914, "normal"), composeWave(9, 582914, "normal"), "composition must be seed-deterministic");

const MAX_SINGLE_THREAT = Math.max(...Object.values(ENEMIES).map(def => def.threat));
assert.equal(typeof WaveRules.escortBudget, "function", "escort budget policy must be owned by WaveRules");
for (let wave = 1; wave <= CAMPAIGN_MAX_WAVES; wave++) {
  const items = composeWave(wave, 582914, "normal");
  const escorts = items.filter(item => !ENEMIES[item.type].boss);
  const escortSpent = escorts.reduce((sum, item) => sum + ENEMIES[item.type].threat, 0);
  const escortBudget = WaveRules.escortBudget(wave, "normal");
  assert.ok(escortSpent <= escortBudget + 1e-6, `wave ${wave} escort must not exceed its threat budget`);
  assert.ok(escortSpent >= escortBudget - MAX_SINGLE_THREAT - 0.5, `wave ${wave} escort must spend its threat budget`);

  const pool = new Set(WaveRules.availableEnemyPool(wave));
  for (const item of items) {
    if (ENEMIES[item.type].boss) {
      assert.ok(WaveRules.isBoss(wave, "normal"), `bosses may only appear on boss waves (wave ${wave})`);
    } else {
      assert.ok(pool.has(item.type), `wave ${wave} must not include locked enemy ${item.type}`);
    }
    assert.equal(item.spawned, false, "queued enemies must start unspawned");
    assert.ok(Number.isFinite(item.at), "queued enemies need a finite spawn time");
    assert.ok(Number.isInteger(item.row) && item.row >= 0 && item.row < 5, "queued enemies need a valid lane");
  }
}

const wave5Composition = composeWave(5, 582914, "normal");
assert.ok(wave5Composition.some(item => item.type === "bubblegum_jumper"), "wave 5 must debut the rush combo");
assert.ok(wave5Composition.some(item => item.type === "marshmallow"), "wave 5 rush combo needs fast pressure");
const wave6Composition = composeWave(6, 582914, "normal");
assert.ok(wave6Composition.some(item => item.type === "gummy_brigadeiro"), "wave 6 must debut the artillery combo");
assert.ok(wave6Composition.some(item => item.type === "strawberry_shooter"), "wave 6 artillery needs a ranged partner");

assert.doesNotMatch(waveSource, /Math\.random\s*\(/, "wave composition must be seed-owned");

// --- S4.1 EconomyService ---
assert.match(economySource, /class EconomyService/, "the economy needs a single owner");
assert.equal(typeof EconomyService, "function", "EconomyService must be constructible");

const economy = new EconomyService();
assert.equal(economy.getSeeds(), 0, "a fresh wallet starts empty");
assert.equal(economy.grantSeeds(100), 100, "grantSeeds must return the new balance");
assert.equal(new EconomyService().getSeeds(), 100, "wallet must persist across instances");
assert.equal(economy.spendSeeds(-5).ok, false, "negative spends must be rejected");
assert.equal(economy.spendSeeds(0).ok, false, "zero spends must be rejected");
assert.equal(economy.spendSeeds(1000).ok, false, "overspending must be rejected");
assert.equal(economy.getSeeds(), 100, "rejected spends must not change the balance");

assert.equal(economy.unlock("inexistente").reason, "unknown", "unknown defenders must be rejected");
assert.equal(economy.unlock("corn").reason, "free", "free defenders are not purchasable");
const cantAfford = economy.unlock("cauliflower");
assert.equal(cantAfford.ok, false, "unlock must fail without enough seeds");
assert.equal(cantAfford.reason, "insufficient", "failed unlock must report insufficient seeds");
assert.equal(economy.isUnlocked("cauliflower"), false, "failed unlock must not grant the defender");
assert.equal(economy.getSeeds(), 100, "failed unlock must not debit the wallet");

economy.grantSeeds(100);
const unlockPepper = economy.unlock("pepper");
assert.equal(unlockPepper.ok, true, "unlock must succeed with enough seeds");
assert.equal(unlockPepper.cost, DEFENDERS.pepper.seedPrice, "unlock must charge the seed price");
assert.equal(economy.getSeeds(), 200 - DEFENDERS.pepper.seedPrice, "unlock must debit the wallet");
assert.equal(new EconomyService().isUnlocked("pepper"), true, "unlock must persist across instances");
assert.equal(economy.unlock("pepper").reason, "already", "double unlock must be rejected");
assert.equal(economy.isUnlocked("corn"), true, "free defenders are unlocked by default");
assert.ok(economy.getSeeds() >= 0, "balance must never go negative");

assert.doesNotMatch(uiSource, /writeStorage\(STORAGE_KEYS\.sunflowerSeeds/, "UI must not write the wallet directly");
assert.doesNotMatch(sceneSource, /writeStorage\(STORAGE_KEYS\.sunflowerSeeds/, "scene must not write the wallet directly");
assert.match(deckSource, /economy/, "deck admission must consume the economy owner");

// --- S4.2 Store + Inventory ---
storage.delete(STORAGE_KEYS.sunflowerSeeds);
storage.delete(STORAGE_KEYS.inventory);

assert.match(configSource, /const ITEMS = \{/, "the item catalog must live in config");
for (const [id, item] of Object.entries(ITEMS)) {
  assert.ok(item.name && item.icon, `${id} must expose a name and icon`);
  assert.ok(Number.isFinite(item.price) && item.price > 0, `${id} must have a positive seed price`);
  assert.ok(["sun", "repair"].includes(item.effect), `${id} must declare a known effect`);
  assert.ok(Number.isFinite(item.value) && item.value > 0, `${id} must have a positive effect value`);
}

const store = new EconomyService();
assert.deepEqual(Object.keys(store.getInventory()).sort(), Object.keys(ITEMS).sort(), "inventory must expose every catalog item");
assert.equal(store.getItem("sun_pack"), 0, "a fresh player owns no consumables");
assert.equal(store.getItemCost("sun_pack"), ITEMS.sun_pack.price, "the store must expose the item cost");
assert.equal(store.getItemCost("inexistente"), null, "unknown items must have no cost");
assert.equal(store.grantItem("inexistente", 3), 0, "unknown items must not be granted");
assert.equal(store.consumeItem("inexistente").reason, "unknown", "unknown items must not be consumed");
assert.equal(store.consumeItem("sun_pack").ok, false, "consuming without stock must fail");
assert.equal(store.consumeItem("sun_pack").reason, "insufficient", "consuming without stock must report insufficient");
assert.equal(store.consumeItem("sun_pack", 0).reason, "invalid", "consuming zero must be rejected");
assert.equal(store.grantItem("sun_pack", 2), 2, "grantItem must return the resulting count");
assert.equal(new EconomyService().getItem("sun_pack"), 2, "inventory must persist across instances");
assert.equal(store.consumeItem("sun_pack", 5).reason, "insufficient", "over-consuming must fail");
assert.equal(store.getItem("sun_pack"), 2, "failed consume must not change the inventory");
assert.equal(store.consumeItem("sun_pack").count, 1, "consumeItem must decrement and report the count");
assert.equal(store.getItem("sun_pack"), 1, "consumeItem must persist the decrement");

storage.delete(STORAGE_KEYS.inventory);
const broker = new EconomyService();
assert.equal(broker.buyItem("sun_pack").reason, "insufficient", "buying without seeds must be rejected");
assert.equal(broker.getItem("sun_pack"), 0, "failed purchase must not grant the item");
assert.equal(broker.getSeeds(), 0, "failed purchase must not spend seeds");
assert.equal(broker.buyItem("inexistente").reason, "unknown", "buying unknown items must be rejected");
assert.equal(broker.buyItem("sun_pack", 0).reason, "invalid", "buying zero items must be rejected");

broker.grantSeeds(100);
const beforeBuy = broker.getSeeds();
const bought = broker.buyItem("reinforce", 2);
assert.equal(bought.ok, true, "buying with enough seeds must succeed");
assert.equal(bought.cost, ITEMS.reinforce.price * 2, "the purchase must charge price * amount");
assert.equal(broker.getSeeds(), beforeBuy - bought.cost, "the purchase must debit exactly the cost");
assert.equal(broker.getItem("reinforce"), 2, "the purchase must add the items to the inventory");
assert.equal(new EconomyService().getItem("reinforce"), 2, "purchases must persist across instances");
assert.ok(broker.getSeeds() >= 0, "the wallet must never go negative");

assert.doesNotMatch(uiSource, /writeStorage\(STORAGE_KEYS\.inventory/, "UI must not write the inventory directly");
assert.doesNotMatch(sceneSource, /writeStorage\(STORAGE_KEYS\.inventory/, "scene must not write the inventory directly");
assert.match(sceneSource, /useConsumable\s*\(/, "MainScene must own the consumable effect");
assert.match(sceneSource, /consumeItem\s*\(/, "MainScene must consume through the economy owner");
assert.match(uiSource, /purchaseItem\s*\(/, "UIManager must purchase through the economy owner");
assert.match(uiSource, /renderConsumableTray|syncConsumableTray/, "UIManager must render the consumable tray");
assert.match(uiSource, /ITEMS/, "the store must be driven by the ITEMS catalog");
assert.doesNotMatch(uiSource, /Math\.random\s*\(/, "the store must be deterministic");
assert.doesNotMatch(sceneSource, /Math\.random\s*\(/, "consumables must be deterministic");

// --- S4.3 Cosmetics (defender skins) ---
assert.match(configSource, /const SKINS = \{/, "the skin catalog must live in config");
for (const [id, skin] of Object.entries(SKINS)) {
  assert.ok(skin.name && skin.icon, `${id} must expose a name and icon`);
  assert.ok(Number.isFinite(skin.price) && skin.price >= 0, `${id} must have a non-negative price`);
  assert.ok(skin.tint === null || Number.isFinite(skin.tint), `${id} must declare a numeric tint or null`);
}
assert.equal(SKINS.classic.price, 0, "the classic skin must be free");
assert.equal(SKINS.classic.tint, null, "the classic skin must not tint defenders");

storage.delete(STORAGE_KEYS.cosmetics);
storage.delete(STORAGE_KEYS.sunflowerSeeds);

const wardrobe = new EconomyService();
assert.equal(wardrobe.getEquippedSkin(), "classic", "the classic skin must be equipped by default");
assert.equal(wardrobe.getEquippedSkinTint(), null, "the default skin must leave defenders untouched");
assert.equal(wardrobe.isSkinOwned("classic"), true, "the classic skin must be owned by default");
assert.equal(wardrobe.isSkinOwned("golden"), false, "paid skins must start locked");
assert.ok(wardrobe.getOwnedSkins().includes("classic"), "owned skins must include the classic skin");

assert.equal(wardrobe.unlockSkin("inexistente").reason, "unknown", "unknown skins must be rejected");
assert.equal(wardrobe.unlockSkin("classic").reason, "free", "free skins are not purchasable");
assert.equal(wardrobe.unlockSkin("golden").reason, "insufficient", "skins must not unlock without seeds");
assert.equal(wardrobe.isSkinOwned("golden"), false, "failed unlock must not grant the skin");
assert.equal(wardrobe.getSeeds(), 0, "failed unlock must not spend seeds");
assert.equal(wardrobe.equipSkin("golden").reason, "locked", "unowned skins must not be equippable");
assert.equal(wardrobe.getEquippedSkin(), "classic", "failed equip must not change the equipped skin");
assert.equal(wardrobe.equipSkin("inexistente").reason, "unknown", "equipping unknown skins must be rejected");

wardrobe.grantSeeds(200);
const beforeSkin = wardrobe.getSeeds();
const unlockGolden = wardrobe.unlockSkin("golden");
assert.equal(unlockGolden.ok, true, "unlocking a skin with enough seeds must succeed");
assert.equal(unlockGolden.cost, SKINS.golden.price, "the skin purchase must charge the price");
assert.equal(wardrobe.getSeeds(), beforeSkin - SKINS.golden.price, "the skin purchase must debit the wallet");
assert.equal(wardrobe.unlockSkin("golden").reason, "already", "double unlock must be rejected");
assert.equal(new EconomyService().isSkinOwned("golden"), true, "skin ownership must persist");

const equipGolden = wardrobe.equipSkin("golden");
assert.equal(equipGolden.ok, true, "equipping an owned skin must succeed");
assert.equal(wardrobe.getEquippedSkin(), "golden", "the equipped skin must change");
assert.equal(wardrobe.getEquippedSkinTint(), SKINS.golden.tint, "the equipped tint must be exposed");
assert.equal(new EconomyService().getEquippedSkin(), "golden", "the equipped skin must persist");
assert.ok(wardrobe.getSeeds() >= 0, "the wallet must never go negative");

assert.match(configSource, /function readCosmetics\(/, "cosmetics persistence must live in config");
assert.match(defenderSource, /applyDefenderTint\s*\(/, "the defender system must own the tint application");
assert.match(defenderSource, /getSkinTint/, "the defender system must read the skin tint from the scene");
assert.match(sceneSource, /getSkinTint\s*\(/, "the scene must expose the skin tint");
assert.match(sceneSource, /refreshDefenderSkins\s*\(/, "the scene must refresh placed defenders on equip");
assert.match(uiSource, /purchaseSkin\s*\(|equipSkin\s*\(/, "the UI must buy/equip skins through the owner");
assert.match(uiSource, /SKINS/, "the cosmetics UI must be driven by the SKINS catalog");
assert.doesNotMatch(uiSource, /writeStorage\(STORAGE_KEYS\.cosmetics/, "UI must not write cosmetics directly");
assert.doesNotMatch(sceneSource, /writeStorage\(STORAGE_KEYS\.cosmetics/, "scene must not write cosmetics directly");

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

// --- Novos Candies Level 2 ---
const { ENEMIES: level2Enemies, KNOCKBACK_RESISTANCE: kbr } = context.__core;
assert.ok(level2Enemies.jelly_bomb, "jelly_bomb deve existir no catálogo de inimigos");
assert.ok(level2Enemies.macaron_parry, "macaron_parry deve existir no catálogo de inimigos");
assert.ok(level2Enemies.toffee_tank, "toffee_tank deve existir no catálogo de inimigos");

for (const [id, enemy] of Object.entries(level2Enemies)) {
  if (enemy.description && enemy.description.includes("Level 2")) {
    assert.ok(Number.isFinite(enemy.hp) && enemy.hp > 0, `${id} deve ter hp válido`);
    assert.ok(Number.isFinite(enemy.speed) && enemy.speed > 0, `${id} deve ter speed válido`);
    assert.ok(Number.isFinite(enemy.threat) && enemy.threat > 0, `${id} deve ter threat válido`);
    assert.ok(enemy.icon, `${id} deve ter ícone`);
    assert.ok(enemy.name, `${id} deve ter nome`);
  }
}

const pool7 = WaveRules.availableEnemyPool(7);
const pool8 = WaveRules.availableEnemyPool(8);
const pool9 = WaveRules.availableEnemyPool(9);
assert.ok(pool7.includes("jelly_bomb"), "jelly_bomb deve entrar no pool a partir da onda 7");
assert.ok(pool8.includes("macaron_parry"), "macaron_parry deve entrar no pool a partir da onda 8");
assert.ok(pool9.includes("toffee_tank"), "toffee_tank deve entrar no pool a partir da onda 9");
assert.ok(!pool7.includes("macaron_parry"), "macaron_parry não deve estar no pool da onda 7");
assert.ok(!pool8.includes("toffee_tank"), "toffee_tank não deve estar no pool da onda 8");

assert.ok(kbr.jelly_bomb !== undefined, "jelly_bomb deve ter knockback resistance");
assert.ok(kbr.macaron_parry !== undefined, "macaron_parry deve ter knockback resistance");
assert.ok(kbr.toffee_tank !== undefined, "toffee_tank deve ter knockback resistance");

assert.ok(WaveRules.threatOf("jelly_bomb") > 0, "threatOf jelly_bomb deve ser positivo");
assert.ok(WaveRules.threatOf("macaron_parry") > 0, "threatOf macaron_parry deve ser positivo");
assert.ok(WaveRules.threatOf("toffee_tank") > 0, "threatOf toffee_tank deve ser positivo");

console.log("GAME_CORE_SMOKE_PASS");
