"use strict";

// S4.1 — Owner único da economia persistente:
//   * saldo de Sementes de Girassol 🌻;
//   * conjunto de defensores desbloqueados.
// Nenhuma outra tela deve gravar estas chaves diretamente.
class EconomyService {
  normalize(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.floor(value));
  }

  getSeeds() {
    return readNumber(STORAGE_KEYS.sunflowerSeeds) || 0;
  }

  grantSeeds(amount) {
    const balance = this.getSeeds() + this.normalize(amount);
    writeStorage(STORAGE_KEYS.sunflowerSeeds, balance);
    return balance;
  }

  canAfford(amount) {
    const value = this.normalize(amount);
    return value > 0 && this.getSeeds() >= value;
  }

  spendSeeds(amount) {
    const value = this.normalize(amount);
    const balance = this.getSeeds();
    if (value <= 0) return { ok: false, reason: "invalid", balance };
    if (balance < value) return { ok: false, reason: "insufficient", balance };

    const remaining = balance - value;
    writeStorage(STORAGE_KEYS.sunflowerSeeds, remaining);
    return { ok: true, balance: remaining };
  }

  getUnlockCost(type) {
    const def = DEFENDERS[type];
    return def && Number.isFinite(def.seedPrice) ? def.seedPrice : null;
  }

  isUnlocked(type) {
    const def = DEFENDERS[type];
    if (!def) return false;
    if (def.seedPrice === 0) return true;
    return readUnlockedCards().includes(type);
  }

  getUnlocked() {
    return [...readUnlockedCards()];
  }

  unlock(type) {
    if (!DEFENDERS[type]) return { ok: false, reason: "unknown" };
    const cost = DEFENDERS[type].seedPrice;
    if (cost === 0) return { ok: false, reason: "free" };
    if (this.isUnlocked(type)) return { ok: false, reason: "already" };

    const spend = this.spendSeeds(cost);
    if (!spend.ok) return { ok: false, reason: "insufficient", cost, balance: spend.balance };

    saveUnlockedCards([...readUnlockedCards(), type]);
    return { ok: true, type, cost, balance: spend.balance };
  }
}
