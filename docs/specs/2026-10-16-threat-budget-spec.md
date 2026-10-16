# Spec — S3 Threat Budget / Wave Composition

**Data:** 2026-10-16
**Marco:** S3 (após Core Integrity S2)
**Status:** aprovado para implementação

## 1. Objetivo

Substituir a composição puramente aleatória das ondas por uma composição orientada por
**orçamento de ameaça** (threat budget), com combinações intencionais, mantendo:

- determinismo por seed (`?seed=<numero>`);
- `WaveRules` como owner de boss/finale/ameaça/recompensa;
- shape do `spawnQueue` consumido pelo `MainScene`;
- ausência de `Math.random()` no runtime de gameplay.

## 2. Histórias de usuário

- **US1** — Como jogador, quero que ondas tardias combinem inimigos com sinergia
  (ex.: escudo + trilha pegajosa) em vez de amostras aleatórias, para que a dificuldade
  seja percebida como progressão intencional.
- **US2** — Como jogador, quero que inimigos de elite estreiem em ondas específicas
  (Gummy Brigadeiro na onda 6, Chiclete Saltador na 5), para que a introdução seja clara.
- **US3** — Como desenvolvedor, quero reproduzir exatamente a mesma sequência de uma onda
  a partir da seed, para depurar e testar regressões.
- **US4** — Como balanceador, quero um único número (budget) que governe a quantidade/tipo
  de inimigos por onda, ajustável por modo de dificuldade.

## 3. Critérios de aceite

1. `WaveRules.threatBudget(wave, mode)` existe, é monotônica não-decrescente em `wave` e
   ordena `hard > normal > easy` na mesma onda.
2. Todo `ENEMIES[type]` possui `threat` finito e positivo.
3. `composeWave(wave, seed, mode)` é determinístico: mesma entrada ⇒ saída idêntica
   (`deepEqual`).
4. A soma de ameaça de uma onda não excede seu budget e não fica abaixo de `budget - 4`.
5. Nenhum inimigo aparece antes da sua onda de desbloqueio; bosses aparecem apenas em
   ondas de boss/finale.
6. Onda 5 estreia o pacote `rush` (Chiclete Saltador + Marshmallow); onda 6 estreia o
   pacote `artillery` (Gummy Brigadeiro + Bala de Morango Atiradora).
7. Invariantes preservados: onda 6 contém `gummy_brigadeiro`; onda 26 contém os cinco
   chefes nas cinco linhas; onda 52 (infinito) contém os cinco chefes.
8. `spawnQueue` continua sendo `[{ at, type, row, spawned }]` (campo `threat` é aditivo).
9. Nenhum `Math.random()` no gerador de ondas nem no runtime de gameplay.
10. `npm run test:core` GREEN com as novas asserções.

## 4. Requisitos não-funcionais

- **Determinismo:** apenas `mulberry32` semeado e aritmética determinística.
- **Performance:** composição limitada a um teto de itens e iterações (sem loops abertos).
- **Retrocompatibilidade:** `generateProceduralWave(wave, seed, mode)` permanece como
  wrapper público.
- **Documentação:** owner/contrato/invariantes em `docs/CORE_INTEGRITY_S2.md` (§23) e
  `docs/Ideia.md`.

## 5. Fora de escopo

- Alterar stats de inimigos, recompensas ou `StatusEffectSystem`.
- Novos inimigos (S5).
- Loja/inventário (S4).
- Balanceamento fino de números (S6).
