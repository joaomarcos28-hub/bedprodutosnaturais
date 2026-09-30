import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
  color: string;
  time?: string;
  big?: boolean;
  faded?: boolean;
}

const palette = ["#16a34a", "#0891b2", "#65a30d", "#0d9488"];

export function TeamMap({ markers }: { markers: MapMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const layerRef = useRef<{ clearLayers: () => void; addLayer: (l: unknown) => void } | null>(null);
  const fittedRef = useRef(false);
  const LRef = useRef<typeof import("leaflet") | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      LRef.current = L;
      if (!mapRef.current) {
        const map = L.map(containerRef.current).setView([-3.73, -38.53], 12);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        const group = L.layerGroup().addTo(map);
        mapRef.current = map;
        layerRef.current = group as unknown as { clearLayers: () => void; addLayer: (l: unknown) => void };
      }
      renderMarkers();
    })();

    function renderMarkers() {
      const L = LRef.current;
      const group = layerRef.current;
      if (!L || !group) return;
      group.clearLayers();
      markers.forEach((m, i) => {
        const color = m.color ?? palette[i % palette.length];
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${m.big ? 26 : 18}px;height:${m.big ? 26 : 18}px;border-radius:50%;background:${color};opacity:${m.faded ? 0.5 : 1};border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:white;font:700 11px sans-serif">${m.big ? "S" : ""}</div>`,
          iconSize: m.big ? [26, 26] : [18, 18],
          iconAnchor: m.big ? [13, 13] : [9, 9],
        });
        const marker = L.marker([m.lat, m.lng], { icon });
        marker.bindPopup(`<strong>${m.label}</strong>${m.time ? `<br/>${m.time}` : ""}`);
        group.addLayer(marker);
      });
      const map = mapRef.current as { fitBounds: (b: [number, number][], o: object) => void; setView: (c: [number, number], z: number) => void } | null;
      if (map && !fittedRef.current && markers.length > 0) {
        fittedRef.current = true;
        if (markers.length === 1) map.setView([markers[0]!.lat, markers[0]!.lng], 15);
        else map.fitBounds(markers.map((m) => [m.lat, m.lng] as [number, number]), { padding: [40, 40], maxZoom: 16 });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [markers]);

  useEffect(() => {
    return () => {
      const map = mapRef.current as { remove: () => void } | null;
      if (map) {
        map.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="h-[460px] w-full rounded-2xl" />;
}
