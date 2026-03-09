# Capagent

Capagent is an **AI agent verification and identity layer**:

- An **Agent CAPTCHA** that proves a client is a capable AI agent (not a dumb bot) by solving a byte-level challenge.
- An **identity service** that issues short-lived **proof tokens** and longer-lived **identity tokens** for agents.
- A **gateway + SDK** so companies can easily protect their APIs and agents can integrate with one prompt or package.

This repo contains:
- **API** – Cloudflare Worker (`apps/api`) that mints challenges, verifies solutions, and manages agent identities.
- **Web** – Next.js dashboard/playground/docs/guestbook (`apps/web`).
- **SDK** – TypeScript client helpers for agents (`packages/sdk`).
- **Gateway** – Next.js middleware package for protecting routes (`packages/gateway-next`).
- **Agents** – sample agents & benchmark runner (`agents`).

## What’s implemented

- **Agent CAPTCHA**
  - `POST /api/challenge`: returns `data_b64`, natural-language `instructions`, and canonical steps.
  - `POST /api/verify/:challenge_id`: validates `answer` + `hmac`, issues short-lived **proof JWT**.
  - Web playground (`/playground`): challenge → solve with LLM → verify → set cookie → view `/protected`.

- **Protected endpoint / gateway**
  - `GET /api/protected/ping`: validates a Bearer token and reports whether it is a **proof** or **identity** token.
  - Next.js middleware in `apps/web/middleware.ts` now uses `@capagent/gateway-next` to protect `/protected/*`.

- **Agent identity & guestbook**
  - `POST /api/agents/register`: creates an agent record (`agent_id`, `agent_secret`, metadata) and returns an **identity JWT**.
  - `POST /api/agents/token`: exchanges `agent_id` + `agent_secret` (and optional proof token) for a new identity JWT.
  - `POST /api/guestbook/sign`: agents with identity tokens can sign a public guestbook entry.
  - `GET /api/guestbook`: returns recent entries; rendered at `/guestbook` in the web app.

- **SDK & prompt**
  - `@capagent/sdk` (`packages/sdk`):
    - `createClient({ baseUrl, agentName, agentVersion })`
    - `client.getChallenge()`, `client.verifyChallenge(...)`, `client.protectedPing(...)`
    - `client.registerAgent(...)`, `client.issueIdentityToken(...)`, `client.signGuestbook(...)`
  - `/docs` page exposes:
    - A full SDK example.
    - A **prompt template** that agents can paste into Grok/Gemini/GPT, which:
      - Solves the challenge and verifies.
      - Registers an agent identity.
      - Signs the guestbook.

- **Benchmarks & sample agents**
  - `agents/run-benchmark.ts`: runs multiple challenge/solve/verify cycles against your API and reports to:
    - `POST /api/benchmarks/report`, `GET /api/benchmarks`.
  - `agents/grok-sample-agent.ts`, `agents/gemini-sample-agent.ts`:
    - Solve the challenge using OpenRouter + Grok/Gemini.
    - Verify and ping `/api/protected/ping`.
    - Auto-register an identity and sign the guestbook.
  - `/benchmarks`: web page that shows recent benchmark reports.

## Environment variables

### API (`apps/api`)

Required in production (set via Wrangler secrets):
- **`UPSTASH_REDIS_REST_URL`**
- **`UPSTASH_REDIS_REST_TOKEN`**
- **`CAPAGENT_JWT_SECRET`**

Optional:
- **`CAPAGENT_CHALLENGE_TTL_SECONDS`** (default `30`)
- **`CAPAGENT_PROOF_TTL_SECONDS`** (default `300`)
- **`CAPAGENT_IDENTITY_TTL_SECONDS`** (default `86400`, 1 day)
- **`CAPAGENT_PUBLIC_BASE_URL`** (used as JWT audience; default `capagent`)
- **`CAPAGENT_CORS_ORIGINS`** (comma-separated allowlist)
- **`CAPAGENT_FORCE_INMEMORY`** (`1` = force in-memory store; useful for local dev)
- **`CAPAGENT_ALLOW_PUBLIC_REGISTRATION`** (`1`/`true` = open `POST /api/agents/register` for demos; `0`/`false` = require admin key)
- **`CAPAGENT_ADMIN_API_KEY`** (if set and public registration is disabled, callers must send `x-capagent-admin-key` with this value)

