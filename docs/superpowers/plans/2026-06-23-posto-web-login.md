# posto-web — Login do Operador do Posto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o projeto Next `posto-web` (web, sem PWA) com o design system laranja do comboio e a tela de login "Acesso Restrito" em modo demo.

**Architecture:** Espelha a base do `pwa-motorista` **menos** PWA/offline (sem Serwist/Dexie/SW). Next 16 App Router, design system OKLCh laranja copiado do `pwa-comboio`, sessão simples em localStorage, login demo (`posto01`/`demo1234`). Lógica pura (validação demo, formatação) isolada e testada.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind v4, shadcn (radix-nova), `lucide-react`, `class-variance-authority`, Vitest, Playwright.

## Global Constraints

- **NÃO é PWA:** nada de `@serwist/next`, `serwist`, `dexie`, service worker, manifest, offline.
- **Idioma/UI/comentários:** pt-BR. Formatação pt-BR (relógio `HH:MM`).
- **Cores:** design system **laranja sobre navy** do `pwa-comboio` (Safety Orange `#f97316` / `oklch(0.705 0.213 47.604)`).
- **Server Components por padrão**; `"use client"` só onde há estado/efeito/browser API.
- **Lint:** sem `react-hooks/set-state-in-effect` (setState só assíncrono em efeitos — usar `queueMicrotask`/callbacks) e sem `react-hooks/purity` (nada de `new Date()`/`Date.now()` no corpo do render).
- **Credencial demo (verbatim):** usuário `posto01`, senha `demo1234`.
- **Fonte de cópia:** `/Users/viniciusaguiar/Development/horautil/pwa-comboio` (globals.css + componentes ui).
- **Commits frequentes**, um por task. `git init` no Task 1.

---

## File Structure

| Caminho | Responsabilidade |
|---|---|
| `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, `.gitignore`, `.env` | Config do projeto Next (sem PWA). |
| `vitest.config.ts`, `playwright.config.ts` | Testes. |
| `lib/utils.ts` | `cn()`. |
| `lib/config/env.ts` | `APP_ENV`, `isDemo`, `environmentLabel`. |
| `app/globals.css` | Tokens OKLCh laranja (do comboio). |
| `lib/design-system/tokens.ts` + `index.ts` | Tokens tipados (marca FleetFuel). |
| `components/ui/{button,card,input,label,badge}.tsx` | Base do design system (copiados do comboio). |
| `features/auth/demo.ts` | Credencial demo. |
| `features/auth/login.ts` | `validarLoginDemo()` (puro). |
| `lib/session.ts` | Sessão simples em localStorage. |
| `components/providers/session-provider.tsx` | Context da sessão (+ gate de hidratação). |
| `components/auth/app-header.tsx` | Header (marca + DEMO + relógio ao vivo). |
| `components/auth/login-screen.tsx` | Tela "Acesso Restrito". |
| `app/layout.tsx`, `app/page.tsx`, `app/home/page.tsx`, `app/globals.css` | App shell + rotas. |
| `e2e/login.spec.ts` | E2E. |

---

## Task 1: Scaffold + config + env + design tokens

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, `.gitignore`, `.env`, `next-env.d.ts` (gerado), `vitest.config.ts`, `playwright.config.ts`, `lib/utils.ts`, `lib/config/env.ts`, `lib/config/env.test.ts`, `app/globals.css`, `lib/design-system/tokens.ts`, `lib/design-system/index.ts`

**Interfaces:**
- Produces: `cn()`; `env.ts` → `API_URL`, `APP_ENV: "demo"|"homologacao"|"producao"`, `isDemo`, `environmentLabel(env?)`; `brand` (`{ name:"FleetFuel", tagline:"Operador do Posto", description }`).

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "posto-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.21.0",
    "next": "16.2.9",
    "radix-ui": "^1.6.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "shadcn": "^4.11.0",
    "tailwind-merge": "^3.6.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.61.0",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^4.1.8"
  }
}
```

- [ ] **Step 2: `git init` + instalar**

Run: `cd /Users/viniciusaguiar/Development/horautil/posto-web && git init -q && pnpm install`
Expected: instala sem erros; cria `pnpm-lock.yaml`.

