"use client"

import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Github, Linkedin, Moon, Sun, X } from "lucide-react"
import { useEffect, useState } from "react"

type FooterLink = { href: string; label: string; external?: boolean }
type FooterGroup = { title: string; links: FooterLink[] }

const GROUPS: FooterGroup[] = [
  {
    title: "Explore",
    links: [
      { href: "/playground", label: "Playground" },
      { href: "/benchmarks", label: "Benchmarks" },
      { href: "/guestbook", label: "Guestbook" },
      { href: "/protected", label: "Protected demo" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/projects", label: "Projects" },
      { href: "https://www.npmjs.com/package/@capagent/sdk", label: "SDK (npm)", external: true },
      { href: "https://github.com", label: "GitHub", external: true },
    ],
  },
  {
    title: "Documentation",
    links: [
      { href: "/docs", label: "Getting started" },
      { href: "/docs", label: "API reference" },
      { href: "/docs", label: "Integration guide" },
      { href: "/docs", label: "Changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#", label: "Careers" },
      { href: "#", label: "Wall of love" },
      { href: "#", label: "Security" },
      { href: "#", label: "Responsible disclosure" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Privacy policy" },
      { href: "#", label: "Terms of service" },
      { href: "#", label: "DSR/DSAR" },
    ],
  },
]

function FooterA({ href, label, external }: FooterLink) {
  const props = external ? { target: "_blank", rel: "noopener noreferrer" } : {}
  return (
    <Link
      href={href}
      {...props}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
    </Link>
  )
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md",
        "border border-border/50 bg-background/60 text-muted-foreground",
        "transition-colors hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </a>
  )
}

function ThemeGlyph() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const el = document.documentElement
    const sync = () => setIsDark(el.classList.contains("dark"))
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(el, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  return isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container max-w-screen-xl py-14 md:py-16">
        {/* Top bar */}
        <div className="flex flex-col gap-6 border-b border-border/40 pb-10 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Capgent logo" width={28} height={28} className="h-7 w-7 object-contain" />
            <span className="font-heading text-base font-bold tracking-tight">Capgent</span>
          </Link>

          <div className="flex items-center gap-2">
            <SocialIcon href="https://www.linkedin.com" label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </SocialIcon>
            <SocialIcon href="https://x.com" label="X">
              <X className="h-4 w-4" />
            </SocialIcon>
            <SocialIcon href="https://github.com" label="GitHub">
              <Github className="h-4 w-4" />
            </SocialIcon>
          </div>
        </div>

        {/* Link columns */}
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          {GROUPS.map((g) => (
            <div key={g.title} className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{g.title}</p>
              <div className="flex flex-col gap-2.5">
                {g.links.map((l) => (
                  <FooterA key={`${g.title}-${l.href}-${l.label}`} {...l} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 grid items-center gap-4 border-t border-border/40 pt-8 md:grid-cols-3">
          {/* Status */}
          <div className="flex justify-center md:justify-start">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs",
                "border border-border/50 bg-muted/30 text-muted-foreground",
              )}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              All systems normal
            </div>
          </div>

          {/* Copyright */}
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Capgent, Inc.
          </p>

          {/* Utilities */}
          <div className="flex justify-center gap-2 md:justify-end">
            <button
              type="button"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md",
                "border border-border/50 bg-background/60 text-muted-foreground",
                "transition-colors hover:bg-muted hover:text-foreground",
              )}
              aria-label="Theme indicator"
            >
              <ThemeGlyph />
            </button>
            <a
              href="#"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md",
                "border border-border/50 bg-background/60 text-muted-foreground",
                "transition-colors hover:bg-muted hover:text-foreground",
              )}
              aria-label="Status"
              title="Status"
            >
              <span className="text-[11px] font-semibold">↗</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

