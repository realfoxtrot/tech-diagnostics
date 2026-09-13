import Link from "next/link";
import Wordmark from "./Wordmark";

const NAV = [
  { href: "/garranty", label: "Проверка гарантийности" },
  { href: "/support", label: "Запрос в техподдержку" },
  { href: "/diagnosis", label: "Диагностика (траблшутинг)" },
  { href: "/centers", label: "Сервисные центры" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-footer-bg py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Link href="/" aria-label="AS-RUSSIA — на главную">
            <Wordmark className="h-6 md:h-7 text-accent-2" />
          </Link>
          <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-white/72 hover:text-white transition whitespace-nowrap">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 pt-4 border-t border-white/15 text-xs text-white/72">
          AS-RUSSIA · сеть авторизованных сервисных центров · диагностика и ремонт ноутбуков
        </div>
      </div>
    </footer>
  );
}
