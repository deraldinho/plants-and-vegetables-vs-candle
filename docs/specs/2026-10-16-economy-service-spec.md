# Spec — S4.1 EconomyService (owner da economia)

**Data:** 2026-10-16
**Marco:** S4 (Economia / Loja / Inventário) — primeiro checkpoint
**Status:** aprovado para implementação

## 1. Objetivo

Criar um **owner único** para a economia persistente — Sementes de Girassol e desbloqueios de
defensores — eliminando a lógica espalhada de `readNumber`/`writeStorage`/`saveUnlockedCards`
entre `uiManager` e `MainScene`, e garantindo que a compra de desbloqueio **não crie bypass**
de progressão.

## 2. Histórias de usuário

- **US1** — Como jogador, quero que minhas Sementes 🌻 e vegetais desbloqueados sejam
  consistentes entre telas e sessões.
- **US2** — Como jogador, quero desbloquear um vegetal pagando o `seedPrice`, com feedback
  claro quando faltam sementes.
- **US3** — Como desenvolvedor, quero uma API testável (`getSeeds`, `grantSeeds`, `spendSeeds`,
  `unlock`, `isUnlocked`) em vez de mexer no `localStorage` em cada tela.

## 3. Critérios de aceite

1. `EconomyService` é o único lugar que grava `STORAGE_KEYS.sunflowerSeeds` e
   `STORAGE_KEYS.unlockedCards` (fora de `config.js`).
2. `getSeeds()` reflete persistência; `grantSeeds(n)` soma `n >= 0`.
3. `spendSeeds(n)` rejeita `n <= 0` ou saldo insuficiente, **nunca** deixa saldo negativo.
4. `unlock(type)`:
   - rejeita tipo desconhecido (`unknown`);
   - rejeita vegetal de custo 0 (`free`);
   - rejeita já desbloqueado (`already`);
   - rejeita saldo insuficiente (`insufficient`) sem debitar;
   - em sucesso, debita o custo **e** persiste o desbloqueio de forma atômica.
5. `isUnlocked(type)` = custo 0 **ou** presente na lista persistida.
6. `DeckService.isUnlocked` delega ao `EconomyService` quando disponível.
7. Ganho de sementes ao completar onda usa `grantSeeds`.
8. A UI de desbloqueio e o contador de sementes usam o `EconomyService`.
9. `npm run test:core` e `npm run test:browser` GREEN.

## 4. Não-funcionais

- Determinístico e sem `Math.random`.
- Retrocompatível: `DeckService.isUnlocked` funciona mesmo sem `EconomyService` (fallback).
- `main.js` permanece bootstrap.

## 5. Fora de escopo (checkpoints seguintes)

- Inventário de consumíveis e consumo em partida (S4.2).
- Skins/cosméticos (S4.3 — dependem de assets).
- Alterar custos, recompensas ou balanceamento.
