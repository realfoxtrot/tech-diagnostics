"use client";

import { useEffect, useState, useCallback } from "react";

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

type Tab = "questions" | "resolutions" | "centers" | "warranty";

interface Question {
  id: number;
  text: string;
  category: string | null;
  isFirst: number;
  order: number;
}
interface Resolution {
  id: number;
  title: string;
  description: string;
  steps: string[] | null;
  needsFollowUp: number | null;
}
interface Center {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  workhours: string | null;
  lat: string | null;
  lng: string | null;
  isActive: number;
}
interface WarrantyCheck {
  id: number;
  serialNumber: string;
  purchaseDate: string | null;
  result: {
    covered?: boolean;
    conditions?: { key: string; status: "pass" | "fail" | "unknown"; detail?: string }[];
    localErrors?: string[];
    vendorErrors?: string[];
    vendorMessages?: string[];
    adminMessages?: string[];
    // legacy
    inWarranty?: boolean;
    warrantyUntil?: string;
    messages?: string[];
  } | null;
  status: string | null; // covered | rejected | error | pending(legacy) | confirmed(legacy)
  createdAt: string | null;
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("questions");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [checks, setChecks] = useState<WarrantyCheck[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [q, r, c, w] = await Promise.all([
        fetch("/api/admin/questions").then((r) => r.json()),
        fetch("/api/admin/resolutions").then((r) => r.json()),
        fetch("/api/admin/centers").then((r) => r.json()),
        fetch("/api/admin/warranty-checks").then((r) => r.json()),
      ]);
      setQuestions(q.questions ?? []);
      setResolutions(r.resolutions ?? []);
      setCenters(c.centers ?? []);
      setChecks(w.checks ?? []);
    } catch {
      setError("Ошибка загрузки");
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка данных при монтировании
  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-foreground">Админ-панель</h1>
      {error && <div className="bg-error-bg border border-error/25 text-error rounded-xl p-3 mb-4">{error}</div>}

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["questions", "resolutions", "centers", "warranty"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t ? "btn-accent" : "bg-card border border-border hover:bg-background"
            }`}
          >
            {t === "questions" ? "Вопросы" : t === "resolutions" ? "Рекомендации" : t === "centers" ? "Сервисные центры" : "Гарантийность"}
          </button>
        ))}
      </div>

      {tab === "questions" && <QuestionsAdmin items={questions} onChanged={load} />}
      {tab === "resolutions" && <ResolutionsAdmin items={resolutions} onChanged={load} />}
      {tab === "centers" && <CentersAdmin items={centers} onChanged={load} />}
      {tab === "warranty" && <WarrantyAdmin items={checks} onChanged={load} />}
    </div>
  );
}

// ─── Вопросы ──────────────────────────────────────────────────────
function QuestionsAdmin({ items, onChanged }: { items: Question[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<Partial<Question> | null>(null);

  const save = async (data: Partial<Question>) => {
    await fetch("/api/admin/questions", {
      method: data.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditing(null);
    onChanged();
  };
  const del = async (id: number) => {
    await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setEditing({ text: "", category: null, isFirst: 0, order: items.length + 1 })}
        className="px-4 py-2 rounded-xl btn-accent text-sm hover:bg-accent-hover transition"
      >
        + Добавить вопрос
      </button>
      {items.map((q) => (
        <div key={q.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="font-medium text-foreground">{q.text}</div>
            <div className="text-xs text-foreground">
              {q.category ?? "без категории"} {q.isFirst === 1 ? " · стартовый" : ""} · порядок {q.order}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing({ ...q })} className="px-3 py-1 rounded-lg bg-background hover:bg-background text-sm text-foreground transition" aria-label="Редактировать"><PencilIcon /></button>
            <button onClick={() => del(q.id)} className="px-3 py-1 rounded-lg bg-error-bg text-error hover:opacity-80 text-sm transition" aria-label="Удалить"><TrashIcon /></button>
          </div>
        </div>
      ))}
      {editing && (
        <Editor
          title={editing.id ? "Редактировать вопрос" : "Новый вопрос"}
          onClose={() => setEditing(null)}
          onSave={() => save(editing)}
        >
          <label className="block mb-3">
            <span className="block text-sm font-medium text-foreground mb-1">Текст вопроса</span>
            <input
              value={editing.text ?? ""}
              onChange={(e) => setEditing({ ...editing, text: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Введите текст вопроса..."
            />
          </label>
          <label className="block mb-3">
            <span className="block text-sm font-medium text-foreground mb-1">Категория</span>
            <input
              value={editing.category ?? ""}
              onChange={(e) => setEditing({ ...editing, category: e.target.value || null })}
              className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Опционально..."
            />
          </label>
          <label className="flex items-center gap-2 mb-2 text-sm">
            <input
              type="checkbox"
              checked={editing.isFirst === 1}
              onChange={(e) => setEditing({ ...editing, isFirst: e.target.checked ? 1 : 0 })}
              className="rounded border-border text-accent focus:ring-accent accent-accent"
            />
            <span className="text-muted">Стартовый вопрос</span>
          </label>
        </Editor>
      )}
    </div>
  );
}

// ─── Рекомендации ─────────────────────────────────────────────────
function ResolutionsAdmin({ items, onChanged }: { items: Resolution[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<Partial<Resolution> | null>(null);

  const save = async (data: Partial<Resolution>) => {
    await fetch("/api/admin/resolutions", {
      method: data.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditing(null);
    onChanged();
  };
  const del = async (id: number) => {
    await fetch(`/api/admin/resolutions?id=${id}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setEditing({ title: "", description: "", steps: [], needsFollowUp: 1 })}
        className="px-4 py-2 rounded-xl btn-accent text-sm hover:bg-accent-hover transition"
      >
        + Добавить рекомендацию
      </button>
      {items.map((r) => (
        <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="font-medium text-foreground">{r.title}</div>
            <div className="text-xs text-foreground">{Array.isArray(r.steps) ? `${r.steps.length} шагов` : "без шагов"}</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing({ ...r })} className="px-3 py-1 rounded-lg bg-background hover:bg-background text-sm text-foreground transition" aria-label="Редактировать"><PencilIcon /></button>
            <button onClick={() => del(r.id)} className="px-3 py-1 rounded-lg bg-error-bg text-error hover:opacity-80 text-sm transition" aria-label="Удалить"><TrashIcon /></button>
          </div>
        </div>
      ))}
      {editing && (
        <Editor
          title={editing.id ? "Редактировать рекомендацию" : "Новая рекомендация"}
          onClose={() => setEditing(null)}
          onSave={() => save(editing)}
        >
          <label className="block mb-3">
            <span className="block text-sm font-medium text-foreground mb-1">Название</span>
            <input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Название рекомендации..." />
          </label>
          <label className="block mb-3">
            <span className="block text-sm font-medium text-foreground mb-1">Описание</span>
            <textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              rows={3}
              placeholder="Описание проблемы и решения..." />
          </label>
          <label className="block mb-3">
            <span className="block text-sm font-medium text-foreground mb-1">Шаги (по одному на строку)</span>
            <textarea
              value={(editing.steps ?? []).join("\n")}
              onChange={(e) => setEditing({ ...editing, steps: e.target.value.split("\n").filter(Boolean) })
              }
              className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              rows={6}
              placeholder="1. Первый шаг\n2. Второй шаг\n..." />
          </label>
        </Editor>
      )}
    </div>
  );
}

