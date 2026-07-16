# 🔧 Navbar Mobile — Reorganização do menu hambúrguer aberto

**Status:** `done`
**Data:** 2026-07-09
**Prioridade:** `média`
**Tags:** `frontend`, `ui-ux`

---

## Contexto
O menu mobile (hambúrguer) aberto hoje funciona sem erros, mas o dono do projeto suspeita que o layout pode ser melhorado. Não há comportamento quebrado — é uma questão de UX a ser decidida, ainda sem direção definida.

## Problema Atual
Comprovado por evidência visual (print anexado pelo dono do projeto) e por trecho de código real:

- O botão de email ocupa 100% da largura, posicionado abaixo dos toggles de tema/idioma.
- Os toggles de tema e idioma ficam nas extremidades opostas de uma mesma linha (idioma à esquerda, tema à direita), acima do botão de email.
- Não há consenso ainda sobre se essa disposição é a ideal — o próprio dono do projeto declarou não saber qual direção de UI/UX tomar.

## Contexto Técnico (evidência de código)

Container do menu mobile aberto (`MobileNavMenu`):
```tsx
export const MobileNavMenu = ({ children, className, isOpen }: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-white px-4 py-8 shadow-[...] dark:bg-neutral-950',
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

Conteúdo interno, em `Navbar.tsx`:
```tsx
<MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
  {navItems.map((item) => (
    <Link
      key={`mobile-link-${item.name}`}
      href={item.link}
      onClick={() => {
        setIsMobileMenuOpen(false)
        document.getElementById(item.link.slice(1))?.scrollIntoView({ behavior: 'smooth' })
      }}
      className="relative text-neutral-600 dark:text-neutral-300 flex gap-2 items-center"
    >
      {item.icon} <span>{item.name}</span>
    </Link>
  ))}
  <div className="flex w-full flex-col gap-4">
    <div className="flex justify-between w-full gap-4">
      <LanguageToggle />
      <ThemeToggle />
    </div>
    <Button
      onClick={() => {
        setIsMobileMenuOpen(false)
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
      }}
      variant="default"
      className="w-full rounded-full"
    >
      <FaEnvelope />
    </Button>
  </div>
</MobileNavMenu>
```

**Confirmado por trecho real:**
- O menu é posicionado de forma absoluta (`absolute inset-x-0 top-16`), logo abaixo da navbar fixa.
- Ordem no DOM (de cima para baixo no fluxo `flex-col`): links de navegação → linha de toggles (idioma/tema) → botão de email.
- `LanguageToggle` e `ThemeToggle` reaproveitam exatamente os mesmos componentes usados no desktop; o `Button` de email também reaproveita o mesmo componente base, com classes diferentes (`w-full` no mobile vs `rounded-full z-50` no desktop).

## Melhoria Proposta
Esta seção reflete a decisão de UX confirmada pelo dono do projeto, e não uma sugestão da IA:
- **Header fixo (`MobileNavHeader`), estado FECHADO do menu**: mantém "foto — 'Portfólio' — ícone hambúrguer" (a alteração para manter o texto já está coberta pelo bug `docs/bugs/[approved]-navbar-desktop-sobreposicao-botoes-1200px` — esta é apenas uma referência, não duplicar a especificação).
- **Header fixo, estado ABERTO do menu**: muda para "foto — texto 'Menu' — Idioma — Tema — X", todos na mesma linha do topo, nessa ordem da esquerda para a direita. O ícone do botão de fechar (hoje hambúrguer) vira X quando o menu está aberto — isso já é comportamento existente, não muda.
- **Estrutural**: `LanguageToggle` e `ThemeToggle` devem ser MOVIDOS de dentro do `MobileNavMenu` (onde estão hoje) para dentro do `MobileNavHeader`, aparecendo apenas quando o menu está aberto (não devem aparecer com o menu fechado).
- **Conteúdo do `MobileNavMenu`** (área que abre/fecha): passa a conter apenas os links de navegação (About, Skills, Experience, Projects, Blogs) e o botão de email (mantém `w-full`, destacado, sem mudança de estilo).
- **Nota para o futuro**: quando existir o painel administrativo (fase futura do roadmap), pode surgir opção para os toggles aparecerem mesmo com o menu fechado — isso está FORA de escopo deste documento, é apenas contexto para não surpreender quem revisitar isso depois.

## Impacto Esperado
A mudança visa reduzir a assimetria percebida hoje (toggles isolados nos cantos, desconectados do botão de fechar) e consolidar ações de "configuração" (idioma/tema/fechar) num único agrupamento, deixando o email como a única ação de destaque na área de conteúdo do menu.

## Plano de Implementação
1. Mover os componentes `LanguageToggle` e `ThemeToggle` de dentro do `MobileNavMenu` para dentro do `MobileNavHeader`.
2. Condicionar a renderização desses dois componentes dentro do `MobileNavHeader` ao estado `isOpen` do menu (só renderizam quando `isOpen` é `true`).
3. Ajustar o texto do `NavbarLogo` (ou equivalente) dentro do header para alternar entre "Portfólio" (fechado) e "Menu" (aberto), dependendo do mesmo estado `isOpen`.
4. Verificar que o ícone de hambúrguer/X já responde a esse mesmo estado (parece já ser o comportamento atual — confirmar com trecho de código antes de assumir).
5. Remover os toggles do bloco de ações dentro do `MobileNavMenu`, deixando apenas o botão de email.
6. Validar visualmente que a linha do header (foto + Menu + Idioma + Tema + X) não quebra ou aperta em larguras mobile pequenas (ex: 320-375px) — isso é uma nova área de risco de sobreposição que não existia antes.

## Critérios de Conclusão
- [x] Header fechado mostra "Portfólio".
- [x] Header aberto mostra "Menu" + toggles + X.
- [x] Toggles não aparecem com o menu fechado.
- [x] Email mantém destaque isolado na área do menu.
- [x] Sem quebra ou sobreposição de elementos na linha do header em larguras pequenas (320-375px).

---

## Review

### Feedback
> _(preencher durante o review)_

### Decisão
- [x] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [ ] Melhoria perceptível e funcional
- [ ] Nenhuma regressão identificada
- [ ] **Pasta renomeada para `[done]-navbar-mobile-menu-reorganizacao`**
