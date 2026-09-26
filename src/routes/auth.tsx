import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { ADMIN_EMAIL, ensureAdminAccount } from "@/lib/admin.functions";
import { Button, Card, CardContent, Input, Label } from "@/components/ui";
import { Leaf } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — BeD Produtos Naturais" },
      { name: "description", content: "Acesse o sistema de estoque e vendas da BeD Produtos Naturais." },
      { property: "og:title", content: "Entrar — BeD Produtos Naturais" },
      { property: "og:description", content: "Acesse o sistema de estoque e vendas da BeD Produtos Naturais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"admin" | "team">("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { data: session } = useSession();
  const ensureAdmin = useServerFn(ensureAdminAccount);

  useEffect(() => {
    if (session) void navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "admin") await ensureAdmin();
      const { error } = await supabase.auth.signInWithPassword({
        email: mode === "admin" ? ADMIN_EMAIL : email,
        password,
      });
      if (error) {
        toast.error("Usuário ou senha incorretos.");
        return;
      }
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Não foi possível entrar agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Leaf className="h-7 w-7" />
          </span>
          <h1 className="font-display text-2xl font-semibold">BeD Produtos Naturais</h1>
          <p className="text-sm text-muted-foreground">Gestão de estoque e vendas porta a porta</p>
        </div>

        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "admin" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="user">Usuário</Label>
                  <Input id="user" value="B&D" readOnly disabled />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="voce@exemplo.com" autoComplete="email" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus autoComplete="current-password" />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Entrando…" : "Entrar"}
              </Button>
            </form>

            <button
              type="button"
              className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => { setMode(mode === "admin" ? "team" : "admin"); setPassword(""); }}
            >
              {mode === "admin" ? "Sou supervisor ou vendedor" : "Entrar como administrador B&D"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
