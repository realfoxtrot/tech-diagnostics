import Link from "next/link";

const P = "block text-muted text-sm leading-relaxed";

export default function PrivacyPage() {
  return (
    <main className="flex-1 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          Политика конфиденциальности
        </h1>
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5">
          <p className={P}>
            Настоящая политика описывает, как AS-RUSSIA обрабатывает персональные
            данные пользователей сайта as-russia.ru. Оператор — AS-RUSSIA, сеть
            авторизованных сервисных центров.
          </p>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Какие данные мы собираем</h2>
            <p className={P}>
              Через форму «Обращение в техподдержку» вы добровольно предоставляете:
              ФИО или имя, email, телефон (необязательно), город, тип продукта,
              серийный номер и дату покупки (необязательно), описание проблемы.
              Данные карт диагностики (/diagnosis) и проверок гарантийности
              не включают персональные данные, если вы их не указали.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Зачем мы их используем</h2>
            <p className={P}>
              Данные обращения используются для регистрации обращения в службу
              технической поддержки ASUS и подготовки текста обращения, который
              вы вставляете в официальную форму ASUS. Мы не передаём ваши данные
              третьим лицам, кроме службы поддержки ASUS, только в объёме,
              необходимом для рассмотрения обращения.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Срок хранения и удаление</h2>
            <p className={P}>
              Обращения хранятся не более 180 дней с момента создания.
              По истечении срока записи удаляются автоматически. Удаление можно
              запросить досрочно — см. контакты ниже.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Правовые основания</h2>
            <p className={P}>
              Обработка ведётся на основании вашего согласия, даваемого
              отметкой чекбокса при отправке формы (ст. 9, 10 Федерального
              закона № 152-ФЗ «О персональных данных»). Согласие можно отозвать
              в любой момент, направив запрос на удаление.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Ваши права</h2>
            <p className={P}>
              Вы вправе запросить доступ к своим данным, их уточнение или
              удаление, а также отозвать согласие на обработку. Запрос
              направьте через форму{" "}
              <Link href="/support" className="text-accent hover:text-accent-hover underline">
                обращения в техподдержку
              </Link>{" "}
              с темой «удаление персональных данных».
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Cookies и аналитика</h2>
            <p className={P}>
              Сайт использует только техническое хранилище (localStorage) для
              запоминания выбранной темы оформления. Трекинг-платформ и
              рекламных cookies не используется.
            </p>
          </div>

          <p className={P}>
            Вопросы по обработке персональных данных: форма{" "}
            <Link href="/support" className="text-accent hover:text-accent-hover underline">
              обращения в техподдержку
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
