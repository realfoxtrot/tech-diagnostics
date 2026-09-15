import Image from "next/image";

/**
 * Вордмарк AS-RUSSIA: прозрачный PNG из media/as-russia-logos.png
 * (верхняя половина — дневная версия с синим рисунком, нижняя — ночная с белым).
 * Фона в файле нет, поэтому никакого «бруска»: рисунок ложится прямо на фон сайта.
 * variant="auto" — день/ночь по теме. variant="night" — всегда ночная (тёмный футер).
 */
const DAY = { src: "/logo-day.png", w: 1869, h: 316 };
const NIGHT = { src: "/logo-night.png", w: 1875, h: 359 };

export default function Wordmark({
  className = "",
  variant = "auto",
}: {
  className?: string;
  variant?: "auto" | "night";
}) {
  const night = variant === "night";
  return (
    <span className={`block ${className}`} role="img" aria-label="AS-RUSSIA">
      <Image
        src={DAY.src}
        alt=""
        width={DAY.w}
        height={DAY.h}
        className={`h-full w-auto ${night ? "hidden" : "dark:hidden"}`}
      />
      <Image
        src={NIGHT.src}
        alt=""
        width={NIGHT.w}
        height={NIGHT.h}
        className={`h-full w-auto ${night ? "" : "hidden dark:block"}`}
      />
    </span>
  );
}
