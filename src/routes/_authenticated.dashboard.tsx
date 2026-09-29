import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole, useMyProfile, useMyTeam } from "@/lib/auth";
import { brl, formatDateTime } from "@/lib/format";
import { Badge, Card, CardContent, CardHeader, CardTitle, Spinner } from "@/components/ui";
import { AlertTriangle, ArrowLeftRight, Boxes, Clock, Coins, HandCoins, Instagram, Leaf, MapPin, PackageCheck, Phone, TrendingUp, Truck, Users } from "lucide-react";

function StoreInfo() {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-4 sm:items-center">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Leaf className="h-5 w-5" /></span>
          <p className="font-display font-semibold">B&amp;D Produtos Naturais</p>
        </div>
        <a href="https://wa.me/5582994003591" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-primary"><Phone className="h-4 w-4 text-primary" />(82) 9 9400-3591</a>
        <a href="https://instagram.com/bdprodutos" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-primary"><Instagram className="h-4 w-4 text-primary" />@bdprodutos</a>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4 text-primary" />Horário a definir</p>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — B&D Produtos Naturais" },
      { name: "description", content: "Visão geral do estoque e das vendas da B&D Produtos Naturais." },
      { property: "og:title", content: "Painel — B&D Produtos Naturais" },
      { property: "og:description", content: "Visão geral do estoque e das vendas da B&D Produtos Naturais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: role, isLoading } = useMyRole();
  if (isLoading || !role) return <Spinner />;
  if (role === "owner") return <OwnerDashboard />;
  if (role === "supervisor") return <SupervisorDashboard />;
  return <SellerDashboard />;
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone ?? "bg-secondary text-secondary-foreground"}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-lg font-semibold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function OwnerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-owner"],
    queryFn: async () => {
      const t = startOfToday();
      const [products, stock, salesToday, teams, profiles, campaigns] = await Promise.all([
        supabase.from("products").select("id, name, central_stock, low_stock_threshold, sale_price"),
        supabase.from("seller_stock").select("quantity"),
        supabase.from("sales").select("total").gte("created_at", t),
        supabase.from("teams").select("id"),
        supabase.from("profiles").select("id, role"),
        supabase.from("campaigns").select("id").eq("status", "ativa"),
      ]);

      if (products.error || stock.error || salesToday.error) throw new Error("Falha ao carregar dashboard.");

      const centralUnits = products.data.reduce((s, p) => s + p.central_stock, 0);
      const sellerUnits = stock.data.reduce((s, r) => s + r.quantity, 0);
      const totalSales = salesToday.data.reduce((s, r) => s + Number(r.total), 0);
      const lowStockCount = products.data.filter((p) => p.central_stock <= p.low_stock_threshold).length;
      const sellersCount = profiles.data.filter((p) => p.role === "seller").length;

      return {
        centralUnits,
        sellerUnits,
        totalSales,
        lowStockCount,
        teamsCount: teams.data.length,
        sellersCount,
        campaignsCount: campaigns.data?.length ?? 0,
      };
    },
    refetchInterval: 20_000,
  });

  if (isLoading || !data) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Painel do Dono</h1>
        <p className="text-sm text-muted-foreground">Visão geral da operação B&amp;D Produtos Naturais</p>
      </div>
      <StoreInfo />


      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<HandCoins className="h-5 w-5" />} label="Vendas hoje" value={brl(data.totalSales)} tone="bg-success text-success-foreground" />
        <Stat icon={<Boxes className="h-5 w-5" />} label="Estoque central" value={`${data.centralUnits} un.`} />
        <Stat icon={<Truck className="h-5 w-5" />} label="Estoque com vendedores" value={`${data.sellerUnits} un.`} />
        <Stat icon={<Users className="h-5 w-5" />} label="Vendedores ativos" value={String(data.sellersCount)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lowStockCount > 0 ? (
              <div className="flex items-center justify-between rounded-xl bg-destructive/10 p-3 text-destructive">
                <span className="text-sm font-medium">{data.lowStockCount} produto(s) com estoque baixo no central</span>
                <Link to="/produtos" className="text-xs underline font-semibold">Ver produtos</Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum alerta crítico no momento.</p>
            )}
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
              <span className="text-sm font-medium">Campanhas ativas</span>
              <span className="text-sm font-bold">{data.campaignsCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link to="/produtos" className="flex flex-col items-center justify-center rounded-xl bg-secondary/55 p-4 text-center transition-colors hover:bg-secondary">
              <Boxes className="mb-2 h-5 w-5 text-primary" />
              <span className="text-xs font-semibold">Produtos</span>
            </Link>
            <Link to="/equipe" className="flex flex-col items-center justify-center rounded-xl bg-secondary/55 p-4 text-center transition-colors hover:bg-secondary">
              <Users className="mb-2 h-5 w-5 text-primary" />
              <span className="text-xs font-semibold">Equipes</span>
            </Link>
            <Link to="/vendas" className="flex flex-col items-center justify-center rounded-xl bg-secondary/55 p-4 text-center transition-colors hover:bg-secondary">
              <HandCoins className="mb-2 h-5 w-5 text-primary" />
              <span className="text-xs font-semibold">Vendas</span>
            </Link>
            <Link to="/mapa" className="flex flex-col items-center justify-center rounded-xl bg-secondary/55 p-4 text-center transition-colors hover:bg-secondary">
              <MapPin className="mb-2 h-5 w-5 text-primary" />
              <span className="text-xs font-semibold">Mapa</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SupervisorDashboard() {
  const { data: profile } = useMyProfile();
  const { data: team } = useMyTeam();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-supervisor", team?.id],
    enabled: !!team?.id,
    queryFn: async () => {
      const t = startOfToday();
      const [members, sales] = await Promise.all([
        supabase.from("profiles").select("id, full_name").eq("team_id", team!.id),
        supabase.from("sales").select("total, seller_id").gte("created_at", t),
      ]);

      return { members: members.data ?? [], sales: sales.data ?? [] };
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Painel do Supervisor</h1>
        <p className="text-sm text-muted-foreground">Equipe: {team?.name ?? "Sua equipe"}</p>
      </div>
      <StoreInfo />


      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Users className="h-5 w-5" />} label="Vendedores na equipe" value={String(data?.members.length ?? 0)} />
        <Stat icon={<HandCoins className="h-5 w-5" />} label="Vendas hoje da equipe" value={brl(data?.sales.reduce((s, r) => s + Number(r.total), 0) ?? 0)} tone="bg-success text-success-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data?.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2">
              <span className="text-sm font-medium">{m.full_name || "Vendedor sem nome"}</span>
              <Badge variant="outline">Ativo</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SellerDashboard() {
  const { data: profile } = useMyProfile();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-seller"],
    queryFn: async () => {
      const t = startOfToday();
      const [stock, salesToday] = await Promise.all([
        supabase.from("seller_stock").select("quantity, product:products(name, sale_price)"),
        supabase.from("sales").select("total").gte("created_at", t),
      ]);

      if (stock.error || salesToday.error) throw new Error("Erro ao carregar dados.");
      return { stock: stock.data!, salesToday: salesToday.data! };
    },
    refetchInterval: 20_000,
  });

  if (isLoading || !data) return <Spinner />;

  const units = data.stock.reduce((s, r) => s + r.quantity, 0);
  const vendasHoje = data.salesToday.reduce((s, r) => s + Number(r.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Olá, {profile?.full_name?.split(" ")[0]}!</h1>
        <p className="text-sm text-muted-foreground">Bom trabalho por aí</p>
      </div>
      <StoreInfo />


      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Boxes className="h-5 w-5" />} label="Produtos com você" value={`${units} un.`} />
        <Stat icon={<HandCoins className="h-5 w-5" />} label="Vendas de hoje" value={brl(vendasHoje)} tone="bg-success text-success-foreground" />
      </div>

      <Link
        to="/vender"
        className="flex items-center justify-center gap-2 rounded-xl bg-primary p-4 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        <HandCoins className="h-5 w-5" />
        <span className="font-medium">Nova venda</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Meu estoque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.stock.length === 0 && <p className="text-sm text-muted-foreground">Você ainda não recebeu produtos. Peça ao seu supervisor.</p>}
          {data.stock.map((r) => {
            const p = r.product as { name: string; sale_price: number } | null;
            return (
              <div key={(p?.name ?? "?") + r.quantity} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2">
                <span className="text-sm font-medium">{p?.name ?? "Produto"}</span>
                <span className="text-sm">{r.quantity} un. · {brl(p?.sale_price)}</span>
              </div>
            );
          })}
          <p className="pt-1 text-xs text-muted-foreground">Atualizado às {formatDateTime(new Date().toISOString())}</p>
        </CardContent>
      </Card>
    </div>
  );
}
