import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "product-images";

/** Apenas o dono: gera a foto do produto com IA e guarda no armazenamento. */
export const generateProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        name: z.string().trim().min(2, "Informe o nome do produto.").max(120),
        description: z.string().trim().max(500).optional(),
        category: z.string().trim().max(80).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isOwner, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "owner",
    });
    if (error) throw new Error("Falha ao verificar permissões.");
    if (!isOwner) throw new Error("Apenas o administrador pode gerar imagens.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Serviço de IA não configurado.");

    const prompt = `Foto de produto profissional, estilo e-commerce premium de produtos naturais.
Produto: "${data.name}"${data.category ? ` (categoria: ${data.category})` : ""}.
${data.description ? `Detalhes: ${data.description}.` : ""}
Embalagem realista e elegante com rótulo mostrando o nome "${data.name}".
Fundo claro e natural, com folhas verdes, madeira clara e luz suave de janela. Composição quadrada, produto centralizado, sem outros textos.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (res.status === 429) throw new Error("Muitas solicitações agora. Aguarde um pouco e tente de novo.");
    if (res.status === 402) throw new Error("Os créditos de IA acabaram. Adicione créditos no seu plano.");
    if (!res.ok) {
      console.error("generateProductImage", res.status, await res.text());
      throw new Error("Não foi possível gerar a imagem agora.");
    }
    const json = (await res.json()) as {
      choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
    };
    const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const match = dataUrl?.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) throw new Error("A IA não retornou uma imagem. Tente de novo.");
    const [, mime, b64] = match;
    const bytes = Uint8Array.from(atob(b64!), (c) => c.charCodeAt(0));
    const ext = mime === "image/jpeg" ? "jpg" : "png";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const up = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, { contentType: mime! });
    if (up.error) throw new Error("Falha ao salvar a imagem.");
    const signed = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    return { path, url: signed.data?.signedUrl ?? "" };
  });

/** Qualquer usuário logado: links temporários para mostrar as fotos dos produtos. */
export const getProductImageUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ paths: z.array(z.string().max(200)).max(500) }).parse(data))
  .handler(async ({ data }) => {
    const paths = [...new Set(data.paths.filter(Boolean))];
    if (!paths.length) return {} as Record<string, string>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 6);
    const out: Record<string, string> = {};
    for (const s of signed ?? []) if (s.path && s.signedUrl) out[s.path] = s.signedUrl;
    return out;
  });
