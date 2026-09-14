import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminToken, safeEqual } from "@/lib/admin-auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Старый адрес страницы гарантии → новый (постоянный редирект)
  if (pathname === "/garranty" || pathname.startsWith("/garranty/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/garranty/, "/warranty");
    return NextResponse.redirect(url, 308);
  }

  // Админка защищена паролем (кука = производный токен, не сам пароль)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const password = process.env.ADMIN_PASSWORD ?? "";
    const cookie = req.cookies.get("admin_auth")?.value ?? "";
    if (!password || !safeEqual(cookie, adminToken())) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/garranty/:path*"],
};
