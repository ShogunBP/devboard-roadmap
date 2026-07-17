# 🗺️ Roadmap — roadmap-universal

Plano de implementação do sistema de visualização de docs (kanban/roadmap estático que lê `/docs` de qualquer projeto). Documento de acompanhamento — não segue o fluxo formal de `/docs/PADRONIZATION.md` (esse próprio projeto ainda não tem docs sobre si mesmo), é só um guia de fases pra manter o controle do que já foi decidido e o que falta.

---

## Fase 0 — Fundação (concluída)

- [x] Decidir que o roadmap é **somente leitura** (sem interação de escrita nos docs)
- [x] Definir arquitetura: `roadmap-server.js` observa `/docs` via `fs.watch`, gera `data.js` + `data.json`; `roadmap.html` continua estático, consumindo esses arquivos
- [x] Definir que o `roadmap.html` fica na raiz do projeto, apontando para `roadmap/roadmap.css` e `roadmap/roadmap.js`
- [x] Definir que `roadmap-server.js` fica dentro de `/roadmap`, observando `../docs`
- [x] Atualizar `PADRONIZATION.md`: adicionar campos `Prioridade` e `Tags` ao cabeçalho dos templates, documentar lista de tags predefinidas, e definir cálculo de progresso via checkboxes
- [x] Criar estrutura de pastas do projeto (`docs/active`, `docs/archive`, `roadmap/`)
- [x] Popular fixtures reais de teste em `docs/` (itens variados: active/archive, categorias diferentes, tags múltiplas/únicas, progresso parcial/completo)

---

## Fase 1 — Parser e geração de dados (concluída)

- [x] Implementar `roadmap/roadmap-server.js`:
  - [x] Percorrer `docs/active` e `docs/archive` recursivamente
  - [x] Parsear cada `README.md`: status (via prefixo da pasta), categoria (via path), título, data, prioridade, tags, progresso (checkboxes)
  - [x] Gerar `data.json` e `data.js` (novo formato `ROADMAP_TASKS`) em `/roadmap`
  - [x] Implementar `fs.watch` recursivo com debounce (~250ms)
  - [x] Rodar uma geração inicial completa ao iniciar o script
  - [x] Tratamento de erros resiliente (README ausente, campo faltando, pasta vazia)
- [x] Validar manualmente o `data.json` gerado contra os fixtures reais
- [x] Confirmar que casos de borda funcionam: status divergente entre pasta e arquivo, tags múltiplas vs. única, progresso 0%/parcial/100%

---

## Fase 2 — Integração com o front-end (concluída)

- [x] Adaptar `roadmap.js` para consumir o novo formato `ROADMAP_TASKS` (em vez do `INITIAL_TASKS` fictício atual)
- [x] Mapear os campos novos (categoria, prioridade, tags, área active/archive) na renderização dos cards e do modal de detalhe
- [x] Decidir e implementar a visualização de `area` (active vs. archive) — nova coluna? Filtro? Seção separada?
- [x] Ajustar filtros de prioridade e busca para usar os dados reais (hoje usam os valores fictícios do `data.js` de exemplo)
- [x] Remover ou isolar os dados fictícios de exemplo (`INITIAL_TASKS` atual) do fluxo principal
- [x] Ajuste adicional: desativar completamente o drag-and-drop no roadmap.js (visualização somente leitura)
- [x] Refinamento pós-validação: Agrupamento em 5 colunas, mapeamento do status original e toggle para ocultar cancelados

**Pendência conhecida, adiada para a Fase 4:** responsividade em mobile/tablet ainda não foi ajustada — só o breakpoint desktop (`xl:grid-cols-4/5`) foi corrigido; os breakpoints menores (`grid-cols-1` mobile, `sm:grid-cols-2` tablet, `lg:grid-cols-3`) foram definidos numa etapa anterior. Sem causa raiz diagnosticada ainda.

---

## Fase 3 — Atualização quase em tempo real (concluída)

- [x] Implementar polling no `roadmap.js`: `fetch('roadmap/data.json')` a cada 2-3s
- [x] Comparar com estado atual em memória (evitar re-render desnecessário)
- [x] Preservar estado de UI (scroll, modal aberto, filtros) entre atualizações
- [x] Testar o ciclo completo: editar um README → ver o roadmap atualizar sozinho (com F5 ou automaticamente, conforme Fase 3)

**Nota de validação:** a primeira rodada de implementação (servidor HTTP estático embutido no `roadmap-server.js` + polling básico) passou no teste do ciclo completo, mas o usuário identificou duas falhas reais durante o uso:
1. O `fetch('roadmap/data.json')` estava sendo servido do cache do navegador, mascarando atualizações reais geradas pelo servidor.
2. O scroll interno do `#modal-body` (quando o modal de detalhe estava aberto e scrollado) voltava ao topo a cada ciclo de polling, junto com o re-render completo do `renderApp()`.

