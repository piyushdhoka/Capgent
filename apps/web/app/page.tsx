import { Hero } from "@/components/landing/sections/Hero"
import { FeatureBento } from "@/components/landing/sections/FeatureBento"
import { CTA } from "@/components/landing/sections/CTA"

export default function HomePage() {
  return (
    <div className="flex flex-col overflow-x-hidden">
      <Hero />
      <FeatureBento />
      <CTA />
    </div>
  )
}
