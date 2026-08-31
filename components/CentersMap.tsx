"use client";

import { useEffect, useRef, useState } from "react";

export interface CenterPin {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
}

// Минимальные типы Google Maps JS API (без @types/google.maps)
interface GMapsLib {
  Map: new (el: HTMLElement, opts: object) => {
    setCenter(c: object): void;
    setZoom(z: number): void;
    fitBounds(b: object): void;
  };
  InfoWindow: new () => { setContent(html: string): void; open(map: object, marker: object): void };
  LatLng: new (lat: number, lng: number) => object;
  LatLngBounds: new () => { extend(l: object): void; isEmpty(): boolean };
  event: { addListenerOnce(target: object, name: string, cb: () => void): void };
}
interface GMarkerLib {
  Marker: new (opts: object) => object;
}

declare global {
  interface Window {
    google?: {
      maps: {
        importLibrary(name: string): Promise<GMapsLib | GMarkerLib>;
      };
    };
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}

// Google Maps JS API: один скрипт, ключ в query (загрузка с loading=async — обязательна)
function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.google?.maps) return resolve();
    const existing = document.querySelector<HTMLScriptElement>("script[data-gm-key]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("script error")));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=ru&region=ru&loading=async`;
    s.async = true;
    s.dataset.gmKey = apiKey;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script error"));
    document.head.appendChild(s);
  });
}

/**
 * Карта сервисных центров (Google Maps): пины + info window.
 * Ключ из GOOGLE_MAPS_API_KEY (env сервера). Ключ попадёт в клиентский бандл —
 * в Google Cloud Console ограничьте его по HTTP referrers (домен сайта).
 */
export default function CentersMap({ centers }: { centers: CenterPin[] }) {
  // NEXT_PUBLIC_* встраивается в клиентский бандл (ключ будет виден в браузере —
  // ограничьте его в Google Cloud Console по HTTP referrers)
  const apiKey: string | null = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? null;
  const divRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const withCoords = centers.filter((c) => c.lat != null && c.lng != null);

  useEffect(() => {
    const div = divRef.current;
    if (!div || !apiKey || withCoords.length === 0) return;
    let disposed = false;

    (async () => {
      try {
        await loadGoogleMaps(apiKey);
        if (disposed || !divRef.current || !window.google?.maps) return;
        const [mapsLib, markerLib] = await Promise.all([
          window.google.maps.importLibrary("maps"),
          window.google.maps.importLibrary("marker"),
        ]);
        const { Map, InfoWindow, LatLng, LatLngBounds, event } = mapsLib as GMapsLib;
        const { Marker } = markerLib as GMarkerLib;
        if (disposed) return;

        const gmap = new Map(div, {
          center: new LatLng(55.75, 37.6),
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        const info = new InfoWindow();

        const bounds = new LatLngBounds();
        for (const c of withCoords) {
          const pos = new LatLng(c.lat as number, c.lng as number);
          const marker = new Marker({
            position: pos,
            map: gmap,
            title: c.name,
            label: { text: String(c.id), color: "#ffffff" },
          });
          const html =
            `<b>${escapeHtml(c.name)}</b><br>${escapeHtml(c.address)}` +
            (c.phone ? `<br>${escapeHtml(c.phone)}` : "");
          event.addListenerOnce(marker, "click", () => {
            info.setContent(html);
            info.open(gmap, marker);
          });
          bounds.extend(pos);
        }

        if (!bounds.isEmpty()) {
          if (withCoords.length === 1) {
            gmap.setCenter(new LatLng(withCoords[0].lat as number, withCoords[0].lng as number));
            gmap.setZoom(14);
          } else {
            gmap.fitBounds(bounds);
          }
        }
        if (!disposed) setStatus("ok");
      } catch {
        if (!disposed) setStatus("error");
      }
    })();

    return () => {
      disposed = true;
    };
  }, [apiKey, withCoords]);


  if (!apiKey) {
    return (
      <div className="h-80 md:h-96 w-full rounded-2xl border border-border bg-card flex items-center justify-center text-center text-muted text-sm px-6">
        Карта недоступна: не задан GOOGLE_MAPS_API_KEY (.env.local)
      </div>
    );
  }

  return (
    <div className="relative z-0">
      <div ref={divRef} className="h-80 md:h-96 w-full rounded-2xl border border-border overflow-hidden bg-card" />
      {status === "loading" && withCoords.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">Загрузка карты…</div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-muted text-sm px-6">
          Не удалось загрузить Google Maps (проверьте API-ключ и доступ к maps.googleapis.com)
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
