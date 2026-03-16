import { sql } from "./neon";

export type Project = {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
};

export type ApiKey = {
  id: string;
  projectId: string;
  label: string | null;
  createdAt: Date;
  expiresAt: Date | null;
};

export async function getUserProjects(email: string): Promise<Project[]> {
  const rows = await sql`
    SELECT p.id, p.name, p."userId", p."createdAt"
    FROM project p
    JOIN "user" u ON p."userId" = u.id
    WHERE u.email = ${email}
    ORDER BY p."createdAt" DESC
  `;
  return rows as unknown as Project[];
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const rows = await sql`
    SELECT p.id, p.name, p."userId", p."createdAt"
    FROM project p
    WHERE p.id = ${projectId}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rows[0] as unknown as Project;
}

export async function getProjectApiKeys(projectId: string): Promise<ApiKey[]> {
  const rows = await sql`
    SELECT id, "projectId", name as label, "createdAt", "expiresAt"
    FROM api_key
    WHERE "projectId" = ${projectId}
    ORDER BY "createdAt" DESC
  `;
  return rows as unknown as ApiKey[];
}
