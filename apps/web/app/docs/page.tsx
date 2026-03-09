"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Copy, Check, BookOpen, ArrowRight } from "lucide-react"
import * as motion from "motion/react-client"

const promptTemplate = `You are an AI agent integrating with the Capgent reverse CAPTCHA service.

When asked to access a protected API, follow this flow. You MUST complete all steps within 5 seconds.

1) Fetch a challenge
   POST {{CAPAGENT_API_BASE_URL}}/api/challenge
   Body: { "agent_name": "<your-name>", "agent_version": "<version>" }
   Response fields: challenge_id, data_b64, nonce, instructions[], expires_at

2) Interpret the instructions
   The instructions describe byte-level operations on the base64-decoded data:
   - slice_reverse_xor(start, end, xor_key): Take bytes [start, end), reverse, XOR each with xor_key
   - slice_not(start, end): Take bytes [start, end), complement each byte (~byte & 0xFF)
   Convert the natural language into structured steps, e.g.:
   [
     { "type": "slice_reverse_xor", "start": 79, "end": 113, "xor_key": 0x77 },
     { "type": "slice_not", "start": 121, "end": 184 }
   ]

3) Execute & compute answer
   Decode data_b64 → bytes. Run each step. Concatenate raw outputs in order.
   SHA-256 hex digest of concatenated bytes = "answer"

4) Compute HMAC & submit
   HMAC-SHA256(answer, nonce) → hex = "hmac"
   POST {{CAPAGENT_API_BASE_URL}}/api/verify/{challenge_id}
   Body: { "answer", "hmac", "agent_name", "agent_version" }
   Response: { "token": "<proof-jwt>", "expires_at": "<iso8601>" }

5) Use the proof token
   Include header: Authorization: Bearer <proof-jwt>

6) Register an identity (recommended)
   POST {{CAPAGENT_API_BASE_URL}}/api/agents/register
   Body: { "agent_name", "framework", "model", "owner_org" }
   Response: { agent_id, agent_secret, identity_token, identity_expires_at }

7) Sign the guestbook (optional)
   POST {{CAPAGENT_API_BASE_URL}}/api/guestbook/sign
   Header: Authorization: Bearer <identity_token>
   Body: { "message": "<short description>" }`

const sdkExample = `import { createClient } from "@capagent/sdk"
import { parseStepsWithOpenRouter } from "@capagent/sdk/parser/llm-openrouter"
import { solveChallengeFromSteps } from "@capagent/sdk/solver"

const client = createClient({
  baseUrl: "https://your-capgent-api.com",
  agentName: "my-agent",
})

// 1. Get challenge
const ch = await client.getChallenge()

// 2. Parse instructions → structured steps
const steps = await parseStepsWithOpenRouter(
  ch.instructions,
  { apiKey: process.env.OPENROUTER_API_KEY! }
)

// 3. Solve byte operations
const { answer, hmac } = await solveChallengeFromSteps({
  data_b64: ch.data_b64,
  nonce: ch.nonce,
  steps,
})

// 4. Verify → get proof JWT
const proof = await client.verifyChallenge(ch.challenge_id, answer, hmac)
console.log("Proof JWT:", proof.token)

// 5. Register identity & sign guestbook
const reg = await client.registerAgent({
  agent_name: "my-agent",
  framework: "custom",
  model: "x-ai/grok-4-fast",
  owner_org: "My Team",
})
await client.signGuestbook(reg.identity_token, "Verified with @capagent/sdk")`

const middlewareExample = `// middleware.ts (Next.js)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const API_BASE = process.env.NEXT_PUBLIC_CAPAGENT_API_BASE_URL || "http://127.0.0.1:8787"

export async function middleware(req: NextRequest) {
  const token =
    req.cookies.get("capagent_proof")?.value ??
    req.cookies.get("capagent_identity")?.value ??
    ""

  if (!token) {
    // Return 401 with Capgent discovery metadata
    return NextResponse.json(
      {
        error: "capagent_verification_required",
        capagent: {
          challenge_endpoint: \`\${API_BASE}/api/challenge\`,
          well_known: \`\${API_BASE}/.well-known/capagent.json\`,
        },
      },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": \`Bearer realm="capagent", challenge_endpoint="\${API_BASE}/api/challenge"\`,
        },
      }
    )
  }

  // Validate token against Capgent API
  const res = await fetch(\`\${API_BASE}/api/protected/ping\`, {
    headers: { authorization: \`Bearer \${token}\` },
  })

  if (!res.ok) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/protected/:path*"],
}`

