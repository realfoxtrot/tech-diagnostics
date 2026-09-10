/**
 * Логотип AS-RUSSIA: белый единорог (передняя часть головы),
 * «вылетающий» на зрителя из звёздного неба.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} role="img" aria-label="AS-RUSSIA — белый единорог из звёздного неба">
      <defs>
        <linearGradient id="as-horn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="100%" stopColor="#eef2ff" />
        </linearGradient>
      </defs>
      {/* Рог */}
      <polygon points="64,4 57,36 71,36" fill="url(#as-horn)" stroke="#c7d2fe" strokeWidth="1" />
      {/* Уши */}
      <ellipse cx="41" cy="27" rx="8" ry="13" transform="rotate(-22 41 27)" fill="#ffffff" stroke="#c7d2fe" strokeWidth="1" />
      <ellipse cx="87" cy="27" rx="8" ry="13" transform="rotate(22 87 27)" fill="#ffffff" stroke="#c7d2fe" strokeWidth="1" />
      <ellipse cx="41" cy="28" rx="4" ry="8" transform="rotate(-22 41 28)" fill="#e0e7ff" />
      <ellipse cx="87" cy="28" rx="4" ry="8" transform="rotate(22 87 28)" fill="#e0e7ff" />
      {/* Голова */}
      <path
        d="M64 30 C45 30 34 47 36 67 C38 88 50 101 64 101 C78 101 90 88 92 67 C94 47 83 30 64 30 Z"
        fill="#ffffff"
        stroke="#c7d2fe"
        strokeWidth="1.5"
      />
      {/* Глаза */}
      <circle cx="50" cy="63" r="4" fill="#312e81" />
      <circle cx="78" cy="63" r="4" fill="#312e81" />
      <circle cx="51.5" cy="61.5" r="1.3" fill="#ffffff" />
      <circle cx="79.5" cy="61.5" r="1.3" fill="#ffffff" />
      {/* Морда */}
      <ellipse cx="64" cy="84" rx="13" ry="10" fill="#eef2ff" />
      <ellipse cx="59" cy="84" rx="2" ry="2.6" fill="#94a3b8" />
      <ellipse cx="69" cy="84" rx="2" ry="2.6" fill="#94a3b8" />
      {/* Звёзды-искры */}
      <g fill="#a5b4fc">
        <path d="M20 46 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6 Z" opacity="0.9" />
        <path d="M108 40 l1.3 2.7 2.7 1.3 -2.7 1.3 -1.3 2.7 -1.3 -2.7 -2.7 -1.3 2.7 -1.3 Z" opacity="0.7" />
        <path d="M24 96 l1.3 2.7 2.7 1.3 -2.7 1.3 -1.3 2.7 -1.3 -2.7 -2.7 -1.3 2.7 -1.3 Z" opacity="0.6" />
        <path d="M106 92 l1.1 2.3 2.3 1.1 -2.3 1.1 -1.1 2.3 -1.1 -2.3 -2.3 -1.1 2.3 -1.1 Z" opacity="0.8" />
      </g>
    </svg>
  );
}
