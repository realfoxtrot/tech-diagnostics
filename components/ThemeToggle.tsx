"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Класс .dark ставится инлайновым скриптом в <head> до гидратации.
    // Читаем в rAF — после первого рендера, чтобы не было mismatch'а.
    const id = requestAnimationFrame(() => {
      setDark(document.documentElement.classList.contains("dark"));
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* noop */
    }
  };

  if (!ready) return <span className="inline-block w-9 h-9" aria-hidden />;

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={dark ? "Светлая тема" : "Тёмная тема"}
      className="print:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-lg transition"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
