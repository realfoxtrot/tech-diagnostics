import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions, questionOptions, resolutions, resolutionSteps } from "@/db/schema";
import { asc } from "drizzle-orm";
import { isAdmin, unauthorized } from "@/lib/admin-auth";

/** Полный слепок дерева диагностики для визуального редактора админки. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const [qs, opts, ress, steps] = await Promise.all([
    db.select().from(questions).orderBy(asc(questions.order), asc(questions.id)),
    db.select().from(questionOptions).orderBy(asc(questionOptions.order), asc(questionOptions.id)),
    db.select().from(resolutions).orderBy(asc(resolutions.id)),
    db.select().from(resolutionSteps).orderBy(asc(resolutionSteps.order), asc(resolutionSteps.id)),
  ]);
  return NextResponse.json({ questions: qs, options: opts, resolutions: ress, steps });
}
