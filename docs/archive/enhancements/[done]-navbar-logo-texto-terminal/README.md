# 🔧 NavbarLogo — Substituir texto estático por estilo terminal com cursor piscando

**Status:** `done`
**Data:** 2026-07-09
**Prioridade:** `baixa`
**Tags:** `frontend`, `animação`, `ui-ux`

> **Nota de categoria:** Este item foi listado na Fase 0 como "texto estático do navbar". Como se trata de uma implementação nova sobre texto que funciona normalmente (não é um comportamento quebrado), foi registrado como `enhancement`. Mova para `bugs/` se preferir tratar como bug de UX.

---

## Contexto
O `NavbarLogo` exibe "Guilherme Menezes" em texto plano ao lado da foto de perfil na navbar, no estado não-scrollado. O texto é um `<span>` simples sem qualquer estilo visual diferenciado.

```tsx
// src/components/ui/resizable-navbar.tsx — linhas 247-251
<span className="text-lg font-bold group-hover:text-brand-highlight transition-colors">
  {text}
</span>
```

## Problema Atual
O texto é genérico e não comunica a identidade de desenvolvedor. "Guilherme Menezes" em fonte bold não diferencia visualmente o portfólio de qualquer outro — não aproveita o espaço da navbar para reforçar o posicionamento técnico do dono do portfólio.

## Melhoria Proposta
Substituir o `<span>` por um componente de texto com estética de terminal:

```
guilherme-menezes@home:~$▌
```

- Texto fixo: `guilherme-menezes@home:~$`
- Cursor: quadradinho (`▌` ou `█`) piscando em loop, simulando prompt de terminal ativo
- Fonte: monospace (ex: `font-mono`) para reforçar o estilo de CLI
- Cursor animado via CSS (`@keyframes blink` ou classe Tailwind `animate-pulse` / animação customizada)

## Impacto Esperado
- Reforço visual imediato do posicionamento como desenvolvedor técnico
- Diferenciação estética em relação a portfólios genéricos
- Impacto contido: apenas o `<span>` do nome na navbar desktop (estado não-scrollado)

## Plano de Implementação

1. Em `src/components/ui/resizable-navbar.tsx`, atualizar o componente `NavbarLogo` (que agora é usado apenas no desktop) para renderizar a estética de terminal:
   ```tsx
   <span className="font-mono text-sm md:text-base font-semibold group-hover:text-brand-highlight transition-colors flex items-center">
     guilherme-menezes@home:~$
     <span className="ml-[2px] inline-block w-2 h-4 bg-current animate-blink" />
   </span>
   ```

2. Adicionar a animação `animate-blink` no CSS global (`src/app/globals.css` ou via Tailwind config):
   ```css
   @keyframes blink {
     0%, 100% { opacity: 1; }
     50%       { opacity: 0; }
   }
   .animate-blink {
     animation: blink 1s step-start infinite;
   }
   ```
   *Ou via `tailwind.config` em `theme.extend.animation` e `theme.extend.keyframes`.*

3. Verificar contraste do cursor em modo claro e escuro (`bg-current` acompanha a cor do texto).

4. Como o `MobileNavHeader` foi refatorado recentemente para não usar mais o `NavbarLogo` para o texto central (utilizando uma tag separada), a alteração do `NavbarLogo` afetará exclusivamente o desktop, cumprindo o requisito de manter o layout limpo no mobile.

## Critérios de Conclusão
- [x] Texto "guilherme-menezes@home:~$" visível na navbar desktop (independente do estado de scroll)
- [x] Cursor quadrado piscando em loop após o `$`
- [x] Fonte monospace aplicada corretamente
- [x] Funciona em modo claro e escuro sem perda de contraste
- [x] Sem regressão no comportamento de scroll (sumiço do texto ao scrollar) existente
- [x] Comportamento definido para mobile (aplica ou mantém texto simples)

---

## Review

### Feedback
> Texto deve ficar visível na navbar desktop também no estado scrollado.

### Decisão
- [x] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [x] Melhoria perceptível e funcional
- [x] Nenhuma regressão identificada
- [x] **Pasta renomeada para `[done]-navbar-logo-texto-terminal` e movida para `archive/enhancements/`**
