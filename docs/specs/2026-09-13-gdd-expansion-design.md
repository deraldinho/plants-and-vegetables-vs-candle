# Spec-Kit Design: Arquitetura, Contratos de Dados e Mecânicas da Expansão GDD 📐🏗️

**Data**: 13 de Setembro de 2026  
**Status**: Proposto  
**Domínio**: Arquitetura de Entidades, Projéteis, Efeitos de Status, Texturas Vetoriais e UI

---

## 1. Contratos de Dados (`js/config.js`)

### 1.1 Novos Defensores (`DEFENDERS`)

```javascript
DEFENDERS.papaya = {
  name: "Mamão Atirador",
  icon: "🍈",
  cost: 175,
  hp: 110,
  damage: 12, // 3 sementes por rajada = 36 total
  attackSpeed: 1.4,
  range: "line",
  role: "shredder",
  description: "Dispara rajadas de sementes com enzima papaína que reduzem a defesa de doces pesados.",
  projectileType: "papaya_seed"
};

DEFENDERS.kiwi = {
  name: "Kiwi Boliche",
  icon: "🥝",
  cost: 125,
  hp: 140,
  damage: 70, // 70 no 1º, 50 no 2º, 35 subsequentes
  attackSpeed: 3.0,
  range: "lane_roll",
  role: "crowd_control",
  description: "Rola em alta rotação atropelando e empurrando doces em efeito Strike."
};

DEFENDERS.apple_warrior = {
  name: "Maçã Guerreira",
  icon: "🍎",
  cost: 175,
  hp: 130,
  damage: 180, // 270 contra blindados/chefes
  attackSpeed: 1.0, // Carga única de 1s após ser plantada
  range: "lane_sweep",
  role: "lane_clear",
  description: "Arrancada explosiva que varre toda a fileira e estilhaça em área 3x3 no final."
};
```

### 1.2 Novos Inimigos (`ENEMIES`)

```javascript
ENEMIES.caramel_sticky = {
  name: "Caramelo Grudento",
  icon: "🍮",
  hp: 320,
  speed: 14,
  dps: 12,
  reward: 45,
  armorReduction: 0.25, // Casca caramelizada (-25% contra milho/cenoura)
  skillCooldown: 7.0, // Gosma Aprisionadora
  bindDuration: 4.0,
  trailSlow: 0.30
};

ENEMIES.strawberry_shooter = {
  name: "Bala de Morango Atiradora",
  icon: "🍓",
  hp: 140,
  speed: 12,
  dps: 18,
  reward: 40,
  range: 800,
  shootInterval: 2.0,
  poisonDps: 4,
  poisonDuration: 5.0,
  burstInterval: 12.0
};

ENEMIES.bubblegum_jumper = {
  name: "Chiclete Saltador",
  icon: "🫧",
  hp: 110,
  speed: 35,
  dps: 12,
  reward: 35,
  jumpCooldown: 8.0,
  bubbleCooldown: 6.0,
  bubbleDuration: 4.0,
  bubbleShield: 60
};

ENEMIES.candy_catapult_boss = {
  name: "General Confeito da Catapulta",
  icon: "🍬",
  hp: 1200,
  speed: 6,
  dps: 35,
  reward: 250,
  boss: true,
  shootInterval: 7.0,
  shrapnelDamage: 15,
  rotDps: 6,
  rotDuration: 6.0,
  sludgeDps: 4,
  sludgeDuration: 8.0,
  phase2HpPercent: 0.50,
  phase2Interval: 4.5,
  phase2Shield: 250
};
```

---

## 2. Novos Módulos e Extensões de Sistemas

### 2.1 `StatusEffectSystem.js`
Suporte aos novos status formais:
- `papain_shred`: amplifica o dano recebido pelo inimigo em até +25% (5% por acerto).
- `sugar_bind`: impede o defensor de disparar por 4 segundos.
- `toxic_wilting`: aplica dano de veneno por segundo (4 a 8 HP/s) e -25% de velocidade de ataque.
- `bubble_snare`: suspende o vegetal imobilizando-o por 4 segundos.
- `sugar_rot`: necrose contínua (6 a 12 HP/s) com redução de cadência de 35%.
- `immune_buff`: imunidade a venenos e debuffs concedida pelo bônus de Comer Fruta.

### 2.2 `DefenderSystem.js`
- **Mamão Atirador**: disparo de rajada tripla de sementes. Se o buff de Fruta estiver ativo, dispara simultaneamente na linha atual e nas adjacentes.
- **Kiwi Boliche**: lógica de rolamento com dano decrescente e repulsão (knockback). Detecção de colisão com Brócolis Escudo para gerar onda de choque de atordoamento.
- **Maçã Guerreira**: timer de carga de 1 segundo seguido de arrancada veloz por toda a grade, limpeza de poças/trilhas e detonação em estilhaços 3x3 no fim da linha.

### 2.3 `EnemySystem.js` & `ProjectileSystem.js`
- **Caramelo Grudento**: geração periódica de trilhas no chão da célula percorrida; disparo de gosma no vegetal mais avançado da linha.
- **Bala de Morango**: posicionamento na retaguarda e disparo de projéteis de veneno; disparo especial em leque nas 3 linhas.
- **Chiclete Saltador**: detecção do primeiro defensor frontal para acionar o salto acrobático (com tween de parábola) e escudo de bolha.
- **General Confeito da Catapulta**: lançamento parabólico de bombas de confeito tóxico em arco alto, gerando poças químicas residuais e ativação de Fase 2 (<50% HP).

### 2.4 Bônus da Vida Real em `uiManager.js` e `MainScene.js`
- `habit-water` (💧): +50 ☀️, limpa poças/trilhas, remove venenos e diminui velocidade do Chiclete Saltador.
- `habit-fruit` (🍎): +100 ☀️, concede 8s de imunidade a venenos, habilita Super Maçã Dourada e sementes triplas do Mamão.
- `habit-exercise` (🏃): concede 10s de velocidade de ataque dobrada para todos os vegetais.
- `habit-brush` (🪥): recupera +300 HP da casa, estoura todas as bolhas de chiclete e concede escudo refletor.

### 2.5 Texturas Vetoriais em `textureGenerator.js`
Geração vetorial limpa em Canvas 2D para todas as novas entidades:
- `tex_papaya`, `tex_kiwi`, `tex_apple_warrior`.
- `tex_caramel_sticky`, `tex_strawberry_shooter`, `tex_bubblegum_jumper`, `tex_candy_catapult_boss`.
- Projéteis e efeitos: `tex_papaya_seed`, `tex_toxic_candy`, `tex_catapult_bomb`, `tex_bubble_snare`, `tex_sludge_puddle`.
