# 🍇 Plants and Vegetables vs Candle — Caderno de Ideias & Mecânicas 🕯️

Este documento é o backlog autoritativo de ideias de gameplay, progressão, plantas, itens, economia e inimigos.

## Legenda

- ✅ Implementado no core atual
- 🟡 Implementado parcialmente / precisa de acabamento ou balanceamento
- ⏳ Planejado

---

## 1. 🃏 Sistema de Baralho & Progressão

### Deck Picker

- ✅ Seleção de plantas antes da partida.
- ✅ Início com 5 slots.
- ✅ Bandeja de batalha sincronizada com o deck selecionado.
- ✅ Gameplay recusa posicionamento de planta fora do deck ativo.
- ✅ Persistência do deck escolhido entre sessões.
- ✅ `DeckService` autoritativo para validação, persistência, slots e desbloqueios.
- ✅ A UI apenas edita/espelha o deck; o core não consulta `window.uiManager` para admissão.

### Progressão por ondas

- ✅ Slot 6 liberado ao atingir onda 10.
- ✅ Slot 7 liberado ao atingir onda 20.
- ✅ Slot 8 disponível na progressão pós-campanha do modo Infinito ao atingir onda 30.
- 🟡 Desbloqueio permanente por Sementes já existe; falta evoluir a loja e o inventário.

---

## 2. 🌱 Plantas, Frutas e Vegetais

### 🍌 Banana Boxeadora — ✅/🟡

**Função:** melee / curto alcance.

Implementado:

- golpes rápidos em curta distância;
- combo de 4 golpes;
- dano crescente durante o combo;
- 4º golpe aplica knockback;
- knockback usa resistência por tipo de inimigo;
- chefes são imunes;
- habilidade `Combo de Socos` acelera a própria Banana por 6 segundos.

Próximos ajustes:

- animação própria de jab/direto/gancho;
- telemetria para DPS e knockback;
- balanceamento por dificuldade.

### 🍊 Laranja Ácida — ✅/🟡

**Função:** atacante à distância / anti-escudo / DoT.

Implementado:

- projétil ácido;
- dano normal;
- derretimento adicional de 35 de shield por impacto;
- dano de shield contabilizado nas estatísticas da Laranja;
- Acid DoT real por 3 segundos;
- habilidade de linha que remove shield, causa dano e aplica ácido;
- efeito gerenciado pelo `StatusEffectSystem`.

Planejado:

- debuff formal de armor break para inimigos futuros com armadura distinta de shield;
- feedback visual persistente durante o ácido.

### 🥦 Couve-Flor Mística — ✅/🟡

- projétil perfurante;
- atravessa múltiplos inimigos;
- habilidade de onda mística.

### 🍓 Morango Atrator — ✅

- atrai inimigos próximos;
- possui lifecycle de morte autoritativo;
- explode uma única vez ao morrer;
- explosão causa dano em área, inclusive se a morte vier de projétil inimigo;
- remoção por Pá não dispara indevidamente o efeito de morte.

### 🥦 Brócolis Defensor — ✅/🟡

- não é focado em dano;
- habilidade protege as oito casas vizinhas;
- cura aliados próximos;
- concede redução temporária de dano por 8 segundos via `StatusEffectSystem`.

Planejado:

- escudo visual individual;
- barra de shield separada de HP.

### 🍍 Abacaxi Mina de Espinhos — 🟡

- mina de contato;
- detona ao ser alcançada;
- dano em área curta.

Planejado:

- tempo visual de armamento;
- espinhos perfurantes persistentes por alguns segundos.

### 🍎 Maçã Esmagadora — ✅/🟡

- fica na grade aguardando alvo;
- consome a si mesma ao esmagar inimigo dentro da zona de gatilho;
- dano de impacto elevado.

Planejado:

- animação vertical de queda;
- regra explícita de inimigos grandes/chefes.

---

## 3. 🎒 Itens Especiais & Consumíveis

### Saco de Adubo — ✅/🟡

Implementado:

- custo em energia durante a partida;
- restaura a planta para 100% de HP;
- aplica override temporário de poder equivalente ao nível máximo;
- não altera `powerLevel` permanente;
- dano efetivo realmente sobe durante o boost;
- duração de 8 segundos e retorno correto ao nível permanente ao expirar;
- pode liberar temporariamente a habilidade correspondente ao nível máximo;
- partículas e feedback visual;
- modo de interação exclusivo, sem conflito com a Pá.

Planejado:

- inventário persistente;
- quantidade por partida;
- aplicação por drag-and-drop em desktop e gesto equivalente no mobile.

### 🪏 Pá — ✅

- reembolsa 50% do investimento;
- usa o lifecycle autoritativo do `DefenderSystem`;
- destrói sprite e sombra;
- não dispara `onDeath` do Morango;
- é mutuamente exclusiva com Adubo/posicionamento.

---

## 4. 🪙 Economia & Loja de Sementes

### 🌻 Sementes de Girassol — ✅/🟡

