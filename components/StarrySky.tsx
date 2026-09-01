import { useMemo } from "react";

/**
 * Звёздное небо (CSS-only, без canvas). Только для тёмного фона (hero, финальный CTA).
 * Позиции — детерминированный хеш индекса: SSR и клиент совпадают, без state.
 */
export default function StarrySky({ density = 70, className = "" }: { density?: number; className?: string }) {
  const stars = useMemo(() => {
    return Array.from({ length: density }, (_, i) => {
      const h = (k: number) => ((i + 7) * (k * 48271)) % 2147483647;
      const x = (h(1) % 1000) / 10; // 0..100
      const y = (h(2) % 1000) / 10;
      const size = 1 + (h(3) % 20) / 10; // 1..3
      const opacity = 0.3 + (h(4) % 70) / 100; // 0.3..1
      const delay = (h(5) % 40) / 10; // 0..4s
      const duration = 2.5 + (h(6) % 30) / 10; // 2.5..5.5s
      return { id: i, x, y, size, opacity, delay, duration };
    });
  }, [density]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {stars.map((st) => (
        <span
          key={st.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.size,
            height: st.size,
            opacity: st.opacity,
            animationDelay: `${st.delay}s`,
            animationDuration: `${st.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
