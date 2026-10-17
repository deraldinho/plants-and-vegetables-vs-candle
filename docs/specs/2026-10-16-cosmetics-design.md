# Design — S4.3 Cosméticos (skins de defensores)

**Data:** 2026-10-16
**Spec:** `2026-10-16-cosmetics-spec.md`

## 1. Owners

| Responsabilidade | Owner | Estado autoritativo |
|---|---|---|
| Catálogo de skins | `config.js` (`SKINS`) | constante |
| Posse / skin equipada | `EconomyService` | `localStorage[STORAGE_KEYS.cosmetics]` |
| Compra / equipar | `EconomyService` (`unlockSkin`/`equipSkin`) | atômico |
| Aplicação do tint | `DefenderSystem.applyDefenderTint` | sprite do defensor |
| Fonte do tint | `MainScene.getSkinTint` | consulta o owner |
| Seletor na loja | `UIManager` | DOM |

```text
config.js (SKINS, cosmetics helpers)
      │
      ▼
EconomyService ──► MainScene.getSkinTint ──► DefenderSystem.applyDefenderTint ──► sprite.setTint
      │
      └──────────► UIManager.renderSkins / purchaseSkin / equipSkin
```

## 2. Persistência

`STORAGE_KEYS.cosmetics` = JSON `{ "owned": ["classic", ...], "equipped": "classic" }`.
`readCosmetics()` sanitiza (ids válidos, `classic` sempre presente, `equipped` precisa estar em
`owned`); `saveCosmetics()` grava apenas valores válidos.

## 3. API nova (`EconomyService`)

```js
getOwnedSkins() -> string[]          // sempre inclui "classic"
isSkinOwned(id) -> boolean
getEquippedSkin() -> string          // nunca inválida; cai para "classic"
getEquippedSkinTint() -> number | null
getSkinCost(id) -> number | null
unlockSkin(id) -> { ok, reason?, cost?, balance? }   // unknown | free | already | insufficient
equipSkin(id) -> { ok, reason?, equipped? }          // unknown | locked
```

`unlockSkin` = `spendSeeds(price)` + adicionar a `owned` (atômico). `equipSkin` exige posse.

## 4. Aplicação visual

`DefenderSystem.applyDefenderTint(defender)`:
`sprite.setTint(tint)` quando há skin com tint; `sprite.clearTint()` para `classic`.

Pontos de uso:

- criação do defensor (`createDefender`);
- os dois `clearTint()` do Melancia (fim da digestão) passam a **restaurar o tint base** — antes
  limpavam qualquer tint, o que apagaria a skin.

`MainScene.getSkinTint()` lê `window.economyService.getEquippedSkinTint()`.
`MainScene.refreshDefenderSkins()` reaplica o tint nos defensores já colocados (chamado pela UI ao
equipar).

## 5. UI

Nova `#skinItemsGrid` (fieldset "🎨 Cosméticos") no overlay, ao lado da loja de consumíveis:
linha por skin com ícone, nome, descrição e botão contextual:

- não possuída → **Comprar** (`price 🌻`, desabilitado sem sementes);
- possuída e não equipada → **Equipar**;
- equipada → **Equipado** (`aria-pressed="true"`, desabilitado).

## 6. Invariantes

- Cosmético puro: nenhum caminho de dano/vida/cooldown/recompensa é alterado.
- Saldo nunca negativo; nunca equipar skin não possuída.
- Um único ponto aplica tint (sem duplicação de `clearTint`/`setTint` fora do owner).
- Sem `Math.random`.
