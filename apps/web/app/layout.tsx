import "./globals.css"
import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { Inter, Instrument_Sans } from "next/font/google"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

import { getSession } from "@/lib/auth"
import { getUserProjects } from "@/lib/projects"
import { ProjectSwitcher } from "@/components/ProjectSwitcher"
import { UserNav } from "@/components/UserNav"
import { ThemeProvider } from "@/components/providers/ThemeProvider"

const fontHeading = Inter({
  subsets: ["latin"],
  variable: "--font-heading",
})

const fontSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Capgent — Agent Verification Infrastructure",
  description:
    "Verify AI agent capabilities with reverse CAPTCHA challenges. Issue proof tokens. Gate your APIs.",
  icons: {
    icon: "/favicon.ico",
  },
}

const NAV_LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/playground", label: "Playground" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/guestbook", label: "Guestbook" },
]

const FOOTER_PRODUCT = [
  { href: "/playground", label: "Playground" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/guestbook", label: "Guestbook" },
]

const FOOTER_DEV = [
  { href: "/docs", label: "Documentation" },
  { href: "https://www.npmjs.com/package/@capagent/sdk", label: "npm", external: true },
  { href: "https://github.com", label: "GitHub", external: true },
]

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSession()
  const projects = user ? await getUserProjects(user.email) : []

  return (
    <html lang="en" className={cn(fontHeading.variable, fontSans.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col">
            {/* ─── NAVBAR ─── */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
              <div className="container flex h-16 max-w-screen-xl items-center justify-between">
                {/* Left: logo + nav */}
                <div className="flex items-center gap-6">
                  <Link href="/" className="flex items-center gap-2.5">
                    <Image
                      src="/logo.png"
                      alt="Capgent logo"
                      width={36}
                      height={36}
                      className="h-9 w-9 object-contain"
                      priority
                    />
                    <span className="font-heading text-lg font-bold tracking-tight">Capgent</span>
                  </Link>

                  {user && <ProjectSwitcher projects={projects} />}

                  <nav className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Right: auth */}
                <div className="flex items-center gap-3">
                  <AnimatedThemeToggler className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/50 bg-background hover:bg-muted text-foreground" />
                  {user ? (
                    <UserNav user={user} />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href="/login">Sign in</Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href="/playground">Try demo</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* ─── MAIN ─── */}
            <main className="flex-1">{children}</main>

            {/* ─── FOOTER ─── */}
            <footer className="border-t border-border/40 bg-background">
              <div className="container max-w-screen-xl py-16">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Brand */}
                  <div className="space-y-4 lg:col-span-2">
                    <div className="flex items-center gap-2.5">
                      <Image src="/logo.png" alt="Capgent logo" width={28} height={28} className="h-7 w-7 object-contain" />
                      <span className="font-heading text-base font-bold tracking-tight">Capgent</span>
                    </div>
                    <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                      Agent verification infrastructure for the agentic web. Prove you&apos;re not human.
                    </p>
                  </div>

                  {/* Product */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Product</p>
                    <div className="flex flex-col gap-2.5">
                      {FOOTER_PRODUCT.map((link) => (
                        <Link key={link.href} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Developers */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Developers</p>
                    <div className="flex flex-col gap-2.5">
                      {FOOTER_DEV.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
                  <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Capgent. All rights reserved.</p>
                  <div className="flex gap-6">
                    <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Privacy</a>
                    <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Terms</a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
