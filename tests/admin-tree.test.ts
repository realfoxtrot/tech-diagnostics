import { describe, expect, it } from "vitest";
import { normalizeChain, swapWithNeighbor, reachableQuestions } from "@/lib/admin-tree";

describe("normalizeChain", () => {
  it("перенумеровывает порядок и строит связь nextStepId", () => {
    const { chain } = normalizeChain([
      { id: 30, order: 3 },
      { id: 10, order: 1 },
      { id: 20, order: 2 },
    ]);
    expect(chain.map((s) => s.id)).toEqual([10, 20, 30]);
    expect(chain.map((s) => s.order)).toEqual([1, 2, 3]);
    expect(chain.map((s) => s.nextStepId)).toEqual([20, 30, null]);
  });

  it("один шаг — nextStepId null", () => {
    const { chain } = normalizeChain([{ id: 5, order: 1 }]);
    expect(chain).toEqual([{ id: 5, order: 1, nextStepId: null }]);
  });

  it("пустая цепочка", () => {
    const { chain, updates } = normalizeChain([]);
    expect(chain).toEqual([]);
    expect(updates).toEqual([]);
  });

  it("stable-сортировка по id при равных order", () => {
    const { chain } = normalizeChain([
      { id: 9, order: 1 },
      { id: 4, order: 1 },
    ]);
    expect(chain.map((s) => s.id)).toEqual([4, 9]);
  });

  it("updates покрывают все шаги", () => {
    const { updates } = normalizeChain([
      { id: 1, order: 1 },
      { id: 2, order: 2 },
    ]);
    expect(updates).toEqual([
      { id: 1, order: 1, nextStepId: 2 },
      { id: 2, order: 2, nextStepId: null },
    ]);
  });
});

describe("swapWithNeighbor", () => {
  const steps = [
    { id: 1, order: 1 },
    { id: 2, order: 2 },
    { id: 3, order: 3 },
  ];

  it("двигает шаг вверх и переназначает order", () => {
    const res = swapWithNeighbor(steps, 2, -1);
    expect(res.map((s) => s.id)).toEqual([2, 1, 3]);
    expect(res.map((s) => s.order)).toEqual([1, 2, 3]);
  });

  it("двигает шаг вниз", () => {
    const res = swapWithNeighbor(steps, 2, 1);
    expect(res.map((s) => s.id)).toEqual([1, 3, 2]);
  });

  it("первый вверх — без изменений", () => {
    expect(swapWithNeighbor(steps, 1, -1).map((s) => s.id)).toEqual([1, 2, 3]);
  });

  it("последний вниз — без изменений", () => {
    expect(swapWithNeighbor(steps, 3, 1).map((s) => s.id)).toEqual([1, 2, 3]);
  });

  it("не мутирует вход", () => {
    swapWithNeighbor(steps, 1, 1);
    expect(steps.map((s) => s.id)).toEqual([1, 2, 3]);
  });
});

describe("reachableQuestions", () => {
  it("BFS от стартового через опции", () => {
    const questions = [
      { id: 1, isFirst: 1 },
      { id: 2, isFirst: 0 },
      { id: 3, isFirst: 0 },
      { id: 4, isFirst: 0 },
    ];
    const options = [
      { questionId: 1, nextQuestionId: 2 },
      { questionId: 2, nextQuestionId: 3 },
      { questionId: 2, nextQuestionId: null }, // → цепочка
      { questionId: 3, nextQuestionId: 2 }, // цикл
    ];
    const reach = reachableQuestions(questions, options);
    expect(reach.has(1)).toBe(true);
    expect(reach.has(2)).toBe(true);
    expect(reach.has(3)).toBe(true);
    expect(reach.has(4)).toBe(false);
  });

  it("несколько стартовых", () => {
    const questions = [
      { id: 1, isFirst: 1 },
      { id: 2, isFirst: 1 },
    ];
    const reach = reachableQuestions(questions, []);
    expect([...reach].sort()).toEqual([1, 2]);
  });
});
