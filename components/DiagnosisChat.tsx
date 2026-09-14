"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  id: number;
  label: string;
  nextQuestionId?: number | null;
  resolutionId?: number | null;
}

interface ResolutionStep {
  id: number;
  title?: string | null; // краткое название шага (1-2 слова)
  text: string;
  order: number;
  nextStepId?: number | null;
}

interface Resolution {
  id: number;
  title: string;
  description: string;
  steps: ResolutionStep[];
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

interface Step {
  type: "question" | "resolution" | "done";
  question?: Question;
  resolution?: Resolution;
  currentStepId?: number | null;
}

interface ApiResult {
  sessionId?: number;
  ticketNumber?: string;
  step: Step;
  outcome?: string;
  message?: string;
  error?: string;
}

const HELPED_LABEL = "Да, помогло";
const NO_FEEDBACK_LABEL = "Нет, не помогло";

export default function DiagnosisChat() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  // Старт: загружаем первый вопрос
  useEffect(() => {
    fetch("/api/diagnosis/start")
      .then((r) => r.json())
      .then((d) => {
        if (d.question) {
          setStep({ type: "question", question: d.question });
        }
      })
      .catch(() => setError("Не удалось загрузить диагностику"));
  }, []);

  const selectOption = async (opt: Option) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/diagnosis/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: opt.id, sessionId }),
      });
      const data: ApiResult = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.ticketNumber) setTicketNumber(data.ticketNumber);
      // запоминаем ответ в истории (если был активный вопрос)
      const cur = step;
      if (cur?.type === "question" && cur.question) {
        const qText = cur.question.text;
        setHistory((h) => [...h, { q: qText, a: opt.label }]);
      }
      if (data.step.type === "done" && data.outcome) setOutcome(data.outcome);
      setStep(data.step);
    } catch {
      setError("Ошибка при обработке ответа");
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const answerStep = async (helped: boolean) => {
    setLoading(true);
    setError(null);
    const resTitle = step?.resolution?.title ?? "рекомендация";
    try {
      const res = await fetch("/api/diagnosis/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, helped }),
      });
      const data: ApiResult = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setHistory((h) => [
        ...h,
        { q: `«${resTitle}» — помогло?`, a: helped ? HELPED_LABEL : NO_FEEDBACK_LABEL },
      ]);
      if (data.outcome) setOutcome(data.outcome);
      setStep(data.step);
    } catch {
      setError("Ошибка при обработке ответа");
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const restart = () => {
    window.location.reload();
  };

  // Текущий шаг цепочки (для «Шаг k из n» и текста)
  const curId = step?.currentStepId;
  const activeResolution = step?.type === "resolution" ? step.resolution : undefined;
  const currentStep: ResolutionStep | null =
    activeResolution && curId != null
      ? activeResolution.steps.find((s) => s.id === curId) ?? null
      : null;
  const stepIndex = currentStep ? activeResolution!.steps.findIndex((s) => s.id === currentStep.id) : -1;
  const isLastStep = !!activeResolution && stepIndex !== -1 && stepIndex === activeResolution.steps.length - 1;

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Вопросы и ответы */}
      <div className="space-y-3 mb-6">
        {history.map((h, i) => (
          <div key={i} className="space-y-1">
            <div className="bg-card border border-border rounded-xl p-4 text-foreground shadow-sm">
              {h.q}
            </div>
            <div
              className={`rounded-xl p-3 ml-8 ${h.a === HELPED_LABEL
                  ? "bg-success-bg border border-success/25 text-success"
                  : "bg-error-bg border border-error/25 text-error"
              }`}
            >
              <div className="font-medium">{h.a}</div>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="bg-error-bg border border-error/25 text-error rounded-xl p-4 mb-4">{error}</div>}

      {/* Текущий вопрос */}
      {step?.type === "question" && step.question && (
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">{step.question.text}</h2>
          <div className="space-y-2">
            {step.question.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => selectOption(opt)}
                disabled={loading}
                className="w-full text-left px-4 py-3 rounded-xl border border-border hover:border-accent hover:bg-accent-soft transition disabled:opacity-70 disabled:cursor-not-allowed text-foreground"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Текущий шаг рекомендации */}
      {step?.type === "resolution" && step.resolution && currentStep && (
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="inline-block px-3 py-1 rounded-full bg-accent-soft text-accent text-xs font-semibold">
              Шаг: {currentStep.title ?? step.resolution.title}
            </span>
            <span className="text-xs text-muted">
              Шаг {stepIndex + 1} из {step.resolution.steps.length}
            </span>
          </div>
          <p className="text-foreground mb-4">{step.resolution.description}</p>
          <div className="bg-accent-soft border-l-4 border-accent rounded-xl p-4 text-foreground">
            <div className="text-sm font-medium text-accent mb-1">Что сделать:</div>
            {currentStep.text}
          </div>

          <div className="mt-6">
            <p className="font-medium mb-3 text-foreground">Помогло ли?</p>
            <div className="flex gap-3">
              <button
                onClick={() => answerStep(true)}
                disabled={loading}
                className="px-4 py-2 rounded-xl btn-success hover:opacity-90 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Да, помогло
              </button>
              <button
                onClick={() => answerStep(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl btn-accent hover:bg-accent-hover transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLastStep ? NO_FEEDBACK_LABEL : "Нет, продолжаем"}
              </button>
            </div>
            {isLastStep && (
              <p className="text-xs text-muted mt-2">
                Если не помогло — подготовим историю диагностики и покажем сервисные центры.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Завершение */}
      {step?.type === "done" && (
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center">
          <span className="mx-auto mb-3 w-14 h-14 rounded-full bg-accent-soft flex items-center justify-center text-accent">
            {outcome === "resolved_self" ? (
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12 2.5 2.5 5-5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            )}
          </span>
          {outcome === "resolved_self" ? (
            <>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Отлично!</h2>
              <p className="text-foreground mb-4">Рады, что смогли помочь.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Нужна помощь специалиста</h2>
              <p className="text-foreground mb-4">
                Мы подготовили историю диагностики. Покажите её инженеру или принесите с собой.
              </p>
            </>
          )}

          {ticketNumber && (
            <div className="mb-4 p-4 bg-background rounded-xl border border-border">
              <div className="text-sm text-muted mb-1">Номер обращения</div>
              <div className="text-2xl font-mono font-bold text-foreground">{ticketNumber}</div>
              <div className="text-xs text-muted mt-1">
                По этому номеру инженер откроет карту диагностики
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <a
              href={`/ticket?ticket=${ticketNumber ?? ""}&print=1`}
              className="px-4 py-2 rounded-xl btn-accent hover:bg-accent-hover transition whitespace-nowrap"
            >
              Сохранить PDF
            </a>
            <a
              href={`/ticket?ticket=${ticketNumber ?? ""}`}
              className="px-4 py-2 rounded-xl btn-accent hover:bg-accent-hover transition whitespace-nowrap"
            >
              Карта диагностики
            </a>
            <a
              href="/centers"
              className="px-4 py-2 rounded-xl btn-accent hover:bg-accent-hover transition whitespace-nowrap"
            >
              Сервисные центры
            </a>
            <button
              onClick={restart}
              className="px-4 py-2 rounded-xl border border-border hover:bg-background transition whitespace-nowrap text-foreground"
            >
              Начать заново
            </button>
          </div>
        </div>
      )}

      {!step && !error && (
        <div className="text-center py-12 text-muted">Загрузка диагностики…</div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
