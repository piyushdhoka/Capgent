import type { Env } from "../config";
import { createDb } from "../storage/db";

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

export async function saveProject(env: Env, project: Project): Promise<void> {
  const sql = createDb(env);
  await sql`
    INSERT INTO "Project" (id, name, status, "ownerEmail")
    VALUES (${project.project_id}, ${project.name}, ${project.status}, ${project.owner_email})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      status = EXCLUDED.status,
      "ownerEmail" = EXCLUDED."ownerEmail"
  `;
}

export async function getProjectById(env: Env, projectId: string): Promise<Project | null> {
  const sql = createDb(env);
  const rows = await sql`
    SELECT id as project_id, name, status, "ownerEmail" as owner_email, "createdAt" as created_at
    FROM "Project"
    WHERE id = ${projectId}
    LIMIT 1
  `;
  
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    created_at: row.created_at.toISOString(),
    status: row.status as ProjectStatus
  } as Project;
}

export async function saveApiKey(env: Env, apiKey: ApiKeyRecord): Promise<void> {
  const sql = createDb(env);
  await sql`
    INSERT INTO "ApiKey" (id, "projectId", "keyHash", label, "revokedAt")
    VALUES (${apiKey.key_id}, ${apiKey.project_id}, ${apiKey.key_hash}, ${apiKey.label}, ${apiKey.revoked_at ? new Date(apiKey.revoked_at) : null})
    ON CONFLICT (id) DO UPDATE SET
      label = EXCLUDED.label,
      "revokedAt" = EXCLUDED."revokedAt"
  `;
}

export async function listApiKeysForProject(env: Env, projectId: string): Promise<ApiKeyRecord[]> {
  const sql = createDb(env);
  const rows = await sql`
    SELECT id as key_id, "projectId" as project_id, "keyHash" as key_hash, label, 
           "createdAt" as created_at, "lastUsedAt" as last_used_at, "revokedAt" as revoked_at
    FROM "ApiKey"
    WHERE "projectId" = ${projectId}
  `;
  
  return rows.map(row => ({
    ...row,
    created_at: row.created_at.toISOString(),
    last_used_at: row.last_used_at?.toISOString() || null,
    revoked_at: row.revoked_at?.toISOString() || null
  })) as ApiKeyRecord[];
}

export async function getProjectForApiKeyHash(
  env: Env,
  keyHash: string
): Promise<{ project: Project; apiKey: ApiKeyRecord } | null> {
  const sql = createDb(env);
  const rows = await sql`
    SELECT 
      p.id as p_id, p.name as p_name, p.status as p_status, p."ownerEmail" as p_owner_email, p."createdAt" as p_created_at,
      k.id as k_id, k."projectId" as k_project_id, k."keyHash" as k_key_hash, k.label as k_label, 
      k."createdAt" as k_created_at, k."lastUsedAt" as k_last_used_at, k."revokedAt" as k_revoked_at
    FROM "ApiKey" k
    JOIN "Project" p ON k."projectId" = p.id
    WHERE k."keyHash" = ${keyHash} AND k."revokedAt" IS NULL
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  const row = rows[0];

  const project: Project = {
    project_id: row.p_id,
    name: row.p_name,
    status: row.p_status as ProjectStatus,
    owner_email: row.p_owner_email,
    created_at: row.p_created_at.toISOString()
  };

  const apiKey: ApiKeyRecord = {
    key_id: row.k_id,
    project_id: row.k_project_id,
    key_hash: row.k_key_hash,
    label: row.k_label,
    created_at: row.k_created_at.toISOString(),
    last_used_at: row.k_last_used_at?.toISOString() || null,
    revoked_at: row.k_revoked_at?.toISOString() || null
  };

  return { project, apiKey };
}


