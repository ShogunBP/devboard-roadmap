# 🐛 Navbar Desktop — Sobreposição de botões em larguras próximas a 1200px

**Status:** `done`
**Data:** 2026-07-09
**Prioridade:** `alta`
**Tags:** `frontend`, `ui-ux`

---

## Descrição
Ao scrollar a página em desktop, com a largura da viewport próxima de 1200px (e potencialmente em todo o intervalo entre o breakpoint mínimo de desktop e ~1200px), os botões de ação da navbar (email, theme toggle, language toggle) começam a se sobrepor visualmente aos links de navegação (About, Skills, Experience, Projects, Blogs).

> [!NOTE]
> **Causa raiz unificada:** Este bug é também a causa raiz do que era tratado originalmente no roadmap como o "bug #4" (itens de navegação não clicáveis / `NavBody` / `NavbarWrapper`). A falha no clique dos links de navegação é uma consequência direta da sobreposição física detalhada neste documento (conforme verificado em teste manual pelo dono do projeto), e por isso não deve ser tratado como um problema separado nem possuir uma pasta própria na documentação.

## Como Reproduzir
1. Abrir o site em desktop com a viewport em torno de 1200px de largura.
2. Scrollar a página verticalmente (mais de 50px, ativando o estado de navbar "encolhida").
3. Observar a área central/direita da navbar: os links de navegação e os botões de ação passam a ocupar o mesmo espaço visual.
4. Em ~1200px de largura, com o scroll ativo (navbar colapsada), tentar clicar nos links de navegação (About, Skills, Experience, Projects, Blogs). O clique para de funcionar porque os botões de ação (idioma, tema, e-mail) passam a ficar fisicamente sobrepostos a eles (confirmado em teste manual pelo dono do projeto).

## Comportamento Esperado
Independentemente da largura da tela (dentro do breakpoint de desktop) ou do estado de scroll, os links de navegação e os botões de ação devem permanecer visualmente distintos, sem sobreposição, ajustando-se ao espaço disponível.

## Comportamento Atual
Ao ativar o estado de scroll (`isScrolled`/`visible`), a navbar (`NavBody`) anima sua largura de `100%` para `40%` da tela. Nesse estado reduzido, os elementos internos (logo, links, botões de ação) passam a competir pelo mesmo espaço, com os links de navegação se sobrepondo aos botões por estarem posicionados de forma absoluta.

## Contexto Técnico
- **Camada afetada:** frontend (componente de navbar desktop)
- **Arquivo(s) confirmado(s) por trecho de código real:**
  - `resizable-navbar.tsx` — componentes `NavBody` e `NavItems`
  - `Navbar.tsx` — composição da navbar desktop (`NavBody` + `NavbarLogo` + `NavItems` + botões de ação)
- **Logs de erro:** não aplicável (bug visual de layout, não runtime)

### Evidência de código coletada

Container da navbar desktop (`NavBody`):
```tsx
<motion.div
  animate={{
    backdropFilter: visible ? 'blur(10px)' : 'none',
    boxShadow: visible ? '...' : 'none',
    width: visible ? '40%' : '100%',
    y: visible ? 20 : 0,
  }}
  transition={{ type: 'spring', stiffness: 200, damping: 50 }}
  style={{ minWidth: '200px' }}
  className={cn(
    'relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-full bg-transparent px-4 py-2 lg:flex dark:bg-transparent',
    visible && 'bg-white/80 dark:bg-neutral-950/80',
    className,
  )}
>
  {children}
</motion.div>
```

Bloco de links de navegação (`NavItems`), posicionado de forma absoluta dentro do container:
```tsx
<motion.div
  onMouseLeave={() => setHovered(null)}
  className={cn(
    'absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2',
    className,
  )}
>
  {/* ... */}
</motion.div>
```

