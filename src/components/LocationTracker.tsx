import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Pede a localização assim que o vendedor ou supervisor abre o app e envia a posição
// para o mapa da equipe enquanto o app estiver aberto (no máximo a cada 20s).
export function LocationTracker({ userId }: { userId: string }) {
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let last = 0;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - last < 15_000) return;
        last = now;
        void supabase.from("location_pings").insert({
          seller_id: userId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toast.info("Localização não autorizada. Ative nas configurações do navegador para aparecer no mapa.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [userId]);
  return null;
}
