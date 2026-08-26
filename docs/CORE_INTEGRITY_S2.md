# Core Integrity S2 — Arquitetura, Contratos e Invariantes

## 1. Objetivo

O **Core Integrity S2** consolida o Game Core do *Plants and Vegetables vs Candle* antes da expansão pesada de conteúdo.

O objetivo deste marco não é adicionar mais personagens. É garantir que regras fundamentais de gameplay tenham **um único owner**, que estados temporários tenham lifecycle definido, que progressão não possa violar invariantes e que o runtime não dependa de correções tardias no bootstrap.

Este documento descreve o estado autoritativo da arquitetura após o hardening realizado na PR #2.

---

## 2. Escopo

O S2 cobre:

- regras de boss, finale, ameaça e recompensa;
- ownership e persistência do deck;
- desbloqueios e limites de slots;
- status effects temporários;
- lifecycle de defensores;
- lifecycle da Pá;
- comportamento correto do Adubo;
- projéteis e colisão varrida;
- Acid DoT e shield melt;
- summons bounded do Confeiteiro;
- anti-farming de summons;
- progresso dinâmico de ondas;
- comportamento coerente do modo Infinito;
- determinismo de gameplay por seed;
- separação entre RNG de gameplay e RNG visual;
- integridade dos modos de interação;
- CSS essencial do Deck Builder em desktop e mobile;
- remoção de monkey patches do bootstrap.

### Fora do escopo deste marco

Por decisão explícita, **não fazem parte deste fechamento**:

- alteração de branch protection;
- alteração de required status checks;
- mudança de política de merge;
- expansão adicional de CI;
- loja completa;
- inventário persistente;
- Threat Budget de ondas;
- novos Candies Level 2 além do Gummy Brigadeiro;
- balanceamento final da campanha;
- polish audiovisual final.

O pipeline já existente pode ser usado para validar o código, mas este documento não define nem modifica governança de CI.

---

## 3. Arquitetura autoritativa

```text
                           GAME CORE

              ┌────────── WaveRules ──────────┐
              │ boss / finale / threat/reward │
              └───────────────────────────────┘

              ┌───────── DeckService ─────────┐
              │ deck / slots / unlock/storage │
              └───────────────────────────────┘

              ┌────── StatusEffectSystem ─────┐
              │ burn / acid / slow / guard    │
              └───────────────────────────────┘

                          MainScene
                              │
            ┌─────────────────┼─────────────────┐
            ↓                 ↓                 ↓
     DefenderSystem       EnemySystem      ProjectileSystem
            │                 │                 │
            └─────────────────┴─────────────────┘
                              │
                           Gameplay

UIManager  ───────────────► edição e visualização de estado
main.js    ───────────────► bootstrap somente
EffectsSystem ────────────► efeitos visuais / feedback
```

### Regra de direção de dependência

O domínio não deve consultar a UI para decidir regras de gameplay.

Fluxo permitido:

```text
UI
 ↓ comando
DeckService / GameState / Systems
 ↓ estado
UI
```

Fluxo proibido:

```text
DefenderSystem
 ↓
window.uiManager
 ↓
regra de domínio
```

---

## 4. `WaveRules` — owner de ondas

Arquivo:

```text
js/core/WaveRules.js
```

`WaveRules` é a única fonte autoritativa para:

- `isBoss(wave, mode)`;
- `isFinale(wave, mode)`;
- recompensa de Sementes de Girassol;
- classificação visual de ameaça;
- banner de batalha.

### Invariantes

```text
onda 15 normal  = boss
onda 16 normal  = NÃO boss
onda 26 normal  = finale
onda 26 endless = finale
onda 52 endless = finale
onda 78 endless = finale
```

A antiga regra especial da onda 16 não é válida.

### Regra de finale

Campanha:

```text
wave === CAMPAIGN_MAX_WAVES
```

Infinito:

```text
wave % CAMPAIGN_MAX_WAVES === 0
```

