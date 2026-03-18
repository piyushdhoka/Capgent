import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getUserProjects } from "@/lib/projects"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ProjectsForm } from "./ProjectsForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getProjectApiKeys } from "@/lib/projects"
import { KeyCreationForm } from "./KeyCreationForm"
import { Key, Trash2 } from "lucide-react"
import { deleteKeyAction, deleteProjectAction } from "./actions"

interface ProjectsPageProps {
  searchParams: Promise<{ project_id?: string }>
}

export default async function ProjectsPage(props: ProjectsPageProps) {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  const projects = await getUserProjects(user.email)
  const searchParams = await props.searchParams
  const selectedProjectId = searchParams.project_id

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const apiKeys = selectedProject ? await getProjectApiKeys(selectedProject.id) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">Create projects and manage API keys for your backends.</p>
      </div>

      {selectedProject ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>{selectedProject.name}</span>
              <div className="flex items-center gap-2">
                <form
                  action={async () => {
                    "use server"
                    await deleteProjectAction(selectedProject.id)
                    redirect("/projects")
                  }}
                >
                  <Button type="submit" variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    Delete project
                  </Button>
                </form>
                <Button asChild variant="outline" size="sm">
                  <Link href="/projects">New project</Link>
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Project ID:{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{selectedProject.id}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Key className="h-4 w-4" />
                  API keys
                </h3>
              </div>

              {apiKeys.length > 0 ? (
                <div className="space-y-2">
                  {apiKeys.map((k) => (
                    <div
                      key={k.id}
                      className="flex flex-col justify-between gap-3 rounded-lg border border-border/60 bg-card/50 p-4 text-sm sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{k.label || "Untitled key"}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Created {new Date(k.createdAt).toLocaleDateString()}
                          {k.expiresAt ? (
                            <span className="ml-2">
                              · Expires {new Date(k.expiresAt).toLocaleDateString()}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <form
                        action={async () => {
                          "use server"
                          await deleteKeyAction(selectedProject.id, k.id)
                          redirect(`/projects?project_id=${selectedProject.id}`)
                        }}
                      >
                        <Button type="submit" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                  No API keys yet.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="mb-3">
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Create new API key</div>
                <div className="mt-1 text-sm text-muted-foreground">Copy it once and store it securely.</div>
              </div>
              <KeyCreationForm projectId={selectedProject.id} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Create a new project</CardTitle>
            <CardDescription>Give your project a name to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectsForm />
          </CardContent>
        </Card>
      )}

      {projects.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your projects</CardTitle>
            <CardDescription>Select a project to manage keys.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <Button
                key={p.id}
                asChild
                variant={selectedProjectId === p.id ? "secondary" : "outline"}
                size="sm"
              >
                <Link href={`/projects?project_id=${p.id}`}>{p.name}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