- [ ] **Step 3: `tsconfig.json`** (igual ao motorista)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: `next.config.ts`** (mínimo — sem serwist)

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 5: `postcss.config.mjs`**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 6: `eslint.config.mjs`**

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
```

- [ ] **Step 7: `components.json`** (copiar verbatim de `pwa-comboio/components.json`)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "", "css": "app/globals.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

- [ ] **Step 8: `.gitignore`**

```
/node_modules
/.next/
/out/
/build
.DS_Store
*.pem
npm-debug.log*
.env*
*.tsbuildinfo
next-env.d.ts
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
/coverage
```

- [ ] **Step 9: `.env`**

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=demo
```

- [ ] **Step 10: `vitest.config.ts`**

```ts
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "features/**/*.test.ts", "components/**/*.test.ts"],
  },
  resolve: { alias: { "@": root } },
});
```

- [ ] **Step 11: `playwright.config.ts`** (porta isolada 3412)

```ts
import { defineConfig, devices } from "@playwright/test";

const PORT = 3412;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && PORT=${PORT} pnpm start`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
  },
});
```

- [ ] **Step 12: `lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 13: Teste falho `lib/config/env.test.ts`**

```ts
import { describe, expect, it } from "vitest";

import { environmentLabel } from "./env";

describe("environmentLabel", () => {
  it("mapeia ambientes conhecidos", () => {
    expect(environmentLabel("demo")).toBe("Modo demonstração");
    expect(environmentLabel("homologacao")).toBe("Homologação");
    expect(environmentLabel("producao")).toBe("Produção");
  });
  it("desconhecido cai em Produção", () => {
    expect(environmentLabel("x")).toBe("Produção");
  });
});
```

- [ ] **Step 14: Rodar e ver falhar** — `pnpm vitest run lib/config/env.test.ts` → FAIL (módulo inexistente).

- [ ] **Step 15: `lib/config/env.ts`**

```ts
/** Configuração de ambiente do posto-web. */

export type AppEnv = "demo" | "homologacao" | "producao";

const RAW = (process.env.NEXT_PUBLIC_APP_ENV ?? "producao").toLowerCase();

export const APP_ENV: AppEnv =
  RAW === "demo" || RAW === "homologacao" ? RAW : "producao";

export const isDemo = APP_ENV === "demo";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export function environmentLabel(env: string = APP_ENV): string {
  switch (env) {
    case "demo":
      return "Modo demonstração";
    case "homologacao":
      return "Homologação";
    default:
      return "Produção";
  }
}
```

- [ ] **Step 16: Rodar e ver passar** — `pnpm vitest run lib/config/env.test.ts` → PASS.

- [ ] **Step 17: `app/globals.css`** — copiar VERBATIM de `pwa-comboio/app/globals.css` (tokens laranja sobre navy + utilities). Conteúdo idêntico ao usado no alinhamento do motorista.

- [ ] **Step 18: `lib/design-system/tokens.ts`**

```ts
/** posto-web — Design System Tokens (marca FleetFuel, paleta laranja do comboio). */

export const brand = {
  name: "FleetFuel",
  tagline: "Operador do Posto",
  description: "Sistema do operador do posto — confirmação de pagamentos FleetFuel.",
} as const;

export const colors = {
  brand: {
    orange: { hex: "#f97316", label: "Safety Orange", usage: "CTAs, foco, marca" },
    navy: { hex: "#0a0e17", label: "Deep Navy", usage: "Background principal" },
    slate: { hex: "#161b26", label: "Surface Slate", usage: "Cards e superfícies" },
  },
  semantic: {
    success: { css: "var(--success)", label: "Sucesso" },
    warning: { css: "var(--warning)", label: "Alerta" },
    destructive: { css: "var(--destructive)", label: "Erro / Destrutivo" },
    info: { css: "var(--info)", label: "Informação" },
  },
} as const;

export const typography = {
  fontFamily: {
    sans: '"Geist", "Geist Fallback", ui-sans-serif, system-ui, sans-serif',
    mono: '"Geist Mono", "Geist Mono Fallback", ui-monospace, monospace',
  },
} as const;

export const radius = { default: "0.625rem" } as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
```

- [ ] **Step 19: `lib/design-system/index.ts`**

```ts
export { brand, breakpoints, colors, radius, typography } from "./tokens";
```

- [ ] **Step 20: Lint + commit**

