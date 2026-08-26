import assert from "node:assert/strict";
import { chromium } from "playwright";

const url = process.env.GAME_URL || "http://127.0.0.1:8080";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];

page.on("pageerror", error => pageErrors.push(error.message));
page.on("console", message => {
  if (message.type() === "error") pageErrors.push(`console: ${message.text()}`);
});

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.uiManager), null, { timeout: 10_000 });

  await page.locator("#overlayButton").click();
  await page.waitForFunction(
    () => window.uiManager?.activeScene?.gameState?.phase === "playing",
    null,
    { timeout: 10_000 }
  );

  const initial = await page.evaluate(() => ({
    deck: [...window.uiManager.activeDeck],
    stateDeck: [...window.uiManager.activeScene.gameState.activeDeck],
    phase: window.uiManager.activeScene.gameState.phase,
    canvasCount: document.querySelectorAll("#gameContainer canvas").length
  }));

  assert.equal(initial.phase, "playing");
  assert.equal(initial.canvasCount, 1, "Phaser must boot a single canvas");
  assert.deepEqual(initial.stateDeck, initial.deck, "gameState deck must be authoritative and synchronized");

  await page.locator('.defender-tray .defender-card[data-defender="potato"]').click();
  await page.waitForFunction(
    () => window.uiManager.activeScene.gameState.selected === "potato",
    null,
    { timeout: 5_000 }
  );

  const canvas = page.locator("#gameContainer canvas");
  const box = await canvas.boundingBox();
  assert.ok(box, "game canvas must be visible");

  const logicalX = 185 + 92 / 2;
  const logicalY = 118 + 92 / 2;
  await page.mouse.click(
    box.x + logicalX / 1000 * box.width,
    box.y + logicalY / 620 * box.height
  );

  await page.waitForFunction(
    () => window.uiManager.activeScene.gameState.defenders.length === 1,
    null,
    { timeout: 5_000 }
  );

  await page.locator("#startWaveButton").click();
  await page.waitForFunction(
    () => window.uiManager.activeScene.gameState.waveActive === true,
    null,
    { timeout: 5_000 }
  );

  await page.locator("#pauseButton").click();
  await page.waitForFunction(
    () => window.uiManager.activeScene.gameState.paused === true,
    null,
    { timeout: 5_000 }
  );

  await page.locator("#overlayButton").click();
  await page.waitForFunction(
    () => window.uiManager.activeScene.gameState.paused === false,
    null,
    { timeout: 5_000 }
  );

  const threatChecks = await page.evaluate(() => {
    const state = window.uiManager.activeScene.gameState;
    state.waveActive = false;
    state.mode = "endless";
    state.wave = 52;
    window.uiManager.syncUi(state);
    return {
      wave52: document.getElementById("waveValue")?.textContent || "",
      wave16Icon: getThreatLevelInfo(16, true, "normal").icon,
      wave52Icon: getThreatLevelInfo(52, false, "endless").icon
    };
  });

  assert.match(threatChecks.wave52, /BAPHO SUPREMO/, "endless wave 52 must render as a finale");
  assert.equal(threatChecks.wave16Icon, "☠️", "legacy wave-16 boss flag must be ignored");
  assert.equal(threatChecks.wave52Icon, "👑", "wave 52 must be classified as finale");

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
      slowUntil: defender.slowUntil,
      now: scene.gameState.time,
      remainingProjectiles: scene.gameState.enemyProjectiles.length
    };
  });

  assert.ok(artillery.hpAfter < artillery.hpBefore, "close artillery projectile must hit instead of tunnelling");
  assert.ok(artillery.slowUntil > artillery.now, "brigadeiro hit must apply attack-speed slow");
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
      sprite: null,
      shadowSprite: null
    };
    scene.gameState.enemies.push(enemy);

    const damageBefore = scene.gameState.stats.damageDealt;
    const orangeBefore = scene.gameState.damageByType.orange || 0;
    scene.gameState.projectiles.push({
      x: 380,
      y: enemy.y,
      row: 1,
      speed: 280,
      damage: 18,
      color: "#ffa500",
      icon: "💧",
      area: false,
      burn: false,
      acid: true,
      piercing: false,
      hitsLeft: 1,
      sourceType: "orange",
      removed: false,
      textObj: null
    });

    scene.projectileSystem.updateProjectiles(0.05);

    return {
      shield: enemy.shield,
      totalDelta: scene.gameState.stats.damageDealt - damageBefore,
      orangeDelta: (scene.gameState.damageByType.orange || 0) - orangeBefore
    };
  });

  assert.equal(acidAccounting.shield, 97, "orange hit must melt 35 shield plus normal 18 damage");
  assert.equal(acidAccounting.totalDelta, 53, "all melted shield must count in total damage");
  assert.equal(acidAccounting.orangeDelta, 53, "all melted shield must be attributed to Orange");

  assert.deepEqual(pageErrors, [], `browser emitted errors: ${pageErrors.join(" | ")}`);
  console.log("GAMEPLAY_BROWSER_SMOKE_PASS");
} finally {
  await browser.close();
}
