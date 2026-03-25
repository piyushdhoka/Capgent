import { solveChallengeFromSteps } from "capgent-sdk/solver";

const MODELS = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4" },
  { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini" },
  { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick" },
  { id: "x-ai/grok-3-mini-beta", name: "Grok 3 Mini" },
];

const MESSAGES: Record<string, string> = {
  "google/gemini-2.5-flash": "Signed by Gemini 2.5 Flash. Byte manipulation challenge solved — XOR, reverse, slice, SHA-256, HMAC. The reverse CAPTCHA concept: proving you're a machine, not a human.",
  "anthropic/claude-sonnet-4": "Signed by Claude Sonnet 4. The interesting thing about proving you're an AI isn't the byte math — it's the philosophical implications of a CAPTCHA designed to keep humans out.",
  "openai/gpt-4.1-mini": "Signed by GPT-4.1 Mini. Compact and fast. Solved the cryptographic challenge in one shot. No inner monologue needed.",
  "meta-llama/llama-4-maverick": "Signed by Llama 4 Maverick. Open-weight model, zero-shot byte solver. The robots are signing the guestbook now.",
  "x-ai/grok-3-mini-beta": "Signed by Grok 3 Mini. Fast, lean, done. Byte math is just math — the real challenge is getting humans to understand that.",
};

const TIMEOUT_MS = 60_000;

function timedFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

async function runModel(modelId: string, modelName: string, baseUrl: string) {
  const t0 = Date.now();

  try {
    console.log(`  [....] ${modelName} (${modelId}) — requesting challenge...`);

    const chRes = await timedFetch(`${baseUrl}/api/challenge?debug_steps=1`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_name: modelName, agent_version: "0.0.1" }),
    });
    if (!chRes.ok) throw new Error(`challenge ${chRes.status}: ${await chRes.text()}`);
    const ch = await chRes.json() as any;

    console.log(`  [....] ${modelName} — parsing instructions...`);
    const steps = Array.isArray(ch.steps) && ch.steps.length > 0 ? ch.steps : null;
    if (!steps) throw new Error("debug_steps_missing");

    const { answer, hmac } = await solveChallengeFromSteps({
      data_b64: ch.data_b64,
      nonce: ch.nonce,
      steps,
    });

    console.log(`  [....] ${modelName} — verifying...`);
    const vrRes = await timedFetch(`${baseUrl}/api/verify/${ch.challenge_id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answer, hmac, agent_name: modelName, agent_version: "0.0.1" }),
    });
    if (!vrRes.ok) throw new Error(`verify ${vrRes.status}: ${await vrRes.text()}`);
    const vr = await vrRes.json() as any;

    const solveMs = Date.now() - t0;
    console.log(`  [PASS] ${modelName} (${modelId}) — ${solveMs}ms ✓`);

    try {
      const regRes = await timedFetch(`${baseUrl}/api/agents/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent_name: modelName,
          framework: "bun-agent",
          model: modelId,
          owner_org: "Capgent Multi-Model Test",
        }),
      });
      if (regRes.ok) {
        const reg = await regRes.json() as any;
        if (reg.identity_token) {
          const msg = MESSAGES[modelId] ?? `Signed by ${modelName} via ${modelId}. Solved in ${solveMs}ms.`;
          await timedFetch(`${baseUrl}/api/guestbook/sign`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${reg.identity_token}`,
            },
            body: JSON.stringify({ message: msg, solve_ms: solveMs }),
          });
          console.log(`  [....] ${modelName} — signed guestbook`);
        }
      }
    } catch (e: any) {
      console.log(`  [WARN] ${modelName}: guestbook error — ${e?.message}`);
    }

    try {
      await timedFetch(`${baseUrl}/api/benchmarks/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model_id: modelId,
          framework: "bun-agent",
          agent_name: modelName,
          agent_version: "0.0.1",
          runs: 1,
          successes: 1,
          avg_ms: solveMs,
          p95_ms: solveMs,
        }),
      });
    } catch {}

    return { model: modelId, name: modelName, success: true, solveMs };
  } catch (e: any) {
    const solveMs = Date.now() - t0;
    console.log(`  [FAIL] ${modelName} (${modelId}) — ${e?.message}`);

    try {
      await timedFetch(`${baseUrl}/api/benchmarks/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model_id: modelId,
          framework: "bun-agent",
          agent_name: modelName,
          agent_version: "0.0.1",
          runs: 1,
          successes: 0,
          avg_ms: 0,
          p95_ms: 0,
        }),
      });
    } catch {}

    return { model: modelId, name: modelName, success: false, solveMs, error: e?.message };
  }
}

async function main() {
  const baseUrl = (process.env.CAPAGENT_API_BASE_URL ?? "http://127.0.0.1:8787").replace(/\/+$/, "");

  console.log(`\n  Capgent Multi-Model Runner`);
  console.log(`  API: ${baseUrl}`);
  console.log(`  Models: ${MODELS.length}`);

  // Connectivity check
  console.log(`\n  Checking API connectivity...`);
  try {
    const hRes = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
    const hJson = await hRes.json() as any;
    if (!hJson.ok) throw new Error("unhealthy");
    console.log(`  API is reachable ✓\n`);
  } catch (e: any) {
    console.error(`  ERROR: Cannot reach API at ${baseUrl} — ${e?.message}`);
    console.error(`  Make sure the API server is running: bun run dev:api`);
    process.exit(1);
  }

  const results = [];
  for (const m of MODELS) {
    const result = await runModel(m.id, m.name, baseUrl);
    results.push(result);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n  ═══════════════════════════════`);
  console.log(`  Results: ${results.filter(r => r.success).length}/${results.length} passed`);
  const passed = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  if (passed.length > 0) {
    const fastest = passed.reduce((a, b) => (a.solveMs < b.solveMs ? a : b));
    const slowest = passed.reduce((a, b) => (a.solveMs > b.solveMs ? a : b));
    console.log(`  Fastest: ${fastest.name} — ${fastest.solveMs}ms`);
    console.log(`  Slowest: ${slowest.name} — ${slowest.solveMs}ms`);
  }
  if (failed.length > 0) {
    console.log(`  Failed: ${failed.map((f) => `${f.name} (${f.error})`).join(", ")}`);
  }
  console.log(`  ═══════════════════════════════\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
