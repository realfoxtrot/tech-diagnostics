"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  id: number;
  label: string;
  nextQuestionId?: number | null;
  resolutionId?: number | null;
  resolution?: Resolution | null;
}

interface Resolution {
  id: number;
  title: string;
  description: string;
  steps?: string[] | null;
  needsFollowUp?: number | null;
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
  followUp?: boolean;
}

interface ApiResult {
  sessionId?: number;
  ticketNumber?: string;
  step: Step;
  outcome?: string;
  message?: string;
}

export default function DiagnosisChat() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
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
      if (!res.ok) throw new Error(data.step?.type ? "err" : "Ошибка");
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.ticketNumber) setTicketNumber(data.ticketNumber);
      // запоминаем ответ в истории (если был активный вопрос)
      if (step?.type === "question" && step.question) {
        setHistory((h) => [...h, { q: step.question!.text, a: opt.label }]);
      }
      setStep(data.step);
    } catch {
      setError("Ошибка при обработке ответа");
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const followUp = async (helped: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/diagnosis/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, helped }),
      });
      const data: ApiResult = await res.json();
      if (data.outcome === "resolved_self") {
        setStep({ type: "done" });
        setHistory((h) => [...h, { q: "Помогли ли рекомендации?", a: "Да, помогло" }]);
      } else {
        setHistory((h) => [...h, { q: "Помогли ли рекомендации?", a: "Нет, не помогло" }]);
        setStep(data.step);
      }
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const restart = () => {
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Вопросы и ответы */}
      <div className="space-y-3 mb-6">
        {history.map((h, i) => (
          <div key={i} className="space-y-1">
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-[#1e293b] shadow-sm">
              <div className="font-medium text-[var(--foreground)]">{h.q}</div>
            </div>
            <div className="bg-[#ecfdf5] border border-emerald-200 rounded-xl p-3 ml-8 text-emerald-800">
              <div className="font-medium">{h.a}</div>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="bg-[#fef2f2] border border-red-200 text-red-700 rounded-xl p-4 mb-4">{error}</div>}

      {/* Текущий шаг */}
      {step?.type === "question" && step.question && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#1e293b]">{step.question.text}</h2>
          <div className="space-y-2">
            {step.question.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => selectOption(opt)}
                disabled={loading}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-[#4f46e5] hover:bg-[#eef2ff] transition disabled:opacity-50 disabled:cursor-not-allowed text-[#1e293b]"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step?.type === "resolution" && step.resolution && (
        <div className="bg-white border border-indigo-200 rounded-2xl shadow-sm p-6">
          <div className="inline-block px-3 py-1 rounded-full bg-[#e0e7ff] text-[#4f46e5] text-xs font-semibold mb-3">
            Рекомендация
          </div>
          <h2 className="text-2xl font-bold mb-2 text-[#1e293b]">{step.resolution.title}</h2>
          <p className="text-[var(--foreground)] mb-4">{step.resolution.description}</p>
          {Array.isArray(step.resolution.steps) && step.resolution.steps.length > 0 && (
            <ol className="space-y-2 mb-5 list-decimal list-inside text-[var(--foreground)]">
              {step.resolution.steps.map((s, i) => (
                <li key={i} className="pl-1">{s}</li>
              ))}
            </ol>
          )}

          {step.followUp ? (
            <div className="mt-4">
              <p className="font-medium mb-3 text-[#1e293b]">Помогли ли рекомендации?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => followUp(true)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#10b981] text-white hover:bg-[#059669] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Да, помогло
                </button>
                <button
                  onClick={() => followUp(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#1e293b] text-white hover:bg-[#0f172a] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Нет, не помогло
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => followUp(false)}
              disabled={loading}
              className="mt-4 px-4 py-2 rounded-xl bg-[#1e293b] text-white hover:bg-[#0f172a] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Не помогло — показать сервисные центры
            </button>
          )}
        </div>
      )}

      {step?.type === "done" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center">
          <div className="text-4xl mb-3">🎉</div>
          {history.length && history[history.length - 1]?.a === "Да, помогло" ? (
            <>
              <h2 className="text-2xl font-bold mb-2 text-[#1e293b]">Отлично!</h2>
              <p className="text-[var(--foreground)] mb-4">Рады, что смогли помочь.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2 text-[#1e293b]">Нужна помощь специалиста</h2>
              <p className="text-[var(--foreground)] mb-4">
                Мы подготовили историю диагностики. Покажите её инженеру или принесите с собой.
              </p>
            </>
          )}

          {ticketNumber && (
            <div className="mb-4 p-4 bg-[var(--background)] rounded-xl border border-slate-200">
              <div className="text-sm text-[#64748b] mb-1">Номер обращения</div>
              <div className="text-2xl font-mono font-bold text-[#1e293b]">{ticketNumber}</div>
              <div className="text-xs text-[#94a3b8] mt-1">
                По этому номеру инженер откроет карту диагностики
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center mt-6">
            <a
              href={`/ticket?ticket=${ticketNumber ?? ""}`}
              className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white hover:bg-[#4338ca] transition"
            >
              Карта диагностики
            </a>
            <a
              href="/centers"
              className="px-4 py-2 rounded-xl bg-[#1e293b] text-white hover:bg-[#0f172a] transition"
            >
              Сервисные центры
            </a>
            <button
              onClick={restart}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-[#f1f5f9] transition"
            >
              Начать заново
            </button>
          </div>
        </div>
      )}

      {!step && !error && (
        <div className="text-center py-12 text-[#64748b]">Загрузка диагностики…</div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
