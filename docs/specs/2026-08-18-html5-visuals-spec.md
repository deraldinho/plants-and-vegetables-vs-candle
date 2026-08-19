# Spec-Kit Specification: Renderização e Animação Vetorial HTML5 / Canvas 🎨✨

**Data**: 18 de Agosto de 2026  
**Status**: Proposto  
**Domínio**: Visual Engine, Renderização Phaser 3, Animações procedurais

---

## 1. Visão Geral e Requisitos

### 1.1 Objetivo
Substituir a renderização baseada em emojis e caracteres de texto por uma engine de **texturas vetoriais procedurais desenhadas em HTML5 / Canvas** com suporte a animações procedurais em tempo real no Phaser 3.

### 1.2 Histórias de Usuário & Critérios de Aceite
- **US-01 (Gráficos Nítidos)**: Como jogador, quero ver ilustrações vivas, coloridas e detalhadas dos vegetais e doces para que o jogo tenha visual profissional e atraente.
  - *Critério de Aceite*: Nossos 8 vegetais e 11 doces devem ser renderizados usando texturas vetoriais procedurais geradas via Canvas no boot do jogo.
- **US-02 (Animação de Rotação do Pirulito)**: Como jogador, quero ver o Pirulito Giratório rodar continuamente.
  - *Critério de Aceite*: `lollipop` e `lollipop_boss` devem girar 360° continuamente durante a caminhada (`angle += speed * dt`).
- **US-03 (Chama Viva da Vela Mestra)**: Como jogador, quero ver a chama da Vela Mestra tremeluzir.
  - *Critério de Aceite*: O chefe Vela Mestra deve emitir partículas de fogo animadas e efeito de luz cintilante.
- **US-04 (Efeito de Gelatina no Ursinho)**: Como jogador, quero ver o Ursinho de Goma e o Marshmallow pulsarem ao andar.
  - *Critério de Aceite*: Animação de pulsação suave em `scaleY` ao mover.
- **US-05 (Sombras no Solo)**: Como jogador, quero ver sombras sob os personagens.
  - *Critério de Aceite*: Todos os sprites devem projetar uma elipse de sombra translúcida no gramado.

---

## 2. Arquitetura e Contrato de Dados

### 2.1 Novo Módulo `TextureGenerator` ([js/utils/textureGenerator.js](file:///c:/Users/deral/Fruit%20and%20Vegetable%20vs%20Candle/js/utils/textureGenerator.js))

Módulo responsável por desenhar Canvas temporários com gradientes e formas geométricos, registrando-os no cache de texturas do Phaser:

```javascript
class TextureGenerator {
  static generateAll(scene) {
    // Desenha e registra:
    // tex_potato, tex_potato_armed, tex_garlic, tex_corn, tex_carrot,
    // tex_broccoli, tex_pepper, tex_tomato, tex_watermelon,
    // tex_gummy, tex_lollipop, tex_cupcake, tex_marshmallow,
    // tex_chocolate, tex_soda, tex_gum, tex_candle, etc.
  }
}
```

---

## 3. Plano de Verificação

1. **Sintaxe & Integridade**: `node --check` em todos os arquivos JS.
2. **Execução Headless**: Validar através de script Playwright se todos os sprites e sombras são instanciados sem lançar erros no console.
