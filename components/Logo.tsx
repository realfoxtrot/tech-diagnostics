import Image from "next/image";

/**
 * Логотип: Pegasus. Размер задаётся className вызывающего места
 * (span задаёт контейнер, картинка заполняет его через fill).
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative block overflow-hidden rounded-lg ${className}`}
      role="img"
      aria-label="AS-RUSSIA — логотип"
    >
      <Image
        src="/logo.jpeg"
        alt=""
        fill
        className="object-cover"
      />
    </span>
  );
}
