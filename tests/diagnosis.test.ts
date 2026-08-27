import { describe, it, expect, beforeAll } from "vitest";
import { advanceFromOption, getStartQuestion, getQuestionWithOptions, getNextResolution } from "@/lib/diagnosis";

describe("diagnosis engine", () => {
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
    // берём первую опцию — «Не заряжается»
    const opt = q!.options[0];
    const step = await advanceFromOption(opt.id);
    expect(["question", "resolution"]).toContain(step.type);
  });

  it("решение приходит с шагами и follow-up", async () => {
    // Категория «Нет звука» → «Звук пропал полностью» → решение
    const start = await getStartQuestion();
    const q = await getQuestionWithOptions(start!.id);
    const soundOpt = q!.options.find((o) => o.label.toLowerCase().includes("звук"))!;
    const step1 = await advanceFromOption(soundOpt.id);
    expect(step1.type).toBe("question");
    const q2 = await getQuestionWithOptions(step1.question!.id);
    const opt2 = q2!.options[0];
    const step2 = await advanceFromOption(opt2.id);
    expect(step2.type).toBe("resolution");
    expect(step2.resolution!.title).toBeTruthy();
    expect(step2.followUp).toBe(true);
  });

  it("несуществующая опция → done", async () => {
    const step = await advanceFromOption(99999);
    expect(step.type).toBe("done");
  });

  it("«не помогло» ведёт к следующей рекомендации по цепочке", async () => {
    // Категория «Питание» → «Совсем не заряжается» → первая рекомендация
    const start = await getStartQuestion();
    const q = await getQuestionWithOptions(start!.id);
    const powerOpt = q!.options.find((o) => o.label.toLowerCase().includes("заряжается"))!;
    const step1 = await advanceFromOption(powerOpt.id);
    expect(step1.type).toBe("question");
    const q2 = await getQuestionWithOptions(step1.question!.id);
    const opt2 = q2!.options.find((o) => o.label.toLowerCase().includes("совсем"))!;
    const step2 = await advanceFromOption(opt2.id);
    expect(step2.type).toBe("resolution");
    expect(step2.resolution!.nextResolutionId).toBeTruthy();

    // «не помогло» → следующая рекомендация
    const next = await getNextResolution(step2.resolution!.id);
    expect(next).toBeTruthy();
    expect(next!.title).not.toBe(step2.resolution!.title);
  });

  it("конец цепочки: у последней рекомендации нет nextResolutionId", async () => {
    const start = await getStartQuestion();
    const q = await getQuestionWithOptions(start!.id);
    const powerOpt = q!.options.find((o) => o.label.toLowerCase().includes("заряжается"))!;
    const step1 = await advanceFromOption(powerOpt.id);
    const q2 = await getQuestionWithOptions(step1.question!.id);
    const opt2 = q2!.options.find((o) => o.label.toLowerCase().includes("совсем"))!;
    const step2 = await advanceFromOption(opt2.id);
    const next = await getNextResolution(step2.resolution!.id);
    expect(next!.nextResolutionId).toBeNull();
  });
});
