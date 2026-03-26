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
  ]

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }))
}

