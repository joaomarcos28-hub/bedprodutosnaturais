import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  email: z.string().email("E-mail inválido"),
  fullName: z.string().min(1, "Informe o nome"),
  role: z.enum(["supervisor", "seller"]),
  teamName: z.string().optional(),
  teamId: z.string().uuid().optional(),
});

/**
 * Dono cadastra um supervisor ou vendedor.
 * Cria a conta, o papel e vincula à equipe (nova ou existente).
 */
export const createTeamUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isOwner, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "owner",
    });
    if (roleError) throw new Error("Falha ao verificar permissões.");
    if (!isOwner) throw new Error("Apenas o dono pode cadastrar usuários.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const tempPassword = `Bed${Math.random().toString(36).slice(2, 8)}7x`;

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Não foi possível criar a conta.");
    }

    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: data.role });
    await supabaseAdmin.from("profiles").insert({ id: created.user.id, full_name: data.fullName });

    if (data.role === "supervisor" && data.teamName) {
      const { data: team } = await supabaseAdmin
        .from("teams")
        .insert({ name: data.teamName, supervisor_id: created.user.id })
        .select()
        .single();
      if (team) {
        await supabaseAdmin.from("profiles").update({ team_id: team.id }).eq("id", created.user.id);
      }
    } else if (data.role === "seller" && data.teamId) {
      await supabaseAdmin.from("profiles").update({ team_id: data.teamId }).eq("id", created.user.id);
    }

    return { userId: created.user.id, tempPassword };
  });

async function assertOwner(context: { supabase: any; userId: string }) {
  const { data: isOwner, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" });
  if (error || !isOwner) throw new Error("Apenas o dono pode fazer isso.");
}

/** Dono exclui supervisor ou vendedor. O histórico (vendas, movimentações) é mantido. */
export const removeTeamUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    if (data.userId === context.userId) throw new Error("Você não pode excluir a si mesmo.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId);
    if ((roles ?? []).some((r) => r.role === "owner")) throw new Error("Não é possível excluir o dono.");
    await supabaseAdmin.from("teams").update({ supervisor_id: null }).eq("supervisor_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").update({ active: false, team_id: null }).eq("id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: "876000h" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Dono para a equipe: encerra a campanha ativa do supervisor, guardando dias trabalhados. */
export const stopTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ teamId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: team } = await supabaseAdmin.from("teams").select("supervisor_id").eq("id", data.teamId).single();
    let q = supabaseAdmin.from("campaigns").select("id, start_date").eq("status", "ativa");
    q = team?.supervisor_id ? q.eq("supervisor_id", team.supervisor_id) : q.is("supervisor_id", null);
    const { data: camps } = await q;
    if (!camps || camps.length === 0) throw new Error("Esta equipe não tem campanha ativa.");
    const today = new Date().toISOString().slice(0, 10);
    for (const c of camps) {
      const days = Math.max(1, Math.round((Date.parse(today) - Date.parse(c.start_date)) / 86400000) + 1);
      await supabaseAdmin
        .from("campaigns")
        .update({ status: "encerrada", end_date: today, closed_at: new Date().toISOString(), days_worked: days })
        .eq("id", c.id);
    }
    return { closed: camps.length };
  });
