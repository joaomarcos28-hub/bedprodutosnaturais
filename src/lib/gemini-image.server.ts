/** Gera/edita imagem com a chave própria do Google Gemini. Retorna null se não houver chave ou falhar. */
export async function geminiImage(
  prompt: string,
  image?: { mime: string; b64: string },
): Promise<{ mime: string; b64: string } | null> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) return null;
  const parts: unknown[] = [{ text: prompt }];
  if (image) parts.push({ inline_data: { mime_type: image.mime, data: image.b64 } });
  for (const model of ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"]) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      },
    );
    if (!res.ok) {
      console.error("geminiImage", model, res.status, (await res.text()).slice(0, 300));
      continue;
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
    };
    const p = json.candidates?.[0]?.content?.parts?.find((x) => x.inlineData?.data);
    if (p?.inlineData?.data) return { mime: p.inlineData.mimeType ?? "image/png", b64: p.inlineData.data };
  }
  return null;
}
