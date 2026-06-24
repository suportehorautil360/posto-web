# posto-web — Login real (backend) substituindo o demo

- **Data:** 2026-06-24
- **App:** `posto-web`
- **Status:** Design aprovado, pronto para plano
- **Pré:** login demo (`posto01`/`demo1234`) já existe; agora vira login real.

## 1. Objetivo

Trocar o login demo do `posto-web` por **login real contra o backend** (`POST /user/auth/login`),
aceitando **apenas operadores de posto** (`vinculo:"posto"`). O acesso é o criado no 360
(drawer de detalhe do posto). Remover o modo demo.

## 2. Decisões aprovadas

- **Sem demo:** remover `validarLoginDemo`/`DEMO_OPERADOR`, a caixa "Login demo…" e o rodapé "sem Firebase".
- **Só `vinculo:"posto"`:** rejeitar usuários cujo vínculo não seja posto.
- **Via API do back** (`/user/auth/login`), não Firestore client-side.

## 3. Contrato (existente, NÃO alterar o back)

`POST /user/auth/login` body `{ usuario, senha }`:
- Sucesso (HTTP 200): `{ ok:true, user:{ nome, usuario, senha, perfil, vinculo, prefeituraId, postoId? }, accessToken, tokenType:"Bearer", expiresIn, message }`.
- Erro (HTTP 200): `{ ok:false, msg }`.
- Hash: `SHA-256` hex sem sal no back (`createHash('sha256')…`), **idêntico** ao `hashSenha` do 360 → o acesso criado no 360 valida aqui.
- Sem restrição de tipo no back; a restrição a posto é **no posto-web**.

## 4. Mudanças no posto-web

- **`lib/api/client.ts` (novo):** wrapper `api.get/post`; base `API_URL` (env); injeta `Authorization: Bearer <token>` se houver sessão; em `!res.ok` lança `ApiError(status, msg)` lendo `message`.
- **`features/auth/api.ts` (novo):**
  - `LoginResult = { token: string; user: Operador }`; `Operador = { usuario, nome, postoId?, prefeituraId? }`.
  - `login(usuario, senha): Promise<LoginResult>` → `POST /user/auth/login`. Se `!ok || !accessToken` → `throw Error(msg ?? "Usuário ou senha inválidos.")`. Se `user.vinculo !== "posto"` → `throw Error("Este acesso não é de um posto.")`. Senão devolve `{ token, user:{ usuario, nome, postoId, prefeituraId } }`.
- **`lib/session.ts` (mod):** `Sessao = { usuario, nome, postoId?, prefeituraId?, token? }` (+ getter do token p/ o client).
- **Remover:** `features/auth/demo.ts`, `features/auth/login.ts` e seus testes.
- **`components/auth/login-screen.tsx` (mod):** submit assíncrono chama `login()`; estados `verificando`/`erro`; em sucesso `entrar(sessao)` → `/home`. **Remove** a caixa "Login demo…"; rodapé vira `v2.2 · <environmentLabel>`.
- **`components/auth/app-header.tsx` (mod):** o selo passa a indicar o **ambiente** (`environmentLabel`), não "DEMO" fixo.
- **`.env` (mod):** `NEXT_PUBLIC_APP_ENV=homologacao`, `NEXT_PUBLIC_API_URL=http://localhost:3000`.
- **`session-provider.tsx`:** `entrar(s: Sessao)` já cobre — sem mudança de assinatura além do tipo `Sessao`.

## 5. Testes

- **Unit `features/auth/api.test.ts`:** mock `fetch` — (a) `ok:true` + `vinculo:"posto"` → `{token,user}` mapeado; (b) `vinculo:"admin"` → lança "não é de um posto"; (c) `ok:false` → lança com `msg`.
- **E2E `e2e/login.spec.ts` (reescrito):** **mock da rota** `**/user/auth/login` no Playwright — posto válido → `/home`; vínculo não-posto → erro; `ok:false` → erro. (Não depende de backend vivo.)

## 6. Verificação real

Criar um acesso de posto real no 360 (drawer) e logar no `posto-web` apontando pro back no host (`:3000`); rebuildar o container `posto-web` com `NEXT_PUBLIC_APP_ENV=homologacao`.

## 7. Critérios de aceite

1. `posto-web` não tem mais caminho demo; login chama `/user/auth/login`.
2. Credencial de posto válida entra em `/home`; vínculo ≠ posto → "Este acesso não é de um posto."; inválida → msg do back.
3. Token guardado na sessão e injetado pelo client (Bearer) para futuras chamadas.
4. `pnpm lint && pnpm test && pnpm build` passam; e2e (mock) passa.
