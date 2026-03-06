"use client"

import { decodeJwtClaims } from "@capagent/sdk"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { KeyRound, Copy, Check, AlertCircle } from "lucide-react"
import * as motion from "motion/react-client"

export default function TokensPage() {
  const [token, setToken] = useState("")
  const [copied, setCopied] = useState(false)

  const decoded = useMemo(() => {
    try {
      if (!token.trim()) return null
      return decodeJwtClaims(token.trim())
    } catch (e: any) {
      return { error: e?.message ?? String(e) }
    }
  }, [token])

  const hasError = decoded && "error" in decoded

  function loadFromCookie() {
    const val = document.cookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("capagent_proof="))
      ?.split("=")[1]
    if (val) setToken(val)
  }

  function copyOutput() {
    navigator.clipboard.writeText(JSON.stringify(decoded, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container max-w-2xl py-16 md:py-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="space-y-2">
          <Badge variant="secondary" className="gap-1.5">
            <KeyRound className="h-3 w-3" /> Developer Tool
          </Badge>
          <h1 className="font-serif text-3xl font-medium tracking-tight">JWT Debugger</h1>
          <p className="text-muted-foreground">
            Paste a Capgent proof JWT to inspect its decoded claims. No signature verification in browser.
          </p>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Token Input</CardTitle>
              <Button variant="ghost" size="sm" onClick={loadFromCookie}>
                Load from cookie
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows={5}
              className="w-full rounded-lg border bg-muted/30 p-3 font-mono text-xs outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-ring"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </CardContent>
        </Card>

        {decoded && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`mt-6 ${hasError ? "border-destructive/50" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hasError && <AlertCircle className="h-4 w-4 text-destructive" />}
                    <CardTitle className="text-base">{hasError ? "Parse Error" : "Decoded Claims"}</CardTitle>
                  </div>
                  {!hasError && (
                    <Button variant="ghost" size="sm" onClick={copyOutput}>
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-neutral-950 p-4">
                  <pre className="overflow-auto font-mono text-xs text-neutral-200">
                    {JSON.stringify(decoded, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
