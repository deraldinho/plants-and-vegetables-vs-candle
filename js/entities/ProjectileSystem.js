"use strict";

class ProjectileSystem {
  constructor(scene) {
    this.scene = scene;
  }

  spawnProjectile(defender) {
    const p = {
      x: defender.x + 25,
      y: defender.y - 3,
      row: defender.row,
      speed: defender.type === "carrot" ? 360 : 280,
      damage: defender.damage,
      color: defender.color,
      icon: defender.projectile,
      area: defender.area,
      burn: defender.burn,
      acid: defender.acid,
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
      if (p.removed) continue;
      p.x += p.speed * dt;
      if (p.textObj) p.textObj.setPosition(p.x, p.y);

      if (p.sourceType === "pepper" && Math.random() < 0.4) {
        this.scene.effectsSystem.burst(p.x - 10, p.y, "#ff6b4a", 1);
      }

      const hit = this.scene.gameState.enemies
        .filter(e => !e.removed && e.row === p.row && e.hp > 0 && Math.abs(e.x - p.x) < 32 && (!p.hitEnemies || !p.hitEnemies.has(e)))
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
          const melted = Math.min(hit.shield, 35);
          hit.shield -= melted;
          this.scene.effectsSystem.spawnFloater(hit.x, hit.y - 44, `ÁCIDO -${melted} ESCUDO 🍊`, "#ffa500", 1.0);
          if (hit.shield <= 0) {
            this.scene.effectsSystem.burst(hit.x, hit.y, "#72d9ff", 18);
            this.scene.effectsSystem.spawnFloater(hit.x, hit.y - 58, "ESCUDO DERRETIDO!", "#ffa500", 1.1);
          }
        }

        this.scene.enemySystem.damageEnemy(hit, p.damage, p.color, p.sourceType);
        if (p.burn && hit.hp > 0 && !hit.removed) {
          hit.burnUntil = this.scene.gameState.time + 3;
          hit.burnTick = 0;
          hit.burnDamage = 7;
          hit.burnSource = p.sourceType;
        }
        if (p.acid && hit.hp > 0 && !hit.removed) {
          hit.acidUntil = this.scene.gameState.time + 3;
          hit.acidTick = 0;
          hit.acidDamage = 5;
          hit.acidSource = p.sourceType;
        }
        this.scene.effectsSystem.burst(hit.x, hit.y, p.color, 8);
      }

      p.hitsLeft -= 1;
      if (p.hitsLeft <= 0) {
        p.removed = true;
        if (p.textObj) p.textObj.destroy();
      }
    }
    this.scene.gameState.projectiles = this.scene.gameState.projectiles.filter(p => !p.removed);
  }

  updateEnemyProjectiles(dt) {
    if (!this.scene.gameState.enemyProjectiles) this.scene.gameState.enemyProjectiles = [];

    for (const ep of this.scene.gameState.enemyProjectiles) {
      if (ep.removed) continue;
      ep.x -= ep.speed * dt;
      if (ep.textObj) ep.textObj.setPosition(ep.x, ep.y);

      const targetDef = this.scene.gameState.defenders.find(d => !d.removed && d.row === ep.row && Math.abs(d.x - ep.x) < 32 && d.hp > 0);
      if (targetDef) {
        const brigadeiro = ep.effect === "brigadeiro";
        this.scene.defenderSystem.damageDefender(targetDef, ep.damage, {
          reason: brigadeiro ? "brigadeiro-projectile" : "enemy-projectile",
          slowDuration: brigadeiro ? (ep.slowDuration || 5) : 0,
          slowMultiplier: brigadeiro ? (ep.slowMultiplier || 0.7) : undefined,
          color: brigadeiro ? "#8b4b2b" : (ep.color || "#ff3b9a"),
          burstColor: ep.color || "#ff3b9a",
          suffix: brigadeiro ? "🍫" : "🌵"
        });

        if (brigadeiro && !targetDef.removed) {
          this.scene.effectsSystem.spawnFloater(targetDef.x, targetDef.y - 45, "BRIGADEIRO GRUDENTO! -30% ATAQUE 🍫", "#8b4b2b", 1.05);
        }

        this.scene.soundManager.beep(brigadeiro ? 145 : 200, 0.05, "sawtooth", 0.03);
        ep.removed = true;
        if (ep.textObj) ep.textObj.destroy();
      } else if (ep.x < this.scene.HOUSE_X) {
        const houseDamage = ep.effect === "brigadeiro" ? Math.max(15, Math.round(ep.damage * 0.6)) : 20;
        this.scene.gameState.houseHp -= houseDamage;
        this.scene.gameState.houseDamagedThisWave = true;
        this.scene.effectsSystem.burst(this.scene.HOUSE_X, ep.y, ep.color || "#ff3b9a", 12);
        this.scene.effectsSystem.spawnFloater(this.scene.HOUSE_X + 20, ep.y - 15, `-${houseDamage} HP`, ep.color || "#ff3b9a", 1.1);
        ep.removed = true;
        if (ep.textObj) ep.textObj.destroy();
      }
    }

    this.scene.defenderSystem.cleanupDefeated();
    this.scene.gameState.enemyProjectiles = this.scene.gameState.enemyProjectiles.filter(ep => !ep.removed && ep.x > 0);
  }
}
