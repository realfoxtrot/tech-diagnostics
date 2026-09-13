import DiagnosisChat from "@/components/DiagnosisChat";

export const metadata = {
  title: "Диагностика ноутбука — AS-RUSSIA",
};

export default function DiagnosisPage() {
  return (
    <main className="flex-1 flex flex-col">
      <div className="max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold text-foreground">Диагностика ноутбука</h1>
        <p className="text-muted mt-1 mb-6">
          Ответьте на несколько вопросов — поможем определить проблему, попробуем решить её
          самостоятельно или направим в сервисный центр.
        </p>
      </div>
      <section className="flex-1 px-4 pb-12">
        <DiagnosisChat />
      </section>
    </main>
  );
}
