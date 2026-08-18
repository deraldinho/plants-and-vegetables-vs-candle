"use strict";

(() => {
  window.phaserGame = null;

  window.phaserConfig = {
    type: Phaser.CANVAS,
    renderType: Phaser.CANVAS,
    width: 1000,
    height: 620,
    parent: "gameContainer",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MainScene]
  };

  // Initialize UI Manager
  window.uiManager = new UIManager();
})();
