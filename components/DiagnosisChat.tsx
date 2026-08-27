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
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800">{h.q}</div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 ml-8 text-emerald-800">
              {h.a}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">{error}</div>}

      {/* Текущий шаг */}
      {step?.type === "question" && step.question && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{step.question.text}</h2>
          <div className="space-y-2">
            {step.question.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => selectOption(opt)}
                disabled={loading}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step?.type === "resolution" && step.resolution && (
        <div className="bg-white border border-indigo-200 rounded-2xl shadow-sm p-6">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
            Рекомендация
          </div>
          <h2 className="text-xl font-bold mb-2">{step.resolution.title}</h2>
          <p className="text-slate-600 mb-4">{step.resolution.description}</p>
          {Array.isArray(step.resolution.steps) && step.resolution.steps.length > 0 && (
            <ol className="space-y-2 mb-5 list-decimal list-inside text-slate-700">
              {step.resolution.steps.map((s, i) => (
                <li key={i} className="pl-1">{s}</li>
              ))}
            </ol>
          )}

          {step.followUp ? (
            <div className="mt-4">
              <p className="font-medium mb-3">Помогли ли рекомендации?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => followUp(true)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  Да, помогло
                </button>
                <button
                  onClick={() => followUp(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition disabled:opacity-50"
                >
                  Нет, не помогло
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => followUp(false)}
              disabled={loading}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition disabled:opacity-50"
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
              <h2 className="text-xl font-bold mb-2">Отлично!</h2>
              <p className="text-slate-600 mb-4">Рады, что смогли помочь.</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2">Нужна помощь специалиста</h2>
              <p className="text-slate-600 mb-4">
                Мы подготовили историю диагностики. Покажите её инженеру или принесите с собой.
              </p>
            </>
          )}

          {ticketNumber && (
            <div className="mb-4 p-4 bg-slate-50 rounded-xl">
              <div className="text-sm text-slate-500 mb-1">Номер обращения</div>
              <div className="text-2xl font-mono font-bold">{ticketNumber}</div>
              <div className="text-xs text-slate-400 mt-1">
                По этому номеру инженер откроет карту диагностики
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center mt-4">
            <a
              href={`/ticket?ticket=${ticketNumber ?? ""}`}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Карта диагностики
            </a>
            <a
              href="/centers"
              className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition"
            >
              Сервисные центры
            </a>
            <button
              onClick={restart}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 transition"
            >
              Начать заново
            </button>
          </div>
        </div>
      )}

      {!step && !error && (
        <div className="text-center py-12 text-slate-400">Загрузка диагностики…</div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
