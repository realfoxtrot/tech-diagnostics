import { NextResponse } from "next/server";
import { db } from "@/db";
import { warrantyChecks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, unauthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const rows = await db.query.warrantyChecks.findMany({
    orderBy: (c, { desc }) => [desc(c.createdAt), desc(c.id)],
    limit: 200,
  });
  return NextResponse.json({ checks: rows });
}

/**
 * PUT { id, status?, messages?, result? }
 * `messages` дописывается к существующему result (не затирает
 * vendorMessages/localErrors/covered).
 */
export async function PUT(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await db.query.warrantyChecks.findFirst({ where: eq(warrantyChecks.id, id) });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const patch: { status?: string; result?: unknown } = {};
  if (body.status) patch.status = body.status;
  if (Array.isArray(body.messages)) {
    const prev = (existing.result ?? {}) as Record<string, unknown>;
    patch.result = { ...prev, adminMessages: body.messages };
  } else if (typeof body.result === "object" && body.result) {
    patch.result = body.result;
  }
  await db.update(warrantyChecks).set(patch as never).where(eq(warrantyChecks.id, id));
  return NextResponse.json({ ok: true });
}
