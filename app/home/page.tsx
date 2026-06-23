"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppHeader } from "@/components/auth/app-header";
import { useSession } from "@/components/providers/session-provider";
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
