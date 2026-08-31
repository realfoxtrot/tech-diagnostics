import { db } from "@/db";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

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
          <div className="grid gap-4 md:grid-cols-2">
            {centers.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-xl text-foreground">{c.name}</h2>
                <p className="text-foreground mt-2 flex items-center gap-1">
                  <span>📍</span> {c.address}
                </p>
                {c.phone && <p className="text-foreground mt-1 flex items-center gap-1">
                  <span>📞</span> {c.phone}
                </p>}
                {c.email && <p className="text-foreground mt-1 flex items-center gap-1">
                  <span>✉️</span> {c.email}
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
                    className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover transition"
                  >
                    Показать на карте
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
