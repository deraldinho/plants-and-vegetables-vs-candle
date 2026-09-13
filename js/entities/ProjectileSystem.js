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

  spawnPapayaBurst(defender) {
    const isSuper = this.scene.gameState.time < (this.scene.gameState.fruitBuffUntil || 0);
    const rows = isSuper ? [defender.row - 1, defender.row, defender.row + 1].filter(r => r >= 0 && r < this.scene.ROWS) : [defender.row];
    const dmg = this.getEffectiveProjectileDamage(defender);

    for (const r of rows) {
      for (let i = 0; i < 3; i++) {
        const delayOffset = i * 22;
        const y = this.scene.GRID_Y + r * this.scene.CELL_H + this.scene.CELL_H / 2 - 2;
        const p = {
          x: defender.x + 22 - delayOffset,
          y,
          row: r,
          speed: 340,
          damage: dmg,
          color: isSuper ? "#ffd700" : "#ff9933",
          icon: isSuper ? "✨" : "●",
          papayaSeed: true,
          hitsLeft: 1,
          sourceType: "papaya",
          removed: false
        };
        p.textObj = this.scene.add.text(p.x, p.y, p.icon, { fontSize: "20px" }).setOrigin(0.5);
        this.scene.gameState.projectiles.push(p);
      }
    }
  }

  spawnKiwi(defender) {
    const p = {
      x: defender.x + 25,
      y: defender.y - 3,
      row: defender.row,
      speed: 280,
      damage: 70,
      color: "#7ea310",
      icon: "🥝",
      bowling: true,
      hitCount: 0,
      hitsLeft: 4,
      sourceType: "kiwi",
      removed: false
    };
    p.textObj = this.scene.add.text(p.x, p.y, p.icon, { fontSize: "28px" }).setOrigin(0.5);
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

      if (p.bowling && !p.bouncedBroccoli) {
        const broccoliInRow = this.scene.gameState.defenders.find(d => !d.removed && d.type === "broccoli" && d.row === p.row && Math.abs(d.x - p.x) < 45);
        if (broccoliInRow) {
          p.bouncedBroccoli = true;
          this.scene.effectsSystem.spawnShockwave(p.x, p.y, "#7ea310", 110, 0.4);
          this.scene.soundManager.beep(300, 0.2, "sawtooth", 0.08);
          this.scene.effectsSystem.spawnFloater(p.x, p.y - 30, "RICOCHETE DE BRÓCOLIS! 🥦⚡", "#7ea310", 1.2);
          for (const e of this.scene.gameState.enemies) {
            if (!e.removed && e.hp > 0 && Math.abs(e.row - p.row) <= 1 && Math.abs(e.x - p.x) < 130) {
              this.scene.statusEffectSystem.applySlow(e, 1.5, 0.1, "kiwi_broccoli_stun");
              this.scene.effectsSystem.burst(e.x, e.y, "#b8e34d", 8);
            }
          }
        }
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

      if (p.papayaSeed) {
        this.scene.statusEffectSystem.applyPapainShred(hit, 6.0);
      }

      if (p.bowling) {
        p.hitCount = (p.hitCount || 0) + 1;
        const dmg = p.hitCount === 1 ? 70 : (p.hitCount === 2 ? 50 : (p.hitCount === 3 ? 35 : 25));
        this.scene.enemySystem.damageEnemy(hit, dmg, "#7ea310", "kiwi");
        const res = KNOCKBACK_RESISTANCE[hit.type] ?? 1;
        if (res > 0 && !hit.boss) {
          const knock = Math.round(48 * res);
          hit.x = Math.min(this.scene.W + 30, hit.x + knock);
          if (hit.sprite) hit.sprite.setX(hit.x);
          if (hit.shadowSprite) hit.shadowSprite.setX(hit.x);
        }
        if (p.hitCount === 3) {
          this.scene.gameState.sun += 25;
          this.scene.effectsSystem.spawnFloater(p.x, p.y - 35, "STRIKE DE FRUTAS! +25 ☀️", "#ffd700", 1.25);
          this.scene.soundManager.beep(660, 0.15, "sine", 0.06);
        }
      } else if (p.area) {
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

      if (ep.parabolic) {
        ep.t += dt / (ep.duration || 1.4);
        ep.x = ep.startX + (ep.targetX - ep.startX) * ep.t;
        const arcH = Math.sin(Math.min(1, ep.t) * Math.PI) * 160;
        ep.y = ep.startY + (ep.targetY - ep.startY) * ep.t - arcH;
        if (ep.textObj) ep.textObj.setPosition(ep.x, ep.y);

        if (ep.t >= 1) {
          const col = Math.max(0, Math.min(this.scene.COLS - 1, Math.floor((ep.targetX - this.scene.GRID_X) / this.scene.CELL_W)));
          const row = ep.row;
          const targetDef = state.defenders.find(d => !d.removed && d.hp > 0 && d.col === col && d.row === row);

          if (targetDef) {
            this.scene.defenderSystem.damageDefender(targetDef, 35, {
              reason: "catapult-bomb",
              color: "#4a044e",
              burstColor: "#d946ef",
              suffix: "💣"
            });
            this.scene.statusEffectSystem.applySugarRot(targetDef, 6.0, 6);
          }

          for (const neighbor of state.defenders) {
            if (!neighbor.removed && neighbor !== targetDef) {
              const dCol = Math.abs(neighbor.col - col);
              const dRow = Math.abs(neighbor.row - row);
              if ((dCol === 1 && dRow === 0) || (dCol === 0 && dRow === 1)) {
                this.scene.defenderSystem.damageDefender(neighbor, 15, {
                  reason: "catapult-shrapnel",
                  color: "#d946ef",
                  suffix: "💥"
                });
              }
            }
          }

          this.scene.effectsSystem.spawnToxicPuddle(col, row, 8.0, 4);
          this.scene.effectsSystem.burst(ep.targetX, ep.targetY, "#d946ef", 24);
          this.scene.effectsSystem.triggerShake(10, 300);
          this.scene.soundManager.beep(90, 0.25, "sawtooth", 0.08);

          ep.removed = true;
          if (ep.textObj) ep.textObj.destroy();
        }
        continue;
      }

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
        const toxicCandy = ep.effect === "toxic_candy";
        const bubbleSnare = ep.effect === "bubble_snare";
        const sugarBind = ep.effect === "sugar_bind";

        if (toxicCandy) {
          const wasKilled = targetDef.hp <= ep.damage;
          this.scene.defenderSystem.damageDefender(targetDef, ep.damage, {
            reason: "strawberry-toxic-candy",
            color: "#e11d48",
            burstColor: "#9333ea",
            suffix: "🍓"
          });
          this.scene.statusEffectSystem.applyToxicWilting(targetDef, 5.0, 4);
          if (wasKilled || targetDef.hp <= 0 || targetDef.removed) {
            this.scene.effectsSystem.spawnToxicPuddle(targetDef.col, targetDef.row, 6.0, 4);
          }
        } else if (bubbleSnare) {
          this.scene.statusEffectSystem.applyBubbleSnare(targetDef, 4.0);
          this.scene.effectsSystem.burst(targetDef.x, targetDef.y, "#ff85a2", 15);
          this.scene.effectsSystem.spawnFloater(targetDef.x, targetDef.y - 35, "PRESO NA BOLHA! 🫧", "#ff85a2", 1.2);
        } else if (sugarBind) {
          this.scene.defenderSystem.damageDefender(targetDef, ep.damage || 10, {
            reason: "caramel-bind",
            color: "#d97706",
            burstColor: "#f59e0b",
            suffix: "🍮"
          });
          this.scene.statusEffectSystem.applySugarBind(targetDef, 4.0);
          this.scene.effectsSystem.spawnFloater(targetDef.x, targetDef.y - 35, "GOSMA APRISIONADORA! 🍮", "#d97706", 1.2);
        } else {
          this.scene.defenderSystem.damageDefender(targetDef, ep.damage, {
            reason: flame ? "candle-flame" : (brigadeiro ? "brigadeiro-projectile" : "enemy-projectile"),
            slowDuration: brigadeiro ? (ep.slowDuration || 5) : 0,
            slowMultiplier: brigadeiro ? (ep.slowMultiplier || 0.7) : undefined,
            slowSource: brigadeiro ? "gummy_brigadeiro" : null,
            color: ep.color || (brigadeiro ? "#8b4b2b" : "#ff3b9a"),
            burstColor: ep.color || "#ff3b9a",
            suffix: flame ? "🔥" : (brigadeiro ? "🍫" : "🌵")
          });
        }

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
