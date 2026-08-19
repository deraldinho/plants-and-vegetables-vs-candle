"use strict";

class EnemySystem {
  constructor(scene) {
    this.scene = scene;
  }

  spawnEnemy(type, row) {
    const base = ENEMIES[type];
    const mode = MODES[this.scene.gameState.mode];
    const endlessGrowth = this.scene.gameState.mode === "endless" ? Math.max(0, this.scene.gameState.wave - 3) : 0;
    const waveHpScale = 1 + (this.scene.gameState.wave - 1) * (this.scene.gameState.mode === "endless" ? 0.16 : 0.13);
    const hpScale = (base.boss ? 1 + endlessGrowth * 0.12 : waveHpScale) * mode.enemyHp;
    const speedScale = mode.enemySpeed * (1 + Math.min(0.3, endlessGrowth * 0.015));
    const damageScale = mode.enemyDamage * (1 + Math.min(0.5, endlessGrowth * 0.025));

    const x = this.scene.W + 42;
    const y = this.scene.GRID_Y + row * this.scene.CELL_H + this.scene.CELL_H / 2;

    const enemy = {
      ...base, type, row, x, y,
      hp: Math.round(base.hp * hpScale), maxHp: Math.round(base.hp * hpScale),
      shield: Math.round((base.shield || 0) * hpScale), maxShield: Math.round((base.shield || 0) * hpScale),
      speed: base.speed * speedScale, damage: Math.round(base.damage * damageScale),
      attackTimer: 0, hitFlash: 0, burnUntil: 0, burnTick: 0, wobble: Math.random() * 6
    };

    enemy.shadowSprite = this.scene.add.sprite(x, y + 22, "tex_shadow").setOrigin(0.5).setScale(base.scale || 1);
    enemy.sprite = this.scene.add.sprite(x, y - 4, "tex_" + type).setOrigin(0.5).setScale(base.scale || 1);
    enemy.textObj = enemy.sprite;
    this.scene.gameState.enemies.push(enemy);

    if (type === "candle") {
      this.scene.effectsSystem.triggerShake(14, 500);
      this.scene.soundManager.beep(120, 0.45, "sawtooth");
      this.scene.effectsSystem.spawnFloater(500, 150, "🔥 A VELA MESTRA CHEGOU! 🔥", "#ff3838", 1.5);
    } else if (type === "gum_boss") {
      this.scene.effectsSystem.triggerShake(16, 550);
      this.scene.soundManager.beep(100, 0.5, "sawtooth");
      this.scene.effectsSystem.spawnFloater(500, 150, "🟣 CHICLETE GIGANTE GRUDENTO CHEGOU! 🟣", "#d175ff", 1.5);
    } else if (type === "lollipop_boss") {
      this.scene.effectsSystem.triggerShake(20, 650);
      this.scene.soundManager.beep(90, 0.6, "sawtooth");
      this.scene.effectsSystem.spawnFloater(500, 150, "🍭 PIRULITO GIRATÓRIO SUPREMO CHEGOU! 🍭", "#ff3b9a", 1.6);
    }
  }

  damageEnemy(enemy, amount, color, sourceType = null) {
    if (enemy.hp <= 0) return;
    let remainingDamage = amount;
    let absorbedDamage = 0;
    if (enemy.shield > 0) {
      absorbedDamage = Math.min(enemy.shield, remainingDamage);
      enemy.shield -= absorbedDamage;
      remainingDamage -= absorbedDamage;
      if (enemy.shield <= 0) {
        this.scene.effectsSystem.burst(enemy.x, enemy.y, "#72d9ff", 20);
        this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 45, "ESCUDO QUEBRADO! 🛡️", "#72d9ff", 1.15);
      }
    }

    const actualDamage = absorbedDamage + Math.min(enemy.hp, remainingDamage);
    enemy.hp -= remainingDamage;
    this.scene.gameState.stats.damageDealt += actualDamage;
    if (sourceType) this.scene.gameState.damageByType[sourceType] = (this.scene.gameState.damageByType[sourceType] || 0) + actualDamage;

