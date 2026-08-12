# Especificação de Design: Efeitos Visuais e Animações no Canvas

**Projeto:** Plants and Vegetables vs Candle  
**Data:** 12/08/2026  
**Objetivo:** Adicionar feedback visual dinâmico (*game feel*), animações de impacto, trepidação de tela, números de dano flutuantes e partículas ao jogo em HTML5 Canvas.

---

## 1. Visão Geral

Melhorar o feedback de gameplay (*Juiciness/Game Feel*) em `game.js` através de três sistemas visuais interconectados:
1. **Screen Shake System (Trepidação de Tela)**
2. **Floating Status & Damage Numbers (Textos e Danos Flutuantes)**
3. **Enhanced Particles & Ability Aura Effects (Partículas e Brilho de Habilidades)**

---

## 2. Arquitetura e Componentes em `game.js`

### 2.1 Screen Shake System
- **Estado Global:** `state.shake = { intensity: 0, duration: 0 }`.
- **Gatilhos:**
  - Explosão do Tomate Bomba (`intensity: 12`, `duration: 0.35s`).
  - Habilidade Superexplosão ou Trilha de Fogo (`intensity: 15`, `duration: 0.4s`).
  - Ataque/Dano na Casa (`intensity: 8`, `duration: 0.25s`).
  - Entrada do Chefe Vela Mestra (`intensity: 14`, `duration: 0.5s`).
- **Renderização:** No início de `draw()`, aplicar `ctx.translate(shakeX, shakeY)` caso `state.shake.duration > 0`, e dar `ctx.restore()` no final.

### 2.2 Floating Damage Numbers & Status Popups
- **Estado Global:** Expandir a lista existente `state.floaters`.
- **Propriedades do Floater:** `{ x, y, text, color, life, scale, vy, stroke }`.
- **Tipos de Popups:**
  - Dano normal: ex `"-20"`, cor vermelha/amarela, sobe suavemente.
  - Dano de explosão / habilidade: ex `"-120💥"`, maior escala e trepidação inicial.
  - Danos em escudo: `"-15 🛡️"` em tom dourado/azul.
  - Status: `"FOGO! 🔥"`, `"LENTIDÃO! 🟣"`, `"PROTEGIDO! 💚"`.
- **Renderização:** Renderizar em `draw()` com fonte em negrito, contorno para legibilidade e suave atenuação de opacidade (`alpha`).

### 2.3 Enhanced Particles & Ability Indicators
- **Partículas de Projétil:**
  - Pimenta: Rastro de fagulhas de fogo (`#ff6b4a`, `#ffd43b`).
  - Tomate: Anel de choque em expansão no ponto de impacto.
  - Brócolis: Brilho medicinal em espiral quando cura aliados (`#72d9a4`).
- **Indicador Visual de Habilidade Pronta:**
  - Quando a habilidade especial de um vegetal estiver pronta (e no nível de upgrade adequado), desenhar um pulso reluzente no vegetal na grade.

---

## 3. Plano de Verificação

### Testes Manuais
- Verificar se a explosão do Tomate e habilidades causam trepidação limpa de tela sem desalinhar a grade ou a UI.
- Testar exibição de danos flutuantes em múltiplos inimigos simultaneamente mantendo desempenho fluido.
- Confirmar que as partículas e popups flutuantes desaparecem suavemente quando `life <= 0`.
