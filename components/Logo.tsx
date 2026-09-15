import Image from "next/image";

/**
 * Логотип AS-RUSSIA: прозрачные PNG (media/as-russia-logos.png, разрезан на два).
 * День: синий рисунок на светлом фоне. Ночь: белый рисунок на тёмном.
 * Размер задаётся className вызывающего места (высота, ширина — авто по пропорциям).
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`block ${className}`} role="img" aria-label="AS-RUSSIA — логотип">
      <Image
        src="/logo-day.png"
        alt=""
        width={1869}
        height={316}
        className="h-full w-auto dark:hidden"
      />
      <Image
        src="/logo-night.png"
        alt=""
        width={1875}
        height={359}
        className="hidden h-full w-auto dark:block"
      />
    </span>
  );
}
