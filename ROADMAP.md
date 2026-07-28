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

- [x] Testar abrir `roadmap.html` direto (`file://`) sem o server rodando — confirmar que funciona com o `data.js` estático como fallback
  - [x] Indicador visual discreto (badge "modo estático") quando o polling falhar/não houver servidor, em vez de só logar no console
- [x] Testar publicação em GitHub Pages (ou hospedagem estática equivalente) com um `data.js`/`data.json` já commitado — código preparado e publicado (ver detalhamento abaixo); ativação final do GitHub Pages nas configurações do repositório é passo manual do usuário, fora do escopo de agente
- [x] Documentar no próprio projeto (`README.md` da raiz) como usar em outro projeto: copiar pasta, ajustar caminho relativo do `docs/`, rodar o server
- [x] Revisar visualmente o design (cores, cards, modal) — sistema de temas visuais implementado e validado (ver detalhamento abaixo)
- [x] Reestruturar informação exibida no card mini e no modal de detalhes (ver detalhamento abaixo)
- [x] Reorganizar header (estatísticas, controles) e adicionar painel de Configurações (ver detalhamento abaixo)
- [x] Revisar responsividade mobile/tablet (grid do Kanban e modal) — pendência conhecida desde a Fase 2, resolvida (ver detalhamento abaixo)

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

### Reorganização de header e painel de Configurações (concluído)

Motivação: a barra de estatísticas e a linha de controles do header estavam com muita
informação solta sem agrupamento por função (visualização, tema, ações misturados no
mesmo nível), e não havia forma de personalizar a identidade do projeto (nome,
descrição, selo) sem editar código diretamente — um problema para um projeto pensado
para ser reutilizável em outros contextos.

**Header**:
- Bloco de estatísticas (Tarefas/Concluídas/Em Execução/Progresso Médio) reestruturado
  como grid visualmente coeso, com fundo destacado, em vez de caixas soltas competindo
  com o título.
- Linha de controles dividida em dois grupos por função, separados por divisória sutil:
  visualização de dados (toggle Kanban/Roadmap, busca, filtros de categoria/área/
  prioridade) à esquerda; ações (exportar, importar, configurações) à direita, como
  ícones com tooltip em vez de botões com texto.
- Tema visual, modo claro/escuro e "ocultar cancelados" removidos da linha de
  controles — migraram para o novo painel de Configurações.

**Painel de Configurações** (drawer lateral direito, com overlay e fechamento via X/
clique fora/Esc), com 4 grupos nesta ordem:
- **Aparência** (preferência pessoal, `localStorage`): tema visual, modo escuro.
- **Comportamento** (preferência pessoal, `localStorage`): ocultar cancelados,
  intervalo de atualização do polling (2.5s/5s/10s — aplicado imediatamente via
  `clearInterval`/`setInterval` em runtime, sem precisar recarregar).
- **Identidade do Projeto** (configuração compartilhada, arquivo no servidor): nome do
  projeto, descrição, selo/badge — com texto explicando a diferença em relação aos
  grupos anteriores (isso vale para qualquer pessoa que abrir o roadmap, não só quem
  está configurando).
- **Informações técnicas** (somente leitura): porta do servidor, status do polling.

**Backend**: novo `roadmap/config.json` armazenando a identidade do projeto, servido
estaticamente pelo `roadmap-server.js`; novo endpoint `POST /config` (usando somente o
módulo `http` nativo do Node, sem dependência nova) que valida e regrava o arquivo.

**Processo de correção real (não aprovado de primeira):**
- Confirmado via print real do console que a reconfiguração do polling em runtime
  gera um log distinto ("Polling timer limpo e recriado") do log de inicialização,
  provando que o `clearInterval`/`setInterval` funciona de fato ao trocar o valor com a
  página já carregada, não só no load inicial.
