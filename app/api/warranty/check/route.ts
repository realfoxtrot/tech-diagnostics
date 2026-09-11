import { NextResponse } from "next/server";
import { db } from "@/db";
import { warrantyChecks } from "@/db/schema";
import {
  validateWarrantyInput,
  buildVerdict,
  PROGRAM_START_DATE,
} from "@/lib/warranty";
import { checkSerialAtVendor } from "@/lib/vendor";

export const dynamic = "force-dynamic";

/**
 * Проверка гарантийности (централизованная гарантия ASUS).
 *
 * Вендор (POST as-russia.ru/api/check_sn) проверяет только: валидность SN
 * (ноутбук ли), страну отгрузки, дату отгрузки.
 * Вердикт «подпадает / не подпадает» — локальная логика по 4 условиям:
 *   1. только ноутбуки; 2. регион РФ; 3. дата продажи по чеку с 01.01.2026;
 *   4. дата производства по SN не ранее 01.07.2025.
 *
 * Ответ: { errors, messages, serial_number, covered, conditions[] }
 * (первые три поля — формат as-russia.ru для совместимости).
 */
export async function POST(req: Request) {
  let body: { serial_number?: unknown; purchase_date?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errors: ["Некорректный запрос"], messages: [] }, { status: 400 });
  }

  const { serial, date, errors } = validateWarrantyInput(body);
  if (errors.length > 0) {
    await saveCheck(serial || null, date, {
      status: "rejected",
      localErrors: errors,
      vendorErrors: [],
      vendorMessages: [],
      conditions: [],
      covered: false,
    });
    return NextResponse.json(
      { errors, messages: [], serial_number: serial, covered: false, conditions: [] },
      { status: 400 }
    );
  }

  const vendor = await checkSerialAtVendor(serial, date);
  const verdict = buildVerdict({ saleDate: date, vendor });

  // Текст результата: причины отказа (локальные + вендор) или подтверждение.
  const errorsOut: string[] = verdict.covered ? [] : verdict.reasons;
  const messagesOut: string[] = verdict.covered
    ? [
        "Устройство подпадает под централизованную бесплатную гарантию ASUS.",
        "Его можно бесплатно обслуживать в авторизованном сервисном центре AS-RUSSIA при производственной неисправности.",
      ]
    : [];

  const status = verdict.covered ? "covered" : vendor ? "rejected" : "error";

  await saveCheck(serial, date, {
    status,
    localErrors: [],
    vendorErrors: vendor?.errors ?? [],
    vendorMessages: vendor?.messages ?? [],
    conditions: verdict.conditions,
    covered: verdict.covered,
  });

  return NextResponse.json(
    {
      errors: errorsOut,
      messages: messagesOut,
      serial_number: vendor?.serial_number ?? serial,
      covered: verdict.covered,
      conditions: verdict.conditions,
    },
    { status: verdict.covered ? 200 : 400 }
  );
}

async function saveCheck(
  serial: string | null,
  date: string,
  r: {
    status: string;
    localErrors: string[];
    vendorErrors: string[];
    vendorMessages: string[];
    conditions: unknown[];
    covered: boolean;
  }
) {
  try {
    await db.insert(warrantyChecks).values({
      serialNumber: serial ?? "",
      purchaseDate: date || null,
      programStart: PROGRAM_START_DATE,
      result: {
        covered: r.covered,
        conditions: r.conditions,
        localErrors: r.localErrors,
        vendorErrors: r.vendorErrors,
        vendorMessages: r.vendorMessages,
      },
      status: r.status,
    });
  } catch (e) {
    console.error("warranty save error:", e);
  }
}
