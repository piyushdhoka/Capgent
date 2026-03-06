import { SignJWT, jwtVerify } from "jose";
import type { Env } from "../config";

export type ProofClaims = {
  typ: "capagent_proof";
  challenge_id: string;
  agent_name: string;
  agent_version: string;
};

function getKey(env: Env) {
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

