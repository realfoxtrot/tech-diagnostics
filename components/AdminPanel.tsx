"use client";

import { useEffect, useState, useCallback } from "react";

type Tab = "questions" | "resolutions" | "centers";

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
  lat: string | null;
  lng: string | null;
  isActive: number;
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("questions");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [q, r, c] = await Promise.all([
        fetch("/api/admin/questions").then((r) => r.json()),
        fetch("/api/admin/resolutions").then((r) => r.json()),
        fetch("/api/admin/centers").then((r) => r.json()),
      ]);
      setQuestions(q.questions ?? []);
      setResolutions(r.resolutions ?? []);
      setCenters(c.centers ?? []);
    } catch {
      setError("Ошибка загрузки");
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка данных при монтировании
  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-[#1e293b]">Админ-панель</h1>
      {error && <div className="bg-[#fef2f2] border border-red-200 text-red-700 rounded-xl p-3 mb-4">{error}</div>}

      <div className="flex gap-2 mb-6">
        {(["questions", "resolutions", "centers"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t ? "bg-[#4f46e5] text-white" : "bg-white border border-slate-200 hover:bg-[#f1f5f9]"
            }`}
          >
            {t === "questions" ? "Вопросы" : t === "resolutions" ? "Рекомендации" : "Сервисные центры"}
          </button>
        ))}
      </div>

      {tab === "questions" && <QuestionsAdmin items={questions} onChanged={load} />}
      {tab === "resolutions" && <ResolutionsAdmin items={resolutions} onChanged={load} />}
      {tab === "centers" && <CentersAdmin items={centers} onChanged={load} />}
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
        className="px-4 py-2 rounded-xl bg-[#10b981] text-white text-sm hover:bg-[#059669] transition"
      >
        + Добавить вопрос
      </button>
      {items.map((q) => (
        <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="font-medium text-[#1e293b]">{q.text}</div>
            <div className="text-xs text-[#64748b]">
              {q.category ?? "без категории"} {q.isFirst === 1 ? " · стартовый" : ""} · порядок {q.order}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing({ ...q })} className="px-3 py-1 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-sm text-[#475569] transition">✎</button>
            <button onClick={() => del(q.id)} className="px-3 py-1 rounded-lg bg-[#fef2f2] text-red-600 hover:bg-[#fee2e2] text-sm transition">🗑</button>
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
            <span className="block text-sm font-medium text-[#475569] mb-1">Текст вопроса</span>
            <input
              value={editing.text ?? ""}
              onChange={(e) => setEditing({ ...editing, text: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              placeholder="Введите текст вопроса..."
            />
          </label>
          <label className="block mb-3">
            <span className="block text-sm font-medium text-[#475569] mb-1">Категория</span>
            <input
              value={editing.category ?? ""}
              onChange={(e) => setEditing({ ...editing, category: e.target.value || null })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              placeholder="Опционально..."
            />
          </label>
          <label className="flex items-center gap-2 mb-2 text-sm">
            <input
              type="checkbox"
              checked={editing.isFirst === 1}
              onChange={(e) => setEditing({ ...editing, isFirst: e.target.checked ? 1 : 0 })}
              className="rounded border-slate-300 text-[#4f46e5] focus:ring-[#4f46e5]"
            />
            <span className="text-[#334155]">Стартовый вопрос</span>
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
        className="px-4 py-2 rounded-xl bg-[#10b981] text-white text-sm hover:bg-[#059669] transition"
      >
        + Добавить рекомендацию
      </button>
      {items.map((r) => (
        <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="font-medium text-[#1e293b]">{r.title}</div>
            <div className="text-xs text-[#64748b]">{Array.isArray(r.steps) ? `${r.steps.length} шагов` : "без шагов"}</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing({ ...r })} className="px-3 py-1 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-sm text-[#475569] transition">✎</button>
            <button onClick={() => del(r.id)} className="px-3 py-1 rounded-lg bg-[#fef2f2] text-red-600 hover:bg-[#fee2e2] text-sm transition">🗑</button>
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
            <span className="block text-sm font-medium text-[#475569] mb-1">Название</span>
            <input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              placeholder="Название рекомендации..." />
          </label>
          <label className="block mb-3">
            <span className="block text-sm font-medium text-[#475569] mb-1">Описание</span>
            <textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              rows={3}
              placeholder="Описание проблемы и решения..." />
          </label>
          <label className="block mb-3">
            <span className="block text-sm font-medium text-[#475569] mb-1">Шаги (по одному на строку)</span>
            <textarea
              value={(editing.steps ?? []).join("\n")}
              onChange={(e) => setEditing({ ...editing, steps: e.target.value.split("\n").filter(Boolean) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
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
        className="px-4 py-2 rounded-xl bg-[#10b981] text-white text-sm hover:bg-[#059669] transition"
      >
        + Добавить центр
      </button>
      {items.map((c) => (
        <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="font-medium text-[#1e293b]">{c.name}</div>
            <div className="text-xs text-[#64748b]">{c.address}{c.phone ? ` · ${c.phone}` : ""}</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing({ ...c })} className="px-3 py-1 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-sm text-[#475569] transition">✎</button>
            <button onClick={() => del(c.id)} className="px-3 py-1 rounded-lg bg-[#fef2f2] text-red-600 hover:bg-[#fee2e2] text-sm transition">🗑</button>
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
            <span className="block text-sm font-medium text-[#475569] mb-1">Название</span>
            <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              placeholder="Название сервисного центра..." />
          </label>
          <label className="block mb-3">
            <span className="block text-sm font-medium text-[#475569] mb-1">Адрес</span>
            <input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              placeholder="Полный адрес..." />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-medium text-[#475569] mb-1">Телефон</span>
              <input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value || null })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                placeholder="+7 (999) 000-00-00" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-[#475569] mb-1">Email</span>
              <input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value || null })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                placeholder="info@example.com" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-[#475569] mb-1">Широта</span>
              <input value={editing.lat ?? ""} onChange={(e) => setEditing({ ...editing, lat: e.target.value || null })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                placeholder="55.7558" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-[#475569] mb-1">Долгота</span>
              <input value={editing.lng ?? ""} onChange={(e) => setEditing({ ...editing, lng: e.target.value || null })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                placeholder="37.6173" />
            </label>
          </div>
        </Editor>
      )}
    </div>
  );
}

// ─── Общий редактор ───────────────────────────────────────────────
function Editor({
  title, children, onClose, onSave,
}: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-[#1e293b]">{title}</h2>
        <div className="space-y-4">{children}</div>
        <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-[#f1f5f9] transition text-[#475569]">Отмена</button>
          <button onClick={onSave} className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white hover:bg-[#4338ca] transition">Сохранить</button>
        </div>
      </div>
    </div>
  );
}
