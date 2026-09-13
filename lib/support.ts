/**
 * Логика обращения в техподдержку ASUS (обёртка над вендорской формой).
 *
 * Оригинальная форма ASUS (questionform) отдаёт `x-frame-options: SAMEORIGIN`
 * и CSP `frame-ancestors 'self' *.asus.com` → iframe невозможен. Поэтому наша
 * форма собирает контекст, сохраняет обращение и отдаёт готовый текст, который
 * пользователь вставляет в поле описания проблемы на форме ASUS.
 *
 * Публичного API у вендорской формы нет (нужна своя сессия) — сетевых вызовов
 * к asus.com из нашего бэкенда нет и не должно быть.
 *
 * Всё здесь — чистые функции (тестируемо).
 */

export const ASUS_SUPPORT_FORM_URL =
  "https://www.asus.com/support/Product/ContactUs/Services/questionform/?lang=ru-ru";

export const SUPPORT_PRODUCT_TYPES = [
  "Ноутбук",
  "Zenbook",
  "Vivobook",
  "ROG",
  "TUF Gaming",
  "ProArt",
  "Другое",
] as const;

export const DEFAULT_PRODUCT_TYPE = "Ноутбук";

export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 5000;
export const SN_MIN = 12;
export const SN_MAX = 20;
export const FULLNAME_MAX = 200;
export const EMAIL_MAX = 254;
export const PHONE_MAX = 32;
export const CITY_MAX = 100;

/** Телефон: цифры, +, -, пробелы, скобки; 5..20 значащих цифр. */
const PHONE_RE = /^\+?[\d\s\-()]{5,32}$/;

export type SupportInput = {
  full_name?: unknown;
  email?: unknown;
  phone?: unknown;
  product_type?: unknown;
  serial?: unknown;
  purchase_date?: unknown;
  city?: unknown;
  description?: unknown;
  consent?: unknown;
};

export type ValidatedSupport = {
  fullName: string;
  email: string;
  phone: string;
  productType: string;
  serial: string;
  purchaseDate: string;
  city: string;
  description: string;
  errors: string[];
};

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

// Простая, но достаточная проверка формата email (как на форме ASUS).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSupportInput(body: SupportInput): ValidatedSupport {
  const fullName = str(body.full_name);
  const email = str(body.email);
  const phone = str(body.phone);
  const rawType = str(body.product_type) || DEFAULT_PRODUCT_TYPE;
  const productType = (SUPPORT_PRODUCT_TYPES as readonly string[]).includes(rawType)
    ? rawType
    : DEFAULT_PRODUCT_TYPE;
  const serial = str(body.serial).toUpperCase();
  const purchaseDate = str(body.purchase_date);
  const city = str(body.city);
  const description = str(body.description);
  const errors: string[] = [];

  if (!fullName) errors.push("Укажите ФИО или имя");
  if (fullName.length > FULLNAME_MAX) errors.push("ФИО слишком длинное");

  if (!email) {
    errors.push("Укажите email");
  } else if (email.length > EMAIL_MAX) {
    errors.push("Email слишком длинный");
  } else if (!EMAIL_RE.test(email)) {
    errors.push("Некорректный email");
  }

  if (phone && (phone.length > PHONE_MAX || !PHONE_RE.test(phone))) {
    errors.push("Некорректный телефон");
  }

  if (city.length > CITY_MAX) errors.push("Город слишком длинный");

  if (!description) {
    errors.push("Опишите проблему");
  } else if (description.length < DESCRIPTION_MIN) {
    errors.push(`Описание проблемы должно быть не короче ${DESCRIPTION_MIN} символов`);
  } else if (description.length > DESCRIPTION_MAX) {
    errors.push(`Описание проблемы должно быть не длиннее ${DESCRIPTION_MAX} символов`);
  }

  if (serial.length > 0) {
    if (serial.length < SN_MIN || serial.length > SN_MAX) {
      errors.push(`Длина серийного номера должна быть от ${SN_MIN} до ${SN_MAX} символов`);
    } else if (!/^[A-Z0-9][A-Z0-9\-/]*$/.test(serial)) {
      errors.push("Серийный номер может содержать только буквы, цифры, дефис и слэш");
    }
  }

  if (purchaseDate && Number.isNaN(new Date(purchaseDate + "T00:00:00").getTime())) {
    errors.push("Некорректная дата покупки");
  }

  if (body.consent !== true) {
    errors.push("Необходимо согласие на обработку персональных данных");
  }

  return { fullName, email, phone, productType, serial, purchaseDate, city, description, errors };
}

/** Человекочитаемый номер обращения: SR-YYYYMMDD-XXXX.
 *  Префикс SR (support request) — не пересекается с TD- (карты диагностики,
 *  таблица sessions): одно и то же значение не может оказаться в обеих таблицах. */
export function makeTicketNumber(now: Date = new Date(), rand?: number): string {
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const n = rand ?? Math.floor(1000 + Math.random() * 9000);
  return `SR-${ymd}-${n}`;
}

/** Готовый текст обращения для вставки в поле описания проблемы на форме ASUS. */
export function buildSupportMessage(
  data: Pick<
    ValidatedSupport,
    "fullName" | "email" | "phone" | "productType" | "serial" | "purchaseDate" | "city" | "description"
  >,
  ticketNumber: string
): string {
  const lines: string[] = [
    `Обращение ${ticketNumber}`,
    "",
    `ФИО: ${data.fullName}`,
    `Email: ${data.email}`,
  ];
  if (data.phone) lines.push(`Телефон: ${data.phone}`);
  lines.push(`Тип продукта: ${data.productType}`);
  if (data.serial) lines.push(`Серийный номер: ${data.serial}`);
  if (data.purchaseDate) lines.push(`Дата покупки: ${data.purchaseDate}`);
  if (data.city) lines.push(`Город: ${data.city}`);
  lines.push("", "Описание проблемы:", data.description);
  lines.push(
    "",
    "Обращение сформировано через сервис диагностики AS-RUSSIA (as-russia.ru)."
  );
  return lines.join("\n");
}
