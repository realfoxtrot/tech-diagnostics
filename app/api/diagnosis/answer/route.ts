import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, questionOptions, questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { advanceFromOption, getNextStep, getResolutionWithSteps } from "@/lib/diagnosis";

// Генерация человекочитаемого номера обращения
function makeTicketNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TD-${ymd}-${rand}`;
}

type TranscriptEntry = {
  type: "answer" | "resolution" | "followup";
  questionId?: number | null;
  question?: string;
  answer?: string;
  optionId?: number;
  resolutionId?: number | null;
  resolutionTitle?: string | null;
  stepId?: number | null;
  stepText?: string | null;
  helped?: boolean;
  timestamp: string;
};

/** Записать в transcript ответ пользователя на вопрос (если вопрос есть). */
async function pushAnswerTranscript(transcript: TranscriptEntry[], questionId: number | null, opt: { label: string; id: number }) {
  const q = questionId
    ? await db.query.questions.findFirst({ where: eq(questions.id, questionId) })
    : null;
  transcript.push({
    type: "answer",
    questionId: q?.id ?? null,
    question: q?.text ?? "",
    answer: opt.label,
    optionId: opt.id,
    timestamp: new Date().toISOString(),
  });
}

/** Итоговое состояние: resolved_self | referral. `message` не в БД (нет такого столбца). */
function finish(outcome: "resolved_self" | "referral") {
  return {
    step: { type: "done" as const },
    outcome,
    message:
      outcome === "resolved_self"
        ? "Отлично! Проблема решена."
        : "Рекомендуем обратиться в сервисный центр.",
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { optionId, sessionId, helped } = body;

  // ── Создание сессии (первый шаг) ─────────────────────────────
  if (!sessionId) {
    if (typeof optionId !== "number") {
      return NextResponse.json({ error: "optionId required" }, { status: 400 });
    }
    const opt = await db.query.questionOptions.findFirst({
      where: eq(questionOptions.id, optionId),
    });
    if (!opt) return NextResponse.json({ error: "option not found" }, { status: 404 });

    const ticketNumber = makeTicketNumber();
    const [sess] = await db
      .insert(sessions)
      .values({
        ticketNumber,
        transcript: [],
        outcome: "pending",
      })
      .returning();

    const step = await advanceFromOption(optionId);

    const transcript: TranscriptEntry[] = [];
    await pushAnswerTranscript(transcript, opt.questionId, opt);
    if (step.type === "resolution" && step.resolution && step.currentStepId != null) {
      const cur = step.resolution.steps.find((s) => s.id === step.currentStepId) ?? null;
      transcript.push({
        type: "resolution",
        resolutionId: step.resolution.id,
        resolutionTitle: step.resolution.title,
        stepId: cur?.id ?? null,
        stepText: cur?.text ?? null,
        timestamp: new Date().toISOString(),
      });
      await db
        .update(sessions)
        .set({
          diagnosis: {
            category: null,
            resolutionId: step.resolution.id,
            resolutionTitle: step.resolution.title,
            stepId: cur?.id ?? null,
          },
          transcript,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sessions.id, sess.id));
    } else {
      await db
        .update(sessions)
        .set({ transcript, updatedAt: new Date().toISOString() })
        .where(eq(sessions.id, sess.id));
    }

    return NextResponse.json({ sessionId: sess.id, ticketNumber, step });
  }

  // ── Продолжение сессии ───────────────────────────────────────
  const sess = await db.query.sessions.findFirst({
    where: eq(sessions.id, Number(sessionId)),
  });
  if (!sess) return NextResponse.json({ error: "session not found" }, { status: 404 });

  const transcript = (sess.transcript ?? []) as TranscriptEntry[];
  const diagnosis = (sess.diagnosis ?? {}) as {
    category?: string | null;
    resolutionId?: number | null;
    resolutionTitle?: string | null;
    stepId?: number | null;
    stepText?: string | null;
    stepNumber?: number;
    totalSteps?: number;
    outcome?: string;
  };

  // Follow-up: пользователь ответил «помогло» / «не помогло» на текущий шаг
  if (typeof helped === "boolean") {
    const curStepId = diagnosis.stepId ?? null;

    if (helped) {
      transcript.push({
        type: "followup",
        resolutionId: diagnosis.resolutionId ?? null,
        resolutionTitle: diagnosis.resolutionTitle ?? null,
        stepId: curStepId,
        helped: true,
        timestamp: new Date().toISOString(),
      });
      await db
        .update(sessions)
        .set({
          outcome: "resolved_self",
          diagnosis: { ...diagnosis, outcome: "resolved_self" },
          transcript,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sessions.id, sess.id));
      return NextResponse.json(finish("resolved_self"));
    }

    // «Не помогло» → следующий шаг цепочки (если есть)
    if (curStepId != null) {
      const nextStep = await getNextStep(curStepId);
      if (nextStep) {
        transcript.push({
          type: "followup",
          resolutionId: diagnosis.resolutionId ?? null,
          resolutionTitle: diagnosis.resolutionTitle ?? null,
          stepId: curStepId,
          helped: false,
          timestamp: new Date().toISOString(),
        });
        const resolution = await getResolutionWithSteps(nextStep.resolutionId);
        if (resolution) {
          const idx = resolution.steps.findIndex((s) => s.id === nextStep.id);
          // фиксируем в истории НОВЫЙ шаг (карта траблшутинга)
          transcript.push({
            type: "resolution",
            resolutionId: diagnosis.resolutionId ?? nextStep.resolutionId,
            resolutionTitle: diagnosis.resolutionTitle ?? null,
            stepId: nextStep.id,
            stepText: nextStep.text,
            timestamp: new Date().toISOString(),
          });
          await db
            .update(sessions)
            .set({
              diagnosis: {
                ...diagnosis,
                stepId: nextStep.id,
                stepText: nextStep.text,
                stepNumber: idx + 1,
                totalSteps: resolution.steps.length,
              },
              transcript,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(sessions.id, sess.id));
          return NextResponse.json({
            step: {
              type: "resolution",
              resolution,
              currentStepId: nextStep.id,
            },
          });
        }
      }
    }

    // Цепочка закончилась → referral
    transcript.push({
      type: "followup",
      resolutionId: diagnosis.resolutionId ?? null,
      resolutionTitle: diagnosis.resolutionTitle ?? null,
      stepId: curStepId,
      helped: false,
      timestamp: new Date().toISOString(),
    });
    await db
      .update(sessions)
      .set({
        outcome: "referral",
        diagnosis: { ...diagnosis, outcome: "referral" },
        transcript,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, sess.id));
    return NextResponse.json(finish("referral"));
  }

  // Обычный шаг: выбор опции
  if (typeof optionId !== "number") {
    return NextResponse.json({ error: "optionId required" }, { status: 400 });
  }
  const opt = await db.query.questionOptions.findFirst({
    where: eq(questionOptions.id, optionId),
  });
  if (!opt) return NextResponse.json({ error: "option not found" }, { status: 404 });

  const step = await advanceFromOption(optionId);
  const newTranscript = [...transcript];
  await pushAnswerTranscript(newTranscript, opt.questionId, opt);

  // Для диагноза: запоминаем категорию, рекомендацию и ТЕКУЩИЙ шаг (для follow-up)
  let newDiagnosis: typeof diagnosis = { ...diagnosis };
  if (step.type === "resolution" && step.resolution && step.currentStepId != null) {
    const q = await db.query.questions.findFirst({ where: eq(questions.id, opt.questionId) });
    const cur = step.resolution.steps.find((s) => s.id === step.currentStepId) ?? null;
    newDiagnosis = {
      ...newDiagnosis,
      category: q?.category ?? newDiagnosis.category ?? null,
      resolutionId: step.resolution.id,
      resolutionTitle: step.resolution.title,
      stepId: cur?.id ?? null,
      stepText: cur?.text ?? null,
    };
    newTranscript.push({
      type: "resolution",
      resolutionId: step.resolution.id,
      resolutionTitle: step.resolution.title,
      stepId: cur?.id ?? null,
      stepText: cur?.text ?? null,
      timestamp: new Date().toISOString(),
    });
  }

  await db
    .update(sessions)
    .set({
      transcript: newTranscript,
      diagnosis: newDiagnosis,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sessions.id, sess.id));

  return NextResponse.json({ step });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("sessionId");
  if (!id) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  const sess = await db.query.sessions.findFirst({
    where: eq(sessions.id, Number(id)),
  });
  if (!sess) return NextResponse.json({ error: "session not found" }, { status: 404 });
  return NextResponse.json({ session: sess });
}
