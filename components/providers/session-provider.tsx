"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getSessao, limparSessao, salvarSessao, type Sessao } from "@/lib/session";

interface SessionCtx {
  operador: Sessao | null;
  hydrated: boolean;
  entrar: (s: Sessao) => void;
  sair: () => void;
}

const Ctx = createContext<SessionCtx>({
  operador: null,
  hydrated: false,
  entrar: () => {},
  sair: () => {},
});

export function useSession(): SessionCtx {
  return useContext(Ctx);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [operador, setOperador] = useState<Sessao | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const entrar = useCallback((s: Sessao) => {
    salvarSessao(s);
    setOperador(s);
  }, []);
  const sair = useCallback(() => {
    limparSessao();
    setOperador(null);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setOperador(getSessao());
      setHydrated(true);
    });
  }, []);

  return <Ctx.Provider value={{ operador, hydrated, entrar, sair }}>{children}</Ctx.Provider>;
}
