import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getUserProjects, getProjectApiKeys } from "@/lib/projects"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProjectsForm } from "@/app/projects/ProjectsForm"
import { CloudArrowDown, Plus } from "@phosphor-icons/react"
import { ProjectsTableClient } from "./ProjectsTableClient"

export default async function ProjectsListPage() {
  const user = await getSession()
  if (!user) {
    redirect("/login")
  }

  const projects = await getUserProjects(user.email)
  
  // Fetch key counts for each project
  const projectsWithKeyCount = await Promise.all(
    projects.map(async (p) => {
      const keys = await getProjectApiKeys(p.id)
      return { ...p, keyCount: keys.length }
    })
  )

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Create projects and generate API keys for your backend.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4" /> Create a new project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create a new project</DialogTitle>
                <DialogDescription>
                  Give your project a name to get started.
                </DialogDescription>
              </DialogHeader>
              <ProjectsForm />
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="gap-2 rounded-full px-5 h-9">
            <CloudArrowDown className="h-4 w-4" /> Import projects
          </Button>
        </div>
      </div>

      <ProjectsTableClient projects={projectsWithKeyCount} />
    </div>
  )
}