Correções aplicadas e revisadas linha a linha antes da aprovação:
- Cache buster (`?_t=' + Date.now()`) adicionado à URL do fetch em `startPolling()`.
- Captura de `scrollTop` de `#modal-body` (e de cada `.kanban-col` e `window.scrollY`) no início de `renderApp()`, com restauração via `requestAnimationFrame` após o DOM ser reconstruído, buscando o elemento novamente pelo ID (não reutilizando a referência antiga).

Validado com teste manual real cobrindo as 3 situações de scroll (página, coluna do kanban, modal aberto) simultaneamente à edição de um README real. Fase considerada estável a partir desta segunda rodada, não da implementação inicial.

---

## Fase 4 — Polimento e portabilidade

- [ ] Testar abrir `roadmap.html` direto (`file://`) sem o server rodando — confirmar que funciona com o `data.js` estático como fallback
  - [ ] Indicador visual discreto (badge "modo estático") quando o polling falhar/não houver servidor, em vez de só logar no console
- [ ] Testar publicação em GitHub Pages (ou hospedagem estática equivalente) com um `data.js`/`data.json` já commitado — depende de repositório remoto ainda não configurado; passo guiado separado, fora do escopo de execução por agente
- [ ] Documentar no próprio projeto (`README.md` da raiz) como usar em outro projeto: copiar pasta, ajustar caminho relativo do `docs/`, rodar o server
- [x] Revisar visualmente o design (cores, cards, modal) — sistema de temas visuais implementado e validado (ver detalhamento abaixo)
- [x] Reestruturar informação exibida no card mini e no modal de detalhes (ver detalhamento abaixo)
- [ ] Revisar responsividade mobile/tablet (grid do Kanban e modal) — pendência conhecida desde a Fase 2, sem causa raiz diagnosticada ainda

### Sistema de temas visuais (concluído)

Implementado um seletor com 4 temas visuais distintos, cada um com variante clara e
escura (8 combinações no total), com o toggle claro/escuro existente funcionando como
dimensão ortogonal ao tema escolhido, persistido em `localStorage`:

- **`default`** (renomeado do antigo `blueprint`) — planta técnica: fundo azul-tinta
  (escuro) ou papel técnico (claro), grid sutil de fundo, ciano elétrico/azul técnico
  como acento, cantos quadrados com corte diagonal nos cards. **Tema que carrega por
  padrão em visitas novas.**
- **`terminal`** — painel de controle: fundo neutro escuro/claro, âmbar como acento
  único.
- **`clean`** (renomeado do antigo `default`) — tema shadcn genérico original do
  projeto, mantido como opção secundária sem alteração visual.
- **`ficha`** — ficha de arquivo: papel kraft (claro) ou sépia escuro (escuro),
  tipografia serifada nos títulos, carimbo de **prioridade** (não status) inclinado no
  card, cantos quadrados, sem indicador de status visível no card (status só aparece no
  modal).

**Processo de correção (várias rodadas de revisão real, não aprovado de primeira):**
- Corrigido: badge de status desaparecendo por engano no tema ficha (era resquício de
  condição de uma versão anterior do carimbo).
- Corrigido: cor da barra de progresso ausente no tema ficha e demais variáveis
  semânticas (`--status-*`, `--priority-*`, `--gradient-primary`) só existindo dentro do
  bloco do tema clean — promovidas para `:root` como default herdado por todos os temas.
- Corrigido: grid de fundo e corte diagonal do tema `default`/blueprint não renderizando
  visualmente apesar do CSS estar tecnicamente aplicado — causa raiz identificada via
  diagnóstico DevTools (cache do navegador + chanfro de 10px quase imperceptível contra
  `border-radius` de 8px); resolvido com cache buster no HTML e chanfro maior (16px) +
  remoção do arredondamento conflitante.
- Corrigido: flash branco/preto no F5 (FOUC) — resolvido com script inline síncrono no
  `<head>`, antes do CSS, aplicando `data-theme` e classe `dark` no `<html>` antes do
  primeiro paint.
- Corrigido: ordem do seletor de temas (Padrão precisa ser a primeira opção da lista).

Validado com prints reais das 8 combinações (4 temas × 2 modos) e confirmação manual do
usuário de que não há mais flash no carregamento.

### Reestruturação de informação (card mini + modal) (concluída)

