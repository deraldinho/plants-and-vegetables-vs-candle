# Spec-Kit Specification: Sistema de Deck (Baralho), Novas Plantas e Progressão 🃏🌱

**Data**: 19 de Agosto de 2026  
**Status**: Proposto  
**Domínio**: Game Mechanics, Deck Building, Novas Entidades e Loja

---

## 1. Visão Geral

Esta especificação define o plano completo de desenvolvimento para introduzir:
1. **Sistema de Baralho (Deck Building)** com fase de seleção de 5 a 7 sementes pré-onda.
2. **Progressão por Ondas**: Desbloqueio de novos slots de baralho e novas plantas a cada 10 ondas completadas.
3. **Novas Plantas Combatentes & Especiais**: Banana Boxeadora 🍌, Laranja de Ácido 🍊, Morango Atrator 🍓, Maçã Esmagadora 🍎, Abacaxi Mina 🍍, Couve-Flor Mística 🥦 e Brócolis com Escudo 🛡️.
4. **Item Consumível Saco de Adubo 🎒**: Impulsiona qualquer planta para o Nível 3 por 8 segundos.
5. **Economia da Loja de Sementes 🌻**: Moeda de Sementes de Girassol acumulada para compra de plantas e itens.

---

## 2. Requisitos Detalhados & Mecânicas

### 2.1 Sistema de Baralho (Deck Building) & Progressão
- **Fase de Preparação (Deck Picker)**:
  - Antes do início de cada partida/onda, uma interface de seleção de baralho permite ao jogador escolher quais plantas deseja colocar nos seus slots ativos.
  - Inicia com **5 slots** ativos.
  - A cada 10 ondas concluídas (Onda 10, Onda 20, etc.), o jogador desbloqueia +1 Slot (máximo de 7 slots) e 1 nova planta na coleção.

### 2.2 Saco de Adubo (Fertilizante) 🎒
- **Custo/Uso**: Item especial com recarga ou consumível.
- **Efeito**: Ao aplicar o Adubo em uma planta na grade:
  - Ela é promovida temporariamente ao **Nível 3 (Nível Máximo)** com indicador brilhante e partículas de supercrescimento por 8 segundos.
  - Restaura 100% da vida da planta afetada.

### 2.3 Novas Plantas Combatentes

1. **🍌 Banana Boxeadora (Custo: 75 ☀️)**:
   - *Alcance*: 1 casa à frente (Melee).
   - *Mecânica*: Socos ultrarrápidos em sequência nos doces próximos, causando alto dano físico e repulsão leve.
2. **🍊 Laranja Cuspideira de Ácido (Custo: 100 ☀️)**:
   - *Alcance*: Toda a linha.
   - *Mecânica*: Cospe ácido cítrico que corrói o alvo por 3 segundos, derretendo escudos de chocolate e reduzindo a armadura dos doces.
3. **🍓 Morango Atrator (Custo: 60 ☀️)**:
   - *Alcance*: Área 3x3.
   - *Mecânica*: Exala um aroma doce irresistible que atrai doces de linhas vizinhas. Ao ser devorado ou destruído, explode causando 150 de dano em área.
4. **🍎 Maçã Esmagadora (Custo: 90 ☀️)**:
   - *Mecânica*: Fica suspensa sobre a linha. Quando um doce passa por baixo, a maçã despenca esmagando o inimigo com 200 de dano de impacto instantâneo.
5. **🍍 Abacaxi Mina de Espinhos (Custo: 40 ☀️)**:
   - *Mecânica*: Planta rasteira que espalha espinhos e explode em espinhos perfurantes ao ser pisada por um doce.
6. **🥦 Couve-Flor Mística (Custo: 125 ☀️)**:
   - *Mecânica*: Lança projéteis espirais de energia mística que perfuram até 3 doces em linha reta.

---

## 3. Arquitetura de Dados & Módulos

### 3.1 Atualizações em `js/config.js`
- Adicionar definições completas de `DEFENDERS` para `banana`, `orange`, `strawberry`, `apple`, `pineapple`, `cauliflower`.
- Adicionar configurações da economia `seeds` e slots de deck.

### 3.2 Novas Texturas em `js/utils/textureGenerator.js`
- Criar métodos procedurais vetoriais para:
  - `tex_banana`, `tex_orange`, `tex_strawberry`, `tex_apple`, `tex_pineapple`, `tex_cauliflower`, `tex_fertilizer`.

---

## 4. Plano de Verificação Empírica

1. **Sintaxe**: `node --check` em todos os arquivos JS.
2. **Execução Headless**: Validar via Playwright a seleção de cartas no Deck Picker, o posicionamento das novas plantas e o uso do Saco de Adubo.
