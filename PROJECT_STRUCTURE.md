# Структура проекта: tech-diagnostics

Web-приложение «Диагностика и ремонт вычислительной техники»: диалоговая диагностика ноутбуков → траблшутинг программных причин → направление в сервисный центр с историей диагностики.

Стек: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + SQLite (better-sqlite3) + Drizzle ORM. Один процесс, без внешних зависимостей.

## Корень

| Файл | Назначение |
|---|---|
| `README.md` | Краткая документация: запуск, структура, модель данных, тесты |
| `PRD.md` | Продуктовое ТЗ: проблема, MVP-цель, пользовательский поток, функции админки, требования |
| `AGENTS.md` | Инструкция для AI-агентов (Next.js breaking changes, читать доки из `node_modules/next`) |
| `CLAUDE.md` | Плейсхолдер для Claude Code |
| `PROJECT_STRUCTURE.md` | Этот файл |
| `proxy.ts` | Защита `/admin/*` (кука `admin_auth` = SHA-256-токен от пароля, constant-time сравнение), редирект на `/admin/login`; постоянный 308-редирект `/garranty` → `/warranty`. Next 16: `middleware.ts` переименован в `proxy.ts` (export `proxy`) |
| `next.config.ts` | `allowedDevOrigins` (100.64.0.2 Tailscale, localhost), `devIndicators: false` |
| `tsconfig.json` | TS strict, alias `@/*` → корень, target ES2017 |
| `next-env.d.ts` | Генерируемые типы Next.js |
| `tsconfig.tsbuildinfo` | Кэш инкрементальной сборки TS (генерируемый) |
| `package.json` | Зависимости: next 16.3.3, react 19.2.8, better-sqlite3, drizzle-orm; dev: tailwind 4, vitest, drizzle-kit, tsx, typescript |
| `package-lock.json` | Лок-файл npm |
| `postcss.config.mjs` | PostCSS с `@tailwindcss/postcss` |
| `eslint.config.mjs` | ESLint flat config: next core-web-vitals + typescript |
| `vitest.config.mjs` | Vitest: node environment, тесты в `tests/**/*.test.ts`, alias `@` (ESM — нужен `.mjs` при импорте в CJS-контексте) |
| `drizzle.config.ts` | Drizzle Kit: схема `./db/schema.ts`, миграции в `./drizzle`, SQLite `./data/diagnostics.db` |
| `start-server.sh` | zsh-скрипт автозапуска: `git pull --ff-only`, rebuild при изменённых исходниках, `next start 0.0.0.0:3000`, лог в `/tmp/tech-diagnostics.log` |
| `.env.example` | Шаблон env: `DATABASE_PATH`, `ADMIN_PASSWORD` |
| `.env.local` | Локальные env-переменные (не в git) |
| `.gitignore` | Ignores: node_modules, .next, .env.local, data/*.db и пр. |

## `app/` — страницы и API (App Router)

### Страницы

| Путь | Файл | Назначение |
|---|---|---|
| `/` | `app/page.tsx` | Лендинг AS-RUSSIA: hero (звёздное небо + логотип-единорог), «четыре входа», «как это работает», сеть (51 СЦ/44 города), гарантии, FAQ, финальный CTA |
| `/diagnosis` | `app/diagnosis/page.tsx` | Диалоговая диагностика (`<DiagnosisChat>`) |
| `/warranty` | `app/warranty/page.tsx` | Проверка гарантийности: дата покупки + серийный номер, AJAX-проверка (механика как на as-russia.ru), результат «Результат проверки:» (ошибки/сообщения) |
| `/support` | `app/support/page.tsx` + `components/SupportRedirectButton.tsx` | Уведомление о переадресации: сайт НЕ собирает персональные данные, кнопка «Подтверждаю — перейти на сайт ASUS» → официальная форма ASUS |
| `/centers` | `app/centers/page.tsx` | Серверная страница: список активных сервисных центров из БД, карта, ссылки на выбор |
| `/ticket` | `app/ticket/page.tsx` | Страница по номеру обращения (?n=): история диагностики (техдокумент), диагноз, привязанный СЦ |
| `/admin` | `app/admin/page.tsx` | Админка: `<AdminPanel>` (CRUD вопросов, решений, СЦ) |
| `/admin/login` | `app/admin/login/page.tsx` | Форма входа в админку (`<LoginForm>`) |
| — | `app/layout.tsx` | Корневой layout, подключение `globals.css` |
| — | `app/globals.css` | Глобальные стили, Tailwind |
| — | `app/favicon.ico` | Фавиконка |

### API-роуты

| Путь | Методы | Назначение |
|---|---|---|
| `/api/diagnosis/start` | GET | Стартовый вопрос дерева (isFirst) |
| `/api/diagnosis/answer` | POST, GET | Ответ на вопрос: двигает по дереву (следующий вопрос / решение / follow-up «помогло?») |
| `/api/warranty/check` | POST `{serial_number, purchase_date}` → `{errors, messages, serial_number, covered, conditions[]}`. Порядок: локальная валидация (SN 12–20 симв., дата) → вендор `POST as-russia.ru/api/check_sn` (только факты: валидность SN, страна отгрузки, дата отгрузки) → **локальный вердикт** по 4 условиям программы (ноутбук, РФ, чек с 01.01.2026, производство не ранее 01.07.2025) → запись в `warranty_checks` (covered/rejected/error) с чеклистом условий |
| `/api/admin/warranty-checks` | GET список проверок; PUT `{id, status, messages}` — подтверждение по данным поставщика |

| `/api/centers` | GET | Список активных сервисных центров (для публичной карты) |
| `/api/admin/login` | POST | Вход в админку: rate limit 5 неудач/10 мин/IP, ставит cookie `admin_auth` = производный токен (не сам пароль) |
| `/api/admin/logout` | GET | Выход: снимает cookie |
| `/api/admin/questions` | GET/POST/PUT/DELETE | CRUD дерева вопросов и опций |
| `/api/admin/resolutions` | GET/POST/PUT/DELETE | CRUD решений/рекомендаций (цепочки траблшутинга) |
| `/api/admin/centers` | GET/POST/PUT/DELETE | CRUD сервисных центров |

Все `/api/admin/*` (кроме login) проверяют `isAdmin()` из `lib/admin-auth.ts`.

## `components/` — React-компоненты

| Файл | Назначение |
|---|---|
| `DiagnosisChat.tsx` | Клиентский чат диагностики: вопросы → шаги цепочки рекомендаций (бейдж «Шаг: <краткое название рекомендации>», счётчик «Шаг k из n»), follow-up «Помогло?», создание тикета в конце |
| `AdminPanel.tsx` | Панель администратора: формы CRUD для вопросов, рекомендаций, сервисных центров |
| `LoginForm.tsx` | Форма пароля для входа в админку |
| `ThemeToggle.tsx` | Переключатель светлой/тёмной темы (localStorage + системная настройка) |
| `TicketBarcode.tsx` | Штрих-код Code128 (jsbarcode) по номеру обращения на карте диагностики |
| `Logo.tsx` | Логотип AS-RUSSIA (изображение `public/logo.jpeg`) |
| `SiteHeader.tsx` | Общая шапка: логотип, 4 пункта навигации (гарантийность/техподдержка/диагностика/СЦ), ThemeToggle, мобильное меню |
| `SiteFooter.tsx` | Общий футер с навигацией |
| `CentersMap.tsx` | Карта СЦ: MapLibre GL + тайлы Esri ArcGIS (без ключа), пины + popup |

| `WarrantyChecker.tsx` | Проверка гарантийности (ASUS-программа): дата продажи по чеку + SN (uppercase), спиннер, Enter, условия программы, результат «Результат проверки:», очистка при вводе |

## `db/` — база данных

| Файл | Назначение |
|---|---|
| `schema.ts` | Drizzle-схема, 7 таблиц: `questions` (вопросы дерева, isFirst), `question_options` (ответы → вопрос или цепочку), `resolutions` (рекомендация = цепочка), `resolution_steps` (шаги: text, order, nextStepId — «не помогло» → следующий), `service_centers` (имя, город, адрес, телефон, режим работы, координаты, isActive; 51 СЦ из Excel), `sessions` (обращение: номер, транскрипт, диагноз, СЦ), `warranty_checks` (SN, дата покупки, program_start, result JSON: localErrors/vendorErrors/vendorMessages/covered, статус covered/rejected/error + legacy pending/confirmed) |
| `index.ts` | Подключение: better-sqlite3 + drizzle, WAL mode, путь из `DATABASE_PATH` |
| `seed.ts` | Засев: дерево (1 корневой + 10 категорий + 1 L3 = 12 вопросов, 64 опции), 53 цепочки траблшутинга (~50 типичных программных неисправностей, 126 шагов), 3 СЦ. Запуск: `npx tsx db/seed.ts` |

## `lib/` — бизнес-логика

| Файл | Назначение |
|---|---|
| `diagnosis.ts` | Движок ветвления: `getStartQuestion`, `getQuestionWithOptions`, `advanceFromOption` (опция → вопрос | первый шаг цепочки), `getResolutionWithSteps`, `getNextStep` (следующий шаг); тип `StepResult` (question/resolution/done + currentStepId) |
| `admin-auth.ts` | `isAdmin(req)` — проверка cookie против `ADMIN_PASSWORD`; `unauthorized()` — ответ 401 |

## `drizzle/` — миграции

| Файл | Назначение |
|---|---|
| `0000_safe_darwin.sql` | Миграция 0: базовые таблицы |
| `0001_tough_xorn.sql` | Миграция 1: `ALTER TABLE resolutions ADD next_resolution_id` (устаревшая цепочка) |
| `0002_*.sql` | Миграция 2: таблица `resolution_steps` (шаги цепочек) |
| `0003_*.sql` | Миграция 3: `service_centers.workhours` |
| `0004_*.sql` | Миграция 4: `service_centers.city` |
| `0005_*.sql` | Миграция 5: таблица `warranty_checks` (обращения по гарантийности) |
| `0006_*.sql` | Миграция 6: `warranty_checks.program_start` |
| `meta/` | Снапшоты схемы (0000/0001) + `_journal.json` для drizzle-kit |

## `data/` — файлы SQLite (не в git)

| Файл | Назначение |
|---|---|
| `diagnostics.db` | База данных |
| `diagnostics.db-shm` | WAL shared memory (служебный) |
| `diagnostics.db-wal` | WAL journal (служебный) |

## `tests/` — тесты

| Файл | Назначение |
|---|---|
| `diagnosis.test.ts` | Vitest: движок диагностики (`getStartQuestion`, `advanceFromOption`, `getQuestionWithOptions`, `getNextResolution`), целостность дерева. Запуск: `npx vitest run` |

## `public/` — статика

| Файл | Назначение |
|---|---|
| `file.svg`, `globe.svg`, `window.svg` | Значки по умолчанию из create-next-app |
| `next.svg`, `vercel.svg` | Логотипы Next.js / Vercel |

## Команды

```bash
npm install
cp .env.example .env.local   # задать ADMIN_PASSWORD
npx drizzle-kit migrate      # создать/обновить таблицы
npx tsx db/seed.ts           # засеять дерево диагностики + СЦ
npm run dev                  # http://localhost:3000
npm run build                # production-сборка
npx vitest run               # тесты
./start-server.sh            # автозапуск production (git pull + rebuild + next start)
```

## Схема данных (кратко)

```
questions ──1:N── question_options ──N:1── questions   (ветвление дерева)
question_options ──N:1── resolutions                  (ответ = цепочка траблшутинга)
resolutions ──1:N── resolution_steps ──N:1── resolution_steps   (order, nextStepId: «не помогло» → следующий шаг)
sessions  ──N:1── service_centers                     (обращение → СЦ)
```

## Пользовательский поток

1. `/` — диалог: дерево вопросов, один экран = один вопрос (12 категорий типичных неисправностей)
2. Ответ ведёт на следующий вопрос или к цепочке рекомендаций (53 цепочки, 126 шагов)
3. За каждый шаг — follow-up «Помогло?»: «нет» → следующий шаг цепочки; в конце → СЦ. «Да» → resolved_self
4. Создание тикета → `/ticket?ticket=...` (техдокумент с номером TD-YYYYMMDD-XXXX + штрих-код Code128)
5. Выбор СЦ → `/centers` (карта, контакты), обращение привязывается
6. Тема: светлая/тёмная (кнопка на страницах, localStorage, по умолчанию — системная)
