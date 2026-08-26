# 📚 Manual de Documentação Técnica e de Jogo
## *Fruit and Vegetable vs Candle*

Este documento serve como o **Guia Oficial de Documentação** do jogo, cobrindo regras, entidades, sistemas de combate, economia, baralho, biomas, estrutura do projeto e atalhos.

---

## 1. 📖 Visão Geral do Jogo

**Fruit and Vegetable vs Candle** é um Tower Defense em HTML5 / Canvas construído sobre o framework Phaser 3. O objetivo do jogador é defender a *Healthy Family Home* contra o exército de doces liderado pela Vela Mestra e o Confeiteiro Sombrio.

- **Desenvolvedor / Apresentação**: Healthy Family Home & Levi Esperto.
- **Tecnologias**: HTML5, CSS3 Vanilla (Glassmorphism UI), JavaScript ES6+ e Phaser 3 Engine.
- **Persistência**: `localStorage` (recordes, sementes acumuladas, baralho e preferências).

---

## 2. 🎮 Como Jogar & Controles

### Executando Localmente
```powershell
python -m http.server 8080
```
Navegue para `http://localhost:8080` em qualquer navegador web moderno.

### Atalhos de Teclado & Interações
- **Seleção de Cartas**: Teclas `1` a `8` para selecionar o vegetal correspondente no baralho.
- **🎒 Super Fertilizante (Adubo)**: Tecla `A` — Promove o vegetal alvo para o Nível 3 por 8 segundos.
- **🪏 Pá de Remoção**: Tecla `X` ou `P` — Remove o vegetal posicionado e devolve 50% do investimento.
- **⏯️ Controle de Fluxo**:
  - `Espaço`: Inicia a próxima onda ou pausa o jogo.
  - `⏩`: Alterna a velocidade ($1\times$ ou $2\times$).
  - `Esc`: Cancela a seleção ativa.

---

## 3. 🃏 Sistema de Baralho (Deck Building) & Economia

### Progressão do Baralho
- O jogador começa com **5 slots ativos**.
- A cada 10 ondas completadas na campanha, novos slots são desbloqueados:
  - **Onda 10**: 6º Slot.
  - **Onda 20**: 7º Slot.
  - **Onda 30**: 8º Slot.

### Loja de Sementes de Girassol 🌻
- **Sementes acumuladas** ao vencer ondas (+10 por onda normal, +25 por chefe, +100 por vitória na onda 26).
- Sementes são salvas no `localStorage` (`STORAGE_KEYS.sunflowerSeeds`).
- Permitem desbloquear permanentemente novos vegetais para o baralho.

---

## 4. 🌱 Catálogo de Frutas e Vegetais (Defensores)

### Atacantes
1. 🥔 **Batata Mina** (25 ☀️) — Leva 3s para se armar no solo. Causa 180 de dano em área ao ser pisada. Habilidade: *Armamento Rápido*.
2. 🌽 **Milho Atirador** (50 ☀️) — Atira grãos contínuos (20 de dano). Habilidade: *Rajada Dourada* (120 de dano).
3. 🥕 **Cenoura Arqueira** (75 ☀️) — Ataque rápido (0.58s). Habilidade: *Flecha Perfurante* (55 de dano na linha inteira).
4. 🌶️ **Pimenta Flamejante** (125 ☀️) — Projéteis de fogo que incineram o alvo. Habilidade: *Trilha de Fogo*.
5. 🍅 **Tomate Bomba** (150 ☀️) — Dispara tomates explosivos em área. Habilidade: *Superexplosão* (120 de dano em grande área).
6. 🍌 **Banana Boxeadora** (75 ☀️) — Melee rápido em casas adjacentes. Executa um **Combo 4x** ($100\% \to 110\% \to 120\% \to 130\%$ + **Knockback**). Habilidade: *Combo Frenético*.
7. 🍊 **Laranja Ácida** (100 ☀️) — Cospe ácido cítrico que derrete escudos de chocolate e corrói armaduras. Habilidade: *Chuva Ácida*.
8. 🥦 **Couve-Flor Mística** (125 ☀️) — Dispara projéteis espirais que atravessam até 3 doces em linha reta. Habilidade: *Onda Mística*.

