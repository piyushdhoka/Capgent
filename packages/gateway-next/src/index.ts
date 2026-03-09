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
  /**
   * How to respond when a request is unauthorized.
   * - "redirect" (default): redirect to redirectPath.
   * - "json": return a JSON error with Capagent metadata.
   * - "auto": redirect for non-API routes, JSON for paths starting with "/api".
   */
  unauthorizedMode?: "redirect" | "json" | "auto";
  /**
   * Optional hook to customize unauthorized behavior.
   * If provided, this is called instead of the built-in redirect/JSON handling.
   */
  onUnauthorized?: (req: NextRequest) => Response | Promise<Response>;
};

export function capagentMiddleware(options: CapagentMiddlewareOptions = {}) {
  const apiBase =
    options.apiBaseUrl ?? process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL ?? "http://127.0.0.1:8787";
  const protectedPrefixes = options.protectedPrefixes ?? ["/protected"];
  const redirectPath = options.redirectPath ?? "/playground";
  const unauthorizedMode = options.unauthorizedMode ?? "redirect";

  return async function middleware(req: NextRequest) {
    if (!protectedPrefixes.some((prefix) => req.nextUrl.pathname.startsWith(prefix))) {
      return NextResponse.next();
    }

    const token =
      req.cookies.get("capagent_proof")?.value ?? req.cookies.get("capagent_identity")?.value ?? "";
    if (!token) {
      if (options.onUnauthorized) return options.onUnauthorized(req);
      return handleUnauthorized(req, redirectPath, unauthorizedMode, apiBase);
    }

    const res = await fetch(`${apiBase}/api/protected/ping`, {
      headers: { authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (options.onUnauthorized) return options.onUnauthorized(req);
      return handleUnauthorized(req, redirectPath, unauthorizedMode, apiBase);
    }

    return NextResponse.next();
  };
}

function handleUnauthorized(
  req: NextRequest,
  redirectPath: string,
  mode: "redirect" | "json" | "auto",
  apiBaseUrl: string
): Response {
  const pathname = req.nextUrl.pathname;
  const effectiveMode =
    mode === "auto" ? (pathname.startsWith("/api") ? "json" : "redirect") : mode;

  if (effectiveMode === "json") {
    const body = {
      error: "capagent_required",
      message: "This endpoint is protected by Capagent Agent CAPTCHA.",
      capagent: {
        api_base_url: apiBaseUrl.replace(/\/+$/, ""),
        challenge_endpoint: "/api/challenge",
        verify_endpoint: "/api/verify/{challenge_id}",
        protected_ping_endpoint: "/api/protected/ping"
      }
    };

    const headers = new Headers({
      "content-type": "application/json",
      "www-authenticate": `Capagent realm="${req.nextUrl.hostname}" challenge_url="${apiBaseUrl.replace(
        /\/+$/,
        ""
      )}/api/challenge"`
    });

    return new Response(JSON.stringify(body), { status: 401, headers });
  }

  return NextResponse.redirect(new URL(redirectPath, req.url));
}

