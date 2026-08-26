# 🍇 Plants and Vegetables vs Candle 🕯️

Um jogo educativo e divertido de **Tower Defense em HTML5 / Phaser 3 Canvas**, onde vegetais e frutas defendem a *Healthy Family Home* contra o exército invisor da Vela Mestra e seus doces mutantes.

---

## 🎮 Como Executar

Não são necessárias instalações complexas de compilação.

1. Abra um terminal na pasta do projeto e inicie o servidor local:
   ```powershell
   python -m http.server 8080
   ```
2. Acesse no seu navegador:
   ```text
   http://localhost:8080
   ```

---

## ⌨️ Controles & Atalhos

- **Clique / Toque na Grade**: Posiciona o vegetal selecionado.
- **Clique / Toque em Defensor**: Abre o painel de melhorias (Ataque, Vitalidade e Habilidade Especial).
- **Teclas `1` a `8`**: Selecionam rapidamente as plantas do seu Baralho ativo.
- **🎒 Saco de Adubo (Tecla `A`)**: Impulsiona qualquer vegetal para o **Nível Máximo (3)** por 8s + cura 100% HP.
- **🪏 Pá (Tecla `X` ou `P`)**: Remove o vegetal e reembolsa 50% de todo o investimento em energia.
- **Espaço**: Inicia a onda atual ou pausa a partida.
- **⏩ Botão de Velocidade**: Alterna a velocidade do jogo entre $1\times$ e $2\times$.

---

## 🃏 Sistema de Baralho (Deck Building) & Progressão

- **Fase Pre-Wave (Deck Picker)**: Escolha quais plantas levar para o combate antes da batalha começar.
- **Expansão de Slots**:
  - Começa com **5 slots de baralho**.
  - **Onda 10**: Desbloqueia o **6º slot**.
  - **Onda 20**: Desbloqueia o **7º slot**.
  - **Onda 30**: Desbloqueia o **8º slot**.
- **Loja de Sementes de Girassol 🌻**:
  - Sementes acumuladas ao vencer ondas e chefes servem como moeda meta-game para desbloquear permanentemente novas plantas para o seu baralho.

---

## 🌱 Catálogo das 14 Frutas & Vegetais

| Vegetal | Ícone | Custo | Tipo / Papel | Mecânica Principal & Especial |
| :--- | :---: | :---: | :--- | :--- |
| **Batata Mina** | 🥔 | 25 ☀️ | Armadilha | Arma após 3s e explode ao toque (180 de dano). Habilidade: Armamento instantâneo. |
| **Alho Repelente** | 🧄 | 50 ☀️ | Controle | Empurra doces que o atacam para linhas vizinhas. Habilidade: Névoa repelente em área. |
| **Milho Atirador** | 🌽 | 50 ☀️ | Atacante | Disparo contínuo. Habilidade: Rajada Dourada de 120 de dano. |
| **Cenoura Arqueira** | 🥕 | 75 ☀️ | Atacante Rápido | Ataques ultrarrápidos (0.58s). Habilidade: Flecha Perfurante em toda a linha. |
| **Brócolis Escudo** | 🥦 | 100 ☀️ | Tanque / Suporte | 350 HP base. Habilidade: Gera aura de cura e escudo para vegetais vizinhos. |
| **Pimenta Flamejante**| 🌶️ | 125 ☀️ | Dano de Fogo | Incineira doces causando dano contínuo (DoT). Habilidade: Trilha de Fogo na linha inteira. |
| **Tomate Bomba** | 🍅 | 150 ☀️ | Dano em Área | Lança bombas explosivas em área. Habilidade: Superexplosão de 120 de dano. |
| **Melancia Devoradora**| 🍉 | 175 ☀️ | Engolidora | Engole doces inteiros e digere. Habilidade: Super Digestão instantânea + cura. |
| **Banana Boxeadora** | 🍌 | 75 ☀️ | Melee / Combo | Socos sequenciais ($100\% \to 110\% \to 120\% \to 130\%$ + **Knockback**). Habilidade: Combo de socos frenéticos. |
| **Laranja Ácida** | 🍊 | 100 ☀️ | Anti-Armadura | Cospe ácido cítrico que derrete escudos de chocolate e reduz armaduras. |
| **Morango Atrator** | 🍓 | 60 ☀️ | Tanque / Detonação | Atrai doces das linhas vizinhas e explode em área ($3\times3$) ao morrer. |
| **Maçã Esmagadora** | 🍎 | 90 ☀️ | Armadilha de Peso | Despenca esmagando inimigos que passam por baixo (220 a 300 de dano). |
| **Abacaxi Mina** | 🍍 | 40 ☀️ | Mina de Espinhos | Mina de solo com espinhos perfurantes (140 de dano). |
| **Couve-Flor Mística** | 🥦 | 125 ☀️ | Atacante Místico | Dispara espirais de energia que perfuram a linha inteira. |

