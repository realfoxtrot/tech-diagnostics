# SESSION STATUS — для продолжения работы в новой сессии

> Файл-памятка ассистента: текущее состояние проекта tech-diagnostics.
> Подробности структуры — `PROJECT_STRUCTURE.md`, требования — `PRD.md`.
> Обновлён: 2026-09-17, коммит `dfee064`.

## Стек и запуск

- Next.js 16 App Router, TypeScript, Tailwind CSS v4 (`@theme inline`), SQLite (`better-sqlite3`), Drizzle ORM, vitest.
- Один процесс, без внешних сервисов (кроме тайлов карты). UI на русском.
- Прод: LaunchAgent `com.tech-diagnostics.server`, порт 3000, tailnet `http://100.64.0.2:3000`.
  - Рестарт: `launchctl kickstart -k gui/$(id -u)/com.tech-diagnostics.server` (+ `sleep 12`).
- Проверки перед коммитом: `npx tsc --noEmit`, `npx eslint .`, `npm run build`, `npx vitest run` (23/23), headless e2e при необходимости.
- ⚠️ Next.js 16: читать доки в `node_modules/next/dist/docs/` перед кодом (`proxy.ts` вместо middleware и т.п.). Кука админки БЕЗ `secure` (plain HTTP в tailnet).

## Страницы

- `/` — лендинг AS-RUSSIA (h2 «Как работает интерактивная диагностика»; стат-полоса и карточка гарантий теперь «интерактивная диагностика» без слова «бесплатно»).
- `/diagnosis` — интерактивная диагностика (`DiagnosisChat.tsx`).
- `/warranty` — проверка гарантии (`WarrantyChecker.tsx`, чеклист 4 условий). Бывший `/garranty` → 308-редирект в `proxy.ts`.
- `/support` — «Запрос в службу поддержки ASUS»: уведомление + кнопка «Подтверждаю — перейти на сайт ASUS» (`SupportRedirectButton`, переход в той же вкладке на официальную форму ASUS). Формы/сбора ПДн на сайте НЕТ (акценты на персональных данных убраны по просьбе пользователя).
- `/privacy` — переписан: ПДн не собираются, техзаписи без идентификации.
- `/centers` — карта MapLibre + Esri тайлы, 51 СЦ / 44 города.
- `/ticket?ticket=TD-…` — карта диагностики: транскрипт, штрихкод Code128, кнопки «Сервисные центры», «На главную», «Сохранить PDF». Переключателя темы там НЕТ (убран, коммит `76041d8`).
- `/admin`, `/admin/login` — админка (кука `admin_auth` = SHA-256 токен, не пароль; rate limit логина 5/10 мин/IP).

## Недавняя работа (сентябрь 2026, по коммитам)

0. **`/centers`: валидация координат + кнопка МАРШРУТ + шрифт Inter** (`44d39b6`):
   - `lib/coords.ts` — `toCoords(lat, lng)` (Number.isFinite + диапазоны ±90/±180, пустая строка ловится явно — `Number("")===0`); используют И ссылка-адрес на маршруты Яндекса, И пины карты (`page.tsx` + `CentersMap.tsx`); тест `tests/coords.test.ts` (48 тестов всего);
   - кнопка «МАРШРУТ» (`text-[10px]`, `btn-accent`, `rounded-lg`) — непосредственно после строки адреса в каждой карточке (размер текста по просьбе: 12px → 10px, края скруглены, `dfee064`); адрес сам — ссылка с `hover:underline`;
   - карта: при клампе z3 `jumpTo` → `setZoom` (center после fitBounds и так верный); комментарий порог-зума теперь ссылается на minzoom в `public/map-style.json` и на headless-проверку `/tmp/pwtest/map-labels.mjs`;
   - сообщение об ошибке карты: «тайлы Esri недоступны» → «тайлы недоступны» (Esri в проекте нет);
   - шрифт **Inter** на всех страницах: `next/font/google` в `app/layout.tsx` (subsets latin+cyrillic, self-host, в рантайме запросов к Google нет), `--font-inter` на `<html>`, `font-family: var(--font-inter), Arial…` в `globals.css` (body + `--font-sans`);
   - прод рестартовался нечисто: orphan `next-server` (старый PID) держал 3000, LaunchAgent-процесс падал с EADDRINUSE; фикс — `kill <orphan-pid>`, KeepAlive поднял новый.
