import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceCenters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, unauthorized } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const rows = await db.query.serviceCenters.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
  });
  return NextResponse.json({ centers: rows });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json();
  const [row] = await db.insert(serviceCenters).values({
    name: body.name ?? "",
    address: body.address ?? "",
    phone: body.phone ?? null,
    email: body.email ?? null,
    website: body.website ?? null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    isActive: body.isActive === false ? 0 : 1,
  }).returning();
  return NextResponse.json({ center: row });
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.update(serviceCenters).set({
    name: body.name,
    address: body.address,
    phone: body.phone ?? null,
    email: body.email ?? null,
    website: body.website ?? null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    isActive: body.isActive === false ? 0 : 1,
  }).where(eq(serviceCenters.id, body.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(serviceCenters).where(eq(serviceCenters.id, id));
  return NextResponse.json({ ok: true });
}
