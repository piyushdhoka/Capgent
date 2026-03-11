import type { Env } from "../config";
import { canUseRedis, createRedis } from "../storage/redis";
import { createInMemoryStore, createRedisStore, type Store } from "../storage/store";

export type ProjectStatus = "active" | "disabled";

export type Project = {
  project_id: string;
  name: string;
  created_at: string;
  owner_email?: string | null;
  status: ProjectStatus;
};

export type ApiKeyRecord = {
  key_id: string;
  project_id: string;
  key_hash: string;
  label?: string | null;
  created_at: string;
  last_used_at?: string | null;
  revoked_at?: string | null;
};

type StoreShape = Store;

function getStore(env: Env): StoreShape {
  return !env.CAPAGENT_FORCE_INMEMORY && canUseRedis(env)
    ? createRedisStore(createRedis(env))
    : createInMemoryStore();
}

const PROJECT_KEY_PREFIX = "project:";
const PROJECT_KEYS_KEY_SUFFIX = ":keys";
const APIKEY_INDEX_PREFIX = "apikey:";

function projectKey(id: string) {
  return `${PROJECT_KEY_PREFIX}${id}`;
}

function projectKeysKey(id: string) {
  return `${PROJECT_KEY_PREFIX}${id}${PROJECT_KEYS_KEY_SUFFIX}`;
}

function apiKeyIndexKey(hash: string) {
  return `${APIKEY_INDEX_PREFIX}${hash}`;
}

export async function saveProject(env: Env, project: Project): Promise<void> {
  const store = getStore(env);
  await store.setJson(projectKey(project.project_id), project, 60 * 60 * 24 * 365);
}

export async function getProjectById(env: Env, projectId: string): Promise<Project | null> {
  const store = getStore(env);
  return (await store.getJson<Project>(projectKey(projectId))) ?? null;
}

export async function saveApiKey(env: Env, apiKey: ApiKeyRecord): Promise<void> {
  const store = getStore(env);
  const keys = (await store.getJson<ApiKeyRecord[]>(projectKeysKey(apiKey.project_id))) ?? [];
  const filtered = keys.filter((k) => k.key_id !== apiKey.key_id);
  const next = [apiKey, ...filtered];
  await store.setJson(projectKeysKey(apiKey.project_id), next, 60 * 60 * 24 * 365);

  await store.setJson(
    apiKeyIndexKey(apiKey.key_hash),
    { project_id: apiKey.project_id, key_id: apiKey.key_id },
    60 * 60 * 24 * 365
  );
}

export async function listApiKeysForProject(env: Env, projectId: string): Promise<ApiKeyRecord[]> {
  const store = getStore(env);
  return (await store.getJson<ApiKeyRecord[]>(projectKeysKey(projectId))) ?? [];
}

export async function getProjectForApiKeyHash(
  env: Env,
  keyHash: string
): Promise<{ project: Project; apiKey: ApiKeyRecord } | null> {
  const store = getStore(env);
  const index = (await store.getJson<{ project_id: string; key_id: string }>(
    apiKeyIndexKey(keyHash)
  )) ?? null;
  if (!index) return null;

  const project = await getProjectById(env, index.project_id);
  if (!project) return null;

  const keys = (await store.getJson<ApiKeyRecord[]>(projectKeysKey(index.project_id))) ?? [];
  const apiKey = keys.find((k) => k.key_id === index.key_id) ?? null;
  if (!apiKey || apiKey.revoked_at) return null;

  return { project, apiKey };
}