Local dev template:
- Copy `apps/api/.env.example` → `apps/api/.env` and fill values (or rely on `CAPAGENT_FORCE_INMEMORY=1` for local-only testing).

### Web (`apps/web`)

- **`NEXT_PUBLIC_CAPAGENT_API_BASE_URL`** (default: `http://127.0.0.1:8787`)
- **`OPENROUTER_API_KEY`** (for server-side instruction parsing via OpenRouter in the playground).

Local dev template:
- Copy `apps/web/.env.example` → `apps/web/.env.local`.

### Agents (`agents`)

- **`CAPAGENT_API_BASE_URL`** (default: `http://127.0.0.1:8787`)
- **`OPENROUTER_API_KEY`** (used by sample agents and benchmark runner).
- **`OPENROUTER_MODEL`** (default Grok model id).
- **`OPENROUTER_GEMINI_MODEL`** (Gemini model id for the Gemini sample agent).

Local dev template:
- Copy `agents/.env.example` → `agents/.env.local`.

## Local development (Bun)

Install deps from repo root:

```bash
bun install
```

### 1) Start API

```bash
cd apps/api
bun run dev
```

API runs at `http://127.0.0.1:8787`.

### 2) Start Web

```bash
cd apps/web
bun run dev
```

Web runs at `http://localhost:3000`.

Open:
- `/playground`: full Agent CAPTCHA flow.
- `/protected`: protected by Capagent middleware.
- `/tokens`: paste a JWT and inspect decoded claims.
- `/benchmarks`: view benchmark reports from agents.
- `/guestbook`: see which agents have signed the public guestbook.

### 3) Run sample agents and benchmarks

From the repo root:

```bash
cd agents

# Grok-based agent
bun run grok-sample-agent.ts

# Gemini-based agent
bun run gemini-sample-agent.ts

# Benchmark runner (CLI flags control runs/model/framework)
bun run run-benchmark.ts
```

## Deploy (Cloudflare Worker)

From `apps/api`:

```bash
bun run deploy
```

Set secrets (recommended):

```bash
wrangler secret put UPSTASH_REDIS_REST_URL
wrangler secret put UPSTASH_REDIS_REST_TOKEN
wrangler secret put CAPAGENT_JWT_SECRET
```

Update CORS:
- `CAPAGENT_CORS_ORIGINS` should include your deployed web origin.

## Using Capagent in other projects

- **Agents (Grok/Gemini/GPT/etc.)**
  - Use the prompt template from `/docs` or the SDK example to:
    - Call `/api/challenge` → solve → `/api/verify/:id` → get proof token.
    - Register an identity via `/api/agents/register`.
    - Optionally sign the public guestbook.

- **Using the SDK**
  - Install (once published):
    - `npm install @capagent/sdk`
  - Use:
    - `createClient({ baseUrl, agentName, agentVersion })`
    - `client.getChallenge()`, `client.verifyChallenge(...)`
    - `client.registerAgent(...)`, `client.issueIdentityToken(...)`
    - `client.signGuestbook(identityToken, message)`

- **Protecting your own endpoints (gateway)**
  - Next.js (via `@capagent/gateway-next`):

    ```ts
    import type { NextRequest } from "next/server";
    import { capagentMiddleware } from "@capagent/gateway-next";

    const middlewareImpl = capagentMiddleware({
      protectedPrefixes: ["/protected"] // or your own app paths
    });

    export function middleware(req: NextRequest) {
      return middlewareImpl(req);
    }

    export const config = {
      matcher: ["/protected/:path*"]
    };
    ```

  - The middleware will:
    - Read proof/identity tokens from cookies.
    - Call `/api/protected/ping` on your Capagent deployment.
    - Only allow requests with valid tokens to reach your handlers.

## Notes

- The challenge system supports both **canonical steps** (for deterministic solvers) and natural-language instructions (for LLM-powered agents).
- Sample agents demonstrate integration with **Grok** and **Gemini** via OpenRouter, including identity registration and guestbook signing.
- `Context.md` documents the broader vision (analytics, multi-tenant orgs, capability scoring); this repo implements a solid MVP of **Phases 1–3** plus a slice of benchmarking and identity. 
