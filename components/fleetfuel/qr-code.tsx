"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/** Renderiza um QR a partir de `value` (data URL gerada no cliente). */
export function QrCode({ value, size = 240, className }: QrCodeProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0a0a0a", light: "#ffffff" },
    })
      .then((url) => {
        if (!ativo) return;
        setSrc(url);
        setErro(false);
      })
      .catch(() => {
        if (ativo) setErro(true);
      });
    return () => {
      ativo = false;
    };
  }, [value, size]);

  if (erro) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-muted text-center text-xs text-muted-foreground"
        style={{ width: size, height: size }}
      >
        Não foi possível gerar o QR.
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-label="QR Code do abastecimento"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="QR Code do abastecimento" width={size} height={size} className="rounded-xl" />
      ) : (
        <div
          className="animate-pulse rounded-xl bg-muted"
          style={{ width: size, height: size }}
        />
      )}
    </div>
  );
}