### Recompensas

```text
finale → 100 sementes
boss   → 25 sementes
normal → 10 sementes
```

Nenhum caller deve reimplementar essas condições com `% 5`, `=== 26` ou flags locais.

---

## 5. `DeckService` — owner do deck

Arquivo:

```text
js/core/DeckService.js
```

Responsabilidades:

- carregar deck persistido;
- normalizar deck;
- remover duplicatas;
- rejeitar cartas inexistentes;
- rejeitar cartas bloqueadas;
- respeitar número máximo de slots;
- impedir deck vazio;
- persistir seleção;
- sincronizar `gameState.activeDeck` no início da partida.

### Invariantes

```text
1 <= activeDeck.length <= maxSlots
```

Uma carta só pode fazer parte do deck se:

```text
DEFENDERS[type] existe
AND
carta está desbloqueada
AND
há slot disponível
```

O `DefenderSystem` só autoriza posicionamento quando:

```text
gameState.activeDeck.includes(type)
```

### Pimenta

A Pimenta possui um único contrato permanente:

```text
Sementes de Girassol
        ↓
desbloqueio permanente
        ↓
DeckService
        ↓
pode entrar no deck
```

O hábito **Comer vegetais** não injeta mais Pimenta no deck.

Seu bônus de partida é:

```text
+25% velocidade de ataque
por 15 segundos
```

Assim o hábito não pode violar `maxSlots`.

---

## 6. `StatusEffectSystem` — owner de efeitos temporários

Arquivo:

```text
js/core/StatusEffectSystem.js
```

O sistema centraliza efeitos temporários em um mapa por entidade.

Formato conceitual:

```text
statusEffects
  ├─ id
  ├─ source
  ├─ magnitude
  ├─ damage
  ├─ tickEvery
  ├─ nextTickAt
  └─ expiresAt
```

### Efeitos atualmente suportados

#### `slow`

Usado por:

- Gummy Brigadeiro;
- Chiclete;
- habilidades de chefes.

Contrato:

```text
magnitude < 1.0
```

Exemplo do Brigadeiro:

```text
0.70 = 70% da velocidade normal
     = redução de 30%
```

#### `guard`

Usado pelo Brócolis.

Contrato:

```text
damageTaken *= magnitude
```

Exemplo atual:

```text
magnitude = 0.5
→ 50% de redução de dano
```

#### `burn`

DoT de fogo.

Possui:

- duração;
- dano por tick;
- intervalo;
- source para telemetria de dano.

#### `acid`

DoT da Laranja.

O ácido não é mais apenas um campo escrito no inimigo. Ele é processado pelo `StatusEffectSystem` e efetivamente produz ticks de dano.

### Invariante de lifecycle

Todo status temporário deve ter:

```text
apply
 ↓
active
 ↓
tick/modify
 ↓
expire/remove
```

Nenhum novo status deve ser implementado apenas como campos ad hoc espalhados pelos systems.

---

## 7. `DefenderSystem` — lifecycle autoritativo dos defensores

Arquivo:

```text
js/entities/DefenderSystem.js
```

Responsabilidades principais:

- criação;
- admissão pelo deck;
- upgrades;
- dano recebido;
- guard/slow;
- morte;
- efeitos `onDeath`;
- remoção;
- Pá;
- Adubo;
- habilidades específicas.

### Lifecycle

```text
PLACE
  ↓
ACTIVE
  ↓
DAMAGE / EFFECTS / UPGRADES
  ↓
DEFEAT or REMOVE
  ↓
DESTROY SPRITE + SHADOW
  ↓
RECLAIM FROM gameState.defenders
```

### Morango

O `onDeath` é idempotente.

```text
deathEffectResolved = false
        ↓ primeira morte
deathEffectResolved = true
        ↓
explosão executada exatamente uma vez
```

Morte por:

- melee;
- projétil;
- boss;
- outro dano;

