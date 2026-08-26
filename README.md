# 🍇 Plants and Vegetables vs Candle 🕯️

Tower defense em HTML5 + Phaser 3 no qual frutas e vegetais defendem a **Healthy Family Home** contra um exército de doces, Candies Level 2 e chefes.

---

O jogo não precisa de build. Abra `index.html` em um navegador moderno ou, de preferência, use um servidor local:

1. Abra um terminal na pasta do projeto e inicie o servidor local:
   ```powershell
   python -m http.server 8080
   ```
2. Acesse no navegador:
   ```text
   http://localhost:8080
   ```

Para reproduzir a mesma sequência de gameplay, fixe a seed pela URL:

```text
http://localhost:8080/?seed=582914
```

## ⌨️ Controles & Atalhos

- Escolha uma planta na bandeja e clique/toque em uma casa da grade.
- Teclas `1` a `8`: selecionam as cartas do deck ativo.
- `Espaço`: inicia a onda; durante o combate, pausa/retoma.
- `X` ou `Delete`: Pá para remover um defensor e recuperar 50% do investimento.
- `A`: Saco de Adubo — nível máximo temporário por 8 segundos + cura total.
- Clique/toque em um defensor colocado para abrir melhorias e habilidade especial.
- Clique/toque nos sóis para ganhar Energia Solar.

## Conteúdo atual

- **14 defensores**, incluindo Banana Boxeadora, Laranja Ácida, Morango Atrator, Maçã Esmagadora, Abacaxi Mina e Couve-Flor Mística.
- **13 tipos de inimigos**, incluindo o **Ursinho de Goma Artilheiro (`gummy_brigadeiro`)** com Canhão de Brigadeiro.
- **5 chefes** e campanha de **26 ondas** com Grande Finale nas cinco linhas.
- Quatro modos: Tranquilo, Normal, Desafio e Infinito.
- Ondas procedurais e runtime de gameplay reproduzíveis por seed.
- Deck Builder persistente com 5 slots iniciais; 6º slot na onda 10, 7º na 20 e 8º na progressão pós-campanha do modo Infinito.
- Sementes de Girassol persistentes para desbloqueio permanente de plantas, incluindo a Pimenta.
- Melhorias individuais, habilidades especiais, Pá, Saco de Adubo e bônus de hábitos saudáveis.
- `StatusEffectSystem` para burn, acid, slow/sticky e guard.
- Escudos, DoT, knockback, melee, piercing, minas e dano em área.
- Pausa/retomada, velocidade 1×/2×, tutorial, bestiário e estatísticas finais.

## Game Core / Core Integrity S2

A especificação técnica autoritativa do marco está em [`docs/CORE_INTEGRITY_S2.md`](docs/CORE_INTEGRITY_S2.md).

### Regras autoritativas

- `WaveRules`: uma única regra para boss, finale, ameaça visual e recompensa de sementes.
- `DeckService`: owner do deck selecionado, slots, persistência e validação de desbloqueios.
- `StatusEffectSystem`: owner de efeitos temporários e DoTs.
- `DefenderSystem`: owner do lifecycle de criação, dano, morte e remoção por Pá.
- `EnemySystem`: owner do dano/escudo, recompensas e summons bounded.
- `main.js`: somente bootstrap; não contém monkey patches de gameplay.

### 🍌 Banana Boxeadora

- combo de quatro golpes;
- dano crescente durante o combo;
- 4º golpe com knockback calculado por resistência do inimigo;
- chefes são imunes;
- `Combo de Socos` acelera a Banana por 6 segundos.

### 🍊 Laranja Ácida

- derrete 35 pontos adicionais de shield por projétil;
- dano de shield entra nas estatísticas do atacante;
- aplica Acid DoT real por 3 segundos;
- habilidade de linha remove shield, causa dano e aplica ácido.

### 🧸💣 Ursinho de Goma Artilheiro

- estreia garantida na onda 6;
- alcance de 300 px;
- dispara projéteis de brigadeiro;
- causa dano e reduz em 30% a velocidade de ataque por 5 segundos;
- usa colisão varrida para evitar tunnelling em 2× ou frames longos.

### 👨‍🍳 Confeiteiro Sombrio

As invocações agora são bounded:

- máximo de **6 minions vivos** simultaneamente;
- orçamento total de **20 invocações por Confeiteiro**;
- minions invocados entregam apenas **25% da recompensa normal**;
- summons entram no contador dinâmico da onda.

## Integridade de gameplay

- Adubo não altera o nível permanente da planta; o override de nível 3 expira em 8 segundos.
- Pá e Adubo são modos de interação mutuamente exclusivos.
- A Pá passa pelo lifecycle do `DefenderSystem` e remove também a sombra/sprites associados.
- O hábito **Comer vegetais** não injeta Pimenta no deck: concede +25% de velocidade de ataque por 15 segundos.
- Pimenta é desbloqueada permanentemente pela economia de Sementes de Girassol.
- Finales recorrentes do modo Infinito (26, 52, 78...) usam a mesma regra de ameaça e recompensa.
- Progresso da onda considera inimigos invocados e nunca exibe contador acima do total.
- CSS essencial do Deck Builder/Adubo é global, inclusive em desktop.

## Testes locais

```bash
npm install --package-lock=false
npm run test:core
npx playwright install chromium
python -m http.server 8080
# em outro terminal
npm run test:browser
```

Os smokes cobrem regras de onda, deck, posicionamento, Adubo temporário, Acid DoT, Canhão de Brigadeiro, lifecycle da Pá, summons bounded, seed determinística, pausa/retomada e contabilidade de dano.

## Planejamento

O backlog autoritativo está em [`docs/Ideia.md`](docs/Ideia.md). Com o **Core Integrity S2** implementado, os próximos blocos são economia/loja e inventário, Threat Budget de ondas, novos Candies Level 2, balanceamento e polish audiovisual.
