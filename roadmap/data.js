const ROADMAP_TASKS = [
  {
    "id": "erro-de-api-cors",
    "title": "Erro de CORS na API de Pagamento",
    "category": "bugs",
    "status": "approved",
    "area": "active",
    "date": "2026-07-13",
    "priority": "alta",
    "tags": [
      "backend",
      "infra"
    ],
    "progress": 20,
    "progressFraction": {
      "done": 1,
      "total": 5
    },
    "summary": "Erro 403 / CORS blocking na rota de payment da API de Pagamento.",
    "sections": [
      {
        "heading": "Descrição",
        "content": "Erro 403 / CORS blocking na rota de payment."
      },
      {
        "heading": "Como Reproduzir",
        "content": "1. Login\n2. Carrinho\n3. Botão pagar"
      },
      {
        "heading": "Comportamento Esperado",
        "content": "Redirecionar gateway."
      },
      {
        "heading": "Comportamento Atual",
        "content": "Fica em loop de erro."
      },
      {
        "heading": "Contexto Técnico",
        "content": "- Camada afetada: backend\n- Arquivo(s) suspeito(s): `server.js`\n- Logs de erro (se houver): N/A"
      },
      {
        "heading": "Hipótese de Causa",
        "content": "As origens autorizadas foram limpas."
      },
      {
        "heading": "Plano de Correção",
        "content": "Adicionar a origin correta no array de CORS do Express.\n\n---"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [ ] Bug não reproduz mais\n- [ ] Nenhuma regressão identificada\n- [ ] **Pasta renomeada para `[done]-nome-do-bug` e movida para `archive/bugs/`**"
      }
    ],
    "path": "docs/active/bugs/[approved]-erro-de-api-cors"
  },
  {
    "id": "navbar-travando-intermediario",
    "title": "Navbar trava em estado intermediário na transição grande → pequena (regressão)",
    "category": "bugs",
    "status": "approved",
    "area": "active",
    "date": "2026-07-11",
    "priority": "alta",
    "tags": [
      "frontend",
      "performance"
    ],
    "progress": 0,
    "progressFraction": {
      "done": 0,
      "total": 6
    },
    "summary": "Navbar apresentando travamentos e distorções visuais de elementos filhos durante a transição grande-pequena.",
    "sections": [
      {
        "heading": "Descrição",
        "content": "Após a primeira tentativa de correção (mudando o controle do NavBody para a engine de `layout` em vez de `animate` explícito), a navbar parou de \"travar\" com o erro de medição do Framer Motion, **porém**, a fluidez ficou terrível. Durante a transição do estado grande pro pequeno (e vice-versa), os elementos filhos (textos, botões, logo) ficam todos esmagados, esticados e visualmente bugados até que a animação termine. Além disso, o pause/travadinha retornou sob novas condições."
      },
      {
        "heading": "Como Reproduzir",
        "content": "1. Acessar a página com a navbar no estado não-scrollado.\n2. Rolar a página para baixo e para cima.\n3. Observar a distorção (estiramento/esmagamento) do texto do logo e dos botões direitos durante a escala do fundo da navbar."
      },
      {
        "heading": "Contexto Técnico",
        "content": "- Camada afetada: frontend (`src/components/ui/resizable-navbar.tsx` e `src/components/main/Navbar.tsx`)"
      },
      {
        "heading": "Hipótese de Causa (Revisada Definitivamente)",
        "content": "**Problema 1: Distorção de Escala (Scale Distortion)**\nQuando aplicamos a prop `layout` no `NavBody` (para que ele transicione entre `w-full` e `w-fit`), o Framer Motion faz isso usando uma transformação CSS (`transform: scaleX(...)`). A documentação oficial afirma: *\"Quando um componente pai é escalado por uma animação de layout, todos os seus filhos serão esticados/esmagados visualmente, a menos que os filhos também recebam a prop layout\"*.\nComo o `NavbarLogo`, os `NavItems` e a `div` dos botões da direita NÃO tinham a prop `layout` habilitada, eles sofrem uma distorção agressiva enquanto o container pai cresce/encolhe.\n\n**Problema 2: AnimatePresence mascarando reflows do Layout**\nO uso de `<AnimatePresence>` e `exit={{ width: 0 }}` no texto dos itens do menu não desencadeia uma mudança de bounding box nativa no ciclo de renderização do React da forma que a engine de FLIP (layout) do Framer Motion espera. Isso quebra o rastreamento, causando \"travadinhas\" e engasgos quando os nós entram/saem da DOM e a engine tenta sincronizar a animação do pai (`NavBody`)."
      },
      {
        "heading": "Plano de Correção",
        "content": "O segredo para animações fluidas de dimensões automáticas no Framer Motion é usar a engine de `layout` para **tudo** que muda de tamanho ou posição na tela, evitando distorções ao propagar o rastreamento para os filhos diretos, e abandonando `animate/exit` na dimensão `width`.\n\n1. **Parar de usar `AnimatePresence` para o texto do menu:**\n   Em `NavItems`, vamos parar de destruir o elemento `<motion.span>` condicionalmente. Ele ficará sempre na DOM, mas sua largura base e opacidade serão ditadas via CSS/style condicional (`width: isScrolled ? 0 : 'auto'`, `opacity: isScrolled ? 0 : 1`). Com a prop `layout` ligada nele, qualquer mudança na variável `isScrolled` forçará um reflow nativo, e a engine animará o tamanho de forma impecável, sem \"pulos\" de unmount.\n\n2. **Evitar a Distorção dos Filhos:**\n   Adicionar a prop `layout` (e repassar a `sharedTransition`) para todos os \"blocos\" principais dentro do `NavBody` para que apliquem a transformação inversa de escala:\n   - Em `resizable-navbar.tsx`: Atualizar a tag base do `NavbarLogo` para `<motion.a layout transition={sharedTransition}>`.\n   - Em `resizable-navbar.tsx`: Adicionar `layout` no container principal de `NavItems`.\n   - Em `main/Navbar.tsx`: Trocar a `div` que envelopa os toggles/Language/Email por um `<motion.div layout transition={sharedTransition}>`.\n\n3. **Garantir a mesma mola (spring):**\n   Todos os elementos que recebem `layout` precisam ter a mesma `transition={sharedTransition}` para se moverem in uníssono.\n\n---"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [ ] Sem distorção no logo e botões (scale invertido com sucesso).\n- [ ] Sem pausa intermediária (layout trackeia a largura real).\n- [ ] Nenhuma regressão no flicker de quebra de linha.\n- [ ] **Pasta renomeada para `[done]-navbar-travando-intermediario` e movida para `archive/bugs/`**"
      }
    ],
    "path": "docs/active/bugs/[approved]-navbar-travando-intermediario"
  },
  {
    "id": "nova-tela-login",
    "title": "Nova Tela de Login",
    "category": "features",
    "status": "draft",
    "area": "active",
    "date": "2026-07-13",
    "priority": "alta",
    "tags": [
      "frontend",
      "ui-ux"
    ],
    "progress": 0,
    "progressFraction": {
      "done": 0,
      "total": 8
    },
    "summary": "Criação de uma nova interface moderna para a tela de login.",
    "sections": [
      {
        "heading": "Objetivo",
        "content": "Criar uma nova tela de login."
      },
      {
        "heading": "Descrição Funcional",
        "content": "O usuário acessa a página e digita suas credenciais num formulário renovado."
      },
      {
        "heading": "Escopo",
        "content": "### Inclui\n- Campos de e-mail e senha\n- Botão \"Esqueci minha senha\"\n\n### Não inclui (por ora)\n- Autenticação por SMS"
      },
      {
        "heading": "Requisitos Técnicos",
        "content": "- Camadas envolvidas: frontend\n- Dependências ou integrações necessárias: nenhuma externa\n- Impactos em outras partes do sistema: apenas a home"
      },
      {
        "heading": "Plano de Implementação",
        "content": "1. Criar componente React\n2. Estilizar com CSS\n3. Integrar mock do hook de auth"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Critérios de Conclusão",
        "content": "- [ ] Componente implementado\n- [ ] Formulário validado\n\n---"
      },
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [ ] Todos os critérios de conclusão atendidos\n- [ ] Testado manualmente do ponto de vista do usuário\n- [ ] Nenhuma regressão identificada\n- [ ] **Pasta renomeada para `[done]-nome-da-feature` e movida para `archive/features/`**"
      }
    ],
    "path": "docs/active/features/[draft]-nova-tela-login"
  },
  {
    "id": "autenticacao-google",
    "title": "Autenticação via Google",
    "category": "features",
    "status": "ready-for-review",
    "area": "active",
    "date": "2026-07-13",
    "priority": "alta",
    "tags": [
      "backend",
      "segurança"
    ],
    "progress": 30,
    "progressFraction": {
      "done": 3,
      "total": 10
    },
    "summary": "Implementação do fluxo de autenticação \"Entrar com Google\" (OAuth).",
    "sections": [
      {
        "heading": "Objetivo",
        "content": "Adicionar o \"Entrar com Google\"."
      },
      {
        "heading": "Descrição Funcional",
        "content": "O usuário verá um botão \"Login com Google\" na tela principal e será redirecionado para a plataforma de autenticação do Google."
      },
      {
        "heading": "Escopo",
        "content": "### Inclui\n- Botão de login com provedor\n- Troca de token no backend\n\n### Não inclui (por ora)\n- Login com Facebook/Apple"
      },
      {
        "heading": "Requisitos Técnicos",
        "content": "- Camadas envolvidas: frontend, backend, banco\n- Dependências ou integrações necessárias: Google OAuth API\n- Impactos em outras partes do sistema: Sistema de sessão"
      },
      {
        "heading": "Plano de Implementação",
        "content": "1. Criar projeto no Google Cloud Console\n2. Implementar fluxo no front\n3. Validar token no backend"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Critérios de Conclusão",
        "content": "- [x] Projeto GCP configurado\n- [x] Botão inserido na UI\n- [x] Fluxo de redirect rodando\n- [ ] Troca de token 100% testada\n\n---"
      },
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [ ] Todos os critérios de conclusão atendidos\n- [ ] Testado manualmente do ponto de vista do usuário\n- [ ] Nenhuma regressão identificada\n- [ ] **Pasta renomeada para `[done]-nome-da-feature` e movida para `archive/features/`**"
      }
    ],
    "path": "docs/active/features/[ready-for-review]-autenticacao-google"
  },
  {
    "id": "animacao-botao",
    "title": "Animação de Botão Principal",
    "category": "enhancements",
    "status": "changes-requested",
    "area": "active",
    "date": "2026-07-13",
    "priority": "média",
    "tags": [
      "frontend",
      "animação"
    ],
    "progress": 43,
    "progressFraction": {
      "done": 3,
      "total": 7
    },
    "summary": "Criar feedbacks visuais dinâmicos (efeito ripple) ao clicar nos botões principais da interface.",
    "sections": [
      {
        "heading": "Contexto",
        "content": "Atualmente os botões são totalmente estáticos e não indicam ação visual."
      },
      {
        "heading": "Problema Atual",
        "content": "Falta de feedback visual pode causar cliques duplos do usuário."
      },
      {
        "heading": "Melhoria Proposta",
        "content": "Criar animações usando CSS e classes utilitárias para quando houver cliques."
      },
      {
        "heading": "Impacto Esperado",
        "content": "- UX aprimorada.\n- Afeta usuário final."
      },
      {
        "heading": "Plano de Implementação",
        "content": "1. Refatorar CSS global\n2. Aplicar utilitários"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Critérios de Conclusão",
        "content": "- [x] Implementar onda ripple\n- [x] Validar contraste\n\n---"
      },
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [ ] Melhoria perceptível e funcional\n- [ ] Nenhuma regressão identificada\n- [ ] **Pasta renomeada para `[done]-nome-da-melhoria` e movida para `archive/enhancements/`**"
      }
    ],
    "path": "docs/active/enhancements/[changes-requested]-animacao-botao"
  },
  {
    "id": "migrar-context-redux",
    "title": "Migrar Context API para Redux",
    "category": "refactoring",
    "status": "in-progress",
    "area": "active",
    "date": "2026-07-13",
    "priority": "alta",
    "tags": [
      "frontend",
      "performance"
    ],
    "progress": 50,
    "progressFraction": {
      "done": 5,
      "total": 10
    },
    "summary": "Substituição da Context API pelo Redux Toolkit para gerenciar estados globais e evitar renders indesejados.",
    "sections": [
      {
        "heading": "Motivação",
        "content": "A API de contexto força renders que não queremos."
      },
      {
        "heading": "Situação Atual",
        "content": "Temos `UserContext` e `ThemeContext` misturados e renderizando novamente o App inteiro."
      },
      {
        "heading": "Situação Desejada",
        "content": "Redux toolkit com slices isolados."
      },
      {
        "heading": "Riscos",
        "content": "Falta de familiaridade com o setup. Vazamento de dados em hooks não migrados."
      },
      {
        "heading": "Estratégia de Execução",
        "content": "Migrar um slice por PR.\n\n1. Implementar store vazio\n2. Migrar Auth\n3. Migrar Preferences"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Critérios de Conclusão",
        "content": "- [x] Store funcionando\n- [x] Hooks de Theme substituídos\n- [x] App Provider limpo\n- [ ] Testes passando\n\n---"
      },
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [x] Comportamento idêntico ao anterior\n- [ ] Nenhuma regressão identificada\n- [ ] Dívida técnica removida\n- [ ] **Pasta renomeada para `[done]-nome-da-refatoracao` e movida para `archive/refactoring/`**"
      }
    ],
    "path": "docs/active/refactoring/[in-progress]-migrar-context-redux"
  },
  {
    "id": "dropdown-remove-scroll-pagina",
    "title": "Dropdown do ThemeToggle — Remove o scroll da página ao abrir",
    "category": "bugs",
    "status": "done",
    "area": "archive",
    "date": "2026-07-08",
    "priority": "média",
    "tags": [
      "frontend",
      "ui-ux"
    ],
    "progress": 60,
    "progressFraction": {
      "done": 3,
      "total": 5
    },
    "summary": "Resumo descritivo para a tarefa: Dropdown do ThemeToggle  Remove o scroll da página ao abrir.",
    "sections": [
      {
        "heading": "Descrição",
        "content": "Ao abrir o dropdown do seletor de tema na navbar, o Radix UI injeta `overflow: hidden` no elemento `<body>`, o que trava o scroll da página enquanto o menu está aberto. Isso é um comportamento indesejado em portfólios de página única com scroll nativo."
      },
      {
        "heading": "Como Reproduzir",
        "content": "1. Abrir o portfólio\n2. Rolar a página levemente para baixo\n3. Clicar no botão de toggle de tema (ícone Sol/Lua)\n4. Observar que o scroll da página trava imediatamente ao abrir o dropdown\n5. Fechar o dropdown — o scroll volta"
      },
      {
        "heading": "Comportamento Esperado",
        "content": "O dropdown deve abrir sem interferir no scroll da página. O usuário deve conseguir rolar a página mesmo com o dropdown visível (ou o dropdown deve fechar ao rolar)."
      },
      {
        "heading": "Comportamento Atual",
        "content": "O Radix `DropdownMenuPrimitive.Root` possui a propriedade `modal` ativada por padrão (`true`). Isso aciona internamente a biblioteca `react-remove-scroll`, que injeta o atributo `data-scroll-locked` no `<body>` com `overflow: hidden`, travando o scroll da página inteira enquanto o dropdown está aberto.\n\n```tsx\n// src/hooks/use-toogle.tsx — estrutura atual\n// O DropdownMenu (que repassa as props para DropdownMenuPrimitive.Root)\n// não define a prop 'modal', assumindo o padrão true:\n<DropdownMenu>\n  <DropdownMenuTrigger asChild>...</DropdownMenuTrigger>\n  <DropdownMenuContent align=\"end\">\n    ...\n  </DropdownMenuContent>\n</DropdownMenu>\n```\n\n```tsx\n// src/hooks/use-toogle.tsx — estrutura atual\n<DropdownMenu>\n  <DropdownMenuTrigger asChild>...</DropdownMenuTrigger>\n  <DropdownMenuContent align=\"end\">\n    ...\n  </DropdownMenuContent>\n</DropdownMenu>\n```"
      },
      {
        "heading": "Contexto Técnico",
        "content": "- Camada afetada: frontend\n- Arquivo(s) suspeito(s): `src/hooks/use-toogle.tsx` — uso do `DropdownMenu`\n- Logs de erro (se houver): nenhum — é comportamento intencional do Radix (via react-remove-scroll) que conflita com o design do portfólio"
      },
      {
        "heading": "Hipótese de Causa",
        "content": "A prop `modal` do `DropdownMenuPrimitive.Root` (padrão `true`) está acionando o bloqueio de scroll no `<body>`. A solução é passar explicitamente `modal={false}` para evitar a injeção do atributo `data-scroll-locked`."
      },
      {
        "heading": "Plano de Correção",
        "content": "1. Em `src/hooks/use-toogle.tsx`, adicionar a prop `modal={false}` ao componente `<DropdownMenu>`:\n   ```tsx\n   <DropdownMenu modal={false}>\n   ```\n2. Verificar se o comportamento de fechamento ao clicar fora ainda funciona corretamente com `modal={false}`\n3. Testar em desktop e mobile\n\n---"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [x] Bug não reproduz mais\n- [x] Nenhuma regressão identificada\n- [x] **Pasta renomeada para `[done]-dropdown-remove-scroll-pagina`**"
      }
    ],
    "path": "docs/archive/bugs/[done]-dropdown-remove-scroll-pagina"
  },
  {
    "id": "flicker-navbar-logo-scroll",
    "title": "Flicker/quebra de linha no NavbarLogo ao voltar do scroll para o topo",
    "category": "bugs",
    "status": "done",
    "area": "archive",
    "date": "2026-07-09",
    "priority": "média",
    "tags": [
      "frontend",
      "ui-ux"
    ],
    "progress": 80,
    "progressFraction": {
      "done": 4,
      "total": 5
    },
    "summary": "Resumo descritivo para a tarefa: Flickerquebra de linha no NavbarLogo ao voltar do scroll para o topo.",
    "sections": [
      {
        "heading": "Descrição",
        "content": "Ao rolar a página e depois retornar ao topo, o texto do `NavbarLogo` na navbar desktop sofre um flicker visual: por um instante ele quebra para duas linhas antes de voltar para uma linha só."
      },
      {
        "heading": "Como Reproduzir",
        "content": "1. Acessar a página com a navbar no estado não-scrollado (topo).\n2. Rolar a página para baixo até a navbar entrar no estado \"scrollado\" (versão reduzida).\n3. Rolar de volta até o topo, fazendo a navbar retornar ao estado não-scrollado.\n4. Observar o texto do logo (`guilherme-menezes@home:~$` ou equivalente atual) durante a transição."
      },
      {
        "heading": "Comportamento Esperado",
        "content": "A transição entre o estado scrollado e não-scrollado deve ser suave, com o texto do logo permanecendo em uma única linha durante toda a animação, sem quebra ou salto visual."
      },
      {
        "heading": "Comportamento Atual",
        "content": "No momento em que a navbar retorna ao estado não-scrollado, o texto do logo quebra brevemente para duas linhas e, em seguida, volta para uma linha — gerando um flicker perceptível."
      },
      {
        "heading": "Contexto Técnico",
        "content": "- Camada afetada: frontend\n- Arquivo(s) suspeito(s): `src/components/ui/resizable-navbar.tsx` (componente `NavbarLogo` e lógica de transição scrolled/não-scrollado)\n- Logs de erro: nenhum (bug visual, não gera erro de console — a confirmar)"
      },
      {
        "heading": "Hipótese de Causa",
        "content": "**Confirmada:** A transição do `NavBody` altera o `width` de `fit-content` (no estado scrollado) para `100%` (no estado inicial) usando uma animação `spring`. Durante essa transição de recálculo da largura da navbar, o texto do logo dentro de `NavbarLogo` sofre uma breve restrição de espaço antes do container se expandir totalmente, o que causa a quebra de linha. O `span` do logo não possui a classe `whitespace-nowrap`, permitindo que o texto flexione para múltiplas linhas indesejadamente."
      },
      {
        "heading": "Plano de Correção",
        "content": "1. Em `src/components/ui/resizable-navbar.tsx` (linhas 246-247), adicionar as classes utilitárias do Tailwind `whitespace-nowrap` e `shrink-0` ao container `span` principal do texto do logo:\n\n```tsx\n<span className=\"font-mono text-sm md:text-base font-semibold group-hover:text-brand-highlight transition-colors flex items-center whitespace-nowrap shrink-0\">\n```\n\n2. Testar manualmente a transição de scroll e validar que o texto não quebra mais para duas linhas e não sofre \"squishing\" (estreitamento residual) em nenhum momento.\n\n---"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [x] Bug não reproduz mais\n- [x] Nenhuma regressão identificada\n- [x] **Pasta renomeada para `[done]-flicker-navbar-logo-scroll` e movida para `archive/bugs/`**"
      }
    ],
    "path": "docs/archive/bugs/[done]-flicker-navbar-logo-scroll"
  },
  {
    "id": "navbar-desktop-sobreposicao-botoes-1200px",
    "title": "Navbar Desktop — Sobreposição de botões em larguras próximas a 1200px",
    "category": "bugs",
    "status": "done",
    "area": "archive",
    "date": "2026-07-09",
    "priority": "alta",
    "tags": [
      "frontend",
      "ui-ux"
    ],
    "progress": 80,
    "progressFraction": {
      "done": 4,
      "total": 5
    },
    "summary": "Resumo descritivo para a tarefa: Navbar Desktop  Sobreposição de botões em larguras próximas a 1200px.",
    "sections": [
      {
        "heading": "Descrição",
        "content": "Ao scrollar a página em desktop, com a largura da viewport próxima de 1200px (e potencialmente em todo o intervalo entre o breakpoint mínimo de desktop e ~1200px), os botões de ação da navbar (email, theme toggle, language toggle) começam a se sobrepor visualmente aos links de navegação (About, Skills, Experience, Projects, Blogs).\n\n> [!NOTE]\n> **Causa raiz unificada:** Este bug é também a causa raiz do que era tratado originalmente no roadmap como o \"bug #4\" (itens de navegação não clicáveis / `NavBody` / `NavbarWrapper`). A falha no clique dos links de navegação é uma consequência direta da sobreposição física detalhada neste documento (conforme verificado em teste manual pelo dono do projeto), e por isso não deve ser tratado como um problema separado nem possuir uma pasta própria na documentação."
      },
      {
        "heading": "Como Reproduzir",
        "content": "1. Abrir o site em desktop com a viewport em torno de 1200px de largura.\n2. Scrollar a página verticalmente (mais de 50px, ativando o estado de navbar \"encolhida\").\n3. Observar a área central/direita da navbar: os links de navegação e os botões de ação passam a ocupar o mesmo espaço visual.\n4. Em ~1200px de largura, com o scroll ativo (navbar colapsada), tentar clicar nos links de navegação (About, Skills, Experience, Projects, Blogs). O clique para de funcionar porque os botões de ação (idioma, tema, e-mail) passam a ficar fisicamente sobrepostos a eles (confirmado em teste manual pelo dono do projeto)."
      },
      {
        "heading": "Comportamento Esperado",
        "content": "Independentemente da largura da tela (dentro do breakpoint de desktop) ou do estado de scroll, os links de navegação e os botões de ação devem permanecer visualmente distintos, sem sobreposição, ajustando-se ao espaço disponível."
      },
      {
        "heading": "Comportamento Atual",
        "content": "Ao ativar o estado de scroll (`isScrolled`/`visible`), a navbar (`NavBody`) anima sua largura de `100%` para `40%` da tela. Nesse estado reduzido, os elementos internos (logo, links, botões de ação) passam a competir pelo mesmo espaço, com os links de navegação se sobrepondo aos botões por estarem posicionados de forma absoluta."
      },
      {
        "heading": "Contexto Técnico",
        "content": "- **Camada afetada:** frontend (componente de navbar desktop)\n- **Arquivo(s) confirmado(s) por trecho de código real:**\n  - `resizable-navbar.tsx` — componentes `NavBody` e `NavItems`\n  - `Navbar.tsx` — composição da navbar desktop (`NavBody` + `NavbarLogo` + `NavItems` + botões de ação)\n- **Logs de erro:** não aplicável (bug visual de layout, não runtime)\n\n### Evidência de código coletada\n\nContainer da navbar desktop (`NavBody`):\n```tsx\n<motion.div\n  animate={{\n    backdropFilter: visible ? 'blur(10px)' : 'none',\n    boxShadow: visible ? '...' : 'none',\n    width: visible ? '40%' : '100%',\n    y: visible ? 20 : 0,\n  }}\n  transition={{ type: 'spring', stiffness: 200, damping: 50 }}\n  style={{ minWidth: '200px' }}\n  className={cn(\n    'relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-full bg-transparent px-4 py-2 lg:flex dark:bg-transparent',\n    visible && 'bg-white/80 dark:bg-neutral-950/80',\n    className,\n  )}\n>\n  {children}\n</motion.div>\n```\n\nBloco de links de navegação (`NavItems`), posicionado de forma absoluta dentro do container:\n```tsx\n<motion.div\n  onMouseLeave={() => setHovered(null)}\n  className={cn(\n    'absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2',\n    className,\n  )}\n>\n  {/* ... */}\n</motion.div>\n```\n\nComposição em `Navbar.tsx`:\n```tsx\n<NavBody>\n  <NavbarLogo isScrolled={isScrolled} />\n  <NavItems items={navItems} isScrolled={isScrolled} />\n  <div className=\"relative z-10 flex items-center gap-2\">\n    <LanguageToggle />\n    <ThemeToggle />\n    <Button variant=\"default\" className=\"rounded-full z-50\" onClick={() => { /* ... */ }}>\n      <FaEnvelope />\n    </Button>\n  </div>\n</NavBody>\n```\n\n### Valores relevantes confirmados no código\n- Breakpoint de ativação do layout desktop: `lg:` (1024px, padrão Tailwind).\n- Largura máxima da navbar: `max-w-7xl` (1280px).\n- Largura no estado \"scrolled\": `40%` da viewport — em 1200px de tela, equivale a 480px físicos; em 1024px (breakpoint mínimo), equivale a ~409.6px.\n- `minWidth: '200px'` definido inline na `NavBody` (ainda não analisado se conflita com os 40% — ver lacuna abaixo)."
      },
      {
        "heading": "Hipótese de Causa",
        "content": "**Confirmada parcialmente por teste manual do dono do projeto.** Duas causas candidatas, combinadas, levantadas a partir da leitura do código:\n\n1. **Posicionamento absoluto do `NavItems`** (`absolute inset-0`): por estar fora do fluxo normal do flexbox da `NavBody`, o bloco de links não interage com a largura física dos elementos vizinhos (logo, botões de ação) para evitar sobreposição — ele simplesmente se centraliza por cima do espaço disponível.\n   *Nota: O cenário sem scroll próximo de 1024px não foi reproduzido no teste manual do dono do projeto (que testou apenas com scroll ativo). Portanto, a Causa 1 permanece não testada e precisa ser validada futuramente.*\n2. **Redução para 40% no estado \"scrolled\"**: com a navbar reduzida a ~480px (a 1200px de tela) ou ~409.6px (a 1024px), o espaço pode não comportar logo + links + botões de ação simultaneamente, forçando a sobreposição do conteúdo absoluto sobre os botões (`relative z-10`).\n   *Nota: Esta causa foi confirmada por teste manual real. O dono do projeto verificou que, a ~1200px de largura com scroll ativo, o clique nos links de navegação falha porque os botões de ação ficam fisicamente sobre eles, validando o comportamento previsto.*\n\n**Lacuna identificada, não preenchida por suposição:** não foi analisado se `minWidth: '200px'` (definido inline) entra em conflito ou mitiga parcialmente o problema em alguma faixa de largura. Isso precisa ser investigado antes de qualquer plano de correção."
      },
      {
        "heading": "Plano de Correção",
        "content": "> [!IMPORTANT]\n> **Proposta de Direção de Design (Dono do Projeto):**\n> O plano a seguir descreve a direção de design proposta pelo dono do projeto. Esta proposta ainda **não está aprovada** como a especificação técnica final para implementação. Os detalhes técnicos exatos do \"como\" (por exemplo, uso de `width: fit-content`, remoção de animações percentuais rígidas, determinação precisa dos breakpoints para tablets) ainda dependem de definição e validação antes que o status do documento possa avançar para `[approved]`.\n\n### Diretrizes Propostas:\n- **Exibição do Nome:** Não ocultar o nome \"Guilherme Menezes\" ao scrollar, mantendo-o sempre visível na barra.\n- **Largura Dinâmica no Scroll:** Ao colapsar devido ao scroll, o menu (`NavBody`) não deve assumir uma porcentagem fixa (como os atuais `40%`) de forma rígida. Em vez disso, a largura deve se ajustar com base no espaço real necessário para comportar o nome, os links e as ações juntos, prevenindo qualquer sobreposição.\n- **Comportamento em Tablets:** Esse modelo de dimensionamento fluido baseado no conteúdo deve se estender também para resoluções de tablet, e não apenas desktop.\n- **Layout Mobile:** O layout simplificado (exibindo foto de perfil $\\rightarrow$ texto centralizado \"Portfólio\" $\\rightarrow$ ícone do menu hambúrguer) deve ser ativado apenas ao entrar formalmente no breakpoint mobile.\n\n---"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [x] Bug não reproduz mais\n- [x] Nenhuma regressão identificada\n- [x] **Pasta renomeada para `[done]-navbar-desktop-sobreposicao-botoes-1200px`**"
      }
    ],
    "path": "docs/archive/bugs/[done]-navbar-desktop-sobreposicao-botoes-1200px"
  },
  {
    "id": "navbar-logo-nao-clicavel-desktop",
    "title": "NavbarLogo — Não é clicável no desktop",
    "category": "bugs",
    "status": "done",
    "area": "archive",
    "date": "2026-07-09",
    "priority": "média",
    "tags": [
      "frontend",
      "ui-ux"
    ],
    "progress": 60,
    "progressFraction": {
      "done": 3,
      "total": 5
    },
    "summary": "Resumo descritivo para a tarefa: NavbarLogo  Não é clicável no desktop.",
    "sections": [
      {
        "heading": "Descrição",
        "content": "O `NavbarLogo` está projetado para ser um link navegável (envolto por uma tag `<a>`). Ele funciona e é clicável corretamente na versão responsiva (mobile), porém, no desktop (estado não-scrollado), o clique no logo não tem efeito."
      },
      {
        "heading": "Como Reproduzir",
        "content": "1. Abrir o portfólio em desktop (viewport >= 1024px)\n2. Tentar clicar no logo \"Guilherme Menezes\" no lado esquerdo da navbar\n3. Observar que o clique não funciona e o cursor não muda para pointer"
      },
      {
        "heading": "Comportamento Esperado",
        "content": "O logo deve ser clicável e ancorar para a seção `#about`, assim como ocorre no mobile."
      },
      {
        "heading": "Comportamento Atual",
        "content": "O `NavbarLogo` de fato possui a estrutura de link com `href` e é clicável no mobile (onde é renderizado dentro de `MobileNavHeader`), mas não funciona no desktop quando o componente irmão `NavItems` está renderizado junto com ele no `NavBody`:\n\n```tsx\n// src/components/ui/resizable-navbar.tsx (linhas 232-237)\nexport const NavbarLogo = ({ isScrolled }: { isScrolled: boolean }) => {\n  return (\n    <a\n      href=\"#about\"\n      className=\"group flex items-center space-x-3\"\n      aria-label=\"Navigate to About section\"\n    >\n```"
      },
      {
        "heading": "Contexto Técnico",
        "content": "- Camada afetada: frontend\n- Arquivo(s) suspeito(s):\n  - `src/components/ui/resizable-navbar.tsx` — `NavbarLogo` e `NavItems`"
      },
      {
        "heading": "Hipótese de Causa",
        "content": "**Hipótese não confirmada por inspeção real —** A suspeita atual é que o componente irmão `NavItems` esteja sobrepondo fisicamente a área do logo e bloqueando os eventos de clique no desktop.\n\nO `NavItems` possui a classe `absolute inset-0`, que faz com que ele estique sobre todo o `NavBody`:\n```tsx\n// src/components/ui/resizable-navbar.tsx (linhas 114-121)\nexport const NavItems = ({ items, className, isScrolled, onItemClick }: NavItemsProps) => {\n  const [hovered, setHovered] = useState<number | null>(null)\n\n  return (\n    <motion.div\n      onMouseLeave={() => setHovered(null)}\n      className={cn(\n        'absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 ... lg:flex ...',\n        className,\n      )}\n    >\n```\nSem uma declaração de `z-index` explícita no `NavbarLogo`, a camada absoluta do `NavItems` pode estar posicionada acima dele no contexto de empilhamento."
      },
      {
        "heading": "Diagnóstico Real (Comprovado via Teste Programático)",
        "content": "A hipótese visual foi testada e **confirmada como a causa exata**. \nAtravés de um script de diagnóstico rodando `document.elementFromPoint(x, y)` exatamente no centro do `NavbarLogo`, o elemento retornado pelo navegador foi:\n```text\nDIV class: absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2\n```\nEste é o container de `NavItems`. Como ele usa `absolute inset-0`, ele estica para cobrir 100% da Navbar (para permitir que os itens fiquem centralizados perfeitamente na tela). Por estar no mesmo nível hierárquico, ele é renderizado sobre o Logo, interceptando invisivelmente os cliques."
      },
      {
        "heading": "Plano de Correção",
        "content": "Como a classe `inset-0` do `NavItems` é estrutural para o alinhamento central do flexbox, a solução não deve alterar a geometria do menu, mas sim ajustar a ordem de empilhamento (stacking context). O uso de `pointer-events-none` causou uma regressão no efeito de `:hover` do logo, portanto a abordagem correta é o controle de eixo Z.\n\n1. Em `src/components/ui/resizable-navbar.tsx`, adicionar as classes `relative z-10` ao elemento `<a>` principal do `NavbarLogo`.\n2. Adicionar as mesmas classes `relative z-10` ao container das ações da direita (`ThemeToggle` e botão de CV) em `NavBody`, para garantir que eles também fiquem acima da camada invisível do menu central.\nIsso fará com que os elementos clicáveis fiquem em uma camada fisicamente superior ao `NavItems` (que tem `z-index` automático), restaurando tanto o clique quanto a detecção nativa de hover."
      }
    ],
    "criteriaSections": [
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [x] Bug não reproduz mais\n- [x] Nenhuma regressão identificada\n- [x] **Pasta renomeada para `[done]-navbar-logo-nao-clicavel-desktop`**"
      }
    ],
    "path": "docs/archive/bugs/[done]-navbar-logo-nao-clicavel-desktop"
  },
  {
    "id": "navbar-nome-desaparece-ao-scroll",
    "title": "Navbar — Nome \"Guilherme Menezes\" desaparece ao scrollar (desktop e mobile)",
    "category": "bugs",
    "status": "done",
    "area": "archive",
    "date": "2026-07-09",
    "priority": "média",
    "tags": [
      "frontend",
      "ui-ux"
    ],
    "progress": 80,
    "progressFraction": {
      "done": 4,
      "total": 5
    },
    "summary": "Resumo descritivo para a tarefa: Navbar  Nome \"Guilherme Menezes\" desaparece ao scrollar (desktop e mobile).",
    "sections": [
      {
        "heading": "Descrição",
        "content": "O nome \"Guilherme Menezes\", exibido ao lado da foto de perfil na navbar, desaparece quando a página é scrollada (mais de 50px), tanto em desktop quanto em mobile. Confirmado pelo dono do projeto como comportamento antigo, presente desde sempre — não é regressão recente."
      },
      {
        "heading": "Como Reproduzir",
        "content": "1. Abrir o site (desktop ou mobile).\n2. Observar a navbar no topo: foto + nome \"Guilherme Menezes\" visíveis.\n3. Scrollar a página verticalmente além de 50px.\n4. Observar que o nome desaparece, restando apenas a foto (e, no mobile, o espaço em branco entre foto e menu hambúrguer)."
      },
      {
        "heading": "Comportamento Esperado",
        "content": "O nome deve permanecer visível na navbar independentemente do estado de scroll, tanto em desktop quanto em mobile."
      },
      {
        "heading": "Comportamento Atual",
        "content": "O componente `NavbarLogo` condiciona a renderização do `<span>` do nome à negação do estado `isScrolled`. Quando `isScrolled` é `true`, o `<span>` não é renderizado."
      },
      {
        "heading": "Contexto Técnico",
        "content": "- **Camada afetada:** frontend (componente compartilhado entre navbar desktop e mobile)\n- **Arquivo(s) confirmado(s) por trecho de código real:**\n  - `resizable-navbar.tsx` — componente `NavbarLogo`\n  - `Navbar.tsx` — estado `isScrolled` e os dois pontos de uso do `NavbarLogo`\n\n### Evidência de código coletada\n\nComponente `NavbarLogo` completo:\n```tsx\nexport const NavbarLogo = ({ isScrolled }: { isScrolled: boolean }) => {\n  return (\n    <a\n      href=\"#about\"\n      className=\"group relative z-10 flex items-center space-x-3\"\n      aria-label=\"Navigate to About section\"\n    >\n      <Image\n        src=\"/guilherme.jpg\"\n        alt=\"Guilherme Menezes\"\n        width={32}\n        height={32}\n        className=\"rounded-full\"\n      />\n      {!isScrolled && (\n        <span className=\"text-lg font-bold group-hover:text-brand-highlight transition-colors\">\n          Guilherme Menezes\n        </span>\n      )}\n    </a>\n  )\n}\n```\n\nEstado de scroll, definido em `Navbar.tsx`:\n```tsx\nconst [isScrolled, setIsScrolled] = useState(false)\n// ...\nuseEffect(() => {\n  const onScroll = () => setIsScrolled(window.scrollY > 50)\n  window.addEventListener('scroll', onScroll)\n  return () => window.removeEventListener('scroll', onScroll)\n}, [])\n```\n\nUso no layout desktop:\n```tsx\n<NavBody>\n  <NavbarLogo isScrolled={isScrolled} />\n  <NavItems items={navItems} isScrolled={isScrolled} />\n```\n\nUso no layout mobile:\n```tsx\n<MobileNav>\n  <MobileNavHeader>\n    <NavbarLogo isScrolled={isScrolled} />\n    <MobileNavToggle\n      isOpen={isMobileMenuOpen}\n      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}\n    />\n  </MobileNavHeader>\n```\n\nIsso confirma, por evidência direta (mesmo componente, mesma prop, mesmo estado), que desktop e mobile compartilham exatamente a mesma lógica de ocultação — não são dois bugs independentes, é uma única causa raiz."
      },
      {
        "heading": "Hipótese de Causa",
        "content": "Não é hipótese — é causa confirmada por leitura direta do código: a condicional `{!isScrolled && (...)}` no `NavbarLogo` remove o `<span>` do nome inteiramente da árvore de renderização quando `isScrolled` é `true`. Não há CSS de transição/fade envolvido — é renderização condicional binária."
      },
      {
        "heading": "Plano de Correção",
        "content": "*(Não preenchido — plano de correção é trabalho do agente executor após aprovação, não deste documento.)*\n\n---"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [x] Bug não reproduz mais\n- [x] Nenhuma regressão identificada\n- [x] **Pasta renomeada para `[done]-navbar-nome-desaparece-ao-scroll`**"
      }
    ],
    "path": "docs/archive/bugs/[done]-navbar-nome-desaparece-ao-scroll"
  },
  {
    "id": "resume-pdf-largura-sem-resize",
    "title": "Resume — Largura do PDF calculada apenas no carregamento inicial",
    "category": "bugs",
    "status": "done",
    "area": "archive",
    "date": "2026-07-08",
    "priority": "média",
    "tags": [
      "frontend",
      "ui-ux"
    ],
    "progress": 60,
    "progressFraction": {
      "done": 3,
      "total": 5
    },
    "summary": "Resumo descritivo para a tarefa: Resume  Largura do PDF calculada apenas no carregamento inicial.",
    "sections": [
      {
        "heading": "Descrição",
        "content": "A largura do componente `<Page>` do `react-pdf` na seção Resume é calculada uma única vez no momento da renderização, usando `window.innerWidth` diretamente no JSX. Isso significa que se o usuário redimensionar a janela após o carregamento da página, o PDF permanece com a largura original e não se adapta."
      },
      {
        "heading": "Como Reproduzir",
        "content": "1. Abrir o portfólio em desktop com a janela em largura máxima\n2. Rolar até a seção \"My Resume\"\n3. Observar que o PDF renderiza com uma largura correta\n4. Redimensionar a janela do browser para uma largura menor (ex: de 1440px para 768px) sem recarregar\n5. Observar que o PDF permanece com a largura do carregamento inicial, transbordando ou ficando desalinhado"
      },
      {
        "heading": "Comportamento Esperado",
        "content": "O PDF deve se adaptar dinamicamente ao redimensionamento da janela, respeitando sempre `Math.min(890, window.innerWidth - 20)`."
      },
      {
        "heading": "Comportamento Atual",
        "content": "A largura é calculada inline no JSX, avaliada apenas uma vez no render estático:\n```tsx\n// src/components/main/Resume.tsx — linha 67\nwidth={Math.min(890, typeof window !== 'undefined' ? window.innerWidth - 20 : 1200)}\n```\nNão existe `useState` + `useEffect` + listener de `resize` para atualizar o valor dinamicamente."
      },
      {
        "heading": "Contexto Técnico",
        "content": "- Camada afetada: frontend\n- Arquivo(s) suspeito(s): `src/components/main/Resume.tsx` (linha 67)\n- Logs de erro (se houver): nenhum"
      },
      {
        "heading": "Hipótese de Causa",
        "content": "O valor `window.innerWidth - 20` é lido somente durante o render. Como não há subscription ao evento `window.resize`, o componente nunca é notificado de que a viewport mudou e não re-renderiza."
      },
      {
        "heading": "Plano de Correção",
        "content": "1. Em `src/components/main/Resume.tsx`, criar um estado `containerWidth`:\n   ```tsx\n   const [containerWidth, setContainerWidth] = useState(\n     typeof window !== 'undefined' ? Math.min(890, window.innerWidth - 20) : 890\n   )\n   ```\n2. Adicionar um `useEffect` que escuta o evento `resize`:\n   ```tsx\n   useEffect(() => {\n     const handleResize = () => {\n       setContainerWidth(Math.min(890, window.innerWidth - 20))\n     }\n     window.addEventListener('resize', handleResize)\n     return () => window.removeEventListener('resize', handleResize)\n   }, [])\n   ```\n3. Substituir o atributo `width` do `<Page>` por `{containerWidth}`\n4. Testar redimensionamento em desktop e dispositivos mobile\n\n---"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [x] Bug não reproduz mais\n- [x] Nenhuma regressão identificada\n- [x] **Pasta renomeada para `[done]-resume-pdf-largura-sem-resize`**"
      }
    ],
    "path": "docs/archive/bugs/[done]-resume-pdf-largura-sem-resize"
  },
  {
    "id": "integracao-legada",
    "title": "Integração com Sistema Legado XYZ",
    "category": "features",
    "status": "cancelled",
    "area": "archive",
    "date": "2026-07-13",
    "priority": "baixa",
    "tags": [
      "api",
      "backend"
    ],
    "progress": 0,
    "progressFraction": {
      "done": 0,
      "total": 7
    },
    "summary": "Conexão com banco DBF antigo descartada devido ao encerramento do suporte ao ERP antigo.",
    "sections": [
      {
        "heading": "Objetivo",
        "content": "Se conectar com banco DBF antigo."
      },
      {
        "heading": "Descrição Funcional",
        "content": "N/A"
      },
      {
        "heading": "Escopo",
        "content": "### Inclui\n- Leitura DBF\n\n### Não inclui (por ora)\n- Escrita"
      },
      {
        "heading": "Requisitos Técnicos",
        "content": "- Camadas envolvidas: backend\n- Dependências ou integrações necessárias: Driver OBDC\n- Impactos em outras partes do sistema: DB local"
      },
      {
        "heading": "Plano de Implementação",
        "content": "1. Montar parser\n2. Retornar DTO"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Critérios de Conclusão",
        "content": "- [ ] Tudo testado\n\n---"
      },
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [ ] Todos os critérios de conclusão atendidos\n- [ ] Testado manualmente do ponto de vista do usuário\n- [ ] Nenhuma regressão identificada\n- [ ] **Pasta renomeada para `[done]-nome-da-feature` e movida para `archive/features/`**"
      }
    ],
    "path": "docs/archive/features/[cancelled]-integracao-legada"
  },
  {
    "id": "botao-idioma-ui-navbar",
    "title": "Language Toggle — Botão de Idioma na Navbar (UI)",
    "category": "enhancements",
    "status": "done",
    "area": "archive",
    "date": "2026-07-09",
    "priority": "média",
    "tags": [
      "frontend",
      "ui-ux"
    ],
    "progress": 67,
    "progressFraction": {
      "done": 4,
      "total": 6
    },
    "summary": "Resumo descritivo para a tarefa: Language Toggle  Botão de Idioma na Navbar (UI).",
    "sections": [
      {
        "heading": "Descrição",
        "content": "A Fase 0 do roadmap exige a base visual para a escolha de idiomas. Este item foca na criação estrita da UI do botão (toggle) na Navbar, que ficará ao lado do botão de Tema. Ele prepara o terreno para a Fase 3, onde a lógica sistêmica real e a infraestrutura de tradução (i18next) serão inseridas neste mesmo componente."
      },
      {
        "heading": "Escopo",
        "content": "O que **ESTÁ INCLUSO** neste item (Fase 0):\n- Um botão/toggle visual novo, posicionado ao lado do `ThemeToggle` na navbar, construído como um controle separado.\n- Um estado local (mock) simples no componente, permitindo alternar a aparência visual ao clicar (ex: exibir a sigla \"PT\" ou \"EN\").\n\nO que **NÃO ESTÁ INCLUSO** neste item (Reservado para a Fase 3):\n- Lógica real de tradução, troca de conteúdo no site ou instalação do `i18next`.\n- Persistência de preferência (localStorage, cookies, session, etc.)."
      },
      {
        "heading": "Contexto Técnico",
        "content": "- Camadas afetadas: frontend (interface)\n- Arquivo(s) alvo:\n  - `src/components/ui/resizable-navbar.tsx` (para posicionar o botão dentro da div de ações à direita).\n  - Criação do componente estritamente visual em `src/components/ui/language-toggle.tsx`. **Nota de Convenção:** Seguimos o padrão kebab-case (`language-toggle.tsx`) usado em outros componentes UI do projeto. Ele é explicitamente um componente visual no momento, e não um hook de lógica (`use-idioma`), já que o papel dele agora é prover a casca da interface."
      },
      {
        "heading": "Plano de Correção",
        "content": "1. Criar o componente visual `LanguageToggle` usando um ícone descritivo ou botões de sigla (PT/EN), aderindo ao mesmo estilo de botão fantasma (ghost/variant) e tema visual do `ThemeToggle`.\n2. Embutir um `useState<'PT' | 'EN'>` puramente cosmético que responde a cliques com uma transição suave. **Observação de Arquitetura:** Este estado local é estritamente temporário e desenhado apenas para dar feedback visual agora. Na Fase 3, ele será completamente substituído por um hook de contexto/provider (similar ao funcionamento do `next-themes` para o dark mode) para orquestrar o i18next globalmente.\n3. Importar e adicionar o `LanguageToggle` em `resizable-navbar.tsx`, junto ao `ThemeToggle` na div `flex items-center gap-2`.\n4. Assegurar que ele herde a classe `relative z-10` recém-implementada para não perder a interatividade no desktop sob o grid invisível."
      }
    ],
    "criteriaSections": [
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [x] O botão foi adicionado com sucesso e não desconfigura a Navbar responsivamente.\n- [x] O clique alterna a indicação de idioma (PT/EN) no estado local apenas visualmente.\n- [x] O botão compartilha a correta interação de pointer-events da versão refatorada (sem regressões para o layout global).\n- [x] **Pasta renomeada para `[done]-botao-idioma-ui-navbar`**"
      }
    ],
    "path": "docs/archive/enhancements/[done]-botao-idioma-ui-navbar"
  },
  {
    "id": "navbar-logo-hover-cor-hardcoded",
    "title": "NavbarLogo — Texto \"Guilherme Menezes\" com cor de hover hardcoded",
    "category": "enhancements",
    "status": "done",
    "area": "archive",
    "date": "2026-07-09",
    "priority": "baixa",
    "tags": [
      "frontend",
      "ui-ux"
    ],
    "progress": 60,
    "progressFraction": {
      "done": 3,
      "total": 5
    },
    "summary": "Resumo descritivo para a tarefa: NavbarLogo  Texto \"Guilherme Menezes\" com cor de hover hardcoded.",
    "sections": [
      {
        "heading": "Origem do Item & Justificativa",
        "content": "> **Aviso:** Este item é um **achado espontâneo**, levantado acidentalmente durante a investigação do item original de \"texto estático do navbar\". Ele não fazia parte do escopo original da Fase 0.\n> **Decisão (Opção B):** Aprovada a criação de um token de marca específico. A justificativa para não manter a cor hardcoded é que o projeto ganhará um painel administrativo futuramente (Fase 2+ do roadmap principal) que permitirá customização de cores dinamicamente. Portanto, ter a cor de hover mapeada em uma variável CSS `--brand-highlight` prepara o terreno para essa funcionalidade.\n\n> **Categoria Pendente:** Por se tratar de uma evolução do sistema de design e não do conserto de um comportamento quebrado, este item deveria residir em `enhancements/`. O documento permanece temporariamente na pasta `bugs/` com status `[draft]` até que essa categorização seja confirmada pelo usuário antes da execução."
      },
      {
        "heading": "Descrição",
        "content": "O texto \"Guilherme Menezes\" exibido na navbar (logo/nome clicável) possui a cor de hover definida com a classe hardcoded `group-hover:text-red-500`. Isso ignora o sistema de design tokens do projeto (variáveis CSS do Tailwind/shadcn), cria inconsistência visual e dificulta a manutenção de temas (claro/escuro)."
      },
      {
        "heading": "Como Reproduzir",
        "content": "1. Abrir o portfólio em desktop (navbar expandida, estado não-scrollado)\n2. Passar o mouse sobre o texto \"Guilherme Menezes\" à esquerda da navbar\n3. Observar a cor de hover: vermelho puro (`red-500`) que não pertence ao sistema de cores do portfólio"
      },
      {
        "heading": "Comportamento Esperado",
        "content": "O hover do nome na navbar deve usar a cor do design token correspondente (ex: `text-primary` ou `text-destructive` conforme definição do tema), não uma cor hardcoded."
      },
      {
        "heading": "Comportamento Atual",
        "content": "A classe Tailwind está hardcoded no componente `NavbarLogo` em `resizable-navbar.tsx`:\n```tsx\n// src/components/ui/resizable-navbar.tsx — linhas 247–251\n{!isScrolled && (\n  <span className=\"text-lg font-bold group-hover:text-red-500 transition-colors\">\n    Guilherme Menezes\n  </span>\n)}\n```\nA classe `group-hover:text-red-500` usa um valor de cor absoluto de fora do sistema de tokens."
      },
      {
        "heading": "Contexto Técnico",
        "content": "- Camada afetada: frontend\n- Arquivo(s) suspeito(s): `src/components/ui/resizable-navbar.tsx` (linha 248)\n- Logs de erro (se houver): nenhum — é problema de design/consistência"
      },
      {
        "heading": "Hipótese de Causa",
        "content": "A cor foi definida manualmente (`red-500`) durante o desenvolvimento, sem consultar o sistema de design tokens disponível via CSS variables (shadcn/ui). \n\nAnálise real do `src/app/globals.css`:\nO projeto utiliza cores no formato `oklch`. \n- **Token `--primary`**: É um tom de preto no modo claro (`oklch(0.205 0 0)`) e branco no modo escuro (`oklch(0.922 0 0)`). Como o texto normal já usa as cores de foreground (quase preto/branco), usar `text-primary` no hover **não traria uma mudança visual perceptível**.\n- **Token `--destructive`**: É um vermelho temático (`oklch(0.577 0.245 27.325)` no claro, e `oklch(0.704 0.191 22.216)` no escuro). Porém, usar este token apenas porque a cor resultante é vermelha é um **erro semântico**, já que `--destructive` sinaliza estados de erro/perigo/exclusão, não um hover decorativo de identidade.\n\nNenhum outro token do sistema (`--accent`, `--secondary`, etc.) serve para um highlight de marca. Portanto, a transição para um token existente não é viável sem quebrar a semântica."
      },
      {
        "heading": "Plano de Correção (Opção B Aprovada)",
        "content": "Para expandir o Design System e preparar o terreno para a customização via painel administrativo, os seguintes passos serão executados:\n\n1. **Definir a variável CSS do token**: Em `src/app/globals.css`, adicionar `--brand-highlight` nos blocos `:root` e `.dark`. \n   - Valor exato: `oklch(0.637 0.237 25.331)`. Este é o valor literal da paleta nativa do Tailwind v4 para a cor `red-500` (extraído do source `tailwindcss/theme.css`). Usar este valor garante 100% de paridade com a intenção visual atual, aplicando a mesma cor para o modo claro e escuro.\n2. **Registrar o token no Tailwind v4**: O projeto não utiliza `tailwind.config.ts`, pois adota o Tailwind v4 com `@theme inline`. Portanto, adicionar a linha `--color-brand-highlight: var(--brand-highlight);` dentro do bloco `@theme inline` no topo do `globals.css`.\n3. **Aplicar no componente**: Em `src/components/ui/resizable-navbar.tsx` (linha 248), substituir a classe hardcoded `group-hover:text-red-500` pela classe gerada pelo novo token: `group-hover:text-brand-highlight`.\n\n---"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [x] Bug não reproduz mais\n- [x] Nenhuma regressão identificada\n- [x] **Pasta renomeada para `[done]-navbar-logo-hover-cor-hardcoded`**"
      }
    ],
    "path": "docs/archive/enhancements/[done]-navbar-logo-hover-cor-hardcoded"
  },
  {
    "id": "navbar-logo-texto-terminal",
    "title": "NavbarLogo — Substituir texto estático por estilo terminal com cursor piscando",
    "category": "enhancements",
    "status": "done",
    "area": "archive",
    "date": "2026-07-09",
    "priority": "baixa",
    "tags": [
      "frontend",
      "animação",
      "ui-ux"
    ],
    "progress": 91,
    "progressFraction": {
      "done": 10,
      "total": 11
    },
    "summary": "Estilização do texto do logo da navbar para simular um prompt de terminal de comandos com cursor piscando.",
    "sections": [
      {
        "heading": "Contexto",
        "content": "O `NavbarLogo` exibe \"Guilherme Menezes\" em texto plano ao lado da foto de perfil na navbar, no estado não-scrollado. O texto é um `<span>` simples sem qualquer estilo visual diferenciado.\n\n```tsx\n// src/components/ui/resizable-navbar.tsx — linhas 247-251\n<span className=\"text-lg font-bold group-hover:text-brand-highlight transition-colors\">\n  {text}\n</span>\n```"
      },
      {
        "heading": "Problema Atual",
        "content": "O texto é genérico e não comunica a identidade de desenvolvedor. \"Guilherme Menezes\" em fonte bold não diferencia visualmente o portfólio de qualquer outro — não aproveita o espaço da navbar para reforçar o posicionamento técnico do dono do portfólio."
      },
      {
        "heading": "Melhoria Proposta",
        "content": "Substituir o `<span>` por um componente de texto com estética de terminal:\n\n```\nguilherme-menezes@home:~$▌\n```\n\n- Texto fixo: `guilherme-menezes@home:~$`\n- Cursor: quadradinho (`▌` ou `█`) piscando em loop, simulando prompt de terminal ativo\n- Fonte: monospace (ex: `font-mono`) para reforçar o estilo de CLI\n- Cursor animado via CSS (`@keyframes blink` ou classe Tailwind `animate-pulse` / animação customizada)"
      },
      {
        "heading": "Impacto Esperado",
        "content": "- Reforço visual imediato do posicionamento como desenvolvedor técnico\n- Diferenciação estética em relação a portfólios genéricos\n- Impacto contido: apenas o `<span>` do nome na navbar desktop (estado não-scrollado)"
      },
      {
        "heading": "Plano de Implementação",
        "content": "1. Em `src/components/ui/resizable-navbar.tsx`, atualizar o componente `NavbarLogo` (que agora é usado apenas no desktop) para renderizar a estética de terminal:\n   ```tsx\n   <span className=\"font-mono text-sm md:text-base font-semibold group-hover:text-brand-highlight transition-colors flex items-center\">\n     guilherme-menezes@home:~$\n     <span className=\"ml-[2px] inline-block w-2 h-4 bg-current animate-blink\" />\n   </span>\n   ```\n\n2. Adicionar a animação `animate-blink` no CSS global (`src/app/globals.css` ou via Tailwind config):\n   ```css\n   @keyframes blink {\n     0%, 100% { opacity: 1; }\n     50%       { opacity: 0; }\n   }\n   .animate-blink {\n     animation: blink 1s step-start infinite;\n   }\n   ```\n   *Ou via `tailwind.config` em `theme.extend.animation` e `theme.extend.keyframes`.*\n\n3. Verificar contraste do cursor em modo claro e escuro (`bg-current` acompanha a cor do texto).\n\n4. Como o `MobileNavHeader` foi refatorado recentemente para não usar mais o `NavbarLogo` para o texto central (utilizando uma tag separada), a alteração do `NavbarLogo` afetará exclusivamente o desktop, cumprindo o requisito de manter o layout limpo no mobile."
      }
    ],
    "criteriaSections": [
      {
        "heading": "Critérios de Conclusão",
        "content": "- [x] Texto \"guilherme-menezes@home:~$\" visível na navbar desktop (independente do estado de scroll)\n- [x] Cursor quadrado piscando em loop após o `$`\n- [x] Fonte monospace aplicada corretamente\n- [x] Funciona em modo claro e escuro sem perda de contraste\n- [x] Sem regressão no comportamento de scroll (sumiço do texto ao scrollar) existente\n- [x] Comportamento definido para mobile (aplica ou mantém texto simples)\n\n---"
      },
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [x] Melhoria perceptível e funcional\n- [x] Nenhuma regressão identificada\n- [x] **Pasta renomeada para `[done]-navbar-logo-texto-terminal` e movida para `archive/enhancements/`**"
      }
    ],
    "path": "docs/archive/enhancements/[done]-navbar-logo-texto-terminal"
  },
  {
    "id": "navbar-mobile-menu-reorganizacao",
    "title": "Navbar Mobile — Reorganização do menu hambúrguer aberto",
    "category": "enhancements",
    "status": "done",
    "area": "archive",
    "date": "2026-07-09",
    "priority": "média",
    "tags": [
      "frontend",
      "ui-ux"
    ],
    "progress": 60,
    "progressFraction": {
      "done": 6,
      "total": 10
    },
    "summary": "Resumo descritivo para a tarefa: Navbar Mobile  Reorganização do menu hambúrguer aberto.",
    "sections": [
      {
        "heading": "Contexto",
        "content": "O menu mobile (hambúrguer) aberto hoje funciona sem erros, mas o dono do projeto suspeita que o layout pode ser melhorado. Não há comportamento quebrado — é uma questão de UX a ser decidida, ainda sem direção definida."
      },
      {
        "heading": "Problema Atual",
        "content": "Comprovado por evidência visual (print anexado pelo dono do projeto) e por trecho de código real:\n\n- O botão de email ocupa 100% da largura, posicionado abaixo dos toggles de tema/idioma.\n- Os toggles de tema e idioma ficam nas extremidades opostas de uma mesma linha (idioma à esquerda, tema à direita), acima do botão de email.\n- Não há consenso ainda sobre se essa disposição é a ideal — o próprio dono do projeto declarou não saber qual direção de UI/UX tomar."
      },
      {
        "heading": "Contexto Técnico (evidência de código)",
        "content": "Container do menu mobile aberto (`MobileNavMenu`):\n```tsx\nexport const MobileNavMenu = ({ children, className, isOpen }: MobileNavMenuProps) => {\n  return (\n    <AnimatePresence>\n      {isOpen && (\n        <motion.div\n          initial={{ opacity: 0 }}\n          animate={{ opacity: 1 }}\n          exit={{ opacity: 0 }}\n          className={cn(\n            'absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-white px-4 py-8 shadow-[...] dark:bg-neutral-950',\n            className,\n          )}\n        >\n          {children}\n        </motion.div>\n      )}\n    </AnimatePresence>\n  )\n}\n```\n\nConteúdo interno, em `Navbar.tsx`:\n```tsx\n<MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>\n  {navItems.map((item) => (\n    <Link\n      key={`mobile-link-${item.name}`}\n      href={item.link}\n      onClick={() => {\n        setIsMobileMenuOpen(false)\n        document.getElementById(item.link.slice(1))?.scrollIntoView({ behavior: 'smooth' })\n      }}\n      className=\"relative text-neutral-600 dark:text-neutral-300 flex gap-2 items-center\"\n    >\n      {item.icon} <span>{item.name}</span>\n    </Link>\n  ))}\n  <div className=\"flex w-full flex-col gap-4\">\n    <div className=\"flex justify-between w-full gap-4\">\n      <LanguageToggle />\n      <ThemeToggle />\n    </div>\n    <Button\n      onClick={() => {\n        setIsMobileMenuOpen(false)\n        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })\n      }}\n      variant=\"default\"\n      className=\"w-full rounded-full\"\n    >\n      <FaEnvelope />\n    </Button>\n  </div>\n</MobileNavMenu>\n```\n\n**Confirmado por trecho real:**\n- O menu é posicionado de forma absoluta (`absolute inset-x-0 top-16`), logo abaixo da navbar fixa.\n- Ordem no DOM (de cima para baixo no fluxo `flex-col`): links de navegação → linha de toggles (idioma/tema) → botão de email.\n- `LanguageToggle` e `ThemeToggle` reaproveitam exatamente os mesmos componentes usados no desktop; o `Button` de email também reaproveita o mesmo componente base, com classes diferentes (`w-full` no mobile vs `rounded-full z-50` no desktop)."
      },
      {
        "heading": "Melhoria Proposta",
        "content": "Esta seção reflete a decisão de UX confirmada pelo dono do projeto, e não uma sugestão da IA:\n- **Header fixo (`MobileNavHeader`), estado FECHADO do menu**: mantém \"foto — 'Portfólio' — ícone hambúrguer\" (a alteração para manter o texto já está coberta pelo bug `docs/bugs/[approved]-navbar-desktop-sobreposicao-botoes-1200px` — esta é apenas uma referência, não duplicar a especificação).\n- **Header fixo, estado ABERTO do menu**: muda para \"foto — texto 'Menu' — Idioma — Tema — X\", todos na mesma linha do topo, nessa ordem da esquerda para a direita. O ícone do botão de fechar (hoje hambúrguer) vira X quando o menu está aberto — isso já é comportamento existente, não muda.\n- **Estrutural**: `LanguageToggle` e `ThemeToggle` devem ser MOVIDOS de dentro do `MobileNavMenu` (onde estão hoje) para dentro do `MobileNavHeader`, aparecendo apenas quando o menu está aberto (não devem aparecer com o menu fechado).\n- **Conteúdo do `MobileNavMenu`** (área que abre/fecha): passa a conter apenas os links de navegação (About, Skills, Experience, Projects, Blogs) e o botão de email (mantém `w-full`, destacado, sem mudança de estilo).\n- **Nota para o futuro**: quando existir o painel administrativo (fase futura do roadmap), pode surgir opção para os toggles aparecerem mesmo com o menu fechado — isso está FORA de escopo deste documento, é apenas contexto para não surpreender quem revisitar isso depois."
      },
      {
        "heading": "Impacto Esperado",
        "content": "A mudança visa reduzir a assimetria percebida hoje (toggles isolados nos cantos, desconectados do botão de fechar) e consolidar ações de \"configuração\" (idioma/tema/fechar) num único agrupamento, deixando o email como a única ação de destaque na área de conteúdo do menu."
      },
      {
        "heading": "Plano de Implementação",
        "content": "1. Mover os componentes `LanguageToggle` e `ThemeToggle` de dentro do `MobileNavMenu` para dentro do `MobileNavHeader`.\n2. Condicionar a renderização desses dois componentes dentro do `MobileNavHeader` ao estado `isOpen` do menu (só renderizam quando `isOpen` é `true`).\n3. Ajustar o texto do `NavbarLogo` (ou equivalente) dentro do header para alternar entre \"Portfólio\" (fechado) e \"Menu\" (aberto), dependendo do mesmo estado `isOpen`.\n4. Verificar que o ícone de hambúrguer/X já responde a esse mesmo estado (parece já ser o comportamento atual — confirmar com trecho de código antes de assumir).\n5. Remover os toggles do bloco de ações dentro do `MobileNavMenu`, deixando apenas o botão de email.\n6. Validar visualmente que a linha do header (foto + Menu + Idioma + Tema + X) não quebra ou aperta em larguras mobile pequenas (ex: 320-375px) — isso é uma nova área de risco de sobreposição que não existia antes."
      }
    ],
    "criteriaSections": [
      {
        "heading": "Critérios de Conclusão",
        "content": "- [x] Header fechado mostra \"Portfólio\".\n- [x] Header aberto mostra \"Menu\" + toggles + X.\n- [x] Toggles não aparecem com o menu fechado.\n- [x] Email mantém destaque isolado na área do menu.\n- [x] Sem quebra ou sobreposição de elementos na linha do header em larguras pequenas (320-375px).\n\n---"
      },
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [ ] Melhoria perceptível e funcional\n- [ ] Nenhuma regressão identificada\n- [ ] **Pasta renomeada para `[done]-navbar-mobile-menu-reorganizacao`**"
      }
    ],
    "path": "docs/archive/enhancements/[done]-navbar-mobile-menu-reorganizacao"
  },
  {
    "id": "remover-env-d-ts-cloudflare",
    "title": "Remover env.d.ts gerado pelo Wrangler (resquício do Cloudflare)",
    "category": "refactoring",
    "status": "done",
    "area": "archive",
    "date": "2026-07-09",
    "priority": "baixa",
    "tags": [
      "dx",
      "infra"
    ],
    "progress": 78,
    "progressFraction": {
      "done": 7,
      "total": 9
    },
    "summary": "Remoção do arquivo env.d.ts (238 KB, 5.769 linhas) órfão, remanescente da infraestrutura antiga do Cloudflare Wrangler.",
    "sections": [
      {
        "heading": "Motivação",
        "content": "Durante a limpeza de dependências do Cloudflare (remoção de `@opennextjs/cloudflare`, `wrangler` e scripts órfãos do `package.json`), foi identificado que o arquivo `env.d.ts` é um resquício direto dessa stack. Ele foi gerado pelo comando `wrangler types` e contém ~5.769 linhas de tipos do runtime Cloudflare Workers (`workerd`) que não têm relação com o projeto atual (Next.js em VPS).\n\nBusca por `CloudflareEnv` em todo o projeto confirma: o tipo é declarado no arquivo mas **nunca importado ou referenciado em nenhum arquivo de código-fonte** (`src/`)."
      },
      {
        "heading": "Situação Atual",
        "content": "O arquivo `env.d.ts` (238 KB, 5.769 linhas) contém:\n- Linha 2: comentário de geração pelo `wrangler types`\n- Linha 4–7: `namespace Cloudflare { interface Env {} }`\n- Linha 8: `interface CloudflareEnv extends Cloudflare.Env {}`\n- Linhas 10–5769: tipos do runtime `workerd@1.20250604.0` (Cloudflare Workers)\n\n```ts\n// env.d.ts — gerado por wrangler, não usado pelo projeto\n// Generated by Wrangler by running `wrangler types --env-interface CloudflareEnv ./env.d.ts`\ndeclare namespace Cloudflare { interface Env {} }\ninterface CloudflareEnv extends Cloudflare.Env {}\n// ... 5760 linhas de tipos do Cloudflare Workers runtime ...\n```"
      },
      {
        "heading": "Situação Desejada",
        "content": "O `env.d.ts` é removido. O `tsconfig.json` não o referencia explicitamente (é incluído por glob `**/*.d.ts`), então a remoção é limpa — o TypeScript simplesmente para de incluir esses tipos, sem efeito colateral para o código do projeto."
      },
      {
        "heading": "Riscos",
        "content": "- **Baixo.** Nenhum arquivo em `src/` usa `CloudflareEnv` ou qualquer tipo exclusivo do Cloudflare Workers runtime.\n- Verificar antes da execução: rodar `tsc --noEmit` antes e depois da remoção para confirmar que nenhum erro de tipo surge."
      },
      {
        "heading": "Estratégia de Execução",
        "content": "1. Verificar `tsconfig.json` — confirmar que `env.d.ts` não está listado explicitamente em `include` ou `files`\n2. Rodar `npx tsc --noEmit` para registrar o estado atual (zero erros esperados)\n3. Remover `env.d.ts`\n4. Rodar `npx tsc --noEmit` novamente — confirmar zero erros\n5. Commit com mensagem: `chore: remove env.d.ts (wrangler/cloudflare leftover)`"
      },
      {
        "heading": "Evidências de Validação",
        "content": "### 1. Diff do tsconfig.json\nA alteração feita manualmente removeu apenas a linha `./env.d.ts` de `compilerOptions.types`. O Next.js (na versão 16 + Turbopack) reconfigurou automaticamente o arquivo ao rodar o build, alterando a diretiva `jsx` para `\"react-jsx\"` e inserindo `\".next/dev/types/**/*.ts\"` no `include`.\nO log bruto do build comprova essa ação automática do framework:\n```\n  We detected TypeScript in your project and reconfigured your tsconfig.json file for you.\n  The following suggested values were added to your tsconfig.json. These values can be changed to fit your project's needs:\n\n  \t- include was updated to add '.next/dev/types/**/*.ts'\n\n  The following mandatory changes were made to your tsconfig.json:\n\n  \t- jsx was set to react-jsx (next.js uses the React automatic runtime)\n```\n\n### 2. tsc --noEmit Pós-Remoção\nNenhum erro de tipo detectado (comando retornou com sucesso e saída vazia):\n```bash\n$ npx tsc --noEmit\n# (Saída vazia)\n```\n\n### 3. Build de Produção com Sucesso\n```bash\n$ npm run build\n# (Compilação Turbopack com sucesso em 5.1s, TypeScript compilado sem erros em 4.8s)\n```\n\n### 4. Ausência de Referências (Grep)\nUma busca global por `CloudflareEnv` retornou 0 ocorrências fora do escopo deste README de refatoração, atestando que a tipagem estava 100% órfã.\n\n---"
      }
    ],
    "criteriaSections": [
      {
        "heading": "Critérios de Conclusão",
        "content": "- [x] `env.d.ts` removido do repositório\n- [x] `tsc --noEmit` sem erros após a remoção\n- [x] Nenhum arquivo em `src/` afetado"
      },
      {
        "heading": "Validação",
        "content": "> _(preencher após execução e teste)_\n\n- [x] Comportamento idêntico ao anterior\n- [x] Nenhuma regressão identificada\n- [x] Dívida técnica removida\n- [x] **Pasta renomeada para `[done]-remover-env-d-ts-cloudflare`**"
      }
    ],
    "path": "docs/archive/refactoring/[done]-remover-env-d-ts-cloudflare"
  }
];
