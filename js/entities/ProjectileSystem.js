"use strict";

class ProjectileSystem {
  constructor(scene) {
    this.scene = scene;
  }

  getEffectiveProjectileDamage(defender) {
    if (!defender) return 0;
    if (defender.fertilizerBoostUntil > this.scene.gameState.time) {
      const base = DEFENDERS[defender.type]?.damage || defender.damage || 0;
      return Math.max(defender.damage || 0, Math.round(base * (1 + 3 * 0.35)));
    }
    return defender.damage || 0;
  }

  spawnProjectile(defender) {
    const p = {
      x: defender.x + 25,
      y: defender.y - 3,
      row: defender.row,
      speed: defender.type === "carrot" ? 360 : 280,
      damage: this.getEffectiveProjectileDamage(defender),
      color: defender.color,
      icon: defender.projectile,
      area: defender.area,
      burn: defender.burn,
      acid: defender.acid,
      acidPool: defender.acidPool,
      piercing: defender.piercing,
      hitsLeft: defender.piercing ? 3 : 1,
      sourceType: defender.type,
      removed: false
    };
    p.textObj = this.scene.add.text(p.x, p.y, p.icon, { fontSize: "24px" }).setOrigin(0.5);
    this.scene.gameState.projectiles.push(p);
  }

  updateProjectiles(dt) {
    for (const p of this.scene.gameState.projectiles) {
      if (!p || p.removed) continue;

      const previousX = p.x;
      p.x += p.speed * dt;
      if (p.textObj) p.textObj.setPosition(p.x, p.y);

      if (p.sourceType === "pepper" && this.scene.randomFx(0, 1) < 0.4) {
        this.scene.effectsSystem.burst(p.x - 10, p.y, "#ff6b4a", 1);
      }

      if (p.sourceType === "pineapple" && this.scene.randomFx(0, 1) < 0.3) {
        this.scene.effectsSystem.burst(p.x - 8, p.y, "#b8e04a", 1);
      }

      const minX = Math.min(previousX, p.x) - 32;
      const maxX = Math.max(previousX, p.x) + 32;
      const hit = this.scene.gameState.enemies
        .filter(e => !e.removed && e.row === p.row && e.hp > 0 && e.x >= minX && e.x <= maxX && (!p.hitEnemies || !p.hitEnemies.has(e)))
        .sort((a, b) => a.x - b.x)[0];

      if (!hit) {
        if (p.x >= this.scene.W + 30) {
          p.removed = true;
          if (p.textObj) p.textObj.destroy();
        }
        continue;
      }

      if (!p.hitEnemies) p.hitEnemies = new Set();
      p.hitEnemies.add(hit);

      if (p.area) {
        for (const enemy of this.scene.gameState.enemies) {
          if (enemy.removed || enemy.hp <= 0) continue;
          const distance = Math.hypot(enemy.x - hit.x, (enemy.row - hit.row) * this.scene.CELL_H);
          if (distance < 125) this.scene.enemySystem.damageEnemy(enemy, p.damage, "#f94f37", p.sourceType);
        }
        this.scene.effectsSystem.burst(hit.x, hit.y, "#ff5638", 22);
        this.scene.effectsSystem.triggerShake(8, 250);
        this.scene.soundManager.beep(95, 0.12, "sawtooth", 0.06);
      } else {
        if (p.acid && hit.shield > 0) {
          this.scene.enemySystem.meltShield(hit, 35, p.sourceType || "orange", "#ffa500");
        }

        this.scene.enemySystem.damageEnemy(hit, p.damage, p.color, p.sourceType);

        if (p.burn && hit.hp > 0 && !hit.removed) {
          this.scene.statusEffectSystem.applyDot(hit, "burn", 3, 7, p.sourceType, "#ff5638", 0.5);
        }
        if (p.acid && hit.hp > 0 && !hit.removed) {
          this.scene.statusEffectSystem.applyDot(hit, "acid", 3, 5, p.sourceType, "#ffa500", 0.5);
        }

        if (p.acidPool) {
          this.scene.effectsSystem.spawnAcidPool(hit.x, hit.row, 5, 18, p.sourceType);
        }

        this.scene.effectsSystem.burst(hit.x, hit.y, p.color, 8);
      }

      p.hitsLeft -= 1;
      if (p.hitsLeft <= 0) {
        p.removed = true;
        if (p.textObj) p.textObj.destroy();
      }
    }
    this.scene.gameState.projectiles = this.scene.gameState.projectiles.filter(p => p && !p.removed);
  }

  updateEnemyProjectiles(dt) {
    const state = this.scene.gameState;
    if (!state.enemyProjectiles) state.enemyProjectiles = [];

    for (const ep of state.enemyProjectiles) {
      if (!ep || ep.removed) continue;

      const previousX = ep.x;
      ep.x -= (ep.speed || 300) * dt;
      if (ep.textObj) ep.textObj.setPosition(ep.x, ep.y);

      const minX = Math.min(previousX, ep.x) - 32;
      const maxX = Math.max(previousX, ep.x) + 32;
      const targetDef = state.defenders
        .filter(d => d && !d.removed && d.hp > 0 && d.row === ep.row && d.x >= minX && d.x <= maxX)
        .sort((a, b) => b.x - a.x)[0];

      if (targetDef) {
        const brigadeiro = ep.effect === "brigadeiro";
        const flame = ep.effect === "flame";
        this.scene.defenderSystem.damageDefender(targetDef, ep.damage, {
          reason: flame ? "candle-flame" : (brigadeiro ? "brigadeiro-projectile" : "enemy-projectile"),
          slowDuration: brigadeiro ? (ep.slowDuration || 5) : 0,
          slowMultiplier: brigadeiro ? (ep.slowMultiplier || 0.7) : undefined,
          slowSource: brigadeiro ? "gummy_brigadeiro" : null,
          color: ep.color || (brigadeiro ? "#8b4b2b" : "#ff3b9a"),
          burstColor: ep.color || "#ff3b9a",
          suffix: flame ? "🔥" : (brigadeiro ? "🍫" : "🌵")
        });

        if (brigadeiro && !targetDef.removed) {
          this.scene.effectsSystem.spawnFloater(targetDef.x, targetDef.y - 45, "BRIGADEIRO GRUDENTO! -30% ATAQUE 🍫", "#8b4b2b", 1.05);
        } else if (flame && !targetDef.removed) {
          this.scene.effectsSystem.spawnFloater(targetDef.x, targetDef.y - 45, "CHAMA DA VELA! 🔥", "#ff6600", 1.05);
        }

        this.scene.soundManager.beep(flame ? 280 : (brigadeiro ? 145 : 200), 0.05, "sawtooth", 0.03);
        ep.removed = true;
        if (ep.textObj) ep.textObj.destroy();
      } else if (ep.x < this.scene.HOUSE_X) {
        const houseDamage = ep.effect === "brigadeiro" ? Math.max(15, Math.round(ep.damage * 0.6)) : 20;
        state.houseHp -= houseDamage;
        state.houseDamagedThisWave = true;
        this.scene.effectsSystem.burst(this.scene.HOUSE_X, ep.y, ep.color || "#ff3b9a", 12);
        this.scene.effectsSystem.spawnFloater(this.scene.HOUSE_X + 20, ep.y - 15, `-${houseDamage} HP`, ep.color || "#ff3b9a", 1.1);
        ep.removed = true;
        if (ep.textObj) ep.textObj.destroy();
      }
    }

    this.scene.defenderSystem.cleanupDefeated();
    state.enemyProjectiles = state.enemyProjectiles.filter(ep => ep && !ep.removed && ep.x > 0);
  }
}
