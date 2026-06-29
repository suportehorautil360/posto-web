"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/** Renderiza QR nítido (2× resolução) para leitura rápida no celular. */
export function QrCode({ value, size = 280, className }: QrCodeProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 2,
      errorCorrectionLevel: "L",
      color: { dark: "#000000", light: "#ffffff" },
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
        className="mx-auto flex size-[280px] max-w-full items-center justify-center rounded-xl bg-muted text-center text-xs text-muted-foreground"
        style={{ width: size, height: size }}
      >
        Não foi possível gerar o QR.
      </div>
    );
  }

  return (
    <div
      className={`mx-auto w-fit max-w-full rounded-xl bg-white p-3 shadow-sm ring-1 ring-foreground/10 ${className ?? ""}`}
      aria-label="QR Code do abastecimento"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="QR Code do abastecimento"
          width={size}
          height={size}
          className="block max-w-full"
          style={{
            width: size,
            height: size,
            maxWidth: "100%",
            imageRendering: "pixelated",
          }}
        />
      ) : (
        <div
          className="animate-pulse rounded-lg bg-muted"
          style={{ width: size, height: size }}
          aria-hidden
        />
      )}
    </div>
  );
}
