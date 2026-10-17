# Walkthrough — S4.3 Cosméticos (skins de defensores)

**Objetivo:** Implementar e validar o terceiro checkpoint de S4 — cosméticos comprados com Sementes 🌻 que aplicam apenas um recolor visual (tint) nos defensores, sem tocar em nenhum valor de jogo.

---

## O que foi entregue (S4.3)

| Item | Arquivo | Descrição |
|------|---------|-----------|
| Catálogo `SKINS` | `js/config.js` | 5 skins: Clássica (0, padrão), Menta (60), Dourada (80), Sombria (100), Doce (120) |
| Persistência cosméticos | `js/config.js` | `STORAGE_KEYS.cosmetics`, `readCosmetics()` / `saveCosmetics()` (sanitização) |
| API de skins | `js/core/EconomyService.js` | `getOwnedSkins`, `isSkinOwned`, `getEquippedSkin`, `getEquippedSkinTint`, `getSkinCost`, `unlockSkin`, `equipSkin` |
| Ponto único de tint | `js/entities/DefenderSystem.js` | `applyDefenderTint(defender)` — usado na criação e nos dois sites de fim de digestão do Melancia (substituem `clearTint` avulso) |
| Fonte do tint | `js/scenes/MainScene.js` | `getSkinTint()` + `refreshDefenderSkins()` |
| UI da loja de cosméticos | `js/ui/uiManager.js` | `renderSkins()`, `purchaseSkin()`, `equipSkin()`; seletor `#skinItemsGrid` no overlay |
| HTML + CSS | `index.html` / `styles-core-integrity.css` | Fieldset `#skinSelector` + `.skin-item` / `.skin-state`; `.consumable-tray[hidden] { display: none }` corrigido |
| Testes | `tests/core-smoke.mjs` / `tests/browser-smoke.mjs` | Asserções S4.3 (catálogo, desbloqueio, compra, equipar, persistência, tint aplicado, sem bypass) |
| Especificações | `docs/specs/2026-10-16-cosmetics-*.md` | Spec + design do S4.3 |

---

## Resultados das verificações

- `npm run test:core` → **GAME_CORE_SMOKE_PASS** (inclui as asserções S4.3)
- `npm run test:browser` → **GAMEPLAY_BROWSER_SMOKE_PASS** (inclui compra/equip/tint visível no navegador)
- Atlas UI Quality Gate → **GREEN** (runId `2026-10-16T17-06-58-057Z-28184`): probes limpos, sem overflow, sem controles sem rótulo, foco visível
- Bug corrigido: `.consumable-tray[hidden] { display: none }` — a mochila agora fica **realmente oculta** com inventário vazio (antes, `display: flex` do autor sobrepunha o UA `[hidden]`)

---

## Checklist de revisão visual (artefatos anexos)

Artefatos gerados para revisão (em `C:\Users\deral\AppData\Local\Temp\opencode\`):

- `s43-desktop-overlay-cosmetics.png` — overlay aberto (desktop): loja de consumíveis + seção "Cosméticos — estilos da horta" com as 5 skins e estados (comprada/equipada/trancada)
- `s43-mobile-overlay-cosmetics.png` — idem em mobile
- `s43-desktop-cosmetics.png` / `s43-mobile-cosmetics.png` — tela inicial (cosméticos estão dentro do overlay, visível apenas pós-partida)

**Verifique:**
1. O campo "Cosméticos — estilos da horta" aparece dentro do overlay, abaixo da loja de consumíveis.
2. Todas as 5 skins são listadas com ícone, nome e descrição.
3. Estados dos botões coerentes: `Equipar` (comprada, não equipada), `Equipada` (comprada e equipada, desabilitada/aria-pressed=true), `🔒 preço 🌻` (trancada).
4. Escolher "Equipar" numa skin comprada aplica o recolor aos defensores já colocados (`refreshDefenderSkins`).
5. Comprar uma skin debita exatamente o preço e nunca deixa o saldo negativo.
6. Não é possível equipar uma skin não comprada (`locked`).
7. A mochila (consumíveis) fica oculta quando o inventário está vazio e aparece ao comprar.

**UX / acessibilidade:** botões reais (`type="button"`), `aria-label` com preço e estado, `aria-pressed` nos botões equipar, foco visível, sem controles sem rótulo (probe do gate: `unlabeledControls=0`).

---

## Determinismo e não-regressão

- Cosmético puro: nenhum caminho de dano/vida/cooldown/recompensa foi alterado (apenas `sprite.setTint`/`clearTint` no ponto único `applyDefenderTint`).
- Skin clássica `tint: null` ⇒ `clearTint()` ⇒ comportamento visual idêntico ao antes do S4.3.
- Sem `Math.random()` no runtime; todas as compras são atômicas via `spendSeeds`.
- Sem escrita direta de `localStorage` em UI/cena — o `EconomyService` é o único owner de `STORAGE_KEYS.cosmetics`.

---

## Próximo passo

Aguardar aprovação do PO para **commit + push** do S4.3. Após isso, o bloco S4 está completo (S4.1 + S4.2 + S4.3); o roadmap aponta para S4.3+ (novos Candies Level 2, balanceamento, polish audiovisual).
