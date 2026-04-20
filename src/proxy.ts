import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: middleware.ts is deprecated, use proxy.ts
// The function export is named `proxy` (was `middleware`)
export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const method = req.method;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    (pathname.startsWith("/api/bookings") && method === "POST") ||
    (pathname.startsWith("/api/saved") &&
      (method === "POST" || method === "DELETE")) ||
    (pathname.startsWith("/api/reviews") && method === "POST") ||
    (pathname.startsWith("/api/properties") && method === "POST");

  if (isProtected && !req.auth) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
