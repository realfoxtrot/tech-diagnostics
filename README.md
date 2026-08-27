# Диагностика и ремонт вычислительной техники

Web-приложение: диалоговая диагностика неисправностей ноутбуков → траблшутинг программных причин → направление в сервисный центр с историей диагностики.

## Стек

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS**
- **SQLite** (better-sqlite3) + **Drizzle ORM**

Один процесс, без внешних зависимостей — легко деплоить.

## Запуск

```bash
npm install
cp .env.example .env.local   # задать ADMIN_PASSWORD
npx drizzle-kit migrate      # создать таблицы
npx tsx db/seed.ts           # засеять дерево диагностики + СЦ
npm run dev
```

Сайт: http://localhost:3000
Админка: http://localhost:3000/admin (пароль из `ADMIN_PASSWORD`)

## Доступ из tailnet

Dev-сервер поднят на `0.0.0.0`. С MacBook в Tailscale:
`http://100.64.0.2:3000` (IP mac3 в tailnet).

## Структура

```
db/           schema.ts (5 таблиц), seed.ts, index.ts
lib/          diagnosis.ts — движок ветвления, admin-auth.ts
app/api/      diagnosis/{start,answer}, centers, ticket, admin/*
app/          страницы: / (диалог), /centers, /ticket, /admin
components/   DiagnosisChat, AdminPanel, LoginForm
tests/        vitest: движок диагностики
```

## Модель данных

- `questions` — вопросы дерева (isFirst = стартовый)
- `question_options` — ответы; ведут на след. вопрос или решение
- `resolutions` — траблшутинг: рекомендация + шаги + follow-up «помогло?»
- `service_centers` — СЦ: контакты + координаты (карта)
- `sessions` — обращение: номер (TD-YYYYMMDD-XXXX), транскрипт диалога, диагноз, исход

## Тесты

```bash
npx vitest run
```

## Вне MVP (позже)

- Штрих-код на карте диагностики
- Монетизация: оплата ремонта/комплектующих, service fee СЦ
- Централизованная сеть поставки запчастей по статистике диагностики
- Расширение на десктопы/планшеты/смартфоны
