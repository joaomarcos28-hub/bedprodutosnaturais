import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/45 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-border/70 bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-elegant animate-in slide-in-from-bottom-8 duration-300 sm:max-w-lg sm:rounded-3xl sm:p-6 sm:zoom-in-95 sm:slide-in-from-bottom-2">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="font-display text-xl font-semibold leading-tight">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar" className="-mr-2 shrink-0 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
