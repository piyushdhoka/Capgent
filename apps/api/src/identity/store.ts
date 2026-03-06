import type { Env } from "../config";
import { canUseRedis, createRedis } from "../storage/redis";
import { createInMemoryStore, createRedisStore, type Store } from "../storage/store";

export type AgentRecord = {
  agent_id: string;
  agent_name: string;
  framework?: string;
  model?: string;
  owner_org?: string;
  created_at: string;
  capability_score?: number | null;
  safety_score?: number | null;
  last_verified?: string | null;
  revoked_at?: string | null;
  secret_hash: string;
};

const AGENT_TTL_SECONDS = 60 * 60 * 24 * 365 * 5; // 5 years

function getStore(env: Env): Store {
  return !env.CAPAGENT_FORCE_INMEMORY && canUseRedis(env) ? createRedisStore(createRedis(env)) : createInMemoryStore();
}

export async function getAgentById(env: Env, agentId: string): Promise<AgentRecord | null> {
  const store = getStore(env);
  return (await store.getJson<AgentRecord>(`agent:${agentId}`)) ?? null;
}

export async function saveAgent(env: Env, agent: AgentRecord): Promise<void> {
  const store = getStore(env);
  await store.setJson(`agent:${agent.agent_id}`, agent, AGENT_TTL_SECONDS);
}

export async function revokeAgent(env: Env, agentId: string): Promise<AgentRecord | null> {
  const agent = (await getAgentById(env, agentId)) ?? null;
  if (!agent) return null;
  const now = new Date().toISOString();
  const updated: AgentRecord = { ...agent, revoked_at: now };
  await saveAgent(env, updated);
  return updated;
}

