"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export interface CenterPin {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
}

// Бесплатные стили OpenFreeMap (тайлы OSM), без API-ключа
const LIGHT_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}

function pinElement(dark: boolean) {
  const el = document.createElement("div");
  el.style.cssText = `width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    background:${dark ? "#818cf8" : "#4f46e5"};border:2px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer`;
  return el;
}

/**
 * Карта сервисных центров: MapLibre GL + OpenFreeMap (бесплатно, без API-ключа).
 * Пины + popup (название, адрес, телефон). Стиль меняется вместе с темой.
 */
export default function CentersMap({ centers }: { centers: CenterPin[] }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const withCoords = centers.filter((c) => c.lat != null && c.lng != null);

  useEffect(() => {
    const div = divRef.current;
    if (!div || withCoords.length === 0) return;
    let disposed = false;
    let ok = false;
    let map: import("maplibre-gl").Map | null = null;
    const markers: import("maplibre-gl").Marker[] = [];

    (async () => {
      try {
        const maplibregl = await import("maplibre-gl");
        if (disposed || !divRef.current) return;

        const isDark = () => document.documentElement.classList.contains("dark");
        const dark = isDark();

        const m = new maplibregl.Map({
          container: div,
          style: dark ? DARK_STYLE : LIGHT_STYLE,
          center: [55.75, 37.6],
          zoom: 11,
        });
        map = m;
        m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        const info = new maplibregl.Popup({ offset: 26, closeButton: true });

        for (const c of withCoords) {
          const el = pinElement(dark);
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([c.lng as number, c.lat as number])
            .setPopup(info)
            .addTo(m);
          info.setHTML(
            `<b>${escapeHtml(c.name)}</b><br>${escapeHtml(c.address)}` +
              (c.phone ? `<br>${escapeHtml(c.phone)}` : "")
          );
          markers.push(marker);
        }

        const bounds = new maplibregl.LngLatBounds();
        for (const c of withCoords) {
          bounds.extend([c.lng as number, c.lat as number]);
        }
        if (withCoords.length === 1) {
          m.setCenter([withCoords[0].lng as number, withCoords[0].lat as number]);
          m.setZoom(14);
        } else {
          m.fitBounds(bounds, { padding: 48 });
        }

        // Перекрасить стиль и пины при смене темы
        let lastDark = dark;
        const mo = new MutationObserver(() => {
          const d = isDark();
          if (d !== lastDark && !disposed) {
            lastDark = d;
            m.setStyle(d ? DARK_STYLE : LIGHT_STYLE);
            for (const mk of markers) {
              mk.getElement().style.background = d ? "#818cf8" : "#4f46e5";
            }
          }
        });
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        (m as unknown as { __mo?: MutationObserver }).__mo = mo;

        m.once("load", () => {
          ok = true;
          if (!disposed) setStatus("ok");
        });
        m.on("error", () => {
          if (!disposed && !ok) setStatus("error");
        });
      } catch {
        if (!disposed) setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      (map as unknown as { __mo?: MutationObserver } | null)?.__mo?.disconnect();
      for (const mk of markers) mk.remove();
      map?.remove();
      map = null;
    };
  }, [withCoords]);

  return (
    <div className="relative z-0">
      <div ref={divRef} className="h-80 md:h-96 w-full rounded-2xl border border-border overflow-hidden bg-card" />
      {status === "loading" && withCoords.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">Загрузка карты…</div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-muted text-sm px-6">
          Не удалось загрузить карту (нет доступа к tiles.openfreemap.org)
        </div>
      )}
      {withCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-muted text-sm px-6">
          У сервисных центров не заданы координаты — карта недоступна
        </div>
      )}
    </div>
  );
}
