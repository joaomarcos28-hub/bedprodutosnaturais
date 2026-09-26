import { Link, useRouter } from "@tanstack/react-router";
import { Leaf, LogOut, LayoutDashboard, Package, Users, Receipt, Flag, MapPin, History, Sparkles, ShoppingBag, type LucideIcon } from "lucide-react";
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

const navByRole: Record<AppRole, { to: string; label: string; icon: LucideIcon }[]> = {
  owner: [
    { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { to: "/produtos", label: "Produtos", icon: Package },
    { to: "/equipe", label: "Equipes", icon: Users },
    { to: "/vendas", label: "Vendas", icon: Receipt },
    { to: "/campanhas", label: "Campanhas", icon: Flag },
    { to: "/mapa", label: "Mapa", icon: MapPin },
    { to: "/historico", label: "Histórico", icon: History },
    { to: "/diagnostico", label: "Diagnóstico", icon: Sparkles },
  ],
  supervisor: [
    { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { to: "/equipe", label: "Minha equipe", icon: Users },
    { to: "/vendas", label: "Vendas", icon: Receipt },
    { to: "/campanhas", label: "Campanhas", icon: Flag },
    { to: "/mapa", label: "Mapa", icon: MapPin },
  ],
  seller: [
    { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { to: "/vender", label: "Vender", icon: ShoppingBag },
    { to: "/vendas", label: "Minhas vendas", icon: Receipt },
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
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display whitespace-nowrap text-lg font-semibold tracking-tight">
              B&amp;D <span className="hidden 2xl:inline whitespace-nowrap text-muted-foreground font-sans text-sm font-medium">Produtos Naturais</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/10" }}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
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

      </header>

      <main className="animate-in fade-in slide-in-from-bottom-1 duration-300 mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-10 md:pt-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="flex gap-1 overflow-x-auto px-2 py-1.5">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold text-muted-foreground transition-all active:scale-95",
              )}
              activeProps={{ className: "bg-primary/10 text-primary" }}
            >
              <item.icon className="h-5 w-5" strokeWidth={2.2} />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
