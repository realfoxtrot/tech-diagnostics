/**
 * Логика проверки гарантийности (чистые функции, тестируемы).
 *
 * Предварительный расчёт: стандартная гарантия производителя — 24 мес. с даты покупки.
 * Финальный статус (даты активации по данным поставщика) уточняет техподдержка.
 */

export const WARRANTY_MONTHS = 24;
export const SN_MIN = 12;
export const SN_MAX = 20;

export type WarrantyInput = {
  serial_number?: unknown;
  purchase_date?: unknown;
};

export type WarrantyResult = {
  errors: string[];
  messages: string[];
  serial_number: string;
};

export function validateWarrantyInput(body: WarrantyInput): {
  serial: string;
  date: string;
  purchase: Date | null;
  errors: string[];
} {
  const serial = typeof body.serial_number === "string" ? body.serial_number.trim() : "";
  const date = typeof body.purchase_date === "string" ? body.purchase_date.trim() : "";
  const errors: string[] = [];

  if (!serial) errors.push("Введите серийный номер");
  if (serial.length > 0 && (serial.length < SN_MIN || serial.length > SN_MAX)) {
    errors.push(`Длина SN должна быть между ${SN_MIN} и ${SN_MAX} символами`);
  }
  if (serial && !/^[A-Za-z0-9][A-Za-z0-9\-/]*$/.test(serial)) {
    errors.push("Серийный номер может содержать только буквы, цифры и дефис");
  }

  const purchase = date ? new Date(date + "T00:00:00") : null;
  if (!date) {
    errors.push("Укажите дату покупки");
  } else if (!purchase || Number.isNaN(purchase.getTime())) {
    errors.push("Некорректная дата покупки");
  } else if (purchase.getTime() > startOfDay(new Date()).getTime()) {
    errors.push("Дата покупки не может быть в будущем");
  }

  return { serial, date, purchase, errors };
}

export function warrantyMessages(purchase: Date, now: Date = new Date()): {
  inWarranty: boolean;
  warrantyUntil: string; // ISO yyyy-mm-dd
  messages: string[];
} {
  const warrantyUntil = new Date(purchase.getTime());
  warrantyUntil.setMonth(warrantyUntil.getMonth() + WARRANTY_MONTHS);

  const inWarranty = warrantyUntil.getTime() >= startOfDay(now).getTime();
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fmt = (d: Date) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  const messages: string[] = [];
  messages.push(
    inWarranty
      ? `Гарантия действует до ${fmt(warrantyUntil)} (предварительно: ${WARRANTY_MONTHS} мес. с даты покупки ${fmt(purchase)})`
      : `Гарантийный срок, по предварительному расчёту, истёк ${fmt(warrantyUntil)}`
  );
  messages.push(
    inWarranty
      ? "Устройство можно бесплатно обслуживать в авторизованном сервисном центре AS-RUSSIA при производственной неисправности."
      : "Возможен платный (негарантийный) ремонт. Точный статус подтвердит техподдержка по данным поставщика."
  );
  messages.push(
    "Обращение зафиксировано: финальный статус (даты активации по данным поставщика) уточнит служба технической поддержки."
  );

  return { inWarranty, warrantyUntil: iso(warrantyUntil), messages };
}

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
