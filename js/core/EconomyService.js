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

  // --- Inventário de consumíveis (S4.2) ---

  getInventory() {
    const stored = readInventory();
    const inventory = {};
    for (const id of Object.keys(ITEMS)) inventory[id] = stored[id] || 0;
    return inventory;
  }

  getItem(id) {
    if (!ITEMS[id]) return 0;
    return readInventory()[id] || 0;
  }

  getItemCost(id) {
    return ITEMS[id] ? ITEMS[id].price : null;
  }

  grantItem(id, amount = 1) {
    if (!ITEMS[id]) return 0;
    const inventory = readInventory();
    inventory[id] = (inventory[id] || 0) + this.normalize(amount);
    saveInventory(inventory);
    return inventory[id];
  }

  consumeItem(id, amount = 1) {
    if (!ITEMS[id]) return { ok: false, reason: "unknown", count: 0 };
    const value = this.normalize(amount);
    const current = this.getItem(id);
    if (value <= 0) return { ok: false, reason: "invalid", count: current };
    if (current < value) return { ok: false, reason: "insufficient", count: current };

    const inventory = readInventory();
    inventory[id] = current - value;
    saveInventory(inventory);
    return { ok: true, count: inventory[id] };
  }

  buyItem(id, amount = 1) {
    if (!ITEMS[id]) return { ok: false, reason: "unknown" };
    const value = this.normalize(amount);
    if (value <= 0) return { ok: false, reason: "invalid" };

    const cost = ITEMS[id].price * value;
    const spend = this.spendSeeds(cost);
    if (!spend.ok) return { ok: false, reason: "insufficient", cost, balance: spend.balance };

    const count = this.grantItem(id, value);
    return { ok: true, item: id, amount: value, cost, balance: spend.balance, count };
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
