"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { esqueciSenha } from "@/features/auth/api";
import { cn } from "@/lib/utils";

export function EsqueciSenhaScreen() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setEnviando(true);
    try {
      const msg = await esqueciSenha(email);
      setMensagem(msg);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[#070b14]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-glow-pulse absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(249,115,22,0.28),transparent_55%)]" />
        <div className="login-orb login-orb--orange" />
        <div className="login-orb login-orb--sky" />
        <div className="login-orb login-orb--amber" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div
          className={cn(
            "w-full max-w-[420px]",
            "animate-in fade-in-0 slide-in-from-bottom-3 duration-500",
          )}
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-white sm:text-3xl">
              Esqueci minha senha
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
              Informe o e-mail cadastrado no acesso do posto. Enviaremos um link
              para redefinir a senha.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-white/10 bg-[#0d1422]/80 p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75)] backdrop-blur-md sm:p-7"
          >
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
              >
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="operador@posto.com.br"
                className="h-11 rounded-xl border-white/10 bg-white/[0.04] px-3.5 text-[15px] text-slate-100 placeholder:text-slate-500 focus-visible:border-orange-500/50 focus-visible:ring-orange-500/25 dark:bg-white/[0.04]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {mensagem ? (
              <p
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
                role="status"
              >
                {mensagem}
              </p>
            ) : null}
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
              className="h-11 w-full rounded-xl text-[15px] font-semibold shadow-[0_10px_30px_-12px_rgba(249,115,22,0.8)]"
              disabled={enviando}
            >
              {enviando ? (
                "Enviando…"
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Mail className="size-4 opacity-80" aria-hidden />
                  Enviar link
                </span>
              )}
            </Button>
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-orange-300"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Voltar ao login
            </Link>
          </form>
        </div>
      </main>
    </div>
  );
}
