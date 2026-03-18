import { cookies } from "next/headers";

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
  // Note: email is unused now; projects are fetched via the API using the signed session cookie.
  const apiBase =
    process.env.CAPAGENT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL ??
    "http://127.0.0.1:8787";

  try {
    const session = (await cookies()).get("session")?.value ?? "";
    const res = await fetch(`${apiBase}/api/me/projects`, {
      cache: "no-store",
      headers: session ? { cookie: `session=${session}` } : {},
    });
    if (!res.ok) return [];
    const json = (await res.json().catch(() => null)) as { projects?: any[] } | null;
    return (json?.projects ?? []).map((p) => ({
      id: p.project_id,
      name: p.name,
      userId: p.owner_id ?? "",
      createdAt: new Date(p.created_at),
    })) as Project[];
  } catch {
    // API may not be running locally; don't crash the app shell.
    return [];
  }
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const projects = await getUserProjects("");
  const found = projects.find((p) => p.id === projectId) ?? null;
  return found;
}

export async function getProjectApiKeys(projectId: string): Promise<ApiKey[]> {
  const apiBase =
    process.env.CAPAGENT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL ??
    "http://127.0.0.1:8787";

  try {
    const session = (await cookies()).get("session")?.value ?? "";
    const res = await fetch(`${apiBase}/api/me/projects/${encodeURIComponent(projectId)}/keys`, {
      cache: "no-store",
      headers: session ? { cookie: `session=${session}` } : {},
    });
    if (!res.ok) return [];
    const json = (await res.json().catch(() => null)) as { api_keys?: any[] } | null;
    return (json?.api_keys ?? []).map((k) => ({
      id: k.key_id,
      projectId,
      label: k.label ?? null,
      createdAt: new Date(k.created_at),
      expiresAt: k.expires_at ? new Date(k.expires_at) : null,
    })) as ApiKey[];
  } catch {
    return [];
  }
}
