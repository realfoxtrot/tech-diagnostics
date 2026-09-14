import Link from "next/link";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/* ── Inline SVG-иконки (line-style, stroke: currentColor, 24×24) ── */

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.29 7 12 12l8.71-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

/* ── Декоративный паттерн «печатная плата» (hero/CTA) ── */
function PcbPattern() {
  return (
    <svg className="absolute -right-8 -bottom-8 w-[130%] h-[130%] pointer-events-none" aria-hidden="true">
      <defs>
        <pattern id="pcb" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M0 36h20v20h16M72 36H52v20H36" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <path d="M0 16h28M72 56H44" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle cx="20" cy="16" r="2" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle cx="52" cy="56" r="2" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle cx="36" cy="36" r="3.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pcb)" />
    </svg>
  );
}

const HERO_GRADIENT = "linear-gradient(180deg, var(--hero-from) 0%, var(--hero-to) 100%)";

/* ── Плитки услуг — четыре входа ── */
const SERVICES = [
  { href: "/diagnosis", icon: WrenchIcon, title: "ИНТЕРАКТИВНАЯ ДИАГНОСТИКА", text: "Проверьте неисправность онлайн" },
  { href: "/warranty", icon: SearchIcon, title: "ПРОВЕРКА ГАРАНТИЙНОСТИ", text: "Проверьте устройство по серийному номеру" },
  { href: "/support", icon: HeadsetIcon, title: "ТЕХНИЧЕСКАЯ ПОДДЕРЖКА", text: "Свяжитесь с экспертами" },
  { href: "/warranty", icon: BoxIcon, title: "ОРИГИНАЛЬНЫЕ ЗАПЧАСТИ", text: "Точные оригинальные комплектующие" },
];

const FAQ = [
  {
    q: "Сколько длится диагностика?",
    a: "Бесплатная онлайн-диагностика — 5 минут. Диагностика в сервисном центре — от 1 дня, срок уточняется по телефону.",
  },
  {
    q: "Запчасти оригинальные?",
    a: "Да. AS-RUSSIA — авторизованный сервис: самый обширный доступ к оригинальным запасным частям и централизованная сеть их поставки по России.",
  },
  {
    q: "Что это стоит?",
    a: "Бесплатно: онлайн-диагностика, проверка гарантийности, техдокумент с историей. Платно — только ремонт или обращение в техподдержку по сложным случаям.",
  },
  {
    q: "Что такое техдокумент?",
    a: "Карта диагностики с номером обращения: всё, что вы ответили, какие рекомендации выполнялись и помогали ли. Покажите его инженеру — не нужно ничего пересказывать.",
  },
  {
    q: "Мой город не в списке?",
    a: "Сеть растёт. Оформите запрос в техподдержку — подскажем ближайший центр или как поступить с ремонтом.",
  },
];

