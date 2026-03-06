"use client"

import { createClient } from "@capagent/sdk"
import { solveChallengeFromSteps } from "@capagent/sdk/solver"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2, Lock, Unlock, Terminal, Cpu, RotateCcw } from "lucide-react"
import * as motion from "motion/react-client"

type SolverOutput = {
  answer: string
  hmac: string
}

async function solveWithLLM(payload: {
  instructions: string[]
  data_b64: string
  nonce: string
}): Promise<SolverOutput> {
  const res = await fetch("/api/parse-instructions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instructions: payload.instructions ?? [] }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.error ?? `Parse failed: ${res.status}`)
  }
  const { steps } = await res.json()
  if (!Array.isArray(steps) || steps.length === 0) throw new Error("No steps returned from LLM")
  return await solveChallengeFromSteps({
    data_b64: payload.data_b64,
    nonce: payload.nonce,
    steps,
  })
}

export default function PlaygroundPage() {
  const router = useRouter()
  const baseUrl = process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL || "http://localhost:8787"
  const client = useMemo(
    () =>
      createClient({
        baseUrl,
        agentName: "capagent-web-playground",
        agentVersion: "0.0.0",
      }),
    [baseUrl]
  )

  const [challenge, setChallenge] = useState<any | null>(null)
  const [solve, setSolve] = useState<SolverOutput | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("")

  async function onGetChallenge() {
    setError(null)
    setToken(null)
    setSolve(null)
    setChallenge(null)
    setBusy(true)
    setStatus("Fetching challenge...")
    try {
      const ch = await client.getChallenge()
      if (ch?.challenge_id && ch?.data_b64 != null) {
        setChallenge(ch)
        setStatus("")
      } else {
        setError("API returned invalid challenge (missing challenge_id or data_b64)")
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  async function onSolve() {
    setError(null)
    setSolve(null)
    setBusy(true)
    setStatus("Parsing instructions with LLM...")
    try {
      if (!challenge) throw new Error("Get a challenge first")
      const out = await solveWithLLM({
        instructions: challenge.instructions ?? [],
        data_b64: challenge.data_b64,
        nonce: challenge.nonce,
      })
      setSolve(out)
      setStatus("")
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  async function onVerify() {
    setError(null)
    setToken(null)
    setBusy(true)
    setStatus("Verifying solution...")
    try {
      if (!challenge) throw new Error("no challenge")
      if (!solve) throw new Error("solve first")
      const res = await client.verifyChallenge(challenge.challenge_id, solve.answer, solve.hmac)
      setToken(res.token)
      const exp = new Date(res.expires_at).getTime()
      const maxAge = Number.isFinite(exp) ? Math.max(0, Math.floor((exp - Date.now()) / 1000)) : 300
      document.cookie = `capagent_proof=${res.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
      setStatus("Verified! Signing guestbook and redirecting...")

      // Try to register a temporary agent identity and sign the guestbook.
      try {
        const registerRes = await fetch(`${baseUrl}/api/agents/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_name: "capagent-web-playground",
            framework: "web-playground",
            model: "demo",
            owner_org: "Capagent Playground",
          }),
        })

        if (registerRes.ok) {
          const regJson = (await registerRes.json()) as { identity_token?: string }
          const identityToken = regJson.identity_token
          if (identityToken) {
            await fetch(`${baseUrl}/api/guestbook/sign`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${identityToken}`,
              },
              body: JSON.stringify({
                message: "Verified via Capagent web playground.",
              }),
            })
          }
        }
      } catch {
        // Ignore guestbook errors in the playground flow.
      }

      setStatus("Verified! Redirecting to protected area...")
      setTimeout(() => router.push("/protected"), 1500)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  function onReset() {
    setChallenge(null)
    setSolve(null)
    setToken(null)
    setError(null)
    setStatus("")
    document.cookie = "capagent_proof=; Path=/; Max-Age=0; SameSite=Lax"
  }

  const stepIndex = token ? 3 : solve ? 2 : challenge ? 1 : 0

  return (
    <div className="container max-w-3xl py-16 md:py-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">Playground</h1>
          <p className="text-muted-foreground">
            Test the full agent verification flow interactively.
          </p>
        </div>

        <Card className="mt-8">
          <CardContent className="p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${token ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                <span className="text-sm font-medium">{token ? "Session Verified" : "Session Unverified"}</span>
              </div>
              {token && (
                <code className="text-xs text-muted-foreground">
                  {token.slice(0, 12)}...{token.slice(-12)}
                </code>
              )}
            </div>

            {/* Steps */}
            <div className="flex items-center gap-2">
              {[
                { label: "Challenge", done: stepIndex >= 1 },
                { label: "Solve", done: stepIndex >= 2 },
                { label: "Verify", done: stepIndex >= 3 },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-2">
                  {i > 0 && <div className={`h-px w-6 ${s.done ? "bg-emerald-500" : "bg-border"}`} />}
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${s.done ? "bg-emerald-500 text-white" : "border bg-muted text-muted-foreground"}`}>
                    {s.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-xs ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={onGetChallenge} disabled={busy || !!challenge} size="sm">
                {busy && status.includes("Fetching") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Get Challenge
              </Button>
              <Button onClick={onSolve} disabled={busy || !challenge || !!solve} variant="secondary" size="sm">
                {busy && status.includes("Parsing") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />}
                Solve with LLM
              </Button>
              <Button
                onClick={onVerify}
                disabled={busy || !solve || !!token}
                variant="secondary"
                size="sm"
                className={token ? "border-emerald-500/50 text-emerald-500" : ""}
              >
                {busy && status.includes("Verifying") ? <Loader2 className="h-4 w-4 animate-spin" /> : token ? <CheckCircle2 className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                Verify & Access
              </Button>
              {(challenge || token) && (
                <Button variant="ghost" size="sm" onClick={onReset}>
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              )}
            </div>

            {/* Status text */}
            {status && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {status}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Challenge details */}
        {challenge && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Terminal className="h-4 w-4" /> Active Challenge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Instructions</p>
                  <div className="rounded-md bg-muted p-3">
                    <ol className="list-decimal list-inside space-y-1 font-mono text-xs">
                      {(Array.isArray(challenge.instructions)
                        ? challenge.instructions
                        : typeof challenge.instructions === "string"
                          ? challenge.instructions.split(/\n+/).filter(Boolean)
                          : []
                      ).map((line: string, i: number) => (
                        <li key={i} className="text-muted-foreground">
                          <span className="text-foreground">{line}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">ID</p>
                    <code className="block truncate rounded bg-muted px-2 py-1 font-mono text-xs">{challenge.challenge_id}</code>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Nonce</p>
                    <code className="block truncate rounded bg-muted px-2 py-1 font-mono text-xs">{challenge.nonce}</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Solution details */}
        {solve && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Cpu className="h-4 w-4" /> Computed Solution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Answer (SHA-256)</p>
                  <code className="block break-all rounded bg-muted px-2 py-1 font-mono text-xs">{solve.answer}</code>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">HMAC Signature</p>
                  <code className="block break-all rounded bg-muted px-2 py-1 font-mono text-xs">{solve.hmac}</code>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
