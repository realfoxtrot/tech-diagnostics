import { eq } from "drizzle-orm";
import { db } from "@/db";
import { questions, questionOptions, resolutions } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";

export type Question = InferSelectModel<typeof questions>;
export type QuestionOption = InferSelectModel<typeof questionOptions>;
export type Resolution = InferSelectModel<typeof resolutions>;

export type StepType = "question" | "resolution" | "done";

export interface StepResult {
  type: StepType;
  question?: Question & { options: (QuestionOption & { resolution?: Resolution | null })[] };
  resolution?: Resolution;
  /** Завершено: запросить подтверждение "помогло ли" (для resolution) */
  followUp?: boolean;
}

/** Получить стартовый вопрос дерева. */
export async function getStartQuestion() {
  const q = await db.query.questions.findFirst({
    where: eq(questions.isFirst, 1),
  });
  return q ?? null;
}

/** Получить вопрос с его опциями и связанными решениями. */
export async function getQuestionWithOptions(id: number): Promise<StepResult["question"]> {
  const q = await db.query.questions.findFirst({
    where: eq(questions.id, id),
  });
  if (!q) return undefined;

  const opts = await db.query.questionOptions.findMany({
    where: eq(questionOptions.questionId, id),
    orderBy: (o, { asc }) => [asc(o.order)],
  });

  // подтягиваем решения для опций
  const options = [];
  for (const o of opts) {
    let resolution = null;
    if (o.resolutionId != null) {
      resolution = await db.query.resolutions.findFirst({
        where: eq(resolutions.id, o.resolutionId),
      });
    }
    options.push({ ...o, resolution });
  }

  return { ...q, options };
}

/** Обработать выбор опции: вернуть следующий шаг (вопрос или решение). */
export async function advanceFromOption(optionId: number): Promise<StepResult> {
  const opt = await db.query.questionOptions.findFirst({
    where: eq(questionOptions.id, optionId),
  });
  if (!opt) {
    return { type: "done" };
  }

  // Есть решение → показываем траблшутинг
  if (opt.resolutionId != null) {
    const resolution = await db.query.resolutions.findFirst({
      where: eq(resolutions.id, opt.resolutionId),
    });
    if (!resolution) return { type: "done" };
    return {
      type: "resolution",
      resolution,
      followUp: resolution.needsFollowUp === 1,
    };
  }

  // Есть следующий вопрос
  if (opt.nextQuestionId != null) {
    const question = await getQuestionWithOptions(opt.nextQuestionId);
    return { type: "question", question };
  }

  // Нет ни решения, ни вопроса — конец
  return { type: "done" };
}

/** Получить решение по id (например, "помогло" / "не помогло" из follow-up). */
export async function getResolutionById(id: number) {
  return db.query.resolutions.findFirst({ where: eq(resolutions.id, id) });
}

/**
 * Обработать follow-up "не помогло": вернуть СЛЕДУЮЩУЮ рекомендацию из цепочки.
 * Если nextResolutionId нет — вернуть null (конец цепочки → referral).
 */
export async function getNextResolution(currentId: number) {
  const cur = await getResolutionById(currentId);
  if (!cur?.nextResolutionId) return null;
  return getResolutionById(cur.nextResolutionId);
}

/** Все категории вопросов (для админки). */
export async function getCategories() {
  const rows = await db
    .selectDistinct({ category: questions.category })
    .from(questions);
  return rows.map((r) => r.category).filter(Boolean) as string[];
}
