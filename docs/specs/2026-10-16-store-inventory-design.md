# Design — S4.2 Loja + Inventário de consumíveis

**Data:** 2026-10-16
**Spec:** `2026-10-16-store-inventory-spec.md`

## 1. Owners

| Responsabilidade | Owner | Estado autoritativo |
|---|---|---|
| Catálogo de itens | `config.js` (`ITEMS`) | constante |
| Inventário persistente | `EconomyService` | `localStorage[STORAGE_KEYS.inventory]` |
| Compra / consumo | `EconomyService` (`buyItem`/`consumeItem`) | atômico |
| Efeito em partida | `MainScene.useConsumable(id)` | `gameState` |
| Loja e barra de itens | `UIManager` | DOM |

```text
config.js (ITEMS, inventory helpers)
      │
      ▼
EconomyService ──► MainScene.useConsumable  (sun | repair)
      │
      └──────────► UIManager (renderStore, purchaseItem, consumable tray)
```

## 2. Persistência

`STORAGE_KEYS.inventory` = JSON `{ "<itemId>": <count> }`.
`readInventory()` sanitiza (só ids de `ITEMS`, inteiros `>= 0`, remove zeros);
`saveInventory()` grava apenas contagens `> 0`.

## 3. API nova (`EconomyService`)

```js
getInventory() -> { [id]: count }        // sempre com todas as chaves de ITEMS
getItem(id) -> number
getItemCost(id) -> number | null
grantItem(id, amount = 1) -> number      // contagem resultante (0 se id inválido)
consumeItem(id, amount = 1) -> { ok, reason?, count }   // unknown | invalid | insufficient
buyItem(id, amount = 1) -> { ok, reason?, item?, amount?, cost?, balance?, count? }
```

`buyItem` = `spendSeeds(price * amount)` + `grantItem(id, amount)`; falha de sementes não grava
inventário (nada parcial).

## 4. Efeitos (`ITEMS[id].effect`)

- `sun` → `gameState.sun += value` (+ floater/burst).
- `repair` → `gameState.houseHp = min(maxHouseHp, houseHp + value)`.

Aplicados **após** o consumo confirmado; só em `phase === "playing"` e sem pausa.

## 5. UI

- **Loja** (`#storeItemsGrid`), dentro do overlay-card, depois do deck builder: linha por item com
  ícone, nome, descrição, contagem `xN` e botão de compra (`disabled` se `seeds < price`).
  Re-renderizada ao abrir o overlay e após cada compra.
- **Barra de consumíveis** (`#consumableTray`), entre a bandeja de defensores e a prévia de onda:
  construída **uma vez** (estrutura fixa); a cada `syncUi` apenas contagem/`disabled`/`hidden` são
  atualizados (sem rebind de listeners por frame). Fica `hidden` enquanto o inventário estiver vazio.

## 6. Invariantes

- Nenhuma contagem negativa; nenhuma compra sem débito correspondente.
- `syncUi` não reconstrói DOM (só atualiza estado dos botões).
- Sem `Math.random`; sem escrita direta de `inventory` fora de `config.js`/`EconomyService`.
- Aditivo: nenhum caminho existente passa a depender do inventário.