Motivação: o card mini estava sobrecarregado de metadado de sistema (ID/slug), e o
modal de detalhe mostrava pouca informação real do conteúdo do README (focava em
caminho do arquivo, instruções de edição), sem aproveitar a estrutura rica que já existe
em cada `README.md` (Descrição, Como Reproduzir, Critérios de Conclusão, etc.).

**Mudanças no `PADRONIZATION.md`** (propagadas para o agente `docs.md` e a skill
`docs-standard.md`, que também foram atualizados):
- Novo campo obrigatório `**Resumo:**` no cabeçalho de todos os templates — uma linha
  curta e objetiva, existe para que ferramentas externas tenham um resumo confiável de
  tamanho previsível, sem depender de truncar a primeira seção do corpo do documento.
- `### Feedback` e `### Decisão` (dentro de `## Review`) promovidos para `## Feedback` e
  `## Decisão` — permite que o parser genérico de seções avalie cada subseção
  independentemente (ex: detectar que Feedback está vazio enquanto Decisão já foi
  marcada).
- Todos os READMEs existentes (ativos e arquivados) foram migrados em lote para o novo
  formato.

**Parser (`roadmap-server.js`)**:
- Extrai `summary` do campo `**Resumo:**` do cabeçalho, com fallback para a primeira
  seção qualificada do documento (truncada) quando o campo não existe.
- Extrai `sections: [{ heading, content }]` — todas as seções de nível `##` do corpo,
  excluindo `Review`/`Feedback`/`Decisão`/`Validação` (que têm tratamento próprio) e
  seções vazias/placeholder (`_(preencher...)_`).
- Extrai `criteriaSections` separadamente — "Critérios de Conclusão" e "Validação",
  usadas tanto para o cálculo de `progress` (%) quanto para a aba "Critérios" do modal.
- Extrai `progressFraction: { done, total }` — contagem absoluta de checkboxes, exibida
  no card mini.

**Card mini**: removido o ID/slug do rodapé; adicionada a fração de critérios (ex:
`3/4`) ao lado da data. Categoria e área não duplicadas (já existem como badge no topo
do card).

**Modal**: reestruturado com sistema de abas (Conteúdo / Critérios / Detalhes):
- Header: badges + ícone de informação (popover com instruções de edição, substituindo
  o bloco de texto fixo que existia antes) + botão fechar.
- Resumo (`summary`) e barra de progresso compacta (`X/Y critérios`) sempre visíveis,
  fora das abas.
- Aba "Conteúdo" (padrão): seções dinâmicas do README, convertidas de markdown para
  HTML com um conversor nativo (sem dependência externa) suportando negrito, itálico,
  código inline, listas, checkboxes, múltiplos parágrafos e sub-headings `###`
  aninhados.
- Aba "Critérios": checklist visual (check verde riscado / quadrado vazio) de Critérios
  de Conclusão e Validação.
- Aba "Detalhes": tags, caminho do arquivo, ID/slug, data — bloco de texto fixo
  "Roadmap Somente Leitura" removido por ser redundante em todo modal.

**Processo de correção real (não aprovado de primeira):**
- Corrigido: seções de processo (Review/Feedback/Decisão/Validação) vazando para dentro
  do array `sections` genérico em uma primeira tentativa do parser — excluídas
  corretamente após revisão.
- Corrigido: conversor de markdown não tratava negrito/itálico inline nem múltiplos
  parágrafos dentro da mesma seção — ampliado e testado contra conteúdo real complexo
  (seção "Hipótese de Causa" do item `navbar-travando-intermediario`).
- Corrigido: linha que é exclusivamente negrito (ex: `**Problema 1: ...**`) seguida de
  texto normal aparecia colada na mesma frase sem quebra visual — tratada como
  mini-título (`<h4>`) separado do parágrafo seguinte.
- Corrigido: sub-headings `### ` dentro de uma seção `##` (ex: "Inclui"/"Não inclui" em
  Escopo) vazavam como caracteres literais no texto — tratados como sub-título (`<h5>`).
- Confirmado: negrito e código inline aninhados no mesmo trecho (ex: item de Validação
  com `**texto com \`código\` dentro**`) funcionam corretamente em conjunto, via HTML
  real verificado.

Validado com prints reais: card mini com fração de critérios, as 3 abas do modal, popover
de informações, e testes em múltiplos temas visuais confirmando que o sistema de abas
herda cores corretamente sem CSS adicional por tema.

---

## Adiado / Não planejado

- Interação de escrita (mover status pela UI) — descartado por enquanto, ver decisão na Fase 0
- WebSocket/SSE para tempo real instantâneo — polling foi considerado suficiente
- Autenticação ou multi-usuário — fora de escopo, é uma ferramenta local/pessoal