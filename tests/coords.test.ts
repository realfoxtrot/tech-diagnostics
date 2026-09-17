import { describe, expect, it } from "vitest";
import { toCoords } from "@/lib/coords";

describe("toCoords", () => {
  it("валидные координаты", () => {
    expect(toCoords("55.75", "37.61")).toEqual({ lat: 55.75, lng: 37.61 });
    expect(toCoords(" 55.75 ", "37.61")).toEqual({ lat: 55.75, lng: 37.61 }); // пробелы
    expect(toCoords("-90", "-180")).toEqual({ lat: -90, lng: -180 }); // границы
    expect(toCoords("90", "180")).toEqual({ lat: 90, lng: 180 });
    expect(toCoords("0", "0")).toEqual({ lat: 0, lng: 0 }); // 0 — валидно
  });

  it("null/пустые → null", () => {
    expect(toCoords(null, "37.61")).toBeNull();
    expect(toCoords("55.75", null)).toBeNull();
    expect(toCoords(null, null)).toBeNull();
    expect(toCoords("", "37.61")).toBeNull();
    expect(toCoords("55.75", "")).toBeNull(); // Number("") === 0 — ловим явно
  });

  it("мусор из ручного seed → null", () => {
    expect(toCoords("abc", "37.61")).toBeNull();
    expect(toCoords("55,75", "37.61")).toBeNull(); // запятая — не число
    expect(toCoords("55.75", "37,61")).toBeNull();
    expect(toCoords("55.75abc", "37.61")).toBeNull();
    expect(toCoords("nan", "37.61")).toBeNull();
    expect(toCoords("55.75 37.61", "1")).toBeNull(); // два числа в одной строке
  });

  it("вне диапазона → null", () => {
    expect(toCoords("90.1", "37.61")).toBeNull();
    expect(toCoords("-90.1", "37.61")).toBeNull();
    expect(toCoords("55.75", "180.1")).toBeNull();
    expect(toCoords("55.75", "-180.1")).toBeNull();
    // классическая путаница lng/lat: долгота не может быть > 90 по модулю…
    // (55.75, 37.61 vs 37.61, 55.75 — обе в диапазоне, не ловим, не наша задача)
  });
});
