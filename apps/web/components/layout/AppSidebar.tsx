"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ExternalLink, Bell, Key, Settings } from "lucide-react"

const MAIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: ChevronLeft, iconPosition: "left" },
  { href: "/projects", label: "API keys" },
  { href: "/projects-list", label: "Projects" },
  { href: "/usage", label: "Usage" },
  { href: "/rate-limit", label: "Rate Limit" },
  { href: "/spend", label: "Spend" },
  { href: "/logs", label: "Logs and Datasets" },
  { href: "https://changelog.capgent.com", label: "Changelog", icon: ExternalLink, iconPosition: "right", external: true },
]

const BOTTOM_NAV = [
  { href: "/get-api-key", label: "Get API key", icon: Key },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname() || "/"

  return (
    <aside className="hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border/40 bg-background md:block">
      <div className="flex h-full flex-col justify-between">
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-4">
            {MAIN_NAV.map((item) => {
              // For now, map the active state based on href
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
              const Icon = item.icon
              
              if (item.external) {
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant="ghost"
                    className="w-full justify-between gap-2 font-normal text-muted-foreground hover:text-foreground"
                  >
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      <span>{item.label}</span>
                      {Icon && <Icon className="h-4 w-4" />}
                    </a>
                  </Button>
                )
              }

              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    active ? "font-medium bg-muted/50 text-foreground" : "font-normal text-muted-foreground hover:bg-transparent hover:text-foreground",
                    !Icon && "pl-[1.15rem]" // Slight indent to align text if there is no left icon (compensating for padding and icon width of Dashboard)
                  )}
                >
                  <Link href={item.href}>
                    {Icon && item.iconPosition === "left" && <Icon className="h-4 w-4 shrink-0" />}
                    <span className="flex-1 text-left">{item.label}</span>
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>
        
        <div className="p-4 py-6">
          <nav className="space-y-1 px-2">
            {BOTTOM_NAV.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className="w-full justify-start gap-3 font-normal text-muted-foreground hover:text-foreground"
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>
  )
}

