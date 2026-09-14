/**
 * Хелперы визуального редактора дерева диагностики (админка).
 * Чистые функции — покрываются тестами.
 */

export interface ChainStepRef {
  id: number;
  order: number;
}

export interface NormalizedStep extends ChainStepRef {
  order: number;
  nextStepId: number | null;
}

/**
 * Пересобрать цепочку шагов по порядку:
 * order = 1..n (стабильная сортировка по order, затем id),
 * nextStepId = id следующего шага, у последнего — null.
 * Возвращает полную цепочку и список обновлений для БД (применяются целиком).
 */
export function normalizeChain(steps: ChainStepRef[]): {
  chain: NormalizedStep[];
  updates: Array<{ id: number; order: number; nextStepId: number | null }>;
} {
  const sorted = [...steps].sort((a, b) => a.order - b.order || a.id - b.id);
  const chain: NormalizedStep[] = sorted.map((s, i) => ({
    ...s,
    order: i + 1,
    nextStepId: sorted[i + 1]?.id ?? null,
  }));
  const updates = chain.map(({ id, order, nextStepId }) => ({ id, order, nextStepId }));
  return { chain, updates };
}

/** Перестановка шага с соседом (для «вверх/вниз»); order переназначается по позиции. */
export function swapWithNeighbor(steps: ChainStepRef[], id: number, dir: -1 | 1): ChainStepRef[] {
  const sorted = [...steps].sort((a, b) => a.order - b.order || a.id - b.id);
  const i = sorted.findIndex((s) => s.id === id);
  if (i === -1) return sorted.map((s, idx) => ({ ...s, order: idx + 1 }));
  const j = i + dir;
  if (j < 0 || j >= sorted.length) return sorted.map((s, idx) => ({ ...s, order: idx + 1 }));
  [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  return sorted.map((s, idx) => ({ ...s, order: idx + 1 }));
}

/** BFS достижимости вопросов от стартового по связям опций. */
export function reachableQuestions(
  questions: Array<{ id: number; isFirst: number }>,
  options: Array<{ questionId: number; nextQuestionId: number | null }>,
): Set<number> {
  const starts = questions.filter((q) => q.isFirst === 1).map((q) => q.id);
  const edges = new Map<number, number[]>();
  for (const o of options) {
    if (o.nextQuestionId == null) continue;
    const list = edges.get(o.questionId) ?? [];
    list.push(o.nextQuestionId);
    edges.set(o.questionId, list);
  }
  const seen = new Set<number>();
  const queue = [...starts];
  while (queue.length) {
    const cur = queue.shift()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const next of edges.get(cur) ?? []) queue.push(next);
  }
  return seen;
}
