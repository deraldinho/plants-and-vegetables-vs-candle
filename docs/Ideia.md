Sim. Vou incorporar essas ideias ao planejamento, mas separando o que já existe do que realmente é novo.

### Planejamento atualizado — Fruit and Vegetable vs Candle

| Fase                              |  Prioridade | Trabalho                                                                                                     |
| --------------------------------- | ----------: | ------------------------------------------------------------------------------------------------------------ |
| **S0 — Estabilização do Core**    |       🔴 P0 | Corrigir deck autoritativo, morte/lifecycle dos defensores, Morango, Pimenta, boss wave 16, CSS, CI e testes |
| **S1 — Deck & Progressão**        |       🔴 P0 | Deck de 5 slots, expansão até 7/8, desbloqueios a cada 10 ondas, coleção persistente                         |
| **S2 — Plantas v2**               |       🟠 P1 | Finalizar mecânicas próprias de Banana, Laranja, Couve-Flor, Morango, Brócolis, Abacaxi e Maçã               |
| **S3 — Consumíveis**              |       🟠 P1 | Adubo como item real, inventário, quantidade, aplicação por drag/touch, duração e feedback                   |
| **S4 — Economia Meta**            |       🟠 P1 | Sementes de Girassol, loja, skins, consumíveis e desbloqueios antecipados                                    |
| **S5 — Candy Evolution**          |       🟠 P1 | Variantes Level 2 dos inimigos existentes                                                                    |
| **S6 — Conteúdo e Balanceamento** |       🟡 P2 | Novas ondas, composição procedural, bosses, curvas de HP/dano/recompensa                                     |
| **S7 — Certificação**             | 🔴 P0 final | Playwright, regressão, mobile, desktop, performance e campanha completa                                      |

## 🍌 Banana Boxeadora

Ela **já existe no código**, então eu não trataria mais como “nova planta”. O trabalho agora passa a ser completar a identidade dela.

Hoje eu evoluiria para:

```text
BANANA BOXEADORA

Alcance:
1 casa à frente

Ataque:
sequência rápida de socos

Combo:
1º golpe → dano normal
2º golpe → +10%
3º golpe → +20%
4º golpe → KNOCKBACK

Especial:
🥊 Combo de Socos

Efeito:
5–6 segundos de velocidade extrema
+ knockback aumentado
+ impacto visual
```

Também adicionaria resistência diferente por tamanho de inimigo:

```text
Gummy / Marshmallow       → knockback alto
Pirulito / Soda           → knockback médio
Chocolate / Cupcake       → knockback baixo
Boss                       → não empurra
```

Isso evita a Banana empurrando chefes indefinidamente.

---

# 🧸 Novo inimigo: Gummy Bear Level 2

Esse entra oficialmente no planejamento como novo inimigo.

## 🧸💣 Gummy Bear Brigadeiro Cannon

**Nome provisório:**
**Ursinho de Goma Artilheiro**

Ou:

**Gummy Bear Brigadeiro Cannon**

### Papel

```text
Tipo:
Ranged / Support / Control

Perigo:
não precisa chegar até a planta para atacá-la
```

Ele entra no campo e, quando encontra uma planta dentro do alcance:

```text
        🍌
        ↑
🌱 🌱 🌱 🌱

                 🧸💣
                  │
                  │ brigadeiro
                  └──────────► ●
```

### Ataque

**Canhão de Brigadeiro**

O projétil causa:

* dano direto;
* efeito grudento;
* redução da velocidade de ataque;
* pequeno efeito visual de chocolate/brigadeiro cobrindo a planta.

Exemplo inicial de balanceamento:

```text
HP:                320
Velocidade:        15
Dano:              25
Alcance:           ~300 px
Cooldown:          3.5 s
Slow de ataque:    -30%
Duração:           5 s
Recompensa:        60 ☀️
```

### Comportamento

