import type { MetadataRoute } from "next";

// Админка и API — закрыты от индексации. Остальное — публичная витрина.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: "https://as-russia.ru/sitemap.xml",
  };
}
