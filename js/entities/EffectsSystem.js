"use strict";

class EffectsSystem {
  constructor(scene) {
    this.scene = scene;
  }

  triggerShake(intensity = 8, duration = 250) {
    this.scene.cameras.main.shake(duration, intensity / 1000);
  }

  burst(x, y, colorHex, count) {
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.random(25, 130);
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(color, 1);
      gfx.fillCircle(0, 0, this.random(2, 6));
      this.scene.gameState.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: this.random(0.3, 0.8), gfx
      });
    }
  }

  spawnFloater(x, y, text, color, scale = 1) {
    const textObj = this.scene.add.text(x, y, text, {
      fontFamily: "Trebuchet MS",
      fontSize: "18px",
      fontStyle: "bold",
      color: color,
      stroke: "#10251c",
      strokeThickness: 4
    }).setOrigin(0.5).setScale(scale);
    this.scene.gameState.floaters.push({ x, y, text, color, life: 0.8, textObj });
  }

  updateParticles(dt) {
    for (const p of this.scene.gameState.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.gfx) {
        p.gfx.setPosition(p.x, p.y);
        p.gfx.setAlpha(Math.max(0, p.life * 1.5));
        if (p.life <= 0) p.gfx.destroy();
      }
    }
    this.scene.gameState.particles = this.scene.gameState.particles.filter(p => p.life > 0);
  }

  updateFloaters(dt) {
    for (const f of this.scene.gameState.floaters) {
      f.y -= 30 * dt;
      f.life -= dt;
      if (f.textObj) {
        f.textObj.setPosition(f.x, f.y);
        f.textObj.setAlpha(Math.min(1, f.life * 2));
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
