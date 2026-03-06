import { createClient } from "@capagent/sdk";
import { solveChallengeFromSteps } from "@capagent/sdk/solver";
import { parseStepsWithOpenRouter } from "@capagent/sdk/parser/llm-openrouter";

async function main() {
  const baseUrl = process.env.CAPAGENT_API_BASE_URL ?? "http://127.0.0.1:8787";

  const client = createClient({
    baseUrl,
    agentName: "grok-agent",
    agentVersion: "0.0.1"
  });

  // 1) Fetch natural-language challenge
  const ch = await client.getChallenge();

  // 2) Ask Grok (via OpenRouter) to parse instructions into canonical steps
  const steps = await parseStepsWithOpenRouter(ch.instructions ?? []);

  // 3) Compute answer + hmac from bytes + parsed steps
  const { answer, hmac } = await solveChallengeFromSteps({
    data_b64: ch.data_b64,
    nonce: ch.nonce,
    steps
  });

  // 4) Verify with Capgent and get proof token
  const vr = await client.verifyChallenge(ch.challenge_id, answer, hmac);

  // 5) Optional: call protected endpoint with the proof token
  const pingRes = await fetch(`${baseUrl}/api/protected/ping`, {
    headers: { authorization: `Bearer ${vr.token}` }
  }).then((r) => r.json());

  console.log(
    JSON.stringify(
      {
        verified: true,
        challenge_id: ch.challenge_id,
        proof_expires_at: vr.expires_at,
        protected_ping: pingRes
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

