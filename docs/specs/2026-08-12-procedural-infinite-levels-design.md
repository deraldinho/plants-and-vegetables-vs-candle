# Especificação de Design: Fases Infinitas Procedurais com Semente & Biomas (Estilo Minecraft)

**Projeto:** Plants and Vegetables vs Candle  
**Data:** 12/08/2026  
**Objetivo:** Implementar um gerador de fases e ondas infinitas estilo Minecraft baseado em **Sementes de Mundo (*World Seed*)** com gerador numérico pseudo-aleatório (PRNG Mulberry32), biomas procedurais (mudança de clima/terreno) e avanço ilimitado de ondas sem travamentos.

---

## 1. Visão Geral da Arquitetura Procedural

### 1.1 Gerador de Semente do Mundo (*World Seed*)
- Toda nova partida gera uma semente numérica positiva de 6 dígitos (ex: `Seed: 582914`).
- O jogador pode visualizar a semente atual na UI e digitar uma semente personalizada antes de iniciar a partida.
- O algoritmo PRNG **Mulberry32** garante que uma mesma semente produza exatamente a mesma sequência de inimigos, biomas e terrenos em qualquer dispositivo.

### 1.2 Biomas Procedurais (Mudança de Terreno e Clima)
A cada 3 a 5 ondas (ou dependendo da semente), a cena altera proceduramente o **Bioma do Jardim**:
1. **🌱 Jardim Saudável** (Ondas 1-4): Grama verde vivaz, céu azul e nuvens brancas.
2. **🏜️ Deserto Açucarado** (Ondas 5-8): Areia dourada, céu pôr do sol alaranjado.
3. **🌌 Floresta Noturna** (Ondas 9-12): Grama arroxeada/azul, céu noturno estrelado com vaga-lumes.
4. **🌋 Vulcão de Caramelo** (Ondas 13+): Terreno escuro vulcânico, fumaça e brilho avermelhado.

---

## 2. Componentes e Ajustes de Código

### 2.1 [js/config.js](file:///c:/Users/deral/Fruit%20and%20Vegetable%20vs%20Candle/js/config.js)
- Adicionar o algoritmo PRNG Mulberry32:
  ```javascript
  function mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  ```
- Adicionar gerador procedural de onda `generateProceduralWave(waveNumber, seed)`:
  - Calcula o orçamento de inimigos: `budget = 12 + waveNumber * 7 + Math.floor(Math.pow(waveNumber, 1.2))`.
  - Escolhe tipos de doces variados dependendo da onda.
  - Adiciona o Chefão **Vela Mestra** a cada 5 ondas.
- Adicionar mapa de biomas `BIOMES`:
  - Definir cores de gradiente do céu, cores das células do grid e ícone do bioma.

### 2.2 [js/scenes/MainScene.js](file:///c:/Users/deral/Fruit%20and%20Vegetable%20vs%20Candle/js/scenes/MainScene.js)
- Atualizar a transição de ondas em `nextWave()`:
  - Incrementar `gameState.wave` indefinidademente (`Onda 1 -> Onda 2 -> ... -> Onda 999+`).
  - Atualizar o bioma visual da cena (`updateBiomeGraphics()`).
  - Gerar a próxima onda procedural via `generateProceduralWave()`.
- Atualizar o botão "Iniciar onda" para que ao clicar, os inimigos comecem a surgir imediatamente sem travar.

### 2.3 [js/main.js](file:///c:/Users/deral/Fruit%20and%20Vegetable%20vs%20Candle/js/main.js) e [index.html](file:///c:/Users/deral/Fruit%20and%20Vegetable%20vs%20Candle/index.html)
- Exibir o indicador da semente atual na barra de status (ex: `🌱 Seed: 582914`).
- Permitir ao usuário digitar uma semente no menu inicial.

---

## 3. Plano de Verificação

### Testes Manuais
1. **Avanço de Ondas Infinitas**: Iniciar o jogo e testar a transição da Onda 1 para Onda 2, Onda 3, Onda 4, Onda 5 (Chefe) e além.
2. **Mudança de Biomas**: Confirmar que as cores do fundo e do jardim mudam ao avançar para os biomas seguintes.
3. **Consistência por Semente**: Usar a mesma semente duas vezes e verificar se a sequência de inimigos é idêntica.
