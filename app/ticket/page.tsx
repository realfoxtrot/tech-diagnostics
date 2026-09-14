import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import TicketBarcode from "@/components/TicketBarcode";
import TicketPrintButton from "@/components/TicketPrintButton";

export const dynamic = "force-dynamic";

type TEntry = {
  type: string;
  question?: string;
  answer?: string;
  helped?: boolean;
  resolutionId?: number | null;
  resolutionTitle?: string | null;
  stepId?: number | null;
  stepTitle?: string | null;
  stepText?: string | null;
  timestamp?: string;
};

export default async function TicketPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string; print?: string }>;
}) {
  const { ticket, print } = await searchParams;
  // ?print=1 — автозапуск диалога печати («Сохранить как PDF»)
  const autoPrint = print === "1" && !!ticket;
  const sess = ticket
    ? await db.query.sessions.findFirst({
        where: eq(sessions.ticketNumber, ticket),
      })
    : null;

  if (!sess) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-foreground">Обращение не найдено</h1>
          <p className="text-muted mb-4">Проверьте номер обращения</p>
          <Link href="/" className="text-accent hover:text-accent-hover hover:underline transition">← На главную</Link>
        </div>
      </main>
    );
  }

  const transcript = (sess.transcript ?? []) as TEntry[];
  const diagnosis = (sess.diagnosis ?? {}) as {
    category?: string | null;
    resolutionId?: number | null;
    resolutionTitle?: string | null;
    stepId?: number | null;
    stepTitle?: string | null;
    stepText?: string | null;
    outcome?: string;
  };

  // Сводка цепочки: сколько шагов было, сколько помогло/не помогло
  const stepCount = transcript.filter((t) => t.type === "resolution").length;
  const helpedCount = transcript.filter((t) => t.type === "followup" && t.helped).length;

  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted mb-1">Карта диагностики</div>
              <div className="text-2xl font-mono font-bold text-foreground">{sess.ticketNumber}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted">Создано: {sess.createdAt}</div>
            </div>
          </div>

          <div className="mb-4 text-foreground">
            <TicketBarcode value={sess.ticketNumber} />
          </div>

          {diagnosis.category && (
            <div className="mb-4">
              <div className="text-sm text-muted mb-1">Категория проблемы</div>
              <div className="font-medium text-foreground">{diagnosis.category}</div>
            </div>
          )}
          {diagnosis.resolutionTitle && (
            <div className="mb-4">
              <div className="text-sm text-muted mb-1">Рекомендация</div>
              <div className="font-medium text-foreground">{diagnosis.resolutionTitle}</div>
            </div>
          )}

          <div className="text-sm font-semibold mb-3 mt-6 text-foreground">
            Карта траблшутинга {stepCount > 0 && <span className="font-normal text-muted">({stepCount} шаг(ов))</span>}
          </div>
          <div className="space-y-2">
            {transcript.map((t, i) => {
              // Вопрос пользователю
              if (t.type === "answer") {
                return (
                  <div key={i} className="bg-background border border-border rounded-lg p-3 text-sm">
                    <div className="text-muted">{t.question}</div>
                    <div className="font-medium text-success ml-4">→ {t.answer}</div>
                  </div>
                );
              }
              // Шаг рекомендации
              if (t.type === "resolution") {
                return (
                  <div key={i} className="bg-accent-soft border-l-4 border-accent rounded-lg p-3 text-sm">
                    <div className="text-xs font-semibold text-accent mb-1">
                      Шаг: {t.stepTitle ?? t.resolutionTitle ?? "рекомендация"}
                    </div>
                    {t.stepText && <div className="text-foreground">{t.stepText}</div>}
                  </div>
                );
              }
              // Ответ на шаг (помогло / не помогло)
              if (t.type === "followup") {
                const stepName = t.stepTitle ?? t.resolutionTitle;
                return (
                  <div key={i} className="bg-background border border-border rounded-lg p-3 text-sm">
                    <div className="text-muted">
                      {stepName ? (
                        <>Ответ на «{stepName}»:</>
                      ) : (
                        <>Ответ на рекомендацию:</>
                      )}{" "}
                      <span className={`font-medium ${t.helped ? "text-success" : "text-error"}`}>
                        {t.helped ? "✓ помогло" : "✗ не помогло"}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <div className="mt-4 text-sm text-muted">
            Итог:{" "}
            <span className="font-medium text-foreground">
              {sess.outcome === "resolved_self"
                ? "решено самостоятельно"
                : sess.outcome === "referral"
                  ? "направлен в сервисный центр"
                  : "диагностика не завершена"}
              {stepCount > 0 && <span className="font-normal"> · шагов: {stepCount}, помогло: {helpedCount}</span>}
            </span>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            <Link href="/centers" className="px-4 py-2 rounded-xl bg-foreground text-background hover:opacity-90 transition no-print">
              Сервисные центры
            </Link>
            <Link href="/" className="px-4 py-2 rounded-xl border border-border hover:bg-background transition text-foreground no-print">
              На главную
            </Link>
            <TicketPrintButton auto={autoPrint} />
          </div>
        </div>
      </div>
    </main>
  );
}
