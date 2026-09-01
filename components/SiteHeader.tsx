"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/garranty", label: "Гарантийность" },
  { href: "/support", label: "Техподдержка" },
  { href: "/diagnosis", label: "Диагностика" },
  { href: "/centers", label: "Сервисные центры" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Logo className="w-10 h-10" />
            <div className="leading-tight">
              <div className="font-bold text-foreground tracking-wide">AS-RUSSIA</div>
              <div className="text-[11px] text-muted">сервис вычислительной техники</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => {
              const active = pathname?.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                    active ? "bg-accent text-white" : "text-foreground hover:bg-background"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-border text-foreground"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={open}
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {open && (
          <nav className="md:hidden flex flex-col gap-1 mt-3 pb-1">
            {NAV.map((n) => {
              const active = pathname?.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    active ? "bg-accent text-white" : "text-foreground hover:bg-background"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
