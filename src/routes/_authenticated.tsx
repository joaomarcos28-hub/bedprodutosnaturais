import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthListener, useSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Spinner } from "@/components/ui";

// Layout protegido: exige sessão ativa e prepara o perfil do usuário.
export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data: session, isLoading } = useSession();
  useAuthListener();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const uid = session?.user?.id;

  useEffect(() => {
    if (!isLoading && !session) {
      navigate({ to: "/auth", replace: true });
    }
  }, [isLoading, session, navigate]);

  // Cria perfil e papel na primeira entrada (o primeiro usuário vira dono).
  useEffect(() => {
    if (!uid) return;
    supabase
      .rpc("ensure_profile", { p_full_name: session.user.user_metadata?.full_name ?? "" })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["my-profile", uid] });
        queryClient.invalidateQueries({ queryKey: ["my-role", uid] });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  if (isLoading || !session) {
    return <Spinner className="min-h-screen" />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
