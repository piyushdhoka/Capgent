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
import { deleteKeyAction } from "./actions"

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
    <div className="container max-w-screen-lg py-10">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="space-y-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-neutral-500 uppercase">
              Projects
            </h2>
            <div className="space-y-1">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  asChild
                  variant={selectedProjectId === project.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-sm"
                >
                  <Link href={`/projects?project_id=${project.id}`}>
                    {project.name}
                  </Link>
                </Button>
              ))}
              <Button
                asChild
                variant={!selectedProjectId ? "secondary" : "ghost"}
                className="w-full justify-start text-sm"
              >
                <Link href="/projects">
                  + Create Project
                </Link>
              </Button>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {selectedProject ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedProject.name}</CardTitle>
                <CardDescription>
                  Project ID: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{selectedProject.id}</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Keys
                  </h3>
                  
                  {apiKeys.length > 0 ? (
                    <div className="space-y-2">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-3 border border-zinc-800 rounded bg-zinc-900/30 text-xs group">
                          <div className="space-y-1">
                            <div className="font-medium text-zinc-200">{key.label || "Untitled Key"}</div>
                            <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-tighter">
                              Active
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right space-y-1">
                              <div className="text-zinc-400">
                                Created: {new Date(key.createdAt).toLocaleDateString()}
                              </div>
                              {key.expiresAt && (
                                <div className={new Date(key.expiresAt) < new Date() ? "text-red-500" : "text-amber-500"}>
                                  Expires: {new Date(key.expiresAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            
                            <form action={async () => {
                              "use server"
                              await deleteKeyAction(key.id)
                              redirect(`/projects?project_id=${selectedProject.id}`)
                            }}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No API keys yet.</p>
                  )}

                  <div className="pt-4 border-t border-zinc-800">
                    <h4 className="text-xs font-semibold uppercase text-zinc-500 mb-3 tracking-wider">
                      Create new API Key
                    </h4>
                    <KeyCreationForm projectId={selectedProject.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Create a new project</CardTitle>
                <CardDescription>
                  Give your project a name to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectsForm />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
