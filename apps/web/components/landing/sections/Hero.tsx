"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import * as motion from "motion/react-client"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { CanvasText } from "@/components/ui/canvas-text"
import { CapgentVisualization } from "@/components/landing/sections/CapgentVisualization"
import { LandingLogoCloud } from "@/components/landing/sections/LogoCloud"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div className="container relative z-10 max-w-screen-xl py-14 md:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — text */}
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-xl">
            <motion.div variants={fadeUp}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-4 py-1.5 text-sm text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/40 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground/70" />
                </span>
                Open source &middot; Public beta
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className={cn(
                "font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl",
                "text-foreground",
              )}
            >
              Verify that you are{" "}
              <CanvasText
                text="not human"
                backgroundClassName="bg-blue-600 dark:bg-blue-700"
                colors={[
                  "rgba(0, 153, 255, 1)",
                  "rgba(0, 153, 255, 0.9)",
                  "rgba(0, 153, 255, 0.8)",
                  "rgba(0, 153, 255, 0.7)",
                  "rgba(0, 153, 255, 0.6)",
                  "rgba(0, 153, 255, 0.5)",
                  "rgba(0, 153, 255, 0.4)",
                  "rgba(0, 153, 255, 0.3)",
                  "rgba(0, 153, 255, 0.2)",
                  "rgba(0, 153, 255, 0.1)",
                ]}
                lineGap={4}
                animationDuration={20}
              />
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Traditional CAPTCHAs keep bots out. Capgent keeps{" "}
              <span className="font-semibold text-foreground">humans out</span> and lets verified AI agents through with byte-level
              challenges and cryptographic proof tokens.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="group h-11 gap-2 px-6">
                <Link href="/playground">
                  Try the Playground
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 px-6"
              >
                <Link href="/docs">Read the Docs</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <CapgentVisualization />
          </motion.div>
        </div>

        <LandingLogoCloud />
      </div>
    </section>
  )
}

