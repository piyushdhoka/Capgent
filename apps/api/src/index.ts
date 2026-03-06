import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./config";
import { forceInMemory, getChallengeTtlSeconds, getCorsOrigins, getProofTtlSeconds } from "./config";
import { generateChallenge } from "./challenge/generate";
import type { StoredChallenge } from "./challenge/types";
import { applySteps, hmacSha256Hex, sha256Hex } from "./challenge/eval";
import { canUseRedis, createRedis } from "./storage/redis";
import { createInMemoryStore, createRedisStore } from "./storage/store";
import { signProofJwt, verifyProofJwt } from "./auth/jwt";

const app = new Hono<{ Bindings: Env }>();

type BenchmarkReport = {
  id: string;
  model_id: string;
  framework: string;
  agent_name: string;
  agent_version: string;
  runs: number;
  successes: number;
  avg_ms: number;
  p95_ms: number;
  created_at: string;
};

app.onError((err, c) => {
  console.error("capagent_error", err);
  return c.json({ error: "internal_error", message: err?.message ?? String(err) }, 500);
});

app.use("*", async (c, next) => {
  const allowList = getCorsOrigins(c.env);
  const origin = c.req.header("origin") ?? "";

  const corsMiddleware = cors({
    origin: (incoming) => {
      if (allowList.length === 0) return incoming; // permissive if not configured
      if (!incoming) return "";
      return allowList.includes(incoming) ? incoming : "";
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true
  });

  return corsMiddleware(c, next);
});

app.get("/health", (c) => c.json({ ok: true }));

app.post("/api/challenge", async (c) => {
  const body = (await c.req.json().catch(() => null)) as null | { agent_name?: string; agent_version?: string };
  const agentName = body?.agent_name?.trim() || "unknown-agent";
  const agentVersion = body?.agent_version?.trim() || "0";

  const challengeId = crypto.randomUUID();
  const gen = generateChallenge(challengeId);
  const ttl = getChallengeTtlSeconds(c.env);
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  const stored: StoredChallenge = {
    challenge_id: challengeId,
    issued_at: issuedAt,
    expires_at: expiresAt,
    nonce: gen.nonce,
    data_b64: gen.data_b64,
    steps: gen.steps,
    instructions: gen.instructions,
    agent_name: agentName,
    agent_version: agentVersion
  };

  const store = !forceInMemory(c.env) && canUseRedis(c.env) ? createRedisStore(createRedis(c.env)) : createInMemoryStore();
  await store.setJson(`challenge:${challengeId}`, stored, ttl);

  const includeSteps = c.req.query("debug_steps") === "1";
  return c.json({
    challenge_id: gen.challenge_id,
    nonce: gen.nonce,
    data_b64: gen.data_b64,
    instructions: gen.instructions,
    ...(includeSteps ? { steps: gen.steps } : {}),
    expires_at: expiresAt
  });
});

function constantTimeEqualHex(a: string, b: string) {
  const aa = a.trim().toLowerCase();
  const bb = b.trim().toLowerCase();
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa.charCodeAt(i) ^ bb.charCodeAt(i);
  return diff === 0;
}

app.post("/api/verify/:challengeId", async (c) => {
  const challengeId = c.req.param("challengeId");
  const store = !forceInMemory(c.env) && canUseRedis(c.env) ? createRedisStore(createRedis(c.env)) : createInMemoryStore();
  const stored = (await store.getJson<StoredChallenge>(`challenge:${challengeId}`)) ?? null;
  if (!stored) return c.json({ error: "challenge_not_found_or_expired" }, 404);
  if (!stored.nonce || stored.nonce.length < 2) return c.json({ error: "stored_nonce_missing" }, 500);

  const body = (await c.req.json().catch(() => null)) as null | {
    answer?: string;
    hmac?: string;
    agent_name?: string;
    agent_version?: string;
  };
  if (!body?.answer || !body?.hmac) return c.json({ error: "missing_answer_or_hmac" }, 400);

  const concat = applySteps(stored.data_b64, stored.steps);
  const expectedAnswer = await sha256Hex(concat);
  const expectedHmac = await hmacSha256Hex(stored.nonce, expectedAnswer);

  const okAnswer = constantTimeEqualHex(body.answer, expectedAnswer);
  const okHmac = constantTimeEqualHex(body.hmac, expectedHmac);
  if (!okAnswer || !okHmac) return c.json({ error: "invalid_solution" }, 401);

  await store.del(`challenge:${challengeId}`);

  const proofTtl = getProofTtlSeconds(c.env);
  const { jwt, exp } = await signProofJwt(
    c.env,
    {
      typ: "capagent_proof",
      challenge_id: challengeId,
      agent_name: body.agent_name?.trim() || stored.agent_name,
      agent_version: body.agent_version?.trim() || stored.agent_version
    },
    proofTtl
  );

  return c.json({ token: jwt, expires_at: new Date(exp * 1000).toISOString() });
});

app.get("/api/protected/ping", async (c) => {
  const auth = c.req.header("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!token) return c.json({ error: "missing_bearer_token" }, 401);
  try {
    const payload = await verifyProofJwt(c.env, token);
    return c.json({ ok: true, proof: payload });
  } catch {
    return c.json({ error: "invalid_token" }, 401);
  }
});

app.post("/api/benchmarks/report", async (c) => {
  const body = (await c.req.json().catch(() => null)) as null | {
    model_id?: string;
    framework?: string;
    agent_name?: string;
    agent_version?: string;
    runs?: number;
    successes?: number;
    avg_ms?: number;
    p95_ms?: number;
  };

  if (!body?.model_id || !body?.framework || !body?.runs || body.runs <= 0) {
    return c.json({ error: "invalid_benchmark_payload" }, 400);
  }

  const now = new Date().toISOString();
  const report: BenchmarkReport = {
    id: crypto.randomUUID(),
    model_id: String(body.model_id),
    framework: String(body.framework),
    agent_name: (body.agent_name ?? "unknown-agent").trim() || "unknown-agent",
    agent_version: (body.agent_version ?? "0.0.0").trim() || "0.0.0",
    runs: Number(body.runs),
    successes: Number(body.successes ?? 0),
    avg_ms: Number(body.avg_ms ?? 0),
    p95_ms: Number(body.p95_ms ?? 0),
    created_at: now
  };

  const store = !forceInMemory(c.env) && canUseRedis(c.env) ? createRedisStore(createRedis(c.env)) : createInMemoryStore();
  const key = "benchmarks:reports";
  const existing = (await store.getJson<BenchmarkReport[]>(key)) ?? [];
  const next = [report, ...existing].slice(0, 100);
  // keep for 30 days
  await store.setJson(key, next, 60 * 60 * 24 * 30);

  return c.json({ ok: true, report });
});

app.get("/api/benchmarks", async (c) => {
  const store = !forceInMemory(c.env) && canUseRedis(c.env) ? createRedisStore(createRedis(c.env)) : createInMemoryStore();
  const reports = (await store.getJson<BenchmarkReport[]>("benchmarks:reports")) ?? [];
  return c.json({ reports });
});

export default app;

