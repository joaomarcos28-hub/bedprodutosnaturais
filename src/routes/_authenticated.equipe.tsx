import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createTeamUser } from "@/lib/users.functions";
import { useMyRole, useMyProfile, useMyTeam } from "@/lib/auth";
import { brl, startOfToday } from "@/lib/format";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { QtyPicker } from "@/components/QtyPicker";
import { toast } from "sonner";
import { HandCoins, PackagePlus, UserPlus, Users } from "lucide-react";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Equipes — B&D Produtos Naturais" },
      { name: "description", content: "Supervisores, vendedores e entrega de estoque." },
      { property: "og:title", content: "Equipes — B&D Produtos Naturais" },
      { property: "og:description", content: "Supervisores, vendedores e entrega de estoque." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EquipePage,
});

function EquipePage() {
  const { data: role, isLoading } = useMyRole();
  if (isLoading || !role) return <Spinner />;
  if (role === "owner") return <OwnerTeams />;
  if (role === "supervisor") return <SupervisorTeam />;
  return <p className="p-8 text-center text-sm text-muted-foreground">Vendedores acompanham suas vendas na página “Minhas vendas”.</p>;
}

/* ---------------- Dono ---------------- */

function OwnerTeams() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"supervisor" | "seller" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["teams-owner"],
    queryFn: async () => {
      const [teams, profiles, roles] = await Promise.all([
        supabase.from("teams").select("*").order("name"),
        supabase.from("profiles").select("id, full_name, team_id"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (teams.error || profiles.error || roles.error) throw new Error("Falha ao carregar equipes.");
      return { teams: teams.data!, profiles: profiles.data!, roles: roles.data! };
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      if (modal === "supervisor") {
        if (!name.trim() || !email.trim() || !teamName.trim()) throw new Error("Preencha nome, e-mail e nome da equipe.");
        return createTeamUser({ data: { fullName: name, email, role: "supervisor", teamName } });
      }
      if (!name.trim() || !email.trim() || !teamId) throw new Error("Preencha nome, e-mail e escolha a equipe.");
      return createTeamUser({ data: { fullName: name, email, role: "seller", teamId } });
    },
    onSuccess: (res) => {
      setCreated({ email, password: res.tempPassword });
      setModal(null);
      setName("");
      setEmail("");
      setTeamName("");
      setTeamId("");
      queryClient.invalidateQueries({ queryKey: ["teams-owner"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <Spinner />;

  const profileById = new Map(data.profiles.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Supervisores e equipes</h1>
          <p className="text-sm text-muted-foreground">Cada equipe tem um supervisor e seus vendedores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModal("supervisor")}>
            <UserPlus className="h-4 w-4" /> Novo supervisor
          </Button>
          <Button onClick={() => setModal("seller")}>
            <UserPlus className="h-4 w-4" /> Novo vendedor
          </Button>
        </div>
      </div>

      {data.teams.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma equipe ainda. Crie um supervisor para começar.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {data.teams.map((t) => {
          const supervisor = t.supervisor_id ? profileById.get(t.supervisor_id) : null;
          const members = data.profiles.filter((p) => p.team_id === t.id && p.id !== t.supervisor_id);
          return (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> {t.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  Supervisor: <strong>{supervisor?.full_name ?? "—"}</strong>
                </p>
                <p className="text-xs text-muted-foreground">{members.length} vendedor(es)</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {members.map((m) => (
                    <Badge key={m.id} className="bg-secondary text-secondary-foreground">
                      {m.full_name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal open={modal === "supervisor"} onClose={() => setModal(null)} title="Cadastrar supervisor">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createUser.mutate();
          }}
        >
          <Field label="Nome" value={name} onChange={setName} placeholder="Carlos Souza" />
          <Field label="E-mail" value={email} onChange={setEmail} placeholder="carlos@bed.com.br" type="email" />
          <Field label="Nome da equipe" value={teamName} onChange={setTeamName} placeholder="Equipe União" />
          <Button type="submit" className="w-full" disabled={createUser.isPending}>
            {createUser.isPending ? "Criando…" : "Cadastrar supervisor"}
          </Button>
        </form>
      </Modal>

      <Modal open={modal === "seller"} onClose={() => setModal(null)} title="Cadastrar vendedor">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createUser.mutate();
          }}
        >
          <Field label="Nome" value={name} onChange={setName} placeholder="Carlos Souza" />
          <Field label="E-mail" value={email} onChange={setEmail} placeholder="carlos@bed.com.br" type="email" />
          <div className="space-y-1.5">
            <Label htmlFor="team">Equipe</Label>
            <select
              id="team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Escolha a equipe…</option>
              {data.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={createUser.isPending}>
            {createUser.isPending ? "Criando…" : "Cadastrar vendedor"}
          </Button>
        </form>
      </Modal>

      <Modal open={!!created} onClose={() => setCreated(null)} title="Conta criada!">
        {created && (
          <div className="space-y-3 text-sm">
            <p>Envie estes dados para a pessoa entrar no app:</p>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p>
                <strong>E-mail:</strong> {created.email}
              </p>
              <p>
                <strong>Senha inicial:</strong> {created.password}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Essa senha aparece só uma vez. A pessoa pode trocá-la depois.</p>
            <Button className="w-full" onClick={() => setCreated(null)}>
              Entendi
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} />
    </div>
  );
}

/* ---------------- Supervisor ---------------- */

function SupervisorTeam() {
  const { data: profile } = useMyProfile();
  const { data: team } = useMyTeam();
  const teamId = profile?.team_id ?? null;
  const queryClient = useQueryClient();
  const [deliverFor, setDeliverFor] = useState<{ id: string; name: string } | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["team-supervisor", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const t = startOfToday();
      const [members, stock, products, salesToday] = await Promise.all([
        supabase.from("profiles").select("id, full_name").eq("team_id", teamId!).neq("id", profile!.id),
        supabase.from("seller_stock").select("seller_id, product_id, quantity"),
        supabase.from("products").select("id, name, sale_price, central_stock").gt("central_stock", 0).order("name"),
        supabase.from("sales").select("seller_id, total").gte("created_at", t),
      ]);
      if (members.error || stock.error || products.error || salesToday.error) throw new Error("Falha ao carregar equipe.");
      return { members: members.data!, stock: stock.data!, products: products.data as Product[], salesToday: salesToday.data! };
    },
    refetchInterval: 20_000,
  });

  const deliver = useMutation({
    mutationFn: async () => {
      if (!deliverFor) return;
      const items = Object.entries(qtys)
        .filter(([, q]) => q > 0)
        .map(([product_id, quantity]) => ({ product_id, quantity }));
      if (items.length === 0) throw new Error("Escolha ao menos 1 produto.");
      const { error } = await supabase.rpc("deliver_to_seller", { p_seller_id: deliverFor.id, p_items: items });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entrega registrada!");
      setDeliverFor(null);
      setQtys({});
      queryClient.invalidateQueries({ queryKey: ["team-supervisor"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!teamId) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Você ainda não está vinculado a uma equipe. Peça ao dono para vincular sua conta.
        </CardContent>
      </Card>
    );
  }
  if (isLoading || !data) return <Spinner />;

  const sellerNames = new Map(data.members.map((m) => [m.id, m.full_name]));
  const totalDelivered = data.salesToday.reduce((s, r) => s + Number(r.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Minha equipe</h1>
        <p className="text-sm text-muted-foreground">
          {team?.name} · {data.members.length} vendedor(es) · vendas de hoje {brl(totalDelivered)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.members.map((m) => {
          const units = data.stock.filter((r) => r.seller_id === m.id).reduce((s, r) => s + r.quantity, 0);
          const vendas = data.salesToday.filter((s) => s.seller_id === m.id).reduce((s, r) => s + Number(r.total), 0);
          return (
            <Card key={m.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {units} un. com ele · vendas hoje {brl(vendas)}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setDeliverFor({ id: m.id, name: m.full_name });
                    setQtys({});
                  }}
                >
                  <PackagePlus className="h-4 w-4" /> Entregar estoque
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {data.members.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nenhum vendedor na equipe. Peça ao dono para cadastrar.
            </CardContent>
          </Card>
        )}
      </div>

      <Modal open={!!deliverFor} onClose={() => setDeliverFor(null)} title={`Saída de estoque — ${deliverFor?.name ?? ""}`}>
        <div className="space-y-3">
          {data.products.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">central: {p.central_stock} un. · {brl(p.sale_price)}</p>
              </div>
              <QtyPicker value={qtys[p.id] ?? 0} onChange={(v) => setQtys({ ...qtys, [p.id]: Math.max(0, Math.min(v, p.central_stock)) })} />
            </div>
          ))}
          <Button className="w-full" onClick={() => deliver.mutate()} disabled={deliver.isPending}>
            <HandCoins className="h-4 w-4" /> {deliver.isPending ? "Confirmando…" : "Confirmar entrega"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

