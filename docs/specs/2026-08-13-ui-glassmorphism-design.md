# Especificação de Design: Interface Glassmorphism & Cards Pulsantes 🎨

**Projeto:** Plants and Vegetables vs Candle  
**Data:** 13/08/2026  
**Objetivo:** Elevar a qualidade estética da interface do jogo adicionando efeito **Glassmorphism (Frosted Glass)** moderno com transparência e desfoque de fundo, bordas translúcidas, sombras néon e **brilho pulsante nos cards de vegetais** quando houver Energia Solar suficiente.

---

## 1. Visão Geral das Alterações Visuais

### 1.1 Efeito Glassmorphism (Vidro Fosco)
Aplicar nos contêineres principais de UI em `styles.css`:
- **Barra de Status (`.status-bar`)**: `background: rgba(255, 255, 255, 0.72); backdrop-filter: blur(14px); border: 1.5px solid rgba(255, 255, 255, 0.6);`
- **Cards de Defensores (`.defender-card`)**: Fundo translúcido com brilho interno suave e cantos arredondados.
- **Painel de Onda (`.wave-preview`)**: Fundo vidro amarelado com desfoque e bordas brilhantes.
- **Painel de Hábitos (`.habit-panel`)**: Fundo vidro verde-água fosco.
- **Modais e Overlays (`.overlay-card`, `.upgrade-panel`)**: Aparência de painel flutuante de vidro.

### 1.2 Cards Pulsantes quando Prontos para Compra (`.ready-to-buy`)
- Adicionar classe CSS `.ready-to-buy` nos cards de vegetais em `styles.css`:
  ```css
  @keyframes card-gold-pulse {
    0% { box-shadow: 0 5px 0 #9db77e, 0 0 4px rgba(255, 214, 64, 0.3); }
    100% { box-shadow: 0 5px 0 #d49a24, 0 0 16px rgba(255, 214, 64, 0.85); border-color: #ffd43b; }
  }

  .defender-card.ready-to-buy {
    animation: card-gold-pulse 1.6s ease-in-out infinite alternate;
  }
  ```
- Atualizar `updateCards()` em [js/main.js](file:///c:/Users/deral/Fruit%20and%20Vegetable%20vs%20Candle/js/main.js) para adicionar a classe `ready-to-buy` nos vegetais desbloqueados cujo custo é menor ou igual à Energia Solar atual.

---

## 2. Arquivos Envolvidos

1. [styles.css](file:///c:/Users/deral/Fruit%20and%20Vegetable%20vs%20Candle/styles.css): Atualização dos temas, gradientes, glassmorphism e animações `@keyframes card-gold-pulse`.
2. [js/main.js](file:///c:/Users/deral/Fruit%20and%20Vegetable%20vs%20Candle/js/main.js): Atualização da classe `.ready-to-buy` na função `updateCards()`.

---

## 3. Plano de Verificação

### Testes Manuais
1. **Verificação do Vidro Fosco**: Confirmar o efeito translúcido com desfoque de fundo em todos os painéis e modais.
2. **Brilho Pulsante**: Coletar sóis durante a partida e verificar se os cards acendem com um brilho dourado pulsante assim que houver energia suficiente.
