import { Link, useRouter } from "@tanstack/react-router";
import { Leaf, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui";
import { useMyProfile, useMyRole, useSession, type AppRole } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const roleLabels: Record<AppRole, string> = {
  owner: "Dono",
  supervisor: "Supervisor",
  seller: "Vendedor",
};

const navByRole: Record<AppRole, { to: string; label: string }[]> = {
  owner: [
    { to: "/dashboard", label: "Painel" },
    { to: "/produtos", label: "Produtos" },
    { to: "/equipe", label: "Equipes" },
    { to: "/vendas", label: "Vendas" },
    { to: "/campanhas", label: "Campanhas" },
    { to: "/mapa", label: "Mapa" },
    { to: "/historico", label: "Histórico" },
    { to: "/diagnostico", label: "Diagnóstico" },
  ],
  supervisor: [
    { to: "/dashboard", label: "Painel" },
    { to: "/equipe", label: "Minha equipe" },
    { to: "/vendas", label: "Vendas" },
    { to: "/campanhas", label: "Campanhas" },
    { to: "/mapa", label: "Mapa" },
  ],
  seller: [
    { to: "/dashboard", label: "Painel" },
    { to: "/vender", label: "Vender" },
    { to: "/vendas", label: "Minhas vendas" },
  ],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { data: role } = useMyRole();
  const { data: profile } = useMyProfile();
  const router = useRouter();

  const nav = role ? navByRole[role] : navByRole.seller;

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta.");
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              BeD <span className="hidden sm:inline text-muted-foreground font-sans text-sm font-medium">Produtos Naturais</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-secondary text-secondary-foreground hover:bg-secondary" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{profile?.full_name ?? session?.user?.email}</p>
              <p className="text-xs text-muted-foreground">{role ? roleLabels[role] : "…"}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent",
              )}
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
