/**
 * Склонение существительных/прилагательных с числительными (3 формы).
 * Form1: 1, 21, 31… (кроме 11) — «сервисный центр», «городе»
 * Form2: 2–4, 22–24… (кроме 12–14) — «сервисных центра», «городах»
 * Form5: 0, 5–20, 25–30… — «сервисных центров», «городах»
 */
export function getPluralForm(number: number, form1: string, form2: string, form5: string): string {
  const n100 = Math.abs(number) % 100;
  const n10 = n100 % 10;

  if (n100 >= 11 && n100 <= 19) {
    return form5;
  }
  if (n10 === 1) {
    return form1;
  }
  if (n10 >= 2 && n10 <= 4) {
    return form2;
  }
  return form5;
}

/** «N сервисных центров» — 1 сервисный центр, 3 сервисных центра, 5 сервисных центров */
export function centersCount(count: number): string {
  return `${count} ${getPluralForm(count, "сервисный центр", "сервисных центра", "сервисных центров")}`;
}

/** «N авторизованных сервисных центров» — 1 авторизованный сервисный центр, 3 авторизованных сервисных центра, 5 авторизованных сервисных центров */
export function authorizedCentersCount(count: number): string {
  return `${count} ${getPluralForm(count, "авторизованный сервисный центр", "авторизованных сервисных центра", "авторизованных сервисных центров")}`;
}

/** «N городов» (именительный/родительный: сколько) — 1 город, 3 города, 5 городов */
export function citiesCount(count: number): string {
  return `${count} ${getPluralForm(count, "город", "города", "городов")}`;
}

/** «N городе/городах» (предложный падеж после «в») — 1 городе, 5 городах */
export function citiesInCount(count: number): string {
  const n100 = Math.abs(count) % 100;
  return `${count} ${n100 !== 11 && n100 % 10 === 1 ? "городе" : "городах"}`;
}

/** «N сервисных центров в M городах» — полная фраза */
export function centersInCitiesPhrase(centers: number, cities: number): string {
  return `${centersCount(centers)} в ${citiesInCount(cities)}`;
}
