import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { getUserProjects } from "@/lib/projects"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Key, Plus, Folder } from "lucide-react"
import { ProjectsForm } from "@/app/projects/ProjectsForm"

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  const projects = await getUserProjects(user.email)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Badge variant="secondary" className="w-fit">Dashboard</Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          {user.name ?? user.email}. Create a project, generate an API key, then plug it into your backend.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" />
              Create a project
            </CardTitle>
            <CardDescription>This is where you generate API keys for your backend.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectsForm />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Folder className="h-4 w-4" />
              Your projects
            </CardTitle>
            <CardDescription>Jump into a project to manage keys.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length > 0 ? (
              <div className="space-y-2">
                {projects.slice(0, 6).map((p) => (
                  <Button key={p.id} asChild variant="outline" className="w-full justify-between">
                    <Link href={`/projects?project_id=${p.id}`}>
                      <span className="truncate">{p.name}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                No projects yet. Create your first project to generate API keys.
              </div>
            )}

            <div className="pt-2">
              <Button asChild className="w-full gap-2">
                <Link href="/projects">
                  Manage projects <Key className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Your workflow</CardTitle>
          <CardDescription>Production path in ~2 minutes.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Key className="h-4 w-4" /> Create a project
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Generate API keys for your backend.</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Key className="h-4 w-4" /> Copy an API key
            </div>
            <p className="mt-1 text-xs text-muted-foreground">You’ll only see secrets once.</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Key className="h-4 w-4" /> Integrate
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Protect your endpoints using your API key.</p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

