"use strict";

class TextureGenerator {
  static generateAll(scene) {
    if (scene.textures.exists("tex_shadow")) return;

    this.createShadowTexture(scene);

    // Defenders
    this.createPotatoTexture(scene, false);
    this.createPotatoTexture(scene, true);
    this.createGarlicTexture(scene);
    this.createCornTexture(scene);
    this.createCarrotTexture(scene);
    this.createBroccoliTexture(scene);
    this.createPepperTexture(scene);
    this.createTomatoTexture(scene);
    this.createWatermelonTexture(scene);
    this.createBananaTexture(scene);
    this.createOrangeTexture(scene);
    this.createStrawberryTexture(scene);
    this.createAppleTexture(scene);
    this.createPineappleTexture(scene);
    this.createCauliflowerTexture(scene);
    this.createFertilizerTexture(scene);

    // Enemies
    this.createGummyTexture(scene);
    this.createLollipopTexture(scene);
    this.createCupcakeTexture(scene);
    this.createMarshmallowTexture(scene);
    this.createChocolateTexture(scene);
    this.createSodaTexture(scene);
    this.createGumTexture(scene);
    this.createCandleTexture(scene);

    // Bosses
    this.createGumBossTexture(scene);
    this.createLollipopBossTexture(scene);
    this.createConfeiteiroTexture(scene);
    this.createCakeRobotTexture(scene);
  }

