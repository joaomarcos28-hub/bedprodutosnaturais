import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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

const palette = ["#16a34a", "#2563eb", "#ea580c", "#dc2626", "#7c3aed", "#0891b2"];

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
          ? supabase.from("profiles").select("id, full_name, team_id")
          : supabase.from("profiles").select("id, full_name, team_id").eq("team_id", profile!.team_id!);

      const [profiles, pings] = await Promise.all([
        profilesRes,
        role === "owner"
          ? supabase.from("location_pings").select("*").gte("recorded_at", twelveHoursAgo).order("recorded_at", { ascending: false }).limit(500)
          : supabase.from("location_pings").select("*").gte("recorded_at", twelveHoursAgo).order("recorded_at", { ascending: false }).limit(500),
      ]);
      if (profiles.error || pings.error) throw new Error("Falha ao carregar o mapa.");

      const names = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name]));
      const seen = new Set<string>();
      const latest = (pings.data ?? []).filter((p) => {
        if (seen.has(p.seller_id)) return false;
        seen.add(p.seller_id);
        return names.has(p.seller_id);
      });

      return { names, latest };
    },
    refetchInterval: 10_000,
  });

  if (roleLoading || isLoading || !data) return <Spinner />;
  if (role === "seller") {
    return <p className="p-8 text-center text-sm text-muted-foreground">O mapa fica disponível para o dono e supervisores.</p>;
  }

  const markers: MapMarker[] = data.latest.map((p, i) => ({
    id: p.seller_id,
    label: data.names.get(p.seller_id) ?? "Vendedor",
    lat: p.latitude,
    lng: p.longitude,
    color: palette[i % palette.length] ?? "#16a34a",
    time: `Visto às ${shortTime(p.recorded_at)}`,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Mapa da equipe</h1>
        <p className="text-sm text-muted-foreground">
          Localização em tempo real dos vendedores com o app aberto. Atualiza a cada 10s.
        </p>
      </div>

      {markers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
            <MapPin className="h-8 w-8 text-muted-foreground/50" />
            Nenhuma localização recebida ainda. Os vendedores precisam autorizar o compartilhamento no app deles.
          </CardContent>
        </Card>
      ) : (
        <>
          <TeamMap markers={markers} />
          <div className="flex flex-wrap gap-3">
            {markers.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm shadow-sm border border-border">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: m.color }} />
                {m.label} · {m.time}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
