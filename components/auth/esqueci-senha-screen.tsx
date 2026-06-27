"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { AppHeader } from "@/components/auth/app-header";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { esqueciSenha } from "@/features/auth/api";

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
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-7 flex flex-col items-center gap-4 text-center">
          <BrandLogo size="lg" />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Esqueci minha senha</h1>
            <p className="text-sm text-muted-foreground">
              Informe o e-mail cadastrado no seu acesso
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
              E-mail
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="operador@posto.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {mensagem ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              {mensagem}
            </p>
          ) : null}
          {erro ? (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          ) : null}
          <Button type="submit" variant="brand" className="h-11 w-full" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar link"}
          </Button>
          <Link
            href="/"
            className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Voltar ao login
          </Link>
        </form>
      </main>
    </div>
  );
}
