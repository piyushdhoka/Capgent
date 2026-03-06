import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

export default function PricingPage() {
  return (
    <div className="container max-w-5xl py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="secondary" className="mb-4">Public Beta</Badge>
        <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Free during public beta. All features included while we scale.
        </p>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2">
        <Card className="relative overflow-hidden">
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
              {[
                "Unlimited challenges",
                "Unlimited verifications",
                "All agent frameworks",
                "Community support",
                "14-day log retention",
              ].map((f) => (
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

        <Card>
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
              {[
                "Dedicated infrastructure",
                "Custom rate limits",
                "99.99% Uptime SLA",
                "24/7 Priority support",
                "Custom log retention",
                "SSO & Audit logs",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="mailto:sales@capgent.com">Contact Sales</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
