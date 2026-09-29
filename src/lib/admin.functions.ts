import { createServerFn } from "@tanstack/react-start";

export const ADMIN_EMAIL = "bed@bed-produtos.app";
const INITIAL_PASSWORD = "Padrao";

  const u = data.users.find((x) => x.email === ADMIN_EMAIL);
  if (!u) return { ok: false, reason: "not found" };
  const { error } = await supabaseAdmin.auth.admin.updateUserById(u.id, { password: INITIAL_PASSWORD });
  return { ok: !error, reason: error?.message ?? null };
});

/**
 * Garante que a conta do administrador "B&D" exista.
 * Só cria se ainda não existir; nunca altera uma senha já trocada.
 */
export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: INITIAL_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "B&D", must_change_password: false },
  });

  if (error || !created.user) {
    // Já existe: nada a fazer.
    if (error && /already|registered|exists/i.test(error.message)) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const u = data.users.find((x) => x.email === ADMIN_EMAIL);
      if (u) { const r = await supabaseAdmin.auth.admin.updateUserById(u.id, { password: INITIAL_PASSWORD }); if (r.error) console.error("SYNCPW", r.error.message); }
      return { ok: true };
    }
    console.error("ensureAdminAccount:", error);
    return { ok: false, reason: error?.message ?? "unknown" };
  }

  const uid = created.user.id;
  await supabaseAdmin.from("profiles").upsert({ id: uid, full_name: "B&D" });
  await supabaseAdmin.from("user_roles").upsert(
    { user_id: uid, role: "owner" },
    { onConflict: "user_id,role" },
  );
  return { ok: true };
});
