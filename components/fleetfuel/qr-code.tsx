"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/** Renderiza QR nítido (canvas 2× + quiet zone) para leitura rápida no celular. */
export function QrCode({ value, size = 320, className }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ativo = true;
    const pixelSize = Math.round(size * 2);

    QRCode.toCanvas(canvas, value, {
      width: pixelSize,
      margin: 2,
      errorCorrectionLevel: "L",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(() => {
        if (ativo) setErro(false);
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
      className={`rounded-xl bg-white p-3 shadow-sm ring-1 ring-foreground/10 ${className ?? ""}`}
      style={{ width: size + 24, height: size + 24 }}
      aria-label="QR Code do abastecimento"
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="block"
        style={{
          width: size,
          height: size,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
