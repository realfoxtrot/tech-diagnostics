import { describe, it, expect } from "vitest";
import {
  validateWarrantyInput,
  saleDateCondition,
  saleDateRejection,
  vendorConditions,
  buildVerdict,
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
});

describe("sale date condition (с 01.01.2026)", () => {
  it("дата до начала программы → fail", () => {
    expect(saleDateCondition("2025-12-31").status).toBe("fail");
  });

  it("первый день программы → pass", () => {
    expect(saleDateCondition(PROGRAM_START_DATE).status).toBe("pass");
  });

  it("дата в середине программы → pass", () => {
    expect(saleDateCondition("2026-06-15").status).toBe("pass");
  });

  it("рефьюз-текст содержит требование программы", () => {
    expect(saleDateRejection("2025-11-05")).toMatch(/1 января 2026/);
    expect(saleDateRejection("2026-01-01")).toBeNull();
  });
});

describe("vendor conditions (только факты: устройство, регион, дата отгрузки)", () => {
  const vendorOk = { errors: [], messages: ["OK"] };
  const vendorFail = {
    errors: ["По данному аппарату гарантийные обязательства выполняет магазин"],
    messages: [],
  };

  it("окей → все три pass", () => {
    const c = vendorConditions(vendorOk);
    expect(c.map((x) => x.key).sort()).toEqual(["device", "productionDate", "region"]);
    expect(c.every((x) => x.status === "pass")).toBe(true);
  });

  it("ошибка вендора → все три fail (факты не подтверждены)", () => {
    const c = vendorConditions(vendorFail);
    expect(c.every((x) => x.status === "fail")).toBe(true);
  });
});

describe("buildVerdict (локальный вердикт по 4 условиям)", () => {
  const vendorOk = { errors: [], messages: ["OK"] };
  const vendorFail = { errors: ["Это не серийный номер ноутбука"], messages: [] };

  it("все условия выполнены → covered", () => {
    const v = buildVerdict({ saleDate: "2026-01-20", vendor: vendorOk });
    expect(v.covered).toBe(true);
    expect(v.conditions).toHaveLength(4);
    expect(v.reasons).toEqual([]);
  });

  it("дата до программы → не covered, причина — текст программы", () => {
    const v = buildVerdict({ saleDate: "2025-11-05", vendor: vendorOk });
    expect(v.covered).toBe(false);
    expect(v.conditions.find((c) => c.key === "saleDate")!.status).toBe("fail");
    expect(v.reasons.join(" ")).toMatch(/1 января 2026/);
  });

  it("вендор отклонил → не covered, причина — текст вендора", () => {
    const v = buildVerdict({ saleDate: "2026-01-20", vendor: vendorFail });
    expect(v.covered).toBe(false);
    expect(v.conditions.find((c) => c.key === "device")!.status).toBe("fail");
    expect(v.reasons).toContain("Это не серийный номер ноутбука");
  });

  it("вендор недоступен (null) → unknown, не covered, причина — недоступность", () => {
    const v = buildVerdict({ saleDate: "2026-01-20", vendor: null });
    expect(v.covered).toBe(false);
    expect(v.conditions.filter((c) => c.status === "unknown")).toHaveLength(3);
    expect(v.reasons.join(" ")).toMatch(/Не удалось проверить/);
  });

  it("порядок условий: device, region, saleDate, productionDate", () => {
    const v = buildVerdict({ saleDate: "2026-01-20", vendor: vendorOk });
    expect(v.conditions.map((c) => c.key)).toEqual([
      "device",
      "region",
      "saleDate",
      "productionDate",
    ]);
  });
});