```bash
pnpm exec eslint lib/
git add -A
git commit -m "chore: scaffold posto-web (Next, sem PWA) + design tokens laranja"
```

---

## Task 2: Componentes base (copiar do comboio)

**Files:**
- Create: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/input.tsx`, `components/ui/label.tsx`, `components/ui/badge.tsx`

**Interfaces:**
- Produces: `Button` (variantes incl. `brand`), `Card`+subcomponentes, `Input`, `Label`, `Badge` (variante `outline`).

- [ ] **Step 1: Copiar verbatim** de `pwa-comboio/components/ui/`:

Run: `cp /Users/viniciusaguiar/Development/horautil/pwa-comboio/components/ui/{button,card,input,label,badge}.tsx /Users/viniciusaguiar/Development/horautil/posto-web/components/ui/`
Expected: 5 arquivos.

- [ ] **Step 2: Lint** — `pnpm exec eslint components/ui/` → sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/ui/
git commit -m "feat(ui): componentes base (button, card, input, label, badge)"
```

---

## Task 3: Auth demo + sessão + provider

**Files:**
- Create: `features/auth/demo.ts`, `features/auth/login.ts`, `features/auth/login.test.ts`, `lib/session.ts`, `components/providers/session-provider.tsx`

**Interfaces:**
- Produces:
  - `DEMO_OPERADOR = { usuario: "posto01", senha: "demo1234", nome: "Posto 01" }`
  - `validarLoginDemo(usuario: string, senha: string): boolean` (puro)
  - `Sessao = { usuario: string; nome: string }`; `salvarSessao(s)`, `getSessao(): Sessao | null`, `limparSessao()`
  - `useSession()` → `{ operador: Sessao | null; hydrated: boolean; entrar(s: Sessao): void; sair(): void }`; `SessionProvider`

- [ ] **Step 1: `features/auth/demo.ts`**

```ts
/** Credencial de demonstração do operador do posto. */
export const DEMO_OPERADOR = {
  usuario: "posto01",
  senha: "demo1234",
  nome: "Posto 01",
} as const;
```

- [ ] **Step 2: Teste falho `features/auth/login.test.ts`**

```ts
import { describe, expect, it } from "vitest";

import { validarLoginDemo } from "./login";

describe("validarLoginDemo", () => {
  it("aceita a credencial demo", () => {
    expect(validarLoginDemo("posto01", "demo1234")).toBe(true);
  });
  it("ignora espaços ao redor do usuário", () => {
    expect(validarLoginDemo("  posto01 ", "demo1234")).toBe(true);
  });
  it("rejeita credencial errada", () => {
    expect(validarLoginDemo("posto01", "errada")).toBe(false);
    expect(validarLoginDemo("outro", "demo1234")).toBe(false);
    expect(validarLoginDemo("", "")).toBe(false);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar** — `pnpm vitest run features/auth/login.test.ts` → FAIL.

- [ ] **Step 4: `features/auth/login.ts`**

```ts
import { DEMO_OPERADOR } from "./demo";

/** Valida a credencial demo (puro). */
export function validarLoginDemo(usuario: string, senha: string): boolean {
  return usuario.trim() === DEMO_OPERADOR.usuario && senha === DEMO_OPERADOR.senha;
}
```

- [ ] **Step 5: Rodar e ver passar** — `pnpm vitest run features/auth/login.test.ts` → PASS.

- [ ] **Step 6: `lib/session.ts`**

```ts
/** Sessão simples do operador do posto (localStorage). Sem token/offline. */