Não quero que ele funcione como os inimigos corpo a corpo atuais.

O fluxo deveria ser:

```text
SPAWN
  ↓
AVANÇA
  ↓
PLANTA ENTROU NO ALCANCE?
  ├── NÃO → continua andando
  │
  └── SIM
       ↓
    PARA
       ↓
  MIRA CANHÃO
       ↓
 DISPARA BRIGADEIRO
       ↓
    RELOAD
       ↓
PLANTA AINDA EXISTE?
   ├── SIM → dispara novamente
   └── NÃO → volta a avançar
```

Isso cria uma classe nova de ameaça: **artilharia**.

---

## 🍫 Brigadeiro como status effect

Em vez de implementar o efeito diretamente dentro do Gummy Bear, eu criaria um status reutilizável:

```javascript
StickyEffect
```

ou conceitualmente:

```text
StatusEffect
 ├─ Sticky
 ├─ Acid
 ├─ Burn
 ├─ Shield
 ├─ Stun
 └─ AttackSpeedModifier
```

Assim o Brigadeiro Cannon aplica:

```text
BRIGADEIRO_HIT
      ↓
damage
      ↓
StickyEffect
      ↓
attackSpeed × 0.70
      ↓
5 segundos
      ↓
expire
```

Isso também serviria depois para Chiclete, Caramelo, Chocolate e outros doces.

---

# 🍬 Sistema Level 2 de inimigos

O Gummy Bear Lvl 2 abre uma possibilidade melhor do que simplesmente adicionar inimigos aleatórios.

Podemos criar evolução das famílias:

```text
GUMMY BEAR
   ↓
GUMMY BEAR LVL 2
Brigadeiro Cannon
   ↓
GUMMY BEAR ELITE
Brigadeiro Gatling
```

E fazer o mesmo:

```text
Cupcake
 └─ Cupcake Armored

Chocolate
 └─ Chocolate Knight

Soda
 └─ Soda Turbo

Marshmallow
 └─ Marshmallow Ninja

Lollipop
 └─ Lollipop Sorcerer
```

Isso ajuda muito a campanha de **26+ ondas**, porque aumenta variedade sem exigir dezenas de personagens completamente independentes.

---

# Nova organização das ondas

Eu aproveitaria isso para introduzir inimigos evoluídos progressivamente:

```text
Ondas 1–4
Doces básicos

Onda 5
Boss 1

Ondas 6–9
Doces básicos + primeira variante Level 2
🧸💣 Gummy Brigadeiro Cannon

Onda 10
Boss 2

Ondas 11–14
Mais Level 2

Onda 15
Boss 3

Ondas 16–19
Elites + combinações de habilidades

Onda 20
Boss 4

Ondas 21–25
Exército completo

Onda 26
👑 FINAL
5 BOSSES + elites
```

Isso dá uma curva de aprendizado melhor.

---

## Ordem que eu usaria agora

Eu **não implementaria o Gummy novo imediatamente antes de corrigirmos o core**.

A sequência fica:

```text
1. CORE STABLE
   ↓
2. DECK AUTORITATIVO
   ↓
3. DEFENDER LIFECYCLE
   ↓
4. STATUS EFFECT SYSTEM
   ↓
5. BANANA BOXEADORA COMPLETA
   ↓
6. GUMMY BEAR LVL 2
   ↓
7. OUTROS CANDIES LVL 2
   ↓
8. ECONOMIA / LOJA
   ↓
9. NOVAS ONDAS
   ↓
10. BALANCEAMENTO
   ↓
11. CERTIFICAÇÃO
```

Assim, **Banana Boxeadora passa de feature existente para feature a finalizar**, enquanto o **Gummy Bear Level 2 com Canhão de Brigadeiro entra oficialmente como primeiro inimigo da futura camada `Candy Level 2 / Elite`**. Isso encaixa bem no jogo sem transformar cada nova ideia em código especial isolado.
