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
import { KeyCreationForm } from "./KeyCreationForm"
import { FileText, Key } from "lucide-react"
import Link from "next/link"
import { ApiKeysClient } from "./ApiKeysClient"

export default async function ApiKeysPage() {
  const user = await getSession()
  if (!user) {
    redirect("/login")
  }

  const projects = await getUserProjects(user.email)
  const allKeysNested = await Promise.all(
    projects.map(async (p) => {
      const keys = await getProjectApiKeys(p.id)
      return keys.map((k) => ({ ...k, project: p }))
    })
  )
  const allKeys = allKeysNested.flat().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">API Keys</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/docs">
              <FileText className="h-4 w-4" /> API quickstart
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-full px-5 h-9 shadow-sm">
                <Key className="h-4 w-4" /> Create API key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create new API key</DialogTitle>
                <DialogDescription>
                  Generate a new API key for your backend. Copy it once and store it securely.
                </DialogDescription>
              </DialogHeader>
              <KeyCreationForm projects={projects} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ApiKeysClient allKeys={allKeys} projects={projects} />
    </div>
  )
}
