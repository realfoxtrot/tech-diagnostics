import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, questionOptions, questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { advanceFromOption } from "@/lib/diagnosis";

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
    const final = helped
      ? { outcome: "resolved_self", message: "Отлично! Проблема решена." }
      : { outcome: "referral", message: "Рекомендуем обратиться в сервисный центр." };
    await db
      .update(sessions)
      .set({
        ...final,
        transcript: [...transcript, { type: "followup", helped, timestamp: new Date().toISOString() }],
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
  if (step.type === "resolution" && step.resolution) {
    diagnosis = {
      ...diagnosis,
      category: q?.category ?? null,
      resolutionId: step.resolution.id,
      resolutionTitle: step.resolution.title,
    };
  }

  await db
    .update(sessions)
    .set({
      transcript: [
        ...transcript,
        {
          type: "answer",
          questionId: q?.id ?? null,
          question: q?.text ?? "",
          answer: opt.label,
          optionId: opt.id,
          timestamp: new Date().toISOString(),
        },
      ],
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
