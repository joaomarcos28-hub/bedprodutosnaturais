import { Instagram, MessageCircle } from "lucide-react";

export function DevCredit({ className = "" }: { className?: string }) {
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-primary transition-colors hover:bg-primary hover:text-primary-foreground";
  return (
    <footer className={`flex items-center justify-center gap-3 py-4 ${className}`}>
      <a href="https://wa.me/5582982346886" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp do desenvolvedor j.marcosapp" title="Desenvolvido por j.marcosapp" className={btn}>
        <MessageCircle className="h-4 w-4" />
      </a>
      <a href="https://instagram.com/j.marcoslds" target="_blank" rel="noopener noreferrer" aria-label="Instagram do desenvolvedor @j.marcoslds" title="Desenvolvido por j.marcosapp" className={btn}>
        <Instagram className="h-4 w-4" />
      </a>
    </footer>
  );
}
