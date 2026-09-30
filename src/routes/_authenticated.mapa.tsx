import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole, useMyProfile } from "@/lib/auth";
import { shortTime } from "@/lib/format";
import { Card, CardContent, Spinner } from "@/components/ui";
import { TeamMap, type MapMarker } from "@/components/TeamMap";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa da Equipe — B&D Produtos Naturais" },
      { name: "description", content: "Localização dos vendedores em tempo real, mediante permissão." },
      { property: "og:title", content: "Mapa da Equipe — B&D Produtos Naturais" },
      { property: "og:description", content: "Localização dos vendedores em tempo real, mediante permissão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapaPage,
});

const SELLER_COLORS = ["#16a34a", "#0891b2", "#65a30d", "#0d9488", "#15803d", "#059669"];
const SUPERVISOR_COLOR = "#b45309";
const ONLINE_MS = 2 * 60_000;

function MapaPage() {
  const { data: role, isLoading: roleLoading } = useMyRole();
  const { data: profile } = useMyProfile();

  const { data, isLoading } = useQuery({
    queryKey: ["mapa", role, profile?.id, profile?.team_id],
    enabled: (role === "owner" || role === "supervisor") && !!profile,
    queryFn: async () => {
      const twelveHoursAgo = new Date(Date.now() - 12 * 3600_000).toISOString();
      const profilesRes =
        role === "owner"
          ? supabase.from("profiles").select("id, full_name, team_id, active")
          : supabase.from("profiles").select("id, full_name, team_id, active").eq("team_id", profile!.team_id!);
      const rolesRes =
        role === "owner"
          ? supabase.from("user_roles").select("user_id, role")
          : Promise.resolve({ data: [] as { user_id: string; role: string }[], error: null });
      const teamsRes = supabase.from("teams").select("id, name");
      const [profiles, pings, roles, teams] = await Promise.all([
        profilesRes,
        supabase.from("location_pings").select("seller_id, latitude, longitude, recorded_at").gte("recorded_at", twelveHoursAgo).order("recorded_at", { ascending: false }).limit(1000),
        rolesRes,
        teamsRes,
      ]);
      if (profiles.error || pings.error) throw new Error("Falha ao carregar o mapa.");

      const people = new Map((profiles.data ?? []).filter((p) => p.active !== false).map((p) => [p.id, p]));
      const roleOf = new Map((roles.data ?? []).map((r) => [r.user_id, r.role]));
      const teamName = new Map((teams.data ?? []).map((t) => [t.id, t.name]));
      const seen = new Set<string>();
      const latest = (pings.data ?? []).filter((p) => {
        if (seen.has(p.seller_id) || !people.has(p.seller_id) || roleOf.get(p.seller_id) === "owner") return false;
        seen.add(p.seller_id);
        return true;
      });
      return { people, roleOf, teamName, latest, loadedAt: Date.now() };
    },
    refetchInterval: 10_000,
  });

  const markers = useMemo<(MapMarker & { isSupervisor: boolean; online: boolean; team: string })[]>(() => {
    if (!data) return [];
    let i = 0;
    return data.latest
      .map((p) => {
        const person = data.people.get(p.seller_id);
        const isSupervisor = data.roleOf.get(p.seller_id) === "supervisor";
        const online = data.loadedAt - new Date(p.recorded_at).getTime() < ONLINE_MS;
        const team = person?.team_id ? data.teamName.get(person.team_id) ?? "" : "";
        return {
          id: p.seller_id,
          label: `${isSupervisor ? "Supervisor · " : ""}${person?.full_name || "Sem nome"}`,
          lat: p.latitude,
          lng: p.longitude,
          color: isSupervisor ? SUPERVISOR_COLOR : SELLER_COLORS[i++ % SELLER_COLORS.length] ?? "#16a34a",
          time: `${online ? "Online agora" : "Visto às " + shortTime(p.recorded_at)}${team ? " · " + team : ""}`,
          big: isSupervisor,
          faded: !online,
          isSupervisor,
          online,
          team,
        };
      })
      .sort((a, b) => Number(b.isSupervisor) - Number(a.isSupervisor) || Number(b.online) - Number(a.online));
  }, [data]);

  if (role === "seller") {
    return <p className="p-8 text-center text-sm text-muted-foreground">O mapa fica disponível para o dono e supervisores.</p>;
  }
  if (roleLoading || isLoading || !data) return <Spinner />;

  const onlineCount = markers.filter((m) => m.online).length;
  const supCount = markers.filter((m) => m.isSupervisor).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Mapa da equipe</h1>
        <p className="text-sm text-muted-foreground">
          {role === "owner" ? "Supervisores e vendedores" : "Vendedores da sua equipe"} com o app aberto. Atualiza sozinho a cada 10 segundos.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:max-w-md">
        <Stat label="Online agora" value={onlineCount} />
        {role === "owner" && <Stat label="Supervisores" value={supCount} />}
        <Stat label="Vendedores" value={markers.length - supCount} />
      </div>

      {markers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
            <MapPin className="h-8 w-8 text-muted-foreground/50" />
            Nenhuma localização recebida nas últimas 12 horas. A equipe precisa abrir o app e autorizar a localização.
          </CardContent>
        </Card>
      ) : (
        <>
          <TeamMap markers={markers} />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {markers.map((m) => (
              <a
                key={m.id}
                href={`https://www.google.com/maps?q=${m.lat},${m.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm shadow-soft hover:border-primary/40"
              >
                <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${m.online ? "" : "opacity-40"}`} style={{ backgroundColor: m.color }} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{m.label}</span>
                  <span className={`block truncate text-xs ${m.online ? "text-primary" : "text-muted-foreground"}`}>{m.time}</span>
                </span>
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Toque num nome para abrir o local no Google Maps.</p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-soft">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
