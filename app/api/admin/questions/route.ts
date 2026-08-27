import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, unauthorized } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const rows = await db.query.questions.findMany({
    orderBy: (q, { asc }) => [asc(q.order), asc(q.id)],
  });
  return NextResponse.json({ questions: rows });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json();
  const [row] = await db.insert(questions).values({
    text: body.text ?? "",
    category: body.category ?? null,
    isFirst: body.isFirst ? 1 : 0,
    order: body.order ?? 0,
  }).returning();
  return NextResponse.json({ question: row });
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.update(questions).set({
    text: body.text,
    category: body.category ?? null,
    isFirst: body.isFirst ? 1 : 0,
    order: body.order ?? 0,
    updatedAt: new Date().toISOString(),
  }).where(eq(questions.id, body.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(questions).where(eq(questions.id, id));
  return NextResponse.json({ ok: true });
}
