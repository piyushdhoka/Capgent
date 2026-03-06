import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export type CapagentMiddlewareOptions = {
  apiBaseUrl?: string;
  /**
   * Path prefixes that should require a valid Capagent token.
   * Example: ["/protected", "/api/agents-only"].
   */
  protectedPrefixes?: string[];
  /**
   * Where to send users/agents when they are not verified.
   * Defaults to "/playground".
   */
  redirectPath?: string;
};

export function capagentMiddleware(options: CapagentMiddlewareOptions = {}) {
  const apiBase =
    options.apiBaseUrl ?? process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL ?? "http://127.0.0.1:8787";
  const protectedPrefixes = options.protectedPrefixes ?? ["/protected"];
  const redirectPath = options.redirectPath ?? "/playground";

  return async function middleware(req: NextRequest) {
    if (!protectedPrefixes.some((prefix) => req.nextUrl.pathname.startsWith(prefix))) {
      return NextResponse.next();
    }

    const token =
      req.cookies.get("capagent_proof")?.value ?? req.cookies.get("capagent_identity")?.value ?? "";
    if (!token) {
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    const res = await fetch(`${apiBase}/api/protected/ping`, {
      headers: { authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    return NextResponse.next();
  };
}

