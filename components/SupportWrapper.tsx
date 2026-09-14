"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ASUS_SUPPORT_FORM_URL,
  DEFAULT_PRODUCT_TYPE,
  DESCRIPTION_MIN,
  SN_MAX,
  SN_MIN,
  SUPPORT_PRODUCT_TYPES,
} from "@/lib/support";

// ─── Inline SVG line-иконки (stroke="currentColor", без эмодзи) ────
type IconProps = { className?: string };

function IconAlert({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function IconCopy({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconExternal({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6" />
      <path d="M20 4L10 14" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

function IconShield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v5.5c0 4.3-2.9 7.3-7 8.5-4.1-1.2-7-4.2-7-8.5V6l7-3z" />
      <path d="M9.5 12l1.8 1.8 3.4-3.6" />
    </svg>
  );
}

const INPUT_CLS =
  "w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent";

const LABEL_CLS = "block text-sm font-medium text-foreground mb-1";

type Result = { ticketNumber: string; messageText: string };

export default function SupportWrapper() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [productType, setProductType] = useState<string>(DEFAULT_PRODUCT_TYPE);
  const [serial, setSerial] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const messageRef = useRef<HTMLTextAreaElement>(null);
  // до гидратации сабмит формы вызывает default-navigation — блокируем
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- флаг готовности после гидратации
  useEffect(() => setMounted(true), []);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrors([]);
    try {
      const res = await fetch("/api/support/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          product_type: productType,
          serial,
          purchase_date: purchaseDate,
          city,
          description,
          consent,
          company: "", // honeypot: боты заполняют, люди нет
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? ["Не удалось сформировать обращение."]);
        return;
      }
      setResult({ ticketNumber: data.ticketNumber, messageText: data.messageText });
    } catch {
      setErrors(["Ошибка сети. Попробуйте ещё раз."]);
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async () => {
    const text = result?.messageText ?? "";
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy();
      }
      flashCopied();
    } catch {
      fallbackCopy();
      flashCopied();
    }
  };

  const fallbackCopy = () => {
    const el = messageRef.current;
    if (!el) return;
    el.focus();
    el.select();
    try {
      document.execCommand("copy");
    } catch {
      // ничего: пользователь скопирует вручную
    }
  };

  const flashCopied = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  // ── Результат: обращение сформировано ──────────────────────────
  if (result) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-xl btn-accent flex items-center justify-center shrink-0">
            <IconCheck className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-foreground">Обращение сформировано</h2>
            <p className="text-sm text-muted">
              Номер обращения:{" "}
              <span className="font-mono font-semibold text-accent">{result.ticketNumber}</span>
            </p>
          </div>
        </div>

        <label className="block">
          <span className={LABEL_CLS}>Готовый текст обращения</span>
          <textarea
            ref={messageRef}
            readOnly
            value={result.messageText}
            rows={12}
            className={`${INPUT_CLS} font-mono text-sm resize-y`}
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copy}
            className="px-5 py-2.5 rounded-xl btn-accent font-medium transition inline-flex items-center gap-2"
          >
            {copied ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
            {copied ? "Скопировано ✓" : "Скопировать текст"}
          </button>
          <a
            href={ASUS_SUPPORT_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl border border-border hover:border-accent text-foreground font-medium transition inline-flex items-center gap-2"
          >
            Открыть форму техподдержки ASUS →
            <IconExternal className="w-4 h-4" />
          </a>
        </div>

        <p className="mt-3 text-sm text-muted">
          Откроется форма ASUS — вставьте скопированный текст в поле описания проблемы.
        </p>

        {serial && (
          <div className="mt-4 rounded-xl bg-background border border-border p-4 flex items-start gap-3">
            <IconShield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="text-sm text-muted">
              У вас указан серийный номер — пройдите{" "}
              <Link href="/warranty" className="text-accent hover:text-accent-hover font-medium">
                проверку гарантийности
              </Link>{" "}
              и приложите её результат к обращению: инженеру ASUS будет проще и быстрее.
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setResult(null);
            setCopied(false);
          }}
          className="mt-5 text-sm font-medium text-accent hover:text-accent-hover transition"
        >
          ← Изменить данные обращения
        </button>
      </div>
    );
  }

  // ── Форма-обёртка ──────────────────────────────────────────────
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="relative bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm"
    >
      {/* Honeypot: скрытое поле для ботов */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] w-px h-px opacity-0"
      />
      <a
        href={ASUS_SUPPORT_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-5 flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition"
      >
        <IconExternal className="w-4 h-4 shrink-0" />
        Перейти сразу на форму ASUS, без нашей обёртки →
      </a>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block md:col-span-2">
          <span className={LABEL_CLS}>
            ФИО или имя <span className="text-accent">*</span>
          </span>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Иванов Иван Иванович"
            maxLength={200}
            disabled={!mounted || submitting}
            className={INPUT_CLS}
          />
        </label>

        <label className="block">
          <span className={LABEL_CLS}>
            Email <span className="text-accent">*</span>
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            maxLength={254}
            disabled={!mounted || submitting}
            className={INPUT_CLS}
          />
        </label>

        <label className="block">
          <span className={LABEL_CLS}>Телефон</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 000-00-00"
            maxLength={32}
            disabled={!mounted || submitting}
            className={INPUT_CLS}
          />
        </label>

        <label className="block">
          <span className={LABEL_CLS}>Тип продукта</span>
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            disabled={!mounted || submitting}
            className={INPUT_CLS}
          >
            {SUPPORT_PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={LABEL_CLS}>Серийный номер</span>
          <input
            type="text"
            value={serial}
            onChange={(e) => setSerial(e.target.value.toUpperCase())}
            placeholder={`Например: ABC123456789 (${SN_MIN}–${SN_MAX} символов)`}
            maxLength={SN_MAX}
            disabled={!mounted || submitting}
            className={`${INPUT_CLS} font-mono uppercase`}
          />
        </label>

        <label className="block">
          <span className={LABEL_CLS}>Дата покупки</span>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            disabled={!mounted || submitting}
            className={INPUT_CLS}
          />
        </label>

        <label className="block">
          <span className={LABEL_CLS}>Город</span>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Москва"
            maxLength={100}
            disabled={!mounted || submitting}
            className={INPUT_CLS}
          />
        </label>

        <label className="block md:col-span-2">
          <span className={LABEL_CLS}>
            Описание проблемы <span className="text-accent">*</span>
          </span>
          <textarea
            required
            minLength={DESCRIPTION_MIN}
            maxLength={5000}
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Что случилось, когда началось, что уже пробовали…"
            disabled={!mounted || submitting}
            className={INPUT_CLS}
          />
          <span className="block text-xs text-muted mt-1">
            Минимум {DESCRIPTION_MIN} символов.
          </span>
        </label>
      </div>

      <label className="flex items-start gap-3 mt-5 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={!mounted || submitting}
          className="mt-0.5 w-4 h-4 accent-accent"
        />
        <span className="text-sm text-muted">
          Согласен на обработку персональных данных для рассмотрения обращения (
          <Link href="/privacy" className="text-accent hover:text-accent-hover underline">
            политика конфиденциальности
          </Link>
          ). <span className="text-accent">*</span>
        </span>
      </label>

      {errors.length > 0 && (
        <div className="mt-5 rounded-xl border border-border bg-background p-4 space-y-2">
          {errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground">
              <IconAlert className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>{e}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={!mounted || submitting}
        className="mt-6 w-full px-5 py-3 rounded-xl btn-accent disabled:opacity-60 font-semibold transition inline-flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Формируем…
          </>
        ) : (
          "Сформировать обращение"
        )}
      </button>
    </form>
  );
}
