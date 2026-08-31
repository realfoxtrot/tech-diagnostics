import { eq } from "drizzle-orm";
import { db } from "@/db";
import { questions, questionOptions, resolutions, resolutionSteps } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";

export type Question = InferSelectModel<typeof questions>;
export type QuestionOption = InferSelectModel<typeof questionOptions>;
export type Resolution = InferSelectModel<typeof resolutions>;
export type ResolutionStep = InferSelectModel<typeof resolutionSteps>;

export type StepType = "question" | "resolution" | "done";

/** Рекомендация с её шагами траблшутинга (по порядку). */
export type ResolutionWithSteps = Resolution & { steps: ResolutionStep[] };

export interface StepResult {
  type: StepType;
  question?: Question & { options: QuestionOption[] };
  /** Тип «resolution» = показать шаговую рекомендацию. */
  resolution?: ResolutionWithSteps;
  /** Текущий шаг цепочки (для отображения «Шаг k из n»). */
  currentStepId?: number | null;
}

/** Получить стартовый вопрос дерева. */
export async function getStartQuestion() {
  const q = await db.query.questions.findFirst({
    where: eq(questions.isFirst, 1),
  });
  return q ?? null;
}

/** Получить вопрос с его опциями. */
export async function getQuestionWithOptions(id: number): Promise<StepResult["question"]> {
  const q = await db.query.questions.findFirst({
    where: eq(questions.id, id),
  });
  if (!q) return undefined;

  const opts = await db.query.questionOptions.findMany({
    where: eq(questionOptions.questionId, id),
    orderBy: (o, { asc }) => [asc(o.order)],
  });

  return { ...q, options: opts };
}

/** Получить рекомендацию с шагами (по порядку). */
export async function getResolutionWithSteps(id: number): Promise<ResolutionWithSteps | null> {
  const r = await db.query.resolutions.findFirst({
    where: eq(resolutions.id, id),
  });
  if (!r) return null;

  const steps = await db.query.resolutionSteps.findMany({
    where: eq(resolutionSteps.resolutionId, id),
    orderBy: (s, { asc }) => [asc(s.order)],
  });

  return { ...r, steps };
}

/** Получить шаг по id. */
export async function getResolutionStep(id: number): Promise<ResolutionStep | null> {
  return (await db.query.resolutionSteps.findFirst({ where: eq(resolutionSteps.id, id) })) ?? null;
}

/**
 * Обработать выбор опции: вернуть следующий шаг (вопрос или шаг-рекомендацию).
 * Опция ведёт либо на другой вопрос (nextQuestionId), либо на рекомендацию (resolutionId).
 */
export async function advanceFromOption(optionId: number): Promise<StepResult> {
  const opt = await db.query.questionOptions.findFirst({
    where: eq(questionOptions.id, optionId),
  });
  if (!opt) {
    return { type: "done" };
  }

  // Есть рекомендация → показываем первый шаг цепочки траблшутинга
  if (opt.resolutionId != null) {
    const resolution = await getResolutionWithSteps(opt.resolutionId);
    if (!resolution || resolution.steps.length === 0) return { type: "done" };
    return {
      type: "resolution",
      resolution,
      currentStepId: resolution.steps[0].id,
    };
  }

  // Есть следующий вопрос
  if (opt.nextQuestionId != null) {
    const question = await getQuestionWithOptions(opt.nextQuestionId);
    if (question) return { type: "question", question };
  }

  // Нет ни решения, ни вопроса — конец
  return { type: "done" };
}

/**
 * Обработать follow-up «не помогло»: вернуть СЛЕДУЮЩИЙ шаг цепочки.
 * Если nextStepId нет — null (конец цепочки → referral).
 */
export async function getNextStep(currentStepId: number): Promise<ResolutionStep | null> {
  const cur = await getResolutionStep(currentStepId);
  if (!cur?.nextStepId) return null;
  return getResolutionStep(cur.nextStepId);
}

/** Все категории вопросов (для админки). */
export async function getCategories() {
  const rows = await db
    .selectDistinct({ category: questions.category })
    .from(questions);
  return rows.map((r) => r.category).filter(Boolean) as string[];
}
