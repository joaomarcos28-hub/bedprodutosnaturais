import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/lib/auth";
import { brl, formatDateTime, paymentLabel, startOfToday } from "@/lib/format";
import { Badge, Card, CardContent, Spinner } from "@/components/ui";
import { HandCoins } from "lucide-react";
import type { Sale } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas — B&D Produtos Naturais" },
      { name: "description", content: "Registro de vendas da equipe porta a porta." },
      { property: "og:title", content: "Vendas — B&D Produtos Naturais" },
      { property: "og:description", content: "Registro de vendas da equipe porta a porta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VendasPage,
});

interface SaleRow extends Sale {
  seller: { full_name: string } | null;
}

function VendasPage() {
  const { data: role, isLoading: roleLoading } = useMyRole();

  const { data: sales, isLoading } = useQuery({
    queryKey: ["sales", role],
    enabled: !!role,
    queryFn: async (): Promise<SaleRow[]> => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, seller:profiles!sales_seller_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as unknown as SaleRow[];
    },
    refetchInterval: 20_000,
  });

  if (roleLoading || isLoading || !sales) return <Spinner />;

  const today = startOfToday();
  const totalHoje = sales.filter((s) => s.created_at >= today).reduce((acc, s) => acc + Number(s.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{role === "seller" ? "Minhas vendas" : "Vendas"}</h1>
          <p className="text-sm text-muted-foreground">Vendas de hoje: {brl(totalHoje)}</p>
        </div>
        {role === "seller" && (
          <Link to="/vender" className="inline-flex">
            <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
              <HandCoins className="h-4 w-4" /> Nova venda
            </span>
          </Link>
        )}
      </div>

      {sales.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhuma venda registrada ainda.</CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {sales.map((s) => (
          <Link key={s.id} to="/vendas/$id" params={{ id: s.id }} className="block">
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{s.customer_name || "Cliente não informado"}</p>
                  <p className="text-xs text-muted-foreground">
                    {role === "seller" ? "" : `${s.seller?.full_name ?? "—"} · `}
                    {formatDateTime(s.created_at)} · {paymentLabel(s.payment_method)}
                    {s.day_number ? ` · Dia ${s.day_number}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.photo_url && <Badge className="bg-secondary text-secondary-foreground">com foto</Badge>}
                  {s.signature_url && <Badge className="bg-secondary text-secondary-foreground">assinado</Badge>}
                  <span className="font-display text-lg font-semibold">{brl(s.total)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
