import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "supervisor" | "seller";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
}

/** Sessão atual (client-side, via localStorage do navegador). */
export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 60_000,
  });
}

/** Mantém a cache de sessão/role sempre atualizada. Usar uma vez no shell. */
export function useAuthListener() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      if (event === "SIGNED_OUT") {
        queryClient.clear();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);
}

/** Papel do usuário logado. O primeiro usuário do sistema é o dono. */
export function useMyRole() {
  const { data: session } = useSession();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ["my-role", uid],
    enabled: !!uid,
    queryFn: async (): Promise<AppRole> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid!);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as AppRole);
      if (roles.includes("owner")) return "owner";
      if (roles.includes("supervisor")) return "supervisor";
      return "seller";
    },
  });
}

export interface MyProfile {
  id: string;
  full_name: string;
  phone: string | null;
  team_id: string | null;
}

export function useMyProfile() {
  const { data: session } = useSession();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ["my-profile", uid],
    enabled: !!uid,
    queryFn: async (): Promise<MyProfile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, team_id")
        .eq("id", uid!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyTeam() {
  const { data: profile } = useMyProfile();
  return useQuery({
    queryKey: ["my-team", profile?.team_id],
    enabled: !!profile?.team_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, supervisor_id")
        .eq("id", profile!.team_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
