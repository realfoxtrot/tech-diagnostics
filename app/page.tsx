import Link from "next/link";
import DiagnosisChat from "@/components/DiagnosisChat";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Диагностика ноутбука</h1>
              <p className="text-muted mt-2 text-base">
                Ответьте на несколько вопросов — поможем определить проблему, попробуем решить её
                самостоятельно или направим в сервисный центр.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="flex-1 px-4 py-8">
        <DiagnosisChat />
      </section>

      <footer className="bg-card border-t border-border py-4 text-center text-sm">
        <Link href="/admin" className="text-accent hover:text-accent-hover font-medium transition">
          Администратору
        </Link>
      </footer>
    </main>
  );
}
