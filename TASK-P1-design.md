# TASK P1 — дизайн AS-RUSSIA: лендинг + все страницы под эталон

Проект: `/Users/mac3/dev/tech-diagnostics` (Next.js 16 App Router, TS, Tailwind 4, SQLite/Drizzle).
Ты — основной дизайн-кодер в этом репо. Работай прямо в этом рабочем дереве. Другие агенты
правят ТОЛЬКО `app/support/page.tsx` и новые файлы `components/SupportWrapper*.tsx` — их не трогай.

## Цель
Привести дизайн сайта к виду эталонного скриншота AS-RUSSIA (ниже — точная спецификация:
цвета, типографика, геометрия). Лендинг `/` — в точном соответствии; остальные страницы
(`/garranty`, `/diagnosis`, `/centers`, `/ticket`, `/admin*`) — «соответственно», то есть
та же палитра/типографика/карточки/кнопки, без смены логики.

## Дизайн-токены (ЗАМЕНИТЬ в app/globals.css)
```css
:root {
  --background: #f5f7fa;      /* светлый серо-голубой фон страницы */
  --foreground: #16233a;      /* почти чёрный синий текст */
  --muted: #5b6b82;           /* вторичный текст */
  --card: #ffffff;
  --border: #dfe3ea;
  --accent: #00539b;          /* ASUS blue — основной акцент */
  --accent-hover: #00417a;
  --accent-2: #4a9bd4;        /* светло-голубой (кружки иконок, линии) */
  --accent-soft: #eaf3fb;     /* светлая заливка бейджей */
  --hero-from: #23659b;       /* верх градиента hero */
  --hero-to: #0b2651;         /* низ градиента hero */
  --footer-bg: #0a1f42;       /* тёмно-синий футер */
}
.dark { /* тёмная тема: те же оттенки, адаптированные */
  --background: #0b1220; --foreground: #e6ecf5; --muted: #93a3b8; --card: #131f33;
  --border: #253449; --accent: #4a9bd4; --accent-hover: #6fb3e0; --accent-2: #4a9bd4;
  --accent-soft: #16273d; --footer-bg: #08152c;
}
```
`@theme inline` — добавить `--color-accent-2`, `--color-accent-soft`, `--color-footer-bg`.
Тёмная тема ДОЛЖНА остаться рабочей (переключатель в шапке), но hero всегда градиент.

## Типографика
- Шрифт: `Arial, Helvetica, sans-serif` (как сейчас в body) — оставить системный без загрузки веб-шрифтов.
- H1 (hero): uppercase, `font-weight:700`, `letter-spacing:0.01em`, размеры `text-3xl md:text-5xl`.
- Заголовки секций: `text-2xl md:text-3xl`, `font-bold`, цвет `--foreground`.
- Навигация и заголовки плиток: uppercase, `text-[13px]`, `letter-spacing:0.03em`.
- Никаких хардкод-hex в JSX: только классы Tailwind (`bg-accent`, `text-foreground`, `border-border`) или `var(--…)`.

## Структура лендинга `/` (app/page.tsx) — по эталону сверху вниз
1. **Шапка** (`components/SiteHeader.tsx`): белая полоса (`bg-card`, `border-b border-border`, sticky),
   высота ~64px, логотип слева (`<Logo>` 40×40 + текст «AS-RUSSIA» bold `--foreground` c подписью
   мелким `--muted`), справа — 4 ссылки ВЕРХНИМ РЕГИСТРОМ 13px: «ГАРАНТИЯ», «ПОДДЕРЖКА»,
   «ДИАГНОСТИКА», «СЕРВИСНЫЕ ЦЕНТРЫ» (маршруты не менять: `/garranty`, `/support`, `/diagnosis`, `/centers`).
   Активный пункт — цвет `--accent` (не залитая плашка). ThemeToggle оставить справа, компактный.
   Мобильное меню — как сейчас.
2. **Hero**: `linear-gradient(180deg, var(--hero-from) 0%, var(--hero-to) 100%)`,
   поверх — декоративный паттерн «печатная плата» (inline SVG, линии `rgba(255,255,255,0.12)`,
   абсолютом, смещён вправо-вниз, `pointer-events-none`, `aria-hidden`).
   По центру, отступы `py-16 md:py-20`:
   - вордмарк «AS-RUSSIA» 13px uppercase, `letter-spacing:0.25em`, цвет `rgba(255,255,255,0.75)`;
   - H1 «ПРОФЕССИОНАЛЬНЫЙ РЕМОНТ НОУТБУКОВ ASUS» (белый, uppercase);
   - подзаголовок в 2 строки: «Самая большая сеть авторизованных сервисных центров в России.
     Оригинальные запчасти, гарантия качества.» (`rgba(255,255,255,0.85)`, `max-w-2xl mx-auto`);
   - CTA-кнопка «НАЙТИ СЕРВИСНЫЙ ЦЕНТР» → `/centers`: БЕЛАЯ заливка, текст `--accent`,
     uppercase 13px, `font-weight:700`, `padding:14px 28px`, `border-radius:8px`, hover — лёгкий сдвиг/тень.
     Рядом вторичная ссылка-текст «Пройти диагностику →» белым без заливки.
   - Под кнопками — строка фактов тонким шрифтом (белый 75%): «{N} сервисных центров · {M} городов ·
     диагностика бесплатно». N/M берутся из БД как сейчас (`centers.length`, `cities`).
   - НЕ переносить сюда логотип-картинку крупно и НЕ ставить звёздное небо/индиго-градиент — они уходят.
