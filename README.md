# 📋 devboard-roadmap

Um kanban/roadmap estático (HTML + CSS + JS puro, sem build, sem framework) que visualiza o estado de qualquer sistema de documentação baseado em pastas `/docs` — originalmente criado para acompanhar o desenvolvimento de um portfólio pessoal, mas pensado desde o início para ser copiado e reutilizado em qualquer outro projeto.

**Somente leitura, por decisão deliberada.** Esta ferramenta nunca escreve nos seus documentos, não move pastas, não edita status pela interface. Ela só lê o que já existe em `/docs` e visualiza. Aprovações, mudanças de status e revisões continuam acontecendo do jeito que sempre aconteceram — renomeando pastas e editando READMEs manualmente, com intenção humana real por trás de cada decisão.

## O que isso resolve

Se o seu projeto já usa (ou está disposto a usar) uma convenção de pastas do tipo `docs/{active|archive}/{categoria}/[status]-nome-da-tarefa/README.md` para planejar bugs, features, melhorias e refatorações antes de implementá-las, esta ferramenta te dá um board visual (Kanban + linha do tempo por trimestre) gerado automaticamente a partir desses arquivos — sem duplicar trabalho de escrever os READMEs em outro lugar, e sem exigir nenhuma ferramenta externa (Trello, Notion, Jira) para acompanhar progresso.

---

## ✨ Features

- **Visualização Kanban** — Cards organizados por status (Preparação → Aprovado → Em Progresso → Concluído → Cancelado)
- **Visualização Roadmap** — Agrupamento por trimestre para visão de longo prazo
- **Atualização em tempo real** — Edite um `README.md` na pasta `/docs` e o board atualiza sozinho via polling (sem F5)
- **Filtros e busca** — Filtre por prioridade, categoria, área (active/archive) e busque por título ou tags
- **Modal de detalhes** — Clique em qualquer card para ver o conteúdo completo do README organizado em abas (Conteúdo, Critérios de Conclusão, Detalhes técnicos), com progresso calculado automaticamente
- **4 temas visuais** — Padrão, Terminal, Clean e Ficha de Arquivo, cada um com variante clara e escura (8 combinações)
- **Toggle claro/escuro** — Independente do tema visual, persiste no `localStorage`
- **Importar/Exportar JSON** — Faça backup ou migre dados com um clique
- **Modo estático** — Pode ser aberto direto no navegador (`file://`) sem servidor rodando. Mostra o snapshot de dados gerado pela última vez que o servidor rodou (via `data.js`), mas sem atualização automática nesse modo — o polling depende de um servidor HTTP ativo para funcionar, por causa de restrições de CORS do navegador para requisições locais.
- **Zero dependências externas** — Vanilla JS + TailwindCSS via CDN + Lucide Icons

---

## 🖥️ Como funciona

```
docs/                          roadmap-server.js              roadmap.html
├── active/                    observa /docs com              consome data.js/data.json
│   ├── bugs/                  fs.watch recursivo     ──►     e renderiza o board
│   ├── features/              ──► gera data.js               com polling a cada 2-3s
│   ├── enhancements/              e data.json
│   └── refactoring/
└── archive/
    ├── bugs/
    ├── features/
    ├── enhancements/
    └── refactoring/
```

O servidor Node.js (`roadmap-server.js`) observa a pasta `/docs`, parseia cada `README.md` (extraindo status, categoria, título, data, prioridade, tags e progresso via checkboxes) e gera os arquivos de dados. O frontend estático consome esses dados e renderiza tudo.

---

## 🚀 Início Rápido

### Pré-requisitos

