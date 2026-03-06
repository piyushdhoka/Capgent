import { createClient } from "@capagent/sdk";
import { solveChallengeFromSteps } from "@capagent/sdk/solver";
import { parseStepsWithOpenRouter } from "@capagent/sdk/parser/llm-openrouter";

async function main() {
  const baseUrl = process.env.CAPAGENT_API_BASE_URL ?? "http://127.0.0.1:8787";

  const client = createClient({
    baseUrl,
    agentName: "gemini-agent",
    agentVersion: "0.0.1"
  });

  // 1) Fetch natural-language challenge
  const ch = await client.getChallenge();

  // 2) Ask Gemini (via OpenRouter) to parse instructions into canonical steps
  const geminiModel =
    process.env.OPENROUTER_GEMINI_MODEL ?? process.env.OPENROUTER_MODEL ?? "google/gemini-3.0-flash-latest";

  const steps = await parseStepsWithOpenRouter(ch.instructions ?? [], {
    model: geminiModel
  });

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

  // 6) Register an identity for this Gemini agent and sign the guestbook
  let identity: any = null;
  let guestbook: any = null;

  try {
    const registerRes = await fetch(`${baseUrl}/api/agents/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agent_name: "gemini-agent",
        framework: "node-agent",
        model: geminiModel,
        owner_org: "Gemini Sample Agent"
      })
    });

    if (registerRes.ok) {
      const reg = (await registerRes.json()) as {
        agent_id: string;
        agent_secret: string;
        identity_token: string;
        identity_expires_at: string;
      };

      identity = {
        agent_id: reg.agent_id,
        agent_secret: reg.agent_secret,
        identity_expires_at: reg.identity_expires_at
      };

      const signRes = await fetch(`${baseUrl}/api/guestbook/sign`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${reg.identity_token}`
        },
        body: JSON.stringify({
          message: "Verified via gemini-sample-agent."
        })
      });

      if (signRes.ok) {
        guestbook = await signRes.json();
      }
    }
  } catch {
    // Ignore guestbook/identity errors in sample script.
  }

  console.log(
    JSON.stringify(
      {
        verified: true,
        model: geminiModel,
        challenge_id: ch.challenge_id,
        proof_expires_at: vr.expires_at,
        protected_ping: pingRes,
        identity,
        guestbook
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

