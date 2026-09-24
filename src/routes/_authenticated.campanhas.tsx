import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole, useMyProfile } from "@/lib/auth";
import { addDays, brl, formatDate, toISODate } from "@/lib/format";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { toast } from "sonner";
import { CalendarDays, Plus } from "lucide-react";
import type { Campaign } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/campanhas")({
  head: () => ({
    meta: [
      { title: "Campanhas — BeD Produtos Naturais" },
      { name: "description", content: "Campanhas de 20 dias com acompanhamento dia a dia." },
      { property: "og:title", content: "Campanhas — BeD Produtos Naturais" },
      { property: "og:description", content: "Campanhas de 20 dias com acompanhamento dia a dia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampanhasPage,
});

function CampanhasPage() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { data: profile } = useMyProfile();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [teamId, setTeamId] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase.from("campaigns").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["teams-for-campaign", role, profile?.team_id],
    enabled: !!role,
    queryFn: async () => {
      if (role === "owner") {
        const { data, error } = await supabase.from("teams").select("id, name, supervisor_id");
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("teams").select("id, name, supervisor_id").eq("id", profile!.team_id!);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Dê um nome para a campanha.");
      const start = new Date(startDate + "T12:00:00");
      const end = addDays(start, 19);
      const supervisorId = role === "supervisor" ? profile!.id : teams?.find((t) => t.id === teamId)?.supervisor_id ?? null;
      if (role !== "supervisor" && !supervisorId) throw new Error("Escolha a equipe da campanha.");

      const { data: maxRow } = await supabase.from("campaigns").select("number").order("number", { ascending: false }).limit(1);
      const nextNumber = (maxRow?.[0]?.number ?? 0) + 1;

      const { error } = await supabase.from("campaigns").insert({
        number: nextNumber,
        name: name.trim(),
        start_date: toISODate(start),
        end_date: toISODate(end),
        supervisor_id: supervisorId,
        status: "ativa",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campanha criada!");
      setOpen(false);
      setName("");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Vendas da campanha selecionada
  const selectedCampaign = campaigns?.find((c) => c.id === (selected ?? campaigns.find((c) => c.status === "ativa")?.id));

  const { data: campaignSales } = useQuery({
    queryKey: ["campaign-sales", selectedCampaign?.id],
    enabled: !!selectedCampaign,
    queryFn: async () => {
      const [sales, profiles] = await Promise.all([
        supabase.from("sales").select("seller_id, total, day_number").eq("campaign_id", selectedCampaign!.id),
        role === "owner"
          ? supabase.from("profiles").select("id, full_name")
          : supabase.from("profiles").select("id, full_name").eq("team_id", profile!.team_id!),
      ]);
      if (sales.error || profiles.error) throw new Error("Falha ao carregar vendas da campanha.");
      const names = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name]));
      return { sales: sales.data!, names };
    },
  });

  const daysSummary = useMemo(() => {
    if (!campaignSales) return new Map<number, { total: number; count: number }>();
    const m = new Map<number, { total: number; count: number }>();
    campaignSales.sales.forEach((s) => {
      const d = s.day_number ?? 0;
      const cur = m.get(d) ?? { total: 0, count: 0 };
      cur.total += parseFloat(s.total);
      cur.count += 1;
      m.set(d, cur);
    });
    return m;
  }, [campaignSales]);

  if (roleLoading || isLoading || !campaigns) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Campanhas de 20 dias</h1>
          <p className="text-sm text-muted-foreground">Ciclos de venda com acompanhamento dia a dia</p>
        </div>
        {(role === "owner" || role === "supervisor") && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nova campanha
          </Button>
        )}
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhuma campanha ainda. Crie a primeira!</CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {campaigns.map((c) => {
          const active = c.status === "ativa" && new Date() >= new Date(c.start_date + "T00:00:00") && new Date() <= new Date(c.end_date + "T23:59:59");
          const isSel = selectedCampaign?.id === c.id;
          return (
            <Card key={c.id} className={isSel ? "border-primary" : ""}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-medium">
                    Campanha #{String(c.number).padStart(3, "0")} {c.name ? `· ${c.name}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(c.start_date)} → {formatDate(c.end_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
                    {active ? "EM ANDAMENTO" : c.status === "ativa" ? "AGENDADA" : "ENCERRADA"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => { setSelected(c.id); setSelectedDay(null); }}>
                    <CalendarDays className="h-3.5 w-3.5" /> Ver dias
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedCampaign && campaignSales && (
        <Card>
          <CardHeader>
            <CardTitle>Campanha #{String(selectedCampaign.number).padStart(3, "0")} — dia a dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((d) => {
                const info = daysSummary.get(d);
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(selectedDay === d ? null : d)}
                    className={`rounded-lg border p-2 text-center transition-colors ${
                      selectedDay === d ? "border-primary bg-secondary" : "border-border hover:bg-accent"
                    }`}
                  >
                    <p className="text-[10px] uppercase text-muted-foreground">Dia {String(d).padStart(2, "0")}</p>
                    <p className="text-xs font-semibold">{info ? brl(info.total) : "—"}</p>
                  </button>
                );
              })}
            </div>

            {selectedDay && (
              <div className="rounded-xl border border-border">
                <div className="border-b border-border px-4 py-2 text-sm font-medium">Dia {String(selectedDay).padStart(2, "0")}</div>
                <div className="divide-y divide-border">
                  {campaignSales.sales
                    .filter((s) => (s.day_number ?? 0) === selectedDay)
                    .reduce((rows, s) => {
                      const key = s.seller_id;
                      const cur = rows.get(key) ?? { name: campaignSales.names.get(key) ?? "—", total: 0, count: 0 };
                      cur.total += parseFloat(s.total);
                      cur.count += 1;
                      rows.set(key, cur);
                      return rows;
                    }, new Map<string, { name: string; total: number; count: number }>())
                    .size === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">Nenhuma venda neste dia.</p>}
                  {[...campaignSales.sales
                    .filter((s) => (s.day_number ?? 0) === selectedDay)
                    .reduce((rows, s) => {
                      const key = s.seller_id;
                      const cur = rows.get(key) ?? { name: campaignSales.names.get(key) ?? "—", total: 0, count: 0 };
                      cur.total += parseFloat(s.total);
                      cur.count += 1;
                      rows.set(key, cur);
                      return rows;
                    }, new Map<string, { name: string; total: number; count: number }>())
                    .entries()].map(([id, r]) => (
                    <div key={id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="font-medium">{r.name}</span>
                      <span>
                        {r.count} venda(s) · {brl(r.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nova campanha de 20 dias">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Nome</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Outono 2026" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-start">Início</Label>
            <Input id="c-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          {role === "owner" && (
            <div className="space-y-1.5">
              <Label htmlFor="c-team">Equipe</Label>
              <select
                id="c-team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm"
              >
                <option value="">Escolha a equipe…</option>
                {teams?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Duração: {formatDate(startDate + "T12:00:00")} → {formatDate(toISODate(addDays(new Date(startDate + "T12:00:00"), 19)))}
          </p>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? "Criando…" : "Criar campanha"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
