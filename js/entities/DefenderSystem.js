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
      case "banana": {
        defender.frenzyUntil = this.scene.gameState.time + 6;
        this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 25, "SOCOS FRENÉTICOS! 🍌🥊", "#ffe135", 1.25);
        this.scene.effectsSystem.burst(defender.x, defender.y, "#ffe135", 18);
        break;
      }
      case "orange": {
        const rowEnemies = this.scene.gameState.enemies.filter(e => e.row === defender.row && e.hp > 0 && !e.removed);
        for (const e of rowEnemies) {
          if (e.shield > 0) {
            e.shield = 0;
            this.scene.effectsSystem.spawnFloater(e.x, e.y - 35, "ESCUDO DERRETIDO! 🍊💧", "#ffa500", 1.2);
          }
          this.scene.enemySystem.damageEnemy(e, 45, "#ffa500", "orange");
          this.scene.effectsSystem.burst(e.x, e.y, "#ffa500", 12);
        }
        break;
      }
      case "strawberry": {
        defender.hp = Math.min(defender.maxHp, defender.hp + 100);
        const nearbyEnemies = this.scene.gameState.enemies.filter(e => Math.abs(e.row - defender.row) <= 1 && Math.abs(e.x - defender.x) < 160 && e.hp > 0 && !e.removed);
        for (const e of nearbyEnemies) {
          e.x = Math.max(this.scene.GRID_X + defender.col * this.scene.CELL_W, e.x - 40);
          this.scene.effectsSystem.burst(e.x, e.y, "#ff2a4b", 10);
        }
        this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, "AROMA ATRATOR! +100 HP 🍓", "#ff2a4b", 1.2);
        break;
      }
      case "apple": {
        const lineEnemies = this.scene.gameState.enemies.filter(e => e.row === defender.row && e.hp > 0 && !e.removed);
        for (const e of lineEnemies) {
          this.scene.enemySystem.damageEnemy(e, 250, "#e3242b", "apple");
          this.scene.effectsSystem.burst(e.x, e.y, "#e3242b", 15);
        }
        this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 35, "SUPER IMPACTO! 🍎💥", "#e3242b", 1.35);
        this.scene.effectsSystem.triggerShake(12, 300);
        break;
      }
      case "pineapple": {
        for (const e of this.scene.gameState.enemies) {
          if (Math.hypot(e.x - defender.x, (e.row - defender.row) * this.scene.CELL_H) < 140) {
            this.scene.enemySystem.damageEnemy(e, 140, "#e4b419", "pineapple");
            this.scene.effectsSystem.burst(e.x, e.y, "#e4b419", 10);
          }
        }
        this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, "CHUVA DE ESPINHOS! 🍍⚡", "#e4b419", 1.25);
        break;
      }
      case "cauliflower": {
        const p = {
          x: defender.x + 25, y: defender.y - 3, row: defender.row,
          speed: 400, damage: 120, color: "#d8f8e1", icon: "🌀",
          area: false, piercing: true, hitsLeft: 99, sourceType: "cauliflower", removed: false
        };
        p.textObj = this.scene.add.text(p.x, p.y, p.icon, { fontSize: "28px" }).setOrigin(0.5);
        this.scene.gameState.projectiles.push(p);
        this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, "ONDA MÍSTICA! 🥦🌀", "#d8f8e1", 1.25);
        break;
      }
    }
    return true;
  }

  applyFertilizer(defender) {
    if (!defender) return false;
    const FERTILIZER_COST = 75;
    if (this.scene.gameState.sun < FERTILIZER_COST) {
      this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 35, "Energia insuficiente! (75 ☀️)", "#ef476f", 1.15);
      return false;
    }
    this.scene.gameState.sun -= FERTILIZER_COST;
    defender.powerLevel = 3;
    defender.fertilizerBoostUntil = this.scene.gameState.time + 8;
    defender.hp = defender.maxHp;
    this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 35, "ADUBO! NÍVEL MÁXIMO (3) 🎒✨", "#ffd54f", 1.35);
    this.scene.effectsSystem.burst(defender.x, defender.y, "#ffd54f", 25);
    this.scene.soundManager.beep(880, 0.25, "sine", 0.08);
    return true;
  }

  updateDefenders(dt) {
    const boosted = this.scene.gameState.time < this.scene.gameState.attackBoostUntil;
    const frenzyActive = this.scene.gameState.time < (this.scene.gameState.frenzyUntil || 0);
    const speedMult = (boosted ? 2 : 1) * (frenzyActive ? 1.35 : 1);

    for (const defender of this.scene.gameState.defenders) {
      const slowed = defender.slowUntil > this.scene.gameState.time;
      const isFertilized = defender.fertilizerBoostUntil > this.scene.gameState.time;
      const activePower = isFertilized ? 3 : defender.powerLevel;
      defender.cooldownLeft -= dt * speedMult * (slowed ? 0.6 : 1);

      // Banana Boxeadora Melee
      if (defender.melee) {
        if (defender.cooldownLeft <= 0) {
          const enemyInRange = this.scene.gameState.enemies.find(e => e.row === defender.row && e.hp > 0 && !e.removed && Math.abs(e.x - (defender.x + 35)) < 55);
          if (enemyInRange) {
            defender.cooldownLeft = defender.cooldown;
            const dmg = Math.round(defender.damage * (1 + activePower * 0.2));
            this.scene.enemySystem.damageEnemy(enemyInRange, dmg, "#ffe135", defender.type);
            this.scene.effectsSystem.burst(enemyInRange.x, enemyInRange.y, "#ffe135", 10);
            this.scene.soundManager.beep(420, 0.06, "square", 0.04);
            if (defender.sprite) defender.sprite.setAngle(15);
            setTimeout(() => { if (defender.sprite) defender.sprite.setAngle(0); }, 150);
          }
        }
        continue;
      }

      // Maçã Esmagadora Smash
      if (defender.smash) {
        const enemyUnder = this.scene.gameState.enemies.find(e => e.row === defender.row && e.hp > 0 && !e.removed && Math.abs(e.x - defender.x) < 35);
        if (enemyUnder) {
          const dmg = Math.round(defender.damage * (1 + activePower * 0.2));
          this.scene.enemySystem.damageEnemy(enemyUnder, dmg, "#e3242b", defender.type);
          this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, `SMASH! -${dmg}🍎💥`, "#e3242b", 1.3);
          this.scene.effectsSystem.burst(defender.x, defender.y, "#e3242b", 25);
          this.scene.effectsSystem.triggerShake(10, 300);
          this.scene.soundManager.beep(120, 0.25, "sawtooth", 0.08);
          defender.hp = 0; // Consumed on impact
          if (defender.sprite) defender.sprite.destroy();
          if (defender.shadowSprite) defender.shadowSprite.destroy();
        }
        continue;
      }

      // Morango Atrator Taunt
      if (defender.taunt) {
        const nearbyEnemies = this.scene.gameState.enemies.filter(e => Math.abs(e.row - defender.row) <= 1 && Math.abs(e.x - defender.x) < 140 && e.hp > 0 && !e.removed);
        for (const e of nearbyEnemies) {
          if (e.x > defender.x + 20) e.x -= 20 * dt;
        }
        continue;
      }

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

    for (const defender of this.scene.gameState.defenders) {
      if (defender.hp <= 0 && defender.explodeOnDeath) {
        for (const e of this.scene.gameState.enemies) {
          if (Math.hypot(e.x - defender.x, (e.row - defender.row) * this.scene.CELL_H) < 130) {
            this.scene.enemySystem.damageEnemy(e, 150, "#ff2a4b", "strawberry");
          }
        }
        this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 35, "BOOM MORANGO! 🍓💥", "#ff2a4b", 1.35);
        this.scene.effectsSystem.burst(defender.x, defender.y, "#ff2a4b", 25);
        this.scene.effectsSystem.triggerShake(8, 250);
        this.scene.soundManager.beep(140, 0.3, "sawtooth", 0.08);
      }
    }
  }
}
