import { supabase } from "@/integrations/supabase/client";

/** Get the current position, or null when unavailable/denied. */
export async function getCurrentCoords(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) return null;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 12000, enableHighAccuracy: true, maximumAge: 15000 }),
    );
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}

/** Upload a file to the private receipts bucket and return its path. */
export async function uploadReceipt(file: Blob, fileName: string, contentType: string, errorLabel: string): Promise<string> {
  const path = `${crypto.randomUUID()}/${fileName}`;
  const { error } = await supabase.storage.from("receipts").upload(path, file, { contentType });
  if (error) throw new Error(`Falha ao enviar ${errorLabel}: ${error.message}`);
  return path;
}

/** Convert a data URL (e.g. from a signature canvas) into a Blob. */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}
