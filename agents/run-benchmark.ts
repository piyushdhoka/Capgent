import { createClient } from "@capagent/sdk";
import { solveChallengeFromSteps } from "@capagent/sdk/solver";
import { parseStepsWithOpenRouter } from "@capagent/sdk/parser/llm-openrouter";

type BenchmarkOptions = {
  runs: number;
  modelId?: string;
  framework: string;
  agentName: string;
  agentVersion: string;
  baseUrl: string;
};

function parseArgs(argv: string[]): BenchmarkOptions {
  const args = new Map<string, string>();
  for (let i = 2; i < argv.length; i++) {
    const part = argv[i]!;
    if (!part.startsWith("--")) continue;
    const [key, value] = part.slice(2).split("=");
    if (key) args.set(key, value ?? "true");
  }

  const runs = Number(args.get("runs") ?? "10");
  const modelId = args.get("model") ?? process.env.OPENROUTER_MODEL;
  const framework = args.get("framework") ?? "node-sdk";
  const agentName = args.get("agent") ?? "capgent-benchmark-agent";
  const agentVersion = args.get("agentVersion") ?? "0.0.1";
  const baseUrl = process.env.CAPAGENT_API_BASE_URL ?? "http://127.0.0.1:8787";

  return {
    runs: Number.isFinite(runs) && runs > 0 ? runs : 10,
    modelId: modelId || undefined,
    framework,
    agentName,
    agentVersion,
    baseUrl
  };
}

async function runBenchmark(opts: BenchmarkOptions) {
  const client = createClient({
    baseUrl: opts.baseUrl,
    agentName: opts.agentName,
    agentVersion: opts.agentVersion
  });

  const durations: number[] = [];
  let successes = 0;

  for (let i = 0; i < opts.runs; i++) {
    const start = performance.now();
    try {
      const ch = await client.getChallenge();
      const steps = await parseStepsWithOpenRouter(ch.instructions ?? [], {
        model: opts.modelId
      });
      const { answer, hmac } = await solveChallengeFromSteps({
        data_b64: ch.data_b64,
        nonce: ch.nonce,
        steps
      });
      await client.verifyChallenge(ch.challenge_id, answer, hmac);
      const end = performance.now();
      durations.push(end - start);
      successes++;
    } catch (err) {
      console.error("benchmark_run_error", { run: i + 1, error: String(err) });
    }
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const avgMs = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const p95Index = sorted.length ? Math.floor(sorted.length * 0.95) - 1 : -1;
  const p95Ms = p95Index >= 0 ? sorted[p95Index] : 0;

  const body = {
    model_id: opts.modelId ?? "default-openrouter-model",
    framework: opts.framework,
    agent_name: opts.agentName,
    agent_version: opts.agentVersion,
    runs: opts.runs,
    successes,
    avg_ms: Number(avgMs.toFixed(2)),
    p95_ms: Number(p95Ms.toFixed(2))
  };

  const res = await fetch(`${opts.baseUrl}/api/benchmarks/report`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`failed to report benchmark: ${res.status} ${text}`);
  }
  const json = await res.json();
  return { ...json, local: body };
}

async function main() {
  const opts = parseArgs(process.argv);
  const result = await runBenchmark(opts);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

