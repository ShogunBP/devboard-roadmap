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
    "path": "docs/archive/refactoring/[done]-remover-env-d-ts-cloudflare"
  }
];
