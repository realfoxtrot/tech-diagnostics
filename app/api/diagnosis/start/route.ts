import { NextResponse } from "next/server";
import { getStartQuestion, getQuestionWithOptions } from "@/lib/diagnosis";

export async function GET() {
  const q = await getStartQuestion();
  if (!q) {
    return NextResponse.json({ error: "Диагностика не настроена" }, { status: 500 });
  }
  const question = await getQuestionWithOptions(q.id);
  return NextResponse.json({ question });
}
