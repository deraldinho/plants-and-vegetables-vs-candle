# Especificação de Design: Melancia Devoradora 🍉

**Projeto:** Plants and Vegetables vs Candle  
**Data:** 12/08/2026  
**Objetivo:** Adicionar um novo personagem defensor ao jogo — a **Melancia Devoradora 🍉**, inspirada no estilo clássico de devorar doces inteiros e entrar em período de digestão.

---

## 1. Visão Geral do Personagem

- **Nome:** Melancia Devoradora
- **Ícone:** 🍉
- **Custo:** 175 ☀️
- **Vida Base (HP):** 220
- **Estilo de Ataque:** Devoradora em curto alcance (alcance de ~65px / mesmo quadrado ou adjacente).
- **Mecânica Principal:**
  - Quando um doce entra no alcance frontal, a Melancia abocanha e engole o doce por inteiro (derrota instantânea para doces normais).
  - Em chefes (Vela Mestra), causa 450 de dano instantâneo.
  - Após engolir, entra em estado de **Digestão** por 15 segundos.
  - Durante a digestão, exibe um indicador visual (`CHUM! 🍉` / partículas de mastigação) e não pode engolir outro doce até terminar.

---

## 2. Habilidade Especial (Nível 2+)

- **Nome da Habilidade:** Super Digestão
- **Tempo de Recarga (Cooldown):** 18 segundos
- **Efeito:**
  - Finaliza instantaneamente o tempo de digestão atual se estiver mastigando.
  - Se houver um doce à frente, realiza uma mordida imediata (causando 200 de dano e curando 80 HP da Melancia).

---

## 3. Alterações nos Arquivos do Projeto

### 3.1 [index.html](file:///c:/Users/deral/Fruit%20and%20Vegetable%20vs%20Candle/index.html)
- Adicionar o card da **Melancia Devoradora** no painel de seleção de defensores (`.defender-tray`):
  ```html
  <button class="defender-card" data-defender="watermelon" type="button">
    <span class="card-icon">🍉</span><span class="card-copy"><strong>Melancia</strong><small>175 ☀️ · engole doces</small></span>
  </button>
  ```
- Adicionar atalho de teclado `6` no rodapé/instruções para seleção rápida da Melancia.

### 3.2 [game.js](file:///c:/Users/deral/Fruit%20and%20Vegetable%20vs%20Candle/game.js)
- Adicionar a definição `watermelon` em `DEFENDERS`:
  ```javascript
  watermelon: {
    name: "Melancia Devoradora",
    icon: "🍉",
    cost: 175,
    hp: 220,
    damage: 0, // Dano especial via engolir
    cooldown: 15, // Tempo de digestão
    color: "#ff3b5c",
    projectile: "",
    ability: { name: "Super Digestão", cooldown: 18, description: "finaliza a digestão e cura 80 HP" }
  }
  ```
- Atualizar a lógica de `updateDefenders()`:
  - Verificar se a Melancia tem inimigos próximos no alcance.
  - Se a digestão (`cooldownLeft <= 0`) estiver pronta, engolir o inimigo, tocar som de mastigação, gerar floaters `"NHAM! 🍉"` e definir `cooldownLeft = 15`.
- Atualizar a renderização em `drawDefenders()`:
  - Se a Melancia estiver mastigando (`cooldownLeft > 0`), desenhar um texto de status/ícone de mastigação (`💬 😋` ou `💤`) acima do emoji.
- Atualizar suporte a atalhos de teclado (tecla `6`).

---

## 4. Plano de Verificação

### Testes Manuais
1. **Seleção e Posicionamento**: Selecionar a Melancia no menu de cards (custo 175 ☀️) e posicioná-la no jardim.
2. **Mecânica de Engolir**: Confirmar que a Melancia engole um doce normal assim que se aproxima, exibindo o floater e entrando em digestão por 15s.
3. **Mecânica de Chefe**: Confirmar que causa dano massivo (450 HP) na Vela Mestra em vez de derrota instantânea.
4. **Habilidade Especial**: Evoluir a Melancia para o nível 2 e testar o botão de habilidade especial *Super Digestão*.
