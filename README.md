# posto-web — Operador do Posto (FleetFuel)

Sistema **web** do operador do posto (caixa) — o outro lado do fluxo de pagamento por
QR do FleetFuel (motorista escaneia → posto confirma). **Não é PWA** (web desktop-first),
seguindo o padrão de cores do `pwa-comboio` (laranja sobre navy).

![Acesso Restrito](docs/login-screen.png)

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind v4** + **shadcn** (radix-nova) + design system OKLCh (laranja, dark-mode-first)
- **Vitest** (unit) + **Playwright** (e2e)
- Sem service worker / offline / Dexie.

## Scripts

```bash
pnpm dev        # desenvolvimento
pnpm build      # build de produção
pnpm start      # serve o build
pnpm lint       # eslint
pnpm test       # vitest (unit)
pnpm test:e2e   # playwright (e2e; build + start na porta 3412)
```

## Variáveis de ambiente (`.env`)

```
NEXT_PUBLIC_API_URL=http://localhost:3000   # base da API NestJS (uso futuro)
NEXT_PUBLIC_APP_ENV=demo                     # demo | homologacao | producao
```

## Login (modo demo)

A tela **"Acesso Restrito"** (`/`) autentica em modo demo:

> Usuário **`posto01`** · Senha **`demo1234`**

Em sucesso vai para `/home` (placeholder do operador). O **login real** (operador com
vínculo `posto`, via backend/Firebase) entra numa próxima etapa — assim como as telas do
operador (confirmar pagamento do QR).

## Estrutura

```
app/            layout, page (login), home (placeholder), globals.css
components/
  ui/           base do design system (do comboio)
  auth/         app-header (marca+DEMO+relógio), login-screen
  providers/    SessionProvider
features/auth/  demo (credencial), login (validação)
lib/            session, config/env, utils, design-system
e2e/            testes Playwright
docs/           spec, plano e screenshots
```
