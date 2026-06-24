# posto-web — Login real (backend) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o login demo do posto-web por login real via `POST /user/auth/login`, aceitando só `vinculo:"posto"`.

**Architecture:** Camada de API fina (`lib/api/client`) + `features/auth/api.login` chamando o back; sessão guarda token+operador; a tela de login vira assíncrona contra a API. Remove o caminho demo.

**Tech Stack:** Next 16, React 19, TS, Tailwind, Vitest, Playwright.

## Global Constraints

- **Não alterar o backend.** Contrato `POST /user/auth/login` `{usuario,senha}` → `{ok,user{vinculo,postoId,…},accessToken,msg}`. Hash SHA-256 hex sem sal (back == 360).
- **Sem demo:** remover `features/auth/demo.ts`, `features/auth/login.ts` e testes; tirar a caixa "Login demo…" e o rodapé "sem Firebase".
- **Só posto:** rejeitar `user.vinculo !== "posto"`.
- pt-BR; sem assinatura de IA nos commits.
- Branch `feat/login-real`; ao fim, merge em main + push (repo `posto-web-horautil`).

---

## File Structure

| Caminho | Responsabilidade |
|---|---|
| `lib/api/client.ts` (novo) | `api.get/post`, base `API_URL`, Bearer, `ApiError`. |
| `features/auth/api.ts` (novo) | `login()` → `/user/auth/login`, rejeita não-posto. |
| `features/auth/api.test.ts` (novo) | testes do `login` (mock fetch). |
| `lib/session.ts` (mod) | `Sessao` com `postoId?/prefeituraId?/token?`. |
| `components/auth/login-screen.tsx` (mod) | submit async (API), sem caixa demo. |
| `components/auth/app-header.tsx` (mod) | selo = ambiente (`environmentLabel`). |
| `.env` (mod) | `NEXT_PUBLIC_APP_ENV=homologacao`. |
| `features/auth/demo.ts`, `features/auth/login.ts`, `features/auth/login.test.ts` | **remover**. |
| `e2e/login.spec.ts` (reescrito) | mock da rota `/user/auth/login`. |

---

## Task 1: API client + `features/auth/api.login`

**Files:**
- Create: `lib/api/client.ts`, `features/auth/api.ts`, `features/auth/api.test.ts`
- Modify: `lib/session.ts`
- Delete: `features/auth/demo.ts`, `features/auth/login.ts`, `features/auth/login.test.ts`

**Interfaces:**
- Produces:
  - `lib/session.ts`: `Sessao = { usuario: string; nome: string; postoId?: string; prefeituraId?: string; token?: string }`; `getSessao/salvarSessao/limparSessao` (já existem; só muda o tipo).
  - `lib/api/client.ts`: `api.get<T>(path)`, `api.post<T>(path, body)`, `class ApiError extends Error { status }`.
  - `features/auth/api.ts`: `Operador = { usuario: string; nome: string; postoId?: string; prefeituraId?: string }`; `LoginResult = { token: string; user: Operador }`; `login(usuario: string, senha: string): Promise<LoginResult>`.

- [ ] **Step 1: Atualizar `lib/session.ts`** — estender `Sessao` (manter as funções)

```ts
/** Sessão do operador do posto (localStorage). */

export interface Sessao {
  usuario: string;
  nome: string;
  postoId?: string;
  prefeituraId?: string;
  token?: string;
}

const KEY = "fleetfuel_posto_sessao";

export function salvarSessao(s: Sessao): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignora */
  }
}

export function getSessao(): Sessao | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Sessao) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getSessao()?.token ?? null;
}

export function limparSessao(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}
```

- [ ] **Step 2: `lib/api/client.ts`**

```ts
/** Client HTTP fino para a API NestJS. Injeta o Bearer da sessão. */
import { API_URL } from "../config/env";
import { getToken } from "../session";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body != null ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (data?.message) {
        message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      }
    } catch {
      /* sem corpo JSON */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
};
```

- [ ] **Step 3: Teste falho `features/auth/api.test.ts`**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { login } from "./api";

afterEach(() => vi.restoreAllMocks());

