import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL || "http://127.0.0.1:8787";

const PROTECTED_PREFIXES = ["/protected"];

export async function middleware(req: NextRequest) {
  if (!PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get("capagent_proof")?.value ??
    req.cookies.get("capagent_identity")?.value ??
    "";

  if (!token) {
    return NextResponse.redirect(new URL("/playground", req.url));
  }

  try {
    const res = await fetch(`${API_BASE}/api/protected/ping`, {
      headers: { authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/playground", req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/playground", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/protected/:path*"],
};
