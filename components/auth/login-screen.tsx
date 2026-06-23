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
            <Label
              htmlFor="usuario"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
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
            <Label
              htmlFor="senha"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
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
          <Button
            type="submit"
            variant="brand"
            className="h-11 w-full text-base"
            disabled={verificando}
          >
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
