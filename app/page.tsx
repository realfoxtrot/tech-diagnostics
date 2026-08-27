import Link from "next/link";
import DiagnosisChat from "@/components/DiagnosisChat";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">🔧 Диагностика ноутбука</h1>
          <p className="text-slate-500 mt-1">
            Ответьте на несколько вопросов — поможем определить проблему, попробуем решить её
            самостоятельно или направим в сервисный центр.
          </p>
        </div>
      </header>

      <section className="flex-1 px-4 py-8">
        <DiagnosisChat />
      </section>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-sm text-slate-400">
        <Link href="/admin" className="hover:text-slate-600">Администратору</Link>
      </footer>
    </main>
  );
}
