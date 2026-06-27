"use client";

import { FileText, Fuel, History, LogOut, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/auth/app-header";
import { PainelHistorico } from "@/components/historico/painel-historico";
import { PainelAbastecimento } from "@/components/fleetfuel/painel-abastecimento";
import {
  PainelMensagens,
  useSuporteResumo,
} from "@/components/mensagens/painel-mensagens";
import { PainelNotas } from "@/components/notas/painel-notas";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";

type Aba = "abastecimento" | "historico" | "notas" | "mensagens";

const ABAS: { id: Aba; label: string; icon: typeof Fuel }[] = [
  { id: "abastecimento", label: "Abastecimento", icon: Fuel },
  { id: "historico", label: "Histórico", icon: History },
  { id: "notas", label: "Notas Fiscais", icon: FileText },
  { id: "mensagens", label: "Mensagens", icon: MessageSquare },
];

export default function HomePage() {
  const router = useRouter();
  const { operador, hydrated, sair } = useSession();
  const [aba, setAba] = useState<Aba>("abastecimento");
  const { resumo, recarregar: recarregarResumo } = useSuporteResumo(
    operador?.postoId,
  );
  const naoLidas = resumo?.unreadCount ?? 0;

  useEffect(() => {
    if (hydrated && !operador) router.replace("/");
  }, [hydrated, operador, router]);
  if (!hydrated || !operador) return null;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader />

      <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
        <span className="text-sm font-medium">{operador.nome}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            sair();
            router.replace("/");
          }}
        >
          <LogOut className="size-4" aria-hidden /> Sair
        </Button>
      </div>

      <nav className="flex gap-1 border-b border-border px-3" aria-label="Seções do painel">
        {ABAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
              aba === id
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            aria-current={aba === id ? "page" : undefined}
          >
            <Icon className="size-4" aria-hidden /> {label}
            {id === "mensagens" && naoLidas > 0 ? (
              <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-brand text-[0.65rem] font-bold text-brand-foreground">
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <main className="flex-1">
        {aba === "abastecimento" ? (
          <PainelAbastecimento />
        ) : aba === "historico" ? (
          <PainelHistorico />
        ) : aba === "notas" ? (
          <PainelNotas />
        ) : aba === "mensagens" ? (
          <PainelMensagens onResumoChange={recarregarResumo} />
        ) : (
          <EmBreve titulo={ABAS.find((a) => a.id === aba)?.label ?? ""} />
        )}
      </main>
    </div>
  );
}

function EmBreve({ titulo }: { titulo: string }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-2 px-4 py-20 text-center">
      <p className="text-sm font-medium">{titulo}</p>
      <p className="text-sm text-muted-foreground">Em breve.</p>
    </div>
  );
}
