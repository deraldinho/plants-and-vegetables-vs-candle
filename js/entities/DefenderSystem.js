"use strict";

class DefenderSystem {
  constructor(scene) {
    this.scene = scene;
  }

  placeDefender(col, row, type) {
    const config = DEFENDERS[type];
    if (this.scene.gameState.sun < config.cost) return;

    this.scene.gameState.sun -= config.cost;
    const x = this.scene.GRID_X + col * this.scene.CELL_W + this.scene.CELL_W / 2;
    const y = this.scene.GRID_Y + row * this.scene.CELL_H + this.scene.CELL_H / 2;

    const defender = {
      ...config, type, row, col, x, y,
      maxHp: config.hp, cooldownLeft: 0.2, hitFlash: 0, slowUntil: 0, guardUntil: 0, abilityReadyAt: 0, sway: Math.random() * 5,
      powerLevel: 0, healthLevel: 0, armor: 0, invested: config.cost
    };

    defender.shadowSprite = this.scene.add.sprite(x, y + 22, "tex_shadow").setOrigin(0.5);
    const textureKey = (type === "potato" && defender.armed) ? "tex_potato_armed" : "tex_" + type;
    defender.sprite = this.scene.add.sprite(x, y - 4, textureKey).setOrigin(0.5);
    defender.textObj = defender.sprite; // Backwards compatibility for cleanup
    this.scene.gameState.defenders.push(defender);
    this.scene.gameState.stats.defendersPlaced += 1;

    this.scene.effectsSystem.burst(x, y, "#d8ff91", 14);
    this.scene.soundManager.beep(330, 0.07, "sine", 0.04);
  }

