import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { signoutAction } from "../login/actions"
import { Key, BookOpenText, ArrowRight } from "lucide-react"

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container max-w-screen-lg py-12 md:py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <Badge variant="secondary">Dashboard</Badge>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            {user.name ?? user.email}. Start by creating a project and copying an API key.
          </p>
        </div>
        <form action={signoutAction}>
          <Button variant="outline" type="submit">
            Sign out
          </Button>
        </form>
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
              <BookOpenText className="h-4 w-4" /> Integrate
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Use the SDK or the prompt template.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your projects</CardTitle>
            <CardDescription>Create projects and generate API keys for your backends.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="gap-2">
              <Link href="/projects">
                Go to projects <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Docs</CardTitle>
            <CardDescription>
              Learn how to plug Capgent into your own APIs, SDKs, and agents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/docs">
                View documentation <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

