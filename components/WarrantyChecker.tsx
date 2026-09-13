"use client";

import { useEffect, useState } from "react";

type ConditionStatus = "pass" | "fail" | "unknown";
type Condition = { key: string; status: ConditionStatus; detail?: string };

type CheckState = {
  errors: string[];
  messages: string[];
  covered: boolean;
  conditions: Condition[];
  checking: boolean;
};

const EMPTY: CheckState = { errors: [], messages: [], covered: false, conditions: [], checking: false };

const CONDITION_LABELS: Record<string, string> = {
  device: "Тип продукта: ноутбук",
  region: "Регион продаж: Россия",
  saleDate: "Дата продажи по чеку: с 1 января 2026",
  productionDate: "Дата производства (по серийному): не ранее 01.07.2025",
};

const STATUS_ICON: Record<ConditionStatus, string> = {
  pass: "✓",
  fail: "✗",
  unknown: "…",
};

/**
 * Проверка гарантийности: дата продажи по чеку + серийный номер.
 * Механика как на as-russia.ru: AJAX-проверка, результат под формой
 * (ошибки — красным, сообщения — зелёным), очистка при вводе.
 * Вердикт — по 4 условиям централизованной гарантии ASUS; вендор
 * проверяет валидность SN, страну отгрузки и дату отгрузки.
 */
export default function WarrantyChecker() {
  const [serial, setSerial] = useState("");
  const [date, setDate] = useState("");
  const [state, setState] = useState<CheckState>(EMPTY);
  // до гидратации сабмит формы вызывает default-navigation — блокируем
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- флаг готовности после гидратации
  useEffect(() => setMounted(true), []);

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
        covered: data.covered ?? false,
        conditions: Array.isArray(data.conditions) ? data.conditions : [],
        checking: false,
      });
    } catch {
      setState({ ...EMPTY, errors: ["Ошибка сети. Попробуйте ещё раз."], checking: false });
    }
  };

  const clear = () => setState(EMPTY);

  const hasResult = state.errors.length > 0 || state.messages.length > 0;

  return (
    <div className="max-w-xl w-full bg-card border border-border rounded-xl p-8 shadow-[0_1px_3px_rgba(16,35,58,0.06)]">
      <div className="text-center mb-6">
        <span className="mx-auto mb-4 w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center text-accent">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </span>
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
          <span className="block text-sm font-medium text-foreground mb-1">
            Дата продажи по чеку (дата покупки):
          </span>
          <input
            type="date"
            value={date}
            disabled={!mounted}
            onChange={(e) => {
              setDate(e.target.value);
              clear();
            }}
            className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-foreground mb-1">Серийный номер:</span>
          <input
            type="text"
            value={serial}
            onChange={(e) => {
              setSerial(e.target.value.toUpperCase());
              clear();
            }}
            placeholder="Проверьте серийный номер"
            disabled={state.checking}
            className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground font-mono uppercase focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <button
          type="submit"
          disabled={!mounted || state.checking}
          className="w-full px-4 py-3 rounded-xl btn-accent disabled:opacity-60 font-semibold transition flex items-center justify-center gap-2"
        >
          {state.checking ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Проверяем…
            </>
          ) : (
            <>Проверить</>
          )}
        </button>
      </form>

      {/* Результат проверки */}
      {hasResult && (
        <div className="mt-6">
          <div className="text-sm font-semibold text-foreground mb-2">Результат проверки:</div>
          <div className="space-y-2">
            {state.errors.map((e, i) => (
              <div
                key={i}
                className="text-sm font-medium text-error bg-error-bg border border-error/25 rounded-xl px-4 py-3"
              >
                {e}
              </div>
            ))}
            {state.messages.map((m, i) => (
              <div
                key={i}
                className="text-sm text-success bg-success-bg border border-success/25 rounded-xl px-4 py-3"
              >
                {m}
              </div>
            ))}
          </div>

          {/* Чеклист условий программы */}
          {state.conditions.length > 0 && (
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-semibold text-muted mb-3 uppercase tracking-[0.03em]">
                Условия централизованной гарантии:
              </div>
              <ul className="space-y-2">
                {state.conditions.map((c) => (
                  <li key={c.key} className="flex items-start gap-2 text-sm">
                    <span
                      className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        c.status === "pass"
                          ? "bg-success-bg text-success"
                          : c.status === "fail"
                            ? "bg-error-bg text-error"
                            : "bg-accent-soft text-accent"
                      }`}
                    >
                      {STATUS_ICON[c.status]}
                    </span>
                    <span className="text-foreground">
                      {CONDITION_LABELS[c.key] ?? c.key}
                      {c.detail && c.status === "fail" && (
                        <span className="text-muted"> — {c.detail}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.covered && (
            <a
              href="/centers"
              className="inline-block mt-3 text-sm font-semibold text-accent hover:underline"
            >
              Найти авторизованный сервисный центр →
            </a>
          )}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-card border border-border p-4 text-xs text-muted space-y-1">
        <div className="font-semibold text-foreground mb-2">
          Основные условия централизованной бесплатной гарантии ASUS:
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-full bg-accent-soft text-accent">тип продукта: все типы ноутбуков (только ноутбуки!)</span>
          <span className="px-2.5 py-1 rounded-full bg-accent-soft text-accent">регион продаж: Россия</span>
          <span className="px-2.5 py-1 rounded-full bg-accent-soft text-accent">дата продажи по чеку: с 1 января 2026 года</span>
          <span className="px-2.5 py-1 rounded-full bg-accent-soft text-accent">дата производства ноутбука по серийному номеру: не ранее 01.07.2025</span>
        </div>
        <div className="pt-2">
          Серийный номер указан на наклейке на дне ноутбука или в коробке (12–20 символов).
          Валидность серийного номера, страна отгрузки и дата производства проверяются
          по данным вендора.
        </div>
      </div>
    </div>
  );
}
