import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, ShoppingBag, Trash2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole, useMyProfile } from "@/lib/auth";
import { formatDateTime, movementLabels } from "@/lib/format";
import { Badge, Button, Card, CardContent, Spinner } from "@/components/ui";
import type { Movement } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — B&D Produtos Naturais" },
      { name: "description", content: "Histórico de todas as movimentações de estoque e vendas." },
      { property: "og:title", content: "Histórico — B&D Produtos Naturais" },
      { property: "og:description", content: "Histórico de todas as movimentações de estoque e vendas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoricoPage,
});

const typeStyles: Record<string, string> = {
  entrada_central: "bg-success/15 text-success",
  saida_central: "bg-destructive/10 text-destructive",
  entrega_vendedor: "bg-accent text-accent-foreground",
  venda: "bg-secondary text-secondary-foreground",
};

function HistoricoPage() {
  const { data: role } = useMyRole();
  const { data: profile } = useMyProfile();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("todos");

  const clear = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("clear_movements");
      if (error) throw error;
      return data;
    },
    onSuccess: (n) => {
      toast.success(`Histórico limpo (${n ?? 0} registros).`);
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["movements", role, profile?.id],
    enabled: !!role && !!profile,
    queryFn: async () => {
      const movementsRes = supabase
        .from("movements")
        .select("*, product:products(name)")
        .order("created_at", { ascending: false })
        .limit(300);

      let profilesRes;
      if (role === "owner") {
        profilesRes = supabase.from("profiles").select("id, full_name");
      } else if (role === "supervisor") {
        profilesRes = supabase.from("profiles").select("id, full_name").eq("team_id", profile!.team_id!);
      } else {
        profilesRes = supabase.from("profiles").select("id, full_name").eq("id", profile!.id);
      }

      const [movements, profiles] = await Promise.all([movementsRes, profilesRes]);
      if (movements.error || profiles.error) throw new Error("Falha ao carregar o histórico.");
      const names = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name]));
      return { movements: movements.data as (Movement & { product: { name: string } | null })[], names };
    },
  });

  if (isLoading || !data) return <Spinner />;

  const counts = (t: string) => data.movements.filter((m) => m.type === t).reduce((a, m) => a + m.quantity, 0);
  const stats = [
    { key: "entrada_central", label: "Entradas", icon: ArrowDownToLine, value: counts("entrada_central") },
    { key: "saida_central", label: "Saídas", icon: ArrowUpFromLine, value: counts("saida_central") },
    { key: "entrega_vendedor", label: "Entregas", icon: Truck, value: counts("entrega_vendedor") },
    { key: "venda", label: "Vendidos", icon: ShoppingBag, value: counts("venda") },
  ];
  const rows = filter === "todos" ? data.movements : data.movements.filter((m) => m.type === filter);
  const who = (m: (typeof rows)[number]) =>
    m.type === "venda" && m.seller_id
      ? (data.names.get(m.seller_id) ?? "Vendedor")
      : `${m.actor_id ? (data.names.get(m.actor_id) ?? "—") : "—"}${m.seller_id ? ` → ${data.names.get(m.seller_id) ?? "—"}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administração</p>
          <h1 className="font-display text-2xl font-semibold">Histórico de movimentações</h1>
          <p className="text-sm text-muted-foreground">Últimos {data.movements.length} registros de estoque e vendas.</p>
        </div>
        {role === "owner" && data.movements.length > 0 && (
          <Button
            variant="outline"
            className="text-destructive"
            disabled={clear.isPending}
            onClick={() => {
              if (confirm("Limpar todo o histórico de movimentações? Isso não pode ser desfeito. Vendas e estoque não são alterados.")) clear.mutate();
            }}
          >
            <Trash2 className="h-4 w-4" /> {clear.isPending ? "Limpando…" : "Limpar histórico"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setFilter(filter === s.key ? "todos" : s.key)}
            className={`rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors ${filter === s.key ? "border-primary ring-2 ring-primary/20" : "border-border hover:bg-secondary"}`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wide">{s.label}</span>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="font-display mt-2 text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted-foreground">unidades</p>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhuma movimentação.</CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 text-right font-semibold">Qtd.</th>
                  <th className="px-4 py-3 font-semibold">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((m) => (
                  <tr key={m.id} className="hover:bg-secondary/40">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateTime(m.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge className={typeStyles[m.type] ?? "bg-muted text-muted-foreground"}>{movementLabels[m.type] ?? m.type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{m.product?.name ?? "produto removido"}</td>
                    <td className="px-4 py-3 text-right font-display font-semibold">{m.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground">{who(m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-border md:hidden">
            {rows.map((m) => (
              <li key={m.id} className="space-y-1 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Badge className={typeStyles[m.type] ?? "bg-muted text-muted-foreground"}>{movementLabels[m.type] ?? m.type}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDateTime(m.created_at)}</span>
                </div>
                <p className="font-medium">{m.quantity}× {m.product?.name ?? "produto removido"}</p>
                <p className="text-xs text-muted-foreground">{who(m)}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
