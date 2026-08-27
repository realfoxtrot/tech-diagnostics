import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.redirect(new URL("/admin/login", new URL("http://localhost:3000")));
  res.cookies.set("admin_auth", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
