"use strict";

class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.audioCtx = null;
  }

  beep(frequency, duration, type = "sine", volume = 0.035) {
    if (!this.scene.soundOn) return;
    try {
      this.audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      const oscillator = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(this.audioCtx.destination);
      oscillator.start();
      oscillator.stop(this.audioCtx.currentTime + duration);
    } catch (_) { /* sound is optional */ }
  }
}