usa o mesmo lifecycle.

### Pá

A Pá não remove mais o objeto diretamente de `gameState.defenders`.

Fluxo correto:

```text
SHOVEL
  ↓
DefenderSystem.removeDefender(...)
  ↓
sem onDeath ofensivo
  ↓
destrói sprite
  ↓
destrói shadowSprite
  ↓
reclaim
```

O reembolso permanece em 50% do investimento.

---

## 8. Saco de Adubo

O Adubo é um **override temporário**, não um upgrade permanente.

### Contrato

```text
custo: 75 Energia Solar
cura: 100% HP
poder temporário: nível 3
duração: 8 segundos
```

### Fluxo correto

```text
powerLevel permanente = N
       ↓
ADUBO
       ↓
activePower = 3
       ↓ 8s
expiração
       ↓
activePower = N
```

O Adubo não deve executar:

```text
powerLevel = 3 permanente
```

### Dano

Enquanto fertilizado, ataques devem usar a potência temporária sem corromper o valor permanente de upgrade.

---

## 9. Interaction Mode

Pá, Adubo e posicionamento são mutuamente exclusivos.

Estados permitidos:

```text
none
place
shovel
fertilizer
```

Invariante:

```text
apenas um modo ativo por vez
```

Ativar Pá cancela Adubo.

Ativar Adubo cancela Pá e seleção de posicionamento.

Isso evita divergência entre estado visual e comportamento real do clique.

---

## 10. Laranja Ácida

### Ataque normal

Um acerto ácido contra inimigo com shield executa:

```text
shield melt adicional: até 35
+
dano normal do projétil
+
Acid DoT
```

O shield derretido entra em:

```text
stats.damageDealt

damageByType.orange
```

### Exemplo de referência

Contra 150 de shield:

```text
35 melt
+18 dano normal absorvido pelo shield
=53 dano contabilizado
```

Shield final:

```text
150 - 53 = 97
```

### Acid DoT

Após o hit, se o alvo continuar vivo:

```text
acid
 ↓
ticks temporários
 ↓
damageEnemy(..., source="orange")
```

Assim o dano periódico também pertence à Laranja nas estatísticas.

---

## 11. Projectile System

Arquivo:

```text
js/entities/ProjectileSystem.js
```

### Colisão varrida

Projéteis não usam apenas a posição final do frame.

Para cada atualização:

```text
previousX ───────────────── currentX
             ↑
       segmento testado
```

O alvo pode ser detectado em qualquer ponto atravessado pelo projétil naquele frame.

Isso evita tunnelling em:

- velocidade 2×;
- frames longos;
- projéteis rápidos;
- alvos muito próximos da origem.

A regra vale para:

- projéteis de defensores;
- projéteis inimigos;
- Canhão de Brigadeiro.

---

## 12. Gummy Brigadeiro

ID canônico:

```text
gummy_brigadeiro
```

`gummy_cannon` não deve ser utilizado.

### Mecânica

```text
range: 300
attackRate: 3.5s
slow duration: 5s
slow multiplier: 0.70
```

Fluxo:

```text
defensor entra no range
        ↓
Gummy para
        ↓
dispara brigadeiro
        ↓
swept collision
        ↓
dano
        ↓
StatusEffectSystem.slow
```

Sem alvo válido, volta a avançar.

---

## 13. Confeiteiro — summons bounded

O Confeiteiro não pode gerar entidades indefinidamente.

### Limites

```text
MAX_SUMMONS_ALIVE = 6
TOTAL_SUMMON_BUDGET = 20 por Confeiteiro
```

### Recompensa de summon

Minions invocados concedem:

```text
25% da recompensa normal
```

Isso reduz farming intencional sem remover completamente o feedback de recompensa.

### Reclaim

Um slot de summon vivo é liberado quando o minion:

- morre;
- chega à casa;
- é removido por lifecycle válido.

### Invariante

```text
aliveSummons <= 6
summonsCreated <= 20
```

