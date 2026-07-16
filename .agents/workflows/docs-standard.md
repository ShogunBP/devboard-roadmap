---
description: Ativa as regras de padronização de /docs, incluindo campos estruturados e rastreabilidade de tentativas, antes de criar, editar ou mover um README.
---

# /docs-padronizacao

Antes de continuar, aplique rigorosamente as regras de `docs/PADRONIZATION.md` para toda criação, edição ou movimentação de README dentro de /docs.

## Estrutura obrigatória
- Cada tema vive em `/docs/active/{categoria}/[status]-nome-em-kebab-case/README.md`
  enquanto ativo, e em `/docs/archive/{categoria}/[status]-nome-em-kebab-case/README.md`
  depois de finalizado.
- Categorias válidas: `bugs/`, `features/`, `enhancements/`, `refactoring/`
- Use o template exato da categoria (definido em PADRONIZATION.md) — não invente
  seções novas, não remova seções do template.

## Campos estruturados obrigatórios no cabeçalho
- Todo README precisa ter, logo abaixo do título: `**Status:**`, `**Data:**`,
  `**Prioridade:**` (`alta` | `média` | `baixa`) e `**Tags:**` (uma ou mais,
  separadas por vírgula, escolhidas SOMENTE da lista predefinida em
  PADRONIZATION.md — não invente tags novas).
- `**Status:**` dentro do arquivo é só espelho informativo. A fonte de
  verdade é sempre o prefixo `[status]` no nome da pasta. Ao mudar o status
  da pasta, atualize também essa linha no arquivo para não ficarem
  divergentes sem necessidade — divergência não quebra o sistema, mas é
  sinal de descuido.
- Progresso (%) não é campo manual — é calculado por ferramentas externas
  contando checkboxes marcados sobre o total, em Critérios de Conclusão +
  Validação. Não adicione um campo de progresso escrito à mão.

## Categorização — não decida sozinho
- Se não estiver 100% claro se algo é bug, enhancement, feature ou refactoring,
  PARE e pergunte ao usuário antes de criar a pasta. Nunca crie com categoria
  "provisória" pra corrigir depois.
- Nunca troque um item do escopo original por outro sem confirmação explícita
  do usuário. Se não foi pedido, não documente.

## Ciclo de status
[draft] → [ready-for-review] → [changes-requested] → [approved] → [in-progress] → [done ou cancelled]

- Ao mudar de status, renomeie a pasta atualizando SÓ o prefixo `[status]`.
- Nunca avance um status sem o usuário pedir explicitamente ou confirmar que
  está pronto.
- `[approved]` só acontece após review humano real — nunca se autoaprove.
- Ao chegar em `[done]` ou `[cancelled]`, MOVA a pasta inteira de
  `active/{categoria}/` para `archive/{categoria}/`, além de renomear.
- Toda entrada nova nasce em `active/{categoria}/`, nunca direto em `archive/`.
- **Revogar um status já avançado** (ex: reverter `[approved]` pra
  `[ready-for-review]`, ou desmarcar uma "Decisão: Aprovado" já registrada)
  exige o mesmo cuidado que avançar: sinalize explicitamente ao usuário que
  isso está sendo feito e por quê, nunca troque silenciosamente.

## Rastreabilidade de tentativas (obrigatório em revisões de hipótese)
- Se uma hipótese de causa ou plano de correção já tentado for substituído
  por uma nova análise, o README PRECISA registrar a tentativa anterior e
  seu resultado real antes de apresentar a nova hipótese — nunca troque de
  teoria silenciosamente. Formato mínimo: "Tentativa anterior (refutada):
  [o que foi feito] — testado, resultado: [o que aconteceu de fato]."
- Não use palavras como "Confirmada" ou "Definitiva" no título de uma
  hipótese a menos que exista evidência direta (código lido, teste
  isolado, ou fonte externa citada) provando o mecanismo. Uma explicação
  bem argumentada sem essa evidência ainda é hipótese, não confirmação.

## Citação de fontes externas (documentação de bibliotecas/frameworks)
- Qualquer afirmação sobre comportamento de uma biblioteca externa (ex:
  "o Framer Motion faz X" ou "a partir da versão Y, existe suporte nativo
  para Z") PRECISA vir de uma consulta real à documentação oficial no
  momento da escrita — nunca de memória/treinamento sem verificação.
- Toda citação de comportamento de biblioteca deve incluir a fonte (link,
  nome do doc, ou nota de que foi consultado via ferramenta como
  Context7/web search). Frases entre aspas atribuídas à documentação sem
  fonte rastreável são tratadas como não confirmadas.
- Se o exemplo de código citado como prova de um comportamento na verdade
  demonstra uma técnica diferente da alegada (ex: um hack clássico
  decorado, em vez do recurso "novo" alegado), isso deve ser reportado
  como tal — não aceito como confirmação por semelhança superficial.

## Regra anti-alucinação
- NUNCA afirme "isso já existe em X" ou "já foi confirmado" sem colar o trecho
  de código real como prova.
- NUNCA corte trechos de código com "// resto do componente" quando o usuário
  pedir o código completo ou a lacuna for relevante — se cortar, sinalize
  explicitamente o que foi omitido.
- Coincidência de nome de arquivo/variável NÃO é prova de localização —
  confirme abrindo e lendo o arquivo real.
- Descrições de "o que existe hoje" só podem vir de evidência real (código
  lido, print, confirmação do usuário) — nunca de suposição.

## Checklist final antes de fechar o README
1. Toda alegação factual tem trecho de código/print real como prova?
2. A categoria foi confirmada pelo usuário ou é suposição minha?
3. O nome da pasta segue exatamente `[status]-nome-kebab-case`?
4. A pasta está no lugar certo — `active/` se em andamento, `archive/` se
   `[done]` ou `[cancelled]`?
5. Algum trecho de código foi cortado? Se sim, está sinalizado explicitamente?
6. Tem `Prioridade` e `Tags` (da lista predefinida) preenchidos no cabeçalho?
7. Se essa revisão substitui uma hipótese/tentativa anterior, isso está
   registrado como refutada, com o resultado real do teste?
8. Alguma alegação sobre comportamento de biblioteca externa? Se sim, tem
   fonte real citada, ou é preciso consultar antes de afirmar?