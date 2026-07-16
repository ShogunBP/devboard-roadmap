# 🐛 NavbarLogo — Não é clicável no desktop

**Status:** `done`
**Data:** 2026-07-09
**Prioridade:** `média`
**Tags:** `frontend`, `ui-ux`

---

## Descrição
O `NavbarLogo` está projetado para ser um link navegável (envolto por uma tag `<a>`). Ele funciona e é clicável corretamente na versão responsiva (mobile), porém, no desktop (estado não-scrollado), o clique no logo não tem efeito.

## Como Reproduzir
1. Abrir o portfólio em desktop (viewport >= 1024px)
2. Tentar clicar no logo "Guilherme Menezes" no lado esquerdo da navbar
3. Observar que o clique não funciona e o cursor não muda para pointer

## Comportamento Esperado
O logo deve ser clicável e ancorar para a seção `#about`, assim como ocorre no mobile.

## Comportamento Atual
O `NavbarLogo` de fato possui a estrutura de link com `href` e é clicável no mobile (onde é renderizado dentro de `MobileNavHeader`), mas não funciona no desktop quando o componente irmão `NavItems` está renderizado junto com ele no `NavBody`:

```tsx
// src/components/ui/resizable-navbar.tsx (linhas 232-237)
export const NavbarLogo = ({ isScrolled }: { isScrolled: boolean }) => {
  return (
    <a
      href="#about"
      className="group flex items-center space-x-3"
      aria-label="Navigate to About section"
    >
```

## Contexto Técnico
- Camada afetada: frontend
- Arquivo(s) suspeito(s):
  - `src/components/ui/resizable-navbar.tsx` — `NavbarLogo` e `NavItems`

## Hipótese de Causa
**Hipótese não confirmada por inspeção real —** A suspeita atual é que o componente irmão `NavItems` esteja sobrepondo fisicamente a área do logo e bloqueando os eventos de clique no desktop.

O `NavItems` possui a classe `absolute inset-0`, que faz com que ele estique sobre todo o `NavBody`:
```tsx
// src/components/ui/resizable-navbar.tsx (linhas 114-121)
export const NavItems = ({ items, className, isScrolled, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        'absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 ... lg:flex ...',
        className,
      )}
    >
```
Sem uma declaração de `z-index` explícita no `NavbarLogo`, a camada absoluta do `NavItems` pode estar posicionada acima dele no contexto de empilhamento.

## Diagnóstico Real (Comprovado via Teste Programático)
A hipótese visual foi testada e **confirmada como a causa exata**. 
Através de um script de diagnóstico rodando `document.elementFromPoint(x, y)` exatamente no centro do `NavbarLogo`, o elemento retornado pelo navegador foi:
```text
DIV class: absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2
```
Este é o container de `NavItems`. Como ele usa `absolute inset-0`, ele estica para cobrir 100% da Navbar (para permitir que os itens fiquem centralizados perfeitamente na tela). Por estar no mesmo nível hierárquico, ele é renderizado sobre o Logo, interceptando invisivelmente os cliques.

## Plano de Correção
Como a classe `inset-0` do `NavItems` é estrutural para o alinhamento central do flexbox, a solução não deve alterar a geometria do menu, mas sim ajustar a ordem de empilhamento (stacking context). O uso de `pointer-events-none` causou uma regressão no efeito de `:hover` do logo, portanto a abordagem correta é o controle de eixo Z.

1. Em `src/components/ui/resizable-navbar.tsx`, adicionar as classes `relative z-10` ao elemento `<a>` principal do `NavbarLogo`.
2. Adicionar as mesmas classes `relative z-10` ao container das ações da direita (`ThemeToggle` e botão de CV) em `NavBody`, para garantir que eles também fiquem acima da camada invisível do menu central.
Isso fará com que os elementos clicáveis fiquem em uma camada fisicamente superior ao `NavItems` (que tem `z-index` automático), restaurando tanto o clique quanto a detecção nativa de hover.

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
- [x] **Pasta renomeada para `[done]-navbar-logo-nao-clicavel-desktop`**
