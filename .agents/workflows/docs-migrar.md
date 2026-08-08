---
description: Migra um projeto sem estrutura /docs padronizada (ou com uma estrutura antiga/diferente) para o padrão descrito em docs/PADRONIZATION.md, compatível com o roadmap visual.
---

# /docs-migrar

Antes de continuar, leia `docs/PADRONIZATION.md` deste projeto (ou, se ainda não
existir, use como referência a versão canônica do padrão: pastas `active/`/`archive`,
categorias `bugs/features/enhancements/refactoring`, prefixo `[status]` no nome da
pasta, campos estruturados `Status/Data/Prioridade/Tags/Resumo`, seções `##` no corpo,
progresso calculado por checkboxes). Esse é o formato alvo desta migração.

Esta migração é uma operação pontual: transformar o que já existe (documentação solta,
estrutura antiga, ou nada documentado) na estrutura `/docs` padronizada. Depois de
migrado, as regras de manutenção contínua de `/docs` (ver `docs-padronizacao`, se
disponível neste ambiente) passam a valer normalmente.

## Passo 1 — Inventário do estado atual

Antes de mover ou criar qualquer arquivo, escaneie o projeto e produza um inventário
do que existe hoje que possa virar uma entrada de `/docs`. Fontes prováveis, em ordem
de checagem:

1. Uma pasta `/docs` já existente, mas em formato diferente (nomes de status
   diferentes, sem prefixo de status na pasta, sem campos estruturados, categorias
   diferentes das quatro válidas, etc.).
2. Issues do GitHub/GitLab (se houver acesso via ferramenta ou arquivo exportado).
3. Um `CHANGELOG.md`, `TODO.md`, `ROADMAP.md` ou similar solto na raiz do projeto.
4. Comentários `TODO`/`FIXME`/`HACK` no código-fonte (só considerar se o usuário pedir
   explicitamente esse nível de varredura — é potencialmente muito ruidoso para incluir
   por padrão).
5. Qualquer outra fonte de planejamento que o usuário apontar diretamente.

Não presuma que uma fonte existe sem checar. Se nenhuma das fontes acima existir, isso
é um resultado válido do inventário (projeto sem histórico de planejamento
documentado) — não é motivo para parar, apenas significa que a migração começará com
`/docs` vazio, pronto para uso a partir de agora.

## Passo 2 — Mapeamento automático, com pausa só em ambiguidade real

Para cada item encontrado no inventário, decida automaticamente:

- **Categoria** (`bugs/features/enhancements/refactoring`): inferir pelo conteúdo/
  título do item. Só parar e perguntar ao usuário se o item genuinamente não se encaixa
  com confiança razoável em nenhuma categoria (não perguntar por item que claramente é
  "bug" só porque a palavra não aparece literalmente — julgar pelo conteúdo).
- **Status**: itens fechados/mesclados/concluídos mapeiam para `[done]` (ou
  `[cancelled]`, se abandonados/rejeitados) e vão direto para `archive/`. Itens abertos
  sem indicação de progresso mapeiam para `[draft]`, em `active/`. Não invente estados
  intermediários (`[in-progress]`, `[approved]`, etc.) sem evidência real de que aquele
  item já passou por review ou está sendo executado — na dúvida entre dois status
  adjacentes, prefira o mais conservador (o que exige menos ter acontecido).
- **Prioridade**: se a fonte original não tiver informação de prioridade, usar `média`
  como padrão neutro, e sinalizar isso no relatório final (não decidir silenciosamente
  que algo é `alta` sem base).
- **Tags**: escolher apenas entre a lista predefinida do PADRONIZATION.md. Se nada da
  lista encaixar bem, deixar `Tags` com a tag mais próxima disponível e sinalizar a
  lacuna no relatório final, em vez de inventar uma tag nova.
- **Resumo**: gerar uma linha curta e objetiva a partir do conteúdo original, seguindo
  a mesma regra de tamanho do PADRONIZATION.md (cabe num card pequeno, sem markdown,
  sem quebra de linha).

Pausar e perguntar ao usuário apenas quando:
- A categoria realmente não é inferível com confiança.
- O conteúdo original é curto/vago demais para gerar um Resumo ou corpo minimamente
  coerente sem inventar informação que não estava lá.
- Houver risco real de perda de informação importante (ex: um item que parece crítico
  mas está incompleto na fonte original).

Para tudo o mais, seguir o mapeamento automático e registrar a decisão no relatório
final do Passo 4 — não parar a cada item individual pedindo confirmação, isso
inviabiliza migrações com muitos itens.

## Passo 3 — Geração da estrutura

Para cada item mapeado:

1. Criar a pasta em `docs/{active|archive}/{categoria}/[status]-nome-em-kebab-case/`.
2. Criar o `README.md` dentro dela, usando o template exato da categoria (do
   PADRONIZATION.md), preenchendo cabeçalho (`Status`, `Data`, `Prioridade`, `Tags`,
   `Resumo`) e as seções do corpo com o conteúdo migrado, reescrito para caber na
   estrutura de seções do template, não apenas colado bruto.
3. Se a fonte original tiver uma data associada (data de criação da issue, commit,
   etc.), usar essa data no campo `Data`. Se não houver nenhuma data disponível, usar a
   data de hoje e sinalizar isso no relatório final.
4. Nunca criar uma pasta `[done]` ou `[cancelled]` diretamente dentro de `active/` —
   itens finalizados nascem já em `archive/{categoria}/`, seguindo a mesma regra de
   `docs-padronizacao`.

## Passo 4 — Relatório final (obrigatório)

Ao terminar, produzir um relatório claro para o usuário revisar, cobrindo:

- Quantos itens foram migrados, agrupados por categoria e por status.
- Toda decisão de mapeamento que usou um valor padrão/conservador por falta de
  informação na fonte original (prioridade assumida como `média`, tag aproximada em
  vez de exata, data de hoje em vez de data real, status conservador escolhido entre
  duas opções ambíguas).
- Toda pergunta que foi feita ao usuário durante o Passo 2 e a resposta usada.
- Qualquer fonte de inventário que existia mas foi ignorada, e por quê (ex: comentários
  `TODO` no código, se não escaneados por padrão).

Este relatório existe para que o usuário possa revisar rapidamente e corrigir qualquer
mapeamento automático que não tenha ficado bom, sem precisar reler cada README criado
do zero.

## Regras que seguem valendo depois da migração

A partir do momento em que `/docs` estiver populado, as regras normais de manutenção
(ver skill/agente `docs-padronizacao`, se disponível neste ambiente) passam a valer:
nunca avançar status sem confirmação humana, nunca mover `[done]`/`[cancelled]` para
fora de `archive/`, nunca inventar tags fora da lista predefinida, e assim por diante.
Esta migração é a exceção pontual que estabelece o estado inicial — não um precedente
para pular essas regras depois.