1. **Количество СЦ/городов из БД с правильным склонением** (`lib/plural.ts`, тест `tests/plural.test.ts`, 44 теста):
   - `getPluralForm(number, form1, form2, form5)` (3 формы: 1/2–4/5+ с исключением 11–19), `centersCount`, `authorizedCentersCount`, `citiesCount` (именит.), `citiesInCount` (предложный: «в 1 городе / в N городах»), `centersInCitiesPhrase`;
   - места: лендинг (hero-полоса, «сеть СЦ», чип «и ещё N городов», статблок «города России»), `/warranty` (карточка «Куда нести», страница стала async + запрос БД), `layout.tsx` — `generateMetadata` с БД-запросом (try/catch: без чисел при недоступности БД);
   - данные берутся по активным СЦ (`isActive=1`), города — уникальные непустые `city`.
2. **Визуальный редактор дерева диагностики в админке** (вкладка «Диагностика», `components/DiagnosisTreeAdmin.tsx`):
   - вопросы: карточки с исходящими связями (каждый ответ → «Вопрос #N» зелёным / «Цепочка «…»» синим / «цель не задана» красным) и входящими («вход: ← …»);
   - цепочки: нумерованная вертикальная последовательность шагов, кнопки ↑/↓/✎/🗑, конец «→ СЦ»;
   - панель «Проблемы структуры»: несколько стартовых, недостижимые вопросы (BFS), тупики-ответы, пустые вопросы/цепочки;
   - API: `GET /api/admin/tree`, CRUD `/api/admin/options` и `/api/admin/steps` (после любой мутации цепочка пересобирается через `normalizeChain`: order=1..n, nextStepId=следующий, последний null; PUT move:-1|1 — перестановка); DELETE вопроса/цепочки чистит ссылки вручную (FK pragma выключен);
   - хелперы `lib/admin-tree.ts` + тесты `tests/admin-tree.test.ts` (35 тестов всего); багфикс: `swapWithNeighbor` переназначает order по позиции;
   - вкладки «Вопросы»/«Рекомендации» удалены (заменены «Диагностикой»); legacy-поле `resolutions.steps` редактором не трогается.

3. `6e05543`, `52e40a3`-fix — лендинг, статблок сети: вместо «24/7 техподдержка» — «Комманда профессионалов / в службе поддержки / тел. 8 800 100-27-87 / Запрос» (телефон и «Запрос» — жирным с новой строки, «Запрос» → /support); подпись «СЦ» → «Авторизованный сервисный центр с командой профессионалов».
4. `5e511fa` — лендинг, карточка гарантий: «…техдокумент - сэкономят ваше время»; `539ff21` — description в metadata: «поможем продиагностировать, проконсультируем или починим, если необходимо».
5. `680a1a3` — `/support` переделан: уведомление о переадресации, форма-обёртка удалена (`SupportWrapper`, `api/support/request`), таблица `support_requests` удалена (миграция `0008`), `/privacy` переписан.
6. `37d9cb3` — названия цепочек рекомендаций стали краткими («Проверка зарядки», «Чистка охлаждения»…), 53 шт.
7. `1eb1e43` — **краткое название у каждого шага**: `resolution_steps.title` (миграция `0009`), 126 шагов. Чат: бейдж «Шаг: <название шага>» (меняется с каждым шагом); карта: «Шаг: …» и «Ответ на «…»: помогло/не помогло» — по названию ШАГА. Транскрипт хранит `stepTitle` (fallback `resolutionTitle` для старых записей); в `diagnosis` JSON сессии тоже есть `stepTitle`.
8. `580d7f7` — `/support`: заголовок «Запрос в службу поддержки ASUS», убраны акценты на ПДн.
9. `27f11ca` — **PDF-экспорт карты диагностики**: `components/TicketPrintButton.tsx` (window.print, без новых зависимостей); автозапуск при `?print=1`; в карточке завершения чата кнопка «Сохранить PDF» → `/ticket?ticket=…&print=1`; `@media print` в `globals.css` (светлая палитра, скрыты шапка/футер/кнопки, блоки шагов не рвутся).
10. `7a099fe`, `c965de5` — лендинг: «диагностика бесплатно» → «интерактивная диагностика» (стат-полоса + карточка гарантий).
11. `76041d8` — с `/ticket` убран переключатель темы.
12. `44a5883` — телефон техподдержки 8 800 100-27-87 (`tel:+78001002787`) в шапке: на desktop (lg+) рядом с ThemeToggle, в мобильном меню — в конце списка.
13. `1aca066` — `/privacy`: новый блок «Контакты» (телефон техподдержки + ссылка на `/support`); обещание «контакт ниже» теперь выполнено.
14. `7884d8e` — карточка «Нужна помощь специалиста» в чате: абзац «Запишите номер обращения…», кнопка «Техническая поддержка» (→ `/support`) в ряду кнопок, ссылка «Позвонить 8 800 100-27-87» под кнопками, «Начать заново» ниже по центру.
15. `958e62c` — лендинг: плитка «Проверка статуса ремонта» (→ `/ticket`) заменена на «Проверка гарантийности» (→ `/warranty`). Внимание: 4-я плитка «Оригинальные запчасти» тоже ведёт на `/warranty` — при необходимости развести.
16. `b7cd9cc` — лендинг, «как работает», шаг 4 «Сервисный центр»: текст про прикрепление карты диагностики к запросу в техподдержку или показ инженеру СЦ.
17. `9549d24` — лендинг, hero: кнопка «Проверить гарантийность» (→ `/warranty`, outline-стиль) слева от «Найти сервисный центр».
18. Фавикон — AS-монограмма из `media/logo-as.png`: `app/icon.png` (512) + `app/apple-icon.png` (180), тёмно-синий фон `#151f32`; старый `favicon.ico` удалён.
19. `/centers` — список СЦ под картой сгруппирован по городам: заголовок города (префикс «г. » убран) + карточки; Москва и Санкт-Петербург — первыми (исключение, `TOP_CITIES`), остальные по алфавиту (ru-locale); город с единственным СЦ на desktop идёт парой с соседним городом-одиночкой (оба столбца заняты, заголовки выравниваются); `app/centers/page.tsx` `groupByCity`/`cityHeading`; СЦ без города → группа «Без города».

## Данные (data/diagnostics.db)

- questions 12, options 64, resolutions 53, resolution_steps 126 (у всех заполнен `title`), service_centers 51, warranty_checks 38, sessions 236.
- Миграции: `0000`–`0009` (0007 — CREATE TABLE support_requests уже был не нужен, 0008 — DROP support_requests, 0009 — ALTER resolution_steps ADD title).
- Seed: `db/seed.ts` — CHAINS с `steps: { title, text }[]`; при правке рекомендаций менять И seed, И живую БД одним маппингом.

## Ключевые решения (актуальны)

- Вендор (`lib/vendor.ts`, POST `https://as-russia.ru/api/check_sn`, заголовок `Auth: Bearer`) отдаёт только факты; вердикт локальный по 4 условиям (ноутбук, РФ, чек ≥ 01.01.2026, производство ≥ 01.07.2025). Токен: `data/vendor_token.txt` (600, вне git, `WARRANTY_VENDOR_TOKEN_FILE`).
- Кука админки = SHA-256 токен (`lib/admin-auth.ts`), constant-time.
- Rate limits: логин 5/10 мин/IP, `/api/warranty/check` 10/10 мин/IP.
- ISO-даты локальные (не `toISOString`) — UTC-сдвиг ломал границу 24 мес.
- PDF — нативная печать браузера, не jsPDF.

## Проверенные контрольные значения

- Зелёные SN (covered, вендор errors:[]): `W1NRKD00171703D`, `W1NRKD001702033`; отказной: `R8N0CV074276324`.
- Тест-тикет с 3 шагами (для проверки карты/PDF): `TD-20260914-5415` (Проверка подключения → Жёсткий сброс → Включение без АКБ).

## Playwright-скрипты (/tmp/pwtest/, Chrome путь внутри)

- `steps-check.mjs`, `chat-steps.mjs` — бейджи шагов в карте/чате.
- `print-check.mjs` — кнопка PDF, авто-печать, генерация PDF.
- `support-check.mjs` — уведомление переадресации, переход на asus.com (route-перехват).
- Chrome: `/Users/mac3/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`.

## Известные мелочи / кандидаты на будущее

- Chrome показывает «Не защищено» слева от адреса: сайт на plain HTTP (tailnet `http://100.64.0.2:3000`), Chrome исключение только для `localhost`. Осознанно (без TLS, ПДн не собираются, tailnet шифрует сам). Варианты убрать: (1) `tailscale cert` под MagicDNS-имя + TLS-прокси (Caddy/nginx) перед `next start` — рекомендуется для tailnet-доступа; (2) Let's Encrypt при публичном домене; (3) оставить. При переходе на HTTPS — кука `admin_auth` сделать `secure`.
- `/privacy`: блок контактов добавлен (`1aca066`); при смене телефона править `components/SiteHeader.tsx` и `app/privacy/page.tsx`.
- Логотипы: media/as-russia-logos.png разрезан на public/logo-day.png (синий рисунок, светлые фоны) и public/logo-night.png (белый, тёмные фоны), прозрачный фон; Wordmark (шапка auto/футер night) и Logo без бруска, object-contain, h-7/h-8.
- Карта — same-origin: все запросы (pbf/глифы/спрайты/Natural Earth) через прокси-роут `/api/map/[...path]` (tiles в tilejson — абсолютные от Host-заголовка: сервер на 0.0.0.0; конкатенация, не new URL — иначе %7Bz%7D). Подпись «Республика Крым»/«Автономная…»/«Крым» исключена фильтром label_state (["!", ["in", …, ["literal", …]]] — оператора "!in" нет). (LRU-кэш 400 записей + Cache-Control 86400; tilejson `/api/map/planet` переписывает tiles[] на прокси — срез планеты отслеживается автоматически). Внешних запросов 0. `public/map-style.json`: glyphs/sprite/tiles → `/api/map/...`.
- КРИТИЧНО для карты: в Next-проде worker MapLibre v5 создаётся с битым URL (умирает молча) → векторные тайлы/подписи/load не работают. Фикс: `maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs")`, файлы `public/maplibre/{worker,shared}.mjs` (копия из node_modules; при обновлении maplibre перекопировать). `fitBounds` — только в `m.on("load")` (до load ломает тайлы). Wheel-зум ускорен: `scrollZoom.setWheelZoomRate(1/150)`. minzoom подписей: city 2, town 4, state 3. Headless-проверки: `/tmp/pwtest/{pbf-check2,zoom-ocr,pins-popup-check}.mjs` + Vision OCR.
- Карта /centers — векторный стиль OpenFreeMap (`public/map-style.json`, копия liberty с `text-field` = `coalesce(name:ru, name)` — русские топонимы; исключена подпись «Автономная Республика Крым»; атрибуция OSM/OpenFreeMap). Тёмная тема — CSS-инверсия канваса (`globals.css`). Wikimedia-тайлы НЕ подходят: policy запрещает внешнее использование (403). CARTO — водяной знак без ключа. Проверка: headless-скриншоты + macOS Vision OCR (`/tmp/mapcheck/ocr`) — укр. топонимов нет.
- Popup карты (/centers): свой Popup у каждого маркера (общий переиспользовался последним маркером — все пины показывали один СЦ); фон/текст из токенов темы (`globals.css`, селекторы с родителем `.maplibregl-popup` — maplibre-gl.css грузится после globals.css и без этого перебивает); проверено headless (`/tmp/pwtest/map-popup-check.mjs`, контраст dark 13.91:1, light 15.72:1).
- Rate-limit счётчики warranty — unbounded Map (принято как minor).
- Статистика диагностики в админке не разрасталась — таб «Гарантийность» актуален.

## Что делать в новой сессии

1. Прочитать `PROJECT_STRUCTURE.md` и `PRD.md` (актуальны).
2. Брать задачи от пользователя; в конце каждой — tsc/eslint/build/vitest и, если UI, headless-проверка; коммит с осмысленным сообщением; обновлять `PROJECT_STRUCTURE.md`/`PRD.md` при изменении структуры.
3. После коммитов рестартить прод командой выше и проверять `curl http://localhost:3000/...` и/или tailnet.
4. Обновлять этот файл (`SESSION_STATUS.md`) в конце значимых задач.
