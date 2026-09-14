import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { db } from "@/db";
import { centersInCitiesPhrase } from "@/lib/plural";
import "./globals.css";

// Количество СЦ/городов в description — из БД, с правильным склонением.
// При недоступности БД — без чисел, чтобы не ломать рендер всех страниц.
export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    title: "AS-RUSSIA — диагностика и ремонт ноутбуков",
  };
  try {
    const centers = await db.query.serviceCenters.findMany({
      where: (sc, { eq }) => eq(sc.isActive, 1),
    });
    const cities = new Set(centers.map((c) => c.city).filter(Boolean)).size;
    return {
      ...base,
      description: `AS-RUSSIA: проверим гарантийность, найдём причину неисправности, починим — или подскажем, как починить самому бесплатно. ${centersInCitiesPhrase(centers.length, cities)} по России.`,
    };
  } catch {
    return {
      ...base,
      description:
        "AS-RUSSIA: проверим гарантийность, найдём причину неисправности, починим — или подскажем, как починить самому бесплатно. Сеть сервисных центров по России.",
    };
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

// Тема: светлая по умолчанию, тёмная — из localStorage или системной настройки.
// Скрипт до RSC-гидратации, чтобы не мигало (FOUC).
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <div className="flex-1 flex flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
