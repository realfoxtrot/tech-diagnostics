import { NextResponse } from "next/server";
import { db } from "@/db";
import { questionOptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, unauthorized } from "@/lib/admin-auth";

/** Опции-ответы вопросов: создание/редактирование цели перехода, удаление. */

export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json();
  if (!body.questionId) return NextResponse.json({ error: "questionId required" }, { status: 400 });
  const resolutionId = body.resolutionId ?? null;
  const nextQuestionId = resolutionId ? null : (body.nextQuestionId ?? null);
  const [row] = await db.insert(questionOptions).values({
    questionId: body.questionId,
    label: body.label ?? "",
    nextQuestionId,
    resolutionId,
    order: body.order ?? 0,
  }).returning();
  return NextResponse.json({ option: row });
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const resolutionId = body.resolutionId ?? null;
  const nextQuestionId = resolutionId ? null : (body.nextQuestionId ?? null);
  await db.update(questionOptions).set({
    label: body.label ?? "",
    nextQuestionId,
    resolutionId,
    ...(body.order !== undefined ? { order: body.order } : {}),
  }).where(eq(questionOptions.id, body.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(questionOptions).where(eq(questionOptions.id, id));
  return NextResponse.json({ ok: true });
}