- Corrigido um FOUC (flash) real no carregamento, com três causas raiz distintas
  identificadas e resolvidas: (1) a classe `dark` estava hardcoded no HTML e só era
  adicionada condicionalmente pelo script inline, nunca removida em modo claro,
  causando flash de escuro→claro; (2) `roadmap.css` não definia `background-color`/
  `color` base em `html, body`, dependendo inteiramente do Tailwind CDN carregar; (3)
  os textos do header (nome/descrição/selo) vindos de forma assíncrona do
  `config.json` causavam um salto visível de texto trocando após o primeiro paint.
- A correção do item (3) inicialmente hardcodeou no HTML o valor mais recente do
  `config.json` — identificado como uma solução frágil, já que reintroduziria o mesmo
  flash na próxima vez que o nome do projeto fosse editado. Corrigido revertendo para
  o texto genérico original como fallback, com o container do header oculto
  (`opacity-0`) até o `fetch('config.json')` resolver, revelado com fade-in suave
  (200ms) — elimina o salto de texto de forma duradoura, sem depender de manter dois
  lugares sincronizados manualmente.

Validado com prints reais do console (log de polling) e confirmação visual direta do
usuário (não só relato do agente) de que o fade-in funciona sem flash de texto errado,
inclusive com nome customizado editado via o próprio painel.

**Correção adicional pós-conclusão (bug relatado depois de marcado como pronto):** o
drawer de Configurações não deslizava fisicamente (só aparecia/sumia no lugar) apesar
do overlay já ter fade correto — causa raiz identificada como limitação de interpolação
de variáveis CSS customizadas do Tailwind (`--tw-translate-x`) em transições sem
`@property`; corrigido com `transform`/`transition` nativos explícitos em CSS puro.
Também foi corrigida a ausência de affordance visual de hover em praticamente todos os
botões/ícones da interface (cursor virava ponteiro mas nenhuma mudança visual
ocorria) — causa raiz dupla: um erro de sintaxe CSS real (chave de fechamento ausente,
causando aninhamento inválido que fazia o navegador descartar regras subsequentes no
arquivo) e contraste insuficiente entre as cores de fundo/hover no tema padrão para
ser perceptível em botões pequenos. Ambos confirmados com teste visual real do usuário
após a correção.

### Indicador de "Modo Estático" (concluído)

Badge visual (âmbar, com ícone `wifi-off`) exibido ao lado do selo do projeto no
header, sempre que o polling detecta ausência de servidor ativo (aberto via `file://`
ou o servidor caiu depois de já estar rodando). Reaproveita o ciclo de polling já
existente (`startPolling`) em vez de criar uma checagem paralela: quando o `fetch` de
`data.json` falha, `setStaticMode(true)` é acionado; quando volta a ter sucesso,
`setStaticMode(false)` esconde o badge automaticamente — reage em tempo real, sem
precisar recarregar a página em nenhum dos dois sentidos. Um botão de informação (`?`)
no badge abre um popover explicando a situação e o comando exato para reativar o
polling (`node roadmap/roadmap-server.js`).

Validado com teste real cobrindo os 3 cenários: servidor ativo (badge oculto),
servidor derrubado com a página já aberta (badge aparece no ciclo seguinte de
polling, sem F5), e servidor reiniciado (badge desaparece sozinho).

**Correção adicional (porta hardcoded):** o texto do popover e do painel de
Configurações inicialmente mostravam a porta `3003` fixa no HTML. Corrigido expondo a
porta real via `config.json` (mesma constante `PORT` do `roadmap-server.js`,
sincronizada automaticamente a cada start do servidor via `syncConfigPort()`), lida
dinamicamente pelo front-end — testado trocando a porta real para 3005 e confirmando
que ambos os textos refletem o novo valor sem edição manual, depois revertido para
3003. Também tratado o caso de borda em que `config.json` nunca existiu ainda
(primeira execução via `file://` antes do servidor rodar uma vez) — nesse caso, o
texto usa uma frase genérica em vez de assumir um número de porta que pode estar
errado.

