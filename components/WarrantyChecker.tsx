"use client";

import { useState } from "react";

type CheckState = {
  errors: string[];
  messages: string[];
  checking: boolean;
};

/**
 * Проверка гарантийности: дата покупки + серийный номер.
 * Механика как на as-russia.ru: AJAX-проверка, результат под формой
 * (ошибки — красным, сообщения — зелёным), очистка при вводе.
 */
export default function WarrantyChecker() {
  const [serial, setSerial] = useState("");
  const [date, setDate] = useState("");
  const [state, setState] = useState<CheckState>({ errors: [], messages: [], checking: false });

  const check = async () => {
    if (state.checking) return;
    setState((s) => ({ ...s, checking: true }));
    try {
      const res = await fetch("/api/warranty/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial_number: serial, purchase_date: date }),
      });
      const data = await res.json();
      setState({
        errors: data.errors ?? [],
        messages: data.messages ?? [],
        checking: false,
      });
    } catch {
      setState({ errors: ["Ошибка сети. Попробуйте ещё раз."], messages: [], checking: false });
    }
  };

  const clear = () => setState((s) => ({ ...s, errors: [], messages: [] }));

  const hasResult = state.errors.length > 0 || state.messages.length > 0;
  const inWarranty = state.messages.length > 0 && state.messages[0].includes("действует");

  return (
    <div className="max-w-xl w-full bg-card border border-border rounded-2xl p-8 shadow-sm">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">🛡️</div>
        <h1 className="text-2xl font-bold text-foreground">Проверка гарантийности</h1>
        <p className="text-muted mt-3">
          Проверьте возможность бесплатного обслуживания вашего устройства
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="block text-sm font-medium text-foreground mb-1">Дата покупки:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              clear();
            }}
            className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-foreground mb-1">Серийный номер:</span>
          <input
            type="text"
            value={serial}
            onChange={(e) => {
              setSerial(e.target.value);
              clear();
            }}
            placeholder="Проверьте серийный номер"
            disabled={state.checking}
            className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <button
          type="submit"
          disabled={state.checking}
          className="w-full px-4 py-3 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold transition flex items-center justify-center gap-2"
        >
          {state.checking ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Проверяем…
            </>
          ) : (
            <>🔍 Проверить</>
          )}
        </button>
      </form>

      {/* Результат проверки (как на as-russia.ru) */}
      {hasResult && (
        <div className="mt-6">
          <div className="text-sm font-semibold text-foreground mb-2">Результат проверки:</div>
          <div className="space-y-2">
            {state.errors.map((e, i) => (
              <div key={i} className="text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl px-4 py-3">
                {e}
              </div>
            ))}
            {state.messages.map((m, i) => (
              <div key={i} className={`text-sm rounded-xl px-4 py-3 border ${inWarranty ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900" : "text-foreground bg-background border-border"}`}>
                {m}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-background border border-border p-4 text-xs text-muted">
        Серийный номер указан на наклейке на дне ноутбука или в коробке (12–20 символов).
        Предварительный расчёт — по стандартным условиям гарантии (24 мес. с даты покупки).
        Точный статус подтверждается по данным поставщика.
      </div>
    </div>
  );
}