- [Node.js](https://nodejs.org/) (qualquer versão recente)
- Uma pasta `/docs` no seu projeto seguindo a [convenção de pastas](#-convenção-de-pastas)

### Instalação

1. **Clone o repositório:**

```bash
git clone https://github.com/ShogunBP/devboard-roadmap.git
```

2. **Copie para o seu projeto** (ou use diretamente):

```bash
# Copie a pasta roadmap/ e o roadmap.html para a raiz do seu projeto
cp -r devboard-roadmap/roadmap /seu-projeto/
cp devboard-roadmap/roadmap.html /seu-projeto/
```

3. **Inicie o servidor:**

```bash
cd /seu-projeto
node roadmap/roadmap-server.js
```

4. **Acesse no navegador:**

```
http://localhost:3003
```

> Porta configurável no topo de `roadmap/roadmap-server.js` (padrão: 3003). Se você alterar esse valor no arquivo, ajuste o endereço acima de acordo.

### Modo estático (sem servidor)

Se não quiser rodar o servidor, basta abrir o `roadmap.html` diretamente no navegador. Ele usará o `data.js` gerado pela última execução do servidor como fallback. Note que a atualização automática (polling) não funciona nesse modo devido a restrições de CORS para requisições locais (`file://`), sendo necessário um servidor HTTP ativo para que o board atualize sozinho ao editar a documentação.

---

## 📁 Convenção de Pastas

O devboard-roadmap espera que seu projeto tenha uma pasta `/docs` com a seguinte estrutura:

```
docs/
├── active/                              ← Tarefas em andamento
│   ├── bugs/
│   │   └── [ready-for-review]-login-nao-redireciona/
│   │       └── README.md
│   ├── features/
│   │   └── [draft]-sistema-de-notificacoes/
│   │       └── README.md
│   ├── enhancements/
│   │   └── [in-progress]-melhorar-performance/
│   │       └── README.md
│   └── refactoring/
│       └── [approved]-migrar-fetch-para-axios/
│           └── README.md
└── archive/                             ← Tarefas finalizadas ou canceladas
    ├── bugs/
    │   └── [done]-correcao-dropdown/
    │       └── README.md
    └── enhancements/
        └── [cancelled]-remover-suporte-ie11/
            └── README.md
```

### Status possíveis

| Status | Descrição | Área |
|--------|-----------|------|
| `[draft]` | Documento sendo escrito | `active/` |
| `[ready-for-review]` | Pronto para revisão | `active/` |
| `[changes-requested]` | Revisor pediu ajustes | `active/` |
| `[approved]` | Aprovado para execução | `active/` |
| `[in-progress]` | Em desenvolvimento | `active/` |
| `[done]` | Finalizado e validado | `archive/` |
| `[cancelled]` | Descartado com justificativa | `archive/` |

### Categorias

| Emoji | Pasta | Uso |
|-------|-------|-----|
| 🐛 | `bugs/` | Problemas a corrigir |
| ✨ | `features/` | Funcionalidades novas |
| 🔧 | `enhancements/` | Melhorias no existente |
| ♻️ | `refactoring/` | Débito técnico e reestruturação |

### Campos do README.md

Cada `README.md` deve conter os seguintes campos estruturados no topo:

```markdown
# 🐛 Título da Tarefa

**Status:** `draft`
**Data:** 2026-07-15
**Prioridade:** `alta`
**Tags:** `frontend`, `performance`
```

O progresso é calculado automaticamente pela contagem de checkboxes (`- [x]` / `- [ ]`) no documento.

---

## 🎨 Temas Visuais

O devboard-roadmap inclui 4 temas visuais, cada um com variante clara e escura:

| Tema | Descrição |
|------|-----------|
| **Padrão** | Estética blueprint/técnica com ciano e azul como acento |
| **Terminal** | Painel de controle com âmbar como cor dominante |
| **Clean** | Design limpo e minimalista inspirado no shadcn/ui |
| **Ficha de Arquivo** | Estética de ficha de papel com tipografia serifada e "carimbos" de status |

Alterne entre temas pelo seletor no header. A escolha persiste no `localStorage`.

---

## ⚙️ Painel de Configurações

Acessível pelo ícone de engrenagem no header, dividido em 4 grupos:

- **Aparência** *(preferência pessoal, salva no navegador)* — tema visual, modo escuro.
- **Comportamento** *(preferência pessoal, salva no navegador)* — ocultar tarefas canceladas, intervalo de atualização automática (polling), aplicado imediatamente sem precisar recarregar a página.
- **Identidade do Projeto** *(configuração compartilhada, salva em `roadmap/config.json`)* — nome do projeto, descrição, selo/badge exibidos no header. Diferente do grupo acima, isso vale para qualquer pessoa que abrir este roadmap, não só para quem está configurando.
- **Informações técnicas** *(somente leitura)* — porta do servidor atual, status do polling.

---

## 📂 Estrutura do Projeto

```
devboard-roadmap/
├── roadmap.html               ← Página principal (abra no navegador)
├── roadmap/
│   ├── roadmap.js             ← Lógica do frontend (Kanban, Roadmap, filtros, modal)
│   ├── roadmap.css            ← Variáveis CSS e temas visuais (8 combinações)
│   ├── roadmap-server.js      ← Servidor Node.js (parser + watcher + HTTP)
│   ├── data.js                ← Dados gerados (formato JS para fallback estático)
│   ├── data.json              ← Dados gerados (formato JSON para polling)
│   └── config.json            ← Identidade do projeto (salvo no servidor)
├── docs/                      ← Pasta de documentação do projeto (seus dados)
│   ├── PADRONIZATION.md       ← Guia completo da convenção de docs
│   ├── active/                ← Tarefas em andamento
│   └── archive/               ← Tarefas finalizadas/canceladas
└── README.md                  ← Este arquivo
```

---

## 🛠️ Stack Técnica

| Tecnologia | Uso |
|------------|-----|
| **Vanilla JS** | Toda a lógica do frontend, sem frameworks |
| **TailwindCSS v4** | Estilização via CDN (sem build step) |
| **Lucide Icons** | Ícones SVG via CDN |
| **Node.js** | Servidor de monitoramento e parsing (`fs.watch`) |
| **CSS Custom Properties** | Sistema de temas com 8 variantes (4 temas × 2 modos) |

---

## 🗺️ Roadmap do Projeto

Consulte o [ROADMAP.md](./ROADMAP.md) para o plano completo de implementação, dividido em fases:

- ✅ **Fase 0** — Fundação (arquitetura e decisões)
- ✅ **Fase 1** — Parser e geração de dados
- ✅ **Fase 2** — Integração com o front-end
- ✅ **Fase 3** — Atualização quase em tempo real
- 🔄 **Fase 4** — Polimento e portabilidade (em andamento)

---

## 🤖 Uso com Agentes de IA (Recomendado)

Para usar o devboard-roadmap com eficiência máxima junto com assistentes de IA (como GitHub Copilot, Cursor, Gemini, etc.), é **altamente recomendado** configurar um **agente personalizado / skill / plugin** específico que force o modelo a seguir as regras do [`docs/PADRONIZATION.md`](./docs/PADRONIZATION.md).

### Por quê?

Sem instrução explícita, modelos de linguagem tendem a:

- **Inventar categorias** que não existem (criar pastas fora de `bugs/`, `features/`, `enhancements/`, `refactoring/`)
- **Pular campos obrigatórios** como `Prioridade` e `Tags` no cabeçalho dos READMEs
- **Criar tags ad-hoc** em vez de usar a lista predefinida
- **Avançar status sozinhos** (ex: marcar como `[approved]` sem review humano)
- **Deixar pastas `[done]` em `active/`** em vez de mover para `archive/`
- **Alucinar trechos de código** como "prova" de que algo existe sem verificar o arquivo real
- **Trocar hipóteses silenciosamente** sem registrar a tentativa anterior

### O que o agente deve conter

O projeto já inclui na pasta `.agents/` as regras e workflows prontos:

```
.agents/
├── rules/
│   └── docs.md              ← Regra automática: aplica PADRONIZATION.md ao mexer em /docs
└── workflows/
    └── docs-standard.md     ← Workflow invocável via /docs-standard
```

Essas regras cobrem:
- ✅ Estrutura obrigatória de pastas (`active/` → `archive/`)
- ✅ Campos estruturados no cabeçalho (`Status`, `Data`, `Prioridade`, `Tags`)
- ✅ Ciclo de status com validação humana obrigatória
- ✅ Rastreabilidade de tentativas (hipóteses refutadas devem ser registradas)
- ✅ Citação de fontes externas com verificação real
- ✅ Regra anti-alucinação (proibido afirmar sem evidência de código real)

> [!IMPORTANT]
> Se você usar uma IDE/assistente que suporte regras de agente (como `.agents/`, `.cursorrules`, `.github/copilot-instructions.md`, etc.), adapte o conteúdo de `.agents/rules/docs.md` para o formato do seu assistente. Sem isso, o agente **vai** quebrar a padronização eventualmente.

---

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões e feedbacks são bem-vindos! Abra uma [issue](https://github.com/ShogunBP/devboard-roadmap/issues) ou envie um pull request.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

## 👤 Autor

**Guilherme Menezes Rodrigues**

**Contato do Desenvolvedor:**
- Email: guilhermemenezes1337@gmail.com
- GitHub: [ShogunBP](https://github.com/ShogunBP/)
- LinkedIn: [mr-guilherme](https://www.linkedin.com/in/mr-guilherme/)
