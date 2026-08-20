# Spec-Kit Specification: Novos Doces do Exército da Vela Mestra 🍬🍭

**Data**: 19 de Agosto de 2026  
**Status**: Proposto  
**Domínio**: Inimigos, Renderização Vetorial HTML5 e Mecânicas de Combate

---

## 1. Visão Geral e Requisitos

### 1.1 Objetivo
Expandir o bestiário de inimigos adicionando **6 novos doces** com comportamentos únicos, habilidades táticas e texturas vetoriais procedurais animadas em HTML5.

### 1.2 Novos Doces Propostos

1. **🍩 Rosquinha Glaciada (Donut Rolador)**:
   - *Estatísticas*: HP 160 | Vel 32 | Recompensa 35 ☀️
   - *Mecânica*: Rola continuamente pelo gramado (`angle += 250 * dt`) e ganha +20% de velocidade quando atingida.
2. **🍬 Bala de Goma Explosiva (Gummy Bomb)**:
   - *Estatísticas*: HP 140 | Vel 22 | Recompensa 40 ☀️
   - *Mecânica*: Ao ser derrotada, explode em estilhaços de açúcar causando 60 de dano nos vegetais a 1 casa de distância.
3. **🍦 Sorvete Congelante (Ice Cream Cone)**:
   - *Estatísticas*: HP 280 | Vel 14 | Recompensa 55 ☀️
   - *Mecânica*: Emite uma aura de gelo que reduz em 40% a velocidade de ataque das plantas na mesma linha.
4. **🥞 Panqueca Voadora (Pancake Glider)**:
   - *Estatísticas*: HP 110 | Vel 40 | Recompensa 30 ☀️
   - *Mecânica*: Salta por cima do primeiro defensor que encontrar na linha!
5. **🍿 Pipoca Saltitante (Popcorn Jumper)**:
   - *Estatísticas*: HP 120 | Vel 28 | Recompensa 35 ☀️
   - *Mecânica*: Movimento saltitante (`scaleY` oscilante) que possui 25% de chance de esquiva de projéteis normais.
6. **🍪 Biscoito Gigante de Chocolate (Mini-Chefe)**:
   - *Estatísticas*: HP 1800 | Vel 12 | Recompensa 350 ☀️
   - *Mecânica*: Mini-chefe massivo que se divide em 2 biscoitinhos menores ao ser derrotado!

---

## 2. Arquitetura de Dados & Renderização

### 2.1 Novas Texturas Vetoriais em `textureGenerator.js`
- `tex_donut`, `tex_candy_bomb`, `tex_ice_cream`, `tex_pancake`, `tex_popcorn`, `tex_cookie_boss`, `tex_cookie_mini`.

### 2.2 Atualização no `EnemySystem.js`
- Adicionar os novos doces ao dicionário `ENEMIES` em `config.js`.
- Implementar o salto da Panqueca, a explosão da Bala de Goma e a divisão do Biscoito Gigante.

---

## 3. Plano de Verificação Empírica

1. **Sintaxe**: `node --check` em todos os arquivos JS.
2. **Execução Headless**: Validar via Playwright a spawn dos novos doces e a rendering das texturas sem exceções no console.
