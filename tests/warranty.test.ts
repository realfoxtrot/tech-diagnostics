import { describe, it, expect } from "vitest";
import {
  validateWarrantyInput,
  warrantyMessages,
  startOfDay,
} from "@/lib/warranty";

const DAY = 86400000;

describe("warranty input validation", () => {
  it("пустой SN и дата → ошибки в обоих полях", () => {
    const r = validateWarrantyInput({ serial_number: "", purchase_date: "" });
    expect(r.errors).toContain("Введите серийный номер");
    expect(r.errors).toContain("Укажите дату покупки");
  });

  it("короткий SN → ошибка длины", () => {
    const r = validateWarrantyInput({ serial_number: "100339", purchase_date: "2024-01-15" });
    expect(r.errors.join(" ")).toMatch(/Длина SN/);
  });

  it("SN с недопустимыми символами → ошибка", () => {
    const r = validateWarrantyInput({ serial_number: "10-03-39077712", purchase_date: "2024-01-15" });
    // начинается с цифры, содержит дефисы — допустимо; а вот пробел/буква в середине нет
    expect(r.errors).not.toContain("Серийный номер может содержать только буквы, цифры и дефис");
    const r2 = validateWarrantyInput({ serial_number: "10 0339077712", purchase_date: "2024-01-15" });
    expect(r2.errors.join(" ")).toMatch(/только буквы/);
  });

  it("дата в будущем → ошибка", () => {
    const future = new Date(Date.now() + 10 * DAY).toISOString().slice(0, 10);
    const r = validateWarrantyInput({ serial_number: "100339077712", purchase_date: future });
    expect(r.errors.join(" ")).toMatch(/будущем/);
  });

  it("валидные входные данные → без ошибок", () => {
    const r = validateWarrantyInput({ serial_number: "100339077712", purchase_date: "2024-01-15" });
    expect(r.errors).toEqual([]);
    expect(r.purchase).toBeTruthy();
  });
});

describe("warranty calculation (24 мес. с даты покупки)", () => {
  it("покупка 10 месяцев назад → в гарантии", () => {
    const purchase = new Date(Date.now() - 300 * DAY);
    const r = warrantyMessages(purchase);
    expect(r.inWarranty).toBe(true);
    expect(r.messages[0]).toMatch(/Гарантия действует до/);
  });

  it("покупка 30 месяцев назад → гарантия истекла", () => {
    const purchase = new Date(Date.now() - 900 * DAY);
    const r = warrantyMessages(purchase);
    expect(r.inWarranty).toBe(false);
    expect(r.messages[0]).toMatch(/истёк/);
  });

  it("граница: ровно 24 месяца назад → ещё в гарантии (день закрытия)", () => {
    // ровно на границе: до конца дня окончания включительно
    const boundary = new Date();
    boundary.setMonth(boundary.getMonth() - 24);
    const r = warrantyMessages(boundary);
    expect(r.inWarranty).toBe(true);
  });

  it("день после границы → истекла", () => {
    const boundary = new Date();
    boundary.setMonth(boundary.getMonth() - 24);
    boundary.setDate(boundary.getDate() - 1);
    const r = warrantyMessages(boundary);
    expect(r.inWarranty).toBe(false);
  });

  it("startOfDay обнуляет время", () => {
    const d = new Date(2024, 5, 10, 15, 30, 45);
    const s = startOfDay(d);
    expect(s.getHours()).toBe(0);
    expect(s.getMinutes()).toBe(0);
  });

  it("warrantyUntil — ISO-дата через 24 месяца", () => {
    const r = warrantyMessages(new Date("2024-01-15T00:00:00"));
    expect(r.warrantyUntil).toBe("2026-01-15");
  });
});
