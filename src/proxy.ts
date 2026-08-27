import { NextResponse } from "next/server";
import type { NextFetchEvent, NextProxy, NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { verifyAdminSession, ADMIN_COOKIE_NAME } from "./lib/admin-session";

// .auth é uma função polimórfica (também usada como `await auth()` nos server
// components) — o tipo não tem uma sobrecarga explícita pra uso direto como
// proxy, mas em runtime se comporta exatamente como NextProxy (era isso que
// `export default NextAuth(authConfig).auth` já fazia antes deste arquivo
// ganhar lógica própria pro /admin).
const tenantProxy = NextAuth(authConfig).auth as unknown as NextProxy;

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token || !(await verifyAdminSession(token))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  return tenantProxy(request, event);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest|icons|icon|apple-icon|admin-manifest).*)"],
};
