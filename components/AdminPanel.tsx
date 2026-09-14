"use client";

import { useEffect, useState, useCallback } from "react";
import DiagnosisTreeAdmin from "./DiagnosisTreeAdmin";

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

type Tab = "diagnosis" | "centers" | "warranty";

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
  const [tab, setTab] = useState<Tab>("diagnosis");
  const [centers, setCenters] = useState<Center[]>([]);
  const [checks, setChecks] = useState<WarrantyCheck[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, w] = await Promise.all([
        fetch("/api/admin/centers").then((r) => r.json()),
        fetch("/api/admin/warranty-checks").then((r) => r.json()),
      ]);
      setCenters(c.centers ?? []);
      setChecks(w.checks ?? []);
    } catch {
      setError("Ошибка загрузки");
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка данных при монтировании
  useEffect(() => { load(); }, [load]);

  return (
    <div className={tab === "diagnosis" ? "max-w-6xl mx-auto" : "max-w-4xl mx-auto"}>
      <h1 className="text-2xl font-bold mb-4 text-foreground">Админ-панель</h1>
      {error && <div className="bg-error-bg border border-error/25 text-error rounded-xl p-3 mb-4">{error}</div>}

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["diagnosis", "centers", "warranty"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t ? "btn-accent" : "bg-card border border-border hover:bg-background"
            }`}
          >
            {t === "diagnosis" ? "Диагностика" : t === "centers" ? "Сервисные центры" : "Гарантийность"}
          </button>
        ))}
      </div>

      {tab === "diagnosis" && <DiagnosisTreeAdmin />}
      {tab === "centers" && <CentersAdmin items={centers} onChanged={load} />}
      {tab === "warranty" && <WarrantyAdmin items={checks} onChanged={load} />}
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
