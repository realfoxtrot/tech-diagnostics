import Link from "next/link";
import Logo from "./Logo";

const NAV = [
  { href: "/garranty", label: "Проверка гарантийности" },
  { href: "/support", label: "Запрос в техподдержку" },
  { href: "/diagnosis", label: "Диагностика (траблшутинг)" },
  { href: "/centers", label: "Сервисные центры" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-card border-t border-border py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo className="w-9 h-9" />
            <div className="leading-tight">
              <div className="font-bold text-foreground tracking-wide">AS-RUSSIA</div>
              <div className="text-xs text-muted">Авторизованный сервис вычислительной техники</div>
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-muted hover:text-accent transition whitespace-nowrap">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 pt-4 border-t border-border text-xs text-muted">
          AS-RUSSIA · сеть авторизованных сервисных центров · диагностика и ремонт ноутбуков
        </div>
      </div>
    </footer>
  );
}
