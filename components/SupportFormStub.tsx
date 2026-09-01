"use client";

/** Заглушка формы запроса в техподдержку (пока поле неактивно). */
export default function SupportFormStub() {
  const cls =
    "w-full px-3 py-2 border border-border rounded-xl bg-background text-muted opacity-60";
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <label className="block">
        <span className="block text-sm font-medium text-foreground mb-1">Ваше имя</span>
        <input disabled placeholder="Иван" className={cls} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-foreground mb-1">Телефон или email</span>
        <input disabled placeholder="+7 (999) 000-00-00" className={cls} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-foreground mb-1">Опишите проблему</span>
        <textarea disabled rows={4} placeholder="Ноутбук не включается после обновления…" className={cls} />
      </label>
      <button
        type="submit"
        disabled
        className="w-full px-4 py-2.5 rounded-xl bg-accent text-white opacity-50 cursor-not-allowed"
      >
        Отправить запрос
      </button>
    </form>
  );
}