function mockFetch(json: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, status, json: async () => json })) as unknown as typeof fetch,
  );
}

describe("login", () => {
  it("mapeia a resposta de um operador de posto", async () => {
    mockFetch({
      ok: true,
      accessToken: "jwt-1",
      user: {
        nome: "Posto Centro",
        usuario: "posto01",
        perfil: "gestor",
        vinculo: "posto",
        prefeituraId: "pref-1",
        postoId: "posto-1",
      },
    });
    const r = await login("posto01", "1234");
    expect(r.token).toBe("jwt-1");
    expect(r.user).toEqual({
      usuario: "posto01",
      nome: "Posto Centro",
      postoId: "posto-1",
      prefeituraId: "pref-1",
    });
  });

  it("rejeita usuário que não é de posto", async () => {
    mockFetch({
      ok: true,
      accessToken: "jwt-2",
      user: { nome: "Admin", usuario: "admin", vinculo: "admin", prefeituraId: "p" },
    });
    await expect(login("admin", "1234")).rejects.toThrow("não é de um posto");
  });

  it("propaga a msg do back quando ok=false", async () => {
    mockFetch({ ok: false, msg: "Login ou senha invalidos." });
    await expect(login("x", "y")).rejects.toThrow("Login ou senha invalidos.");
  });
});
```

- [ ] **Step 4: Rodar e ver falhar** — `pnpm exec vitest run features/auth/api.test.ts` → FAIL (`./api` inexistente).

- [ ] **Step 5: `features/auth/api.ts`**

```ts
/** Login do operador do posto — POST /user/auth/login (NestJS). */
import { api } from "@/lib/api/client";

export interface Operador {
  usuario: string;
  nome: string;
  postoId?: string;
  prefeituraId?: string;
}

export interface LoginResult {
  token: string;
  user: Operador;
}

interface UserAuth {
  nome?: string;
  usuario?: string;
  vinculo?: string;
  prefeituraId?: string;
  postoId?: string;
}
interface LoginResponse {
  ok: boolean;
  msg?: string;
  message?: string;
  user?: UserAuth;
  accessToken?: string;
}

export async function login(usuario: string, senha: string): Promise<LoginResult> {
  const r = await api.post<LoginResponse>("/user/auth/login", {
    usuario: usuario.trim(),
    senha,
  });
  if (!r.ok || !r.accessToken || !r.user) {
    throw new Error(r.msg ?? r.message ?? "Usuário ou senha inválidos.");
  }
  if (r.user.vinculo !== "posto") {
    throw new Error("Este acesso não é de um posto.");
  }
  return {
    token: r.accessToken,
    user: {
      usuario: r.user.usuario ?? usuario.trim(),
      nome: r.user.nome ?? r.user.usuario ?? usuario.trim(),
      postoId: r.user.postoId,
      prefeituraId: r.user.prefeituraId,
    },
  };
}
```

- [ ] **Step 6: Remover o demo**

Run: `git rm features/auth/demo.ts features/auth/login.ts features/auth/login.test.ts`
Expected: 3 arquivos removidos.

- [ ] **Step 7: Rodar e ver passar** — `pnpm exec vitest run features/auth/api.test.ts` → PASS (3 testes). E `pnpm exec vitest run` (suite) sem referência aos arquivos removidos.

- [ ] **Step 8: Lint + commit**

```bash
pnpm exec eslint lib/api/ features/auth/api.ts lib/session.ts
git add lib/api/ features/auth/api.ts features/auth/api.test.ts lib/session.ts
git add -A features/auth/   # registra as remoções
git commit -m "feat(auth): login real via /user/auth/login (só vínculo posto); remove demo"
```

---

## Task 2: Tela de login real + header de ambiente

**Files:**
- Modify: `components/auth/login-screen.tsx`, `components/auth/app-header.tsx`, `.env`

**Interfaces:**
- Consumes: `login` (features/auth/api), `useSession().entrar(Sessao)`, `environmentLabel` (env).

- [ ] **Step 1: Reescrever `components/auth/login-screen.tsx`** (submit async, sem demo)

```tsx
"use client";

import { Fuel } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/auth/app-header";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { login } from "@/features/auth/api";
import { environmentLabel } from "@/lib/config/env";

