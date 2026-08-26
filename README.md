# 🍇 Plants and Vegetables vs Candle 🕯️

Tower defense em HTML5 + Phaser 3 no qual frutas e vegetais defendem a **Healthy Family Home** contra um exército de doces, Candies Level 2 e chefes.

---

O jogo não precisa de build. Abra `index.html` em um navegador moderno ou, de preferência, use um servidor local:

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

- Escolha uma planta na bandeja e clique/toque em uma casa da grade.
- Teclas `1` a `8`: selecionam as cartas do deck ativo.
- `Espaço`: inicia a onda; durante o combate, pausa/retoma.
- `X` ou `Delete`: Pá para remover um defensor e recuperar 50% do investimento.
- `A`: Saco de Adubo.
- Clique/toque em um defensor colocado para abrir melhorias e habilidade especial.
- Clique/toque nos sóis para ganhar Energia Solar.

## Conteúdo atual

- **14 defensores**, incluindo Banana Boxeadora, Laranja Ácida, Morango Atrator, Maçã Esmagadora, Abacaxi Mina e Couve-Flor Mística.
- **13 tipos de inimigos**, incluindo o **Ursinho de Goma Artilheiro (`gummy_brigadeiro`)** com Canhão de Brigadeiro.
- **5 chefes** e campanha de **26 ondas** com Grande Finale nas cinco linhas.
- Quatro modos: Tranquilo, Normal, Desafio e Infinito.
- Ondas procedurais determinísticas por seed e progressão de ameaça.
- Deck Builder com 5 slots iniciais; 6º slot liberado na onda 10 e 7º na onda 20.
- Deck selecionado persistente e autoritativo no `gameState`.
- Sementes de Girassol persistentes para desbloqueio de plantas.
- Melhorias individuais, habilidades especiais, Pá, Saco de Adubo e bônus de hábitos saudáveis.
- Escudos, burn, acid, sticky/slow, knockback, ataques melee, piercing, minas e dano em área.
- Pausa/retomada sem reiniciar a partida, velocidade 1×/2×, tutorial, bestiário e estatísticas finais.

## Destaques recentes do Game Core

### 🍌 Banana Boxeadora

- combo de quatro golpes;
- dano crescente durante o combo;
- 4º golpe com knockback;
- resistência por peso e imunidade de chefes;
- `Combo de Socos` acelera a Banana por 6 segundos.

### 🧸💣 Ursinho de Goma Artilheiro

- estreia garantida na onda 6;
- alcance de 300 px;
- dispara projéteis de brigadeiro;
- causa dano e reduz em 30% a velocidade de ataque por 5 segundos;
- usa colisão varrida para não atravessar defensores próximos em 2× ou frames longos.

## Qualidade e testes

A PR de estabilização do Game Core possui GitHub Actions com:

- `node --check` dos JavaScripts de produção;
- `tests/core-smoke.mjs` para regras determinísticas e ratchets estruturais;
- `tests/browser-smoke.mjs` executado em Chromium real com Playwright;
- validação de boot do Phaser, deck, posicionamento, início de onda, pausa/retomada, finale do modo Infinito, Canhão de Brigadeiro e contabilização do ácido.

Para executar localmente os testes:

```bash
npm install --package-lock=false
npm run test:core
npx playwright install chromium
python -m http.server 8080
# em outro terminal
npm run test:browser
```

## Planejamento

O backlog autoritativo de mecânicas e progresso está em [`docs/Ideia.md`](docs/Ideia.md). O próximo marco é **Game Core Stable v1**, seguido por Status Effect System, economia/loja, Threat Budget e novos Candies Level 2.
