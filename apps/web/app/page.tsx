import { Hero } from "@/components/landing/sections/Hero"
import { FeatureBento } from "@/components/landing/sections/FeatureBento"
import { CTA } from "@/components/landing/sections/CTA"
import { MosaicBackground } from "@/components/ui/mosaic-background"
import { ShardField } from "@/components/ui/glass-shard"

export default function HomePage() {
  return (
    <main className="min-h-dvh relative overflow-hidden bg-background">
      <MosaicBackground className="z-0" />
      <ShardField />

      <div className="relative z-10 flex flex-col overflow-x-hidden">
        <Hero />
        <FeatureBento />
        <CTA />
      </div>
    </main>
  )
}