export interface Sessao {
  usuario: string;
  nome: string;
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

export function limparSessao(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}
```

- [ ] **Step 7: `components/providers/session-provider.tsx`**

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getSessao, limparSessao, salvarSessao, type Sessao } from "@/lib/session";

interface SessionCtx {
  operador: Sessao | null;
  hydrated: boolean;
  entrar: (s: Sessao) => void;
  sair: () => void;
}

const Ctx = createContext<SessionCtx>({
  operador: null,
  hydrated: false,
  entrar: () => {},
  sair: () => {},
});

export function useSession(): SessionCtx {
  return useContext(Ctx);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [operador, setOperador] = useState<Sessao | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const entrar = useCallback((s: Sessao) => {
    salvarSessao(s);
    setOperador(s);
  }, []);
  const sair = useCallback(() => {
    limparSessao();
    setOperador(null);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setOperador(getSessao());
      setHydrated(true);
    });
  }, []);

  return (
    <Ctx.Provider value={{ operador, hydrated, entrar, sair }}>{children}</Ctx.Provider>
  );
}
```

- [ ] **Step 8: Lint + commit**

```bash
pnpm exec eslint features/ lib/session.ts components/providers/
git add features/auth/ lib/session.ts components/providers/
git commit -m "feat(auth): login demo (posto01/demo1234), sessão e SessionProvider"
```

---

## Task 4: Header + tela de login + layout + home

**Files:**
- Create: `components/auth/app-header.tsx`, `components/auth/login-screen.tsx`, `app/layout.tsx`, `app/page.tsx`, `app/home/page.tsx`

**Interfaces:**
- Consumes: `useSession`, `validarLoginDemo`, `DEMO_OPERADOR`, `brand`, `environmentLabel`/`APP_ENV`, `Button`/`Input`/`Label`/`Badge`.

- [ ] **Step 1: `components/auth/app-header.tsx`** (marca + DEMO + relógio ao vivo)

```tsx
"use client";

import { AlertTriangle, Fuel } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { APP_ENV, environmentLabel } from "@/lib/config/env";
import { brand } from "@/lib/design-system";

function Relogio() {
  // Vazio no SSR; preenche no cliente (evita mismatch de hidratação e Date no render).
  const [hora, setHora] = useState("");
  useEffect(() => {
    const tick = () =>
      setHora(
        new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      );
    queueMicrotask(tick);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="text-sm tabular-nums text-muted-foreground" suppressHydrationWarning>
      {hora}
    </span>
  );
}

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border px-5 py-3">
      <div className="flex items-center gap-2">
        <Fuel className="size-4 text-brand" aria-hidden />
        <span className="text-sm font-bold tracking-tight">{brand.name}</span>
        {APP_ENV !== "producao" ? (
          <Badge
            variant="outline"
            className="ml-1 gap-1 border-warning/40 text-warning"
            aria-label={`Ambiente: ${environmentLabel()}`}
          >
            <AlertTriangle className="size-3" aria-hidden /> DEMO
          </Badge>
        ) : null}
      </div>
      <Relogio />
    </header>
  );
}
```

- [ ] **Step 2: `components/auth/login-screen.tsx`** (a tela "Acesso Restrito")

```tsx
"use client";

import { Fuel, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/auth/app-header";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_OPERADOR } from "@/features/auth/demo";
import { validarLoginDemo } from "@/features/auth/login";

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setVerificando(true);
    // pequeno atraso só para o estado "verificando" aparecer
    setTimeout(() => {
      if (validarLoginDemo(usuario, senha)) {
        entrar({ usuario: usuario.trim(), nome: DEMO_OPERADOR.nome });
        router.replace("/home");
      } else {
        setErro("Usuário ou senha inválidos.");
        setVerificando(false);
      }
    }, 250);
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
            <Label htmlFor="usuario" className="text-xs uppercase tracking-wider text-muted-foreground">
              Usuário
            </Label>
            <Input
              id="usuario"
              name="usuario"
              autoComplete="username"
              placeholder="login do caixa"
              className="font-mono"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha" className="text-xs uppercase tracking-wider text-muted-foreground">
              Senha
            </Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
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
          <Button type="submit" variant="brand" className="h-11 w-full text-base" disabled={verificando}>
            {verificando ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <div className="mt-5 flex w-full max-w-sm items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
          <KeyRound className="size-4 shrink-0" aria-hidden />
          <span>
            Login demo: usuário <strong>{DEMO_OPERADOR.usuario}</strong> · senha{" "}
            <strong>{DEMO_OPERADOR.senha}</strong>
          </span>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          v2.2 · Modo demonstração — sem Firebase
        </p>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SessionProvider } from "@/components/providers/session-provider";
import { brand } from "@/lib/design-system";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s — ${brand.name}` },
  description: brand.description,
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0a0e17" }],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: `app/page.tsx`** (login na raiz)

```tsx
import { LoginScreen } from "@/components/auth/login-screen";

export default function Page() {
  return <LoginScreen />;
}
```

