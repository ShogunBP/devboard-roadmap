# 📁 /docs — Guia de Planejamento e Documentação

Este diretório centraliza o planejamento de tudo que será implementado, corrigido ou melhorado no projeto antes da execução. Cada entrada é um documento de raciocínio — escrito antes do código.

---

## Estrutura de Pastas

A raiz é dividida em duas grandes áreas: **`active/`** (tudo que está em andamento — draft, review, approved, in-progress) e **`archive/`** (tudo que já foi finalizado ou descartado — done, cancelled). Dentro de cada uma, a organização por categoria (`bugs/`, `features/`, `enhancements/`, `refactoring/`) se repete.

```
docs/
├── README.md
├── active/
│   ├── bugs/
│   │   └── [ready-for-review]-login-nao-redireciona/
│   │       └── README.md
│   ├── features/
│   │   └── [draft]-especificacao-design-mobile-app/
│   │       └── README.md
│   ├── enhancements/
│   │   └── [in-progress]-melhorar-performance-listagem/
│   │       └── README.md
│   └── refactoring/
│       └── [in-progress]-refatoracao-dropdown-modo-manual/
│           └── README.md
└── archive/
    ├── bugs/
    │   └── [done]-correcao-bugs-dropdown-modo-manual/
    │       └── README.md
    ├── features/
    ├── enhancements/
    │   └── [done]-correcoes-ui-mobile-e-dropdown/
    │       └── README.md
    └── refactoring/
```

Cada tema vive em sua própria subpasta. O `README.md` dentro dela é o documento principal — planejamento, review e conclusão. Outros arquivos relevantes (prints, logs, referências) podem ser adicionados na mesma pasta.

> Categorias vazias em `archive/` (ex: nenhuma feature finalizada ainda) não precisam existir fisicamente — crie a subpasta só quando o primeiro item chegar lá.

---

## Categorias

### 🐛 `bugs/`
Problemas encontrados em produção ou desenvolvimento que precisam ser investigados e corrigidos.

### ✨ `features/`
Funcionalidades novas que ainda não existem no sistema — do planejamento até a definição de como serão implementadas.

### 🔧 `enhancements/`
Melhorias em algo que já existe e funciona, mas pode ser melhor: UX, performance, clareza de código, etc.

### ♻️ `refactoring/`
Débito técnico, reestruturação de código, mudança de arquitetura ou atualização de dependências críticas.

---

## Nomenclatura das Pastas

O nome da subpasta segue o padrão `[status]-titulo-em-kebab-case`:

```
[draft]-sistema-de-notificacoes-por-email/
[ready-for-review]-login-nao-redireciona/
[approved]-melhorar-performance-listagem/
[in-progress]-migrar-fetch-para-axios/
[done]-correcoes-ui-mobile-e-dropdown/
[cancelled]-remover-suporte-a-ie11/
```

> Ao mudar de status, renomeie a pasta atualizando apenas o prefixo `[status]`. **Exceção:** ao chegar em `[done]` ou `[cancelled]`, além de renomear, **mova a pasta inteira de `active/<categoria>/` para `archive/<categoria>/`.**

---

## Status Possíveis

| Status | Descrição | Fica em |
|---|---|---|
| `[draft]` | Documento criado, ainda sendo escrito | `active/` |
| `[ready-for-review]` | Pronto para alguém revisar | `active/` |
| `[changes-requested]` | Revisor pediu ajustes | `active/` |
| `[approved]` | Revisão aprovada, pode executar | `active/` |
| `[in-progress]` | Execução em andamento | `active/` |
| `[done]` | Testado e validado por quem executou | `archive/` |
| `[cancelled]` | Descartado com justificativa | `archive/` |

---

## Campos Estruturados (para leitura por ferramentas externas)

Além do prefixo `[status]` na pasta, cada `README.md` tem um cabeçalho com campos de formato fixo, pensados para serem lidos por ferramentas externas (ex: o roadmap visual em `/roadmap`) sem ambiguidade:

