import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole, useMyProfile, useMyTeam } from "@/lib/auth";
import { brl, formatDateTime } from "@/lib/format";
import { Badge, Card, CardContent, CardHeader, CardTitle, Spinner } from "@/components/ui";
import { AlertTriangle, ArrowLeftRight, Boxes, Coins, HandCoins, MapPin, PackageCheck, TrendingUp, Truck, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — BeD Produtos Naturais" },
      { name: "description", content: "Visão geral do estoque e das vendas da BeD Produtos Naturais." },
      { property: "og:title", content: "Painel — BeD Produtos Naturais" },
      { property: "og:description", content: "Visão geral do estoque e das vendas da BeD Produtos Naturais." },
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
      const [products, stock, salesToday, teams, profiles, campaigns, itemsToday, topItems] = await Promise.all([
        supabase.from("products").select("id, name, central_stock, low_stock_threshold, sale_price"),
        supabase.from("seller_stock").select("quantity"),
        supabase.from("sales").select("total").gte("created_at", t),
        supabase.from("teams").select("id"),
        supabase.from("profiles").select("id, team_id"),
        supabase.from("campaigns").select("id").eq("status", "ativa"),
        supabase.from("sale_items").select("quantity, sales!inner(created_at)").gte("sales.created_at", t),
        supabase.from("sale_items").select("quantity, product:products(name)").order("quantity", { ascending: false }).limit(500),
      ]);
      if (products.error || stock.error || salesToday.error || teams.error || profiles.error || campaigns.error || itemsToday.error || topItems.error) {
        throw new Error("Falha ao carregar o painel.");
      }
      return { products: products.data!, stock: stock.data!, salesToday: salesToday.data!, teams: teams.data!, profiles: profiles.data!, campaigns: campaigns.data!, itemsToday: itemsToday.data!, topItems: topItems.data! };
    },
    refetchInterval: 30_000,
  });

  if (isLoading || !data) return <Spinner />;

  const totalCentral = data.products.reduce((s, p) => s + p.central_stock, 0);
  const totalField = data.stock.reduce((s, r) => s + r.quantity, 0);
  const vendasHoje = data.salesToday.reduce((s, r) => s + Number(r.total), 0);
  const vendidosHoje = data.itemsToday.reduce((s, r) => s + r.quantity, 0);
  const sellers = data.profiles.filter((p) => p.team_id !== null).length;
  const low = data.products.filter((p) => p.central_stock <= p.low_stock_threshold);

  const topProducts = new Map<string, number>();
  data.topItems.forEach((i) => {
    const name = (i.product as { name: string } | null)?.name ?? "Produto removido";
    topProducts.set(name, (topProducts.get(name) ?? 0) + i.quantity);
  });
  const best = [...topProducts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Dashboard geral</h1>
        <p className="text-sm text-muted-foreground">Visão completa da operação</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat icon={<Boxes className="h-5 w-5" />} label="Estoque central" value={`${totalCentral} un.`} />
        <Stat icon={<Truck className="h-5 w-5" />} label="Estoque em campo" value={`${totalField} un.`} tone="bg-accent text-accent-foreground" />
        <Stat icon={<Coins className="h-5 w-5" />} label="Vendas hoje" value={brl(vendasHoje)} tone="bg-success text-success-foreground" />
        <Stat icon={<PackageCheck className="h-5 w-5" />} label="Produtos vendidos hoje" value={`${vendidosHoje}`} />
        <Stat icon={<Users className="h-5 w-5" />} label="Supervisores" value={`${data.teams.length}`} />
        <Stat icon={<Truck className="h-5 w-5" />} label="Vendedores em campo" value={`${sellers}`} />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="Campanhas ativas" value={`${data.campaigns.length}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Estoque baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {low.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto abaixo do mínimo. Tudo em ordem!</p>}
            {low.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-warning/10 px-3 py-2">
                <span className="text-sm font-medium">{p.name}</span>
                <Badge className="bg-warning text-warning-foreground">{p.central_stock} un.</Badge>
              </div>
            ))}
            <Link to="/produtos" className="block pt-1 text-sm font-medium text-primary hover:underline">
              Gerenciar produtos →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Mais vendidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {best.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há vendas registradas.</p>}
            {best.map(([name, qty]) => (
              <div key={name} className="flex items-center justify-between px-1 py-1">
                <span className="text-sm">{name}</span>
                <Badge className="bg-secondary text-secondary-foreground">{qty} vendidos</Badge>
              </div>
            ))}
            <Link to="/vendas" className="block pt-1 text-sm font-medium text-primary hover:underline">
              Ver todas as vendas →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickLink to="/produtos" icon={<Boxes className="h-5 w-5" />} label="Produtos e estoque" />
        <QuickLink to="/equipe" icon={<Users className="h-5 w-5" />} label="Supervisores e equipes" />
        <QuickLink to="/mapa" icon={<MapPin className="h-5 w-5" />} label="Mapa das equipes" />
        <QuickLink to="/historico" icon={<ArrowLeftRight className="h-5 w-5" />} label="Histórico" />
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function SupervisorDashboard() {
  const { data: profile } = useMyProfile();
  const { data: team } = useMyTeam();
  const teamId = profile?.team_id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-supervisor", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const t = startOfToday();
      const [members, stock, products, salesToday] = await Promise.all([
        supabase.from("profiles").select("id, full_name").eq("team_id", teamId!),
        supabase.from("seller_stock").select("quantity, product_id"),
        supabase.from("products").select("id, sale_price, central_stock"),
        supabase.from("sales").select("total").gte("created_at", t),
      ]);
      if (members.error || stock.error || products.error || salesToday.error) throw new Error("Falha ao carregar.");
      return { members: members.data!, stock: stock.data!, products: products.data!, salesToday: salesToday.data! };
    },
    refetchInterval: 30_000,
  });

  if (!teamId) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Você ainda não está vinculado a uma equipe. Peça ao dono para vincular sua conta a uma equipe.
        </CardContent>
      </Card>
    );
  }
  if (isLoading || !data) return <Spinner />;

  const priceById = new Map(data.products.map((p) => [p.id, Number(p.sale_price)]));
  const stockUnits = data.stock.reduce((s, r) => s + r.quantity, 0);
  const stockValue = data.stock.reduce((s, r) => s + r.quantity * (priceById.get(r.product_id) ?? 0), 0);
  const vendasHoje = data.salesToday.reduce((s, r) => s + Number(r.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Painel do supervisor</h1>
        <p className="text-sm text-muted-foreground">Equipe: {team?.name ?? "—"}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat icon={<Users className="h-5 w-5" />} label="Funcionários" value={`${data.members.length}`} />
        <Stat icon={<Boxes className="h-5 w-5" />} label="Unidades em campo" value={`${stockUnits}`} />
        <Stat icon={<Coins className="h-5 w-5" />} label="Valor do estoque" value={brl(stockValue)} tone="bg-accent text-accent-foreground" />
        <Stat icon={<HandCoins className="h-5 w-5" />} label="Vendas de hoje" value={brl(vendasHoje)} tone="bg-success text-success-foreground" />
        <Stat icon={<Boxes className="h-5 w-5" />} label="Produtos no catálogo" value={`${data.products.length}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe {team?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.members.length === 0 && <p className="text-sm text-muted-foreground">Nenhum vendedor na equipe ainda.</p>}
          {data.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2">
              <span className="text-sm font-medium">{m.full_name}</span>
              <Badge className="bg-card text-muted-foreground">vendedor</Badge>
            </div>
          ))}
          <Link to="/equipe" className="block pt-1 text-sm font-medium text-primary hover:underline">
            Entregar estoque e acompanhar vendedores →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function SellerDashboard() {
  const { data: profile } = useMyProfile();
  const uid = profile?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-seller", uid],
    enabled: !!uid,
    queryFn: async () => {
      const t = startOfToday();
      const [stock, salesToday] = await Promise.all([
        supabase.from("seller_stock").select("quantity, product:products(id, name, sale_price)").gt("quantity", 0),
        supabase.from("sales").select("total, created_at").eq("seller_id", uid!).gte("created_at", t),
      ]);
      if (stock.error || salesToday.error) throw new Error("Falha ao carregar.");
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
