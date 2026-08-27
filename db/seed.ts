/**
 * Seed: начальное дерево диагностики + сервисные центры.
 * Запуск: npx tsx db/seed.ts
 *
 * Структура дерева:
 *   Q1 (старт) → категории
 *   Каждая категория → вопрос → опции → {следующий вопрос | решение}
 *   Решение (resolution) = траблшутинг: рекомендация + шаги + needsFollowUp
 */
import { sql } from "drizzle-orm";
import { db, schema } from "./index";

async function main() {
  console.log("Seeding…");

  // ── Решения (траблшутинг) ─────────────────────────────────────
  const resolutionIds = (
    await db
      .insert(schema.resolutions)
      .values([
        { title: "Ноутбук не заряжается", description: "", steps: [], needsFollowUp: 1 },
        { title: "Батарея быстро разряжается", description: "", steps: [], needsFollowUp: 1 },
        { title: "Нет изображения на экране", description: "", steps: [], needsFollowUp: 1 },
        { title: "Мерцание / полосы на экране", description: "", steps: [], needsFollowUp: 1 },
        { title: "Ноутбук не включается / не грузится", description: "", steps: [], needsFollowUp: 1 },
        { title: "Медленная загрузка Windows", description: "", steps: [], needsFollowUp: 1 },
        { title: "Синий экран (BSOD)", description: "", steps: [], needsFollowUp: 1 },
        { title: "Нет доступа в интернет", description: "", steps: [], needsFollowUp: 1 },
        { title: "Ноутбук тормозит", description: "", steps: [], needsFollowUp: 1 },
        { title: "Ноутбук перегревается", description: "", steps: [], needsFollowUp: 1 },
        { title: "Нет звука", description: "", steps: [], needsFollowUp: 1 },
      ])
      .returning({ id: schema.resolutions.id })
  ).map((r) => r.id);

  // наполнение контентом
  const resolutionContent: Record<number, { description: string; steps: string[] }> = {
    [resolutionIds[0]]: {
      description: "Проверим программные причины и правильность подключения. Если после шагов заряд не появился — вероятна аппаратная проблема (адаптер, разъём, батарея).",
      steps: ["Проверьте, что кабель плотно вставлен в разъём питания и в розетку.", "Попробуйте другую розетку / удлинитель.", "Проверьте индикатор на адаптере (светится ли).", "Windows: откройте Диспетчер задач → Батарея — виден ли заряд?", "Выполните жёсткий сброс: выключите, отключите зарядку, зажмите кнопку питания 30 сек, подключите и включите.", "Проверьте состояние батареи: в командной строке (админ) — `powercfg /batteryreport`."],
    },
    [resolutionIds[1]]: {
      description: "Оптимизируем энергопотребление программно. Если не поможет — вероятно износ батареи.",
      steps: ["Откройте Параметры → Система → Питание и батарея → выберите режим энергосбережения.", "Проверьте фоновые приложения: Диспетчер задач → сортировка по загрузке ЦП.", "Уменьшите яркость экрана (обычно F-клавиша).", "Отключите неиспользуемые устройства (Bluetooth, подсветку).", "Проверьте отчёт: `powercfg /batteryreport` — % износа батареи."],
    },
    [resolutionIds[2]]: {
      description: "Проверим, работает ли ноутбук (загружается) и в чём причина отсутствия картинки.",
      steps: ["Убедитесь, что ноутбук включён (индикатор питания, шум кулера).", "Попробуйте подключить внешний монитор (HDMI/DP). Если картинка есть — проблема с экраном/шлейфом.", "Перезагрузите ноутбук (долгое нажатие кнопки питания 10 сек, затем включите).", "Проверьте яркость: многие ноутбуки гасят экран клавишей (Fn+F5 и т.п.)."],
    },
    [resolutionIds[3]]: {
      description: "Сначала исключаем программную причину (драйвер).",
      steps: ["Перезагрузите ноутбук — исчезло ли мерцание?", "Обновите/переустановите драйвер видеокарты (Диспетчер устройств → Видеоадаптеры).", "Проверьте частоту обновления: Параметры → Система → Экран → Дополнительные параметры дисплея → 60 Гц.", "Если мерцает и в BIOS (при загрузке) — аппаратная проблема (матрица/шлейф)."],
    },
    [resolutionIds[4]]: {
      description: "Пошагово исключаем программные причины отказа загрузки.",
      steps: ["Жёсткий сброс: выключите, отключите питание, зажмите питание 30 сек.", "Попробуйте запуск без батареи (если съёмная): только от сети.", "Загрузитесь в безопасном режиме: при включении несколько раз нажмите F8 / Shift+Перезагрузка.", "Запустите восстановление: Параметры → Обновление и безопасность → Восстановление.", "Командная строка (в среде восстановления): `sfc /scannow`, `chkdsk /f`."],
    },
    [resolutionIds[5]]: {
      description: "Оптимизируем автозагрузку и службы.",
      steps: ["Диспетчер задач → Автозагрузка → отключите всё лишнее.", "Выполните чистку диска: `cleanmgr`.", "Отключите визуальные эффекты: Параметры → Система → О системе → Дополнительные параметры.", "Проверьте свободное место на системном диске (нужно > 15% объема)."],
    },
    [resolutionIds[6]]: {
      description: "Соберём информацию о причине синего экрана.",
      steps: ["Запишите код ошибки с экрана (например, `CRITICAL_PROCESS_DIED`, `MEMORY_MANAGEMENT`).", "Проверьте память: `mdsched.exe` (Средство диагностики памяти Windows).", "Проверьте диск: командная строка (админ) — `chkdsk /f C:`.", "Обновите драйверы (особенно видео и чипсет).", "Если BSOD при каждой загрузке — загрузитесь в безопасном режиме и удалите последние установленные программы/драйверы."],
    },
    [resolutionIds[7]]: {
      description: "Диагностируем сетевое соединение.",
      steps: ["Проверьте Wi-Fi: включён ли (клавиша/переключатель, Fn-комбинация).", "Параметры → Сеть и Интернет → Средство устранения неполадок сети.", "Перезагрузите роутер (отключить на 30 сек).", "Командная строка (админ): `ipconfig /release`, `ipconfig /renew`, `ipconfig /flushdns`.", "Проверьте подключение к другой сети (например, телефон как точка доступа)."],
    },
    [resolutionIds[8]]: {
      description: "Найдём источник нагрузки.",
      steps: ["Диспетчер задач → Производительность: что нагружено (ЦП/память/диск)?", "Сортировка процессов по нагрузке — закройте тяжёлые/лишние.", "Проверьте автозагрузку — отключите лишнее.", "Проверьте, что системный диск не заполнен (нужно > 15% свободного).", "Запустите проверку на вирусы (Защитник Windows — полное сканирование)."],
    },
    [resolutionIds[9]]: {
      description: "Проверим программные причины перегрева.",
      steps: ["Проверьте, что вентиляционные отверстия не забиты (пыль) и не перекрыты.", "Диспетчер задач — нет ли процесса, нагружающего ЦП на 100%.", "Проверьте на вирусы (майнеры нагружают ЦП/GPU).", "Обновите драйверы и прошивку BIOS.", "Если греется всегда и выключается — вероятно нужна чистка/замена термопасты (аппаратная)."],
    },
    [resolutionIds[10]]: {
      description: "Проверим аудиоустройства и драйвер.",
      steps: ["Проверьте, что звук не отключён и не на нуле (иконка динамика).", "Проверьте выходное устройство: Параметры → Система → Звук.", "Обновите/переустановите драйвер звука (Диспетчер устройств).", "Запустите Средство устранения неполадок со звуком."],
    },
  };
  for (const [id, c] of Object.entries(resolutionContent)) {
    await db.update(schema.resolutions).set(c).where(sql`id = ${Number(id)}`);
  }

  // ── Вопросы ───────────────────────────────────────────────────
  const q1 = (
    await db.insert(schema.questions).values({
      text: "Какая проблема с вашим ноутбуком?",
      isFirst: 1,
      order: 1,
    }).returning({ id: schema.questions.id })
  )[0].id;

  const cats: { text: string; order: number }[] = [
    { text: "Не заряжается / проблемы с питанием", order: 1 },
    { text: "Проблемы с экраном", order: 2 },
    { text: "Не включается / не грузится", order: 3 },
    { text: "Тормозит / медленно работает", order: 4 },
    { text: "Проблемы с интернетом / сетью", order: 5 },
    { text: "Перегревается / шумит", order: 6 },
    { text: "Нет звука", order: 7 },
    { text: "Синий экран / ошибки Windows", order: 8 },
    { text: "Другое", order: 9 },
  ];

  // Категории: отдельные вопросы-разветвители (уточнение)
  const catQ: Record<string, number> = {};
  for (const c of cats.slice(0, 8)) {
    const id = (
      await db.insert(schema.questions).values({
        text: c.text,
        category: c.text,
        order: c.order,
      }).returning({ id: schema.questions.id })
    )[0].id;
    catQ[c.text] = id;
  }
  const qOther = (
    await db.insert(schema.questions).values({
      text: "Опишите проблему своими словами",
      category: "other",
      order: 9,
    }).returning({ id: schema.questions.id })
  )[0].id;

  // Стартовые опции
  await db.insert(schema.questionOptions).values([
    { questionId: q1, label: "Не заряжается / проблемы с питанием", nextQuestionId: catQ["Не заряжается / проблемы с питанием"], order: 1 },
    { questionId: q1, label: "Проблемы с экраном", nextQuestionId: catQ["Проблемы с экраном"], order: 2 },
    { questionId: q1, label: "Не включается / не грузится", nextQuestionId: catQ["Не включается / не грузится"], order: 3 },
    { questionId: q1, label: "Тормозит / медленно работает", nextQuestionId: catQ["Тормозит / медленно работает"], order: 4 },
    { questionId: q1, label: "Проблемы с интернетом / сетью", nextQuestionId: catQ["Проблемы с интернетом / сетью"], order: 5 },
    { questionId: q1, label: "Перегревается / шумит", nextQuestionId: catQ["Перегревается / шумит"], order: 6 },
    { questionId: q1, label: "Нет звука", nextQuestionId: catQ["Нет звука"], order: 7 },
    { questionId: q1, label: "Синий экран / ошибки Windows", nextQuestionId: catQ["Синий экран / ошибки Windows"], order: 8 },
    { questionId: q1, label: "Другое", nextQuestionId: qOther, order: 9 },
  ]);

  // ── Опции категорий → решения ────────────────────────────────
  // Питание
  await db.insert(schema.questionOptions).values([
    { questionId: catQ["Не заряжается / проблемы с питанием"], label: "Ноутбук вообще не заряжается", resolutionId: resolutionIds[0], order: 1 },
    { questionId: catQ["Не заряжается / проблемы с питанием"], label: "Батарея быстро разряжается", resolutionId: resolutionIds[1], order: 2 },
  ]);
  // Экран
  await db.insert(schema.questionOptions).values([
    { questionId: catQ["Проблемы с экраном"], label: "Экран чёрный / нет изображения", resolutionId: resolutionIds[2], order: 1 },
    { questionId: catQ["Проблемы с экраном"], label: "Мерцает / полосы / артефакты", resolutionId: resolutionIds[3], order: 2 },
  ]);
  // Загрузка
  await db.insert(schema.questionOptions).values([
    { questionId: catQ["Не включается / не грузится"], label: "Вообще не включается", resolutionId: resolutionIds[4], order: 1 },
    { questionId: catQ["Не включается / не грузится"], label: "Включается, но Windows не загружается", resolutionId: resolutionIds[4], order: 2 },
    { questionId: catQ["Не включается / не грузится"], label: "Загрузка очень медленная", resolutionId: resolutionIds[5], order: 3 },
  ]);
  // Производительность
  await db.insert(schema.questionOptions).values([
    { questionId: catQ["Тормозит / медленно работает"], label: "Тормозит в целом", resolutionId: resolutionIds[8], order: 1 },
    { questionId: catQ["Тормозит / медленно работает"], label: "Медленно загружается Windows", resolutionId: resolutionIds[5], order: 2 },
  ]);
  // Сеть
  await db.insert(schema.questionOptions).values([
    { questionId: catQ["Проблемы с интернетом / сетью"], label: "Нет доступа в интернет", resolutionId: resolutionIds[7], order: 1 },
  ]);
  // Перегрев
  await db.insert(schema.questionOptions).values([
    { questionId: catQ["Перегревается / шумит"], label: "Нагревается и шумит", resolutionId: resolutionIds[9], order: 1 },
  ]);
  // Звук
  await db.insert(schema.questionOptions).values([
    { questionId: catQ["Нет звука"], label: "Звук пропал полностью", resolutionId: resolutionIds[10], order: 1 },
  ]);
  // BSOD
  await db.insert(schema.questionOptions).values([
    { questionId: catQ["Синий экран / ошибки Windows"], label: "Появляется синий экран", resolutionId: resolutionIds[6], order: 1 },
  ]);

  // ── Сервисные центры (примеры) ────────────────────────────────
  await db.insert(schema.serviceCenters).values([
    {
      name: "СЦ «РемонтНоут» (пример)",
      address: "Москва, ул. Тверская, 12",
      phone: "+7 (495) 000-00-01",
      email: "info@remontnout.example",
      website: "https://example.com",
      lat: "55.7558",
      lng: "37.6176",
    },
    {
      name: "СЦ «НоутСервис» (пример)",
      address: "Москва, Ленинский пр-т, 40",
      phone: "+7 (495) 000-00-02",
      email: "info@noutservice.example",
      lat: "55.7076",
      lng: "37.5833",
    },
    {
      name: "СЦ «ТехЦентр» (пример)",
      address: "Москва, ул. Новый Арбат, 24",
      phone: "+7 (495) 000-00-03",
      lat: "55.7515",
      lng: "37.5905",
    },
  ]);

  console.log("Seed done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