```markdown
**Status:** `draft`
**Data:** YYYY-MM-DD
**Prioridade:** `alta`
**Tags:** `frontend`, `performance`
```

- **Status:** este campo é apenas informativo/espelho dentro do documento. A fonte de verdade para qualquer ferramenta ou pessoa é o prefixo `[status]` no nome da pasta — se os dois divergirem, o nome da pasta manda.
- **Prioridade:** valor único, uma das três opções: `alta`, `média`, `baixa`.
- **Tags:** uma ou mais tags, separadas por vírgula, escolhidas da lista predefinida abaixo. Um item pode ter múltiplas tags.

### Lista de Tags Predefinidas

| Tag | Quando usar |
|---|---|
| `frontend` | Mudanças em UI, componentes visuais, client-side |
| `backend` | Lógica de servidor, API, processamento |
| `banco` | Banco de dados, queries, schema, migrations |
| `infra` | Deploy, CI/CD, configuração de ambiente, build |
| `ui-ux` | Estilo visual, experiência do usuário, acessibilidade |
| `performance` | Otimização, lentidão, uso de recursos |
| `animação` | Transições, motion, efeitos visuais |
| `api` | Integrações externas, endpoints, contratos de dados |
| `segurança` | Vulnerabilidades, autenticação, permissões |
| `dependências` | Atualização de libs, troca de pacote, upgrade de versão |
| `dx` | Developer experience — ferramentas internas, scripts, produtividade do dev |
| `docs` | Mudanças na própria documentação/padronização |

> Não crie tags novas fora dessa lista. Se nenhuma tag existente encaixar bem, isso é sinal para discutir se a lista precisa crescer — não para inventar uma tag ad-hoc.

### Progresso (%)

Não é um campo escrito manualmente. É calculado por ferramentas externas contando checkboxes marcados (`- [x]`) sobre o total de checkboxes (`- [ ]` + `- [x]`) somando as seções **Critérios de Conclusão** (quando existir) e **Validação** do documento.

---

## Fluxo de Uso

```
Crio a pasta active/<categoria>/[draft]-nome-do-tema/
        │
        ▼
Preencho o README.md
        │
        ▼
Renomeio para [ready-for-review]-nome-do-tema/
        │
        ▼
    Review
   ┌──┴──┐
   │     │
[approved]  [changes-requested]
   │     │
   │     ▼
   │  Ajusto e volto para [ready-for-review]
   │     │
   └──┬──┘
      │
      ▼
Renomeio para [in-progress]-nome-do-tema/
      │
      ▼
Testo manualmente
      │
      ▼
Renomeio para [done]-nome-do-tema/
      │
      ▼
Movo a pasta de active/<categoria>/ para archive/<categoria>/
```

> **Princípio:** Nenhum código começa sem `[approved]`. Nenhuma pasta fecha sem teste. Nenhuma pasta `[done]` ou `[cancelled]` permanece em `active/`.

---

## Template por Categoria

### 🐛 Bug — `active/bugs/[status]-nome-do-bug/README.md`

```markdown
# 🐛 [Título do Bug]

**Status:** `draft`
**Data:** YYYY-MM-DD
**Prioridade:** `alta` | `média` | `baixa`
**Tags:** `tag1`, `tag2`

---

## Descrição
O que está acontecendo de errado e onde.

## Como Reproduzir
1. Passo 1
2. Passo 2
3. ...

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que está acontecendo de fato.

## Contexto Técnico
- Camada afetada: (frontend / backend / banco / infra)
- Arquivo(s) suspeito(s):
- Logs de erro (se houver):

## Hipótese de Causa
Qual pode ser a raiz do problema.

## Plano de Correção
Como pretendo resolver.

---

## Review

### Feedback
> _(preencher durante o review)_

### Decisão
- [ ] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [ ] Bug não reproduz mais
- [ ] Nenhuma regressão identificada
- [ ] **Pasta renomeada para `[done]-nome-do-bug` e movida para `archive/bugs/`**
```

