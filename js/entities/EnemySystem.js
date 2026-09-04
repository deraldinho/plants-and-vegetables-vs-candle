"use strict";

class EnemySystem {
  constructor(scene) {
    this.scene = scene;
  }

  spawnEnemy(type, row, options = {}) {
    const base = ENEMIES[type];
    if (!base) return null;

    const mode = MODES[this.scene.gameState.mode] || MODES.normal;
    const wave = this.scene.gameState.wave || 1;
    const hpScalingRate = mode.levelHpScaling || 0.14;
    const speedScalingRate = mode.levelSpeedScaling || 0.018;
    const rewardScalingRate = mode.levelRewardScaling || 0.12;

    const waveHpScale = 1 + (wave - 1) * hpScalingRate;
    const hpScale = (base.boss ? 1 + (wave - 1) * 0.15 : waveHpScale) * mode.enemyHp;
    const speedScale = mode.enemySpeed * (1 + Math.min(0.30, (wave - 1) * speedScalingRate));
    const damageScale = mode.enemyDamage * (1 + Math.min(0.45, (wave - 1) * 0.025));
    const rewardScaled = Math.round(base.reward * (1 + (wave - 1) * rewardScalingRate));

    const x = this.scene.W + 42;
    const y = this.scene.GRID_Y + row * this.scene.CELL_H + this.scene.CELL_H / 2;

    const enemy = {
      ...base, type, row, x, y,
      hp: Math.round(base.hp * hpScale),
      maxHp: Math.round(base.hp * hpScale),
      shield: Math.round((base.shield || 0) * (1 + (wave - 1) * 0.15)),
      maxShield: Math.round((base.shield || 0) * (1 + (wave - 1) * 0.15)),
      speed: base.speed * speedScale,
      damage: Math.round(base.damage * damageScale),
      reward: rewardScaled,
      rewardMultiplier: Number.isFinite(options.rewardMultiplier) ? Math.max(0, options.rewardMultiplier) : 1,
      attackTimer: base.ranged ? 0.7 : 0,
      hitFlash: 0,
      wobble: this.scene.randomFx ? this.scene.randomFx(0, 6) : this.scene.random(0, 6),
      statusEffects: new Map(),
      summoned: !!options.summoned,
      summonOwner: options.summonOwner || null,
      summonReleased: false,
      activeSummons: type === "confeiteiro" ? 0 : undefined,
      summonBudget: type === "confeiteiro" ? 20 : undefined,
      removed: false
    };

    enemy.shadowSprite = this.scene.add.sprite(x, y + 22, "tex_shadow").setOrigin(0.5).setScale(base.scale || 1);
    enemy.sprite = this.scene.add.sprite(x, y - 4, base.texture || ("tex_" + type)).setOrigin(0.5).setScale(base.scale || 1);
    if (base.tint && enemy.sprite) enemy.sprite.setTint(base.tint);
    enemy.textObj = enemy.sprite;
    this.scene.gameState.enemies.push(enemy);

    if (enemy.summoned) {
      this.scene.gameState.waveSummoned = (this.scene.gameState.waveSummoned || 0) + 1;
    }

    if (type === "gummy_brigadeiro") {
      this.scene.effectsSystem.spawnFloater(720, y - 38, "🧸💣 GUMMY LV.2: CANHÃO DE BRIGADEIRO!", "#6d3b1f", 1.15);
      this.scene.soundManager.beep(180, 0.18, "square", 0.05);
    } else if (type === "candle") {
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
    } else if (type === "confeiteiro") {
      this.scene.effectsSystem.triggerShake(25, 750);
      this.scene.soundManager.beep(80, 0.7, "sawtooth");
      this.scene.effectsSystem.spawnFloater(500, 150, "👨‍🍳 O CONFEITEIRO SOMBRIO CHEGOU! 👨‍🍳", "#ff1744", 1.7);
    } else if (type === "cake_robot") {
      this.scene.effectsSystem.triggerShake(22, 700);
      this.scene.soundManager.beep(75, 0.65, "sawtooth");
      this.scene.effectsSystem.spawnFloater(500, 150, "🤖🎂 ROBÔ BOLO MUTANTE GIGANTE ENTROU NA BATALHA! 🤖🎂", "#00e5ff", 1.65);
    }

    return enemy;
  }

