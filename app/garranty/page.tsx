import type { Metadata } from "next";
import Link from "next/link";
import WarrantyChecker from "@/components/WarrantyChecker";

export const metadata: Metadata = {
  title: "Проверка гарантийности — AS-RUSSIA",
  description: "Проверьте возможность бесплатного обслуживания вашего устройства: дата покупки + серийный номер.",
};

export default function WarrantyPage() {
  return (
    <main className="flex-1 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <WarrantyChecker />

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Link
            href="/diagnosis"
            className="bg-card border border-border rounded-2xl p-6 hover:border-accent transition"
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-semibold text-foreground">Что-то сломалось?</div>
            <p className="text-sm text-muted mt-1">
              Начните с бесплатной диагностики — она определит проблему и подскажет,
              что можно сделать самому.
            </p>
          </Link>
          <Link
            href="/centers"
            className="bg-card border border-border rounded-2xl p-6 hover:border-accent transition"
          >
            <div className="text-2xl mb-2">📍</div>
            <div className="font-semibold text-foreground">Куда нести на обслуживание?</div>
            <p className="text-sm text-muted mt-1">
              51 авторизованный сервисный центр по России: адреса, контакты, режим работы.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
