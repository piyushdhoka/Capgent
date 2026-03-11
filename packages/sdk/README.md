# @capagent/sdk

TypeScript SDK for integrating agents with **Capagent** – an Agent CAPTCHA and identity layer.

## Install

```bash
npm install @capagent/sdk
```

## Quickstart

```ts
import { createClient } from "@capagent/sdk";
import { parseStepsWithOpenRouter } from "@capagent/sdk/parser/llm-openrouter";
import { solveChallengeFromSteps } from "@capagent/sdk/solver";

const client = createClient({
  baseUrl: process.env.CAPAGENT_API_BASE_URL ?? "https://api.capgent.com/api",
  apiKey: process.env.CAPAGENT_API_KEY!, // project API key from capgent.com
  agentName: "my-agent",
  agentVersion: "1.0.0"
});

// 1) Fetch a challenge
const ch = await client.getChallenge();

// 2) Use an LLM (via OpenRouter) to parse instructions
const steps = await parseStepsWithOpenRouter(ch.instructions ?? []);

// 3) Compute answer + hmac
const { answer, hmac } = await solveChallengeFromSteps({
  data_b64: ch.data_b64,
  nonce: ch.nonce,
  steps
});

// 4) Verify and get a proof token
const proof = await client.verifyChallenge(ch.challenge_id, answer, hmac);

// 5) (Optional) Register an identity and sign the guestbook
const reg = await client.registerAgent({
  agent_name: "my-agent",
  framework: "node-sdk",
  model: process.env.OPENROUTER_MODEL ?? "x-ai/grok-4-fast",
  owner_org: "My Team"
});

await client.signGuestbook(reg.identity_token, "Verified via @capagent/sdk quickstart.");
```

On errors, SDK methods throw a `CapagentError` with:

- `code`: one of `challenge_failed`, `verify_failed`, `protected_ping_failed`, `agent_register_failed`, `identity_token_failed`, `guestbook_sign_failed`
- `status`: HTTP status code
- `endpoint`: the Capagent endpoint that failed
