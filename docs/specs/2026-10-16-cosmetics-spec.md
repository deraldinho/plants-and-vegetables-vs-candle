# Spec — S4.3 Cosméticos (skins de defensores)

**Data:** 2026-10-16
**Marco:** S4 (Economia / Loja / Inventário) — terceiro checkpoint
**Status:** aprovado para implementação

## 1. Objetivo

Fechar o marco S4 com **cosméticos**: variações visuais (recolor) dos defensores, compradas com
Sementes 🌻, sem alterar nenhum valor de jogo. Cada skin é um **tint** aplicado ao sprite do
defensor; a skin equipada vale para todos os vegetais colocados.

## 2. Histórias de usuário

- **US1** — Como jogador, quero comprar e equipar uma variação visual dos meus vegetais.
- **US2** — Como jogador, quero que a skin equipada apareça nos defensores já colocados.
- **US3** — Como desenvolvedor, quero cosméticos no `EconomyService`, sem bypass e sem tocar em
  balanceamento.

## 3. Catálogo (`SKINS`)

| id | nome | preço (🌻) | tint |
|---|---|---|---|
| `classic` | Horta Clássica | 0 (padrão) | `null` (sem tint) |
| `mint` | Horta Menta | 60 | `0x9ff5c8` |
| `golden` | Horta Dourada | 80 | `0xffd700` |
| `shadow` | Horta Sombria | 100 | `0x8892b0` |
| `candy` | Horta Doce | 120 | `0xffa8d8` |

## 4. Critérios de aceite

1. `SKINS` em `config.js`; `STORAGE_KEYS.cosmetics` guarda `{ owned: [...], equipped: id }`.
2. `classic` é possuída e equipada por padrão; `null` de tint ⇒ comportamento atual intacto.
3. `EconomyService`: `getOwnedSkins`, `isSkinOwned`, `getEquippedSkin`, `getEquippedSkinTint`,
   `getSkinCost`, `unlockSkin(id)`, `equipSkin(id)`.
   - `unlockSkin` rejeita `unknown`/`free`/`already`/`insufficient`; sucesso debita e persiste;
   - `equipSkin` rejeita `unknown`/`locked` (não possuída); sucesso persiste;
   - nunca deixa o saldo negativo; nunca equipa skin não possuída.
4. O tint é aplicado por um **único ponto** (`DefenderSystem.applyDefenderTint`) para não conflitar
   com o flash de dano do Melancia; `classic` chama `clearTint()`.
5. Equipar durante a partida atualiza os defensores já colocados (`MainScene.refreshDefenderSkins`).
6. Loja de cosméticos no overlay: cada skin com nome, descrição, preço/estado e botão
   (Comprar / Equipar / Equipado).
7. `npm run test:core` e `npm run test:browser` GREEN; Atlas UI Quality Gate GREEN.

## 5. Não-funcionais

- Nenhum efeito em dano, vida, cooldown ou recompensa — **cosmético puro**.
- Determinístico; sem `Math.random`; sem escrita de `cosmetics` fora de `config.js`/`EconomyService`.
- Acessibilidade: botões reais, `aria-pressed`/`aria-label`, foco visível.

## 6. Fora de escopo

- Assets externos (sprites novos) e montagem por peça.
- Cosméticos de tabuleiro/cenário.
