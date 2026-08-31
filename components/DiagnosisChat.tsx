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
              className={`rounded-xl p-3 ml-8 ${
                h.a === HELPED_LABEL
                  ? "bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
              }`}
            >
              <div className="font-medium">{h.a}</div>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl p-4 mb-4">{error}</div>}

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
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-accent hover:bg-indigo-50 dark:hover:bg-slate-700 transition disabled:opacity-70 disabled:cursor-not-allowed text-foreground"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Текущий шаг рекомендации */}
      {step?.type === "resolution" && step.resolution && currentStep && (
        <div className="bg-card border border-indigo-200 dark:border-indigo-900 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-accent dark:text-indigo-300 text-xs font-semibold">
              Рекомендация
            </span>
            <span className="text-xs text-[#64748b] dark:text-slate-400">
              Шаг {stepIndex + 1} из {step.resolution.steps.length}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">{step.resolution.title}</h2>
          <p className="text-foreground mb-4">{step.resolution.description}</p>
          <div className="bg-indigo-50 dark:bg-slate-700 border border-indigo-100 dark:border-slate-600 rounded-xl p-4 text-foreground">
            <div className="text-sm font-medium text-accent dark:text-indigo-300 mb-1">Что сделать:</div>
            {currentStep.text}
          </div>

          <div className="mt-6">
            <p className="font-medium mb-3 text-foreground">Помогло ли?</p>
            <div className="flex gap-3">
              <button
                onClick={() => answerStep(true)}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Да, помогло
              </button>
              <button
                onClick={() => answerStep(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-hover transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLastStep ? NO_FEEDBACK_LABEL : "Нет, продолжаем"}
              </button>
            </div>
            {isLastStep && (
              <p className="text-xs text-[#64748b] dark:text-slate-400 mt-2">
                Если не помогло — подготовим историю диагностики и покажем сервисные центры.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Завершение */}
      {step?.type === "done" && (
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center">
          <div className="text-4xl mb-3">{outcome === "resolved_self" ? "🎉" : "🔧"}</div>
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
            <div className="mb-4 p-4 bg-background dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
              <div className="text-sm text-[#64748b] dark:text-slate-400 mb-1">Номер обращения</div>
              <div className="text-2xl font-mono font-bold text-foreground">{ticketNumber}</div>
              <div className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">
                По этому номеру инженер откроет карту диагностики
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <a
              href={`/ticket?ticket=${ticketNumber ?? ""}`}
              className="px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-hover transition whitespace-nowrap"
            >
              Карта диагностики
            </a>
            <a
              href="/centers"
              className="px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-hover transition whitespace-nowrap"
            >
              Сервисные центры
            </a>
            <button
              onClick={restart}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-background dark:hover:bg-slate-700 transition whitespace-nowrap text-foreground"
            >
              Начать заново
            </button>
          </div>
        </div>
      )}

      {!step && !error && (
        <div className="text-center py-12 text-[#64748b] dark:text-slate-400">Загрузка диагностики…</div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
