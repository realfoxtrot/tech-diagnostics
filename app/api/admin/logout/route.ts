import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // Редирект относительно адреса запроса (работает и на localhost,
  // и на tailnet-адресе http://100.64.0.2:3000).
  const res = NextResponse.redirect(new URL("/admin/login", req.url));
  res.cookies.set("admin_auth", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
