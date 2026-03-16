import { SignJWT, jwtVerify } from "jose";
import type { Env } from "../config";

export type ProofClaims = {
  typ: "capagent_proof";
  challenge_id: string;
  agent_name: string;
  agent_version: string;
};

export type AgentIdentityClaims = {
  typ: "capagent_identity";
  agent_id: string;
  agent_name: string;
  framework?: string;
  model?: string;
  owner_org?: string;
  capability_score?: number;
  safety_score?: number;
  last_verified?: string | null;
};

function getKey(env: Env) {
  if (!env.CAPAGENT_JWT_SECRET) {
    throw new Error("❌ [Auth] CAPAGENT_JWT_SECRET is not set in environment.");
  }
  return new TextEncoder().encode(env.CAPAGENT_JWT_SECRET);
}

export async function signProofJwt(env: Env, claims: ProofClaims, ttlSeconds: number) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const jwt = await new SignJWT(claims as any)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setSubject(claims.agent_name)
    .setAudience(env.CAPAGENT_PUBLIC_BASE_URL ?? "capagent")
    .setIssuer("capagent")
    .sign(getKey(env));

  return { jwt, exp };
}

export async function verifyProofJwt(env: Env, token: string) {
  const { payload } = await jwtVerify(token, getKey(env), {
    issuer: "capagent",
    audience: env.CAPAGENT_PUBLIC_BASE_URL ?? "capagent"
  });
  return payload as any;
}

export async function signIdentityJwt(env: Env, claims: AgentIdentityClaims, ttlSeconds: number) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const jwt = await new SignJWT(claims as any)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setSubject(claims.agent_id)
    .setAudience(env.CAPAGENT_PUBLIC_BASE_URL ?? "capagent")
    .setIssuer("capagent")
    .sign(getKey(env));

  return { jwt, exp };
}

export async function verifyIdentityJwt(env: Env, token: string) {
  const { payload } = await jwtVerify(token, getKey(env), {
    issuer: "capagent",
    audience: env.CAPAGENT_PUBLIC_BASE_URL ?? "capagent"
  });
  if (payload.typ !== "capagent_identity") {
    throw new Error("invalid_identity_token_type");
  }
  return payload as any;
}


