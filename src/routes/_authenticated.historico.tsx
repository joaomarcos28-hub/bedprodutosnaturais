import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole, useMyProfile } from "@/lib/auth";
import { formatDateTime, movementLabels } from "@/lib/format";
import { Badge, Card, CardContent, Spinner } from "@/components/ui";
import type { Movement } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — BeD Produtos Naturais" },
      { name: "description", content: "Histórico de todas as movimentações de estoque e vendas." },
      { property: "og:title", content: "Histórico — BeD Produtos Naturais" },
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Histórico de movimentações</h1>
        <p className="text-sm text-muted-foreground">Toda alteração de estoque e venda fica registrada aqui.</p>
      </div>

      {data.movements.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhuma movimentação ainda.</CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {data.movements.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 p-4 text-sm">
              <Badge className={typeStyles[m.type] ?? "bg-muted text-muted-foreground"}>
                {movementLabels[m.type] ?? m.type}
              </Badge>
              <span className="font-medium">
                {m.quantity}× {m.product?.name ?? "produto removido"}
              </span>
              <span className="text-muted-foreground">
                {m.type === "venda" && m.seller_id
                  ? `· ${data.names.get(m.seller_id) ?? "vendedor"}`
                  : m.actor_id
                    ? `· por ${data.names.get(m.actor_id) ?? "—"}`
                    : ""}
                {m.seller_id && m.type !== "venda" ? ` → ${data.names.get(m.seller_id) ?? "—"}` : ""}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(m.created_at)}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
