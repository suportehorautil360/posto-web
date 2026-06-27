"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Badge } from "@/components/ui/badge";
import { APP_ENV, environmentLabel } from "@/lib/config/env";

function Relogio() {
  const [hora, setHora] = useState("");
  useEffect(() => {
    const tick = () =>
      setHora(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    queueMicrotask(tick);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="text-sm tabular-nums text-muted-foreground" suppressHydrationWarning>
      {hora}
    </span>
  );
}

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border px-5 py-3">
      <div className="flex items-center gap-2">
        <BrandLogo size="sm" />
        {APP_ENV !== "producao" ? (
          <Badge
            variant="outline"
            className="ml-1 gap-1 border-warning/40 text-warning"
            aria-label={`Ambiente: ${environmentLabel()}`}
          >
            <AlertTriangle className="size-3" aria-hidden /> {environmentLabel().toUpperCase()}
          </Badge>
        ) : null}
      </div>
      <Relogio />
    </header>
  );
}
