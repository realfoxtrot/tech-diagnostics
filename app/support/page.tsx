import type { Metadata } from "next";
import Link from "next/link";
import SupportFormStub from "@/components/SupportFormStub";

export const metadata: Metadata = {
  title: "Запрос в техподдержку — AS-RUSSIA",
};

export default function SupportPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">💬</div>
          <h1 className="text-2xl font-bold text-foreground">Запрос в службу технической поддержки</h1>
          <p className="text-muted mt-3">
            Эксперты AS-RUSSIA возьмут ваше обращение в работу: уточнят детали, дадут
            рекомендацию или направят в ближайший сервисный центр.
          </p>
        </div>

        <SupportFormStub />

        <div className="mt-4 rounded-xl bg-background border border-border p-4 text-sm text-muted text-center">
          🚧 Оформление запросов открывается скоро. Пока — начните с бесплатной диагностики:
          она решит проблему или подготовит техдокумент для инженера.
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/diagnosis"
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium transition"
          >
            🔍 Диагностика сейчас
          </Link>
          <Link
            href="/centers"
            className="px-5 py-2.5 rounded-xl border border-border hover:border-accent text-foreground transition"
          >
            Сервисные центры
          </Link>
        </div>
      </div>
    </main>
  );
}
