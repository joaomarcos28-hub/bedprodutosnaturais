import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { analyzeError } from "@/lib/diagnose.functions";
import { useMyRole } from "@/lib/auth";
import { Button, Card, CardContent, Textarea } from "@/components/ui";

export const Route = createFileRoute("/_authenticated/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico de erros — BeD Produtos Naturais" },
      { name: "description", content: "Cole uma mensagem de erro e receba causas prováveis e sugestões de correção." },
      { property: "og:title", content: "Diagnóstico de erros — BeD Produtos Naturais" },
      { property: "og:description", content: "Análise de erros com IA para administradores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiagnosticoPage,
});

function DiagnosticoPage() {
  const { data: role } = useMyRole();
  const analyze = useServerFn(analyzeError);
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (role && role !== "owner") {
    return <p className="text-muted-foreground">Apenas o administrador pode acessar esta página.</p>;
  }

  async function handleAnalyze() {
    setBusy(true);
    setResult(null);
    try {
      const { analysis } = await analyze({ data: { errorText: text } });
      setResult(analysis);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível analisar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Diagnóstico de erros</h1>
        <p className="text-sm text-muted-foreground">
          Cole uma mensagem de erro e a IA sugere causas prováveis e como corrigir.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-3 pt-5">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Cole aqui a mensagem de erro…"
            className="font-mono text-xs"
          />
          <Button onClick={handleAnalyze} disabled={busy || text.trim().length < 5}>
            <Sparkles className="mr-1 h-4 w-4" />
            {busy ? "Analisando…" : "Analisar com IA"}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardContent className="pt-5">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{result}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
