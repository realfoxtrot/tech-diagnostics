import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Админ-аутентификация.
 *
 * Кука admin_auth хранит НЕ пароль, а производный токен
 * (SHA-256 от соль+пароль): компрометация куки (XSS, осмотр storage)
 * не раскрывает сам пароль. Смена пароля в ADMIN_PASSWORD автоматически
 * инвалидирует все выданные куки.
 *
 * Сравнение — constant-time (timingSafeEqual).
 * Кука без флага secure: сервис доступен по plain HTTP в tailnet
 * (http://100.64.0.2:3000), Secure-кука браузер бы отбросил.
 */

export function adminToken(password = process.env.ADMIN_PASSWORD ?? ""): string {
  return createHash("sha256").update(`tech-diagnostics-admin:${password}`).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length === 0 || ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function isAdmin(req: Request): boolean {
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) return false; // без заданного пароля админка закрыта
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)admin_auth=([^;]+)/);
  if (!match) return false;
  return safeEqual(match[1], adminToken());
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
