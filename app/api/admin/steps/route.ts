import { NextResponse } from "next/server";
import { db } from "@/db";
import { resolutionSteps } from "@/db/schema";
import { asc, eq, max } from "drizzle-orm";
import { isAdmin, unauthorized } from "@/lib/admin-auth";
import { normalizeChain, swapWithNeighbor } from "@/lib/admin-tree";

/**
 * Шаги цепочек рекомендаций. После любой мутации цепочка пересобирается:
 * order = 1..n, nextStepId = следующий шаг («не помогло» →), последний — null.
 */

async function relink(resolutionId: number) {
  const steps = await db
    .select({ id: resolutionSteps.id, order: resolutionSteps.order })
    .from(resolutionSteps)
    .where(eq(resolutionSteps.resolutionId, resolutionId))
    .orderBy(asc(resolutionSteps.order), asc(resolutionSteps.id));
  const { updates } = normalizeChain(steps.map((s) => ({ id: s.id, order: s.order ?? 0 })));
  for (const u of updates) {
    await db.update(resolutionSteps).set({ order: u.order, nextStepId: u.nextStepId }).where(eq(resolutionSteps.id, u.id));
  }
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json();
  if (!body.resolutionId) return NextResponse.json({ error: "resolutionId required" }, { status: 400 });
  const [{ maxOrder }] = await db
    .select({ maxOrder: max(resolutionSteps.order) })
    .from(resolutionSteps)
    .where(eq(resolutionSteps.resolutionId, body.resolutionId));
  const [row] = await db.insert(resolutionSteps).values({
    resolutionId: body.resolutionId,
    title: body.title ?? null,
    text: body.text ?? "",
    order: (maxOrder ?? 0) + 1,
  }).returning();
  await relink(body.resolutionId);
  return NextResponse.json({ step: row });
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const cur = await db.query.resolutionSteps.findFirst({ where: eq(resolutionSteps.id, body.id) });
  if (!cur) return NextResponse.json({ error: "not found" }, { status: 404 });

  const patch: Partial<typeof resolutionSteps.$inferInsert> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.text !== undefined) patch.text = body.text;
  if (Object.keys(patch).length) {
    await db.update(resolutionSteps).set(patch).where(eq(resolutionSteps.id, body.id));
  }
  if (body.move === -1 || body.move === 1) {
    const steps = await db
      .select({ id: resolutionSteps.id, order: resolutionSteps.order })
      .from(resolutionSteps)
      .where(eq(resolutionSteps.resolutionId, cur.resolutionId));
    const swapped = swapWithNeighbor(
      steps.map((s) => ({ id: s.id, order: s.order ?? 0 })),
      body.id,
      body.move,
    );
    const { updates } = normalizeChain(swapped);
    for (const u of updates) {
      await db.update(resolutionSteps).set({ order: u.order, nextStepId: u.nextStepId }).where(eq(resolutionSteps.id, u.id));
    }
  } else {
    await relink(cur.resolutionId);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const cur = await db.query.resolutionSteps.findFirst({ where: eq(resolutionSteps.id, id) });
  if (!cur) return NextResponse.json({ ok: true });
  await db.delete(resolutionSteps).where(eq(resolutionSteps.id, id));
  await relink(cur.resolutionId);
  return NextResponse.json({ ok: true });
}
