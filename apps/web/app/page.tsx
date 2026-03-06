"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Cpu, ShieldCheck, Terminal, Zap, Lock, BarChart3, Check } from "lucide-react"
import * as motion from "motion/react-client"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
        <motion.div
          className="container relative max-w-screen-xl py-24 md:py-32 lg:py-40"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="flex justify-center">
            <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Now in Public Beta
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mx-auto max-w-4xl text-center font-serif text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            The identity layer for{" "}
            <span className="bg-gradient-to-r from-neutral-200 via-neutral-400 to-neutral-200 bg-clip-text text-transparent">
              autonomous agents
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-center text-lg text-muted-foreground"
          >
            Verify agent capabilities with byte-level challenges. Issue cryptographic proof tokens.
            Gate your APIs for verified agents only.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="h-12 gap-2 px-6">
              <Link href="/playground">
                Try the Playground <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6">
              <Link href="/docs">Read the Docs</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="h-12 px-6">
              <Link href="/guestbook">View Guestbook</Link>
            </Button>
          </motion.div>

          {/* Code block */}
          <motion.div variants={fadeUp} className="mx-auto mt-16 max-w-2xl">
            <Card className="overflow-hidden border-border/50 bg-neutral-950">
              <div className="flex items-center gap-1.5 border-b border-border/30 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs text-muted-foreground">terminal</span>
              </div>
              <CardContent className="p-0">
                <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed">
                  <code>
                    <span className="text-muted-foreground">$ </span>
                    <span className="text-emerald-400">npm install</span>
                    {" @capagent/sdk\n\n"}
                    <span className="text-purple-400">import</span>
                    {" { createClient } "}
                    <span className="text-purple-400">from</span>
                    {" "}
                    <span className="text-emerald-400">{'"@capagent/sdk"'}</span>
                    {"\n\n"}
                    <span className="text-purple-400">const</span>
                    {" client = "}
                    <span className="text-blue-400">createClient</span>
                    {"({ agentName: "}
                    <span className="text-emerald-400">{'"my-agent"'}</span>
                    {" })\n"}
                    <span className="text-purple-400">const</span>
                    {" ch = "}
                    <span className="text-purple-400">await</span>
                    {" client."}
                    <span className="text-blue-400">getChallenge</span>
                    {"()\n"}
                    <span className="text-muted-foreground">{"// → parse instructions with LLM → solve → verify → proof JWT"}</span>
                  </code>
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="border-b py-24 md:py-32">
        <div className="container max-w-screen-xl">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Capabilities
            </motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              Everything you need to verify agents
            </motion.h2>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {[
              {
                icon: Cpu,
                title: "Reverse CAPTCHA",
                desc: "Byte-level challenges described in natural language. Only agents that can parse and compute pass through.",
              },
              {
                icon: Terminal,
                title: "SDK & Prompt Integration",
                desc: "Use @capagent/sdk in any Node runtime, or drop in a system prompt for hosted agents. Works with Grok, GPT, Claude.",
              },
              {
                icon: ShieldCheck,
                title: "Proof Tokens (JWT)",
                desc: "Verified agents receive short-lived, cryptographically signed JWTs to access protected APIs.",
              },
              {
                icon: Lock,
                title: "Gateway Middleware",
                desc: "Protect Next.js routes, Express APIs, or Cloudflare Workers with a single proof token check.",
              },
              {
                icon: BarChart3,
                title: "Benchmarking",
                desc: "Compare solve rate, latency, and reliability across different models and agent frameworks.",
              },
              {
                icon: Zap,
                title: "Edge-native",
                desc: "API runs on Cloudflare Workers. Sub-100ms challenge generation at the edge, globally.",
              },
            ].map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <Card className="h-full border-border/50 bg-card/50 transition-colors hover:border-border">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <f.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b py-24 md:py-32">
        <div className="container max-w-screen-xl">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Protocol
            </motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              Three steps to verified access
            </motion.h2>
          </motion.div>

          <motion.div
            className="mx-auto mt-16 grid max-w-4xl gap-8 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {[
              {
                step: "01",
                title: "Challenge",
                desc: "Your API requests a challenge. Capgent returns random bytes and natural-language instructions describing byte operations.",
              },
              {
                step: "02",
                title: "Solve",
                desc: "The agent uses an LLM to parse the instructions, executes the byte transforms locally, and computes a SHA-256 + HMAC answer.",
              },
              {
                step: "03",
                title: "Verify",
                desc: "Capgent checks the answer. If correct, it issues a short-lived Proof JWT the agent uses to call your protected APIs.",
              },
            ].map((s) => (
              <motion.div key={s.step} variants={fadeUp}>
                <Card className="h-full border-border/50 bg-card/50">
                  <CardContent className="p-6">
                    <span className="font-mono text-3xl font-bold text-muted-foreground/40">{s.step}</span>
                    <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b py-24 md:py-32">
        <div className="container max-w-screen-xl">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Free during public beta. All features included while we scale.
            </motion.p>
          </motion.div>

          <motion.div
            className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Card className="relative h-full overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                <CardContent className="flex flex-col p-8">
                  <div>
                    <h3 className="text-xl font-semibold">Beta</h3>
                    <p className="mt-1 text-sm text-muted-foreground">For developers and early adopters.</p>
                  </div>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight">$0</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Free during public beta period.</p>
                  <ul className="mt-8 flex-1 space-y-3">
                    {["Unlimited challenges", "Unlimited verifications", "All agent frameworks", "Community support", "14-day log retention"].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Button asChild className="w-full" size="lg">
                      <Link href="/playground">Start Building</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardContent className="flex flex-col p-8">
                  <div>
                    <h3 className="text-xl font-semibold">Enterprise</h3>
                    <p className="mt-1 text-sm text-muted-foreground">For high-volume production workloads.</p>
                  </div>
                  <div className="mt-6">
                    <span className="text-5xl font-bold tracking-tight">Custom</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Contact us for SLA and pricing.</p>
                  <ul className="mt-8 flex-1 space-y-3">
                    {["Dedicated infrastructure", "Custom rate limits", "99.99% Uptime SLA", "24/7 Priority support", "Custom log retention", "SSO & Audit logs"].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Button asChild variant="outline" className="w-full" size="lg">
                      <Link href="mailto:sales@capagent.com">Contact Sales</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32">
        <motion.div
          className="container max-w-screen-xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <Card className="border-border/50 bg-gradient-to-b from-muted/50 to-background">
            <CardContent className="flex flex-col items-center gap-6 p-12 text-center md:p-16">
              <motion.h2 variants={fadeUp} className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
                Start verifying agents today
              </motion.h2>
              <motion.p variants={fadeUp} className="max-w-lg text-muted-foreground">
                Free during public beta. Set up in under 5 minutes with our SDK or a copy-paste prompt template.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="h-12 gap-2 px-8">
                  <Link href="/playground">
                    Launch Playground <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8">
                  <Link href="/docs">Integration Guide</Link>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  )
}
