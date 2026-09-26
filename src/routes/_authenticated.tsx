import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthListener, useSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Spinner } from "@/components/ui";

// Layout protegido: exige sessão ativa e prepara o perfil do usuário.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useAuthListener();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const uid = session?.user?.id;

  // Cria perfil e papel na primeira entrada (o primeiro usuário vira dono).
  useEffect(() => {
    if (!uid) return;
    supabase
      .rpc("ensure_profile", { p_full_name: (session.user.user_metadata?.["full_name"] as string) ?? "" })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["my-profile", uid] });
        queryClient.invalidateQueries({ queryKey: ["my-role", uid] });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  if (!session) {
    return <Spinner className="min-h-screen" />;
  }


  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
