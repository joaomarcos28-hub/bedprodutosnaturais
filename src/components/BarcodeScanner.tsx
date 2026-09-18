import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "./ui";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | undefined;
    let stopped = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (result && !stopped) {
          stopped = true;
          try {
            controls?.stop();
          } catch {
            /* ignore */
          }
          onDetected(result.getText());
        }
      })
      .then((c) => {
        controls = c;
        if (stopped) {
          try {
            c.stop();
          } catch {
            /* ignore */
          }
        }
      })
      .catch((e: Error) => {
        setError(
          e.name === "NotAllowedError"
            ? "Permissão de câmera negada. Libere o acesso nas configurações do navegador."
            : "Não foi possível abrir a câmera. Verifique se outro app não está usando.",
        );
      });

    return () => {
      stopped = true;
      try {
        controls?.stop();
      } catch {
        /* ignore */
      }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display flex items-center gap-2 text-lg font-semibold">
            <Camera className="h-5 w-5 text-primary" />
            Aponte para o código de barras
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" />
          </Button>
        </div>
        {error ? (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} className="h-64 w-full object-cover" muted autoPlay playsInline />
          </div>
        )}
        <p className="mt-3 text-center text-xs text-muted-foreground">
          O código é lido automaticamente quando ficará visível na tela.
        </p>
      </div>
    </div>
  );
}
