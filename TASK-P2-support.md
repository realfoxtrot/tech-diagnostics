# TASK P2 — страница обращения в техподдержку ASUS (обёртка над формой ASUS)

Проект: `/Users/mac3/dev/tech-diagnostics` (Next.js 16 App Router, TS, Tailwind 4, SQLite/Drizzle).
Ты — кодер отдельной фичи. Другой агент прямо сейчас меняет `app/globals.css`, `components/SiteHeader.tsx`,
`SiteFooter.tsx`, `Logo.tsx` и все страницы КРОМЕ `/support` — эти файлы НЕ трогай.
Твои файлы: `app/support/page.tsx`, новые `components/SupportWrapper.tsx` (можно `+ SupportWrapper*` подкомпоненты),
`lib/support.ts` (если нужен), `app/api/support/request/route.ts` (+ миграция БД — см. ниже).

## Факты (проверено оркестратором, не перепроверяй долго)
- Оригинальная форма ASUS: `https://www.asus.com/support/Product/ContactUs/Services/questionform/?lang=ru-ru`
- Она отдаёт `x-frame-options: SAMEORIGIN` и CSP `frame-ancestors 'self' *.asus.com` → **iframe невозможен**.
  Значит «прямая обёртка» iframe-ом отпадает; делать надо: НАША страница в нашем дизайне, которая
  собирает контекст обращения и ведёт пользователя в оригинальную форму ASUS.

## Что построить

### 1. `app/support/page.tsx` + `components/SupportWrapper.tsx` (server page + client component)
Страница в стиле AS-RUSSIA (палитра уже меняется другим агентом; используй ТОЛЬКО существующие токены:
`bg-card`, `text-foreground`, `text-muted`, `border-border`, `bg-accent`, `hover:bg-accent-hover`,
`bg-accent-soft`, `text-accent`, `bg-background`, `rounded-xl`, `border`). Хардкод-hex не использовать.
Структура сверху вниз:
1. Хлебная крошка/заголовок: H1 «Обращение в службу технической поддержки ASUS», подзаголовок о том,
   что запрос уходит в ASUS, а карта диагностики AS-RUSSIA поможет описать проблему.
2. **Форма обёртки** (наша, рабочая) — поля, повторяющие состав формы ASUS:
   - ФИО (или имя) — `full_name`, обязательное;
   - email — `email`, обязательное, валидация формата;
   - телефон — `phone`, необязательное;
   - тип продукта — `product_type`, select: `Ноутбук / Zenbook / Vivobook / ROG / TUF Gaming / ProArt / Другое`;
     значение по умолчанию — «Ноутбук»;
   - серийный номер — `serial`, необязательное, uppercase, 12–20 символов (если заполнено — валидация);
   - дата покупки — `purchase_date`, необязательное (`type="date"`);
   - город — `city`, необязательное;
   - описание проблемы — `description`, обязательное, textarea, min 20 символов;
   - галочка согласия на обработку персональных данных — обязательная.
   Кнопка отправки: «Сформировать обращение».
3. **После отправки (без перезагрузки)**: показать блок «Обращение сформировано» с:
   - номером обращения `TD-YYYYMMDD-XXXX` (формат как в `app/api/ticket/route.ts`, если номер нужен — генерируй в новом API);
   - готовым текстом обращения (ФИО, продукт, SN, дата покупки, город, описание) в `<textarea readOnly>`;
   - кнопкой «Скопировать текст» (`navigator.clipboard.writeText`, fallback через `select()`+`document.execCommand("copy")`,
     состояние «Скопировано ✓» на 2 сек);
   - ссылкой «Открыть форму техподдержки ASUS →» (`target="_blank" rel="noopener noreferrer"`) на URL ASUS выше;
   - подсказкой: «Откроется форма ASUS — вставьте скопированный текст в поле описания проблемы»;
   - если есть серийный номер — предложить также пройти `/garranty` и приложить результат.
4. Ниже формы — справочный блок «Что подготовить перед обращением» (список: серийный номер,
   чек/дата покупки, описание, фото) и блок «Телефон поддержки ASUS» со ссылкой на asus.com.
   Никаких эмодзи — только inline SVG line-иконки (`stroke="currentColor"`).

### 2. API `app/api/support/request/route.ts` (POST)
Тело: `{ full_name, email, phone?, product_type, serial?, purchase_date?, city?, description, consent }`.
- Валидация: обязательные поля, email-формат, длина описания ≥ 20, `consent === true`; иначе `400 { errors: string[] }`.
- Генерация номера: `TD-` + `yyyyMMdd` + `-` + 4 цифры (уникальность — как в существующем создании тикета, посмотри
  `app/api/ticket/route.ts` и `db/schema.ts`).
- Сохранить обращение в БД (см. п.3) и вернуть `{ ticketNumber, messageText }`, где `messageText` — готовый текст
  для вставки в форму ASUS (многострочный, с заголовком «Обращение TD-…»).
- Никаких сетевых вызовов к asus.com: вендорская форма не имеет публичного API и требует своей сессии —
  отправка к ним из нашего бэкенда не делается. Это осознанное решение оркестратора, не пытайся его обойти.

### 3. БД (минимально и аккуратно)
Нужна новая таблица `support_requests`: `id`, `ticketNumber` (unique), `fullName`, `email`, `phone`, `productType`,
`serial`, `purchaseDate`, `city`, `description`, `status` (default `new`), `createdAt`.
- Добавить в `db/schema.ts`, сгенерировать миграцию `npx drizzle-kit generate` и применить `npx drizzle-kit migrate`.
  ⚠ Другие агенты БД не трогают, конфликтов не будет. Файл `db/schema.ts` — только добавление таблицы в конец,
  существующее не менять.
- ⚠ Не вызывать `db/seed.ts`, не удалять и не пересоздавать `data/diagnostics.db`.

## Запреты
- НЕ менять `app/globals.css`, `components/SiteHeader.tsx`, `SiteFooter.tsx`, `Logo.tsx`, `app/page.tsx`,
  другие страницы, `lib/diagnosis.ts`, `lib/warranty.ts`, `lib/vendor.ts`, тесты, `next.config.ts`.
- НЕ добавлять npm-зависимости. Эмодзи в UI не использовать. Хардкод-цвета не использовать.
- НЕ коммитить (коммитит оркестратор после ревью). НЕ делать git-операции.

## Обязательные проверки (вывод в отчёт)
```
npx tsc --noEmit     # 0
npm run lint         # 0 errors
npm run build        # успешно
```
Плюс ручная проверка API на dev-портале: поднять `npm run dev -- --port 3011`,
`curl -X POST http://127.0.0.1:3011/api/support/request -H 'Content-Type: application/json' -d '{...}'`
для 3 случаев: валидный запрос → 200 + ticketNumber; пустое описание → 400; отсутствие consent → 400.
Dev-сервер после проверки погасить. Если dev-сервер другого агента на 3010 — не конфликтуй, свой порт 3011.

## Отчёт (кратко, по-русски)
1. Файлы (изменённые/новые). 2. Схема БД и имя миграции. 3. Выводы tsc/lint/build + результаты 3 curl-тестов
(код ответа и тело). 4. Что не сделано и почему.
