import type { ReactNode } from "react"
import { AppShell } from "@/components/layout/AppShell"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div className="p-6 md:p-10">{children}</div>
    </AppShell>
  )
}