  releaseSummonSlot(enemy) {
    if (!enemy?.summonOwner || enemy.summonReleased) return;
    enemy.summonReleased = true;
    enemy.summonOwner.activeSummons = Math.max(0, (enemy.summonOwner.activeSummons || 0) - 1);
  }

  fireRangedProjectile(enemy, target) {
    if (!enemy || !target || target.removed || target.hp <= 0) return false;
    const projectile = {
      x: enemy.x - 28,
      y: enemy.y - 6,
      row: enemy.row,
      speed: enemy.projectileSpeed || 300,
      damage: enemy.damage,
      color: enemy.projectileColor || "#6d3b1f",
      icon: enemy.projectileIcon || "●",
      effect: enemy.type === "gummy_brigadeiro" ? "brigadeiro" : null,
      slowDuration: enemy.slowDuration || 0,
      slowMultiplier: enemy.slowMultiplier || 0.7,
      removed: false
    };
    projectile.textObj = this.scene.add.text(projectile.x, projectile.y, projectile.icon, {
      fontSize: "24px",
      color: projectile.color,
      stroke: "#2b170d",
      strokeThickness: 2
    }).setOrigin(0.5);
    this.scene.gameState.enemyProjectiles.push(projectile);
    this.scene.effectsSystem.burst(enemy.x - 20, enemy.y, projectile.color, 8);
    this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 40, "PUM! BRIGADEIRO! 💣", "#8b4b2b", 0.95);
    this.scene.soundManager.beep(150, 0.08, "square", 0.04);
    return true;
  }

  meltShield(enemy, amount, sourceType = null, color = "#ffa500") {
    if (!enemy || enemy.removed || enemy.hp <= 0 || enemy.shield <= 0) return 0;
    const melted = Math.min(enemy.shield, Math.max(0, Number(amount) || 0));
    if (melted <= 0) return 0;

    enemy.shield -= melted;
    this.scene.gameState.stats.damageDealt += melted;
    if (sourceType) {
      this.scene.gameState.damageByType[sourceType] = (this.scene.gameState.damageByType[sourceType] || 0) + melted;
    }
    this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 44, `ÁCIDO -${Math.round(melted)} ESCUDO 🍊`, color, 1.0);
    if (enemy.shield <= 0) {
      this.scene.effectsSystem.burst(enemy.x, enemy.y, "#72d9ff", 18);
      this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 58, "ESCUDO DERRETIDO!", color, 1.1);
    }
    return melted;
  }

  damageEnemy(enemy, amount, color, sourceType = null) {
    if (!enemy || enemy.hp <= 0 || enemy.removed) return;
    let remainingDamage = Math.max(0, Number(amount) || 0);
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
      const effectiveReward = Math.round(enemy.reward * (enemy.rewardMultiplier ?? 1));

      this.scene.gameState.score += Math.round(effectiveReward * 10 * mode.scoreMultiplier * endlessMultiplier * comboMultiplier);
      this.scene.gameState.sun += effectiveReward;
      this.releaseSummonSlot(enemy);
      enemy.removed = true;

      if (enemy.sprite) enemy.sprite.destroy();
      if (enemy.shadowSprite) enemy.shadowSprite.destroy();
      this.scene.effectsSystem.burst(enemy.x, enemy.y, "#ffc44d", enemy.boss ? 50 : 18);
      this.scene.effectsSystem.spawnSugarDust(enemy.x, enemy.y, "#ff9f1c", enemy.boss ? 30 : 14);
      this.scene.effectsSystem.sparkleBurst(enemy.x, enemy.y, "#ffd43b", enemy.boss ? 25 : 8);
      if (enemy.boss) {
        this.scene.effectsSystem.spawnShockwave(enemy.x, enemy.y, "#ff3838", 240, 0.55);
        this.scene.effectsSystem.triggerShake(15, 450);
        this.scene.effectsSystem.flashScreen("#ff1744", 200);
      }
      this.scene.soundManager.beep(enemy.boss ? 100 : 180, enemy.boss ? 0.5 : 0.08, "triangle", 0.06);
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

      this.scene.statusEffectSystem.updateEnemy(enemy);
      if (enemy.hp <= 0 || enemy.removed) continue;

      if (enemy.type === "candle") {
        enemy.bossSkillTimer = (enemy.bossSkillTimer || 0) + dt;
        if (enemy.bossSkillTimer >= 5.0) {
          enemy.bossSkillTimer = 0;
          this.scene.effectsSystem.burst(enemy.x, enemy.y, "#ff6600", 24);
          this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 45, "ONDA DE CHAMA! 🔥", "#ff6600", 1.35);
          this.scene.soundManager.beep(280, 0.3, "sawtooth", 0.07);
          const flame = {
            x: enemy.x - 30,
            y: enemy.y,
            row: enemy.row,
            speed: 300,
            damage: 40,
            effect: "flame",
            color: "#ff3d00",
            icon: "🔥",
            removed: false
          };
          flame.textObj = this.scene.add.text(flame.x, flame.y, flame.icon, { fontSize: "24px" }).setOrigin(0.5);
          this.scene.gameState.enemyProjectiles.push(flame);
        }
      }

      if (enemy.type === "gum_boss") {
        enemy.bossSkillTimer = (enemy.bossSkillTimer || 0) + dt;
        if (enemy.bossSkillTimer >= 4.5) {
          enemy.bossSkillTimer = 0;
          this.scene.effectsSystem.burst(enemy.x, enemy.y, "#d175ff", 22);
          this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 45, "BOMBA DE CHICLETE! 🟣", "#d175ff", 1.35);
          this.scene.soundManager.beep(160, 0.25, "sawtooth", 0.06);
          for (const defender of this.scene.gameState.defenders) {
            if (!defender.removed && Math.abs(defender.x - enemy.x) < 280) {
              this.scene.statusEffectSystem.applySlow(defender, 6, 0.6, "gum_boss");
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

      if (enemy.type === "confeiteiro") {
        enemy.bossSkillTimer = (enemy.bossSkillTimer || 0) + dt;
        if (enemy.bossSkillTimer >= 4.2) {
          enemy.bossSkillTimer = 0;
          this.scene.effectsSystem.triggerShake(14, 450);
          this.scene.effectsSystem.burst(enemy.x, enemy.y, "#ff1744", 35);
          this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 55, "CHUVA DE AÇÚCAR & ROLO DE MASSA! 👨‍🍳🥖", "#ff1744", 1.5);
          this.scene.soundManager.beep(120, 0.35, "sawtooth", 0.08);

          const maxAliveSummons = 6;
          const remainingBudget = Math.max(0, enemy.summonBudget ?? 20);
          const availableSlots = Math.max(0, maxAliveSummons - (enemy.activeSummons || 0));
          const summonCount = Math.min(2, remainingBudget, availableSlots);
          const minionTypes = ["gummy", "marshmallow", "cupcake", "chocolate"];
          for (let k = 0; k < summonCount; k++) {
            const mType = minionTypes[Math.floor(this.scene.random(0, minionTypes.length))];
            const mRow = Math.floor(this.scene.random(0, 5));
            const minion = this.spawnEnemy(mType, mRow, {
              summoned: true,
              summonOwner: enemy,
              rewardMultiplier: 0.25
            });
            if (minion) {
              enemy.activeSummons = (enemy.activeSummons || 0) + 1;
              enemy.summonBudget = Math.max(0, (enemy.summonBudget ?? 20) - 1);
            }
          }

          const rollingPin = {
            x: enemy.x - 30,
            y: this.scene.GRID_Y + enemy.row * this.scene.CELL_H + this.scene.CELL_H / 2,
            row: enemy.row,
            speed: 360,
            damage: 80,
            color: "#ff3d00",
            icon: "🥖",
            removed: false
          };
          rollingPin.textObj = this.scene.add.text(rollingPin.x, rollingPin.y, rollingPin.icon, { fontSize: "28px" }).setOrigin(0.5);
          this.scene.gameState.enemyProjectiles.push(rollingPin);
        }
      }

      if (enemy.type === "cake_robot") {
        enemy.bossSkillTimer = (enemy.bossSkillTimer || 0) + dt;
        if (enemy.bossSkillTimer >= 4.5) {
          enemy.bossSkillTimer = 0;
          this.scene.effectsSystem.triggerShake(16, 500);
          this.scene.effectsSystem.burst(enemy.x, enemy.y, "#00e5ff", 35);
          this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 55, "LASER DE COBERTURA & PARALISIA! 🤖⚡", "#00e5ff", 1.5);
          this.scene.soundManager.beep(140, 0.35, "square", 0.08);

          for (const defender of this.scene.gameState.defenders) {
            if (!defender.removed && Math.abs(defender.x - enemy.x) < 260) {
              this.scene.statusEffectSystem.applySlow(defender, 4, 0.6, "cake_robot");
              this.scene.effectsSystem.burst(defender.x, defender.y, "#00e5ff", 8);
            }
          }

          const laser = {
            x: enemy.x - 30,
            y: this.scene.GRID_Y + enemy.row * this.scene.CELL_H + this.scene.CELL_H / 2,
            row: enemy.row,
            speed: 420,
            damage: 75,
            color: "#00e5ff",
            icon: "⚡",
            removed: false
          };
          laser.textObj = this.scene.add.text(laser.x, laser.y, laser.icon, { fontSize: "28px" }).setOrigin(0.5);
          this.scene.gameState.enemyProjectiles.push(laser);
        }
      }

      if (enemy.ranged) {
        const target = this.scene.gameState.defenders
          .filter(d => !d.removed && d.hp > 0 && d.row === enemy.row && d.x < enemy.x && (enemy.x - d.x) <= (enemy.range || 300))
          .sort((a, b) => b.x - a.x)[0];
        if (target) {
          enemy.attackTimer = (enemy.attackTimer || 0) - dt;
          if (enemy.attackTimer <= 0) {
            enemy.attackTimer = enemy.attackRate || 3.5;
            this.fireRangedProjectile(enemy, target);
          }
          if (enemy.sprite) enemy.sprite.setAngle(Math.sin(this.scene.gameState.time * 7) * 3);
          continue;
        }
      }

      const blocker = this.scene.gameState.defenders.find(d => !d.removed && d.row === enemy.row && Math.abs(enemy.x - d.x) < 44 && d.hp > 0);

      if (blocker) {
        if (blocker.type === "potato" && blocker.armed) {
          const potatoDamage = this.scene.defenderSystem.getEffectiveDamage(blocker);
          this.scene.defenderSystem.defeatDefender(blocker, "potato-detonated", { silent: true });
          this.scene.effectsSystem.burst(blocker.x, blocker.y, "#ff5638", 30);
          this.scene.effectsSystem.spawnFloater(blocker.x, blocker.y - 35, `BOOM! 💥 ${potatoDamage}`, "#ff5638", 1.4);
          this.scene.effectsSystem.triggerShake(12, 300);
          this.scene.soundManager.beep(110, 0.35, "sawtooth", 0.08);

          for (const e of this.scene.gameState.enemies) {
            if (e.hp > 0 && !e.removed && Math.hypot(e.x - blocker.x, (e.row - blocker.row) * this.scene.CELL_H) < 120) {
              this.damageEnemy(e, potatoDamage, "#ff5638", "potato");
            }
          }
          continue;
        }

        if (blocker.type === "garlic") {
          const newRow = enemy.row === 0 ? 1 : (enemy.row === 4 ? 3 : (this.scene.random(0, 1) < 0.5 ? enemy.row - 1 : enemy.row + 1));
          enemy.row = newRow;
          enemy.y = this.scene.GRID_Y + newRow * this.scene.CELL_H + this.scene.CELL_H / 2;
          if (enemy.sprite) enemy.sprite.setY(enemy.y - 4);
          if (enemy.shadowSprite) enemy.shadowSprite.setY(enemy.y + 22);
          if (enemy.textObj && enemy.textObj !== enemy.sprite) enemy.textObj.setY(enemy.y);
          this.scene.effectsSystem.burst(enemy.x, enemy.y, "#f5f5dc", 14);
          this.scene.effectsSystem.spawnFloater(enemy.x, enemy.y - 30, "🤢 REPELIDO!", "#f5f5dc", 1.15);
          this.scene.soundManager.beep(300, 0.1, "sine", 0.04);
          this.scene.defenderSystem.damageDefender(blocker, 15, { silent: true, reason: "garlic-repel" });
          continue;
        }

        enemy.attackTimer = (enemy.attackTimer || 0) - dt;
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = enemy.attackRate || 1;
          const damage = enemy.damage || 18;
          const sticky = !!enemy.sticky;
          this.scene.defenderSystem.damageDefender(blocker, damage, {
            reason: "enemy-melee",
            slowDuration: sticky ? 4 : 0,
            slowMultiplier: sticky ? 0.6 : undefined,
            slowSource: sticky ? enemy.type : null,
            color: sticky ? "#d175ff" : "#ff4d4d"
          });
          if (sticky && !blocker.removed) {
            this.scene.effectsSystem.spawnFloater(blocker.x, blocker.y - 42, "LENTIDÃO! 🟣", "#d175ff", 1.1);
          }
          this.scene.soundManager.beep(220, 0.05, "sawtooth", 0.03);
        }
      } else {
        const slowMult = this.scene.statusEffectSystem?.getMovementSpeedMultiplier ? this.scene.statusEffectSystem.getMovementSpeedMultiplier(enemy) : 1;
        const moveSpeed = enemy.speed * slowMult * (sodaRows.has(enemy.row) && enemy.type !== "soda" ? 1.4 : 1);
        enemy.x -= moveSpeed * dt;
        if (enemy.sprite) enemy.sprite.setPosition(enemy.x, enemy.y);
        if (enemy.shadowSprite) enemy.shadowSprite.setPosition(enemy.x, enemy.y + 22);

        if ((enemy.type === "lollipop" || enemy.type === "lollipop_boss") && enemy.sprite) {
          enemy.sprite.angle += (enemy.type === "lollipop_boss" ? 360 : 200) * dt;
        }

        if ((enemy.type === "gummy" || enemy.type === "gummy_brigadeiro" || enemy.type === "marshmallow") && enemy.sprite) {
          const baseScale = enemy.scale || 1;
          enemy.sprite.setScale(baseScale, baseScale + Math.sin(this.scene.gameState.time * 8 + enemy.wobble) * 0.08);
        }

        if (enemy.type === "candle" && this.scene.randomFx(0, 1) < 0.35) {
          this.scene.effectsSystem.burst(enemy.x, enemy.y - 28, "#ff3d00", 1);
        }
      }

      if (enemy.x < this.scene.HOUSE_X) {
        this.scene.gameState.houseHp -= enemy.boss ? 450 : Math.max(80, enemy.maxHp * 0.5);
        this.scene.gameState.houseDamagedThisWave = true;
        this.scene.gameState.waveResolved += 1;
        this.releaseSummonSlot(enemy);
        enemy.removed = true;
        if (enemy.sprite) enemy.sprite.destroy();
        if (enemy.shadowSprite) enemy.shadowSprite.destroy();
        this.scene.effectsSystem.burst(this.scene.HOUSE_X, enemy.y, "#ef476f", 25);
        this.scene.effectsSystem.triggerShake(9, 280);
        this.scene.soundManager.beep(85, 0.25, "sawtooth", 0.08);
      }
    }

    this.scene.defenderSystem.cleanupDefeated();
    this.scene.gameState.enemies = this.scene.gameState.enemies.filter(e => e.hp > 0 && !e.removed);
  }
}
