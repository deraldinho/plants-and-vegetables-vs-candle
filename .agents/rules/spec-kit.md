# Spec-Kit — Spec-Driven Development Rule for Antigravity

Esta regra define o padrão **Spec-Kit (Spec-Driven Development)** para todas as funcionalidades, refatorações e auditorias realizadas no repositório.

## Diretrizes Fundamentais

1. **Especificação Antes da Implementação**: Nenhuma alteração significativa de código deve ser realizada sem antes estruturar a especificação equivalente em `docs/specs/`.
2. **Ciclo de Vida do Spec-Kit**:
   - **Fase 1: Especificação de Requisitos** (`docs/specs/YYYY-MM-DD-<feature>-spec.md`) — Define escopo, histórias de usuário, critérios de aceite e não-funcionais.
   - **Fase 2: Arquitetura & Design** (`docs/specs/YYYY-MM-DD-<feature>-design.md`) — Contratos de dados, diagramas de estado, módulos e APIs.
   - **Fase 3: Plano de Ação** (`implementation_plan.md`) — Etapas incrementais com pontos de verificação.
   - **Fase 4: Validação Empírica** (`walkthrough.md`) — Evidências de testes automatizados (`node --check`, Playwright) e aprovação final.

3. **Contratos de Dados & Zero Suposições**:
   - Nunca inferir APIs, esquemas ou variáveis sem inspecionar a fonte autoritativa.
   - Preservar integridade dos comentários, docstrings e atalhos de teclado.

4. **Verificação de Sucesso**:
   - Uma tarefa só é considerada concluída após verificação empírica via execução de scripts e testes no navegador.

---

## Estrutura de Diretórios do Spec-Kit

- `docs/specs/` — Armazena todas as especificações e designs do projeto.
- `.agents/rules/spec-kit.md` — Regra ativa do assistente IA.
- `implementation_plan.md` — Plano de implementação em andamento.
- `walkthrough.md` — Relatório pós-execução e evidências de validação.
