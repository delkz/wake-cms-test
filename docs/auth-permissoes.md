# Autenticacao e Permissoes

Este projeto usa um sistema de login baseado em banco de dados, cookie de sessao assinado e verificacao de permissoes no servidor.

O foco e simples:

- autenticar usuario por senha
- criar uma sessao curta e assinada
- bloquear rotas para quem nao esta logado
- checar permissao tanto na UI quanto nas mutacoes do servidor

## Arquivos principais

- [lib/auth/core.ts](lib/auth/core.ts): tipos, permissoes, assinatura da sessao e hash de senha
- [lib/auth/users.ts](lib/auth/users.ts): autenticacao, criacao e atualizacao de usuarios
- [lib/auth/session.ts](lib/auth/session.ts): criacao, leitura e remoção da sessao

Ver tambem:

- [docs/fluxo-validacao-conteudos-hotsite-banners.md](docs/fluxo-validacao-conteudos-hotsite-banners.md): fluxo de validacao e manutencao de conteudos, hotsites e banners
- [lib/auth/authorization.ts](lib/auth/authorization.ts): helpers de permissao e mapa das rotas REST
- [app/(auth)/login/actions.ts](app/(auth)/login/actions.ts): fluxo de login e logout
- [proxy.ts](proxy.ts): bloqueio inicial de rotas publicas e privadas
- [prisma/schema.prisma](prisma/schema.prisma): modelo do usuario e permissões
- [prisma/seed.mjs](prisma/seed.mjs): usuarios iniciais com senha hasheada

## 1. Fluxo de login

O formulario de login chama a action server-side em [app/(auth)/login/actions.ts](app/(auth)/login/actions.ts).

Fluxo:

1. o usuario envia `username` e `password`
2. `authenticateUser()` busca o usuario no banco
3. a senha e validada
4. se estiver correta, `createSession()` grava o cookie
5. o usuario e redirecionado para `/`

O login nao confia na UI. Toda validacao acontece no servidor.

## 2. Como a senha funciona

As senhas nao sao salvas em texto puro. O projeto usa PBKDF2 com salt, em [lib/auth/core.ts](lib/auth/core.ts).

Formato salvo no banco:

`pbkdf2$sha256$iteracoes$salt$hash`

Isso significa:

- `pbkdf2`: algoritmo de derivacao
- `sha256`: hash usado pelo PBKDF2
- `iteracoes`: custo computacional
- `salt`: valor aleatorio por usuario
- `hash`: resultado final da senha

Na autenticacao, [lib/auth/users.ts](lib/auth/users.ts) valida o hash. Se encontrar um registro antigo em texto puro, ele aceita temporariamente e faz upgrade automatico para hash novo no primeiro login.

## 3. Como a sessao funciona

Quando o login e bem-sucedido, [lib/auth/session.ts](lib/auth/session.ts) cria um cookie chamado `wake-cms-session`.

O token de sessao contem:

- `username`
- `displayName`
- `role`
- `permissions`
- `expiresAt`

Esse payload e:

- serializado como JSON
- codificado em base64url
- assinado com HMAC SHA-256

Importante:

- o token nao e criptografado
- ele pode ser lido por quem tiver acesso ao cookie
- ele nao pode ser alterado sem invalidar a assinatura

## 4. O segredo da sessao

A assinatura usa `AUTH_SECRET`, definido no ambiente.

Comportamento atual em [lib/auth/core.ts](lib/auth/core.ts):

- se `AUTH_SECRET` existir, ele e usado
- em producao, a ausencia de `AUTH_SECRET` quebra a aplicacao
- fora de producao, existe um fallback apenas para desenvolvimento

Na pratica, em ambiente real voce deve definir `AUTH_SECRET` no [arquivo de ambiente](.env) com um valor forte e aleatorio.

## 5. Como a sessao e validada

`getSession()` em [lib/auth/session.ts](lib/auth/session.ts) nao depende apenas do cookie.

O fluxo e:

1. ler o cookie
2. validar assinatura e expiracao
3. consultar o usuario no banco de novo
4. rejeitar a sessao se o usuario estiver inativo

Isso e importante porque permite revogar acesso desativando o usuario no banco.

## 6. Protecao do cookie

O cookie e gravado com as seguintes protecoes em [lib/auth/session.ts](lib/auth/session.ts):

