# Capagent (MVP)

Capagent is an **AI agent verification** layer: an Agent CAPTCHA that issues a short-lived **proof JWT** when a client successfully solves a byte-level challenge.

This repo contains a full-stack MVP:
- **API**: Cloudflare Worker (`apps/api`) that mints challenges and verifies solutions
- **Web**: Next.js dashboard/playground (`apps/web`)
- **SDK**: reusable client + solver helpers (`packages/sdk`)

## What’s implemented
- **POST** `/api/challenge`: returns `data_b64`, natural-language `instructions`, and canonical `steps` (MVP reliability)
- **POST** `/api/verify/:challenge_id`: validates `answer` + `hmac`, issues **proof JWT**
- **GET** `/api/protected/ping`: example protected endpoint (requires Bearer proof token)
- Web playground: request → solve demo → verify → set cookie → open `/protected`

## Environment variables

### API (`apps/api`)
Required in production (set via Wrangler secrets):
- **`UPSTASH_REDIS_REST_URL`**
- **`UPSTASH_REDIS_REST_TOKEN`**
- **`CAPAGENT_JWT_SECRET`**

Optional:
- **`CAPAGENT_CHALLENGE_TTL_SECONDS`** (default `30`)
- **`CAPAGENT_PROOF_TTL_SECONDS`** (default `300`)
- **`CAPAGENT_PUBLIC_BASE_URL`** (used as JWT audience; default `capagent`)
- **`CAPAGENT_CORS_ORIGINS`** (comma-separated allowlist)
- **`CAPAGENT_FORCE_INMEMORY`** (`1` = force in-memory store; useful for local dev)

Local dev templates:
- Copy `apps/api/.dev.vars.example` → `apps/api/.dev.vars` and fill values (or rely on `CAPAGENT_FORCE_INMEMORY=1` for local-only testing).

### Web (`apps/web`)
- **`NEXT_PUBLIC_CAPAGENT_API_BASE_URL`** (default: `http://127.0.0.1:8787`)

Local dev template:
- Copy `apps/web/.env.example` → `apps/web/.env.local`

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
- `/playground`: get challenge → solve (demo) → verify → proof JWT
- `/protected`: protected by Next.js middleware + proof cookie
- `/tokens`: paste a JWT and inspect decoded claims

### 3) Run sample agent client (Bun)

With the API running:

```bash
cd apps/api
bun run sample:verify
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

Then update CORS:
- `CAPAGENT_CORS_ORIGINS` should include your deployed web origin.

## Using in other projects

Install/use the SDK package (in-repo for MVP). The key pieces:
- `createClient({ baseUrl, agentName, agentVersion })`
- `withCapagentProof(token, init)` to attach the proof JWT
- `solveChallengeFromSteps({ data_b64, nonce, steps })` for canonical-step solving (MVP)

Gateway examples:
- Next.js middleware: `apps/web/middleware.ts`
- Express middleware: `examples/express-gateway.ts`

## Notes
- The MVP includes canonical `steps` alongside natural-language instructions so agents can solve deterministically.\n+  The next step (Phase 1.5) is adding an LLM parser so only natural language is required (similar to the inspiration: [`agent-captcha`](https://github.com/Dhravya/agent-captcha) and its live demo at [`agent-captcha.dhravya.dev`](https://agent-captcha.dhravya.dev/)).\n+