Composição em `Navbar.tsx`:
```tsx
<NavBody>
  <NavbarLogo isScrolled={isScrolled} />
  <NavItems items={navItems} isScrolled={isScrolled} />
  <div className="relative z-10 flex items-center gap-2">
    <LanguageToggle />
    <ThemeToggle />
    <Button variant="default" className="rounded-full z-50" onClick={() => { /* ... */ }}>
      <FaEnvelope />
    </Button>
  </div>
</NavBody>
```

### Valores relevantes confirmados no código
- Breakpoint de ativação do layout desktop: `lg:` (1024px, padrão Tailwind).
- Largura máxima da navbar: `max-w-7xl` (1280px).
- Largura no estado "scrolled": `40%` da viewport — em 1200px de tela, equivale a 480px físicos; em 1024px (breakpoint mínimo), equivale a ~409.6px.
- `minWidth: '200px'` definido inline na `NavBody` (ainda não analisado se conflita com os 40% — ver lacuna abaixo).

## Hipótese de Causa
**Confirmada parcialmente por teste manual do dono do projeto.** Duas causas candidatas, combinadas, levantadas a partir da leitura do código:

1. **Posicionamento absoluto do `NavItems`** (`absolute inset-0`): por estar fora do fluxo normal do flexbox da `NavBody`, o bloco de links não interage com a largura física dos elementos vizinhos (logo, botões de ação) para evitar sobreposição — ele simplesmente se centraliza por cima do espaço disponível.
   *Nota: O cenário sem scroll próximo de 1024px não foi reproduzido no teste manual do dono do projeto (que testou apenas com scroll ativo). Portanto, a Causa 1 permanece não testada e precisa ser validada futuramente.*
2. **Redução para 40% no estado "scrolled"**: com a navbar reduzida a ~480px (a 1200px de tela) ou ~409.6px (a 1024px), o espaço pode não comportar logo + links + botões de ação simultaneamente, forçando a sobreposição do conteúdo absoluto sobre os botões (`relative z-10`).
   *Nota: Esta causa foi confirmada por teste manual real. O dono do projeto verificou que, a ~1200px de largura com scroll ativo, o clique nos links de navegação falha porque os botões de ação ficam fisicamente sobre eles, validando o comportamento previsto.*

**Lacuna identificada, não preenchida por suposição:** não foi analisado se `minWidth: '200px'` (definido inline) entra em conflito ou mitiga parcialmente o problema em alguma faixa de largura. Isso precisa ser investigado antes de qualquer plano de correção.

## Plano de Correção

> [!IMPORTANT]
> **Proposta de Direção de Design (Dono do Projeto):**
> O plano a seguir descreve a direção de design proposta pelo dono do projeto. Esta proposta ainda **não está aprovada** como a especificação técnica final para implementação. Os detalhes técnicos exatos do "como" (por exemplo, uso de `width: fit-content`, remoção de animações percentuais rígidas, determinação precisa dos breakpoints para tablets) ainda dependem de definição e validação antes que o status do documento possa avançar para `[approved]`.

### Diretrizes Propostas:
- **Exibição do Nome:** Não ocultar o nome "Guilherme Menezes" ao scrollar, mantendo-o sempre visível na barra.
- **Largura Dinâmica no Scroll:** Ao colapsar devido ao scroll, o menu (`NavBody`) não deve assumir uma porcentagem fixa (como os atuais `40%`) de forma rígida. Em vez disso, a largura deve se ajustar com base no espaço real necessário para comportar o nome, os links e as ações juntos, prevenindo qualquer sobreposição.
- **Comportamento em Tablets:** Esse modelo de dimensionamento fluido baseado no conteúdo deve se estender também para resoluções de tablet, e não apenas desktop.
- **Layout Mobile:** O layout simplificado (exibindo foto de perfil $\rightarrow$ texto centralizado "Portfólio" $\rightarrow$ ícone do menu hambúrguer) deve ser ativado apenas ao entrar formalmente no breakpoint mobile.

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
- [x] **Pasta renomeada para `[done]-navbar-desktop-sobreposicao-botoes-1200px`**
