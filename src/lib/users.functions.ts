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
