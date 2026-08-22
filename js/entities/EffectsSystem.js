"use strict";

class EffectsSystem {
  constructor(scene) {
    this.scene = scene;
  }

  triggerShake(intensity = 8, duration = 250) {
    this.scene.cameras.main.shake(duration, intensity / 1000);
  }

  flashScreen(colorHex = "#ffffff", duration = 150) {
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    this.scene.cameras.main.flash(duration, (color >> 16) & 255, (color >> 8) & 255, color & 255);
  }

  burst(x, y, colorHex, count) {
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.random(35, 160);
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(color, 1);
      gfx.fillCircle(0, 0, this.random(3, 7));
      this.scene.gameState.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        gravityY: 120, maxLife: this.random(0.35, 0.75), life: this.random(0.35, 0.75), gfx
      });
    }
  }

  sparkleBurst(x, y, colorHex = "#ffd43b", count = 14) {
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.random(50, 180);
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(color, 1);
      
      // Draw 4-point star shape
      const size = this.random(4, 9);
      gfx.fillRect(-size / 2, -1, size, 2);
      gfx.fillRect(-1, -size / 2, 2, size);

      this.scene.gameState.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        gravityY: 40, spin: this.random(-10, 10), maxLife: this.random(0.4, 0.8), life: this.random(0.4, 0.8), gfx
      });
    }
  }

  spawnSugarDust(x, y, colorHex = "#ff9f1c", count = 16) {
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.random(20, 110);
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(color, 0.85);
      gfx.fillRect(-2, -2, this.random(3, 6), this.random(3, 6));

      this.scene.gameState.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40,
        gravityY: 220, maxLife: this.random(0.4, 0.85), life: this.random(0.4, 0.85), gfx
      });
    }
  }

  spawnShockwave(x, y, colorHex = "#ffffff", maxRadius = 90, duration = 0.4) {
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const gfx = this.scene.add.graphics();
    this.scene.gameState.particles.push({
      type: "shockwave",
      x, y, radius: 10, maxRadius, duration, elapsed: 0, color, gfx, life: duration
    });
  }

  spawnFloater(x, y, text, color, scale = 1) {
    const textObj = this.scene.add.text(x, y, text, {
      fontFamily: "Trebuchet MS",
      fontSize: "19px",
      fontStyle: "bold",
      color: color,
      stroke: "#10251c",
      strokeThickness: 4
    }).setOrigin(0.5).setScale(0.2); // Start small for pop animation

    this.scene.gameState.floaters.push({
      x, y, startY: y, targetY: y - 42, text, color,
      targetScale: scale, elapsed: 0, life: 0.9, textObj
    });
  }

  updateParticles(dt) {
    for (const p of this.scene.gameState.particles) {
      if (p.type === "shockwave") {
        p.elapsed += dt;
        const progress = Math.min(1, p.elapsed / p.duration);
        const radius = p.radius + (p.maxRadius - p.radius) * progress;
        p.life = 1 - progress;
        if (p.gfx) {
          p.gfx.clear();
          p.gfx.lineStyle(4 * (1 - progress), p.color, (1 - progress) * 0.85);
          p.gfx.strokeCircle(p.x, p.y, radius);
          if (progress >= 1) p.gfx.destroy();
        }
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.gravityY) p.vy += p.gravityY * dt;
        p.life -= dt;
        if (p.gfx) {
          p.gfx.setPosition(p.x, p.y);
          if (p.spin) p.gfx.setRotation(p.gfx.rotation + p.spin * dt);
          p.gfx.setAlpha(Math.max(0, p.life / (p.maxLife || 0.5)));
          if (p.life <= 0) p.gfx.destroy();
        }
      }
    }
    this.scene.gameState.particles = this.scene.gameState.particles.filter(p => p.life > 0);
  }

  updateFloaters(dt) {
    for (const f of this.scene.gameState.floaters) {
      f.elapsed += dt;
      f.life -= dt;
      if (f.textObj) {
        // Pop scaling easing
        const popProgress = Math.min(1, f.elapsed / 0.15);
        const currentScale = f.targetScale * (0.2 + popProgress * 0.9 - Math.sin(popProgress * Math.PI) * 0.1);
        f.y = f.startY - (f.startY - f.targetY) * Math.min(1, f.elapsed / 0.9);
        
        f.textObj.setPosition(f.x, f.y);
        f.textObj.setScale(currentScale);
        f.textObj.setAlpha(Math.min(1, f.life * 2.5));
        if (f.life <= 0) f.textObj.destroy();
      }
    }
    this.scene.gameState.floaters = this.scene.gameState.floaters.filter(f => f.life > 0);
  }

  spawnSun() {
    const roll = Math.random();
    let type = "normal";
    let icon = "☀️";
    let value = 25;
    let color = "#fff06a";

    if (roll < 0.12) {
      type = "golden";
      icon = "🌟";
      value = 60;
      color = "#ffd43b";
    } else if (roll < 0.20) {
      type = "nutrient";
      icon = "💚";
      value = 30;
      color = "#69c743";
    }

    const sunObj = {
      x: this.random(this.scene.GRID_X + 30, this.scene.GRID_X + this.scene.COLS * this.scene.CELL_W - 30),
      y: -25,
      targetY: this.random(this.scene.GRID_Y + 10, this.scene.GRID_Y + this.scene.ROWS * this.scene.CELL_H - 20),
      life: 10,
      value: value,
      type: type,
      color: color,
      pulse: 0
    };
    sunObj.textObj = this.scene.add.text(sunObj.x, sunObj.y, icon, { fontSize: type === "golden" ? "42px" : "36px" }).setOrigin(0.5);
    this.scene.gameState.suns.push(sunObj);
  }

  updateSuns(dt) {
    for (const s of this.scene.gameState.suns) {
      s.pulse += dt * 4;
      s.life -= dt;
      if (s.y < s.targetY) s.y = Math.min(s.targetY, s.y + 75 * dt);
      if (s.textObj) {
        s.textObj.setPosition(s.x, s.y);
        const scale = (s.type === "golden" ? 1.15 : 1) + Math.sin(s.pulse) * 0.08;
        s.textObj.setScale(scale);
        if (s.life <= 0) {
          s.textObj.destroy();
        }
      }
    }
    this.scene.gameState.suns = this.scene.gameState.suns.filter(s => s.life > 0);
  }

  random(min, max) {
    return min + Math.random() * (max - min);
  }
}
