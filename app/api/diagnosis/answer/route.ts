import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, questionOptions, questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { advanceFromOption, getNextResolution } from "@/lib/diagnosis";

// Генерация человекочитаемого номера обращения
function makeTicketNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TD-${ymd}-${rand}`;
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
    return NextResponse.json({ sessionId: sess.id, ticketNumber, step });
  }

  // ── Продолжение сессии ───────────────────────────────────────
  const sess = await db.query.sessions.findFirst({
    where: eq(sessions.id, Number(sessionId)),
  });
  if (!sess) return NextResponse.json({ error: "session not found" }, { status: 404 });

  const transcript = (sess.transcript ?? []) as unknown[];

  // Follow-up: пользователь ответил "помогло"/"не помогло"
  if (typeof helped === "boolean") {
    // К какой рекомендации относится follow-up (последняя в истории)
    const lastResolutionId = (sess.diagnosis as { resolutionId?: number } | null)?.resolutionId ?? null;
    const lastResolutionTitle = (sess.diagnosis as { resolutionTitle?: string } | null)?.resolutionTitle ?? null;
    const fuEntry = {
      type: "followup",
      helped,
      resolutionId: lastResolutionId,
      resolutionTitle: lastResolutionTitle,
      timestamp: new Date().toISOString(),
    };

    if (helped) {
      const final = { outcome: "resolved_self", message: "Отлично! Проблема решена." };
      await db
        .update(sessions)
        .set({
          ...final,
          transcript: [...transcript, fuEntry],
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sessions.id, sess.id));
      return NextResponse.json({ step: { type: "done" }, ...final });
    }

    // "Не помогло" → следующая рекомендация из цепочки (если есть)
    if (lastResolutionId != null) {
      const next = await getNextResolution(lastResolutionId);
      if (next) {
        await db
          .update(sessions)
          .set({
            diagnosis: { ...(sess.diagnosis ?? {}), resolutionId: next.id, resolutionTitle: next.title },
            transcript: [...transcript, fuEntry],
            updatedAt: new Date().toISOString(),
          })
          .where(eq(sessions.id, sess.id));
        return NextResponse.json({
          step: { type: "resolution", resolution: next, followUp: next.needsFollowUp === 1 },
        });
      }
    }

    // Цепочка закончилась → referral
    const final = { outcome: "referral", message: "Рекомендуем обратиться в сервисный центр." };
    await db
      .update(sessions)
      .set({
        ...final,
        transcript: [...transcript, fuEntry],
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, sess.id));
    return NextResponse.json({ step: { type: "done" }, ...final });
  }

  // Обычный шаг: выбор опции
  if (typeof optionId !== "number") {
    return NextResponse.json({ error: "optionId required" }, { status: 400 });
  }
  const opt = await db.query.questionOptions.findFirst({
    where: eq(questionOptions.id, optionId),
  });
  if (!opt) return NextResponse.json({ error: "option not found" }, { status: 404 });

  const q = await db.query.questions.findFirst({
    where: eq(questions.id, opt.questionId),
  });

  const step = await advanceFromOption(optionId);

  // Для диагноза: запоминаем категорию и решение (если пришли к нему)
  let diagnosis = sess.diagnosis ?? {};
  const newTranscript = [...transcript];
  // Сначала фиксируем ответ пользователя на вопрос
  newTranscript.push({
    type: "answer",
    questionId: q?.id ?? null,
    question: q?.text ?? "",
    answer: opt.label,
    optionId: opt.id,
    timestamp: new Date().toISOString(),
  });
  // Затем — рекомендацию (если она есть): полный текст в карте
  if (step.type === "resolution" && step.resolution) {
    diagnosis = {
      ...diagnosis,
      category: q?.category ?? null,
      resolutionId: step.resolution.id,
      resolutionTitle: step.resolution.title,
    };
    newTranscript.push({
      type: "resolution",
      resolutionId: step.resolution.id,
      title: step.resolution.title,
      description: step.resolution.description,
      steps: step.resolution.steps ?? [],
      timestamp: new Date().toISOString(),
    });
  }

  await db
    .update(sessions)
    .set({
      transcript: newTranscript,
      diagnosis,
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
