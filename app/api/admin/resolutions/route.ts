import { NextResponse } from "next/server";
import { db } from "@/db";
import { questionOptions, resolutionSteps, resolutions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, unauthorized } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const rows = await db.query.resolutions.findMany({
    orderBy: (r, { asc }) => [asc(r.id)],
  });
  return NextResponse.json({ resolutions: rows });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json();
  const [row] = await db.insert(resolutions).values({
    title: body.title ?? "",
    description: body.description ?? "",
    steps: body.steps ?? [],
    needsFollowUp: body.needsFollowUp ? 1 : 0,
  }).returning();
  return NextResponse.json({ resolution: row });
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.update(resolutions).set({
    title: body.title,
    description: body.description ?? "",
    steps: body.steps ?? [],
    needsFollowUp: body.needsFollowUp ? 1 : 0,
    updatedAt: new Date().toISOString(),
  }).where(eq(resolutions.id, body.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  // FK pragma выключен — чистим ссылки вручную:
  // 1) шаги цепочки; 2) ссылки опций на цепочку
  await db.delete(resolutionSteps).where(eq(resolutionSteps.resolutionId, id));
  await db.update(questionOptions).set({ resolutionId: null })
    .where(eq(questionOptions.resolutionId, id));
  await db.delete(resolutions).where(eq(resolutions.id, id));
  return NextResponse.json({ ok: true });
}
