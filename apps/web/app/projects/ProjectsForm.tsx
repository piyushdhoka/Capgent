"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { createProjectAction } from "./actions"

type CreateProjectState = {
  status: "idle" | "success" | "error"
  apiKey?: string
  projectId?: string
  message?: string
}

const initialState: CreateProjectState = {
  status: "idle",
}

export function ProjectsForm() {
  const [state, formAction] = useActionState(createProjectAction, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.status === "success" && state.projectId) {
      router.push(`/projects?project_id=${state.projectId}`)
    }
  }, [state, router])

  return (
    <div className="space-y-4">
      <form action={formAction}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" name="name" placeholder="My agent backend" required />
          </div>
          <Button type="submit">Create project</Button>
        </div>
      </form>

      {state.status === "success" && state.apiKey && (
        <div className="space-y-1 rounded-xl border border-border/60 bg-muted/40 p-4 text-xs">
          <p className="font-semibold text-foreground">API key created</p>
          <p className="text-[11px] text-muted-foreground">
            Copy this key now and store it securely. You won&apos;t be able to see it again.
          </p>
          <div className="mt-1.5 overflow-x-auto rounded bg-background px-2 py-1.5 font-mono text-[11px] text-foreground">
            {state.apiKey}
          </div>
          <div className="mt-4">
            <Button asChild size="sm" className="w-full">
              <Link href={`/projects?project_id=${state.projectId}`}>
                Go to project dashboard
              </Link>
            </Button>
          </div>
        </div>
      )}

      {state.status === "error" && state.message && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        After creating a project, use the API key as{" "}
        <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[0.7rem]">X-Capgent-Api-Key</code> in your backend
        requests or configure it in the <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">capgent-sdk</code>{" "}
        client.
      </p>
    </div>
  )
}