// ─── Сервисные центры ─────────────────────────────────────────────
function CentersAdmin({ items, onChanged }: { items: Center[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<Partial<Center> | null>(null);

  const save = async (data: Partial<Center>) => {
    await fetch("/api/admin/centers", {
      method: data.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditing(null);
    onChanged();
  };
  const del = async (id: number) => {
    await fetch(`/api/admin/centers?id=${id}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setEditing({ name: "", address: "", isActive: 1 })}
        className="px-4 py-2 rounded-xl btn-accent text-sm hover:bg-accent-hover transition"
      >
        + Добавить центр
      </button>
      {items.map((c) => (
        <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="font-medium text-foreground">{c.name}</div>
            <div className="text-xs text-foreground">{c.address}{c.phone ? ` · ${c.phone}` : ""}</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing({ ...c })} className="px-3 py-1 rounded-lg bg-background hover:bg-background text-sm text-foreground transition" aria-label="Редактировать"><PencilIcon /></button>
            <button onClick={() => del(c.id)} className="px-3 py-1 rounded-lg bg-error-bg text-error hover:opacity-80 text-sm transition" aria-label="Удалить"><TrashIcon /></button>
          </div>
        </div>
      ))}
      {editing && (
        <Editor
          title={editing.id ? "Редактировать центр" : "Новый центр"}
          onClose={() => setEditing(null)}
          onSave={() => save(editing)}
        >
          <label className="block mb-3">
            <span className="block text-sm font-medium text-foreground mb-1">Название</span>
            <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Название сервисного центра..." />
          </label>
          <label className="block mb-3">
            <span className="block text-sm font-medium text-foreground mb-1">Адрес</span>
            <input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Полный адрес..." />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-medium text-foreground mb-1">Телефон</span>
              <input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value || null })}
                className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="+7 (999) 000-00-00" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-foreground mb-1">Режим работы</span>
              <input value={editing.workhours ?? ""} onChange={(e) => setEditing({ ...editing, workhours: e.target.value || null })}
                className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Пн.-Пт. 09:00-18:00" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-foreground mb-1">Email</span>
              <input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value || null })}
                className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="info@example.com" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-foreground mb-1">Широта</span>
              <input value={editing.lat ?? ""} onChange={(e) => setEditing({ ...editing, lat: e.target.value || null })}
                className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="55.7558" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-foreground mb-1">Долгота</span>
              <input value={editing.lng ?? ""} onChange={(e) => setEditing({ ...editing, lng: e.target.value || null })}
                className="w-full px-3 py-2 border border-border rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="37.6173" />
            </label>
          </div>
        </Editor>
      )}
    </div>
  );
}

// ─── Проверки гарантийности ─────────────────────────────────────
function WarrantyAdmin({ items, onChanged }: { items: WarrantyCheck[]; onChanged: () => void }) {
  const [confirm, setConfirm] = useState<Record<number, string> | null>(null);

  const confirmCheck = async (id: number, message: string) => {
    await fetch("/api/admin/warranty-checks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "confirmed", messages: [message] }),
    });
    setConfirm(null);
    onChanged();
  };

  const statusMeta = (status: string | null) => {
    const s = status ?? "";
    if (s === "covered") return { label: "в гарантии", cls: "bg-success-bg text-success" };
    if (s === "rejected") return { label: "вне программы", cls: "bg-error-bg text-error" };
    if (s === "error") return { label: "ошибка проверки", cls: "bg-accent-soft text-accent" };
    if (s === "confirmed") return { label: "подтверждено", cls: "bg-success-bg text-success" };
    return { label: "ожидает уточнения", cls: "bg-accent-soft text-accent" };
  };

  const conditionText = (c: WarrantyCheck) => {
    const conds = c.result?.conditions ?? [];
    if (!conds.length) return "";
    const label: Record<string, string> = {
      device: "тип (ноутбук)",
      region: "регион РФ",
      saleDate: "дата по чеку",
      productionDate: "дата производства",
    };
    return conds
      .map((x) => `${label[x.key] ?? x.key}: ${x.status === "pass" ? "ок" : x.status === "fail" ? "нет" : "?"}`)
      .join(" · ");
  };

  const firstMessage = (c: WarrantyCheck) => {
    const r = c.result;
    if (!r) return "";
    if (r.adminMessages && r.adminMessages.length) return r.adminMessages[0];
    if (r.vendorMessages && r.vendorMessages.length) return r.vendorMessages[0];
    if (r.vendorErrors && r.vendorErrors.length) return r.vendorErrors[0];
    if (r.localErrors && r.localErrors.length) return r.localErrors[0];
    return r.messages?.[0] ?? ""; // legacy
  };

  const rows = items; // API уже сортирует по createdAt desc

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Обращения со страницы «Проверка гарантийности». «В гарантии» — подпадает под
        централизованную гарантию ASUS; «вне программы» — не прошли условия или проверка
        вендора; «ошибка проверки» — вендор был недоступен; «ожидает уточнения» (legacy) —
        можно подтвердить вручную.
      </p>
      <div className="space-y-3">
        {rows.length === 0 && <div className="text-sm text-muted">Пока нет обращений.</div>}
        {rows.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="font-mono font-medium text-foreground">{c.serialNumber || "(без SN)"}</div>
              <div className="text-xs text-muted">покупка: {c.purchaseDate ?? "?"} · {c.createdAt ?? ""}</div>
              {conditionText(c) && (
                <div className="text-xs text-foreground">{conditionText(c)}</div>
              )}
              {(() => {
                const m = statusMeta(c.status);
                return <span className={`text-xs px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
              })()}
            </div>
            {firstMessage(c) && <div className="text-sm text-foreground mt-2">{firstMessage(c)}</div>}
            {(c.status ?? "") === "pending" &&
              (confirm?.[c.id] !== undefined ? (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={confirm[c.id]}
                    onChange={(e) => setConfirm({ ...confirm, [c.id]: e.target.value })}
                    className="flex-1 px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm"
                    placeholder="Сообщение клиенту"
                    autoFocus
                  />
                  <button onClick={() => confirmCheck(c.id, confirm[c.id])} className="px-3 py-2 rounded-xl btn-accent text-sm hover:bg-accent-hover transition" aria-label="Подтвердить"><CheckIcon /></button>
                  <button onClick={() => setConfirm(null)} className="px-3 py-2 rounded-xl border border-border text-sm text-foreground" aria-label="Отмена"><CloseIcon /></button>
                </div>
              ) : (
                <button onClick={() => setConfirm({ [c.id]: "" })} className="mt-3 px-3 py-1.5 rounded-lg bg-background hover:bg-background text-sm text-foreground transition">
                  Уточнить вручную…
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Общий редактор ───────────────────────────────────────────────
function Editor({
  title, children, onClose, onSave,
}: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card rounded-xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-foreground">{title}</h2>
        <div className="space-y-4">{children}</div>
        <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border hover:bg-background transition text-foreground">Отмена</button>
          <button onClick={onSave} className="px-4 py-2 rounded-xl btn-accent hover:bg-accent-hover transition">Сохранить</button>
        </div>
      </div>
    </div>
  );
}
