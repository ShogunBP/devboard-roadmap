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

## Evidências Coletadas

**1. Renderização condicional no NavItems:**
```tsx
// src/components/ui/resizable-navbar.tsx (linha 138)
<div className="relative z-20 flex items-center justify-between gap-2">
  {item.icon} {!isScrolled && <span className="font-semibold">{item.name}</span>}
</div>
```
**Confirmação:** A hipótese está correta neste ponto. O span do texto é montado/desmontado instantaneamente via react sem nenhuma transição quando `isScrolled` vira `false`.

**2. Animação de largura no NavBody:**
```tsx
// src/components/ui/resizable-navbar.tsx (linhas 89 e 92-96)
width: visible ? 'fit-content' : '100%',
// ...
transition={{
  type: 'spring',
  stiffness: 200,
  damping: 50,
}}
```
**Confirmação:** A hipótese se sustenta completamente. O NavBody cresce em largura com um easing do tipo `spring`, mas o texto interno exige o espaço instantaneamente, causando o esmagamento do `NavbarLogo`.

## Hipótese de Causa
**Confirmada pelas evidências:** O flicker acontece porque há uma dessincronia fundamental: a re-exibição do texto do menu é instantânea, mas a expansão do container (`NavBody`) é animada via `spring`. O reflow instantâneo do texto espreme os demais itens flexíveis do layout até que a animação da largura do pai termine.

## Plano de Correção
Para corrigir a dessincronia e evitar o esmagamento do logo sem remover sua capacidade de "quebrar linha" (wrap) quando o viewport é genuinamente pequeno:

1. **Constante Compartilhada de Transição:** Extrair o objeto de transição do `NavBody` para uma constante no topo do arquivo para garantir sincronia absoluta:
```tsx
const sharedTransition = { type: 'spring', stiffness: 200, damping: 50 }
```

2. **Técnica Exata de Animação (NavItems):**
Em vez de renderização condicional instantânea, utilizaremos a propriedade `layout` do Framer Motion. Para que a largura do texto anime suavemente de zero ao tamanho total, a abordagem principal será utilizar a prop `layout` no `<motion.div>` pai do texto, permitindo que a engine do Framer Motion calcule e interpole automaticamente o bounding box durante a montagem/desmontagem do elemento, dispensando hacks com `width: "auto"`.

3. Aplicar a mesma `sharedTransition` ao `NavBody` e ao `NavItems`, garantindo que o texto cresça exatamente no mesmo ritmo que o container se expande.

4. Testar a correção manualmente, repetindo o ciclo scroll → topo → scroll várias vezes para garantir que o flicker não ocorre mais.

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
- [x] **Pasta renomeada para `[done]-flicker-navbar-logo-scroll` e movida para `archive/bugs/`**
