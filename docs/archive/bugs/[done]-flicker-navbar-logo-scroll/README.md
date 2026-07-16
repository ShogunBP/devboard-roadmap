# 🐛 Flicker/quebra de linha no NavbarLogo ao voltar do scroll para o topo

**Status:** `done`
**Data:** 2026-07-09
**Prioridade:** `média`
**Tags:** `frontend`, `ui-ux`

---

## Descrição
Ao rolar a página e depois retornar ao topo, o texto do `NavbarLogo` na navbar desktop sofre um flicker visual: por um instante ele quebra para duas linhas antes de voltar para uma linha só.

## Como Reproduzir
1. Acessar a página com a navbar no estado não-scrollado (topo).
2. Rolar a página para baixo até a navbar entrar no estado "scrollado" (versão reduzida).
3. Rolar de volta até o topo, fazendo a navbar retornar ao estado não-scrollado.
4. Observar o texto do logo (`guilherme-menezes@home:~$` ou equivalente atual) durante a transição.

## Comportamento Esperado
A transição entre o estado scrollado e não-scrollado deve ser suave, com o texto do logo permanecendo em uma única linha durante toda a animação, sem quebra ou salto visual.

## Comportamento Atual
No momento em que a navbar retorna ao estado não-scrollado, o texto do logo quebra brevemente para duas linhas e, em seguida, volta para uma linha — gerando um flicker perceptível.

## Contexto Técnico
- Camada afetada: frontend
- Arquivo(s) suspeito(s): `src/components/ui/resizable-navbar.tsx` (componente `NavbarLogo` e lógica de transição scrolled/não-scrollado)
- Logs de erro: nenhum (bug visual, não gera erro de console — a confirmar)

## Hipótese de Causa
**Confirmada:** A transição do `NavBody` altera o `width` de `fit-content` (no estado scrollado) para `100%` (no estado inicial) usando uma animação `spring`. Durante essa transição de recálculo da largura da navbar, o texto do logo dentro de `NavbarLogo` sofre uma breve restrição de espaço antes do container se expandir totalmente, o que causa a quebra de linha. O `span` do logo não possui a classe `whitespace-nowrap`, permitindo que o texto flexione para múltiplas linhas indesejadamente.

## Plano de Correção
1. Em `src/components/ui/resizable-navbar.tsx` (linhas 246-247), adicionar as classes utilitárias do Tailwind `whitespace-nowrap` e `shrink-0` ao container `span` principal do texto do logo:

```tsx
<span className="font-mono text-sm md:text-base font-semibold group-hover:text-brand-highlight transition-colors flex items-center whitespace-nowrap shrink-0">
```

2. Testar manualmente a transição de scroll e validar que o texto não quebra mais para duas linhas e não sofre "squishing" (estreitamento residual) em nenhum momento.

---

## Review

### Feedback
> flex-shrink-0 no mesmo span — sem isso, mesmo com nowrap, o container flex pai pode espremer o elemento durante a transição (em vez de quebrar linha, ele simplesmente fica na largura errada por um instante, ou trunca visualmente).

### Decisão
- [x] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [x] Bug não reproduz mais
- [x] Nenhuma regressão identificada
- [x] **Pasta renomeada para `[done]-flicker-navbar-logo-scroll` e movida para `archive/bugs/`**
