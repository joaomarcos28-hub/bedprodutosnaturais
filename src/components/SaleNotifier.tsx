import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";

/** Avisa o dono, em tempo real, quando um vendedor conclui uma venda. */
export function SaleNotifier() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("owner-sales")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sales" }, async (payload) => {
        const sale = payload.new as { seller_id: string; total: number | string };
        const { data } = await supabase.from("profiles").select("full_name").eq("id", sale.seller_id).maybeSingle();
        const name = data?.full_name || "Vendedor";
        toast.success("Venda concluída", {
          description: `${name} vendeu ${brl(sale.total)}`,
          duration: 8000,
        });
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
          new Notification("Venda concluída", { body: `${name} vendeu ${brl(sale.total)}` });
        }
        queryClient.invalidateQueries({ queryKey: ["sales"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      })
      .subscribe();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  return null;
}