export default async function LandingPage() {
  const centers = await db.query.serviceCenters.findMany({
    where: (sc, { eq }) => eq(sc.isActive, 1),
  });
  const cities = new Set(centers.map((c) => c.city).filter(Boolean)).size;

  return (
    <main className="flex-1">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: HERO_GRADIENT }}>
        <PcbPattern />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="font-sans text-3xl md:text-5xl font-bold uppercase tracking-[0.01em] text-white">
            Профессиональный ремонт ноутбуков ASUS
          </h1>
          <p className="text-white/85 max-w-2xl mx-auto mt-5">
            Самая большая сеть авторизованных сервисных центров в России.
            Оригинальные запчасти, гарантия качества.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/warranty"
              className="border border-white/60 text-white uppercase text-[13px] font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 hover:-translate-y-0.5 transition"
            >
              Проверить гарантийность
            </Link>
            <Link
              href="/centers"
              className="bg-accent-2 hover:bg-accent hover:text-white text-white uppercase text-[13px] font-bold px-8 py-3.5 rounded-lg shadow-lg shadow-black/20 hover:-translate-y-0.5 transition"
            >
              Найти сервисный центр
            </Link>
          </div>
          <div className="mt-9 text-sm text-white/85 font-light">
            {centers.length} сервисных центров · {cities} городов · интерактивная диагностика
          </div>
        </div>
      </section>

      {/* ── Плитки услуг ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group bg-card border border-border rounded-xl p-6 text-center shadow-[0_1px_3px_rgba(16,35,58,0.06)] hover:border-accent hover:-translate-y-0.5 transition"
            >
              <span className="mx-auto mb-4 w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center text-accent">
                <s.icon />
              </span>
              <div className="text-[13px] uppercase font-bold tracking-[0.03em] text-foreground">
                {s.title}
              </div>
              <div className="mt-1 text-[13px] text-muted">{s.text}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Как работает интерактивная диагностика ────────────── */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">Как работает интерактивная диагностика</h2>
          <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {[
              { n: "1", t: "Диагностика", d: "Отвечаете на вопросы — алгоритм определит тип проблемы за несколько шагов.", h: "/diagnosis" },
              { n: "2", t: "Чиним сами", d: "Получаете пошаговые рекомендации (траблшутинг). Половина проблем решается программно — бесплатно.", h: "/diagnosis" },
              { n: "3", t: "Техдокумент", d: "Не получилось? Создаём карту диагностики: номер обращения, история, все шаги.", h: null },
              { n: "4", t: "Сервисный центр", d: "Прикрепляете карту диагностики к запросу при обращении в техподдержку или показываете инженеру ближайшего авторизованного СЦ — придется гораздо меньше объяснять.", h: "/centers" },
            ].map((s) => (
              <div key={s.n} className="relative">
                <div className="absolute -left-8 top-1 w-6 h-6 rounded-full btn-accent text-xs font-bold flex items-center justify-center">
                  {s.n}
                </div>
                <div className="font-semibold text-foreground text-lg">{s.t}</div>
                <p className="text-muted text-sm mt-1">
                  {s.d}
                  {s.h && (
                    <Link href={s.h} className="text-accent hover:text-accent-hover ml-1">→</Link>
                  )}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/diagnosis"
              className="inline-block px-6 py-3 rounded-lg btn-accent font-semibold transition"
            >
              Попробовать сейчас
            </Link>
          </div>
        </div>
      </section>

      {/* ── Сеть сервисных центров ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Обширная сеть сервисных центров</h2>
            <p className="text-muted mt-3">
              {centers.length} авторизованных центра в {cities} городах — от Калининграда до Иркутска.
              Каждый центр: авторизованные инженеры, оригинальные запчасти, гарантия на работы.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {["Москва", "Санкт-Петербург", "Казань", "Ростов-на-Дону", "Иркутск", "Калининград"].map((c) => (
                <span key={c} className="px-3 py-1.5 rounded-full bg-accent-soft text-accent font-medium">
                  {c}
                </span>
              ))}
              <span className="px-3 py-1.5 rounded-full bg-accent-soft text-muted">и ещё {Math.max(0, cities - 6)}</span>
            </div>
            <Link
              href="/centers"
              className="inline-block mt-6 px-6 py-3 rounded-lg border border-border hover:border-accent text-foreground font-medium transition"
            >
              Сервисные центры на карте →
            </Link>
          </div>
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-[0_1px_3px_rgba(16,35,58,0.06)]">
            <div className="text-6xl font-mono font-bold text-accent">{cities}</div>
            <div className="text-muted mt-1">города России</div>
            <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-2xl font-mono font-bold text-foreground">{centers.length}</div>
                <div className="text-muted">СЦ</div>
              </div>
              <div>
                <div className="text-2xl font-mono font-bold text-foreground">24/7</div>
                <div className="text-muted">техподдержка</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Гарантии/бесплатность ──────────────────────────────── */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-3 gap-6 text-center">
          {[
            { t: "Интерактивная диагностика", d: "Онлайн-диагностика, проверка гарантийности и техдокумент ничего не стоят." },
            { t: "Гарантия на работы", d: "Авторизованный сервис: гарантия на все выполненные работы и установленные запчасти." },
            { t: "Оригинальные запчасти", d: "Самый обширный доступ к запасным частям и централизованная сеть поставки по России." },
          ].map((b) => (
            <div key={b.t}>
              <div className="font-semibold text-foreground text-lg">{b.t}</div>
              <p className="text-muted text-sm mt-2">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">Вопросы и ответы</h2>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group bg-card border border-border rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(16,35,58,0.06)]">
              <summary className="cursor-pointer list-none flex items-center justify-between px-5 py-4 font-medium text-foreground hover:text-accent transition">
                {f.q}
                <span className="text-muted group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Финальный CTA ──────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: HERO_GRADIENT }}>
        <PcbPattern />
        <div className="relative max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Что случилось с вашим ноутбуком?</h2>
          <p className="text-white/85 mt-3">Узнайте за 5 минут. Бесплатно, без регистрации.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/diagnosis"
              className="bg-white text-accent uppercase text-[13px] font-bold px-7 py-3.5 rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition"
            >
              Начать диагностику
            </Link>
            <Link
              href="/centers"
              className="px-6 py-3.5 rounded-lg border border-white/40 text-white hover:bg-white/10 transition font-medium"
            >
              Найти сервисный центр
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