    const isBigHit = actualDamage >= 70;
    const floatText = isBigHit ? `-${Math.round(actualDamage)}💥` : `-${Math.round(actualDamage)}`;
    this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 30, floatText, absorbedDamage > 0 ? "#72d9ff" : color, isBigHit ? 1.25 : 1);

    if (enemy.hp <= 0) {
      this.scene.gameState.stats.enemiesDefeated += 1;
      this.scene.gameState.waveResolved += 1;
      this.scene.gameState.combo = this.scene.gameState.time <= this.scene.gameState.comboExpiresAt ? this.scene.gameState.combo + 1 : 1;
      this.scene.gameState.comboExpiresAt = this.scene.gameState.time + 4;
      this.scene.gameState.stats.maxCombo = Math.max(this.scene.gameState.stats.maxCombo, this.scene.gameState.combo);

      if (this.scene.gameState.combo >= 5 && this.scene.gameState.time > (this.scene.gameState.frenzyUntil || 0)) {
        this.scene.gameState.frenzyUntil = this.scene.gameState.time + 6;
        this.scene.effectsSystem.spawnFloater(500, 160, "🌱🔥 FRENESI VERDE ATIVO!", "#ff9f1c", 1.4);
      }

      const mode = MODES[this.scene.gameState.mode];
      const endlessMultiplier = this.scene.gameState.mode === "endless" ? 1 + (this.scene.gameState.wave - 1) * 0.03 : 1;
      const comboMultiplier = 1 + (this.scene.gameState.combo - 1) * 0.25;

      this.scene.gameState.score += Math.round(enemy.reward * 10 * mode.scoreMultiplier * endlessMultiplier * comboMultiplier);
      this.scene.gameState.sun += enemy.reward;
      enemy.removed = true;

      if (enemy.sprite) enemy.sprite.destroy();
      if (enemy.shadowSprite) enemy.shadowSprite.destroy();
      this.scene.effectsSystem.burst(enemy.x, enemy.y, "#ffc44d", enemy.boss ? 50 : 18);
      this.scene.soundManager.beep(enemy.boss ? 100 : 180, enemy.boss ? 0.5 : 0.08, "triangle", 0.06);
      if (enemy.boss) this.scene.effectsSystem.triggerShake(15, 450);
    }
  }

  updateEnemies(dt) {
    const sodaRows = new Set(
      this.scene.gameState.enemies
        .filter(e => e.type === "soda" && e.hp > 0 && !e.removed)
        .map(e => e.row)
    );

    for (const enemy of this.scene.gameState.enemies) {
      if (enemy.hp <= 0 || enemy.removed) continue;

      if (enemy.type === "gum_boss") {
        enemy.bossSkillTimer = (enemy.bossSkillTimer || 0) + dt;
        if (enemy.bossSkillTimer >= 4.5) {
          enemy.bossSkillTimer = 0;
          this.scene.effectsSystem.burst(enemy.x, enemy.y, "#d175ff", 22);
          this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 45, "BOMBA DE CHICLETE! 🟣", "#d175ff", 1.35);
          this.scene.soundManager.beep(160, 0.25, "sawtooth", 0.06);
          for (const defender of this.scene.gameState.defenders) {
            if (Math.abs(defender.x - enemy.x) < 280) {
              defender.slowUntil = this.scene.gameState.time + 6;
              this.scene.effectsSystem.burst(defender.x, defender.y, "#d175ff", 10);
              this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 25, "PRESO NO CHICLETE! 🟣", "#d175ff", 1.1);
            }
          }
        }
      }

      if (enemy.type === "lollipop_boss") {
        enemy.bossSkillTimer = (enemy.bossSkillTimer || 0) + dt;
        if (enemy.bossSkillTimer >= 3.8) {
          enemy.bossSkillTimer = 0;
          this.scene.effectsSystem.triggerShake(10, 350);
          this.scene.effectsSystem.burst(enemy.x, enemy.y, "#ff3b9a", 30);
          this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 50, "TEMPESTADE DE ESPINHOS! 🌵⚡", "#ff3b9a", 1.45);
          this.scene.soundManager.beep(420, 0.3, "sawtooth", 0.07);
          for (let r = 0; r < 5; r++) {
            const thorn = {
              x: enemy.x - 30,
              y: this.scene.GRID_Y + r * this.scene.CELL_H + this.scene.CELL_H / 2,
              row: r,
              speed: 320,
              damage: 35,
              color: "#ff3b9a",
              icon: "🌵",
              removed: false
            };
            thorn.textObj = this.scene.add.text(thorn.x, thorn.y, thorn.icon, { fontSize: "24px" }).setOrigin(0.5);
            this.scene.gameState.enemyProjectiles.push(thorn);
          }
        }
      }

      if (enemy.burnUntil > this.scene.gameState.time) {
        enemy.burnTick = (enemy.burnTick || 0) + dt;
        if (enemy.burnTick >= 0.5) {
          enemy.burnTick = 0;
          this.damageEnemy(enemy, enemy.burnDamage || 7, "#ff5638", enemy.burnSource || "pepper");
          this.scene.effectsSystem.burst(enemy.x, enemy.y, "#ff6b4a", 3);
        }
      } else {
        enemy.burnTick = 0;
      }

      const blocker = this.scene.gameState.defenders.find(d => d.row === enemy.row && Math.abs(enemy.x - d.x) < 44 && d.hp > 0);

      if (blocker) {
        if (blocker.type === "potato" && blocker.armed) {
          blocker.hp = 0;
          if (blocker.textObj) blocker.textObj.destroy();
          this.scene.effectsSystem.burst(blocker.x, blocker.y, "#ff5638", 30);
          this.scene.effectsSystem.spawnFloater(blocker.x, blocker.y - 35, "BOOM! 💥 180", "#ff5638", 1.4);
          this.scene.effectsSystem.triggerShake(12, 300);
          this.scene.soundManager.beep(110, 0.35, "sawtooth", 0.08);

          for (const e of this.scene.gameState.enemies) {
            if (e.hp > 0 && !e.removed && Math.hypot(e.x - blocker.x, (e.row - blocker.row) * this.scene.CELL_H) < 120) {
              this.damageEnemy(e, 180, "#ff5638", "potato");
            }
          }
          continue;
        }

        if (blocker.type === "garlic") {
          const newRow = enemy.row === 0 ? 1 : (enemy.row === 4 ? 3 : (Math.random() < 0.5 ? enemy.row - 1 : enemy.row + 1));
          enemy.row = newRow;
          enemy.y = this.scene.GRID_Y + newRow * this.scene.CELL_H + this.scene.CELL_H / 2;
          if (enemy.textObj) enemy.textObj.setY(enemy.y);
          this.scene.effectsSystem.burst(enemy.x, enemy.y, "#f5f5dc", 14);
          this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 30, "🤢 REPELIDO!", "#f5f5dc", 1.15);
          this.scene.soundManager.beep(300, 0.1, "sine", 0.04);
          blocker.hp -= 15;
          if (blocker.hp <= 0 && blocker.textObj) blocker.textObj.destroy();
          continue;
        }

        enemy.attackTimer = (enemy.attackTimer || 0) - dt;
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = enemy.attackRate || 1;
          const damage = enemy.damage || 18;
          blocker.hp -= damage;

          if (enemy.sticky) {
            blocker.slowUntil = this.scene.gameState.time + 4;
            this.scene.effectsSystem.spawnFloater(blocker.x, blocker.y - 42, "LENTIDÃO! 🟣", "#d175ff", 1.1);
          }

          this.scene.effectsSystem.burst(blocker.x + 10, blocker.y, "#fff0a8", 6);
          this.scene.effectsSystem.spawnFloater(blocker.x, blocker.y - 28, `-${damage}💔`, "#ff4d4d", 1.1);
          this.scene.soundManager.beep(220, 0.05, "sawtooth", 0.03);

          if (blocker.hp <= 0) {
            this.scene.effectsSystem.spawnFloater(blocker.x, blocker.y - 35, "Derrotado! 💔", "#ef476f", 1.2);
            if (blocker.textObj) blocker.textObj.destroy();
            this.scene.effectsSystem.burst(blocker.x, blocker.y, "#ef476f", 18);
          }
        }
      } else {
        const moveSpeed = enemy.speed * (sodaRows.has(enemy.row) && enemy.type !== "soda" ? 1.4 : 1);
        enemy.x -= moveSpeed * dt;
        if (enemy.sprite) enemy.sprite.setPosition(enemy.x, enemy.y);
        if (enemy.shadowSprite) enemy.shadowSprite.setPosition(enemy.x, enemy.y + 22);

        if ((enemy.type === "lollipop" || enemy.type === "lollipop_boss") && enemy.sprite) {
          enemy.sprite.angle += (enemy.type === "lollipop_boss" ? 360 : 200) * dt;
        }

        if ((enemy.type === "gummy" || enemy.type === "marshmallow") && enemy.sprite) {
          const baseScale = enemy.scale || 1;
          enemy.sprite.setScale(baseScale, baseScale + Math.sin(this.scene.gameState.time * 8 + enemy.wobble) * 0.08);
        }

        if (enemy.type === "candle" && Math.random() < 0.35) {
          this.scene.effectsSystem.burst(enemy.x, enemy.y - 28, "#ff3d00", 1);
        }
      }

      if (enemy.x < this.scene.HOUSE_X) {
        this.scene.gameState.houseHp -= enemy.boss ? 450 : Math.max(80, enemy.maxHp * 0.5);
        this.scene.gameState.houseDamagedThisWave = true;
        this.scene.gameState.waveResolved += 1;
        enemy.removed = true;
        if (enemy.sprite) enemy.sprite.destroy();
        if (enemy.shadowSprite) enemy.shadowSprite.destroy();
        this.scene.effectsSystem.burst(this.scene.HOUSE_X, enemy.y, "#ef476f", 25);
        this.scene.effectsSystem.triggerShake(9, 280);
        this.scene.soundManager.beep(85, 0.25, "sawtooth", 0.08);
      }
    }
    this.scene.gameState.defenders = this.scene.gameState.defenders.filter(d => d.hp > 0);
    this.scene.gameState.enemies = this.scene.gameState.enemies.filter(e => e.hp > 0 && !e.removed);
  }
}
