# Autenticacao e Permissoes

Este projeto usa um sistema simples de autenticacao com:

- usuarios gravados em JSON
- sessao em cookie HTTP-only
- verificacao de permissao na UI e no servidor

Arquivos principais:

- `data/users.json`: usuarios e permissoes
- `lib/auth/core.ts`: tipos, permissoes e token de sessao
- `lib/auth/users.ts`: leitura e autenticacao dos usuarios
- `lib/auth/session.ts`: criacao/leitura/remocao da sessao
- `lib/auth/authorization.ts`: regras auxiliares de autorizacao
- `proxy.ts`: bloqueio de acesso para quem nao esta logado
- `app/api/rest/route.ts`: protecao das mutacoes REST
- `app/api/graphql/route.ts`: exige sessao para chamadas GraphQL

## 1. Como criar um novo usuario

Edite o arquivo `data/users.json` e adicione um novo objeto no array.

Exemplo:

```json
{
  "username": "marketing",
  "password": "marketing123",
  "displayName": "Time de Marketing",
  "role": "editor",
  "permissions": ["content:edit"]
}
```

Campos:

- `username`: login usado na tela de autenticacao
- `password`: senha em texto puro para este prototipo
- `displayName`: nome exibido no header e na area admin
- `role`: perfil visual/logico do usuario
- `permissions`: lista de permissoes liberadas

Observacao:

- hoje este projeto usa JSON apenas para demonstracao
- em producao, o ideal e usar banco de dados e senha com hash

## 2. Como criar uma nova permissao

As permissoes vivem em `lib/auth/core.ts`.

Exemplo atual:

```ts
export const PERMISSIONS = {
  GLOBAL: "global",
  CONTENT_CREATE: "content:create",
  CONTENT_EDIT: "content:edit",
} as const;
```

Para adicionar uma nova permissao, acrescente uma chave:

```ts
export const PERMISSIONS = {
  GLOBAL: "global",
  CONTENT_CREATE: "content:create",
  CONTENT_EDIT: "content:edit",
  BANNERS_MANAGE: "banners:manage",
} as const;
```

Depois disso, voce ja pode usar `"banners:manage"` dentro de `data/users.json`.

Exemplo:

```json
{
  "username": "banner-admin",
  "password": "123",
  "displayName": "Banner Admin",
  "role": "admin",
  "permissions": ["banners:manage"]
}
```

## 3. Como proteger uma pagina com permissao

Se a pagina inteira depende de uma permissao, use `requirePermission`.

Exemplo:

```ts
import { PERMISSIONS } from "@/lib/auth/core";
import { requirePermission } from "@/lib/auth/session";

export default async function MinhaPagina() {
  await requirePermission(PERMISSIONS.CONTENT_EDIT);

  return <main>...</main>;
}
```

Se for uma area exclusiva de admin global, use:

```ts
await requirePermission(PERMISSIONS.GLOBAL);
```

ou:

```ts
await requireGlobalPermission();
```

## 4. Como esconder ou mostrar um botao na interface

Para refletir a permissao na UI, voce pode:

1. ler a sessao no server component
2. verificar a permissao
3. renderizar ou esconder o botao

Exemplo baseado na pagina do hotsite:

```ts
const session = await requireSession();
const userCanCreateContent = canCreateContent(session);

return userCanCreateContent ? <Button>...</Button> : <p>Sem acesso</p>;
```

Se a permissao for nova e ainda nao existir helper pronto, voce pode:

- usar `hasPermission(session, PERMISSIONS.SUA_PERMISSAO)` direto
- ou criar um helper em `lib/auth/authorization.ts`

Exemplo:

```ts
export function canManageBanners(session: SessionPayload | null | undefined) {
  return hasPermission(session, PERMISSIONS.BANNERS_MANAGE);
}
```

## 5. Como proteger chamadas de API

Nao basta esconder botao. O servidor tambem precisa validar.

### REST

As regras REST estao em `lib/auth/authorization.ts`, na funcao:

```ts
inferPermissionFromRestRequest(method, path)
```

Exemplo:

```ts
if (method === "PUT" && path.startsWith("/banners/")) {
  return PERMISSIONS.BANNERS_MANAGE;
}
```

Isso faz com que `app/api/rest/route.ts` negue a acao para usuarios sem permissao.

### GraphQL

Hoje `app/api/graphql/route.ts` exige sessao valida.

Se voce quiser regras mais finas para GraphQL no futuro, pode:

- inspecionar `query`
- identificar a operacao
- bloquear por permissao antes do `fetch`

## 6. Como refletir a nova permissao no login

Se a tela de login rapido mostrar descricoes dos perfis, atualize:

- `app/(auth)/login/login-form.tsx`

Exemplo:

- mudar o texto do usuario `user`
- adicionar um novo card de acesso rapido para outro usuario

## 7. Exemplo completo: liberar gestao de banners so para admin

### Passo 1

Adicionar em `lib/auth/core.ts`:

```ts
BANNERS_MANAGE: "banners:manage",
```

### Passo 2

Adicionar a permissao no `admin` em `data/users.json`:

```json
"permissions": ["global", "banners:manage"]
```

Ou em outro usuario especifico:

```json
"permissions": ["banners:manage"]
```

### Passo 3

Criar helper em `lib/auth/authorization.ts`:

```ts
export function canManageBanners(session: SessionPayload | null | undefined) {
  return hasPermission(session, PERMISSIONS.BANNERS_MANAGE);
}
```

### Passo 4

Na pagina, esconder ou mostrar o botao:

```ts
const canManage = canManageBanners(session);
```

### Passo 5

Na API REST, mapear a rota:

```ts
if (method === "PUT" && path.startsWith("/banners/")) {
  return PERMISSIONS.BANNERS_MANAGE;
}
```

## 8. Resumo pratico

Quando quiser adicionar um acesso novo, siga esta ordem:

1. criar a permissao em `lib/auth/core.ts`
2. dar essa permissao ao usuario em `data/users.json`
3. proteger a pagina com `requirePermission(...)` se necessario
4. esconder/mostrar botoes e links na UI
5. proteger a API em `lib/auth/authorization.ts`

Se fizer apenas o passo da UI, o acesso fica cosmetico. O seguro e sempre combinar UI + validacao no servidor.
