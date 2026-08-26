"use strict";

class DefenderSystem {
  constructor(scene) {
    this.scene = scene;
  }

  isTypeAllowed(type) {
    const deck = this.scene?.gameState?.activeDeck;
    return Array.isArray(deck) && deck.includes(type);
  }

  getEffectiveDamage(defender) {
    if (!defender) return 0;
    if (defender.fertilizerBoostUntil > this.scene.gameState.time) {
      const base = DEFENDERS[defender.type]?.damage || defender.damage || 0;
      return Math.max(defender.damage || 0, Math.round(base * (1 + 3 * 0.35)));
    }
    return defender.damage || 0;
  }

  placeDefender(col, row, type) {
    const config = DEFENDERS[type];
    if (!config || !this.isTypeAllowed(type)) return false;
    if (this.scene.gameState.sun < config.cost) return false;

    this.scene.gameState.sun -= config.cost;
    const x = this.scene.GRID_X + col * this.scene.CELL_W + this.scene.CELL_W / 2;
    const y = this.scene.GRID_Y + row * this.scene.CELL_H + this.scene.CELL_H / 2;

    const defender = {
      ...config, type, row, col, x, y,
      maxHp: config.hp,
      cooldownLeft: 0.2,
      hitFlash: 0,
      abilityReadyAt: 0,
      sway: this.scene.random(0, 5),
      powerLevel: 0,
      healthLevel: 0,
      armor: 0,
      invested: config.cost,
      punchCombo: 0,
      punchComboExpiresAt: 0,
      fertilizerBoostUntil: 0,
      statusEffects: new Map(),
      removed: false,
      deathEffectResolved: false
    };

    defender.shadowSprite = this.scene.add.sprite(x, y + 22, "tex_shadow").setOrigin(0.5);
    const textureKey = (type === "potato" && defender.armed) ? "tex_potato_armed" : "tex_" + type;
    defender.sprite = this.scene.add.sprite(x, y - 4, textureKey).setOrigin(0.5);
    defender.textObj = defender.sprite;
    this.scene.gameState.defenders.push(defender);
    this.scene.gameState.stats.defendersPlaced += 1;

    this.scene.effectsSystem.burst(x, y, "#d8ff91", 16);
    this.scene.effectsSystem.sparkleBurst(x, y, "#b7df54", 10);
    this.scene.soundManager.beep(330, 0.07, "sine", 0.04);
    return true;
  }

  damageDefender(defender, amount, options = {}) {
    if (!defender || defender.removed || defender.hp <= 0) return false;

    const damageMultiplier = this.scene.statusEffectSystem.getDamageTakenMultiplier(defender);
    let finalDamage = Math.max(0, amount || 0);
    if (damageMultiplier < 1) {
      finalDamage = Math.max(1, Math.round(finalDamage * damageMultiplier));
      this.scene.effectsSystem.burst(defender.x, defender.y, "#8de6a8", 5);
    }

    defender.hp -= finalDamage;

    if (options.slowDuration > 0) {
      this.scene.statusEffectSystem.applySlow(
        defender,
        options.slowDuration,
        Number.isFinite(options.slowMultiplier) ? options.slowMultiplier : 0.6,
        options.slowSource || options.reason || null
      );
    }

    if (!options.silent) {
      const color = options.color || "#ff4d4d";
      const suffix = options.suffix || "💔";
      this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 28, `-${finalDamage}${suffix}`, color, 1.1);
      this.scene.effectsSystem.burst(defender.x + 10, defender.y, options.burstColor || "#fff0a8", 6);
    }