### Defesa & Controle
9. 🧄 **Alho Repelente** (50 ☀️) — Transfere doces que o atacam para linhas vizinhas. Habilidade: *Névoa Repelente*.
10. 🥦 **Brócolis Escudo** (100 ☀️) — Tanque com 350 HP. Habilidade: *Fortaleza Verde* (cura e concede escudo para vegetais vizinhos).
11. 🍓 **Morango Atrator** (60 ☀️) — Exala aroma irresistível atraindo doces de linhas vizinhas. Explode em área ($3\times3$) ao ser destruído. Habilidade: *Aroma Irresistível*.

### Armadilhas & Instantes
12. 🍉 **Melancia Devoradora** (175 ☀️) — Engole um doce inteiro e o digere. Habilidade: *Super Digestão* (acelera digestão + cura 80 HP).
13. 🍎 **Maçã Esmagadora** (90 ☀️) — Posicionada no topo do slot. Despenca esmagando inimigos que passam sob ela (220-300 de dano). Habilidade: *Super Impacto*.
14. 🍍 **Abacaxi Mina** (40 ☀️) — Armadilha rasteira de espinhos perfurantes (140 de dano em área). Habilidade: *Chuva de Espinhos*.

---

## 5. 🍬 Bestiário de Inimigos e Chefes

- 🧸 **Ursinho de Goma** (130 HP): Inimigo básico.
- 🧸💣 **Gummy Bear Artilheiro** (320 HP): Artilharia de longo alcance (~300px) que lança bombas de brigadeiro desacelerantes (`slowAttack` $-30\%$ por 5s).
- 🍭 **Pirulito Giratório** (210 HP): Resistente e veloz.
- 🧁 **Cupcake Tanque** (430 HP): Lento com alta vida.
- ⬜ **Marshmallow Veloz** (100 HP): Velocidade extrema.
- 🍫 **Chocolate Blindado** (300 HP + 150 Shield): Requer destruir o escudo primeiro.
- 🥤 **Refrigerante Energético** (180 HP): Concede aura de velocidade a aliados na linha.
- 🟣 **Chiclete Pegajoso** (190 HP): Aplica desaceleramento ao morder vegetais.
- 👑 **5 Chefes Únicos**:
  - Onda 5: 🕯️ **Vela Mestra** (2200 HP)
  - Onda 10: 🟣 **Chiclete Gigante Grudento** (3800 HP)
  - Onda 15: 🍭 **Pirulito Giratório Supremo** (5800 HP)
  - Onda 20: 🤖🎂 **Robô Bolo Mutante Gigante** (6500 HP)
  - Onda 25: 👨‍🍳 **O Confeiteiro Sombrio** (8500 HP)
  - Onda 26: 👑 **Grande Finale**: Todos os 5 chefes atacam simultaneamente nas 5 linhas!

---

## 6. 🏗️ Arquitetura dos Módulos em `js/`

```text
js/
 ├── config.js              # Tabelas de dados (DEFENDERS, ENEMIES, MODES, BIOMES, KNOCKBACK_RESISTANCE)
 ├── main.js                # Instanciação do Phaser.Game e UIManager
 ├── entities/
 │    ├── DefenderSystem.js # Lógica de posicionamento, combos, habilidades e adubo
 │    ├── EnemySystem.js    # AI de avanço, artilharia (gummy_cannon), bosses e dano
 │    ├── ProjectileSystem.js# Gerenciamento de projéteis de vegetais e inimigos (slowAttack)
 │    └── EffectsSystem.js   # Partículas, floaters de dano, flashes e tremores de câmera
 ├── scenes/
 │    └── MainScene.js      # Loop principal do jogo, ondas procedurais, vitórias e game over
 ├── ui/
 │    └── uiManager.js      # Gerenciamento da UI em HTML/DOM, Deck Picker e Bestiário
 └── utils/
      ├── soundManager.js   # Efeitos sonoros procedurais via Web Audio API
      ├── textureGenerator.js# Gerador procedural vetorial de texturas em Canvas 2D
      └── waveGenerator.js  # Gerador determinístico de ondas com algoritmo Mulberry32
```
