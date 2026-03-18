"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Gauge, KeyRound, Home } from "lucide-react"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/projects", label: "Projects & API keys", icon: KeyRound },
  { href: "/", label: "Back to home", icon: Home },
]

export function AppSidebar() {
  const pathname = usePathname() || "/"

  return (
    <aside className="hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border/40 bg-background md:block">
      <div className="flex h-full flex-col">
        <div className="px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
        </div>
        <nav className="flex-1 space-y-1 px-2 pb-4">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Button
                key={item.href}
                asChild
                variant={active ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-2", active && "font-medium")}
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

