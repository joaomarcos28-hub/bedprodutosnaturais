import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, CardContent, Input, Label } from "./ui";

/** Obriga o administrador a trocar a senha inicial no primeiro acesso. */
export function ChangePasswordGate() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) { toast.error("A nova senha precisa ter pelo menos 8 caracteres."); return; }
    if (next !== confirm) { toast.error("As senhas não conferem."); return; }
    if (next === current) { toast.error("A nova senha deve ser diferente da atual."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: next,
      current_password: current,
      data: { must_change_password: false },
    } as Parameters<typeof supabase.auth.updateUser>[0]);
    setBusy(false);
    if (error) { toast.error("Não foi possível trocar a senha: " + error.message); return; }
    await supabase.auth.refreshSession();
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    toast.success("Senha alterada com sucesso!");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <KeyRound className="h-7 w-7" />
          </span>
          <h1 className="font-display text-2xl font-semibold">Crie sua nova senha</h1>
          <p className="text-sm text-muted-foreground">
            Por segurança, troque a senha inicial antes de continuar.
          </p>
        </div>
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cur">Senha atual</Label>
                <Input id="cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new">Nova senha</Label>
                <Input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="conf">Confirme a nova senha</Label>
                <Input id="conf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Salvando…" : "Salvar nova senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
