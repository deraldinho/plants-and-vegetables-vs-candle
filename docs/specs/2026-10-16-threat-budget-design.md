# Design — S3 Threat Budget / Wave Composition

**Data:** 2026-10-16
**Spec de referência:** `2026-10-16-threat-budget-spec.md`

## 1. Owners e direção de dependência

```text
config.js  ──►  WaveRules.js  ──►  waveGenerator.js (WaveComposer)
 (dados)         (regras)            (composição pura)
```

| Responsabilidade | Owner | Estado autoritativo |
|---|---|---|
| Custo de ameaça por inimigo | `config.js` | `ENEMIES[type].threat` |
| Multiplicador de budget por modo | `config.js` | `MODES[mode].threatMult` |
| Budget de onda + gating de pool | `WaveRules` | função pura |
| Escolha de combos e distribuição | `WaveComposer` (em `waveGenerator.js`) | função pura |

`waveGenerator.js` **não** referencia `MainScene` nem a UI. `MainScene` apenas consome o
`spawnQueue` resultante.

## 2. Contrato público

```js
// config.js
ENEMIES[type].threat : number          // > 0
MODES[mode].threatMult : number        // { easy:0.85, normal:1, hard:1.2, endless:1.05 }

// WaveRules
WaveRules.threatOf(type) : number
WaveRules.threatBudget(waveNumber, mode) : number
WaveRules.availableEnemyPool(waveNumber) : string[]

// waveGenerator.js
composeWave(waveNumber, seed, mode) : [{ at, type, row, spawned:false, threat }]
generateProceduralWave(waveNumber, seed, mode) // wrapper de composeWave
```

## 3. Curva de budget

```text
budget(wave, mode) = round( (BASE + GROWTH * (wave-1)^EXP) * MODES[mode].threatMult )
BASE = 7, GROWTH = 2.4, EXP = 1.12
```

Ondas de boss consomem `round(budget * 0.6)` de escolta e o finale `round(budget * 0.35)`,
pois o chefe em si carrega grande parte da ameaça.

## 4. Tabela de custos (valores iniciais, ajustáveis no S6)

| Inimigo | threat | Inimigo | threat |
|---|---|---|---|
| gummy | 1.0 | gummy_brigadeiro | 3.2 |
| marshmallow | 0.9 | strawberry_shooter | 2.8 |
| lollipop | 1.8 | candle | 18 |
| soda | 1.6 | candy_catapult_boss | 16 |
| cupcake | 2.6 | gum_boss | 24 |
| gum | 1.7 | lollipop_boss | 30 |
| chocolate | 2.4 | cake_robot | 34 |
| caramel_sticky | 2.6 | confeiteiro | 44 |
| bubblegum_jumper | 1.8 | | |

## 5. Pacotes intencionais

| id | minWave | membros | premium | sinergia |
|---|---|---|---|---|
| sticky_pack | 3 | gum, caramel_sticky | 0.4 | lentidão dupla |
| shield_wall | 4 | chocolate, caramel_sticky | 0.5 | escudo + trilha |
| support_line | 4 | soda, cupcake | 0.4 | aura + tanque |
| rush | 5 | marshmallow×2, bubblegum_jumper | 0.3 | pressão de velocidade |
| artillery | 6 | gummy_brigadeiro, strawberry_shooter | 0.6 | artilharia + veneno |

Custo do combo = soma dos membros + premium. Se `wave === minWave`, o combo é
**forçado** (estreia garantida) e o custo é descontado do budget antes do preenchimento.

## 6. Algoritmo determinístico

```text
composeWave(wave, seed, mode):
  rand = mulberry32((seed>>>0) + wave*10007)
  pool = WaveRules.availableEnemyPool(wave)
  budget = WaveRules.threatBudget(wave, mode) (reduzido em ondas de boss/finale)
  sequence = []
  for combo em combos onde wave === minWave e custo <= budget:   # estreia forçada
      anexa membros do combo
  preencheGuloso(sequence, budgetRestante, pool, combos, rand)
  atribui linhas (anti-repetição imediata) e tempos (1.5 + i*spacing + jitter)
  se finale: acrescenta os 5 chefes nas linhas 0..4
  senão se boss: acrescenta o chefe do ciclo (wave % 25) em linha semeada
  retorna lista ordenada por `at`
```

`preencheGuloso` escolhe combos (quando affordáveis, com probabilidade semeada) ou
inimigos avulsos mais baratos, até o budget restante ser menor que o item mais barato.
Cap de itens (`MAX_ITEMS`) e de iterações (`guard`) evitam loops abertos.

## 7. Invariantes

- `total(threat) <= budget` e `total(threat) >= budget - maxSingleCost`.
- Toda composição é reprodutível por `(wave, seed, mode)`.
- Bosses nunca entram no pool comum; aparecem só em `WaveRules.isBoss`.
- `spawned` sempre inicia `false`; `row ∈ [0,4]`; `at` finito e crescente.
- Pool destrava exatamente como antes (gummy/marshmallow/lollipop; +soda@2; +cupcake,gum@3;
  +chocolate,caramel_sticky@4; +bubblegum_jumper@5; +gummy_brigadeiro,strawberry_shooter@6).
