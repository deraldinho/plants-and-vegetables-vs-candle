"use strict";

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

window.economyService = new EconomyService();
window.deckService = new DeckService(window.economyService);
window.uiManager = new UIManager(window.deckService);
window.uiManager.updateDefenderTrayUI();

// --- Adequação mobile (orientação) ---
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function updateOrientation() {
  const notice = document.getElementById("orientationNotice");
  const isPortrait = window.innerHeight > window.innerWidth;
  const shouldShow = isMobile() && isPortrait;
  if (notice) notice.hidden = !shouldShow;
  document.body.classList.toggle("game-active", !shouldShow);
}

window.addEventListener("resize", updateOrientation);
window.addEventListener("orientationchange", updateOrientation);
updateOrientation();
