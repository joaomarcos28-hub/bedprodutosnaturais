import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/lib/auth";
import { brl, formatDateTime, paymentLabel, startOfToday } from "@/lib/format";
import { Badge, Button, Card, CardContent, Spinner } from "@/components/ui";
import { HandCoins, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("delete_sale", { p_sale_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Venda excluída.");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("dashboard") });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [onlyPending, setOnlyPending] = useState(false);
  const markPaid = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      const { error } = await supabase.rpc("mark_sale_paid", { p_sale_id: id, p_paid: paid });
      if (error) throw error;
      return paid;
    },
    onSuccess: (paid) => {
      toast.success(paid ? "Pagamento recebido." : "Marcado como pendente.");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (roleLoading || isLoading || !sales) return <Spinner />;

  const today = startOfToday();
  const totalHoje = sales.filter((s) => s.created_at >= today).reduce((acc, s) => acc + Number(s.total), 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const pendentes = sales.filter((s) => s.payment_method === "prazo" && !s.paid_at);
  const vencidas = pendentes.filter((s) => s.due_date && s.due_date < todayStr);
  const totalReceber = pendentes.reduce((a, s) => a + Number(s.total), 0);
  const shown = onlyPending ? pendentes : sales;

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

      <button
        type="button"
        onClick={() => setOnlyPending((v) => !v)}
        className={`w-full rounded-xl border p-4 text-left transition-colors ${onlyPending ? "border-primary bg-secondary" : "border-border bg-card hover:bg-accent"}`}
      >
        <p className="text-sm text-muted-foreground">A receber (vendas a prazo)</p>
        <p className="font-display text-2xl font-semibold">{brl(totalReceber)}</p>
        <p className="text-xs text-muted-foreground">
          {pendentes.length} em aberto{vencidas.length > 0 ? ` · ${vencidas.length} vencida(s)` : ""} · {onlyPending ? "toque para ver todas" : "toque para ver só estas"}
        </p>
      </button>

      {shown.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">{onlyPending ? "Nada a receber." : "Nenhuma venda registrada ainda."}</CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {shown.map((s) => {
          const isPrazo = s.payment_method === "prazo";
          const overdue = isPrazo && !s.paid_at && !!s.due_date && s.due_date < todayStr;
          return (
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
                  {isPrazo && (
                    <p className={`text-xs font-semibold ${s.paid_at ? "text-primary" : overdue ? "text-destructive" : "text-accent-foreground"}`}>
                      {s.paid_at
                        ? `Recebido em ${new Date(s.paid_at).toLocaleDateString("pt-BR")}`
                        : s.due_date
                          ? `${overdue ? "Vencida" : "Vence"} em ${s.due_date.split("-").reverse().join("/")}`
                          : "Sem vencimento definido"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {s.photo_url && <Badge className="bg-secondary text-secondary-foreground">com foto</Badge>}
                  {s.signature_url && <Badge className="bg-secondary text-secondary-foreground">assinado</Badge>}
                  {isPrazo && (
                    <Button
                      size="sm"
                      variant={s.paid_at ? "ghost" : "outline"}
                      disabled={markPaid.isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markPaid.mutate({ id: s.id, paid: !s.paid_at });
                      }}
                    >
                      {s.paid_at ? "Desfazer" : "Recebido"}
                    </Button>
                  )}
                  <span className="font-display text-lg font-semibold">{brl(s.total)}</span>
                  {role === "owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      aria-label="Excluir venda"
                      disabled={remove.isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`Excluir a venda de ${brl(s.total)}? Os produtos voltam para o estoque do vendedor.`)) remove.mutate(s.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
