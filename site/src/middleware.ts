import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, ADMIN_COOKIE } from "./lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  // login page is public
  if (req.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifySessionToken(token);
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