export function LoginScreen() {
  const router = useRouter();
  const { operador, hydrated, entrar } = useSession();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    if (hydrated && operador) router.replace("/home");
  }, [hydrated, operador, router]);
  if (!hydrated || operador) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setVerificando(true);
    try {
      const { token, user } = await login(usuario, senha);
      entrar({
        usuario: user.usuario,
        nome: user.nome,
        postoId: user.postoId,
        prefeituraId: user.prefeituraId,
        token,
      });
      router.replace("/home");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
      setVerificando(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-b from-brand to-brand/70 shadow-lg shadow-brand/25">
            <Fuel className="size-7 text-brand-foreground" aria-hidden />
          </span>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Acesso Restrito</h1>
            <p className="text-sm text-muted-foreground">
              Operador do Posto — insira suas credenciais
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
        >
          <div className="space-y-2">
            <label
              htmlFor="usuario"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Usuário
            </label>
            <input
              id="usuario"
              name="usuario"
              autoComplete="username"
              placeholder="login do caixa"
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="senha"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          {erro ? (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="brand"
            className="h-11 w-full text-base"
            disabled={verificando}
          >
            {verificando ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          v2.2 · {environmentLabel()}
        </p>
      </main>
    </div>
  );
}
```

> Nota: substituí os `Input` (shadcn não tem `Input` no posto-web? — tem: foi copiado? Não. O posto-web copiou `button/card/input/label/badge` do comboio no Task 2 do scaffold). Se `@/components/ui/input` e `label` existirem, pode usar; aqui usei `<input>`/`<label>` crus para não depender — ambos válidos. **Conferir no app:** se `components/ui/input.tsx` existir, manter o uso anterior é equivalente.

- [ ] **Step 2: Ajustar `components/auth/app-header.tsx`** — o selo passa a mostrar o ambiente

Trocar o conteúdo do badge (de "DEMO" fixo) pelo rótulo do ambiente:

```tsx
          <Badge
            variant="outline"
            className="ml-1 gap-1 border-warning/40 text-warning"
            aria-label={`Ambiente: ${environmentLabel()}`}
          >
            <AlertTriangle className="size-3" aria-hidden /> {environmentLabel().toUpperCase()}
          </Badge>
```

(Mantém o `import { APP_ENV, environmentLabel }`; o badge só aparece quando `APP_ENV !== "producao"`.)

- [ ] **Step 3: Atualizar `.env`**

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=homologacao
```

- [ ] **Step 4: Lint + build**

Run: `pnpm exec eslint components/auth/ && pnpm build`
Expected: lint limpo; build conclui. (Atenção `react-hooks/purity`/`set-state-in-effect`: o submit é handler de evento; o gate só faz `router.replace`.)

- [ ] **Step 5: Commit**

```bash
git add components/auth/ .env || git add components/auth/
git commit -m "feat(login): tela usa login real e selo de ambiente; remove caixa demo"
```

> Obs.: `.env` é gitignored (`.env*`) — não entra no commit; ajustar localmente é suficiente.

---

## Task 3: E2E com rota mockada + verificação final

**Files:**
- Modify: `e2e/login.spec.ts`

- [ ] **Step 1: Reescrever `e2e/login.spec.ts`** (mock da API)

```ts
import { expect, test, type Page } from "@playwright/test";

async function mockLogin(page: Page, resposta: object, status = 200) {
  await page.route("**/user/auth/login", async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(resposta),
    });
  });
}

test("login de posto válido entra na home", async ({ page }) => {
  await mockLogin(page, {
    ok: true,
    accessToken: "jwt-e2e",
    user: { nome: "Posto Centro", usuario: "posto01", vinculo: "posto", prefeituraId: "p1", postoId: "po1" },
  });
  await page.goto("/");
  await page.getByLabel("Usuário").fill("posto01");
  await page.getByLabel("Senha").fill("seg123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText("Posto Centro")).toBeVisible();
});

test("vínculo não-posto é rejeitado", async ({ page }) => {
  await mockLogin(page, {
    ok: true,
    accessToken: "jwt-e2e",
    user: { nome: "Admin", usuario: "admin", vinculo: "admin", prefeituraId: "p1" },
  });
  await page.goto("/");
  await page.getByLabel("Usuário").fill("admin");
  await page.getByLabel("Senha").fill("seg123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Este acesso não é de um posto.")).toBeVisible();
});

test("credencial inválida mostra a msg do back", async ({ page }) => {
  await mockLogin(page, { ok: false, msg: "Login ou senha invalidos." });
  await page.goto("/");
  await page.getByLabel("Usuário").fill("x");
  await page.getByLabel("Senha").fill("y");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Login ou senha invalidos.")).toBeVisible();
});
```

> O e2e usa `getByLabel("Usuário")`/`getByLabel("Senha")` — os `<label htmlFor>` da tela garantem o vínculo. O `home/page.tsx` mostra `operador.nome` ("Operador conectado / {nome}").

- [ ] **Step 2: Rodar e2e** — `pnpm test:e2e` → 3 testes PASS.

- [ ] **Step 3: Verificação completa** — `pnpm lint && pnpm test && pnpm build` → tudo verde.

- [ ] **Step 4: Atualizar `README.md`** — trocar a seção "Login (modo demo)" por "Login": agora real, via `POST /user/auth/login`, só `vinculo:posto`; o acesso é criado no 360 (detalhe do posto); `NEXT_PUBLIC_APP_ENV` controla o rótulo de ambiente; `NEXT_PUBLIC_API_URL` aponta pro back.

- [ ] **Step 5: Commit**

```bash
git add e2e/login.spec.ts README.md
git commit -m "test(e2e): login real (mock da rota); docs"
```

---

## Task 4: Verificação real + rebuild do container

**Files:** nenhum (validação + infra).

- [ ] **Step 1: Criar um acesso de posto real no 360** — `pnpm dev` no 360, logar admin, Oficinas e Postos → "Detalhes / Acesso" → criar (ex.: `postocentro`/`seg1234`). (O back precisa estar no host na :3000.)

- [ ] **Step 2: Logar de verdade no posto-web** — rodar o posto-web local (`pnpm dev`) com `NEXT_PUBLIC_APP_ENV=homologacao` + `NEXT_PUBLIC_API_URL=http://localhost:3000`, entrar com `postocentro`/`seg1234` → deve ir pra `/home`. Testar credencial errada e um usuário não-posto (deve recusar).

- [ ] **Step 3: Rebuild do container posto-web** — atualizar o arg no `docker-compose.yml` (raiz) de `NEXT_PUBLIC_APP_ENV: "demo"` para `"homologacao"`; `docker compose build posto-web && docker compose up -d posto-web`; conferir HTTP 200 em :3004.

- [ ] **Step 4 (cleanup):** remover o acesso de teste criado no 360 (drawer → Remover) se não for pra ficar.

---

## Self-Review

**1. Cobertura da spec:**
- Login real via `/user/auth/login` → Tasks 1, 2. ✓
- Rejeita não-posto → Task 1 (`api.login`). ✓
- Remove demo (arquivos + caixa + rodapé) → Tasks 1, 2. ✓
- Sessão com token + Bearer no client → Task 1. ✓
- Selo de ambiente; `.env` homolog → Task 2. ✓
- Testes unit + e2e (mock) → Tasks 1, 3. ✓
- Verificação real + rebuild container → Task 4. ✓

**2. Placeholders:** nenhum TBD/TODO; código completo.

**3. Consistência de tipos:** `Sessao` (Task 1) com `postoId/prefeituraId/token` consumido por `entrar()` na tela (Task 2) e pelo `getToken()` do client (Task 1); `login(): {token,user:Operador}` (Task 1) consumido na tela (Task 2) e no e2e (Task 3). `entrar(s: Sessao)` já existe no SessionProvider. ✓

**Notas de execução:**
- A tela usa `<input>`/`<label>` crus (não depende de um componente Input). Se preferir, há `components/ui/button` para o botão (mantido).
- `.env` é gitignored — alterar local; o valor de build do container vem do `docker-compose.yml` (Task 4).
- E2E não depende de backend (rota mockada). A verificação real (Task 4) é manual contra o back no host.
