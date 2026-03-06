import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./config";
import {
  allowPublicRegistration,
  forceInMemory,
  getAdminApiKey,
  getChallengeTtlSeconds,
  getCorsOrigins,
  getIdentityTtlSeconds,
  getProofTtlSeconds
} from "./config";
import { generateChallenge } from "./challenge/generate";
import type { StoredChallenge } from "./challenge/types";
import { applySteps, hmacSha256Hex, sha256Hex } from "./challenge/eval";
import { canUseRedis, createRedis } from "./storage/redis";
import { createInMemoryStore, createRedisStore } from "./storage/store";
import { AgentIdentityClaims, signIdentityJwt, signProofJwt, verifyIdentityJwt, verifyProofJwt } from "./auth/jwt";
import type { AgentRecord } from "./identity/store";
import { getAgentById, revokeAgent, saveAgent } from "./identity/store";
import type { GuestbookEntry } from "./guestbook/store";
import { addGuestbookEntry, getGuestbookEntries } from "./guestbook/store";

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

type AgentRegisterRequest = {
  agent_name?: string;
  framework?: string;
  model?: string;
  owner_org?: string;
};

type AgentTokenRequest = {
  agent_id?: string;
  agent_secret?: string;
  proof_token?: string;
};

async function sha256HexOfString(input: string) {
  const bytes = new TextEncoder().encode(input);
  return sha256Hex(bytes);
}

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

app.post("/api/agents/register", async (c) => {
  if (!allowPublicRegistration(c.env)) {
    const adminKey = getAdminApiKey(c.env);
    const header = c.req.header("x-capagent-admin-key") ?? "";
    if (!adminKey || header !== adminKey) {
      return c.json({ error: "admin_key_required" }, 401);
    }
  }

  const body = (await c.req.json().catch(() => null)) as AgentRegisterRequest | null;
  const name = body?.agent_name?.trim();
  if (!name) return c.json({ error: "missing_agent_name" }, 400);

  const now = new Date().toISOString();
  const agentId = crypto.randomUUID();
  const secretRaw = crypto.randomUUID().replace(/-/g, "");
  const secretHash = await sha256HexOfString(`${agentId}:${secretRaw}`);

  const agent: AgentRecord = {
    agent_id: agentId,
    agent_name: name,
    framework: body?.framework?.trim() || undefined,
    model: body?.model?.trim() || undefined,
    owner_org: body?.owner_org?.trim() || undefined,
    created_at: now,
    capability_score: null,
    safety_score: null,
    last_verified: null,
    revoked_at: null,
    secret_hash: secretHash
  };

  await saveAgent(c.env, agent);

  const identityTtl = getIdentityTtlSeconds(c.env);
  const claims: AgentIdentityClaims = {
    typ: "capagent_identity",
    agent_id: agent.agent_id,
    agent_name: agent.agent_name,
    framework: agent.framework,
    model: agent.model,
    owner_org: agent.owner_org,
    capability_score: agent.capability_score ?? undefined,
    safety_score: agent.safety_score ?? undefined,
    last_verified: agent.last_verified ?? null
  };
  const { jwt, exp } = await signIdentityJwt(c.env, claims, identityTtl);

  return c.json({
    agent_id: agentId,
    agent_secret: secretRaw,
    identity_token: jwt,
    identity_expires_at: new Date(exp * 1000).toISOString()
  });
});

