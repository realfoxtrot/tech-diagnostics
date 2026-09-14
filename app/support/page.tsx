import type { Metadata } from "next";
import Link from "next/link";
import SupportRedirectButton from "@/components/SupportRedirectButton";
import { ASUS_SUPPORT_FORM_URL } from "@/lib/support";

export const metadata: Metadata = {
  title: "Запрос в службу поддержки ASUS — AS-RUSSIA",
  description:
    "Запрос в службу технической поддержки ASUS: обращение оформляется напрямую на официальном сайте ASUS.",
};

function IconExternal({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6" />
      <path d="M20 4L10 14" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

const PREPARE_ITEMS = [
  {
    title: "Серийный номер",
    text: "Наклейка на дне ноутбука или на коробке (12–20 символов).",
  },
  {
    title: "Чек или дата покупки",
    text: "Понадобится для гарантийных вопросов.",
  },
  {
    title: "Описание проблемы",
    text: "Что случилось, когда началось, что уже пробовали.",
  },
  {
    title: "Фото или видео",
    text: "Если проблема визуальная — приложите снимок на форме ASUS.",
  },
];

export default function SupportPage() {
  return (
    <main className="flex-1 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Хлебная крошка */}
        <nav className="text-sm text-muted mb-4" aria-label="Хлебная крошка">
          <Link href="/" className="hover:text-accent transition">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Техподдержка ASUS</span>
        </nav>

        {/* ── Уведомление о переадресации ─────────────────────────── */}
        <section className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-sm text-center">
          <span className="mx-auto mb-5 w-14 h-14 rounded-full bg-accent-soft flex items-center justify-center text-accent">
            <IconExternal className="w-7 h-7" />
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Запрос в службу поддержки ASUS
          </h1>
          <p className="text-muted mt-4 leading-relaxed">
            Обращение оформляется напрямую на официальном сайте ASUS: после
            подтверждения вы перейдёте на форму техподдержки ASUS, где заполните
            имя, контакты и описание проблемы.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <SupportRedirectButton />
            <Link
              href="/"
              className="px-6 py-3 rounded-xl border border-border hover:border-accent text-foreground font-medium transition"
            >
              Остаться на AS-RUSSIA
            </Link>
          </div>
          <p className="text-xs text-muted mt-4">
            Форма поддержки:{" "}
            <a
              href={ASUS_SUPPORT_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent break-all underline"
            >
              asus.com/support/…/questionform
            </a>
          </p>
        </section>

        {/* Что подготовить */}
        <section className="mt-10">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
            Что подготовить перед обращением
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {PREPARE_ITEMS.map((item) => (
              <div key={item.title} className="bg-card border border-border rounded-xl p-5">
                <div className="font-semibold text-foreground">{item.title}</div>
                <p className="text-sm text-muted mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Связанные разделы */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <Link
            href="/diagnosis"
            className="bg-card border border-border rounded-xl p-5 hover:border-accent transition"
          >
            <div className="font-semibold text-foreground">Начните с диагностики</div>
            <p className="text-sm text-muted mt-1">
              Бесплатная карта диагностики определит проблему и подготовит техдокумент для инженера.
            </p>
          </Link>
          <Link
            href="/warranty"
            className="bg-card border border-border rounded-xl p-5 hover:border-accent transition"
          >
            <div className="font-semibold text-foreground">Проверьте гарантийность</div>
            <p className="text-sm text-muted mt-1">
              Узнайте по серийному номеру и дате покупки, подпадает ли ноутбук под гарантию ASUS.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
