import Link from "next/link";
import { db } from "@/db";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

// «Четыре входа» — ядро навигации PRD
const ENTRIES = [
  {
    href: "/garranty",
    icon: "🛡️",
    title: "Проверка гарантийности",
    text: "Узнайте, действует ли гарантия и какие условия ремонта по вашему ноутбуку.",
    cta: "Проверить",
  },
  {
    href: "/support",
    icon: "💬",
    title: "Запрос в техподдержку",
    text: "Опишите проблему — экспертная служба технической поддержки AS-RUSSIA свяжется с вами.",
    cta: "Оформить запрос",
  },
  {
    href: "/diagnosis",
    icon: "🔍",
    title: "Поиск и устранение проблем",
    text: "Диалоговая диагностика: найдём причину и подскажем, как починить самому. Бесплатно, без регистрации.",
    cta: "Диагностировать ноутбук",
    primary: true,
  },
  {
    href: "/centers",
    icon: "📍",
    title: "Сервисные центры",
    text: "Список авторизованных СЦ на карте: адреса, контакты, режим работы.",
    cta: "Смотреть список",
  },
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
      {/* ── Hero: фон в цвет логотипа ───────────────────────────── */}
      <section className="relative overflow-hidden bg-[#04122f]">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 115%, rgba(99,102,241,0.45), transparent 60%)" }}
        />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          <div className="flex justify-center mb-6">
            <Logo className="w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_0_25px_rgba(129,140,248,0.55)]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            AS-RUSSIA
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 mt-3 font-medium">
            Чиним ноутбуки по всей России
          </p>
          <p className="max-w-2xl mx-auto text-indigo-200/90 mt-4 text-base md:text-lg">
            Проверим гарантийность, найдём причину, починим — или подскажем, как
            починить самому бесплатно.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/diagnosis"
              className="px-7 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-lg font-semibold shadow-lg shadow-indigo-900/50 transition"
            >
              🔍 Диагностикаровать ноутбук
            </Link>
            <Link
              href="/garranty"
              className="px-6 py-3.5 rounded-2xl border border-indigo-300/40 text-indigo-100 hover:bg-indigo-500/20 transition font-medium"
            >
              Проверить гарантийность →
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-indigo-200/80">
            <span><b className="text-white text-lg font-mono">{centers.length}</b> сервисных центра</span>
            <span><b className="text-white text-lg font-mono">{cities}</b> городов</span>
            <span><b className="text-white text-lg font-mono">5 мин</b> — онлайн-диагностика</span>
            <span><b className="text-white text-lg font-mono">0 ₽</b> — диагностика и гарантийность</span>
          </div>
        </div>
      </section>

      {/* ── Четыре входа (ядро навигации) ───────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">С чего начать</h2>
        <p className="text-muted text-center mt-2 mb-8">Четыре действия — на любой случай поломки</p>
        <div className="grid gap-4 md:grid-cols-2">
          {ENTRIES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className={`group rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-lg ${
                e.primary
                  ? "bg-accent text-white border-accent hover:bg-accent-hover"
                  : "bg-card border-border hover:border-accent"
              }`}
            >
              <div className="text-3xl mb-3">{e.icon}</div>
              <div className="text-lg font-semibold text-foreground group-hover:text-accent transition" style={e.primary ? { color: "white" } : undefined}>
                {e.title}
              </div>
              <p className={`mt-2 text-sm ${e.primary ? "text-indigo-100" : "text-muted"}`}>{e.text}</p>
              <div className={`mt-4 font-medium ${e.primary ? "text-white" : "text-accent"}`}>
                {e.cta} →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Как это работает (траектория вылета) ─────────────────── */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">Как это работает</h2>
          <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {[
              { n: "1", t: "Диагностика", d: "Отвечаете на вопросы — алгоритм определит тип проблемы за несколько шагов.", h: "/diagnosis" },
              { n: "2", t: "Чиним сами", d: "Получаете пошаговые рекомендации (траблшутинг). Половина проблем решается программно — бесплатно.", h: "/diagnosis" },
              { n: "3", t: "Техдокумент", d: "Не получилось? Создаём карту диагностики: номер обращения, история, все шаги.", h: null },
              { n: "4", t: "Сервисный центр", d: "Показываете техдокумент инженеру ближайшего авторизованного СЦ — с него не нужно начинать заново.", h: "/centers" },
            ].map((s) => (
              <div key={s.n} className="relative">
                <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
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
              className="inline-block px-6 py-3 rounded-2xl bg-accent hover:bg-accent-hover text-white font-semibold transition"
            >
              Попробовать сейчас
            </Link>
          </div>
        </div>
      </section>

      {/* ── Сеть ────────────────────────────────────────────────── */}
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
                <span key={c} className="px-3 py-1.5 rounded-full bg-card border border-border text-foreground">
                  {c}
                </span>
              ))}
              <span className="px-3 py-1.5 rounded-full bg-card border border-border text-muted">и ещё {Math.max(0, cities - 6)}</span>
            </div>
            <Link
              href="/centers"
              className="inline-block mt-6 px-6 py-3 rounded-2xl border border-border hover:border-accent text-foreground font-medium transition"
            >
              Сервисные центры на карте →
            </Link>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
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

      {/* ── Гарантии/бесплатность ────────────────────────────────── */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-3 gap-6 text-center">
          {[
            { t: "Диагностика — бесплатно", d: "Онлайн-диагностика, проверка гарантийности и техдокумент ничего не стоят." },
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

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">Вопросы и ответы</h2>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group bg-card border border-border rounded-2xl overflow-hidden">
              <summary className="cursor-pointer list-none flex items-center justify-between px-5 py-4 font-medium text-foreground hover:text-accent transition">
                {f.q}
                <span className="text-muted group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Финальный CTA ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#04122f]">
        <div className="relative max-w-3xl mx-auto px-4 py-20 text-center">
          <Logo className="w-20 h-20 mx-auto mb-5 drop-shadow-[0_0_20px_rgba(129,140,248,0.5)]" />
          <h2 className="text-3xl md:text-4xl font-bold text-white">Что случилось с вашим ноутбуком?</h2>
          <p className="text-indigo-200/90 mt-3">Узнайте за 5 минут. Бесплатно, без регистрации.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/diagnosis"
              className="px-7 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-lg font-semibold transition"
            >
              Начать диагностику
            </Link>
            <Link
              href="/centers"
              className="px-6 py-3.5 rounded-2xl border border-indigo-300/40 text-indigo-100 hover:bg-indigo-500/20 transition font-medium"
            >
              Найти сервисный центр
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
