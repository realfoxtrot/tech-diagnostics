import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { authorizedCentersCount, citiesInCount } from "@/lib/plural";
import WarrantyChecker from "@/components/WarrantyChecker";

export const metadata: Metadata = {
  title: "Проверка гарантийности — AS-RUSSIA",
  description:
    "Проверьте, подпадает ли ваш ноутбук ASUS под централизованную бесплатную гарантию: дата продажи по чеку + серийный номер.",
};

export default async function WarrantyPage() {
  const centers = await db.query.serviceCenters.findMany({
    where: (sc, { eq }) => eq(sc.isActive, 1),
  });
  const cities = new Set(centers.map((c) => c.city).filter(Boolean)).size;

  return (
    <main className="flex-1 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <WarrantyChecker />

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Link
            href="/diagnosis"
            className="bg-card border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(16,35,58,0.06)] hover:border-accent hover:-translate-y-0.5 transition"
          >
            <span className="mb-4 w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-accent">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <div className="font-semibold text-foreground">Что-то сломалось?</div>
            <p className="text-sm text-muted mt-1">
              Начните с бесплатной диагностики — она определит проблему и подскажет,
              что можно сделать самому.
            </p>
          </Link>
          <Link
            href="/centers"
            className="bg-card border border-border rounded-xl p-6 shadow-[0_1px_3px_rgba(16,35,58,0.06)] hover:border-accent hover:-translate-y-0.5 transition"
          >
            <span className="mb-4 w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-accent">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <div className="font-semibold text-foreground">Куда нести на обслуживание?</div>
            <p className="text-sm text-muted mt-1">
              {authorizedCentersCount(centers.length)} в {citiesInCount(cities)} по России:
              адреса, контакты, режим работы.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
