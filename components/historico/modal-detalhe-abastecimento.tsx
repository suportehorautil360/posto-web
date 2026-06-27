"use client";

import { formatBRL, formatLitros } from "@/features/fleetfuel/format";
import type { AbastecimentoHistorico } from "@/features/abastecimentos/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  item: AbastecimentoHistorico | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="text-sm font-medium text-foreground">{valor}</dd>
    </div>
  );
}

export function ModalDetalheAbastecimento({ item, open, onOpenChange }: Props) {
  if (!item) return null;

  const preco =
    item.precoLitro === null
      ? "—"
      : item.precoLitro.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>Detalhes do abastecimento</DialogTitle>
        <DialogDescription>
          {item.placa} · {item.dataHora}
        </DialogDescription>
      </DialogHeader>

      <DialogContent>
        <dl className="grid grid-cols-2 gap-4">
          <Campo rotulo="Placa" valor={item.placa} />
          <Campo rotulo="Veículo" valor={item.veiculo} />
          <Campo rotulo="Tipo" valor={item.tipoVeiculo} />
          <Campo rotulo="Motorista" valor={item.motorista} />
          <Campo rotulo="Combustível" valor={item.combustivel} />
          <Campo rotulo="Litros" valor={formatLitros(item.litros)} />
          <Campo rotulo="Preço / L" valor={`R$ ${preco}`} />
          <Campo
            rotulo="Total"
            valor={item.valor === null ? "—" : formatBRL(item.valor)}
          />
          <Campo rotulo="Leitura" valor={item.leitura} />
          <Campo rotulo="Local" valor={item.local} />
        </dl>

        {item.meterPhoto ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Foto do medidor
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.meterPhoto}
              alt="Medidor do equipamento"
              className="max-h-48 w-full rounded-lg object-contain ring-1 ring-foreground/10"
            />
          </div>
        ) : null}

        <p className="mt-4 truncate text-[0.65rem] text-muted-foreground">
          ID: {item.id}
        </p>
      </DialogContent>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