### Responsividade mobile/tablet (concluída)

Pendência mais antiga do projeto (aberta desde a Fase 2), resolvida em duas rodadas.

**Diagnóstico prévio (sem correção)**: capturados 12 screenshots reais (Kanban, modal,
drawer) em 375px/768px/900px/1024px via DevTools, antes de qualquer mudança de código
— confirmando objetivamente onde o layout se comportava mal, em vez de corrigir às
cegas.

**Rodada 1 — estrutura**:
- Bloco de estatísticas sincronizado com o breakpoint do board (deixou de virar grid
  de 4 colunas antes do board conseguir acompanhar — ambos agora expandem juntos em
  `lg:`/1024px).
- Colunas do Kanban abaixo de 1024px passaram a empilhar verticalmente em formato
  accordion: cada coluna é um cabeçalho clicável (cor de status + nome + contador +
  chevron) que expande/colapsa. "Em preparação" inicia aberta, as demais fechadas por
  padrão. O estado de aberto/fechado de cada coluna é preservado através dos re-renders
  do polling (mesma técnica já usada para scroll/modal na Fase 3), evitando que uma
  coluna aberta manualmente feche sozinha a cada atualização automática.
- Acima de 1024px, o comportamento permanece grid horizontal, idêntico ao que já
  existia.

**Rodada 2 — o feedback do usuário identificou que a Rodada 1, embora tecnicamente sem
quebras, ainda era "desktop encolhido" em vez de um design pensado para mobile.**
Antes de codar, foram geradas 3 propostas visuais de direção (compacto / busca aberta
com chips / mínimo com bottom sheet), e a direção "Compacto" foi escolhida. Aplicado
exclusivamente abaixo de 768px:
- Header reduzido de ~350px para ~110px de altura: título em 1 linha truncada +
  resumo textual ("18 tarefas · 51% concluído"), 3 botões circulares compactos (busca,
  filtro, configurações) substituindo os botões retangulares maiores de desktop.
- Busca expande sob demanda ao tocar o ícone, com foco automático.
- Categoria, área e prioridade migraram para um painel expansível sob o ícone de
  filtro, com indicador visual (bolinha) quando algum filtro está ativo — confirmado
  com teste real.
- Estatísticas viraram uma faixa fina de 4 colunas, não mais caixas grandes.
- Configurações continua abrindo o mesmo drawer já existente, sem alteração de
  comportamento — só o botão de entrada mudou de estilo.
- Tablet (768px+) e desktop permanecem exatamente como já estavam, sem alteração.

Validado com prints reais nas larguras mobile (375px/414px) mostrando o header
compacto, o estado de busca expandida, e o painel de filtro expandido.

**Correção adicional (faixa de tablet, 768px–1023px):** o feedback do usuário
identificou que a faixa de tablet tinha ficado sem o mesmo tratamento — continuava
sendo o "desktop encolhido" mesmo depois da correção de mobile. Aplicada a mesma
filosofia de densidade compacta, adaptada ao espaço extra do tablet (2 colunas de
estatísticas em vez de faixa fina, controles cabendo em menos linhas). Essa correção
introduziu uma regressão real que quebrou o carregamento da aplicação inteira
(`ReferenceError: exportJSON is not defined`, interrompendo de forma síncrona o
`DOMContentLoaded` antes de tarefas/config/board serem carregados) — diagnosticada via
console do navegador antes de qualquer correção às cegas, e resolvida declarando a
função ausente corretamente. Também corrigido, na mesma rodada, um problema de hover
ausente em botões e cabeçalhos de coluna do accordion em mobile/tablet — causa raiz:
os elementos novos criados para essas faixas nunca haviam sido incluídos nos seletores
CSS de hover, que só cobriam os IDs originais de desktop. Ambas as correções
confirmadas com teste visual real do usuário, não apenas leitura de código.

