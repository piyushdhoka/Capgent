"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MagnifyingGlass, Trash } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteProjectAction } from "@/app/projects/actions"

type ProjectWithKeyCount = {
  id: string
  name: string
  createdAt: Date
  keyCount: number
}

export function ProjectsTableClient({ projects }: { projects: ProjectWithKeyCount[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
  }, [projects, query])

  function handleDelete(projectId: string) {
    setErrorMsg(null)
    setDeletingId(projectId)
    startTransition(async () => {
      const result = await deleteProjectAction(projectId)
      setDeletingId(null)
      if (!result.success) {
        setErrorMsg(result.message ?? "Failed to delete project.")
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm py-2">
        <div className="relative w-full max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a project"
            className="pl-9 h-10 bg-background border-border/40 rounded-lg text-sm"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      <Card className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 border-b border-border/60 text-[13px] font-medium text-muted-foreground bg-muted/40">
          <div>Project</div>
          <div>Keys</div>
          <div>Created</div>
          <div />
        </div>
        <div className="divide-y divide-border/40">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {projects.length === 0 ? "No projects yet. Create your first project." : "No projects match your search."}
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-[14px] text-foreground">
                    <Link href={`/projects?project_id=${p.id}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5 font-mono truncate">{p.id}</div>
                </div>
                <div>
                  <Link
                    href={`/projects?project_id=${p.id}`}
                    className="text-[14px] font-medium hover:underline"
                  >
                    {p.keyCount} {p.keyCount === 1 ? "key" : "keys"}
                  </Link>
                </div>
                <div className="text-[14px] text-muted-foreground">
                  {p.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        disabled={deletingId === p.id && isPending}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{p.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the project and all of its API keys. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(p.id)}
                        >
                          Delete project
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/projects">Manage API keys</Link>
        </Button>
      </div>
    </div>
  )
}
