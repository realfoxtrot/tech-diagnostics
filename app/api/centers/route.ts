import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  const centers = await db.query.serviceCenters.findMany({
    where: (sc, { eq }) => eq(sc.isActive, 1),
    orderBy: (sc, { asc }) => [asc(sc.name)],
  });
  return NextResponse.json({ centers });
}
