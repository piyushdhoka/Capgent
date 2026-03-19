"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowSquareOut, CaretLeft, CaretRight, Folder, House, Key, List } from "@phosphor-icons/react"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const STORAGE_KEY = "capagent_dashboard_sidebar_collapsed"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: House },
  { href: "/projects-list", label: "Projects", icon: Folder },
  { href: "/projects", label: "API keys", icon: Key },
]

const EXTERNAL_ITEMS = [{ href: "https://changelog.capgent.com", label: "Changelog", icon: ArrowSquareOut }]

export function AppSidebar() {
  const pathname = usePathname() || "/"
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === "true") setCollapsed(true)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))

  return (
    <>
      {/* Mobile drawer trigger + content */}
      <div className="md:hidden w-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="fixed left-3 top-20 z-50 h-10 w-10 rounded-md border border-border/40 bg-background/80 text-muted-foreground backdrop-blur hover:text-foreground"
              aria-label="Open navigation"
            >
              <List className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/40">
                    <House className="h-4 w-4" weight="fill" />
                  </span>
                  <span className="text-sm font-semibold">Workspace</span>
                </div>
              </div>
              <Separator />
              <nav className="flex-1 overflow-y-auto px-2 py-3">
                <div className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <SheetClose asChild key={item.href}>
                        <Button
                          asChild
                          size="sm"
                          variant={active ? "secondary" : "ghost"}
                          className={cn(
                            "h-9 w-full rounded-md justify-start gap-2",
                            active
                              ? "font-medium text-foreground"
                              : "font-normal text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Link href={item.href} className="flex items-center gap-2">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </Button>
                      </SheetClose>
                    )
                  })}
                </div>
              </nav>
              <Separator />
              <div className="px-2 py-3">
                {EXTERNAL_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <SheetClose asChild key={item.href}>
                      <Button asChild size="sm" variant="ghost" className="h-9 w-full justify-start gap-2 rounded-md px-2">
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </a>
                      </Button>
                    </SheetClose>
                  )
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-[calc(100vh-4rem)] shrink-0 border-r border-border/40 bg-background md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          <div className={cn("flex items-center justify-between px-3 py-3", collapsed && "justify-center")}>
            <Link
              href="/dashboard"
              className={cn("flex items-center gap-2", collapsed && "w-full justify-center")}
              aria-label="Go to dashboard overview"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/40">
                <House className="h-4 w-4" weight="fill" />
              </span>
              {!collapsed && <span className="text-sm font-semibold">Workspace</span>}
            </Link>

            {!collapsed ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
              >
                <CaretLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
              >
                <CaretRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Separator />

          <nav className={cn("flex-1 overflow-y-auto px-2 py-3", collapsed && "px-1")}>
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Button
                    key={item.href}
                    asChild
                    size="sm"
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "h-9 w-full rounded-md",
                      collapsed ? "justify-center px-0" : "justify-start px-2",
                      active
                        ? "font-medium text-foreground"
                        : "font-normal text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </nav>

          <Separator />

          <div className={cn("px-2 py-3", collapsed && "px-1")}>
            {EXTERNAL_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  asChild
                  size="sm"
                  variant="ghost"
                  className={cn("h-9 w-full rounded-md justify-start", collapsed ? "justify-center px-0" : "px-2")}
                >
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </a>
                </Button>
              )
            })}
          </div>
        </div>
      </aside>
    </>
  )
}

