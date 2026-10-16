# Design — S4.1 EconomyService

**Data:** 2026-10-16
**Spec:** `2026-10-16-economy-service-spec.md`

## 1. Owner e dependências

```text
config.js            EconomyService.js          DeckService.js
 (STORAGE_KEYS,       (wallet + unlocks)   ◄──   (delega isUnlocked)
  DEFENDERS,          ▲            ▲
  readNumber,         │            │
  writeStorage,       │            └── uiManager / MainScene
  readUnlockedCards)  │
```

| Responsabilidade | Owner | Estado autoritativo |
|---|---|---|
| Saldo de Sementes 🌻 | `EconomyService` | `localStorage[STORAGE_KEYS.sunflowerSeeds]` |
| Conjunto desbloqueado | `EconomyService` | `localStorage[STORAGE_KEYS.unlockedCards]` |
| Consequências no deck | `DeckService` | consome `EconomyService.isUnlocked` |

## 2. API

```js
new EconomyService()

getSeeds() -> number
grantSeeds(amount) -> number            // saldo resultante (amount inválido = 0)
canAfford(amount) -> boolean
spendSeeds(amount) -> { ok, reason?, balance }   // reason: "invalid" | "insufficient"
getUnlockCost(type) -> number | null    // null se tipo desconhecido
isUnlocked(type) -> boolean
unlock(type) -> { ok, reason?, type?, cost?, balance? }
                // reason: "unknown" | "free" | "already" | "insufficient"
getUnlocked() -> string[]
```

## 3. Regras

- `spendSeeds`: normaliza `amount` para inteiro `>= 0`; se `<= 0` → `invalid`; se
  `saldo < amount` → `insufficient` sem debitar.
- `unlock`: valida em ordem `unknown` → `free` → `already` → `insufficient`; no sucesso,
  debita e grava a lista de desbloqueados (atômico dentro de um tick).
- Persistência exclusivamente via helpers de `config.js`.

## 4. Integração

- `main.js`: `window.economyService = new EconomyService();` antes de `new DeckService(...)`.
- `DeckService(economy)`: usa `economy?.isUnlocked(type)`; fallback local se ausente
  (mantém compatibilidade com testes em `vm`).
- `MainScene.completeWave`: `window.economyService?.grantSeeds(seedGain)` com fallback.
- `uiManager`: compra via `economyService.unlock(key)` com toasts por `reason`; contador de
  sementes via `economyService.getSeeds()`.

## 5. Invariantes

- Saldo nunca negativo.
- Nunca gasta sementes sem gravar o desbloqueio correspondente.
- Nenhuma tela grava `sunflowerSeeds`/`unlockedCards` diretamente (exceto `config.js`).
- Sem `Math.random`.
