"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { reachableQuestions } from "@/lib/admin-tree";

/**
 * Визуальный редактор дерева диагностики: вопросы → ответы → цепочки шагов.
 * Слева — вопросы с исходящими (ответы) и входящими связями,
 * справа — цепочки рекомендаций с последовательностью шагов.
 * Проблемы структуры (тупики, недостижимые вопросы) собираются в панель предупреждений.
 */

interface Q {
  id: number;
  text: string;
  category: string | null;
  isFirst: number;
  order: number;
}
interface Opt {
  id: number;
  questionId: number;
  label: string;
  nextQuestionId: number | null;
  resolutionId: number | null;
  order: number;
}
interface Res {
  id: number;
  title: string;
  description: string;
  needsFollowUp: number | null;
}
interface Step {
  id: number;
  resolutionId: number;
  title: string | null;
  text: string;
  order: number;
  nextStepId: number | null;
}
interface TreeData {
  questions: Q[];
  options: Opt[];
  resolutions: Res[];
  steps: Step[];
}

type Modal =
  | { kind: "question"; draft: Partial<Q> }
  | { kind: "option"; questionId: number; draft: Partial<Opt> }
  | { kind: "resolution"; draft: Partial<Res> }
  | { kind: "step"; resolutionId: number; draft: Partial<Step> }
  | null;

const INPUT_CLS =
  "w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent";

const short = (s: string, n = 42) => (s.length > n ? `${s.slice(0, n)}…` : s);

