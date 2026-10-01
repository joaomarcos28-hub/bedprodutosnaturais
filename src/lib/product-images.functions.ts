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

    const { geminiImage } = await import("./gemini-image.server");
    const g = await geminiImage(prompt);
    let mime: string;
    let b64: string;
    if (g) {
      mime = g.mime;
      b64 = g.b64;
    } else {
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
      if (res.status === 402) throw new Error("Os créditos de IA acabaram. Ative o faturamento na sua chave do Gemini ou adicione créditos.");
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
      mime = match[1]!;
      b64 = match[2]!;
    }
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

/**
 * Apenas o dono: recebe a foto tirada pela câmera, a IA identifica o nome do
 * produto e gera uma versão limpa (estilo catálogo) da mesma foto.
 */
export const analyzeProductPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ image: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/, "Foto inválida.").max(12_000_000) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isOwner, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" });
    if (error) throw new Error("Falha ao verificar permissões.");
    if (!isOwner) throw new Error("Apenas o administrador pode cadastrar produtos.");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Serviço de IA não configurado.");

    const failMsg = (status: number) =>
      status === 429 ? "Muitas solicitações agora. Aguarde um pouco e tente de novo."
      : status === 402 ? "Os créditos de IA acabaram. Adicione créditos no seu plano."
      : status === 403 ? "O serviço de IA recusou esta solicitação."
      : "Não foi possível analisar a foto agora.";

    const [, mime, b64] = data.image.match(/^data:(image\/\w+);base64,(.+)$/)!;

    // 1) Identificar o produto
    const visionP = fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        reasoning: { effort: "low" },
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: 'Identify the natural/health product in this photo. Reply ONLY with JSON: {"name": string (product name as written on the label, in Portuguese, fixing typos, include size like 500g if visible), "category": string (short, Portuguese), "description": string (one short sentence in Portuguese)}. If unreadable, give your best guess.' },
            { type: "input_image", image_url: data.image },
          ],
        }],
      }),
    });

    // 2) Limpar a imagem
    const form = new FormData();
    const bytes = Uint8Array.from(atob(b64!), (c) => c.charCodeAt(0));
    form.append("image", new File([bytes], `foto.${mime === "image/png" ? "png" : "jpg"}`, { type: mime! }));
    form.append("model", "openai/gpt-image-2.5-sunburst");
    form.append("prompt", "Turn this phone photo into a clean professional e-commerce product photo. Keep the exact same product, packaging, label text and colors. Straighten it, center it, fix lighting and focus, remove hands and clutter, soft light natural background. Square composition.");
    const editP = fetch("https://ai.gateway.lovable.dev/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const [visionRes, editRes] = await Promise.all([visionP, editP]);
    if (!visionRes.ok) {
      console.error("analyzeProductPhoto vision", visionRes.status, await visionRes.text());
      throw new Error(failMsg(visionRes.status));
    }
    const vjson = (await visionRes.json()) as { output_text?: string; output?: { type?: string; content?: { type?: string; text?: string }[] }[] };
    const text = vjson.output_text ?? vjson.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text ?? "";
    let info: { name?: string; category?: string; description?: string } = {};
    try { info = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); } catch { /* sem nome */ }

    let path = "";
    let url = "";
    if (editRes.ok) {
      const ej = (await editRes.json()) as { data?: { b64_json?: string }[] };
      const out = ej.data?.[0]?.b64_json;
      if (out) {
        const outBytes = Uint8Array.from(atob(out), (c) => c.charCodeAt(0));
        path = `${crypto.randomUUID()}.png`;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const up = await supabaseAdmin.storage.from(BUCKET).upload(path, outBytes, { contentType: "image/png" });
        if (up.error) path = "";
        else url = (await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 3600)).data?.signedUrl ?? "";
      }
    } else {
      console.error("analyzeProductPhoto edit", editRes.status, await editRes.text());
    }

    return {
      name: (info.name ?? "").slice(0, 120),
      category: (info.category ?? "").slice(0, 80),
      description: (info.description ?? "").slice(0, 500),
      path,
      url,
    };
  });
