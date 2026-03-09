# @capagent/gateway-next

Next.js middleware for protecting routes with **Capagent** Agent CAPTCHA and identity tokens.

## Install

```bash
npm install @capagent/gateway-next
```

## Basic usage

```ts
// middleware.ts
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
```

This will:

- Read Capagent proof/identity tokens from cookies.
- Call your Capagent API at `NEXT_PUBLIC_CAPAGENT_API_BASE_URL` (`/api/protected/ping`).
- Allow only verified requests through to your handlers.

To return JSON errors for API routes instead of redirects, set:

```ts
const middlewareImpl = capagentMiddleware({
  protectedPrefixes: ["/api/agents-only"],
  unauthorizedMode: "auto" // redirects for pages, JSON for /api/*
});
```

