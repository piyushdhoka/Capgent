import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ProjectsForm } from "./ProjectsForm"

export default async function ProjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="container max-w-screen-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Projects & API keys</CardTitle>
          <CardDescription>
            Create a project to get an API key. Use that key with the Capgent SDK or directly with HTTP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectsForm />
        </CardContent>
      </Card>
    </div>
  )
}

