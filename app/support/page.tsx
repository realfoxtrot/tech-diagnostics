import type { Metadata } from "next";
import Link from "next/link";
import SupportWrapper from "@/components/SupportWrapper";

export const metadata: Metadata = {
  title: "Обращение в техподдержку ASUS — AS-RUSSIA",
  description:
    "Соберите контекст обращения в службу технической поддержки ASUS: серийный номер, дата покупки, описание проблемы. Получите готовый текст и вставьте его в оригинальную форму ASUS.",
};

// ─── Inline SVG line-иконки (stroke="currentColor", без эмодзи) ────
function IconTag() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11V5a2 2 0 0 1 2-2h6l10 10-8 8L3 11z" />
      <path d="M7.5 7.5h.01" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

function IconText() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

function IconPhoto() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5-5-6 6-3-3-4 4" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a1 1 0 0 1-1 1A17 17 0 0 1 3 5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function IconExternal() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6" />
      <path d="M20 4L10 14" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

const PREPARE_ITEMS = [
  {
    icon: <IconTag />,
    title: "Серийный номер",
    text: "Наклейка на дне ноутбука или на коробке (12–20 символов). Если указываете — проверьте гарантийность.",
  },
  {
    icon: <IconReceipt />,
    title: "Чек или дата покупки",
    text: "Понадобится для гарантийных вопросов и точной идентификации устройства.",
  },
  {
    icon: <IconText />,
    title: "Описание проблемы",
    text: "Что случилось, когда началось, при каких условиях проявляется и что вы уже пробовали.",
  },
  {
    icon: <IconPhoto />,
    title: "Фото или видео",
    text: "Если проблема визуальная — экран, корпус, индикаторы — приложите снимок к обращению.",
  },
];

export default function SupportPage() {
  return (
    <main className="flex-1 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Хлебная крошка */}
        <nav className="text-sm text-muted mb-4" aria-label="Хлебная крошка">
          <Link href="/" className="hover:text-accent transition">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Техподдержка ASUS</span>
        </nav>

        {/* Заголовок */}
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Обращение в службу технической поддержки ASUS
          </h1>
          <p className="text-muted mt-3">
            Запрос уходит напрямую в ASUS — их форма не открывается во фрейме, поэтому мы
            собираем контекст обращения здесь. Заполните форму, скопируйте готовый текст и
            вставьте его в поле описания проблемы на форме ASUS. Карта диагностики AS-RUSSIA
            поможет описать проблему точно и коротко.
          </p>
        </header>

        {/* Форма-обёртка */}
        <SupportWrapper />

        {/* Что подготовить */}
        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
            Что подготовить перед обращением
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {PREPARE_ITEMS.map((item) => (
              <div key={item.title} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 text-accent mb-2">
                  {item.icon}
                  <span className="font-semibold text-foreground">{item.title}</span>
                </div>
                <p className="text-sm text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Телефон поддержки ASUS */}
        <section className="mt-8">
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl btn-accent flex items-center justify-center shrink-0">
                <IconPhone />
              </span>
              <div>
                <div className="font-semibold text-foreground">Телефон поддержки ASUS</div>
                <p className="text-sm text-muted">
                  Актуальный номер горячей линии и режим работы указаны на официальном сайте
                  поддержки ASUS. Круглосуточно, звонок по России.
                </p>
              </div>
            </div>
            <a
              href="https://www.asus.com/ru/support/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-5 py-2.5 rounded-xl border border-border hover:border-accent text-foreground font-medium transition inline-flex items-center gap-2"
            >
              asus.com/support
              <IconExternal />
            </a>
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
            href="/garranty"
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
