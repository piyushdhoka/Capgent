"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"

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

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.email) {
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
      owner_email: session.user.email,
    }),
  })

  if (!res.ok) {
    return { status: "error", message: "Failed to create project. Check server logs." }
  }

  const json = (await res.json().catch(() => null)) as
    | { project?: { project_id: string }; api_key?: string }
    | null

  return {
    status: "success",
    apiKey: json?.api_key,
    projectId: json?.project?.project_id,
    message: "Project created. This is your only chance to copy the API key.",
  }
}

