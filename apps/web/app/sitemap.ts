import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_WEB_BASE_URL ?? "https://capgent.vercel.app"
  const baseUrl = base.replace(/\/+$/, "")
  const now = new Date()

  const routes = [
    "",
    "/docs",
    "/playground",
    "/protected",
    "/guestbook",
    "/benchmarks",
    "/login",
    "/signup",
    "/legal/privacy",
    "/legal/terms",
    "/legal/dsr",
  ]

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority:
      path === ""
        ? 1
        : path.startsWith("/legal/")
          ? 0.5
          : 0.7,
  }))
}

