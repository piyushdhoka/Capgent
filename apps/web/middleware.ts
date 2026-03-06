import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL || "http://127.0.0.1:8787";

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/protected")) return NextResponse.next();

  const token = req.cookies.get("capagent_proof")?.value;
  if (!token) return NextResponse.redirect(new URL("/playground", req.url));

  // MVP approach: ask Capagent API to validate the proof token.
  // In production, you might verify locally (shared secret/public key), depending on your trust boundary.
  const res = await fetch(`${API_BASE}/api/protected/ping`, {
    headers: { authorization: `Bearer ${token}` }
  });

  if (!res.ok) return NextResponse.redirect(new URL("/playground", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/protected/:path*"]
};

