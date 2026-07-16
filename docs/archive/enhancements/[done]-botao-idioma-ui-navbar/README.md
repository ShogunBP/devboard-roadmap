# 🔧 Language Toggle — Botão de Idioma na Navbar (UI)

**Status:** `done`
**Data:** 2026-07-09
**Prioridade:** `média`
**Tags:** `frontend`, `ui-ux`

---

## Descrição
A Fase 0 do roadmap exige a base visual para a escolha de idiomas. Este item foca na criação estrita da UI do botão (toggle) na Navbar, que ficará ao lado do botão de Tema. Ele prepara o terreno para a Fase 3, onde a lógica sistêmica real e a infraestrutura de tradução (i18next) serão inseridas neste mesmo componente.

## Escopo

O que **ESTÁ INCLUSO** neste item (Fase 0):
- Um botão/toggle visual novo, posicionado ao lado do `ThemeToggle` na navbar, construído como um controle separado.
- Um estado local (mock) simples no componente, permitindo alternar a aparência visual ao clicar (ex: exibir a sigla "PT" ou "EN").

O que **NÃO ESTÁ INCLUSO** neste item (Reservado para a Fase 3):
- Lógica real de tradução, troca de conteúdo no site ou instalação do `i18next`.
- Persistência de preferência (localStorage, cookies, session, etc.).

## Contexto Técnico
- Camadas afetadas: frontend (interface)
- Arquivo(s) alvo:
  - `src/components/ui/resizable-navbar.tsx` (para posicionar o botão dentro da div de ações à direita).
  - Criação do componente estritamente visual em `src/components/ui/language-toggle.tsx`. **Nota de Convenção:** Seguimos o padrão kebab-case (`language-toggle.tsx`) usado em outros componentes UI do projeto. Ele é explicitamente um componente visual no momento, e não um hook de lógica (`use-idioma`), já que o papel dele agora é prover a casca da interface.

## Plano de Correção
1. Criar o componente visual `LanguageToggle` usando um ícone descritivo ou botões de sigla (PT/EN), aderindo ao mesmo estilo de botão fantasma (ghost/variant) e tema visual do `ThemeToggle`.
2. Embutir um `useState<'PT' | 'EN'>` puramente cosmético que responde a cliques com uma transição suave. **Observação de Arquitetura:** Este estado local é estritamente temporário e desenhado apenas para dar feedback visual agora. Na Fase 3, ele será completamente substituído por um hook de contexto/provider (similar ao funcionamento do `next-themes` para o dark mode) para orquestrar o i18next globalmente.
3. Importar e adicionar o `LanguageToggle` em `resizable-navbar.tsx`, junto ao `ThemeToggle` na div `flex items-center gap-2`.
4. Assegurar que ele herde a classe `relative z-10` recém-implementada para não perder a interatividade no desktop sob o grid invisível.

## Review

### Feedback
> _(preencher durante o review)_

### Decisão
- [ ] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [x] O botão foi adicionado com sucesso e não desconfigura a Navbar responsivamente.
- [x] O clique alterna a indicação de idioma (PT/EN) no estado local apenas visualmente.
- [x] O botão compartilha a correta interação de pointer-events da versão refatorada (sem regressões para o layout global).
- [x] **Pasta renomeada para `[done]-botao-idioma-ui-navbar`**
