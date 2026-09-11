/**
 * Клиент вендорского API проверки серийного номера (ASUS).
 *
 * Токен берётся из файла WARRANTY_VENDOR_TOKEN_FILE (по умолчанию
 * data/vendor_token.txt, не в git, права 600) — токен периодически
 * меняется, поэтому файл удобнее редактировать и перезапускать сервис,
 * чем править окружение.
 *
 * Ответ вендора: { errors: string[], messages: string[], serial_number }.
 * errors не пуст / fetch упал → null (вызывающий сообщает «не удалось
 * проверить»).
 */

import { readFileSync } from "node:fs";

const VENDOR_URL = "https://as-russia.ru/api/check_sn";

export type VendorCheckResult = {
  errors: string[];
  messages: string[];
  serial_number?: string;
};

export function getVendorToken(): string | null {
  const file = process.env.WARRANTY_VENDOR_TOKEN_FILE ?? "./data/vendor_token.txt";
  try {
    const token = readFileSync(file, "utf-8").trim();
    return token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

export async function checkSerialAtVendor(serialNumber: string, purchaseDate: string): Promise<VendorCheckResult | null> {
  const token = getVendorToken();
  if (!token) return null;

  let res: Response;
  try {
    res = await fetch(VENDOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Auth: `Bearer ${token}` },
      body: JSON.stringify({ serial_number: serialNumber, purchase_date: purchaseDate }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
  } catch {
    return null;
  }

  try {
    const data = (await res.json()) as Partial<VendorCheckResult>;
    return {
      errors: Array.isArray(data.errors) ? data.errors : [],
      messages: Array.isArray(data.messages) ? data.messages : [],
      serial_number: typeof data.serial_number === "string" ? data.serial_number : undefined,
    };
  } catch {
    return null;
  }
}
