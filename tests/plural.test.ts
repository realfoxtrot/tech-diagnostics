import { describe, expect, it } from "vitest";
import {
  authorizedCentersCount,
  centersCount,
  centersInCitiesPhrase,
  citiesCount,
  citiesInCount,
  getPluralForm,
} from "@/lib/plural";

describe("getPluralForm", () => {
  it("форма 1 (1, 21, 31… кроме 11)", () => {
    for (const n of [1, 21, 31, 101, 1001]) {
      expect(getPluralForm(n, "f1", "f2", "f5")).toBe("f1");
    }
  });

  it("форма 2 (2–4, 22–24… кроме 12–14)", () => {
    for (const n of [2, 3, 4, 22, 23, 24, 32, 42]) {
      expect(getPluralForm(n, "f1", "f2", "f5")).toBe("f2");
    }
  });

  it("форма 5 (0, 5–20, 25–30…)", () => {
    for (const n of [0, 5, 6, 11, 12, 13, 14, 20, 25, 26, 30, 100, 111]) {
      expect(getPluralForm(n, "f1", "f2", "f5")).toBe("f5");
    }
  });

  it("отрицательные числа — как модуль", () => {
    expect(getPluralForm(-1, "f1", "f2", "f5")).toBe("f1");
    expect(getPluralForm(-3, "f1", "f2", "f5")).toBe("f2");
    expect(getPluralForm(-11, "f1", "f2", "f5")).toBe("f5");
  });
});

describe("фразы с количеством", () => {
  it("таблица примеров: центры (именительный)", () => {
    expect(centersCount(1)).toBe("1 сервисный центр");
    expect(centersCount(3)).toBe("3 сервисных центра");
    expect(centersCount(5)).toBe("5 сервисных центров");
    expect(centersCount(12)).toBe("12 сервисных центров");
    expect(centersCount(21)).toBe("21 сервисный центр");
    expect(centersCount(24)).toBe("24 сервисных центра");
    expect(centersCount(51)).toBe("51 сервисный центр");
  });

  it("авторизованные центры", () => {
    expect(authorizedCentersCount(1)).toBe("1 авторизованный сервисный центр");
    expect(authorizedCentersCount(3)).toBe("3 авторизованных сервисных центра");
    expect(authorizedCentersCount(51)).toBe("51 авторизованный сервисный центр");
  });

  it("города (именительный)", () => {
    expect(citiesCount(1)).toBe("1 город");
    expect(citiesCount(3)).toBe("3 города");
    expect(citiesCount(5)).toBe("5 городов");
    expect(citiesCount(11)).toBe("11 городов");
    expect(citiesCount(21)).toBe("21 город");
  });

  it("города (предложный, после «в»)", () => {
    expect(citiesInCount(1)).toBe("1 городе");
    expect(citiesInCount(21)).toBe("21 городе");
    expect(citiesInCount(3)).toBe("3 городах");
    expect(citiesInCount(11)).toBe("11 городах");
    expect(citiesInCount(44)).toBe("44 городах");
  });

  it("таблица примеров: полная фраза «центры в городах»", () => {
    expect(centersInCitiesPhrase(1, 1)).toBe("1 сервисный центр в 1 городе");
    expect(centersInCitiesPhrase(3, 2)).toBe("3 сервисных центра в 2 городах");
    expect(centersInCitiesPhrase(5, 21)).toBe("5 сервисных центров в 21 городе");
    expect(centersInCitiesPhrase(12, 11)).toBe("12 сервисных центров в 11 городах");
    expect(centersInCitiesPhrase(24, 105)).toBe("24 сервисных центра в 105 городах");
  });
});
