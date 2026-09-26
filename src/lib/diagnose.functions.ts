import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Apenas o dono: analisa uma mensagem de erro com IA. */
export const analyzeError = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ errorText: z.string().trim().min(5, "Cole a mensagem de erro.").max(20000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isOwner, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "owner",
    });
    if (error) throw new Error("Falha ao verificar permissões.");
    if (!isOwner) throw new Error("Apenas o administrador pode usar este recurso.");

    const { diagnoseError } = await import("./diagnose.server");
    const analysis = await diagnoseError(data.errorText);
    return { analysis };
  });
