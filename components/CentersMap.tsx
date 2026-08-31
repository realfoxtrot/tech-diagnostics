"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface CenterPin {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
}

// Тайлы без API-ключа: OSM (светлая) / CARTO dark_all (тёмная)
const LIGHT_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const LIGHT_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const DARK_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_ATTR = '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}

/** Карта сервисных центров: пины + popup (название, адрес, телефон). */
export default function CentersMap({ centers }: { centers: CenterPin[] }) {
  const divRef = useRef<HTMLDivElement>(null);
  const withCoords = centers.filter((c) => c.lat != null && c.lng != null);

  useEffect(() => {
    const div = divRef.current;
    if (!div) return;
    let disposed = false;
    let map: import("leaflet").Map | null = null;

    // L динамически — leaflet обращается к window при импорте, SSR не должен его трогать
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !divRef.current) return;

      const isDark = () => document.documentElement.classList.contains("dark");
      let lastDark = isDark();

      const pinIcon = (dark: boolean) =>
        L.divIcon({
          className: "",
          html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${dark ? "#818cf8" : "#4f46e5"};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -24],
        });

      map = L.map(div, { scrollWheelZoom: false });
      const layer = L.layerGroup().addTo(map);
      let tile: import("leaflet").TileLayer | null = null;

      const render = () => {
        if (!map) return;
        const dark = isDark();
        if (tile) tile.remove();
        tile = L.tileLayer(dark ? DARK_URL : LIGHT_URL, {
          attribution: dark ? DARK_ATTR : LIGHT_ATTR,
        }).addTo(map);

        layer.clearLayers();
        for (const c of withCoords) {
          const lat = c.lat as number;
          const lng = c.lng as number;
          const html =
            `<b>${escapeHtml(c.name)}</b><br>${escapeHtml(c.address)}` +
            (c.phone ? `<br>${escapeHtml(c.phone)}` : "");
          L.marker([lat, lng], { icon: pinIcon(dark) }).bindPopup(html).addTo(layer);
        }
        const pts = withCoords.map((c) => [c.lat as number, c.lng as number] as [number, number]);
        if (pts.length === 1) {
          map.setView(pts[0], 14);
        } else if (pts.length > 1) {
          map.fitBounds(L.latLngBounds(pts).pad(0.2));
        } else {
          map.setView([55.75, 37.6], 11);
        }
      };
      render();

      const mo = new MutationObserver(() => {
        const dark = isDark();
        if (dark !== lastDark) {
          lastDark = dark;
          render();
        }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

      (map as import("leaflet").Map & { __mo?: MutationObserver }).__mo = mo;
    })();

    return () => {
      disposed = true;
      (map as (import("leaflet").Map & { __mo?: MutationObserver }) | null)?.__mo?.disconnect();
      map?.remove();
      map = null;
    };
  }, [centers, withCoords]);

  return (
    <div className="relative z-0">
      <div ref={divRef} className="h-80 md:h-96 w-full rounded-2xl border border-border overflow-hidden bg-card" />
      {withCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-muted text-sm px-6">
          У сервисных центров не заданы координаты — карта недоступна
        </div>
      )}
    </div>
  );
}
