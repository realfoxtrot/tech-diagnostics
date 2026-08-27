import { db } from "@/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CentersPage() {
  const centers = await db.query.serviceCenters.findMany({
    where: (sc, { eq }) => eq(sc.isActive, 1),
    orderBy: (sc, { asc }) => [asc(sc.name)],
  });

  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← На главную</Link>
        <h1 className="text-2xl font-bold mt-4 mb-6">Сервисные центры</h1>

        {centers.length === 0 ? (
          <p className="text-slate-500">Список сервисных центров пуст.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {centers.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-lg">{c.name}</h2>
                <p className="text-slate-600 mt-1">📍 {c.address}</p>
                {c.phone && <p className="text-slate-600">📞 {c.phone}</p>}
                {c.email && <p className="text-slate-600">✉️ {c.email}</p>}
                {c.website && (
                  <a href={c.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">
                    {c.website}
                  </a>
                )}
                {c.lat && c.lng && (
                  <a
                    href={`https://yandex.ru/maps/?pt=${c.lng},${c.lat}&z=17&l=map`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm hover:bg-indigo-100 transition"
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
