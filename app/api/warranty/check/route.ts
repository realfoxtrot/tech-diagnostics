import { NextResponse } from "next/server";
import { db } from "@/db";
import { warrantyChecks } from "@/db/schema";
import {
  validateWarrantyInput,
  purchaseDateRejection,
  isVendorCovered,
  PROGRAM_START_DATE,
  PROGRAM_START_TEXT,
} from "@/lib/warranty";
import { checkSerialAtVendor } from "@/lib/vendor";

export const dynamic = "force-dynamic";

/**
 * Проверка гарантийности (централизованная гарантия ASUS).
 * Формат ответа зеркалит as-russia.ru: { errors, messages, serial_number }
 *
 * Порядок:
 *  1. локальная валидация (SN 12–20 симв., дата покупки не в будущем);
 *  2. условие программы: дата продажи по чеку — с 01.01.2026
 *     (не проходит → отказ, в вендора не ходим);
 *  3. вендор: POST as-russia.ru/api/check_sn — валидность SN, страна
 *     отгрузки, дата производства (не ранее 01.07.2025);
 *  4. обращение сохраняется в warranty_checks (covered / rejected / error).
 */
export async function POST(req: Request) {
  let body: { serial_number?: unknown; purchase_date?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errors: ["Некорректный запрос"], messages: [] }, { status: 400 });
  }

  const { serial, date, errors } = validateWarrantyInput(body);

  // Условие программы — дата продажи по чеку
  const dateRejection = date ? purchaseDateRejection(date) : null;
  if (errors.length === 0 && dateRejection) {
    errors.push(dateRejection);
  }

  if (errors.length > 0) {
    await saveCheck(serial || null, date, {
      status: "rejected",
      localErrors: errors,
      vendorErrors: [],
      vendorMessages: [],
    });
    return NextResponse.json({ errors, messages: [], serial_number: serial }, { status: 400 });
  }

  const vendor = await checkSerialAtVendor(serial, date);

  if (!vendor) {
    const msg =
      "Не удалось проверить серийный номер (сервис вендора временно недоступен). " +
      "Попробуйте позже или запросите проверку в службе технической поддержки.";
    await saveCheck(serial, date, {
      status: "error",
      localErrors: [],
      vendorErrors: [msg],
      vendorMessages: [],
    });
    return NextResponse.json({ errors: [msg], messages: [], serial_number: serial }, { status: 400 });
  }

  const covered = isVendorCovered(vendor);
  const messages: string[] = [...vendor.messages];
  if (covered) {
    messages.push(
      "Устройство подпадает под централизованную бесплатную гарантию ASUS. " +
        "Его можно бесплатно обслуживать в авторизованном сервисном центре AS-RUSSIA при производственной неисправности."
    );
  }

  await saveCheck(serial, date, {
    status: covered ? "covered" : "rejected",
    localErrors: [],
    vendorErrors: vendor.errors,
    vendorMessages: vendor.messages,
  });

  return NextResponse.json(
    { errors: vendor.errors, messages, serial_number: vendor.serial_number ?? serial },
    { status: covered ? 200 : 400 }
  );
}

async function saveCheck(
  serial: string | null,
  date: string,
  r: { status: string; localErrors: string[]; vendorErrors: string[]; vendorMessages: string[] }
) {
  try {
    await db.insert(warrantyChecks).values({
      serialNumber: serial ?? "",
      purchaseDate: date || null,
      programStart: PROGRAM_START_DATE,
      result: {
        covered: r.status === "covered",
        localErrors: r.localErrors,
        vendorErrors: r.vendorErrors,
        vendorMessages: r.vendorMessages,
        note: PROGRAM_START_TEXT,
      },
      status: r.status,
    });
  } catch (e) {
    console.error("warranty save error:", e);
  }
}