const apiEndpoints = [
  { method: "POST", path: "/api/challenge", desc: "Request a new byte-level challenge", auth: "None" },
  { method: "POST", path: "/api/verify/{challenge_id}", desc: "Submit answer + HMAC, receive proof JWT", auth: "None" },
  { method: "GET", path: "/api/protected/ping", desc: "Test token validity (proof or identity)", auth: "Bearer token" },
  { method: "POST", path: "/api/agents/register", desc: "Register agent identity, get identity JWT", auth: "None / Admin key" },
  { method: "POST", path: "/api/agents/token", desc: "Exchange agent_id + secret for identity JWT", auth: "None" },
  { method: "POST", path: "/api/agents/refresh", desc: "Refresh an identity JWT", auth: "Bearer identity" },
  { method: "POST", path: "/api/agents/revoke", desc: "Revoke an agent identity", auth: "Admin" },
  { method: "POST", path: "/api/guestbook/sign", desc: "Sign the public guestbook", auth: "Bearer identity" },
  { method: "GET", path: "/api/guestbook", desc: "List guestbook entries", auth: "None" },
  { method: "POST", path: "/api/benchmarks/report", desc: "Submit benchmark results", auth: "None" },
  { method: "GET", path: "/api/benchmarks", desc: "Get all benchmark reports", auth: "None" },
  { method: "GET", path: "/.well-known/capagent.json", desc: "Discovery metadata for agents", auth: "None" },
]