export default function DiagnosisTreeAdmin() {
  const [data, setData] = useState<TreeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);

  const reload = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/tree");
      const j = await r.json();
      setData({ questions: j.questions ?? [], options: j.options ?? [], resolutions: j.resolutions ?? [], steps: j.steps ?? [] });
    } catch {
      setError("Ошибка загрузки дерева");
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- загрузка данных при монтировании
  useEffect(() => { reload(); }, [reload]);

  const byQ = useMemo(() => {
    const m = new Map<number, Opt[]>();
    for (const o of data?.options ?? []) {
      const list = m.get(o.questionId) ?? [];
      list.push(o);
      m.set(o.questionId, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.order - b.order || a.id - b.id);
    return m;
  }, [data]);

  const stepsByRes = useMemo(() => {
    const m = new Map<number, Step[]>();
    for (const s of data?.steps ?? []) {
      const list = m.get(s.resolutionId) ?? [];
      list.push(s);
      m.set(s.resolutionId, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.order - b.order || a.id - b.id);
    return m;
  }, [data]);

  const incoming = useMemo(() => {
    const toQ = new Map<number, Opt[]>();
    const toRes = new Map<number, Opt[]>();
    for (const o of data?.options ?? []) {
      if (o.nextQuestionId != null) (toQ.get(o.nextQuestionId) ?? toQ.set(o.nextQuestionId, []).get(o.nextQuestionId)!).push(o);
      if (o.resolutionId != null) (toRes.get(o.resolutionId) ?? toRes.set(o.resolutionId, []).get(o.resolutionId)!).push(o);
    }
    return { toQ, toRes };
  }, [data]);

  const warnings = useMemo(() => {
    if (!data) return [];
    const out: string[] = [];
    const firsts = data.questions.filter((q) => q.isFirst === 1);
    if (firsts.length === 0) out.push("Нет стартового вопроса — диагностика не запустится.");
    if (firsts.length > 1) out.push(`Стартовых вопросов несколько: ${firsts.map((q) => `#${q.id}`).join(", ")}.`);
    const reach = reachableQuestions(data.questions, data.options);
    for (const q of data.questions) {
      if (q.isFirst !== 1 && !reach.has(q.id)) out.push(`Вопрос #${q.id} «${short(q.text)}» недостижим от стартового.`);
      if ((byQ.get(q.id) ?? []).length === 0) out.push(`Вопрос #${q.id} «${short(q.text)}» без ответов (опций).`);
    }
    const qById = new Map(data.questions.map((q) => [q.id, q]));
    const rById = new Map(data.resolutions.map((r) => [r.id, r]));
    for (const o of data.options) {
      if (o.nextQuestionId == null && o.resolutionId == null) {
        out.push(`Ответ «${o.label || "без текста"}» (вопрос #${o.questionId}) не ведёт никуда — тупик.`);
      } else if (o.nextQuestionId != null && !qById.has(o.nextQuestionId)) {
        out.push(`Ответ «${o.label}» ведёт на несуществующий вопрос #${o.nextQuestionId}.`);
      } else if (o.resolutionId != null && !rById.has(o.resolutionId)) {
        out.push(`Ответ «${o.label}» ведёт на несуществующую цепочку #${o.resolutionId}.`);
      }
    }
    for (const r of data.resolutions) {
      if ((stepsByRes.get(r.id) ?? []).length === 0) out.push(`Цепочка #${r.id} «${r.title}» без шагов.`);
    }
    return out;
  }, [data, byQ, stepsByRes]);

  if (error) return <div className="bg-error-bg border border-error/25 text-error rounded-xl p-3">{error}</div>;
  if (!data) return <div className="text-sm text-muted">Загрузка дерева…</div>;

  const qName = (id: number) => {
    const q = data.questions.find((x) => x.id === id);
    return q ? `#${id} «${short(q.text, 30)}»` : `#${id}`;
  };
  const rName = (id: number) => {
    const r = data.resolutions.find((x) => x.id === id);
    return r ? `«${short(r.title, 30)}»` : `#${id}`;
  };
  const target = (o: Opt) => {
    if (o.resolutionId != null) return { label: rName(o.resolutionId), cls: "bg-accent-soft text-accent" };
    if (o.nextQuestionId != null) return { label: qName(o.nextQuestionId), cls: "bg-success-bg text-success" };
    return { label: "цель не задана", cls: "bg-error-bg text-error" };
  };

  const sortedQuestions = [...data.questions].sort(
    (a, b) => (b.isFirst - a.isFirst) || (a.order - b.order) || (a.id - b.id),
  );
  const stats = `${data.questions.length} вопросов · ${data.options.length} ответов · ${data.resolutions.length} цепочек · ${data.steps.length} шагов`;

  const api = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "Ошибка сохранения");
    }
  };

  const del = async (what: string, url: string) => {
    if (!window.confirm(what)) return;
    await api(url, "DELETE");
    await reload();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="text-sm text-muted">{stats}</div>
        <div className="flex gap-2">
          <button onClick={() => setModal({ kind: "question", draft: { text: "", category: null, isFirst: 0, order: data.questions.length + 1 } })} className="px-3 py-1.5 rounded-xl btn-accent text-sm hover:bg-accent-hover transition">+ Вопрос</button>
          <button onClick={() => setModal({ kind: "resolution", draft: { title: "", description: "", needsFollowUp: 1 } })} className="px-3 py-1.5 rounded-xl btn-accent text-sm hover:bg-accent-hover transition">+ Цепочка</button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="bg-error-bg border border-error/30 rounded-xl p-4 mb-5">
          <div className="text-sm font-semibold text-error mb-2">Проблемы структуры ({warnings.length})</div>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-error">• {w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2 items-start">
        {/* ── Вопросы ── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted mb-2">Вопросы</h2>
          <div className="space-y-3">
            {sortedQuestions.map((q) => {
              const opts = byQ.get(q.id) ?? [];
              const inc = incoming.toQ.get(q.id) ?? [];
              return (
                <div key={q.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-background border border-border text-muted">#{q.id}</span>
                      {q.isFirst === 1 && <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-fill-text font-semibold">стартовый</span>}
                      {q.category && <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent">{q.category}</span>}
                      <span className="text-xs text-muted">порядок {q.order}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setModal({ kind: "question", draft: { ...q } })} className="p-1.5 rounded-lg hover:bg-background text-muted hover:text-foreground transition" aria-label="Редактировать вопрос">✎</button>
                      <button onClick={() => del(`Удалить вопрос #${q.id}? Его ответы будут удалены, ссылки других ответов на него сбросятся.`, `/api/admin/questions?id=${q.id}`)} className="p-1.5 rounded-lg hover:bg-error-bg text-muted hover:text-error transition" aria-label="Удалить вопрос">🗑</button>
                    </div>
                  </div>
                  <div className="font-medium text-foreground mb-2">{q.text}</div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="px-3 py-1.5 bg-background text-xs font-semibold uppercase tracking-wide text-muted border-b border-border">Ответы →</div>
                    {opts.length === 0 && <div className="px-3 py-2 text-sm text-error">Нет ответов</div>}
                    {opts.map((o) => {
                      const t = target(o);
                      return (
                        <div key={o.id} className="flex items-center gap-2 px-3 py-2 border-b border-border last:border-b-0 group">
                          <button onClick={() => setModal({ kind: "option", questionId: q.id, draft: { ...o } })} className="flex-1 min-w-0 flex items-center gap-2 text-left">
                            <span className="text-sm text-foreground truncate">«{o.label || "…"}»</span>
                            <span className="text-muted shrink-0">→</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full truncate ${t.cls}`}>{t.label}</span>
                          </button>
                          <button onClick={() => del(`Удалить ответ «${o.label}»?`, `/api/admin/options?id=${o.id}`)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-error-bg text-muted hover:text-error transition shrink-0" aria-label="Удалить ответ">🗑</button>
                        </div>
                      );
                    })}
                    <button onClick={() => setModal({ kind: "option", questionId: q.id, draft: { label: "", nextQuestionId: null, resolutionId: null, order: opts.length + 1 } })} className="w-full px-3 py-1.5 text-left text-sm text-accent hover:bg-background transition">+ ответ</button>
                  </div>

                  {inc.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-xs text-muted">вход:</span>
                      {inc.map((o) => (
                        <span key={o.id} className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-muted">← «{short(o.label, 20)}» ({qName(o.questionId)})</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Цепочки ── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted mb-2">Цепочки рекомендаций</h2>
          <div className="space-y-3">
            {data.resolutions.map((r) => {
              const steps = stepsByRes.get(r.id) ?? [];
              const inc = incoming.toRes.get(r.id) ?? [];
              return (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-background border border-border text-muted">#{r.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent">{steps.length} шагов</span>
                      {inc.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-success-bg text-success">вход: {inc.length} ответ(ов)</span>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setModal({ kind: "resolution", draft: { ...r } })} className="p-1.5 rounded-lg hover:bg-background text-muted hover:text-foreground transition" aria-label="Редактировать цепочку">✎</button>
                      <button onClick={() => del(`Удалить цепочку #${r.id} «${r.title}»? Шаги будут удалены, ссылки ответов на неё сбросятся.`, `/api/admin/resolutions?id=${r.id}`)} className="p-1.5 rounded-lg hover:bg-error-bg text-muted hover:text-error transition" aria-label="Удалить цепочку">🗑</button>
                    </div>
                  </div>
                  <div className="font-medium text-foreground">{r.title}</div>
                  {r.description && <div className="text-sm text-muted mt-0.5">{short(r.description, 120)}</div>}

                  <ol className="relative ml-3 mt-3 border-l-2 border-border space-y-2">
                    {steps.map((s, i) => (
                      <li key={s.id} className="pl-5 relative group">
                        <span className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-accent-soft text-accent text-xs font-bold flex items-center justify-center border-2 border-card">{i + 1}</span>
                        <div className="bg-background border border-border rounded-lg px-3 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              {s.title && <div className="text-sm font-semibold text-foreground">{s.title}</div>}
                              <div className="text-sm text-muted">{short(s.text, 140)}</div>
                            </div>
                            <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition">
                              {i > 0 && (
                                <button onClick={async () => { await api("/api/admin/steps", "PUT", { id: s.id, move: -1 }); await reload(); }} className="p-1 rounded hover:bg-card text-muted hover:text-foreground" aria-label="Шаг выше">↑</button>
                              )}
                              {i < steps.length - 1 && (
                                <button onClick={async () => { await api("/api/admin/steps", "PUT", { id: s.id, move: 1 }); await reload(); }} className="p-1 rounded hover:bg-card text-muted hover:text-foreground" aria-label="Шаг ниже">↓</button>
                              )}
                              <button onClick={() => setModal({ kind: "step", resolutionId: r.id, draft: { ...s } })} className="p-1 rounded hover:bg-card text-muted hover:text-foreground" aria-label="Редактировать шаг">✎</button>
                              <button onClick={() => del(`Удалить шаг ${i + 1} из цепочки «${r.title}»?`, `/api/admin/steps?id=${s.id}`)} className="p-1 rounded hover:bg-error-bg text-muted hover:text-error" aria-label="Удалить шаг">🗑</button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                    {steps.length > 0 && (
                      <li className="pl-5 relative">
                        <span className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-background border-2 border-border text-muted text-xs flex items-center justify-center">→</span>
                        <div className="text-xs text-muted py-1.5">конец цепочки — обращение в сервисный центр</div>
                      </li>
                    )}
                  </ol>

                  <button onClick={() => setModal({ kind: "step", resolutionId: r.id, draft: { title: "", text: "" } })} className="mt-2 px-3 py-1.5 rounded-lg bg-background hover:bg-border text-sm text-foreground transition">+ шаг</button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {modal?.kind === "question" && (
        <QuestionModal draft={modal.draft} onClose={() => setModal(null)} onSave={async (d) => { await api("/api/admin/questions", d.id ? "PUT" : "POST", d); setModal(null); await reload(); }} />
      )}
      {modal?.kind === "option" && (
        <OptionModal draft={modal.draft} questions={data.questions} resolutions={data.resolutions} onClose={() => setModal(null)} onSave={async (d) => { await api("/api/admin/options", d.id ? "PUT" : "POST", { ...d, questionId: modal.questionId }); setModal(null); await reload(); }} />
      )}
      {modal?.kind === "resolution" && (
        <ResolutionModal draft={modal.draft} onClose={() => setModal(null)} onSave={async (d) => { await api("/api/admin/resolutions", d.id ? "PUT" : "POST", d); setModal(null); await reload(); }} />
      )}
      {modal?.kind === "step" && (
        <StepModal draft={modal.draft} onClose={() => setModal(null)} onSave={async (d) => { await api("/api/admin/steps", d.id ? "PUT" : "POST", { ...d, resolutionId: modal.resolutionId }); setModal(null); await reload(); }} />
      )}
    </div>
  );
}

// ── Модалки ───────────────────────────────────────────────────────

function Modal({ title, children, onClose, onSave, extraFooter }: {
  title: string; children: React.ReactNode; onClose: () => void; onSave: () => void; extraFooter?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-foreground">{title}</h2>
        <div className="space-y-4">{children}</div>
        <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-border">
          {extraFooter}
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border hover:bg-background transition text-foreground">Отмена</button>
          <button onClick={onSave} className="px-4 py-2 rounded-xl btn-accent hover:bg-accent-hover transition">Сохранить</button>
        </div>
      </div>
    </div>
  );
}

function QuestionModal({ draft, onClose, onSave }: { draft: Partial<Q>; onClose: () => void; onSave: (d: Partial<Q>) => void }) {
  const [d, setD] = useState(draft);
  return (
    <Modal title={d.id ? `Вопрос #${d.id}` : "Новый вопрос"} onClose={onClose} onSave={() => onSave(d)}>
      <label className="block">
        <span className="block text-sm font-medium text-foreground mb-1">Текст вопроса</span>
        <textarea value={d.text ?? ""} onChange={(e) => setD({ ...d, text: e.target.value })} rows={2} className={INPUT_CLS} placeholder="Что именно происходит?" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-foreground mb-1">Категория</span>
          <input value={d.category ?? ""} onChange={(e) => setD({ ...d, category: e.target.value || null })} className={INPUT_CLS} placeholder="power, display…" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-foreground mb-1">Порядок</span>
          <input type="number" value={d.order ?? 0} onChange={(e) => setD({ ...d, order: Number(e.target.value) })} className={INPUT_CLS} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={d.isFirst === 1} onChange={(e) => setD({ ...d, isFirst: e.target.checked ? 1 : 0 })} className="rounded border-border accent-accent" />
        <span className="text-muted">Стартовый вопрос (с него начинается диагностика)</span>
      </label>
    </Modal>
  );
}

function OptionModal({ draft, questions, resolutions, onClose, onSave }: {
  draft: Partial<Opt>; questions: Q[]; resolutions: Res[]; onClose: () => void; onSave: (d: Partial<Opt>) => void;
}) {
  const [d, setD] = useState(draft);
  const kind = d.resolutionId != null ? "resolution" : d.nextQuestionId != null ? "question" : "none";
  const setKind = (k: "resolution" | "question" | "none") =>
    setD({ ...d, resolutionId: k === "resolution" ? d.resolutionId ?? resolutions[0]?.id ?? null : null, nextQuestionId: k === "question" ? d.nextQuestionId ?? questions.find((q) => q.isFirst !== 1)?.id ?? null : null });
  return (
    <Modal title={d.id ? `Ответ «${d.label}»` : "Новый ответ"} onClose={onClose} onSave={() => onSave(d)}>
      <label className="block">
        <span className="block text-sm font-medium text-foreground mb-1">Текст ответа (кнопка в чате)</span>
        <input value={d.label ?? ""} onChange={(e) => setD({ ...d, label: e.target.value })} className={INPUT_CLS} placeholder="Да, включается" autoFocus />
      </label>
      <div>
        <span className="block text-sm font-medium text-foreground mb-1">Куда ведёт</span>
        <div className="flex gap-2 mb-2">
          {([["question", "Вопрос"], ["resolution", "Цепочка"], ["none", "Никуда"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setKind(k)} className={`px-3 py-1.5 rounded-lg text-sm transition ${kind === k ? "btn-accent" : "border border-border text-muted hover:bg-background"}`}>{label}</button>
          ))}
        </div>
        {kind === "question" && (
          <select value={d.nextQuestionId ?? ""} onChange={(e) => setD({ ...d, nextQuestionId: Number(e.target.value) })} className={INPUT_CLS}>
            {questions.map((q) => <option key={q.id} value={q.id}>#{q.id} — {short(q.text, 50)}{q.isFirst === 1 ? " (стартовый)" : ""}</option>)}
          </select>
        )}
        {kind === "resolution" && (
          <select value={d.resolutionId ?? ""} onChange={(e) => setD({ ...d, resolutionId: Number(e.target.value) })} className={INPUT_CLS}>
            {resolutions.map((r) => <option key={r.id} value={r.id}>#{r.id} — {short(r.title, 50)}</option>)}
          </select>
        )}
        {kind === "none" && <div className="text-sm text-error">Тупик: после ответа диагностика завершится без результата.</div>}
      </div>
    </Modal>
  );
}

function ResolutionModal({ draft, onClose, onSave }: { draft: Partial<Res>; onClose: () => void; onSave: (d: Partial<Res>) => void }) {
  const [d, setD] = useState(draft);
  return (
    <Modal title={d.id ? `Цепочка #${d.id}` : "Новая цепочка"} onClose={onClose} onSave={() => onSave(d)}>
      <label className="block">
        <span className="block text-sm font-medium text-foreground mb-1">Краткое название</span>
        <input value={d.title ?? ""} onChange={(e) => setD({ ...d, title: e.target.value })} className={INPUT_CLS} placeholder="Проверка зарядки" autoFocus />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-foreground mb-1">Описание</span>
        <textarea value={d.description ?? ""} onChange={(e) => setD({ ...d, description: e.target.value })} rows={3} className={INPUT_CLS} placeholder="Проблема и суть решения…" />
      </label>
      <p className="text-xs text-muted">Шаги добавляются на карточке цепочки в списке справа.</p>
    </Modal>
  );
}

function StepModal({ draft, onClose, onSave }: { draft: Partial<Step>; onClose: () => void; onSave: (d: Partial<Step>) => void }) {
  const [d, setD] = useState(draft);
  return (
    <Modal title={d.id ? `Шаг #${d.id}` : "Новый шаг"} onClose={onClose} onSave={() => onSave(d)}>
      <label className="block">
        <span className="block text-sm font-medium text-foreground mb-1">Краткое название (бейдж «Шаг: …»)</span>
        <input value={d.title ?? ""} onChange={(e) => setD({ ...d, title: e.target.value || null })} className={INPUT_CLS} placeholder="Сброс питания" autoFocus />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-foreground mb-1">Текст шага (инструкция пользователю)</span>
        <textarea value={d.text ?? ""} onChange={(e) => setD({ ...d, text: e.target.value })} rows={4} className={INPUT_CLS} placeholder="Отключите зарядное устройство…" />
      </label>
      <p className="text-xs text-muted">«Не помогло» автоматически ведёт на следующий шаг; после последнего — предложение обратиться в СЦ.</p>
    </Modal>
  );
}