- `httpOnly`: JavaScript no navegador nao le o cookie
- `sameSite: "lax"`: ajuda a reduzir risco de CSRF
- `secure` em producao: envia o cookie apenas via HTTPS
- `path: "/"`: vale para o site inteiro

## 7. Bloqueio de rotas

O [proxy.ts](proxy.ts) age como primeira barreira.

Ele faz duas coisas:

1. redireciona para `/login` quando nao existe sessao e a rota nao e publica
2. redireciona para `/` quando o usuario ja esta logado e tenta acessar o login

Rotas publicas hoje:

- `/login`

Rotas de assets e Next internals sao liberadas automaticamente.

## 8. Modelo de permissoes

As permissoes ficam centralizadas em [lib/auth/core.ts](lib/auth/core.ts) como constantes.

Exemplos atuais:

- `GLOBAL`
- `USER_MANAGE`
- `CONTENT_CREATE`
- `CONTENT_EDIT`
- `CONTENT_PUBLISH`
- `HOTSITE_CREATE`
- `HOTSITE_UPDATE`
- `HOTSITE_DELETE`
- `BANNER_CREATE`
- `BANNER_UPDATE`
- `BANNER_DELETE`

O usuario autenticado carrega uma lista de permissões, e `hasPermission()` verifica se ele tem a permissao pedida ou a permissao global.

## 9. Helpers de autorizacao

[lib/auth/authorization.ts](lib/auth/authorization.ts) oferece helpers para a UI e para regras de negocio.

Exemplos:

- `canCreateContent(session)`
- `canEditContent(session)`
- `canPublishContent(session)`
- `canManageUsers(session)`
- `canCreateBanner(session)`
- `canCreateHotsite(session)`

Esses helpers servem para esconder ou mostrar botoes e links conforme o perfil do usuario.

## 10. Protecao de API

Nao basta esconder botao na tela. O servidor tambem precisa validar.

### REST

As mutacoes REST passam por `inferPermissionFromRestRequest(method, path)` em [lib/auth/authorization.ts](lib/auth/authorization.ts).

Essa funcao decide qual permissao e necessaria para uma rota e permite que a camada de API bloqueie a acao se o usuario nao tiver acesso.

### GraphQL

O endpoint [app/api/graphql/route.ts](app/api/graphql/route.ts) exige sessao valida para operar.

Se o projeto crescer, o proximo passo natural e mapear operacoes GraphQL para permissões especificas.

## 11. Como criar ou alterar usuarios

Os usuarios vivem no banco, descrito em [prisma/schema.prisma](prisma/schema.prisma).

Os pontos principais sao:

- `User.password` guarda o hash da senha
- `User.isActive` controla se o usuario pode entrar
- `UserPermission` guarda as permissoes do usuario

O seed inicial em [prisma/seed.mjs](prisma/seed.mjs) ja grava senhas hashadas.

## 12. UI e permissao

A interface usa a sessao para decidir o que mostrar.

Exemplo:

- o header mostra menu e atalhos com base no usuario logado
- telas administrativas podem esconder botoes se o usuario nao tiver a permissao

Isso melhora a experiencia, mas nao substitui validacao no servidor.

## 13. O que e seguro e o que ainda e limitado

Hoje o sistema ja tem o basico correto para um app interno pequeno:

- senha com hash e salt
- cookie de sessao assinado
- cookie `httpOnly` e `secure` em producao
- expiracao da sessao
- revalidacao do usuario no banco
- segredo obrigatorio em producao

Limites atuais:

- o token de sessao nao e criptografado, apenas assinado
- o fallback de `AUTH_SECRET` ainda existe fora de producao
- nao ha rate limit de login ainda

## 14. Como adicionar uma nova permissao

Se precisar criar um novo acesso, siga esta ordem:

1. adicionar a permissao em [lib/auth/core.ts](lib/auth/core.ts)
2. conceder a permissao ao usuario no banco
3. criar um helper em [lib/auth/authorization.ts](lib/auth/authorization.ts) se for usado na UI
4. proteger a pagina com `requirePermission(...)` quando necessario
5. mapear a permissao na API REST ou GraphQL se a acao for sensivel

Se quiser, a UI pode esconder o botao, mas a validacao real deve ficar no servidor.
