"use strict";

class DeckService {
  constructor() {
    this.defaultDeck = ["potato", "garlic", "corn", "carrot", "broccoli"];
    this.activeDeck = this.load();
  }

  getMaxSlots() {
    return readDeckSlots();
  }

  isUnlocked(type) {
    const def = DEFENDERS[type];
    if (!def) return false;
    return def.seedPrice === 0 || readUnlockedCards().includes(type);
  }

  normalize(deck) {
    const maxSlots = this.getMaxSlots();
    const result = [];
    const seen = new Set();

    for (const type of Array.isArray(deck) ? deck : []) {
      if (seen.has(type) || !DEFENDERS[type] || !this.isUnlocked(type)) continue;
      seen.add(type);
      result.push(type);
      if (result.length >= maxSlots) break;
    }

    if (result.length === 0) {
      for (const type of this.defaultDeck) {
        if (!this.isUnlocked(type)) continue;
        result.push(type);
        if (result.length >= maxSlots) break;
      }
    }

    return result;
  }

  load() {
    let persisted = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.activeDeck);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) persisted = parsed;
    } catch (_) {}

    const normalized = this.normalize(persisted.length > 0 ? persisted : this.defaultDeck);
    this.persist(normalized);
    return normalized;
  }

  persist(deck = this.activeDeck) {
    writeStorage(STORAGE_KEYS.activeDeck, JSON.stringify(this.normalize(deck)));
  }

  getActiveDeck() {
    this.activeDeck = this.normalize(this.activeDeck);
    return [...this.activeDeck];
  }

  setActiveDeck(deck) {
    const normalized = this.normalize(deck);
    if (normalized.length === 0) return { ok: false, reason: "empty" };
    this.activeDeck = normalized;
    this.persist();
    return { ok: true, deck: this.getActiveDeck() };
  }

  add(type) {
    if (!this.isUnlocked(type)) return { ok: false, reason: "locked" };
    if (this.activeDeck.includes(type)) return { ok: true, deck: this.getActiveDeck() };
    if (this.activeDeck.length >= this.getMaxSlots()) return { ok: false, reason: "slots" };
    return this.setActiveDeck([...this.activeDeck, type]);
  }

  remove(type) {
    if (!this.activeDeck.includes(type)) return { ok: true, deck: this.getActiveDeck() };
    if (this.activeDeck.length <= 1) return { ok: false, reason: "minimum" };
    return this.setActiveDeck(this.activeDeck.filter(item => item !== type));
  }

  syncScene(scene) {
    if (!scene?.gameState) return;
    scene.gameState.activeDeck = this.getActiveDeck();
    scene.gameState.pepperUnlocked = this.isUnlocked("pepper");
  }
}
