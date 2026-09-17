import { db } from "@/db";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import CentersMap from "@/components/CentersMap";

export const dynamic = "force-dynamic";

type Center = {
  id: number;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  workhours: string | null;
  lat: string | null;
  lng: string | null;
};

// Название города для заголовка группы: убираем префикс «г. » (записи в БД
// «г. Москва», «г. Казань»…) — заголовок «Москва», не «г. Москва».
function cityHeading(city: string | null): string {
  const raw = (city ?? "").trim();
  return raw.replace(/^г\.\s*/i, "") || "Без города";
}

// Группировка по городам: одинаковый нормализованный город (без учёта
// регистра) → одна группа (на случай «Москва»/«г. Москва»/«москва»),
// заголовок — из первого СЦ группы, группы — по алфавиту (ru).
function groupByCity(centers: Center[]): { city: string; centers: Center[] }[] {
  const byKey = new Map<string, { city: string; centers: Center[] }>();
  for (const c of centers) {
    const heading = cityHeading(c.city);
    const key = heading.toLowerCase();
    const g = byKey.get(key);
    if (g) g.centers.push(c);
    else byKey.set(key, { city: heading, centers: [c] });
  }
  return [...byKey.values()].sort((a, b) => a.city.localeCompare(b.city, "ru"));
}

function RowIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function CenterCard({ c }: { c: Center }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-[0_1px_3px_rgba(16,35,58,0.06)]">
      <h3 className="font-bold text-xl text-foreground">{c.name}</h3>
      <p className="text-foreground mt-2 flex items-center gap-2">
        <RowIcon d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
        {c.address}
      </p>
      {c.phone && <p className="text-foreground mt-1 flex items-center gap-2">
        <RowIcon d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2.11 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /> <a href={`tel:${c.phone.replace(/[^+\d]/g, "")}`} className="hover:text-accent transition">{c.phone}</a>
      </p>}
      {c.workhours && <p className="text-foreground mt-1 flex items-center gap-2 text-sm">
        <RowIcon d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
        {c.workhours}
      </p>}
      {c.email && <p className="text-foreground mt-1 flex items-center gap-2">
        <RowIcon d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        <a href={`mailto:${c.email}`} className="hover:text-accent transition">{c.email}</a>
      </p>}
      {c.website && (
        <a href={c.website} target="_blank" rel="noreferrer" className="inline-block mt-3 text-accent hover:text-accent-hover hover:underline text-sm">
          {c.website}
        </a>
      )}
      {c.lat && c.lng && (
        <a
          href={`https://yandex.ru/maps/?pt=${c.lng},${c.lat}&z=17&l=map`}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-3 px-3 py-1.5 rounded-lg btn-accent text-sm hover:bg-accent-hover transition"
        >
          Построить маршрут
        </a>
      )}
    </div>
  );
}

export default async function CentersPage() {
  const centers = await db.query.serviceCenters.findMany({
    where: (sc, { eq }) => eq(sc.isActive, 1),
    orderBy: (sc, { asc }) => [asc(sc.name)],
  });

  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-accent hover:text-accent-hover hover:underline transition">← На главную</Link>
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-bold mt-4 mb-6 text-foreground">Сервисные центры</h1>

        {centers.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted text-lg">Список сервисных центров пуст.</p>
          </div>
        ) : (
          <>
            {/* Карта с пинами */}
            <div className="mb-6">
              <CentersMap
                centers={centers.map((c) => ({
                  id: c.id,
                  name: c.name,
                  address: c.address,
                  phone: c.phone,
                  workhours: c.workhours,
                  lat: c.lat ? Number(c.lat) : null,
                  lng: c.lng ? Number(c.lng) : null,
                }))}
              />
            </div>

            {/* СЦ по городам: заголовок города + сетка карточек (города — по алфавиту) */}
            <div className="space-y-8">
              {groupByCity(centers).map((g) => (
                <section key={g.city}>
                  <h2 className="text-2xl font-bold mb-3 text-foreground">{g.city}</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {g.centers.map((c) => (
                      <CenterCard key={c.id} c={c} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
