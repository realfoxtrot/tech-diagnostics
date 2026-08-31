import { describe, it, expect, beforeAll } from "vitest";
import {
  getStartQuestion,
  getQuestionWithOptions,
  advanceFromOption,
  getNextStep,
  getResolutionWithSteps,
  type ResolutionStep,
} from "@/lib/diagnosis";

describe("diagnosis engine (step-based troubleshooting)", () => {
  beforeAll(async () => {
    // БД уже засеяна (db/seed.ts). Проверяем целостность.
    const start = await getStartQuestion();
    expect(start).toBeTruthy();
  });

  it("стартовый вопрос имеет опции", async () => {
    const start = await getStartQuestion();
    const q = await getQuestionWithOptions(start!.id);
    expect(q!.options.length).toBeGreaterThan(0);
  });

  it("выбор категории ведёт к следующему вопросу или решению", async () => {
    const start = await getStartQuestion();
    const q = await getQuestionWithOptions(start!.id);
    const step = await advanceFromOption(q!.options[0].id);
    expect(["question", "resolution"]).toContain(step.type);
  });

  it("опция с решением возвращает рекомендацию с шагами цепочки (текущий = первый шаг)", async () => {
    // «Нет звука / звук плохой» → «Звук пропал полностью» → цепочка
    const start = await getStartQuestion();
    const q = await getQuestionWithOptions(start!.id);
    const soundCat = q!.options.find((o) => o.label.toLowerCase().includes("звук"))!;
    const step1 = await advanceFromOption(soundCat.id);
    expect(step1.type).toBe("question");
    const q2 = await getQuestionWithOptions(step1.question!.id);
    const opt2 = q2!.options.find((o) => o.label.toLowerCase().includes("полностью"))!;
    const step2 = await advanceFromOption(opt2.id);
    expect(step2.type).toBe("resolution");
    expect(step2.resolution!.title).toBeTruthy();
    expect(step2.resolution!.steps.length).toBeGreaterThan(0);
    expect(step2.currentStepId).toBe(step2.resolution!.steps[0].id);
  });

  it("«не помогло» ведёт к следующему шагу цепочки", async () => {
    // «Не заряжается / проблемы с питанием» → «Совсем не заряжается»
    const start = await getStartQuestion();
    const q = await getQuestionWithOptions(start!.id);
    const powerCat = q!.options.find((o) => o.label.includes("заряжается"))!;
    const step1 = await advanceFromOption(powerCat.id);
    expect(step1.type).toBe("question");
    const q2 = await getQuestionWithOptions(step1.question!.id);
    const opt2 = q2!.options.find((o) => o.label.includes("Совсем"))!;
    const step2 = await advanceFromOption(opt2.id);
    expect(step2.type).toBe("resolution");
    const first = step2.resolution!.steps[0];
    expect(first.nextStepId).toBeTruthy();
    const next = await getNextStep(first.id);
    expect(next).toBeTruthy();
    expect(next!.id).toBe(first.nextStepId);
  });

  it("конец цепочки: у последнего шага nextStepId = null → getNextStep = null", async () => {
    const { db, schema } = await import("@/db");
    const resList = await db.select().from(schema.resolutions);
    const r = await getResolutionWithSteps(resList[resList.length - 1].id);
    expect(r).toBeTruthy();
    const lastStep = r!.steps[r!.steps.length - 1];
    expect(lastStep.nextStepId).toBeNull();
    expect(await getNextStep(lastStep.id)).toBeNull();
  });

  it("несуществующая опция → done", async () => {
    const step = await advanceFromOption(99999);
    expect(step.type).toBe("done");
  });

  it("все цепочки связаны корректно: без обрывов, без циклов, конец обрывается", async () => {
    const { db, schema } = await import("@/db");
    const resList = await db.select().from(schema.resolutions);
    expect(resList.length).toBeGreaterThanOrEqual(50);
    for (const res of resList) {
      const r = await getResolutionWithSteps(res.id);
      expect(r!.steps.length).toBeGreaterThanOrEqual(1);
      const collected: ResolutionStep[] = [];
      let current: ResolutionStep = r!.steps[0];
      while (true) {
        expect(collected.some((s) => s.id === current.id), `цикл в цепочке «${res.title}»`).toBe(false);
        collected.push(current);
        expect(collected.length).toBeLessThanOrEqual(20);
        const curId = current.id;
        // как на сервере: getNextStep(текущий шаг) → следующий шаг
        const nxt = await getNextStep(curId);
        if (!nxt) break; // конец цепочки
        expect(nxt.id).toBe(current.nextStepId);
        current = nxt;
      }
      // последовательность шагов = цепочка nextStepId
      const sorted = [...r!.steps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      for (let j = 0; j < sorted.length - 1; j++) {
        expect(sorted[j].nextStepId).toBe(sorted[j + 1].id);
      }
      expect(sorted[sorted.length - 1].nextStepId).toBeNull();
    }
  });
});
