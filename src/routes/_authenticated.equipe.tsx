import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createTeamUser, deleteTeam, removeTeamUser, stopTeam } from "@/lib/users.functions";
import { useMyRole, useMyProfile, useMyTeam } from "@/lib/auth";
import { brl, startOfToday } from "@/lib/format";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Spinner } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { QtyPicker } from "@/components/QtyPicker";
import { toast } from "sonner";
import { Camera, HandCoins, PackagePlus, Receipt, Pencil, Square, Trash2, UserPlus, Users, X } from "lucide-react";
import type { Product } from "@/lib/types";

interface TeamRow { id: string; name: string; supervisor_id: string | null }
interface ProfileRow { id: string; full_name: string; team_id: string | null; phone?: string | null }

function EditTeamModal({
  team, profiles, roles, teams, onClose, onSaved,
}: {
  team: TeamRow;
  profiles: ProfileRow[];
  roles: { user_id: string; role: string }[];
  teams: TeamRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supervisorIds = new Set(roles.filter((r) => r.role === "supervisor").map((r) => r.user_id));
  const supervisors = profiles.filter((p) => supervisorIds.has(p.id));
  const [teamName, setTeamName] = useState(team.name);
  const [supervisorId, setSupervisorId] = useState(team.supervisor_id ?? "");
  const current = profiles.find((p) => p.id === supervisorId);
  const [supName, setSupName] = useState(current?.full_name ?? "");
  const members = profiles.filter((p) => p.team_id === team.id && p.id !== team.supervisor_id && !supervisorIds.has(p.id));
  const [moves, setMoves] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: async () => {
      if (!teamName.trim()) throw new Error("Informe o nome da equipe.");
      const { error } = await supabase
        .from("teams")
        .update({ name: teamName.trim(), supervisor_id: supervisorId || null })
        .eq("id", team.id);
      if (error) throw error;
      if (supervisorId) {
        const upd: { team_id: string; full_name?: string } = { team_id: team.id };
        if (supName.trim()) upd.full_name = supName.trim();
        const { error: e2 } = await supabase.from("profiles").update(upd).eq("id", supervisorId);
        if (e2) throw e2;
      }
      for (const [id, target] of Object.entries(moves)) {
        if (target === team.id) continue;
        const { error: e3 } = await supabase.from("profiles").update({ team_id: target || null }).eq("id", id);
        if (e3) throw e3;
      }
    },
    onSuccess: () => {
      toast.success("Equipe atualizada!");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal open onClose={onClose} title={`Editar equipe — ${team.name}`}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <div className="space-y-1.5">
          <Label>Nome da equipe</Label>
          <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Supervisor</Label>
          <select
            value={supervisorId}
            onChange={(e) => {
              setSupervisorId(e.target.value);
              setSupName(profiles.find((p) => p.id === e.target.value)?.full_name ?? "");
            }}
            className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm"
          >
            <option value="">Sem supervisor</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>
        {supervisorId && (
          <div className="space-y-1.5">
            <Label>Nome do supervisor</Label>
            <Input value={supName} onChange={(e) => setSupName(e.target.value)} />
          </div>
        )}
        {members.length > 0 && (
          <div className="space-y-2">
            <Label>Vendedores</Label>
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                <span className="truncate text-sm">{m.full_name}</span>
                <select
                  value={moves[m.id] ?? team.id}
                  onChange={(e) => setMoves({ ...moves, [m.id]: e.target.value })}
                  className="h-9 rounded-lg border border-input bg-card px-2 text-sm"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                  <option value="">Remover da equipe</option>
                </select>
              </div>
            ))}
          </div>
        )}
        <Button type="submit" className="w-full" disabled={save.isPending}>
          {save.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </form>
    </Modal>
  );
}

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
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [editTeam, setEditTeam] = useState<TeamRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["teams-owner"],
    queryFn: async () => {
      const [teams, profiles, roles] = await Promise.all([
        supabase.from("teams").select("*").order("name"),
        supabase.from("profiles").select("id, full_name, team_id").eq("active", true),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (teams.error || profiles.error || roles.error) throw new Error("Falha ao carregar equipes.");
      return { teams: teams.data!, profiles: profiles.data!, roles: roles.data! };
    },
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeTeamUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Excluído. O histórico foi mantido.");
      queryClient.invalidateQueries({ queryKey: ["teams-owner"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const askRemove = (id: string, nome: string, tipo: string) => {
    if (confirm(`Excluir o ${tipo} ${nome}? Ele não poderá mais entrar no app. As vendas e o histórico ficam salvos.`)) remove.mutate(id);
  };

  const delTeam = useMutation({
    mutationFn: (id: string) => deleteTeam({ data: { teamId: id } }),
    onSuccess: () => {
      toast.success("Equipe excluída. O histórico foi mantido.");
      queryClient.invalidateQueries({ queryKey: ["teams-owner"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stop = useMutation({
    mutationFn: (teamId: string) => stopTeam({ data: { teamId } }),
    onSuccess: () => toast.success("Equipe parada. Campanha encerrada e histórico salvo."),
    onError: (e: Error) => toast.error(e.message),
  });

  const createUser = useMutation({
    mutationFn: async () => {
      if (modal === "supervisor") {
        if (!name.trim() || !email.trim() || !teamName.trim()) throw new Error("Preencha nome, e-mail e nome da equipe.");
        return createTeamUser({ data: { fullName: name, email, role: "supervisor", teamName, password } });
      }
      if (!name.trim() || !email.trim() || !teamId) throw new Error("Preencha nome, e-mail e escolha a equipe.");
      return createTeamUser({ data: { fullName: name, email, role: "seller", teamId, password } });
    },
    onSuccess: (res) => {
      setCreated({ email, password: res.tempPassword });
      setModal(null);
      setName("");
      setEmail("");
      setTeamName("");
      setTeamId("");
      setPassword("");
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
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> {t.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditTeam(t)}>
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={stop.isPending}
                    onClick={() => {
                      if (confirm(`Parar a equipe "${t.name}"? A campanha atual será encerrada e todo o histórico fica salvo.`)) stop.mutate(t.id);
                    }}
                  >
                    <Square className="h-4 w-4" /> Parar equipe
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    disabled={delTeam.isPending}
                    onClick={() => {
                      if (confirm(`Excluir a equipe "${t.name}"? O supervisor e os vendedores dela perdem o acesso. As vendas e o histórico ficam salvos.`)) delTeam.mutate(t.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Excluir equipe
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    Supervisor: <strong>{supervisor?.full_name ?? "—"}</strong>
                  </span>
                  {supervisor && (
                    <button
                      type="button"
                      aria-label={`Excluir ${supervisor.full_name}`}
                      className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                      onClick={() => askRemove(supervisor.id, supervisor.full_name, "supervisor")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{members.length} vendedor(es)</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {members.map((m) => (
                    <Badge key={m.id} className="flex items-center gap-1 bg-secondary text-secondary-foreground">
                      {m.full_name}
                      <button
                        type="button"
                        aria-label={`Excluir ${m.full_name}`}
                        className="rounded-full p-0.5 text-destructive hover:bg-destructive/10"
                        onClick={() => askRemove(m.id, m.full_name, "vendedor")}
                      >
                        <X className="h-3 w-3" />
                      </button>
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
          <Field label="Senha de acesso" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" />
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
          <Field label="Senha de acesso" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" />
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

      {editTeam && (
        <EditTeamModal
          team={editTeam}
          profiles={data.profiles}
          roles={data.roles}
          teams={data.teams}
          onClose={() => setEditTeam(null)}
          onSaved={() => {
            setEditTeam(null);
            queryClient.invalidateQueries({ queryKey: ["teams-owner"] });
          }}
        />
      )}

      <Modal open={!!created} onClose={() => setCreated(null)} title="Conta criada!">
        {created && (
          <div className="space-y-3 text-sm">
            <p>Envie estes dados para a pessoa entrar no app:</p>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p>
                <strong>E-mail:</strong> {created.email}
              </p>
              <p>
                <strong>Senha:</strong> {created.password}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Guarde esses dados: a senha não aparece de novo.</p>
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

  const [saleFor, setSaleFor] = useState<{ id: string; name: string } | null>(null);
  const [saleTotal, setSaleTotal] = useState("");
  const [salePay, setSalePay] = useState<"pix" | "dinheiro" | "prazo">("pix");
  const [salePhoto, setSalePhoto] = useState<File | null>(null);
  const [saleCustomer, setSaleCustomer] = useState("");

  const registerSale = useMutation({
    mutationFn: async () => {
      if (!saleFor) return;
      const total = Number(saleTotal.replace(/\./g, "").replace(",", "."));
      if (!total || total <= 0) throw new Error("Informe o valor vendido.");
      let photoPath: string | undefined;
      if (salePhoto) {
        photoPath = `${saleFor.id}/nota-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from("receipts").upload(photoPath, salePhoto, { contentType: salePhoto.type || "image/jpeg" });
        if (upErr) throw new Error("Falha ao enviar a foto da nota.");
      }
      const args: { p_seller_id: string; p_total: number; p_payment: string; p_photo?: string; p_customer?: string } = {
        p_seller_id: saleFor.id, p_total: total, p_payment: salePay,
      };
      if (photoPath) args.p_photo = photoPath;
      if (saleCustomer.trim()) args.p_customer = saleCustomer.trim();
      const { error } = await supabase.rpc("register_sale_for_seller", args);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Venda registrada!");
      setSaleFor(null);
      setSaleTotal("");
      setSalePhoto(null);
      setSaleCustomer("");
      setSalePay("pix");
      queryClient.invalidateQueries({ queryKey: ["team-supervisor"] });
    },
    onError: (e: Error) => toast.error(e.message),
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
                <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setSaleFor({ id: m.id, name: m.full_name })}>
                  <Receipt className="h-4 w-4" /> Registrar venda
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setDeliverFor({ id: m.id, name: m.full_name });
                    setQtys({});
                  }}
                >
                  <PackagePlus className="h-4 w-4" /> Entregar estoque
                </Button>
                </div>
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

      <Modal open={!!saleFor} onClose={() => setSaleFor(null)} title={`Registrar venda — ${saleFor?.name ?? ""}`}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); registerSale.mutate(); }}>
          <div className="space-y-1.5">
            <Label>Valor vendido (R$)</Label>
            <Input inputMode="decimal" value={saleTotal} onChange={(e) => setSaleTotal(e.target.value)} placeholder="150,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["pix", "dinheiro", "prazo"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSalePay(p)}
                  className={`rounded-lg border px-2 py-2.5 text-sm font-medium ${salePay === p ? "border-primary bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"}`}
                >
                  {p === "pix" ? "PIX" : p === "dinheiro" ? "À vista (dinheiro)" : "A prazo"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Cliente (opcional)</Label>
            <Input value={saleCustomer} onChange={(e) => setSaleCustomer(e.target.value)} placeholder="Maria" />
          </div>
          <div className="space-y-1.5">
            <Label>Foto da nota</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
              <Camera className="h-4 w-4" />
              {salePhoto ? salePhoto.name : "Tirar ou escolher foto"}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setSalePhoto(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={registerSale.isPending}>
            {registerSale.isPending ? "Salvando…" : "Salvar venda"}
          </Button>
        </form>
      </Modal>

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