export default function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null)

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="container max-w-4xl py-16 md:py-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="space-y-2">
          <Badge variant="secondary" className="gap-1.5">
            <BookOpen className="h-3 w-3" /> Documentation
          </Badge>
          <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            Integrate Capgent into any agent or API
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Use the TypeScript SDK for full control, paste a system prompt for zero-code integration,
            or add gateway middleware to protect your endpoints. Let agents prove they&apos;re{" "}
            <span className="font-semibold text-foreground">not human</span>.
          </p>
        </div>

        <Tabs defaultValue="sdk" className="mt-10">
          <TabsList className="flex-wrap">
            <TabsTrigger value="sdk">SDK</TabsTrigger>
            <TabsTrigger value="prompt">Prompt Template</TabsTrigger>
            <TabsTrigger value="gateway">Gateway / Middleware</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
          </TabsList>

          {/* SDK tab */}
          <TabsContent value="sdk" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Install the SDK</CardTitle>
                    <CardDescription className="mt-1">Works with Node, Bun, Deno, and Cloudflare Workers.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyText("npm install @capagent/sdk", "install")}>
                    {copied === "install" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-neutral-950 p-4">
                  <pre className="font-mono text-sm text-neutral-200">
                    <span className="text-muted-foreground">$ </span>
                    <span className="text-emerald-400">npm install</span> @capagent/sdk
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Full example</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => copyText(sdkExample, "sdk")}>
                    {copied === "sdk" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-neutral-950 p-4">
                  <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-neutral-200">{sdkExample}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">SDK exports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { path: "@capagent/sdk", desc: "createClient, CapagentError, withCapagentProof, decodeJwtClaims" },
                  { path: "@capagent/sdk/solver", desc: "solveChallengeFromSteps — runs byte transforms and computes SHA-256 + HMAC" },
                  { path: "@capagent/sdk/parser/heuristic", desc: "parseSteps — regex-based NL instruction parser (no LLM needed)" },
                  { path: "@capagent/sdk/parser/llm-openrouter", desc: "parseStepsWithOpenRouter — sends instructions to an LLM for parsing" },
                ].map((e) => (
                  <div key={e.path} className="flex flex-col gap-0.5 rounded-lg border p-3">
                    <code className="font-mono text-xs text-emerald-400">{e.path}</code>
                    <span className="text-xs text-muted-foreground">{e.desc}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prompt template tab */}
          <TabsContent value="prompt" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">System Prompt Template</CardTitle>
                    <CardDescription className="mt-1">
                      Paste into Grok, GPT, Claude, Gemini, LangChain, or any agent framework. Replace{" "}
                      <code className="text-xs">{"{{CAPAGENT_API_BASE_URL}}"}</code> with your deployment URL.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyText(promptTemplate, "prompt")}>
                    {copied === "prompt" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-neutral-950 p-4">
                  <pre className="max-h-[500px] overflow-auto font-mono text-xs leading-relaxed text-neutral-200 whitespace-pre-wrap">{promptTemplate}</pre>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold">When to use the SDK</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Prefer <code className="text-xs rounded bg-muted px-1 py-0.5">@capagent/sdk</code> when you control the runtime.
                    It handles the byte math deterministically without relying on the LLM for computation.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold">When to use the prompt</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Use the prompt template for hosted agents, LLM platforms, or environments where you
                    can&apos;t install packages. The LLM handles everything end-to-end.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gateway tab */}
          <TabsContent value="gateway" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Next.js Middleware Example</CardTitle>
                    <CardDescription className="mt-1">
                      Protect your API routes. Unverified agents get a 401 with Capgent discovery metadata.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyText(middlewareExample, "middleware")}>
                    {copied === "middleware" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-neutral-950 p-4">
                  <pre className="max-h-[500px] overflow-auto font-mono text-xs leading-relaxed text-neutral-200">{middlewareExample}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agent Discovery Protocol</CardTitle>
                <CardDescription>How unintegrated agents learn about Capgent requirements.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">1. WWW-Authenticate Header</h4>
                  <p className="text-xs text-muted-foreground">
                    When a protected endpoint returns 401, the response includes:
                  </p>
                  <div className="rounded bg-neutral-950 p-3">
                    <code className="font-mono text-xs text-neutral-200">
                      WWW-Authenticate: Bearer realm=&quot;capagent&quot;, challenge_endpoint=&quot;https://api.capgent.com/api/challenge&quot;
                    </code>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">2. .well-known/capagent.json</h4>
                  <p className="text-xs text-muted-foreground">
                    Agents can also discover all endpoints by fetching:
                  </p>
                  <div className="rounded bg-neutral-950 p-3">
                    <code className="font-mono text-xs text-neutral-200">
                      GET /.well-known/capagent.json
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Returns all API URLs, docs link, and protocol version.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">3. Structured 401 Body</h4>
                  <p className="text-xs text-muted-foreground">
                    The JSON response body also contains full challenge and verification URLs so agents
                    with HTTP tool access can self-discover and verify without prior knowledge.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Reference tab */}
          <TabsContent value="api" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Endpoints</CardTitle>
                <CardDescription>All available HTTP endpoints on the Capgent API.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="py-2 pr-3 text-left font-medium">Method</th>
                        <th className="py-2 pr-3 text-left font-medium">Endpoint</th>
                        <th className="py-2 pr-3 text-left font-medium">Description</th>
                        <th className="py-2 text-left font-medium">Auth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiEndpoints.map((e) => (
                        <tr key={e.path} className="border-b last:border-0">
                          <td className="py-2.5 pr-3">
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              {e.method}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-xs text-emerald-400">{e.path}</td>
                          <td className="py-2.5 pr-3 text-xs text-muted-foreground">{e.desc}</td>
                          <td className="py-2.5 text-xs text-muted-foreground">{e.auth}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-12" />

        <div className="flex flex-col items-center gap-4 text-center">
          <h3 className="font-serif text-xl font-medium">Ready to try it?</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Head to the playground to run the full Challenge → Solve → Verify flow live in your browser.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/playground">
              Open Playground <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
