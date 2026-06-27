"use client";

import Link from "next/link";
import { Fuel } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/auth/app-header";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/features/auth/api";
import { environmentLabel } from "@/lib/config/env";

export function LoginScreen() {
  const router = useRouter();
  const { operador, hydrated, entrar } = useSession();
  const [identificador, setIdentificador] = useState("");
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
              Operador do Posto — e-mail ou usuário e senha
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
        >
          <div className="space-y-2">
            <Label
              htmlFor="identificador"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              E-mail ou usuário
            </Label>
            <Input
              id="identificador"
              name="identificador"
              autoComplete="username"
              placeholder="operador@posto.com.br"
              className="font-mono"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
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
          <div className="text-right">
            <Link
              href="/esqueci-senha"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Esqueci minha senha
            </Link>
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
          v2.3 · {environmentLabel()}
        </p>
      </main>
    </div>
  );
}
