# 🐛 Navbar — Nome "Guilherme Menezes" desaparece ao scrollar (desktop e mobile)

**Status:** `done`
**Data:** 2026-07-09
**Prioridade:** `média`
**Tags:** `frontend`, `ui-ux`

> **Bloqueia:** `enhancements/[draft]-navbar-logo-texto-terminal`. O efeito de estilo terminal não deve ser implementado sobre um texto que desaparece ao scrollar — este bug precisa ser resolvido antes ou junto.
>
> **Nota de dado desatualizado:** o README do `navbar-logo-texto-terminal` cita a classe `group-hover:text-red-500`. O trecho de código confirmado neste documento mostra `group-hover:text-brand-highlight` como o valor atual. O outro README precisa ser corrigido antes de avançar de status.

---

## Descrição
O nome "Guilherme Menezes", exibido ao lado da foto de perfil na navbar, desaparece quando a página é scrollada (mais de 50px), tanto em desktop quanto em mobile. Confirmado pelo dono do projeto como comportamento antigo, presente desde sempre — não é regressão recente.

## Como Reproduzir
1. Abrir o site (desktop ou mobile).
2. Observar a navbar no topo: foto + nome "Guilherme Menezes" visíveis.
3. Scrollar a página verticalmente além de 50px.
4. Observar que o nome desaparece, restando apenas a foto (e, no mobile, o espaço em branco entre foto e menu hambúrguer).

## Comportamento Esperado
O nome deve permanecer visível na navbar independentemente do estado de scroll, tanto em desktop quanto em mobile.

## Comportamento Atual
O componente `NavbarLogo` condiciona a renderização do `<span>` do nome à negação do estado `isScrolled`. Quando `isScrolled` é `true`, o `<span>` não é renderizado.

## Contexto Técnico
- **Camada afetada:** frontend (componente compartilhado entre navbar desktop e mobile)
- **Arquivo(s) confirmado(s) por trecho de código real:**
  - `resizable-navbar.tsx` — componente `NavbarLogo`
  - `Navbar.tsx` — estado `isScrolled` e os dois pontos de uso do `NavbarLogo`

### Evidência de código coletada

Componente `NavbarLogo` completo:
```tsx
export const NavbarLogo = ({ isScrolled }: { isScrolled: boolean }) => {
  return (
    <a
      href="#about"
      className="group relative z-10 flex items-center space-x-3"
      aria-label="Navigate to About section"
    >
      <Image
        src="/guilherme.jpg"
        alt="Guilherme Menezes"
        width={32}
        height={32}
        className="rounded-full"
      />
      {!isScrolled && (
        <span className="text-lg font-bold group-hover:text-brand-highlight transition-colors">
          Guilherme Menezes
        </span>
      )}
    </a>
  )
}
```

Estado de scroll, definido em `Navbar.tsx`:
```tsx
const [isScrolled, setIsScrolled] = useState(false)
// ...
useEffect(() => {
  const onScroll = () => setIsScrolled(window.scrollY > 50)
  window.addEventListener('scroll', onScroll)
  return () => window.removeEventListener('scroll', onScroll)
}, [])
```

Uso no layout desktop:
```tsx
<NavBody>
  <NavbarLogo isScrolled={isScrolled} />
  <NavItems items={navItems} isScrolled={isScrolled} />
```

Uso no layout mobile:
```tsx
<MobileNav>
  <MobileNavHeader>
    <NavbarLogo isScrolled={isScrolled} />
    <MobileNavToggle
      isOpen={isMobileMenuOpen}
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    />
  </MobileNavHeader>
```

Isso confirma, por evidência direta (mesmo componente, mesma prop, mesmo estado), que desktop e mobile compartilham exatamente a mesma lógica de ocultação — não são dois bugs independentes, é uma única causa raiz.

## Hipótese de Causa
Não é hipótese — é causa confirmada por leitura direta do código: a condicional `{!isScrolled && (...)}` no `NavbarLogo` remove o `<span>` do nome inteiramente da árvore de renderização quando `isScrolled` é `true`. Não há CSS de transição/fade envolvido — é renderização condicional binária.

## Plano de Correção
*(Não preenchido — plano de correção é trabalho do agente executor após aprovação, não deste documento.)*

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

- [x] Bug não reproduz mais
- [x] Nenhuma regressão identificada
- [x] **Pasta renomeada para `[done]-navbar-nome-desaparece-ao-scroll`**
