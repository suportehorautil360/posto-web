# posto-web — Portal do Operador do Posto (FleetFuel) — Login

- **Data:** 2026-06-23
- **Projeto:** `posto-web` (novo, na raiz `horautil`)
- **Status:** Design aprovado, pronto para plano

## 1. Objetivo

Iniciar o sistema **web do operador do posto** (FleetFuel) e entregar a **tela de login
"Acesso Restrito"** (conforme o anexo), em **modo demo**. É o outro lado do fluxo de
pagamento por QR (motorista escaneia → posto confirma). Segue o **padrão de cores do
`pwa-comboio` (laranja sobre navy)**.

## 2. Decisões aprovadas

- **Next.js web comum — NÃO é PWA.** Sem service worker, offline-first ou Dexie.
- Nome do projeto: **`posto-web`**. Desktop-first.
- Espelha a base do `pwa-motorista` **menos** a parte de PWA/offline.
- Primeira entrega: **design system (laranja do comboio) + tela de login** (demo).
- Após login: **`/home` placeholder** (dashboard do operador, próxima etapa).
- Lado do 360 (tela de **detalhes** do posto + acesso) = **sub-projeto B seguinte** (a
  tela oficinas-postos já existe e cadastra; falta a de detalhes).

## 3. Stack

- Next 16 (App Router) + TypeScript strict + Tailwind v4 + shadcn (radix-nova) +
  `lucide-react` + `class-variance-authority`.
- **Sem** `@serwist/next`, `serwist`, `dexie`, `jsqr`.
- Vitest (unit) + Playwright (e2e).
- Design system: copia `app/globals.css` (tokens laranja OKLCh) + `lib/design-system/tokens.ts`
  do comboio/motorista; componentes base copiados do comboio: `Button`, `Input`, `Card`,
  `Label`, `Badge`.

## 4. Tela "Acesso Restrito" (`/`)

Layout fiel ao anexo (web, fundo navy/quase-preto, acento laranja):
- **Header** (barra full-width com borda inferior): à esquerda `● FleetFuel` + selo **DEMO**
  (badge outline laranja); à direita **relógio ao vivo** `HH:MM`.
- **Miolo centralizado** (card com `max-w`):
  - Logo bomba (⛽ / ícone) no topo.
  - Título **Acesso Restrito** (display, forte).
  - Subtítulo "Operador do Posto — insira suas credenciais".
  - Card: label `USUÁRIO` + input (placeholder "login do caixa", `font-mono`, foco laranja);
    label `SENHA` + input password; botão **Entrar** (variante `brand`, largura total).
  - Caixa demo (destaque laranja): 🔑 "Login demo: usuário **posto01** · senha **demo1234**".
  - Rodapé: "v2.2 · Modo demonstração — sem Firebase".
- **Estados:** `idle` · `verificando` (botão com loader) · `erro` (mensagem "Usuário ou senha
  inválidos", role="alert").
- **Acessibilidade:** labels associados, foco visível, `autoComplete` (username/current-password),
  `aria-live` no erro.

## 5. Auth (modo demo)

- `lib/config/env.ts`: `APP_ENV` (`demo`|`homologacao`|`producao`), `isDemo`, `environmentLabel`.
- `features/auth/demo.ts`: credencial demo `posto01` / `demo1234`.
- `features/auth/login.ts`: `validarLoginDemo(usuario, senha)` (puro) — `true` se bater.
- `lib/session.ts`: sessão simples em localStorage (`{ usuario }` + flag) — sem token/trust-window
  (não é offline). `getSessao`/`salvarSessao`/`limparSessao`.
- `components/providers/session-provider.tsx`: Context `{ operador, hydrated, entrar, sair }`
  com gate de hidratação (evita redirect prematuro — mesma lição do motorista).
- Fluxo: `/` (login) → em sucesso grava sessão e vai pra `/home`; se já há sessão, `/` redireciona
  pra `/home`. `/home` sem sessão → volta pra `/`.
- Estrutura pronta pro real depois (`/user/auth/login` com vínculo `posto`), mas **não** agora.

## 6. Estrutura

```
app/ layout.tsx (dark, fontes, SessionProvider) · page.tsx (login) · home/page.tsx (placeholder) · globals.css
components/ ui/* (base do comboio) · auth/* (login-screen, app-header com relógio) · providers/session-provider
features/auth/ demo.ts · login.ts
lib/ config/env.ts · session.ts · utils.ts · design-system/{tokens.ts,index.ts}
e2e/ login.spec.ts
```

## 7. Testes

- **Unit (Vitest):** `validarLoginDemo` (aceita posto01/demo1234, rejeita o resto);
  `environmentLabel`.
- **E2E (Playwright):** `/` mostra "Acesso Restrito" + selo DEMO + dica demo; login
  `posto01`/`demo1234` → `/home`; senha errada → erro; porta isolada (`pnpm build && pnpm start`).

## 8. Critérios de aceite

1. `posto-web` builda e roda; tela `/` igual ao anexo (header+relógio, logo, campos, Entrar, caixa demo, rodapé), em laranja sobre navy.
2. `posto01`/`demo1234` entra e vai pra `/home`; credencial errada mostra erro.
3. `/home` exige sessão; `/` redireciona pra `/home` se já logado.
4. `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` passam.
5. Sem qualquer dependência/infra de PWA (sem Serwist/Dexie/SW).
