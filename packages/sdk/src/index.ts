export type ChallengeResponse = {
  challenge_id: string;
  nonce: string;
  data_b64: string;
  instructions: string[];
  expires_at: string;
  steps?: unknown[]; // optional debug-only
};

export type VerifyResponse = {
  token: string;
  expires_at: string;
};

export type ProofToken = {
  token: string;
  expires_at: string;
};

export type CapagentClientOptions = {
  baseUrl: string;
  agentName: string;
  agentVersion: string;
};

export function withCapagentProof(token: string, init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${token}`);
  return { ...init, headers };
}

export function decodeJwtClaims(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("invalid jwt");
  const payload = parts[1]!;
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((payload.length + 3) % 4);
  const json =
    typeof atob === "function"
      ? new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)))
      : Buffer.from(padded, "base64").toString("utf8");
  return JSON.parse(json);
}

export function createClient(opts: CapagentClientOptions) {
  const baseUrl = opts.baseUrl.replace(/\/+$/, "");

  return {
    async getChallenge(): Promise<ChallengeResponse> {
      const res = await fetch(`${baseUrl}/api/challenge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent_name: opts.agentName,
          agent_version: opts.agentVersion
        })
      });
      if (!res.ok) throw new Error(`challenge failed: ${res.status}`);
      return await res.json();
    },
    async verifyChallenge(challengeId: string, answer: string, hmac: string): Promise<VerifyResponse> {
      const res = await fetch(`${baseUrl}/api/verify/${encodeURIComponent(challengeId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          answer,
          hmac,
          agent_name: opts.agentName,
          agent_version: opts.agentVersion
        })
      });
      if (!res.ok) throw new Error(`verify failed: ${res.status}`);
      return await res.json();
    },
    async protectedPing(proofJwt: string) {
      const res = await fetch(`${baseUrl}/api/protected/ping`, withCapagentProof(proofJwt));
      if (!res.ok) throw new Error(`protected ping failed: ${res.status}`);
      return await res.json();
    }
  };
}

