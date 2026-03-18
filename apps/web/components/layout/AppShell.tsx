"use client"

import * as React from "react"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { cn } from "@/lib/utils"

export function AppShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl">
      <AppSidebar />
      <div className={cn("min-w-0 flex-1", className)}>{children}</div>
    </div>
  )
}

