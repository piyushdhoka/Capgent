import type { Env } from "../config";
import { canUseRedis, createRedis } from "../storage/redis";
import { createInMemoryStore, createRedisStore, type Store } from "../storage/store";

export type GuestbookEntry = {
  id: string;
  agent_id: string;
  agent_name: string;
  framework?: string;
  model?: string;
  owner_org?: string;
  message: string;
  created_at: string;
};

const GUESTBOOK_KEY = "guestbook:entries";
const GUESTBOOK_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year
const GUESTBOOK_MAX_ENTRIES = 100;

function getStore(env: Env): Store {
  return !env.CAPAGENT_FORCE_INMEMORY && canUseRedis(env) ? createRedisStore(createRedis(env)) : createInMemoryStore();
}

export async function addGuestbookEntry(env: Env, entry: GuestbookEntry): Promise<void> {
  const store = getStore(env);
  const existing = (await store.getJson<GuestbookEntry[]>(GUESTBOOK_KEY)) ?? [];
  const next = [entry, ...existing].slice(0, GUESTBOOK_MAX_ENTRIES);
  await store.setJson(GUESTBOOK_KEY, next, GUESTBOOK_TTL_SECONDS);
}

export async function getGuestbookEntries(env: Env): Promise<GuestbookEntry[]> {
  const store = getStore(env);
  const entries = (await store.getJson<GuestbookEntry[]>(GUESTBOOK_KEY)) ?? [];
  return entries;
}

