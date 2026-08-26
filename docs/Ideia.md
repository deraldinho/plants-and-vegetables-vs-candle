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
- 🟡 Persistência do deck escolhido entre sessões.

### Progressão por ondas

- ✅ Slot 6 liberado ao atingir onda 10.
- ✅ Slot 7 liberado ao atingir onda 20.
- ⏳ Avaliar 8º slot para progressão pós-campanha / modo infinito.
- 🟡 Desbloqueio de novas plantas por sementes já existe, mas ainda precisa ser alinhado com a progressão automática por ondas.

---

## 2. 🌱 Plantas, Frutas e Vegetais

### 🍌 Banana Boxeadora — ✅/🟡

**Função:** melee / curto alcance.

Implementado:

- golpes rápidos em curta distância;
- combo de 4 golpes;
- dano crescente durante o combo;
- 4º golpe aplica knockback;
- inimigos pesados recebem knockback reduzido;
- chefes são imunes a knockback;
- habilidade `Combo de Socos` acelera a própria Banana por 6 segundos.

Próximos ajustes:

- animação própria de jab/direto/gancho;
- telemetria para DPS e knockback;
- balanceamento por dificuldade.

### 🍊 Laranja Ácida — 🟡

**Função:** atacante à distância / anti-escudo.

Implementado:

- projétil ácido;
- dano normal;
- derretimento adicional de escudo de Chocolate;
- habilidade de linha que remove escudos.

Planejado:

- DoT ácido completo por 3 segundos;
- debuff reutilizável de armadura.

### 🥦 Couve-Flor Mística — ✅/🟡

- projétil perfurante;
- atravessa múltiplos inimigos;
- habilidade de onda mística.

### 🍓 Morango Atrator — ✅

- atrai inimigos próximos;
- possui lifecycle de morte autoritativo;
- explode uma única vez ao morrer;
- explosão causa dano em área, inclusive se a morte vier de projétil inimigo.

### 🥦 Brócolis Defensor — 🟡

- não é focado em dano;
- habilidade protege as oito casas vizinhas;
- cura aliados próximos;
- concede redução temporária de dano por 8 segundos.

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
- eleva temporariamente o poder ao nível máximo;
- duração de 8 segundos;
- partículas e feedback visual.

Planejado:

- inventário persistente;
- quantidade por partida;
- aplicação por drag-and-drop em desktop e gesto equivalente no mobile.

---

## 4. 🪙 Economia & Loja de Sementes

### 🌻 Sementes de Girassol — ✅/🟡

- moeda persistente em `localStorage`;
- recebida ao completar ondas;
- chefes concedem recompensa maior;
- usada para desbloquear plantas.

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
- efeito grudento por 5 segundos;
- redução de 30% da velocidade de ataque;
- volta a avançar quando não há alvo no alcance;
- recompensa superior ao Gummy básico.

Balanceamento inicial:

- HP base: 320
- velocidade base: 15
- dano: 25
- recarga: 3,5 s
- recompensa: 60 Energia Solar

### Futuras famílias Level 2 — ⏳

- Cupcake Armored;
- Chocolate Knight;
- Soda Turbo;
- Marshmallow Ninja;
- Lollipop Sorcerer;
- Gummy Elite / Brigadeiro Gatling.

---

## 6. 🌊 Progressão de ameaça sugerida

```text
Ondas 1–4
  Doces básicos

Onda 5
  Boss 1

Ondas 6–9
  Doces básicos + Level 2
  Primeira aparição: Gummy Brigadeiro Cannon

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
```

---

## 7. 🧱 Roadmap técnico antes de expandir conteúdo

1. ✅ Deck autoritativo na bandeja e no posicionamento.
2. ✅ Lifecycle de morte de defensores centralizado.
3. ✅ Morango `onDeath` idempotente.
4. ✅ Banana combo/knockback.
5. ✅ Primeiro Candy Level 2: Gummy Brigadeiro Cannon.
6. ✅ Gate de sintaxe + smoke test do Game Core no GitHub Actions.
7. ⏳ Persistência do deck escolhido.
8. ⏳ Status Effect System formal (`Sticky`, `Acid`, `Burn`, `Shield`, `Stun`).
9. ⏳ Playwright para boot, deck, posicionamento, combate, pausa e progressão de onda.
10. ⏳ Loja de Sementes e inventário de consumíveis.
11. ⏳ Novos Candies Level 2.
12. ⏳ Balanceamento e certificação completa da campanha.
