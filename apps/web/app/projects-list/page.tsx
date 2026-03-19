import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getUserProjects, getProjectApiKeys } from "@/lib/projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProjectsForm } from "@/app/projects/ProjectsForm"
import { FileText, Plus, CloudDownload, Search } from "lucide-react"
import Link from "next/link"

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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Projects</h1>
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
            <CloudDownload className="h-4 w-4" /> Import projects
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm py-2">
         <div className="relative w-full max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input 
             placeholder="Search for a project" 
             className="pl-9 h-10 bg-background border-border/40 rounded-lg text-sm"
           />
         </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="grid grid-cols-[2fr_1fr_1fr] items-center gap-4 p-4 border-b border-border/60 text-[13px] font-medium text-muted-foreground bg-muted/40">
          <div>Project</div>
          <div>Keys</div>
          <div>Created</div>
        </div>
        <div className="divide-y divide-border/40">
          {projectsWithKeyCount.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No projects found.
            </div>
          ) : (
            projectsWithKeyCount.map((p) => (
              <div key={p.id} className="grid grid-cols-[2fr_1fr_1fr] items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <div>
                  <div className="font-medium text-[14px] text-blue-500 dark:text-blue-400">
                    <Link href={`/projects?project_id=${p.id}`}>{p.name}</Link>
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5 font-mono">{p.id}</div>
                </div>
                <div>
                  <Link href={`/projects?project_id=${p.id}`} className="text-[14px] text-blue-500 dark:text-blue-400 font-medium hover:underline">
                    {p.keyCount} {p.keyCount === 1 ? 'key' : 'keys'}
                  </Link>
                </div>
                <div className="text-[14px] text-muted-foreground">
                  {p.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
