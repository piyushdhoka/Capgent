import type { Metadata } from "next"
import type { ReactNode } from "react"
import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { RootProvider } from "fumadocs-ui/provider/next"
import { getDocsLayoutProps } from "@/lib/docs/docs-layout-options"
import { source } from "@/lib/source"

import "@/styles/docs/prose.css"
import "@/styles/docs/toc.css"

export const metadata: Metadata = {
  title: {
    template: "%s · Capgent Docs",
    default: "Documentation",
  },
  description: "Capgent agent verification — SDK, API, and integration guides.",
}

/**
 * Fumadocs ships a Tailwind v4-compiled `dist/style.css`. Importing it as a module
 * runs PostCSS + Tailwind v3, which errors on `@layer base` without `@tailwind base`.
 * We alias those imports to `styles/shims/fumadocs-style-shim.css` in `next.config.mjs` and
 * load the real bundle from `/api/fumadocs-css` (served from `styles/vendor/fumadocs.css`, copied on dev/build).
 */
export default function DocsLayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/api/fumadocs-css" precedence="medium" />
      <RootProvider
        search={{
          enabled: true,
        }}
      >
        <DocsLayout
          tree={source.getPageTree()}
          {...getDocsLayoutProps()}
          sidebar={{
            collapsible: true, // v16+
          }}
          // If navigation is in header, ensure it doesn't conflict
        >
          {children}
        </DocsLayout>
      </RootProvider>
    </>
  )
}
