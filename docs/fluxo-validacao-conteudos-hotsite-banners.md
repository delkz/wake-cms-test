# Fluxo de validacao de conteudos, hotsites e banners

Este documento explica como o sistema valida alteracoes de conteudo e hotsite, como banners entram nesse fluxo e o que precisa ser ajustado quando houver manutencao.

## Visao geral

O sistema usa um workflow unico para revisar alteracoes antes de publicar.

Hoje existem tres niveis praticos:

- conteudos: entram em revisao ou podem ser publicados direto, dependendo da permissao
- hotsites: seguem o mesmo padrao, com configuracoes, conteudos e banners dentro do mesmo payload
- banners: nao tem workflow proprio; fazem parte do hotsite e seguem o mesmo ciclo de revisao/publicacao do hotsite

Arquivos principais:

- [app/cms/content/actions.ts](app/cms/content/actions.ts)
- [app/cms/hotsite/actions.ts](app/cms/hotsite/actions.ts)
- [lib/workflow/content.ts](lib/workflow/content.ts)
- [lib/workflow/hotsite.ts](lib/workflow/hotsite.ts)
- [lib/workflow/approvals.ts](lib/workflow/approvals.ts)
- [app/cms/approvals/page.tsx](app/cms/approvals/page.tsx)
- [app/cms/hotsite/[hotsiteId]/page.tsx](app/cms/hotsite/%5BhotsiteId%5D/page.tsx)
- [components/content-editor-form.tsx](components/content-editor-form.tsx)
- [components/hotsite-settings-form.tsx](components/hotsite-settings-form.tsx)
- [components/hotsite-banner-list.tsx](components/hotsite-banner-list.tsx)

## 1. Como o workflow e modelado

As alteracoes ficam registradas na tabela `WorkflowItem`.

Cada item guarda:

- tipo da entidade (`CONTENT` ou `HOTSITE`)
- acao (`CREATE` ou `UPDATE`)
- status (`PENDING_REVIEW`, `REJECTED`, `PUBLISHED`)
- identificador da entidade alvo no sistema externo
- payload completo em JSON
- usuario solicitante e usuario publicador

O historico de eventos fica em `WorkflowItemHistory` e registra cada mudanca importante do fluxo.

## 2. Fluxo de conteudos

Quando o usuario salva um conteudo, a UI chama `submitContentForReview()` em [app/cms/content/actions.ts](app/cms/content/actions.ts).

Passos principais:

1. o sistema identifica se e criacao ou edicao
2. valida permissao `CONTENT_CREATE` ou `CONTENT_EDIT`
3. se o usuario pedir publicacao imediata, valida `CONTENT_PUBLISH`
4. grava o conteudo no workflow
5. se for publicacao direta, envia para a Wake API na mesma operacao
6. registra o evento no historico

Comportamentos importantes:

- conteudo novo vira um workflow de criacao
- conteudo existente vira workflow de atualizacao
- se houver um workflow pendente ou rejeitado para o mesmo item, ele pode ser reaproveitado e atualizado
- a pagina de aprovacoes mostra os itens pendentes e as solicitacoes do proprio usuario

### Validacoes de conteudo

As validacoes hoje sao divididas assim:

- UI: campos obrigatorios e estado do formulario em [components/content-editor-form.tsx](components/content-editor-form.tsx)
- permissao: `requirePermission(...)` em [app/cms/content/actions.ts](app/cms/content/actions.ts)
- negocio: regras de publicacao e reutilizacao de workflow em [lib/workflow/content.ts](lib/workflow/content.ts)
- publicacao: chamada para a Wake API via `cmsApi.createContent()` ou `cmsApi.updateContent()`

## 3. Fluxo de hotsite

O formulario de hotsite chama `submitHotsiteForReview()` em [app/cms/hotsite/actions.ts](app/cms/hotsite/actions.ts).

Passos principais:

1. a pagina carrega o hotsite atual em [app/cms/hotsite/[hotsiteId]/page.tsx](app/cms/hotsite/%5BhotsiteId%5D/page.tsx)
2. o formulario valida campos basicos, como nome do hotsite
3. a action valida permissao de atualizacao e, se houver publicacao direta, valida permissao de publicar
4. o workflow e salvo ou atualizado em [lib/workflow/hotsite.ts](lib/workflow/hotsite.ts)
5. se a publicacao for direta, a Wake API recebe a atualizacao na mesma operacao
6. um evento e gravado no historico

Comportamentos importantes:

- hotsite novo vira workflow de criacao
- hotsite existente vira workflow de atualizacao
- se o usuario tiver permissao de publicar, pode existir publicacao direta sem passar pela fila
- banners e conteudos pertencem ao payload do hotsite, nao a um workflow separado

### Validacoes de hotsite

As validacoes hoje sao divididas assim:

- UI: nome e url no formulario em [components/hotsite-settings-form.tsx](components/hotsite-settings-form.tsx)
- permissao: `HOTSITE_CREATE`, `HOTSITE_UPDATE`, `HOTSITE_DELETE` e `CONTENT_PUBLISH` em [app/cms/hotsite/[hotsiteId]/page.tsx](app/cms/hotsite/%5BhotsiteId%5D/page.tsx)
- negocio: criacao ou atualizacao de workflow em [lib/workflow/hotsite.ts](lib/workflow/hotsite.ts)
- publicacao: chamada `cmsApi.updateHotsite()` na Wake API

