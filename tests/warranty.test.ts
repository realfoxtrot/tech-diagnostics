import { describe, it, expect } from "vitest";
import {
  validateWarrantyInput,
  purchaseDateRejection,
  isVendorCovered,
  PROGRAM_START_DATE,
} from "@/lib/warranty";

describe("warranty input validation", () => {
  it("пустой SN и дата → ошибки в обоих полях", () => {
    const r = validateWarrantyInput({ serial_number: "", purchase_date: "" });
    expect(r.errors).toContain("Введите серийный номер");
    expect(r.errors).toContain("Укажите дату покупки (дату продажи по чеку)");
  });

  it("короткий SN → ошибка длины", () => {
    const r = validateWarrantyInput({ serial_number: "100339", purchase_date: "2026-01-15" });
    expect(r.errors.join(" ")).toMatch(/Длина SN/);
  });

  it("SN с недопустимыми символами → ошибка", () => {
    const r = validateWarrantyInput({ serial_number: "10 0339077712", purchase_date: "2026-01-15" });
    expect(r.errors.join(" ")).toMatch(/только буквы/);
  });

  it("дата в будущем → ошибка", () => {
    const future = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    const r = validateWarrantyInput({ serial_number: "R8N0CV074276324", purchase_date: future });
    expect(r.errors.join(" ")).toMatch(/будущем/);
  });

  it("валидные входные данные → без ошибок", () => {
    const r = validateWarrantyInput({ serial_number: "R8N0CV074276324", purchase_date: "2026-01-20" });
    expect(r.errors).toEqual([]);
    expect(r.serial).toBe("R8N0CV074276324");
    expect(r.date).toBe("2026-01-20");
  });

  it("серийный номер обрезает пробелы по краям", () => {
    const r = validateWarrantyInput({ serial_number: "  R8N0CV074276324  ", purchase_date: "2026-01-20" });
    expect(r.errors).toEqual([]);
    expect(r.serial).toBe("R8N0CV074276324");
  });
});

describe("purchase date program condition (с 01.01.2026)", () => {
  it("дата до начала программы → отказ", () => {
    const rej = purchaseDateRejection("2025-12-31");
    expect(rej).not.toBeNull();
    expect(rej!).toMatch(/торгующую организацию/);
  });

  it("первый день программы → проходит", () => {
    expect(purchaseDateRejection(PROGRAM_START_DATE)).toBeNull();
  });

  it("дата в середине программы → проходит", () => {
    expect(purchaseDateRejection("2026-06-15")).toBeNull();
  });

  it("начало программы = 2026-01-01", () => {
    expect(PROGRAM_START_DATE).toBe("2026-01-01");
  });
});

describe("vendor response interpretation", () => {
  it("только messages → подпадает под гарантию", () => {
    expect(isVendorCovered({ errors: [], messages: ["Гарантия действует до 01.01.2028"] })).toBe(true);
  });

  it("есть errors → не подпадает", () => {
    expect(
      isVendorCovered({ errors: ["По данному аппарату гарантийные обязательства выполняет магазин"], messages: [] })
    ).toBe(false);
  });

  it("и errors и messages → не подпадает (errors приоритетны)", () => {
    expect(isVendorCovered({ errors: ["а"], messages: ["б"] })).toBe(false);
  });

  it("пустой ответ → не подпадает", () => {
    expect(isVendorCovered({ errors: [], messages: [] })).toBe(false);
  });
});
