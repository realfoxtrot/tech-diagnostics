import { NextResponse } from "next/server";

export function isAdmin(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/admin_auth=([^;]+)/);
  return match?.[1] === (process.env.ADMIN_PASSWORD ?? "");
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
