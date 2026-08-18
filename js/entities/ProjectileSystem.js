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
      sourceType: defender.type,
      removed: false
    };
    p.textObj = this.scene.add.text(p.x, p.y, p.icon, { fontSize: "24px" }).setOrigin(0.5);
    this.scene.gameState.projectiles.push(p);
  }

  updateProjectiles(dt) {
    for (const p of this.scene.gameState.projectiles) {
      p.x += p.speed * dt;
      if (p.textObj) p.textObj.setPosition(p.x, p.y);

      if (p.sourceType === "pepper" && Math.random() < 0.4) {
        this.scene.effectsSystem.burst(p.x - 10, p.y, "#ff6b4a", 1);
      }

      const hit = this.scene.gameState.enemies.filter(e => e.row === p.row && e.hp > 0 && Math.abs(e.x - p.x) < 32).sort((a, b) => a.x - b.x)[0];
      if (!hit) {
        if (p.x >= this.scene.W + 30) {
          p.removed = true;
          if (p.textObj) p.textObj.destroy();
        }
        continue;
      }

      if (p.area) {
        for (const enemy of this.scene.gameState.enemies) {
          const distance = Math.hypot(enemy.x - hit.x, (enemy.row - hit.row) * this.scene.CELL_H);
          if (distance < 125) this.scene.enemySystem.damageEnemy(enemy, p.damage, "#f94f37", p.sourceType);
        }
        this.scene.effectsSystem.burst(hit.x, hit.y, "#ff5638", 22);
        this.scene.effectsSystem.triggerShake(8, 250);
        this.scene.soundManager.beep(95, 0.12, "sawtooth", 0.06);
      } else {
        this.scene.enemySystem.damageEnemy(hit, p.damage, p.color, p.sourceType);
        if (p.burn) {
          hit.burnUntil = this.scene.gameState.time + 3;
          hit.burnTick = 0;
          hit.burnDamage = 7;
          hit.burnSource = p.sourceType;
        }
        this.scene.effectsSystem.burst(hit.x, hit.y, p.color, 8);
      }
      p.removed = true;
      if (p.textObj) p.textObj.destroy();
    }
    this.scene.gameState.projectiles = this.scene.gameState.projectiles.filter(p => !p.removed);
  }

  updateEnemyProjectiles(dt) {
    if (!this.scene.gameState.enemyProjectiles) this.scene.gameState.enemyProjectiles = [];
    for (const ep of this.scene.gameState.enemyProjectiles) {
      ep.x -= ep.speed * dt;
      if (ep.textObj) ep.textObj.setPosition(ep.x, ep.y);

      const targetDef = this.scene.gameState.defenders.find(d => d.row === ep.row && Math.abs(d.x - ep.x) < 32 && d.hp > 0);
      if (targetDef) {
        targetDef.hp -= ep.damage;
        this.scene.effectsSystem.burst(targetDef.x, targetDef.y, ep.color, 12);
        this.scene.effectsSystem.spawnFloater(targetDef.x, targetDef.y - 25, `-${ep.damage}🌵`, "#ff3b9a", 1.15);
        this.scene.soundManager.beep(200, 0.05, "sawtooth", 0.03);
        if (targetDef.hp <= 0) {
          this.scene.effectsSystem.spawnFloater(targetDef.x, targetDef.y - 35, "Derrotado! 💔", "#ef476f", 1.2);
          if (targetDef.textObj) targetDef.textObj.destroy();
          this.scene.effectsSystem.burst(targetDef.x, targetDef.y, "#ef476f", 18);
        }
        ep.removed = true;
        if (ep.textObj) ep.textObj.destroy();
      } else if (ep.x < this.scene.HOUSE_X) {
        this.scene.gameState.houseHp -= 20;
        this.scene.effectsSystem.burst(this.scene.HOUSE_X, ep.y, "#ff3b9a", 12);
        this.scene.effectsSystem.spawnFloater(this.scene.HOUSE_X + 20, ep.y - 15, "-20 HP 🌵", "#ff3b9a", 1.1);
        ep.removed = true;
        if (ep.textObj) ep.textObj.destroy();
      }
    }
    this.scene.gameState.enemyProjectiles = this.scene.gameState.enemyProjectiles.filter(ep => !ep.removed && ep.x > 0);
  }
}
