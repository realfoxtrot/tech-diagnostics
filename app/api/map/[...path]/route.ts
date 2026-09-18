import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Same-origin прокси тайлов/шрифтов/спрайтов OpenFreeMap для карты /centers.
 * Зачем: браузер делает только запросы на свой домен (без crossorigin),
 * сервер ходит на tiles.openfreemap.org.
 * Кэш: память сервера (LRU) + Cache-Control (срез планеты обновляется раз в сутки).
 */

const UPSTREAM = "https://tiles.openfreemap.org/";
const CACHE_LIMIT = 400; // записей
const cache = new Map<string, ArrayBuffer>();

// Разрешаем только "плоские" пути без обхода каталогов
function safePath(p: string[]): string | null {
  if (p.length === 0 || p.some((s) => !s || s === "." || s === ".." || s.includes("\\"))) return null;
  return p.map(encodeURIComponent).join("/");
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const rel = safePath(path);
  if (!rel) return new Response("Bad path", { status: 400 });

  const url = UPSTREAM + rel;
  const hit = cache.get(url);
  if (hit) {
    cache.delete(url); // LRU: освежить позицию
    cache.set(url, hit);
    return new Response(hit, { headers: tileHeaders(req) });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: { "User-Agent": "tech-diagnostics/1.0 (map tile proxy)" },
      cache: "no-store",
    });
  } catch {
    return new Response("Upstream unavailable", { status: 502 });
  }
  if (!upstream.ok) {
    return new Response(`Upstream ${upstream.status}`, { status: upstream.status === 404 ? 404 : 502 });
  }

  // TileJSON векторного источника: переписываем tiles[] на наш прокси,
  // чтобы MapLibre не ходил напрямую на openfreemap (и следим за сменой среза).
  // Абсолютный URL — worker резолвит относительные пути от себя, а не от страницы.
  if (rel === "planet") {
    const meta = (await upstream.json()) as { tiles?: string[] };
    // origin из Host-заголовка (сервер слушает 0.0.0.0, req.nextUrl.origin даёт 0.0.0.0);
    // схема из X-Forwarded-Proto: за reverse-proxy (Caddy, https) браузер получает
    // https-страницу, и жёсткий http:// в tiles[] = mixed content = тайлы не грузятся.
    // Конкатенация вместо new URL — иначе {z}/{x}/{y} закодируются в %7Bz%7D
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") ?? "http";
    const origin = host ? `${proto}://${host}` : req.nextUrl.origin;
    meta.tiles = (meta.tiles ?? []).map((t) => origin + "/api/map/" + t.replace(UPSTREAM, ""));
    const json = JSON.stringify(meta);
    return new Response(json, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600", "Access-Control-Allow-Origin": "*" },
    });
  }

  const body = await upstream.arrayBuffer();
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(url, body);

  return new Response(body, { headers: tileHeaders(req) });
}

function tileHeaders(req: NextRequest): HeadersInit {
  return {
    "Content-Type": req.nextUrl.pathname.endsWith(".pbf")
      ? "application/x-protobuf"
      : req.nextUrl.pathname.endsWith(".png")
        ? "image/png"
        : "application/json",
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    "Access-Control-Allow-Origin": "*",
  };
}
