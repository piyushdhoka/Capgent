import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { getProjectApiKeys, getUserProjects } from "@/lib/projects"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Folder, Key, Plus } from "@phosphor-icons/react/dist/ssr"
import { ProjectsForm } from "@/app/projects/ProjectsForm"

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  const projects = await getUserProjects(user.email)
  const projectsWithKeyCount = await Promise.all(
    projects.map(async (p) => {
      const keys = await getProjectApiKeys(p.id)
      return { project: p, keyCount: keys.length }
    })
  )

  const totalKeys = projectsWithKeyCount.reduce((a, x) => a + x.keyCount, 0)
  const sortedProjects = [...projectsWithKeyCount].sort((a, b) => b.project.createdAt.getTime() - a.project.createdAt.getTime())

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Badge variant="secondary" className="w-fit">
          Workspace
        </Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard overview</h1>
        <p className="text-sm text-muted-foreground">
          {user.name ?? user.email}. Create a project, generate API keys, and protect your backend endpoints.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" />
              Create a project
            </CardTitle>
            <CardDescription>Generate API keys for your backend.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectsForm />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" />
              Your API keys
            </CardTitle>
            <CardDescription>Manage all keys across your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-semibold tabular-nums">{projects.length}</div>
                <div className="mt-1 text-xs text-muted-foreground">Projects</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-semibold tabular-nums">{totalKeys}</div>
                <div className="mt-1 text-xs text-muted-foreground">API keys</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-semibold tabular-nums">{projectsWithKeyCount.filter((x) => x.keyCount > 0).length}</div>
                <div className="mt-1 text-xs text-muted-foreground">Active projects</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Recent projects
              </div>
              {sortedProjects.length > 0 ? (
                <div className="space-y-2">
                  {sortedProjects.slice(0, 5).map(({ project: p, keyCount }) => (
                    <Button key={p.id} asChild variant="outline" className="w-full justify-between gap-4">
                      <Link href={`/projects?project_id=${p.id}`} className="flex min-w-0 items-center justify-between gap-4">
                        <span className="truncate">{p.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {keyCount} {keyCount === 1 ? "key" : "keys"}
                        </span>
                      </Link>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                  No projects yet. Create your first project to generate API keys.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="flex-1 gap-2 min-w-[220px]">
                <Link href="/projects">
                  Manage API keys <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 gap-2 min-w-[220px]">
                <Link href="/projects-list">
                  Browse projects <Folder className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
