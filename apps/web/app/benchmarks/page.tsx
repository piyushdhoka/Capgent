import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Clock, CheckCircle2, Terminal } from "lucide-react"

type BenchmarkReport = {
  id: string
  model_id: string
  framework: string
  agent_name: string
  agent_version: string
  runs: number
  successes: number
  avg_ms: number
  p95_ms: number
  created_at: string
}

async function getReports(): Promise<BenchmarkReport[]> {
  const baseUrl = process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL || "http://127.0.0.1:8787"
  try {
    const res = await fetch(`${baseUrl}/api/benchmarks`, { cache: "no-store" })
    if (!res.ok) return []
    const json = (await res.json()) as { reports?: BenchmarkReport[] }
    return json.reports ?? []
  } catch {
    return []
  }
}

export default async function BenchmarksPage() {
  const reports = await getReports()
  const totalRuns = reports.reduce((a, r) => a + r.runs, 0)
  const totalSuccesses = reports.reduce((a, r) => a + r.successes, 0)
  const avgLatency = reports.length > 0 ? reports.reduce((a, r) => a + r.avg_ms, 0) / reports.length : 0

  return (
    <div className="container max-w-5xl py-16 md:py-24">
      <div className="space-y-2">
        <Badge variant="secondary" className="gap-1.5">
          <BarChart3 className="h-3 w-3" /> Benchmarks
        </Badge>
        <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
          Model & Framework Benchmarks
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Compare how different LLMs and agent frameworks perform on the Capgent challenge flow.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRuns}</p>
              <p className="text-xs text-muted-foreground">Total Runs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRuns > 0 ? `${Math.round((totalSuccesses / totalRuns) * 100)}%` : "—"}</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgLatency > 0 ? `${avgLatency.toFixed(0)}ms` : "—"}</p>
              <p className="text-xs text-muted-foreground">Avg Latency</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Run instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Run a Benchmark</CardTitle>
          <CardDescription>Execute from the agents directory to submit results.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-neutral-950 p-4">
            <pre className="font-mono text-sm text-neutral-200">
              <span className="text-muted-foreground">$ </span>cd agents{"\n"}
              <span className="text-muted-foreground">$ </span>
              <span className="text-emerald-400">bun run</span> run-benchmark.ts --runs=10 --model=x-ai/grok-4-fast --framework=node-sdk
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Results table */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Results</CardTitle>
            <span className="text-xs text-muted-foreground">
              {reports.length ? `${reports.length} report${reports.length > 1 ? "s" : ""}` : "No reports yet"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 pr-4 text-left font-medium">Model</th>
                    <th className="py-2 pr-4 text-left font-medium">Framework</th>
                    <th className="py-2 pr-4 text-right font-medium">Success</th>
                    <th className="py-2 pr-4 text-right font-medium">Avg (ms)</th>
                    <th className="py-2 pr-4 text-right font-medium">P95 (ms)</th>
                    <th className="py-2 text-right font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => {
                    const rate = r.runs > 0 ? `${Math.round((r.successes / r.runs) * 100)}%` : "0%"
                    return (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-mono text-xs">{r.model_id}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{r.framework}</td>
                        <td className="py-2.5 pr-4 text-right">
                          {r.successes}/{r.runs}{" "}
                          <span className="text-muted-foreground">({rate})</span>
                        </td>
                        <td className="py-2.5 pr-4 text-right">{r.avg_ms.toFixed(0)}</td>
                        <td className="py-2.5 pr-4 text-right">{r.p95_ms.toFixed(0)}</td>
                        <td className="py-2.5 text-right text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No benchmark reports yet. Run the command above to generate your first set of results.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