    if (defender.hp <= 0) {
      this.defeatDefender(defender, options.reason || "damage", { silent: options.silentDeath });
      return true;
    }
    return false;
  }

  resolveDeathEffect(defender) {
    if (!defender?.explodeOnDeath || defender.deathEffectResolved) return;
    defender.deathEffectResolved = true;
    for (const enemy of this.scene.gameState.enemies) {
      if (enemy.hp <= 0 || enemy.removed) continue;
      const distance = Math.hypot(enemy.x - defender.x, (enemy.row - defender.row) * this.scene.CELL_H);
      if (distance < 150) {
        this.scene.enemySystem.damageEnemy(enemy, 150, "#ff2a4b", "strawberry");
      }
    }
    this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 35, "BOOM MORANGO! 🍓💥", "#ff2a4b", 1.35);
    this.scene.effectsSystem.burst(defender.x, defender.y, "#ff2a4b", 25);
    this.scene.effectsSystem.sparkleBurst(defender.x, defender.y, "#ff2a4b", 15);
    this.scene.effectsSystem.spawnShockwave(defender.x, defender.y, "#ff2a4b", 150, 0.4);
    this.scene.effectsSystem.triggerShake(8, 250);
    this.scene.soundManager.beep(140, 0.3, "sawtooth", 0.08);
  }

  removeDefender(defender, reason = "removed", options = {}) {
    if (!defender || defender.removed) return false;
    if (options.triggerDeathEffect) this.resolveDeathEffect(defender);
    if (!options.silent && !options.triggerDeathEffect) {
      this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 35, "Removido", "#b9e4a3", 1.05);
    }
    defender.hp = 0;
    defender.removed = true;
    defender.deathReason = reason;
    if (defender.sprite) defender.sprite.destroy();
    if (defender.shadowSprite) defender.shadowSprite.destroy();
    if (defender.textObj && defender.textObj !== defender.sprite) defender.textObj.destroy();
    return true;
  }

  defeatDefender(defender, reason = "defeated", options = {}) {
    if (!defender || defender.removed) return false;

    if (defender.explodeOnDeath) {
      this.resolveDeathEffect(defender);
    } else if (!options.silent) {
      this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 35, "Derrotado! 💔", "#ef476f", 1.2);
      this.scene.effectsSystem.burst(defender.x, defender.y, "#ef476f", 18);
    }

    return this.removeDefender(defender, reason, { silent: true });
  }

  cleanupDefeated() {
    this.scene.gameState.defenders = this.scene.gameState.defenders.filter(d => d && d.hp > 0 && !d.removed);
  }

  upgradeDefenderPower(defender) {
    if (!defender || defender.removed || defender.powerLevel >= 3) return false;
    const cost = Math.round(defender.cost * (0.6 + defender.powerLevel * 0.4));
    if (this.scene.gameState.sun < cost) return false;
    this.scene.gameState.sun -= cost;
    defender.invested += cost;
    defender.powerLevel += 1;
    defender.damage = Math.round(DEFENDERS[defender.type].damage * (1 + defender.powerLevel * 0.35));
    this.scene.gameState.stats.upgradesBought += 1;
    this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, `ATK Nív ${defender.powerLevel}! ⚔️`, "#ffd43b", 1.25);
    this.scene.effectsSystem.burst(defender.x, defender.y, "#ffd43b", 18);
    this.scene.effectsSystem.sparkleBurst(defender.x, defender.y, "#ffd43b", 12);
    this.scene.effectsSystem.spawnShockwave(defender.x, defender.y, "#ffd43b", 60, 0.35);
    this.scene.soundManager.beep(520, 0.1, "sine", 0.05);
    return true;
  }

  upgradeDefenderHealth(defender) {
    if (!defender || defender.removed || defender.healthLevel >= 3) return false;
    const cost = Math.round(defender.cost * (0.5 + defender.healthLevel * 0.35));
    if (this.scene.gameState.sun < cost) return false;
    this.scene.gameState.sun -= cost;
    defender.invested += cost;
    defender.healthLevel += 1;
    const bonusHp = Math.round(DEFENDERS[defender.type].hp * 0.4);
    defender.maxHp += bonusHp;
    defender.hp += bonusHp;
    this.scene.gameState.stats.upgradesBought += 1;
    this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, `HP Nív ${defender.healthLevel}! 💚`, "#69c743", 1.25);
    this.scene.effectsSystem.burst(defender.x, defender.y, "#69c743", 18);
    this.scene.effectsSystem.sparkleBurst(defender.x, defender.y, "#b8e34d", 12);
    this.scene.effectsSystem.spawnShockwave(defender.x, defender.y, "#69c743", 60, 0.35);
    this.scene.soundManager.beep(440, 0.1, "sine", 0.05);
    return true;
  }

  useAbility(defender) {
    if (!defender || defender.removed || defender.abilityReadyAt > this.scene.gameState.time) return false;
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
          const newRow = e.row === 0 ? 1 : (e.row === 4 ? 3 : (this.scene.random(0, 1) < 0.5 ? e.row - 1 : e.row + 1));
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
        const nearby = this.scene.gameState.defenders.filter(d => !d.removed && Math.abs(d.row - defender.row) <= 1 && Math.abs(d.col - defender.col) <= 1);
        for (const d of nearby) {
          d.hp = Math.min(d.maxHp, d.hp + 80);
          this.scene.statusEffectSystem.applyGuard(d, 8, 0.5, "broccoli");
          this.scene.effectsSystem.burst(d.x, d.y, "#48a94f", 12);
          this.scene.effectsSystem.spawnFloater(d.x, d.y - 20, "+80 HP 🛡️ ESCUDO", "#48a94f", 1.1);
        }
        break;
      }
      case "pepper": {
        const rowEnemies = this.scene.gameState.enemies.filter(e => e.row === defender.row && e.hp > 0 && !e.removed);
        for (const e of rowEnemies) {
          this.scene.statusEffectSystem.applyDot(e, "burn", 5, 12, "pepper", "#ff5638", 0.5);
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
        this.scene.effectsSystem.spawnShockwave(defender.x, defender.y, "#e93835", 210, 0.45);
        this.scene.effectsSystem.sparkleBurst(defender.x, defender.y, "#ff8a65", 18);
        this.scene.effectsSystem.triggerShake(12, 350);
        break;
      }
      case "watermelon": {
        defender.cooldownLeft = 0;
        defender.digesting = false;
        if (defender.sprite) defender.sprite.clearTint();
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
          if (e.shield > 0) this.scene.enemySystem.meltShield(e, e.shield, "orange", "#ffa500");
          this.scene.enemySystem.damageEnemy(e, 45, "#ffa500", "orange");
          if (!e.removed && e.hp > 0) this.scene.statusEffectSystem.applyDot(e, "acid", 3, 5, "orange", "#ffa500", 0.5);
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
    if (!defender || defender.removed) return false;
    const FERTILIZER_COST = 75;
    if (this.scene.gameState.sun < FERTILIZER_COST) {
      this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 35, "Energia insuficiente! (75 ☀️)", "#ef476f", 1.15);
      return false;
    }
    this.scene.gameState.sun -= FERTILIZER_COST;
    defender.fertilizerBoostUntil = Math.max(defender.fertilizerBoostUntil || 0, this.scene.gameState.time + 8);
    defender.hp = defender.maxHp;
    this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 35, "ADUBO! NÍVEL MÁXIMO TEMPORÁRIO (8s) 🎒✨", "#ffd54f", 1.35);
    this.scene.effectsSystem.burst(defender.x, defender.y, "#ffd54f", 25);
    this.scene.effectsSystem.sparkleBurst(defender.x, defender.y, "#ffd54f", 22);
    this.scene.effectsSystem.spawnShockwave(defender.x, defender.y, "#ffd54f", 95, 0.45);
    this.scene.soundManager.beep(880, 0.25, "sine", 0.08);
    return true;
  }

  updateDefenders(dt) {
    const boosted = this.scene.gameState.time < this.scene.gameState.attackBoostUntil;
    const vegetableBoosted = this.scene.gameState.time < (this.scene.gameState.vegetableBoostUntil || 0);
    const globalFrenzy = this.scene.gameState.time < (this.scene.gameState.frenzyUntil || 0);
    const globalSpeedMult = (boosted ? 2 : 1) * (vegetableBoosted ? 1.25 : 1) * (globalFrenzy ? 1.35 : 1);

    for (const defender of this.scene.gameState.defenders) {
      if (!defender || defender.removed || defender.hp <= 0) continue;

      const attackSpeedStatus = this.scene.statusEffectSystem.getAttackSpeedMultiplier(defender);
      const isFertilized = defender.fertilizerBoostUntil > this.scene.gameState.time;
      const activePower = isFertilized ? 3 : defender.powerLevel;
      const effectiveDamage = this.getEffectiveDamage(defender);
      const bananaFrenzy = defender.type === "banana" && defender.frenzyUntil > this.scene.gameState.time;
      const localSpeedMult = globalSpeedMult * (bananaFrenzy ? 2.2 : 1);
      defender.cooldownLeft -= dt * localSpeedMult * attackSpeedStatus;

      if (defender.melee) {
        if (defender.cooldownLeft <= 0) {
          const enemyInRange = this.scene.gameState.enemies.find(e => e.row === defender.row && e.hp > 0 && !e.removed && Math.abs(e.x - (defender.x + 35)) < 55);
          if (enemyInRange) {
            defender.cooldownLeft = defender.cooldown;
            if (this.scene.gameState.time > (defender.punchComboExpiresAt || 0)) defender.punchCombo = 0;
            defender.punchCombo = ((defender.punchCombo || 0) % 4) + 1;
            defender.punchComboExpiresAt = this.scene.gameState.time + 1.6;

            const comboDamage = [0, 1, 1.1, 1.2, 1.35][defender.punchCombo] || 1;
            const dmg = Math.round(effectiveDamage * (1 + activePower * 0.2) * comboDamage);
            this.scene.enemySystem.damageEnemy(enemyInRange, dmg, "#ffe135", defender.type);
            this.scene.effectsSystem.burst(enemyInRange.x, enemyInRange.y, "#ffe135", 10);

            if (defender.punchCombo === 4 && enemyInRange.hp > 0 && !enemyInRange.removed) {
              const resistance = KNOCKBACK_RESISTANCE[enemyInRange.type] ?? 1;
              if (resistance <= 0 || enemyInRange.boss) {
                this.scene.effectsSystem.spawnFloater(enemyInRange.x, enemyInRange.y - 42, "RESISTIU AO EMPURRÃO! 👑", "#ffe135", 1.05);
              } else {
                const knockback = Math.max(8, Math.round(44 * resistance));
                enemyInRange.x = Math.min(this.scene.W + 30, enemyInRange.x + knockback);
                if (enemyInRange.sprite) enemyInRange.sprite.setPosition(enemyInRange.x, enemyInRange.y);
                if (enemyInRange.shadowSprite) enemyInRange.shadowSprite.setPosition(enemyInRange.x, enemyInRange.y + 22);
                this.scene.effectsSystem.spawnFloater(enemyInRange.x, enemyInRange.y - 42, `COMBO 4x! +${knockback}px 🥊`, "#ffe135", 1.15);
              }
              defender.punchCombo = 0;
            }

            this.scene.soundManager.beep(420 + defender.punchCombo * 35, 0.06, "square", 0.04);
            if (defender.sprite) defender.sprite.setAngle(defender.punchCombo % 2 ? 15 : -15);
            setTimeout(() => { if (defender.sprite && !defender.removed) defender.sprite.setAngle(0); }, 120);
          }
        }
        continue;
      }

      if (defender.smash) {
        const enemyUnder = this.scene.gameState.enemies.find(e => e.row === defender.row && e.hp > 0 && !e.removed && Math.abs(e.x - defender.x) < 35);
        if (enemyUnder) {
          const dmg = Math.round(effectiveDamage * (1 + activePower * 0.2));
          this.scene.enemySystem.damageEnemy(enemyUnder, dmg, "#e3242b", defender.type);
          this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, `SMASH! -${dmg}🍎💥`, "#e3242b", 1.3);
          this.scene.effectsSystem.burst(defender.x, defender.y, "#e3242b", 25);
          this.scene.effectsSystem.triggerShake(10, 300);
          this.scene.soundManager.beep(120, 0.25, "sawtooth", 0.08);
          this.defeatDefender(defender, "apple-smash", { silent: true });
        }
        continue;
      }

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

      if (defender.type === "garlic") continue;

      if (defender.type === "watermelon") {
        if (defender.digesting && defender.cooldownLeft <= 0) {
          defender.digesting = false;
          if (defender.sprite) defender.sprite.clearTint();
          this.scene.effectsSystem.spawnFloater(defender.x, defender.y - 30, "Digestão pronta! 🍉", "#ff3b5c", 1.1);
        }

        if (defender.cooldownLeft <= 0) {
          const prey = this.scene.gameState.enemies
            .filter(enemy => enemy.row === defender.row && enemy.hp > 0 && !enemy.removed && Math.abs(enemy.x - (defender.x + 15)) < 65 && enemy.x >= defender.x - 15)
            .sort((a, b) => a.x - b.x)[0];
          if (prey) {
            defender.cooldownLeft = defender.cooldown;
            defender.digesting = true;
            if (defender.sprite) defender.sprite.setTint(0xff88a0);
            this.scene.soundManager.beep(160, 0.22, "sawtooth", 0.08);
            this.scene.effectsSystem.triggerShake(6, 200);
            this.scene.effectsSystem.burst(defender.x + 25, defender.y, "#ff3b5c", 18);
            if (prey.boss) {
              const bossDamage = Math.round(450 * (1 + activePower * 0.2));
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
        .filter(enemy => enemy.row === defender.row && enemy.x > defender.x - 5 && enemy.hp > 0 && !enemy.removed)
        .sort((a, b) => a.x - b.x)[0];
      if (target && defender.damage > 0 && defender.cooldownLeft <= 0) {
        defender.cooldownLeft = defender.cooldown;
        this.scene.projectileSystem.spawnProjectile(defender);
        this.scene.soundManager.beep(defender.type === "pepper" ? 260 : 520, 0.025, "square", 0.025);
      }
    }

    this.cleanupDefeated();
  }
}
