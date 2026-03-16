import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.SESSION_SECRET) {
  throw new Error("❌ [Middleware] SESSION_SECRET is not set. Please add it to your .env file.");
}

const JWT_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);


const PROTECTED_PREFIXES = ["/protected", "/dashboard"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip if not protected
  if (!PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Handle /dashboard (Manual Session)
  if (pathname.startsWith("/dashboard")) {
    const session = req.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      await jwtVerify(session, JWT_SECRET);
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 3. Handle /protected (Legacy/External)
  const token =
    req.cookies.get("capagent_proof")?.value ??
    req.cookies.get("capagent_identity")?.value ??
    "";

  if (!token) {
    return NextResponse.redirect(new URL("/playground", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/protected/:path*", "/dashboard/:path*"],
};
