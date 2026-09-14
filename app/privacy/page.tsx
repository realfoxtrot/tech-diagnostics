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
              Сайт AS-RUSSIA не собирает персональные данные: нет форм с именем,
              email, телефоном или адресом. Функции сайта — карта диагностики
              (/diagnosis), проверка гарантийности (/warranty) и справочные
              страницы — работают без указания личности. Обращение в службу
              технической поддержки оформляется напрямую на официальном сайте
              ASUS: страница «Техподдержка» на нашем сайте — это уведомление о
              переадресации, а данные, указанные на сайте ASUS, обрабатывает ASUS.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Технические записи</h2>
            <p className={P}>
              Для работы диагностики и проверки гарантийности сохраняются
              технические записи без персональных данных: ответы на вопросы
              диагностики, серийный номер устройства, дата покупки и результат
              проверки. Они не связаны с именем, контактами или учётной записью.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Срок хранения и удаление</h2>
            <p className={P}>
              Технические записи хранятся ограниченный срок и не содержат данных,
              позволяющих идентифицировать личность. Запросить удаление записей
              (например, по серийному номеру устройства) можно через контакт ниже.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Переход на сайт ASUS</h2>
            <p className={P}>
              При переходе на официальную форму техподдержки ASUS обработку
              указанных там персональных данных осуществляет ASUS в соответствии
              с собственной политикой конфиденциальности. Наш сайт в этой
              обработке не участвует и копии данных не получает.
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

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Контакты</h2>
            <p className={P}>
              Вопросы по обработке технических записей и удалению данных:
              телефон службы технической поддержки{" "}
              <a
                href="tel:+78001002787"
                className="text-accent hover:text-accent-hover font-semibold whitespace-nowrap"
              >
                8 800 100-27-87
              </a>{" "}
              или страница{" "}
              <Link href="/support" className="text-accent hover:text-accent-hover underline">
                техподдержки ASUS
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
