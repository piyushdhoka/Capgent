import type { NextRequest } from "next/server";
import { capagentMiddleware } from "@capagent/gateway-next";

const middlewareImpl = capagentMiddleware({
  protectedPrefixes: ["/protected"]
});

export function middleware(req: NextRequest) {
  return middlewareImpl(req);
}

export const config = {
  matcher: ["/protected/:path*"]
};

