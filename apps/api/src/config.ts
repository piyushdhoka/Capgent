export type Env = {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  CAPAGENT_JWT_SECRET: string;
  CAPAGENT_CHALLENGE_TTL_SECONDS?: string;
  CAPAGENT_PROOF_TTL_SECONDS?: string;
  CAPAGENT_PUBLIC_BASE_URL?: string;
  CAPAGENT_CORS_ORIGINS?: string;
  CAPAGENT_FORCE_INMEMORY?: string;
};

export function getChallengeTtlSeconds(env: Env) {
  const raw = env.CAPAGENT_CHALLENGE_TTL_SECONDS ?? "30";
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 30;
  return Math.floor(n);
}

export function getProofTtlSeconds(env: Env) {
  const raw = env.CAPAGENT_PROOF_TTL_SECONDS ?? "300";
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 300;
  return Math.floor(n);
}

export function getCorsOrigins(env: Env): string[] {
  const raw = (env.CAPAGENT_CORS_ORIGINS ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function forceInMemory(env: Env) {
  return (env.CAPAGENT_FORCE_INMEMORY ?? "").trim() === "1";
}

