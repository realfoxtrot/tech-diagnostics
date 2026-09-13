"use client";

import { useState } from "react";

/**
 * Форма ввода номера обращения (карты диагностики) для /ticket без параметра.
 * GET-форма → /ticket?ticket=... (серверная страница уже читает searchParams).
 */
export default function TicketSearch({ notFound = false }: { notFound?: boolean }) {
  const [v, setV] = useState("");
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-foreground mb-1">Проверка статуса ремонта</h1>
          <p className="text-sm text-muted mb-5">
            Введите номер обращения из карты диагностики, например{" "}
            <span className="font-mono text-foreground">TD-20260911-4821</span>.
          </p>
          {notFound && (
            <div className="mb-4 rounded-xl bg-error-bg border border-error/30 px-4 py-3 text-sm text-error">
              Обращение с таким номером не найдено. Проверьте номер.
            </div>
          )}
          <form
            action="/ticket"
            method="GET"
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              name="ticket"
              value={v}
              onChange={(e) => setV(e.target.value)}
              placeholder="Номер обращения"
              aria-label="Номер обращения"
              required
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              className="btn-accent px-5 py-2.5 rounded-xl font-medium transition whitespace-nowrap"
            >
              Проверить
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