### Favicon, SEO e Open Graph/Twitter Cards (concluído)

Favicon gerado em todos os tamanhos padrão (16×16, 32×32, apple-touch-icon 180×180,
android-chrome 192×192/512×512, `favicon.ico` multi-resolução) a partir de um JPG
fornecido pelo usuário, com `site.webmanifest` para suporte básico de PWA/mobile.
Título e descrição de SEO definidos de forma genérica/institucional (sem nome pessoal
do usuário), já que o projeto é uma ferramenta open source reutilizável — o nome
pessoal da instância continua vivendo em `config.json`, editável pelo painel de
Configurações, sem duplicação na tag `<title>`. Banner de Open Graph/Twitter Card
(1200×630px) gerado a partir de um print real do próprio board, recortado sem
distorção. Testado com confirmação visual real de que o favicon aparece na aba do
navegador.

### Publicação no GitHub Pages (preparação de código concluída)

Repositório confirmado público e sincronizado (`ShogunBP/devboard-roadmap`). Deploy
definido como manual (sem GitHub Actions) — o usuário roda o gerador localmente e
commita `data.js`/`data.json` atualizados quando quiser atualizar a demo pública, que
funciona como vitrine estática do projeto (não uma instância com servidor rodando).

- Preenchidas as URLs absolutas de Open Graph/Twitter (pendentes desde a tarefa
  anterior) com o endereço real: `https://shogunbp.github.io/devboard-roadmap/`.
- Corrigido um caminho absoluto (`href="/favicon.ico"`) que quebraria no GitHub Pages,
  já que o projeto não fica na raiz do domínio — convertido para caminho relativo.
- Tratado o comportamento do botão "Salvar identidade do projeto" quando não há
  servidor disponível para receber `POST /config` (o caso normal na demo pública):
  inicialmente implementado com `alert()` nativo do navegador, corrigido após
  identificação de que isso quebrava a consistência visual do projeto (não respeita
  tema ativo, trava a interface) — reescrito para reaproveitar o mesmo mecanismo de
  feedback já usado no caso de sucesso ("Salvo!"), com texto "Somente leitura (demo)"
  e cor de aviso. Numa segunda correção, as cores desse feedback (sucesso e erro)
  foram trocadas de classes fixas do Tailwind para as variáveis CSS do sistema de
  temas (`var(--destructive)`, `var(--status-done)`), garantindo que se adaptam
  corretamente a qualquer um dos 4 temas visuais — confirmado com teste visual real.

**GitHub Pages ativado e funcional.** Após a ativação manual do usuário (Settings →
Pages), a URL raiz (`https://shogunbp.github.io/devboard-roadmap/`) estava servindo o
conteúdo do `README.md` em vez de `roadmap.html` — causa raiz: na ausência de um
`index.html` na raiz, o processador Jekyll (ativo por padrão no GitHub Pages) usa o
`README.md` como página inicial automaticamente, já que `roadmap.html` não tem nome de
entrada reservado.

Decisão: não renomear `roadmap.html` para `index.html`, pois o nome é parte da
convenção documentada no `README.md` para quem copia a pasta pra outro projeto.
Corrigido com:
- `index.html` na raiz, com redirecionamento via `<meta http-equiv="refresh">` para
  `roadmap.html`.
- `.nojekyll` vazio na raiz, desativando o processamento Jekyll (desnecessário e
  potencialmente interferente num projeto 100% estático sem build step).

Validado com teste real em aba anônima (descartando cache do navegador): a URL raiz
abre `roadmap.html` corretamente.

---

## Adiado / Não planejado

- Interação de escrita (mover status pela UI) — descartado por enquanto, ver decisão na Fase 0
- WebSocket/SSE para tempo real instantâneo — polling foi considerado suficiente
- Autenticação ou multi-usuário — fora de escopo, é uma ferramenta local/pessoal