---

## 🍬 Bestiário de 13 Inimigos & Chefes

- 🧸 **Ursinho de Goma**: Inimigo básico equilibrado.
- 🧸💣 **Gummy Bear Artilheiro (Lvl 2)**: Inimigo de longo alcance que dispara bombas de brigadeiro grudento (`slowAttack` $-30\%$ velocidade de ataque por 5s).
- 🍭 **Pirulito Giratório**: Inimigo rápido e resistente.
- 🧁 **Cupcake Tanque**: Alta vida e velocidade reduzida.
- ⬜ **Marshmallow Veloz**: Velocidade extrema.
- 🍫 **Chocolate Blindado**: Possui um escudo protetor de 150 HP.
- 🥤 **Refrigerante Energético**: Acelera doces aliados na mesma linha.
- 🟣 **Chiclete Pegajoso**: Aplica desaceleramento ao mastigar vegetais.
- 👑 **5 Chefes Únicos**:
  - Onda 5: 🕯️ **Vela Mestra** (2200 HP)
  - Onda 10: 🟣 **Chiclete Gigante Grudento** (3800 HP)
  - Onda 15: 🍭 **Pirulito Giratório Supremo** (5800 HP)
  - Onda 20: 🤖🎂 **Robô Bolo Mutante Gigante** (6500 HP)
  - Onda 25: 👨‍🍳 **O Confeiteiro Sombrio** (8500 HP)
  - Onda 26: 👑 **Grande Finale**: Todos os 5 chefes entram simultaneamente!

---

## 🥗 Missões de Hábitos Saudáveis do Levi Esperto

Ative uma vez por partida ao praticar um hábito saudável no mundo real:
1. 💧 **Beber Água**: $+50$ Energia Solar.
2. 🍎 **Comer Fruta**: $+100$ Energia Solar.
3. 🥗 **Comer Vegetais**: Desbloqueia a Pimenta Flamejante no combate.
4. 🏃 **30 min de Exercício**: Ataque ultrarrápido por 20 segundos.
5. 🪥 **Escovar os Dentes**: Restaura $+300$ HP da Casa.
6. 😴 **Dormir no Horário**: Dispara um raio restaurador limpando a grade.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3 Vanilla**: Layout responsivo com efeito Glassmorphism.
- **Phaser 3 Engine**: Renderização gráfica via Canvas, manipulação de sprites, partículas e física.
- **JavaScript ES6+**: Arquitetura modular orientada a sistemas de entidades (`DefenderSystem`, `EnemySystem`, `ProjectileSystem`, `EffectsSystem`).
- **LocalStorage API**: Persistência de recorde, sementes acumuladas, baralho e preferências.
- Cinco habilidades especiais desbloqueadas no nível 2, com efeitos e recargas próprias.
- Pá com reembolso de 50% do investimento total do defensor.
- Tela final com estrelas, estatísticas da partida e defensor mais eficiente.
- Quatro modos: Tranquilo, Normal, Desafio e Infinito.
- Ondas procedurais no modo Infinito, com crescimento progressivo e chefes recorrentes.
- Preferência de modo e maior onda do Infinito salvas no navegador.
- Chocolate Blindado com escudo, Refrigerante Energético com aura e Chiclete Pegajoso com lentidão.
- Bestiário recolhível com habilidades e vida base de cada inimigo.
- Controle de velocidade, progresso da onda, combos, bônus de onda perfeita e alertas de perigo.
