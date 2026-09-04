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
    const current = effects.get(id);
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

  getAttackSpeedMultiplier(entity) {
    return this.get(entity, "slow")?.magnitude ?? 1;
  }

  getMovementSpeedMultiplier(entity) {
    return this.get(entity, "slow")?.magnitude ?? 1;
  }

  getDamageTakenMultiplier(entity) {
    return this.get(entity, "guard")?.magnitude ?? 1;
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
