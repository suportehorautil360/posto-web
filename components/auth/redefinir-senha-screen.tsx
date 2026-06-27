"use client";

import Link from "next/link";
import { ArrowLeft, Fuel } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AppHeader } from "@/components/auth/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redefinirSenha } from "@/features/auth/api";

function RedefinirSenhaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!token) {
      setErro("Link inválido. Solicite um novo e-mail de recuperação.");
      return;
    }
    if (novaSenha.length < 4) {
      setErro("A senha deve ter no mínimo 4 caracteres.");
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }

    setSalvando(true);
    try {
      const msg = await redefinirSenha(token, novaSenha);
      setSucesso(msg);
      setTimeout(() => router.replace("/"), 2000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível redefinir.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
    >
      {!token ? (
        <p className="text-sm text-destructive" role="alert">
          Link inválido. Solicite um novo e-mail em &quot;Esqueci minha senha&quot;.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="novaSenha" className="text-xs uppercase tracking-wider text-muted-foreground">
              Nova senha
            </Label>
            <Input
              id="novaSenha"
              name="novaSenha"
              type="password"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              minLength={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmacao" className="text-xs uppercase tracking-wider text-muted-foreground">
              Confirmar senha
            </Label>
            <Input
              id="confirmacao"
              name="confirmacao"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              required
              minLength={4}
            />
          </div>
        </>
      )}
      {sucesso ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          {sucesso} Redirecionando…
        </p>
      ) : null}
      {erro ? (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      ) : null}
      {token ? (
        <Button type="submit" variant="brand" className="h-11 w-full" disabled={salvando}>
          {salvando ? "Salvando…" : "Redefinir senha"}
        </Button>
      ) : null}
      <Link
        href="/"
        className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar ao login
      </Link>
    </form>
  );
}

export function RedefinirSenhaScreen() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-b from-brand to-brand/70 shadow-lg shadow-brand/25">
            <Fuel className="size-7 text-brand-foreground" aria-hidden />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Nova senha</h1>
            <p className="text-sm text-muted-foreground">Defina uma nova senha para o seu acesso</p>
          </div>
        </div>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
          <RedefinirSenhaForm />
        </Suspense>
      </main>
    </div>
  );
}
