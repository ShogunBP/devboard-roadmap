# 🔧 NavbarLogo — Texto "Guilherme Menezes" com cor de hover hardcoded

**Status:** `done`
**Data:** 2026-07-09
**Prioridade:** `baixa`
**Tags:** `frontend`, `ui-ux`

---

## Origem do Item & Justificativa
> **Aviso:** Este item é um **achado espontâneo**, levantado acidentalmente durante a investigação do item original de "texto estático do navbar". Ele não fazia parte do escopo original da Fase 0.
> **Decisão (Opção B):** Aprovada a criação de um token de marca específico. A justificativa para não manter a cor hardcoded é que o projeto ganhará um painel administrativo futuramente (Fase 2+ do roadmap principal) que permitirá customização de cores dinamicamente. Portanto, ter a cor de hover mapeada em uma variável CSS `--brand-highlight` prepara o terreno para essa funcionalidade.

> **Categoria Pendente:** Por se tratar de uma evolução do sistema de design e não do conserto de um comportamento quebrado, este item deveria residir em `enhancements/`. O documento permanece temporariamente na pasta `bugs/` com status `[draft]` até que essa categorização seja confirmada pelo usuário antes da execução.

## Descrição
O texto "Guilherme Menezes" exibido na navbar (logo/nome clicável) possui a cor de hover definida com a classe hardcoded `group-hover:text-red-500`. Isso ignora o sistema de design tokens do projeto (variáveis CSS do Tailwind/shadcn), cria inconsistência visual e dificulta a manutenção de temas (claro/escuro).

## Como Reproduzir
1. Abrir o portfólio em desktop (navbar expandida, estado não-scrollado)
2. Passar o mouse sobre o texto "Guilherme Menezes" à esquerda da navbar
3. Observar a cor de hover: vermelho puro (`red-500`) que não pertence ao sistema de cores do portfólio

## Comportamento Esperado
O hover do nome na navbar deve usar a cor do design token correspondente (ex: `text-primary` ou `text-destructive` conforme definição do tema), não uma cor hardcoded.

## Comportamento Atual
A classe Tailwind está hardcoded no componente `NavbarLogo` em `resizable-navbar.tsx`:
```tsx
// src/components/ui/resizable-navbar.tsx — linhas 247–251
{!isScrolled && (
  <span className="text-lg font-bold group-hover:text-red-500 transition-colors">
    Guilherme Menezes
  </span>
)}
```
A classe `group-hover:text-red-500` usa um valor de cor absoluto de fora do sistema de tokens.

## Contexto Técnico
- Camada afetada: frontend
- Arquivo(s) suspeito(s): `src/components/ui/resizable-navbar.tsx` (linha 248)
- Logs de erro (se houver): nenhum — é problema de design/consistência

## Hipótese de Causa
A cor foi definida manualmente (`red-500`) durante o desenvolvimento, sem consultar o sistema de design tokens disponível via CSS variables (shadcn/ui). 

Análise real do `src/app/globals.css`:
O projeto utiliza cores no formato `oklch`. 
- **Token `--primary`**: É um tom de preto no modo claro (`oklch(0.205 0 0)`) e branco no modo escuro (`oklch(0.922 0 0)`). Como o texto normal já usa as cores de foreground (quase preto/branco), usar `text-primary` no hover **não traria uma mudança visual perceptível**.
- **Token `--destructive`**: É um vermelho temático (`oklch(0.577 0.245 27.325)` no claro, e `oklch(0.704 0.191 22.216)` no escuro). Porém, usar este token apenas porque a cor resultante é vermelha é um **erro semântico**, já que `--destructive` sinaliza estados de erro/perigo/exclusão, não um hover decorativo de identidade.

Nenhum outro token do sistema (`--accent`, `--secondary`, etc.) serve para um highlight de marca. Portanto, a transição para um token existente não é viável sem quebrar a semântica.

## Plano de Correção (Opção B Aprovada)
Para expandir o Design System e preparar o terreno para a customização via painel administrativo, os seguintes passos serão executados:

1. **Definir a variável CSS do token**: Em `src/app/globals.css`, adicionar `--brand-highlight` nos blocos `:root` e `.dark`. 
   - Valor exato: `oklch(0.637 0.237 25.331)`. Este é o valor literal da paleta nativa do Tailwind v4 para a cor `red-500` (extraído do source `tailwindcss/theme.css`). Usar este valor garante 100% de paridade com a intenção visual atual, aplicando a mesma cor para o modo claro e escuro.
2. **Registrar o token no Tailwind v4**: O projeto não utiliza `tailwind.config.ts`, pois adota o Tailwind v4 com `@theme inline`. Portanto, adicionar a linha `--color-brand-highlight: var(--brand-highlight);` dentro do bloco `@theme inline` no topo do `globals.css`.
3. **Aplicar no componente**: Em `src/components/ui/resizable-navbar.tsx` (linha 248), substituir a classe hardcoded `group-hover:text-red-500` pela classe gerada pelo novo token: `group-hover:text-brand-highlight`.

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

- [x] Bug não reproduz mais
- [x] Nenhuma regressão identificada
- [x] **Pasta renomeada para `[done]-navbar-logo-hover-cor-hardcoded`**
