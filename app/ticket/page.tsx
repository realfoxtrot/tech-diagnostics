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
          <h1 className="text-2xl font-bold mb-2 text-[var(--foreground)]">Обращение не найдено</h1>
          <p className="text-[var(--foreground)] mb-4">Проверьте номер обращения</p>
          <Link href="/" className="text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline transition">← На главную</Link>
        </div>
      </main>
    );
  }

  const transcript = (sess.transcript ?? []) as {
    type: string;
    question?: string;
    answer?: string;
    helped?: boolean;
    resolutionId?: number | null;
    resolutionTitle?: string | null;
    title?: string;
    description?: string;
    steps?: string[];
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-[var(--foreground)] mb-1">Карта диагностики</div>
              <div className="text-2xl font-mono font-bold text-[var(--foreground)]">{sess.ticketNumber}</div>
            </div>
            <div className="text-xs text-[#94a3b8]">Создано: {sess.createdAt}</div>
          </div>

          {diagnosis.category && (
            <div className="mb-4">
              <div className="text-sm text-[var(--foreground)] mb-1">Категория проблемы</div>
              <div className="font-medium text-[var(--foreground)]">{diagnosis.category}</div>
            </div>
          )}
          {diagnosis.resolutionTitle && (
            <div className="mb-4">
              <div className="text-sm text-[var(--foreground)] mb-1">Предполагаемая причина / рекомендация</div>
              <div className="font-medium text-[var(--foreground)]">{diagnosis.resolutionTitle}</div>
            </div>
          )}

          <div className="text-sm font-semibold mb-3 mt-6 text-[var(--foreground)]">Карта траблшутинга</div>
          <div className="space-y-2">
            {(() => {
              let recCounter = 0;
              return transcript.map((t, i) => {
                // Вопрос пользователю
                if (t.type === "answer") {
                  return (
                    <div key={i} className="bg-[var(--background)] rounded-lg p-3 text-sm border border-slate-200">
                      <div className="text-[#475569]">{t.question}</div>
                      <div className="font-medium text-emerald-800 ml-4">→ {t.answer}</div>
                    </div>
                  );
                }
                // Рекомендация (полный текст)
                if (t.type === "resolution") {
                  recCounter++;
                  return (
                    <div key={i} className="bg-[#eef2ff] rounded-lg p-3 text-sm border border-indigo-200">
                      <div className="text-xs font-semibold text-[var(--accent)] mb-1">Рекомендация #{recCounter}</div>
                      <div className="font-semibold text-[var(--foreground)]">{t.title}</div>
                      <div className="text-[#475569] mt-1">{t.description}</div>
                      {Array.isArray(t.steps) && t.steps.length > 0 && (
                        <ol className="mt-2 space-y-1 list-decimal list-inside text-[#475569]">
                          {t.steps.map((s, si) => (
                            <li key={si}>{s}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  );
                }
                // Ответ на рекомендацию (помогло / не помогло)
                if (t.type === "followup") {
                  return (
                    <div key={i} className="bg-[var(--background)] rounded-lg p-3 text-sm border border-slate-200">
                      <div className="text-[#475569]">
                        {t.resolutionTitle ? (
                          <>Ответ на «{t.resolutionTitle}»:</>
                        ) : (
                          <>Ответ на рекомендацию:</>
                        )}{" "}
                        <span className={`font-medium ${t.helped ? "text-emerald-700" : "text-red-700"}`}>
                          {t.helped ? "✓ помогло" : "✗ не помогло"}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              });
            })()}
          </div>

          <div className="mt-4 text-sm text-[#475569]">
            Итог:{" "}
            <span className="font-medium text-[var(--foreground)]">
              {sess.outcome === "resolved_self"
                ? "решено самостоятельно"
                : sess.outcome === "referral"
                  ? "направлен в сервисный центр"
                  : "диагностика не завершена"}
            </span>
          </div>

          <div className="mt-6 flex gap-3">
            <Link href="/centers" className="px-4 py-2 rounded-xl bg-[var(--foreground)] text-white hover:bg-[var(--foreground)] transition disabled:cursor-not-allowed">
              Сервисные центры
            </Link>
            <Link href="/" className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-[var(--background)] transition disabled:cursor-not-allowed">
              На главную
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
