import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Leaf } from "lucide-react";
import { useSession } from "@/lib/auth";

// A home direciona para o painel (logado) ou para a tela de entrada.
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: session, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    navigate({ to: session ? "/dashboard" : "/auth", replace: true });
  }, [isLoading, session, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Leaf className="h-7 w-7" />
        </span>
        <p className="font-display text-lg font-semibold">B&D Produtos Naturais</p>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </div>
  );
}
