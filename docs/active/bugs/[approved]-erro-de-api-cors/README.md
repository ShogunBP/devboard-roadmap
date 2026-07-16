# 🐛 Erro de CORS na API de Pagamento

**Status:** `approved`
**Data:** 2026-07-13
**Prioridade:** `alta`
**Tags:** `backend`, `infra`

---

## Descrição
Erro 403 / CORS blocking na rota de payment.

## Como Reproduzir
1. Login
2. Carrinho
3. Botão pagar

## Comportamento Esperado
Redirecionar gateway.

## Comportamento Atual
Fica em loop de erro.

## Contexto Técnico
- Camada afetada: backend
- Arquivo(s) suspeito(s): `server.js`
- Logs de erro (se houver): N/A

## Hipótese de Causa
As origens autorizadas foram limpas.

## Plano de Correção
Adicionar a origin correta no array de CORS do Express.

---

## Review

### Feedback
> Revisado, pode seguir.

### Decisão
- [x] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [ ] Bug não reproduz mais
- [ ] Nenhuma regressão identificada
- [ ] **Pasta renomeada para `[done]-nome-do-bug` e movida para `archive/bugs/`**
