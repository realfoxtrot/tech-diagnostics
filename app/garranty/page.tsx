import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Проверка гарантийности — AS-RUSSIA",
};

export default function WarrantyPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
        <div className="text-5xl mb-4">🛡️</div>
        <h1 className="text-2xl font-bold text-foreground">Проверка гарантийности</h1>
        <p className="text-muted mt-3">
          Мы уточняем статус гарантии и условия ремонта вашего ноутбука у поставщика.
          Сервис временно недоступен — раздел находится в разработке.
        </p>
        <div className="mt-6 rounded-xl bg-background border border-border p-4 text-sm text-muted">
          В скором времени: проверка по серийному номеру, сроку и условиям приобретения.
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/diagnosis"
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium transition"
          >
            🔍 Диагностика сейчас
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-border hover:border-accent text-foreground transition"
          >
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
