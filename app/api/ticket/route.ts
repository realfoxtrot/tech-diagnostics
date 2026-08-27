import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Публичный доступ к карте диагностики по номеру обращения (или id)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticket = searchParams.get("ticket");
  const id = searchParams.get("id");

  let sess;
  if (ticket) {
    sess = await db.query.sessions.findFirst({
      where: eq(sessions.ticketNumber, ticket),
    });
  } else if (id) {
    sess = await db.query.sessions.findFirst({
      where: eq(sessions.id, Number(id)),
    });
  }
  if (!sess) {
    return NextResponse.json({ error: "Обращение не найдено" }, { status: 404 });
  }
  return NextResponse.json({ session: sess });
}