## 4. Como banners entram no fluxo

Banners nao possuem um workflow proprio hoje.

Eles sao tratados como parte do payload do hotsite e aparecem na pagina do hotsite em [components/hotsite-banner-list.tsx](components/hotsite-banner-list.tsx).

O que isso significa na pratica:

- alterar banners faz parte da manutencao do hotsite
- a publicacao de banners depende da publicacao do hotsite
- a validacao final fica no mesmo workflow do hotsite

Estado atual da UI:

- a lista de banners permite filtrar e visualizar o preview
- os botoes de criar, atualizar e deletar estao desabilitados
- portanto, a manutencao de banner ainda nao esta completa como CRUD isolado

Se futuramente banners passarem a ter CRUD proprio, sera necessario criar:

- actions server-side especificas
- permissao de negocio especifica para banner
- persistencia separada do workflow do hotsite

## 5. Tela de aprovacoes

A pagina [app/cms/approvals/page.tsx](app/cms/approvals/page.tsx) e o painel operacional do fluxo.

Ela mostra tres blocos:

- pendentes para publicar
- minhas solicitacoes
- ultimas alteracoes do historico

Somente usuarios com permissao de publicar veem a fila de pendentes.

Essa pagina usa:

- `listApprovalItemsForReview()` para a fila de aprovacoes
- `listApprovalItemsForUser()` para o historico do proprio usuario
- `listRecentWorkflowHistory()` para o log geral

## 6. Publicar e reprovar

Acoes de publicacao e reprovacao passam por [lib/workflow/approvals.ts](lib/workflow/approvals.ts).

O fluxo e simples:

1. localizar o workflow
2. confirmar se a entidade e suportada
3. validar se o status ainda e `PENDING_REVIEW`
4. publicar ou rejeitar a alteracao
5. atualizar o historico

No caso de publicacao:

- conteudo chama `publishWorkflowItem()`
- hotsite chama `publishHotsiteWorkflowItem()`

No caso de rejeicao:

- conteudo chama `rejectWorkflowItem()`
- hotsite chama `rejectHotsiteWorkflowItem()`

## 7. Como dar manutencao no fluxo

Quando mudar um campo, regra ou entidade, siga esta ordem:

1. atualizar os tipos de payload em [app/lib/cms/types.ts](app/lib/cms/types.ts)
2. ajustar o formulario da tela correspondente
3. atualizar a action server-side de submissao
4. revisar a logica em [lib/workflow/content.ts](lib/workflow/content.ts) ou [lib/workflow/hotsite.ts](lib/workflow/hotsite.ts)
5. revisar [lib/workflow/approvals.ts](lib/workflow/approvals.ts) se a fila ou o preview mudarem
6. revisar [app/cms/approvals/page.tsx](app/cms/approvals/page.tsx) se a interface da fila mudar
7. validar a permissao na action e nao apenas na UI

### Se mudar conteudo

- revise os campos do editor em [components/content-editor-form.tsx](components/content-editor-form.tsx)
- revise os mapeamentos do payload em [lib/workflow/content.ts](lib/workflow/content.ts)
- revise o preview e a lista de aprovacoes

### Se mudar hotsite

- revise o formulario em [components/hotsite-settings-form.tsx](components/hotsite-settings-form.tsx)
- revise a pagina do hotsite em [app/cms/hotsite/[hotsiteId]/page.tsx](app/cms/hotsite/%5BhotsiteId%5D/page.tsx)
- revise o serializer e o publisher em [lib/workflow/hotsite.ts](lib/workflow/hotsite.ts)

### Se mudar banner

- primeiro confirme se o banner continua dependente do hotsite ou se vai ganhar CRUD proprio
- se continuar acoplado ao hotsite, ajuste apenas o payload do hotsite e a UI da lista
- se virar CRUD proprio, crie um fluxo novo e nao reutilize o workflow atual sem revisar as permissoes

## 8. Checklist de manutencao

Use este checklist antes de subir uma mudanca no workflow:

- o formulario valida os campos obrigatorios
- a action server-side valida permissao
- o workflow grava ou atualiza o item correto
- o status fica coerente com a acao do usuario
- a aprovacao ou rejeicao atualiza o historico
- o preview continua abrindo o payload correto
- a pagina de aprovacoes continua listando o item certo
- a Wake API recebe o payload no formato esperado

## 9. Limites atuais

Algumas partes ainda sao limitadas pelo estado do projeto:

- banners nao tem CRUD completo
- a publicacao depende da Wake API externa
- o workflow usa JSON em payloads, entao mudancas de schema exigem cuidado com compatibilidade

## 10. Regra pratica para evolucao

Quando quiser mudar o comportamento, pense neste caminho:

1. a UI coleta os dados
2. a action valida permissao e consistencia
3. o workflow registra a solicitacao
4. a pagina de aprovacoes permite revisar
5. a publicacao efetiva escreve na Wake API
6. o historico registra o que aconteceu

Se a mudanca afetar um desses passos, atualize a documentacao e teste o fluxo inteiro de ponta a ponta.