"use strict";

class StatusEffectSystem {
  constructor(scene) {
    this.scene = scene;
  }

  ensure(entity) {
    if (!entity.statusEffects) entity.statusEffects = new Map();
    return entity.statusEffects;
  }

  apply(entity, id, options = {}) {
    if (!entity || entity.removed) return null;
    const now = this.scene.gameState.time;
    const effects = this.ensure(entity);
    const currentRaw = effects.get(id);
    const current = currentRaw && currentRaw.expiresAt > now ? currentRaw : null;
    const expiresAt = now + Math.max(0, options.duration || 0);
    const inputMagnitude = Number.isFinite(options.magnitude) ? options.magnitude : 1;
    const magnitude = current && (id === "slow" || id === "guard")
      ? Math.min(current.magnitude, inputMagnitude)
      : inputMagnitude;
    const damage = Math.max(current?.damage || 0, Math.max(0, Number(options.damage) || 0));
    const effect = {
      id,
      source: options.source || current?.source || null,
      color: options.color || current?.color || "#ffffff",
      magnitude,
      damage,
      tickEvery: Math.max(0.05, Number(options.tickEvery) || 0.5),
      nextTickAt: current?.nextTickAt && current.nextTickAt > now ? current.nextTickAt : now + Math.max(0.05, Number(options.tickEvery) || 0.5),
      expiresAt: Math.max(current?.expiresAt || 0, expiresAt)
    };
    effects.set(id, effect);
    return effect;
  }

  remove(entity, id) {
    return !!entity?.statusEffects?.delete(id);
  }

  get(entity, id) {
    const effect = entity?.statusEffects?.get(id);
    if (!effect) return null;
    if (effect.expiresAt <= this.scene.gameState.time) {
      entity.statusEffects.delete(id);
      return null;
    }
    return effect;
  }

  applySlow(entity, duration, multiplier, source = null) {
    return this.apply(entity, "slow", {
      duration,
      magnitude: Math.min(1, Math.max(0.2, Number(multiplier) || 0.6)),
      source
    });
  }

  applyGuard(entity, duration, damageMultiplier = 0.5, source = "broccoli") {
    return this.apply(entity, "guard", {
      duration,
      magnitude: Math.min(1, Math.max(0.05, Number(damageMultiplier) || 0.5)),
      source
    });
  }

  applyDot(entity, id, duration, damage, source, color, tickEvery = 0.5) {
    return this.apply(entity, id, { duration, damage, source, color, tickEvery });
  }

  applyPapainShred(enemy, duration = 6.0) {
    if (!enemy || enemy.removed) return null;
    const current = this.get(enemy, "papain_shred");
    const currentStacks = current ? (current.stacks || 1) : 0;
    const newStacks = Math.min(5, currentStacks + 1);
    const magnitudeBonus = newStacks * 0.05;
    const effect = this.apply(enemy, "papain_shred", {
      duration,
      magnitude: 1 + magnitudeBonus,
      source: "papaya"
    });
    if (effect) {
      effect.stacks = newStacks;
      effect.magnitudeBonus = magnitudeBonus;
    }
    return effect;
  }

  applySugarBind(defender, duration = 4.0) {
    if (this.hasImmunity(defender)) return null;
    return this.apply(defender, "sugar_bind", { duration, magnitude: 0, source: "caramel_sticky" });
  }

  applyBubbleSnare(defender, duration = 4.0) {
    if (this.hasImmunity(defender)) return null;
    return this.apply(defender, "bubble_snare", { duration, magnitude: 0, source: "bubblegum_jumper" });
  }

  applyToxicWilting(defender, duration = 5.0, dps = 4, source = "strawberry_shooter") {
    if (this.hasImmunity(defender)) return null;
    const current = this.get(defender, "toxic_wilting");
    const newDps = current ? Math.min(8, current.damage + 2) : dps;
    return this.apply(defender, "toxic_wilting", {
      duration,
      damage: newDps,
      color: "#e63946",
      source,
      tickEvery: 1.0
    });
  }

  applySugarRot(defender, duration = 6.0, dps = 6, source = "candy_catapult_boss") {
    if (this.hasImmunity(defender)) return null;
    const current = this.get(defender, "sugar_rot");
    if (current) {
      this.applySugarBind(defender, 3.0);
      return this.apply(defender, "sugar_rot", {
        duration,
        damage: 12,
        color: "#9d0208",
        source,
        tickEvery: 1.0
      });
    }
    return this.apply(defender, "sugar_rot", {
      duration,
      damage: dps,
      color: "#9d0208",
      source,
      tickEvery: 1.0
    });
  }

