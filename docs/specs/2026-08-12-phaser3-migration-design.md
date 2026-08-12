# Especificação de Design: Migração para Phaser 3 Engine (Estrutura Modular)

**Projeto:** Plants and Vegetables vs Candle  
**Data:** 12/08/2026  
**Objetivo:** Migrar o motor do jogo de Canvas 2D manual para o **Phaser 3 Engine**, organizando a base de código em módulos limpos JS e mantendo suporte direto no navegador via CDN.

---

## 1. Visão Geral da Arquitetura

A aplicação será estruturada combinando a robustez do Phaser 3 (gerenciador de grupos de física, tweens, partículas e câmera) com uma arquitetura modular por arquivos:

```text
c:\Users\deral\Fruit and Vegetable vs Candle\
├── index.html                  # Interface HTML5 + inclusão do Phaser 3 CDN e scripts modulares
├── styles.css                  # Estilos visuais e layout responsivo
├── js/
│   ├── config.js               # Definições de dados (DEFENDERS, ENEMIES, MODES, STORAGE)
│   ├── scenes/
│   │   └── MainScene.js        # Cena principal do Phaser (Phaser.Scene) com física, grid, ondas e renderização
│   └── main.js                 # Inicialização da instância Phaser.Game e ponte de eventos entre UI HTML e a Cena
```

---

## 2. Componentes e Responsabilidades

### 2.1 `index.html`
- Importar Phaser 3 via CDN (`https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.min.js`).
- Importar em ordem: `js/config.js` -> `js/scenes/MainScene.js` -> `js/main.js`.
- Manter a barra de status de energia/vida/onda, cartões de defensores, botões de hábitos do Levi Esperto e modais de resultados e upgrades.

### 2.2 `js/config.js`
- Exportar/declarar as constantes globais do jogo:
  - `DEFENDERS`: Milho (🌽), Cenoura (🥕), Brócolis (🥦), Pimenta (🌶️), Tomate (🍅) e Melancia (🍉).
  - `ENEMIES`: Ursinho de Goma, Pirulito, Cupcake, Marshmallow, Chocolate, Refrigerante, Chiclete e Vela Mestra.
  - `MODES`: Tranquilo, Normal, Desafio e Infinito.
  - Funções utilitárias de leitura e gravação no `localStorage`.

### 2.3 `js/scenes/MainScene.js` (`Phaser.Scene`)
- Herda de `Phaser.Scene`.
- **`preload()`**: Criação/geração dinâmica de texturas e emojis usando Canvas/Phaser Graphics para que não dependa de arquivos externos de imagem.
- **`create()`**:
  - Configuração do grid de células (5 linhas × 8 colunas).
  - Grupos de Física do Phaser (`this.physics.add.group()`) para projéteis e inimigos.
  - Sistema de partículas nativo (`this.add.particles()`).
  - Registro de colisões/overlaps (`this.physics.add.overlap()`).
- **`update(time, delta)`**:
  - Atualização do estado da onda, temporizadores de tiro e estado de digestão da Melancia 🍉.
- **Métodos da Cena**:
  - `placeDefender(col, row, type)`: Instancia um defensor no grid com animação de surgimento.
  - `devourEnemy(defender, enemy)`: Executa animação de mordida com tween e inicia tempo de digestão de 15s.
  - `triggerShake(intensity, duration)`: Usa a câmera nativa do Phaser (`this.cameras.main.shake()`).
  - `spawnFloatingText(x, y, text, color)`: Anima números de dano e frases via tweens do Phaser.

### 2.4 `js/main.js`
- Cria a instância `new Phaser.Game(config)` conectando o canvas `#gameCanvas`.
- Liga os ouvintes de evento da interface HTML (clique nos vegetais, bônus de hábitos, pausa, velocidade, upgrade) com a `MainScene`.

---

## 3. Plano de Verificação

### Testes Manuais
1. **Carregamento no Navegador**: Abrir `index.html` e verificar se a cena Phaser inicia corretamente sem erros no console.
2. **Posicionamento e Física**: Posicionar defensores e confirmar tiros/colisões operando via sistema de física do Phaser.
3. **Mecânicas dos Defensores**: Validar todos os 6 defensores (especialmente o devorar da Melancia 🍉 com tweens e digestão).
4. **Integração de UI**: Testar bônus dos hábitos do Levi, upgrades e troca de velocidade (1x/2x).
