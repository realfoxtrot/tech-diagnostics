// Координаты СЦ: в БД хранятся строки (service_centers.lat/lng, text),
// поэтому любая точка использования (ссылка на маршрут, пины карты)
// проходит через этот хелпер — иначе мусор в данных ("55,75", "abc")
// молча даёт битую ссылку или NaN-пин.

export type Coords = { lat: number; lng: number };

export function toCoords(lat: string | null, lng: string | null): Coords | null {
  if (lat == null || lng == null) return null;
  const la = lat.trim(), ln = lng.trim();
  // Number("") === 0 — пустая строка без этой проверки пройдёт как (0, x)
  if (la === "" || ln === "") return null;
  const a = Number(la);
  const b = Number(ln);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a < -90 || a > 90 || b < -180 || b > 180) return null;
  return { lat: a, lng: b };
}
