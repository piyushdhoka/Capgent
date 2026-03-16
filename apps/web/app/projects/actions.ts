"use server"

import { headers } from "next/headers"
import { getSession } from "@/lib/auth"

type CreateProjectState = {
  status: "idle" | "success" | "error"
  apiKey?: string
  projectId?: string
  message?: string
}

export async function createProjectAction(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) {
    return { status: "error", message: "Project name is required." }
  }

  const user = await getSession()

  if (!user?.email || !user.id) {
    return { status: "error", message: "You must be signed in." }
  }

  const adminKey = process.env.CAPAGENT_ADMIN_API_KEY
  if (!adminKey) {
    return { status: "error", message: "CAPAGENT_ADMIN_API_KEY is not set on the web app." }
  }

  const apiBase = process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL ?? "http://127.0.0.1:8787"

  const res = await fetch(`${apiBase}/api/projects`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-capagent-admin-key": adminKey,
    },
    body: JSON.stringify({
      name,
      owner_id: user.id,
    }),
  })

  if (!res.ok) {
    return { status: "error", message: "Failed to create project. Check server logs." }
  }

  const json = (await res.json().catch(() => null)) as
    | { project?: { project_id: string } }
    | null

  return {
    status: "success",
    projectId: json?.project?.project_id,
    message: "Project created successfully!",
  }
}

export async function createKeyAction(
  projectId: string,
  name: string,
  expiresInDays: number | null
): Promise<{ status: "success" | "error"; apiKey?: string; message?: string }> {
  const user = await getSession()
  if (!user?.id) return { status: "error", message: "Unauthorized" }

  const adminKey = process.env.CAPAGENT_ADMIN_API_KEY
  const apiBase = process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL ?? "http://127.0.0.1:8787"

  let expiresAt: string | null = null
  if (expiresInDays) {
    const d = new Date()
    d.setDate(d.getDate() + expiresInDays)
    expiresAt = d.toISOString()
  }

  const res = await fetch(`${apiBase}/api/projects/keys`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-capagent-admin-key": adminKey!,
    },
    body: JSON.stringify({
      project_id: projectId,
      label: name,
      expires_at: expiresAt,
    }),
  })

  if (!res.ok) return { status: "error", message: "Failed to create API key" }

  const json = await res.json()
  return {
    status: "success",
    apiKey: json.api_key,
    message: "API key created successfully! Copy it now, as you won't be able to see it again.",
  }
}

export async function deleteKeyAction(keyId: string): Promise<{ success: boolean; message?: string }> {
  const user = await getSession()
  if (!user?.id) return { success: false, message: "Unauthorized" }

  const adminKey = process.env.CAPAGENT_ADMIN_API_KEY
  const apiBase = process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL ?? "http://127.0.0.1:8787"

  const res = await fetch(`${apiBase}/api/projects/keys/${keyId}`, {
    method: "DELETE",
    headers: {
      "x-capagent-admin-key": adminKey!,
    },
  })

  if (!res.ok) return { success: false, message: "Failed to delete API key" }

  return { success: true }
}
