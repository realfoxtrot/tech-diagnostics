"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export interface CenterPin {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  workhours: string | null;
  lat: number | null;
  lng: number | null;
}

// Тайлы Wikimedia (osm-intl): данные OSM, локальные подписи (для России — русские),
// @2x retina — чётче. Без API-ключа. В тёмной теме канвас инвертируется CSS-фильтром
// (globals.css): .dark .maplibregl-canvas { filter: invert(1) hue-rotate(180deg) … }
const TILES = "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}@2x.png";
const ATTRIB =
  '<a href="https://maps.wikimedia.org/">Wikimedia maps</a> | ' +
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function makeStyle(): object {
  return {
    version: 8,
    sources: {
      base: {
        type: "raster",
        tiles: [TILES],
        tileSize: 256,
        maxzoom: 19,
        attribution: ATTRIB,
      },
    },
    layers: [
      {
        id: "base",
        type: "raster",
        source: "base",
        paint: { "raster-opacity": 1 },
      },
    ],
  };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}

function pinElement() {
  // Внешний div — маркер (MapLibre сам ставит ему transform для позиционирования),
  // внутренний — ромб-капля с rotate(-45deg), чтобы позиционирование не сбивало форму
  const wrap = document.createElement("div");
  wrap.style.cssText = "width:30px;height:30px;display:flex;align-items:flex-start;justify-content:center;";
  const pin = document.createElement("div");
  pin.style.cssText =
    "width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);" +
    `background:var(--accent);border:2px solid #fff;` +
    "box-shadow:0 2px 6px rgba(0,0,0,.35);margin-top:2px";
  wrap.appendChild(pin);
  return wrap;
}

/**
 * Карта сервисных центров: MapLibre GL + растр-тайлы Wikimedia (данные OSM).
 * Пины + popup у КАЖДОГО пина свой (название, адрес, телефон, режим работы).
 * Тёмная тема — CSS-инверсия канваса (globals.css), тайлы одни.
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
    let failTimer: ReturnType<typeof setTimeout> | null = null;

    const markOk = () => {
      ok = true;
      if (failTimer) clearTimeout(failTimer);
      if (!disposed) setStatus("ok");
    };

    (async () => {
      try {
        const maplibregl = await import("maplibre-gl");
        if (disposed || !divRef.current) return;

        const m = new maplibregl.Map({
          container: div,
          style: makeStyle() as never,
          center: [55.75, 37.6],
          zoom: 11,
        });
        map = m;
        m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        // Статус «загружено»: ждём load или таймаут 8с (не зависнуть на заглушке).
        // Тайл-ошибки считаем: если тайлы не грузятся — показываем ошибку.
        let tileErrors = 0;
        m.on("load", markOk);
        failTimer = setTimeout(markOk, 8000);
        m.on("error", () => {
          tileErrors++;
          if (tileErrors >= 10 && !ok && !disposed) setStatus("error");
        });

        // Popup — свой у каждого маркера: один общий Popup переиспользовался
        // последним маркером в цикле, и все пины показывали один СЦ.
        for (const c of withCoords) {
          const el = pinElement();
          const popup = new maplibregl.Popup({ offset: 26, closeButton: true }).setHTML(
            `<b>${escapeHtml(c.name)}</b><br>${escapeHtml(c.address)}` +
              (c.phone ? `<br>${escapeHtml(c.phone)}` : "") +
              (c.workhours ? `<br><span style="color:var(--muted)">${escapeHtml(c.workhours)}</span>` : "")
          );
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([c.lng as number, c.lat as number])
            .setPopup(popup)
            .addTo(m);
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
      } catch {
        if (!disposed) setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      if (failTimer) clearTimeout(failTimer);
      for (const mk of markers) mk.remove();
      map?.remove();
      map = null;
    };
  }, [withCoords]);

  return (
    <div className="relative z-0">
      <div ref={divRef} className="h-80 md:h-96 w-full rounded-2xl border border-border overflow-hidden bg-card" />
      {status === "loading" && withCoords.length > 0 && (
        <div className="absolute top-2 left-2 px-3 py-1.5 rounded-lg bg-background/80 text-muted text-xs">
          Загрузка карты…
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-muted text-sm px-6">
          Не удалось загрузить карту (тайлы Esri недоступны)
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
