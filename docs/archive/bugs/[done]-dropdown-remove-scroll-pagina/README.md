# 🐛 Dropdown do ThemeToggle — Remove o scroll da página ao abrir

**Status:** `done`
**Data:** 2026-07-08
**Prioridade:** `média`
**Tags:** `frontend`, `ui-ux`

---

## Descrição
Ao abrir o dropdown do seletor de tema na navbar, o Radix UI injeta `overflow: hidden` no elemento `<body>`, o que trava o scroll da página enquanto o menu está aberto. Isso é um comportamento indesejado em portfólios de página única com scroll nativo.

## Como Reproduzir
1. Abrir o portfólio
2. Rolar a página levemente para baixo
3. Clicar no botão de toggle de tema (ícone Sol/Lua)
4. Observar que o scroll da página trava imediatamente ao abrir o dropdown
5. Fechar o dropdown — o scroll volta

## Comportamento Esperado
O dropdown deve abrir sem interferir no scroll da página. O usuário deve conseguir rolar a página mesmo com o dropdown visível (ou o dropdown deve fechar ao rolar).

## Comportamento Atual
O Radix `DropdownMenuPrimitive.Root` possui a propriedade `modal` ativada por padrão (`true`). Isso aciona internamente a biblioteca `react-remove-scroll`, que injeta o atributo `data-scroll-locked` no `<body>` com `overflow: hidden`, travando o scroll da página inteira enquanto o dropdown está aberto.

```tsx
// src/hooks/use-toogle.tsx — estrutura atual
// O DropdownMenu (que repassa as props para DropdownMenuPrimitive.Root)
// não define a prop 'modal', assumindo o padrão true:
<DropdownMenu>
  <DropdownMenuTrigger asChild>...</DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    ...
  </DropdownMenuContent>
</DropdownMenu>
```

```tsx
// src/hooks/use-toogle.tsx — estrutura atual
<DropdownMenu>
  <DropdownMenuTrigger asChild>...</DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    ...
  </DropdownMenuContent>
</DropdownMenu>
```

## Contexto Técnico
- Camada afetada: frontend
- Arquivo(s) suspeito(s): `src/hooks/use-toogle.tsx` — uso do `DropdownMenu`
- Logs de erro (se houver): nenhum — é comportamento intencional do Radix (via react-remove-scroll) que conflita com o design do portfólio

## Hipótese de Causa
A prop `modal` do `DropdownMenuPrimitive.Root` (padrão `true`) está acionando o bloqueio de scroll no `<body>`. A solução é passar explicitamente `modal={false}` para evitar a injeção do atributo `data-scroll-locked`.

## Plano de Correção
1. Em `src/hooks/use-toogle.tsx`, adicionar a prop `modal={false}` ao componente `<DropdownMenu>`:
   ```tsx
   <DropdownMenu modal={false}>
   ```
2. Verificar se o comportamento de fechamento ao clicar fora ainda funciona corretamente com `modal={false}`
3. Testar em desktop e mobile

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
- [x] **Pasta renomeada para `[done]-dropdown-remove-scroll-pagina`**