- [ ] **Step 5: `app/home/page.tsx`** (placeholder do operador)

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSession } from "@/components/providers/session-provider";
import { AppHeader } from "@/components/auth/app-header";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const { operador, hydrated, sair } = useSession();

  useEffect(() => {
    if (hydrated && !operador) router.replace("/");
  }, [hydrated, operador, router]);
  if (!hydrated || !operador) return null;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Operador conectado
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{operador.nome}</h1>
          <p className="text-sm text-muted-foreground">
            As telas do operador (confirmar pagamento do QR) entram aqui.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            sair();
            router.replace("/");
          }}
        >
          Sair
        </Button>
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Lint + build**

Run: `pnpm exec eslint components/ app/ && pnpm build`
Expected: lint limpo; build conclui; rotas `/` e `/home`. (Atenção ao `set-state-in-effect`/`purity`: o relógio usa `queueMicrotask`+`setInterval`; os gates só fazem `router.replace`.)

- [ ] **Step 7: Subir e validar visual** — `pnpm start` em `localhost:3000`, abrir `/` → conferir header (FleetFuel+DEMO+relógio), logo, campos, Entrar, caixa demo, rodapé. Logar `posto01`/`demo1234` → `/home`.

- [ ] **Step 8: Commit**

```bash
git add components/auth/ app/
git commit -m "feat(login): tela Acesso Restrito (header+relógio, demo) + layout + home"
```

---

## Task 5: E2E + verificação final + README

**Files:**
- Create: `e2e/login.spec.ts`, `README.md`

- [ ] **Step 1: `e2e/login.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test("mostra a tela Acesso Restrito (demo)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Acesso Restrito" })).toBeVisible();
  await expect(page.getByText("DEMO")).toBeVisible();
  await expect(page.getByText("Login demo:")).toBeVisible();
});

test("login demo posto01/demo1234 entra na home", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Usuário").fill("posto01");
  await page.getByLabel("Senha").fill("demo1234");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText("Operador conectado")).toBeVisible();
});

test("credencial errada mostra erro", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Usuário").fill("posto01");
  await page.getByLabel("Senha").fill("errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toContainText("inválidos");
});
```

- [ ] **Step 2: Instalar Chromium** — `pnpm exec playwright install chromium`.

- [ ] **Step 3: Rodar e2e** — `pnpm test:e2e` → 3 testes PASS.

- [ ] **Step 4: Verificação completa** — `pnpm lint && pnpm test && pnpm build` → tudo verde.

- [ ] **Step 5: `README.md`** — visão geral (sistema web do operador do posto, FleetFuel), stack (Next 16, sem PWA), scripts (`dev`/`build`/`start`/`lint`/`test`/`test:e2e`), `.env` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_ENV`), login demo `posto01`/`demo1234`, e nota de que o login real (vínculo `posto`) entra depois.

- [ ] **Step 6: Commit**

```bash
git add e2e/ README.md
git commit -m "test(e2e): tela de login + login demo; README"
```

---

## Self-Review

**1. Cobertura da spec:**
- Projeto Next sem PWA → Task 1 (sem serwist/dexie). ✓
- DS laranja (tokens + componentes base) → Tasks 1, 2. ✓
- Tela "Acesso Restrito" (header+relógio, logo, campos, Entrar, caixa demo, rodapé, estados) → Task 4. ✓
- Auth demo (posto01/demo1234) + sessão + provider com hidratação → Task 3. ✓
- Rotas `/` (login) e `/home` (placeholder) com gate → Tasks 4. ✓
- Env/`environmentLabel` → Task 1. ✓
- Testes unit + e2e → Tasks 1, 3, 5. ✓

**2. Placeholders:** nenhum TBD/TODO; código completo em cada passo.

**3. Consistência de tipos:** `Sessao { usuario, nome }` definido (Task 3) e usado por `useSession`/login-screen/home (Tasks 3,4); `validarLoginDemo(usuario,senha)` e `DEMO_OPERADOR` consistentes; `entrar(s: Sessao)`/`sair()` batem entre provider e telas. ✓

**Notas de execução:**
- O relógio renderiza vazio no SSR e preenche no cliente (`suppressHydrationWarning`) — evita mismatch e a regra de purity.
- Sem PWA: nada de gerar `public/sw.js`; o eslint não precisa ignorá-lo.
