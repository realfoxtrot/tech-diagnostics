import Image from "next/image";

/**
 * Вордмарк AS-RUSSIA: брусок из эталонного макета.
 * variant="auto" — день/ночь по теме (white bg / blue bg).
 * variant="night" — всегда ночная версия (для тёмно-синего футера).
 */
export default function Wordmark({
  className = "",
  variant = "auto",
}: {
  className?: string;
  variant?: "auto" | "night";
}) {
  const night = variant === "night";
  return (
    <span
      className={`relative block aspect-[1280/213] ${className}`}
      role="img"
      aria-label="AS-RUSSIA"
    >
      <Image
        src="/logo-day.png"
        alt=""
        fill
        className={`object-cover ${night ? "hidden" : "dark:hidden"}`}
      />
      <Image
        src="/logo-night.png"
        alt=""
        fill
        className={`object-cover ${night ? "" : "hidden dark:block"}`}
      />
    </span>
  );
}
