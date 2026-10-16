# Walkthrough — S3 Threat Budget

**Data:** 2026-10-16
**Checkpoint:** S3 — Threat Budget / Wave Composition
**Status:** GREEN

## 1. Entregue

Ondas deixam de ser sorteio uniforme e passam a ser **compostas por orçamento de ameaça**,
com pacotes sinérgicos, mantendo determinismo por seed.

- `ENEMIES[type].threat` e `MODES[mode].threatMult` em `js/config.js`.
- `WaveRules`: `threatOf`, `threatBudget`, `escortBudget`, `availableEnemyPool`.
- `composeWave(wave, seed, mode)` em `js/utils/waveGenerator.js`; `generateProceduralWave`
  mantido como wrapper.
- Pacotes: `sticky_pack`, `shield_wall`, `support_line`, `rush`, `artillery` (com estreias
  garantidas na onda de desbloqueio).
- Cache-busting `?v=` atualizado em `index.html`.

## 2. Evidência de testes

| Comando | Resultado |
|---|---|
| `node --check js/config.js js/core/WaveRules.js js/utils/waveGenerator.js tests/*.mjs` | OK |
| `npm run test:core` | **GAME_CORE_SMOKE_PASS** |
| `npm run test:browser` (http://127.0.0.1:8080, seed 582914) | **GAMEPLAY_BROWSER_SMOKE_PASS** |

Novas asserções de core (TDD, escritas antes da implementação — RED confirmado como
`composeWave is not defined`): budget monotônico e ordenado por modo; soma de ameaça dentro
do orçamento de escolta; gating por onda; bosses só em ondas de boss; estreias
`rush` (onda 5) e `artillery` (onda 6); determinismo por seed; ausência de `Math.random`.

Asserções novas no browser: `composeWave`/`WaveRules.threatBudget`/`escortBudget` carregam no
navegador, budget cresce com a onda, composição determinística, onda 6 traz artilharia e a
`spawnQueue` expõe `threat`.

## 3. Composição observada (seed 582914, normal)

```text
wave | escort budget | escort spent | bosses | distinct types
   1 |             7 |          6.8 |      0 | gummy,lollipop
   5 |            11 |          9.8 |      1 | bubblegum_jumper,cupcake,gummy,marshmallow,soda
   6 |            22 |         19.8 |      0 | ... gummy_brigadeiro ... strawberry_shooter
  26 |            45 |         42.4 |      5 | ... 5 chefes ...
```

## 4. Atlas UI Quality Gate

- Runner: `~/.atlas/quality-gate/ui-gate.mjs` → `--url http://127.0.0.1:8080`
  `--project "C:\Users\deral\Fruit and Vegetable vs Candle"` `--flow flow.json`.
- runId final: `2026-10-16T16-02-59-825Z-39240` (viewports 390x844 / 768x1024 / 1440x900).
  Reexecutado após normalização de EOL (CRLF) em `waveGenerator.js`, que mudou o fingerprint do
  projeto mas **não os hashes das capturas** (idênticos) — alteração puramente cosmética.
- Probes: sem overflow horizontal, sem controles/imagens sem rótulo, título presente,
  foco visível após Tab. Único console error: `favicon.ico 404` (pré-existente, não bloqueante).
- Revisão visual independente: **APPROVED**, 0 issues, hashes verificados.
- `--finalize` → **status GREEN, exit 0**.

## 5. Riscos / impacto

- Curva de dificuldade alterada de forma intencional; tuning fino fica para o S6.
- Sem alteração de stats de inimigos, recompensas, `StatusEffectSystem` ou UI.
- `spawnQueue` recebeu o campo aditivo `threat`; consumidores permanecem compatíveis.

## 6. Arquivos

Modificados: `js/config.js`, `js/core/WaveRules.js`, `js/utils/waveGenerator.js`,
`index.html`, `tests/core-smoke.mjs`, `tests/browser-smoke.mjs`, `README.md`,
`docs/Ideia.md`, `docs/CORE_INTEGRITY_S2.md`.
Novos: `docs/specs/2026-10-16-threat-budget-spec.md`,
`docs/specs/2026-10-16-threat-budget-design.md`, `implementation_plan.md`, `walkthrough.md`.

## 7. Próxima ação

S4 — Economia / Loja / Inventário (ou o bloco que o PO priorizar). Sem commit/push/deploy
sem aprovação.

---

# Walkthrough — S4.1 EconomyService

**Data:** 2026-10-16
**Checkpoint:** S4.1 — owner único da economia (Sementes 🌻 + desbloqueios)
**Status:** GREEN

## 1. Entregue

`EconomyService` (`js/core/EconomyService.js`) é o único lugar que grava
`STORAGE_KEYS.sunflowerSeeds` e `STORAGE_KEYS.unlockedCards`.

- `getSeeds`, `grantSeeds`, `canAfford`, `spendSeeds` (nunca negativo),
  `getUnlockCost`, `isUnlocked`, `getUnlocked`, `unlock` (atômico).
- `DeckService.isUnlocked` delega ao `EconomyService` (com fallback para testes em `vm`).
- `MainScene.grantSeeds` (sem escrita direta no `localStorage`).
- `uiManager.purchaseUnlock` + contador de sementes via `EconomyService`.
- `main.js` instancia `window.economyService`; `index.html` carrega o novo script.

## 2. Evidência de testes

| Comando | Resultado |
|---|---|
| `node --check` (6 arquivos) | OK |
| `npm run test:core` | **GAME_CORE_SMOKE_PASS** |
| `npm run test:browser` (seed 582914) | **GAMEPLAY_BROWSER_SMOKE_PASS** |

Novas asserções de core (RED antes da implementação): carteira persiste entre instâncias;
`spendSeeds` rejeita negativo/zero/acima do saldo sem debitar; `unlock` rejeita
`unknown`/`free`/`insufficient`/`already`; sucesso debita o `seedPrice` e persiste;
saldo nunca negativo; UI e cena **não** gravam `sunflowerSeeds` diretamente.

Browser: `economyService` no boot, `deckService.economy` vinculado, `grantSeeds` soma,
`unlock` rejeita saldo insuficiente, saldo nunca negativo.

## 3. Atlas UI Quality Gate

- runId final: `2026-10-16T16-38-36-547Z-30384` (390x844 / 768x1024 / 1440x900).
- Probes limpos; hashes das capturas idênticos aos runs anteriores (UI inalterada).
- Revisão visual independente: **APPROVED**, 0 issues.
- `--finalize` → **status GREEN, exit 0**.

## 4. Riscos / impacto

- Nenhuma mudança de custos, recompensas ou balanceamento.
- Inventário de consumíveis e skins/cosméticos permanecem para S4.2+.

## 5. Arquivos

Modificados: `js/core/DeckService.js`, `js/main.js`, `js/scenes/MainScene.js`,
`js/ui/uiManager.js`, `index.html`, `tests/core-smoke.mjs`, `tests/browser-smoke.mjs`,
`README.md`, `docs/Ideia.md`, `docs/CORE_INTEGRITY_S2.md`, `docs/DOCUMENTATION.md`.
Novos: `js/core/EconomyService.js`, `docs/specs/2026-10-16-economy-service-spec.md`,
`docs/specs/2026-10-16-economy-service-design.md`.

## 6. Próxima ação

S4.2 — inventário de consumíveis (ex.: Adubo) e loja, ou o bloco que o PO priorizar.

---

# Walkthrough — S4.2 Loja + Inventário de consumíveis

**Data:** 2026-10-16
**Checkpoint:** S4.2 — loja de Sementes e mochila utilizável em partida
**Status:** GREEN

## 1. Entregue

- `ITEMS` em `js/config.js` (catálogo) + `STORAGE_KEYS.inventory` + `readInventory`/`saveInventory`.
- `EconomyService` ganhou o inventário: `getInventory`, `getItem`, `getItemCost`, `grantItem`,
  `consumeItem`, `buyItem` (compra = débito + item, atômica; nunca negativo).
- `MainScene.useConsumable(id)` é o owner do efeito (`sun` +75 / `repair` +150, com teto de vida).
- `uiManager`: `renderStore`/`purchaseItem` (loja no overlay) e
  `renderConsumableTray`/`syncConsumableTray`/`useConsumable` (mochila no HUD).
- `index.html`: `#storeItemsGrid` no overlay e `#consumableTray` (oculta enquanto o inventário
  estiver vazio). CSS novo em `styles-core-integrity.css`.

## 2. Evidência de testes

| Comando | Resultado |
|---|---|
| `node --check` (5 arquivos) | OK |
| `npm run test:core` | **GAME_CORE_SMOKE_PASS** |
| `npm run test:browser` (seed 582914) | **GAMEPLAY_BROWSER_SMOKE_PASS** |

Core (RED antes da implementação): catálogo válido; inventário expõe todos os itens; consumo sem
estoque e acima do saldo rejeitados sem alterar o inventário; `buyItem` sem sementes não gasta nem
concede; compra debita `price * qty` e persiste; UI/cena não gravam `inventory` diretamente;
`MainScene` consome via owner; sem `Math.random`.

Browser: loja renderiza todos os itens; mochila oculta com inventário vazio; compra via UI debita o
preço exato e adiciona o item; usar o consumível aplica +75 de Energia e consome 1; mochila volta a
ocultar ao esvaziar; botão de compra desabilitado sem sementes; saldo nunca negativo.

## 3. Atlas UI Quality Gate

- runId: `2026-10-16T16-52-35-320Z-6632` (390x844 / 768x1024 / 1440x900).
- Mudança visual intencional: nova loja no overlay; mochila não aparece sem itens.
- Probes limpos (sem overflow em todos os viewports, 0 controles sem rótulo, foco visível).
- Revisão visual independente: **APPROVED**, 0 issues.
- `--finalize` → **status GREEN, exit 0**.
- ⚠️ A seção deste walkthrough foi escrita **após** o finalize (docs entram no fingerprint do gate).
  Delta apenas documental; o app validado é o mesmo das capturas.

## 4. Riscos / impacto

- Aditivo: nenhum caminho existente passa a depender do inventário; Adubo grátis continua grátis.
- Preços calibrados ao `seedReward` (10/25/100), sem criar atalho de progressão.

## 5. Arquivos

Modificados: `js/config.js`, `js/core/EconomyService.js`, `js/scenes/MainScene.js`,
`js/ui/uiManager.js`, `index.html`, `styles-core-integrity.css`, `tests/core-smoke.mjs`,
`tests/browser-smoke.mjs`, `README.md`, `docs/Ideia.md`, `docs/CORE_INTEGRITY_S2.md`,
`docs/DOCUMENTATION.md`.
Novos: `docs/specs/2026-10-16-store-inventory-spec.md`, `docs/specs/2026-10-16-store-inventory-design.md`.

## 6. Próxima ação

S4.3 — skins/cosméticos (dependem de assets), ou novo bloco a critério do PO.
