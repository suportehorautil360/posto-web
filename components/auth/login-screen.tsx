"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Eye,
  EyeOff,
  Fuel,
  Gauge,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/features/auth/api";
import { APP_ENV, environmentLabel } from "@/lib/config/env";
import { brand } from "@/lib/design-system";
import { cn } from "@/lib/utils";

const PILARES = [
  {
    icon: Fuel,
    title: "Abastecimento",
    text: "Libere combustível com conferência de frota e horímetro.",
  },
  {
    icon: Gauge,
    title: "Controle em tempo real",
    text: "Acompanhe operações do posto sem sair da tela.",
  },
  {
    icon: ClipboardList,
    title: "Histórico e notas",
    text: "Consulte registros e documentos com rastreabilidade.",
  },
] as const;

export function LoginScreen() {
  const router = useRouter();
  const { operador, hydrated, entrar } = useSession();
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
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
      const { token, user } = await login(identificador, senha);
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
    <div className="relative flex min-h-svh overflow-hidden bg-[#070b14]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-glow-pulse absolute inset-0 bg-[radial-gradient(110%_70%_at_20%_0%,rgba(249,115,22,0.28),transparent_52%)]" />
        <div className="login-glow-pulse absolute inset-0 bg-[radial-gradient(90%_60%_at_90%_100%,rgba(56,189,248,0.12),transparent_50%)]" />
        <div className="login-orb login-orb--orange" />
        <div className="login-orb login-orb--sky" />
        <div className="login-orb login-orb--amber" />
        <div className="login-ring login-ring--a" />
        <div className="login-ring login-ring--b" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <main className="relative z-10 mx-auto grid min-h-svh w-full max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        {/* Painel de marca — preenche o vazio no desktop */}
        <section className="hidden flex-col justify-between px-10 py-12 lg:flex xl:px-14">
          <div className="animate-in fade-in-0 slide-in-from-left-3 duration-700">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-orange-300/90 uppercase">
              {brand.name}
            </p>
            <h2 className="mt-5 max-w-md text-4xl font-semibold tracking-tight text-white xl:text-5xl">
              Operação do posto
              <span className="mt-1 block text-orange-400">em um só lugar</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
              Portal do operador para abastecimento, conferência de frota e
              acompanhamento do dia a dia no campo.
            </p>
          </div>

          <ul className="mt-12 space-y-5 animate-in fade-in-0 slide-in-from-left-3 duration-700 delay-150 fill-mode-both">
            {PILARES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-orange-300">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-10 inline-flex items-center gap-2 text-xs text-slate-500 animate-in fade-in-0 duration-700 delay-300 fill-mode-both">
            <ShieldCheck className="size-3.5 text-emerald-400/80" aria-hidden />
            Acesso restrito a operadores credenciados do posto
          </p>
        </section>

        {/* Formulário */}
        <section className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
          <div
            className={cn(
              "w-full max-w-[420px]",
              "animate-in fade-in-0 slide-in-from-bottom-3 duration-500",
            )}
          >
            <div className="mb-8 text-center lg:text-left">
              <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[11px] font-medium tracking-wide text-orange-300/90">
                <Fuel className="size-3" aria-hidden />
                Portal do Posto
              </p>
              <h1 className="text-[1.75rem] font-semibold tracking-tight text-white sm:text-3xl">
                Acesso Restrito
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Entre com o e-mail ou usuário do operador para continuar.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-2xl border border-white/10 bg-[#0d1422]/85 p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75)] backdrop-blur-md sm:p-7"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="identificador"
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
                >
                  E-mail ou usuário
                </Label>
                <Input
                  id="identificador"
                  name="identificador"
                  autoComplete="username"
                  placeholder="operador@posto.com.br"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.04] px-3.5 text-[15px] text-slate-100 placeholder:text-slate-500 focus-visible:border-orange-500/50 focus-visible:ring-orange-500/25 dark:bg-white/[0.04]"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="senha"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
                  >
                    Senha
                  </Label>
                  <Link
                    href="/esqueci-senha"
                    className="text-xs text-slate-400 underline-offset-4 transition-colors hover:text-orange-300 hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="senha"
                    name="senha"
                    type={mostrarSenha ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-white/10 bg-white/[0.04] px-3.5 pr-11 text-[15px] text-slate-100 placeholder:text-slate-500 focus-visible:border-orange-500/50 focus-visible:ring-orange-500/25 dark:bg-white/[0.04]"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
                    onClick={() => setMostrarSenha((v) => !v)}
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              {erro ? (
                <p
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                  role="alert"
                >
                  {erro}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="brand"
                className="h-11 w-full rounded-xl text-[15px] font-semibold shadow-[0_10px_30px_-12px_rgba(249,115,22,0.8)] transition-transform hover:brightness-105 active:scale-[0.99]"
                disabled={verificando}
              >
                {verificando ? (
                  "Entrando…"
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Lock className="size-4 opacity-80" aria-hidden />
                    Entrar
                  </span>
                )}
              </Button>
            </form>

            {/* Mobile: resumo curto dos pilares */}
            <ul className="mt-8 space-y-3 lg:hidden">
              {PILARES.map(({ icon: Icon, title }) => (
                <li
                  key={title}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-300"
                >
                  <Icon className="size-4 text-orange-300" aria-hidden />
                  {title}
                </li>
              ))}
            </ul>

            <p className="mt-7 text-center text-[11px] tracking-wide text-slate-500 lg:text-left">
              {brand.name} · v2.3 · {environmentLabel()}
              {APP_ENV !== "producao" ? (
                <>
                  {" · "}
                  <span className="font-semibold tracking-wider text-amber-400">
                    {environmentLabel().toUpperCase()}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
