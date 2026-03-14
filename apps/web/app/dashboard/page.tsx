import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { signoutAction } from "../login/actions"

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container max-w-screen-lg py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user.name ?? user.email}. Start by creating a project and copying an API key.
          </p>
        </div>
        <form action={signoutAction}>
          <Button variant="outline" type="submit">
            Sign out
          </Button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your projects</CardTitle>
            <CardDescription>Create projects and generate API keys for your backends.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/projects">Go to projects</Link>
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
            <Button asChild variant="outline">
              <Link href="/docs">View documentation</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

