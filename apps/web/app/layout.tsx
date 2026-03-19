import "./globals.css"
import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { Suspense } from "react"
import { Inter, Instrument_Sans } from "next/font/google"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

import { getSession } from "@/lib/auth"
import { getUserProjects } from "@/lib/projects"
import { ProjectSwitcher } from "@/components/ProjectSwitcher"
import { UserNav } from "@/components/UserNav"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { FooterGate } from "@/components/layout/FooterGate"

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
                    <span className="relative block h-8 w-8">
                      <Image
                        src="/logo_white.png"
                        alt="Capgent logo"
                        width={40}
                        height={40}
                        className="absolute inset-0 hidden dark:block h-10 w-10 object-contain"
                        priority
                      />
                      <Image
                        src="/logo_dark.png"
                        alt="Capgent logo"
                        width={40}
                        height={40}
                        className="absolute inset-0 block dark:hidden h-10 w-10 object-contain"
                        priority
                      />
                    </span>
                    <span className="font-heading text-lg font-bold tracking-tight">Capgent</span>
                  </Link>

                  {user && (
                    <Suspense fallback={null}>
                      <ProjectSwitcher projects={projects} />
                    </Suspense>
                  )}

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

            <FooterGate />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
