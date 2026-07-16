# ✨ Autenticação via Google

**Status:** `ready-for-review`
**Data:** 2026-07-13
**Prioridade:** `alta`
**Tags:** `backend`, `segurança`

---

## Objetivo
Adicionar o "Entrar com Google".

## Descrição Funcional
O usuário verá um botão "Login com Google" na tela principal e será redirecionado para a plataforma de autenticação do Google.

## Escopo

### Inclui
- Botão de login com provedor
- Troca de token no backend

### Não inclui (por ora)
- Login com Facebook/Apple

## Requisitos Técnicos
- Camadas envolvidas: frontend, backend, banco
- Dependências ou integrações necessárias: Google OAuth API
- Impactos em outras partes do sistema: Sistema de sessão

## Plano de Implementação
1. Criar projeto no Google Cloud Console
2. Implementar fluxo no front
3. Validar token no backend

## Critérios de Conclusão
- [x] Projeto GCP configurado
- [x] Botão inserido na UI
- [x] Fluxo de redirect rodando
- [ ] Troca de token 100% testada

---

## Review

### Feedback
> _(preencher durante o review)_

### Decisão
- [ ] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [ ] Todos os critérios de conclusão atendidos
- [ ] Testado manualmente do ponto de vista do usuário
- [ ] Nenhuma regressão identificada
- [ ] **Pasta renomeada para `[done]-nome-da-feature` e movida para `archive/features/`**