---

### ✨ Feature — `active/features/[status]-nome-da-feature/README.md`

```markdown
# ✨ [Título da Feature]

**Status:** `draft`
**Data:** YYYY-MM-DD
**Prioridade:** `alta` | `média` | `baixa`
**Tags:** `tag1`, `tag2`

---

## Objetivo
Por que essa feature existe e qual problema ela resolve.

## Descrição Funcional
Como a feature se comporta do ponto de vista do usuário.

## Escopo

### Inclui
- Item 1
- Item 2

### Não inclui (por ora)
- Item fora do escopo

## Requisitos Técnicos
- Camadas envolvidas: (frontend / backend / banco)
- Dependências ou integrações necessárias:
- Impactos em outras partes do sistema:

## Plano de Implementação
1. Etapa 1
2. Etapa 2
3. ...

## Critérios de Conclusão
- [ ] Critério 1
- [ ] Critério 2

---

## Review

### Feedback
> _(preencher durante o review)_

### Decisão
- [ ] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [ ] Todos os critérios de conclusão atendidos
- [ ] Testado manualmente do ponto de vista do usuário
- [ ] Nenhuma regressão identificada
- [ ] **Pasta renomeada para `[done]-nome-da-feature` e movida para `archive/features/`**
```

---

### 🔧 Enhancement — `active/enhancements/[status]-nome-da-melhoria/README.md`

```markdown
# 🔧 [Título da Melhoria]

**Status:** `draft`
**Data:** YYYY-MM-DD
**Prioridade:** `alta` | `média` | `baixa`
**Tags:** `tag1`, `tag2`

---

## Contexto
O que existe hoje e por que precisa melhorar.

## Problema Atual
O que está subótimo: lentidão, má UX, código confuso, etc.

## Melhoria Proposta
O que será feito e como ficará depois.

## Impacto Esperado
- Qual a melhoria mensurável ou percebida?
- Afeta usuário final, desenvolvedor ou ambos?

## Plano de Implementação
1. Etapa 1
2. Etapa 2

## Critérios de Conclusão
- [ ] Critério 1
- [ ] Critério 2

---

## Review

### Feedback
> _(preencher durante o review)_

### Decisão
- [ ] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [ ] Melhoria perceptível e funcional
- [ ] Nenhuma regressão identificada
- [ ] **Pasta renomeada para `[done]-nome-da-melhoria` e movida para `archive/enhancements/`**
```

---

### ♻️ Refactoring — `active/refactoring/[status]-nome-da-refatoracao/README.md`

```markdown
# ♻️ [Título da Refatoração]

**Status:** `draft`
**Data:** YYYY-MM-DD
**Prioridade:** `alta` | `média` | `baixa`
**Tags:** `tag1`, `tag2`

---

## Motivação
Por que esse refactoring é necessário agora.

## Situação Atual
Descreva o estado atual do código/arquitetura com o problema.

## Situação Desejada
Como ficará depois da refatoração.

## Riscos
O que pode quebrar ou ser afetado durante a mudança.

## Estratégia de Execução
Como fazer de forma segura (incremental, por módulo, etc.).

1. Etapa 1
2. Etapa 2

## Critérios de Conclusão
- [ ] Critério 1
- [ ] Critério 2

---

## Review

### Feedback
> _(preencher durante o review)_

### Decisão
- [ ] Aprovado
- [ ] Alterações solicitadas

---

## Validação

> _(preencher após execução e teste)_

- [ ] Comportamento idêntico ao anterior
- [ ] Nenhuma regressão identificada
- [ ] Dívida técnica removida
- [ ] **Pasta renomeada para `[done]-nome-da-refatoracao` e movida para `archive/refactoring/`**
```
