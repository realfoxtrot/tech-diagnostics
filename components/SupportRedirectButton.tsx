"use client";

import { ASUS_SUPPORT_FORM_URL } from "@/lib/support";

/**
 * Кнопка подтверждения переадресации на официальную форму ASUS.
 * Переход в той же вкладке — пользователь явно согласился уйти
 * с AS-RUSSIA на сайт ASUS (там обрабатываются его данные, не у нас).
 */
export default function SupportRedirectButton() {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = ASUS_SUPPORT_FORM_URL;
      }}
      className="w-full sm:w-auto px-6 py-3 rounded-xl btn-accent font-semibold transition inline-flex items-center justify-center gap-2"
    >
      Подтверждаю — перейти на сайт ASUS
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </button>
  );
}