O boss pode continuar usando outras habilidades depois de atingir o limite de summons.

---

## 14. Contabilidade de ondas

A UI não deve assumir que todos os inimigos vêm da `spawnQueue` inicial.

Há duas origens:

```text
scheduled enemies
+
dynamic summons
```

O total exibido deve considerar inimigos dinâmicos.

Invariante:

```text
resolved <= totalExpected
```

Não pode existir situação como:

```text
52 de 45 neutralizados
```

### Conclusão da onda

A onda só termina quando:

```text
spawnQueue totalmente disparada
AND
enemies.length === 0
```

Summons vivos impedem conclusão prematura.

---

## 15. Modo Infinito

O modo Infinito reutiliza as mesmas regras de domínio.

Finales:

```text
26
52
78
104
...
```

Todos devem receber:

- classificação de finale;
- banner de finale;
- cinco bosses;
- recompensa de finale;
- UI coerente.

Nenhuma feature deve reimplementar `wave === 26` para decidir comportamento do Infinito.

---

## 16. Determinismo de gameplay

A seed da partida pode ser fixada pela URL:

```text
?seed=582914
```

Exemplo:

```text
http://localhost:8080/?seed=582914
```

### Separação de RNG

```text
gameplay RNG
  → decisões que alteram resultado da partida

visual RNG
  → partículas, wobble e decoração
```

O RNG visual não deve consumir a sequência do RNG de gameplay.

Isso permite reproduzir bugs e cenários de balanceamento com a mesma seed.

### Regra para novas mecânicas

Se uma escolha aleatória afeta:

- posição;
- alvo;
- spawn;
- linha;
- dano;
- recompensa;
- comportamento de inimigo;

ela deve usar o RNG de gameplay da cena, e não `Math.random()` diretamente.

---

## 17. `main.js`

`main.js` é bootstrap.

Responsabilidades permitidas:

```text
Phaser config
DeckService init
UIManager init
start wiring
```

Responsabilidades proibidas:

- substituir métodos via `prototype`;
- redefinir `WaveRules`;
- corrigir cálculo de dano;
- corrigir colisão;
- corrigir lifecycle;
- implementar regra de deck.

Se uma regra precisa de patch em `main.js`, ela está no owner errado.

---

## 18. UIManager

A UI pode:

- solicitar adição/remoção de carta ao `DeckService`;
- mostrar estado do deck;
- selecionar modo de interação;
- enviar comandos à cena;
- renderizar progresso;
- exibir feedback.

A UI não deve:

- ultrapassar limite de slots;
- desbloquear carta fora do serviço de domínio;
- sobrescrever `gameState.activeDeck` a cada frame;
- decidir se uma onda é boss;
- matar/remover entidades diretamente.

---

## 19. CSS do Deck Builder

Estilos estruturais de:

- Deck Builder;
- cartas selecionáveis;
- cartas bloqueadas;
- Adubo;

são globais.

Media queries devem conter apenas adaptações responsivas.

Regra:

```text
base style → global
mobile override → @media
```

Não:

```text
base style inteiro dentro de max-width:600px
```

---

## 20. Invariantes S2

O Core Integrity S2 é considerado preservado quando estas regras permanecem verdadeiras:

```text
[WAVE]
onda 16 != boss
finale endless = múltiplo de 26
boss/finale/reward pertencem a WaveRules

[DECK]
1 <= deck <= slots
carta bloqueada não entra no deck
core não consulta UI para autorização

[DEFENDER]
morte/removal passa por DefenderSystem
shadow nunca sobrevive à entidade
Morango explode uma única vez

[FERTILIZER]
powerLevel permanente não é alterado
boost expira em 8s

[STATUS]
burn/acid/slow/guard pertencem a StatusEffectSystem
status possui expiração

[PROJECTILE]
colisão usa segmento varrido

[SUMMON]
alive <= 6 por Confeiteiro
budget <= 20 por Confeiteiro
summon reward = 25% normal

[WAVE PROGRESS]
resolved <= totalExpected
summons entram no total dinâmico

[RNG]
gameplay usa seed autoritativa
visual RNG é independente

[BOOTSTRAP]
main.js não contém monkey patch de gameplay
```

