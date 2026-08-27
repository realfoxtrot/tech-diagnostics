import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TicketPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { ticket } = await searchParams;
  const sess = ticket
    ? await db.query.sessions.findFirst({
        where: eq(sessions.ticketNumber, ticket),
      })
    : null;

  if (!sess) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-[#1e293b]">Обращение не найдено</h1>
          <p className="text-[#64748b] mb-4">Проверьте номер обращения</p>
          <Link href="/" className="text-[#4f46e5] hover:text-[#4338ca] hover:underline transition">← На главную</Link>
        </div>
      </main>
    );
  }

  const transcript = (sess.transcript ?? []) as {
    type: string;
    question?: string;
    answer?: string;
    helped?: boolean;
    timestamp?: string;
  }[];
  const diagnosis = (sess.diagnosis ?? {}) as {
    category?: string | null;
    resolutionId?: number | null;
    resolutionTitle?: string | null;
  };

  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm text-[#64748b] mb-1">Карта диагностики</div>
              <div className="text-2xl font-mono font-bold text-[#1e293b]">{sess.ticketNumber}</div>
            </div>
            <div className="text-xs text-[#94a3b8]">Создано: {sess.createdAt}</div>
          </div>

          {diagnosis.category && (
            <div className="mb-4">
              <div className="text-sm text-[#64748b] mb-1">Категория проблемы</div>
              <div className="font-medium text-[#1e293b]">{diagnosis.category}</div>
            </div>
          )}
          {diagnosis.resolutionTitle && (
            <div className="mb-6">
              <div className="text-sm text-[#64748b] mb-1">Предполагаемая причина / рекомендация</div>
              <div className="font-medium text-[#1e293b]">{diagnosis.resolutionTitle}</div>
            </div>
          )}

          <div className="text-sm font-semibold mb-3 mt-6 text-[#1e293b]">История диалога</div>
          <div className="space-y-2">
            {transcript
              .filter((t) => t.type === "answer")
              .map((t, i) => (
                <div key={i} className="bg-[#f8fafc] rounded-lg p-3 text-sm border border-slate-200">
                  <div className="text-[#475569]">{t.question}</div>
                  <div className="font-medium text-emerald-700 ml-4">→ {t.answer}</div>
                </div>
              ))}
            {transcript.some((t) => t.type === "followup") && (
              <div className="bg-[#f8fafc] rounded-lg p-3 text-sm border border-slate-200">
                Результат:{" "}
                <span className="font-medium">
                  {transcript.find((t) => t.type === "followup")?.helped
                    ? "решено самостоятельно"
                    : "направлен в сервисный центр"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <Link href="/centers" className="px-4 py-2 rounded-xl bg-[#1e293b] text-white hover:bg-[#0f172a] transition">
              Сервисные центры
            </Link>
            <Link href="/" className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-[#f1f5f9] transition">
              На главную
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
