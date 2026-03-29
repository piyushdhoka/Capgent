import { copyFileSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const webRoot = join(__dirname, "..")
/** Vendor bundle is not processed by PostCSS; served via `app/api/fumadocs-css/route.ts`. */
const dest = join(webRoot, "styles", "vendor", "fumadocs.css")
const candidates = [
  join(webRoot, "node_modules", "fumadocs-ui", "dist", "style.css"),
  join(webRoot, "..", "..", "node_modules", "fumadocs-ui", "dist", "style.css"),
]

const src = candidates.find((p) => existsSync(p))
if (!src) {
  console.warn("[copy-fumadocs-css] fumadocs-ui dist/style.css not found; skip")
  process.exit(0)
}
mkdirSync(dirname(dest), { recursive: true })
copyFileSync(src, dest)
console.log("[copy-fumadocs-css] copied to styles/vendor/fumadocs.css")
