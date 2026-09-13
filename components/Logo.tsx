import Image from "next/image";

/**
 * Логотип: брусок AS-RUSSIA. Размер задаётся className вызывающего места
 * (span задаёт контейнер, картинка заполняет его через fill).
 * День (светлая тема): белый фон, синий текст. Ночь (тёмная): синий фон, белый текст.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative block overflow-hidden rounded-lg ${className}`}
      role="img"
      aria-label="AS-RUSSIA — логотип"
    >
      <Image
        src="/logo-day.png"
        alt=""
        fill
        className="object-cover dark:hidden"
      />
      <Image
        src="/logo-night.png"
        alt=""
        fill
        className="object-cover hidden dark:block"
      />
    </span>
  );
}
