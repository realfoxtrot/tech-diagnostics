"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import Wordmark from "./Wordmark";

const NAV = [
  { href: "/warranty", label: "ГАРАНТИЯ" },
  { href: "/support", label: "ПОДДЕРЖКА" },
  { href: "/diagnosis", label: "ДИАГНОСТИКА" },
  { href: "/centers", label: "СЕРВИСНЫЕ ЦЕНТРЫ" },
];

const NAV_CLS =
  "px-3 py-2 text-[13px] uppercase tracking-[0.03em] font-semibold transition";

const PHONE = "8 800 100-27-87";
const PHONE_HREF = "tel:+78001002787";

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="AS-RUSSIA — на главную">
          <Wordmark className="h-7 md:h-8" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`${NAV_CLS} ${
                isActive(n.href) ? "text-accent" : "text-foreground hover:text-accent"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={PHONE_HREF}
            className="hidden lg:block whitespace-nowrap px-3 py-2 text-sm font-bold text-accent hover:text-accent-hover transition"
            aria-label={`Техподдержка, телефон ${PHONE}`}
          >
            {PHONE}
          </a>
          <ThemeToggle />
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-border text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
          >
            {open ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden flex flex-col gap-1 px-4 pb-3 border-t border-border">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`${NAV_CLS} ${
                isActive(n.href) ? "text-accent" : "text-foreground hover:text-accent"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <a
            href={PHONE_HREF}
            onClick={() => setOpen(false)}
            className="mt-2 px-3 py-2 text-sm font-bold text-accent transition"
            aria-label={`Техподдержка, телефон ${PHONE}`}
          >
            {PHONE}
          </a>
        </nav>
      )}
    </header>
  );
}