  static createShadowTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(32, 16, 28, 12);
    g.generateTexture("tex_shadow", 64, 32);
    g.destroy();
  }

  // --- DEFENDERS ---

  static createPotatoTexture(scene, armed = false) {
    const key = armed ? "tex_potato_armed" : "tex_potato";
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Potato Body
    g.fillStyle(0xd2b48c, 1);
    g.fillRoundedRect(8, 12, 48, 44, 18);
    g.fillStyle(0xbc986a, 1);
    g.fillCircle(20, 24, 3);
    g.fillCircle(44, 38, 4);
    g.fillCircle(30, 48, 3);

    // Eyes
    g.fillStyle(0x17352a, 1);
    g.fillCircle(24, 30, 4);
    g.fillCircle(40, 30, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(23, 29, 1.5);
    g.fillCircle(39, 29, 1.5);

    if (armed) {
      // Fuse & Bomb Light
      g.lineStyle(3, 0x5c4033, 1);
      g.lineBetween(32, 12, 38, 6);
      g.lineBetween(38, 6, 44, 2);

      g.fillStyle(0xff4500, 1);
      g.fillCircle(45, 2, 5);
      g.fillStyle(0xffd700, 1);
      g.fillCircle(45, 2, 2.5);
    }

    g.generateTexture(key, 64, 64);
    g.destroy();
  }

  static createGarlicTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Bulb Base
    g.fillStyle(0xf8f8f0, 1);
    g.fillCircle(32, 38, 22);
    g.fillStyle(0xe8e8d8, 1);
    g.fillTriangle(32, 8, 14, 34, 50, 34);

    // Ridges
    g.lineStyle(1.5, 0xd0d0c0, 0.8);
    g.strokeCircle(32, 38, 22);

    // Eyes & Blush
    g.fillStyle(0xffb6c1, 0.6);
    g.fillCircle(20, 42, 5);
    g.fillCircle(44, 42, 5);

    g.fillStyle(0x17352a, 1);
    g.fillCircle(24, 36, 3.5);
    g.fillCircle(40, 36, 3.5);

    g.generateTexture("tex_garlic", 64, 64);
    g.destroy();
  }

  static createCornTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Husk Leaf Left/Right
    g.fillStyle(0x48a94f, 1);
    g.fillTriangle(6, 56, 18, 24, 32, 58);
    g.fillTriangle(58, 56, 46, 24, 32, 58);

    // Cob Body
    g.fillStyle(0xffd43b, 1);
    g.fillRoundedRect(20, 10, 24, 44, 12);

    // Kernel Details
    g.fillStyle(0xf0b800, 1);
    for (let y = 16; y <= 46; y += 8) {
      for (let x = 24; x <= 40; x += 8) {
        g.fillCircle(x, y, 2.5);
      }
    }

    // Eyes
    g.fillStyle(0x17352a, 1);
    g.fillCircle(27, 24, 3.5);
    g.fillCircle(37, 24, 3.5);

    g.generateTexture("tex_corn", 64, 64);
    g.destroy();
  }

  static createCarrotTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Leaf Tops
    g.fillStyle(0x48a94f, 1);
    g.fillTriangle(32, 4, 24, 20, 32, 22);
    g.fillTriangle(32, 4, 40, 20, 32, 22);

    // Carrot Body
    g.fillStyle(0xff8b2c, 1);
    g.fillTriangle(14, 20, 50, 20, 32, 60);

    // Ridges & Face
    g.lineStyle(2, 0xe06a00, 0.8);
    g.lineBetween(22, 30, 30, 30);
    g.lineBetween(34, 40, 42, 40);

    g.fillStyle(0x17352a, 1);
    g.fillCircle(27, 26, 3.5);
    g.fillCircle(37, 26, 3.5);

    g.generateTexture("tex_carrot", 64, 64);
    g.destroy();
  }

  static createBroccoliTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Stem
    g.fillStyle(0x8bc34a, 1);
    g.fillRoundedRect(25, 34, 14, 26, 5);

    // Floret Top
    g.fillStyle(0x2e7d32, 1);
    g.fillCircle(22, 26, 16);
    g.fillCircle(42, 26, 16);
    g.fillCircle(32, 18, 18);

    g.fillStyle(0x43a047, 1);
    g.fillCircle(32, 24, 14);

    // Face
    g.fillStyle(0xffffff, 1);
    g.fillCircle(26, 26, 3.5);
    g.fillCircle(38, 26, 3.5);
    g.fillStyle(0x17352a, 1);
    g.fillCircle(26, 26, 2);
    g.fillCircle(38, 26, 2);

    g.generateTexture("tex_broccoli", 64, 64);
    g.destroy();
  }

  static createPepperTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Stem
    g.fillStyle(0x2e7d32, 1);
    g.fillRect(30, 4, 5, 12);

    // Body
    g.fillStyle(0xef476f, 1);
    g.fillTriangle(14, 16, 50, 16, 30, 58);
    g.fillStyle(0xb71c1c, 1);
    g.fillTriangle(30, 16, 50, 16, 30, 58);

    // Eyes (Fierce)
    g.fillStyle(0xffd700, 1);
    g.fillCircle(24, 26, 4.5);
    g.fillCircle(38, 26, 4.5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(24, 26, 2.5);
    g.fillCircle(38, 26, 2.5);

    g.generateTexture("tex_pepper", 64, 64);
    g.destroy();
  }

  static createTomatoTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Tomato Body
    g.fillStyle(0xe93835, 1);
    g.fillCircle(32, 34, 24);

    // Highlight
    g.fillStyle(0xff8a80, 0.8);
    g.fillCircle(24, 22, 6);

    // Stem Cap
    g.fillStyle(0x43a047, 1);
    g.fillTriangle(32, 6, 26, 14, 38, 14);
    g.fillTriangle(32, 18, 26, 10, 38, 10);

    // Face
    g.fillStyle(0x17352a, 1);
    g.fillCircle(24, 34, 3.5);
    g.fillCircle(40, 34, 3.5);

    g.generateTexture("tex_tomato", 64, 64);
    g.destroy();
  }

  static createWatermelonTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Green Rind
    g.fillStyle(0x2e7d32, 1);
    g.beginPath();
    g.arc(32, 32, 28, 0, Math.PI, false);
    g.fillPath();

    // White Inner Rind
    g.fillStyle(0xe8f5e9, 1);
    g.beginPath();
    g.arc(32, 32, 24, 0, Math.PI, false);
    g.fillPath();

    // Red Flesh
    g.fillStyle(0xff3b5c, 1);
    g.beginPath();
    g.arc(32, 32, 21, 0, Math.PI, false);
    g.fillPath();

    // Seeds
    g.fillStyle(0x17352a, 1);
    g.fillCircle(22, 40, 2);
    g.fillCircle(32, 44, 2);
    g.fillCircle(42, 40, 2);

    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(25, 36, 4);
    g.fillCircle(39, 36, 4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(25, 36, 2);
    g.fillCircle(39, 36, 2);

    g.generateTexture("tex_watermelon", 64, 64);
    g.destroy();
  }

  // --- ENEMIES ---

  static createGummyTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Translucent Bear Body
    g.fillStyle(0xff4081, 0.9);
    g.fillCircle(20, 16, 8); // Left Ear
    g.fillCircle(44, 16, 8); // Right Ear
    g.fillRoundedRect(16, 20, 32, 36, 12); // Body

    // Muzzle & Eyes
    g.fillStyle(0xff80ab, 0.9);
    g.fillCircle(32, 34, 7);
    g.fillStyle(0x000000, 1);
    g.fillCircle(26, 28, 2.5);
    g.fillCircle(38, 28, 2.5);
    g.fillCircle(32, 33, 2);

    g.generateTexture("tex_gummy", 64, 64);
    g.destroy();
  }

  static createLollipopTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Stick
    g.fillStyle(0xffffff, 1);
    g.fillRect(30, 32, 4, 30);

    // Candy Swirl Disc
    g.fillStyle(0xff1744, 1);
    g.fillCircle(32, 24, 20);

    g.fillStyle(0xffffff, 1);
    g.fillCircle(32, 24, 14);
    g.fillStyle(0xff1744, 1);
    g.fillCircle(32, 24, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(32, 24, 3);

    g.generateTexture("tex_lollipop", 64, 64);
    g.destroy();
  }

  static createCupcakeTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Wrapper Cup
    g.fillStyle(0xab47bc, 1);
    g.fillTriangle(16, 32, 48, 32, 42, 58);
    g.fillTriangle(16, 32, 22, 58, 42, 58);

    // Frosting Cloud
    g.fillStyle(0xf8bbd0, 1);
    g.fillCircle(22, 30, 10);
    g.fillCircle(42, 30, 10);
    g.fillCircle(32, 22, 14);

    // Cherry Top
    g.fillStyle(0xd50000, 1);
    g.fillCircle(32, 10, 6);

    // Eyes
    g.fillStyle(0x000000, 1);
    g.fillCircle(26, 26, 2.5);
    g.fillCircle(38, 26, 2.5);

    g.generateTexture("tex_cupcake", 64, 64);
    g.destroy();
  }

  static createMarshmallowTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Fluffy Body
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(16, 16, 32, 38, 14);
    g.lineStyle(2, 0xe0e0e0, 1);
    g.strokeRoundedRect(16, 16, 32, 38, 14);

    // Cute Blush & Eyes
    g.fillStyle(0xff80ab, 0.6);
    g.fillCircle(22, 38, 4);
    g.fillCircle(42, 38, 4);

    g.fillStyle(0x000000, 1);
    g.fillCircle(25, 32, 3);
    g.fillCircle(39, 32, 3);

    g.generateTexture("tex_marshmallow", 64, 64);
    g.destroy();
  }

  static createChocolateTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Chocolate Bar
    g.fillStyle(0x4e342e, 1);
    g.fillRoundedRect(14, 14, 36, 42, 6);

    // Segments
    g.fillStyle(0x3e2723, 1);
    g.fillRect(18, 18, 13, 15);
    g.fillRect(33, 18, 13, 15);
    g.fillRect(18, 36, 13, 15);
    g.fillRect(33, 36, 13, 15);

    // Shield Emblem Overlay
    g.fillStyle(0xb0bec5, 0.85);
    g.fillCircle(32, 35, 10);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeCircle(32, 35, 10);

    g.generateTexture("tex_chocolate", 64, 64);
    g.destroy();
  }

  static createSodaTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Cup Body
    g.fillStyle(0x00e676, 1);
    g.fillTriangle(18, 18, 46, 18, 40, 58);
    g.fillTriangle(18, 18, 24, 58, 40, 58);

    // Lid & Straw
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(16, 14, 32, 6, 3);

    g.fillStyle(0xff3d00, 1);
    g.fillRect(34, 2, 4, 16);

    // Eyes
    g.fillStyle(0x000000, 1);
    g.fillCircle(27, 32, 3);
    g.fillCircle(37, 32, 3);

    g.generateTexture("tex_soda", 64, 64);
    g.destroy();
  }

  static createGumTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Bubble Sphere
    g.fillStyle(0xab47bc, 0.95);
    g.fillCircle(32, 32, 22);

    // Highlight
    g.fillStyle(0xea80fc, 0.8);
    g.fillCircle(24, 22, 7);

    // Sticky Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(26, 32, 4);
    g.fillCircle(38, 32, 4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(26, 32, 2);
    g.fillCircle(38, 32, 2);

    g.generateTexture("tex_gum", 64, 64);
    g.destroy();
  }

  static createCandleTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Wax Body
    g.fillStyle(0xfff8e1, 1);
    g.fillRoundedRect(18, 22, 28, 40, 6);

    // Wax Drips
    g.fillStyle(0xffecb3, 1);
    g.fillCircle(22, 30, 4);
    g.fillCircle(40, 36, 5);

    // Wick
    g.fillStyle(0x424242, 1);
    g.fillRect(31, 14, 2, 8);

    // Flame Outer
    g.fillStyle(0xff3d00, 1);
    g.fillTriangle(32, 0, 24, 16, 40, 16);

    // Flame Inner
    g.fillStyle(0xffea00, 1);
    g.fillTriangle(32, 4, 27, 14, 37, 14);

    // Boss Crown / Face
    g.fillStyle(0x000000, 1);
    g.fillCircle(26, 36, 3.5);
    g.fillCircle(38, 36, 3.5);

    g.generateTexture("tex_candle", 64, 64);
    g.destroy();
  }

  // --- BOSSES ---

  static createGumBossTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Giant Bubble Body
    g.fillStyle(0x8e24aa, 0.95);
    g.fillCircle(40, 40, 34);

    g.fillStyle(0xe040fb, 0.85);
    g.fillCircle(28, 26, 10);

    // Crown
    g.fillStyle(0xffd700, 1);
    g.fillTriangle(25, 8, 30, 0, 35, 12);
    g.fillTriangle(35, 12, 40, 0, 45, 12);
    g.fillTriangle(45, 12, 50, 0, 55, 8);

    // Face
    g.fillStyle(0xffffff, 1);
    g.fillCircle(30, 38, 6);
    g.fillCircle(50, 38, 6);
    g.fillStyle(0x000000, 1);
    g.fillCircle(30, 38, 3);
    g.fillCircle(50, 38, 3);

    g.generateTexture("tex_gum_boss", 80, 80);
    g.destroy();
  }

  static createLollipopBossTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Heavy Stick
    g.fillStyle(0xffffff, 1);
    g.fillRect(37, 40, 6, 38);

    // Giant Swirl
    g.fillStyle(0xd50000, 1);
    g.fillCircle(40, 30, 28);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(40, 30, 20);
    g.fillStyle(0xd50000, 1);
    g.fillCircle(40, 30, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(40, 30, 5);

    // Crown
    g.fillStyle(0xffd700, 1);
    g.fillTriangle(25, 4, 40, -4, 55, 4);

    g.generateTexture("tex_lollipop_boss", 80, 80);
    g.destroy();
  }

  static createBananaTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Banana Body
    g.fillStyle(0xffe135, 1);
    g.fillRoundedRect(14, 18, 36, 42, 14);
    // Boxing Gloves
    g.fillStyle(0xd50000, 1);
    g.fillCircle(12, 34, 9);
    g.fillCircle(52, 34, 9);
    // Eyes & Smile
    g.fillStyle(0x17352a, 1);
    g.fillCircle(25, 28, 3.5);
    g.fillCircle(39, 28, 3.5);
    g.generateTexture("tex_banana", 64, 64);
    g.destroy();
  }

  static createOrangeTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Orange Body
    g.fillStyle(0xffa500, 1);
    g.fillCircle(32, 34, 23);
    g.fillStyle(0xffc04d, 0.8);
    g.fillCircle(24, 24, 6);
    // Leaf Stem
    g.fillStyle(0x2e7d32, 1);
    g.fillTriangle(32, 8, 26, 14, 38, 14);
    // Eyes
    g.fillStyle(0x17352a, 1);
    g.fillCircle(25, 34, 3.5);
    g.fillCircle(39, 34, 3.5);
    g.generateTexture("tex_orange", 64, 64);
    g.destroy();
  }

  static createStrawberryTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Strawberry Heart Body
    g.fillStyle(0xff2a4b, 1);
    g.fillTriangle(12, 20, 52, 20, 32, 58);
    g.fillCircle(24, 20, 12);
    g.fillCircle(40, 20, 12);
    // Seeds
    g.fillStyle(0xffd700, 0.9);
    g.fillCircle(24, 32, 1.5);
    g.fillCircle(40, 32, 1.5);
    g.fillCircle(32, 42, 1.5);
    // Leaf Cap
    g.fillStyle(0x2e7d32, 1);
    g.fillTriangle(32, 6, 20, 14, 44, 14);
    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(26, 26, 3);
    g.fillCircle(38, 26, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(26, 26, 1.5);
    g.fillCircle(38, 26, 1.5);
    g.generateTexture("tex_strawberry", 64, 64);
    g.destroy();
  }

  static createAppleTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Red Apple Body
    g.fillStyle(0xe3242b, 1);
    g.fillCircle(24, 34, 20);
    g.fillCircle(40, 34, 20);
    g.fillStyle(0xff6b6b, 0.7);
    g.fillCircle(20, 26, 6);
    // Stem & Leaf
    g.fillStyle(0x5c4033, 1);
    g.fillRect(31, 6, 3, 10);
    g.fillStyle(0x2e7d32, 1);
    g.fillTriangle(34, 10, 44, 4, 38, 14);
    // Eyes
    g.fillStyle(0x17352a, 1);
    g.fillCircle(25, 34, 3.5);
    g.fillCircle(39, 34, 3.5);
    g.generateTexture("tex_apple", 64, 64);
    g.destroy();
  }

  static createPineappleTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Leaf Crown
    g.fillStyle(0x2e7d32, 1);
    g.fillTriangle(32, 2, 24, 18, 40, 18);
    g.fillTriangle(24, 6, 16, 20, 32, 20);
    g.fillTriangle(40, 6, 32, 20, 48, 20);
    // Oval Pineapple Body
    g.fillStyle(0xe4b419, 1);
    g.fillRoundedRect(16, 18, 32, 42, 12);
    // Spikes Texture
    g.lineStyle(1.5, 0x8b6508, 0.7);
    g.lineBetween(18, 26, 46, 50);
    g.lineBetween(46, 26, 18, 50);
    // Eyes
    g.fillStyle(0x17352a, 1);
    g.fillCircle(26, 32, 3.5);
    g.fillCircle(38, 32, 3.5);
    g.generateTexture("tex_pineapple", 64, 64);
    g.destroy();
  }

  static createCauliflowerTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Outer Leaves
    g.fillStyle(0x388e3c, 1);
    g.fillTriangle(6, 56, 18, 24, 32, 58);
    g.fillTriangle(58, 56, 46, 24, 32, 58);
    // White Dense Head
    g.fillStyle(0xf5f5f5, 1);
    g.fillCircle(22, 28, 15);
    g.fillCircle(42, 28, 15);
    g.fillCircle(32, 18, 17);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(32, 26, 14);
    // Mystic Glow Eyes
    g.fillStyle(0x8e24aa, 1);
    g.fillCircle(26, 28, 4);
    g.fillCircle(38, 28, 4);
    g.fillStyle(0x00e676, 1);
    g.fillCircle(26, 28, 2);
    g.fillCircle(38, 28, 2);
    g.generateTexture("tex_cauliflower", 64, 64);
    g.destroy();
  }

  static createFertilizerTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Sack Body
    g.fillStyle(0x8d6e63, 1);
    g.fillRoundedRect(14, 16, 36, 42, 8);
    // Tie Top
    g.fillStyle(0x5d4037, 1);
    g.fillRoundedRect(20, 10, 24, 8, 4);
    // Super Star Emblem
    g.fillStyle(0xffd54f, 1);
    g.fillTriangle(32, 24, 24, 38, 40, 38);
    g.fillTriangle(32, 42, 24, 28, 40, 28);
    g.generateTexture("tex_fertilizer", 64, 64);
    g.destroy();
  }

  static createConfeiteiroTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Apron / Dark Coat
    g.fillStyle(0x2b2b2b, 1);
    g.fillRoundedRect(20, 36, 40, 42, 10);
    g.fillStyle(0xd50000, 1);
    g.fillRect(36, 36, 8, 42); // Red Scarf / Ribbon

    // Face / Head
    g.fillStyle(0xffdbac, 1);
    g.fillCircle(40, 34, 18);

    // Dark Chef Mustache
    g.fillStyle(0x1a1a1a, 1);
    g.fillTriangle(26, 42, 40, 36, 34, 44);
    g.fillTriangle(54, 42, 40, 36, 46, 44);

    // Evil Glowing Eyes
    g.fillStyle(0xff1744, 1);
    g.fillCircle(33, 30, 4);
    g.fillCircle(47, 30, 4);
    g.fillStyle(0xffff00, 1);
    g.fillCircle(33, 30, 2);
    g.fillCircle(47, 30, 2);

    // Chef Hat Base & Puffs
    g.fillStyle(0xffffff, 1);
    g.fillRect(26, 16, 28, 8);
    g.fillCircle(28, 10, 10);
    g.fillCircle(40, 6, 12);
    g.fillCircle(52, 10, 10);

    // Golden Crown Accent on Hat
    g.fillStyle(0xffd700, 1);
    g.fillTriangle(35, 16, 40, 8, 45, 16);

    g.generateTexture("tex_confeiteiro", 80, 80);
    g.destroy();
  }

  static createCakeRobotTexture(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Metallic Base / Lower Cake Tier
    g.fillStyle(0x78909c, 1);
    g.fillRoundedRect(12, 42, 56, 32, 6);
    g.fillStyle(0xb0bec5, 1);
    g.fillRect(16, 46, 48, 6); // Metallic Trim

    // Middle Cake Tier (Frosted Cyber Layer)
    g.fillStyle(0x00bcd4, 1);
    g.fillRoundedRect(18, 24, 44, 22, 6);
    g.fillStyle(0xe0f7fa, 0.8);
    g.fillCircle(24, 28, 4);
    g.fillCircle(36, 28, 4);
    g.fillCircle(48, 28, 4);

    // Robot Head / Top Tier
    g.fillStyle(0x455a64, 1);
    g.fillRoundedRect(24, 8, 32, 20, 4);

    // Cyan Robot Visor / Eyes
    g.fillStyle(0x00e5ff, 1);
    g.fillRoundedRect(28, 12, 24, 6, 2);
    g.fillStyle(0xffffff, 1);
    g.fillRect(32, 14, 4, 2);

    // Candle Antenna with Spark Base
    g.fillStyle(0xff3d00, 1);
    g.fillRect(38, 0, 4, 9);
    g.fillStyle(0xffea00, 1);
    g.fillCircle(40, 0, 3);

    // Mechanical Arms
    g.fillStyle(0x37474f, 1);
    g.fillRect(4, 30, 12, 8);
    g.fillRect(64, 30, 12, 8);
    g.fillStyle(0x00e5ff, 1);
    g.fillCircle(4, 34, 4);
    g.fillCircle(76, 34, 4);

    g.generateTexture("tex_cake_robot", 80, 80);
    g.destroy();
  }
}
