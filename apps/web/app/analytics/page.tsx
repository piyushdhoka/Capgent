import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type BenchmarkReport = {
  id: string
  model_id: string
  framework: string
  agent_name: string
  agent_version: string
  project_id?: string
  runs: number
  successes: number
  avg_ms: number
  p95_ms: number
  created_at: string
}

type AnalyticsPageProps = {
  searchParams?: { project_id?: string }
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/login")
  }

  const baseUrl = process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL || "http://127.0.0.1:8787"
  const res = await fetch(`${baseUrl}/api/benchmarks`, {
    cache: "no-store",
  })

  const json = (await res.json().catch(() => null)) as { reports?: BenchmarkReport[] } | null
  const allReports = json?.reports ?? []

  const selectedProjectId = searchParams?.project_id?.trim() || ""
  const reports = selectedProjectId
    ? allReports.filter((r) => (r.project_id ?? "").toLowerCase() === selectedProjectId.toLowerCase())
    : allReports

  const totalRuns = reports.reduce((a, r) => a + r.runs, 0)
  const totalSuccesses = reports.reduce((a, r) => a + r.successes, 0)
  const overallSuccessRate = totalRuns > 0 ? Math.round((totalSuccesses / totalRuns) * 100) : 0

  return (
    <div className="container max-w-5xl py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Badge variant="secondary" className="gap-1.5">
            Analytics
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">Project analytics</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Internal view of benchmark runs. Benchmarks are public on the{" "}
            <span className="font-medium text-foreground">/benchmarks</span> page; this view lets you slice by{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">project_id</code> when available.
          </p>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total runs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-semibold tabular-nums">{totalRuns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total successes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-semibold tabular-nums">{totalSuccesses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Overall success rate</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-semibold tabular-nums">
              {overallSuccessRate}
              <span className="ml-1 text-sm font-normal text-muted-foreground">%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Raw benchmark rows</CardTitle>
          <CardDescription>
            Includes any attached <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">project_id</code>.
            You can filter by adding <code className="text-[0.7rem]">?project_id=...</code> to the URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No benchmark data for this filter yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-[11px] text-muted-foreground">
                    <th className="py-2 pr-2 text-left font-medium">Model</th>
                    <th className="py-2 pr-2 text-left font-medium">Framework</th>
                    <th className="py-2 pr-2 text-left font-medium">Agent</th>
                    <th className="py-2 pr-2 text-left font-medium">Project</th>
                    <th className="py-2 pr-2 text-left font-medium">Runs</th>
                    <th className="py-2 pr-2 text-left font-medium">Successes</th>
                    <th className="py-2 pr-2 text-left font-medium">Avg ms</th>
                    <th className="py-2 text-left font-medium">p95 ms</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-2 font-mono">{r.model_id}</td>
                      <td className="py-2.5 pr-2">{r.framework}</td>
                      <td className="py-2.5 pr-2">{r.agent_name}</td>
                      <td className="py-2.5 pr-2 font-mono text-[11px] text-muted-foreground">
                        {r.project_id ?? "—"}
                      </td>
                      <td className="py-2.5 pr-2 tabular-nums">{r.runs}</td>
                      <td className="py-2.5 pr-2 tabular-nums">{r.successes}</td>
                      <td className="py-2.5 pr-2 tabular-nums">{r.avg_ms.toFixed(0)}</td>
                      <td className="py-2.5 tabular-nums">{r.p95_ms.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