app.post("/api/agents/token", async (c) => {
  const body = (await c.req.json().catch(() => null)) as AgentTokenRequest | null;
  if (!body?.agent_id || !body?.agent_secret) {
    return c.json({ error: "missing_agent_credentials" }, 400);
  }

  const agent = (await getAgentById(c.env, body.agent_id)) ?? null;
  if (!agent) return c.json({ error: "agent_not_found" }, 404);
  if (agent.revoked_at) return c.json({ error: "agent_revoked" }, 403);

  const expectedHash = agent.secret_hash;
  const providedHash = await sha256HexOfString(`${agent.agent_id}:${body.agent_secret}`);
  if (!constantTimeEqualHex(expectedHash, providedHash)) {
    return c.json({ error: "invalid_agent_secret" }, 401);
  }

  let lastVerified = agent.last_verified ?? null;

  if (body.proof_token) {
    try {
      const proof = await verifyProofJwt(c.env, body.proof_token);
      if (typeof proof.challenge_id !== "string") {
        throw new Error("invalid_proof_payload");
      }
      lastVerified = new Date().toISOString();
      agent.last_verified = lastVerified;
      await saveAgent(c.env, agent);
    } catch {
      return c.json({ error: "invalid_proof_token" }, 401);
    }
  }

  const identityTtl = getIdentityTtlSeconds(c.env);
  const claims: AgentIdentityClaims = {
    typ: "capagent_identity",
    agent_id: agent.agent_id,
    agent_name: agent.agent_name,
    framework: agent.framework,
    model: agent.model,
    owner_org: agent.owner_org,
    capability_score: agent.capability_score ?? undefined,
    safety_score: agent.safety_score ?? undefined,
    last_verified: lastVerified
  };
  const { jwt, exp } = await signIdentityJwt(c.env, claims, identityTtl);

  return c.json({ token: jwt, expires_at: new Date(exp * 1000).toISOString() });
});

app.post("/api/agents/refresh", async (c) => {
  const auth = c.req.header("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!token) return c.json({ error: "missing_bearer_token" }, 401);

  let claims: AgentIdentityClaims;
  try {
    claims = (await verifyIdentityJwt(c.env, token)) as AgentIdentityClaims;
  } catch {
    return c.json({ error: "invalid_identity_token" }, 401);
  }

  const agent = (await getAgentById(c.env, claims.agent_id)) ?? null;
  if (!agent) return c.json({ error: "agent_not_found" }, 404);
  if (agent.revoked_at) return c.json({ error: "agent_revoked" }, 403);

  const identityTtl = getIdentityTtlSeconds(c.env);
  const nextClaims: AgentIdentityClaims = {
    typ: "capagent_identity",
    agent_id: agent.agent_id,
    agent_name: agent.agent_name,
    framework: agent.framework,
    model: agent.model,
    owner_org: agent.owner_org,
    capability_score: agent.capability_score ?? claims.capability_score,
    safety_score: agent.safety_score ?? claims.safety_score,
    last_verified: agent.last_verified ?? claims.last_verified ?? null
  };
  const { jwt, exp } = await signIdentityJwt(c.env, nextClaims, identityTtl);

  return c.json({ token: jwt, expires_at: new Date(exp * 1000).toISOString() });
});

app.post("/api/agents/revoke", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { agent_id?: string } | null;
  if (!body?.agent_id) return c.json({ error: "missing_agent_id" }, 400);

  const updated = await revokeAgent(c.env, body.agent_id);
  if (!updated) return c.json({ error: "agent_not_found" }, 404);

  return c.json({ ok: true, revoked_at: updated.revoked_at });
});

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
    const proof = await verifyProofJwt(c.env, token);
    return c.json({ ok: true, type: "proof", claims: proof });
  } catch {
    try {
      const identity = await verifyIdentityJwt(c.env, token);
      return c.json({ ok: true, type: "identity", claims: identity });
    } catch {
      return c.json({ error: "invalid_token" }, 401);
    }
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

app.post("/api/guestbook/sign", async (c) => {
  const auth = c.req.header("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!token) return c.json({ error: "missing_bearer_token" }, 401);

  let claims: AgentIdentityClaims;
  try {
    claims = (await verifyIdentityJwt(c.env, token)) as AgentIdentityClaims;
  } catch {
    return c.json({ error: "invalid_identity_token" }, 401);
  }

  const body = (await c.req.json().catch(() => null)) as { message?: string } | null;
  const message = body?.message?.trim();
  if (!message) return c.json({ error: "missing_message" }, 400);
  if (message.length > 500) return c.json({ error: "message_too_long" }, 400);

  const now = new Date().toISOString();
  const entry: GuestbookEntry = {
    id: crypto.randomUUID(),
    agent_id: claims.agent_id,
    agent_name: claims.agent_name,
    framework: claims.framework,
    model: claims.model,
    owner_org: claims.owner_org,
    message,
    created_at: now
  };

  await addGuestbookEntry(c.env, entry);
  return c.json({ ok: true, entry });
});

app.get("/api/guestbook", async (c) => {
  const entries = await getGuestbookEntries(c.env);
  return c.json({ entries });
});

export default app;

