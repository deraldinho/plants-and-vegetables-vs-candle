# Spec — S4.2 Loja + Inventário de consumíveis

**Data:** 2026-10-16
**Marco:** S4 (Economia / Loja / Inventário) — segundo checkpoint
**Status:** aprovado para implementação

## 1. Objetivo

Dar uso às Sementes de Girassol 🌻 como **moeda**: uma **loja** dentro do menu (overlay) para
comprar **consumíveis**, um **inventário** persistente e a **utilização** desses itens durante a
partida. Nada disso cria bypass de progressão — os itens são pagos com sementes conquistadas
jogando.

## 2. Histórias de usuário

- **US1** — Como jogador, quero comprar consumíveis com minhas Sementes e ver quantos tenho.
- **US2** — Como jogador, quero usar um consumível durante a partida e sentir o efeito.
- **US3** — Como desenvolvedor, quero inventário e compras atômicas no `EconomyService`, sem
  escrita direta no `localStorage` fora do owner.

## 3. Itens (catálogo `ITEMS`)

| id | nome | preço (🌻) | efeito | descrição |
|---|---|---|---|---|
| `sun_pack` | Refresco de Orvalho | 15 | `sun` +75 | +75 de Energia Solar na partida |
| `reinforce` | Remendo da Casa | 20 | `repair` +150 | recupera 150 de vida da Casa |

Preços calibrados ao `WaveRules.seedReward` atual (10 por onda comum, 25 em chefe, 100 no
finale): são consumíveis modestos, não um atalho de progressão.

## 4. Critérios de aceite

1. `ITEMS` em `config.js` com `id → { name, icon, price, effect, value, description }`.
2. `EconomyService` é o único lugar que grava `STORAGE_KEYS.inventory`.
3. `grantItem(id, n)` / `consumeItem(id, n)` / `buyItem(id, qty)`:
   - rejeitam item desconhecido (`unknown`);
   - rejeitam quantidade inválida (`invalid`, `n <= 0`);
   - `consumeItem` rejeita além do saldo (`insufficient`) sem alterar o inventário;
   - `buyItem` debita `price * qty` e adiciona `qty` de forma atômica; sem sementes → `insufficient`;
   - nunca deixam contagem negativa.
4. `getInventory()` retorna todas as chaves de `ITEMS` (0 quando ausente).
5. Loja renderiza cada item com nome, descrição, custo e quantidade; botão desabilitado sem
   sementes; feedback por toast.
6. Barra de consumíveis (HUD) só aparece quando o jogador possui ao menos 1 item; botões
   desabilitados fora da partida ou com quantidade 0.
7. Usar um consumível consome 1 do inventário **e** aplica o efeito (`sun` ou `repair`,
   respeitando o teto de vida da Casa).
8. `npm run test:core` e `npm run test:browser` GREEN; Atlas UI Quality Gate GREEN.

## 5. Não-funcionais

- Determinístico; sem `Math.random`.
- Aditivo: não altera balanceamento de ondas/inimigos nem reduz capacidade existente
  (o Adubo grátis continua grátis).
- Acessibilidade: botões reais com `aria-label`, estados `disabled` visíveis, foco de teclado.
- Retrocompatível: sem `EconomyService`, a UI degrada para "0 itens" sem quebrar.

## 6. Fora de escopo

- Skins/cosméticos (S4.3 — dependem de assets).
- Compra em quantidade (> 1 por clique) e itens de combate mais complexos.