  applyImmunity(defender, duration = 8.0) {
    this.remove(defender, "toxic_wilting");
    this.remove(defender, "sugar_rot");
    this.remove(defender, "sugar_bind");
    this.remove(defender, "bubble_snare");
    return this.apply(defender, "immune_buff", { duration, magnitude: 1, source: "fruit_habit" });
  }

  hasImmunity(defender) {
    return !!this.get(defender, "immune_buff");
  }

  isImmobilized(defender) {
    return !!(this.get(defender, "sugar_bind") || this.get(defender, "bubble_snare"));
  }

  cleanseAllDefenders() {
    for (const defender of (this.scene.gameState?.defenders || [])) {
      this.remove(defender, "toxic_wilting");
      this.remove(defender, "sugar_rot");
      this.remove(defender, "sugar_bind");
      this.remove(defender, "bubble_snare");
      this.remove(defender, "slow");
    }
  }

  popAllBubbles() {
    for (const defender of (this.scene.gameState?.defenders || [])) {
      if (this.get(defender, "bubble_snare")) {
        this.remove(defender, "bubble_snare");
        this.scene.effectsSystem?.burst(defender.x, defender.y, "#ff85a2", 15);
      }
    }
    for (const enemy of (this.scene.gameState?.enemies || [])) {
      if (!enemy.removed && enemy.type === "bubblegum_jumper" && enemy.shield > 0) {
        enemy.shield = 0;
        this.scene.effectsSystem?.burst(enemy.x, enemy.y, "#ff85a2", 18);
        this.scene.effectsSystem?.spawnFloater(enemy.x, enemy.y - 35, "BOLHA ESTOURADA! 💥", "#ff85a2", 1.15);
      }
    }
  }

  getAttackSpeedMultiplier(entity) {
    if (this.isImmobilized(entity)) return 0;
    let mult = this.get(entity, "slow")?.magnitude ?? 1;
    if (this.get(entity, "toxic_wilting")) mult *= 0.75;
    if (this.get(entity, "sugar_rot")) mult *= 0.65;
    return mult;
  }

  getMovementSpeedMultiplier(entity) {
    return this.get(entity, "slow")?.magnitude ?? 1;
  }

  getDamageTakenMultiplier(entity) {
    const guard = this.get(entity, "guard")?.magnitude ?? 1;
    const papain = this.get(entity, "papain_shred");
    const papainBonus = papain?.magnitudeBonus || 0;
    return guard * (1 + papainBonus);
  }

  getEnemyDamageMultiplier(enemy) {
    return this.getDamageTakenMultiplier(enemy);
  }

  updateDefender(defender) {
    if (!defender || defender.removed || defender.hp <= 0 || !defender.statusEffects) return;
    const now = this.scene.gameState.time;
    for (const [id, effect] of [...defender.statusEffects.entries()]) {
      if (effect.expiresAt <= now) {
        defender.statusEffects.delete(id);
        continue;
      }
      if ((id === "toxic_wilting" || id === "sugar_rot") && effect.damage > 0) {
        while (!defender.removed && defender.hp > 0 && effect.nextTickAt <= now && effect.nextTickAt < effect.expiresAt + 0.0001) {
          this.scene.defenderSystem.damageDefender(defender, effect.damage, {
            color: effect.color,
            suffix: "☠️",
            burstColor: effect.color,
            reason: id
          });
          effect.nextTickAt += effect.tickEvery;
        }
      }
    }
  }

  updateEnemy(enemy) {
    if (!enemy || enemy.removed || enemy.hp <= 0 || !enemy.statusEffects) return;
    const now = this.scene.gameState.time;

    for (const [id, effect] of [...enemy.statusEffects.entries()]) {
      if (effect.expiresAt <= now) {
        enemy.statusEffects.delete(id);
        continue;
      }
      if ((id !== "burn" && id !== "acid") || effect.damage <= 0) continue;

      while (!enemy.removed && enemy.hp > 0 && effect.nextTickAt <= now && effect.nextTickAt < effect.expiresAt + 0.0001) {
        this.scene.enemySystem.damageEnemy(enemy, effect.damage, effect.color, effect.source);
        if (!enemy.removed) this.scene.effectsSystem.burst(enemy.x, enemy.y, effect.color, 3);
        effect.nextTickAt += effect.tickEvery;
      }
    }
  }
}
