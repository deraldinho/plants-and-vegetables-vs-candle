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

function currentIsPortrait() {
  // screen.orientation é mais confiável que user-agent + tamanho da janela
  if (screen && screen.orientation && screen.orientation.angle !== undefined) {
    return screen.orientation.angle === 90 || screen.orientation.angle === -90 || screen.orientation.type.startsWith("portrait");
  }
  return window.innerHeight > window.innerWidth;
}

function updateOrientation() {
  const notice = document.getElementById("orientationNotice");
  const isPortrait = currentIsPortrait();
  const shouldShow = isMobile() && isPortrait;
  if (notice) notice.hidden = !shouldShow;
  document.body.classList.toggle("game-active", !shouldShow);
  // bloqueia scroll da pagina enquanto o aviso de orientacao esta ativo
  document.body.style.overflow = shouldShow ? "hidden" : "";
}

window.addEventListener("resize", updateOrientation);
window.addEventListener("orientationchange", updateOrientation);
updateOrientation();

// botao de re-verificar orientacao no aviso de paisagem
const retryBtn = document.getElementById("orientationRetry");
if (retryBtn) {
  retryBtn.addEventListener("click", () => {
    updateOrientation();
  });
}
