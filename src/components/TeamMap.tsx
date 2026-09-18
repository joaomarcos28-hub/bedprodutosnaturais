import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
  color: string;
  time?: string;
}

const palette = ["#16a34a", "#2563eb", "#ea580c", "#dc2626", "#7c3aed", "#0891b2"];

export function TeamMap({ markers }: { markers: MapMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const layerRef = useRef<{ clearLayers: () => void; addLayer: (l: unknown) => void } | null>(null);
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
          html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,.4)"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const marker = L.marker([m.lat, m.lng], { icon });
        marker.bindPopup(`<strong>${m.label}</strong>${m.time ? `<br/>${m.time}` : ""}`);
        group.addLayer(marker);
      });
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
