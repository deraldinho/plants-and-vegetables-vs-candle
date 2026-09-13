# Spec-Kit Specification: Expansão GDD — Novos Defensores, Doces Especiais, Boss Catapulta e Hábitos do Levi 🎮🌱🍬

**Data**: 13 de Setembro de 2026  
**Status**: Proposto  
**Domínio**: Game Design, Novas Entidades, Mecânicas de Combate, Hábitos do Levi e Fases de Campanha  
**Documento Fonte**: Game Design Document (GDD) oficial fornecido pelo usuário.

---

## 1. Visão Geral do Escopo

Esta especificação formaliza a integração completa do Game Design Document (GDD) no ecossistema do *Plants and Vegetables vs Candle*, respeitando as invariantes do *Core Integrity S2* e as convenções do projeto.

A expansão contempla quatro pilares fundamentais:
1. **Três Novos Defensores**:
   - 🍈 **Mamão Atirador (Papaya Shooter)**: Rajada de 3 sementes, enzima papaína com desgaste acumulativo de armadura (-5% a -25% de defesa), sinergia tripla com bônus de Fruta.
   - 🥝 **Kiwi Boliche (Bowling Kiwi)**: Rolamento perfurante progressivo (70 -> 50 -> 35), knockback em doces leves/médios, bônus Strike (+25 ☀️ ao derrubar 3+), ricochete e atordoamento com Brócolis Escudo.
   - 🍎 **Maçã Guerreira Explosiva (Explosive Apple Warrior)**: Carga de 1.0s, varredura total da linha (180 de dano perfurante / 270 em blindados e chefes), estilhaço final 3x3 de 60 dano + knockback, limpeza de poças/trilhas. Super Maçã Dourada com bônus de Fruta (250 na linha + 90 em adjacentes).

2. **Quatro Novos Inimigos & Chefes do Exército Doce**:
   - 🍮 **Caramelo Grudento**: 320 HP, rastro de poça de lentidão (-30% atk speed), gosma aprisionadora a cada 7s (imobiliza por 4s), casca resistente (-25% dano comum, derretida por Pimenta/Tomate).
   - 🍓 **Bala de Morango Atiradora**: 140 HP, retaguarda, disparos venenosos com DoT Murchidão Tóxica (4 dano/s por 5s, acumula até 8 HP/s e -25% atk speed), poça residual e rajada efervescente em leque a cada 12s.
   - 🫧 **Chiclete Saltador (Jumping Bubblegum)**: 110 HP, salto acrobático sobre o primeiro defensor, bolha aprisionadora a cada 6s (suspende defensor por 4s), escudo de bolha de 60 HP.
   - 🍬 **General Confeito da Catapulta (Boss de Cerco)**: 1200 HP, artilharia parabólica global a cada 7s, Bomba de Confeito Químico Tóxico (35 impacto + 15 cacos + Necrose Glicêmica de 6 dano/s por 6s e -35% vel), poças químicas por 8s, petrificação por acúmulo. Fase 2 (<50% HP): recarga 4.5s, salva tripla e escudo de 250 HP.

3. **Mecânica Integrada dos Bônus da Vida Real (Levi Esperto)**:
   - 💧 **Beber Água**: +50 ☀️, limpa poças/trilhas pegajosas, dissolve gosma de caramelo, cura envenenamento e retarda o Chiclete Saltador em 50%.
   - 🍎 **Comer Fruta/Salada**: +100 ☀️, imunidade a venenos/debuffs por 8s, ativa Super Maçã Dourada e Rajada Dourada do Mamão (3 linhas).
   - 🏃 **Atividade Física**: Super Velocidade de Ataque (+100% / 2x cadência) para todos os vegetais por 10s.
   - 🪥 **Escovar os Dentes**: +300 HP para a Home, estoura instantaneamente todas as bolhas de chiclete libertando os vegetais, e película protetora refletora (20% de dano da catapulta).

4. **Progressão em 3 Fases da Campanha**:
   - **Fase 1: O Jardim de Boas-Vindas**: 3 ondas (Ursinhos e Pirulitos, Milho e Cenoura).
   - **Fase 2: O Vale do Açúcar**: Cupcakes, Marshmallows, Caramelo Grudento, Chiclete Saltador e confronto intermediário com o General Confeito da Catapulta.
   - **Fase 3: O Confronto Final contra a Vela Mestra**: Todos os defensores, culminando no confronto supremo contra a Vela Mestra.

---

## 2. Critérios de Aceite e Invariantes

- **Determinismo e Estabilidade**: O `StatusEffectSystem` gerencia os novos status (`papain_shred`, `toxic_poison`, `sugar_bind`, `bubble_snare`, `sugar_rot`, `chemical_sludge`) com timestamps autoritativos e expiração limpa.
- **Single Ownership**: Nenhuma lógica de dano ou status é calculada na UI; o `DefenderSystem`, `EnemySystem` e `ProjectileSystem` são os donos exclusivos de suas respectivas mecânicas.
- **Compatibilidade com DeckService**: Os 3 novos defensores entram no catálogo de `DEFENDERS` em `config.js` e respeitam o limite de slots do baralho.
- **Suíte de Testes**: Garantir que `npm run test:core` e `npm run test:browser` continuem 100% verdes após a implementação.