3. **Плитки услуг**: 4 карточки в один ряд (`grid gap-5 sm:grid-cols-2 lg:grid-cols-4`),
   БЕЛЫЕ, `border border-border`, `border-radius:12px`, `box-shadow:0 1px 3px rgba(16,35,58,0.06)`,
   `padding:24px 20px`, выравнивание по центру:
   - иконка — inline SVG (line-style, `stroke:currentColor`, 24×24) в кружке 48px `bg-accent-soft`,
     цвет иконки `--accent`: 1) шестерёнка/диагностика, 2) лупа, 3) гарнитура, 4) коробка.
     Эмодзи-иконки убрать полностью;
   - заголовок uppercase 13px bold `--foreground`; подпись 13px `--muted`.
   Тексты (точные):
   - «ИНТЕРАКТИВНАЯ ДИАГНОСТИКА» / «Проверьте неисправность онлайн» → `/diagnosis`
   - «ПРОВЕРКА СТАТУСА РЕМОНТА» / «Отследите ваш ноутбук» → `/ticket` (страница карты диагностики по номеру)
   - «ТЕХНИЧЕСКАЯ ПОДДЕРЖКА» / «Свяжитесь с экспертами» → `/support`
   - «ОРИГИНАЛЬНЫЕ ЗАПЧАСТИ» / «Только фирменные комплектующие» → `/garranty`
   Карточка целиком — ссылка, hover: `border-color:var(--accent)` + чуть приподнять.
4. Далее секции в том же стиле (структуру и тексты сохранить, перекрасить):
   «Как это работает» (4 шага, нумерация в кружке `bg-accent`), «Сеть сервисных центров» (цифры + чипы
   в `bg-accent-soft`/`text-accent`), «Гарантии» (3 колонки), FAQ (`<details>` — белые карточки, border-radius 12px),
   финальный CTA-блок — тёмно-синий градиент как hero + белая кнопка.
5. **Футер** (`components/SiteFooter.tsx`): тёмно-синий (`--footer-bg`), текст белый/`rgba(255,255,255,0.72)`,
   логотип + 4 ссылки навигации, нижняя строка копирайта, отступы `py-10`.

## Остальные страницы — «соответственно»
- `app/garranty/page.tsx` + `components/WarrantyChecker.tsx`: убрать эмодзи 🛡️/🔍, форма — белая карточка
  `rounded-xl`, инпуты `bg-card`/`border-border`/`focus:ring-accent`, кнопки `bg-accent` → `hover:bg-accent-hover`,
  списки условий — чипы `bg-accent-soft text-accent`; зелёный/красный результат оставить, но оттенки
  согласовать: успех `#0f7a4a` на `#e8f6ee`, ошибка `#b42318` на `#fdecea` (тёмная тема — свои).
- `app/diagnosis/page.tsx` + `components/DiagnosisChat.tsx`: цвета кнопок/бабблов — палитра ASUS
  (индиго заменить на `--accent`/`--accent-2`), карточки белые, никаких эмодзи в интерфейсе.
- `app/centers/page.tsx` + `components/CentersMap.tsx`: белые карточки СЦ, акцентные ссылки, кнопки.
- `app/ticket/page.tsx`: нумерованные блоки рекомендаций — `bg-accent-soft` + левая граница `--accent`;
  followup-ответы зелёный/красный как выше.
- `app/admin/*`, `components/AdminPanel.tsx`, `components/LoginForm.tsx`: та же палитра, компактно, функционал не менять.
- Глобально: `grep -rn "#4f46e5\|#4338ca\|indigo-\|#818cf8\|#0b1220" app components` — все вхождения
  индиго/хардкод-hex заменить на токены.

## Запреты
- НЕ менять API (`app/api/**`), схему БД (`db/**`), миграции, `lib/**`, тесты, `next.config.ts`, `start-server.sh`.
- НЕ добавлять npm-зависимости, не грузить веб-шрифты, не менять маршруты и тексты, кроме указанных.
- НЕ трогать `app/support/page.tsx` и `components/SupportWrapper*` (другой агент).
- НЕ коммитить в git — коммит делает оркестратор после ревью.

## Обязательные проверки (приложить вывод в отчёт)
```
npx tsc --noEmit            # 0 ошибок
npm run lint                # 0 errors (warnings допустимы, если были и до)
npx vitest run              # все тесты зелёные
npm run build               # успешная сборка
```
Плюс: `npm run dev -- --port 3010` в фоне и `curl -s -o /dev/null -w "%{http_code}"` по маршрутам
`/ /garranty /support /diagnosis /centers /admin/login` — все 200. Затем dev-сервер погасить.

## Отчёт (кратко, по-русски)
1. Изменённые/новые файлы. 2. Что именно заменено (индиго/эмодзи → токены/SVG). 3. Вывод проверок
(tsc/lint/vitest/build/curl-коды). 4. Что не сделано и почему.
