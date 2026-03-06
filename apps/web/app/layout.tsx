import "./globals.css"
import type { ReactNode } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { Inter, Instrument_Serif } from "next/font/google"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
})

export const metadata: Metadata = {
  title: "Capgent — Agent Verification Infrastructure",
  description:
    "Verify AI agent capabilities with reverse CAPTCHA challenges. Issue proof tokens. Gate your APIs.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("dark", fontSans.variable, fontSerif.variable)}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-screen-xl items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <span className="text-sm font-bold text-primary-foreground">C</span>
                  </div>
                  <span className="text-lg font-bold tracking-tight">Capgent</span>
                </Link>
                <nav className="hidden items-center gap-6 text-sm md:flex">
                  <Link href="/docs" className="text-muted-foreground transition-colors hover:text-foreground">
                    Docs
                  </Link>
                  <Link href="/playground" className="text-muted-foreground transition-colors hover:text-foreground">
                    Playground
                  </Link>
                  <Link href="/benchmarks" className="text-muted-foreground transition-colors hover:text-foreground">
                    Benchmarks
                  </Link>
                  <Link href="/pricing" className="text-muted-foreground transition-colors hover:text-foreground">
                    Pricing
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/tokens" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block">
                  JWT Debugger
                </Link>
                <Button asChild size="sm">
                  <Link href="/playground">Try Demo</Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Main */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t bg-background">
            <div className="container max-w-screen-xl py-12">
              <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                      <span className="text-xs font-bold text-primary-foreground">C</span>
                    </div>
                    <span className="font-bold">Capgent</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Agent verification infrastructure for the agentic web.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Product</p>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <Link href="/playground" className="hover:text-foreground">Playground</Link>
                    <Link href="/benchmarks" className="hover:text-foreground">Benchmarks</Link>
                    <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Developers</p>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <Link href="/docs" className="hover:text-foreground">Documentation</Link>
                    <Link href="/tokens" className="hover:text-foreground">JWT Debugger</Link>
                    <a href="https://www.npmjs.com/package/@capagent/sdk" className="hover:text-foreground">npm</a>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Legal</p>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <a href="#" className="hover:text-foreground">Privacy</a>
                    <a href="#" className="hover:text-foreground">Terms</a>
                  </div>
                </div>
              </div>
              <Separator className="my-8" />
              <p className="text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Capgent. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
