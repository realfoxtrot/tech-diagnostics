/**
 * Логика проверки гарантийности (чистые функции, тестируемы).
 *
 * Централизованная бесплатная гарантия ASUS — 4 условия:
 *  1. тип продукта: только ноутбуки;
 *  2. регион продаж: Россия;
 *  3. дата продажи по чеку: с 01.01.2026 (локальная проверка по вводу клиента);
 *  4. дата производства по серийному номеру: не ранее 01.07.2025.
 *
 * Вендорский API (POST as-russia.ru/api/check_sn) проверяет ТОЛЬКО:
 * валидность SN (ноутбук ли), страну отгрузки и дату отгрузки.
 * Вердикт «подпадает / не подпадает» выносит локальная логика по 4 условиям.
 */

export const SN_MIN = 12;
export const SN_MAX = 20;
export const PROGRAM_START_DATE = "2026-01-01";
export const PROGRAM_START_TEXT = "1 января 2026";
// Дату производства (не ранее 01.07.2025) проверяет вендор по SN —
// локальной проверки нет, константа не нужна.

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
    errors.push("Серийный номер может содержать только буквы, цифры, дефис и слэш");
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

// ─── Условия программы ─────────────────────────────────────────────

export type ConditionKey = "device" | "region" | "saleDate" | "productionDate";
export type ConditionStatus = "pass" | "fail" | "unknown";

export type Condition = {
  key: ConditionKey;
  status: ConditionStatus;
  detail?: string;
};

export type Verdict = {
  covered: boolean;
  conditions: Condition[];
  reasons: string[];
};

/**
 * Условие 3: дата продажи по чеку — с 01.01.2026 (строковое сравнение ISO).
 * detail — дата в формате dd.mm.yyyy для показа в чеклисте.
 */
export function saleDateCondition(date: string): Condition {
  const detail = date
    ? new Date(date + "T00:00:00").toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : undefined;
  const ok = !date || date >= PROGRAM_START_DATE;
  return { key: "saleDate", status: ok ? "pass" : "fail", detail };
}

export function saleDateRejection(date: string): string | null {
  if (date && date < PROGRAM_START_DATE) {
    return (
      `Дата продажи по чеку — ${new Date(date + "T00:00:00").toLocaleDateString("ru-RU")}. ` +
      `Централизованная бесплатная гарантия распространяется только на устройства, ` +
      `приобретённые с ${PROGRAM_START_TEXT} (по чеку). ` +
      `По такому устройству гарантийные обязательства выполняет магазин, в котором Вы его приобрели.`
    );
  }
  return null;
}

export type VendorResponse = {
  errors: string[];
  messages: string[];
  serial_number?: string;
};

/**
 * Ответ вендора = только факты: валидность SN (ноутбук ли), страна отгрузки,
 * дата отгрузки.
 *  - errors пуст и messages не пуст → все три фактора подтверждены (pass);
 *  - errors не пуст → вендор не подтвердил (fail), текст ошибки показываем как есть.
 */
export function vendorConditions(v: VendorResponse): Condition[] {
  const ok = v.errors.length === 0 && v.messages.length > 0;
  const status: ConditionStatus = ok ? "pass" : "fail";
  return [
    { key: "device", status },
    { key: "region", status },
    { key: "productionDate", status },
  ];
}

/**
 * Итоговый вердикт: подпадает под централизованную гарантию, только если
 * выполнены ВСЕ 4 условия программы. Вендор недоступен (null) → три
 * вендорских условия = unknown (не подтверждено), covered = false.
 */
export function buildVerdict(opts: {
  saleDate: string;
  vendor?: VendorResponse | null;
}): Verdict {
  const vendorConds: Condition[] = opts.vendor
    ? vendorConditions(opts.vendor)
    : [
        { key: "device", status: "unknown" },
        { key: "region", status: "unknown" },
        { key: "productionDate", status: "unknown" },
      ];

  const conditions: Condition[] = [...vendorConds, saleDateCondition(opts.saleDate)];
  const order: ConditionKey[] = ["device", "region", "saleDate", "productionDate"];
  conditions.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  const reasons: string[] = [];
  const saleRej = saleDateRejection(opts.saleDate);
  if (saleRej) reasons.push(saleRej);
  if (!opts.vendor) {
    reasons.push(
      "Не удалось проверить данные вендора (сервис временно недоступен). Попробуйте позже или запросите проверку в техподдержке."
    );
  } else if (opts.vendor.errors.length > 0) {
    reasons.push(...opts.vendor.errors);
  }

  const covered = conditions.every((c) => c.status === "pass");
  return { covered, conditions, reasons };
}
