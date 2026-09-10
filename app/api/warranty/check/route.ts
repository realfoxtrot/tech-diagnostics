import { NextResponse } from "next/server";
import { db } from "@/db";
import { warrantyChecks } from "@/db/schema";
import { validateWarrantyInput, warrantyMessages } from "@/lib/warranty";

export const dynamic = "force-dynamic";

/**
 * Проверка гарантийности.
 * Формат ответа зеркалит as-russia.ru: { errors: string[], messages: string[], serial_number }
 *
 * Логика: формат SN + предварительный расчёт гарантии (24 мес. с даты покупки)
 * + фиксация обращения для уточнения у поставщика.
 */
export async function POST(req: Request) {
  let body: { serial_number?: unknown; purchase_date?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errors: ["Некорректный запрос"], messages: [] }, { status: 400 });
  }

  const { serial, date, purchase, errors } = validateWarrantyInput(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors, messages: [], serial_number: serial }, { status: 400 });
  }

  const calc = warrantyMessages(purchase!);
  await db.insert(warrantyChecks).values({
    serialNumber: serial,
    purchaseDate: date,
    result: { inWarranty: calc.inWarranty, warrantyUntil: calc.warrantyUntil, messages: calc.messages },
    status: "pending",
  });

  return NextResponse.json({ errors: [], messages: calc.messages, serial_number: serial });
}
