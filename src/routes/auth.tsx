import bgAsset from "@/assets/bd-logo-fundo.jpg.asset.json";
const bgImage = bgAsset.url;
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { ADMIN_EMAIL, ensureAdminAccount } from "@/lib/admin.functions";
import { Button, Card, CardContent, Input, Label } from "@/components/ui";
import { Instagram, Leaf, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — B&D Produtos Naturais" },
      { name: "description", content: "Acesse o sistema de estoque e vendas da B&D Produtos Naturais." },
      { property: "og:title", content: "Entrar — B&D Produtos Naturais" },
      { property: "og:description", content: "Acesse o sistema de estoque e vendas da B&D Produtos Naturais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [loginId, setLoginId] = useState("");
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
      await ensureAdmin();
      const inputVal = loginId.trim();
      let targetEmail = inputVal;
      
      if (!inputVal.includes("@")) {
        if (inputVal.toLowerCase() === "admin" || inputVal === "") {
          targetEmail = ADMIN_EMAIL;
        } else {
          targetEmail = `${inputVal.toLowerCase().replace(/\s+/g, "_")}@bdnaturais.com`;
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
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
    <div
      className="relative flex min-h-screen items-end justify-center bg-secondary bg-contain bg-center bg-no-repeat px-4 pb-8 sm:items-center sm:pb-0 lg:justify-end lg:pr-[8vw]"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute left-4 right-4 top-6 overflow-hidden rounded-3xl border border-primary/15 bg-card/80 p-4 text-center shadow-elegant backdrop-blur-md sm:left-8 sm:right-auto sm:text-left lg:left-[6vw] lg:top-1/2 lg:-translate-y-1/2 lg:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" />
        <div className="flex items-center justify-center gap-3 sm:justify-start">
          <span className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft lg:flex">
            <Leaf className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-3xl font-bold leading-none tracking-tight text-primary lg:text-5xl">B&D</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground lg:text-sm">Produtos Naturais</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start lg:mt-5 lg:flex-col">
          <a href="https://wa.me/5582994003591" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-primary hover:text-primary-foreground lg:px-4 lg:py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:bg-primary-foreground group-hover:text-primary"><Phone className="h-3.5 w-3.5" /></span>
            (82) 99400-3591
          </a>
          <a href="https://instagram.com/bdprodutos" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-primary hover:text-primary-foreground lg:px-4 lg:py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:bg-primary-foreground group-hover:text-primary"><Instagram className="h-3.5 w-3.5" /></span>
            @bdprodutos
          </a>
        </div>
      </div>

      <div className="relative w-full max-w-md rounded-3xl bg-card/80 p-6 shadow-elegant backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
            <Leaf className="h-7 w-7" />
          </span>
          <h1 className="font-display text-2xl font-semibold text-foreground">B&D Produtos Naturais</h1>
          <p className="text-sm text-muted-foreground">Trazendo mais vida verde e bem-estar com produtos naturais.<br/>Gestão de estoque e vendas.</p>
        </div>

        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login">E-mail <span className="font-normal text-muted-foreground">(deixe vazio se for o dono)</span></Label>
                <Input id="login" type="text" inputMode="email" autoCapitalize="none" value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" placeholder="E-mail do supervisor ou vendedor" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Sua senha de acesso" />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Entrando…" : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