- moeda persistente em `localStorage`;
- recebida ao completar ondas;
- chefes concedem recompensa maior;
- finales recorrentes do Infinito recebem recompensa de finale pela mesma `WaveRules`;
- usada para desbloquear plantas permanentemente;
- Pimenta segue esse contrato de desbloqueio e não é mais injetada no deck por hábito.

### 🥗 Hábito “Comer vegetais” — ✅

- não altera o deck nem ignora limite de slots;
- concede +25% de velocidade de ataque por 15 segundos na partida.

### 🛒 Loja de Sementes — ⏳

Planejado:

- skins e variações visuais;
- power-ups iniciais;
- Adubo extra;
- desbloqueios antecipados;
- cosméticos sem alterar balanceamento competitivo.

---

## 5. 🍬 Candies Level 2 / Elite

A evolução dos doces passa a ser uma família formal de inimigos. Variantes Level 2 devem mudar comportamento, não apenas aumentar HP.

### 🧸💣 Ursinho de Goma Artilheiro — ✅

**Codename:** `gummy_brigadeiro`

**Função:** ranged / support / control.

Implementado:

- estreia garantida na onda 6;
- entra no pool procedural a partir da onda 6;
- usa a aparência-base do Gummy com diferenciação visual;
- alcance de artilharia de 300 px;
- para quando uma planta da mesma linha entra no alcance;
- dispara projétil de brigadeiro;
- dano direto;
- efeito grudento por 5 segundos via `StatusEffectSystem`;
- redução de 30% da velocidade de ataque;
- colisão varrida evita tunnelling em 2× / frames longos;
- volta a avançar quando não há alvo no alcance;
- recompensa superior ao Gummy básico.

Balanceamento inicial:

- HP base: 320
- velocidade base: 15
- dano: 25
- recarga: 3,5 s
- recompensa: 60 Energia Solar

### 👨‍🍳 Invocações do Confeiteiro — ✅ bounded

- máximo de 6 minions vivos simultaneamente;
- orçamento total de 20 invocações por Confeiteiro;
- minions invocados concedem 25% da recompensa-base;
- slots de summon são liberados ao morrer ou alcançar a casa;
- summons entram no contador dinâmico da onda.

### Futuras famílias Level 2 — ⏳

- Cupcake Armored;
- Chocolate Knight;
- Soda Turbo;
- Marshmallow Ninja;
- Lollipop Sorcerer;
- Gummy Elite / Brigadeiro Gatling.

---

## 6. 🌊 Progressão de ameaça

`WaveRules` é a fonte única de verdade para boss, finale, ameaça e recompensa.

```text
Ondas 1–4
  Doces básicos

Onda 5
  Boss 1

Ondas 6–9
  Doces básicos + Level 2
  Primeira aparição: Gummy Brigadeiro

Onda 10
  Boss 2 + slot adicional

Ondas 11–14
  Mais variantes Level 2

Onda 15
  Boss 3

Ondas 16–19
  Combinações de habilidades

Onda 20
  Boss 4 + slot adicional

Ondas 21–25
  Exército completo / elites

Onda 26
  Grande Finale: cinco chefes nas cinco linhas

Modo Infinito
  Finales recorrentes: 26, 52, 78...
```

O progresso visual considera a fila procedural e summons dinâmicos e nunca mostra `resolved > total`.

---

## 7. 🧱 Core Integrity S2

- ✅ `WaveRules` autoritativo.
- ✅ `DeckService` autoritativo e persistente.
- ✅ `StatusEffectSystem` formal para `Burn`, `Acid`, `Slow/Sticky` e `Guard`.
- ✅ Lifecycle de defensores centralizado (`damage`, `death`, `shovel/remove`).
- ✅ Morango `onDeath` idempotente.
- ✅ Adubo temporário sem corrupção do nível permanente.
- ✅ Projéteis de plantas e inimigos com colisão varrida.
- ✅ Shield melt contabilizado pelo `EnemySystem`, sem auditoria escondida em bootstrap.
- ✅ Summons do Confeiteiro bounded.
- ✅ Contador de onda inclui summons.
- ✅ Pimenta e deck respeitam um único contrato de desbloqueio/slots.
- ✅ Modos de interação `place / shovel / fertilizer` mutuamente exclusivos.
- ✅ `main.js` reduzido a bootstrap, sem monkey patches.
- ✅ CSS-base de Deck Builder e Adubo disponível também em desktop.
- ✅ Runtime de gameplay reproduzível com `?seed=<numero>`; RNG visual separado do RNG de gameplay.
- ✅ Browser smoke cobre os invariantes principais de Core Integrity.

---

## 8. Próximos blocos

1. ⏳ Threat Budget para composição intencional de ondas.
2. ⏳ Loja de Sementes e inventário de consumíveis.
3. ⏳ Novos Candies Level 2.
4. ⏳ Armor Break/Stun e novos efeitos quando houver mecânicas que realmente os usem.
5. ⏳ Balanceamento completo por dificuldade e campanha.
6. ⏳ Polish audiovisual, animações específicas e feedback de status.
