"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CaretDown, Check, Trash } from "@phosphor-icons/react"
import { ApiKeyDetailsDialog } from "./ApiKeyDetailsDialog"
import { deleteKeyAction } from "./actions"

export function ApiKeysClient({
  allKeys,
  projects,
  initialProjectId,
}: {
  allKeys: any[]
  projects: any[]
  initialProjectId?: string
}) {
  const [groupBy, setGroupBy] = useState<"key" | "project">("key")
  const [filterProject, setFilterProject] = useState<string>(initialProjectId ?? "all")

  useEffect(() => {
    setFilterProject(initialProjectId ?? "all")
  }, [initialProjectId])

  const filteredKeys = useMemo(() => {
    if (filterProject === "all") return allKeys
    return allKeys.filter(k => k.project.id === filterProject)
  }, [allKeys, filterProject])

  const handleDelete = async (projectId: string, keyId: string) => {
    await deleteKeyAction(projectId, keyId)
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between text-sm py-2">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs font-semibold">Group by</span>
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as "key" | "project")}>
            <TabsList className="rounded-full bg-muted/40 border border-border/40">
              <TabsTrigger value="key" className="rounded-full px-4 text-xs">
                API key
              </TabsTrigger>
              <TabsTrigger value="project" className="rounded-full px-4 text-xs">
                Project
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-semibold">Filter by</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 bg-muted border border-border/40 h-8 text-xs hover:bg-muted/80 rounded-lg shadow-sm">
                {filterProject === "all" ? "All projects" : projects.find(p => p.id === filterProject)?.name} 
                <CaretDown className="h-3 w-3 text-muted-foreground ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => setFilterProject("all")}>
                <div className="flex items-center justify-between w-full">
                  All projects
                  {filterProject === "all" && <Check className="h-4 w-4 ml-2 text-primary" />}
                </div>
              </DropdownMenuItem>
              {projects.map(p => (
                <DropdownMenuItem key={p.id} onClick={() => setFilterProject(p.id)}>
                   <div className="flex items-center justify-between w-full">
                     {p.name}
                     {filterProject === p.id && <Check className="h-4 w-4 ml-2 text-primary" />}
                   </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm mt-2">
        <div className="grid grid-cols-[2.5fr_2fr_1.5fr_auto] items-center gap-4 p-4 border-b border-border/60 text-[13px] font-medium text-muted-foreground bg-muted/40">
          <div>Key</div>
          <div>Project</div>
          <div>Created</div>
          <div className="w-8"></div>
        </div>
        
        <div className="divide-y divide-border/40">
          {filteredKeys.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No API keys found.
            </div>
          ) : groupBy === "key" ? (
            filteredKeys.map((k) => (
              <ApiKeyDetailsDialog key={k.id} apiKey={{...k, project: { id: k.project.id, name: k.project.name }}}>
                <div role="button" aria-label="View API key details" className="grid grid-cols-[2.5fr_2fr_1.5fr_auto] items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer group text-left">
                  <div>
                    <div className="font-mono text-[14px] text-foreground group-hover:underline">...{k.id.slice(-4)}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{k.label || "Untitled key"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-[14px] text-foreground">{k.project.name}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5 font-mono">{k.project.id}</div>
                  </div>
                  <div className="text-[13px] text-muted-foreground">
                    {new Date(k.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div>
                     <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(k.project.id, k.id); }}>
                       <Trash className="h-4 w-4" />
                     </Button>
                  </div>
                </div>
              </ApiKeyDetailsDialog>
            ))
          ) : (
            // Group by Project
            projects.map(p => {
               const pKeys = filteredKeys.filter(k => k.project.id === p.id)
               if (pKeys.length === 0) return null
               return (
                 <div key={p.id}>
                   <div className="bg-muted/20 px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border/40">
                     {p.name}
                   </div>
                   <div className="divide-y divide-border/40">
                     {pKeys.map(k => (
                        <ApiKeyDetailsDialog key={k.id} apiKey={{...k, project: { id: k.project.id, name: k.project.name }}}>
                          <div role="button" aria-label="View API key details" className="grid grid-cols-[2.5fr_2fr_1.5fr_auto] items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer group text-left">
                            <div>
                              <div className="font-mono text-[14px] text-foreground group-hover:underline">...{k.id.slice(-4)}</div>
                              <div className="text-[12px] text-muted-foreground mt-0.5">{k.label || "Untitled key"}</div>
                            </div>
                            <div>
                              <div className="font-medium text-[14px] text-foreground">{k.project.name}</div>
                              <div className="text-[12px] text-muted-foreground mt-0.5 font-mono">{k.project.id}</div>
                            </div>
                            <div className="text-[13px] text-muted-foreground">
                              {new Date(k.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(k.project.id, k.id); }}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </ApiKeyDetailsDialog>
                     ))}
                   </div>
                 </div>
               )
            })
          )}
        </div>
      </div>
    </div>
  )
}
