import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useSession } from "@/lib/auth";
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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: session } = useSession();

  async function afterAuth() {
    navigate({ to: "/dashboard" });
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível entrar: " + error.message);
      return;
    }
    afterAuth();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível criar a conta: " + error.message);
      return;
    }
    if (data.session) {
      afterAuth();
    } else {
      setNotice("Conta criada! Confirme o e-mail que enviamos para " + email + " e depois entre aqui.");
      setMode("signin");
    }
  }

  async function handleSocial(provider: "google" | "apple") {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com " + (provider === "google" ? "Google" : "Apple") + ".");
      return;
    }
    if (result.redirected) return;
    afterAuth();
  }

  // Já logado: redireciona direto.
  if (session) {
    void navigate({ to: "/dashboard", replace: true });
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
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <button
                className={`rounded-md py-2 text-sm font-medium transition-colors ${mode === "signin" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setMode("signin")}
              >
                Entrar
              </button>
              <button
                className={`rounded-md py-2 text-sm font-medium transition-colors ${mode === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setMode("signup")}
              >
                Criar conta
              </button>
            </div>

            {notice && (
              <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm text-success">{notice}</p>
            )}

            {mode === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Seu nome</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Maria Silva" />
                </div>
                <Credentials email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Criando…" : "Criar conta"}
                </Button>
              </form>
            )}

            {mode === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <Credentials email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Entrando…" : "Entrar"}
                </Button>
              </form>
            )}

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-2">
              <Button variant="outline" type="button" onClick={() => handleSocial("google")} className="w-full">
                <svg viewBox="0 0 24 24" className="mr-1 h-4 w-4"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81"/></svg>
                Continuar com Google
              </Button>
              <Button variant="outline" type="button" onClick={() => handleSocial("apple")} className="w-full">
                <svg viewBox="0 0 24 24" className="mr-1 h-4 w-4"><path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/></svg>
                Continuar com Apple
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          O primeiro usuário criado se torna o dono da conta.
        </p>
      </div>
    </div>
  );
}

function Credentials({
  email, setEmail, password, setPassword,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="voce@exemplo.com" autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="current-password" />
      </div>
    </>
  );
}
