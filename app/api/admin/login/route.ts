import { NextResponse } from "next/server";
import { adminToken } from "@/lib/admin-auth";

// Брут-форс защита: 5 неудачных попыток / 10 минут / IP (in-memory).
const MAX_FAILS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const fails = new Map<string, { n: number; first: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const now = Date.now();
  const rec = fails.get(ip);
  if (rec && now - rec.first < WINDOW_MS && rec.n >= MAX_FAILS) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через 10 минут." },
      { status: 429 }
    );
  }

  const { password } = await req.json().catch(() => ({}));
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (expected && typeof password === "string" && password === expected) {
    fails.delete(ip);
    const res = NextResponse.json({ ok: true });
    // В куке — производный токен, НЕ сам пароль (см. lib/admin-auth.ts).
    // secure не ставим: сервис доступен по plain HTTP в tailnet.
    res.cookies.set("admin_auth", adminToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });
    return res;
  }

  const cur = fails.get(ip);
  if (!cur || now - cur.first > WINDOW_MS) fails.set(ip, { n: 1, first: now });
  else cur.n += 1;
  return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
}
