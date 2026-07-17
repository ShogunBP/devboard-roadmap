# 🐛 Navbar trava em estado intermediário na transição grande → pequena (regressão)

**Status:** `ready-for-review`
**Data:** 2026-07-11
**Prioridade:** `alta`
**Tags:** `frontend`, `performance`
**Resumo:** Navbar apresentando travamentos e distorções visuais de elementos filhos durante a transição grande-pequena.

---

## Descrição
Após a primeira tentativa de correção (mudando o controle do NavBody para a engine de `layout` em vez de `animate` explícito), a navbar parou de "travar" com o erro de medição do Framer Motion, **porém**, a fluidez ficou terrível. Durante a transição do estado grande pro pequeno (e vice-versa), os elementos filhos (textos, botões, logo) ficam todos esmagados, esticados e visualmente bugados até que a animação termine. Além disso, o pause/travadinha retornou sob novas condições.

## Como Reproduzir
1. Acessar a página com a navbar no estado não-scrollado.
2. Rolar a página para baixo e para cima.
3. Observar a distorção (estiramento/esmagamento) do texto do logo e dos botões direitos durante a escala do fundo da navbar.

## Contexto Técnico
- Camada afetada: frontend (`src/components/ui/resizable-navbar.tsx` e `src/components/main/Navbar.tsx`)

## Hipótese de Causa (Revisada Definitivamente)
**Problema 1: Distorção de Escala (Scale Distortion)**
Quando aplicamos a prop `layout` no `NavBody` (para que ele transicione entre `w-full` e `w-fit`), o Framer Motion faz isso usando uma transformação CSS (`transform: scaleX(...)`). A documentação oficial afirma: *"Quando um componente pai é escalado por uma animação de layout, todos os seus filhos serão esticados/esmagados visualmente, a menos que os filhos também recebam a prop layout"*.
Como o `NavbarLogo`, os `NavItems` e a `div` dos botões da direita NÃO tinham a prop `layout` habilitada, eles sofrem uma distorção agressiva enquanto o container pai cresce/encolhe.

**Problema 2: AnimatePresence mascarando reflows do Layout**
O uso de `<AnimatePresence>` e `exit={{ width: 0 }}` no texto dos itens do menu não desencadeia uma mudança de bounding box nativa no ciclo de renderização do React da forma que a engine de FLIP (layout) do Framer Motion espera. Isso quebra o rastreamento, causando "travadinhas" e engasgos quando os nós entram/saem da DOM e a engine tenta sincronizar a animação do pai (`NavBody`).

## Plano de Correção
O segredo para animações fluidas de dimensões automáticas no Framer Motion é usar a engine de `layout` para **tudo** que muda de tamanho ou posição na tela, evitando distorções ao propagar o rastreamento para os filhos diretos, e abandonando `animate/exit` na dimensão `width`.

1. **Parar de usar `AnimatePresence` para o texto do menu:**
   Em `NavItems`, vamos parar de destruir o elemento `<motion.span>` condicionalmente. Ele ficará sempre na DOM, mas sua largura base e opacidade serão ditadas via CSS/style condicional (`width: isScrolled ? 0 : 'auto'`, `opacity: isScrolled ? 0 : 1`). Com a prop `layout` ligada nele, qualquer mudança na variável `isScrolled` forçará um reflow nativo, e a engine animará o tamanho de forma impecável, sem "pulos" de unmount.

2. **Evitar a Distorção dos Filhos:**
   Adicionar a prop `layout` (e repassar a `sharedTransition`) para todos os "blocos" principais dentro do `NavBody` para que apliquem a transformação inversa de escala:
   - Em `resizable-navbar.tsx`: Atualizar a tag base do `NavbarLogo` para `<motion.a layout transition={sharedTransition}>`.
   - Em `resizable-navbar.tsx`: Adicionar `layout` no container principal de `NavItems`.
   - Em `main/Navbar.tsx`: Trocar a `div` que envelopa os toggles/Language/Email por um `<motion.div layout transition={sharedTransition}>`.

3. **Garantir a mesma mola (spring):**
   Todos os elementos que recebem `layout` precisam ter a mesma `transition={sharedTransition}` para se moverem in uníssono.

---

## Review

## Feedback
> _(preencher durante o review)_

## Decisão
- [ ] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [ ] Sem distorção no logo e botões (scale invertido com sucesso).
- [ ] Sem pausa intermediária (layout trackeia a largura real).
- [ ] Nenhuma regressão no flicker de quebra de linha.
- [ ] **Pasta renomeada para `[done]-navbar-travando-intermediario` e movida para `archive/bugs/`**
