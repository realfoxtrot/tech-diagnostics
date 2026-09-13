import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { supportRequests } from "@/db/schema";
import {
  buildSupportMessage,
  makeTicketNumber,
  validateSupportInput,
  type SupportInput,
} from "@/lib/support";

export const dynamic = "force-dynamic";

/**
 * POST /api/support/request
 *
 * Сохраняет обращение в техподдержку ASUS и возвращает:
 *   { ticketNumber, messageText }
 * `messageText` — готовый текст для вставки в оригинальную форму ASUS.
 *
 * Сетевых вызовов к asus.com нет: у вендорской формы нет публичного API и
 * нужна своя пользовательская сессия. Пользователь сам открывает форму ASUS
 * и вставляет подготовленный текст.
 *
 * Защита: rate limit 5 запросов / 10 минут / IP (in-memory, сбрасывается
 * при рестарте) + honeypot-поле `company` (боты заполняют скрытое поле).
 */

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { n: number; first: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.first > RATE_LIMIT_WINDOW_MS) {
    hits.set(ip, { n: 1, first: now });
    return false;
  }
  rec.n += 1;
  return rec.n > RATE_LIMIT_MAX;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { errors: ["Слишком много запросов. Попробуйте через 10 минут."] },
      { status: 429 }
    );
  }

  let body: SupportInput & { company?: unknown };
  try {
    body = (await req.json()) as SupportInput & { company?: unknown };
  } catch {
    return NextResponse.json({ errors: ["Некорректный запрос"] }, { status: 400 });
  }

  // Honeypot: скрытое поле, человек его не видит и не заполняет.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json(
      { ticketNumber: "SR-00000000-0000", messageText: "" },
      { status: 200 }
    );
  }

  const data = validateSupportInput(body);
  if (data.errors.length > 0) {
    return NextResponse.json({ errors: data.errors }, { status: 400 });
  }

  const ticketNumber = await nextTicketNumber();
  const messageText = buildSupportMessage(data, ticketNumber);

  try {
    await db.insert(supportRequests).values({
      ticketNumber,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      productType: data.productType,
      serial: data.serial || null,
      purchaseDate: data.purchaseDate || null,
      city: data.city || null,
      description: data.description,
      status: "new",
    });
  } catch (e) {
    // Логируем факт ошибки, но НЕ данные пользователя (ПДн).
    console.error("support request save error:", (e as Error)?.message ?? e);
    return NextResponse.json(
      { errors: ["Не удалось сохранить обращение. Попробуйте ещё раз."] },
      { status: 500 }
    );
  }

  return NextResponse.json({ ticketNumber, messageText });
}

/** Уникальный номер обращения: SR-YYYYMMDD-XXXX (проверяем коллизию в БД). */
async function nextTicketNumber(): Promise<string> {
  for (let i = 0; i < 25; i++) {
    const candidate = makeTicketNumber();
    const existing = await db.query.supportRequests.findFirst({
      where: eq(supportRequests.ticketNumber, candidate),
      columns: { id: true },
    });
    if (!existing) return candidate;
  }
  // Практически недостижимо: добавляем суффикс от времени.
  return `${makeTicketNumber()}`.replace(/-(\d{4})$/, `-${Date.now() % 10000}`);
}
