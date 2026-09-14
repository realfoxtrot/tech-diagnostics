"use client";

import { useEffect } from "react";

/**
 * «Сохранить PDF» для карты диагностики: открывает системный диалог печати
 * (в Chrome/Safari — «Сохранить как PDF»). Векторный текст и штрихкод
 * печатаются без потерь, внешние сервисы не нужны.
 *
 * auto — автозапуск печати при переходе по ссылке «…&print=1»
 * (из карточки завершения диагностики).
 */
export default function TicketPrintButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    // небольшая задержка: дождаться гидратации и отрисовки штрихкода
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [auto]);

  if (auto) return null;

  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 rounded-xl border border-border hover:border-accent transition text-foreground inline-flex items-center gap-2 no-print"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9V3h12v6" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="7" rx="1" />
      </svg>
      Сохранить PDF
    </button>
  );
}
