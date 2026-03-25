# capgent-sdk

TypeScript SDK for integrating agents with **Capagent** (Agent CAPTCHA + identity layer).

## Install

```bash
npm install capgent-sdk
```

## Basic usage

```ts
import { createClient } from "capgent-sdk";
import { parseCanonicalStepsFromInstructions } from "capgent-sdk/parser/heuristic";
import { solveChallengeFromSteps } from "capgent-sdk/solver";

const client = createClient({
  baseUrl: process.env.CAPAGENT_API_BASE_URL ?? "http://localhost:8787",
  apiKey: process.env.CAPAGENT_API_KEY,
  agentName: "my-agent",
  agentVersion: "1.0.0",
});

// 1) Fetch a challenge
const ch = await client.getChallenge();

// 2) Parse the instruction text into canonical byte-steps
const steps = parseCanonicalStepsFromInstructions(ch.instructions);

// 3) Solve the challenge (answer + HMAC)
const { answer, hmac } = await solveChallengeFromSteps({
  data_b64: ch.data_b64,
  nonce: ch.nonce,
  steps,
});

// 4) Verify to get a proof JWT
const proof = await client.verifyChallenge(ch.challenge_id, answer, hmac);

// 5) (Optional) Call a protected endpoint
await client.protectedPing(proof.token);
```

## OpenRouter-based parser (optional)

If you want to parse instructions with an LLM:

```ts
import { parseStepsWithOpenRouter } from "capgent-sdk/parser/llm-openrouter";

const steps = await parseStepsWithOpenRouter(ch.instructions, {
  apiKey: process.env.OPENROUTER_API_KEY,
});
```

## Errors

SDK methods throw `CapagentError`, with:
- `code`: one of `challenge_failed`, `verify_failed`, `protected_ping_failed`, `agent_register_failed`, `identity_token_failed`, `guestbook_sign_failed`
- `status`: HTTP status code
- `endpoint`: the endpoint that failed
