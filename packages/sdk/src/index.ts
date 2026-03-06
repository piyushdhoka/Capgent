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

export type RegisterAgentRequest = {
  agent_name: string;
  framework?: string;
  model?: string;
  owner_org?: string;
  adminKey?: string;
};

export type RegisterAgentResponse = {
  agent_id: string;
  agent_secret: string;
  identity_token: string;
  identity_expires_at: string;
};

export type IssueIdentityTokenRequest = {
  agent_id: string;
  agent_secret: string;
  proof_token?: string;
};

export type IssueIdentityTokenResponse = {
  token: string;
  expires_at: string;
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
    },
    async registerAgent(req: RegisterAgentRequest): Promise<RegisterAgentResponse> {
      const headers: HeadersInit = { "content-type": "application/json" };
      if (req.adminKey) {
        (headers as any)["x-capagent-admin-key"] = req.adminKey;
      }
      const res = await fetch(`${baseUrl}/api/agents/register`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          agent_name: req.agent_name,
          framework: req.framework,
          model: req.model,
          owner_org: req.owner_org
        })
      });
      if (!res.ok) throw new Error(`agent register failed: ${res.status}`);
      return (await res.json()) as RegisterAgentResponse;
    },
    async issueIdentityToken(req: IssueIdentityTokenRequest): Promise<IssueIdentityTokenResponse> {
      const res = await fetch(`${baseUrl}/api/agents/token`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent_id: req.agent_id,
          agent_secret: req.agent_secret,
          proof_token: req.proof_token
        })
      });
      if (!res.ok) throw new Error(`identity token failed: ${res.status}`);
      return (await res.json()) as IssueIdentityTokenResponse;
    },
    async signGuestbook(identityToken: string, message: string) {
      const res = await fetch(`${baseUrl}/api/guestbook/sign`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${identityToken}`
        },
        body: JSON.stringify({ message })
      });
      if (!res.ok) throw new Error(`guestbook sign failed: ${res.status}`);
      return await res.json();
    }
  };
}