---

## 21. Casos de regressão obrigatórios

Ao alterar o core, estes cenários devem continuar funcionando:

### Ondas

```text
wave 15 normal → boss
wave 16 normal → normal/extreme
wave 26 normal → finale
wave 52 endless → finale
```

### Deck

```text
5/5 + tentativa de adicionar carta → rejeitada
carta bloqueada → rejeitada
deck persistido inválido → normalizado
```

### Adubo

```text
planta powerLevel=1
aplica Adubo
activePower=3 por 8s
expira
powerLevel continua 1
```

### Pá

```text
remove defensor
sprite destruído
shadow destruída
sem explosão de Morango por remoção voluntária
```

### Ácido

```text
Chocolate shield=150
Laranja hit
shield=97 após melt+hit de referência
53 dano contabilizado
Acid DoT continua após o impacto
```

### Brigadeiro

```text
projétil criado muito perto do defensor
frame longo / 2x
hit ainda ocorre
slow aplicado
projétil reclaimed
```

### Summons

```text
Confeiteiro sobrevive por longo período
alive summons nunca > 6
total summons nunca > 20
contador de onda permanece coerente
```

### Seed

```text
mesma seed + mesmos inputs
→ mesmas decisões de gameplay
```

---

## 22. Definition of Done — Core Integrity S2

```text
WaveRules autoritativo                 ✅
DeckService autoritativo               ✅
Deck persistente                       ✅
StatusEffectSystem                     ✅
Acid DoT                               ✅
Burn / Slow / Guard                    ✅
Lifecycle de defensor                  ✅
Lifecycle da Pá                        ✅
Adubo temporário correto               ✅
InteractionMode exclusivo              ✅
Pimenta sem bypass de deck             ✅
Summons bounded                        ✅
Anti-farming de summons                ✅
Contabilidade dinâmica da onda         ✅
Endless consistente                    ✅
Swept collision                        ✅
RNG de gameplay determinístico         ✅
RNG visual separado                    ✅
CSS estrutural desktop/mobile          ✅
main.js sem shadow architecture        ✅
Documentação                           ✅
```

---

## 23. Próximos marcos

Com S2 estabilizado, a ordem recomendada é:

```text
S3 — Threat Budget / Wave Composition
 ↓
S4 — Economia / Loja / Inventário
 ↓
S5 — Novos Candies Level 2
 ↓
S6 — Balanceamento da campanha
 ↓
S7 — Polish visual / áudio / UX
```

### Threat Budget

Objetivo:

- deixar ondas orientadas por orçamento de ameaça;
- montar combinações intencionais;
- evitar balanceamento apenas por quantidade de inimigos.

### Economia / Loja

Objetivo:

- consolidar Sementes de Girassol;
- inventário de consumíveis;
- skins/cosméticos;
- desbloqueios sem criar bypass de progressão.

### Candies Level 2

Somente depois dos contratos anteriores estarem estáveis.

Novos inimigos devem reutilizar:

- `StatusEffectSystem`;
- `WaveRules`;
- lifecycle do `EnemySystem`;
- RNG determinístico;
- summon budgets quando aplicável.

---

## 24. Regra de evolução arquitetural

Qualquer nova mecânica deve responder antes de ser implementada:

```text
Quem é o owner?
Qual é o estado autoritativo?
Qual é o lifecycle?
Qual é o limite/budget?
Como expira ou é reclaimed?
Como é reproduzida pela seed?
Como é contabilizada nas estatísticas?
Como evita bypass pela UI?
```

Se essas respostas não estiverem claras, a feature ainda não está pronta para entrar no Game Core.
