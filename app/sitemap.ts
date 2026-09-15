import type { MetadataRoute } from "next";

// Публичные страницы. /ticket — только по номеру обращения (в sitemap нет),
// /admin и /api — закрыты в robots.txt.
const BASE = "https://as-russia.ru";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/diagnosis`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/warranty`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/support`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/centers`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
