# Implementation Plan — S3 Threat Budget

Spec: `docs/specs/2026-10-16-threat-budget-spec.md`
Design: `docs/specs/2026-10-16-threat-budget-design.md`

## Etapas (checkpoints)

1. **Specs** — escrever spec + design. ✅
2. **RED** — adicionar asserções de S3 em `tests/core-smoke.mjs` e confirmar falha. ✅
3. **GREEN** — implementar `threat` em `config.js`, `threatBudget`/`escortBudget`/`availableEnemyPool`/`threatOf`
   em `js/core/WaveRules.js`, e `composeWave` (+ wrapper) em `js/utils/waveGenerator.js`. ✅
4. **Documentação** — atualizar `docs/Ideia.md`, `docs/CORE_INTEGRITY_S2.md` §23, `README.md`. ✅
5. **Validação** — `npm run test:core`; servidor local + `npm run test:browser`;
   Atlas UI Quality Gate + revisão visual independente. ✅ (GREEN, exit 0)
6. **Walkthrough** — registrar evidências em `walkthrough.md`. ✅

## Arquivos

- `js/config.js` (threat, threatMult)
- `js/core/WaveRules.js`
- `js/utils/waveGenerator.js`
- `index.html` (cache-busting `?v=`)
- `tests/core-smoke.mjs`
- `docs/*`, `README.md`, `implementation_plan.md`, `walkthrough.md`
