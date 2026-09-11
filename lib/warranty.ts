/**
 * Логика проверки гарантийности (чистые функции, тестируемы).
 *
 * Централизованная бесплатная гарантия ASUS (условия программы):
 *  - тип продукта: ноутбуки
 *  - регион продаж: Россия
 *  - дата продажи по чеку: с 01.01.2026
 *  - дата производства по серийному номеру: не ранее 01.07.2025
 *
 * Валидность SN и страна отгрузки — проверка у вендора:
 * POST https://as-russia.ru/api/check_sn (Auth: Bearer …),
 * ответ { errors: string[], messages: string[], serial_number }.
 * messages не пуст и errors пуст → устройство подпадает под гарантию.
 */

export const SN_MIN = 12;
export const SN_MAX = 20;
export const PROGRAM_START_DATE = "2026-01-01";
export const PROGRAM_START_TEXT = "1 января 2026";

export type WarrantyInput = {
  serial_number?: unknown;
  purchase_date?: unknown;
};

export type ValidatedInput = {
  serial: string;
  date: string;
  purchase: Date | null;
  errors: string[];
};

export function validateWarrantyInput(body: WarrantyInput): ValidatedInput {
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
    errors.push("Укажите дату покупки (дату продажи по чеку)");
  } else if (!purchase || Number.isNaN(purchase.getTime())) {
    errors.push("Некорректная дата покупки");
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (purchase.getTime() > today.getTime()) {
      errors.push("Дата покупки не может быть в будущем");
    }
  }

  return { serial, date, purchase, errors };
}

/**
 * Местная проверка условия программы: дата продажи по чеку — с 01.01.2026.
 * Возвращает текст отказа или null, если дата подходит.
 * ISO-даты сравниваются строково корректно.
 */
export function purchaseDateRejection(date: string): string | null {
  if (date < PROGRAM_START_DATE) {
    return (
      `Централизованная бесплатная гарантия распространяется только на устройства, ` +
      `приобретённые с ${PROGRAM_START_TEXT} (дата продажи по чеку). ` +
      `По данному аппарату гарантийные обязательства выполняет магазин, в котором Вы приобрели данное устройство. ` +
      `Пожалуйста, обратитесь в торгующую организацию для получения гарантийного обслуживания.`
    );
  }
  return null;
}

export type VendorPayload = {
  errors: string[];
  messages: string[];
  serial_number?: string;
};

/** Устройство подпадает под централизованную гарантию, если вендор вернул только messages. */
export function isVendorCovered(v: VendorPayload): boolean {
  return (v.messages ?? []).length > 0 && (v.errors ?? []).length === 0;
}
