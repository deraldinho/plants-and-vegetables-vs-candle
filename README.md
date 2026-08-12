# Plants and Vegetables vs Candle

Protótipo jogável em HTML5/Canvas de um tower defense sobre hábitos saudáveis.

## Como executar

Não há dependências nem etapa de compilação. Abra `index.html` em um navegador moderno.

Para executar por um servidor local (recomendado):

```powershell
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Controles

- Escolha um vegetal e clique/toque em um espaço da grade.
- Clique/toque em um defensor posicionado para abrir suas melhorias.
- Clique/toque nos sóis para ganhar energia.
- Use a pá para remover um defensor e recuperar 50% do investimento.
- Use os cartões do Levi para ativar bônus, uma vez por partida.
- Teclas `1` a `5` selecionam os vegetais; `Espaço` pausa e `F` alterna entre 1× e 2×.

## Conteúdo implementado

- Cinco defensores com custo, vida e estilo de ataque próprios.
- Oito inimigos, três ondas progressivas e a Vela Mestra com 2000 HP base.
- Energia Solar, vida da casa, pontuação, projéteis, dano em área, fogo e partículas.
- Seis bônus de hábitos saudáveis do Levi Esperto.
- Interface responsiva para mouse e toque, pausa, vitória e derrota.
- Preparação manual entre ondas com prévia dos inimigos.
- Tutorial guiado na primeira partida e recorde salvo no navegador.
- Melhorias individuais de ataque, armadura e vitalidade, com até três níveis por trilha.
- Cinco habilidades especiais desbloqueadas no nível 2, com efeitos e recargas próprias.
- Pá com reembolso de 50% do investimento total do defensor.
- Tela final com estrelas, estatísticas da partida e defensor mais eficiente.
- Quatro modos: Tranquilo, Normal, Desafio e Infinito.
- Ondas procedurais no modo Infinito, com crescimento progressivo e chefes recorrentes.
- Preferência de modo e maior onda do Infinito salvas no navegador.
- Chocolate Blindado com escudo, Refrigerante Energético com aura e Chiclete Pegajoso com lentidão.
- Bestiário recolhível com habilidades e vida base de cada inimigo.
- Controle de velocidade, progresso da onda, combos, bônus de onda perfeita e alertas de perigo.
