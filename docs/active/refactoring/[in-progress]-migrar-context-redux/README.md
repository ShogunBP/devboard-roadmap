# ♻️ Migrar Context API para Redux

**Status:** `in-progress`
**Data:** 2026-07-13
**Prioridade:** `alta`
**Tags:** `frontend`, `performance`
**Resumo:** Substituição da Context API pelo Redux Toolkit para gerenciar estados globais e evitar renders indesejados.

---

## Motivação
A API de contexto força renders que não queremos.

## Situação Atual
Temos `UserContext` e `ThemeContext` misturados e renderizando novamente o App inteiro.

## Situação Desejada
Redux toolkit com slices isolados.

## Riscos
Falta de familiaridade com o setup. Vazamento de dados em hooks não migrados.

## Estratégia de Execução
Migrar um slice por PR.

1. Implementar store vazio
2. Migrar Auth
3. Migrar Preferences

## Critérios de Conclusão
- [x] Store funcionando
- [x] Hooks de Theme substituídos
- [x] App Provider limpo
- [ ] Testes passando

---

## Review

## Feedback
> Aprovado, pode avançar para a migração real.

## Decisão
- [x] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [x] Comportamento idêntico ao anterior
- [ ] Nenhuma regressão identificada
- [ ] Dívida técnica removida
- [ ] **Pasta renomeada para `[done]-nome-da-refatoracao` e movida para `archive/refactoring/`**