  upgradeDefenderPower(defender) {
    if (!defender || defender.powerLevel >= 3) return false;
    const cost = Math.round(defender.cost * (0.6 + defender.powerLevel * 0.4));
    if (this.scene.gameState.sun < cost) return false;
    this.scene.gameState.sun -= cost;
    defender.invested += cost;
    defender.powerLevel += 1;
    defender.damage = Math.round(DEFENDERS[defender.type].damage * (1 + defender.powerLevel * 0.35));
    this.scene.gameState.stats.upgradesBought += 1;
    this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, `ATK Nív ${defender.powerLevel}! ⚔️`, "#ffd43b", 1.2);
    this.scene.effectsSystem.burst(defender.x, defender.y, "#ffd43b", 15);
    this.scene.soundManager.beep(520, 0.1, "sine", 0.05);
    return true;
  }

  upgradeDefenderHealth(defender) {
    if (!defender || defender.healthLevel >= 3) return false;
    const cost = Math.round(defender.cost * (0.5 + defender.healthLevel * 0.35));
    if (this.scene.gameState.sun < cost) return false;
    this.scene.gameState.sun -= cost;
    defender.invested += cost;
    defender.healthLevel += 1;
    const bonusHp = Math.round(DEFENDERS[defender.type].hp * 0.4);
    defender.maxHp += bonusHp;
    defender.hp += bonusHp;
    this.scene.gameState.stats.upgradesBought += 1;
    this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, `HP Nív ${defender.healthLevel}! 💚`, "#69c743", 1.2);
    this.scene.effectsSystem.burst(defender.x, defender.y, "#69c743", 15);
    this.scene.soundManager.beep(440, 0.1, "sine", 0.05);
    return true;
  }

  useAbility(defender) {
    if (!defender || defender.abilityReadyAt > this.scene.gameState.time) return false;
    defender.abilityReadyAt = this.scene.gameState.time + (defender.ability.cooldown || 15);
    this.scene.gameState.stats.abilitiesUsed += 1;
    this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 40, `${defender.ability.name}!`, defender.color, 1.3);
    this.scene.soundManager.beep(600, 0.2, "sine", 0.06);

    switch (defender.type) {
      case "potato": {
        defender.armed = true;
        defender.armTimer = 0;
        if (defender.sprite) defender.sprite.setTexture("tex_potato_armed");
        this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, "MINA ARMADA! 💣", "#d2b48c", 1.25);
        this.scene.effectsSystem.burst(defender.x, defender.y, "#d2b48c", 20);
        break;
      }
      case "garlic": {
        const nearbyEnemies = this.scene.gameState.enemies.filter(e => Math.abs(e.x - defender.x) < 140 && e.hp > 0 && !e.removed);
        for (const e of nearbyEnemies) {
          const newRow = e.row === 0 ? 1 : (e.row === 4 ? 3 : (Math.random() < 0.5 ? e.row - 1 : e.row + 1));
          e.row = newRow;
          e.y = this.scene.GRID_Y + newRow * this.scene.CELL_H + this.scene.CELL_H / 2;
          if (e.textObj) e.textObj.setY(e.y);
          this.scene.effectsSystem.burst(e.x, e.y, "#f5f5dc", 12);
          this.scene.effectsSystem.spawnFloater(e.x, e.y - 30, "🤢 REPELIDO!", "#f5f5dc", 1.15);
        }
        break;
      }
      case "corn": {
        const target = this.scene.gameState.enemies
          .filter(e => e.row === defender.row && e.hp > 0 && !e.removed)
          .sort((a, b) => a.x - b.x)[0];
        if (target) {
          this.scene.enemySystem.damageEnemy(target, 120, "#ffd43b", defender.type);
          this.scene.effectsSystem.burst(target.x, target.y, "#ffd43b", 25);
        }
        break;
      }
      case "carrot": {
        const lineTargets = this.scene.gameState.enemies.filter(e => e.row === defender.row && e.hp > 0 && !e.removed);
        for (const e of lineTargets) {
          this.scene.enemySystem.damageEnemy(e, 55, "#ff8b2c", defender.type);
          this.scene.effectsSystem.burst(e.x, e.y, "#ff8b2c", 10);
        }
        break;
      }
      case "broccoli": {
        const nearby = this.scene.gameState.defenders.filter(d => Math.abs(d.row - defender.row) <= 1 && Math.abs(d.col - defender.col) <= 1);
        for (const d of nearby) {
          d.hp = Math.min(d.maxHp, d.hp + 120);
          this.scene.effectsSystem.burst(d.x, d.y, "#48a94f", 12);
          this.scene.effectsSystem.spawnFloater(d.x, d.y - 20, "+120 HP 🛡️", "#48a94f", 1.1);
        }
        break;
      }
      case "pepper": {
        const rowEnemies = this.scene.gameState.enemies.filter(e => e.row === defender.row && e.hp > 0 && !e.removed);
        for (const e of rowEnemies) {
          e.burnUntil = this.scene.gameState.time + 5;
          e.burnDamage = 12;
          e.burnSource = "pepper";
          this.scene.effectsSystem.burst(e.x, e.y, "#f04b36", 15);
        }
        break;
      }
      case "tomato": {
        for (const e of this.scene.gameState.enemies) {
          const dist = Math.hypot(e.x - defender.x, (e.row - defender.row) * this.scene.CELL_H);
          if (dist < 200) {
            this.scene.enemySystem.damageEnemy(e, 120, "#e93835", defender.type);
            this.scene.effectsSystem.burst(e.x, e.y, "#e93835", 15);
          }
        }
        this.scene.effectsSystem.triggerShake(12, 350);
        break;
      }
      case "watermelon": {
        defender.cooldownLeft = 0;
        defender.digesting = false;
        if (defender.textObj) defender.textObj.setText("🍉");
        defender.hp = Math.min(defender.maxHp, defender.hp + 80);
        this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 25, "DIGESTÃO RÁPIDA! +80 HP 🍉", "#ff3b5c", 1.15);
        this.scene.effectsSystem.burst(defender.x, defender.y, "#ff3b5c", 15);
        break;
      }
    }
    return true;
  }

  updateDefenders(dt) {
    const boosted = this.scene.gameState.time < this.scene.gameState.attackBoostUntil;
    const frenzyActive = this.scene.gameState.time < (this.scene.gameState.frenzyUntil || 0);
    const speedMult = (boosted ? 2 : 1) * (frenzyActive ? 1.35 : 1);

    for (const defender of this.scene.gameState.defenders) {
      const slowed = defender.slowUntil > this.scene.gameState.time;
      defender.cooldownLeft -= dt * speedMult * (slowed ? 0.6 : 1);

      if (defender.type === "potato") {
        if (!defender.armed) {
          defender.armTimer = (defender.armTimer || 3.0) - dt;
          if (defender.armTimer <= 0) {
            defender.armed = true;
            if (defender.sprite) defender.sprite.setTexture("tex_potato_armed");
            this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 25, "MINA ARMADA! 💣", "#d2b48c", 1.15);
            this.scene.effectsSystem.burst(defender.x, defender.y, "#d2b48c", 15);
            this.scene.soundManager.beep(700, 0.1, "sine", 0.05);
          }
        }
        continue;
      }

      if (defender.type === "garlic") {
        continue;
      }

      if (defender.type === "watermelon") {
        if (defender.digesting && defender.cooldownLeft <= 0) {
          defender.digesting = false;
          if (defender.textObj) defender.textObj.setText("🍉");
          this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, "Digestão pronta! 🍉", "#ff3b5c", 1.1);
        }

        if (defender.cooldownLeft <= 0) {
          const prey = this.scene.gameState.enemies
            .filter(enemy => enemy.row === defender.row && enemy.hp > 0 && !enemy.removed && Math.abs(enemy.x - (defender.x + 15)) < 65 && enemy.x >= defender.x - 15)
            .sort((a, b) => a.x - b.x)[0];
          if (prey) {
            defender.cooldownLeft = defender.cooldown;
            defender.digesting = true;
            if (defender.textObj) defender.textObj.setText("😋");
            this.scene.soundManager.beep(160, 0.22, "sawtooth", 0.08);
            this.scene.effectsSystem.triggerShake(6, 200);
            this.scene.effectsSystem.burst(defender.x + 25, defender.y, "#ff3b5c", 18);
            if (prey.boss) {
              const bossDamage = Math.round(450 * (1 + defender.powerLevel * 0.2));
              this.scene.enemySystem.damageEnemy(prey, bossDamage, "#ff3b5c", defender.type);
              this.scene.effectsSystem.spawnFloater(prey.x, prey.y - 45, `NHAM! -${bossDamage}💥`, "#ff3b5c", 1.25);
            } else {
              const totalHp = prey.hp + (prey.shield || 0);
              this.scene.enemySystem.damageEnemy(prey, totalHp, "#ff3b5c", defender.type);
              this.scene.effectsSystem.spawnFloater(defender.x + 20, defender.y - 35, "NHAM! 😋", "#ff3b5c", 1.2);
            }
          }
        }
        continue;
      }

      const target = this.scene.gameState.enemies
        .filter(enemy => enemy.row === defender.row && enemy.x > defender.x - 5)
        .sort((a, b) => a.x - b.x)[0];
      if (target && defender.damage > 0 && defender.cooldownLeft <= 0) {
        defender.cooldownLeft = defender.cooldown;
        this.scene.projectileSystem.spawnProjectile(defender);
        this.scene.soundManager.beep(defender.type === "pepper" ? 260 : 520, 0.025, "square", 0.025);
      }
    }
  }
}
