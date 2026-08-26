import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.GAME_URL || "http://127.0.0.1:8080";
const seededUrl = new URL(baseUrl);
seededUrl.searchParams.set("seed", "582914");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];

page.on("pageerror", error => pageErrors.push(error.message));
page.on("console", message => {
  if (message.type() === "error") pageErrors.push(`console: ${message.text()}`);
});

async function boot(targetPage) {
  await targetPage.goto(seededUrl.toString(), { waitUntil: "domcontentloaded" });
  await targetPage.waitForFunction(() => Boolean(window.uiManager && window.deckService), null, { timeout: 10_000 });
  await targetPage.locator("#overlayButton").click();
  await targetPage.waitForFunction(
    () => window.uiManager?.activeScene?.gameState?.phase === "playing",
    null,
    { timeout: 10_000 }
  );
}

try {
  await boot(page);

  const initial = await page.evaluate(() => ({
    seed: window.uiManager.activeScene.gameState.seed,
    deck: [...window.deckService.getActiveDeck()],
    stateDeck: [...window.uiManager.activeScene.gameState.activeDeck],
    phase: window.uiManager.activeScene.gameState.phase,
    canvasCount: document.querySelectorAll("#gameContainer canvas").length,
    persistedDeck: JSON.parse(localStorage.getItem(STORAGE_KEYS.activeDeck) || "[]"),
    rngFingerprint: [
      window.uiManager.activeScene.random(0, 1),
      window.uiManager.activeScene.random(0, 1),
      window.uiManager.activeScene.random(0, 1)
    ]
  }));

  assert.equal(initial.seed, 582914, "seed query parameter must own the replay seed");
  assert.equal(initial.phase, "playing");
  assert.equal(initial.canvasCount, 1, "Phaser must boot a single canvas");
  assert.deepEqual(initial.stateDeck, initial.deck, "game state must consume the authoritative DeckService snapshot");
  assert.deepEqual(initial.persistedDeck, initial.deck, "selected deck must persist canonically");

  const replayPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await boot(replayPage);
  const replayFingerprint = await replayPage.evaluate(() => [
    window.uiManager.activeScene.random(0, 1),
    window.uiManager.activeScene.random(0, 1),
    window.uiManager.activeScene.random(0, 1)
  ]);
  assert.deepEqual(replayFingerprint, initial.rngFingerprint, "same seed must reproduce gameplay RNG sequence");
  await replayPage.close();

  const deckBeforeHabit = initial.deck.length;
  await page.locator('[data-habit="vegetables"]').click();
  const vegetableHabit = await page.evaluate(() => ({
    deckLength: window.deckService.getActiveDeck().length,
    boostUntil: window.uiManager.activeScene.gameState.vegetableBoostUntil,
    now: window.uiManager.activeScene.gameState.time
  }));
  assert.equal(vegetableHabit.deckLength, deckBeforeHabit, "vegetable habit must never bypass deck slot limits");
  assert.ok(vegetableHabit.boostUntil > vegetableHabit.now, "vegetable habit must grant its temporary combat buff");

  await page.locator("#fertilizerButton").click();
  assert.equal(await page.evaluate(() => window.uiManager.activeScene.gameState.interactionMode), "fertilizer");
  await page.locator("#shovelButton").click();
  const exclusiveInteraction = await page.evaluate(() => ({
    mode: window.uiManager.activeScene.gameState.interactionMode,
    fertilizerSelected: document.getElementById("fertilizerButton").classList.contains("selected"),
    shovelSelected: document.getElementById("shovelButton").classList.contains("selected")
  }));
  assert.equal(exclusiveInteraction.mode, "shovel", "shovel must replace fertilizer mode atomically");
  assert.equal(exclusiveInteraction.fertilizerSelected, false, "fertilizer visual state must clear when shovel takes ownership");
  assert.equal(exclusiveInteraction.shovelSelected, true, "shovel visual state must match interaction owner");

  await page.locator('.defender-tray .defender-card[data-defender="potato"]').click();
  await page.waitForFunction(() => window.uiManager.activeScene.gameState.selected === "potato", null, { timeout: 5_000 });

  const canvas = page.locator("#gameContainer canvas");
  const box = await canvas.boundingBox();
  assert.ok(box, "game canvas must be visible");
  const logicalX = 185 + 92 / 2;
  const logicalY = 118 + 92 / 2;
  await page.mouse.click(box.x + logicalX / 1000 * box.width, box.y + logicalY / 620 * box.height);
  await page.waitForFunction(() => window.uiManager.activeScene.gameState.defenders.length === 1, null, { timeout: 5_000 });

  const fertilizer = await page.evaluate(() => {
    const scene = window.uiManager.activeScene;
    const defender = scene.gameState.defenders[0];
    scene.gameState.sun += 500;
    const permanentBefore = defender.powerLevel;
    const baseDamage = scene.defenderSystem.getEffectiveDamage(defender);
    const applied = scene.defenderSystem.applyFertilizer(defender);
    const boostedDamage = scene.defenderSystem.getEffectiveDamage(defender);
    const boostUntil = defender.fertilizerBoostUntil;
    const permanentDuring = defender.powerLevel;
    scene.gameState.time = boostUntil + 0.01;
    const expiredDamage = scene.defenderSystem.getEffectiveDamage(defender);
    return { applied, permanentBefore, permanentDuring, permanentAfter: defender.powerLevel, baseDamage, boostedDamage, expiredDamage };
  });

  assert.equal(fertilizer.applied, true, "fertilizer must apply when energy is available");
  assert.equal(fertilizer.permanentBefore, fertilizer.permanentDuring, "fertilizer must not mutate permanent attack level");
  assert.equal(fertilizer.permanentAfter, fertilizer.permanentBefore, "fertilizer expiration must preserve permanent level");
  assert.ok(fertilizer.boostedDamage > fertilizer.baseDamage, "fertilizer must actually provide max-level damage temporarily");
  assert.equal(fertilizer.expiredDamage, fertilizer.baseDamage, "fertilizer damage override must expire after 8 seconds");

  await page.locator("#startWaveButton").click();
  await page.waitForFunction(() => window.uiManager.activeScene.gameState.waveActive === true, null, { timeout: 5_000 });
  await page.locator("#pauseButton").click();
  await page.waitForFunction(() => window.uiManager.activeScene.gameState.paused === true, null, { timeout: 5_000 });
  await page.locator("#overlayButton").click();
  await page.waitForFunction(() => window.uiManager.activeScene.gameState.paused === false, null, { timeout: 5_000 });

  const threatChecks = await page.evaluate(() => {
    const state = window.uiManager.activeScene.gameState;
    state.waveActive = false;
    state.mode = "endless";
    state.wave = 52;
    window.uiManager.syncUi(state);
    return {
      wave52: document.getElementById("waveValue")?.textContent || "",
      wave16Icon: getThreatLevelInfo(16, true, "normal").icon,
      wave52Icon: getThreatLevelInfo(52, false, "endless").icon,
      wave52Reward: WaveRules.seedReward(52, "endless")
    };
  });
  assert.match(threatChecks.wave52, /BAPHO SUPREMO/, "endless wave 52 must render as a finale");
  assert.equal(threatChecks.wave16Icon, "☠️", "legacy wave-16 boss flag must be ignored");
  assert.equal(threatChecks.wave52Icon, "👑", "wave 52 must be classified as finale");
  assert.equal(threatChecks.wave52Reward, 100, "endless wave 52 must receive finale progression reward");

  const artillery = await page.evaluate(() => {
    const scene = window.uiManager.activeScene;
    const defender = scene.gameState.defenders[0];
    scene.gameState.enemyProjectiles = [];
    const enemy = {
      ...ENEMIES.gummy_brigadeiro,
      type: "gummy_brigadeiro",
      row: defender.row,
      x: defender.x + 12,
      y: defender.y,
      hp: ENEMIES.gummy_brigadeiro.hp,
      maxHp: ENEMIES.gummy_brigadeiro.hp,
      removed: false
    };

    const hpBefore = defender.hp;
    scene.enemySystem.fireRangedProjectile(enemy, defender);
    scene.projectileSystem.updateEnemyProjectiles(0.5);
    return {
      hpBefore,
      hpAfter: defender.hp,
      slowMultiplier: scene.statusEffectSystem.getAttackSpeedMultiplier(defender),
      remainingProjectiles: scene.gameState.enemyProjectiles.length
    };
  });
  assert.ok(artillery.hpAfter < artillery.hpBefore, "close artillery projectile must hit instead of tunnelling");
  assert.ok(artillery.slowMultiplier < 1, "brigadeiro hit must apply attack-speed slow through StatusEffectSystem");
  assert.equal(artillery.remainingProjectiles, 0, "resolved artillery projectile must be reclaimed");

  const acidAccounting = await page.evaluate(() => {
    const scene = window.uiManager.activeScene;
    scene.gameState.enemies = [];
    scene.gameState.projectiles = [];
    const enemy = {
      type: "chocolate",
      row: 1,
      x: 400,
      y: scene.GRID_Y + scene.CELL_H * 1.5,
      hp: 300,
      maxHp: 300,
      shield: 150,
      reward: 0,
      boss: false,
      removed: false,
      statusEffects: new Map(),
      sprite: null,
      shadowSprite: null
    };
    scene.gameState.enemies.push(enemy);

    const damageBefore = scene.gameState.stats.damageDealt;
    const orangeBefore = scene.gameState.damageByType.orange || 0;
    scene.gameState.projectiles.push({
      x: 380, y: enemy.y, row: 1,
      speed: 280, damage: 18, color: "#ffa500", icon: "💧",
      area: false, burn: false, acid: true, piercing: false,
      hitsLeft: 1, sourceType: "orange", removed: false, textObj: null
    });

    scene.projectileSystem.updateProjectiles(0.05);
    const afterImpact = {
      shield: enemy.shield,
      totalDelta: scene.gameState.stats.damageDealt - damageBefore,
      orangeDelta: (scene.gameState.damageByType.orange || 0) - orangeBefore,
      acidActive: !!scene.statusEffectSystem.get(enemy, "acid")
    };

    scene.gameState.time += 0.5;
    scene.statusEffectSystem.updateEnemy(enemy);
    return {
      afterImpact,
      shieldAfterTick: enemy.shield,
      totalAfterTick: scene.gameState.stats.damageDealt - damageBefore,
      orangeAfterTick: (scene.gameState.damageByType.orange || 0) - orangeBefore
    };
  });
  assert.equal(acidAccounting.afterImpact.shield, 97, "orange hit must melt 35 shield plus normal 18 damage");
  assert.equal(acidAccounting.afterImpact.totalDelta, 53, "all melted shield must count in total damage");
  assert.equal(acidAccounting.afterImpact.orangeDelta, 53, "all melted shield must be attributed to Orange");
  assert.equal(acidAccounting.afterImpact.acidActive, true, "orange impact must install an acid DoT");
  assert.equal(acidAccounting.shieldAfterTick, 92, "acid DoT must tick after impact");
  assert.equal(acidAccounting.totalAfterTick, 58, "acid tick must be included in damage accounting");
  assert.equal(acidAccounting.orangeAfterTick, 58, "acid tick must remain attributed to Orange");

  const shovelLifecycle = await page.evaluate(() => {
    const scene = window.uiManager.activeScene;
    const defender = scene.gameState.defenders[0];
    const shadow = defender.shadowSprite;
    scene.gameState.interactionMode = "shovel";
    scene.gameState.shovel = true;
    scene.handlePointerDown(defender.x, defender.y);
    return {
      defendersRemaining: scene.gameState.defenders.length,
      removed: defender.removed,
      shadowActive: shadow?.active ?? false,
      reason: defender.deathReason
    };
  });
  assert.equal(shovelLifecycle.defendersRemaining, 0, "shovel removal must reclaim defender collection state");
  assert.equal(shovelLifecycle.removed, true, "shovel must use the defender lifecycle owner");
  assert.equal(shovelLifecycle.shadowActive, false, "shovel must destroy the defender shadow");
  assert.equal(shovelLifecycle.reason, "shovel");

  const summonBounds = await page.evaluate(() => {
    const scene = window.uiManager.activeScene;
    scene.gameState.enemies = [];
    scene.gameState.enemyProjectiles = [];
    scene.gameState.waveSummoned = 0;
    const boss = scene.enemySystem.spawnEnemy("confeiteiro", 2);
    let maxAlive = 0;
    let firstRewardMultiplier = null;

    for (let i = 0; i < 4; i++) {
      boss.bossSkillTimer = 4.2;
      scene.enemySystem.updateEnemies(0);
      maxAlive = Math.max(maxAlive, boss.activeSummons || 0);
      const firstSummon = scene.gameState.enemies.find(e => e.summoned && !e.removed);
      if (firstSummon && firstRewardMultiplier === null) firstRewardMultiplier = firstSummon.rewardMultiplier;
    }

    for (const enemy of scene.gameState.enemies) {
      if (!enemy.summoned || enemy.removed) continue;
      scene.enemySystem.releaseSummonSlot(enemy);
      enemy.removed = true;
      enemy.sprite?.destroy();
      enemy.shadowSprite?.destroy();
    }
    scene.gameState.enemies = scene.gameState.enemies.filter(e => !e.summoned);

    let safety = 30;
    while ((boss.summonBudget || 0) > 0 && safety-- > 0) {
      boss.bossSkillTimer = 4.2;
      scene.enemySystem.updateEnemies(0);
      maxAlive = Math.max(maxAlive, boss.activeSummons || 0);
      for (const enemy of scene.gameState.enemies) {
        if (!enemy.summoned || enemy.removed) continue;
        scene.enemySystem.releaseSummonSlot(enemy);
        enemy.removed = true;
        enemy.sprite?.destroy();
        enemy.shadowSprite?.destroy();
      }
      scene.gameState.enemies = scene.gameState.enemies.filter(e => !e.summoned);
    }

    return {
      maxAlive,
      remainingBudget: boss.summonBudget,
      totalSummoned: scene.gameState.waveSummoned,
      firstRewardMultiplier
    };
  });
  assert.ok(summonBounds.maxAlive <= 6, "Confeiteiro must never exceed six live summons");
  assert.equal(summonBounds.remainingBudget, 0, "Confeiteiro summon budget must be exhaustible and bounded");
  assert.equal(summonBounds.totalSummoned, 20, "Confeiteiro must never create more than twenty minions");
  assert.equal(summonBounds.firstRewardMultiplier, 0.25, "summoned minions must use reduced farming reward");

  const progressAccounting = await page.evaluate(() => {
    const state = window.uiManager.activeScene.gameState;
    state.waveActive = true;
    const total = state.spawnQueue.length + (state.waveSummoned || 0);
    state.waveResolved = total + 99;
    window.uiManager.updateWavePreviewAndProgress(state);
    return {
      total,
      text: document.getElementById("waveProgressText").textContent,
      width: document.getElementById("waveProgressFill").style.width
    };
  });
  assert.equal(progressAccounting.text, `${progressAccounting.total} de ${progressAccounting.total} doces neutralizados`, "wave counter must never render above its dynamic total");
  assert.equal(progressAccounting.width, "100%", "wave progress bar must remain bounded");

  const globalStyles = await page.evaluate(() => ({
    deckBorderStyle: getComputedStyle(document.querySelector(".deck-selector")).borderStyle,
    boardAspectRatio: getComputedStyle(document.getElementById("gameContainer")).aspectRatio
  }));
  assert.equal(globalStyles.deckBorderStyle, "dashed", "deck builder styles must apply on desktop, not only mobile");
  assert.notEqual(globalStyles.boardAspectRatio, "auto", "board geometry must be reserved before/around canvas lifecycle");

  assert.deepEqual(pageErrors, [], `browser emitted errors: ${pageErrors.join(" | ")}`);
  console.log("GAMEPLAY_BROWSER_SMOKE_PASS");
} finally {
  await browser.close();
}
